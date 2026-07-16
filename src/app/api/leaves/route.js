import { NextResponse } from 'next/server';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const BASE_URL = 'https://erp.loyolacollege.edu';

export async function POST(request) {
  try {
    const jsessionId = request.cookies.get('JSESSIONID')?.value;
    if (!jsessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jar = new CookieJar();
    jar.setCookieSync(`JSESSIONID=${jsessionId}`, BASE_URL);
    const client = wrapper(axios.create({ jar }));

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

    const response = await client.post(
      `${BASE_URL}/loyolaonline/students/report/printLeaveApplication.jsp`,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': `${BASE_URL}/loyolaonline/students/report/studentLeaveApplication.jsp`
        },
        responseType: 'arraybuffer' // In case it's a PDF
      }
    );

    // Pass along the contentType (usually application/pdf or text/html)
    const contentType = response.headers['content-type'] || 'application/pdf';

    return new NextResponse(response.data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Optional: you can force download if it's a PDF
        // 'Content-Disposition': 'inline; filename="Leave_Application.pdf"'
      }
    });

  } catch (error) {
    console.error('Leave API Error:', error);
    return NextResponse.json({ error: 'Failed to generate leave application' }, { status: 500 });
  }
}
