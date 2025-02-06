import type { Token } from '@coinbase/onchainkit/token';
import { base } from 'viem/chains';

export const assetColors = {
    eth: "bg-purple-600",
    usdc: "bg-blue-600",
    btc: "bg-green-600",
} as const;

export const productIds = {
    eth: "ETH-USD",
    cbbtc: "BTC-USD",
} as const;

// Map of token display names
export const tokenNames = {
    eth: "Ethereum",
    usdc: "USD Coin",
    weth: "Wrapped ETH",
    btc: "Bitcoin",
} as const;

export const ethToken: Token = {
    name: 'ETH',
    address: '',
    symbol: 'ETH',
    decimals: 18,
    image:
        'https://wallet-api-production.s3.amazonaws.com/uploads/tokens/eth_288.png',
    chainId: base.id,
};

export const usdcToken: Token = {
    name: 'USDC',
    address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    symbol: 'USDC',
    decimals: 6,
    image:
        'https://d3r81g40ycuhqg.cloudfront.net/wallet/wais/44/2b/442b80bd16af0c0d9b22e03a16753823fe826e5bfd457292b55fa0ba8c1ba213-ZWUzYjJmZGUtMDYxNy00NDcyLTg0NjQtMWI4OGEwYjBiODE2',
    chainId: base.id,
};

export const btcToken: Token = {
    name: 'BTC',
    address: '0x2260fac5e55429eea605b5f39e13221c0f9e9222',
    symbol: 'cbBTC',
    decimals: 8,
    image:
        'https://wallet-api-production.s3.amazonaws.com/uploads/tokens/btc_288.png',
    chainId: base.id,
};