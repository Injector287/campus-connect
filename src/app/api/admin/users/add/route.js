import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { checkAdmin } from '@/utils/adminAuth';
import { normalizeUsername } from '@/utils/auth';

export async function POST(request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { registerNum } = await request.json();
    const normalized = normalizeUsername(registerNum);

    if (!normalized) {
      return NextResponse.json({ error: 'Valid Register Number required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { registerNum: normalized }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists in the system' }, { status: 400 });
    }

    // Since they haven't logged in, they don't have a password. 
    // We create a dummy password string since the field is required.
    // They will overwrite it when they actually log in.
    const user = await prisma.user.create({
      data: {
        registerNum: normalized,
        password: 'PRE_REGISTERED_NO_PASSWORD',
        status: 'APPROVED'
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Failed to pre-register user:', error);
    return NextResponse.json({ error: 'Failed to add user' }, { status: 500 });
  }
}
