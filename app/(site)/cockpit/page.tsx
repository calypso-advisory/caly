import StaticPage, { metaFor } from '../StaticPage';

export async function generateMetadata() {
  return metaFor('cockpit');
}

export default function Page() {
  return <StaticPage id="cockpit" />;
}
