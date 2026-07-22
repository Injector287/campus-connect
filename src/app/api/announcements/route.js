import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { hasValidWhitelistedSession } from '@/utils/auth';

export async function GET(request) {
  if (!(await hasValidWhitelistedSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // A simple implementation: fetch all active announcements for now.
  // Ideally, we could filter by user's role or department if we had that data.
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: {
        createdAt: 'desc',
      }
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}
