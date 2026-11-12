// Area-weighted centroid of the largest ring of a (Multi)Polygon: a label
// point that sits inside ordinary convex-ish units, good enough for labels.
export default function centroid(g) {
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  let best = null, bestA = -1;
  for (const p of polys) {
    const r = p[0];
    let a = 0, cx = 0, cy = 0;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const f = r[j][0] * r[i][1] - r[i][0] * r[j][1];
      a += f; cx += (r[j][0] + r[i][0]) * f; cy += (r[j][1] + r[i][1]) * f;
    }
    if (Math.abs(a) > bestA) { bestA = Math.abs(a); best = a ? [cx / (3 * a), cy / (3 * a)] : r[0]; }
  }
  return best;
}
