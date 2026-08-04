import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { hasValidWhitelistedSession, unauthorizedResponse } from '@/utils/auth';
import { db } from '@/lib/db';
import { syncDashboard } from '@/lib/syncEngine';
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

    // 1. Check if we have cached data for this user
    const user = await db.user.findUnique({
      where: { registerNum },
      select: { dashboardCache: true, lastSyncDashboard: true }
    });

    const cacheStatus = getCacheStatus(user?.lastSyncDashboard, force);

    if (user && user.dashboardCache) {
      const cachedData = JSON.parse(user.dashboardCache);
      const diffMins = user.lastSyncDashboard ? Math.floor((new Date().getTime() - user.lastSyncDashboard.getTime()) / (1000 * 60)) : 0;
      
      if (!cacheStatus.shouldSync) {
         // Return cache instantly
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
        data: { lastSyncDashboard: new Date() }
      });

      console.log(`[Dashboard API] Background sync scheduled for ${registerNum}. Reason: ${cacheStatus.reason}`);
      after(async () => {
        try {
          await syncDashboard(registerNum);
        } catch (syncErr) {
          console.error('[Dashboard API] Background sync failed:', syncErr.message);
        }
      });
      
      return NextResponse.json({ success: true, ...cachedData, isCached: true, lastSyncMinutesAgo: diffMins });
    } else {
      // 4. No cached data (first login or cache cleared). We must wait for the sync to finish.
      console.log(`[Dashboard API] No cache found for ${registerNum}. Performing initial sync...`);
      const freshData = await syncDashboard(registerNum);
      
      return NextResponse.json({ success: true, ...freshData, isCached: false, lastSyncMinutesAgo: 0 });
    }
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
