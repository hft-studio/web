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
        console.log("Fetching pool data from:", poolDataUrl)
        
        const poolResponse = await fetch(poolDataUrl)
        const poolData = await poolResponse.json()
        console.log("Pool data:", poolData)

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
        console.log("Wallet address:", defaultAddress.getId())

        // Log raw values first
        console.log("Raw amount:", amount)
        console.log("Raw reserve0:", poolData.reserve0)
        console.log("Raw reserve1:", poolData.reserve1)
        console.log("Token0 decimals:", poolData.token0.decimals)
        console.log("Token1 decimals:", poolData.token1.decimals)

        // Convert amount to integer (USDC has 6 decimals)
        const amountInt = "1000000" // 1 USDC
        
        // Convert reserves to integers (multiply by their respective decimals)
        const reserve0Int = Math.floor(parseFloat(poolData.reserve0) * 10 ** poolData.token0.decimals).toString()
        const reserve1Int = Math.floor(parseFloat(poolData.reserve1) * 10 ** poolData.token1.decimals).toString()
        
        console.log("Reserve0 (in wei):", reserve0Int)
        console.log("Reserve1 (in wei):", reserve1Int)
        console.log("Pool ratio (token1/token0):", (parseFloat(poolData.reserve1) / parseFloat(poolData.reserve0)).toString())
        
        // Calculate optimal amounts based on reserves (already in correct decimals)
        const amountBDesired = (
            (BigInt(amountInt) * BigInt(reserve1Int)) / 
            BigInt(reserve0Int)
        ).toString()

        console.log("Amount A (USDC):", parseFloat(amountInt) / 10 ** poolData.token0.decimals)
        console.log("Amount B (cbBTC):", parseFloat(amountBDesired) / 10 ** poolData.token1.decimals)

        // First approve token0 spending
        console.log("Approving token0:", poolData.token0.address)
        let approveToken0;
        try {
            approveToken0 = await wallet.invokeContract({
                contractAddress: poolData.token0.address,
                method: "approve",
                args: {
                    spender: ROUTER_ADDRESS,
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
            console.log("Waiting for token0 approval...")
            await approveToken0.wait()
            console.log("Token0 approved")
        } catch (error) {
            console.error("Error approving token0:", error)
            throw new Error("Failed to approve token0")
        }

        // Then approve token1 spending
        console.log("Approving token1:", poolData.token1.address)
        let approveToken1;
        try {
            approveToken1 = await wallet.invokeContract({
                contractAddress: poolData.token1.address,
                method: "approve",
                args: {
                    spender: ROUTER_ADDRESS,
                    amount: amountBDesired
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
            console.log("Waiting for token1 approval...")
            await approveToken1.wait()
            console.log("Token1 approved")
        } catch (error) {
            console.error("Error approving token1:", error)
            throw new Error("Failed to approve token1")
        }

        // Add liquidity through router
        console.log("Adding liquidity with params:", {
            tokenA: poolData.token0.address,
            tokenB: poolData.token1.address,
            stable: poolData.is_stable,
            amountADesired: amountInt,
            amountBDesired: amountBDesired,
            to: defaultAddress.getId(),
            deadline: (Math.floor(Date.now() / 1000) + 3600).toString()
        })

        let addLiquidity;
        try {
            addLiquidity = await wallet.invokeContract({
                contractAddress: ROUTER_ADDRESS,
                method: "addLiquidity",
                args: {
                    tokenA: poolData.token0.address,
                    tokenB: poolData.token1.address,
                    stable: poolData.is_stable,
                    amountADesired: amountInt,
                    amountBDesired: amountBDesired,
                    amountAMin: "0",
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
            console.log("Waiting for liquidity addition...")
            await addLiquidity.wait()
            console.log("Liquidity added")
        } catch (error) {
            console.error("Error adding liquidity:", error)
            throw new Error("Failed to add liquidity")
        }

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