// Writes a small share page per conflict into dist/c/<id>/index.html.
//
// Link previews (Slack, Messenger, X, LinkedIn…) read the page's meta tags and
// never run its script, and they never see a URL's #hash. So a shared link to
// the app itself always previews as the front page. These pages carry the
// conflict's own title, description and image, then send the reader on to the
// app, keeping whatever view the sharer had in the hash.
//
// Run after `vite build` (see package.json). A conflict gets a page only if
// its preview image exists under public/og/ (made by scripts/build-og.mjs).
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { CONFLICT } from '../src/data';
import { SHARE_CONFLICTS } from '../src/lib/shareConflicts';

const SITE = 'https://jackchristianlund.github.io/global-atlas/';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function sharePage(id: string, nameNo: string, nameEn: string): string {
  const title = `${nameNo} — Global Atlas`;
  const desc = `Kontroll, frontlinjer og dokumenterte hendelser for ${nameNo}, med kilde og dato for hver vurdering. Ikke sanntid.`;
  const img = `${SITE}og/${id}.jpg`;
  const url = `${SITE}c/${id}/`;
  const fallback = `#s=conflict%3A${id}`;
  return `<!doctype html>
<html lang="nb">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Global Atlas" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${img}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${esc(`Global Atlas med ${nameNo} valgt på kloden (${nameEn}).`)}" />
<meta property="og:locale" content="nb_NO" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${img}" />
<link rel="canonical" href="${url}" />
<script>location.replace('../../' + (location.hash && location.hash.length > 1 ? location.hash : '${fallback}'));</script>
<style>body{background:#070B14;color:#EAF2FF;font:16px system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0}a{color:#00D9FF}</style>
</head>
<body><p><a href="../../${fallback}">Åpne ${esc(nameNo)} i Global Atlas</a></p></body>
</html>
`;
}

function main() {
  let n = 0;
  for (const id of SHARE_CONFLICTS) {
    const c = CONFLICT[id];
    if (!c || !existsSync(`public/og/${id}.jpg`)) continue;
    mkdirSync(`dist/c/${id}`, { recursive: true });
    writeFileSync(`dist/c/${id}/index.html`, sharePage(id, c.name[0], c.name[1]));
    n++;
  }
  console.log(`share pages: ${n}`);
}

if (process.argv[1]?.endsWith('build-share-pages.ts')) main();
