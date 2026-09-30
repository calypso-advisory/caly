import type { Metadata } from 'next';
import { pages } from '@/content/fragments';
import { pageMeta } from '@/content/meta';

export function metaFor(id: string): Metadata {
  const m = pageMeta[id];
  return { title: id === 'accueil' ? { absolute: m.title } : m.title, description: m.description, alternates: { canonical: m.path }, openGraph: { title: m.title, description: m.description, url: m.path } };
}

export default function StaticPage({ id }: { id: string }) {
  return <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: pages[id] }} />;
}
