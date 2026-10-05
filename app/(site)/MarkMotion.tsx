'use client';
import { useEffect } from 'react';

/* The brand mark is a strip of pre-rendered views of the same object: tilted one way, face on, tilted the other
   (public/brand/mark-sprite.webp, rendered from brand/icone.html). Scrolling tips it in the direction of travel,
   then it settles back face on, so the plates slide over one another and the light moves across them. */
const FRAMES = 31, COLS = 8, ROWS = 4, MID = 15;

export default function MarkMotion() {
  useEffect(() => {
    const marks = Array.from(document.querySelectorAll<HTMLElement>('.mark'));
    if (!marks.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let lastY = window.scrollY, lastT = performance.now(), frameT = lastT;
    let target = 0, pos = 0, vel = 0, raf = 0, shown = MID;

    const show = (k: number) => {
      if (k === shown) return;
      shown = k;
      const x = ((k % COLS) / (COLS - 1)) * 100, y = (Math.floor(k / COLS) / (ROWS - 1)) * 100;
      for (const m of marks) m.style.backgroundPosition = `${x}% ${y}%`;
    };
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - frameT) / 1000);
      frameT = now;
      target *= Math.exp(-dt * 4.5);                      /* the push from scrolling fades */
      vel += ((target - pos) * 70 - vel * 10) * dt;       /* a soft spring, slightly under-damped */
      pos += vel * dt;
      show(Math.max(0, Math.min(FRAMES - 1, Math.round(MID + pos * MID))));
      raf = Math.abs(pos) > 0.004 || Math.abs(vel) > 0.01 || Math.abs(target) > 0.004 ? requestAnimationFrame(tick) : 0;
      if (!raf) { pos = vel = target = 0; show(MID); }
    };
    const wake = () => { if (!raf) { frameT = performance.now(); raf = requestAnimationFrame(tick); } };
    const onScroll = () => {
      const now = performance.now(), y = window.scrollY, dt = Math.max(8, now - lastT);
      const push = Math.max(-1, Math.min(1, ((y - lastY) / dt) * 0.5));   /* about 2 px per millisecond gives a full tilt */
      if (Math.abs(push) > Math.abs(target)) target = push;
      lastY = y; lastT = now;
      wake();
    };
    const onEnter = () => { vel += 3.2; wake(); };       /* a small nudge when the pointer reaches the logo */

    window.addEventListener('scroll', onScroll, { passive: true });
    const brands = Array.from(document.querySelectorAll<HTMLElement>('.brand'));
    brands.forEach((b) => b.addEventListener('pointerenter', onEnter));
    return () => {
      window.removeEventListener('scroll', onScroll);
      brands.forEach((b) => b.removeEventListener('pointerenter', onEnter));
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
