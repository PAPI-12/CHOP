#!/usr/bin/env python3
"""
4× learned super-resolution, CPU only (ncnn), tiled so it fits in ~2 GB.

    python3 tools/hero/upscale.py MODEL_DIR/high-fidelity-4x  in.webp  out.png

MODEL_DIR/<name>.param + .bin are NCNN Real-ESRGAN-family weights; the hero
uses Upscayl's `high-fidelity-4x` (a photographic model — it rebuilds edges
such as lashes, lids and fabric without painting new features):

    git clone --depth 1 --filter=blob:none --sparse https://github.com/upscayl/upscayl
    (cd upscayl && git sparse-checkout set resources/models)
    pip install ncnn numpy opencv-python-headless

The 4× output is a master, not a deliverable: build-hero-plate.py samples it
DOWN to each tier, which is what makes the result crisp rather than invented.
"""
import sys
import time

import cv2
import ncnn
import numpy as np


def run(net, blk: np.ndarray) -> np.ndarray:
    """One tile through the network. ncnn.Mat wraps the numpy buffer without
    copying, so the block must outlive extract() — and is cloned for safety."""
    mat = ncnn.Mat(blk).clone()
    ex = net.create_extractor()
    ex.input('data', mat)
    _, o = ex.extract('output')
    res = np.array(o).transpose(1, 2, 0).copy()
    del ex, mat
    return res


def main() -> None:
    model, src, dst = sys.argv[1], sys.argv[2], sys.argv[3]
    tile, pad = 128, 16   # 160² input tiles peak at ~1.8 GB inside the network
    net = ncnn.Net()
    net.opt.use_vulkan_compute = False
    net.opt.num_threads = 2
    net.load_param(model + '.param')
    net.load_model(model + '.bin')
    img = cv2.imread(src, cv2.IMREAD_COLOR)
    if img is None:
        sys.exit(f'cannot read {src}')
    rgb = img[:, :, ::-1].astype(np.float32) / 255.0
    h, w, _ = rgb.shape
    out = np.zeros((h * 4, w * 4, 3), np.uint8)
    t0 = time.time()
    for y in range(0, h, tile):
        for x in range(0, w, tile):
            y0, x0 = max(0, y - pad), max(0, x - pad)
            y1, x1 = min(h, y + tile + pad), min(w, x + tile + pad)
            blk = np.ascontiguousarray(rgb[y0:y1, x0:x1].transpose(2, 0, 1))
            guide = cv2.GaussianBlur(cv2.resize(rgb[y0:y1, x0:x1], ((x1 - x0) * 4, (y1 - y0) * 4),
                                                interpolation=cv2.INTER_CUBIC), (0, 0), 4)
            for attempt in range(4):
                o = run(net, blk)
                # Self-check: a learned upscale sharpens, it never moves the
                # low frequencies. Any block that strays from a blurred cubic
                # upscale is corrupt (bad memory), not detail — run it again.
                err = np.abs(cv2.GaussianBlur(np.clip(o, 0, 1), (0, 0), 4) - guide)
                worst = cv2.resize(err.mean(axis=2), None, fx=1 / 32, fy=1 / 32,
                                   interpolation=cv2.INTER_AREA).max()
                if worst < 0.15:          # corruption measures ~0.4; edges ~0.07
                    break
                print(f'  tile {x},{y}: corrupt (err {worst:.3f}), retrying', flush=True)
            else:
                sys.exit(f'tile {x},{y} keeps failing its self-check')
            ty, tx = (y - y0) * 4, (x - x0) * 4
            th, tw = min(tile, h - y) * 4, min(tile, w - x) * 4
            out[y * 4:y * 4 + th, x * 4:x * 4 + tw] = \
                (np.clip(o[ty:ty + th, tx:tx + tw], 0, 1) * 255 + 0.5).astype(np.uint8)[:, :, ::-1]
        print(f'row {y}/{h}  {time.time() - t0:.0f}s', flush=True)
    cv2.imwrite(dst, out)


if __name__ == '__main__':
    main()
