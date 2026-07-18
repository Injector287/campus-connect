import { NextResponse } from 'next/server';

export const ALLOWED_USERNAME = '25-UCS-003';
export const AUTH_SESSION_VERSION = '1';

export function normalizeUsername(username) {
  return typeof username === 'string' ? username.trim() : '';
}

export function isAllowedUsername(username) {
  return normalizeUsername(username) === ALLOWED_USERNAME;
}

export function hasValidWhitelistedSession(request) {
  const username = normalizeUsername(request.cookies.get('ERP_USERNAME')?.value);
  const version = request.cookies.get('ERP_AUTH_VERSION')?.value;

  return username === ALLOWED_USERNAME && version === AUTH_SESSION_VERSION;
}

export function clearAuthCookies(response) {
  const expiredCookie = { value: '', expires: new Date(0), path: '/' };

  response.cookies.set({ name: 'JSESSIONID', ...expiredCookie });
  response.cookies.set({ name: 'ERP_CREDS', ...expiredCookie });
  response.cookies.set({ name: 'ERP_USERNAME', ...expiredCookie });
  response.cookies.set({ name: 'ERP_AUTH_VERSION', ...expiredCookie });

  return response;
}

export function unauthorizedResponse(message = `Only ${ALLOWED_USERNAME} is allowed to access this ERP app.`) {
  return clearAuthCookies(NextResponse.json({ error: message }, { status: 401 }));
}