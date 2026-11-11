/**
 * Map label glyphs, served from memory.
 *
 * MapLibre fetches glyph ranges over HTTP from a `{fontstack}/{range}` URL
 * template. There is nowhere to fetch them from here: a published artifact
 * cannot reach an external glyph service, and its own host declines to serve
 * the binary file types glyph ranges normally use. So the ranges are inlined
 * in the bundle and handed to MapLibre as blob URLs through `transformRequest`,
 * which is the one hook that lets a URL be answered locally.
 *
 * Without this there are no labels on the regional map at all, which is the
 * difference between a map and a set of coloured shapes.
 */
import { GLYPHS } from '../data/detail/glyphs';

/** The scheme is a sentinel: nothing ever tries to resolve it over the network. */
export const GLYPHS_URL = 'ga-glyphs://{fontstack}/{range}.pbf';

const blobs = new Map<string, string>();

function decode(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Resolves one glyph request. Returns null for anything that is not a glyph
 * URL, so the caller can pass it straight through.
 */
export function resolveGlyphRequest(url: string): string | null {
  if (!url.startsWith('ga-glyphs://')) return null;
  const rest = decodeURIComponent(url.slice('ga-glyphs://'.length));
  const [fontstack, file] = rest.split('/');
  const range = (file ?? '').replace(/\.pbf$/, '');
  const key = `${fontstack}/${range}`;
  const cached = blobs.get(key);
  if (cached) return cached;

  // A fontstack may name several faces; take the first one bundled.
  const face = fontstack.split(',').map((f) => f.trim()).find((f) => GLYPHS[f]);
  const b64 = face ? GLYPHS[face]?.[range] : undefined;
  // A range that was never bundled resolves to an empty response rather than
  // an error: MapLibre then draws the labels it can and skips the rest.
  const bytes = b64 ? decode(b64) : new Uint8Array(0);
  const u = URL.createObjectURL(new Blob([bytes as unknown as BlobPart], { type: 'application/x-protobuf' }));
  blobs.set(key, u);
  return u;
}

/** The faces available, for a style that wants to name one. */
export const GLYPH_FACES = Object.keys(GLYPHS);
