import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get session cookie
  const session = request.cookies.get('session');

  // Public routes that don't require authentication
  const publicPaths = ['/', '/login', '/signup'];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);

  // API routes starting with /api/v1 use API key auth (handled in routes)
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/v1');

  // If accessing dashboard without session, redirect to login
  if (request.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If accessing login/signup with session, redirect to dashboard
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};

