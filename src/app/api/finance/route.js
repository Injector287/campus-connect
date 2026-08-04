import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { hasValidWhitelistedSession, unauthorizedResponse } from '@/utils/auth';
import { db } from '@/lib/db';
import { syncFinance } from '@/lib/syncEngine';
import { getCacheStatus } from '@/utils/cacheManager';

export async function GET(request) {
  try {
    if (!(await hasValidWhitelistedSession(request))) {
      return unauthorizedResponse();
    }

    const registerNum = request.cookies.get('ERP_USERNAME')?.value;
    if (!registerNum) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const user = await db.user.findUnique({
      where: { registerNum },
      select: { financeCache: true, lastSyncFinance: true }
    });

    const cacheStatus = getCacheStatus(user?.lastSyncFinance, force);

    if (user && user.financeCache) {
      const cachedData = JSON.parse(user.financeCache);
      const diffMins = user.lastSyncFinance ? Math.floor((new Date().getTime() - user.lastSyncFinance.getTime()) / (1000 * 60)) : 0;
      
      if (!cacheStatus.shouldSync) {
         return NextResponse.json({ 
           success: true, 
           ...cachedData, 
           isCached: true, 
           lastSyncMinutesAgo: diffMins,
           cooldownRemaining: cacheStatus.cooldownRemaining 
         });
      }

      // If sync needed, schedule it in the background using after() and return cache instantly
      // Optimistically update the sync timestamp to act as a mutex lock
      // This prevents race conditions if the user spams F5 before the background sync finishes
      await db.user.update({
        where: { registerNum },
        data: { lastSyncFinance: new Date() }
      });

      console.log(`[Finance API] Background sync scheduled for ${registerNum}. Reason: ${cacheStatus.reason}`);
      after(async () => {
        try {
          await syncFinance(registerNum);
        } catch (err) {
          console.error('[Background Sync] Failed for finance:', err.message);
        }
      });

      return NextResponse.json({ success: true, ...cachedData, isCached: true, lastSyncMinutesAgo: diffMins });
    } else {
      console.log(`[Finance API] No cache found for ${registerNum}. Performing initial blocking sync...`);
      const freshData = await syncFinance(registerNum);
      
      return NextResponse.json({ success: true, ...freshData, isCached: false, lastSyncMinutesAgo: 0 });
    }
  } catch (error) {
    console.error('[Finance API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch finance data' }, { status: 500 });
  }
}
