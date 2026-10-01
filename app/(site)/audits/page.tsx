import StaticPage, { metaFor } from '../StaticPage';

export async function generateMetadata() {
  return metaFor('audits');
}

export default function Page() {
  return <StaticPage id="audits" />;
}
