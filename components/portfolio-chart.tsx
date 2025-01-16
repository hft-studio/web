"use client"

import React from "react"
import { Cell, Label, Legend, Pie, PieChart, ResponsiveContainer } from "recharts"
import { TokenPrices } from "@/lib/prices"

interface ChartData {
    token: string
    value: number
    fill: string
}

interface ChartViewBox {
    cx?: number
    cy?: number
    innerRadius?: number
    outerRadius?: number
    startAngle?: number
    endAngle?: number
    width?: number
    height?: number
}

interface PortfolioChartProps {
    balances: Record<string, number>
    prices: TokenPrices
    totalValue: number
}

export function PortfolioChart({ balances, prices, totalValue }: PortfolioChartProps) {
    const portfolioData = React.useMemo<ChartData[]>(() => {
        // Convert balances to array of entries
        const entries = Object.entries(balances)
        console.log('Balance entries:', entries)
        
        const data = entries.map(([token, balance]): ChartData => {
            const lowerToken = token.toLowerCase()
            const value = Number(balance) * (prices[lowerToken]?.price ?? 0)
            console.log('Processing token:', { token, balance: String(balance), price: prices[lowerToken]?.price ?? 0, value })
            
            return {
                token: token.toUpperCase(),
                value,
                fill: `hsl(var(--chart-${entries.findIndex(([t]) => t === token) + 1}))`
            }
        }).filter((entry): entry is ChartData => {
            const isValid = entry.value > 0
            if (!isValid) {
                console.log('Filtering out token:', entry)
            }
            return isValid
        })
        
        console.log('Final portfolio data:', data)
        return data
    }, [balances, prices])

    if (portfolioData.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No assets to display</p>
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={portfolioData}
                    dataKey="value"
                    nameKey="token"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                >
                    {portfolioData.map((entry) => (
                        <Cell key={entry.token} fill={entry.fill} />
                    ))}
                    <Label
                        content={({ viewBox }) => {
                            const vb = viewBox as ChartViewBox
                            const cx = vb?.cx ?? 0
                            const cy = vb?.cy ?? 0
                            return (
                                <text
                                    x={cx}
                                    y={cy}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                >
                                    <tspan
                                        x={cx}
                                        y={cy}
                                        className="fill-foreground text-xl font-bold"
                                    >
                                        ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </tspan>
                                    <tspan
                                        x={cx}
                                        y={cy + 16}
                                        className="fill-muted-foreground text-xs"
                                    >
                                        Total Value
                                    </tspan>
                                </text>
                            )
                        }}
                    />
                </Pie>
                <Legend 
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: string) => (
                        <span className="text-xs text-muted-foreground">{value}</span>
                    )}
                />
            </PieChart>
        </ResponsiveContainer>
    )
} 