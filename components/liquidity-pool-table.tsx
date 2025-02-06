"use client"

import { useEffect, useState } from "react"
import { PoolDetail } from "@/types/pool"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DepositDialog } from "./deposit-dialog"

export function LiquidityPoolTable() {
  const [pools, setPools] = useState<PoolDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false)
  const [selectedPool, setSelectedPool] = useState<PoolDetail | null>(null)

  useEffect(() => {
    async function fetchPools() {
      try {
        const response = await fetch('/api/pools')
        const data = await response.json()
        setPools(data)
      } catch (error) {
        console.error('Error fetching pools:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPools()
  }, [])

  const handleDepositClick = (pool: PoolDetail) => {
    setSelectedPool(pool)
    setIsDepositDialogOpen(true)
  }

  const formatNumber = (value: number) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  if (isLoading) {
    return <div>Loading pools...</div>
  }

  return (
    <>
      <div className="rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Pool</TableHead>
              <TableHead className="text-right">TVL</TableHead>
              <TableHead className="text-right">Volume</TableHead>
              <TableHead className="text-right">APR</TableHead>
              <TableHead className="text-right">Fees</TableHead>
              <TableHead className="text-right w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pools.map((pool) => (
              <TableRow 
                key={pool.address}
                className="hover:bg-muted/50"
              >
                <TableCell>{pool.symbol}</TableCell>
                <TableCell className="text-right">${formatNumber(pool.tvl)}</TableCell>
                <TableCell className="text-right">${formatNumber(pool.volume)}</TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="text-right">
                        {formatNumber(pool.apr)}%
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="grid gap-2">
                          <p className="font-medium">APR Breakdown</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>Trading Fees</div>
                            <div className="text-right">{formatNumber(pool.epoch_data.fees)}%</div>
                            <div>Rewards</div>
                            <div className="text-right">{formatNumber(pool.epoch_data.bribes)}%</div>
                            <div className="font-medium">Total APR</div>
                            <div className="text-right font-medium">{formatNumber(pool.apr)}%</div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-right">{formatNumber(pool.pool_fee)}%</TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDepositClick(pool)}
                          className="h-8 w-8"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add Liquidity</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DepositDialog 
        pool={selectedPool}
        open={isDepositDialogOpen}
        onOpenChange={setIsDepositDialogOpen}
      />
    </>
  )
}