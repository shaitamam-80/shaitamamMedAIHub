/**
 * Supabase Middleware Client
 * Used in Next.js middleware to refresh auth session tokens
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Tool slug aliases — maps personal-site URLs to real MedAI Hub tool slugs.
 * Personal site links to /define, /query, /review; MedAI Hub uses /tools/question, etc.
 */
const TOOL_ALIASES: Record<string, string> = {
  '/define': '/tools/question',
  '/query': '/tools/search',
  '/review': '/tools/screening',
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not write any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Define public routes that don't need authentication
  const publicRoutes = ['/login', '/auth/callback', '/landing'];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // --- Tool aliases for AUTHENTICATED users ---
  // If logged in and hitting /define, /query, /review → redirect to actual tool
  const alias = TOOL_ALIASES[pathname];
  if (alias && user) {
    const url = request.nextUrl.clone();
    url.pathname = alias;
    return NextResponse.redirect(url);
  }

  // --- Unauthenticated redirects ---

  // If not authenticated and on root (/), redirect to landing page
  if (!user && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/landing';
    // Forward ?lang= if present
    const lang = request.nextUrl.searchParams.get('lang');
    if (lang) url.searchParams.set('lang', lang);
    return NextResponse.redirect(url);
  }

  // If not authenticated and not on a public route, redirect to landing
  // Preserve ?from= (original path) and ?lang= for context
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/landing';
    // Tell the landing page where they wanted to go
    if (pathname !== '/') {
      url.searchParams.set('from', pathname);
    }
    // Forward ?lang= if present
    const lang = request.nextUrl.searchParams.get('lang');
    if (lang) url.searchParams.set('lang', lang);
    return NextResponse.redirect(url);
  }

  // If authenticated and on login/register page, redirect to ?next= destination or dashboard
  // Note: /landing is accessible to authenticated users too (it's the main site page)
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.searchParams.get('next');
    // Validate: must be relative path, no open redirect
    url.pathname = (next && next.startsWith('/') && !next.startsWith('//')) ? next : '/';
    url.search = ''; // Clean up query params
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
