'use client';
import { useState } from 'react';
import { savePageMeta, resetPageMeta } from '../actions';

type V = { title: string; description: string; og_title: string; og_description: string; og_image_url: string; noindex: boolean };

function Count({ n, ok, max }: { n: number; ok: [number, number]; max: number }) {
  const cls = n === 0 ? '' : n < ok[0] ? ' warn' : n > ok[1] ? ' warn' : ' good';
  return <span className={'adm-count' + cls}>{n} / {max}{n > 0 && n > ok[1] ? ' · risque d\'être coupé' : n > 0 && n < ok[0] ? ' · un peu court' : ''}</span>;
}

export default function MetaEditor({ id, site, path, defaults, values, updated }: { id: string; site: string; path: string; defaults: { title: string; description: string; image: string }; values: V; updated: string | null }) {
  const [v, setV] = useState<V>(values);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImg, setRemoveImg] = useState(false);
  const set = (k: keyof V) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });

  const title = v.title || defaults.title, description = v.description || defaults.description;
  const ogTitle = v.og_title || title, ogDesc = v.og_description || description;
  const img = preview || (!removeImg && v.og_image_url) || defaults.image;
  const fullTitle = id === 'accueil' ? title : `${title} · Calypso Advisory`;
  const host = site.replace(/^https?:\/\//, '');

  return (
    <form action={savePageMeta} className="adm-meta">
      <input type="hidden" name="page_id" value={id} />
      <input type="hidden" name="og_image_current" value={v.og_image_url} />
      <div className="adm-meta-fields">
        <section className="adm-card adm-form">
          <h2>Google</h2>
          <label>Titre de la page<input name="title" value={v.title} onChange={set('title')} placeholder={defaults.title} maxLength={120} /><Count n={v.title.length} ok={[25, 60]} max={120} /></label>
          <label>Description<textarea name="description" rows={3} value={v.description} onChange={set('description')} placeholder={defaults.description} maxLength={320} /><Count n={v.description.length} ok={[70, 160]} max={320} /></label>
          <label className="adm-check"><input type="checkbox" name="noindex" checked={v.noindex} onChange={(e) => setV({ ...v, noindex: e.target.checked })} /> Masquer cette page des moteurs de recherche</label>
        </section>
        <section className="adm-card adm-form">
          <h2>Partage (LinkedIn, WhatsApp, e-mail)</h2>
          <label>Titre de partage<input name="og_title" value={v.og_title} onChange={set('og_title')} placeholder="Reprend le titre de la page" maxLength={120} /><Count n={v.og_title.length} ok={[20, 70]} max={120} /></label>
          <label>Description de partage<textarea name="og_description" rows={3} value={v.og_description} onChange={set('og_description')} placeholder="Reprend la description" maxLength={320} /><Count n={v.og_description.length} ok={[50, 200]} max={320} /></label>
          <label>Image de partage<span className="adm-hint">1200 × 630 pixels recommandés · PNG, JPEG ou WebP · 4 Mo maximum. Sans image importée, une image aux couleurs du site est générée automatiquement.</span>
            <input type="file" name="og_image" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const f = e.target.files?.[0]; setPreview(f ? URL.createObjectURL(f) : null); }} />
          </label>
          {v.og_image_url ? <label className="adm-check"><input type="checkbox" name="remove_image" checked={removeImg} onChange={(e) => setRemoveImg(e.target.checked)} /> Retirer l'image importée et revenir à l'image automatique</label> : null}
        </section>
        <div className="adm-meta-actions">
          <button className="adm-btn">Enregistrer et publier</button>
          {updated ? <span className="adm-mute">Dernière modification : {updated}</span> : <span className="adm-mute">Valeurs par défaut du site</span>}
        </div>
      </div>
      <aside className="adm-meta-preview">
        <div className="adm-pv-k">Aperçu dans Google</div>
        <div className="adm-serp">
          <div className="adm-serp-site"><span className="adm-serp-ico" />Calypso Advisory<small>{host}{path === '/' ? '' : ' › ' + path.slice(1)}</small></div>
          <div className="adm-serp-title">{fullTitle.length > 62 ? fullTitle.slice(0, 60) + '…' : fullTitle}</div>
          <div className="adm-serp-desc">{description.length > 160 ? description.slice(0, 157) + '…' : description}</div>
          {v.noindex ? <div className="adm-serp-off">Cette page n'apparaîtra pas dans Google.</div> : null}
        </div>
        <div className="adm-pv-k">Aperçu d'un lien partagé</div>
        <div className="adm-share">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="" />
          <div className="adm-share-body"><small>{host.toUpperCase()}</small><strong>{ogTitle}</strong><span>{ogDesc}</span></div>
        </div>
        <p className="adm-hint">Les réseaux sociaux gardent parfois l'ancienne version d'un lien en mémoire quelques jours. Sur LinkedIn, l'outil « Post Inspector » force la mise à jour.</p>
      </aside>
      <button formAction={resetPageMeta} className="adm-link adm-reset" onClick={(e) => { if (!confirm('Rétablir les valeurs par défaut de cette page ?')) e.preventDefault(); }}>Rétablir les valeurs par défaut</button>
    </form>
  );
}
