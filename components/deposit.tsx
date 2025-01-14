"use client"

import { CBPayInstanceType, initOnRamp } from "@coinbase/cbpay-js";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { availableTokens } from "@/config/tokens-whitelist";

export const Deposit: React.FC = () => {
  const [onrampInstance, setOnrampInstance] = useState<CBPayInstanceType | null>();
  const wallet = useWallet()
  const addresses: Record<string, string[]> = {}
  if (wallet.address) {
    addresses[wallet.address] = ['base']
  }
  useEffect(() => {
    if (!wallet.address) return;
    console.log('wallet.address', wallet.address)
    initOnRamp({
      appId: 'b3fd76ad-5fd8-424c-9d62-46f644198ca6',
      widgetParameters: {
        // Specify the addresses and which networks they support
        addresses,
        // (Optional) Filter the available assets on the above networks to just these ones
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

  return <Button onClick={handleClick} disabled={!onrampInstance}>Buy with Coinbase</Button>;
};