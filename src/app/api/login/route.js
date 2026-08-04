import { NextResponse } from 'next/server';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { clearAuthCookies, normalizeUsername } from '@/utils/auth';
import { db } from '@/lib/db';
import { encrypt } from '@/utils/crypto';
import { sanitizeString } from '@/utils/validation';

const BASE_URL = 'https://erp.loyolacollege.edu';

export async function POST(request) {
  try {
    const { username, password, stayLoggedIn } = await request.json();
    const normalizedUsername = normalizeUsername(sanitizeString(username, 100));
    const validPassword = sanitizeString(password, 255);

    if (!normalizedUsername || !validPassword) {
      return NextResponse.json({ error: 'Valid username and password required' }, { status: 400 });
    }

    // 1. Fetch Global Access Mode
    const modeSetting = await db.setting.findUnique({ where: { key: 'ACCESS_MODE' } });
    const accessMode = modeSetting?.value || 'BLACKLIST'; // Default is Blacklist Mode

    const existingUser = await db.user.findUnique({ where: { registerNum: normalizedUsername } });

    // 2. Enforce Access Rules
    if (accessMode === 'WHITELIST') {
      if (!existingUser || (existingUser.status !== 'APPROVED' && existingUser.role !== 'ADMIN')) {
        return clearAuthCookies(NextResponse.json({ error: 'System is in Whitelist mode. You are not authorized.' }, { status: 403 }));
      }
    } else {
      // BLACKLIST Mode
      if (existingUser && existingUser.status === 'BANNED') {
        return clearAuthCookies(NextResponse.json({ error: 'Your account has been banned by the administrator.' }, { status: 403 }));
      }
    }

    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar }));

    // 1. Fetch login page to initiate session
    await client.get(`${BASE_URL}/loyolaonline/students/loginManager/youLogin.jsp`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36' }
    });

    // 2. Fetch the CAPTCHA text
    const captchaRes = await client.post(`${BASE_URL}/loyolaonline/captchas`, {}, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36' }
    });
    
    const captchaText = captchaRes.data.trim();

    if (!captchaText) {
      return NextResponse.json({ error: 'Failed to retrieve CAPTCHA from ERP' }, { status: 500 });
    }

    // 3. Construct the highly specific login payload
    const payload = new URLSearchParams();
    payload.append('txtSK', encodeURIComponent(validPassword));
    payload.append('txtAN', encodeURIComponent(normalizedUsername));
    payload.append('_tries', '1');
    payload.append('_md5', '');
    payload.append('txtPageAction', '1');
    payload.append('hdnContextPath', 'https://erp.loyolacollege.edu/loyolaonline/students/loginManager/studentslRegistrationtMailVerification.jsp');
    payload.append('login', 'iamalsouser');
    payload.append('passwd', 'haveaniceday');
    payload.append('ccode', captchaText);
    payload.append('hdnId', '0');
    payload.append('_save', 'Log In');

    // 4. Send the POST request to login
    const loginRes = await client.post(`${BASE_URL}/loyolaonline/students/loginManager/youLogin.jsp`, payload.toString(), {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // 5. Verify if login succeeded (by checking the response HTML for common error messages)
    const responseHtml = loginRes.data;
    if (responseHtml.includes('Invalid') || responseHtml.includes('incorrect') || responseHtml.includes('Wrong')) {
       return NextResponse.json({ error: 'Invalid Student ID or Password provided.' }, { status: 401 });
    }

    // Extract the JSESSIONID from the jar to send back to the client as an HttpOnly cookie
    const cookies = await jar.getCookies(`${BASE_URL}/loyolaonline`);
    const jsessionIdCookie = cookies.find(c => c.key === 'JSESSIONID');

    if (!jsessionIdCookie) {
      return NextResponse.json({ error: 'Failed to establish a secure session.' }, { status: 500 });
    }

    const response = NextResponse.json({ success: true });
    
    const cookieOptions = {
      name: 'JSESSIONID',
      value: jsessionIdCookie.value,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    };

    if (stayLoggedIn) {
      // Set to expire in 30 days
      cookieOptions.maxAge = 30 * 24 * 60 * 60;
    }

    // Set the JSESSIONID cookie
    response.cookies.set(cookieOptions);

    response.cookies.set({
      name: 'ERP_USERNAME',
      value: normalizedUsername,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: stayLoggedIn ? 30 * 24 * 60 * 60 : undefined
    });

    response.cookies.set({
      name: 'ERP_AUTH_VERSION',
      value: String(existingUser?.sessionVersion || 1),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: stayLoggedIn ? 30 * 24 * 60 * 60 : undefined
    });

    const encryptedPassword = encrypt(validPassword);
    if (encryptedPassword) {
      await db.user.upsert({
        where: { registerNum: normalizedUsername },
        update: { password: encryptedPassword },
        create: { registerNum: normalizedUsername, password: encryptedPassword }
      });
    }

    return response;

  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: `An unexpected error occurred communicating with the ERP: ${error.message}` }, { status: 500 });
  }
}
