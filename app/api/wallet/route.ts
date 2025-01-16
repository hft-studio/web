import { createClient } from '../../../lib/supabase/server'

import { NextResponse } from 'next/server'
import { NETWORK_ID, Wallet } from '@/lib/coinbase/config'
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