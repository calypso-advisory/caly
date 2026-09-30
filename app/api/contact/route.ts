import { NextResponse } from 'next/server';
import { anonClient } from '@/lib/supabase/anon';

export const runtime = 'nodejs';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function clean(v: unknown, max: number) { return typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : ''; }
function esc(s: string) { return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)); }

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid' }, { status: 400 }); }

  /* bots fill the hidden field: answer as if it worked, store nothing */
  if (clean(body.website, 200)) return NextResponse.json({ ok: true });

  const nom = clean(body.nom, 160), email = clean(body.email, 200).toLowerCase();
  const societe = clean(body.societe, 200), situation = clean(body.situation, 60);
  if (!nom || !EMAIL.test(email)) return NextResponse.json({ error: 'invalid' }, { status: 422 });

  const db = anonClient();
  if (!db) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  /* validation, flood guard and insertion happen in the database (function submit_demande) */
  const { data: id, error } = await db.rpc('submit_demande', {
    p_nom: nom, p_email: email, p_societe: societe || null, p_telephone: clean(body.telephone, 40) || null,
    p_situation: situation || null, p_message: clean(body.message, 5000) || null, p_user_agent: clean(req.headers.get('user-agent'), 300) || null
  });
  if (error) {
    if (error.code === '22023') return NextResponse.json({ error: 'invalid' }, { status: 422 });
    console.error('submit_demande failed', error.message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  if (!id) return NextResponse.json({ ok: true }); /* flood guard: silently ignored */

  /* alert the team; the e-mail carries no confidential detail, only a link to the dashboard */
  const key = process.env.RESEND_API_KEY, to = process.env.ALERT_EMAIL_TO;
  if (key && to) {
    const site = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.ALERT_EMAIL_FROM || 'Calypso Advisory <onboarding@resend.dev>',
          to: to.split(',').map((s) => s.trim()).filter(Boolean),
          subject: `Nouvelle demande : ${nom}${societe ? ' (' + societe + ')' : ''}`,
          html: `<p>Une nouvelle demande vient d'arriver par le site.</p><p><strong>${esc(nom)}</strong>${societe ? ' · ' + esc(societe) : ''}<br>Situation : ${esc(situation || 'non précisée')}</p><p><a href="${site}/admin/demandes/${id}">Ouvrir la demande dans le tableau de bord</a></p>`
        })
      });
    } catch (e) { console.error('alert e-mail failed', e); }
  }
  return NextResponse.json({ ok: true });
}
