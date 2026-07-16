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

    const res = await axios.get(`${BASE_URL}/loyolaonline/students/report/studentProfile.jsp`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Cookie': `JSESSIONID=${jsessionId}`
      }
    });

    const html = res.data;
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
            const imgRes = await axios.get(imgSrc, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Cookie': `JSESSIONID=${jsessionId}`
                }
            });
            const buffer = Buffer.from(imgRes.data, 'binary');
            const mimeType = imgRes.headers['content-type'] || 'image/jpeg';
            photoBase64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
        } catch (e) {
            console.error("Failed to fetch profile image", e.message);
        }
    }
    
    profileData.photo = photoBase64;

    return NextResponse.json({ success: true, profile: profileData });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch profile data' }, { status: 500 });
  }
}
