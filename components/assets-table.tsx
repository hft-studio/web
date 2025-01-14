"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TokenImage } from '@coinbase/onchainkit/token'
import { availableTokens } from "@/config/tokens-whitelist"
import { useWallet } from "@/hooks/use-wallet"

export function AssetsTable() {
    const { balances, prices } = useWallet()

    return (
        <div className="rounded-xl overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {availableTokens.map((token) => {
                        const tokenKey = token.name.toLowerCase()
                        const balance = balances?.[tokenKey] ?? 0
                        const price = prices?.[tokenKey] ?? 0
                        const value = balance * price

                        return (
                            <TableRow key={token.name}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <TokenImage size={24} token={token} />
                                        <span>{token.name.toUpperCase()}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{balance.toFixed(4)}</TableCell>
                                <TableCell className="text-right">${value.toFixed(2)}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
} 