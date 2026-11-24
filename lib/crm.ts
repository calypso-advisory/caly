import 'server-only';

/* Transmission au CRM (Pipax). Active seulement si CRM_WEBHOOK_URL est renseignée dans Vercel.
   Jamais bloquante pour le visiteur : un échec est journalisé (journaux Vercel) et la demande
   reste enregistrée dans la base et visible dans /admin. */
export type CrmEvent = {
  event: 'lead_created' | 'opposition';
  form_type: string;
  campagne?: string | null;
  landing_id?: string | null;
  lead_id?: string | null;
  first_name?: string; last_name?: string; phone?: string; email?: string;
  company?: string; siren?: string | null;
  situation?: string; message?: string;
  extra?: Record<string, unknown>;
};

export async function forwardToCrm(payload: CrmEvent): Promise<'skipped' | 'sent' | 'failed'> {
  const url = process.env.CRM_WEBHOOK_URL;
  if (!url) return 'skipped';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (process.env.CRM_WEBHOOK_TOKEN) headers.Authorization = `Bearer ${process.env.CRM_WEBHOOK_TOKEN}`;
    const res = await fetch(url, {
      method: 'POST', headers, signal: ctrl.signal,
      body: JSON.stringify({ source: 'calypso-advisory.com', submitted_at: new Date().toISOString(), ...payload })
    });
    if (!res.ok) { console.error('crm forward refused', res.status, payload.event, payload.lead_id || ''); return 'failed'; }
    return 'sent';
  } catch (e) {
    console.error('crm forward failed', payload.event, payload.lead_id || '', e instanceof Error ? e.message : e);
    return 'failed';
  } finally { clearTimeout(timer); }
}

/* « Jean Dupont » -> prénom « Jean », nom « Dupont » (le formulaire a un seul champ, comme sur le site). */
export function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return { first_name: '', last_name: full.trim() };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}
