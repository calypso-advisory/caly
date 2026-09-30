import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/* Session-aware client (anon key + auth cookies), used to know who is signed in. */
export async function sessionClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => { try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* read-only in server components */ } }
    }
  });
}
