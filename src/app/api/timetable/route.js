import { NextResponse } from 'next/server';
import { hasValidWhitelistedSession, unauthorizedResponse } from '@/utils/auth';
import { db } from '@/lib/db';
import defaultTimetable from '@/utils/timetable.json';

export async function GET(request) {
  try {
    if (!(await hasValidWhitelistedSession(request))) {
      return unauthorizedResponse();
    }
    const registerNum = request.cookies.get('ERP_USERNAME')?.value;
    if (!registerNum) return unauthorizedResponse();

    const user = await db.user.findUnique({ where: { registerNum } });
    if (!user) return unauthorizedResponse();

    let isShift1 = false;
    if (user.profileCache) {
      try {
        const profile = JSON.parse(user.profileCache);
        const courseStr = (profile.course || '').toLowerCase();
        // Assuming typical formats like "Shift I", "Shift-I", "Shift 1"
        if (courseStr.includes('shift i') && !courseStr.includes('shift ii') || courseStr.includes('shift 1') || courseStr.includes('shift-i') && !courseStr.includes('shift-ii')) {
          isShift1 = true;
        }
      } catch (e) {
        console.error('Failed to parse profileCache for shift detection', e);
      }
    }

    const shift1Timings = {
      "1": "08:15 - 09:10",
      "2": "09:10 - 10:05",
      "3": "10:05 - 11:00",
      "Break": "11:00 - 11:25",
      "4": "11:25 - 12:20",
      "5": "12:20 - 13:15"
    };

    const shift2Timings = defaultTimetable.timings;

    const classId = request.nextUrl.searchParams.get('classId') || defaultTimetable.title;

    // Fetch class consensus timetable
    const classTimetables = await db.classTimetable.findMany({
      where: { classId }
    });

    // Fetch user's personal overrides
    const userTimetables = await db.userTimetable.findMany({
      where: { userId: user.id, classId }
    });

    // Fetch user's subject aliases
    const subjectAliases = await db.subjectAlias.findMany({
      where: { userId: user.id }
    });
    const aliasesMap = {};
    for (const sa of subjectAliases) {
      aliasesMap[sa.subject] = sa.alias;
    }

    // 1. Start with default timetable
    let mergedTimetable = JSON.parse(JSON.stringify(defaultTimetable.timetable));

    // 2. Overlay Class Consensus
    for (const ct of classTimetables) {
      if (!mergedTimetable[ct.dayOrder]) mergedTimetable[ct.dayOrder] = {};
      mergedTimetable[ct.dayOrder][ct.period] = ct.subject;
    }

    // 3. Overlay Personal Overrides
    for (const ut of userTimetables) {
      if (!mergedTimetable[ut.dayOrder]) mergedTimetable[ut.dayOrder] = {};
      mergedTimetable[ut.dayOrder][ut.period] = ut.subject;
    }

    return NextResponse.json({
      success: true,
      title: classId,
      timings: isShift1 ? shift1Timings : shift2Timings,
      timetable: mergedTimetable,
      userOverrides: userTimetables.map(u => ({ dayOrder: u.dayOrder, period: u.period, subject: u.subject })),
      aliases: aliasesMap
    });

  } catch (error) {
    console.error('[Timetable GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch timetable' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!(await hasValidWhitelistedSession(request))) {
      return unauthorizedResponse();
    }
    const registerNum = request.cookies.get('ERP_USERNAME')?.value;
    if (!registerNum) return unauthorizedResponse();

    const user = await db.user.findUnique({ where: { registerNum } });
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const { action, classId = defaultTimetable.title, dayOrder, period, subject, alias } = body;

    if (action === 'override') {
      await db.userTimetable.upsert({
        where: {
          userId_dayOrder_period: {
            userId: user.id,
            dayOrder: String(dayOrder),
            period: String(period)
          }
        },
        update: {
          subject,
          classId
        },
        create: {
          userId: user.id,
          classId,
          dayOrder: String(dayOrder),
          period: String(period),
          subject
        }
      });

      // Handle Alias
      if (alias !== undefined) {
        if (alias.trim() === '') {
          // Delete alias if empty
          await db.subjectAlias.deleteMany({
            where: { userId: user.id, subject }
          });
        } else {
          // Upsert alias
          await db.subjectAlias.upsert({
            where: {
              userId_subject: {
                userId: user.id,
                subject
              }
            },
            update: { alias: alias.trim() },
            create: { userId: user.id, subject, alias: alias.trim() }
          });
        }
      }

      // Run Consensus Engine for this specific period
      await runConsensusEngine(classId, String(dayOrder), String(period));

      return NextResponse.json({ success: true, message: 'Period updated successfully' });
    }
    
    if (action === 'sync') {
        await db.userTimetable.deleteMany({
            where: { userId: user.id, classId }
        });
        return NextResponse.json({ success: true, message: 'Synced with class standard' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('[Timetable POST] Error:', error);
    return NextResponse.json({ error: 'Failed to update timetable' }, { status: 500 });
  }
}

async function runConsensusEngine(classId, dayOrder, period) {
  const userTimetables = await db.userTimetable.findMany({
    where: { classId, dayOrder, period }
  });

  const subjectCounts = {};
  for (const ut of userTimetables) {
    subjectCounts[ut.subject] = (subjectCounts[ut.subject] || 0) + 1;
  }

  // Calculate dynamic threshold based on class size, or default to 3
  // Since we don't know the exact class size, we use a fixed 3 for now.
  const CONSENSUS_THRESHOLD = 3;
  let consensusSubjects = [];
  for (const [subject, count] of Object.entries(subjectCounts)) {
    if (count >= CONSENSUS_THRESHOLD) {
      consensusSubjects.push({ subject, count });
    }
  }

  if (consensusSubjects.length === 1) {
    const { subject, count } = consensusSubjects[0];
    await db.classTimetable.upsert({
      where: {
        classId_dayOrder_period: { classId, dayOrder, period }
      },
      update: { subject, consensusCount: count },
      create: { classId, dayOrder, period, subject, consensusCount: count }
    });
  } else if (consensusSubjects.length > 1) {
    // Competing consensuses (Electives!)
    await db.classTimetable.upsert({
      where: {
        classId_dayOrder_period: { classId, dayOrder, period }
      },
      update: { subject: "Elective (Tap to Select)", consensusCount: 0 },
      create: { classId, dayOrder, period, subject: "Elective (Tap to Select)", consensusCount: 0 }
    });
  }
}
