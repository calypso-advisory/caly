import StaticPage, { metaFor } from '../StaticPage';

export const metadata = metaFor('cockpit');

export default function Page() {
  return <StaticPage id="cockpit" />;
}
