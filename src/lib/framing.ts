/**
 * How big the globe is on screen, and where it sits.
 *
 * The globe used to rest at a fixed altitude with a fixed sideways nudge,
 * which left it at about 70% of the stage height on every screen and in the
 * wrong place as soon as a side panel was folded away. Here the resting
 * distance is solved from the space actually available, so the Earth fills
 * the stage between the panels without being clipped by it.
 *
 * Pure functions on numbers: no DOM, no store, so they can be tested.
 */

/** globe.gl's camera: 50° vertical field of view. */
const HALF_FOV = (25 * Math.PI) / 180;

/** Widths of the floating panels, in CSS pixels. Kept in step with styles.css. */
export const PANEL = {
  /** Gap between a floating panel and the edge of the stage. */
  margin: 10,
  left: 262,
  /** The edge tab left behind when the filter panel is folded away. */
  leftFolded: 36,
  /** The overview: compact, so the globe gets the room. */
  rightCompact: 340,
  /** Something is selected: room for the intelligence detail. */
  rightExpanded: 420,
  rightFolded: 36,
} as const;

/** At or below this width the panels become drawers over the stage. */
export const DRAWER_BREAKPOINT = 880;

export interface Insets { left: number; right: number }

/**
 * How much of the stage each side panel covers. On narrow screens the panels
 * are drawers that open over the stage, so they take nothing from the globe.
 */
export function panelInsets(
  stageW: number,
  o: { leftFolded: boolean; rightFolded: boolean; expanded: boolean },
): Insets {
  if (stageW <= DRAWER_BREAKPOINT) return { left: 0, right: 0 };
  const narrow = stageW <= 1180;
  const left = o.leftFolded ? PANEL.leftFolded : PANEL.left + PANEL.margin;
  const rightW = o.expanded ? PANEL.rightExpanded : PANEL.rightCompact;
  const right = o.rightFolded ? PANEL.rightFolded : (narrow ? Math.min(rightW, 350) : rightW) + PANEL.margin;
  return { left, right };
}

/**
 * The fraction of the viewport height the globe's disc covers when the camera
 * is `altitude` globe radii above the surface.
 *
 * The silhouette of a sphere seen from distance d (in radii) subtends
 * asin(1/d); a perspective camera maps tan of that onto tan(fov/2).
 */
export function discFraction(altitude: number): number {
  const d = 1 + Math.max(altitude, 1e-4);
  const alpha = Math.asin(Math.min(1, 1 / d));
  return Math.tan(alpha) / Math.tan(HALF_FOV);
}

/** The altitude at which the disc covers `fraction` of the viewport height. */
export function altitudeForFraction(fraction: number): number {
  const alpha = Math.atan(Math.max(fraction, 1e-3) * Math.tan(HALF_FOV));
  return 1 / Math.sin(alpha) - 1;
}

/** Bounds on the resting distance, so a huge or tiny screen stays sensible. */
const MIN_REST_ALT = 1.3;
/** globe.gl's controls stop zooming out at 560 units, 4.6 radii above the surface. */
const MAX_REST_ALT = 4.5;

/**
 * The resting altitude: the disc as large as the free space allows, with a
 * margin so the atmosphere and the limb markers are never cut off.
 *
 * Height is the usual limit on a desktop; on a phone the width is.
 */
export function restAltitude(stageW: number, stageH: number, insets: Insets): number {
  if (stageW <= 0 || stageH <= 0) return 2.15;
  const freeW = Math.max(200, stageW - insets.left - insets.right);
  const phone = stageW <= DRAWER_BREAKPOINT;
  // Diameter in pixels: 95% of the height, or 88% of the free width (93% on a
  // phone, where nothing floats beside it), whichever is smaller.
  const diameter = Math.min(stageH * (phone ? 0.8 : 0.95), freeW * (phone ? 0.93 : 0.88));
  const alt = altitudeForFraction(diameter / stageH);
  return Math.min(MAX_REST_ALT, Math.max(MIN_REST_ALT, alt));
}

/**
 * Sideways nudge that centres the globe in the gap between the panels rather
 * than in the middle of the stage the panels float over. In globe.gl a
 * negative x moves the globe left, which is what a wider right panel needs.
 */
export function globeOffset(insets: Insets): [number, number] {
  return [Math.round((insets.left - insets.right) / 2), 0];
}
