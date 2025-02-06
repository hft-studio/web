import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Wallet, readContract, NETWORK_ID } from "@/lib/coinbase"
import { decryptSeed } from "@/lib/encryption"
import { Pool } from "@/types/pool"
import { Position } from "@/types/position";
import { getWallet } from "@/lib/wallet";
import { getPosition } from "@/lib/aerodrome";
import { fetchTokenPrices } from "@/lib/prices"

export async function GET(request: Request) {
    try {
        console.log("Starting positions fetch...")

        const { wallet, defaultAddress, defaultWallet } = await getWallet()
        const prices = await fetchTokenPrices();
        console.log("Prices:", prices)
        // Fetch all pools from the API
        console.log("Fetching pools...")
        const poolsResponse = await fetch(`${process.env.NEXT_PUBLIC_SUGAR_URL}/api/pools`)
        if (!poolsResponse.ok) {
            console.log("Pools fetch error:", poolsResponse.statusText)
            throw new Error(`Failed to fetch pools: ${poolsResponse.statusText}`)
        }
        const pools = (await poolsResponse.json()) as Pool[]
        console.log("Found pools:", pools.length)

        const positions: Position[] = []

        const pool = pools.find((p: Pool) => p.symbol === "vAMM-USDC/cbBTC")
        console.log("Pool:", pool)
        if (pool) {
            console.log("Found USDC/cbBTC pool:", pool.address)
            const position = await getPosition(pool, prices)
            console.log("Positionddd:", position)
            positions.push(position)
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