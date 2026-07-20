import fs from 'fs';
import { fetchWithReauth } from './src/utils/erpFetch.js';

async function check() {
    try {
        // Since we are running from CLI, we need a mock request object with the cookies from the json file.
        // We know the cookie is stored in .env or somewhere, but wait! fetchWithReauth in our next.js app takes a NextRequest object.
        // Let's just read the cookies.json file directly and use axios.
        const axios = (await import('axios')).default;
        const { wrapper } = await import('axios-cookiejar-support');
        const { CookieJar } = await import('tough-cookie');

        const jar = new CookieJar();
        const client = wrapper(axios.create({ jar }));

        // Read the cookies from the file
        const cookiesPath = 'c:\\Users\\Shyaa\\OneDrive\\Documents\\My Stuff\\dev\\ERP\\.cookies.json';
        if (fs.existsSync(cookiesPath)) {
            const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
            if (cookies.JSESSIONID) {
                jar.setCookieSync(`JSESSIONID=${cookies.JSESSIONID}; Path=/; Domain=erp.loyolacollege.edu`, 'https://erp.loyolacollege.edu');
            }
        }

        const res = await client.get('https://erp.loyolacollege.edu/loyolaonline/students/report/studentHourWiseAttendance.jsp');
        
        fs.writeFileSync('C:\\Users\\Shyaa\\.gemini\\antigravity\\brain\\05e9a66b-109d-4792-b668-037f5c1f0c12\\scratch\\dump.html', res.data);
        console.log("HTML dumped successfully!");
    } catch (e) {
        console.error("Error:", e);
    }
}
check();
