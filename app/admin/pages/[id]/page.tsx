import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { pageMeta } from '@/content/meta';
import { resolveMeta } from '@/lib/meta';
import Header from '../../Header';
import MetaEditor from './MetaEditor';

export const dynamic = 'force-dynamic';

const ERR: Record<string, string> = {
  type: "Format d'image non accepté. Utilisez PNG, JPEG ou WebP.",
  size: "L'image dépasse 4 Mo. Réduisez-la (1200 × 630 pixels suffisent).",
  upload: "L'image n'a pas pu être enregistrée. Réessayez.",
  save: "Les modifications n'ont pas pu être enregistrées. Réessayez."
};

export default async function EditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; reset?: string; e?: string }> }) {
  const { user } = await requireAdmin();
  const { id } = await params; const sp = await searchParams;
  if (!pageMeta[id]) notFound();
  const m = await resolveMeta(id);
  const d = pageMeta[id];
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://calypso-advisory.com').replace(/\/$/, '');
  return (
    <>
      <Header email={user.email} />
      <main className="adm-main">
        <a className="adm-back" href="/admin/pages">← Toutes les pages</a>
        <div className="adm-head"><h1>{d.label}</h1><a className="adm-link" href={d.path} target="_blank" rel="noreferrer">Voir la page</a></div>
        {sp.saved ? <p className="adm-ok">Enregistré. Le site est mis à jour.</p> : null}
        {sp.reset ? <p className="adm-ok">Les valeurs par défaut sont rétablies.</p> : null}
        {sp.e && ERR[sp.e] ? <p className="adm-alert">{ERR[sp.e]}</p> : null}
        <MetaEditor
          id={id} site={site} path={d.path}
          defaults={{ title: d.title, description: d.description, image: `/og/${id}` }}
          values={{ title: m.row?.title || '', description: m.row?.description || '', og_title: m.row?.og_title || '', og_description: m.row?.og_description || '', og_image_url: m.row?.og_image_url || '', noindex: !!m.row?.noindex }}
          updated={m.row?.updated_at ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(m.row.updated_at)) + (m.row.updated_by ? ' par ' + m.row.updated_by : '') : null}
        />
      </main>
    </>
  );
}
