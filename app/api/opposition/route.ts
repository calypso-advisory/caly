import { NextResponse } from 'next/server';
import { anonClient } from '@/lib/supabase/anon';
import { normalizePhone } from '@/lib/phone';
import { forwardToCrm } from '@/lib/crm';

export const runtime = 'nodejs';

function clean(v: unknown, max: number) { return typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : ''; }

/* « Ne plus être contacté » : enregistre le numéro et le signale au CRM, qui alimente la liste d'opposition des envois. */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid' }, { status: 400 }); }
  if (clean(body.website, 200)) return NextResponse.json({ ok: true });

  const telephone = normalizePhone(clean(body.telephone, 40));
  if (!telephone) return NextResponse.json({ error: 'invalid', field: 'telephone' }, { status: 422 });
  const societe = clean(body.societe, 200);

  const db = anonClient();
  if (!db) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const { error } = await db.rpc('submit_opposition', {
    p_telephone: telephone, p_societe: societe || null, p_landing: clean(body.landing, 60) || null,
    p_user_agent: clean(req.headers.get('user-agent'), 300) || null
  });
  if (error) {
    if (error.code === '22023') return NextResponse.json({ error: 'invalid', field: 'telephone' }, { status: 422 });
    console.error('submit_opposition failed', error.code, error.message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  if (body.test !== true) await forwardToCrm({ event: 'opposition', form_type: 'opposition', phone: telephone, company: societe });
  return NextResponse.json({ ok: true });
}
