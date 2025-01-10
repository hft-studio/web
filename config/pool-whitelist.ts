export const WHITELISTED_POOLS = [
  'vAMM-USDC/cbBTC',
] as const;

export type WhitelistedPool = typeof WHITELISTED_POOLS[number];

// Type guard to check if a symbol is whitelisted
export function isWhitelistedPool(symbol: string): symbol is WhitelistedPool {
  return WHITELISTED_POOLS.includes(symbol as WhitelistedPool);
} 