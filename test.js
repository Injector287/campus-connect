const { db } = require('./src/lib/db.js');
const { decrypt } = require('./src/utils/crypto.js');
const { loginToERP } = require('./src/utils/erpFetch.js');
const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const user = await db.user.findFirst();
  const pw = decrypt(user.password);
  const jid = await loginToERP(user.registerNum, pw);
  const res = await axios.get('https://erp.loyolacollege.edu/loyolaonline/students/report/studentInternalMarkDetails.jsp', {
    headers: { Cookie: 'JSESSIONID='+jid }
  });
  const $ = cheerio.load(res.data);
  console.log('HTML:', $('#tblComponentWiseMarks').first().html());
}
test().catch(console.error).finally(()=>process.exit(0));
