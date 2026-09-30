'use client';
import { useState } from 'react';
import { browserClient } from '@/lib/supabase/browser';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true);
    const { error } = await browserClient().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) { setErr('Identifiants incorrects.'); return; }
    window.location.href = '/admin';
  }

  return (
    <form onSubmit={submit} className="adm-form">
      <label>Adresse e-mail<input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>Mot de passe<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {err ? <p className="adm-err" role="alert">{err}</p> : null}
      <button className="adm-btn" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
    </form>
  );
}
