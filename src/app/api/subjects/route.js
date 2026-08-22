import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { hasValidWhitelistedSession, unauthorizedResponse } from '@/utils/auth';
import { db } from '@/lib/db';
import { syncSubjects } from '@/lib/syncEngine';
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
      select: { subjectsCache: true, lastSyncSubjects: true }
    });

    const cacheStatus = getCacheStatus(user?.lastSyncSubjects, force);

    if (user && user.subjectsCache) {
      const cachedData = JSON.parse(user.subjectsCache);
      const subjectsData = Array.isArray(cachedData) ? { categories: cachedData } : cachedData;
      const diffMins = user.lastSyncSubjects ? Math.floor((new Date().getTime() - user.lastSyncSubjects.getTime()) / (1000 * 60)) : 0;
      
      if (!cacheStatus.shouldSync) {
         return NextResponse.json({ 
           success: true, 
           ...subjectsData, 
           isCached: true, 
           lastSyncMinutesAgo: diffMins,
           cooldownRemaining: cacheStatus.cooldownRemaining 
         });
      }

      // Optimistically update the sync timestamp to act as a mutex lock
      // This prevents race conditions if the user spams F5 before the background sync finishes
      await db.user.update({
        where: { registerNum },
        data: { lastSyncSubjects: new Date() }
      });

      if (force) {
        console.log(`[Subjects API] Foreground sync scheduled for ${registerNum}. Reason: ${cacheStatus.reason}`);
        const freshData = await syncSubjects(registerNum);
        const freshSubjectsData = Array.isArray(freshData) ? { categories: freshData } : freshData;
        return NextResponse.json({ success: true, ...freshSubjectsData, isCached: false, lastSyncMinutesAgo: 0, cooldownRemaining: 5 });
      } else {
        console.log(`[Subjects API] Background sync scheduled for ${registerNum}. Reason: ${cacheStatus.reason}`);
        after(async () => {
          try {
            await syncSubjects(registerNum);
          } catch (err) {
            console.error(`[Background Sync] Failed for subjects:`, err.message);
          }
        });
        return NextResponse.json({ success: true, ...subjectsData, isCached: true, lastSyncMinutesAgo: diffMins, cooldownRemaining: cacheStatus.cooldownRemaining });
      }
    } else {
      console.log(`[Subjects API] No cache found for ${registerNum}. Performing initial blocking sync...`);
      const freshData = await syncSubjects(registerNum);

      const subjectsData = Array.isArray(freshData) ? { categories: freshData } : freshData;
      return NextResponse.json({ success: true, ...subjectsData, isCached: false });
    }
  } catch (error) {
    console.error('[Subjects API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch subjects data' }, { status: 500 });
  }
}

