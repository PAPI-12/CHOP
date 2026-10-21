#!/usr/bin/env python3
"""Cinematic X-RAY hero edit for the About page hero.

Sources (Drive folder 1b4rDWyRwHtylPyxKeyhX7mPqYGI_1PRS):
    1.webp   still   opening card  -- reality look
    2..6     clips   think -> rise -> draw -> shoot -> blackout -> lime x-ray
    7.webp   still   closing card  -- x-ray look

Every frame is reframed onto a true 1920x1080 canvas. The two vertical clips
keep a wide band of the action and extend the room outward with their own
heavily defocused, darkened, vignetted selves -- so the frame is genuinely
16:9 rather than a vertical strip parked on a black plate.

Colour: one shared grade per look (REALITY / XRAY), each source first
normalised to a common black point, white point and midtone so the cuts stop
reading as five different renders. Halation, vignette and film grain are a
single shared finishing chain, so texture and quality stay identical from the
x-ray switch all the way to the end card.

Rendered in two passes (the box has ~4 GB and one big graph OOMs):
    pass 1  one small graph per segment -> 10-bit intermediates
    pass 2  assemble -> grain -> delivery encodes
"""
import argparse, os, subprocess, sys

FF = os.environ.get("FFMPEG", "/tmp/ffmpeg")
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
PLATES = os.path.join(HERE, "plates")
SRC = os.path.join(ROOT, "assets", "xray", "source")
WORK = os.path.join(ROOT, "assets", "xray", "work")
OUTD = os.path.join(ROOT, "public", "videos")

FPS = 24

# tools/xray/calibrate.py measures every segment *after* reframing and writes
# grade.json; those numbers win so the grade is derived from real pixels.
import json as _json
_GRADE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "grade.json")

# ── timeline (seconds) ──────────────────────────────────────────────────────
TL = dict(s1=1.00, c2=1.80, c3=4.20, c4=2.30, c5=5.61,
          black=0.42, c6=5.00, s7=2.80)
XF_23, XF_34, XF_45, XF_67 = 0.18, 0.18, 0.15, 0.55

# ── exposure normalisation: each source's own measured black/white point ────
LEVELS = dict(
    s1="0/0 0.025/0.020 0.820/0.880 1/1",
    c2="0/0 0.031/0.020 0.758/0.880 1/1",
    c3="0/0 0.024/0.020 0.746/0.880 1/1",
    c4="0/0 0.020/0.020 0.833/0.880 1/1",
    c5="0/0 0.030/0.020 1/1",
    c6="0/0 0.093/0.075 0.742/0.800 1/1",
    s7="0/0 0.102/0.075 0.693/0.800 1/1",
)
GAMMA = dict(s1=1.10, c2=0.95, c3=0.86, c4=0.89, c5=1.16, c6=1.00, s7=1.00)

REALITY_CURVE = "0/0 0.200/0.165 0.420/0.405 0.620/0.655 0.850/0.885 1/1"
XRAY_CURVE = "0/0 0.180/0.150 0.450/0.460 0.750/0.800 1/1"
REALITY_TONE = "rs=-0.012:gs=-0.004:bs=0.040:rm=-0.004:gm=0:bm=0.008:rh=0.024:gh=0.008:bh=-0.032"
XRAY_TONE = "rs=-0.010:gs=0.034:bs=0.004:rm=-0.008:gm=0.018:bm=0.000:rh=0.012:gh=0.032:bh=-0.062"

GRAIN = 9
RGB_MAX = 65535          # gbrp16le peak, for the hand-written blends
CLARITY_R, CLARITY_X = 0.16, 0.14   # mid-frequency contrast per look
# The footage sits at ~96 deg and the site accent #d7ff4f is at 74. hue is
# applied as a luminance-preserving RGB matrix: the `hue` filter clips R and B
# to zero somewhere in this 16-bit chain, and colorbalance only shifts ~4 deg.
LIME_ROT = "colorchannelmixer=rr=1.0178:rg=0.1306:rb=-0.1484:gr=-0.0867:gg=0.9905:gb=0.0962:br=0.3998:bg=-0.2936:bb=0.8938"
R_GLOW, R_THRESH = 0.24, 0.62   # reality halation: only true highlights bloom
X_GLOW, X_THRESH = 0.34, 0.50   # x-ray halation: only the lime skeleton blooms
# 1280x720 keeps every source at native or downscaled size (they are
# 768-1344 px wide) -- real detail instead of upscaled pixels, far fewer bytes.
BASE_W, BASE_H = 1280, 720
SEGMENTS = ("s1", "c2", "c3", "c4", "c5", "c6", "s7", "black")
SRC_FILE = dict(s1="1.webp", c2="2.mp4", c3="3.mp4", c4="4.mp4",
                c5="5.mp4", c6="6.mp4", s7="7.webp")
DIMS = dict(s1=(1344, 768), c2=(1280, 720), c3=(786, 1178), c4=(768, 1168),
            c5=(1344, 768), c6=(1280, 704), s7=(1672, 941))
LOOK = dict(s1="r", c2="r", c3="r", c4="r", c5="r", c6="x", s7="x")
if os.path.exists(_GRADE_FILE):
    with open(_GRADE_FILE) as _f:
        _g = _json.load(_f)
    LEVELS.update(_g["LEVELS"])
    GAMMA.update(_g["GAMMA"])

# vertical reframing: fraction of the frame height kept, and the row it centres on
REFRAME = dict(c3=(0.70, 643), c4=(0.70, 582))
TRIM = dict(c4=0.10)


def feather_expr(W, fg_w, feather):
    left = (W - fg_w) / 2.0
    t = f"min(1,max(0,(min(X,W-X)-{left:.2f})/{feather:.2f}))"
    return f"{t}*({t})*(3-2*({t}))"


def grade(key):
    """normalise this source to the shared black/white point, then apply the
    look. Runs in 16-bit RGB: the colour ops need RGB semantics, and 16-bit
    keeps the deep x-ray shadows free of banding."""
    look = LOOK[key]
    lv = LEVELS[key]
    curve = XRAY_CURVE if look == "x" else REALITY_CURVE
    tone = XRAY_TONE if look == "x" else REALITY_TONE
    sat = 1.10 if look == "x" else 0.94
    return (f"format=gbrp16le,"
            f"curves=r='{lv}':g='{lv}':b='{lv}',"
            f"eq=gamma={GAMMA[key]}:saturation={sat},"
            f"curves=r='{curve}':g='{curve}':b='{curve}',"
            f"colorbalance={tone}"
            + (f",{LIME_ROT}" if look == "x" else ""))


def finish(look, W, H, vig_in, scale=1.0):
    """halation -> vignette. Grain is applied once over the whole timeline.

    Both are done in 16-bit RGB on purpose. Multiplying in YUV would scale the
    U/V planes too, which slides the hue instead of dimming the frame, and
    blend's `screen` mode misbehaves above 8-bit -- so the glow is written out
    as an explicit expression with the range normalised by hand.
    """
    strength = X_GLOW if look == "x" else R_GLOW
    thresh = X_THRESH if look == "x" else R_THRESH
    screen = f"A+{strength}*(B-A*B/{RGB_MAX})"
    clarity = CLARITY_R if look == "r" else CLARITY_X
    return (
        # clarity: lift mid-frequency structure so surfaces read as textured
        # rather than smooth. Written by hand -- unsharp is broken at 16-bit.
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


def flat_canvas(sw, sh, W, H):
    if abs(sw / sh - W / H) < 0.006:
        return f"scale={W}:{H}:flags=lanczos"
    if sw / sh > W / H:
        nh, nw = H, int(round(H * sw / sh))
    else:
        nw, nh = W, int(round(W * sh / sw))
    return f"scale={nw}:{nh}:flags=lanczos,crop={W}:{H}:(iw-{W})/2:(ih-{H})/2"


def seg_graph(key, W, H, scale):
    """pass-1 filtergraph for one segment. Returns (graph, extra_inputs)."""
    if key == "black":
        return (f"[0:v]format=yuv420p10le,setsar=1,settb=1/{FPS},fps={FPS},"
                f"trim=0:{TL[key]},setpts=PTS-STARTPTS[outv]"), []
    look = LOOK[key]
    sw, sh = DIMS[key]
    dur = TL[key]
    extra = []

    if key in ("s1", "s7"):
        pre = f"fps={FPS},"
    else:
        st = TRIM.get(key, 0.0)
        pre = f"fps={FPS},trim={st}:{st + dur:.3f},setpts=PTS-STARTPTS,"

    if key in REFRAME:
        keep, ctr = REFRAME[key]
        ch = int(round(sh * keep))
        top = max(0, min(int(round(ctr - ch / 2)), sh - ch))
        fg_w = int(round(H * sw / ch))
        fg_w += fg_w % 2                      # keep the pad offset integral
        cover_h = int(round(W * ch / sw))
        off = max(0, (cover_h - H) // 2)
        m = feather_expr(W, fg_w, 210.0 * scale)
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
            f"[bg][fg]blend=all_mode=normal:all_expr='A*(1-{m})+B*{m}'[cv]"
        )
        vig_in = "2:v"
    else:
        canvas = flat_canvas(sw, sh, W, H)
        head = f"[0:v]{pre}format=yuv420p10le,{canvas}[cv0]"
        if key == "c5":
            # muzzle / light-box burst, timed off the measured flash peak (3.375 s)
            bsz = int(round(1700 * scale))
            extra += [os.path.join(PLATES, "burst.png"),
                      os.path.join(PLATES, "flash_pop.png")]
            head += (
                f";[1:v]scale={bsz}:{bsz},format=yuva420p,"
                f"colorchannelmixer=aa=0.62,"
                f"fade=t=in:st=3.20:d=0.08:alpha=1,"
                f"fade=t=out:st=3.32:d=0.34:alpha=1[bu];"
                f"[cv0][bu]overlay=x={int(round(241 * scale))}:y={int(round(-462 * scale))}"
                f":enable='between(t,3.16,3.68)'[cv1];"
                f"[2:v]scale={W}:{H},format=yuva420p,colorchannelmixer=aa=0.13,"
                f"fade=t=in:st=3.30:d=0.03:alpha=1,"
                f"fade=t=out:st=3.34:d=0.13:alpha=1[fp];"
                f"[cv1][fp]overlay=0:0:enable='between(t,3.28,3.50)'[cv2];"
                f"[cv2]format=gbrp16le[cv]"
            )
            vig_in = "3:v"
        else:
            head += f";[cv0]format=gbrp16le[cv]"
            vig_in = "1:v"
        extra.append(os.path.join(PLATES, "vignette.png"))

    graph = head + ";[cv]" + grade(key) + "[gd];[gd]" + finish(look, W, H, vig_in, scale)
    return graph, extra


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-4000:])
        raise SystemExit(f"ffmpeg failed ({r.returncode})")


def pass1(W, H, scale, force=False):
    outs = {}
    for key in SEGMENTS:
        dst = os.path.join(WORK, f"seg_{key}.mkv")
        outs[key] = dst
        if os.path.exists(dst) and not force:
            continue
        graph, extra = seg_graph(key, W, H, scale)
        dur = TL[key]
        cmd = [FF, "-hide_banner", "-y", "-loglevel", "error", "-stats"]
        if key in ("s1", "s7"):
            cmd += ["-loop", "1", "-framerate", str(FPS), "-t", f"{dur:.3f}",
                    "-i", os.path.join(SRC, SRC_FILE[key])]
        elif key == "black":
            cmd += ["-f", "lavfi", "-i",
                    f"color=c=black:s={W}x{H}:r={FPS}:d={dur + 0.3:.2f}"]
        else:
            cmd += ["-i", os.path.join(SRC, SRC_FILE[key])]
        for e in extra:
            # a looped still never reaches EOF, so cap every plate at the
            # segment length or the filtergraph runs forever
            cmd += ["-loop", "1", "-framerate", str(FPS), "-t", f"{dur + 0.6:.3f}",
                    "-i", e]
        cmd += ["-filter_complex", graph, "-map", "[outv]", "-an",
                "-t", f"{dur:.3f}"]
        cmd += ["-c:v", "libx264", "-preset", "veryfast", "-crf", "8",
                "-pix_fmt", "yuv420p10le", "-g", "48", dst]
        print(f"  pass1 {key}")
        run(cmd)
    return outs


def pass2(outs, W, H, out, crf, preset, codec, grain, scale):
    # inputs: s1 c2 c3 c4 c5 c6 s7 black  sweep
    order = ("s1", "c2", "c3", "c4", "c5", "c6", "s7", "black")
    g = []
    idx = {k: i for i, k in enumerate(order)}
    cmd = [FF, "-hide_banner", "-y", "-loglevel", "error", "-stats"]
    for k in order:
        cmd += ["-i", outs[k]]
    cmd += ["-loop", "1", "-framerate", str(FPS), "-t", f"{TL['c6'] + 0.5:.3f}",
            "-i", os.path.join(PLATES, "sweep.png")]
    swi = len(order)

    def cat(x, y):
        o = f"k{len(g)}"
        g.append(f"[{x}][{y}]concat=n=2:v=1:a=0,settb=1/{FPS},fps={FPS}[{o}]")
        return o

    def xf(x, y, d, off):
        o = f"k{len(g)}"
        g.append(f"[{x}][{y}]xfade=transition=fade:duration={d}:offset={off:.3f},"
                 f"settb=1/{FPS},fps={FPS}[{o}]")
        return o

    def one(x, f):
        o = f"p{len(g)}"
        g.append(f"[{x}]{f}[{o}]")
        return o

    def two(x, y, f):
        o = f"p{len(g)}"
        g.append(f"[{x}][{y}]{f}[{o}]")
        return o

    # matroska intermediates carry a 1/1000 timebase -- normalise every input
    # first or concat/xfade refuse to bind
    norm = {k: one(f"{idx[k]}:v", f"settb=1/{FPS},fps={FPS}") for k in order}

    # the x-ray switch: clip 6 bleeds up out of the blackout behind a lime sweep
    c6 = norm["c6"]
    s = one(f"{swi}:v", f"scale={int(round(460 * scale))}:{H},format=yuva420p,"
                        f"colorchannelmixer=aa=0.55,"
                        f"fade=t=out:st=0.10:d=0.55:alpha=1")
    c6 = two(c6, s, "overlay=x='(W-w)*t/0.62':y=0:enable='between(t,0,0.68)'")
    c6 = one(c6, "fade=t=in:st=0:d=0.42:color=black")

    blk = one(norm["black"], f"trim=0:{TL['black']},setpts=PTS-STARTPTS")
    a = cat(norm["s1"], norm["c2"])
    t = TL["s1"] + TL["c2"]
    a = xf(a, norm["c3"], XF_23, t - XF_23); t += TL["c3"] - XF_23
    a = xf(a, norm["c4"], XF_34, t - XF_34); t += TL["c4"] - XF_34
    a = xf(a, norm["c5"], XF_45, t - XF_45); t += TL["c5"] - XF_45
    a = cat(a, blk);                         t += TL["black"]
    a = cat(a, c6);                          t += TL["c6"]
    a = xf(a, norm["s7"], XF_67, t - XF_67); t += TL["s7"] - XF_67

    # one shared film-grain pass over the whole timeline
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
    ap.add_argument("--crf", type=int, default=19)
    ap.add_argument("--preset", default="slow")
    ap.add_argument("--grain", type=int, default=GRAIN)
    ap.add_argument("--codec", default="h264", choices=["h264", "vp9"])
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--only", default=None)
    a = ap.parse_args()

    os.makedirs(WORK, exist_ok=True)
    os.makedirs(OUTD, exist_ok=True)
    W, H = int(round(BASE_W * a.scale)), int(round(BASE_H * a.scale))
    outs = pass1(W, H, a.scale, a.force)
    out = a.out or os.path.join(OUTD, "about-hero-xray.mp4")
    pass2(outs, W, H, out, a.crf, a.preset, a.codec, a.grain, a.scale)
    print("wrote", out)


if __name__ == "__main__":
    main()
