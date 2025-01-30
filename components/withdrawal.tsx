"use client"

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { useUser } from "@/hooks/use-user";
import { availableTokens } from "@/config/tokens-whitelist";
import { ArrowUpToLine } from "lucide-react";
import { toast } from "sonner"
import { useEffect } from "react";

const appId = process.env.NEXT_PUBLIC_COINBASE_APP_ID as string;
const redirectUrl = process.env.NEXT_PUBLIC_APP_URL as string;

if (!appId) {
    throw new Error("NEXT_PUBLIC_COINBASE_APP_ID is not set");
}

if (!redirectUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set");
}

const assets = availableTokens.map(token => token.name);
const assetsString = JSON.stringify(assets);

interface WithdrawalProps {
    defaultAddress: string;
    poolAddress?: string;
}

export function Withdrawal({ defaultAddress, poolAddress }: WithdrawalProps) {
    const router = useRouter();
    const { user } = useUser();
    const searchParams = useSearchParams();
    const status = searchParams.get("status");
    const txHash = searchParams.get("txHash");

    const handleLiquidityRemoval = async () => {
        try {
            const response = await fetch('/api/withdrawal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    poolAddress,
                    amount: '0'
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to remove liquidity');
            }

            const result = await response.json();
            if (result.success) {
                toast.success("Liquidity removed successfully", {
                    description: "View transaction on Basescan",
                    action: {
                        label: "View",
                        onClick: () => window.open(`https://basescan.org/tx/${result.txHash}`, '_blank'),
                    }
                });
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to remove liquidity", {
                description: error instanceof Error ? error.message : "Unknown error occurred"
            });
        }
    };

    const handleClick = () => {
        if (poolAddress) {
            handleLiquidityRemoval();
        } else {
            const callbackUrl = `${redirectUrl}/api/offramp/callback`;
            const url = `https://pay.coinbase.com/v3/sell/input?appId=${appId}&partnerUserId=${user?.id}&addresses={"${defaultAddress}":["base"]}&assets=${assetsString}&redirectUrl=${encodeURIComponent(callbackUrl)}`;
            window.open(url, '_blank');
        }
    };

    useEffect(() => {
        if (status === "withdrawal_success" && txHash) {
            setTimeout(() => {
                toast("Withdrawal Successful", {
                    description: "View transaction on Basescan",
                    action: {
                        label: "View",
                        onClick: () => window.open(`https://basescan.org/tx/${txHash}`, '_blank'),
                    },
                    onDismiss: () => {
                        router.replace("/wallet");
                    },
                    onAutoClose: () => {
                        router.replace("/wallet");
                    },
                })
            })
        }
    }, [status, txHash, router])

    return (
        <Button variant="outline" className="flex-1" onClick={handleClick}>
            <ArrowUpToLine className="mr-2 h-4 w-4" />
            Withdraw
        </Button>
    );
}