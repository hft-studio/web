import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Wallet } from '@/lib/coinbase/config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletId: string }> }
) {
  try {
    const { walletId } = await params
    const wallet = await Wallet.fetch(walletId)
    const address = await wallet.getDefaultAddress()
    // Fetch balances
    const balances = await address.listBalances()
    const formattedBalances: Record<string, number> = {}
    balances.forEach((balance, currency) => {
      formattedBalances[currency] = parseFloat(balance.toString())
    })

    return NextResponse.json(formattedBalances)
  } catch (error) {
    console.error('Error fetching balances:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch balances' },
      { status: 500 }
    )
  }
} 
