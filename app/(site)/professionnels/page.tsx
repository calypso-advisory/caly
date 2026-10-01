import StaticPage, { metaFor } from '../StaticPage';

export async function generateMetadata() {
  return metaFor('professionnels');
}

export default function Page() {
  return <StaticPage id="professionnels" />;
}
