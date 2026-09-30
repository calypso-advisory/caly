import 'server-only';
import { redirect } from 'next/navigation';
import { sessionClient } from './supabase/server';

export function supabaseConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/* Optional extra lock: if ADMIN_EMAILS is set, the account must also be listed there. */
function envAllows(email?: string | null) {
  const list = (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.length === 0 || (!!email && list.includes(email.toLowerCase()));
}

/* Every admin page and action calls this. Access is granted by the database itself
   (table "admins", checked by row-level security), so the returned client only sees what an admin may see. */
export async function requireAdmin() {
  if (!supabaseConfigured()) redirect('/admin/login?e=config');
  const supabase = await sessionClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/admin/login');
  const { data: ok } = await supabase.rpc('is_admin');
  if (ok !== true || !envAllows(data.user.email)) redirect('/admin/login?e=forbidden');
  return { user: data.user, db: supabase };
}
