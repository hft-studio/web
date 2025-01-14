"use client"

import React from "react"
import { useWallet } from "@/hooks/use-wallet"
import { cn } from "@/lib/utils"
import { TokenImage } from '@coinbase/onchainkit/token';
import { availableTokens } from "@/config/tokens-whitelist"
import { assetColors } from "@/lib/tokens"
import { Button } from "@/components/ui/button"
import { DepositComponent } from "./deposit";
import { Copy } from "lucide-react"

function truncateAddress(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function Wallet({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    const { balances, address, prices } = useWallet()
    
    const copyToClipboard = async () => {
        if (address) {
            await navigator.clipboard.writeText(address)
        }
    }

    // Calculate total portfolio value using actual prices
    const portfolioValue = balances && prices ? Object.entries(balances).reduce((total, [token, balance]) => {
        const price = prices[token] ?? 0
        return total + (balance * price)
    }, 0) : 0

    return (
        <div className={cn(
            "fixed right-0 top-0 z-40 h-screen w-80 bg-background border-l transition-transform duration-300 ease-in-out flex flex-col",
            className
        )} {...props}>
            <div className="flex h-16 items-center justify-between border-b px-4">
                <span className="font-semibold">Wallet</span>
                {address && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            {truncateAddress(address)}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={copyToClipboard}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
            
            <div className="flex-1 overflow-auto">
                <div className="flex flex-col p-4 space-y-4">
                    <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Portfolio value</div>
                        <div className="text-4xl font-bold">${portfolioValue.toFixed(2)}</div>
                        <div className="h-2 w-full bg-purple-600 rounded-full" />
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {availableTokens.map(token => {
                            return (
                                <div key={token.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <span className={`w-2 h-2 rounded-full ${assetColors[token.name.toLowerCase() as keyof typeof assetColors]}`} />
                                    {token.name}
                                </div>
                            )
                        })}
                        </div>
                    </div>

                    {availableTokens.map((token) => {
                        const tokenKey = token.name.toLowerCase()
                        const balance = balances?.[tokenKey] ?? 0
                        const price = prices?.[tokenKey] ?? 0
                        const value = balance * price
                        
                        return (
                            <div key={token.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                                <div className="flex items-center gap-3">
                                    <TokenImage size={32} token={token} />
                                    <div>
                                        <div className="font-medium">{token.name.toUpperCase()}</div>
                                        <div className="text-sm text-muted-foreground">{token.name}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div>${value.toFixed(2)}</div>
                                    <div className="text-sm text-muted-foreground">{balance.toFixed(4)} {token.name.toUpperCase()}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="border-t p-4">
                {address && <DepositComponent defaultAddress={address} />}
            </div>
        </div>
    )
}
