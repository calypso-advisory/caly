'use server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { pageMeta } from '@/content/meta';

const TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
function txt(f: FormData, k: string, max: number) { const v = String(f.get(k) || '').trim().slice(0, max); return v || null; }

export async function savePageMeta(formData: FormData) {
  const { user, db } = await requireAdmin();
  const id = String(formData.get('page_id') || '');
  if (!pageMeta[id]) return;

  let og_image_url: string | null = txt(formData, 'og_image_current', 600);
  if (formData.get('remove_image') === 'on') og_image_url = null;

  const file = formData.get('og_image');
  if (file && typeof file === 'object' && 'size' in file && file.size > 0) {
    const ext = TYPES[file.type];
    if (!ext) redirect(`/admin/pages/${id}?e=type`);
    if (file.size > 4 * 1024 * 1024) redirect(`/admin/pages/${id}?e=size`);
    const path = `og/${id}-${Date.now()}.${ext}`;
    const { error } = await db.storage.from('site').upload(path, file, { contentType: file.type, upsert: false, cacheControl: '31536000' });
    if (error) { console.error('og upload failed', error.message); redirect(`/admin/pages/${id}?e=upload`); }
    og_image_url = db.storage.from('site').getPublicUrl(path).data.publicUrl;
  }

  const { error } = await db.from('page_meta').upsert({
    page_id: id,
    title: txt(formData, 'title', 120),
    description: txt(formData, 'description', 320),
    og_title: txt(formData, 'og_title', 120),
    og_description: txt(formData, 'og_description', 320),
    og_image_url,
    noindex: formData.get('noindex') === 'on',
    updated_by: user.email || null
  });
  if (error) { console.error('page_meta save failed', error.message); redirect(`/admin/pages/${id}?e=save`); }

  revalidateTag('page-meta');
  revalidatePath('/', 'layout');
  redirect(`/admin/pages/${id}?saved=1`);
}

export async function resetPageMeta(formData: FormData) {
  const { db } = await requireAdmin();
  const id = String(formData.get('page_id') || '');
  if (!pageMeta[id]) return;
  await db.from('page_meta').delete().eq('page_id', id);
  revalidateTag('page-meta');
  revalidatePath('/', 'layout');
  redirect(`/admin/pages/${id}?reset=1`);
}
