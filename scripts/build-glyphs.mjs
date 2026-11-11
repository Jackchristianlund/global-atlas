/**
 * Builds MapLibre glyph PBFs from Noto Sans and writes them into public/.
 *
 * Labels are what turn a set of coloured shapes into a map, and MapLibre needs
 * glyph ranges to draw text. Every hosted glyph service is an external host,
 * which a published artifact cannot reach, so the glyphs ship with the app and
 * are served from its own origin.
 *
 * Only the ranges the atlas actually uses: Latin with Norwegian diacritics,
 * and Cyrillic for place names in Ukraine, Russia and the Caucasus.
 */
import fontnik from 'fontnik';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const FONTS = {
  'Noto Sans Regular': '/tmp/fonts/noto-sans/NotoSans-Regular.ttf',
  'Noto Sans Bold': '/tmp/fonts/noto-sans/NotoSans-Bold.ttf',
};
// 0–255 Latin + Latin-1, 256–511 Latin Extended, 1024–1279 Cyrillic.
const RANGES = [[0, 255], [256, 511], [1024, 1279]];

let total = 0;
for (const [name, path] of Object.entries(FONTS)) {
  const buf = readFileSync(path);
  const dir = `public/fonts/${name}`;
  mkdirSync(dir, { recursive: true });
  for (const [start, end] of RANGES) {
    const pbf = await new Promise((res, rej) =>
      fontnik.range({ font: buf, start, end }, (err, data) => (err ? rej(err) : res(data))),
    );
    // Written as .bin, not .pbf: the artifact host will not serve a .pbf, and
    // MapLibre reads glyph ranges as raw bytes, so the extension is free.
    writeFileSync(`${dir}/${start}-${end}.bin`, pbf);
    total += pbf.length;
  }
  console.log(`${name}: ${RANGES.length} ranges`);
}
console.log(`total ${(total / 1024).toFixed(0)} KB`);
