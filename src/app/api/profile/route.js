import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { hasValidWhitelistedSession, unauthorizedResponse } from '@/utils/auth';
import { db } from '@/lib/db';
import { syncProfile } from '@/lib/syncEngine';
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
      select: { profileCache: true, role: true, mobileNav: true }
    });

    const userRole = user?.role || 'USER';

    const cacheStatus = getCacheStatus(user?.lastSyncProfile, force);

    if (user && user.profileCache) {
      const cachedData = JSON.parse(user.profileCache);
      const diffMins = user.lastSyncProfile ? Math.floor((new Date().getTime() - user.lastSyncProfile.getTime()) / (1000 * 60)) : 0;
      
      if (!cacheStatus.shouldSync) {
         return NextResponse.json({ 
           success: true, 
           role: userRole,
           mobileNav: user?.mobileNav,
           ...cachedData, 
           isCached: true, 
           lastSyncMinutesAgo: diffMins,
           cooldownRemaining: cacheStatus.cooldownRemaining 
         });
      }

      // Optimistically update the sync timestamp to act as a mutex lock
      // This prevents race conditions if the user spams F5 before the background sync finishes
      await db.user.update({
        where: { registerNum },
        data: { lastSyncProfile: new Date() }
      });

      if (force) {
        console.log(`[Profile API] Foreground sync scheduled for ${registerNum}. Reason: ${cacheStatus.reason}`);
        const freshData = await syncProfile(registerNum);
        return NextResponse.json({ success: true, role: userRole, mobileNav: user?.mobileNav, ...freshData, isCached: false, lastSyncMinutesAgo: 0, cooldownRemaining: 5 });
      } else {
        console.log(`[Profile API] Background sync scheduled for ${registerNum}. Reason: ${cacheStatus.reason}`);
        after(async () => {
          try {
            await syncProfile(registerNum);
          } catch (err) {
            console.error(`[Background Sync] Failed for profile:`, err.message);
          }
        });
        return NextResponse.json({ success: true, role: userRole, mobileNav: user?.mobileNav, ...cachedData, isCached: true, lastSyncMinutesAgo: diffMins, cooldownRemaining: cacheStatus.cooldownRemaining });
      }
    } else {
      console.log(`[Profile API] No cache found for ${registerNum}. Performing initial blocking sync...`);
      const freshData = await syncProfile(registerNum);

      return NextResponse.json({ success: true, role: userRole, mobileNav: user?.mobileNav, ...freshData, isCached: false });
    }
  } catch (error) {
    console.error('[Profile API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile data' }, { status: 500 });
  }
}

