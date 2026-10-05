import { ImageResponse } from 'next/og';
import { pageMeta } from '@/content/meta';

export const runtime = 'edge';

function dataUrl(buf: ArrayBuffer) {
  const b = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode(...b.subarray(i, i + 8192));
  return 'data:image/png;base64,' + btoa(s);
}

/* Default share image for each page (1200 × 630), in the site's art direction, with the brand mark on the right.
   An image uploaded from /admin/pages replaces it. Font: EB Garamond (SIL Open Font License). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = pageMeta[id] || pageMeta.accueil;
  const garamond = await fetch(new URL('./EBGaramond-500.woff', import.meta.url)).then((r) => r.arrayBuffer());
  const mark = dataUrl(await fetch(new URL('./mark.png', import.meta.url)).then((r) => r.arrayBuffer()));
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '72px 88px', background: 'radial-gradient(120% 90% at 70% 60%, #12304A 0%, #0A1B28 50%, #08161F 100%)', color: '#EEF1F0', fontFamily: 'Garamond', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 452, height: 1, background: 'linear-gradient(90deg, rgba(216,201,168,0), rgba(216,201,168,.45) 30%, rgba(216,201,168,.45) 70%, rgba(216,201,168,0))' }} />
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={mark} width={330} height={330} style={{ position: 'absolute', right: 62, top: 92 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 26, letterSpacing: 8 }}>CALYPSO</div>
            <div style={{ fontSize: 13, letterSpacing: 9, color: '#D8C9A8' }}>ADVISORY</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26, maxWidth: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 20, letterSpacing: 6, color: '#D8C9A8', textTransform: 'uppercase' }}>
            <div style={{ width: 40, height: 1, background: '#D8C9A8' }} />{m.label}
          </div>
          <div style={{ fontSize: m.headline.length > 46 ? 56 : 68, lineHeight: 1.05 }}>{m.headline}</div>
        </div>
        <div style={{ display: 'flex', fontSize: 20, color: '#8EA2AF', letterSpacing: 2 }}>calypso-advisory.com</div>
      </div>
    ),
    { width: 1200, height: 630, fonts: [{ name: 'Garamond', data: garamond, weight: 500, style: 'normal' }], headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800' } }
  );
}
