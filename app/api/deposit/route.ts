import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { NETWORK_ID, readContract, Wallet } from "@/lib/coinbase"
import { decryptSeed } from "@/lib/encryption"
import { AERODROME_ROUTER_CONTRACT_ADDRESS, AERODROME_VOTER_CONTRACT_ADDRESS } from "@/config/contracts"

/**
 * Handles liquidity deposit requests for Aerodrome pools.
 * The process involves:
 * 1. Approving both tokens
 * 2. Adding liquidity to the pool
 * 3. Staking LP tokens in the gauge
 */

export async function POST(request: Request) {
    try {
        const { poolAddress, amount } = await request.json()

        if (!poolAddress || !amount) {
            return NextResponse.json(
                { error: "Pool address and amount are required" },
                { status: 400 }
            )
        }

        // Fetch pool data and validate
        const poolResponse = await fetch(`${process.env.NEXT_PUBLIC_SUGAR_URL}/api/pools/${poolAddress}`)
        const poolData = await poolResponse.json()

        if (!poolData) {
            return NextResponse.json({ error: "Pool not found" }, { status: 404 })
        }

        // Authenticate user and get wallet
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (!user || userError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: walletData, error: walletError } = await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", user.id)
            .single()

        if (!walletData || walletError) {
            return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
        }

        // Initialize wallet with user's seed
        const wallet = await Wallet.fetch(walletData.wallet_id)
        const seed = await decryptSeed(walletData.encrypted_seed)
        wallet.setSeed(seed)
        const defaultAddress = await wallet.getDefaultAddress()

        // Calculate optimal token amounts based on pool reserves
        const amountInt = amount // Amount in USDC decimals (6)
        const reserve0Int = Math.floor(parseFloat(poolData.reserve0) * 10 ** poolData.token0.decimals).toString()
        const reserve1Int = Math.floor(parseFloat(poolData.reserve1) * 10 ** poolData.token1.decimals).toString()
        const amountBDesired = ((BigInt(amountInt) * BigInt(reserve1Int)) / BigInt(reserve0Int)).toString()

        // Approve token0 (USDC)
        try {
            const approveToken0 = await wallet.invokeContract({
                contractAddress: poolData.token0.address,
                method: "approve",
                args: {
                    spender: AERODROME_ROUTER_CONTRACT_ADDRESS,
                    amount: amountInt
                },
                abi: [
                    {
                        "inputs": [
                            { "name": "spender", "type": "address" },
                            { "name": "amount", "type": "uint256" }
                        ],
                        "name": "approve",
                        "outputs": [{ "name": "", "type": "bool" }],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    }
                ]
            })
            await approveToken0.wait()
        } catch (error) {
            console.log("Error approving token0:", error)
            throw new Error("Failed to approve token0")
        }

        // Approve token1 (BTC)
        try {
            const approveToken1 = await wallet.invokeContract({
                contractAddress: poolData.token1.address,
                method: "approve",
                args: {
                    spender: AERODROME_ROUTER_CONTRACT_ADDRESS,
                    amount: amountBDesired
                },
                abi: [
                    {
                        "inputs": [
                            { "name": "spender", type: "address" },
                            { "name": "amount", "type": "uint256" }
                        ],
                        "name": "approve",
                        "outputs": [{ "name": "", "type": "bool" }],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    }
                ]
            })
            await approveToken1.wait()
        } catch (error) {
            console.log("Error approving token1:", error)
            throw new Error("Failed to approve token1")
        }

        // Add liquidity to pool
        try {
            const addLiquidity = await wallet.invokeContract({
                contractAddress: AERODROME_ROUTER_CONTRACT_ADDRESS,
                method: "addLiquidity",
                args: {
                    tokenA: poolData.token0.address,
                    tokenB: poolData.token1.address,
                    stable: poolData.is_stable,
                    amountADesired: amountInt,
                    amountBDesired: amountBDesired,
                    amountBMin: "0",
                    to: defaultAddress.getId(),
                    deadline: (Math.floor(Date.now() / 1000) + 3600).toString()
                },
                abi: [
                    {
                        "inputs": [
                            { "name": "tokenA", "type": "address" },
                            { "name": "tokenB", "type": "address" },
                            { "name": "stable", "type": "bool" },
                            { "name": "amountADesired", "type": "uint256" },
                            { "name": "amountBDesired", "type": "uint256" },
                            { "name": "amountAMin", "type": "uint256" },
                            { "name": "amountBMin", "type": "uint256" },
                            { "name": "to", "type": "address" },
                            { "name": "deadline", "type": "uint256" }
                        ],
                        "name": "addLiquidity",
                        "outputs": [
                            { "name": "amountA", "type": "uint256" },
                            { "name": "amountB", "type": "uint256" },
                            { "name": "liquidity", "type": "uint256" }
                        ],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    }
                ]
            })
            await addLiquidity.wait()

            // Get gauge for staking LP tokens
            const gaugeAddress = await readContract({
                networkId: NETWORK_ID,
                contractAddress: AERODROME_VOTER_CONTRACT_ADDRESS as `0x${string}`,
                method: "gauges",
                args: { pool: poolData.address },
                abi: [{
                    inputs: [{ name: "pool", type: "address" }],
                    name: "gauges",
                    outputs: [{ name: "", type: "address" }],
                    stateMutability: "view",
                    type: "function"
                }]
            }) as string;

            // Get LP token balance
            const lpBalance = await readContract({
                networkId: NETWORK_ID,
                contractAddress: poolData.address as `0x${string}`,
                method: "balanceOf",
                args: { account: defaultAddress.getId() },
                abi: [{
                    inputs: [{ name: "account", type: "address" }],
                    name: "balanceOf",
                    outputs: [{ name: "", type: "uint256" }],
                    stateMutability: "view",
                    type: "function"
                }]
            }) as bigint;

            if (lpBalance <= BigInt(0)) {
                throw new Error("No LP tokens to deposit");
            }

            // Approve gauge to spend LP tokens
            const approveGauge = await wallet.invokeContract({
                contractAddress: poolData.address as `0x${string}`,
                method: "approve",
                args: {
                    spender: gaugeAddress,
                    amount: lpBalance.toString()
                },
                abi: [{
                    constant: false,
                    inputs: [
                        { name: "spender", type: "address" },
                        { name: "amount", type: "uint256" }
                    ],
                    name: "approve",
                    outputs: [{ name: "", type: "bool" }],
                    payable: false,
                    stateMutability: "nonpayable",
                    type: "function"
                }]
            });
            await approveGauge.wait();

            // Stake LP tokens in gauge
            const depositGauge = await wallet.invokeContract({
                contractAddress: gaugeAddress as `0x${string}`,
                method: "deposit",
                args: {
                    amount: lpBalance.toString()
                },
                abi: [
                    {
                        "inputs": [{ "name": "amount", "type": "uint256" }],
                        "name": "deposit",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    }
                ]
            })
            await depositGauge.wait()

            return NextResponse.json({
                success: true,
                txHash: depositGauge.getTransactionHash()
            })

        } catch (error) {
            console.log("Error adding liquidity:", error)
            throw new Error("Failed to add liquidity")
        }
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
}
