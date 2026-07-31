import { db } from './db';
import { logScrape } from '@/utils/logger';
import { decrypt } from '@/utils/crypto';
import { loginToERP } from '@/utils/erpFetch';
import {
    parseDashboard,
    parseFinance,
    parseGrades,
    parseLibrary,
    parseSubjects,
    parseProfile,
    parseLeaves
} from '@/utils/parsers';
import axios from 'axios';

const client = axios.create({ timeout: 15000 }); // 15 seconds global timeout

const BASE_URL = 'https://erp.loyolacollege.edu';

/**
 * Synchronize the dashboard data for a given user in the background.
 */
export async function syncDashboard(registerNum) {
    console.log(`[SyncEngine] Syncing dashboard for ${registerNum}...`);
    try {
        const user = await db.user.findUnique({ where: { registerNum } });
        if (!user || !user.password) throw new Error('User or credentials not found in DB');

        const password = decrypt(user.password);
        if (!password) throw new Error('Failed to decrypt password');
        
        // 1. Authenticate and get a fresh JSESSIONID
        const jsessionId = await loginToERP(registerNum, password);
        
        // 2. Fetch required HTML pages
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Cookie': `JSESSIONID=${jsessionId}`
        };

        const [hourWiseRes, subjectWiseRes] = await Promise.all([
            client.get(`${BASE_URL}/loyolaonline/students/report/studentHourWiseAttendance.jsp`, { headers }),
            client.get(`${BASE_URL}/loyolaonline/students/report/studentSubjectWiseAttendance.jsp`, { headers })
        ]);

        // 3. Parse the HTML using our extracted parser
        const parsedData = parseDashboard(hourWiseRes.data, subjectWiseRes.data);
        
        // 4. Update the DB cache
        await db.user.update({
            where: { registerNum },
            data: { 
                dashboardCache: JSON.stringify(parsedData),
                lastSyncDashboard: new Date()
            }
        });

        console.log(`[SyncEngine] Successfully synced dashboard for ${registerNum}.`);
        logScrape(registerNum, 'dashboard', 'SUCCESS');
        return parsedData;
    } catch (error) {
        console.error(`[SyncEngine] Failed to sync dashboard for ${registerNum}:`, error.message);
        logScrape(registerNum, 'dashboard', 'ERROR', error.stack || error.message);
        throw error;
    }
}

/**
 * Synchronize the finance data for a given user in the background.
 */
export async function syncFinance(registerNum) {
    console.log(`[SyncEngine] Syncing finance for ${registerNum}...`);
    try {
        const user = await db.user.findUnique({ where: { registerNum } });
        if (!user || !user.password) throw new Error('User or credentials not found in DB');

        const password = decrypt(user.password);
        if (!password) throw new Error('Failed to decrypt password');
        
        const jsessionId = await loginToERP(registerNum, password);
        
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Cookie': `JSESSIONID=${jsessionId}`
        };

        const [dueRes, paidRes, txRes] = await Promise.all([
            client.get(`${BASE_URL}/loyolaonline/students/report/studentFeeDueDetails.jsp`, { headers }),
            client.get(`${BASE_URL}/loyolaonline/students/report/studentFinanceDetails.jsp`, { headers }),
            client.get(`${BASE_URL}/loyolaonline/students/report/studentOnlinePaymentAcknowledgements.jsp`, { headers })
        ]);

        const parsedData = parseFinance(dueRes.data, paidRes.data, txRes.data);
        
        await db.user.update({
            where: { registerNum },
            data: { 
                financeCache: JSON.stringify(parsedData),
                lastSyncFinance: new Date()
            }
        });

        console.log(`[SyncEngine] Successfully synced finance for ${registerNum}.`);
        logScrape(registerNum, 'finance', 'SUCCESS');
        return parsedData;
    } catch (error) {
        console.error(`[SyncEngine] Failed to sync finance for ${registerNum}:`, error.message);
        logScrape(registerNum, 'finance', 'ERROR', error.stack || error.message);
        throw error;
    }
}

/**
 * Synchronize the grades data for a given user in the background.
 */
export async function syncGrades(registerNum) {
    console.log(`[SyncEngine] Syncing grades for ${registerNum}...`);
    try {
        const user = await db.user.findUnique({ where: { registerNum } });
        if (!user || !user.password) throw new Error('User or credentials not found in DB');

        const password = decrypt(user.password);
        if (!password) throw new Error('Failed to decrypt password');

        const jsessionId = await loginToERP(registerNum, password);

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Cookie': `JSESSIONID=${jsessionId}`
        };

        const [resInternal, resExam] = await Promise.all([
            client.get(`${BASE_URL}/loyolaonline/students/report/studentInternalMarkDetails.jsp`, { headers }),
            client.get(`${BASE_URL}/loyolaonline/students/report/studentExamResultsDetails.jsp`, { headers })
        ]);

        const parsedData = parseGrades(resInternal.data, resExam.data);

        await db.user.update({
            where: { registerNum },
            data: {
                gradesCache: JSON.stringify(parsedData),
                lastSyncGrades: new Date()
            }
        });

        console.log(`[SyncEngine] Successfully synced grades for ${registerNum}.`);
        logScrape(registerNum, 'grades', 'SUCCESS');
        return parsedData;
    } catch (error) {
        console.error(`[SyncEngine] Failed to sync grades for ${registerNum}:`, error.message);
        logScrape(registerNum, 'grades', 'ERROR', error.stack || error.message);
        throw error;
    }
}

/**
 * Synchronize the library data for a given user in the background.
 */
export async function syncLibrary(registerNum) {
    console.log(`[SyncEngine] Syncing library for ${registerNum}...`);
    try {
        const user = await db.user.findUnique({ where: { registerNum } });
        if (!user || !user.password) throw new Error('User or credentials not found in DB');

        const password = decrypt(user.password);
        if (!password) throw new Error('Failed to decrypt password');

        const jsessionId = await loginToERP(registerNum, password);

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Cookie': `JSESSIONID=${jsessionId}`,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        };

        const [res1, res2, res3] = await Promise.all([
            client.post(`${BASE_URL}/loyolaonline/students/report/studentLibraryDetailsInner.jsp`, 'ids=1&filter=', { headers }),
            client.post(`${BASE_URL}/loyolaonline/students/report/studentLibraryDetailsInner.jsp`, 'ids=2&filter=', { headers }),
            client.post(`${BASE_URL}/loyolaonline/students/report/studentLibraryDetailsInner.jsp`, 'ids=3&filter=', { headers })
        ]);

        const parsedData = parseLibrary(res1.data, res2.data, res3.data);

        await db.user.update({
            where: { registerNum },
            data: {
                libraryCache: JSON.stringify(parsedData),
                lastSyncLibrary: new Date()
            }
        });

        console.log(`[SyncEngine] Successfully synced library for ${registerNum}.`);
        logScrape(registerNum, 'library', 'SUCCESS');
        return parsedData;
    } catch (error) {
        console.error(`[SyncEngine] Failed to sync library for ${registerNum}:`, error.message);
        logScrape(registerNum, 'library', 'ERROR', error.stack || error.message);
        throw error;
    }
}

/**
 * Synchronize the subjects data for a given user in the background.
 */
export async function syncSubjects(registerNum) {
    console.log(`[SyncEngine] Syncing subjects for ${registerNum}...`);
    try {
        const user = await db.user.findUnique({ where: { registerNum } });
        if (!user || !user.password) throw new Error('User or credentials not found in DB');

        const password = decrypt(user.password);
        if (!password) throw new Error('Failed to decrypt password');

        const jsessionId = await loginToERP(registerNum, password);

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Cookie': `JSESSIONID=${jsessionId}`
        };

        const resSubjects = await client.get(`${BASE_URL}/loyolaonline/students/report/studentWiseSubjects.jsp`, { headers });

        const parsedData = parseSubjects(resSubjects.data);

        await db.user.update({
            where: { registerNum },
            data: {
                subjectsCache: JSON.stringify(parsedData),
                lastSyncSubjects: new Date()
            }
        });

        console.log(`[SyncEngine] Successfully synced subjects for ${registerNum}.`);
        logScrape(registerNum, 'subjects', 'SUCCESS');
        return parsedData;
    } catch (error) {
        console.error(`[SyncEngine] Failed to sync subjects for ${registerNum}:`, error.message);
        logScrape(registerNum, 'subjects', 'ERROR', error.stack || error.message);
        throw error;
    }
}

/**
 * Synchronize the profile data for a given user in the background.
 */
export async function syncProfile(registerNum) {
    console.log(`[SyncEngine] Syncing profile for ${registerNum}...`);
    try {
        const user = await db.user.findUnique({ where: { registerNum } });
        if (!user || !user.password) throw new Error('User or credentials not found in DB');

        const password = decrypt(user.password);
        if (!password) throw new Error('Failed to decrypt password');

        const jsessionId = await loginToERP(registerNum, password);

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Cookie': `JSESSIONID=${jsessionId}`
        };

        const resProfile = await client.get(`${BASE_URL}/loyolaonline/students/report/studentProfile.jsp`, { headers });

        const profileData = parseProfile(resProfile.data, BASE_URL);

        if (profileData.photoUrl) {
            try {
                const imgRes = await client.get(profileData.photoUrl, {
                    headers,
                    responseType: 'arraybuffer'
                });
                const mimeType = imgRes.headers['content-type'] || 'image/jpeg';
                const base64 = Buffer.from(imgRes.data, 'binary').toString('base64');
                profileData.photo = `data:${mimeType};base64,${base64}`;
            } catch (imgErr) {
                console.error(`[SyncEngine] Failed to fetch profile photo for ${registerNum}:`, imgErr.message);
                profileData.photo = null;
            }
            delete profileData.photoUrl;
        }

        const parsedData = { profile: profileData };

        await db.user.update({
            where: { registerNum },
            data: {
                profileCache: JSON.stringify(parsedData),
                lastSyncProfile: new Date()
            }
        });

        console.log(`[SyncEngine] Successfully synced profile for ${registerNum}.`);
        logScrape(registerNum, 'profile', 'SUCCESS');
        return parsedData;
    } catch (error) {
        console.error(`[SyncEngine] Failed to sync profile for ${registerNum}:`, error.message);
        logScrape(registerNum, 'profile', 'ERROR', error.stack || error.message);
        throw error;
    }
}

/**
 * Synchronize the leaves data for a given user in the background.
 */
export async function syncLeaves(registerNum) {
    console.log(`[SyncEngine] Syncing leaves for ${registerNum}...`);
    try {
        const user = await db.user.findUnique({ where: { registerNum } });
        if (!user || !user.password) throw new Error('User or credentials not found in DB');

        const password = decrypt(user.password);
        if (!password) throw new Error('Failed to decrypt password');

        const jsessionId = await loginToERP(registerNum, password);

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Cookie': `JSESSIONID=${jsessionId}`
        };

        const resLeaves = await client.get(`${BASE_URL}/loyolaonline/students/report/studentLeaveApplication.jsp`, { headers });

        const parsedData = parseLeaves(resLeaves.data);

        await db.user.update({
            where: { registerNum },
            data: {
                leavesCache: JSON.stringify(parsedData),
                lastSyncLeaves: new Date()
            }
        });

        console.log(`[SyncEngine] Successfully synced leaves for ${registerNum}.`);
        logScrape(registerNum, 'leaves', 'SUCCESS');
        return parsedData;
    } catch (error) {
        console.error(`[SyncEngine] Failed to sync leaves for ${registerNum}:`, error.message);
        logScrape(registerNum, 'leaves', 'ERROR', error.stack || error.message);
        throw error;
    }
}
