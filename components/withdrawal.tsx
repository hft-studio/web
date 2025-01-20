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
}

export function Withdrawal({ defaultAddress }: WithdrawalProps) {
    const router = useRouter();
    const { user } = useUser();
    const searchParams = useSearchParams();
    const status = searchParams.get("status");
    const error = searchParams.get("error");
    const txHash = searchParams.get("txHash");

    const handleClick = () => {
        const callbackUrl = `${redirectUrl}/api/offramp/callback`;
        const url = `https://pay.coinbase.com/v3/sell/input?appId=${appId}&partnerUserId=${user?.id}&addresses={"${defaultAddress}":["base"]}&assets=${assetsString}&redirectUrl=${encodeURIComponent(callbackUrl)}`;
        window.open(url, '_blank');
    };

    // Show different states based on the status
    if (status === "pending") {
        return (
            <Button disabled>
                Processing Withdrawal...
            </Button>
        );
    }

    if (status === "error") {
        return (
            <div className="space-y-2">
                <Button onClick={handleClick} variant="destructive">
                    Try Again
                </Button>
                {error && <p className="text-sm text-red-500">Error: {error}</p>}
            </div>
        );
    }

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