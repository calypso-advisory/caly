import type { CSSProperties } from 'react';
import { COMMON, type Landing } from '@/content/landings';

/* « La passe » : le hero et la scène de la page ne font qu'une image, épinglée, que le défilement pilote
   (public/legacy/landing-scenes.js, scène lpPasse). L'audience des deux mois y est un passage étroit entre
   deux rochers, avec la fente de lumière de la marque entre eux.
   Les trois cartes de la page (identify.cards) entrent dans la scène, une par mouvement de caméra.
   Sans script ni WebGL, tout reste lisible : le hero, puis les trois temps l'un sous l'autre. */
const d = (v: string) => ({ '--d': v }) as CSSProperties;

export default function PasseScene({ l }: { l: Landing }) {
  const id = l.identify;
  const [c1, c2, c3] = id.cards;
  return (
    <section className="pz" id="lpPasse" aria-label={id.h2}>
      <div className="pz-hero">
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
      </div>
      <span className="pz-anchor" id="reperes" aria-hidden="true"></span>

      <div className="pz-in">
        <div className="pz-stage" aria-hidden="true">
          <canvas className="pz-gl"></canvas>
          <div className="pz-veil"></div>
          <div className="pz-labels">
            <span className="pz-lab" data-lab="jugement">{c1.h3}</span>
            <span className="pz-lab sand" data-lab="ici">Vous êtes ici</span>
            <span className="pz-lab" data-lab="audience">{c2.h3}</span>
            <span className="pz-lab" data-lab="nord">N</span>
            <span className="pz-lab sand" data-lab="plan">Plan</span>
            <span className="pz-lab" data-lab="cession">Cession</span>
            <span className="pz-lab" data-lab="arret">Arrêt<span className="pz-wide"> de l’activité</span></span>
          </div>
        </div>
        <div className="pz-beats">
          <div className="wrap">
            <div className="pz-col">
              <div className="pz-title">
                <div className="eyebrow">{id.eyebrow}</div>
                <h2 className="pz-h">{id.h2}</h2>
              </div>
              <div className="pz-slot">
                <p className="pz-lead-m">{l.lead}</p>
                <article className="sk-card">
                  <div className="sk-k"><b>{c1.k}</b></div>
                  <h3>{c1.h3}</h3>
                  <p>{c1.p}</p>
                </article>
                <article className="sk-card">
                  <div className="sk-k"><b>{c2.k}</b></div>
                  <h3>{c2.h3}</h3>
                  <p>{c2.p}</p>
                </article>
                <div className="pz-line">
                  <div className="eyebrow">{l.scene.eyebrow}</div>
                  <p className="pz-h">{l.scene.l1} {l.scene.l2}</p>
                  <p className="lead">{l.scene.lead}</p>
                </div>
                <article className="sk-card">
                  <div className="sk-k"><b>{c3.k}</b></div>
                  <h3>{c3.h3}</h3>
                  <p>{c3.p}</p>
                  <a className="btn btn-light mag" href="#faire-le-point" data-cta="scene">{COMMON.cta}</a>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
