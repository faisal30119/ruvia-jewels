'use client';
import { createClient } from '@/lib/supabase/client';

export async function getAuthHeader(): Promise<{ Authorization: string } | {}> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeader = await getAuthHeader();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...authHeader,
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

export function formatPrice(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

export function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
