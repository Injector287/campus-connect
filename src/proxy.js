import { NextResponse } from 'next/server';

export function proxy(request) {
  const url = request.nextUrl;
  
  // If the user visits the root page and has an active session cookie, skip login
  if (url.pathname === '/') {
    const hasSession = request.cookies.has('ERP_USERNAME') || request.cookies.has('JSESSIONID');
    
    if (hasSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
