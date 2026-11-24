'use client';
import { useState } from 'react';
import { normalizePhone } from '@/lib/phone';
import { track, isTestMode } from '@/lib/track';

/* « Ne plus être contacté » : le numéro est enregistré et signalé au CRM, qui le retire des envois. */
export default function OppositionForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [fail, setFail] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    const tel = String(f.get('telephone') || '').trim();
    setErr(''); setFail('');
    if (!normalizePhone(tel)) { setErr('Indiquez un numéro français valide, par exemple 06 12 34 56 78.'); document.getElementById('op-tel')?.focus(); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/opposition', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telephone: tel, societe: String(f.get('societe') || ''), website: String(f.get('website') || ''), landing: 'opposition', test: isTestMode() })
      });
      if (res.ok) { track('opposition_submitted'); setDone(true); }
      else setFail("L'enregistrement n'a pas abouti. Vous pouvez réessayer dans un instant, ou écrire à audit@calypso-advisory.com.");
    } catch {
      setFail("L'enregistrement n'a pas abouti. Vérifiez votre connexion, ou écrivez à audit@calypso-advisory.com.");
    } finally { setBusy(false); }
  }

  if (done) {
    return (
      <div className="fp-form lp-form" role="status" aria-live="polite">
        <h2>C'est noté.</h2>
        <p className="lp-done">Ce numéro ne recevra plus de message de notre part.</p>
      </div>
    );
  }

  return (
    <form className="fp-form lp-form" id="opForm" noValidate onSubmit={onSubmit}>
      <h2>Votre numéro</h2>
      <div className="hp" aria-hidden="true"><label>Site web<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="fields">
        <label className="field" htmlFor="op-tel">Téléphone
          <input id="op-tel" name="telephone" type="tel" inputMode="tel" autoComplete="tel" required aria-invalid={!!err} aria-describedby="op-err-tel" />
          <span className="err" id="op-err-tel">{err}</span>
        </label>
        <label className="field" htmlFor="op-societe">Entreprise (facultatif)
          <input id="op-societe" name="societe" type="text" autoComplete="organization" />
        </label>
      </div>
      <div><button className="btn btn-light mag" type="submit" aria-busy={busy || undefined} disabled={busy}>Ne plus être contacté</button></div>
      {fail && <div className="notice ko" role="status" aria-live="polite">{fail}</div>}
    </form>
  );
}
