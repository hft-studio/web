import { Position } from "@/types/position";
import { readContract } from "@/lib/coinbase";
import { NETWORK_ID } from "@/lib/coinbase";
import { Pool, PoolListItem } from "@/types/pool";
import { getWallet } from "@/lib/wallet";

const url = process.env.NEXT_PUBLIC_SUGAR_URL + '/api/pools'

export const getPoolDetails = async (
    address: string
) => {
    const response = await fetch(url + '/' + address, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const poolDetails = await response.json();
  return poolDetails;
}

export const getPoolList = async () => {
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    const pools: PoolListItem[] = await response.json();
    return pools;
}

export async function getPosition(pool: Pool, prices: any): Promise<Position> {
    const { defaultWallet, defaultAddress } = await getWallet();
    console.log(pool)

    // Get pool balance
    const poolBalance = await defaultWallet.getBalance(pool.address);

    console.log("Pool Balance:", poolBalance);

    const poolDetails = await getPoolDetails(pool.address);

    // Get gauge balance
    let gaugeBalance = "0";
    let gaugeTotalSupply = "0";
    try {
        // First get the gauge address from the Voter contract
        const voterAddress = "0x16613524e02ad97eDfeF371bC883F2F5d6C480A5"; // Voter contract on Base
        const poolGauge = await readContract({
            networkId: NETWORK_ID,
            contractAddress: voterAddress as `0x${string}`,
            method: "gauges",
            args: { pool: pool.address },
            abi: [{
                inputs: [{ name: "pool", type: "address" }],
                name: "gauges",
                outputs: [{ name: "", type: "address" }],
                stateMutability: "view",
                type: "function"
            }]
        }) as string;

        console.log("Pool gauge address:", poolGauge);

        if (poolGauge && poolGauge !== "0x0000000000000000000000000000000000000000") {
            // Now get the gauge balance using the correct gauge address
            gaugeBalance = (await readContract({
                networkId: NETWORK_ID,
                contractAddress: poolGauge as `0x${string}`,
                method: "balanceOf",
                args: { account: defaultAddress },
                abi: [{
                    inputs: [{ name: "account", type: "address" }],
                    name: "balanceOf",
                    outputs: [{ name: "", type: "uint256" }],
                    stateMutability: "view",
                    type: "function"
                }]
            }) as bigint).toString();

            gaugeTotalSupply = (await readContract({
                networkId: NETWORK_ID,
                contractAddress: poolGauge as `0x${string}`,
                method: "totalSupply",
                args: {},
                abi: [{
                    inputs: [],
                    name: "totalSupply",
                    outputs: [{ name: "", type: "uint256" }],
                    stateMutability: "view",
                    type: "function"
                }]
            }) as bigint).toString();

            console.log("Gauge Balance:", gaugeBalance);
            console.log("Gauge Total Supply:", gaugeTotalSupply);
        } else {
            console.log("No gauge found for pool");
        }
    } catch (error) {
        console.log("Error getting gauge balance:", error);
        // Continue with pool balance only
    }
    console.log(gaugeBalance, gaugeTotalSupply)

    const share = Number(gaugeBalance) / Number(gaugeTotalSupply)
    console.log("Share:", share)
    console.log(share * pool.reserve0_usd)
    console.log(share * pool.reserve1_usd)
    // Total balance is pool + gauge
    const totalBalance = (Number(poolBalance) + Number(gaugeBalance)).toString();
    console.log("Total Balance:", totalBalance);


    // Convert decimal reserves to integers by multiplying by their respective decimals
    const reserve0Integer = BigInt(Math.floor(Number(pool.reserve0) * 1e6)); // USDC has 6 decimals
    const reserve1Integer = BigInt(Math.floor(Number(pool.reserve1) * 1e8)); // cbBTC has 8 decimals

    console.log('reserve0Integer', reserve0Integer)
    console.log('reserve1Integer', reserve1Integer)

    // Calculate total amounts
    const token0Amount = share * pool.reserve0_usd;
    const token1Amount = share * pool.reserve1_usd;
    // Calculate USD value


    const position: Position = {
        pool,
        token0Amount: token0Amount.toString(),
        token1Amount: token1Amount.toString(),
        poolDetails: poolDetails,
    };
    console.log(position)
    return position
}