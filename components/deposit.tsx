"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { ArrowDownToLine } from "lucide-react"
import { CBPayInstanceType, initOnRamp } from "@coinbase/cbpay-js";
import { useEffect, useState } from "react";
import { availableTokens } from "@/config/tokens-whitelist";

const appId = process.env.NEXT_PUBLIC_COINBASE_APP_ID as string

if (!appId) {
    throw new Error("NEXT_PUBLIC_COINBASE_APP_ID is not set")
}

export function Deposit(props: {
    defaultAddress: string
}) {

    const [onrampInstance, setOnrampInstance] = useState<CBPayInstanceType | null>();

    useEffect(() => {
        let instance: CBPayInstanceType | null = null;

        initOnRamp({
            appId: appId,
            widgetParameters: {
                addresses: { [props.defaultAddress]: ['base'] },
                assets: availableTokens.map(token => token.name),
            },
            experienceLoggedIn: 'popup',
            experienceLoggedOut: 'popup',
            closeOnExit: true,
            closeOnSuccess: true,
        }, (_, newInstance) => {
            instance = newInstance;
            setOnrampInstance(newInstance);
        });

        return () => {
            instance?.destroy();
        };
    }, [props.defaultAddress]);

    const handleClick = () => {
        onrampInstance?.open();
    };

    return (
        <Button variant="outline" className="flex-1" onClick={handleClick}>
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Deposit
        </Button>
    )
} 