import { NextResponse } from "next/server";
import { fetchTokenPrices } from "@/lib/prices";

export async function GET() {
  try {
    const prices = await fetchTokenPrices();
    return NextResponse.json(prices);
  } catch (error) {
    console.error("Error fetching prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
} 