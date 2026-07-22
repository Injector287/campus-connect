import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { checkAdmin } from '@/utils/adminAuth';

export async function GET(request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const suggestions = await prisma.suggestion.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { registerNum: true }
        }
      }
    });
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Failed to fetch suggestions:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}
