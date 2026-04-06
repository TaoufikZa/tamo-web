import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore error when called from Server Component
          }
        },
      },
    }
  );

  // Validate the token against existing sessions table
  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, customer_id, expires_at, is_active')
    .eq('id', token)
    .single();

  // Ensure session exists and is_active is true
  if (error || !session || session.is_active === false) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // Check expiration
  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/unauthorized?reason=expired', request.url));
  }

  // Valid session. Redirect to homepage stripping the token.
  const response = NextResponse.redirect(new URL('/', request.url));
  
  // Set the secure HTTP-only cookie containing session and customer IDs
  response.cookies.set('tamo_session', JSON.stringify({
    session_id: session.id,
    customer_id: session.customer_id
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
