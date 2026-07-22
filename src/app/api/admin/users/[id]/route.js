import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { checkAdmin } from '@/utils/adminAuth';

export async function PATCH(request, { params }) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  // params is a promise in Next.js 15, we should await it if needed, but in 14 it might be synchronous. Next.js App router handles this.
  const { id } = await params;
  
  try {
    const body = await request.json();
    const { role, status, customRateLimit } = body;

    if (role !== undefined || status !== undefined) {
      if (id === admin.id) {
        return NextResponse.json({ error: 'You cannot change your own role or status' }, { status: 400 });
      }
      
      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (targetUser && targetUser.registerNum === '25-UCS-003') {
        return NextResponse.json({ error: 'The primary admin account cannot be modified' }, { status: 400 });
      }
    }

    const data = {};
    if (role !== undefined) data.role = role;
    if (status !== undefined) data.status = status;
    if (customRateLimit !== undefined) data.customRateLimit = customRateLimit === '' ? null : parseInt(customRateLimit, 10);
    
    if (body.forceLogout === true) {
      data.sessionVersion = { increment: 1 };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        registerNum: true,
        role: true,
        status: true,
        customRateLimit: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
