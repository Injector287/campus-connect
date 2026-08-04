import { db } from '@/lib/db';

export async function logScrape(username, endpoint, status, fullLog = null) {
  try {
    const updateData = {};
    if (status === 'SUCCESS') {
      const fieldName = 'lastSync' + endpoint.charAt(0).toUpperCase() + endpoint.slice(1);
      updateData[fieldName] = new Date();
    }

    // Direct insert to avoid nested transaction deadlocks on Serverless Postgres
    await db.scrapeLog.create({
      data: {
        user: { connect: { registerNum: username } },
        endpoint,
        status,
        fullLog: fullLog ? String(fullLog).substring(0, 5000) : null
      }
    });

    // Update the timestamp separately
    if (Object.keys(updateData).length > 0) {
      await db.user.update({
        where: { registerNum: username },
        data: updateData
      });
    }

  } catch (error) {
    if (error.code !== 'P2025') {
      console.error('Failed to log scrape:', error);
    }
  }
}
