export const WHITELISTED_POOLS = [
  'vAMM-USDC/cbBTC',
  'vAMM-WETH/USDC',
  'vAMM-USDC/AERO'
] as const;

export type WhitelistedPool = typeof WHITELISTED_POOLS[number];

// Type guard to check if a symbol is whitelisted
export function isWhitelistedPool(symbol: string): symbol is WhitelistedPool {
  return WHITELISTED_POOLS.includes(symbol as WhitelistedPool);
} 