import { NextResponse } from 'next/server';
import { hasValidWhitelistedSession, unauthorizedResponse } from '@/utils/auth';
import { db } from '@/lib/db';
import { syncDashboard } from '@/lib/syncEngine';

export async function GET(request) {
  try {
    if (!(await hasValidWhitelistedSession(request))) {
      return unauthorizedResponse();
    }

    const registerNum = request.cookies.get('ERP_USERNAME')?.value;
    if (!registerNum) {
      return unauthorizedResponse();
    }

    // 1. Check if we have cached data for this user
    const user = await db.user.findUnique({
      where: { registerNum },
      select: { dashboardCache: true }
    });

    if (user && user.dashboardCache) {
      // 2. We have cached data! Return it instantly to the user for a lightning-fast UI.
      const cachedData = JSON.parse(user.dashboardCache);
      
      // 3. Trigger a background sync to fetch the latest data from the ERP.
      // We do NOT await this, so the API responds immediately.
      syncDashboard(registerNum).catch(err => {
        console.error('[Background Sync] Failed for dashboard:', err.message);
      });

      return NextResponse.json({ success: true, ...cachedData, isCached: true });
    } else {
      // 4. No cached data (first login or cache cleared). We must wait for the sync to finish.
      console.log(`[Dashboard API] No cache found for ${registerNum}. Performing initial sync...`);
      const freshData = await syncDashboard(registerNum);
      
      return NextResponse.json({ success: true, ...freshData, isCached: false });
    }
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
