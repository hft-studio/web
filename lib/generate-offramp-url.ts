export interface OffRampURLParams {
    appId?: string;
    host?: string;
    redirectUrl?: string;
    addresses?: string[];
    assets?: string[];
    presetCryptoAmount?: string;
    presetFiatAmount?: string;
    defaultNetwork?: string;
    sessionToken?: string;
}

export function generateOffRampURL({
    appId = process.env.NEXT_PUBLIC_COINBASE_APP_ID,
    host = "https://pay.coinbase.com",
    redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/offramp/callback`,
    addresses,
    assets,
    presetCryptoAmount,
    presetFiatAmount,
    defaultNetwork,
    sessionToken,
}: OffRampURLParams = {}): string {
    const url = new URL("/sell", host);
    const searchParams = new URLSearchParams();

    if (appId) searchParams.set("appId", appId);
    if (redirectUrl) searchParams.set("redirectUrl", redirectUrl);
    if (addresses?.length) searchParams.set("destinationWallets", JSON.stringify(addresses));
    if (assets?.length) searchParams.set("assets", JSON.stringify(assets));
    if (presetCryptoAmount) searchParams.set("presetCryptoAmount", presetCryptoAmount);
    if (presetFiatAmount) searchParams.set("presetFiatAmount", presetFiatAmount);
    if (defaultNetwork) searchParams.set("defaultNetwork", defaultNetwork);
    if (sessionToken) searchParams.set("sessionToken", sessionToken);

    url.search = searchParams.toString();
    return url.toString();
} 