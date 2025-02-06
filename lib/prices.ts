import { productIds } from "@/lib/tokens"

export type TokenPrices = {
    [key: string]: {
        price: number
        change_24h?: number
    }
}

export async function fetchTokenPrices(): Promise<TokenPrices> {
    try {
        // Initialize prices with USDC hardcoded to 1
        const prices: TokenPrices = {
            usdc: {
                price: 1,
                change_24h: 0
            }
        }

        // Get list of product IDs to fetch
        const tokens = Object.entries(productIds)

        await Promise.all(
            tokens.map(async ([token, productId]) => {
                try {
                    const url = `https://api.coinbase.com/api/v3/brokerage/market/products/${productId}`
                    const response = await fetch(url, {
                        next: { revalidate: 60 } // Cache for 1 minute
                    })

                    if (!response.ok) {
                        throw new Error(`Failed to fetch price for ${productId}`)
                    }

                    const data = await response.json()
                    prices[token] = {
                        price: parseFloat(data.price),
                        // You might want to add 24h change calculation here if available in the API
                        change_24h: 0 // Placeholder for now
                    }
                } catch (error) {
                    console.error(`Error fetching ${productId}:`, error)
                    // Continue with other tokens if one fails
                }
            })
        )

        return prices
    } catch (error) {
        console.error("Error fetching prices:", error)
        throw error
    }
} 