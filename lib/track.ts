/* Suivi des pages de campagne (navigateur uniquement).
   Les événements partent dans window.dataLayer. Sans Google Tag Manager (NEXT_PUBLIC_GTM_ID vide),
   ils restent sur la page et rien n'est envoyé. Aucune donnée personnelle en clair : le téléphone et
   l'e-mail ne sont transmis que hachés (SHA-256), pour les conversions améliorées. */

type Layer = Record<string, unknown>[];
declare global { interface Window { dataLayer?: Layer; __calGtm?: boolean } }

const ATTR_KEY = 'cal_attr';
const ATTR_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];

function context() {
  const m = document.querySelector<HTMLElement>('main[data-landing]');
  return m ? { landing_id: m.dataset.landing || '', campagne: m.dataset.campagne || '' } : {};
}

export function track(event: string, data: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...context(), ...data });
}

/* Origine de la visite : lue à l'arrivée, gardée pour la session seulement (pas de stockage durable). */
export function captureAttribution() {
  try {
    if (sessionStorage.getItem(ATTR_KEY)) return;
    const q = new URLSearchParams(location.search), a: Record<string, string> = {};
    ATTR_PARAMS.forEach((k) => { const v = q.get(k); if (v) a[k] = v.slice(0, 300); });
    if (document.referrer) a.referrer = document.referrer.slice(0, 300);
    a.landing_path = location.pathname;
    sessionStorage.setItem(ATTR_KEY, JSON.stringify(a));
  } catch { /* stockage indisponible : on continue sans */ }
}

export function readAttribution(): Record<string, string> {
  try { return JSON.parse(sessionStorage.getItem(ATTR_KEY) || '{}'); } catch { return {}; }
}

export async function sha256(value: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch { return ''; }
}

export function isTestMode() {
  try { return new URLSearchParams(location.search).get('test') === '1'; } catch { return false; }
}
