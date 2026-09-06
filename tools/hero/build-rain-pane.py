#!/usr/bin/env python3
"""
Build the hero's erasable rain pane from the ORIGINAL photograph.

    public/images/hero-rain-pane-1920.webp   (1920 x 1353)
    public/images/hero-rain-pane-1280.webp   (1280 x  902)

The pane is the real portrait seen through a rained-on window: the original
plate (`hero-landscape-2560.webp`), softened and darkened to graphite glass,
with the droplets and runnels of a real rain-window photograph laid over it.
Nothing else is painted. The pane shares the original plate's geometry, so
when the canvas is wiped the sharp photograph underneath lines up with the
droplet blur it replaces, pixel for pixel.

Source (tools/hero/source/rain-window-1904.webp): the rain photograph the
water is lifted from. ONLY its water reaches the pane. Droplets and runnels
are picked out by fine-scale energy — a bead is a sharp highlight next to a
sharp dark rim, whereas everything else in that photograph (its own subject,
its background) is smooth — so no second person and no glass borders come
through with the rain. The water is kept as a luminance relief, which is what
a bead on glass is: a lens over whatever is behind it.

    pip install numpy opencv-python-headless
    python3 tools/hero/build-rain-pane.py
    HERO_DEBUG=1 ...  also writes tools/hero/source/debug-water.png
"""
from __future__ import annotations

import os
import sys

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'tools', 'hero', 'source')
OUT = os.path.join(ROOT, 'public', 'images')

ORIGINAL = os.path.join(OUT, 'hero-landscape-2560.webp')
RAIN = os.path.join(SRC, 'rain-window-1904.webp')

# The pane is generated at the 1920 tier — the droplets land at ~1:1 — and
# downsampled for 1280. Wider screens upscale the 1920 pane in the browser;
# the sharp photograph underneath still ships its native 2560 tier.
TIERS = ((1920, 1353), (1280, 902))
BUDGET = 200 * 1024  # every hero WebP stays under 200 KB

# ── The glass ──────────────────────────────────────────────────────────
# Wet-glass softening of the photograph, in pixels at the 1920 tier.
BLUR_SIGMA = 8.0
# The graphite pane the hero has always worn, lifted verbatim from the old
# canvas gradient: a translucent sheet, NOT a blue tint — the photograph reads
# through in its own colour, only softened and darkened — lit so the top-left
# is the bright side of the glass and the lower right falls into shadow, plus
# the grade that kept the cream type legible. Both run top-left → bottom-right.
SHEET_RGB = ((78.0, 82.0, 88.0), (48.0, 52.0, 58.0), (22.0, 25.0, 29.0))
SHEET_ALPHA = (0.46, 0.54, 0.62)
GRADE_RGB = ((8.0, 11.0, 14.0), (7.0, 10.0, 13.0), (4.0, 6.0, 8.0))
GRADE_ALPHA = (0.07, 0.17, 0.26)
GRADE_MID = 0.55             # where the middle grade stop sits on the diagonal
WATER_GAIN = 1.0             # relief strength relative to the rain photograph

# ── Separating the water ───────────────────────────────────────────────
MEDIAN = 45          # background estimate: a median wider than any bead
HP_SIGMA = 1.5       # "fine scale" for the energy measure
E_HI, E_LO = 900.0, 350.0   # hysteresis on fine-scale energy
MIN_BEAD = 10        # px², components smaller than this are noise
MAX_HOLE = 1400      # px², bead interiors to fill; larger holes are background


def imread(path: str) -> np.ndarray:
    im = cv2.imread(path, cv2.IMREAD_COLOR)
    if im is None:
        sys.exit(f'missing source: {path}')
    return im.astype(np.float32)


def water_relief(rain: np.ndarray) -> np.ndarray:
    """The rain photograph's water as a signed luminance relief (H×W).

    1. Residual = photograph − wide median: the beads and runnels, plus a
       faint, smooth ghost of whatever the median could not follow.
    2. Fine-scale energy of the residual, with hysteresis: water is sharp,
       the ghost is smooth, so the ghost never seeds and is discarded.
    3. Close small gaps, fill bead interiors, soften the edge.
    """
    r8 = np.clip(rain, 0, 255).astype(np.uint8)
    resid = rain - cv2.medianBlur(r8, MEDIAN).astype(np.float32)

    hp = resid - cv2.GaussianBlur(resid, (0, 0), HP_SIGMA)
    energy = cv2.GaussianBlur((hp ** 2).sum(axis=2), (0, 0), 2.5)

    low = (energy > E_LO).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(low, connectivity=8)
    seeded = np.zeros(n, bool)
    seeded[np.unique(labels[energy > E_HI])] = True
    seeded[0] = False
    seeded &= stats[:, cv2.CC_STAT_AREA] >= MIN_BEAD
    mask = seeded[labels].astype(np.uint8)

    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))

    holes = (1 - mask).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(holes, connectivity=4)
    fill = stats[:, cv2.CC_STAT_AREA] < MAX_HOLE
    fill[0] = False
    fill[np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))] = False
    mask = mask | fill[labels].astype(np.uint8)

    soft = np.clip(cv2.GaussianBlur(mask.astype(np.float32), (0, 0), 1.2) * 1.15, 0, 1)
    lum = 0.114 * resid[..., 0] + 0.587 * resid[..., 1] + 0.299 * resid[..., 2]
    return lum * soft


def cover_resize(img: np.ndarray, w: int, h: int) -> np.ndarray:
    """object-fit: cover — scale to fill w×h, centre-crop the excess."""
    sh, sw = img.shape[:2]
    s = max(w / sw, h / sh)
    rw, rh = int(round(sw * s)), int(round(sh * s))
    interp = cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC
    r = cv2.resize(img, (rw, rh), interpolation=interp)
    x0 = (rw - w) // 2
    y0 = (rh - h) // 2
    return r[y0:y0 + h, x0:x0 + w]


def diagonal(w: int, h: int) -> np.ndarray:
    """0 at the top-left corner → 1 at the bottom-right, shaped H×W×1.

    The same parameter a canvas linear gradient from (0,0) to (w,h) uses.
    """
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    t = (xx * w + yy * h) / float(w * w + h * h)
    return np.clip(t, 0, 1)[..., None]


def ramp(t: np.ndarray, stops: tuple, mid: float) -> np.ndarray:
    """Three-stop gradient (0, mid, 1) of scalars or RGB triples along t."""
    a, b, c = (np.array(v, np.float32) for v in stops)
    lo = a + (b - a) * np.clip(t / mid, 0, 1)
    hi = b + (c - b) * np.clip((t - mid) / (1 - mid), 0, 1)
    return np.where(t < mid, lo, hi)


def build_pane(original: np.ndarray, water: np.ndarray, w: int, h: int) -> np.ndarray:
    photo = cover_resize(original, w, h)
    scale = w / 1920.0
    soft = cv2.GaussianBlur(photo, (0, 0), BLUR_SIGMA * scale)

    # Graphite glass over the softened photograph: the sheet, then the grade.
    t = diagonal(w, h)
    sheet_rgb = ramp(t, SHEET_RGB, 0.45)[..., ::-1]          # BGR
    sheet_a = ramp(t, SHEET_ALPHA, 0.45)
    glass = soft * (1 - sheet_a) + sheet_rgb * sheet_a
    grade_rgb = ramp(t, GRADE_RGB, GRADE_MID)[..., ::-1]
    grade_a = ramp(t, GRADE_ALPHA, GRADE_MID)
    glass = glass * (1 - grade_a) + grade_rgb * grade_a

    # The water, cover-fitted to the same frame so the beads keep their
    # aspect and no edge of the layer is ever inside the pane.
    relief = cover_resize(water[..., None], w, h)
    if relief.ndim == 2:
        relief = relief[..., None]
    return np.clip(glass + relief * WATER_GAIN, 0, 255)


def encode(path: str, img: np.ndarray) -> int:
    im = img.astype(np.uint8)
    for q in range(84, 40, -2):
        ok, buf = cv2.imencode('.webp', im, [cv2.IMWRITE_WEBP_QUALITY, q])
        if ok and len(buf) <= BUDGET:
            buf.tofile(path)
            return q
    sys.exit(f'{path}: cannot fit under {BUDGET} bytes')


def main() -> None:
    original = imread(ORIGINAL)
    water = water_relief(imread(RAIN))
    if os.environ.get('HERO_DEBUG'):
        cv2.imwrite(os.path.join(SRC, 'debug-water.png'),
                    np.clip(128 + water * 1.2, 0, 255).astype(np.uint8))

    for w, h in TIERS:
        pane = build_pane(original, water, w, h)
        path = os.path.join(OUT, f'hero-rain-pane-{w}.webp')
        q = encode(path, pane)
        print(f'{os.path.relpath(path, ROOT)}  {w}x{h}  q={q}  {os.path.getsize(path) / 1024:.1f} KB')


if __name__ == '__main__':
    main()
