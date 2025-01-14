import { NextResponse } from 'next/server'
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk'

const API_KEY_NAME = process.env.CDP_API_KEY_NAME as string
const API_KEY_PRIVATE_KEY = process.env.CDP_API_KEY_PRIVATE_KEY as string

if (!API_KEY_NAME || !API_KEY_PRIVATE_KEY) {
  throw new Error("CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY must be set");
}

// Configure the SDK with API key name and private key
Coinbase.configure({
  apiKeyName: API_KEY_NAME,
  privateKey: API_KEY_PRIVATE_KEY.replace(/\\n/g, "\n"),
})

export async function GET(
  request: Request,
  context: { params: { walletId: string } }
) {
  try {
    // Properly await and destructure params
    const params = await Promise.resolve(context.params)
    const { walletId } = params
    
    console.log('Fetching balances for wallet:', walletId)
    const wallet = await Wallet.fetch(walletId)
    const address = await wallet.getDefaultAddress()
    // Fetch balances
    const balances = await address.listBalances()
    console.log('Balances:', balances)
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