"""
Bundles the interface typefaces as woff2.

The app asked Google Fonts for IBM Plex Sans, IBM Plex Mono and Saira
Condensed. A published artifact cannot reach any external host, so those
requests never arrived and every reader saw system fallbacks instead. The
fonts are open licensed (OFL), so they travel with the app.

Each face is subset to the characters the interface and the bundled place
names actually use: Latin, Latin-1, Latin Extended-A and Cyrillic, plus the
punctuation the UI relies on. Subsetting is what keeps this to a sensible size.
"""
import pathlib
from fontTools import subset
from fontTools.ttLib import TTFont

OUT = pathlib.Path("public/fonts/ui")
OUT.mkdir(parents=True, exist_ok=True)

UNICODES = "U+0020-007F,U+00A0-00FF,U+0100-017F,U+0400-04FF,U+2000-206F,U+2190-21FF,U+2212,U+25A0-25FF"

FACES = [
    ("IBMPlexSans",      "/tmp/gfonts/ofl/ibmplexsans/IBMPlexSans[wdth,wght].ttf", [400, 500, 600]),
    ("IBMPlexMono-400",  "/tmp/gfonts/ofl/ibmplexmono/IBMPlexMono-Regular.ttf",    None),
    ("IBMPlexMono-500",  "/tmp/gfonts/ofl/ibmplexmono/IBMPlexMono-Medium.ttf",     None),
    ("SairaCondensed-500", "/tmp/gfonts/ofl/sairacondensed/SairaCondensed-Medium.ttf", None),
    ("SairaCondensed-600", "/tmp/gfonts/ofl/sairacondensed/SairaCondensed-SemiBold.ttf", None),
]

total = 0
for name, path, weights in FACES:
    src = pathlib.Path(path)
    if not src.exists():
        print(f"skip {name}: {path} missing")
        continue
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.desubroutinize = True
    opts.layout_features = ["kern", "liga", "ccmp", "locl", "mark", "mkmk"]
    opts.notdef_outline = True
    opts.recalc_bounds = True
    # Keep the variable axes on the Plex Sans file: one file covers 400/500/600
    # instead of three.
    opts.retain_gids = False
    font = subset.load_font(str(src), opts)
    subsetter = subset.Subsetter(options=opts)
    subsetter.populate(unicodes=subset.parse_unicodes(UNICODES))
    subsetter.subset(font)
    dest = OUT / f"{name}.woff2"
    subset.save_font(font, str(dest), opts)
    font.close()
    size = dest.stat().st_size
    total += size
    print(f"{name}: {size/1024:.0f} KB")

print(f"total {total/1024:.0f} KB")
