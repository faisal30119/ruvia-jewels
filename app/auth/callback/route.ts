import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null;
  const next = requestUrl.searchParams.get('next') ?? '/profile';

  const cookieStore = cookies();
  const redirectTo = new URL(next, requestUrl.origin);
  const response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, (options ?? {}) as Parameters<typeof response.cookies.set>[2]);
          });
        },
      },
    }
  );

  let verifiedUser = null;

  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (error) {
      console.error('[auth/callback] verifyOtp error:', error.message);
      return NextResponse.redirect(
        new URL(`/?auth_error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      );
    }
    verifiedUser = data.user;
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[auth/callback] exchangeCodeForSession error:', error.message);
      return NextResponse.redirect(
        new URL(`/?auth_error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      );
    }
    verifiedUser = data.user;
  }

  if (!verifiedUser) {
    const { data: { user } } = await supabase.auth.getUser();
    verifiedUser = user;
  }

  if (verifiedUser) {
    // Upsert user profile
    try {
      await supabase.from('user_profiles').upsert(
        {
          uid: verifiedUser.id,
          email: verifiedUser.email!,
          display_name:
            verifiedUser.user_metadata?.display_name ??
            verifiedUser.user_metadata?.full_name ??
            verifiedUser.email?.split('@')[0] ??
            '',
        },
        { onConflict: 'uid' }
      );
    } catch (err) {
      console.error('[auth/callback] user_profiles upsert error:', err);
    }
  }

  return response;
}
