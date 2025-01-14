"use client"

import React from "react"
import { Label, Pie, PieChart, ResponsiveContainer } from "recharts"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { useWallet } from "@/hooks/use-wallet"

export function PortfolioChart() {
    const { balances, prices } = useWallet()
    const portfolioData = React.useMemo(() => {
        if (!balances || !prices) return []
        return Object.entries(balances).map(([token, balance]) => ({
            token,
            value: balance * (prices[token] ?? 0),
            fill: `hsl(var(--chart-${Object.keys(balances).indexOf(token) + 1}))`
        }))
    }, [balances, prices])

    const totalValue = React.useMemo(() => {
        return portfolioData.reduce((acc, curr) => acc + curr.value, 0)
    }, [portfolioData])

    const chartConfig: ChartConfig = {
        eth: {
            label: "Eth",
            color: "hsl(var(--chart-1))",
        },
        btc: {
            label: "Btc",
            color: "hsl(var(--chart-2))",
        },
        usdc: {
            label: "Usdc",
            color: "hsl(var(--chart-3))",
        },
    }

    return (
        <ResponsiveContainer width="100%" height={230}>
        <ChartContainer config={chartConfig} >
            <PieChart className="flex flex-row">
                <Pie
                    data={portfolioData}
                    dataKey="value"
                    nameKey="token"
                    innerRadius={70}
                    outerRadius={100}
                    strokeWidth={4}
                    stroke="hsl(var(--background))"
                >
                    <Label
                        content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                return (
                                    <text
                                        x={viewBox.cx}
                                        y={viewBox.cy}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                    >
                                        <tspan
                                            x={viewBox.cx}
                                            y={viewBox.cy}
                                            className="fill-foreground text-xl font-bold"
                                        >
                                            ${totalValue.toFixed(2)}
                                        </tspan>
                                        <tspan
                                            x={viewBox.cx}
                                            y={(viewBox.cy || 0) + 16}
                                            className="fill-muted-foreground text-xs"
                                        >
                                            Total Value
                                        </tspan>
                                    </text>
                                )
                            }
                            return null
                        }}
                    />
                </Pie>
                <ChartLegend
                    content={<ChartLegendContent nameKey="token" />}
                    className="flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                />
            </PieChart>
        </ChartContainer>
        </ResponsiveContainer>
    )
} 