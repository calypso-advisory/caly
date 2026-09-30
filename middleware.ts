import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/* Keeps the admin session fresh and sends visitors without a session to the login page. */
export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isLogin = req.nextUrl.pathname.startsWith('/admin/login');
  if (!url || !anon) return isLogin ? NextResponse.next() : NextResponse.redirect(new URL('/admin/login?e=config', req.url));

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      }
    }
  });
  const { data } = await supabase.auth.getUser();
  if (!data.user && !isLogin) return NextResponse.redirect(new URL('/admin/login', req.url));
  return res;
}

export const config = { matcher: ['/admin/:path*'] };
