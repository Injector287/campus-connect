import { NextResponse } from 'next/server';
import { hasValidWhitelistedSession, unauthorizedResponse } from '@/utils/auth';
import { db } from '@/lib/db';
import { syncSubjects } from '@/lib/syncEngine';

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
      select: { subjectsCache: true }
    });

    if (user && user.subjectsCache) {
      const cachedData = JSON.parse(user.subjectsCache);

      syncSubjects(registerNum).catch(err => {
        console.error('[Background Sync] Failed for subjects:', err.message);
      });

      const subjectsData = Array.isArray(cachedData) ? { categories: cachedData } : cachedData;
      return NextResponse.json({ success: true, ...subjectsData, isCached: true });
    } else {
      console.log(`[Subjects API] No cache found for ${registerNum}. Performing initial sync...`);
      const freshData = await syncSubjects(registerNum);

      const subjectsData = Array.isArray(freshData) ? { categories: freshData } : freshData;
      return NextResponse.json({ success: true, ...subjectsData, isCached: false });
    }
  } catch (error) {
    console.error('[Subjects API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch subjects data' }, { status: 500 });
  }
}

