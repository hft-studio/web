import { NextResponse } from "next/server"
import { Pool } from "@/types/pool"
import { Position } from "@/types/position"
import { getPosition } from "@/lib/aerodrome"

/**
 * Fetches user's liquidity positions from Aerodrome pools.
 * Fetches positions for:
 * - USDC/cbBTC pool
 * - USDC/AERO pool
 * 
 * @returns Array of user's positions with token amounts and pool details
 */
export async function GET() {
    try {

        const poolsResponse = await fetch(`${process.env.NEXT_PUBLIC_SUGAR_URL}/api/pools`)
        if (!poolsResponse.ok) {
            throw new Error(`Failed to fetch pools: ${poolsResponse.statusText}`)
        }

        const pools = (await poolsResponse.json()) as Pool[]
        const positions: Position[] = []

        const targetPools = ["vAMM-USDC/cbBTC", "vAMM-USDC/AERO", , "vAMM-WETH/USDC"]

        for (const poolSymbol of targetPools) {
            const pool = pools.find((p: Pool) => p.symbol === poolSymbol)
            if (pool) {
                const position = await getPosition(pool)
                positions.push(position)
            }
        }

        return NextResponse.json({ positions })
    } catch (error) {
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Unknown error",
                details: error instanceof Error ? error.stack : undefined
            },
            { status: error instanceof Error && error.message.includes("503") ? 503 : 500 }
        )
    }
}