import React, { useEffect, useRef } from "react";
import { curvePoint } from "./curve";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Rough stellar colour temperatures, hot blue through cool orange. Weighted so
// most stars read blue-white and warm ones stay rare enough to feel deliberate.
const STAR_COLORS = [
  [155, 176, 255],
  [190, 208, 255],
  [224, 233, 255],
  [255, 250, 244],
  [255, 226, 186],
  [255, 197, 152]
];
const COLOR_WEIGHTS = [0.1, 0.19, 0.29, 0.23, 0.12, 0.07];

const pickColorIndex = () => {
  let r = Math.random();
  for (let i = 0; i < COLOR_WEIGHTS.length; i++) {
    r -= COLOR_WEIGHTS[i];
    if (r <= 0) return i;
  }
  return COLOR_WEIGHTS.length - 1;
};

const gaussian = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

const makeGlowSprite = (rgb) => {
  const size = 64;
  const s = document.createElement("canvas");
  s.width = size;
  s.height = size;
  const g = s.getContext("2d");
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  const [r, gg, b] = rgb;
  grad.addColorStop(0, `rgba(${r},${gg},${b},0.95)`);
  grad.addColorStop(0.18, `rgba(${r},${gg},${b},0.38)`);
  grad.addColorStop(0.45, `rgba(${r},${gg},${b},0.09)`);
  grad.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return s;
};

const makeSpikeSprite = () => {
  const size = 96;
  const s = document.createElement("canvas");
  s.width = size;
  s.height = size;
  const g = s.getContext("2d");
  const c = size / 2;
  for (let i = 0; i < 2; i++) {
    const horizontal = i === 0;
    const grad = g.createLinearGradient(
      horizontal ? 0 : c,
      horizontal ? c : 0,
      horizontal ? size : c,
      horizontal ? c : size
    );
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.75)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    if (horizontal) g.fillRect(0, c - 0.75, size, 1.5);
    else g.fillRect(c - 0.75, 0, 1.5, size);
  }
  return s;
};

const BRANCH_U = 0.85;
const TRAIL_POINTS = 40;

// Explicit summits and saddles joined by straight facets, then only lightly
// roughened. Colorado's Front Range reads as sharp pyramids with planar faces;
// plain midpoint displacement is self-similar and comes out rounded, more
// Appalachian than Rocky, so the facets have to be laid down deliberately.
const makeRockyRidge = (summitCount, jag, smoothing = 2) => {
  const nodes = [{ t: 0, v: 0.06 + Math.random() * 0.12 }];
  const span = 1 / summitCount;

  for (let i = 0; i < summitCount; i++) {
    const summitT = (i + 0.5) * span + (Math.random() - 0.5) * span * 0.45;
    // A few dominant peaks carrying the skyline, the rest subordinate.
    const dominant = Math.random() < 0.32;
    const v = dominant ? 0.74 + Math.random() * 0.26 : 0.38 + Math.random() * 0.3;
    nodes.push({ t: summitT, v });
    if (i < summitCount - 1) {
      // Cols deep enough to keep summits distinct, shallow enough that the
      // range still reads as connected massif rather than loose spikes.
      nodes.push({
        t: Math.min(0.999, summitT + span * (0.36 + Math.random() * 0.34)),
        v: v * (0.44 + Math.random() * 0.26)
      });
    }
  }
  nodes.push({ t: 1, v: 0.06 + Math.random() * 0.12 });
  nodes.sort((a, b) => a.t - b.t);

  // Subdivide the facets, displacing only a little so the faces stay planar.
  let pts = nodes;
  for (let pass = 0; pass < 3; pass++) {
    const next = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      next.push(a);
      next.push({
        t: (a.t + b.t) / 2,
        v: (a.v + b.v) / 2 + (Math.random() - 0.5) * jag * (b.t - a.t) * 3
      });
    }
    next.push(pts[pts.length - 1]);
    pts = next;
  }

  // Round the apexes back off. Straight facets alone come out razor-sharp;
  // a couple of light smoothing passes keep the angular structure while
  // weathering the summits into something between spike and dune.
  for (let pass = 0; pass < smoothing; pass++) {
    pts = pts.map((p, i, arr) => {
      if (i === 0 || i === arr.length - 1) return p;
      return { t: p.t, v: p.v * 0.55 + ((arr[i - 1].v + arr[i + 1].v) / 2) * 0.45 };
    });
  }

  return pts.map((p) => ({
    t: Math.max(0, Math.min(1, p.t)),
    v: Math.max(0, Math.min(1, p.v))
  }));
};

export default function TopMilkyWay() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return undefined;
    const ctx = c.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const glowSprites = STAR_COLORS.map(makeGlowSprite);
    const spikeSprite = makeSpikeSprite();

    let w = 0;
    let h = 0;
    let stars = [];
    let foreground = null;
    let backdrop = null;
    let meteors = [];
    let nextMeteorAt = 0;

    // A plain diagonal galactic band. The curve maths drives meteor motion
    // only; the sky itself stays natural.
    const bandPoint = (t) => ({
      x: -0.1 * w + t * 1.2 * w,
      y: 0.88 * h - t * 0.78 * h
    });

    const makeStars = () => {
      const area = w * h;
      const scattered = Math.floor(area / 3400);
      const clustered = Math.floor(area / 2600);
      const arr = [];

      const push = (x, y, brightBias) => {
        if (x < 0 || x > w || y < 0 || y > h) return;
        const q = Math.pow(Math.random(), 3.2);
        const r = 0.35 + q * 1.85 + brightBias * 0.4;
        arr.push({
          x,
          y,
          r,
          ci: pickColorIndex(),
          base: 0.3 + q * 0.62 + Math.random() * 0.12,
          amp: 0.06 + Math.random() * 0.22,
          phase: Math.random() * Math.PI * 2,
          speed: 0.5 + Math.random() * 1.7,
          drift: (0.5 + r * 0.5) * 0.35,
          glow: q > 0.34,
          spike: q > 0.88
        });
      };

      for (let i = 0; i < scattered; i++) push(Math.random() * w, Math.random() * h, 0);
      for (let i = 0; i < clustered; i++) {
        const p = bandPoint(Math.random());
        const spread = h * 0.3;
        push(p.x + gaussian() * spread * 1.5, p.y + gaussian() * spread, 0.15);
      }
      return arr;
    };

    const makeBackdrop = () => {
      const b = document.createElement("canvas");
      b.width = Math.max(1, Math.floor(w * dpr));
      b.height = Math.max(1, Math.floor(h * dpr));
      const g = b.getContext("2d");
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.globalCompositeOperation = "lighter";

      const puffs = 22;
      for (let i = 0; i < puffs; i++) {
        const p = bandPoint(i / (puffs - 1));
        const px = p.x + gaussian() * h * 0.18;
        const py = p.y + gaussian() * h * 0.12;
        const radius = h * (0.26 + Math.random() * 0.3);
        const grad = g.createRadialGradient(px, py, 0, px, py, radius);
        grad.addColorStop(0, "rgba(120,150,255,0.052)");
        grad.addColorStop(0.45, "rgba(90,120,220,0.024)");
        grad.addColorStop(1, "rgba(60,80,180,0)");
        g.fillStyle = grad;
        g.fillRect(0, 0, w, h);
      }
      return b;
    };

    // A dome with an open shutter, in pure black. Nothing is lit: the shutter
    // is a wedge left unpainted, so the sky shows through the gap and the
    // building reads purely by what it occludes.
    const drawObservatory = (g, x, groundY, s, fill) => {
      const domeR = s;
      const baseH = s * 1.05;
      const baseW = s * 2.15;
      const domeY = groundY - baseH;

      g.fillStyle = fill;
      g.beginPath();
      g.moveTo(x - baseW / 2, groundY + 2);
      g.lineTo(x - baseW / 2 + s * 0.12, domeY);
      g.lineTo(x + baseW / 2 - s * 0.12, domeY);
      g.lineTo(x + baseW / 2, groundY + 2);
      g.closePath();
      g.fill();

      // Upper half from PI to 2PI, with the slit wedge skipped rather than
      // subtracted, so no compositing is needed to punch the opening.
      const slitFrom = Math.PI * 1.37;
      const slitTo = Math.PI * 1.47;
      g.beginPath();
      g.arc(x, domeY, domeR, Math.PI, slitFrom);
      g.lineTo(x, domeY);
      g.arc(x, domeY, domeR, slitTo, Math.PI * 2);
      g.closePath();
      g.fill();
    };

    const makeForeground = () => {
      const f = document.createElement("canvas");
      f.width = Math.max(1, Math.floor(w * dpr));
      f.height = Math.max(1, Math.floor(h * dpr));
      const g = f.getContext("2d");
      g.setTransform(dpr, 0, 0, dpr, 0, 0);

      const ridgePath = (pts) => {
        g.beginPath();
        g.moveTo(0, h + 4);
        for (const p of pts) g.lineTo(p.x, p.y);
        g.lineTo(w, h + 4);
        g.closePath();
      };

      const fillRidge = (nodes, baseY, amp, fill, rim, snow) => {
        const pts = nodes.map((n) => ({ x: n.t * w, y: baseY - n.v * amp }));
        ridgePath(pts);
        g.fillStyle = fill;
        g.fill();

        if (snow) {
          // Snow sits on the summits and thins downslope, so clip to the
          // mountain and lay a vertical gradient over it — the peaks that poke
          // highest simply collect the most, which is what actually happens.
          const topY = Math.min(...pts.map((p) => p.y));
          const snowlineY = topY + amp * snow.depth;
          g.save();
          ridgePath(pts);
          g.clip();
          const grad = g.createLinearGradient(0, topY, 0, snowlineY);
          grad.addColorStop(0, `rgba(226,238,255,${snow.alpha})`);
          grad.addColorStop(0.35, `rgba(198,218,250,${snow.alpha * 0.66})`);
          grad.addColorStop(0.72, `rgba(168,194,238,${snow.alpha * 0.22})`);
          grad.addColorStop(1, "rgba(150,180,230,0)");
          g.fillStyle = grad;
          g.fillRect(0, topY, w, snowlineY - topY);
          g.restore();
        }

        if (rim) {
          g.strokeStyle = rim;
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(pts[0].x, pts[0].y);
          for (const p of pts) g.lineTo(p.x, p.y);
          g.stroke();
        }
        return pts;
      };

      // True silhouette: every range is pure black with no rim, no snow and no
      // tint. The ranges separate only where one skyline crosses another, and
      // the landscape is visible solely as absence of stars.
      const farPts = fillRidge(makeRockyRidge(8, 0.24, 2), h * 1.0, h * 0.42, "#000000");

      // Put the observatory on a high shoulder rather than a knife-edge
      // summit — a flat-ish spot is where one would actually be built.
      let best = null;
      for (let i = 2; i < farPts.length - 2; i++) {
        const p = farPts[i];
        if (p.x < w * 0.6 || p.x > w * 0.82) continue;
        const slope = Math.abs(farPts[i + 2].y - farPts[i - 2].y);
        const score = (h - p.y) - slope * 3.2;
        if (!best || score > best.score) best = { p, score };
      }
      if (best) {
        const s = Math.max(11, h * 0.062);
        drawObservatory(g, best.p.x, best.p.y + 2, s, "#000000");
      }

      fillRidge(makeRockyRidge(10, 0.26, 2), h * 1.04, h * 0.3, "#000000");

      // Near range drawn last so it occludes the bases behind it.
      fillRidge(makeRockyRidge(7, 0.3, 3), h * 1.12, h * 0.2, "#000000");

      return f;
    };

    const build = () => {
      w = window.innerWidth;
      h = Math.floor(window.innerHeight / 2);
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      c.style.width = w + "px";
      c.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = makeStars();
      backdrop = makeBackdrop();
      foreground = makeForeground();
      meteors = [];
      nextMeteorAt = performance.now() + 500 + Math.random() * 1500;
    };

    // Each meteor rides a short random slice of the curve, then that slice is
    // rotated, scaled and dropped somewhere in the sky. Because only a fragment
    // is ever traced, it reads as a natural arcing streak — the equation
    // supplies the curvature, not a visible shape.
    const spawnMeteor = () => {
      const track = Math.random() < 0.45 ? "oval" : "branch";
      const span = track === "oval" ? 0.5 + Math.random() * 0.9 : 0.4 + Math.random() * 0.55;
      const from =
        track === "oval"
          ? Math.random() * Math.PI * 2
          : -BRANCH_U + Math.random() * Math.max(0.01, BRANCH_U * 2 - span);
      const dir = Math.random() < 0.5 ? 1 : -1;

      // Sample the slice in curve space and measure it, so screen length is
      // controlled rather than whatever the parameterisation happens to give.
      const steps = 26;
      const local = [];
      for (let i = 0; i <= steps; i++) {
        const p = curvePoint(track, from + dir * span * (i / steps));
        local.push(p);
      }
      let raw = 0;
      for (let i = 1; i < local.length; i++) {
        raw += Math.hypot(local[i].x - local[i - 1].x, local[i].y - local[i - 1].y);
      }
      if (raw < 1e-6) return;

      const targetLen = 230 + Math.random() * 300;
      const scale = targetLen / raw;

      // Orient so the streak sets off within a downward cone, the way a real
      // meteor enters, then let the curve bend it from there.
      const t0 = local[0];
      const t1 = local[1];
      const localAngle = Math.atan2(-(t1.y - t0.y), t1.x - t0.x);
      const screenAngle = 0.35 + Math.random() * (Math.PI - 0.7);
      const rot = screenAngle - localAngle;

      meteors.push({
        track,
        param: from,
        dir,
        remaining: span,
        origin: t0,
        scale,
        cos: Math.cos(rot),
        sin: Math.sin(rot),
        ox: Math.random() * w,
        oy: -30 + Math.random() * h * 0.45,
        speed: 250 + Math.random() * 230,
        width: 1.6 + Math.random() * 0.9,
        fireball: Math.random() < 0.13,
        trail: [],
        age: 0,
        fade: 1
      });
    };

    const meteorPoint = (m, param) => {
      const p = curvePoint(m.track, param);
      const lx = (p.x - m.origin.x) * m.scale;
      const ly = -(p.y - m.origin.y) * m.scale;
      return {
        x: m.ox + lx * m.cos - ly * m.sin,
        y: m.oy + lx * m.sin + ly * m.cos
      };
    };

    // Pre-rendered once per resize, so the whole landscape costs one blit.
    const drawForeground = () => {
      if (foreground) ctx.drawImage(foreground, 0, 0, w, h);
    };

    const drawStar = (s, alpha) => {
      const [r, g, b] = STAR_COLORS[s.ci];
      if (s.glow) {
        const size = s.r * (s.spike ? 17 : 12);
        ctx.globalAlpha = alpha * 0.85;
        ctx.drawImage(glowSprites[s.ci], s.x - size / 2, s.y - size / 2, size, size);
        if (s.spike) {
          const ss = s.r * 26;
          ctx.globalAlpha = alpha * 0.5;
          ctx.drawImage(spikeSprite, s.x - ss / 2, s.y - ss / 2, ss, ss);
        }
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawMeteor = (m) => {
      if (m.trail.length < 2) return;
      const head = m.trail[m.trail.length - 1];
      const tail = m.trail[0];
      const a = Math.min(1, m.age / 0.16) * m.fade;
      if (a <= 0.01) return;

      // One path, one gradient, one stroke. The trail curves because it is the
      // meteor's own history along the curve, not a straight extrapolation.
      const grad = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y);
      if (m.fireball) {
        grad.addColorStop(0, `rgba(255,255,255,${a})`);
        grad.addColorStop(0.12, `rgba(255,236,205,${a * 0.8})`);
        grad.addColorStop(0.45, `rgba(255,170,120,${a * 0.3})`);
        grad.addColorStop(1, "rgba(255,120,80,0)");
      } else {
        grad.addColorStop(0, `rgba(255,255,255,${a})`);
        grad.addColorStop(0.14, `rgba(196,242,255,${a * 0.72})`);
        grad.addColorStop(0.5, `rgba(90,190,255,${a * 0.26})`);
        grad.addColorStop(1, "rgba(60,140,255,0)");
      }
      ctx.strokeStyle = grad;
      ctx.lineWidth = m.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(tail.x, tail.y);
      for (let i = 1; i < m.trail.length; i++) ctx.lineTo(m.trail[i].x, m.trail[i].y);
      ctx.stroke();

      const headSize = (m.fireball ? 32 : 18) * (0.65 + a * 0.35);
      ctx.globalAlpha = a;
      ctx.drawImage(
        glowSprites[m.fireball ? 4 : 2],
        head.x - headSize / 2,
        head.y - headSize / 2,
        headSize,
        headSize
      );
      ctx.globalAlpha = 1;
    };

    const drawStaticFrame = () => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      if (backdrop) ctx.drawImage(backdrop, 0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const s of stars) drawStar(s, s.base);
      ctx.globalCompositeOperation = "source-over";
      drawForeground();
    };

    const reduced = prefersReducedMotion();
    const onResize = () => {
      build();
      if (reduced) drawStaticFrame();
    };
    build();
    window.addEventListener("resize", onResize);

    if (reduced) {
      drawStaticFrame();
      return () => window.removeEventListener("resize", onResize);
    }

    let raf;
    let last = performance.now();
    let t = 0;

    const render = () => {
      raf = requestAnimationFrame(render);

      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;

      if (now >= nextMeteorAt) {
        spawnMeteor();
        if (Math.random() < 0.2) spawnMeteor();
        nextMeteorAt = now + 1700 + Math.random() * 3500;
      }

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(backdrop, 0, 0, w, h);

      ctx.globalCompositeOperation = "lighter";

      for (const s of stars) {
        s.x -= s.drift * dt;
        if (s.x < -4) s.x = w + 4;
        const tw =
          Math.sin(s.phase + t * s.speed) * 0.65 +
          Math.sin(s.phase * 1.7 + t * s.speed * 0.43) * 0.35;
        drawStar(s, Math.max(0.05, Math.min(1, s.base + s.amp * tw)));
      }

      const alive = [];
      for (const m of meteors) {
        m.age += dt;

        // Convert pixels-per-second into parameter-per-second by measuring how
        // fast the transformed curve moves on screen right here.
        const eps = 0.004;
        const p0 = meteorPoint(m, m.param);
        const p1 = meteorPoint(m, m.param + eps);
        const perParam = Math.hypot(p1.x - p0.x, p1.y - p0.y) / eps;
        const step = (m.speed * dt) / Math.max(perParam, 30);

        m.param += step * m.dir;
        m.remaining -= step;

        m.trail.push(meteorPoint(m, m.param));
        if (m.trail.length > TRAIL_POINTS) m.trail.shift();

        if (m.remaining <= 0) m.fade -= dt * 1.9;
        drawMeteor(m);
        if (m.fade > 0) alive.push(m);
      }
      meteors = alive;

      ctx.globalCompositeOperation = "source-over";
      drawForeground();
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="top-half" aria-hidden="true" />;
}
