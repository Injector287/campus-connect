const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const fs = require('fs');

const BASE_URL = 'https://erp.loyolacollege.edu';
const username = process.argv[2];
const password = process.argv[3];

async function run() {
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar }));

    console.log('Logging in...');
    await client.get(`${BASE_URL}/loyolaonline/students/loginManager/youLogin.jsp`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const captchaRes = await client.post(`${BASE_URL}/loyolaonline/captchas`, {}, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const captchaText = captchaRes.data.trim();

    const payload = new URLSearchParams();
    payload.append('txtSK', password);
    payload.append('txtAN', username);
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
        headers: { 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    if (loginRes.data.includes('Invalid') || loginRes.data.includes('incorrect')) {
        console.error('Login failed');
        return;
    }
    
    console.log('Fetching Due Details...');
    const due = await client.get(`${BASE_URL}/loyolaonline/students/report/studentFeeDueDetails.jsp`);
    fs.writeFileSync('due.html', due.data);

    console.log('Fetching Paid Details...');
    const paid = await client.get(`${BASE_URL}/loyolaonline/students/report/studentFinanceDetails.jsp`);
    fs.writeFileSync('paid.html', paid.data);

    console.log('Fetching Transactions...');
    const tx = await client.get(`${BASE_URL}/loyolaonline/students/report/studentOnlinePaymentAcknowledgements.jsp`);
    fs.writeFileSync('tx.html', tx.data);

    console.log('Done!');
}

run();
