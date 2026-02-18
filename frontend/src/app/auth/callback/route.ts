/**
 * OAuth Callback Route
 * Handles the redirect from Supabase OAuth providers (Google, etc.)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  console.log('[auth/callback] code present:', !!code);
  console.log('[auth/callback] origin:', origin);
  console.log('[auth/callback] SUPABASE_URL set:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      console.log('[auth/callback] exchangeCodeForSession error:', error?.message || 'none');

      if (!error) {
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';

        let redirectUrl: string;
        if (isLocalEnv) {
          redirectUrl = `${origin}${next}`;
        } else if (forwardedHost) {
          redirectUrl = `https://${forwardedHost}${next}`;
        } else {
          redirectUrl = `${origin}${next}`;
        }

        console.log('[auth/callback] redirecting to:', redirectUrl);
        return NextResponse.redirect(redirectUrl);
      }
    } catch (err) {
      console.error('[auth/callback] unexpected error:', err);
    }
  }

  // Return the user to an error page with instructions
  console.log('[auth/callback] falling through to error redirect');
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
