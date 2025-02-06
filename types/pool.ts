export interface Token {
  address: string;
  symbol: string;
  decimals: number;
  price: number;
}

export interface Pool {
  address: string;
  symbol: string;
  token0: {
    address: string;
    symbol: string;
    decimals: number;
    price: number;
  };
  token1: {
    address: string;
    symbol: string;
    decimals: number;
    price: number;
  };
  reserve0: string;
  reserve1: string;
  reserve0_usd: number;
  reserve1_usd: number;
  fees_token0: number;
  fees_token1: number;
  fees_token0_usd: number;
  fees_token1_usd: number;
  pool_fee: number;
  volume: number;
  tvl: number;
  apr: number;
  epoch_data: {
    fees: number;
    bribes: number;
    total_rewards: number;
  };
  is_stable: boolean;
}

export type PoolListItem = Pool;

interface EpochData {
  fees: number;
  bribes: number;
  total_rewards: number;
}

export interface PoolDetail extends Pool {
  tvl: number;
  apr: number;
  epoch_data: EpochData;
} 