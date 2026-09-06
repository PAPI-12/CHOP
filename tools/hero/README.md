# Hero rain pane

The homepage hero is the **original photograph** (`public/images/hero-landscape-*.webp`)
with, on desktop only, an erasable rain pane drawn over it on a canvas.

The pane (`public/images/hero-rain-pane-{1920,1280}.webp`) is generated, not
painted or re-imagined: the original plate, softened and darkened to the
graphite glass the hero has always worn, wearing the droplets and runnels
lifted from a real rain-window photograph (`source/rain-window-1904.webp`).
Only the water is taken from that source — its own subject, background and
glass edges are masked out by fine-scale energy — so no borders and no
second person come through with the rain. Because the pane is built on the
original plate's geometry, the canvas draws it at the exact rectangle
`object-fit: cover` gives the photograph, and the wipe reveals the face
that was always underneath.

```bash
pip install numpy opencv-python-headless
python3 tools/hero/build-rain-pane.py          # writes both tiers
HERO_DEBUG=1 python3 tools/hero/build-rain-pane.py   # + source/debug-water.png
```

Every output must stay under 200 KB (the script steps WebP quality down until
it does); `npm run smoke` checks the sizes, headers and srcset widths.
