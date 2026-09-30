import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/* Server-side client with the service role key: bypasses row-level security.
   Only ever used in route handlers and server components, never shipped to the browser. */
let cached: SupabaseClient | null = null;

export function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!cached) cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}
