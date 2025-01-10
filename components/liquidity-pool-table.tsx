"use client"

import { useEffect, useState } from "react"
import { PoolDetail } from "@/types/pool"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function LiquidityPoolTable() {
  const [pools, setPools] = useState<PoolDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  const handleDeposit = (pool: PoolDetail) => {
    console.log('Deposit clicked for pool:', pool.symbol)
    // Add deposit logic here
  }

  if (isLoading) {
    return <div>Loading pools...</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pool</TableHead>
          <TableHead className="text-right">TVL</TableHead>
          <TableHead className="text-right">Volume</TableHead>
          <TableHead className="text-right">APR</TableHead>
          <TableHead className="text-right">Fees</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pools.map((pool) => (
          <TableRow key={pool.address}>
            <TableCell>{pool.symbol}</TableCell>
            <TableCell className="text-right">${pool.tvl.toLocaleString()}</TableCell>
            <TableCell className="text-right">${pool.volume.toLocaleString()}</TableCell>
            <TableCell className="text-right">{pool.apr.toFixed(2)}%</TableCell>
            <TableCell className="text-right">{pool.pool_fee}%</TableCell>
            <TableCell className="text-right">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => handleDeposit(pool)}
              >
                Deposit
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

