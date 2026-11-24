import { NextResponse } from 'next/server';
import { anonClient } from '@/lib/supabase/anon';
import { landingById } from '@/content/landings';
import { normalizePhone, extractSiren } from '@/lib/phone';
import { forwardToCrm, splitName } from '@/lib/crm';

export const runtime = 'nodejs';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'referrer', 'landing_path'];
function clean(v: unknown, max: number) { return typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : ''; }
function esc(s: string) { return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)); }

/* Demande déposée depuis une page de campagne (/rj, /options, /audience, /kbis).
   Téléphone obligatoire, e-mail facultatif. La campagne est déduite de la page côté serveur. */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid' }, { status: 400 }); }

  /* les robots remplissent le champ caché : on répond comme si tout allait bien, sans rien enregistrer */
  if (clean(body.website, 200)) return NextResponse.json({ ok: true });

  const landing = landingById(clean(body.landing, 60));
  if (!landing) return NextResponse.json({ error: 'invalid', field: 'landing' }, { status: 422 });

  const nom = clean(body.nom, 160);
  const telephone = normalizePhone(clean(body.telephone, 40));
  const email = clean(body.email, 200).toLowerCase();
  const societe = clean(body.societe, 200);
  const situation = clean(body.situation, 60);
  const message = clean(body.message, 5000);
  const test = body.test === true;
  if (!nom) return NextResponse.json({ error: 'invalid', field: 'nom' }, { status: 422 });
  if (!telephone) return NextResponse.json({ error: 'invalid', field: 'telephone' }, { status: 422 });
  if (email && !EMAIL.test(email)) return NextResponse.json({ error: 'invalid', field: 'email' }, { status: 422 });

  const rawAttr = (body.attribution && typeof body.attribution === 'object' ? body.attribution : {}) as Record<string, unknown>;
  const attribution: Record<string, string> = {};
  for (const k of ATTR_KEYS) { const v = clean(rawAttr[k], 300); if (v) attribution[k] = v; }
  if (!attribution.utm_source) { attribution.utm_source = landing.canal; attribution.utm_medium = landing.canal; attribution.utm_campaign = landing.campagne; }

  const db = anonClient();
  if (!db) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const siren = extractSiren(societe);
  const { data: id, error } = await db.rpc('submit_demande_campagne', {
    p_nom: nom, p_telephone: telephone, p_email: email || null, p_societe: societe || null, p_siren: siren,
    p_situation: situation || null, p_message: message || null, p_campagne: landing.campagne, p_landing: landing.id,
    p_attribution: attribution, p_test: test, p_user_agent: clean(req.headers.get('user-agent'), 300) || null
  });
  if (error) {
    if (error.code === '22023') return NextResponse.json({ error: 'invalid' }, { status: 422 });
    console.error('submit_demande_campagne failed', error.code, error.message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  if (!id) return NextResponse.json({ ok: true }); /* garde anti-envois : ignoré en silence */

  /* mode test : la demande est marquée comme test, rien ne part vers le CRM ni par e-mail */
  if (test) return NextResponse.json({ ok: true, test: true });

  const crm = await forwardToCrm({
    event: 'lead_created', form_type: `${landing.canal}-${landing.id}`, campagne: landing.campagne, landing_id: landing.id, lead_id: String(id),
    ...splitName(nom), phone: telephone, email, company: societe, siren, situation, message,
    extra: { attribution, source_url: `/${landing.id}` }
  });

  /* alerte à l'équipe : aucun détail confidentiel, seulement un lien vers le tableau de bord */
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
          subject: `Nouvelle demande (${landing.campagne}) : ${nom}${societe ? ' (' + societe + ')' : ''}`,
          html: `<p>Une nouvelle demande vient d'arriver par la page /${esc(landing.id)}.</p><p><strong>${esc(nom)}</strong>${societe ? ' · ' + esc(societe) : ''}<br>Campagne : ${esc(landing.campagne)}</p><p><a href="${site}/admin/demandes/${id}">Ouvrir la demande dans le tableau de bord</a></p>`
        })
      });
    } catch (e) { console.error('alert e-mail failed', e); }
  }
  return NextResponse.json({ ok: true, crm });
}
