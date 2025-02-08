import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NETWORK_ID, readContract, Wallet } from "@/lib/coinbase";
import { decryptSeed } from "@/lib/encryption";
import { AERODROME_ROUTER_CONTRACT_ADDRESS, AERODROME_VOTER_CONTRACT_ADDRESS } from "@/config/contracts";

export async function POST(request: Request) {
    try {
        const { poolAddress, amount } = await request.json();

        if (!poolAddress || !amount) {
            return NextResponse.json(
                { error: "Pool address and amount are required" },
                { status: 400 }
            );
        }

        const poolDataUrl = `${process.env.NEXT_PUBLIC_SUGAR_URL}/api/pools/${poolAddress}`;
        const poolResponse = await fetch(poolDataUrl);
        const poolData = await poolResponse.json();

        if (!poolData) {
            return NextResponse.json({ error: "Pool not found" }, { status: 404 });
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

        const wallet = await Wallet.fetch(walletData.wallet_id);
        const seed = await decryptSeed(walletData.encrypted_seed);
        wallet.setSeed(seed);

        const defaultAddress = await wallet.getDefaultAddress();
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


        const stakedBalance = await readContract({
            networkId: NETWORK_ID,
            contractAddress: gaugeAddress as `0x${string}`,
            method: "balanceOf",
            args: { account: defaultAddress.getId() },
            abi: [{
                inputs: [{ name: "account", type: "address" }],
                name: "balanceOf",
                outputs: [{ name: "", type: "uint256" }],
                stateMutability: "view",
                type: "function"
            }]
        }) as bigint;

        const unstakedBalance = await readContract({
            networkId: NETWORK_ID,
            contractAddress: poolAddress as `0x${string}`,
            method: "balanceOf",
            args: { account: defaultAddress.getId() },
            abi: [{
                inputs: [{ name: "account", type: "address" }],
                name: "balanceOf",
                outputs: [{ name: "", type: "uint256" }],
                stateMutability: "view",
                type: "function"
            }]
        }) as bigint;

        if (stakedBalance <= BigInt(0) && unstakedBalance <= BigInt(0)) {
            return NextResponse.json({ error: "No LP tokens to withdraw" }, { status: 400 });
        }

        try {
            let lpTokensToRemove = unstakedBalance;

            if (stakedBalance > BigInt(0)) {
                const withdrawTx = await wallet.invokeContract({
                    contractAddress: gaugeAddress as `0x${string}`,
                    method: "withdraw",
                    args: {
                        amount: stakedBalance.toString()
                    },
                    abi: [{
                        inputs: [{ name: "amount", type: "uint256" }],
                        name: "withdraw",
                        outputs: [],
                        stateMutability: "nonpayable",
                        type: "function"
                    }]
                });

                await withdrawTx.wait();
                lpTokensToRemove = unstakedBalance + stakedBalance;
            }

            if (lpTokensToRemove <= BigInt(0)) {
                return NextResponse.json({ error: "No LP tokens available after withdrawal" }, { status: 400 });
            }

            const approveLPTx = await wallet.invokeContract({
                contractAddress: poolAddress as `0x${string}`,
                method: "approve",
                args: {
                    spender: AERODROME_ROUTER_CONTRACT_ADDRESS,
                    amount: lpTokensToRemove.toString()
                },
                abi: [{
                    constant: false,
                    inputs: [
                        { name: "spender", type: "address" },
                        { name: "amount", type: "uint256" }
                    ],
                    name: "approve",
                    outputs: [{ name: "", type: "bool" }],
                    payable: false,
                    stateMutability: "nonpayable",
                    type: "function"
                }]
            });
            await approveLPTx.wait();
            const allowance = await readContract({
                networkId: NETWORK_ID,
                contractAddress: poolAddress as `0x${string}`,
                method: "allowance",
                args: { 
                    owner: defaultAddress.getId(),
                    spender: AERODROME_ROUTER_CONTRACT_ADDRESS
                },
                abi: [{
                    inputs: [
                        { name: "owner", type: "address" },
                        { name: "spender", type: "address" }
                    ],
                    name: "allowance",
                    outputs: [{ name: "", type: "uint256" }],
                    stateMutability: "view",
                    type: "function"
                }]
            }) as bigint;

            if (allowance < lpTokensToRemove) {
                throw new Error("Approval failed - allowance not set correctly");
            }

            const removeLiquidityTx = await wallet.invokeContract({
                contractAddress: AERODROME_ROUTER_CONTRACT_ADDRESS as `0x${string}`,
                method: "removeLiquidity",
                args: {
                    tokenA: poolData.token0.address,
                    tokenB: poolData.token1.address,
                    stable: poolData.is_stable,
                    liquidity: lpTokensToRemove.toString(),
                    amountAMin: "0",
                    amountBMin: "0",
                    to: defaultAddress.getId(),
                    deadline: (Math.floor(Date.now() / 1000) + 3600).toString()
                },
                abi: [{
                    inputs: [
                        { name: "tokenA", type: "address" },
                        { name: "tokenB", type: "address" },
                        { name: "stable", type: "bool" },
                        { name: "liquidity", type: "uint256" },
                        { name: "amountAMin", type: "uint256" },
                        { name: "amountBMin", type: "uint256" },
                        { name: "to", type: "address" },
                        { name: "deadline", type: "uint256" }
                    ],
                    name: "removeLiquidity",
                    outputs: [
                        { name: "amountA", type: "uint256" },
                        { name: "amountB", type: "uint256" }
                    ],
                    stateMutability: "nonpayable",
                    type: "function"
                }]
            });

            await removeLiquidityTx.wait();
            return NextResponse.json({
                success: true,
                txHash: removeLiquidityTx.getTransactionHash()
            });

        } catch (error) {
            console.error("Error withdrawing or removing liquidity:", error);
            throw error;
        }

    } catch (error) {
        console.error("Error processing withdrawal:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}