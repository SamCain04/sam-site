import React, { useEffect, useRef } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function TopMilkyWay() {
  const canvasRef = useRef(null);
  const starsRef = useRef([]);
  const fallersRef = useRef([]);
  const lastSpawnRef = useRef(0);
  const redRef = useRef(null);
  const nextRedAtRef = useRef(performance.now() + (15000 + Math.random() * 15000));
  const state = useRef({ last: performance.now(), t: 0 });

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return undefined;
    const ctx = c.getContext("2d");
    const dpr = 1.0;

    let w, h, shore;

    const build = () => {
      w = window.innerWidth;
      h = Math.floor(window.innerHeight / 2);
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      c.style.width = w + "px";
      c.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      starsRef.current = makeStars(w, h);
      fallersRef.current.length = 0;
      redRef.current = null;
      shore = makeShore(w, h);
      nextRedAtRef.current = performance.now() + (15000 + Math.random() * 15000);
    };

    const makeStars = (W, H) => {
      const n = Math.floor((W * H) / 9000);
      const arr = [];
      for (let i = 0; i < n; i++) {
        arr.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.2 + 0.2,
          base: 0.18 + Math.random() * 0.35,
          amp: 0.05 + Math.random() * 0.2,
          phase: Math.random() * Math.PI * 2,
          tw: 0.8 + Math.random() * 1.8
        });
      }
      return arr;
    };

    const makeShore = (W, H) => {
      const base = H - 6;
      const amp = 12;
      const freq = 2 * Math.PI / Math.max(600, W);
      const pts = [];
      const steps = 40;
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * W;
        const y = base - Math.sin(x * freq * 1.1) * amp - Math.cos(x * freq * 0.6) * (amp * 0.5);
        pts.push({ x, y });
      }
      return pts;
    };

    const spawnCyan = (now) => {
      if (now - lastSpawnRef.current > 320 && fallersRef.current.length < 56) {
        fallersRef.current.push({
          x: Math.random() * w,
          y: -12,
          vx: (Math.random() - 0.5) * 9,
          vy: 90 + Math.random() * 85,
          a: 0.85,
          r: 1.0 + Math.random() * 0.8
        });
        lastSpawnRef.current = now;
      }
    };

    const spawnRed = (now) => {
      if (now >= nextRedAtRef.current && !redRef.current) {
        const startX = Math.random() * w;
        const startY = -16;
        const speed = 520 + Math.random() * 220;
        const angle = (Math.PI / 2) + (Math.random() * 0.25 - 0.125);
        const vx = Math.cos(angle) * 40;
        const vy = Math.sin(angle) * speed;
        redRef.current = {
          x: startX,
          y: startY,
          vx,
          vy,
          rotDir: Math.random() < 0.5 ? -1 : 1,
          rotRate: (0.35 + Math.random() * 0.5),
          trail: [], // {x,y,t}
          alive: true
        };
        nextRedAtRef.current = now + (15000 + Math.random() * 15000);
      }
    };

    const drawShore = () => {
      ctx.fillStyle = "#050708";
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < shore.length; i++) {
        const p = shore[i];
        ctx.lineTo(p.x, p.y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    };

    // Honor reduced-motion: one static starfield, no twinkle, no meteors.
    const drawStatic = () => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      for (const s of starsRef.current) {
        ctx.fillStyle = `rgba(200,220,255,${s.base + s.amp * 0.5})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      drawShore();
    };

    const reduced = prefersReducedMotion();
    const onResize = () => {
      build();
      if (reduced) drawStatic();
    };
    build();
    window.addEventListener("resize", onResize);

    if (reduced) {
      drawStatic();
      return () => window.removeEventListener("resize", onResize);
    }

    let raf;
    const render = () => {
      raf = requestAnimationFrame(render);

      const now = performance.now();
      const dt = (now - state.current.last) / 1000;
      state.current.last = now;
      state.current.t += dt;
      const t = state.current.t;

      spawnCyan(now);
      spawnRed(now);

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      // blinking stars
      for (let i = 0; i < starsRef.current.length; i++) {
        const s = starsRef.current[i];
        const a = s.base + s.amp * (0.5 + 0.5 * Math.sin(s.phase + t * s.tw));
        ctx.fillStyle = `rgba(200,220,255,${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // cyan fallers
      const cyanAlive = [];
      for (let i = 0; i < fallersRef.current.length; i++) {
        const p = fallersRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.a *= 0.996;
        if (p.y < h - 2 && p.a > 0.06) {
          ctx.fillStyle = `rgba(0,255,255,${p.a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          cyanAlive.push(p);
        }
      }
      fallersRef.current = cyanAlive;

      // red meteor with smooth trail
      if (redRef.current) {
        const m = redRef.current;
        if (m.alive) {
          const ang = Math.atan2(m.vy, m.vx) + m.rotDir * m.rotRate * dt;
          const spd = Math.hypot(m.vx, m.vy);
          m.vx = Math.cos(ang) * spd;
          m.vy = Math.sin(ang) * spd;
          m.x += m.vx * dt;
          m.y += m.vy * dt;

          m.trail.push({ x: m.x, y: m.y, t: now });
          if (m.trail.length > 160) m.trail.shift();

          // draw smooth trail as a stroked spline with non-uniform fade
          if (m.trail.length > 3) {
            const pts = m.trail;

            ctx.lineJoin = "round";
            ctx.lineCap = "round";

            for (let i = 1; i < pts.length; i++) {
              const p0 = pts[i - 1];
              const p1 = pts[i];

              const sNorm = i / (pts.length - 1);          // 0..1 from tail->head
              const ageMs = now - p0.t;                     // fade over time
              const timeAlpha = Math.max(0, Math.exp(-ageMs / 1800)); // slow fade
              const tailBias = 0.3 + 0.7 * Math.pow(1 - sNorm, 0.6);  // tail lingers
              const alpha = timeAlpha * tailBias;

              if (alpha < 0.02) continue;

              const wBase = 2.4;
              const width = wBase * (0.6 + 0.4 * (1 - sNorm)); // taper to head

              // simple Catmull-Rom-ish smoothing using midpoints
              const prev = pts[Math.max(0, i - 2)];
              const midx = (prev.x + p1.x) * 0.5;
              const midy = (prev.y + p1.y) * 0.5;

              ctx.strokeStyle = `rgba(255,60,60,${alpha})`;
              ctx.lineWidth = width;
              ctx.beginPath();
              ctx.moveTo(p0.x, p0.y);
              ctx.quadraticCurveTo(midx, midy, p1.x, p1.y);
              ctx.stroke();
            }
          }

          // meteor head
          ctx.fillStyle = `rgba(255,80,80,0.95)`;
          ctx.beginPath();
          ctx.arc(m.x, m.y, 2.2, 0, Math.PI * 2);
          ctx.fill();

          if (m.y >= h * 0.82 || m.x < -30 || m.x > w + 30) m.alive = false;
        } else {
          // keep fading the remaining trail after stop
          const pts = m.trail;
          const aliveTrail = [];
          for (let i = 1; i < pts.length; i++) {
            const p0 = pts[i - 1];
            const p1 = pts[i];
            const sNorm = i / (pts.length - 1);
            const ageMs = now - p0.t;
            const timeAlpha = Math.max(0, Math.exp(-ageMs / 1800));
            const tailBias = 0.3 + 0.7 * Math.pow(1 - sNorm, 0.6);
            const alpha = timeAlpha * tailBias;
            if (alpha > 0.02) {
              ctx.strokeStyle = `rgba(255,60,60,${alpha})`;
              ctx.lineWidth = 2.0 * (0.6 + 0.4 * (1 - sNorm));
              ctx.beginPath();
              ctx.moveTo(p0.x, p0.y);
              ctx.lineTo(p1.x, p1.y);
              ctx.stroke();
              aliveTrail.push(p0);
            }
          }
          aliveTrail.push(pts[pts.length - 1]);
          m.trail = aliveTrail;
          if (m.trail.length <= 1) redRef.current = null;
        }
      }

      // shoreline
      drawShore();
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="top-half" aria-hidden="true" />;
}
