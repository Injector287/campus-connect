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

    const [dueRes, paidRes, txRes, leaveRes] = await Promise.all([
      fetchWithReauth(request, `${BASE_URL}/loyolaonline/students/report/studentFeeDueDetails.jsp`),
      fetchWithReauth(request, `${BASE_URL}/loyolaonline/students/report/studentFinanceDetails.jsp`),
      fetchWithReauth(request, `${BASE_URL}/loyolaonline/students/report/studentOnlinePaymentAcknowledgements.jsp`),
      fetchWithReauth(request, `${BASE_URL}/loyolaonline/students/report/studentLeaveApplication.jsp`)
    ]);

    const parseTables = (html) => {
        const $ = cheerio.load(html);
        const tables = [];
        $('table').each((i, tbl) => {
            const rows = [];
            $(tbl).find('tr').each((j, tr) => {
                const cells = [];
                $(tr).find('th, td').each((k, td) => {
                    const text = $(td).text().trim().replace(/\s+/g, ' ');
                    const href = $(td).find('a').attr('href') || null;
                    const cellHtml = $(td).html(); // Capture raw HTML for debugging
                    cells.push({ text, href, html: cellHtml });
                });
                if (cells.length > 0) rows.push(cells);
            });
            if (rows.length > 0) tables.push(rows);
        });
        return tables;
    };

    const dueTablesRaw = parseTables(dueRes.data);
    const paidTablesRaw = parseTables(paidRes.data);
    const txTablesRaw = parseTables(txRes.data);

    const $tx = cheerio.load(txRes.data);
    $tx('script').each((i, el) => {
        const script = $tx(el).html();
        if (script && script.includes('funViewPaymentAcknowledgement')) {
            console.log('DEBUG FUNC SCRIPT:', script);
        }
    });

    // Process Due
    let dueDetails = { status: 'no_dues', data: [] };
    for (const rows of dueTablesRaw) {
        const dataRows = rows.filter(r => r.length >= 4);
        if (dataRows.length > 0) {
            let startIndex = 0;
            if (dataRows[0].some(c => c.text.toLowerCase().includes('academic') || c.text.toLowerCase().includes('due'))) {
                startIndex = 1;
            }
            if (dataRows.length > startIndex) {
                dueDetails.status = 'has_dues';
                dueDetails.data = dataRows.slice(startIndex).map(row => ({
                    academicYear: row[0]?.text || '',
                    category: row[1]?.text || '',
                    dueDate: row[2]?.text || '',
                    dueAmount: row[3]?.text || '',
                    balance: row[4]?.text || ''
                }));
            }
            break;
        }
    }

    // Process Paid
    let paidHistory = [];
    for (const rows of paidTablesRaw) {
        const dataRows = rows.filter(r => r.length >= 6);
        if (dataRows.length > 0) {
            let startIndex = 0;
            if (dataRows[0].some(c => {
                const s = c.text.toLowerCase();
                return s.includes('academic') || s.includes('year') || s.includes('term') || s.includes('fee type') || s.includes('category');
            })) {
                startIndex = 1;
            }
            paidHistory = dataRows.slice(startIndex).map(row => ({
                academicYear: row[0]?.text || '',
                category: row[1]?.text || '',
                dueDate: row[2]?.text || '',
                dueAmount: row[3]?.text || '',
                receiptDate: row[4]?.text || '',
                paymentMode: row[5]?.text || '',
                receiptNo: row[6]?.text || '',
                receiptAmount: row[7]?.text || '',
                balance: row[8]?.text || ''
            }));
            break;
        }
    }

    // Process Transactions
    let transactions = [];
    for (const rows of txTablesRaw) {
        const dataRows = rows.filter(r => r.length >= 6);
        if (dataRows.length > 0) {
            let startIndex = 0;
            if (dataRows[0].some(c => c.text.toLowerCase().includes('receipt') || c.text.toLowerCase().includes('fee'))) {
                startIndex = 1;
            }
            transactions = dataRows.slice(startIndex).map(row => {
                const slNo = row[0]?.text || '';
                const receiptNo = row[1]?.text || '';
                
                // Check if any cell has the acknowledgement button
                const hasAck = row.some(c => c.html && c.html.includes('funViewPaymentAcknowledgement'));
                const ackUrl = hasAck && receiptNo ? `onlinePaymentAcknowledgementView.jsp?ReceiptId=${receiptNo}` : null;
                
                return {
                    slNo,
                    receiptNo,
                    feeType: row[2]?.text || '',
                    receiptDate: row[3]?.text || '',
                    amount: row[4]?.text || '',
                    paymentMode: row[5]?.text || '',
                    status: row[6]?.text || '',
                    ackUrl
                };
            });
            break;
        }
    }

    const result = { due: dueDetails, history: paidHistory, transactions };

    const response = NextResponse.json({ success: true, ...result });
    if (dueRes.newSessionCookie) {
        response.cookies.set(dueRes.newSessionCookie);
    }
    return response;
  } catch (error) {
    console.error('Finance API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch finance data' }, { status: 500 });
  }
}
