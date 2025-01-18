import { NextResponse } from 'next/server'
import { Wallet, NETWORK_ID } from '@/lib/coinbase'
import { createClient } from '@/lib/supabase/server'
import { encryptSeed } from '@/lib/encryption'

export async function GET() {
  try {
    // Create a new wallet if no walletId provided
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (!user || userError) {
      throw new Error(userError?.message || 'No user found')
    }

    // Create new wallet
    const newWallet = await Wallet.create({ networkId: NETWORK_ID })
    const defaultAddress = await newWallet.getDefaultAddress()
    const walletId = newWallet.getId()
    const exportWallet = await newWallet.export()

    // Encrypt the seed before storing
    const encryptedSeed = encryptSeed(exportWallet.seed)

    // Store wallet in database
    const { error: insertError } = await supabase
      .from('wallets')
      .insert([{ 
        user_id: user.id, 
        wallet_id: exportWallet.walletId, 
        encrypted_seed: encryptedSeed 
      }])

    if (insertError) {
      throw new Error(insertError.message)
    }

    return NextResponse.json({ walletId, address: defaultAddress.getId() })
  } catch (error) {
    console.error('Error creating wallet:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create wallet' },
      { status: 500 }
    )
  }
}