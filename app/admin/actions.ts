'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { sessionClient } from '@/lib/supabase/server';
import { STATUTS } from '@/lib/demandes';

export async function updateDemande(formData: FormData) {
  const { db } = await requireAdmin();
  const id = String(formData.get('id') || '');
  const statut = String(formData.get('statut') || '');
  const notes = String(formData.get('notes') || '').slice(0, 10000);
  if (!/^[0-9a-f-]{36}$/.test(id) || !STATUTS.some((s) => s.id === statut)) return;
  await db.from('demandes').update({ statut, notes }).eq('id', id);
  revalidatePath('/admin'); revalidatePath(`/admin/demandes/${id}`);
  redirect(`/admin/demandes/${id}?saved=1`);
}

export async function deleteDemande(formData: FormData) {
  const { db } = await requireAdmin();
  const id = String(formData.get('id') || '');
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  await db.from('demandes').delete().eq('id', id);
  revalidatePath('/admin');
  redirect('/admin?deleted=1');
}

export async function signOut() {
  const supabase = await sessionClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
