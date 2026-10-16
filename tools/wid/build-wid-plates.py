#!/usr/bin/env python3
"""
High-density plates for the What I Do book.

    public/images/wid/<name>-2x.webp     (2× the source width, capped at 3200)

The book spreads each image across the whole viewport, so on Retina screens
the 1500–1800 px sources were being stretched ~1.6–1.9×. Each source is run
through a 4× learned upscale (tools/hero/upscale.py, the fast general-purpose
`upscayl-lite-4x` model), then area-sampled DOWN to 2× — crisp edges without
inventing texture — and encoded under an honest budget.

    python3 tools/wid/build-wid-plates.py MODELS/upscayl-lite-4x
"""
from __future__ import annotations

import os
import subprocess
import sys
import tempfile

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
IMAGES = os.path.join(ROOT, 'public', 'images')
OUT = os.path.join(IMAGES, 'wid')
UPSCALE = os.path.join(ROOT, 'tools', 'hero', 'upscale.py')
NAMES = ('tau-hero-phones', 'cornetto-truck', '11-the-throne', 'hero-collage', 'audi-03')
MAX_W = 3200
BUDGET = 560 * 1024


def encode(path: str, img: np.ndarray) -> int:
    for q in range(88, 60, -2):
        ok, buf = cv2.imencode('.webp', img, [cv2.IMWRITE_WEBP_QUALITY, q])
        if ok and len(buf) <= BUDGET:
            buf.tofile(path)
            return q
    sys.exit(f'{path}: cannot fit under {BUDGET} bytes')


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    model = sys.argv[1]
    os.makedirs(OUT, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for name in NAMES:
            src = cv2.imread(os.path.join(IMAGES, f'{name}.webp'), cv2.IMREAD_COLOR)
            h, w = src.shape[:2]
            a, b = os.path.join(tmp, 'in.png'), os.path.join(tmp, 'x4.png')
            cv2.imwrite(a, src)
            subprocess.run([sys.executable, UPSCALE, model, a, b], check=True, stdout=subprocess.PIPE, text=True)
            x4 = cv2.imread(b, cv2.IMREAD_COLOR)
            tw = min(2 * w, MAX_W)
            th = round(h * tw / w)
            img = cv2.resize(x4, (tw, th), interpolation=cv2.INTER_AREA)
            path = os.path.join(OUT, f'{name}-2x.webp')
            q = encode(path, img)
            print(f'{os.path.relpath(path, ROOT)}  {tw}x{th}  q={q}  {os.path.getsize(path) / 1024:.0f} KB')


if __name__ == '__main__':
    main()
