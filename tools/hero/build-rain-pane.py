#!/usr/bin/env python3
"""
Build the hero's erasable rain pane from the ORIGINAL photograph.

    public/images/hero-rain-pane-2560.webp   (2559 x 1803)
    public/images/hero-rain-pane-1920.webp   (1920 x 1353)
    public/images/hero-rain-pane-1280.webp   (1280 x  902)

The pane is the real portrait seen through a rained-on window. It is built
on the original plate's geometry, so when the canvas is wiped the sharp
photograph underneath lines up with the glass it replaces, pixel for pixel.

The water is RENDERED, optically, rather than stamped on as a relief:

  * Fogged glass — the plate, softened and darkened by the graphite sheet the
    hero has always worn (the exact gradient stops of the old canvas pane),
    carrying a fine breath of condensation: tens of thousands of micro-beads,
    each a speck of light over a hairline of shadow.
  * Drops — every bead is a small plano-convex lens. Through it you see the
    scene behind INVERTED and minified, in sharper focus than the fog around
    it (a bead clears the condensation it sits on). Each drop gets the shading
    a real one has: a dark refractive rim where light leaves at grazing angles,
    a specular glint and a thin reflected arc on the lit (top-left) side, and
    the bright caustic the lens throws onto its shadow side. Large drops sag
    under gravity — bottom-heavy, with irregular wetted outlines.
  * Runnels — drops that have slid leave a cleared, wet track: the fog is
    wiped from the glass, the track's edges catch a meniscus highlight and
    shadow, a broken chain of beads is left behind, and the heavy drop that
    made it sits at the bottom.
  * Every drop clears a small halo of mist around itself, as real beads do by
    gathering the condensation they touch.

The scene is rendered once at the 2560 tier and area-downsampled to the
smaller tiers, so droplet edges stay crisp at every size. Deterministic (fixed
seed): rebuilding gives the same window.

    pip install numpy opencv-python-headless
    python3 tools/hero/build-rain-pane.py
"""
from __future__ import annotations

import math
import os
import sys

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'public', 'images')
ORIGINAL = os.path.join(OUT, 'hero-landscape-2560.webp')

W, H = 2559, 1803                       # the original plate's top tier
TIERS = ((2559, 1803, 2560), (1920, 1353, 1920), (1280, 902, 1280))
BUDGET = 460 * 1024                     # per pane tier (the canvas is wiped, not zoomed)
S = W / 1920.0                          # parameters below are authored at 1920
SEED = 20261016

# ── The glass (verbatim from the original canvas pane) ────────────────
BLUR_SIGMA = 8.0
SHEET_RGB = ((78.0, 82.0, 88.0), (48.0, 52.0, 58.0), (22.0, 25.0, 29.0))
SHEET_ALPHA = (0.46, 0.54, 0.62)
GRADE_RGB = ((8.0, 11.0, 14.0), (7.0, 10.0, 13.0), (4.0, 6.0, 8.0))
GRADE_ALPHA = (0.07, 0.17, 0.26)
GRADE_MID = 0.55

# ── Water ──────────────────────────────────────────────────────────────
LIGHT = np.array([-0.62, -0.78])        # light arrives from the top left
N_LARGE, N_MEDIUM, N_SMALL = 130, 820, 4600
N_MIST = 260000
N_RUNNELS = 8


def diagonal(w: int, h: int) -> np.ndarray:
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    t = (xx * w + yy * h) / float(w * w + h * h)
    return np.clip(t, 0, 1)[..., None]


def ramp(t: np.ndarray, stops: tuple, mid: float) -> np.ndarray:
    a, b, c = (np.array(v, np.float32) for v in stops)
    lo = a + (b - a) * np.clip(t / mid, 0, 1)
    hi = b + (c - b) * np.clip((t - mid) / (1 - mid), 0, 1)
    return np.where(t < mid, lo, hi)


def glass_over(photo: np.ndarray, sheet_strength: float = 1.0) -> np.ndarray:
    """The graphite sheet + grade over an (already softened) photograph."""
    h, w = photo.shape[:2]
    t = diagonal(w, h)
    sheet_rgb = ramp(t, SHEET_RGB, 0.45)[..., ::-1]
    sheet_a = ramp(t, SHEET_ALPHA, 0.45) * sheet_strength
    g = photo * (1 - sheet_a) + sheet_rgb * sheet_a
    grade_rgb = ramp(t, GRADE_RGB, GRADE_MID)[..., ::-1]
    grade_a = ramp(t, GRADE_ALPHA, GRADE_MID)
    return g * (1 - grade_a) + grade_rgb * grade_a


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


class Window:
    def __init__(self, photo: np.ndarray):
        self.rng = np.random.default_rng(SEED)
        self.photo = photo
        # What the fogged glass shows, and what a lens of water shows: the
        # scene in near focus under a thinner film of tint.
        self.fog = glass_over(cv2.GaussianBlur(photo, (0, 0), BLUR_SIGMA * S))
        self.lens = glass_over(cv2.GaussianBlur(photo, (0, 0), 1.1 * S), 0.62)
        self.wet = glass_over(cv2.GaussianBlur(photo, (0, 0), 2.6 * S), 0.8)
        self.out = self.fog.copy()
        self.mist_block = np.zeros((H, W), np.float32)   # where mist may not sit
        self.occupied = np.zeros((H // 8 + 1, W // 8 + 1), np.float32)

    # ── runnels ────────────────────────────────────────────────────────
    def runnels(self):
        rng = self.rng
        track = np.zeros((H, W), np.float32)
        heads = []
        xs = np.sort(rng.uniform(0.04, 0.96, N_RUNNELS)) * W
        for x0 in xs:
            y0 = rng.uniform(-0.15, 0.55) * H
            y1 = min(H * 1.02, y0 + rng.uniform(0.18, 0.7) * H)
            n = int((y1 - y0) / (3 * S)) + 2
            ys = np.linspace(y0, y1, n)
            # A slid drop wanders: a smoothed random walk, with the odd kink
            # where it met another bead.
            dx = rng.normal(0, 0.9 * S, n)
            walk = np.cumsum(dx)
            walk = cv2.GaussianBlur(walk.reshape(-1, 1).astype(np.float32), (1, 0), 6).ravel()
            kinks = np.cumsum(np.where(rng.random(n) < 0.01, rng.normal(0, 7 * S, n), 0))
            px = x0 + walk + cv2.GaussianBlur(kinks.reshape(-1, 1).astype(np.float32), (1, 0), 2).ravel()
            width = rng.uniform(3.0, 6.5) * S
            wv = width * (0.75 + 0.5 * cv2.GaussianBlur(rng.random((n, 1)).astype(np.float32), (1, 0), 8).ravel())
            pts = np.stack([px, ys], 1)
            for i in range(n - 1):
                (ax, ay), (bx, by) = pts[i], pts[i + 1]
                cv2.line(track, (int(ax * 16), int(ay * 16)), (int(bx * 16), int(by * 16)), 1.0,
                         max(1, int(round(wv[i]))), cv2.LINE_AA, shift=4)
            heads.append((px[-1], ys[-1], width))
            # Beads left behind in the track.
            y = y0 + rng.uniform(10, 60) * S
            while y < y1 - 20 * S:
                i = min(n - 1, int((y - y0) / (ys[1] - ys[0])))
                if rng.random() < 0.55:
                    self.drop(px[i] + rng.normal(0, 0.6 * S), y, rng.uniform(1.2, 3.0) * S, elong=1.15)
                y += rng.uniform(8, 46) * S
        track = cv2.GaussianBlur(track, (0, 0), 0.9 * S)
        self.mist_block = np.maximum(self.mist_block, cv2.GaussianBlur(track, (0, 0), 2.5 * S) * 1.6)
        # Wiped condensation: the track shows the scene through clean wet glass.
        a = np.clip(track * 0.92, 0, 1)[..., None]
        self.out = self.out * (1 - a) + self.wet * a
        # The meniscus along each edge: lit on the light side, shadowed on the other.
        gx = cv2.Sobel(track, cv2.CV_32F, 1, 0, ksize=3)
        gy = cv2.Sobel(track, cv2.CV_32F, 0, 1, ksize=3)
        lit = np.clip((gx * LIGHT[0] + gy * LIGHT[1]), -4, 4)
        self.out += (np.clip(lit, 0, None) * 14.0 - np.clip(-lit, 0, None) * 22.0)[..., None]
        for hx, hy, wdt in heads:
            if hy < H - 4:
                self.drop(hx, hy, rng.uniform(2.6, 3.6) * wdt, elong=1.35)

    # ── a single drop ──────────────────────────────────────────────────
    def drop(self, cx: float, cy: float, r: float, elong: float = 1.0, gravity: float = 0.12):
        rng = self.rng
        pad = int(r * 1.6 + 4)
        x0, x1 = int(max(0, cx - pad)), int(min(W, cx + pad + 1))
        y0, y1 = int(max(0, cy - pad)), int(min(H, cy + pad * elong + 1))
        if x1 <= x0 + 1 or y1 <= y0 + 1:
            return
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
        dx, dy = xx - cx, yy - cy
        th = np.arctan2(dy, dx)
        # Irregular wetted outline (larger drops wobble more), sagging under
        # gravity: the lower half is fuller than the top.
        wob = 1.0
        if r > 3 * S:
            k = min(1.0, r / (18 * S))
            for m, amp in ((2, 0.035), (3, 0.022), (4, 0.01)):
                wob = wob + rng.normal(0, amp * k) * np.cos(m * th + rng.uniform(0, 6.283))
        sag = 1 + gravity * np.tanh(2.2 * dy / max(r, 1e-3))      # fuller below, smoothly
        rr = r * wob * sag
        dn = np.sqrt(dx ** 2 + (dy / elong) ** 2) / np.maximum(rr, 1e-3)
        edge = np.clip((1.0 - dn) * rr / 0.9 + 0.5, 0, 1)        # 1-px antialiased coverage
        if edge.max() <= 0:
            return
        inside = np.clip(dn, 0, 0.999)
        z = np.sqrt(1 - inside ** 2)                               # spherical cap profile
        ux = dx / np.maximum(rr, 1e-3)
        uy = dy / (np.maximum(rr, 1e-3) * elong)
        # The lens: the scene behind, inverted and minified (a bead sees
        # ~2.6× its own radius), compressed toward its rim like a fisheye.
        view = 2.6 * r
        f = 1 + 0.5 * inside ** 2
        mx = (cx - ux * f * view).astype(np.float32)
        my = (cy - uy * f * view).astype(np.float32)
        img = cv2.remap(self.lens, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        lum = img.mean(axis=2, keepdims=True)
        # Backlit water: the scene light is behind the glass, so a bead is
        # outlined dark where rays leave at grazing angles (heavier along its
        # top, where it faces away from the light it focuses)…
        top = np.clip(-uy, 0, 1)
        rim = smoothstep(0.5, 0.97, inside) * (0.78 + 0.18 * top)
        img = img * (1 - rim[..., None] * 0.86) + 3 * rim[..., None]
        # …and it focuses that light into a bright crescent inside its lower edge.
        low = np.clip(uy * 1.15 + 0.15, 0, 1) ** 1.6
        caus = np.exp(-((inside - 0.66) / 0.17) ** 2) * low
        img += caus[..., None] * (34 + 0.55 * lum)
        # A pin-sharp glint of the room light, and a faint reflected window
        # arc along the top-left of the bead.
        hx, hy = ux + 0.34, uy + 0.42
        sz = 0.075 + 0.5 / max(r, 1.0)
        glint = np.exp(-(hx * hx + hy * hy * 1.4) / (2 * sz ** 2))
        side = np.clip(-(ux * LIGHT[0] + uy * LIGHT[1]), -1, 1)
        arc = np.exp(-((inside - 0.8) / 0.05) ** 2) * np.clip(-side, 0, 1) ** 4
        spec = 210 * glint * min(1.0, r / (2.5 * S)) + 38 * arc * min(1.0, r / (5 * S))
        img += spec[..., None]
        img *= (1.0 + 0.04 * z[..., None])
        a = edge[..., None]
        reg = self.out[y0:y1, x0:x1]
        # A faint contact shadow hugs the outside of the bead's lower edge.
        outer = np.clip((dn - 1.0) * rr / (1.2 * S + 0.1 * r), 0, 1)
        halo = (1 - outer) * (dn > 1) * np.clip(uy + 0.2, 0, 1) * 0.22
        reg *= (1 - halo[..., None])
        self.out[y0:y1, x0:x1] = reg * (1 - a) + img * a
        # The bead gathers the condensation around it.
        self.mist_block[y0:y1, x0:x1] = np.maximum(
            self.mist_block[y0:y1, x0:x1], np.clip(1.35 - dn * 0.8, 0, 1) ** 0.7)

    def free(self, cx, cy, r) -> bool:
        gx0, gx1 = int(max(0, (cx - r * 1.3) // 8)), int(min(self.occupied.shape[1], (cx + r * 1.3) // 8 + 1))
        gy0, gy1 = int(max(0, (cy - r * 1.3) // 8)), int(min(self.occupied.shape[0], (cy + r * 1.5) // 8 + 1))
        return self.occupied[gy0:gy1, gx0:gx1].sum() == 0

    def drops(self):
        rng = self.rng
        # Big beads sit lower on the glass (they have been gathering as they
        # creep); small ones are everywhere.
        for n, (rlo, rhi), bias in ((N_LARGE, (9.0, 21.0), 0.25), (N_MEDIUM, (4.2, 9.0), 0.1), (N_SMALL, (1.4, 4.2), 0.0)):
            placed, tries = 0, 0
            while placed < n and tries < n * 30:
                tries += 1
                r = math.exp(rng.uniform(math.log(rlo), math.log(rhi))) * S
                cx = rng.uniform(-0.01, 1.01) * W
                cy = (rng.uniform(0, 1) ** (1 - bias)) * H
                if r > 3 * S and not self.free(cx, cy, r):
                    continue
                self.drop(cx, cy, r, elong=rng.uniform(1.0, 1.18 if r > 6 * S else 1.06),
                          gravity=0.1 + 0.08 * min(1, r / (20 * S)))
                if r > 3 * S:
                    gx0, gx1 = int(max(0, (cx - r) // 8)), int(min(self.occupied.shape[1], (cx + r) // 8 + 1))
                    gy0, gy1 = int(max(0, (cy - r) // 8)), int(min(self.occupied.shape[0], (cy + r * 1.2) // 8 + 1))
                    self.occupied[gy0:gy1, gx0:gx1] = 1
                placed += 1

    # ── condensation ───────────────────────────────────────────────────
    def mist(self):
        """Micro-beads: a speck of light over a hairline of shadow, each."""
        rng = self.rng
        delta = np.zeros((H, W), np.float32)
        stamps = []
        for r in np.linspace(0.45, 1.9, 7) * S:
            p = int(math.ceil(r * 2 + 2))
            yy, xx = np.mgrid[-p:p + 1, -p:p + 1].astype(np.float32)
            d = np.sqrt(xx ** 2 + yy ** 2) / r
            # Backlit micro-bead: a dark ring with a speck of light below centre.
            ring = np.exp(-((d - 0.85) / 0.35) ** 2)
            core = np.exp(-((xx / r) ** 2 + ((yy / r) - 0.25) ** 2) / 0.18)
            stamps.append((p, core * 15 - ring * 11))
        idx = rng.integers(0, len(stamps), N_MIST)
        # Smaller beads are far more numerous.
        idx = np.minimum(idx, rng.integers(0, len(stamps), N_MIST))
        idx = np.minimum(idx, rng.integers(0, len(stamps), N_MIST))
        xs = rng.uniform(0, W, N_MIST).astype(int)
        ys = rng.uniform(0, H, N_MIST).astype(int)
        for k, (p, st) in enumerate(stamps):
            sel = idx == k
            for x, y in zip(xs[sel], ys[sel]):
                if x - p < 0 or y - p < 0 or x + p + 1 > W or y + p + 1 > H:
                    continue
                delta[y - p:y + p + 1, x - p:x + p + 1] += st
        # A breath of the condensation's own scatter: a faint, uneven veil.
        veil = cv2.GaussianBlur(rng.random((H // 16 + 1, W // 16 + 1)).astype(np.float32), (0, 0), 1.5)
        veil = cv2.resize(veil, (W, H), interpolation=cv2.INTER_CUBIC)
        veil = (veil - veil.mean()) / (veil.std() + 1e-6)
        keep = np.clip(1 - self.mist_block, 0, 1)
        # Condensation gathers in patches and thickens toward the lower part
        # of the pane, where the glass is coldest.
        yy = np.linspace(0, 1, H, dtype=np.float32)[:, None]
        patch = np.clip(0.5 + 0.42 * veil, 0, 1) * (0.7 + 0.3 * yy)
        self.out += (delta * patch * keep)[..., None]
        self.out += ((patch - 0.5) * 5.0 * keep)[..., None]

    def render(self) -> np.ndarray:
        self.runnels()
        self.drops()
        self.mist()
        # Very fine glass grain so flat fog never bands in 8-bit.
        g = self.rng.normal(0, 1.1, (H, W)).astype(np.float32)
        self.out += cv2.GaussianBlur(g, (0, 0), 0.5)[..., None]
        return np.clip(self.out, 0, 255)


def encode(path: str, img: np.ndarray, budget: int) -> int:
    im = np.clip(img, 0, 255).round().astype(np.uint8)
    for q in range(90, 50, -2):
        ok, buf = cv2.imencode('.webp', im, [cv2.IMWRITE_WEBP_QUALITY, q])
        if ok and len(buf) <= budget:
            buf.tofile(path)
            return q
    sys.exit(f'{path}: cannot fit under {budget} bytes')


def main() -> None:
    photo = cv2.imread(ORIGINAL, cv2.IMREAD_COLOR)
    if photo is None or photo.shape[:2] != (H, W):
        sys.exit(f'expected the {W}x{H} original plate at {ORIGINAL}')
    pane = Window(photo.astype(np.float32)).render()
    if os.environ.get('HERO_PREVIEW'):
        cv2.imwrite(os.environ['HERO_PREVIEW'], pane.astype(np.uint8))
        return
    for w, h, name in TIERS:
        tier = pane if w == W else cv2.resize(pane, (w, h), interpolation=cv2.INTER_AREA)
        path = os.path.join(OUT, f'hero-rain-pane-{name}.webp')
        q = encode(path, tier, BUDGET)
        print(f'{os.path.relpath(path, ROOT)}  {w}x{h}  q={q}  {os.path.getsize(path) / 1024:.1f} KB')


if __name__ == '__main__':
    main()
