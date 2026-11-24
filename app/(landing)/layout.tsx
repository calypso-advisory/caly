import '../(site)/site.css';
import '../(site)/site-extra.css';
import './landing.css';
import LegacyBoot from '../(site)/LegacyBoot';
import MarkMotion from '../(site)/MarkMotion';
import Measure from './Measure';

/* Pages de campagne : même matière que le site (mêmes feuilles de style, mêmes animations),
   avec un en-tête réduit au logo et à un seul bouton, et un pied de page court.
   Les identifiants progress, hdrShell, menuBtn et nav sont conservés : le script du site les attend. */
const animFlag = "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window)document.documentElement.classList.add('anim')}catch(e){}";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: animFlag }} />
      <div className="progress" id="progress"></div>
      <div className="hdr-shell" id="hdrShell">
        <div className="hdr lp-hdr">
          <a className="brand" href="/" aria-label="Calypso Advisory, accueil">
            <span className="mark" aria-hidden="true"></span>
            <span className="brand-name"><b>CALYPSO</b><i>ADVISORY</i></span>
          </a>
          <button className="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="nav" hidden>Menu</button>
          <nav className="nav" id="nav" aria-label="Navigation">
            <a className="btn btn-light mag" href="#faire-le-point" data-cta="header">Faire le point</a>
          </nav>
        </div>
      </div>
      {children}
      <footer className="foot lp-foot">
        <div className="wrap">
          <div className="foot-grid">
            <div className="stack">
              <a className="brand" href="/" aria-label="Calypso Advisory, accueil">
                <span className="mark" aria-hidden="true"></span>
                <span className="brand-name"><b style={{ fontSize: 18 }}>CALYPSO</b><i>ADVISORY</i></span>
              </a>
              <p style={{ fontSize: 14, maxWidth: '44ch' }}>Calypso Advisory accompagne les dirigeants confrontés à des situations financières ou opérationnelles complexes, du diagnostic au pilotage de la trajectoire.</p>
            </div>
            <nav aria-label="Pied de page">
              <a href="/">Le site Calypso Advisory</a><a href="/mentions-legales">Mentions légales</a>
              <a href="/audits">Nos audits</a><a href="/opposition">Ne plus être contacté</a>
            </nav>
          </div>
          <div className="foot-word" aria-hidden="true" data-speed="0.08">CALYPSO</div>
          <div className="foot-base"><span>© 2026 Calypso Advisory. Tous droits réservés.</span><span>Paris</span></div>
        </div>
      </footer>
      <LegacyBoot />
      <MarkMotion />
      <Measure />
    </>
  );
}
