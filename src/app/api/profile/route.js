import { NextResponse } from 'next/server';
import { hasValidWhitelistedSession, unauthorizedResponse } from '@/utils/auth';
import { db } from '@/lib/db';
import { syncProfile } from '@/lib/syncEngine';

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
      select: { profileCache: true }
    });

    if (user && user.profileCache) {
      const cachedData = JSON.parse(user.profileCache);

      syncProfile(registerNum).catch(err => {
        console.error('[Background Sync] Failed for profile:', err.message);
      });

      return NextResponse.json({ success: true, ...cachedData, isCached: true });
    } else {
      console.log(`[Profile API] No cache found for ${registerNum}. Performing initial sync...`);
      const freshData = await syncProfile(registerNum);

      return NextResponse.json({ success: true, ...freshData, isCached: false });
    }
  } catch (error) {
    console.error('[Profile API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile data' }, { status: 500 });
  }
}

