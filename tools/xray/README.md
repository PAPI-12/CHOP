# X-ray hero

Builds the About-page hero: `public/videos/about-hero-xray.{webm,mp4}` plus its
poster. **28.42 s**, 1280×720, 24 fps, no audio.

The sequence: it opens on a super close-up, the subject thinks and stands,
draws, cocks the gun, we cut behind him, he shoots the light box, the room goes
dark, a bullet falls through the darkness, and the x-ray comes up. He holsters
and settles back into the crouch, and the piece ends on a still in x-ray.

**Original colour.** There is no grade anywhere in the chain — no curves, no
gamma, no hue rotation, no saturation, no colour balance, no black and white.
See [Colour](#colour) below.

## Running it

The footage is not in the repo — it is ~40 MB, gitignored, and lives in the
Drive folder `1b4rDWyRwHtylPyxKeyhX7mPqYGI_1PRS`. Download the twelve items and
drop them into `assets/xray/source/` under the names in
[Sources](#sources), then:

```sh
python3 tools/xray/make_assets.py            # once: builds tools/xray/plates
python3 tools/xray/edit.py --codec vp9  --crf 38 --out public/videos/about-hero-xray.webm
python3 tools/xray/edit.py --codec h264 --crf 22 --out public/videos/about-hero-xray.mp4
```

Add `--scale 0.5` for a fast preview — a full-res run is ~2 min for H.264 and
~45 s for VP9.

Needs `ffmpeg` on `FF` (see `edit.py`) — no system ffmpeg is assumed, the
static build from `imageio-ffmpeg` works. `bootstrap.sh` installs it to
`/tmp/ffmpeg`; **the sandbox wipes `/tmp`, `node_modules` and the staged footage
between sessions, so run it first every time.**

## The cut

Fourteen segments, cross-dissolved. Durations are output durations, so the two
ramped shots are not their source lengths.

| key | source | in–out | out dur | notes |
|-----|--------|--------|---------|-------|
| `mx`  | `minimax.mp4`             | 0.00–3.00 | 3.00 | opens the video |
| `td`  | `topdown.png`             | still     | 1.80 | push |
| `sn`  | `sneaker.webp`            | still     | 1.60 | push |
| `su`  | `standingup.mp4`          | 1.50–4.50 | 3.00 | cut as he rises |
| `cl`  | `closeup-white.png`       | still     | 1.80 | push |
| `ck`  | `cocking.mp4`             | 5.50–8.75 | 2.89 | **ramp 1.9× → 0.8×** |
| `bs`  | `backshot.mp4`            | 0.00–3.16 | 2.89 | **ramp 0.7× → 2.5×** |
| `sb`  | `5.mp4`                   | 1.50–5.60 | 4.10 | the shot; lights go out |
| `blk` | black                     | —         | 0.50 | the darkness |
| `bf`  | `bulletfalls.mp4`         | 2.90–4.72 | 1.82 | opens the dark scene |
| `gx`  | `groundlevel-xray.png`    | still     | 1.80 | push |
| `tk`  | `6.mp4`                   | 0.20–2.10 | 1.90 | the holster |
| `s6`  | `6.mp4`                   | 4.90–7.70 | 2.80 | settle |
| `en`  | `endframe-macro-xray.png` | still     | 2.60 | held, becomes x-ray mode |

In/out points come from measured motion, not guesswork (`measure.py`, or the
quick probe in the notes below):

- **Standing Up** — motion climbs 4.9 → 12.1 peaking at 2.75–3.12 s, so 1.5–4.5
- **Soft box** — motion peaks 18.7 at 3.6–4.0 s, luma 140 → 1 by 5.0 s
- **6.mp4** — motion decays 15.7 → 2.0; the settle is at the end
- **Cocking** — a cut at 3.5 s (motion 9.97 against a 0.5–1.2 baseline); the
  action then builds from 5.5 s and is still climbing when the clip ends, so
  5.5–8.75 is the usable half
- **Back shot** — only 3.2 s long; motion decays 5.7 → 2.7 and luma 78 → 48
  across the whole clip, which is why the ramp runs opposite to the cock's
- **Bullet falls** — luma bottoms out at 10 around 3.0 s and climbs to 63 by
  4.6 s, so 2.9–4.72 starts in the dark and reveals

## Speed ramps

`ck` and `bs` carry a `ramp=(r0, r1)` pair — playback rate at the head and tail
of the clip. `ramp_pts()` turns that into a `setpts` expression.

Output time is **quadratic** in source time, which makes `1/rate` linear: the
speed changes by the same amount every second instead of lurching. The obvious
alternative — rate linear in time — needs a `log()` and puts a visible knee at
the head of the clip.

```
T(S) = S/r0 + b·S²,   b = (1/r1 − 1/r0) / 2D        D = t1 − t0
output duration = D · (1/r0 + 1/r1) / 2
```

So a 0.7× → 2.5× ramp over 3.16 s of source yields 2.89 s of output, not 3.16.
`dur_of()` computes this, and everything downstream — the `-t` cap, the
timeline offsets, the cross-fades — reads from it.

`ck` decelerates and `bs` accelerates on purpose: the cock arrives at speed and
slows into the mechanism so the slide going back is legible, then the back shot
accelerates away into the shot. Two identical ramps back to back read as one
long lurch. **Flip `ck` to `(0.7, 2.5)` if you want both to build.**

## Colour

None. `edit.py` applies no curves, gamma, hue, saturation, colour balance or
monochrome, and never has since v4 — the `LEVELS`/`GAMMA_RGB`/`LIME_ROT`
machinery belongs to `grade.py`, which **edit.py does not import** and which
nothing in the render path calls. The sources go through untouched apart from:

- camera movement (stills get dollies/pushes; clips get trim and ramps)
- a luma-only `unsharp` with a zero chroma amount, which cannot touch colour
- halation — a blurred, thresholded copy blended back at 0.22, identical in R,
  G and B, so it is bloom and not a colour shift
- a vignette multiplied in RGB rather than YUV, again neutral
- one shared grain pass

Measured on the finished master, chromaticity against the source frame:
**soft box 0.24 %, bullet falls 1.36 %** — i.e. no shift.

Do not reintroduce a grade to make the seven-ish sources match. The shared
grain pass is what makes unrelated footage read as one piece, and it is not a
colour operation.

## Two traps worth knowing about

**A comma ends a filter.** `setpts` is one filter in a filtergraph, and a comma
separates filters, so `pow(x,2)` inside a `setpts` expression truncates the
filter halfway through and ffmpeg reports *No such filter: '(0.526316…'*. The
ramp therefore writes `x*x` instead of `pow(x,2)`. Also remember the
`setpts=` prefix — without it the whole expression is parsed as a filter name.

**CRF 22 is the floor.** At CRF 23 x264 throws away about half the film grain
and at 24 about 70 %, so the deliverable loses the texture that keeps the AI
footage from reading as plastic. Measured on the flat tiles: 4.4 at CRF 22,
2.4 at 23, 1.3 at 24. File size does not matter here.

## Delivery

VP9 first, H.264 second. At equal quality VP9 holds the grain that x264
discards, in about 40 % of the bytes: 4.0 MB against 10.3 MB. **Both are
encoded from the pass-1 intermediates** — encoding the webm from the finished
mp4 inherits x264's losses and doubles the damage.

`XrayHero.tsx` ships the poster as the idle state and holds the video's last
frame when it ends, so the hero settles into a second still rather than
snapping back.

## Sources

Drive name → `assets/xray/source/` (gitignored, `.gitignore:21`):

| Drive | staged as |
|-------|-----------|
| `minimax-h3-max_a_Photorealistic_live-.mp4` | `minimax.mp4` |
| `top view shot.png` | `topdown.png` |
| `a_Sneaker_detail_shot,.webp` | `sneaker.webp` |
| `Standing Up.mp4` | `standingup.mp4` |
| `extreme close up left.png` | `closeup-white.png` |
| `Cocking.mp4` | `cocking.mp4` |
| `Back shot.mp4` | `backshot.mp4` |
| `Soft box shooting.mp4` | `5.mp4` |
| `Bullet falls.mp4` | `bulletfalls.mp4` |
| `Extreme close shoes x-ray.png` | `groundlevel-xray.png` |
| `6.mp4` | `6.mp4` |
| `extreme close up x-ray.png` | `endframe-macro-xray.png` |

Retired: `Extreme close up gun cutaway.png` (`hand-goldband.png`), replaced by
`Cocking.mp4` + `Back shot.mp4`.
