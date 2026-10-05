import './site.css';
import './site-extra.css';
import { headerHtml, footerHtml } from '@/content/fragments';
import LegacyBoot from './LegacyBoot';
import MarkMotion from './MarkMotion';

/* Scroll-driven scenes need the "anim" class before first paint (unless the visitor prefers reduced motion). */
const animFlag = "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window)document.documentElement.classList.add('anim')}catch(e){}";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: animFlag }} />
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: headerHtml }} />
      {children}
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: footerHtml }} />
      <LegacyBoot />
      <MarkMotion />
    </>
  );
}
