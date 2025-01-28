"use client"

import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { formatUnits } from "viem"

interface Position {
    pool: {
        address: string
        symbol: string
        token0: {
            symbol: string
            decimals: number
        }
        token1: {
            symbol: string
            decimals: number
        }
        is_stable: boolean
    }
    balance: string
    share: number
    token0Amount: string
    token1Amount: string
    value_usd: number
}

export function PositionsTable() {
    const [positions, setPositions] = useState<Position[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchPositions() {
            try {
                const response = await fetch("/api/positions")
                const data = await response.json()
                
                if (!response.ok) {
                    throw new Error(data.error || "Failed to fetch positions")
                }
                
                setPositions(data.positions)
            } catch (error) {
                setError(error instanceof Error ? error.message : "Unknown error")
            } finally {
                setLoading(false)
            }
        }

        fetchPositions()
    }, [])

    if (loading) {
        return <div>Loading positions...</div>
    }

    if (error) {
        return <div>Error: {error}</div>
    }

    if (positions.length === 0) {
        return <div>No liquidity positions found</div>
    }
    console.log(positions)
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Pool</TableHead>
                    <TableHead>Share</TableHead>
                    <TableHead>Token Amounts</TableHead>
                    <TableHead className="text-right">Value (USD)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {positions.map((position, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium">
                            {position.pool.symbol}
                            <br />
                            <span className="text-sm text-muted-foreground">
                                {position.pool.is_stable ? "Stable" : "Volatile"}
                            </span>
                        </TableCell>
                        <TableCell>
                            {position.share.toFixed(8)}%
                        </TableCell>
                        <TableCell>
                            {formatUnits(BigInt(position.token0Amount), position.pool.token0.decimals)} {position.pool.token0.symbol}
                            <br />
                            {formatUnits(BigInt(position.token1Amount), position.pool.token1.decimals)} {position.pool.token1.symbol}
                        </TableCell>
                        <TableCell className="text-right">
                            ${(position.value_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
} 