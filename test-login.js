const axios = require('axios');
const cheerio = require('cheerio');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

const BASE_URL = 'https://erp.loyolacollege.edu';

async function testFullFlow() {
    try {
        console.log('1. Fetching login page to get cookies...');
        await client.get(`${BASE_URL}/loyolaonline/students/loginManager/youLogin.jsp`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        console.log('2. Fetching Captcha text from /loyolaonline/captchas...');
        const captchaRes = await client.post(`${BASE_URL}/loyolaonline/captchas`, {}, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const captchaText = captchaRes.data.trim();
        console.log(`✅ Extracted CAPTCHA: "${captchaText}"`);

    } catch (err) {
        console.error('Error:', err.message);
    }
}
testFullFlow();
