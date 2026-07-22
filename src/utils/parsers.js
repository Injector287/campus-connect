import * as cheerio from 'cheerio';

export function parseDashboard(hourWiseHtml, subjHtml) {
    // 1. Parse Hour Wise Attendance
    const $ = cheerio.load(hourWiseHtml);

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
       const dateStr = dateNode.text().trim();
       
       const hours = [];
       dateNode.nextAll('td').each((j, td) => {
          const status = $(td).text().trim() || '-';
          hours.push(status);
       });

       allDays.push({ date: dateStr, hours: hours });
    });

    // Extract Outreach Attendance
    let outreachData = null;
    const outreachHeader = $('td').filter(function() {
        return $(this).text().trim().toUpperCase() === 'OUTREACH';
    }).first();
    
    if (outreachHeader.length > 0) {
        const outreachTable = outreachHeader.closest('table');
        const teamNameRow = outreachTable.find('tr').eq(1);
        const teamName = teamNameRow.text().trim();
        
        const records = [];
        let total = 0, present = 0, absent = 0;
        
        outreachTable.find('tr').each((i, row) => {
            const tr = $(row);
            const tds = tr.find('td');
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
                team: teamName, total, present, absent,
                percentage: ((present / total) * 100).toFixed(1),
                records
            };
        }
    }

    // 2. Parse Subject Wise Attendance
    const $subj = cheerio.load(subjHtml);
    const subjectWise = [];
    
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

    return { stats, allDays, subjectWise, outreachData, hasODColumn };
}

export function parseFinance(dueHtml, paidHtml, txHtml) {
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
                    const cellHtml = $(td).html();
                    cells.push({ text, href, html: cellHtml });
                });
                if (cells.length > 0) rows.push(cells);
            });
            if (rows.length > 0) tables.push(rows);
        });
        return tables;
    };

    const dueTablesRaw = parseTables(dueHtml);
    const paidTablesRaw = parseTables(paidHtml);
    const txTablesRaw = parseTables(txHtml);

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

    return { due: dueDetails, history: paidHistory, transactions };
}

/**
 * Parses internal and semester exam marks and credit summary from ERP HTML pages.
 * @param {string} internalHtml - HTML string from studentInternalMarkDetails.jsp
 * @param {string} examHtml - HTML string from studentExamResultsDetails.jsp
 * @returns {{ internalMarks: Array, examMarks: Array, summary: Object }}
 */
export function parseGrades(internalHtml = '', examHtml = '') {
  // 1. Parse Internal Marks
  const $int = cheerio.load(internalHtml || '');
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

  // 2. Parse Exam Marks & Summary
  const $ex = cheerio.load(examHtml || '');
  const examMarks = [];
  let currentCategory = 'Other';

  $ex('#tdExamResults > tbody > tr').each((i, row) => {
    const tr = $ex(row);

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
          examMarks.push({
            semester, code, desc, internal, external, total,
            credit, grade, points, monthYear, result, category: currentCategory
          });
        }
      }
    }
  });

  // Extract Summary Credits
  let totalCredits = '', acquiredCredits = '', remainingCredits = '';
  $ex('table.ui-widget-content tr').each((i, row) => {
    const text = $ex(row).text();
    if (text.includes('Total Credits:')) totalCredits = $ex(row).find('td').last().text().trim();
    if (text.includes('Acquired Credits:')) acquiredCredits = $ex(row).find('td').last().text().trim();
    if (text.includes('Remaining Credits:')) remainingCredits = $ex(row).find('td').last().text().trim();
  });

  return {
    internalMarks,
    examMarks,
    summary: { totalCredits, acquiredCredits, remainingCredits }
  };
}

/**
 * Parses library books currently in hand, transaction history, and fines.
 * @param {string} booksInHandHtml - HTML string from studentLibraryDetailsInner.jsp (ids=1)
 * @param {string} activitiesHtml - HTML string from studentLibraryDetailsInner.jsp (ids=2)
 * @param {string} finesHtml - HTML string from studentLibraryDetailsInner.jsp (ids=3)
 * @returns {{ booksInHand: Array, activities: Array, fines: Array }}
 */
export function parseLibrary(booksInHandHtml = '', activitiesHtml = '', finesHtml = '') {
  const parseTable = (html, tableId) => {
    if (!html) return [];
    const $ = cheerio.load(html);
    const results = [];
    $(`#${tableId} tr`).each((i, el) => {
      if ($(el).hasClass('subheader')) return;
      const cols = $(el).find('td');
      if (cols.length <= 1) return;

      const row = [];
      cols.each((j, col) => {
        row.push($(col).text().trim());
      });
      if (row.length > 0) results.push(row);
    });
    return results;
  };

  const booksInHandRaw = parseTable(booksInHandHtml, 'tblBooksInHand');
  const activitiesRaw = parseTable(activitiesHtml, 'tblLibraryActivities');
  const finesRaw = parseTable(finesHtml, 'tblLibraryFineDetails');

  const booksInHand = booksInHandRaw.map(row => ({
    accessionNo: row[0] || '',
    title: row[1] || '',
    borrowedDate: row[2] || '',
    dueDate: row[3] || ''
  }));

  const activities = activitiesRaw.map(row => ({
    accessionNo: row[0] || '',
    title: row[1] || '',
    borrowedDate: row[2] || '',
    dueDate: row[3] || '',
    returnedDate: row[4] || ''
  }));

  const fines = finesRaw.map(row => ({
    accessionNo: row[0] || '',
    title: row[1] || '',
    borrowedDate: row[2] || '',
    dueDate: row[3] || '',
    returnedDate: row[4] || '',
    fineAmount: row[5] || '',
    status: row[6] || ''
  }));

  return { booksInHand, activities, fines };
}

/**
 * Parses subjects categorized by course/category from studentWiseSubjects.jsp.
 * @param {string} subjectsHtml - HTML string from studentWiseSubjects.jsp
 * @returns {Array<{ name: string, subjects: Array }>}
 */
export function parseSubjects(subjectsHtml = '') {
  if (!subjectsHtml) return [];
  const $ = cheerio.load(subjectsHtml);

  const categories = [];
  let currentCategory = { name: 'UNCATEGORIZED', subjects: [] };

  $('#tblStudentWiseSubjects tr').each((i, row) => {
    const tr = $(row);

    if (tr.find('.header').length > 0 || tr.hasClass('subheader')) {
      return;
    }

    const categoryTd = tr.find('td[colspan="6"]');
    if (categoryTd.length > 0) {
      if (currentCategory.subjects.length > 0) {
        categories.push(currentCategory);
      }
      currentCategory = {
        name: categoryTd.text().trim(),
        subjects: []
      };
    } else {
      const tds = tr.find('td');
      if (tds.length >= 5) {
        const semester = $(tds[0]).text().trim();
        const code = $(tds[1]).text().trim();
        const description = $(tds[2]).text().trim();
        const credit = $(tds[3]).text().trim();
        const faculty = $(tds[4]).text().trim();

        if (code && description) {
          currentCategory.subjects.push({
            semester, code, description, credit, faculty
          });
        }
      }
    }
  });

  if (currentCategory.subjects.length > 0) {
    categories.push(currentCategory);
  }

  return categories;
}

/**
 * Parses student profile details and photo URL from studentProfile.jsp.
 * @param {string} profileHtml - HTML string from studentProfile.jsp
 * @param {string} baseUrl - ERP Base URL (default: 'https://erp.loyolacollege.edu')
 * @returns {Object}
 */
export function parseProfile(profileHtml = '', baseUrl = 'https://erp.loyolacollege.edu') {
  if (!profileHtml) return {};
  const $ = cheerio.load(profileHtml);

  const extractField = (label) => {
    const td = $(`table.table-bordered td:contains("${label}")`).first();
    if (td.length > 0) {
      return td.next('td').text().trim().replace(/\s+/g, ' ');
    }
    return '';
  };

  const profileData = {
    name: extractField('Student Name'),
    deptNo: extractField('Dept No.'),
    urn: extractField('University Register No.'),
    course: extractField('Course'),
    academicYear: extractField('Academic Year'),
    section: extractField('Section'),
    dobGender: extractField('D.O.B. / Gender'),
    contact: extractField('Student Contact Number'),
    address: extractField('Residential Address'),
    photoUrl: ''
  };

  const imgTag = $('div#divImage img').first();
  if (imgTag.length > 0) {
    let src = imgTag.attr('src');
    if (src) {
      src = src.replace('../../', '/loyolaonline/');
      profileData.photoUrl = `${baseUrl}${src}`;
    }
  }

  return profileData;
}

/**
 * Parses leave application responses or leave history HTML.
 * @param {string} html - HTML string from studentLeaveApplication.jsp or printLeaveApplication.jsp
 * @returns {{ isError: boolean, errorMessage: string|null, history: Array }}
 */
export function parseLeaves(html = '') {
  if (!html) return { isError: false, errorMessage: null, history: [] };
  const $ = cheerio.load(html);

  // Check for error text in alerts or font tags
  const errDiv = $('.alert-danger, .errorMessage, font[color="red"], #lblError').first();
  let errorMessage = errDiv.length > 0 ? errDiv.text().trim() : null;

  if (!errorMessage && html.toLowerCase().includes('session expired')) {
    errorMessage = 'Session expired. Please log in again.';
  }

  const history = [];
  $('#tblLeaveDetails tr, #tblLeaveHistory tr').each((i, row) => {
    const tr = $(row);
    if (tr.hasClass('header') || tr.hasClass('subheader')) return;
    const tds = tr.find('td');
    if (tds.length >= 6) {
      history.push({
        slNo: $(tds[0]).text().trim(),
        leaveType: $(tds[1]).text().trim(),
        fromDate: $(tds[2]).text().trim(),
        toDate: $(tds[3]).text().trim(),
        noOfDays: $(tds[4]).text().trim(),
        reason: $(tds[5]).text().trim(),
        status: tds.length >= 7 ? $(tds[6]).text().trim() : 'Applied'
      });
    }
  });

  return {
    isError: !!errorMessage,
    errorMessage,
    history
  };
}

