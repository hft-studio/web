"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function TestDeposit() {
    const handleDeposit = async () => {
        try {
            const response = await fetch('/api/deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    poolAddress: '0x9c38b55f9A9Aba91BbCEDEb12bf4428f47A6a0B8',
                    amount: '1000000' // 1 USDC (6 decimals)
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to deposit')
            }

            toast.success("Deposit Successful", {
                description: (
                    <a 
                        href={`https://basescan.org/tx/${data.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                    >
                        View transaction on Basescan
                    </a>
                ),
            })
        } catch (error) {
            toast.error("Deposit Failed", {
                description: error instanceof Error ? error.message : "Unknown error occurred"
            })
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center">
            <Button onClick={handleDeposit} size="lg">
                Deposit 1 USDC
            </Button>
        </div>
    )
} 