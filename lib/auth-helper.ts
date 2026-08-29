import { supabaseAdmin } from './supabase/admin';

const ADMIN_EMAILS = ['faisal301196@gmail.com', 'almasladiescornersakchi@gmail.com'];

export async function getAuthUser(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);
    if (!error && user) return user;
  }

  // Fallback to cookie-based session
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (!error && user) return user;
  } catch (err) {
    // ignore
  }

  return null;
}

export async function requireAuth(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return { user: null, error: 'Unauthorized' };
  return { user, error: null };
}

export async function requireAdmin(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return { user: null, error: 'Unauthorized' };
  const envAdmins =
    process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map((e) => e.trim()) ?? [];
  const allAdmins = [...ADMIN_EMAILS, ...envAdmins];
  if (!allAdmins.includes(user.email ?? '')) return { user: null, error: 'Forbidden' };
  return { user, error: null };
}
