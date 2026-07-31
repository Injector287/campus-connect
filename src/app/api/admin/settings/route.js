import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { checkAdmin } from '@/utils/adminAuth';
import { sanitizeString } from '@/utils/validation';

export async function GET(request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    
    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error('Failed to fetch settings');
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const key = body.key !== undefined ? sanitizeString(String(body.key)) : null;
    const value = body.value !== undefined ? sanitizeString(String(body.value)) : null;

    if (!key || !value) {
      return NextResponse.json({ error: 'Missing or invalid key/value' }, { status: 400 });
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Failed to save setting');
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 });
  }
}
