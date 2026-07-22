import { db } from '@/lib/db';

export async function logScrape(username, endpoint, status, fullLog = null) {
  try {
    const user = await db.user.findUnique({ where: { registerNum: username } });
    if (!user) return; // Ignore if user not found in DB

    await db.scrapeLog.create({
      data: {
        userId: user.id,
        endpoint,
        status,
        fullLog: fullLog ? String(fullLog).substring(0, 5000) : null // limit log size
      }
    });

    // Also update user's lastSync
    if (status === 'SUCCESS') {
      await db.user.update({
        where: { id: user.id },
        data: { lastSync: new Date() }
      });
    }

    // Keep log table size manageable by deleting old logs if necessary (e.g. older than 7 days)
    // We can do this probabilistically to avoid performance hit on every scrape
    if (Math.random() < 0.05) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      await db.scrapeLog.deleteMany({
        where: { createdAt: { lt: sevenDaysAgo } }
      }).catch(() => {}); // ignore cleanup errors
    }
  } catch (error) {
    console.error('Failed to log scrape:', error);
  }
}
