import { productIds } from "@/lib/tokens"
import { PriceData } from "@/types/position"

export async function fetchTokenPrices(): Promise<PriceData> {
    try {
        // Initialize prices with USDC hardcoded to 1
        const prices: PriceData = {
            usdc: 1
        }

        // Get list of product IDs to fetch
        const tokens = Object.entries(productIds)

        await Promise.all(
            tokens.map(async ([token, productId]) => {
                try {
                    const url = `https://api.coinbase.com/v3/brokerage/products/${productId}/ticker`
                    const response = await fetch(url, {
                        next: { revalidate: 60 }, // Cache for 1 minute
                        headers: {
                            'Accept': 'application/json'
                        }
                    })

                    if (!response.ok) {
                        throw new Error(`Failed to fetch price for ${productId}: ${response.statusText}`)
                    }

                    const text = await response.text()
                    let data
                    try {
                        data = JSON.parse(text)
                    } catch (parseError) {
                        console.error(`Error parsing JSON for ${productId}:`, text)
                        throw parseError
                    }
                    
                    // Check if we have a valid price in the response
                    if (data?.price) {
                        prices[token.toLowerCase()] = parseFloat(data.price)
                        console.log(`Price for ${token}: ${prices[token.toLowerCase()]} USD`)
                    } else {
                        console.error(`Invalid price data for ${productId}:`, data)
                    }
                } catch (error) {
                    console.error(`Error fetching ${productId}:`, error)
                    // Set a fallback price or handle the error as needed
                    if (token.toLowerCase() === 'eth') {
                        prices[token.toLowerCase()] = 3500 // Fallback ETH price
                    } else if (token.toLowerCase() === 'btc') {
                        prices[token.toLowerCase()] = 65000 // Fallback BTC price
                    }
                }
            })
        )

        console.log("Final prices:", prices)
        return prices
    } catch (error) {
        console.error("Error fetching prices:", error)
        // Return fallback prices if everything fails
        return {
            usdc: 1,
            eth: 3500,
            btc: 65000
        }
    }
} 