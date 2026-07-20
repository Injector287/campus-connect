import { NextResponse } from 'next/server';
import { fetchWithReauth } from '@/utils/erpFetch';
import { hasValidWhitelistedSession, unauthorizedResponse } from '@/utils/auth';
import * as cheerio from 'cheerio';
import fs from 'fs';

const BASE_URL = 'https://erp.loyolacollege.edu';

export async function GET(request) {
  try {
    if (!hasValidWhitelistedSession(request)) {
      return unauthorizedResponse();
    }

    const [hourWiseRes, subjectWiseRes] = await Promise.all([
      fetchWithReauth(request, `${BASE_URL}/loyolaonline/students/report/studentHourWiseAttendance.jsp`),
      fetchWithReauth(request, `${BASE_URL}/loyolaonline/students/report/studentSubjectWiseAttendance.jsp`)
    ]);

    const html = hourWiseRes.data;
    const newSessionCookie = hourWiseRes.newSessionCookie || subjectWiseRes.newSessionCookie;
    const subjHtml = subjectWiseRes.data;

    // 1. Parse Hour Wise Attendance
    const $ = cheerio.load(html);

    // Extract stats for pie chart
    const stats = {
      workingDays: $('#hdnWorkingDays').val() || '0',
      hrsPresent: parseInt($('#hdnHrsPresent').val() || '0', 10),
      hrsAbsent: parseInt($('#hdnHrsAbsent').val() || '0', 10),
      hrsCL: parseInt($('#hdnCL').val() || '0', 10),
      hrsML: parseInt($('#hdnML').val() || '0', 10),
      hrsOD: parseInt($('#hdnOD').val() || '0', 10),
      hrsDA: parseInt($('#hdnDA').val() || '0', 10),
      hrsLA: parseInt($('#hdnLA').val() || '0', 10),
      hrsOverallAbsent: parseInt($('#hdnHrsOverAllAbsent').val() || '0', 10),
      presentPercentage: parseFloat($('#hdnPresentPercentage').val() || '0').toFixed(1),
    };

    // Extract ALL days
    const allDays = [];
    $('td[title$="Day"]').each((i, el) => {
       const dateNode = $(el);
       const dateStr = dateNode.text().trim(); // e.g. "15-Jul-2026"
       
       const hours = [];
       dateNode.nextAll('td').each((j, td) => {
          const status = $(td).text().trim() || '-';
          hours.push(status);
       });

       allDays.push({
           date: dateStr,
           hours: hours
       });
    });

    // Extract Outreach Attendance (if available)
    let outreachData = null;
    const outreachHeader = $('td').filter(function() {
        return $(this).text().trim().toUpperCase() === 'OUTREACH';
    }).first();
    if (outreachHeader.length > 0) {
        const outreachTable = outreachHeader.closest('table');
        const teamNameRow = outreachTable.find('tr').eq(1); // "School Teaching Team"
        const teamName = teamNameRow.text().trim();
        
        const records = [];
        let total = 0;
        let present = 0;
        let absent = 0;
        
        outreachTable.find('tr').each((i, row) => {
            const tr = $(row);
            const tds = tr.find('td');
            // Data rows don't have the 'subheader' class on the tr, but they have 2 tds
            if (tds.length === 2 && !tr.hasClass('subheader')) {
                const date = $(tds[0]).text().trim();
                const status = $(tds[1]).text().trim();
                if (date && status) {
                    records.push({ date, status });
                    total++;
                    if (status === 'P') present++;
                    else if (status === 'A') absent++;
                }
            }
        });
        
        if (total > 0) {
            outreachData = {
                team: teamName,
                total,
                present,
                absent,
                percentage: ((present / total) * 100).toFixed(1),
                records
            };
        }
    }

    // 2. Parse Subject Wise Attendance
    const $subj = cheerio.load(subjHtml);
    const subjectWise = [];
    
    // First, find the header row to dynamically determine column indices
    let colIndices = { code: 0, desc: 1, total: 2, absent: 3, present: 4, ml: 5, od: -1, pct: 6 };
    $subj('#tblSubjectWiseAttendance > tbody > tr').each((i, row) => {
        const tr = $subj(row);
        if (tr.hasClass('subheader') || tr.hasClass('header')) {
            tr.find('td, th').each((j, col) => {
                const text = $subj(col).text().trim().toUpperCase();
                if (text === 'TOTAL') colIndices.total = j;
                else if (text === 'ABSENT') colIndices.absent = j;
                else if (text === 'PRESENT') colIndices.present = j;
                else if (text === 'ML') colIndices.ml = j;
                else if (text === 'OD') colIndices.od = j;
                else if (text.includes('%') || text.includes('PERCENTAGE')) colIndices.pct = j;
            });
        }
    });

    $subj('#tblSubjectWiseAttendance > tbody > tr').each((i, row) => {
        const tr = $subj(row);
        if (tr.hasClass('header') || tr.hasClass('subheader1') || tr.hasClass('subheader') || tr.hasClass('subtotal')) return;
        
        const tds = tr.find('td');
        if (tds.length >= 7) {
            const code = $subj(tds[colIndices.code]).text().trim();
            const desc = $subj(tds[colIndices.desc]).text().trim();
            const total = parseInt($subj(tds[colIndices.total]).text().trim().replace(/&nbsp;/g, '')) || 0;
            const absent = parseInt($subj(tds[colIndices.absent]).text().trim().replace(/&nbsp;/g, '')) || 0;
            const present = parseInt($subj(tds[colIndices.present]).text().trim().replace(/&nbsp;/g, '')) || 0;
            
            const mlText = colIndices.ml !== -1 && tds[colIndices.ml] ? $subj(tds[colIndices.ml]).text().trim().replace(/&nbsp;/g, '') : '0';
            const ml = parseInt(mlText) || 0;
            
            const odText = colIndices.od !== -1 && tds[colIndices.od] ? $subj(tds[colIndices.od]).text().trim().replace(/&nbsp;/g, '') : '0';
            const od = parseInt(odText) || 0;
            
            const percentage = $subj(tds[colIndices.pct]).text().trim();

            if (code && desc) {
                subjectWise.push({ code, desc, total, absent, present, ml, od, percentage });
            }
        }
    });

    const hasODColumn = colIndices.od !== -1;

    const response = NextResponse.json({ success: true, stats, allDays, subjectWise, outreachData, hasODColumn });
    if (newSessionCookie) {
        response.cookies.set(newSessionCookie);
    }
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
