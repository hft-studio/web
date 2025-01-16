import { useEffect, useState } from 'react'
import { useUser } from './use-user'
import { createClient } from '@/lib/supabase/client'
import type { WalletData } from '@/types/wallet'
import { TokenPrices } from '@/lib/prices'

export function useWallet() {
  const { user } = useUser()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [balances, setBalances] = useState<Record<string, number> | null>(null)
  const [prices, setPrices] = useState<TokenPrices | null>(null)

  // Fetch prices from our custom API
  useEffect(() => {
    async function fetchPrices() {
      try {
        const response = await fetch('/api/prices')
        if (!response.ok) throw new Error('Failed to fetch prices')
        const data = await response.json()
        setPrices(data)
      } catch (err) {
        console.error("Error fetching prices:", err)
        // Fallback prices if API fails
        setPrices({
          eth: { price: 0 },
          usdc: { price: 1 }, // USDC should always be ~1
          weth: { price: 0 },
          btc: { price: 0 }
        })
      }
    }

    fetchPrices()
    // Refresh prices every minute
    const interval = setInterval(fetchPrices, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function fetchWallet() {
      if (!user) {
        setWallet(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch wallet data
        const supabase = createClient()
        const { data: walletData, error: walletError } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .single()
        
        if (walletError) throw walletError

        if (walletData) {
          setWallet(walletData)
          
          // Fetch wallet address
          const addressResponse = await fetch(`/api/wallet/${walletData.wallet_id}/address`)
          if (!addressResponse.ok) throw new Error('Failed to fetch wallet address')
          const addressData = await addressResponse.json()
          setAddress(addressData.address)

          // Fetch wallet balances
          const balancesResponse = await fetch(`/api/wallet/${walletData.wallet_id}/balances`)
          if (!balancesResponse.ok) throw new Error('Failed to fetch wallet balances')
          const balancesData = await balancesResponse.json()
          setBalances(balancesData)
        }
      } catch (err) {
        console.error("Error fetching wallet:", err)
        setError(err instanceof Error ? err : new Error("Failed to fetch wallet"))
      } finally {
        setLoading(false)
      }
    }

    fetchWallet()
  }, [user])

  return { wallet, loading, error, balances, address, prices }
} 