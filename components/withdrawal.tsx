import { useSearchParams } from "next/navigation";
import { Button } from "./ui/button";
import { useUser } from "@/hooks/use-user";
import { availableTokens } from "@/config/tokens-whitelist";
import { ArrowUpToLine } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
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
    const { toast } = useToast();

    useEffect(() => {
        if (status === "success" && txHash) {
            toast({
                title: "Withdrawal Successful",
                description: `Transaction hash: ${txHash.slice(0, 6)}...${txHash.slice(-4)}`,
                variant: "default",
            });
        } else if (status === "error" && error) {
            toast({
                title: "Withdrawal Failed",
                description: error,
                variant: "destructive",
            });
        }
    }, [status, error, txHash, toast]);

    const handleClick = () => {
        const callbackUrl = `${redirectUrl}/api/offramp/callback`;
        const url = `https://pay.coinbase.com/v3/sell/input?appId=${appId}&partnerUserId=${user?.id}&addresses={"${defaultAddress}":["base"]}&assets=${assetsString}&redirectUrl=${encodeURIComponent(callbackUrl)}`;
        console.log("Opening withdrawal URL:", url);
        window.open(url, '_blank');
    };

    return (
        <Button variant="outline" className="flex-1" onClick={handleClick}>
            <ArrowUpToLine className="mr-2 h-4 w-4" />
            Withdraw
        </Button>
    );
}