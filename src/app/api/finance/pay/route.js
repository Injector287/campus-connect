import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decrypt } from '@/utils/crypto';
import { loginToERP } from '@/utils/erpFetch';

export async function GET(request) {
  try {
    const username = request.cookies.get('ERP_USERNAME')?.value;
    if (!username) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    let jsessionId = request.cookies.get('JSESSIONID')?.value;

    // Try to login to get a fresh JSESSIONID if we don't have one
    if (!jsessionId) {
        const user = await db.user.findUnique({ where: { registerNum: username } });
        if (user && user.password) {
            const password = decrypt(user.password);
            if (password) {
                jsessionId = await loginToERP(username, password);
            }
        }
    }
    
    if (!jsessionId) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Redirect to the ERP fee due details page with the jsessionid in the URL
    // Tomcat automatically consumes ;jsessionid=... to establish the session
    const erpUrl = `https://erp.loyolacollege.edu/loyolaonline/students/report/studentFeeDueDetails.jsp;jsessionid=${jsessionId}`;
    return NextResponse.redirect(erpUrl);
  } catch (error) {
    console.error('[Pay Redirect API] Error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
