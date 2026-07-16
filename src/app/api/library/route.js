import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://erp.loyolacollege.edu';

export async function GET(request) {
  try {
    const jsessionId = request.cookies.get('JSESSIONID')?.value;

    if (!jsessionId) {
      return NextResponse.json({ error: 'Unauthorized. No session found.' }, { status: 401 });
    }

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Cookie': `JSESSIONID=${jsessionId}`,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    };

    // Fetch all three tabs concurrently
    const [res1, res2, res3] = await Promise.all([
        axios.post(`${BASE_URL}/loyolaonline/students/report/studentLibraryDetailsInner.jsp`, 'ids=1&filter=', { headers }),
        axios.post(`${BASE_URL}/loyolaonline/students/report/studentLibraryDetailsInner.jsp`, 'ids=2&filter=', { headers }),
        axios.post(`${BASE_URL}/loyolaonline/students/report/studentLibraryDetailsInner.jsp`, 'ids=3&filter=', { headers })
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

    return NextResponse.json({ 
        success: true, 
        library: { booksInHand, activities, fines } 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch library data' }, { status: 500 });
  }
}
