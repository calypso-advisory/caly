import StaticPage, { metaFor } from './StaticPage';

export async function generateMetadata() {
  return metaFor('accueil');
}

export default function Page() {
  return <StaticPage id="accueil" />;
}
