import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { decrypt } from './crypto';

const BASE_URL = 'https://erp.loyolacollege.edu';

/**
 * Perform a GET or POST request to the ERP, automatically re-authenticating if the session is invalid.
 * @param {Request} request The Next.js API Request object (to read cookies)
 * @param {string} url The ERP URL to fetch
 * @param {object} options Axios options (e.g. { method: 'GET', data: ... }) and overrideJsessionId
 * @returns {object} { data: string, newSessionCookie: object|null, status: number, jsessionId: string }
 */
export async function fetchWithReauth(request, url, options = { method: 'GET' }) {
    const jsessionId = options.overrideJsessionId || request.cookies.get('JSESSIONID')?.value;
    
    // First try with the existing JSESSIONID
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...options.headers
    };
    
    if (jsessionId) {
        headers['Cookie'] = `JSESSIONID=${jsessionId}`;
    }

    let res;
    try {
        res = await axios({
            url,
            ...options,
            headers,
            validateStatus: (status) => status < 500 // Allow redirects to pass through
        });
    } catch (e) {
        throw new Error('ERP request failed: ' + e.message);
    }

    // Check if the ERP returned a login page (indicating an expired or missing session)
    const isLoginRedirect = typeof res.data === 'string' && (res.data.includes('youLogin.jsp') || res.data.includes('loginManager'));
    
    if (!isLoginRedirect && jsessionId) {
        // Success!
        return { data: res.data, newSessionCookie: null, status: res.status, jsessionId, headers: res.headers };
    }

    // Session is invalid. Try to re-authenticate if we have credentials.
    const encryptedCreds = request.cookies.get('ERP_CREDS')?.value;
    if (!encryptedCreds) {
        throw new Error('Unauthorized. No valid session or credentials found.');
    }

    const decryptedStr = decrypt(encryptedCreds);
    if (!decryptedStr) {
        throw new Error('Failed to decrypt credentials.');
    }

    const [username, password] = decryptedStr.split(':');
    if (!username || !password) {
        throw new Error('Malformed credentials.');
    }

    // Perform Login Flow
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar }));

    await client.get(`${BASE_URL}/loyolaonline/students/loginManager/youLogin.jsp`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    const captchaRes = await client.post(`${BASE_URL}/loyolaonline/captchas`, {}, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    const captchaText = captchaRes.data.trim();

    const payload = new URLSearchParams();
    payload.append('txtSK', encodeURIComponent(password));
    payload.append('txtAN', encodeURIComponent(username));
    payload.append('_tries', '1');
    payload.append('_md5', '');
    payload.append('txtPageAction', '1');
    payload.append('hdnContextPath', 'https://erp.loyolacollege.edu/loyolaonline/students/loginManager/studentslRegistrationtMailVerification.jsp');
    payload.append('login', 'iamalsouser');
    payload.append('passwd', 'haveaniceday');
    payload.append('ccode', captchaText);
    payload.append('hdnId', '0');
    payload.append('_save', 'Log In');

    const loginRes = await client.post(`${BASE_URL}/loyolaonline/students/loginManager/youLogin.jsp`, payload.toString(), {
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    const responseHtml = loginRes.data;
    if (responseHtml.includes('Invalid') || responseHtml.includes('incorrect') || responseHtml.includes('Wrong')) {
        throw new Error('Invalid credentials during background re-authentication.');
    }

    const cookies = await jar.getCookies(`${BASE_URL}/loyolaonline`);
    const jsessionIdCookie = cookies.find(c => c.key === 'JSESSIONID');

    if (!jsessionIdCookie) {
        throw new Error('Failed to establish a new session.');
    }

    const newJsessionId = jsessionIdCookie.value;

    // Retry the original request with the new JSESSIONID
    const retryHeaders = {
        ...headers,
        'Cookie': `JSESSIONID=${newJsessionId}`
    };

    let retryRes;
    try {
        retryRes = await axios({
            url,
            ...options,
            headers: retryHeaders
        });
    } catch (e) {
        throw new Error('Retry ERP request failed: ' + e.message);
    }

    return { 
        data: retryRes.data, 
        newSessionCookie: { name: 'JSESSIONID', value: newJsessionId, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' },
        status: retryRes.status,
        jsessionId: newJsessionId
    };
}
