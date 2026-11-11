import { BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments, Group } from 'three';
import hydro from '../data/hydro.json';

/**
 * Rivers and lakes on the globe, from Natural Earth 1:50m.
 *
 * Public domain geometry, bundled with the app: the Earth gains real
 * hydrography with no tile server, no API key and nothing to pay for, and it
 * keeps working when the network does not.
 *
 * Everything is built into two line meshes rather than one object per feature.
 * A thousand separate meshes is a thousand draw calls; two is two, and the
 * globe has to stay smooth with every conflict layer on top of this.
 */
interface HydroFile {
  rivers: { r: number; c: [number, number][] }[];
  lakes: { n: string | null; c: [number, number][] }[];
  source: string;
}

const H = hydro as unknown as HydroFile;

export const HYDRO_SOURCE = H.source;
export const riverCount = H.rivers.length;
export const lakeCount = H.lakes.length;

/** Position on a sphere of radius `r` for a lon/lat pair, matching globe.gl. */
function toXYZ(lng: number, lat: number, r: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (90 - lng) * (Math.PI / 180);
  return [r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
}

/** One LineSegments mesh from many polylines. */
function segments(lines: [number, number][][], radius: number, color: number, opacity: number): LineSegments {
  const pts: number[] = [];
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) {
      const [ax, ay] = line[i - 1];
      const [bx, by] = line[i];
      // A jump across the antimeridian would draw a line straight through the
      // globe, so the segment is dropped rather than stitched.
      if (Math.abs(bx - ax) > 180) continue;
      pts.push(...toXYZ(ax, ay, radius), ...toXYZ(bx, by, radius));
    }
  }
  const geom = new BufferGeometry();
  geom.setAttribute('position', new BufferAttribute(new Float32Array(pts), 3));
  const mat = new LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  // The layer's own opacity scales these, so the ratio between major rivers,
  // minor rivers and lakes survives the slider.
  mat.userData.base = opacity;
  return new LineSegments(geom, mat);
}

/**
 * The hydrography group, sitting just above the surface so it is not swallowed
 * by the globe's own texture but stays below every data layer.
 */
export function buildHydro(globeRadius: number): Group {
  const g = new Group();
  const r = globeRadius * 1.0012;
  // Larger rivers read slightly stronger, which is how a paper map does it.
  const major = H.rivers.filter((x) => x.r <= 3).map((x) => x.c);
  const minor = H.rivers.filter((x) => x.r > 3).map((x) => x.c);
  g.add(segments(major, r, 0x6ec3ef, 0.92));
  g.add(segments(minor, r, 0x59a8d6, 0.62));
  g.add(segments(H.lakes.map((l) => l.c), r, 0x7ad2f5, 0.95));
  g.renderOrder = 1;
  return g;
}

/** Vertex count, for the performance note in the methodology panel. */
export const hydroPoints =
  H.rivers.reduce((n, x) => n + x.c.length, 0) + H.lakes.reduce((n, x) => n + x.c.length, 0);


/** Applies the layer's opacity, keeping each line type's relative weight. */
export function setHydroOpacity(group: Group, opacity: number): void {
  for (const child of group.children) {
    const mat = (child as LineSegments).material as LineBasicMaterial;
    const base = (mat.userData.base as number | undefined) ?? mat.opacity;
    mat.opacity = base * opacity;
  }
}
