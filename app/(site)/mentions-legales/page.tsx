import StaticPage, { metaFor } from '../StaticPage';

export const metadata = metaFor('mentions');

export default function Page() {
  return <StaticPage id="mentions" />;
}
