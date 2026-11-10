#!/usr/bin/env python3
"""
Derive the grade table by matching COLOUR, not brightness.

    python3 tools/xray/grade.py --iters 4 --scale 0.5

The earlier pipeline equalised mid-tone luminance and called it graded. The
sources span hue 7 deg to 280 deg, so every shot kept its native cast and the
colour balance swung at every cut while the luminance numbers looked perfect.
That is the "the grade keeps changing" complaint, and p50 was the wrong thing
to hold constant.

This closes the loop on all three channels instead: render each segment with
the current table, measure its median R, G and B, and solve a per-channel
gamma to walk them onto a shared target. Repeat. Targets are given as
(luma, hue, saturation) and converted to RGB, because that is the space the
complaint was in -- "it goes red here and blue there".

`mx` deliberately gets its own, warmer target. That is the light-box shot
going red before it fires, which is a motivated deviation at one moment, not
the drift the rest of the piece suffered from.
"""
import argparse
import json
import os
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import edit

# Targets are in the same statistic measure() now samples: the look-carrying
# pixels (brightest 35%, sat > 0.15), not whole-frame medians. Ungraded, the
# reality shots sit at luma 0.55-0.67 / sat 0.20-0.31, so these are reachable.
TARGETS = {
    "r": dict(luma=0.42, hue=35.0, sat=0.15),   # shared reality base
    "red": dict(luma=0.34, hue=22.0, sat=0.26),  # mx: the deliberate red turn
    "x": dict(luma=0.13, hue=80.0, sat=0.52),   # x-ray, ~#d7ff4f at 74 deg
}

# Per-shot overrides. The macro endframe is high-key by nature -- its darkest
# three quarters sit at luma 0.38 where the x-ray clip sits at 0.17 -- so
# asking it to reach the clip's 0.13 drove gamma and saturation into their
# clamps and turned the frame blue. It gets a target it can actually reach;
# the 0.70 s dissolve covers the remaining step.
OVERRIDE = {
    "end": dict(luma=0.20, hue=82.0, sat=0.45),
}

# Shots tuned by a direct search against their neighbour and then frozen. The
# iterative solver is a proportional controller chasing one average colour per
# shot, which works when a shot has a single dominant hue -- it drove both of
# these into their clamps, because:
#   end - bimodal: a lime structure over a blue background. Averaging the two
#         clusters gives a colour that exists nowhere in the frame, so the
#         solver chased it with a +80 deg rotation and smeared the image
#         (hue coherence 0.65 -> 0.40). Searched against c6 instead.
#   mx   - 2 s of stable red then a muzzle flash that blows out to white. The
#         blowout drags any whole-segment average off the red entirely.
LOCK = {"end", "mx"}

# Measure these over the part that carries the look, not the whole segment.
WINDOW = {"mx": (0.0, 2.0)}


def hsv_to_rgb(h, s, v):
    h = h % 360.0
    c = v * s
    x = c * (1 - abs((h / 60) % 2 - 1))
    m = v - c
    if h < 60:   r, g, b = c, x, 0
    elif h < 120: r, g, b = x, c, 0
    elif h < 180: r, g, b = 0, c, x
    elif h < 240: r, g, b = 0, x, c
    elif h < 300: r, g, b = x, 0, c
    else:         r, g, b = c, 0, x
    return r + m, g + m, b + m


def target_rgb(kind):
    t = OVERRIDE.get(kind) or TARGETS[kind]
    return np.array(hsv_to_rgb(t["hue"], t["sat"], t["luma"]))


def measure(path, window=None, nframes=14):
    """Mean R,G,B over the BODY of the image, in 0-1.

    Not the median. These sources have wildly different keys -- the macro
    endframe is high-key with its colour up in the bright structure, the
    x-ray clip is low-key and uniform -- so a median compares the endframe's
    background against the clip's midtones and the two never meet. Taking the
    20th-80th luma band compares like with like.
    """
    W, H = 192, 108
    pre = ""
    if window:
        pre = f"trim=start={window[0]}:end={window[1]},setpts=PTS-STARTPTS,"
    raw = subprocess.run(
        [edit.FF, "-hide_banner", "-loglevel", "error", "-i", path,
         "-vf", pre + f"fps=8,scale={W}:{H}", "-frames:v", str(nframes),
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        capture_output=True).stdout
    a = np.frombuffer(raw, dtype=np.uint8).reshape(-1, H, W, 3).astype(np.float32) / 255.0
    if len(a) == 0:
        return None
    px = a.reshape(-1, 3)
    lum = px @ np.array([.2126, .7152, .0722], dtype=np.float32)
    lo, hi = np.percentile(lum, 20), np.percentile(lum, 80)
    band = px[(lum >= lo) & (lum <= hi)]
    # Deliberately NOT the brightest-and-most-saturated pixels. That set
    # re-selects itself as the grade changes, so the measurement moves under
    # the solver and it never converges -- on the low-coherence shots it
    # pinned every channel to a clamp. This band is a fixed, stable sample.
    return band.mean(axis=0) if len(band) > 100 else px.mean(axis=0)


def stats(rgb):
    r, g, b = rgb
    mx, mn = max(r, g, b), min(r, g, b)
    d = max(mx - mn, 1e-6)
    if mx == r:   h = ((g - b) / d) % 6
    elif mx == g: h = (b - r) / d + 2
    else:         h = (r - g) / d + 4
    lum = r * .2126 + g * .7152 + b * .0722
    return lum, (h * 60) % 360, d / max(mx, 1e-6)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--iters", type=int, default=4)
    ap.add_argument("--scale", type=float, default=0.5)
    ap.add_argument("--damp", type=float, default=0.85)
    a = ap.parse_args()

    os.makedirs(edit.WORK, exist_ok=True)
    W, H = int(round(edit.BASE_W * a.scale)), int(round(edit.BASE_H * a.scale))
    table_path = os.path.join(edit.ROOT, "tools", "xray", "grade.json")

    keys = [k for k in edit.ORDER if not edit.SEG[k].get("black")]
    for it in range(a.iters):
        edit.pass1(W, H, a.scale, force=True)
        rows, worst = {}, 0.0
        for k in keys:
            m = measure(os.path.join(edit.WORK, f"seg_{k}.mkv"), WINDOW.get(k))
            if m is None:
                continue
            kind = "red" if edit.SEG[k].get("red") else edit.SEG[k]["look"]
            tgt = target_rgb(k if k in OVERRIDE else kind)
            if k in LOCK:
                # frozen: report it, never touch it
                lum, hue, sat = stats(m)
                tl, th, ts = stats(tgt)
                rows[k] = (lum, hue, sat, tl, th, ts, m, tgt, edit.ROT.get(k, 0.0))
                continue
            g = edit.GAMMA_RGB.get(k, {"r": 1.0, "g": 1.0, "b": 1.0})
            # eq applies out = in**(1/gamma); solve for the gamma that lands
            # the measured median on target, then damp so it cannot overshoot.
            new = {}
            for i, ch in enumerate("rgb"):
                denom = np.log(max(tgt[i], 1e-4))
                num = np.log(max(m[i], 1e-4))
                step = num / denom
                new[ch] = float(np.clip(g[ch] * (step ** a.damp), 0.60, 1.80))
            edit.GAMMA_RGB[k] = new
            # Hue needs its own rotation: a per-channel gamma is a power law
            # per channel and can only nudge it. The YIQ matrix runs about
            # 0.66 HSV degrees per matrix degree, and in the opposite sense,
            # hence the -1.5.
            cur_s = stats(m)[2]
            tgt_s = stats(tgt)[2]
            look0 = edit.SEG[k]["look"]
            if cur_s > 1e-3 and look0 == "x":
                # A per-channel gamma is a power law per channel and cannot
                # raise saturation on its own. Needed on the x-ray look, where
                # the target is heavily saturated; on reality it fought the
                # gamma solve, so it is x-ray only.
                old_sat = edit.SAT.get(k, 1.10)
                edit.SAT[k] = float(np.clip(old_sat * (tgt_s / cur_s) ** a.damp, 0.50, 1.70))
            cur_h = stats(m)[1]
            cur_s = stats(m)[2]
            tgt_h = stats(tgt)[1]
            err = ((tgt_h - cur_h + 180.0) % 360.0) - 180.0
            look = edit.SEG[k]["look"]
            # Hue is meaningless on a near-neutral shot: c2 reads as hue 231
            # purely because blue is the largest of three nearly equal
            # channels. Weight the rotation by how coloured the shot actually
            # is, or the solver chases a 190 deg error that does not exist and
            # pins the clamp.
            w = 0.0 if look != "x" else float(min(1.0, cur_s / 0.25))
            old_rot = edit.ROT.get(k, edit.DEFAULT_ROT[look])
            edit.ROT[k] = float(np.clip(old_rot - 1.5 * err * a.damp * w, -80.0, 80.0))
            lum, hue, sat = stats(m)
            tl, th, ts = stats(tgt)
            err = max(abs(m - tgt))
            worst = max(worst, err)
            rows[k] = (lum, hue, sat, tl, th, ts, m, tgt, edit.ROT.get(k, 0.0))
        print(f"\nround {it + 1}")
        print(f"  {'seg':>6} {'luma':>12} {'hue':>12} {'sat':>12} {'rot':>7}  {'dRGB':>7}")
        for k, (l, h, s, tl, th, ts, m, t, rot) in rows.items():
            print(f"  {k:>6} {l:5.3f}->{tl:5.3f} {h:5.0f}->{th:4.0f} "
                  f"{s:5.2f}->{ts:4.2f} {rot:+6.1f}  {max(abs(m - t)):7.3f}")
        # spread across the reality shots is the thing that has to collapse
        rl = [rows[k][0] for k in rows if edit.SEG[k]["look"] == "r" and not edit.SEG[k].get("red")]
        rh = [rows[k][1] for k in rows if edit.SEG[k]["look"] == "r" and not edit.SEG[k].get("red")]
        if rl:
            print(f"  REALITY base: luma spread {max(rl)-min(rl):.3f}, "
                  f"hue range {min(rh):.0f}-{max(rh):.0f} deg")
        if worst < 0.012:
            print("  converged")
            break

    with open(table_path, "w") as f:
        json.dump({"LEVELS": edit.LEVELS, "GAMMA": edit.GAMMA_RGB,
                   "TONE": edit.TONE, "SAT": edit.SAT,
                   "ROT": edit.ROT}, f, indent=2)
    print(f"\nwrote {table_path}")


if __name__ == "__main__":
    main()
