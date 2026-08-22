import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { fetchWithReauth } from '@/utils/erpFetch';
import { hasValidWhitelistedSession, unauthorizedResponse } from '@/utils/auth';
import { db } from '@/lib/db';
import { syncLeaves } from '@/lib/syncEngine';
import { getCacheStatus } from '@/utils/cacheManager';

const BASE_URL = 'https://erp.loyolacollege.edu';

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
      select: { leavesCache: true, lastSyncLeaves: true }
    });

    const cacheStatus = getCacheStatus(user?.lastSyncLeaves, force);

    if (user && user.leavesCache) {
      const cachedData = JSON.parse(user.leavesCache);
      const diffMins = user.lastSyncLeaves ? Math.floor((new Date().getTime() - user.lastSyncLeaves.getTime()) / (1000 * 60)) : 0;
      
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
        data: { lastSyncLeaves: new Date() }
      });

      console.log(`[Leaves API] Background sync scheduled for ${registerNum}. Reason: ${cacheStatus.reason}`);
      after(async () => {
        try {
          await syncLeaves(registerNum);
        } catch (err) {
          console.error(`[Background Sync] Failed for leaves:`, err.message);
        }
      });

      return NextResponse.json({ success: true, ...cachedData, isCached: true, lastSyncMinutesAgo: diffMins });
    } else {
      console.log(`[Leaves API] No cache found for ${registerNum}. Performing initial blocking sync...`);
      const freshData = await syncLeaves(registerNum);

      return NextResponse.json({ success: true, ...freshData, isCached: false, lastSyncMinutesAgo: 0 });
    }
  } catch (error) {
    console.error('[Leaves API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaves data' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!(await hasValidWhitelistedSession(request))) {
      return unauthorizedResponse();
    }


    const body = await request.json();
    
    // Convert to application/x-www-form-urlencoded expected by the ERP
    const formData = new URLSearchParams();
    formData.append('txtFromDate', body.txtFromDate);
    formData.append('txtToDate', body.txtToDate);
    formData.append('txtnoofDays', body.txtnoofDays);
    formData.append('txtReason', body.txtReason);
    formData.append('txtAssigment', body.txtAssigment);
    formData.append('hdnLeaveType', body.hdnLeaveType);

    const { data: responseData, newSessionCookie, headers } = await fetchWithReauth(
      request,
      `${BASE_URL}/loyolaonline/students/report/printLeaveApplication.jsp`,
      {
        method: 'POST',
        data: formData.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': `${BASE_URL}/loyolaonline/students/report/studentLeaveApplication.jsp`
        },
        responseType: 'arraybuffer' // In case it's a PDF
      }
    );

    // Pass along the contentType (usually application/pdf or text/html)
    const contentType = (headers && headers['content-type']) || 'application/pdf';

    const response = new NextResponse(responseData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Optional: you can force download if it's a PDF
        // 'Content-Disposition': 'inline; filename="Leave_Application.pdf"'
      }
    });

    if (newSessionCookie) {
        response.cookies.set(newSessionCookie);
    }
    
    return response;

  } catch (error) {
    console.error('Leave API Error:', error);
    return NextResponse.json({ error: 'Failed to generate leave application', details: error.message, stack: error.stack }, { status: 500 });
  }
}

