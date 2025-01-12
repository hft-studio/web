import { useEffect, useState } from 'react'
import { useUser } from './use-user'

interface WalletData {
  wallet_id: string
  network: string
}

interface UseWalletReturn {
  wallet: WalletData | null
  loading: boolean
  error: Error | null
}

export function useWallet(): UseWalletReturn {
  const { user } = useUser()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function loadWallet() {
      if (!user) {
        setWallet(null)
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/wallet')
        if (!response.ok) {
          throw new Error('Failed to fetch wallet')
        }
        const data = await response.json()
        setWallet(data)
      } catch (err) {
        console.error('Error loading wallet:', err)
        setError(err instanceof Error ? err : new Error('Failed to load wallet'))
      } finally {
        setLoading(false)
      }
    }

    loadWallet()
  }, [user])

  return { wallet, loading, error }
} 