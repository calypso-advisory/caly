import { signOut } from './actions';

export default function Header({ email }: { email?: string | null }) {
  return (
    <header className="adm-top">
      <a className="adm-home" href="/admin">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/mark.png" alt="" width={36} height={36} />
        <span className="adm-brand"><b>CALYPSO</b><i>ADVISORY</i></span>
      </a>
      <nav>
        <a href="/admin">Demandes</a>
        <a href="/admin/pages">Pages et référencement</a>
        <a href="/admin/export">Exporter (CSV)</a>
        <a href="/" target="_blank" rel="noreferrer">Voir le site</a>
      </nav>
      <form action={signOut} className="adm-user"><span>{email}</span><button className="adm-link">Se déconnecter</button></form>
    </header>
  );
}
