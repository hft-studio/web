import { formatUnits } from "viem";
import React from 'react';

interface Token {
    symbol: string;
    decimals: number;
}

interface Pool {
    address: string;
    symbol: string;
    token0: Token;
    token1: Token;
    is_stable: boolean;
}

interface PositionBalance {
    balance: string;
    share: number;
    token0Amount: string;
    token1Amount: string;
}

interface Position {
    pool: Pool;
    share: number;
    token0Amount: string;
    token1Amount: string;
    token0Value: number;
    token1Value: number;
    value_usd: number;
    unstaked: PositionBalance;
    staked: PositionBalance;
}

function formatAmount(amount: string, decimals: number): string {
    try {
        const value = formatUnits(BigInt(amount), decimals);
        const num = parseFloat(value);
        
        // For very small numbers (less than 0.0001)
        if (num < 0.0001) {
            if (num === 0) return '0';
            return num.toExponential(6);
        }
        
        // For small numbers (less than 1)
        if (num < 1) {
            return num.toLocaleString(undefined, { 
                minimumFractionDigits: 6,
                maximumFractionDigits: 8
            });
        }
        
        // For larger numbers
        return num.toLocaleString(undefined, { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        });
    } catch (error) {
        console.error('Error formatting amount:', error);
        return '0';
    }
}

async function getPositions() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/positions`);
    if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
}

export default async function PositionsPage() {
    const data = await getPositions();
    const positions = data.positions as Position[];

    if (!positions || positions.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">My Positions</h1>
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <p className="text-gray-500">No positions found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">My Positions</h1>
            <div className="grid gap-6">
                {positions.map((position: Position, index: number) => (
                    <div key={index} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">{position.pool.symbol}</h2>
                            <div className="text-sm text-gray-500">
                                Total Share: {position.share.toFixed(6)}%
                            </div>
                        </div>
                        
                        {/* Unstaked Position */}
                        {Number(position.unstaked.balance) > 0 && (
                            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                <h3 className="text-lg font-medium mb-2">Unstaked Position</h3>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">Share: {position.unstaked.share.toFixed(6)}%</p>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-600">
                                            {position.pool.token0.symbol}:
                                        </p>
                                        <p className="text-sm font-medium">
                                            {formatAmount(position.unstaked.token0Amount, position.pool.token0.decimals)}
                                        </p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-600">
                                            {position.pool.token1.symbol}:
                                        </p>
                                        <p className="text-sm font-medium">
                                            {formatAmount(position.unstaked.token1Amount, position.pool.token1.decimals)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Staked Position */}
                        {Number(position.staked.balance) > 0 && (
                            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                                <h3 className="text-lg font-medium mb-2">Staked Position</h3>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">Share: {position.staked.share.toFixed(6)}%</p>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-600">
                                            {position.pool.token0.symbol}:
                                        </p>
                                        <p className="text-sm font-medium">
                                            {formatAmount(position.staked.token0Amount, position.pool.token0.decimals)}
                                        </p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-600">
                                            {position.pool.token1.symbol}:
                                        </p>
                                        <p className="text-sm font-medium">
                                            {formatAmount(position.staked.token1Amount, position.pool.token1.decimals)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Total Value */}
                        <div className="mt-4 pt-4 border-t">
                            <p className="text-lg font-medium">
                                Total Value: ${position.value_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 