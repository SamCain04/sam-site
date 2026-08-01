import React, { useEffect, useRef } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function BottomRipples({
  baseAmplitude = 0.35,
  k = 0.06,
  omega = 3.2,
  decayDist = 180,
  dropInterval = 1200,
  halfInterval = 700,
  quarterInterval = 400,
  speed = 180
}) {
  const canvasRef = useRef(null);
  const sources = useRef([]);
  const state = useRef({ t: 0, last: performance.now() });
  const lastFull = useRef(0);
  const lastHalf = useRef(0);
  const lastQuarter = useRef(0);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return undefined;
    const ctx = c.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);

    let vw, vh;
    const build = () => {
      vw = window.innerWidth;
      vh = Math.floor(window.innerHeight / 2);
      c.width = Math.floor(vw * dpr);
      c.height = Math.floor(vh * dpr);
      c.style.width = vw + "px";
      c.style.height = vh + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sources.current = [];
    };
    build();

    const onResize = () => build();
    window.addEventListener("resize", onResize);

    // Honor reduced-motion: paint the static backdrop once, run no loop.
    if (prefersReducedMotion()) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, vw, vh);
      return () => window.removeEventListener("resize", onResize);
    }

    const spawn = (x, y, t, scale = 1) => {
      sources.current.push({ x, y, t0: t, s: scale });
    };

    let raf;
    const render = () => {
      raf = requestAnimationFrame(render);

      const now = performance.now();
      const dt = (now - state.current.last) / 1000;
      state.current.last = now;
      state.current.t += dt;
      const t = state.current.t;

      // periodic automatic drops
      if (now - lastFull.current > dropInterval) {
        spawn(Math.random() * vw, Math.random() * vh, t, 1);
        lastFull.current = now;
      }
      if (now - lastHalf.current > halfInterval) {
        spawn(Math.random() * vw, Math.random() * vh, t, 0.5);
        lastHalf.current = now;
      }
      if (now - lastQuarter.current > quarterInterval) {
        spawn(Math.random() * vw, Math.random() * vh, t, 0.25);
        lastQuarter.current = now;
      }

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, vw, vh);

      const alive = [];
      for (const s of sources.current) {
        const age = t - s.t0;
        const r = age * speed * s.s;
        const b =
          baseAmplitude *
          Math.max(0, Math.sin(k * r - omega * age)) *
          Math.exp(-(r / (decayDist * s.s)));
        if (r < decayDist * 2.5) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0,255,255,${b})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          alive.push(s);
        }
      }
      sources.current = alive;
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [baseAmplitude, k, omega, decayDist, dropInterval, halfInterval, quarterInterval, speed]);

  return <canvas ref={canvasRef} className="bottom-half" aria-hidden="true" />;
}
