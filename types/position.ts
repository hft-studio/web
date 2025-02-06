import { Pool } from "./pool";

export interface Token {
    symbol: string;
    decimals: number;
    price: number;
}

export interface Position {
    pool: Pool;
    token0Amount: string;
    token1Amount: string;
}

export type PriceData = {
    [key: string]: number
}