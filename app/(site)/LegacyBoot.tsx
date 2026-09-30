'use client';
import { useEffect } from 'react';

/* Loads three.js, then the scene script, once the page is hydrated.
   Pages are ordinary links (full loads), so each page starts its scenes from scratch. */
const THREE_SRC = '/vendor/three-r128.min.js'; /* three.js r128 (MIT), self-hosted */

function load(src: string) {
  return new Promise<void>((resolve) => {
    const s = document.createElement('script');
    s.src = src; s.async = false;
    s.onload = () => resolve(); s.onerror = () => resolve();
    document.body.appendChild(s);
  });
}

export default function LegacyBoot() {
  useEffect(() => {
    const w = window as unknown as { __calypsoBooted?: boolean; THREE?: unknown };
    if (w.__calypsoBooted) return;
    w.__calypsoBooted = true;
    (w.THREE ? Promise.resolve() : load(THREE_SRC)).then(() => load('/legacy/site.js'));
  }, []);
  return null;
}
