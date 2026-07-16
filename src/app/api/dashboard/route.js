import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const BASE_URL = 'https://erp.loyolacollege.edu';

export async function GET(request) {
  try {
    const jsessionId = request.cookies.get('JSESSIONID')?.value;

    if (!jsessionId) {
      return NextResponse.json({ error: 'Unauthorized. No session found.' }, { status: 401 });
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Cookie': `JSESSIONID=${jsessionId}`
    };

    const res = await axios.get(`${BASE_URL}/loyolaonline/students/report/studentHourWiseAttendance.jsp`, { headers });
    
    // Fetch Subject Wise Attendance
    const resSubj = await axios.get(`${BASE_URL}/loyolaonline/students/report/studentSubjectWiseAttendance.jsp`, { headers });

    // 1. Parse Hour Wise Attendance
    const html = res.data;
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

    // 2. Parse Subject Wise Attendance
    const subjHtml = resSubj.data;
    const $subj = cheerio.load(subjHtml);
    const subjectWise = [];

    $subj('#tblSubjectWiseAttendance > tbody > tr').each((i, row) => {
        const tr = $subj(row);
        if (tr.hasClass('header') || tr.hasClass('subheader1') || tr.hasClass('subheader') || tr.hasClass('subtotal')) return;
        
        const tds = tr.find('td');
        if (tds.length >= 7) {
            const code = $subj(tds[0]).text().trim();
            const desc = $subj(tds[1]).text().trim();
            const total = parseInt($subj(tds[2]).text().trim().replace(/&nbsp;/g, '')) || 0;
            const absent = parseInt($subj(tds[3]).text().trim().replace(/&nbsp;/g, '')) || 0;
            const present = parseInt($subj(tds[4]).text().trim().replace(/&nbsp;/g, '')) || 0;
            const ml = parseInt($subj(tds[5]).text().trim().replace(/&nbsp;/g, '')) || 0;
            const percentage = $subj(tds[6]).text().trim();

            if (code && desc) {
                subjectWise.push({ code, desc, total, absent, present, ml, percentage });
            }
        }
    });

    return NextResponse.json({ success: true, stats, allDays, subjectWise });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
