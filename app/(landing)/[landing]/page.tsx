import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { notFound } from 'next/navigation';
import { landings, landingById, COMMON } from '@/content/landings';
import LandingForm from '../LandingForm';
import { EDITEUR } from '@/content/legal';

/* Une page par campagne, générée depuis content/landings.ts.
   Structure : hero sombre, scène des deux panneaux, bande claire d'identification,
   bande sombre « ce que Calypso fait d'abord », final sonar, formulaire. */
export const dynamicParams = false;
export function generateStaticParams() { return landings.map((l) => ({ landing: l.id })); }

type Props = { params: Promise<{ landing: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = landingById((await params).landing);
  if (!l) return {};
  return {
    title: l.title, description: l.description,
    alternates: { canonical: '/' + l.id },
    robots: { index: false, follow: false },
    openGraph: { title: l.title, description: l.description, url: '/' + l.id }
  };
}

const d = (v: string) => ({ '--d': v }) as CSSProperties;

export default async function Page({ params }: Props) {
  const l = landingById((await params).landing);
  if (!l) notFound();
  const id = l.identify;

  return (
    <main data-page={'lp-' + l.id} data-landing={l.id} data-campagne={l.campagne}>
      <section className="phero dk fp-hero lp-hero">
        <canvas className="fp-chart" id="fpChart" aria-hidden="true"></canvas>
        <div className="wrap stack-lg">
          <div className="eyebrow" data-reveal="">{l.eyebrow}</div>
          <h1 data-words="">{l.h1}</h1>
          <p className="sub" data-reveal="" style={d('.35s')}>{l.sub}</p>
          <p className="lead" data-reveal="" style={d('.5s')}>{l.lead}</p>
          <div className="stack" data-reveal="" style={d('.7s')}>
            <div className="actions">
              <a className="btn btn-light mag" href="#faire-le-point" data-cta="hero">{COMMON.cta}</a>
              <a className="link" href="#reperes" data-cta="hero-secondaire">Comprendre ma situation <span className="arrow"></span></a>
            </div>
            <div className="micro">{COMMON.micro}</div>
          </div>
        </div>
        <div className="scroll-cue" aria-hidden="true"></div>
      </section>

      <section className="scene" id="scene" aria-label={`${l.scene.l1} ${l.scene.l2}`}>
        <div className="scene-in">
          <div className="scene-text">
            <div className="eyebrow">{l.scene.eyebrow}</div>
            <p className="scene-h">{l.scene.l1}<br />{l.scene.l2}</p>
            <p className="lead" style={{ marginInline: 'auto', textAlign: 'center' }}>{l.scene.lead}</p>
          </div>
          <div className="curtain l" aria-hidden="true"></div>
          <div className="curtain r" aria-hidden="true"></div>
          <div className="scene-slit" aria-hidden="true"></div>
          <div className="scene-hint" aria-hidden="true">Faites défiler</div>
        </div>
      </section>

      <section className="band lt" id="reperes">
        <div className="orbs"><span></span><span></span><span></span></div>
        <div className="wrap stack-lg">
          <div className="eyebrow" data-reveal="">{id.eyebrow}</div>
          <h2 className="h2" data-words="">{id.h2}</h2>
          <div className={(id.cols === 3 ? 'trio' : 'cols-2') + ' lp-cards'}>
            {id.cards.map((c, i) => (
              <article className="glass gcard" data-reveal="" style={d(`${(i * 0.1).toFixed(1)}s`)} key={c.k}>
                <span className="tag">{c.k}</span>
                <h3>{c.h3}</h3>
                <p>{c.p}</p>
              </article>
            ))}
          </div>
          {id.note && <p className="lead" data-reveal="">{id.note}</p>}
        </div>
      </section>

      <section className="band dk">
        <div className="orbs" data-speed="0.2"><span></span><span></span><span></span></div>
        <div className="wrap stack-lg">
          <div className="eyebrow" data-reveal="">{COMMON.first.eyebrow}</div>
          <h2 className="h2" data-words="">{COMMON.first.h2}</h2>
          <div className="split">
            <div className="stack">
              <p className="lead" data-reveal="">{COMMON.first.lead}</p>
              <p className="micro" data-reveal="" style={d('.1s')}>{l.first.aside}</p>
            </div>
            <div className="stack">
              <div className="eyebrow" data-reveal="">Ce que nous regardons avec vous</div>
              <div className="fp-steps">
                {l.first.points.map((p, i) => (
                  <div data-reveal="" style={d(`${(i * 0.1).toFixed(1)}s`)} key={i}><span className="num">0{i + 1}</span><span>{p}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="finale dk" id="finale">
        <div className="finale-in">
          <div className="orbs"><span></span><span></span><span></span></div>
          <canvas className="seabed" id="seabed" aria-hidden="true"></canvas>
          <div className="wrap finale-grid">
            <div className="stack-lg">
              <h2 className="finale-h" data-words="">{COMMON.finale.h2}</h2>
              <p className="sub" data-reveal="">{COMMON.finale.sub}</p>
              <p className="lead" data-reveal="" style={d('.1s')}>{COMMON.finale.lead}</p>
              <span className="rule-s" data-reveal="" style={d('.15s')} aria-hidden="true"></span>
              <div className="micro" data-reveal="" style={d('.2s')}>{COMMON.micro}</div>
            </div>
            <div className="fix">
              <canvas className="sonar" id="sonar" aria-hidden="true"></canvas>
              <a className="fix-btn" id="fixBtn" href="#faire-le-point" data-cta="sonar"><span>Faire le point</span><small>avec Calypso</small></a>
            </div>
          </div>
        </div>
      </section>

      <section className="band dk fp-band" id="faire-le-point">
        <div className="wrap fp">
          <div className="stack-lg">
            <p className="lead" data-reveal="">{COMMON.formLead}</p>
            <div className="stack">
              <div className="eyebrow" data-reveal="">Ce qui se passe ensuite</div>
              <div className="fp-steps">
                {COMMON.steps.map((s, i) => (
                  <div data-reveal="" style={d(`${(i * 0.1).toFixed(1)}s`)} key={i}><span className="num">0{i + 1}</span><span>{s}</span></div>
                ))}
              </div>
            </div>
            <div className="stack lp-origin" id="vos-donnees" data-reveal="">
              <div className="eyebrow">Pourquoi ce message</div>
              <p className="micro">{l.origin} {COMMON.originRest} <a href="/opposition">Ne plus être contacté</a>.</p>
              <p className="micro">{EDITEUR.marque} est une marque exploitée par {EDITEUR.denomination} ({EDITEUR.forme}, Stockholm). <a href="/mentions-legales">Mentions légales</a>.</p>
            </div>
          </div>
          <div className="lp-form-wrap" data-reveal="scale">
            <LandingForm landing={l.id} situation={l.situation} />
          </div>
        </div>
      </section>
    </main>
  );
}
