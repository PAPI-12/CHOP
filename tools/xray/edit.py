#!/usr/bin/env python3
"""
About hero: the x-ray sequence.

    python3 tools/xray/edit.py --out public/videos/about-hero-xray.mp4

Two passes, because one filtergraph for the whole timeline gets OOM-killed on
a 4 GB box. Pass 1 renders one 10-bit intermediate per segment, pass 2 joins
them and applies grain, halation and the vignette ONCE over the assembled
timeline -- that shared pass is what makes seven unrelated sources read as one
piece.

The grade is matched on COLOUR, not brightness. An earlier version equalised
mid-tone luminance only and the result was unwatchable: the sources span hue
7 deg to 280 deg, so each shot kept its native cast and the colour balance
visibly changed at every cut while every luminance number looked perfect.
Grade table lives in grade.json; grade.py derives it.

See README.md for the traps (hue and unsharp are both broken at 16-bit here).
"""
import argparse
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "assets", "xray", "source")
PLATES = os.path.join(ROOT, "tools", "xray", "plates")
WORK = os.path.join(ROOT, "assets", "xray", "work")
OUTD = os.path.join(ROOT, "public", "videos")
FF = "/tmp/ffmpeg"

BASE_W, BASE_H = 1280, 720
FPS = 24
RGB_MAX = 65535

# ── the cut ───────────────────────────────────────────────────────────────
# in/out points are chosen from measured motion, not by eye: 3.mp4 is dead for
# its first 4.5 s, and cutting anywhere in there gives you four seconds of a
# frozen frame. Its movement lives at 4.6-7.0 s, so that is what we use.
SEG = {
    "s1":    dict(src="1.webp",                   still=True,  dur=1.20, look="r"),
    "c2":    dict(src="2.mp4",       t0=0.00, t1=1.90,                   look="r"),
    "c3":    dict(src="3.mp4",       t0=4.60, t1=7.00, reframe=0.65,     look="r"),
    "c4":    dict(src="4.mp4",       t0=0.20, t1=2.36, reframe=0.65,     look="r"),
    "c5":    dict(src="5.mp4",       t0=1.00, t1=3.20,                   look="r"),
    "mx":    dict(src="minimax.mp4", t0=7.60, t1=10.10,                  look="r", red=True),
    "black": dict(black=True,                                dur=0.40),
    "c6":    dict(src="6.mp4",       t0=0.00, t1=5.50,                   look="x"),
    "end":   dict(src="endframe-macro-xray.png", still=True,  dur=2.30,  look="x"),
}
ORDER = ["s1", "c2", "c3", "c4", "c5", "mx", "black", "c6", "end"]

# Dissolve INTO each key. Short dissolves read as soft hard cuts, which is the
# worst of both worlds, so these are long enough to actually read. The one
# exception is mx -> black. mx ends on the flash at its brightest (luma 0.55),
# so a hard cut there was the single largest frame step in the whole piece --
# 94 delta, 11x the local median. A 0.22 s fade reads as the flash decaying
# into darkness instead of the picture being switched off.
XF = {"c2": 0.60, "c3": 0.35, "c4": 0.35, "c5": 0.45,
      "mx": 0.40, "black": 0.22, "c6": 0.30, "end": 0.95}

GRAIN = 9
CLARITY_R, CLARITY_X = 0.16, 0.14
R_GLOW, R_THRESH = 0.24, 0.62
X_GLOW, X_THRESH = 0.34, 0.50
REALITY_CURVE = "0/0 0.200/0.165 0.420/0.405 0.620/0.655 0.850/0.885 1/1"
XRAY_CURVE = "0/0 0.180/0.150 0.450/0.460 0.750/0.800 1/1"

# The lime shift. `hue` clips R and B to zero somewhere in this 16-bit chain --
# the x-ray came out flat green with R=3, B=2 -- so this is a hand-written
# luminance-preserving RGB matrix instead. Moves the footage from ~96 deg to
# ~80 deg without touching exposure (the site's #d7ff4f sits at 74).
def hue_matrix(deg):
    """Luminance-preserving hue rotation as an RGB matrix.

    Rotating in YIQ keeps the neutral axis fixed -- every row sums to 1, so
    greys stay grey and only the colour moves. Emitted as colorchannelmixer
    because the `hue` filter clips R and B to zero somewhere in this 16-bit
    chain. Positive degrees move green towards lime.
    """
    import math
    import numpy as np
    t = math.radians(deg); c, s = math.cos(t), math.sin(t)
    A = np.array([[0.299, 0.587, 0.114],
                  [0.596, -0.274, -0.322],
                  [0.211, -0.523, 0.312]])
    R = np.array([[1.0, 0.0, 0.0], [0.0, c, -s], [0.0, s, c]])
    M = np.linalg.inv(A) @ R @ A          # rows sum to 1 -> greys stay grey
    return ("colorchannelmixer="
            f"rr={M[0, 0]:.4f}:rg={M[0, 1]:.4f}:rb={M[0, 2]:.4f}"
            f":gr={M[1, 0]:.4f}:gg={M[1, 1]:.4f}:gb={M[1, 2]:.4f}"
            f":br={M[2, 0]:.4f}:bg={M[2, 1]:.4f}:bb={M[2, 2]:.4f}")


# Default rotation per look: the x-ray footage sits near 96 deg and the site's
# #d7ff4f is at 74, so it needs a pull towards lime. Reality needs none.
DEFAULT_ROT = {"r": 0.0, "x": 18.0}


def dur_of(k):
    s = SEG[k]
    return s["dur"] if ("still" in s or "black" in s) else s["t1"] - s["t0"]


def load_grade():
    p = os.path.join(ROOT, "tools", "xray", "grade.json")
    if os.path.exists(p):
        with open(p) as f:
            g = json.load(f)
        lev = g.get("LEVELS", {})
        gam = g.get("GAMMA", {})
        for k, v in list(gam.items()):
            # migration: the table used to carry one scalar per shot, which
            # cannot express a colour correction
            if isinstance(v, (int, float)):
                gam[k] = {"r": float(v), "g": float(v), "b": float(v)}
        return lev, gam, g.get("TONE", {}), g.get("SAT", {}), g.get("ROT", {})
    return {}, {}, {}, {}, {}


LEVELS, GAMMA_RGB, TONE, SAT, ROT = load_grade()


def feather_expr(W, fg_w, feather):
    """1 inside the sharp centre strip, 0 outside, smooth over `feather` px."""
    x0 = (W - fg_w) / 2.0
    return (f"if(lt(X,{x0}),if(lt(X,{x0 - feather}),0,(X-{x0 - feather})/{feather}),"
            f"if(lt(X,{x0 + fg_w}),1,"
            f"if(lt(X,{x0 + fg_w + feather}),({x0 + fg_w + feather}-X)/{feather},0)))")


def flat_canvas(sw, sh, W, H):
    """Fit a horizontal source to the 16:9 canvas, letterboxing on black."""
    cw = min(W, int(round(H * sw / sh)))
    if cw >= W - 1:
        return f"scale={W}:{H}:flags=lanczos"
    off = (W - cw) // 2
    return (f"scale={cw}:{H}:flags=lanczos,pad={W}:{H}:{off}:0:color=black,"
            f"setsar=1")


def grade(key):
    look = SEG[key]["look"]
    lv = LEVELS.get(key, "0/0 0.010/0.020 0.780/0.880 1/1")
    g = GAMMA_RGB.get(key, {"r": 1.0, "g": 1.0, "b": 1.0})
    tone = TONE.get(key, "")
    # per-shot saturation: a per-channel gamma is a power law and simply
    # cannot raise saturation, so it needs its own control in the table
    sat = SAT.get(key, 1.10 if look == "x" else 0.94)
    curve = XRAY_CURVE if look == "x" else REALITY_CURVE
    chain = (f"format=gbrp16le,"
             f"curves=r='{lv}':g='{lv}':b='{lv}',"
             f"eq=gamma_r={g['r']:.4f}:gamma_g={g['g']:.4f}:gamma_b={g['b']:.4f}"
             f":saturation={sat},"
             f"curves=r='{curve}':g='{curve}':b='{curve}'")
    if tone:
        chain += f",colorbalance={tone}"
    rot = ROT.get(key, DEFAULT_ROT[look])
    if abs(rot) > 0.05:
        chain += f",{hue_matrix(rot)}"
    return chain


def finish(look, W, H, vig_in, scale=1.0):
    """clarity -> halation -> vignette, all in 16-bit RGB.

    Multiplying in YUV would scale U/V too and slide the hue instead of
    dimming, and blend's `screen` misbehaves above 8-bit, so the glow is an
    explicit expression with the range normalised by hand.
    """
    strength = X_GLOW if look == "x" else R_GLOW
    thresh = X_THRESH if look == "x" else R_THRESH
    screen = f"A+{strength}*(B-A*B/{RGB_MAX})"
    clarity = CLARITY_R if look == "r" else CLARITY_X
    return (
        # micro-contrast: written by hand, unsharp is broken at 16-bit here
        f"split=2[cl_a][cl_b];"
        f"[cl_b]gblur=sigma={8 * scale:.1f}[cl_bl];"
        f"[cl_a][cl_bl]blend=all_mode=normal:all_expr='A+{clarity}*(A-B)'[cl];"
        f"[cl]split=2[bl_a][bl_b];"
        f"[bl_b]scale=iw/6:ih/6,gblur=sigma={3 * scale:.2f},scale={W}:{H}:flags=lanczos,"
        f"curves=r='0/0 {thresh}/0 {thresh + 0.16:.2f}/1 1/1'"
        f":g='0/0 {thresh}/0 {thresh + 0.16:.2f}/1 1/1'"
        f":b='0/0 {thresh}/0 {thresh + 0.16:.2f}/1 1/1',"
        f"gblur=sigma={22 * scale:.1f}[bl_g];"
        f"[bl_a][bl_g]blend=all_mode=normal:all_expr='{screen}'[li];"
        f"[{vig_in}]scale={W}:{H}:flags=lanczos,format=gbrp16le[vg];"
        f"[li][vg]blend=all_mode=multiply[vd];"
        f"[vd]format=yuv420p10le,setsar=1,settb=1/{FPS},fps={FPS}[outv]"
    )


def seg_graph(key, W, H, scale):
    s = SEG[key]
    dur = dur_of(key)
    if s.get("black"):
        return (f"[0:v]format=yuv420p10le,setsar=1,settb=1/{FPS},fps={FPS},"
                f"trim=0:{dur},setpts=PTS-STARTPTS[outv]"), []

    look = s["look"]
    extra = []
    import re as _re
    r = subprocess.run([FF, "-hide_banner", "-i", os.path.join(SRC, s["src"])],
                       capture_output=True, text=True).stderr
    m = _re.search(r", (\d+)x(\d+)", r)
    sw, sh = int(m.group(1)), int(m.group(2))

    if s.get("still"):
        pre = f"fps={FPS},"
    else:
        pre = f"fps={FPS},trim={s['t0']}:{s['t1']:.3f},setpts=PTS-STARTPTS,"

    if "reframe" in s:
        # Vertical source: a sharp centre band over a defocused, dimmed copy of
        # itself, feathered together, so nothing in the piece is portrait.
        keep, ctr = 0.90, s["reframe"]
        ch = int(round(sh * keep))
        top = max(0, min(int(round(ctr - ch / 2)), sh - ch))
        fg_w = int(round(H * sw / ch))
        fg_w += fg_w % 2
        cover_h = int(round(W * ch / sw))
        off = max(0, (cover_h - H) // 2)
        msk = feather_expr(W, fg_w, 210.0 * scale)
        extra += [os.path.join(PLATES, "backdrop_falloff.png"),
                  os.path.join(PLATES, "vignette.png")]
        head = (
            f"[0:v]{pre}format=yuv420p10le,split=2[cv_f][cv_b];"
            f"[cv_f]crop={sw}:{ch}:0:{top},scale={fg_w}:{H}:flags=lanczos,"
            f"pad={W}:{H}:({W}-{fg_w})/2:0:color=black,format=gbrp16le[fg];"
            f"[cv_b]crop={sw}:{ch}:0:{top},scale={W}:{cover_h}:flags=lanczos,"
            f"crop={W}:{H}:0:{off},gblur=sigma={52 * scale:.1f},"
            f"eq=brightness=-0.07:saturation=0.68:contrast=0.97,"
            f"format=gbrp16le[bg0];"
            f"[1:v]scale={W}:{H}:flags=lanczos,format=gbrp16le[bf];"
            f"[bg0][bf]blend=all_mode=multiply[bg];"
            f"[bg][fg]blend=all_mode=normal:all_expr='A*(1-{msk})+B*{msk}'[cv]"
        )
        vig_in = "2:v"
    else:
        head = f"[0:v]{pre}format=yuv420p10le,{flat_canvas(sw, sh, W, H)}[cv0]"
        head += f";[cv0]format=gbrp16le[cv]"
        extra.append(os.path.join(PLATES, "vignette.png"))
        vig_in = "1:v"

    return head + ";[cv]" + grade(key) + "[gd];[gd]" + finish(look, W, H, vig_in, scale), extra


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-4000:])
        raise SystemExit(f"ffmpeg failed ({r.returncode})")


def _cached_size(path):
    """Width/height of an existing intermediate, or None."""
    r = subprocess.run([FF, "-hide_banner", "-i", path], capture_output=True, text=True)
    m = re.search(r", (\d+)x(\d+)[,\s]", r.stderr)
    return (int(m.group(1)), int(m.group(2))) if m else None


def pass1(W, H, scale, force=False):
    outs = {}
    for key in ORDER:
        dst = os.path.join(WORK, f"seg_{key}.mkv")
        outs[key] = dst
        # The cache is keyed on nothing but the filename, but the render is
        # scale-dependent -- reusing a half-res intermediate for a full-res
        # assembly silently ships a 640x360 master. Check the actual size.
        if os.path.exists(dst) and not force and _cached_size(dst) == (W, H):
            continue
        graph, extra = seg_graph(key, W, H, scale)
        dur = dur_of(key)
        s = SEG[key]
        cmd = [FF, "-hide_banner", "-y", "-loglevel", "error"]
        if s.get("still"):
            cmd += ["-loop", "1", "-framerate", str(FPS), "-t", f"{dur:.3f}",
                    "-i", os.path.join(SRC, s["src"])]
        elif s.get("black"):
            cmd += ["-f", "lavfi", "-i",
                    f"color=c=black:s={W}x{H}:r={FPS}:d={dur + 0.3:.2f}"]
        else:
            cmd += ["-i", os.path.join(SRC, s["src"])]
        for e in extra:
            # a looped still never reaches EOF, so cap every plate or the
            # filtergraph runs forever
            cmd += ["-loop", "1", "-framerate", str(FPS), "-t", f"{dur + 0.6:.3f}", "-i", e]
        cmd += ["-filter_complex", graph, "-map", "[outv]", "-an", "-t", f"{dur:.3f}",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "8",
                "-pix_fmt", "yuv420p10le", "-g", "48", dst]
        print(f"  pass1 {key}")
        run(cmd)
    return outs


def pass2(outs, W, H, out, crf, preset, codec, grain, scale):
    idx = {k: i for i, k in enumerate(ORDER)}
    cmd = [FF, "-hide_banner", "-y", "-loglevel", "error"]
    for k in ORDER:
        cmd += ["-i", outs[k]]
    g = []
    for k in ORDER:
        g.append(f"[{idx[k]}:v]settb=1/{FPS},fps={FPS},format=yuv420p10le[{k}]")

    def one(x, f):
        n = f"{x}_{f}"
        g.append(f"[{x}]{f}[{n}]")
        return n

    def two(x, y, f):
        n = f"{x}_{y}_{f}"
        g.append(f"[{x}][{y}]{f}[{n}]")
        return n

    a = one("s1", "split=1")
    t = dur_of("s1")
    for i in range(1, len(ORDER)):
        k = ORDER[i]
        d = XF.get(k, 0.0)
        src = one(k, "split=1")
        if d > 0:
            a = two(a, src, f"xfade=transition=fade:duration={d:.3f}:offset={t - d:.3f}")
            t += dur_of(k) - d
        else:
            a = two(a, src, "concat=n=2:v=1:a=0")
            t += dur_of(k)

    fin = one(a, f"format=gbrp16le,noise=alls={grain}:allf=t+u,format=yuv420p")
    cmd += ["-filter_complex", ";\n".join(g), "-map", f"[{fin}]", "-an",
            "-r", str(FPS), "-t", f"{t:.3f}"]
    if codec == "h264":
        cmd += ["-c:v", "libx264", "-profile:v", "high", "-level", "4.1",
                "-preset", preset, "-crf", str(crf), "-pix_fmt", "yuv420p",
                "-g", "48", "-keyint_min", "48", "-movflags", "+faststart"]
    else:
        cmd += ["-c:v", "libvpx-vp9", "-crf", str(crf), "-b:v", "0",
                "-pix_fmt", "yuv420p", "-row-mt", "1", "-deadline", "good",
                "-cpu-used", "2", "-g", "48"]
    cmd += [out]
    print(f"  pass2 -> {out}  ({t:.2f}s)")
    run(cmd)
    return t


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--out", default=None)
    ap.add_argument("--crf", type=int, default=22)
    ap.add_argument("--preset", default="slow")
    ap.add_argument("--grain", type=int, default=GRAIN)
    ap.add_argument("--codec", default="h264", choices=["h264", "vp9"])
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()

    os.makedirs(WORK, exist_ok=True)
    os.makedirs(OUTD, exist_ok=True)
    W, H = int(round(BASE_W * a.scale)), int(round(BASE_H * a.scale))
    outs = pass1(W, H, a.scale, a.force)
    ext = "webm" if a.codec == "vp9" else "mp4"
    out = a.out or os.path.join(OUTD, f"about-hero-xray.{ext}")
    pass2(outs, W, H, out, a.crf, a.preset, a.codec, a.grain, a.scale)
    print("wrote", out)


if __name__ == "__main__":
    main()
