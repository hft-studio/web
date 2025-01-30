"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function TestClaim() {
    const handleClaim = async () => {
        try {
            const response = await fetch('/api/aerodrome/claim', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    poolAddress: "0x9c38b55f9A9Aba91BbCEDEb12bf4428f47A6a0B8"  // USDC/cbBTC pool
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to claim rewards');
            }

            const result = await response.json();
            if (result.success) {
                toast.success("Rewards claimed successfully", {
                    description: "View transaction on Basescan",
                    action: {
                        label: "View",
                        onClick: () => window.open(`https://basescan.org/tx/${result.txHash}`, '_blank'),
                    }
                });
            }
        } catch (error) {
            toast.error("Failed to claim rewards", {
                description: error instanceof Error ? error.message : "Unknown error occurred"
            });
        }
    };

    return (
        <div className="container flex items-center justify-center min-h-screen">
            <Button onClick={handleClaim} size="lg">
                Test Claim Rewards
            </Button>
        </div>
    );
} 