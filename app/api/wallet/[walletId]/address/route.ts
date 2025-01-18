import { NextRequest, NextResponse } from 'next/server'
import { Wallet } from '@/lib/coinbase'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ walletId: string }> }
) {
    try {
        const { walletId } = await params
        const wallet = await Wallet.fetch(walletId)
        const address = await wallet.getDefaultAddress()
        
        return NextResponse.json({
            address: address.getId()
        })
    } catch (error) {
        console.error('Error fetching wallet address:', error)
        return NextResponse.json(
            { error: 'Failed to fetch wallet address' },
            { status: 500 }
        )
    }
} 