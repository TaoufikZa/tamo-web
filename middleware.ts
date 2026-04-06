import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    const url = request.nextUrl.clone();
    const token = url.searchParams.get('token');

    // 1. If a token is present, hand it over to the Auth Route Handler
    if (token) {
      url.pathname = '/api/auth';
      // Maintain the searchParams (includes the token)
      return NextResponse.redirect(url);
    }

    // 2. Allow access to auth-related public routes and assets
    const publicPaths = ['/api/auth', '/unauthorized', '/favicon.ico'];
    if (publicPaths.some(path => url.pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // 3. Check for the 'tamo_session' cookie on all other routes
    const sessionCookie = request.cookies.get('tamo_session');
    if (!sessionCookie) {
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware execution failed:', error);
    // Fallback gracefully instead of crashing the site
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
