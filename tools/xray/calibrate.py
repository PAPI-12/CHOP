#!/usr/bin/env python3
"""Derive each segment's normalisation curve from the frames that actually
reach the grade -- i.e. after reframing, not from the raw source.

Prints LEVELS / GAMMA blocks to paste into edit.py.
"""
import subprocess, sys, os, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import edit, json as _json
from PIL import Image

FF = edit.FF
FPS = edit.FPS
TARGET = {"r": (0.020, 0.880, 0.420), "x": (0.098, 0.718, None)}
PARTIAL, GMIN, GMAX = 0.60, 0.85, 1.40   # partial correction + safety clamp


def canvas_only(key, W, H, scale):
    """graph for one segment with the grade and finish chain stripped off"""
    g, extra = edit.seg_graph(key, W, H, scale)
    return g.split(";[cv]")[0] + ";[cv]fps=6,scale=400:-2,format=yuv420p[o]", extra


def stats(graph, inputs, dur):
    os.makedirs("/tmp/cal", exist_ok=True)
    for f in os.listdir("/tmp/cal"):
        os.remove("/tmp/cal/" + f)
    cmd = [FF, "-hide_banner", "-loglevel", "error", "-y"] + inputs
    cmd += ["-filter_complex", graph, "-map", "[o]", "-t", f"{dur:.2f}",
            "/tmp/cal/%04d.png"]
    subprocess.run(cmd, check=True, capture_output=True)
    fs = sorted(os.listdir("/tmp/cal"))
    a = np.stack([np.asarray(Image.open("/tmp/cal/" + f).convert("RGB")).astype(float)
                  for f in fs])
    lum = a[..., 0] * .2126 + a[..., 1] * .7152 + a[..., 2] * .0722
    return np.percentile(lum, 1), np.percentile(lum, 50), np.percentile(lum, 99.5)


def main():
    W, H = 640, 360
    scale = W / edit.BASE_W
    print(f"{'seg':>4} {'p1':>7} {'p50':>7} {'p99.5':>7}   ->  levels / gamma")
    levels, gammas = {}, {}
    for key in ("s1", "c2", "c3", "c4", "c5", "c6", "s7"):
        graph, extra = canvas_only(key, W, H, scale)
        cmd = []
        if key in ("s1", "s7"):
            cmd += ["-loop", "1", "-framerate", str(FPS), "-t", f"{edit.TL[key]:.2f}",
                    "-i", os.path.join(edit.SRC, edit.SRC_FILE[key])]
        else:
            cmd += ["-i", os.path.join(edit.SRC, edit.SRC_FILE[key])]
        for e in extra:
            cmd += ["-loop", "1", "-framerate", str(FPS),
                    "-t", f"{edit.TL[key] + 0.6:.2f}", "-i", e]
        p1, p50, p995 = stats(graph, cmd, edit.TL[key])
        look = edit.LOOK[key]
        lo, hi, tmed = TARGET[look]
        # curves needs strictly increasing x, so keep the black point off zero
        a = min(max(p1 / 255.0, 0.006), 0.30)
        b = min(max(p995 / 255.0, a + 0.08), 0.999)
        levels[key] = f"0/0 {a:.3f}/{lo:.3f} {b:.3f}/{hi:.3f} 1/1"
        if tmed is None:
            gammas[key] = 1.00
        else:
            # eq applies out = in ** (1/gamma), so gamma = ln(m)/ln(target)
            m = (p50 / 255.0 - a) / max(b - a, 1e-6) * (hi - lo) + lo
            m = min(max(m, 0.02), 0.98)
            full = float(np.log(m) / np.log(tmed))
            # correct most of the way, but never with an extreme gamma -- a huge
            # gamma crushes contrast and makes the footage look flatter, which
            # is the opposite of what we want here
            g = full ** PARTIAL
            gammas[key] = round(min(max(g, GMIN), GMAX), 3)
        print(f"{key:>4} {p1:7.1f} {p50:7.1f} {p995:7.1f}   ->  "
              f"\"{levels[key]}\"  gamma={gammas[key]}")
    print()
    print("LEVELS = dict(")
    for k in levels:
        print(f'    {k}="{levels[k]}",')
    print(")")
    print("GAMMA = dict(" + ", ".join(f"{k}={v}" for k, v in gammas.items()) + ")")
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "grade.json")
    with open(out, "w") as f:
        _json.dump({"LEVELS": levels, "GAMMA": gammas}, f, indent=1)
    print("\nwrote", out)


if __name__ == "__main__":
    main()
