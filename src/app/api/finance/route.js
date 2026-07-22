import { NextResponse } from 'next/server';
import { hasValidWhitelistedSession, unauthorizedResponse } from '@/utils/auth';
import { db } from '@/lib/db';
import { syncFinance } from '@/lib/syncEngine';

export async function GET(request) {
  try {
    if (!(await hasValidWhitelistedSession(request))) {
      return unauthorizedResponse();
    }

    const registerNum = request.cookies.get('ERP_USERNAME')?.value;
    if (!registerNum) {
      return unauthorizedResponse();
    }

    const user = await db.user.findUnique({
      where: { registerNum },
      select: { financeCache: true }
    });

    if (user && user.financeCache) {
      const cachedData = JSON.parse(user.financeCache);
      
      syncFinance(registerNum).catch(err => {
        console.error('[Background Sync] Failed for finance:', err.message);
      });

      return NextResponse.json({ success: true, ...cachedData, isCached: true });
    } else {
      console.log(`[Finance API] No cache found for ${registerNum}. Performing initial sync...`);
      const freshData = await syncFinance(registerNum);
      
      return NextResponse.json({ success: true, ...freshData, isCached: false });
    }
  } catch (error) {
    console.error('[Finance API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch finance data' }, { status: 500 });
  }
}
