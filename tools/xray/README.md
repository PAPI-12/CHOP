# X-ray hero

Builds the About-page hero: `public/videos/about-hero-xray.{webm,mp4}` plus its
poster. 22.07 s, 1280×720, 24 fps, no audio.

The sequence: it opens on a still (item 1), the subject thinks and stands,
draws, shoots the light box, the room goes dark, and the lime x-ray look comes
up. The subject holsters the gun and settles back into the crouch, and the
piece ends on a still in x-ray.

## Running it

The footage is not in the repo — it is 27 MB and lives in the Drive folder.
Drop the seven items into `assets/xray/source/` as `1.webp`, `2.mp4` … `7.webp`,
then:

```sh
python3 tools/xray/make_assets.py            # once: builds tools/xray/plates
python3 tools/xray/tune.py 4                 # optional: re-converge the grade
python3 tools/xray/edit.py --codec vp9  --crf 38 --out public/videos/about-hero-xray.webm
python3 tools/xray/edit.py --codec h264 --crf 22 --out public/videos/about-hero-xray.mp4
```

Needs `ffmpeg` on `FF` (see `edit.py`) — no system ffmpeg is assumed, the
static build from `imageio-ffmpeg` works.

## The pipeline

Two passes, because one filtergraph for the whole timeline gets OOM-killed on
a 4 GB box.

**Pass 1** (`seg_graph` in `edit.py`) renders one 10-bit intermediate per
segment. Clips 3 and 4 are vertical, so they are laid over a heavily defocused,
dimmed copy of themselves and feathered in; everything else is padded out to
16:9 on a flat canvas. Each segment is then normalised to a shared black and
white point and graded.

**Pass 2** concatenates with cross-dissolves, overlays the sweep on clip 6, and
applies **one** grain pass over the whole timeline — so grain, halation and the
vignette are identical in every shot, which is what makes seven unrelated
sources read as one piece.

## The grade

`edit.py` carries hardcoded `LEVELS` per source, and `grade.json` overrides
them. Two tools keep those numbers honest:

- `calibrate.py` derives the black/white points and per-clip gamma from the
  footage itself.
- `tune.py` renders, measures the p50 of every segment, and nudges the gammas
  until they agree. It converges in two or three rounds.

Current state — reality p50 spread **1.2 / 255**, x-ray p50 spread **0.1**,
x-ray hue **78°** against the site's `#d7ff4f` at 74°.

## Two traps worth knowing about

**`hue` is broken in this chain.** It clips R and B to zero somewhere after the
16-bit `colorbalance` — the x-ray came out as flat green with R=3, B=2. The
lime shift is therefore a hand-written `colorchannelmixer` matrix
(`LIME_ROT`), which is luminance-preserving, so it moves the hue ~18° without
touching the exposure. `unsharp` is broken at 16-bit too (it takes the encode
from 16 MB to 89 MB); the "clarity" pass is an explicit
`A + k*(A - gblur(A))` blend instead.

**CRF 22 is the floor.** At CRF 23 x264 throws away about half the film grain
and at 24 about 70%, so the deliverable loses the texture that keeps the AI
footage from reading as plastic. Measured on the flat tiles: 4.4 at CRF 22,
2.4 at 23, 1.3 at 24.

## Delivery

VP9 first, H.264 second. At equal quality VP9 holds the grain that x264
discards, in about 60% of the bytes: 5.5 MB against 8.9 MB. Both are encoded
from the pass-1 intermediates — encoding the webm from the finished mp4
inherits x264's losses and doubles the damage.

`XrayHero.tsx` ships the poster as the idle state and holds the video's last
frame when it ends, so the hero settles into a second still rather than
snapping back.
