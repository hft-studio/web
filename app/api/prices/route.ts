import { NextResponse } from "next/server";
import { productIds } from "@/lib/tokens";

export async function GET() {
  try {
    // Initialize prices with USDC hardcoded to 1
    const prices: Record<string, number> = {
      usdc: 1, // USDC is always 1 USD
    };

    // Get list of product IDs to fetch
    const tokens = Object.entries(productIds);

    await Promise.all(
      tokens.map(async ([token, productId]) => {
        try {
        const url = `https://api.coinbase.com/api/v3/brokerage/market/products/${productId}`
          const response = await fetch(
            url
          );
          
          if (!response.ok) {
            console.log(url)
            throw new Error(`Failed to fetch price for ${productId}`);
          }

          const data = await response.json();
          prices[token] = parseFloat(data.price);
        } catch (error) {

          console.error(`Error fetching ${productId}:`, error);
          // Continue with other tokens if one fails
        }
      })
    );

    return NextResponse.json(prices);
  } catch (error) {
    console.error("Error fetching prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
} 