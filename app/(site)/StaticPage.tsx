import type { Metadata } from 'next';
import { pages } from '@/content/fragments';
import { resolveMeta } from '@/lib/meta';

export async function metaFor(id: string): Promise<Metadata> {
  const m = await resolveMeta(id);
  return {
    title: id === 'accueil' ? { absolute: m.title } : m.title,
    description: m.description,
    alternates: { canonical: m.path },
    robots: m.noindex ? { index: false, follow: true } : undefined,
    openGraph: { title: m.ogTitle, description: m.ogDescription, url: m.path, images: [{ url: m.ogImage, width: 1200, height: 630, alt: m.ogTitle }] },
    twitter: { card: 'summary_large_image', title: m.ogTitle, description: m.ogDescription, images: [m.ogImage] }
  };
}

export default function StaticPage({ id }: { id: string }) {
  return <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: pages[id] }} />;
}
