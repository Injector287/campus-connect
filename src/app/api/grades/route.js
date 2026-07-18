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

    const resInternal = await fetchWithReauth(request, `${BASE_URL}/loyolaonline/students/report/studentInternalMarkDetails.jsp`);
    const activeJsessionId = resInternal.jsessionId || request.cookies.get('JSESSIONID')?.value;
    const resExam = await fetchWithReauth(request, `${BASE_URL}/loyolaonline/students/report/studentExamResultsDetails.jsp`, { overrideJsessionId: activeJsessionId });

    // Parse Internal Marks
    const $int = cheerio.load(resInternal.data);
    const internalMarks = [];
    $int('#tblSubjectWiseInternalMarks > tbody > tr').each((i, row) => {
        const tr = $int(row);
        if (tr.attr('onclick')) {
            const tds = tr.find('td');
            const code = $int(tds[0]).text().trim();
            const desc = $int(tds[1]).text().trim();
            const obtained = $int(tds[2]).text().trim();
            const max = $int(tds[3]).text().trim();
            
            const nextTr = tr.next('tr');
            const components = [];
            nextTr.find('#tblComponentWiseMarks tr').each((j, cRow) => {
                 const cTds = $int(cRow).find('td');
                 if (cTds.length >= 3) {
                     components.push({
                         name: $int(cTds[0]).text().trim(),
                         mark: $int(cTds[2]).text().trim()
                     });
                 }
            });
            internalMarks.push({ code, desc, obtained, max, components });
        }
    });

    // Parse Exam Marks
    const $ex = cheerio.load(resExam.data);
    const examMarks = [];
    let currentCategory = 'Other';
    $ex('#tdExamResults > tbody > tr').each((i, row) => {
        const tr = $ex(row);
        
        // Track the current subject category (e.g., "MC (MAJOR (CORE))")
        const tdColspan = tr.find('td[colspan="11"]');
        if (tdColspan.length > 0) {
            const text = tdColspan.text().trim();
            if (text && !text.startsWith('Part ')) {
                currentCategory = text;
            }
        }

        if (tr.hasClass('table-bordered')) {
             const tds = tr.find('td');
             if (tds.length >= 11) {
                 const semester = $ex(tds[0]).text().trim();
                 const code = $ex(tds[1]).text().trim();
                 const desc = $ex(tds[2]).text().trim();
                 const internal = $ex(tds[3]).text().trim();
                 const external = $ex(tds[4]).text().trim();
                 const total = $ex(tds[5]).text().trim();
                 const credit = $ex(tds[6]).text().trim();
                 const grade = $ex(tds[7]).text().trim();
                 const points = $ex(tds[8]).text().trim();
                 const monthYear = $ex(tds[9]).text().trim();
                 const result = $ex(tds[10]).text().trim();

                 if (code && desc) {
                     examMarks.push({ semester, code, desc, internal, external, total, credit, grade, points, monthYear, result, category: currentCategory });
                 }
             }
        }
    });

    // Extract Summary Credits from Exam Marks page
    let totalCredits = '', acquiredCredits = '', remainingCredits = '';
    $ex('table.ui-widget-content tr').each((i, row) => {
        const text = $ex(row).text();
        if (text.includes('Total Credits:')) totalCredits = $ex(row).find('td').last().text().trim();
        if (text.includes('Acquired Credits:')) acquiredCredits = $ex(row).find('td').last().text().trim();
        if (text.includes('Remaining Credits:')) remainingCredits = $ex(row).find('td').last().text().trim();
    });

    const response = NextResponse.json({ 
        success: true, 
        grades: { 
            internalMarks, 
            examMarks,
            summary: { totalCredits, acquiredCredits, remainingCredits }
        } 
    });
    if (resInternal.newSessionCookie) {
        response.cookies.set(resInternal.newSessionCookie);
    }
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch grades data' }, { status: 500 });
  }
}
