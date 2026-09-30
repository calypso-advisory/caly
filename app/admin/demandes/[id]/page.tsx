import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/admin';
import { STATUTS, type Demande } from '@/lib/demandes';
import { updateDemande, deleteDemande } from '../../actions';
import Header from '../../Header';
import ConfirmButton from './ConfirmButton';

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Paris' });

export default async function DemandePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const user = await requireAdmin();
  const { id } = await params; const { saved } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data } = await adminClient()!.from('demandes').select('*').eq('id', id).single();
  if (!data) notFound();
  const d = data as Demande;
  const subject = encodeURIComponent('Votre demande auprès de Calypso Advisory');

  return (
    <>
      <Header email={user.email} />
      <main className="adm-main adm-detail">
        <a className="adm-back" href="/admin">← Toutes les demandes</a>
        <div className="adm-head"><h1>{d.nom}</h1><span className={'adm-tag t-' + d.statut}>{STATUTS.find((s) => s.id === d.statut)?.label}</span></div>
        <p className="adm-mute">Reçue le {fmt.format(new Date(d.created_at))}</p>
        {saved ? <p className="adm-ok">Modifications enregistrées.</p> : null}
        <div className="adm-grid">
          <section className="adm-card">
            <h2>Contact</h2>
            <dl>
              <dt>Nom</dt><dd>{d.nom}</dd>
              <dt>Société</dt><dd>{d.societe || '—'}</dd>
              <dt>E-mail</dt><dd><a href={`mailto:${d.email}?subject=${subject}`}>{d.email}</a></dd>
              <dt>Téléphone</dt><dd>{d.telephone ? <a href={`tel:${d.telephone.replace(/\s/g, '')}`}>{d.telephone}</a> : '—'}</dd>
              <dt>Situation</dt><dd>{d.situation || 'Non précisée'}</dd>
            </dl>
            <h2>Message</h2>
            <p className="adm-msg">{d.message || <span className="adm-mute">Aucun message.</span>}</p>
          </section>
          <section className="adm-card">
            <h2>Suivi</h2>
            <form action={updateDemande} className="adm-form">
              <input type="hidden" name="id" value={d.id} />
              <label>Statut
                <select name="statut" defaultValue={d.statut}>{STATUTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
              </label>
              <label>Notes internes
                <textarea name="notes" rows={8} defaultValue={d.notes || ''} placeholder="Premier échange, prochaines étapes, audit proposé…" />
              </label>
              <button className="adm-btn">Enregistrer</button>
            </form>
            <form action={deleteDemande} className="adm-danger">
              <input type="hidden" name="id" value={d.id} />
              <ConfirmButton message="Supprimer définitivement cette demande ? Cette action est irréversible.">Supprimer la demande</ConfirmButton>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
