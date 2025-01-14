import { NextResponse } from "next/server"
import { Coinbase, Wallet } from "@coinbase/coinbase-sdk"

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
    console.log('walletId', walletId)
    
    const wallet = await Wallet.fetch(walletId)
    const address = await wallet.getDefaultAddress()
    const addressId = await address.getId()
    console.log('addressId', addressId)
    return NextResponse.json({ address: addressId })
  } catch (error) {
    console.error('Error fetching wallet address:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch wallet address' },
      { status: 500 }
    )
  }
} 