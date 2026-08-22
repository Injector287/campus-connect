const { db } = require('./src/lib/db.js');
const { decrypt } = require('./src/utils/crypto.js');
const { fetchWithReauth } = require('./src/utils/erpFetch.js');

async function run() {
  const user = await db.user.findFirst();
  
  const request = {
    cookies: {
      get: (key) => {
        if (key === 'ERP_CREDS') return { value: user.password }; 
        if (key === 'JSESSIONID') return { value: 'invalid_session_to_force_reauth' };
        return null;
      }
    }
  };

  try {
    const res = await fetchWithReauth(request, 'https://erp.loyolacollege.edu/loyolaonline/students/report/printLeaveApplication.jsp', {
      method: 'POST',
      data: 'dummy=1',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': `https://erp.loyolacollege.edu/loyolaonline/students/report/studentLeaveApplication.jsp`
      },
      responseType: 'arraybuffer'
    });
    console.log("Success! Status:", res.status);
    console.log("Headers:", Object.keys(res.headers || {}));
  } catch (e) {
    console.error("FAIL:", e);
  }
}
run().catch(console.error).finally(() => process.exit(0));
