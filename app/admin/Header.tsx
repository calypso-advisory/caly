import { signOut } from './actions';

export default function Header({ email }: { email?: string | null }) {
  return (
    <header className="adm-top">
      <a className="adm-brand" href="/admin"><b>CALYPSO</b><i>ADVISORY</i></a>
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
