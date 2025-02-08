"use client"

import { Position } from "@/types/position";
import { Info } from "lucide-react";

interface PositionCardProps {
    position: Position;
}

export function PositionCard({ position }: PositionCardProps) {
    const amount = Number(position.token0Amount) + Number(position.token1Amount)
    const formattedAmount = Number(amount).toFixed(2).toString()
    return (
        // <div className=" rounded-lg shadow-md p-6">
        //     <div className="flex justify-between items-center mb-4">
        //         <h2 className="text-xl font-semibold">{position.pool.symbol}</h2>
        //     </div>
        //     {Number(position.staked.balance) > 0 && (
        //         <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        //             <h3 className="text-lg font-medium mb-2">Staked Position</h3>
        //             <div className="space-y-2">
        //                 <div className="flex justify-between items-center">
        //                     <p className="text-sm text-gray-600">
        //                         {position.pool.token0.symbol}:
        //                     </p>
        //                     <p className="text-sm font-medium">
        //                         {formatAmount(position.staked.token0Amount, position.pool.token0.decimals)}
        //                     </p>
        //                 </div>
        //                 <div className="flex justify-between items-center">
        //                     <p className="text-sm text-gray-600">
        //                         {position.pool.token1.symbol}:
        //                     </p>
        //                     <p className="text-sm font-medium">
        //                         {formatAmount(position.staked.token1Amount, position.pool.token1.decimals)}
        //                     </p>
        //                 </div>
        //             </div>
        //         </div>
        //     )}

        //     {/* Total Value */}
        //     <div className="mt-4 pt-4 border-t">
        //         <p className="text-lg font-medium">
        //             Total Value: ${position.value_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        //         </p>
        //     </div>
        // </div>

        <div className="rounded-xl bg-zinc-900 p-6">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-blue-500" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 border-2 border-zinc-900" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-medium text-white">WETH / USDC</h2>
                            <span className="px-2 py-0.5 text-xs font-medium bg-zinc-800 text-white rounded">v2</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-500">
                            <div className="w-2 h-2 rounded-full bg-current" />
                            <span className="text-sm">In range</span>
                        </div>
                    </div>
                </div>
                <div className="flex-1 mx-8">
                    <div className="h-16 relative">
                        <div className="absolute inset-0">
                            <svg className="w-full h-full">
                                <path
                                    d="M0,32 C50,28 100,36 150,32 C200,28 250,34 300,32"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-emerald-500"
                                />
                            </svg>
                        </div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-zinc-900 bg-emerald-500" />
                    </div>
                    <div className="text-right">
                        <span className="text-sm text-zinc-400">Full range</span>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-8 mt-6">
                <div>
                    <div className="text-sm text-zinc-400">Position</div>
                    <div className="text-xl font-medium text-white">${formattedAmount}</div>
                </div>
                <div>
                    <div className="text-sm text-zinc-400">Fees</div>
                    <div className="flex items-center gap-1 text-xl font-medium text-white">
                        Unavailable
                        <Info className="w-4 h-4 text-zinc-400" />
                    </div>
                </div>
                <div>
                    <div className="text-sm text-zinc-400">APR</div>
                    <div className="text-xl font-medium text-white">2.59%</div>
                </div>
            </div>
        </div>
    );
} 