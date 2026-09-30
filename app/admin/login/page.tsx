import LoginForm from './LoginForm';

const MSG: Record<string, string> = {
  config: "Le tableau de bord n'est pas encore relié à la base de données. Renseignez les variables Supabase (voir le guide de mise en ligne).",
  forbidden: "Ce compte n'est pas autorisé à accéder au tableau de bord."
};

export default async function Login({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  return (
    <main className="adm-login">
      <div className="adm-login-box">
        <div className="adm-brand"><b>CALYPSO</b><i>ADVISORY</i></div>
        <h1>Tableau de bord</h1>
        {e && MSG[e] ? <p className="adm-alert">{MSG[e]}</p> : null}
        {e !== 'config' ? <LoginForm /> : null}
      </div>
    </main>
  );
}
