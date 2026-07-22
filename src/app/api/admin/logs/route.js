import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { checkAdmin } from '@/utils/adminAuth';

export async function GET(request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const skip = (page - 1) * limit;

  try {
    const [logs, total] = await Promise.all([
      prisma.scrapeLog.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              registerNum: true,
            },
          },
        },
      }),
      prisma.scrapeLog.count(),
    ]);

    return NextResponse.json({ logs, total, page, limit });
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
