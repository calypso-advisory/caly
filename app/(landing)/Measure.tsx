'use client';
import { useEffect, useState } from 'react';
import { track, captureAttribution, isTestMode } from '@/lib/track';

/* Mesure des pages de campagne.
   - Toujours : origine de la visite (session), événements dans le dataLayer.
   - Seulement si NEXT_PUBLIC_GTM_ID est renseigné : Google Tag Manager, chargé avec le consentement
     refusé par défaut (Consent Mode v2), et un bandeau pour accepter ou refuser. */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';
const CONSENT_KEY = 'cal_consent';
const GRANTED = { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' };
const DENIED = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' };

function gtag(..._args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  (window.dataLayer as unknown[]).push(arguments);
}

function stored(): 'granted' | 'denied' | null {
  try { const v = localStorage.getItem(CONSENT_KEY); return v === 'granted' || v === 'denied' ? v : null; } catch { return null; }
}

export default function Measure() {
  const [ask, setAsk] = useState(false);
  const [test, setTest] = useState(false);

  useEffect(() => {
    captureAttribution();
    setTest(isTestMode());
    if (GTM_ID && !window.__calGtm) {
      window.__calGtm = true;
      const choice = stored();
      gtag('consent', 'default', { ...DENIED, wait_for_update: 500 });
      if (choice === 'granted') gtag('consent', 'update', GRANTED);
      window.dataLayer!.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      const s = document.createElement('script');
      s.async = true; s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(GTM_ID);
      document.head.appendChild(s);
      if (!choice) setAsk(true);
    }
    track('landing_view', { page_path: location.pathname });

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-cta]');
      if (el) track('button_click', { cta_id: el.dataset.cta });
      const tel = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="tel:"]');
      if (tel) track('call_click');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  function decide(v: 'granted' | 'denied') {
    try { localStorage.setItem(CONSENT_KEY, v); } catch { /* choix non mémorisé */ }
    gtag('consent', 'update', v === 'granted' ? GRANTED : DENIED);
    track('consent_choice', { consent: v });
    setAsk(false);
  }

  return (
    <>
      {test && <div className="lp-test" role="status">Mode test : la demande sera enregistrée comme un essai, sans alerte ni envoi au CRM.</div>}
      {ask && (
        <div className="lp-consent" role="dialog" aria-label="Mesure d'audience">
          <p>Nous mesurons l'audience de cette page pour l'améliorer. Vous pouvez accepter ou refuser, sans conséquence sur votre demande.</p>
          <div className="lp-consent-actions">
            <button type="button" onClick={() => decide('denied')}>Refuser</button>
            <button type="button" onClick={() => decide('granted')}>Accepter</button>
          </div>
        </div>
      )}
    </>
  );
}
