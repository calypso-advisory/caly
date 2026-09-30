import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { SITUATIONS } from '@/lib/demandes';

export const runtime = 'nodejs';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function clean(v: unknown, max: number) { return typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : ''; }
function esc(s: string) { return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)); }

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid' }, { status: 400 }); }

  /* bots fill the hidden field: answer as if it worked, store nothing */
  if (clean(body.website, 200)) return NextResponse.json({ ok: true });

  const d = {
    situation: SITUATIONS.includes(clean(body.situation, 60)) ? clean(body.situation, 60) : null,
    message: clean(body.message, 5000) || null,
    nom: clean(body.nom, 160),
    societe: clean(body.societe, 200) || null,
    email: clean(body.email, 200).toLowerCase(),
    telephone: clean(body.telephone, 40) || null
  };
  if (!d.nom || !EMAIL.test(d.email)) return NextResponse.json({ error: 'invalid' }, { status: 422 });

  const db = adminClient();
  if (!db) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  /* light flood guard: at most 3 requests per address in 10 minutes */
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await db.from('demandes').select('id', { count: 'exact', head: true }).eq('email', d.email).gte('created_at', since);
  if ((count || 0) >= 3) return NextResponse.json({ ok: true });

  const { data, error } = await db.from('demandes').insert({ ...d, user_agent: clean(req.headers.get('user-agent'), 300) || null }).select('id').single();
  if (error) { console.error('contact insert failed', error.message); return NextResponse.json({ error: 'server' }, { status: 500 }); }

  /* alert the team; the e-mail carries no confidential detail, only a link to the dashboard */
  const key = process.env.RESEND_API_KEY, to = process.env.ALERT_EMAIL_TO;
  if (key && to) {
    const site = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
    const link = `${site}/admin/demandes/${data.id}`;
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.ALERT_EMAIL_FROM || 'Calypso Advisory <onboarding@resend.dev>',
          to: to.split(',').map((s) => s.trim()).filter(Boolean),
          subject: `Nouvelle demande : ${d.nom}${d.societe ? ' (' + d.societe + ')' : ''}`,
          html: `<p>Une nouvelle demande vient d'arriver par le site.</p><p><strong>${esc(d.nom)}</strong>${d.societe ? ' · ' + esc(d.societe) : ''}<br>Situation : ${esc(d.situation || 'non précisée')}</p><p><a href="${link}">Ouvrir la demande dans le tableau de bord</a></p>`
        })
      });
    } catch (e) { console.error('alert e-mail failed', e); }
  }
  return NextResponse.json({ ok: true });
}
