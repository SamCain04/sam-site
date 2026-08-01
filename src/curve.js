// Short Weierstrass curve: y² = x³ + ax + b.
//
// a = -3 is the coefficient NIST P-256 uses. Real ECC works over a finite
// field; plotted over the reals the same equation traces two smooth components,
// and short slices of them make far more graceful meteor arcs than a straight
// line or a hand-tuned bezier. Nothing here is drawn — it only shapes motion.
export const A = -3;
export const B = 1;

export const fx = (x) => x * x * x + A * x + B;

// Real roots of x³ + px + q via the trigonometric solution. Valid while the
// discriminant is positive, which for a = -3, b = 1 it is (4p³ + 27q² = -81),
// so the curve keeps both real components.
export function cubicRealRoots(p, q) {
  const m = 2 * Math.sqrt(-p / 3);
  const arg = (3 * q) / (p * m);
  const theta = Math.acos(Math.max(-1, Math.min(1, arg))) / 3;
  return [0, 1, 2]
    .map((k) => m * Math.cos(theta - (2 * Math.PI * k) / 3))
    .sort((r1, r2) => r1 - r2);
}

// [r1, r2] bound the closed oval; the unbounded branch starts at r3.
export const ROOTS = cubicRealRoots(A, B);

// Substituting x = r3 + u² makes y linear in u near the turning point, so a
// meteor sweeps through y = 0 smoothly instead of stalling at the vertical
// tangent where dy/dx diverges.
export function branchPoint(u) {
  const x = ROOTS[2] + u * u;
  const v = fx(x);
  const y = v <= 0 ? 0 : Math.sqrt(v);
  return { x, y: u < 0 ? -y : y };
}

// Same trick around the oval: x sweeps r1 → r2 → r1 as phi runs 0 → 2π.
export function ovalPoint(phi) {
  const mid = (ROOTS[0] + ROOTS[1]) / 2;
  const half = (ROOTS[1] - ROOTS[0]) / 2;
  const x = mid - half * Math.cos(phi);
  const v = fx(x);
  const y = v <= 0 ? 0 : Math.sqrt(v);
  return { x, y: Math.sin(phi) < 0 ? -y : y };
}

export const curvePoint = (track, param) =>
  track === "oval" ? ovalPoint(param) : branchPoint(param);
