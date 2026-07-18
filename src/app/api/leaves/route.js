import { NextResponse } from 'next/server';
import { fetchWithReauth } from '@/utils/erpFetch';
import { hasValidWhitelistedSession, unauthorizedResponse } from '@/utils/auth';

const BASE_URL = 'https://erp.loyolacollege.edu';

export async function POST(request) {
  try {
    if (!hasValidWhitelistedSession(request)) {
      return unauthorizedResponse();
    }


    const body = await request.json();
    
    // Convert to application/x-www-form-urlencoded expected by the ERP
    const formData = new URLSearchParams();
    formData.append('optLeaveType', body.optLeaveType);
    formData.append('txtFromDate', body.txtFromDate);
    formData.append('hdnFromDate', body.hdnFromDate);
    formData.append('txtToDate', body.txtToDate);
    formData.append('hdnToDate', body.hdnToDate);
    formData.append('txtnoofDays', body.txtnoofDays);
    formData.append('txtReason', body.txtReason);
    formData.append('txtAssigment', body.txtAssigment);
    formData.append('hdnLeaveType', body.hdnLeaveType);
    formData.append('cmdGenChallan', 'Print');

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
    const contentType = headers['content-type'] || 'application/pdf';

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
    return NextResponse.json({ error: 'Failed to generate leave application' }, { status: 500 });
  }
}
