import { NextResponse } from 'next/server';
import { hasValidWhitelistedSession, unauthorizedResponse } from '@/utils/auth';
import { db } from '@/lib/db';
import { syncGrades } from '@/lib/syncEngine';

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
      select: { gradesCache: true }
    });

    if (user && user.gradesCache) {
      const cachedData = JSON.parse(user.gradesCache);

      syncGrades(registerNum).catch(err => {
        console.error('[Background Sync] Failed for grades:', err.message);
      });

      const gradesData = cachedData.grades ? cachedData : { ...cachedData, grades: cachedData };
      return NextResponse.json({ success: true, ...gradesData, isCached: true });
    } else {
      console.log(`[Grades API] No cache found for ${registerNum}. Performing initial sync...`);
      const freshData = await syncGrades(registerNum);

      const gradesData = freshData.grades ? freshData : { ...freshData, grades: freshData };
      return NextResponse.json({ success: true, ...gradesData, isCached: false });
    }
  } catch (error) {
    console.error('[Grades API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch grades data' }, { status: 500 });
  }
}

