import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Update Supabase session
  const supabaseResponse = await updateSession(request);

  // Get session cookie
  const session = request.cookies.get('session');

  // Public routes that don't require authentication
  const publicPaths = [
    '/', 
    '/login', 
    '/signup',
    '/api/connections/callback', // OAuth callback must be public
    '/auth/oauth-success', // OAuth success page must be public
  ];
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path)
  );

  // API routes starting with /api/v1 use API key auth (handled in routes)
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/v1');

  // Allow public paths and API routes
  if (isPublicPath || isApiRoute) {
    return supabaseResponse;
  }

  // If accessing dashboard without session, redirect to login
  // But preserve the current URL to redirect back after login
  if (request.nextUrl.pathname.startsWith('/dashboard') && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing login/signup with session, redirect to dashboard
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') && session) {
    // Check if there's a redirect parameter
    const redirect = request.nextUrl.searchParams.get('redirect');
    if (redirect) {
      return NextResponse.redirect(new URL(redirect, request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
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

