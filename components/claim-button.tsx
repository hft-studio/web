"use client"

import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Coins } from "lucide-react";

interface ClaimButtonProps {
    poolAddress: string;
}

export function ClaimButton({ poolAddress }: ClaimButtonProps) {
    const router = useRouter();

    const handleClaim = async () => {
        try {
            const response = await fetch('/api/aerodrome/claim', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    poolAddress
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
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to claim rewards", {
                description: error instanceof Error ? error.message : "Unknown error occurred"
            });
        }
    };

    return (
        <Button variant="outline" className="flex-1" onClick={handleClaim}>
            <Coins className="mr-2 h-4 w-4" />
            Claim
        </Button>
    );
} 