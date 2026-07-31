import { db } from '@/lib/db';

export async function logScrape(username, endpoint, status, fullLog = null) {
  try {
    const updateData = {};
    if (status === 'SUCCESS') {
      const fieldName = 'lastSync' + endpoint.charAt(0).toUpperCase() + endpoint.slice(1);
      updateData[fieldName] = new Date();
    }

    // Use a nested write to update the user and create the log in a single transaction!
    await db.user.update({
      where: { registerNum: username },
      data: {
        ...updateData,
        scrapeLogs: {
          create: {
            endpoint,
            status,
            fullLog: fullLog ? String(fullLog).substring(0, 5000) : null
          }
        }
      }
    });

    // Probabilistically clean up old logs without blocking
    if (Math.random() < 0.05) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      // Run background cleanup asynchronously
      db.scrapeLog.deleteMany({
        where: { createdAt: { lt: sevenDaysAgo } }
      }).catch(() => {});
    }
  } catch (error) {
    // If the user isn't found or DB connection fails, gracefully ignore
    if (error.code !== 'P2025') {
      console.error('Failed to log scrape:', error);
    }
  }
}
