import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NETWORK_ID, readContract, Wallet } from "@/lib/coinbase";
import { decryptSeed } from "@/lib/encryption";
import { AERODROME_VOTER_CONTRACT_ADDRESS } from "@/config/contracts";

export async function POST(request: Request) {
    try {
        const { poolAddress } = await request.json();

        if (!poolAddress) {
            return NextResponse.json(
                { error: "Pool address is required" },
                { status: 400 }
            );
        }

        // Get user from session
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (!user || userError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user's wallet
        const { data: walletData, error: walletError } = await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (!walletData || walletError) {
            return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
        }

        // Initialize wallet
        const wallet = await Wallet.fetch(walletData.wallet_id);
        const seed = await decryptSeed(walletData.encrypted_seed);
        wallet.setSeed(seed);

        // Get the wallet's default address
        const defaultAddress = await wallet.getDefaultAddress();
        // Get the gauge address
        const gaugeAddress = await readContract({
            networkId: NETWORK_ID,
            contractAddress: AERODROME_VOTER_CONTRACT_ADDRESS as `0x${string}`,
            method: "gauges",
            args: { pool: poolAddress },
            abi: [{
                inputs: [{ name: "pool", type: "address" }],
                name: "gauges",
                outputs: [{ name: "", type: "address" }],
                stateMutability: "view",
                type: "function"
            }]
        }) as string;

        // Check if there are any rewards to claim
        const earned = await readContract({
            networkId: NETWORK_ID,
            contractAddress: gaugeAddress as `0x${string}`,
            method: "earned",
            args: { account: defaultAddress.getId() },
            abi: [{
                inputs: [{ name: "account", type: "address" }],
                name: "earned",
                outputs: [{ name: "", type: "uint256" }],
                stateMutability: "view",
                type: "function"
            }]
        }) as bigint;

        if (earned <= BigInt(0)) {
            return NextResponse.json({ error: "No rewards to claim" }, { status: 400 });
        }

        try {
            // Get the reward token address
            const rewardToken = await readContract({
                networkId: NETWORK_ID,
                contractAddress: gaugeAddress as `0x${string}`,
                method: "rewardToken",
                args: {},
                abi: [{
                    inputs: [],
                    name: "rewardToken",
                    outputs: [{ name: "", type: "address" }],
                    stateMutability: "view",
                    type: "function"
                }]
            }) as string;

            console.log("Reward token address:", rewardToken);

            // Claim rewards from gauge
            const claimTx = await wallet.invokeContract({
                contractAddress: gaugeAddress as `0x${string}`,
                method: "getReward",
                args: {
                    account: defaultAddress.getId()
                },
                abi: [{
                    inputs: [
                        { name: "account", type: "address" }
                    ],
                    name: "getReward",
                    outputs: [],
                    stateMutability: "nonpayable",
                    type: "function"
                }]
            });

            await claimTx.wait();
            return NextResponse.json({
                success: true,
                txHash: claimTx.getTransactionHash()
            });

        } catch (error) {
            console.error("Error claiming rewards:", error);
            throw error;
        }

    } catch (error) {
        console.error("Error processing claim:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
