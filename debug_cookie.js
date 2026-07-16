const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));
const BASE_URL = 'https://erp.loyolacollege.edu';

async function testCookies() {
    try {
        console.log('Fetching login page...');
        const res = await client.get(`${BASE_URL}/loyolaonline/students/loginManager/youLogin.jsp`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        console.log('Headers:', res.headers);
        const cookies = await jar.getCookies(`${BASE_URL}/loyolaonline`);
        console.log('Cookies in jar:', cookies.map(c => c.cookieString()));
    } catch (e) {
        console.error(e);
    }
}
testCookies();
