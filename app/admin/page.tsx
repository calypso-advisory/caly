import { requireAdmin } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/admin';
import { STATUTS, statutLabel, type Demande } from '@/lib/demandes';
import Header from './Header';

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Paris' });

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ statut?: string; q?: string; deleted?: string }> }) {
  const user = await requireAdmin();
  const { statut, q, deleted } = await searchParams;
  const db = adminClient()!;

  let query = db.from('demandes').select('id, created_at, nom, societe, email, situation, statut').order('created_at', { ascending: false }).limit(300);
  if (statut && STATUTS.some((s) => s.id === statut)) query = query.eq('statut', statut);
  else query = query.neq('statut', 'archive');
  const term = (q || '').trim().replace(/[%,()]/g, ' ').slice(0, 80);
  if (term) query = query.or(`nom.ilike.%${term}%,societe.ilike.%${term}%,email.ilike.%${term}%`);
  const { data: rows, error } = await query;

  const counts: Record<string, number> = {};
  await Promise.all(STATUTS.map(async (s) => {
    const { count } = await db.from('demandes').select('id', { count: 'exact', head: true }).eq('statut', s.id);
    counts[s.id] = count || 0;
  }));

  const list = (rows || []) as Pick<Demande, 'id' | 'created_at' | 'nom' | 'societe' | 'email' | 'situation' | 'statut'>[];
  return (
    <>
      <Header email={user.email} />
      <main className="adm-main">
        <div className="adm-head">
          <h1>Demandes</h1>
          <form className="adm-search" action="/admin">
            {statut ? <input type="hidden" name="statut" value={statut} /> : null}
            <input name="q" defaultValue={q || ''} placeholder="Rechercher un nom, une société, un e-mail" />
          </form>
        </div>
        {deleted ? <p className="adm-ok">La demande a été supprimée.</p> : null}
        <div className="adm-kpis">
          {STATUTS.map((s) => (
            <a key={s.id} href={`/admin?statut=${s.id}`} className={'adm-kpi' + (statut === s.id ? ' on' : '')}>
              <b>{counts[s.id]}</b><span>{s.label}{s.id === 'archive' ? '' : s.id === 'nouveau' ? ' · à traiter' : ''}</span>
            </a>
          ))}
        </div>
        <div className="adm-filter">
          <a href="/admin" className={!statut ? 'on' : ''}>Toutes (hors archives)</a>
          {STATUTS.map((s) => <a key={s.id} href={`/admin?statut=${s.id}`} className={statut === s.id ? 'on' : ''}>{s.label}</a>)}
        </div>
        {error ? <p className="adm-alert">Lecture impossible : {error.message}. La table « demandes » a-t-elle été créée ?</p> : null}
        {list.length === 0 && !error ? <p className="adm-empty">Aucune demande pour le moment.</p> : (
          <table className="adm-table">
            <thead><tr><th>Reçue le</th><th>Contact</th><th>Société</th><th>Situation</th><th>Statut</th></tr></thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id}>
                  <td>{fmt.format(new Date(d.created_at))}</td>
                  <td><a href={`/admin/demandes/${d.id}`}><strong>{d.nom}</strong></a><br /><span className="adm-mute">{d.email}</span></td>
                  <td>{d.societe || <span className="adm-mute">—</span>}</td>
                  <td>{d.situation || <span className="adm-mute">Non précisée</span>}</td>
                  <td><span className={'adm-tag t-' + d.statut}>{statutLabel(d.statut)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </>
  );
}
