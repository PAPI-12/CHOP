#!/usr/bin/env python3
"""Measure the rendered edit: per-segment exposure/colour, and the high
frequency (grain/detail) energy that has to read identically across cuts."""
import subprocess, sys, numpy as np, os
FF = os.environ.get("FFMPEG", "/tmp/ffmpeg")

WINDOWS = {
    "s1": (0.10, 0.95),
    "c2": (1.15, 2.70),
    "c3": (2.95, 6.60),
    "c4": (6.95, 8.85),
    "c5": (9.10, 11.80),
    "c6": (15.70, 19.80),
    "s7": (20.10, 22.10),
}


def load(path, a, b, fps=8, w=480):
    out = "/tmp/_m_%04d.png"
    for f in os.listdir("/tmp"):
        if f.startswith("_m_"):
            os.remove("/tmp/" + f)
    subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{a:.3f}",
                    "-t", f"{b - a:.3f}", "-i", path, "-vf",
                    f"fps={fps},scale={w}:-2", out], check=True)
    from PIL import Image
    fs = sorted(f for f in os.listdir("/tmp") if f.startswith("_m_"))
    return np.stack([np.asarray(Image.open("/tmp/" + f).convert("RGB")).astype(float)
                     for f in fs])


def hue_stats(v):
    lum = v[..., 0] * .2126 + v[..., 1] * .7152 + v[..., 2] * .0722
    l = lum.reshape(len(v), -1)
    px = v.reshape(len(v), -1, 3)
    thr = np.percentile(l, 88)
    p = px[l > thr]
    mx, mn = p.max(1), p.min(1)
    d = np.maximum(mx - mn, 1e-6)
    r, g, bl = p[:, 0], p[:, 1], p[:, 2]
    h = np.where(mx == r, ((g - bl) / d) % 6,
        np.where(mx == g, (bl - r) / d + 2, (r - g) / d + 4)) * 60
    return h, np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)


TILE = 32


def grain_energy(v):
    """High-frequency sigma, measured only on tiles that are spatially flat.

    Flatness has to be judged spatially, per frame. Picking tiles by temporal
    variance instead is degenerate on a still: with almost no frame-to-frame
    difference anywhere, "the flattest 40%" just means an arbitrary 40% of the
    frame, and the two stills then scored ~8x the moving clips -- a
    measurement artefact, not a real difference in grain.
    """
    lum = v[..., 0] * .2126 + v[..., 1] * .7152 + v[..., 2] * .0722
    lap = (4 * lum[:, 1:-1, 1:-1] - lum[:, :-2, 1:-1] - lum[:, 2:, 1:-1]
           - lum[:, 1:-1, :-2] - lum[:, 1:-1, 2:])
    h, w = lap.shape[1] // TILE, lap.shape[2] // TILE
    out = []
    for t in range(lap.shape[0]):
        f = lap[t, :h * TILE, :w * TILE].reshape(h, TILE, w, TILE)
        var = f.var(axis=(1, 3))
        flat = var < np.percentile(var, 40)
        if flat.any():
            i, j = np.nonzero(flat)
            out.append(f[i, :, j, :].reshape(-1, TILE * TILE).std(axis=1))
    return float(np.median(np.concatenate(out))) if out else float("nan")


def main(path):
    print(f"{'seg':>4} {'p1':>6} {'p50':>6} {'p99':>6} {'mean':>6} {'std':>6} "
          f"{'R':>6} {'G':>6} {'B':>6} | {'hue':>6} {'sat':>5} {'grain':>6}")
    rows = {}
    for k, (a, b) in WINDOWS.items():
        v = load(path, a, b)
        lum = v[..., 0] * .2126 + v[..., 1] * .7152 + v[..., 2] * .0722
        h, s = hue_stats(v)
        rows[k] = (np.percentile(lum, 1), np.percentile(lum, 50),
                   np.percentile(lum, 99), lum.mean())
        print(f"{k:>4} {np.percentile(lum,1):6.1f} {np.percentile(lum,50):6.1f} "
              f"{np.percentile(lum,99):6.1f} {lum.mean():6.1f} {lum.std():6.1f} "
              f"{v[...,0].mean():6.1f} {v[...,1].mean():6.1f} {v[...,2].mean():6.1f} | "
              f"{np.median(h):6.1f} {s.mean():5.2f} {grain_energy(v):6.2f}")
    print()
    for grp, label in ((("s1", "c2", "c3", "c4", "c5"), "REALITY"),
                       (("c6", "s7"), "X-RAY")):
        p50 = [rows[k][1] for k in grp]
        p1 = [rows[k][0] for k in grp]
        print(f"{label:8} p50 range {min(p50):.1f}-{max(p50):.1f} "
              f"(spread {max(p50)-min(p50):.1f})   p1 range {min(p1):.1f}-{max(p1):.1f} "
              f"(spread {max(p1)-min(p1):.1f})")


if __name__ == "__main__":
    main(sys.argv[1])
