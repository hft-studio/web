import { createClient } from '../../../lib/supabase/server'
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk'
import { NextResponse } from 'next/server'

const NETWORK_ID = Coinbase.networks.BaseSepolia
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

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) throw authError
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has a wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (walletError && walletError.code !== 'PGRST116') {
      throw walletError
    }

    if (!wallet) {
      // Create new wallet if none exists
      const newWallet = await Wallet.create({ networkId: NETWORK_ID })
      const exportData = await newWallet.export()

      // Request faucet funds if on BaseSepolia
      if (NETWORK_ID === Coinbase.networks.BaseSepolia) {
        const address = await newWallet.getDefaultAddress()
        try {
          await address.faucet()
        } catch (faucetError) {
          console.error('Faucet request failed:', faucetError)
          // Continue even if faucet fails - wallet creation was successful
        }
      }

      // Store the new wallet
      const { error: insertError } = await supabase
        .from('wallets')
        .insert({
          user_id: user.id,
          wallet_id: exportData.walletId,
          encrypted_seed: exportData.seed
        })

      if (insertError) throw insertError

      return NextResponse.json({
        wallet_id: exportData.walletId,
        network: NETWORK_ID
      })
    }

    return NextResponse.json({
      wallet_id: wallet.wallet_id,
      network: NETWORK_ID
    })
  } catch (error) {
    console.error('Error in wallet API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get wallet' },
      { status: 500 }
    )
  }
} 