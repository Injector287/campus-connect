import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { normalizeUsername } from '@/utils/auth';
import { cookies } from 'next/headers';

export async function GET(request) {
  const cookieStore = await cookies();
  const username = normalizeUsername(cookieStore.get('ERP_USERNAME')?.value);

  if (!username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { registerNum: username } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const suggestions = await prisma.suggestion.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Failed to fetch user suggestions:', error);
    return NextResponse.json({ error: 'Failed to fetch user suggestions' }, { status: 500 });
  }
}

export async function POST(request) {
  const cookieStore = await cookies();
  const username = normalizeUsername(cookieStore.get('ERP_USERNAME')?.value);

  if (!username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { registerNum: username } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    const suggestion = await prisma.suggestion.create({
      data: {
        userId: user.id,
        content
      }
    });

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error('Failed to create suggestion:', error);
    return NextResponse.json({ error: 'Failed to create suggestion' }, { status: 500 });
  }
}
