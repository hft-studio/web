"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function TestWithdrawal() {
    const handleWithdrawal = async () => {
        try {
            const response = await fetch('/api/withdrawal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    poolAddress: '0x9c38b55f9A9Aba91BbCEDEb12bf4428f47A6a0B8',
                    amount: '100' // Withdraw 100% of staked LP tokens
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to withdraw')
            }

            toast.success("Withdrawal Successful", {
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
            toast.error("Withdrawal Failed", {
                description: error instanceof Error ? error.message : "Unknown error occurred"
            })
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center">
            <Button onClick={handleWithdrawal} size="lg">
                Withdraw All LP Tokens
            </Button>
        </div>
    )
} 