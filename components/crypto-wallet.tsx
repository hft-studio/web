import { useState } from 'react'
import { Copy, CheckCircle2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Asset {
  name: string
  symbol: string
  balance: number
  value: number
}

export function CryptoWallet() {
  const [copied, setCopied] = useState(false)
  const address = "0x1234...5678"
  const assets: Asset[] = [
    { name: "Bitcoin", symbol: "BTC", balance: 0.5, value: 15000 },
    { name: "Ethereum", symbol: "ETH", balance: 2.5, value: 5000 },
    { name: "USD Coin", symbol: "USDC", balance: 1000, value: 1000 },
  ]

  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Wallet Address</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">{address}</span>
          <Button variant="ghost" size="icon" onClick={copyAddress}>
            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Assets</h2>
        <ul className="space-y-4">
          {assets.map((asset) => (
            <li key={asset.symbol} className="flex justify-between items-center">
              <div>
                <p className="font-medium">{asset.name}</p>
                <p className="text-sm text-muted-foreground">{asset.symbol}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{asset.balance} {asset.symbol}</p>
                <p className="text-sm text-muted-foreground">${asset.value.toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Deposit USDC</h2>
        <div className="flex space-x-2">
          <Input type="number" placeholder="Amount" />
          <Button>Deposit</Button>
        </div>
      </div>
    </div>
  )
}