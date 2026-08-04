import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { hasValidWhitelistedSession, unauthorizedResponse } from '@/utils/auth';
import { db } from '@/lib/db';
import { syncLibrary } from '@/lib/syncEngine';
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
      select: { libraryCache: true, lastSyncLibrary: true }
    });

    const cacheStatus = getCacheStatus(user?.lastSyncLibrary, force);

    if (user && user.libraryCache) {
      const cachedData = JSON.parse(user.libraryCache);
      const diffMins = user.lastSyncLibrary ? Math.floor((new Date().getTime() - user.lastSyncLibrary.getTime()) / (1000 * 60)) : 0;
      
      if (!cacheStatus.shouldSync) {
         return NextResponse.json({ 
           success: true, 
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
        data: { lastSyncLibrary: new Date() }
      });

      console.log(`[Library API] Background sync scheduled for ${registerNum}. Reason: ${cacheStatus.reason}`);
      after(async () => {
        try {
          await syncLibrary(registerNum);
        } catch (err) {
          console.error(`[Background Sync] Failed for library:`, err.message);
        }
      });

      return NextResponse.json({ success: true, ...cachedData, isCached: true, lastSyncMinutesAgo: diffMins });
    } else {
      console.log(`[Library API] No cache found for ${registerNum}. Performing initial blocking sync...`);
      const freshData = await syncLibrary(registerNum);

      const libraryData = freshData.library ? freshData : { ...freshData, library: freshData };
      return NextResponse.json({ success: true, ...libraryData, isCached: false });
    }
  } catch (error) {
    console.error('[Library API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch library data' }, { status: 500 });
  }
}

