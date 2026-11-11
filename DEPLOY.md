# Getting the real map

Everything in this app already works. What a published Claude artifact cannot
do is reach the network: not a tile provider, not OCHA, not anything. Two
features are therefore dormant there and switch on by themselves the moment the
app is served from an ordinary web host:

- **The real base map.** Terrain, roads down to street level, satellite and
  hybrid styles — the five map styles are not broken, they are unreachable.
- **The live front line.** The app queries OCHA directly at about 110 m
  precision instead of falling back to the bundled copy at roughly 1300 m. The
  provenance ticket flips from "Stored copy" to "Fetched live from the source"
  on its own, so you can see which one you got.

Nothing needs changing in the code for either.

## Fastest: drop the folder on a host (about a minute, no account needed)

`global-atlas-dist.zip` is a finished site. Unzip it and drag the folder onto:

- **Netlify Drop** — https://app.netlify.com/drop
- **Cloudflare Pages** — "Direct upload" when creating a project

Both give you a URL straight away. `_headers` and `_redirects` are already in
the folder; both hosts read them and ignore the other's.

## On your own machine (no host at all)

From `global-atlas-src.zip`, with Node 20 or newer:

```
npm install
npm run dev
```

Open the address it prints. Same result, visible only to you.

## GitHub Pages

Needs a GitHub account connected to this chat, after which I can create the
repository, push and enable Pages end to end. The build is already configured
for a subpath, so it works under `/<repo>/` without changes.

## One thing to decide first

Putting this on a public URL publishes the bundled front line geometry, which
is OCHA's republication of the ISW/CTP assessment. Attribution to all three is
already on the map, and that is what the source requires. **Commercial
redistribution rights are still unresolved** — see `docs/FRONTLINE.md`. A
private or unlisted page you use yourself is a different thing from a paid
product, but it is still publication, so it is worth being deliberate about
rather than discovering later.

## After it is live

Send me the URL. I can open it in your browser and check that the tiles and the
live front line actually load — that is the one thing this build environment
has never been able to verify.
