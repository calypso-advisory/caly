import { requireAdmin } from '@/lib/auth';
import { pageMeta } from '@/content/meta';
import { resolveMeta } from '@/lib/meta';
import Header from '../Header';

export const dynamic = 'force-dynamic';

export default async function PagesList() {
  const { user } = await requireAdmin();
  const rows = await Promise.all(Object.keys(pageMeta).map((id) => resolveMeta(id)));
  return (
    <>
      <Header email={user.email} />
      <main className="adm-main">
        <div className="adm-head"><h1>Pages et référencement</h1></div>
        <p className="adm-mute adm-intro">Le titre et la description de chaque page, tels qu'ils apparaissent dans Google, et l'image affichée quand un lien est partagé (LinkedIn, WhatsApp, e-mail).</p>
        <div className="adm-pages">
          {rows.map((m) => (
            <a key={m.id} href={`/admin/pages/${m.id}`} className="adm-page">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.ogImage} alt="" width={240} height={126} loading="lazy" />
              <div className="adm-page-body">
                <span className="adm-page-k">{m.label} <em>{m.path}</em></span>
                <strong>{m.title}</strong>
                <span className="adm-mute">{m.description}</span>
                <span className="adm-page-tags">
                  {m.row ? <span className="adm-tag t-nouveau">Personnalisé</span> : <span className="adm-tag">Par défaut</span>}
                  {m.customImage ? <span className="adm-tag">Image importée</span> : null}
                  {m.noindex ? <span className="adm-tag t-archive">Masquée de Google</span> : null}
                </span>
              </div>
            </a>
          ))}
        </div>
      </main>
    </>
  );
}
