import StaticPage, { metaFor } from '../StaticPage';

export async function generateMetadata() {
  return metaFor('approche');
}

export default function Page() {
  return <StaticPage id="approche" />;
}
