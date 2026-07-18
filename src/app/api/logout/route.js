import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/utils/auth';

export async function POST(request) {
    const response = NextResponse.json({ success: true });
    return clearAuthCookies(response);
}
