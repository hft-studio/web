"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { Deposit } from "./deposit";
import { Withdrawal } from "./withdrawal";

export function WalletControls(props: {
    defaultAddress: string
}) {
   

    const copyToClipboard = async () => {
            await navigator.clipboard.writeText(props.defaultAddress)
    }

    const truncateAddress = (address: string) => {
        if (!address) return ""
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    return (
        <div className="grid grid-cols-2 gap-4">
            {props.defaultAddress && (
                <Button
                    variant="outline"
                    className="flex items-center justify-between"
                    onClick={copyToClipboard}
                >
                    <span className="text-base">
                            {truncateAddress(props.defaultAddress)}
                    </span>
                    <Copy className="h-4 w-4" />
                </Button>
            )}
            
            <div className="flex gap-2">
                <Deposit defaultAddress={props.defaultAddress} />
                <Withdrawal defaultAddress={props.defaultAddress} />
            </div>
        </div>
    )
} 