import { NextResponse } from 'next/server';
import { fetchWithReauth } from '@/utils/erpFetch';
import { hasValidWhitelistedSession, unauthorizedResponse } from '@/utils/auth';
import puppeteer from 'puppeteer';

const BASE_URL = 'https://erp.loyolacollege.edu';

export async function GET(request) {
    try {
        if (!hasValidWhitelistedSession(request)) {
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

        const htmlString = Buffer.from(res.data).toString('utf-8');
        const injectedHtml = htmlString.replace('<head>', '<head><base href="https://erp.loyolacollege.edu/loyolaonline/students/report/" />');

        // Generate PDF using Puppeteer
        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(injectedHtml, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Disposition', 'attachment; filename="Receipt.pdf"');

        const response = new NextResponse(pdfBuffer, { headers });
        
        if (res.newSessionCookie) {
            response.cookies.set(res.newSessionCookie);
        }
        
        return response;
    } catch (error) {
        console.error('Receipt API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch receipt', details: error.message, stack: error.stack }, { status: 500 });
    }
}
