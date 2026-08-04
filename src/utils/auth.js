import { NextResponse } from 'next/server';


export function normalizeUsername(username) {
  if (typeof username !== 'string') return '';
  let str = username.trim().toUpperCase().replace(/[- ]/g, '');
  
  // Loyola Register Number strict pattern: YY-DDD-RRR (2 digits, 3 letters, 3 digits)
  const match = str.match(/^(\d{2})([A-Z]{3})(\d{3})$/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return str;
}

import { db } from '@/lib/db';

export async function hasValidWhitelistedSession(request) {
  const username = normalizeUsername(request.cookies.get('ERP_USERNAME')?.value);
  const version = request.cookies.get('ERP_AUTH_VERSION')?.value;

  if (!username || !version) return false;

  try {
    const user = await db.user.findUnique({ where: { registerNum: username } });
    if (!user) {
      console.log(`[Auth] User ${username} not found in DB`);
      return false;
    }
    const modeSetting = await db.setting.findUnique({ where: { key: 'ACCESS_MODE' } });
    const accessMode = modeSetting?.value || 'BLACKLIST';

    if (accessMode === 'WHITELIST') {
      if (user.status !== 'APPROVED' && user.role !== 'ADMIN') {
        console.log(`[Auth] Whitelist mode active. User ${username} denied.`);
        return false;
      }
    } else {
      if (user.status === 'BANNED') {
        console.log(`[Auth] User ${username} is BANNED`);
        return false;
      }
    }
    const dbVersion = user.sessionVersion ?? 1;
    const cookieVersion = parseInt(version, 10);
    if (cookieVersion !== dbVersion) {
      console.log(`[Auth] Version mismatch for ${username}. Cookie: ${cookieVersion}, DB: ${dbVersion}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[Auth] Error checking session:`, e);
    return false;
  }
}

export function clearAuthCookies(response) {
  const expiredCookie = { value: '', expires: new Date(0), path: '/' };

  response.cookies.set({ name: 'JSESSIONID', ...expiredCookie });
  response.cookies.set({ name: 'ERP_CREDS', ...expiredCookie });
  response.cookies.set({ name: 'ERP_USERNAME', ...expiredCookie });
  response.cookies.set({ name: 'ERP_AUTH_VERSION', ...expiredCookie });

  return response;
}

export function unauthorizedResponse(message = 'Access denied.') {
  return clearAuthCookies(NextResponse.json({ error: message }, { status: 401 }));
}