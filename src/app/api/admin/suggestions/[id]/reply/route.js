import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { checkAdmin } from '@/utils/adminAuth';

export async function POST(request, { params }) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { adminReply } = body;

    if (!adminReply) {
      return NextResponse.json({ error: 'Missing admin reply' }, { status: 400 });
    }

    const suggestion = await prisma.suggestion.update({
      where: { id },
      data: {
        adminReply,
        repliedAt: new Date()
      }
    });

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error('Failed to reply to suggestion:', error);
    return NextResponse.json({ error: 'Failed to reply to suggestion' }, { status: 500 });
  }
}
