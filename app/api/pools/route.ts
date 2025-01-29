import { isWhitelistedPool } from '@/config/pool-whitelist'
import { readContract, NETWORK_ID } from '@/lib/coinbase'
import { PoolListItem, PoolDetail } from '@/types/pool'
import { AERODROME_VOTER_CONTRACT_ADDRESS } from '@/config/contracts'

export const revalidate = 60
 
const url = process.env.NEXT_PUBLIC_SUGAR_URL + '/api/pools'

export async function GET() {
  try {
    const listResponse = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const pools: PoolListItem[] = await listResponse.json();

    const whitelistedPools = pools.filter((pool: PoolListItem) => 
      isWhitelistedPool(pool.symbol)
    );

    const detailsArray: PoolDetail[] = [];
    for (const pool of whitelistedPools) {
      console.log("Processing pool:", pool.symbol, pool.address);
      
      const detailsResponse = await fetch(url + '/' + pool.address, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      try {
        // Get gauge address from Voter contract
        const gaugeAddress = await readContract({
          networkId: NETWORK_ID,
          contractAddress: AERODROME_VOTER_CONTRACT_ADDRESS as `0x${string}`,
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

        console.log("Gauge address for pool", pool.symbol, ":", gaugeAddress);
        console.log("Pool address:", pool.address)
        
        const details: PoolDetail = await detailsResponse.json();
        
        detailsArray.push(details);
      } catch (error) {
        console.error('Error getting gauge address for pool', pool.symbol, ':', error);
        const details: PoolDetail = await detailsResponse.json();
        detailsArray.push(details);
      }
    }

    return Response.json(detailsArray);
  } catch (error) {
    console.error('Error fetching pools:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch pools' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}