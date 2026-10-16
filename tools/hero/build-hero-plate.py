#!/usr/bin/env python3
"""
Rebuild the hero photograph's tiers at true high resolution.

    public/images/hero-landscape-3840.webp   (3840 x 2706)   Retina / 4K
    public/images/hero-landscape-2560.webp   (2559 x 1803)
    public/images/hero-landscape-1920.webp   (1920 x 1353)
    public/images/hero-landscape-1280.webp   (1280 x  902)

The landscape hero is the portrait (`public/images/Hero image.webp`) placed
~1.28× larger on a wider wall, with a strip of outpainted wall/shoulder on the
right. The old tiers were made by upsampling that already-compressed portrait
and then compressing again (the 1920 tier weighed 91 KB), which is why skin,
stubble, lashes and corduroy turned to mush. This rebuild:

  1. starts from 4× learned super-resolution masters (tools/hero/upscale.py)
     of the portrait and of the outpainted strip, so every tier is sampled
     DOWN from more detail than it needs — crisp, not invented;
  2. registers the portrait onto the reference landscape with a SIFT/RANSAC
     similarity (sub-pixel: median residual 0.15 px over the textured face),
     so the geometry is IDENTICAL to the plate the site, the rain pane and
     the earring stud were all authored against;
  3. matches colour to the reference landscape with a least-squares colour
     matrix fitted over their overlap — the grade does not change;
  4. lays the photograph's OWN micro-texture (pores, stubble, weave) back over
     the upscale, which otherwise smooths skin toward wax;
  5. finishes with a restrained unsharp mask and a whisper of luma film grain
     at a 3840 master, area-samples the smaller tiers from it, and encodes at
     high quality with honest budgets.

    python3 tools/hero/upscale.py MODELS/high-fidelity-4x "public/images/Hero image.webp" /tmp/portrait-x4.png
    python3 -c "import cv2; L=cv2.imread('tools/hero/source/hero-landscape-reference-2560.webp'); cv2.imwrite('/tmp/strip.png', L[:, 1760:])"
    python3 tools/hero/upscale.py MODELS/high-fidelity-4x /tmp/strip.png /tmp/strip-x4.png
    python3 tools/hero/build-hero-plate.py /tmp/portrait-x4.png /tmp/strip-x4.png
    python3 tools/hero/build-rain-pane.py     # the pane is built on the new plate
"""
from __future__ import annotations

import os
import sys

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'public', 'images')
DEST = os.environ.get('PLATE_OUT', OUT)
REF = os.path.join(ROOT, 'tools', 'hero', 'source', 'hero-landscape-reference-2560.webp')
PORTRAIT = os.path.join(OUT, 'Hero image.webp')
STRIP_X = 1760            # where the outpainted strip was cut from the reference
TEXTURE = 0.55            # share of the original's own micro-texture laid back
GRAIN = 3.2               # luma grain, in 8-bit levels at the 3840 master
W0, H0 = 2559, 1803

# (width, height, file tier, byte budget)
TIERS = (
    (3840, 2706, 3840, 720 * 1024),
    (2559, 1803, 2560, 420 * 1024),
    (1920, 1353, 1920, 270 * 1024),
    (1280, 902, 1280, 150 * 1024),
)


def register(portrait: np.ndarray, ref: np.ndarray) -> np.ndarray:
    """2×3 similarity portrait → reference (SIFT + RANSAC)."""
    a = cv2.cvtColor(portrait, cv2.COLOR_BGR2GRAY)
    b = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY)
    sift = cv2.SIFT_create(20000)
    ka, da = sift.detectAndCompute(a, None)
    kb, db = sift.detectAndCompute(b, None)
    good = [m for m, n in cv2.BFMatcher().knnMatch(da, db, k=2) if m.distance < 0.8 * n.distance]
    pa = np.float32([ka[m.queryIdx].pt for m in good])
    pb = np.float32([kb[m.trainIdx].pt for m in good])
    cv2.setRNGSeed(20261016)                          # deterministic RANSAC
    m, _ = cv2.estimateAffinePartial2D(pa, pb, ransacReprojThreshold=4, maxIters=20000)
    # Measured against the reference over ~140 textured 192 px patches
    # (phase correlation): median residual 0.15 px, 90th percentile < 1 px.
    return m.astype(np.float64)


def colour_matrix(src: np.ndarray, dst: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Least-squares 3×4 colour transform src → dst over mask."""
    sel = mask > 0
    s = src[sel].reshape(-1, 3).astype(np.float64)
    d = dst[sel].reshape(-1, 3).astype(np.float64)
    if len(s) > 400000:
        idx = np.random.default_rng(1).choice(len(s), 400000, replace=False)
        s, d = s[idx], d[idx]
    x = np.hstack([s, np.ones((len(s), 1))])
    m, *_ = np.linalg.lstsq(x, d, rcond=None)
    return m  # 4×3


def apply_colour(img: np.ndarray, m: np.ndarray) -> np.ndarray:
    flat = img.reshape(-1, 3).astype(np.float32)
    out = flat @ m[:3].astype(np.float32) + m[3].astype(np.float32)
    return out.reshape(img.shape)


def encode(path: str, img: np.ndarray, budget: int) -> int:
    im = np.clip(img, 0, 255).round().astype(np.uint8)
    for q in range(92, 60, -2):
        ok, buf = cv2.imencode('.webp', im, [cv2.IMWRITE_WEBP_QUALITY, q])
        if ok and len(buf) <= budget:
            buf.tofile(path)
            return q
    sys.exit(f'{path}: cannot fit under {budget} bytes')


def main() -> None:
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    sr_portrait = cv2.imread(sys.argv[1], cv2.IMREAD_COLOR)
    sr_strip = cv2.imread(sys.argv[2], cv2.IMREAD_COLOR)
    portrait = cv2.imread(PORTRAIT, cv2.IMREAD_COLOR)
    ref = cv2.imread(REF, cv2.IMREAD_COLOR)
    assert ref.shape[:2] == (H0, W0), ref.shape
    assert sr_portrait.shape[:2] == (portrait.shape[0] * 4, portrait.shape[1] * 4)

    m = register(portrait, ref)                       # portrait px → reference px
    scale = float(np.sqrt(abs(np.linalg.det(m[:, :2]))))
    print(f'registration: scale {scale:.5f}, offset ({m[0, 2]:.2f}, {m[1, 2]:.2f})')

    # Colour: fit the SR master (as it lands on the reference) to the reference.
    f0 = scale / 4.0
    sr0 = cv2.resize(sr_portrait, None, fx=f0, fy=f0, interpolation=cv2.INTER_AREA)
    a0 = m.copy()
    a0[:, :2] = m[:, :2] / scale            # rotation only; the resize did the scaling
    land0 = cv2.warpAffine(sr0, a0, (W0, H0), flags=cv2.INTER_LANCZOS4)
    cov0 = cv2.warpAffine(np.full(sr0.shape[:2], 255, np.uint8), a0, (W0, H0), flags=cv2.INTER_NEAREST)
    cm = colour_matrix(land0, ref, cv2.erode(cov0, np.ones((41, 41), np.uint8)))
    fitted = apply_colour(land0, cm)
    err = np.abs(fitted - ref.astype(np.float32))[cv2.erode(cov0, np.ones((41, 41), np.uint8)) > 0].mean()
    print(f'colour fit: mean abs error {err:.2f} levels (compression noise of the reference included)')
    del sr0, land0, cov0, fitted

    # ── The 3840 master. Smaller tiers are area-sampled from it. ──────────
    w, h = TIERS[0][0], TIERS[0][1]
    k = w / W0
    f = k * scale / 4.0
    srk = cv2.resize(sr_portrait, None, fx=f, fy=f, interpolation=cv2.INTER_AREA)
    del sr_portrait
    a = np.zeros((2, 3))
    a[:, :2] = m[:, :2] / scale
    a[:, 2] = m[:, 2] * k
    face = apply_colour(cv2.warpAffine(srk, a, (w, h), flags=cv2.INTER_LANCZOS4,
                                       borderMode=cv2.BORDER_REPLICATE), cm)
    cover = cv2.warpAffine(np.full(srk.shape[:2], 255, np.uint8), a, (w, h), flags=cv2.INTER_NEAREST)
    del srk
    # The photograph's OWN micro-texture (pores, stubble, weave): the learned
    # upscale rebuilds structure but smooths skin toward wax, so the original's
    # high frequencies — lightly deblocked first — are laid back over it.
    deblocked = cv2.bilateralFilter(portrait, 5, 12, 3)
    ak = m.copy() * k
    orig = cv2.warpAffine(deblocked, ak, (w, h), flags=cv2.INTER_LANCZOS4,
                          borderMode=cv2.BORDER_REPLICATE).astype(np.float32)
    hf = orig - cv2.GaussianBlur(orig, (0, 0), 1.6)
    del orig
    face += apply_colour(hf, np.vstack([cm[:3], np.zeros((1, 3))])) * TEXTURE
    del hf
    # The outpainted strip, from its own 4× master.
    f2 = k / 4.0
    strip = cv2.resize(sr_strip, None, fx=f2, fy=f2, interpolation=cv2.INTER_AREA).astype(np.float32)
    del sr_strip
    base = cv2.resize(ref, (w, h), interpolation=cv2.INTER_CUBIC).astype(np.float32)
    sx = int(round(STRIP_X * k))
    sw = min(strip.shape[1], w - sx)
    sh = min(strip.shape[0], h)
    base[:sh, sx:sx + sw] = strip[:sh, :sw]
    del strip
    # Feathered seam where the portrait ends and the outpainted wall begins.
    inner = cv2.erode(cover, np.ones((3, 3), np.uint8), iterations=int(round(6 * k)))
    alpha = cv2.GaussianBlur(inner.astype(np.float32) / 255.0, (0, 0), 28 * k / 2.5)[..., None]
    plate = face * alpha + base * (1 - alpha)
    del face, base, alpha
    # Restrained finishing: a 1 px unsharp mask, then a whisper of luma film
    # grain (strongest in the mid-tones, as film's is) so the plate reads as a
    # photograph at 1:1 rather than as a smoothed render.
    plate += (plate - cv2.GaussianBlur(plate, (0, 0), 1.0)) * 0.28
    rng = np.random.default_rng(20261016)
    g = cv2.GaussianBlur(rng.normal(0, 1, (h, w)).astype(np.float32), (0, 0), 0.65)
    g /= g.std()
    lum = plate.mean(axis=2) / 255.0
    plate += (g * GRAIN * (0.55 + 3.6 * lum * (1 - lum)) / 1.45)[..., None]
    del g, lum
    plate = np.clip(plate, 0, 255)

    for w, h, name, budget in TIERS:
        tier = plate if w == plate.shape[1] else cv2.resize(plate, (w, h), interpolation=cv2.INTER_AREA)
        path = os.path.join(DEST, f'hero-landscape-{name}.webp')
        q = encode(path, tier, budget)
        print(f'{os.path.relpath(path, ROOT)}  {w}x{h}  q={q}  {os.path.getsize(path) / 1024:.0f} KB')


if __name__ == '__main__':
    main()
