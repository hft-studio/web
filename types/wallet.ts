export interface WalletData {
  wallet_id: string
  network: string
  balances?: Record<string, number>
  address: string
}

export interface WalletBalance {
  [currency: string]: number
} 