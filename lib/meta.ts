import 'server-only';
import { unstable_cache } from 'next/cache';
import { anonClient } from './supabase/anon';
import { pageMeta } from '@/content/meta';

export type MetaRow = {
  page_id: string; title: string | null; description: string | null; og_title: string | null;
  og_description: string | null; og_image_url: string | null; noindex: boolean; updated_at: string | null; updated_by: string | null;
};

/* Overrides saved from the dashboard. Cached; saving in /admin/pages refreshes the cache (tag "page-meta"). */
export const getMetaRows = unstable_cache(async (): Promise<Record<string, MetaRow>> => {
  const db = anonClient(); if (!db) return {};
  const { data, error } = await db.from('page_meta').select('*');
  if (error || !data) return {};
  return Object.fromEntries((data as MetaRow[]).map((r) => [r.page_id, r]));
}, ['page-meta-v1'], { tags: ['page-meta'], revalidate: 3600 });

export async function resolveMeta(id: string) {
  const d = pageMeta[id];
  const r = (await getMetaRows())[id];
  const title = r?.title || d.title, description = r?.description || d.description;
  return {
    id, path: d.path, label: d.label, title, description,
    ogTitle: r?.og_title || title, ogDescription: r?.og_description || description,
    ogImage: r?.og_image_url || `/og/${id}`, customImage: !!r?.og_image_url, noindex: !!r?.noindex, row: r || null
  };
}
