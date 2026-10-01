import StaticPage, { metaFor } from '../StaticPage';

export async function generateMetadata() {
  return metaFor('mentions');
}

export default function Page() {
  return <StaticPage id="mentions" />;
}
