#!/usr/bin/env python3
"""Close the loop: render -> measure -> nudge each segment's gamma -> repeat.

The canvas-only calibration gets us close, but halation, the vignette and the
S-curve all shift exposure, so the final match is solved against real output
frames instead.
"""
import os, sys, subprocess, numpy as np, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import edit, measure

TARGET = {"r": 0.420, "x": 0.130}      # target median, 0-1
GAIN = 0.85                            # damping so it settles instead of ringing
GMIN, GMAX = 0.78, 1.55


def render(scale, force):
    W, H = int(round(edit.BASE_W * scale)), int(round(edit.BASE_H * scale))
    edit.pass1(W, H, scale, force=force)
    edit.pass2({k: os.path.join(edit.WORK, f"seg_{k}.mkv") for k in edit.SEGMENTS},
               W, H, "/tmp/tune.mp4", 20, "veryfast", "h264", edit.GRAIN, scale)


def medians():
    out = {}
    for k, (a, b) in measure.WINDOWS.items():
        v = measure.load("/tmp/tune.mp4", a, b, fps=6, w=400)
        lum = v[..., 0] * .2126 + v[..., 1] * .7152 + v[..., 2] * .0722
        out[k] = float(np.percentile(lum, 50)) / 255.0
    return out


def main(rounds=4):
    scale = 0.5
    for i in range(rounds):
        render(scale, force=True)
        m = medians()
        real = [m[k] for k in ("s1", "c2", "c3", "c4", "c5")]
        xray = [m[k] for k in ("c6", "s7")]
        print(f"\nround {i+1}: reality p50 {[round(v*255) for v in real]} "
              f"(spread {round((max(real)-min(real))*255)})  |  "
              f"xray p50 {[round(v*255) for v in xray]} "
              f"(spread {round((max(xray)-min(xray))*255)})")
        spread = max(max(real) - min(real), max(xray) - min(xray))
        off = max(abs(v - TARGET[edit.LOOK[k]]) for k, v in m.items())
        print(f"          spread={spread*255:.0f}  worst offset from target={off*255:.0f}")
        if spread < 0.035 and off < 0.025:
            print("converged"); break
        for k, v in m.items():
            T = TARGET[edit.LOOK[k]]
            cur = edit.GAMMA[k]
            new = cur * (np.log(max(v, 0.01)) / np.log(T)) ** GAIN
            edit.GAMMA[k] = round(float(min(max(new, GMIN), GMAX)), 3)
        print("  gamma ->", edit.GAMMA)
        with open(edit._GRADE_FILE, "w") as f:
            json.dump({"LEVELS": edit.LEVELS, "GAMMA": edit.GAMMA}, f, indent=1)
    print("\nfinal GAMMA:", edit.GAMMA)


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 4)
