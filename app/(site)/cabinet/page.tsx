import StaticPage, { metaFor } from '../StaticPage';

export async function generateMetadata() {
  return metaFor('cabinet');
}

export default function Page() {
  return <StaticPage id="cabinet" />;
}
