"use client"

import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Position } from "@/types/position"
import { Button } from "./ui/button"
import { MoreHorizontal, ArrowUpToLine, ArrowDownToLine, Loader2 } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { toast } from "sonner"
import { DepositDialog } from "./deposit-dialog"

export function PositionsTable() {
    const [positions, setPositions] = useState<Position[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false)
    const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false)
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
    const [isWithdrawing, setIsWithdrawing] = useState(false)

    const { address } = useWallet()

    useEffect(() => {
        async function fetchPositions() {
            try {
                const response = await fetch("/api/positions")
                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || "Failed to fetch positions")
                }

                setPositions(data.positions)
            } catch (error) {
                setError(error instanceof Error ? error.message : "Unknown error")
            } finally {
                setLoading(false)
            }
        }

        fetchPositions()
    }, [])

    if (loading) {
        return <div>Loading positions...</div>
    }

    if (error) {
        return <div>Error: {error}</div>
    }

    if (positions.length === 0) {
        return <div>No liquidity positions found</div>
    }

    const getType = (position: Position) => {
        return position.pool.symbol.includes('vAMM') ? 'vAMM' : 'UNKNOWN'
    }

    const getStatus = (position: Position) => {
        if (position.pool.symbol.includes('vAMM')) {
            return <div className="text-emerald-500">Active</div>
        }
    }

    const getValue = (position: Position) => {
        return (Number(position.token0Amount) + Number(position.token1Amount))
    }

    const handleDepositClick = (position: Position) => {
        setSelectedPosition(position)
        setIsDepositDialogOpen(true)
    }

    const handleWithdrawClick = (position: Position) => {
        setSelectedPosition(position)
        setIsWithdrawDialogOpen(true)
    }

    const handleWithdraw = async () => {
        if (!selectedPosition) return;
        
        setIsWithdrawing(true)
        try {
            const response = await fetch('/api/withdrawal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    poolAddress: selectedPosition.pool.address,
                    amount: '100' // Withdraw 100%
                })
            });

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to withdraw');
            }

            toast.success("Withdrawal Successful", {
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
            setIsWithdrawDialogOpen(false)
        } catch (error) {
            console.error('Error withdrawing:', error);
            toast.error("Withdrawal Failed", {
                description: error instanceof Error ? error.message : "Unknown error occurred"
            })
        } finally {
            setIsWithdrawing(false)
        }
    };

    const formatNumber = (value: number) => {
        return value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
    }

    return (
        <>
            <div className="rounded-xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Pool</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>APR</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Value (USD)</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {positions.map((position, index) => (
                            <TableRow
                                key={index}
                                className="hover:bg-muted/50"
                            >
                                <TableCell>{position.pool.symbol}</TableCell>
                                <TableCell>{getType(position)}</TableCell>
                                <TableCell>{formatNumber(position.poolDetails.apr)}%</TableCell>
                                <TableCell>{getStatus(position)}</TableCell>
                                <TableCell className="text-right">${getValue(position).toLocaleString()}</TableCell>
                                <TableCell>
                                    <div className="flex justify-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Open menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleDepositClick(position)}>
                                                    <ArrowDownToLine className="mr-2 h-4 w-4" />
                                                    Deposit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleWithdrawClick(position)}>
                                                    <ArrowUpToLine className="mr-2 h-4 w-4" />
                                                    Withdraw
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Withdrawal</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to withdraw your liquidity from {selectedPosition?.pool.symbol}?
                            This will withdraw 100% of your staked LP tokens.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsWithdrawDialogOpen(false)}
                            disabled={isWithdrawing}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleWithdraw}
                            disabled={isWithdrawing}
                        >
                            {isWithdrawing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Withdrawing...
                                </>
                            ) : (
                                'Confirm Withdrawal'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DepositDialog 
                pool={selectedPosition?.pool ?? null}
                open={isDepositDialogOpen}
                onOpenChange={setIsDepositDialogOpen}
            />
        </>
    )
} 