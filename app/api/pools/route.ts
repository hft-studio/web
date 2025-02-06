import { isWhitelistedPool } from '@/config/pool-whitelist'
import { readContract, NETWORK_ID } from '@/lib/coinbase'
import { PoolListItem, PoolDetail } from '@/types/pool'
import { getPoolDetails, getPoolList } from '@/lib/aerodrome'

export const revalidate = 60
 
export async function GET() {
  try {
    const pools = await getPoolList()

    const whitelistedPools = pools.filter((pool: PoolListItem) => 
      isWhitelistedPool(pool.symbol)
    );

    const detailsArray: PoolDetail[] = [];
    for (const pool of whitelistedPools) {
      const details = await getPoolDetails(pool.address);
        detailsArray.push(details);
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