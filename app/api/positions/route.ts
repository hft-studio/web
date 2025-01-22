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
            const balance = await wallet.getBalance(pool.address)
            console.log("Balance:", balance)
            
            // Get total supply using readContract
            const totalSupply = await readContract({
                networkId: NETWORK_ID,
                contractAddress: pool.address as `0x${string}`,
                method: "totalSupply",
                args: {}
            });
            console.log("Total supply value:", totalSupply.toString());

            // Calculate share and token amounts
            const share = Number(balance) / Number(totalSupply);
            console.log("Share of pool:", share);

            const token0Amount = share * Number(pool.reserve0);
            const token1Amount = share * Number(pool.reserve1);
            console.log("Token amounts:", {
                [pool.token0.symbol]: token0Amount,
                [pool.token1.symbol]: token1Amount
            });

            // Calculate USD value
            const token0Value = token0Amount * pool.token0.price;
            const token1Value = token1Amount * pool.token1.price;
            const totalValue = token0Value + token1Value;
            console.log("Position value:", {
                token0Value,
                token1Value,
                totalValue
            });

            positions.push({
                pool: pool.symbol,
                share,
                token0Amount,
                token1Amount,
                token0Value,
                token1Value,
                totalValue
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