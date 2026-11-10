#!/usr/bin/env python3
"""Assemble the About-page x-ray hero video.

v3: the edit is the user's own shot list, in order. There is no colour
grading -- no curves, no gamma, no hue rotation, no saturation, no
colour balance. Every source goes through untouched apart from camera
movement, grain, a light vignette and clarity, none of which change
colour relationships.

The stills get camera moves so they are not dead frames: continuous
dollies, quantised (stop-motion) pushes, snap-ins and drifts. Two of the
clips carry speed ramps -- the cock decelerates into the mechanism, the
back shot accelerates out of it.

Two passes, because a single filter graph with fourteen inputs gets
OOM-killed on a 4 GB box: pass 1 renders each segment to a 10-bit
intermediate, pass 2 assembles and applies the shared film pass.

    python3 tools/xray/edit.py                    # full res, h264
    python3 tools/xray/edit.py --codec vp9        # webm
    python3 tools/xray/edit.py --scale 0.5        # fast preview
"""

import argparse
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "assets", "xray", "source")
WORK = os.path.join(ROOT, "assets", "xray", "work")
PLATES = os.path.join(ROOT, "tools", "xray", "plates")
OUTD = os.path.join(ROOT, "public", "videos")
FF = "/tmp/ffmpeg"

BASE_W, BASE_H = 1280, 720
FPS = 24
GRAIN = 7

# ---------------------------------------------------------------------------
# The shot list, in the order the user specified.
#
#   minimax        super close up, opens the video
#   top view       topdown.png
#   sneaker        a_Sneaker_detail_shot
#   standing up    Standing Up.mp4, cut as he rises
#   cocking        Cocking.mp4, ramped down into the mechanism
#   back shot      Back shot.mp4, ramped up, slow then fast
#   soft box       Soft box shooting.mp4, the shot, then the lights go out
#   black          the darkness
#   bullet falls   Bullet falls.mp4, opens the dark scene
#   sit down       6.mp4
#   sit down       6.mp4
#   end            extreme close up x-ray.png, held, becomes X-ray mode
#
# In/out points come from measured motion, not guesswork:
#   Standing Up   motion climbs 4.9 -> 12.1 peaking at 2.75-3.12s, so 1.5-4.5
#   Soft box      motion peaks 18.7 at 3.6-4.0s, luma 140 -> 1 by 5.0s
#   6.mp4         motion decays 15.7 -> 2.0; the settle is at the end
#   Cocking       a cut at 3.5s (motion 9.97 against a 0.5-1.2 baseline), the
#                 action then builds from 5.5s and is still climbing at the
#                 end -- so 5.5-8.75 is the usable half
#   Back shot     only 3.2s; motion decays 5.7 -> 2.7 and luma 78 -> 48
#   Bullet falls  luma bottoms at 10 near 3.0s and climbs to 63 by 4.6s, so
#                 2.9-4.72 starts in the dark and reveals
# ---------------------------------------------------------------------------
SEG = {
    "mx":  dict(src="minimax.mp4", t0=0.00, t1=3.00, move="stepprint"),
    "td":  dict(src="topdown.png", still=True, dur=1.80, move="push"),
    "sn":  dict(src="sneaker.webp", still=True, dur=1.60, move="drift"),
    "su":  dict(src="standingup.mp4", t0=1.50, t1=4.50, move="none"),
    # The cock. Ramped 1.9x down to 0.8x: it arrives at speed and
    # decelerates into the mechanism, so the slide going back is legible
    # rather than a blur. The back shot after it ramps the other way, which
    # gives the pair a breath-in / breath-out instead of two identical lurches.
    "ck":  dict(src="cocking.mp4", t0=5.50, t1=8.75, move="none", ramp=(1.9, 0.8)),
    # From behind, slow at first then fast at the end, as asked.
    "bs":  dict(src="backshot.mp4", t0=0.00, t1=3.16, move="none", ramp=(0.7, 2.5)),
    "sb":  dict(src="5.mp4", t0=1.50, t1=5.60, move="none"),
    "blk": dict(black=True, dur=0.50),
    # The whole clip, start to finish, as asked. Ramped 1.2x -> 0.75x: brisk
    # through the setup and the muzzle flash, easing down through the drop
    # and the dark. The casing falls at source 2.45-2.85, which is 52-60%
    # along, by which point it is running at ~0.86x -- the fall gets 0.45s
    # of screen time instead of 0.33s at a flat rate, without the setup
    # dragging. Verified on the master: speck holds row 31 to 2.50s, is at
    # row 98 by 2.83s, frame bottoms at luma 9 at 3.00s.
    "bf":  dict(src="bulletfalls.mp4", t0=0.00, t1=4.75, move="none",
                ramp=(1.2, 0.75)),
    # The tuck. This used to cover 0.20-2.10 and then jump straight to
    # 4.90, which skipped 2.67-3.33 -- the busiest stretch in the whole
    # clip (motion 13.7-14.3 against a 7-10 baseline). That skip was the
    # gun disappearing rather than being put away. It now runs 0.20-4.90
    # unbroken and ramps 0.8x -> 1.05x, so it starts unhurried and only
    # picks up once he has settled into it.
    "tk":  dict(src="6.mp4", t0=0.20, t1=4.90, move="none", ramp=(0.8, 1.05)),
    "s6":  dict(src="6.mp4", t0=4.90, t1=7.70, move="settle"),
    "en":  dict(src="endframe-macro-xray.png", still=True, dur=2.60, move="creep"),
}

ORDER = ["mx", "td", "sn", "su", "ck", "bs", "sb", "blk", "bf",
         "tk", "s6", "en"]

# Dissolve into each key. The cock is a hard cut -- it is the load, an action
# beat, and a dissolve there softens the one moment that should snap.
# The bullet dissolve is short at 0.18s: at 0.30s a third of the drop played
# out under the fade from black, which is the one thing that has to be legible.
XF = {"td": 0.30, "sn": 0.30, "su": 0.35, "ck": 0.08,
      "bs": 0.30, "sb": 0.35, "blk": 0.30, "bf": 0.18,
      "tk": 0.30, "s6": 0.30, "en": 0.55}


def ramp_pts(t0, t1, r0, r1):
    """setpts expression for a constant-acceleration speed ramp.

    The rate runs at r0 where the clip is cut in and r1 where it leaves, so
    output time is quadratic in source time -- which makes 1/rate linear,
    meaning the speed changes by the same amount every second rather than
    lurching. Doing it linearly in the rate instead needs a log and produces
    a visible knee at the head of the clip.

    PTS arrives in timebase units: convert to seconds, apply, convert back.
    Safe because fps= has already run, so TB is 1/FPS by this point.

    No pow(x,2): a comma separates filters in a filtergraph, so pow() would
    end the setpts filter halfway through the expression.
    """
    d = t1 - t0
    a = 1.0 / r0
    b = (1.0 / r1 - 1.0 / r0) / (2.0 * d)
    src = "((PTS-STARTPTS)*TB)"
    return f"({a:.6f}*{src}+{b:.8f}*{src}*{src})/TB"


def dur_of(key):
    s = SEG[key]
    if "still" in s or "black" in s:
        return s["dur"]
    if "ramp" in s:
        # Output time is the average of the two reciprocal rates, so a ramp
        # from 0.7x to 2.5x does not simply run for the source duration.
        r0, r1 = s["ramp"]
        return (s["t1"] - s["t0"]) * (1.0 / r0 + 1.0 / r1) / 2.0
    return s["t1"] - s["t0"]


# ---------------------------------------------------------------------------
# Camera moves for stills
# ---------------------------------------------------------------------------

def still_move(kind, W, H, n):
    """Camera move for a still, smooth-eased, as a two-layer parallax.

    Every move is a smoothstep of the frame counter, so nothing steps and
    nothing stops: the earlier 'step' move quantised the zoom into six
    jumps, and the 'snap' move reached full zoom in the first third then
    held dead still, which read as the picture freezing rather than as a
    camera settling. Both are gone.

    The parallax is two renders of the same plate at different zooms and
    drift rates, composited through a long-feathered mask: a sharp centre
    moving faster over a softer, slower edge. With one flat image that is
    the only way to get genuine differential motion, and the feather is
    long enough that it reads as focus falloff rather than a border.
    """
    # z0 -> z1 zoom, and dx/dy drift as a fraction of the slack the zoom
    # opens up. Varied per shot so they do not all read the same.
    M = {
        #            z0    z1    dx     dy
        "push":   (1.02, 1.13,  0.06,  0.00),
        "pull":   (1.13, 1.02, -0.05,  0.02),
        "drift":  (1.03, 1.15,  0.10,  0.05),
        "lift":   (1.04, 1.16, -0.07, -0.04),
        "creep":  (1.01, 1.06,  0.03,  0.00),
    }
    z0, z1, dx, dy = M.get(kind, M["push"])
    # smoothstep, so acceleration is continuous at both ends
    t = f"(0.5-0.5*cos(PI*on/{n}))"
    zf = f"{z0}+({z1 - z0})*{t}"
    # Background: a shallower version of the same zoom, drifting less, so the
    # edges lag behind the centre. 0.70 / 0.62 rather than a bigger split --
    # at 0.55 the surround was sliding 5-16px against a near-locked centre
    # (20-64px full-res), which stopped reading as depth and started reading
    # as a soft halo dragging around a frozen picture.

    zb = f"{1.0 + (z0 - 1.0) * 0.70}+({(z1 - z0) * 0.70})*{t}"
    fx = f"(iw-iw/zoom)*(0.50+{dx}*{t})"
    fy = f"(ih-ih/zoom)*(0.50+{dy}*{t})"
    bx = f"(iw-iw/zoom)*(0.50+{dx * 0.62}*{t})"
    by = f"(ih-ih/zoom)*(0.50+{dy * 0.62}*{t})"

    fg = (f"zoompan=z='{zf}':x='{fx}':y='{fy}':d=1:s={W}x{H}:fps={FPS}")
    bg = (f"zoompan=z='{zb}':x='{bx}':y='{by}':d=1:s={W}x{H}:fps={FPS}")
    return fg, bg


def clip_move(kind, W, H, n):
    """Temporal treatment for a moving clip. No colour is touched."""
    if kind == "stepprint":
        # hold every other frame: a stutter that reads as step-printed film
        return f"fps={FPS // 2},fps={FPS}"
    if kind == "settle":
        # ease down into the settle so the cut to the held frame is calm
        return (f"setpts='PTS*(1+0.55*min(1,max(0,(T-{n / FPS * 0.55})"
                f"/{n / FPS * 0.45})))'")
    return "null"


# ---------------------------------------------------------------------------
# Non-colour film pass
# ---------------------------------------------------------------------------

def finish(W, H, vig_in, scale=1.0):
    """micro-contrast -> light halation -> vignette.

    Deliberately no curves, gamma, hue, saturation or colour balance: the
    instruction was no grading. Micro-contrast is luma-only, so it cannot
    shift colour; the glow and vignette only touch bloom and edge falloff.
    """
    glow = f"gblur=sigma={11 * scale:.1f}"
    small = "scale=iw/6:ih/6"
    back = f"scale={W}:{H}:flags=lanczos"
    thr = "0/0 0.62/0 0.78/1 1/1"
    # Clarity runs in 8-bit RGB and the glow/vignette in 16-bit, and that
    # split is not arbitrary: blend's all_expr is mis-scaled above 8 bit, so
    # 'A+k*(A-B)' at gbrp16le lifted a near-black frame (mean 0.1) to 41 --
    # it turned the lights-out beat into grey mush. Verified both ways:
    # 8-bit 24.8/7.7/1.3/0.1 against a source of 23.9/7.4/1.3/0.1, versus
    # 16-bit 38.6/28.5/38.1/39.6. The vignette is the other way round and
    # must stay 16-bit: multiplying in YUV corrupts the chroma planes, since
    # a white vignette is U=V=128 and 128*128/255 is a strong colour cast,
    # so that one multiplies in RGB.
    return (
        f"format=gbrp,"
        # Luma-only unsharp, replacing the old clarity. That was a blend with
        # all_expr='A+k*(A-B)', and it put magenta fringes around every
        # high-contrast edge: the source endframe peaks at +1 magenta, that
        # filter took it to +233 over 1.1% of the frame. That was the pink
        # outline around the bones. Unsharp with a zero chroma amount cannot
        # touch colour at all, and measures +1.0 -- clean.
        f"unsharp=5:5:0.35:5:5:0.0,"
        f"format=gbrp16le,split=2[bl_a][bl_b];[bl_b]{small},{glow},{back},"
        f"curves=r='{thr}':g='{thr}':b='{thr}'[bl_g];"
        f"[bl_a][bl_g]blend=all_mode=normal:all_expr='A+0.22*(B-A*B/65535)'[li];"
        f"[{vig_in}]scale={W}:{H}:flags=lanczos,format=gbrp16le[vg];"
        f"[li][vg]blend=all_mode=multiply[vd];"
        f"[vd]format=yuv420p10le,setsar=1,settb=1/{FPS},fps={FPS}[outv]"
    )


def flat_canvas(sw, sh, W, H):
    """Scale to fill 1280x720 and centre-crop. No portrait content anywhere."""
    return (f"scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,"
            f"crop={W}:{H}")


# ---------------------------------------------------------------------------

def seg_graph(key, W, H, scale):
    s = SEG[key]
    dur = dur_of(key)
    n = max(1, int(round(dur * FPS)))

    if s.get("black"):
        return (f"[0:v]format=yuv420p10le,setsar=1,settb=1/{FPS},fps={FPS},"
                f"trim=0:{dur},setpts=PTS-STARTPTS[outv]"), []

    extra = [os.path.join(PLATES, "vignette.png")]
    vig_in = "1:v"

    if s.get("still"):
        fg, bg = still_move(s.get("move", "push"), W, H, n)
        # maskedmerge, not a blend with all_expr: this is the same filter
        # family that produced the magenta fringes, so the composite goes
        # through a mask input instead.
        #
        # The mask MUST be three-plane. maskedmerge takes its plane count
        # from the mask, so a format=gray mask made it write plane 0's
        # result into G and B as well -- every still rendered greyscale.
        # Measured on the end frame: gray mask sat 0.0%, gbrp mask 28.7%
        # against a source of 25.9%. This is why the bones looked grey.
        head = (
            f"[0:v]fps={FPS},format=yuv420p10le,split=2[fg_in][bg_in];"
            f"[fg_in]{fg},format=gbrp[fg];"
            f"[bg_in]{bg},format=gbrp,gblur=sigma={5 * scale:.1f},"
            f"eq=brightness=-0.05[bg];"
            f"[2:v]scale={W}:{H}:flags=lanczos,format=gbrp[mk];"
            f"[bg][fg][mk]maskedmerge,setsar=1,settb=1/{FPS}[cv]"
        )
        extra.append(os.path.join(PLATES, "parallax_mask.png"))
    else:
        cm = clip_move(s.get("move", "none"), W, H, n)
        pre = f"fps={FPS},trim={s['t0']}:{s['t1']:.3f},"
        if "ramp" in s:
            r0, r1 = s["ramp"]
            pre += f"setpts={ramp_pts(s['t0'], s['t1'], r0, r1)},"
        else:
            pre += "setpts=PTS-STARTPTS,"
        head = (f"[0:v]{pre}format=yuv420p10le,{cm},"
                f"{flat_canvas(0, 0, W, H)},setsar=1,settb=1/{FPS}[cv]")

    return head + ";[cv]" + finish(W, H, vig_in, scale), extra


def _cached_size(path):
    r = subprocess.run([FF, "-hide_banner", "-i", path], capture_output=True, text=True)
    m = re.search(r", (\d+)x(\d+)[,\s]", r.stderr)
    return (int(m.group(1)), int(m.group(2))) if m else None


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-4000:])
        raise SystemExit(f"ffmpeg failed ({r.returncode})")


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
            cmd += ["-loop", "1", "-framerate", str(FPS),
                    "-t", f"{dur + 0.6:.3f}", "-i", e]
        cmd += ["-filter_complex", graph, "-map", "[outv]", "-an",
                "-t", f"{dur:.3f}", "-c:v", "libx264", "-preset", "veryfast",
                "-crf", "8", "-pix_fmt", "yuv420p10le", "-g", "48", dst]
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
        nn = f"{x}_{f}"
        g.append(f"[{x}]{f}[{nn}]")
        return nn

    def two(x, y, f):
        nn = f"{x}_{y}_{f}"
        g.append(f"[{x}][{y}]{f}[{nn}]")
        return nn

    cur = ORDER[0]
    for k in ORDER[1:]:
        d = XF.get(k, 0.3)
        # On the accumulated timeline the k-th clip has to start fading in
        # one dissolve before the end of everything joined so far.
        off = sum(dur_of(j) for j in ORDER[:ORDER.index(k)]) \
            - sum(XF.get(j, 0.0) for j in ORDER[1:ORDER.index(k) + 1])
        cur = two(cur, k, f"xfade=transition=fade:duration={d}:offset={max(off, 0):.3f}")

    # grain last, over the assembled timeline, so every source shares it
    gs = max(1, int(round(grain * scale)))
    cur = one(cur, f"noise=alls={gs}:allf=t+u,format=yuv420p10le")
    g.append(f"[{cur}]format=yuv420p,setsar=1[outv]")

    cmd += ["-filter_complex", ";".join(g), "-map", "[outv]", "-an"]
    if codec == "vp9":
        cmd += ["-c:v", "libvpx-vp9", "-crf", str(crf), "-b:v", "0",
                "-row-mt", "1", "-deadline", "good", "-cpu-used", "2",
                "-g", "48", "-pix_fmt", "yuv420p"]
    else:
        cmd += ["-c:v", "libx264", "-preset", preset, "-crf", str(crf),
                "-g", "48", "-pix_fmt", "yuv420p",
                "-profile:v", "high", "-movflags", "+faststart"]
    cmd += [out]
    run(cmd)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--out", default=None)
    ap.add_argument("--crf", type=int, default=20)
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
    total = sum(dur_of(k) for k in ORDER) - sum(XF.values())
    print(f"  pass2 -> {out}  ({total:.2f}s)")
    pass2(outs, W, H, out, a.crf, a.preset, a.codec, a.grain, a.scale)
    print("wrote", out)


if __name__ == "__main__":
    main()
