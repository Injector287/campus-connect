import { NextResponse } from 'next/server';
import { fetchWithReauth } from '@/utils/erpFetch';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://erp.loyolacollege.edu';

export async function GET(request) {
  try {
    const { data: html, newSessionCookie } = await fetchWithReauth(request, `${BASE_URL}/loyolaonline/students/report/studentWiseSubjects.jsp`);
    const $ = cheerio.load(html);

    const categories = [];
    let currentCategory = { name: 'UNCATEGORIZED', subjects: [] };

    $('#tblStudentWiseSubjects tr').each((i, row) => {
        const tr = $(row);
        
        // Skip main header and subheader
        if (tr.find('.header').length > 0 || tr.hasClass('subheader')) {
            return;
        }

        const categoryTd = tr.find('td[colspan="6"]');
        if (categoryTd.length > 0) {
            // If we already have subjects in the current category, save it
            if (currentCategory.subjects.length > 0) {
                categories.push(currentCategory);
            }
            currentCategory = {
                name: categoryTd.text().trim(),
                subjects: []
            };
        } else {
            // It's a subject row
            const tds = tr.find('td');
            if (tds.length >= 5) {
                const semester = $(tds[0]).text().trim();
                const code = $(tds[1]).text().trim();
                const description = $(tds[2]).text().trim();
                const credit = $(tds[3]).text().trim();
                const faculty = $(tds[4]).text().trim();

                if (code && description) {
                    currentCategory.subjects.push({
                        semester,
                        code,
                        description,
                        credit,
                        faculty
                    });
                }
            }
        }
    });

    if (currentCategory.subjects.length > 0) {
        categories.push(currentCategory);
    }

    const response = NextResponse.json({ success: true, categories });
    if (newSessionCookie) {
        response.cookies.set(newSessionCookie);
    }
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch subjects data' }, { status: 500 });
  }
}
