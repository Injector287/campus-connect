import { NextResponse } from 'next/server';
import { hasValidWhitelistedSession, unauthorizedResponse } from '@/utils/auth';
import { db } from '@/lib/db';

export async function POST(request) {
  try {
    if (!(await hasValidWhitelistedSession(request))) {
      return unauthorizedResponse();
    }

    const registerNum = request.cookies.get('ERP_USERNAME')?.value;
    if (!registerNum) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { mobileNav } = body;

    if (!Array.isArray(mobileNav)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Persist as a JSON string
    await db.user.update({
      where: { registerNum },
      data: { mobileNav: JSON.stringify(mobileNav) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Profile Nav API] Error updating mobile nav:', error);
    return NextResponse.json({ error: 'Failed to update navigation configuration' }, { status: 500 });
  }
}
