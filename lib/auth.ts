import 'server-only';
import { redirect } from 'next/navigation';
import { sessionClient } from './supabase/server';

export function supabaseConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isAllowed(email?: string | null) {
  const list = (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}

/* Every admin page and action calls this: signed in AND on the allow-list, otherwise back to the login page. */
export async function requireAdmin() {
  if (!supabaseConfigured()) redirect('/admin/login?e=config');
  const supabase = await sessionClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/admin/login');
  if (!isAllowed(data.user.email)) redirect('/admin/login?e=forbidden');
  return data.user;
}
