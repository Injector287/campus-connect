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

    const { data: html, newSessionCookie, jsessionId: activeJsessionId } = await fetchWithReauth(request, `${BASE_URL}/loyolaonline/students/report/studentProfile.jsp`);
    const $ = cheerio.load(html);

    // Helper to find the td containing a specific label and return the text of the NEXT td
    const extractField = (label) => {
        // Scope to table-bordered to avoid matching the outer layout td
        const td = $(`table.table-bordered td:contains("${label}")`).first();
        if (td.length > 0) {
            return td.next('td').text().trim().replace(/\s+/g, ' '); // remove extra spaces/newlines
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
        address: extractField('Residential Address')
    };

    // Extract image src
    let imgSrc = '';
    const imgTag = $('div#divImage img').first();
    if (imgTag.length > 0) {
        let src = imgTag.attr('src');
        if (src) {
           // Replace relative path with absolute ERP path
           src = src.replace('../../', '/loyolaonline/');
           imgSrc = `${BASE_URL}${src}`;
        }
    }

    // Proxy the image as base64 so frontend can render it without auth issues
    let photoBase64 = null;
    if (imgSrc) {
        try {
            const { data: imgData, headers: imgHeaders } = await fetchWithReauth(request, imgSrc, {
                responseType: 'arraybuffer',
                overrideJsessionId: activeJsessionId
            });
            const buffer = Buffer.from(imgData, 'binary');
            const mimeType = imgHeaders['content-type'] || 'image/jpeg';
            photoBase64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
        } catch (e) {
            console.error("Failed to fetch profile image", e.message);
        }
    }
    
    profileData.photo = photoBase64;

    const response = NextResponse.json({ success: true, profile: profileData });
    if (newSessionCookie) {
        response.cookies.set(newSessionCookie);
    }
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch profile data' }, { status: 500 });
  }
}
