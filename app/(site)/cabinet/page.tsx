import StaticPage, { metaFor } from '../StaticPage';

export const metadata = metaFor('cabinet');

export default function Page() {
  return <StaticPage id="cabinet" />;
}
