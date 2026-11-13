/**
 * The glyph URL template, on its own so the style definitions can name it
 * without pulling ~190 KB of inlined glyph ranges into the first download.
 * The scheme is a sentinel: nothing ever tries to resolve it over the network.
 */
export const GLYPHS_URL = 'ga-glyphs://{fontstack}/{range}.pbf';
