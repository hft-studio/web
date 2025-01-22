import { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PositionsTable } from "@/components/positions-table"

export const metadata: Metadata = {
    title: "Liquidity Positions",
    description: "View your liquidity positions across all pools",
}

export default function PositionsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Liquidity Positions</h2>
            </div>
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Active Positions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PositionsTable />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 