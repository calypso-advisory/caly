import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/* Public (anon) client used by the contact form on the server.
   It can only call the controlled function submit_demande: it cannot read any request. */
let cached: SupabaseClient | null = null;

export function anonClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!cached) cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}
