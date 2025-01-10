import { isWhitelistedPool } from '@/config/pool-whitelist'
import { PoolListItem, PoolDetail } from '@/types/pool'

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
      const detailsResponse = await fetch(url + '/' + pool.address, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const details: PoolDetail = await detailsResponse.json();
      detailsArray.push(details);
    }

    return Response.json(detailsArray);
  } catch (error) {
    console.error('Error fetching pools:', error);
    return Response.error();
  }
}