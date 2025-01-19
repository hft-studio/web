import { useSearchParams } from "next/navigation";
import { Button } from "./ui/button";
import { useUser } from "@/hooks/use-user";
import { availableTokens } from "@/config/tokens-whitelist";
import { ArrowUpToLine } from "lucide-react";

const appId = process.env.NEXT_PUBLIC_COINBASE_APP_ID as string;
const redirectUrl = process.env.NEXT_PUBLIC_APP_URL as string;

if (!appId) {
    throw new Error("NEXT_PUBLIC_COINBASE_APP_ID is not set");
}

if (!redirectUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set");
}

const assets = availableTokens.map(token => token.name);
const assetsString = '["USDC", "ETH"]';

interface WithdrawalProps {
    defaultAddress: string;
}

export function Withdrawal({ defaultAddress }: WithdrawalProps) {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const status = searchParams.get("status");
    const error = searchParams.get("error");
    const txHash = searchParams.get("txHash");

    const handleClick = () => {
        const callbackUrl = `${redirectUrl}/api/offramp/callback`;
        const url = `https://pay.coinbase.com/v3/sell/input?appId=${appId}&partnerUserId=${user?.id}&addresses={"${defaultAddress}":["base"]}&assets=${assetsString}&redirectUrl=${encodeURIComponent(callbackUrl)}`;
        console.log("Opening withdrawal URL:", url);
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

    if (status === "success") {
        return (
            <div className="space-y-2">
                <Button variant="outline" onClick={handleClick}>
                    Withdraw More
                </Button>
                {txHash && (
                    <p className="text-sm text-green-500">
                        Transaction successful! Hash: {txHash.slice(0, 6)}...{txHash.slice(-4)}
                    </p>
                )}
            </div>
        );
    }

    return (
        <Button variant="outline" className="flex-1" onClick={handleClick}>
            <ArrowUpToLine className="mr-2 h-4 w-4" />
            Withdraw
        </Button>
    );
}