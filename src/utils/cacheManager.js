export function getCacheStatus(lastSyncDate, force = false) {
  if (!lastSyncDate) {
    return { shouldSync: true, reason: 'No previous sync' };
  }

  const now = new Date();
  const diffMinutes = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60);

  // Hard cooldown for forced refreshes (anti-spam)
  if (force) {
    return { shouldSync: true, reason: 'Forced sync' };
  }

  // Auto-sync logic based on college hours (IST timezone)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  
  const timeString = formatter.format(now);
  const [hour, minute] = timeString.split(':').map(Number);
  const currentTimeDec = hour + (minute / 60); // Decimal representation of time (e.g., 8.25 for 8:15 AM)

  const COLLEGE_START = 8.25; // 8:15 AM
  const COLLEGE_END = 18.5;  // 6:30 PM

  const isCollegeHours = currentTimeDec >= COLLEGE_START && currentTimeDec <= COLLEGE_END;

  if (isCollegeHours) {
    // During active hours, sync if data is older than 60 minutes
    if (diffMinutes >= 60) {
      return { shouldSync: true, reason: 'Cache expired during college hours' };
    } else {
      return { shouldSync: false, reason: 'Cache valid during college hours (60 min cooldown)' };
    }
  } else {
    // Outside active hours, ONLY sync if the last sync was BEFORE college ended today
    
    const lastSyncTimeStr = formatter.format(lastSyncDate);
    const [lsHour, lsMinute] = lastSyncTimeStr.split(':').map(Number);
    const lastSyncDec = lsHour + (lsMinute / 60);
    
    // If the cache is > 14 hours old, it missed the start of the current/next day.
    if (diffMinutes > 14 * 60) {
      return { shouldSync: true, reason: 'Cache is very old' };
    }

    // If it's evening and last sync was before 6:30 PM
    if (currentTimeDec >= COLLEGE_END && lastSyncDec < COLLEGE_END && diffMinutes < 12 * 60) {
      return { shouldSync: true, reason: 'Final EOD sync required' };
    }
    
    return { shouldSync: false, reason: 'Off-hours cache valid until morning' };
  }
}
