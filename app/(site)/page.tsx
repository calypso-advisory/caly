import StaticPage, { metaFor } from './StaticPage';

export const metadata = metaFor('accueil');

export default function Page() {
  return <StaticPage id="accueil" />;
}
