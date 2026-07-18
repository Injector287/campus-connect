import { NextResponse } from 'next/server';
import { fetchWithReauth } from '@/utils/erpFetch';
import { hasValidWhitelistedSession, unauthorizedResponse } from '@/utils/auth';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://erp.loyolacollege.edu';

export async function GET(request) {
  try {
        if (!hasValidWhitelistedSession(request)) {
            return unauthorizedResponse();
        }

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    };

    // Fetch all three tabs, serializing the first to handle any session re-auth safely
    const res1 = await fetchWithReauth(request, `${BASE_URL}/loyolaonline/students/report/studentLibraryDetailsInner.jsp`, {
        method: 'POST',
        data: 'ids=1&filter=',
        headers
    });
    const activeJsessionId = res1.jsessionId || request.cookies.get('JSESSIONID')?.value;

    const [res2, res3] = await Promise.all([
        fetchWithReauth(request, `${BASE_URL}/loyolaonline/students/report/studentLibraryDetailsInner.jsp`, { method: 'POST', data: 'ids=2&filter=', headers, overrideJsessionId: activeJsessionId }),
        fetchWithReauth(request, `${BASE_URL}/loyolaonline/students/report/studentLibraryDetailsInner.jsp`, { method: 'POST', data: 'ids=3&filter=', headers, overrideJsessionId: activeJsessionId })
    ]);

    const parseTable = (html, tableId) => {
        const $ = cheerio.load(html);
        const results = [];
        $(`#${tableId} tr`).each((i, el) => {
            if ($(el).hasClass('subheader')) return;
            const cols = $(el).find('td');
            // Skip empty rows or "No Fine(s) found" messages
            if (cols.length <= 1) return; 
            
            const row = [];
            cols.each((j, col) => {
                row.push($(col).text().trim());
            });
            if (row.length > 0) results.push(row);
        });
        return results;
    };

    const booksInHandRaw = parseTable(res1.data, 'tblBooksInHand');
    const activitiesRaw = parseTable(res2.data, 'tblLibraryActivities');
    const finesRaw = parseTable(res3.data, 'tblLibraryFineDetails');

    // Map to nice JSON objects
    const booksInHand = booksInHandRaw.map(row => ({
        accessionNo: row[0], title: row[1], borrowedDate: row[2], dueDate: row[3]
    }));

    const activities = activitiesRaw.map(row => ({
        accessionNo: row[0], title: row[1], borrowedDate: row[2], dueDate: row[3], returnedDate: row[4]
    }));

    const fines = finesRaw.map(row => ({
        accessionNo: row[0], title: row[1], borrowedDate: row[2], dueDate: row[3], returnedDate: row[4], fineAmount: row[5], status: row[6]
    }));

    const response = NextResponse.json({ 
        success: true, 
        library: { booksInHand, activities, fines } 
    });
    if (res1.newSessionCookie) {
        response.cookies.set(res1.newSessionCookie);
    }
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch library data' }, { status: 500 });
  }
}
