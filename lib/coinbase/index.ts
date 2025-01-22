import { Coinbase } from '@coinbase/coinbase-sdk'

export const API_KEY_NAME = process.env.CDP_API_KEY_NAME as string
export const API_KEY_PRIVATE_KEY = process.env.CDP_API_KEY_PRIVATE_KEY as string

if (!API_KEY_NAME || !API_KEY_PRIVATE_KEY) {
  throw new Error("CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY must be set")
}

// Configure the SDK with API key name and private key
export const initCoinbase = () => {
  Coinbase.configure({
    apiKeyName: API_KEY_NAME,
    privateKey: API_KEY_PRIVATE_KEY.replace(/\\n/g, "\n"),
  })
}

// Initialize on import
initCoinbase()

// Network configuration
export const NETWORK_ID = Coinbase.networks.BaseMainnet

// Re-export Coinbase and Wallet for convenience
export { Coinbase, Wallet, readContract } from '@coinbase/coinbase-sdk'


