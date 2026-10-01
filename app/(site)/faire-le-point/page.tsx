import StaticPage, { metaFor } from '../StaticPage';

export async function generateMetadata() {
  return metaFor('faire-le-point');
}

export default function Page() {
  return <StaticPage id="faire-le-point" />;
}
