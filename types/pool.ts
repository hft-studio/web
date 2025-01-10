// Base token type
export interface Token {
  address: string;
  symbol: string;
  decimals: number;
}

// Base pool fields that are common to both list and detail
interface BasePool {
  address: string;
  symbol: string;
  is_stable: boolean;
  token0: Token;
  token1: Token | null;
  reserve0: number;
  reserve1: number;
  reserve0_usd: number;
  reserve1_usd: number;
  fees_token0: number;
  fees_token1: number;
  fees_token0_usd: number;
  fees_token1_usd: number;
  pool_fee: number;
  volume: number;
}

// Pool list item type
export type PoolListItem = BasePool;

// Additional fields for pool details
interface EpochData {
  fees: number;
  bribes: number;
  total_rewards: number;
}

// Pool detail type extends base pool with additional fields
export interface PoolDetail extends BasePool {
  tvl: number;
  apr: number;
  epoch_data: EpochData;
} 