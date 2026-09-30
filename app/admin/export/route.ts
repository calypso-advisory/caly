import { requireAdmin } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/admin';
import { statutLabel } from '@/lib/demandes';

export const dynamic = 'force-dynamic';

function cell(v: unknown) { const s = v == null ? '' : String(v); return '"' + s.replace(/"/g, '""') + '"'; }

export async function GET() {
  await requireAdmin();
  const { data } = await adminClient()!.from('demandes').select('*').order('created_at', { ascending: false });
  const head = ['Reçue le', 'Nom', 'Société', 'E-mail', 'Téléphone', 'Situation', 'Message', 'Statut', 'Notes'];
  const lines = (data || []).map((d) => [d.created_at, d.nom, d.societe, d.email, d.telephone, d.situation, d.message, statutLabel(d.statut), d.notes].map(cell).join(';'));
  const csv = '﻿' + [head.map(cell).join(';'), ...lines].join('\r\n');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="demandes-calypso-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' } });
}
