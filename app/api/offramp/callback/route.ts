import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Wallet } from "@/lib/coinbase"
import { createRequest } from "@/lib/coinbase/request"
import { decryptSeed } from "@/lib/encryption"

export async function GET(req: NextRequest) {
    try {
        // Get user from session
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (!user || userError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get recent transactions from Coinbase
        const { url, jwt } = await createRequest({
            request_method: "GET",
            request_path: `/onramp/v1/sell/user/${user.id}/transactions`,
        })

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
        })

        const data = await response.json()
        console.log("Transactions response:", JSON.stringify(data, null, 2))

        // Get the most recent transaction
        const latestTransaction = data.transactions[0]
        if (!latestTransaction) {
            throw new Error("No recent transactions found")
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

        // Create and send the transaction
        const transfer = await wallet.createTransfer({
            amount: parseFloat(latestTransaction.sell_amount.value),
            assetId: latestTransaction.asset.toLowerCase(),
            destination: latestTransaction.to_address,
        })

        // Wait for transaction confirmation
        await transfer.wait()

        // Redirect to success page with transaction hash
        const successUrl = new URL("/wallet", process.env.NEXT_PUBLIC_APP_URL!)
        successUrl.searchParams.set("status", "success")
        successUrl.searchParams.set("txHash", transfer.getTransactionHash() || "")
        
        return NextResponse.redirect(successUrl)

    } catch (error) {
        console.error("Error processing offramp callback:", error)
        // Redirect to error page
        const errorUrl = new URL("/wallet", process.env.NEXT_PUBLIC_APP_URL!)
        errorUrl.searchParams.set("status", "error")
        errorUrl.searchParams.set("error", error instanceof Error ? error.message : "Unknown error")
        
        return NextResponse.redirect(errorUrl)
    }
} 