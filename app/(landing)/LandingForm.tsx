'use client';
import { useRef, useState } from 'react';
import { SITUATIONS, COMMON } from '@/content/landings';
import { normalizePhone } from '@/lib/phone';
import { track, sha256, readAttribution, isTestMode } from '@/lib/track';

/* Formulaire « Où en êtes-vous ? » des pages de campagne.
   Mêmes options que /faire-le-point, la situation est pré-cochée selon la page.
   Le visiteur vient d'un SMS : le téléphone est obligatoire, l'e-mail facultatif.
   L'identifiant est « lpForm » (et non « form ») pour que le script du site ne s'en occupe pas. */
type Errs = { nom?: string; telephone?: string; email?: string };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LandingForm({ landing, situation }: { landing: string; situation: string }) {
  const [sit, setSit] = useState(situation);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [errs, setErrs] = useState<Errs>({});
  const [fail, setFail] = useState('');
  const started = useRef(false);

  function onStart() { if (!started.current) { started.current = true; track('form_start'); } }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) || '').trim();
    const nom = get('nom'), tel = get('telephone'), email = get('email');
    const phone = normalizePhone(tel);
    const next: Errs = {};
    if (!nom) next.nom = 'Indiquez votre nom pour que nous puissions vous rappeler.';
    if (!phone) next.telephone = 'Indiquez un numéro français valide, par exemple 06 12 34 56 78.';
    if (email && !EMAIL.test(email)) next.email = 'Vérifiez cette adresse e-mail, ou laissez le champ vide.';
    setErrs(next); setFail('');
    if (next.nom || next.telephone || next.email) {
      const first = next.nom ? 'lp-nom' : next.telephone ? 'lp-tel' : 'lp-mail';
      document.getElementById(first)?.focus();
      track('form_error', { fields: Object.keys(next).join(',') });
      return;
    }
    const test = isTestMode();
    setBusy(true);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landing, situation: sit, nom, telephone: tel, email, societe: get('societe'), message: get('message'),
          website: get('website'), attribution: readAttribution(), test
        })
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        const [phone_sha256, email_sha256] = await Promise.all([sha256(phone!), email ? sha256(email.toLowerCase()) : Promise.resolve('')]);
        if (test) track('test_submission', { form_type: 'lead' });
        else track('lead_form_success', { form_type: 'lead', situation: sit, user_data_hashed: { phone_sha256, ...(email_sha256 ? { email_sha256 } : {}) } });
        setDone(true);
      } else {
        const field = (j as { field?: string }).field;
        if (field === 'telephone') setErrs({ telephone: 'Ce numéro ne semble pas valide. Vérifiez-le, par exemple 06 12 34 56 78.' });
        else if (field === 'email') setErrs({ email: 'Vérifiez cette adresse e-mail, ou laissez le champ vide.' });
        else setFail("L'envoi n'a pas abouti. Vous pouvez réessayer dans un instant, ou écrire directement à audit@calypso-advisory.com.");
        track('form_error', { status: res.status });
      }
    } catch {
      setFail("L'envoi n'a pas abouti. Vérifiez votre connexion, ou écrivez directement à audit@calypso-advisory.com.");
    } finally { setBusy(false); }
  }

  if (done) {
    return (
      <div className="fp-form lp-form" id="lpForm" role="status" aria-live="polite">
        <h2>Merci.</h2>
        <p className="lp-done">Votre demande nous est bien parvenue. Un membre de l'équipe revient vers vous sous 24 heures ouvrées.</p>
        <div className="micro">{COMMON.micro}</div>
      </div>
    );
  }

  return (
    <form className={'fp-form lp-form' + (open ? '' : ' lp-collapsed')} id="lpForm" noValidate onSubmit={onSubmit} onFocus={onStart}>
      <h2>Où en êtes-vous{' '}?</h2>
      <div className="fields">
        <label className="field" htmlFor="lp-nom">Nom et prénom
          <input id="lp-nom" name="nom" type="text" autoComplete="name" required aria-invalid={!!errs.nom} aria-describedby="lp-err-nom" />
          <span className="err" id="lp-err-nom">{errs.nom}</span>
        </label>
        <label className="field" htmlFor="lp-tel">Téléphone
          <input id="lp-tel" name="telephone" type="tel" inputMode="tel" autoComplete="tel" required aria-invalid={!!errs.telephone} aria-describedby="lp-err-tel" />
          <span className="err" id="lp-err-tel">{errs.telephone}</span>
        </label>
        <label className="field" htmlFor="lp-societe">Entreprise (nom ou SIREN)
          <input id="lp-societe" name="societe" type="text" autoComplete="organization" />
        </label>
        <label className="field" htmlFor="lp-mail">Adresse e-mail (facultatif)
          <input id="lp-mail" name="email" type="email" autoComplete="email" aria-invalid={!!errs.email} aria-describedby="lp-err-mail" />
          <span className="err" id="lp-err-mail">{errs.email}</span>
        </label>
      </div>
      <fieldset>
        <legend>Qu'est-ce qui vous préoccupe aujourd'hui{' '}?</legend>
        <p className="hint">{open ? 'Sélectionnez la situation la plus proche.' : 'Nous avons retenu la situation la plus proche. Vous pouvez la changer.'}</p>
        {SITUATIONS.map((s) => (
          <label className="opt" key={s.value}>
            <input type="radio" name="situation" value={s.value} checked={sit === s.value} onChange={() => setSit(s.value)} />{s.label}
          </label>
        ))}
        {!open && <button type="button" className="lp-more" onClick={() => setOpen(true)}>Choisir une autre situation</button>}
      </fieldset>
      <div className="hp" aria-hidden="true"><label>Site web<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="fields">
        <label className="field full" htmlFor="lp-msg">Quelques mots sur votre situation (facultatif)
          <textarea id="lp-msg" name="message" />
        </label>
      </div>
      <p className="micro">Vos informations restent strictement confidentielles. Elles sont utilisées uniquement pour préparer le premier échange avec l'équipe Calypso.</p>
      <div><button className="btn btn-light mag" type="submit" aria-busy={busy || undefined} disabled={busy} data-cta="form-submit">{COMMON.cta}</button></div>
      <div className="micro">{COMMON.micro}</div>
      {fail && <div className="notice ko" role="status" aria-live="polite">{fail}</div>}
    </form>
  );
}
