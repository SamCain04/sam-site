import React, { useEffect, useRef } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Horizontal bands the reflection is rebuilt from. Each band is blitted from
// the sky canvas with its own sideways offset, which is what makes the mirror
// image break up like water instead of looking like a flipped photograph.
const BAND = 3;

export default function BottomRipples({
  skyRef,
  dropInterval = 1100,
  halfInterval = 700,
  quarterInterval = 430,
  speed = 62,
  decayDist = 62,
  baseAmplitude = 0.26,
  k = 0.06,
  omega = 3.2
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
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

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

    // y = 0 here is the waterline, and it mirrors the bottom edge of the sky
    // canvas. Moving down the water walks back up the sky.
    const drawReflection = (time) => {
      const sky = skyRef?.current;
      if (!sky || !sky.width || !sky.height) return false;

      // Derive the sky's pixel ratio from its own backing store rather than
      // assuming it matches ours.
      const ratio = sky.width / vw;

      for (let y = 0; y < vh; y += BAND) {
        const depth = y / vh;
        const srcY = vh - y - BAND;
        if (srcY < 0) break;

        // Two detuned waves so the distortion never visibly repeats, growing
        // with depth because near water is choppier than the far shore.
        const sway =
          (1.2 + depth * 11) * Math.sin(depth * 24 + time * 1.5) +
          (0.6 + depth * 5) * Math.sin(depth * 57 - time * 2.1);

        // Water reflects a fraction of the light, and less of it as the angle
        // steepens toward the viewer.
        ctx.globalAlpha = 0.52 * Math.pow(1 - depth, 1.45) + 0.045;

        ctx.drawImage(
          sky,
          0,
          srcY * ratio,
          sky.width,
          BAND * ratio,
          sway,
          y,
          vw,
          BAND + 0.7 // slight overlap kills seams between bands
        );
      }
      ctx.globalAlpha = 1;
      return true;
    };

    const drawDepth = () => {
      const g = ctx.createLinearGradient(0, 0, 0, vh);
      g.addColorStop(0, "rgba(4,8,16,0.18)");
      g.addColorStop(0.55, "rgba(2,5,11,0.55)");
      g.addColorStop(1, "rgba(0,1,4,0.88)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, vw, vh);
    };

    const drawRipples = (t) => {
      ctx.globalCompositeOperation = "lighter";
      const alive = [];
      for (const s of sources.current) {
        const age = t - s.t0;
        const r = age * speed * s.s;
        const b =
          baseAmplitude *
          Math.max(0, Math.sin(k * r - omega * age)) *
          Math.exp(-(r / (decayDist * s.s)));
        if (r < decayDist * 2.5) {
          // Flattened into ellipses: a circular ring on a lake seen from the
          // shore is foreshortened, and perfect circles read as bubbles.
          // Rings flatten further the closer they sit to the horizon, where
          // the viewing angle is shallowest.
          const squash = 0.16 + (s.y / vh) * 0.26;
          ctx.beginPath();
          ctx.ellipse(s.x, s.y, r, r * squash, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(150,215,255,${b})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          alive.push(s);
        }
      }
      sources.current = alive;
      ctx.globalCompositeOperation = "source-over";
    };

    const spawn = (x, y, t, scale = 1) => {
      sources.current.push({ x, y, t0: t, s: scale });
    };

    if (prefersReducedMotion()) {
      // One still frame. The sky may not have painted yet on first mount, so
      // retry a few times before giving up.
      let tries = 0;
      const paint = () => {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, vw, vh);
        const ok = drawReflection(0);
        drawDepth();
        if (!ok && tries++ < 30) requestAnimationFrame(paint);
      };
      requestAnimationFrame(paint);
      return () => window.removeEventListener("resize", onResize);
    }

    let raf;
    const render = () => {
      raf = requestAnimationFrame(render);

      const now = performance.now();
      const dt = Math.min((now - state.current.last) / 1000, 0.05);
      state.current.last = now;
      state.current.t += dt;
      const t = state.current.t;

      // Drops land on the water, not in the air, so bias them downward.
      if (now - lastFull.current > dropInterval) {
        spawn(Math.random() * vw, vh * (0.25 + Math.random() * 0.75), t, 1);
        lastFull.current = now;
      }
      if (now - lastHalf.current > halfInterval) {
        spawn(Math.random() * vw, vh * (0.3 + Math.random() * 0.7), t, 0.5);
        lastHalf.current = now;
      }
      if (now - lastQuarter.current > quarterInterval) {
        spawn(Math.random() * vw, vh * (0.35 + Math.random() * 0.65), t, 0.25);
        lastQuarter.current = now;
      }

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, vw, vh);
      drawReflection(t);
      drawDepth();
      drawRipples(t);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [
    skyRef,
    baseAmplitude,
    k,
    omega,
    decayDist,
    dropInterval,
    halfInterval,
    quarterInterval,
    speed
  ]);

  return <canvas ref={canvasRef} className="bottom-half" aria-hidden="true" />;
}
