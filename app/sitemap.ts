import type { MetadataRoute } from 'next';
import { pageMeta } from '@/content/meta';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.calypso-advisory.com').replace(/\/$/, '');
  return Object.values(pageMeta).map((m) => ({ url: base + m.path, changeFrequency: 'monthly', priority: m.path === '/' ? 1 : m.path === '/faire-le-point' ? .9 : .7 }));
}
