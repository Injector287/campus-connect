import { NextResponse } from 'next/server';
import { hasValidWhitelistedSession, unauthorizedResponse } from '@/utils/auth';
import { db } from '@/lib/db';
import { syncLibrary } from '@/lib/syncEngine';

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
      select: { libraryCache: true }
    });

    if (user && user.libraryCache) {
      const cachedData = JSON.parse(user.libraryCache);

      syncLibrary(registerNum).catch(err => {
        console.error('[Background Sync] Failed for library:', err.message);
      });

      const libraryData = cachedData.library ? cachedData : { ...cachedData, library: cachedData };
      return NextResponse.json({ success: true, ...libraryData, isCached: true });
    } else {
      console.log(`[Library API] No cache found for ${registerNum}. Performing initial sync...`);
      const freshData = await syncLibrary(registerNum);

      const libraryData = freshData.library ? freshData : { ...freshData, library: freshData };
      return NextResponse.json({ success: true, ...libraryData, isCached: false });
    }
  } catch (error) {
    console.error('[Library API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch library data' }, { status: 500 });
  }
}

