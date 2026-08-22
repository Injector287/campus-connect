import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { hasValidWhitelistedSession, unauthorizedResponse } from '@/utils/auth';
import { db } from '@/lib/db';
import { syncGrades } from '@/lib/syncEngine';
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
      select: { gradesCache: true, lastSyncGrades: true }
    });

    const cacheStatus = getCacheStatus(user?.lastSyncGrades, force);

    if (user && user.gradesCache) {
      const cachedData = JSON.parse(user.gradesCache);
      const diffMins = user.lastSyncGrades ? Math.floor((new Date().getTime() - user.lastSyncGrades.getTime()) / (1000 * 60)) : 0;
      const responseData = cachedData.grades ? cachedData : { ...cachedData, grades: cachedData };
      
      if (!cacheStatus.shouldSync) {
         return NextResponse.json({ 
           success: true, 
           ...responseData, 
           isCached: true, 
           lastSyncMinutesAgo: diffMins,
           cooldownRemaining: cacheStatus.cooldownRemaining 
         });
      }

      await db.user.update({
        where: { registerNum },
        data: { lastSyncGrades: new Date() }
      });

      if (force) {
        console.log(`[Grades API] Foreground sync scheduled for ${registerNum}. Reason: ${cacheStatus.reason}`);
        const freshData = await syncGrades(registerNum);
        const gradesData = freshData.grades ? freshData : { ...freshData, grades: freshData };
        return NextResponse.json({ success: true, ...gradesData, isCached: false, lastSyncMinutesAgo: 0, cooldownRemaining: 5 });
      } else {
        console.log(`[Grades API] Background sync scheduled for ${registerNum}. Reason: ${cacheStatus.reason}`);
        after(async () => {
          try {
            await syncGrades(registerNum);
          } catch (err) {
            console.error('[Background Sync] Failed for grades:', err.message);
          }
        });
        return NextResponse.json({ success: true, ...responseData, isCached: true, lastSyncMinutesAgo: diffMins, cooldownRemaining: cacheStatus.cooldownRemaining });
      }
    } else {
      console.log(`[Grades API] No cache found for ${registerNum}. Performing initial blocking sync...`);
      const freshData = await syncGrades(registerNum);
      const gradesData = freshData.grades ? freshData : { ...freshData, grades: freshData };
      return NextResponse.json({ success: true, ...gradesData, isCached: false, lastSyncMinutesAgo: 0 });
    }
  } catch (error) {
    console.error('[Grades API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch grades data' }, { status: 500 });
  }
}
