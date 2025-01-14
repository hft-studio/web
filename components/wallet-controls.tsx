"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { ArrowDownToLine, ArrowUpToLine, Copy } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { CBPayInstanceType, initOnRamp } from "@coinbase/cbpay-js";
import { useEffect, useState } from "react";
import { availableTokens } from "@/config/tokens-whitelist";

export function WalletControls(props: {
    defaultAddress: string
}) {
    const { address } = useWallet()

    const copyToClipboard = async () => {
        if (address) {
            await navigator.clipboard.writeText(address)
        }
    }

    const truncateAddress = (address: string) => {
        if (!address) return ""
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    const [onrampInstance, setOnrampInstance] = useState<CBPayInstanceType | null>();

  useEffect(() => {

    initOnRamp({
      appId: 'b3fd76ad-5fd8-424c-9d62-46f644198ca6',
      widgetParameters: {
        addresses: { [props.defaultAddress]: ['base'] },
        assets: availableTokens.map(token => token.name),
      },
      onSuccess: () => {
        console.log('success');
      },
      onExit: () => {
        console.log('exit');
      },
      onEvent: (event) => {
        console.log('event', event);
      },
      experienceLoggedIn: 'popup',
      experienceLoggedOut: 'popup',
      closeOnExit: true,
      closeOnSuccess: true,
    }, (_, instance) => {
      setOnrampInstance(instance);
    });

    // When button unmounts destroy the instance
    return () => {
      onrampInstance?.destroy();
    };
  }, []);

  const handleClick = () => {
    onrampInstance?.open();
  };

    return (
        <div className="grid grid-cols-2 gap-4">
            {address && (
                <Button
                    variant="outline"
                    className="flex items-center justify-between"
                    onClick={copyToClipboard}
                >
                    <span className="text-base">
                        {truncateAddress(address)}
                    </span>
                    <Copy className="h-4 w-4" />
                </Button>
            )}
            
            <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleClick}>
                    <ArrowDownToLine className="mr-2 h-4 w-4" />
                    Deposit
                </Button>
                <Button variant="outline" className="flex-1">
                    <ArrowUpToLine className="mr-2 h-4 w-4" />
                    Withdraw
                </Button>
            </div>
        </div>
    )
} 