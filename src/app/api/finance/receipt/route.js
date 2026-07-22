import { NextResponse } from 'next/server';
import { fetchWithReauth } from '@/utils/erpFetch';
import { hasValidWhitelistedSession, unauthorizedResponse } from '@/utils/auth';

const BASE_URL = 'https://erp.loyolacollege.edu';

export async function GET(request) {
    try {
        if (!(await hasValidWhitelistedSession(request))) {
            return unauthorizedResponse();
        }

        const { searchParams } = new URL(request.url);
        const urlParam = searchParams.get('url');

        if (!urlParam) {
            return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
        }

        let fullUrl = urlParam;
        if (!fullUrl.startsWith('http')) {
            if (fullUrl.startsWith('/')) {
                fullUrl = `${BASE_URL}${fullUrl}`;
            } else {
                fullUrl = `${BASE_URL}/loyolaonline/students/report/${fullUrl}`;
            }
        }

        const res = await fetchWithReauth(request, fullUrl, { responseType: 'arraybuffer' });

        let data = res.data;
        const headers = new Headers();
        const contentType = res.headers && res.headers['content-type'] ? res.headers['content-type'] : 'text/html';
        
        // If it's HTML, inject a base tag so CSS and images load correctly from the original ERP
        if (contentType.includes('text/html')) {
            const htmlString = Buffer.from(res.data).toString('utf-8');
            // Check if there's already an onload attribute, if not add one to trigger print automatically
            let injectedHtml = htmlString.replace('<head>', '<head><base href="https://erp.loyolacollege.edu/loyolaonline/students/report/" />');
            if (!injectedHtml.includes('onload="')) {
                injectedHtml = injectedHtml.replace('<body', '<body onload="window.print();"');
            }
            data = injectedHtml;
        }

        headers.set('Content-Type', contentType);

        const response = new NextResponse(data, { headers });
        
        if (res.newSessionCookie) {
            response.cookies.set(res.newSessionCookie);
        }
        
        return response;
    } catch (error) {
        console.error('Receipt API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch receipt', details: error.message, stack: error.stack }, { status: 500 });
    }
}
