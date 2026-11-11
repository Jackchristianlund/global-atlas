import { Group } from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

/**
 * The front line, drawn as a real screen-space stroke.
 *
 * globe.gl's own path layer measures stroke width in angular degrees and
 * renders each segment separately. The sourced front line has vertices about a
 * kilometre apart; at globe distance a legible stroke is tens of kilometres
 * wide, so every segment becomes a short, wide quad and the line comes out as
 * a string of beads instead of a stroke. Widening it makes the beads bigger;
 * thinning the vertices enough to cure it throws away the shape the line
 * exists to show.
 *
 * three's Line2 solves the actual problem: it draws a polyline with a width in
 * screen pixels and proper joins, so the line is continuous at any distance
 * and holds the same weight whether the camera is at the globe or over a
 * single oblast. The geometry is the source geometry, unthinned.
 */

/** Position on a sphere of radius `r` for a lon/lat pair, matching globe.gl. */
function toXYZ(lng: number, lat: number, r: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (90 - lng) * (Math.PI / 180);
  return [r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
}

export interface FrontMeshOptions {
  /** Globe radius in scene units, as globe.gl uses it. */
  globeRadius: number;
  /** Height above the surface, as a fraction of the radius. Must clear the
   *  extruded control polygons or the line is drawn inside them. */
  altitude: number;
  /** Core width in CSS pixels. */
  width: number;
  /** Dark casing width in CSS pixels, so the line reads over land and sea. */
  casing: number;
  color: string;
  casingColor: string;
  opacity: number;
}

export interface FrontMesh {
  group: Group;
  /** Line2 needs the viewport to convert its pixel width; keep it current. */
  setResolution: (w: number, h: number) => void;
  setOpacity: (o: number) => void;
  dispose: () => void;
}

/**
 * Builds the casing and the core as two passes over the same segments, so the
 * casing always sits directly under its own core.
 */
export function buildFrontMesh(
  segments: { id: string; coords: number[][] }[],
  opts: FrontMeshOptions,
): FrontMesh {
  const group = new Group();
  group.renderOrder = 12;
  const materials: LineMaterial[] = [];
  const geometries: LineGeometry[] = [];
  const r = opts.globeRadius * (1 + opts.altitude);

  for (const pass of ['casing', 'core'] as const) {
    const mat = new LineMaterial({
      color: pass === 'casing' ? opts.casingColor : opts.color,
      linewidth: pass === 'casing' ? opts.casing : opts.width,
      worldUnits: false,
      transparent: true,
      opacity: opts.opacity * (pass === 'casing' ? 0.9 : 1),
      depthTest: true,
      depthWrite: false,
      alphaToCoverage: false,
    });
    materials.push(mat);

    for (const seg of segments) {
      if (seg.coords.length < 2) continue;
      const flat: number[] = [];
      for (const [lon, lat] of seg.coords) {
        const [x, y, z] = toXYZ(lon, lat, r);
        flat.push(x, y, z);
      }
      const geom = new LineGeometry();
      geom.setPositions(flat);
      geometries.push(geom);
      const line = new Line2(geom, mat);
      // Line2 cannot compute a meaningful bounding sphere from its instanced
      // attributes, and without one the renderer frustum-culls the whole line
      // the moment the globe's centre leaves the view.
      line.computeLineDistances();
      line.frustumCulled = false;
      line.renderOrder = pass === 'casing' ? 12 : 13;
      group.add(line);
    }
  }

  return {
    group,
    setResolution: (w, h) => { for (const m of materials) m.resolution.set(w, h); },
    setOpacity: (o) => {
      for (let i = 0; i < materials.length; i++) {
        materials[i].opacity = o * (i === 0 ? 0.9 : 1);
        materials[i].visible = o > 0.01;
      }
    },
    dispose: () => {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      group.clear();
    },
  };
}
