"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { TokenImage } from '@coinbase/onchainkit/token'
import { TokenPrices } from "@/lib/prices"
import { availableTokens } from "@/config/tokens-whitelist"

interface AssetsTableProps {
    balances: Record<string, number>
    prices: TokenPrices
}

export function AssetsTable({ balances, prices }: AssetsTableProps) {
    return (
        <div className="rounded-xl overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Object.entries(balances).map(([currency, balance]) => {
                        const price = prices[currency]?.price || 0
                        const value = balance * price
                        const token = availableTokens.find(t => t.symbol.toLowerCase() === currency.toLowerCase())

                        if (!token) return null

                        return (
                            <TableRow key={currency}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <TokenImage size={24} token={token} />
                                        <span>{token.name.toUpperCase()}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</TableCell>
                                <TableCell>${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right">
                                    ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
} 