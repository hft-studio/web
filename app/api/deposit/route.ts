import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Wallet } from "@/lib/coinbase"
import { decryptSeed } from "@/lib/encryption"

const ROUTER_ADDRESS = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43" // Aerodrome Router

export async function POST(request: Request) {
    try {
        const { poolAddress, amount } = await request.json()

        if (!poolAddress || !amount) {
            return NextResponse.json(
                { error: "Pool address and amount are required" },
                { status: 400 }
            )
        }
        const poolDataUrl = `${process.env.NEXT_PUBLIC_SUGAR_URL}/api/pools/${poolAddress}`
        console.log(poolDataUrl)
        // Fetch pool information
        const poolResponse = await fetch(poolDataUrl)
        const poolData = await poolResponse.json()

        if (!poolData) {
            return NextResponse.json({ error: "Pool not found" }, { status: 404 })
        }

        // Get user from session
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (!user || userError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get user's wallet
        const { data: walletData, error: walletError } = await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", user.id)
            .single()

        if (!walletData || walletError) {
            return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
        }

        // Initialize wallet
        const wallet = await Wallet.fetch(walletData.wallet_id)
        const seed = await decryptSeed(walletData.encrypted_seed)
        wallet.setSeed(seed)

        // Get the wallet's default address
        const defaultAddress = await wallet.getDefaultAddress()

        // First approve USDC spending
        const approveUSDC = await wallet.invokeContract({
            contractAddress: poolData.token0.address,
            method: "approve",
            args: {
                spender: ROUTER_ADDRESS,
                amount: amount
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
        await approveUSDC.wait()

        // Calculate optimal amounts based on reserves
        const amountBDesired = Math.floor((amount * poolData.reserve1) / poolData.reserve0)

        // Add liquidity through router
        const addLiquidity = await wallet.invokeContract({
            contractAddress: ROUTER_ADDRESS,
            method: "addLiquidity",
            args: {
                tokenA: poolData.token0.address,
                tokenB: poolData.token1.address,
                stable: poolData.is_stable,
                amountADesired: amount,
                amountBDesired: amountBDesired.toString(),
                amountAMin: "0",
                amountBMin: "0",
                to: defaultAddress.getId(),
                deadline: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
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

        // Wait for transaction confirmation
        await addLiquidity.wait()

        return NextResponse.json({
            success: true,
            txHash: addLiquidity.getTransactionHash()
        })

    } catch (error) {
        console.error("Error processing deposit:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
} 