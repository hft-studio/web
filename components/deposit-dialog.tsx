import { useState, useEffect } from "react"
import { PoolDetail } from "@/types/pool"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface DepositDialogProps {
  pool: PoolDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DepositDialog({ pool, open, onOpenChange }: DepositDialogProps) {
  const [depositAmount, setDepositAmount] = useState("")
  const [token1Amount, setToken1Amount] = useState("0")
  const [isDepositing, setIsDepositing] = useState(false)

  // Calculate token1 amount based on pool ratio when depositAmount changes
  useEffect(() => {
    if (pool && depositAmount) {
      const reserve0 = parseFloat(pool.reserve0)
      const reserve1 = parseFloat(pool.reserve1)
      if (reserve0 > 0) {
        const amount1 = (parseFloat(depositAmount) * reserve1) / reserve0
        setToken1Amount(amount1.toFixed(8)) // Use 8 decimals for BTC
      }
    } else {
      setToken1Amount("0")
    }
  }, [depositAmount, pool])

  const handleDeposit = async () => {
    if (!pool || !depositAmount) return;
    
    setIsDepositing(true)
    try {
      const response = await fetch('/api/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poolAddress: pool.address,
          amount: (parseFloat(depositAmount) * 1000000).toString() // Convert to USDC decimals
        })
      });

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deposit');
      }

      toast.success("Deposit Successful", {
        description: (
          <a 
            href={`https://basescan.org/tx/${data.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View transaction on Basescan
          </a>
        ),
      })
      onOpenChange(false)
      setDepositAmount("")
    } catch (error) {
      console.error('Error depositing:', error);
      toast.error("Deposit Failed", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      })
    } finally {
      setIsDepositing(false)
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deposit to {pool?.symbol}</DialogTitle>
          <DialogDescription>
            Enter the amount to deposit. The second token amount will be calculated automatically based on the current pool ratio.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">{pool?.token0.symbol} Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder={`Enter ${pool?.token0.symbol} amount`}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              disabled={isDepositing}
            />
          </div>
          <div className="grid gap-2">
            <Label>{pool?.token1.symbol} Amount (Calculated)</Label>
            <Input
              type="text"
              value={token1Amount}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Pool Ratio: 1 {pool?.token0.symbol} = {pool ? (parseFloat(pool.reserve1) / parseFloat(pool.reserve0)).toFixed(8) : '0'} {pool?.token1.symbol}
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isDepositing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeposit}
            disabled={isDepositing || !depositAmount || parseFloat(depositAmount) <= 0}
          >
            {isDepositing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Depositing...
              </>
            ) : (
              'Confirm Deposit'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 