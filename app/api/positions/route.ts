import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Wallet, readContract, NETWORK_ID } from "@/lib/coinbase"
import { decryptSeed } from "@/lib/encryption"

// Helper function to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper function to retry an async operation
async function retry<T>(
    operation: () => Promise<T>,
    retries = 3,
    delayMs = 1000
): Promise<T> {
    try {
        return await operation()
    } catch (error) {
        if (retries === 0) throw error
        console.log(`Retrying operation after ${delayMs}ms...`)
        await delay(delayMs)
        return retry(operation, retries - 1, delayMs * 2)
    }
}

interface Pool {
    address: string
    symbol: string
    token0: {
        address: string
        symbol: string
        decimals: number
        price: number
    }
    token1: {
        address: string
        symbol: string
        decimals: number
        price: number
    }
    reserve0: string
    reserve1: string
    is_stable: boolean
}

export async function GET(request: Request) {
    try {
        console.log("Starting positions fetch...")
        
        // Get user from session
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (!user || userError) {
            console.log("Auth error:", userError)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.log("User authenticated:", user.id)

        // Get user's wallet
        const { data: walletData, error: walletError } = await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", user.id)
            .single()

        if (!walletData || walletError) {
            console.log("Wallet error:", walletError)
            return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
        }
        console.log("Found wallet:", walletData.wallet_id)

        // Initialize wallet with retries
        console.log("Initializing wallet...")
        const wallet = await retry(async () => {
            const w = await Wallet.fetch(walletData.wallet_id)
            const seed = await decryptSeed(walletData.encrypted_seed)
            w.setSeed(seed)
            return w
        })
        console.log("Wallet initialized")

        const defaultAddress = await wallet.getDefaultAddress()
        console.log("Default address:", defaultAddress.getId())
        console.log('export', defaultAddress.export())

        // Fetch all pools from the API
        console.log("Fetching pools...")
        const poolsResponse = await fetch(`${process.env.NEXT_PUBLIC_SUGAR_URL}/api/pools`)
        if (!poolsResponse.ok) {
            console.log("Pools fetch error:", poolsResponse.statusText)
            throw new Error(`Failed to fetch pools: ${poolsResponse.statusText}`)
        }
        const pools = (await poolsResponse.json()) as Pool[]
        console.log("Found pools:", pools.length)

        // Check LP token balance for each pool
        const positions: any[] = []
        
        // Only check the USDC/cbBTC pool for now
        const pool = pools.find((p: Pool) => p.symbol === "vAMM-USDC/cbBTC")
        if (pool) {
            console.log("Found USDC/cbBTC pool:", pool.address)

            // Fetch prices
            const pricesResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/prices`);
            if (!pricesResponse.ok) {
                console.log("Prices fetch error:", pricesResponse.statusText);
                throw new Error(`Failed to fetch prices: ${pricesResponse.statusText}`);
            }
            const prices = await pricesResponse.json();
            console.log("Fetched prices:", prices);

            // Update pool with prices from API
            pool.token0.price = prices[pool.token0.symbol.toLowerCase()]?.price || 0;
            pool.token1.price = prices[pool.token1.symbol.toLowerCase()]?.price || 0;

            console.log("Pool data with prices:", {
                token0: {
                    symbol: pool.token0.symbol,
                    price: pool.token0.price,
                    decimals: pool.token0.decimals
                },
                token1: {
                    symbol: pool.token1.symbol,
                    price: pool.token1.price,
                    decimals: pool.token1.decimals
                },
                reserves: {
                    reserve0: pool.reserve0,
                    reserve1: pool.reserve1
                }
            });

            // Get pool balance
            const poolBalance = await wallet.getBalance(pool.address)
            console.log("Pool Balance:", poolBalance)

            // Get gauge balance
            let gaugeBalance = "0"
            try {
                // First get the gauge address from the Voter contract
                const voterAddress = "0x16613524e02ad97eDfeF371bC883F2F5d6C480A5"; // Voter contract on Base
                const poolGauge = await readContract({
                    networkId: NETWORK_ID,
                    contractAddress: voterAddress as `0x${string}`,
                    method: "gauges",
                    args: { pool: pool.address },
                    abi: [{
                        inputs: [{ name: "pool", type: "address" }],
                        name: "gauges",
                        outputs: [{ name: "", type: "address" }],
                        stateMutability: "view",
                        type: "function"
                    }]
                }) as string;
                
                console.log("Pool gauge address:", poolGauge);

                if (poolGauge && poolGauge !== "0x0000000000000000000000000000000000000000") {
                    // Now get the gauge balance using the correct gauge address
                    gaugeBalance = (await readContract({
                        networkId: NETWORK_ID,
                        contractAddress: poolGauge as `0x${string}`,
                        method: "balanceOf",
                        args: { account: defaultAddress.getId() },
                        abi: [{
                            inputs: [{ name: "account", type: "address" }],
                            name: "balanceOf",
                            outputs: [{ name: "", type: "uint256" }],
                            stateMutability: "view",
                            type: "function"
                        }]
                    }) as bigint).toString();
                    console.log("Gauge Balance:", gaugeBalance);
                } else {
                    console.log("No gauge found for pool");
                }
            } catch (error) {
                console.log("Error getting gauge balance:", error);
                // Continue with pool balance only
            }

            // Total balance is pool + gauge
            const totalBalance = (Number(poolBalance) + Number(gaugeBalance)).toString()
            console.log("Total Balance:", totalBalance)
            
            // Get total supply using readContract
            const totalSupply = await readContract({
                networkId: NETWORK_ID,
                contractAddress: pool.address as `0x${string}`,
                method: "totalSupply",
                args: {}
            });
            console.log("Total supply:", totalSupply.toString())

            // Calculate share and token amounts
            const share = Number(totalBalance) / Number(totalSupply);
            console.log("Share calculation:", {
                balance: Number(totalBalance),
                totalSupply: Number(totalSupply),
                share: share
            });

            // Convert decimal reserves to integers by multiplying by their respective decimals
            const reserve0Integer = Math.floor(Number(pool.reserve0) * Math.pow(10, pool.token0.decimals));
            const reserve1Integer = Math.floor(Number(pool.reserve1) * Math.pow(10, pool.token1.decimals));
            
            console.log("Reserve calculations:", {
                reserve0: pool.reserve0,
                reserve1: pool.reserve1,
                reserve0Integer,
                reserve1Integer,
                token0_decimals: pool.token0.decimals,
                token1_decimals: pool.token1.decimals
            });

            // Convert balance from scientific notation to a regular integer string with proper scaling
            const balanceScaled = (Number(totalBalance) * 1e30).toFixed(0);  // Scale up significantly to maintain precision
            console.log("Balance converted:", {
                original: totalBalance,
                asNumber: Number(totalBalance),
                asScaled: balanceScaled
            });

            // Calculate token amounts using BigInt to maintain precision
            const scaleFactor = BigInt(1e12); // Additional scaling factor for precision
            const token0Amount = (BigInt(reserve0Integer) * BigInt(balanceScaled) / BigInt(totalSupply) / scaleFactor).toString();
            const token1Amount = (BigInt(reserve1Integer) * BigInt(balanceScaled) / BigInt(totalSupply) / scaleFactor).toString();
            
            console.log("Token amount calculations:", {
                token0Amount,
                token1Amount,
                token0_symbol: pool.token0.symbol,
                token1_symbol: pool.token1.symbol
            });

            // Calculate USD value
            const token0Decimal = Number(token0Amount) / Math.pow(10, pool.token0.decimals);
            const token1Decimal = Number(token1Amount) / Math.pow(10, pool.token1.decimals);
            
            console.log("Token decimals:", {
                token0: token0Decimal,
                token1: token1Decimal
            });

            const token0Value = token0Decimal * (pool.token0.price || 0);
            const token1Value = token1Decimal * (pool.token1.price || 0);
            const value_usd = token0Value + token1Value;

            console.log("Value calculations:", {
                token0Value,
                token1Value,
                value_usd,
                token0_price: pool.token0.price,
                token1_price: pool.token1.price
            });

            positions.push({
                pool: {
                    address: pool.address,
                    symbol: pool.symbol,
                    token0: {
                        symbol: pool.token0.symbol,
                        decimals: pool.token0.decimals
                    },
                    token1: {
                        symbol: pool.token1.symbol,
                        decimals: pool.token1.decimals
                    },
                    is_stable: pool.is_stable
                },
                share: share * 100, // Convert to percentage
                token0Amount,
                token1Amount,
                token0Value: token0Value || 0,
                token1Value: token1Value || 0,
                value_usd: value_usd || 0,
                // Add staked vs unstaked info
                unstaked: {
                    balance: poolBalance,
                    share: Number(poolBalance) / Number(totalSupply) * 100,
                    token0Amount: (BigInt(reserve0Integer) * BigInt((Number(poolBalance) * 1e30).toFixed(0)) / BigInt(totalSupply) / scaleFactor).toString(),
                    token1Amount: (BigInt(reserve1Integer) * BigInt((Number(poolBalance) * 1e30).toFixed(0)) / BigInt(totalSupply) / scaleFactor).toString(),
                },
                staked: {
                    balance: gaugeBalance,
                    share: Number(gaugeBalance) / Number(totalSupply) * 100,
                    token0Amount: (BigInt(reserve0Integer) * BigInt((Number(gaugeBalance) * 1e30).toFixed(0)) / BigInt(totalSupply) / scaleFactor).toString(),
                    token1Amount: (BigInt(reserve1Integer) * BigInt((Number(gaugeBalance) * 1e30).toFixed(0)) / BigInt(totalSupply) / scaleFactor).toString(),
                }
            });
        }

        return NextResponse.json({ positions })
    } catch (error) {
    
        console.error("Error fetching positions:", error)
        return NextResponse.json(
            { 
                error: error instanceof Error ? error.message : "Unknown error",
                details: error instanceof Error ? error.stack : undefined
            },
            { status: error instanceof Error && error.message.includes("503") ? 503 : 500 }
        )
    }
}