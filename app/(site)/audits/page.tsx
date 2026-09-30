import StaticPage, { metaFor } from '../StaticPage';

export const metadata = metaFor('audits');

export default function Page() {
  return <StaticPage id="audits" />;
}
