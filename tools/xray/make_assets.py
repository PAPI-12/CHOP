"""Generate the still helper plates used by the ffmpeg filtergraphs.

Everything is deterministic so the render is reproducible.
"""
import numpy as np
from PIL import Image
import os

W, H = 1920, 1080
OUT = os.path.join(os.path.dirname(__file__), "plates")
os.makedirs(OUT, exist_ok=True)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def save(arr, name):
    Image.fromarray(arr.astype(np.uint8)).save(os.path.join(OUT, name))
    print("wrote", name, arr.shape)


# ── 1. vignette (multiply): soft elliptical falloff, ~0.52 at the corners ──
yy, xx = np.mgrid[0:H, 0:W].astype(float)
cx, cy = W / 2, H / 2
r = np.sqrt(((xx - cx) / cx) ** 2 + ((yy - cy) / cy) ** 2)
vig = (1.0 - 0.46 * smoothstep(0.42, 1.30, r)) * 255.0
save(np.repeat(vig[..., None], 3, axis=2), "vignette.png")

# ── 2. backdrop falloff (multiply): kills the blurred wings at the frame edge,
#      stays 1.0 across the sharp centre band so the feather blend is seamless ─
hx = np.abs(xx - cx)
hy = np.abs(yy - cy)
fh = 1.0 - 0.94 * smoothstep(520.0, 960.0, hx)
fv = 1.0 - 0.72 * smoothstep(400.0, 540.0, hy)
back = np.clip(fh * fv, 0, 1) * 255.0
save(np.repeat(back[..., None], 3, axis=2), "backdrop_falloff.png")

# ── 3. feather mask (alpha) for the sharp layer of a reframed vertical clip ──
def feather(w, h, fx=170.0, fy=90.0):
    y2, x2 = np.mgrid[0:h, 0:w].astype(float)
    ax = np.minimum(smoothstep(0, fx, x2), smoothstep(0, fx, w - 1 - x2))
    ay = np.minimum(smoothstep(0, fy, y2), smoothstep(0, fy, h - 1 - y2))
    return np.clip(ax * ay, 0, 1) * 255.0


save(np.repeat(feather(975, 1080)[..., None], 3, axis=2), "mask_c3.png")
save(np.repeat(feather(960, 1080)[..., None], 3, axis=2), "mask_c4.png")

# ── 4. lime x-ray sweep bar (RGBA): soft horizontal profile, peaked centre ──
BW, BH = 460, 1080
x3 = np.arange(BW, dtype=float)
prof = np.exp(-(((x3 - BW / 2) / (BW * 0.20)) ** 2))
prof = np.clip(prof, 0, 1) ** 1.6
# vertical falloff so it reads as a light band, not a hard bar
yv = np.exp(-(((np.arange(BH, dtype=float) - BH / 2) / (BH * 0.62)) ** 2))
a = (prof[None, :] * (0.35 + 0.65 * yv)[:, None]) * 255.0
sw = np.zeros((BH, BW, 4), dtype=float)
sw[..., 0] = 198   # lime-white
sw[..., 1] = 255
sw[..., 2] = 120
sw[..., 3] = np.clip(a, 0, 255) * 0.85
save(sw, "sweep.png")

# ── 5. muzzle / light-box burst (RGBA): radial, warm-white → lime ──
BS = 1700
y4, x4 = np.mgrid[0:BS, 0:BS].astype(float)
rb = np.sqrt((x4 - BS / 2) ** 2 + (y4 - BS / 2) ** 2) / (BS / 2)
core = np.clip(np.exp(-((rb / 0.30) ** 2)), 0, 1)
halo = np.clip(np.exp(-((rb / 0.95) ** 2)), 0, 1) * 0.55
alpha = np.clip(core + halo, 0, 1)
alpha *= np.clip(1.0 - smoothstep(0.75, 1.0, rb), 0, 1)
bu = np.zeros((BS, BS, 4), dtype=float)
bu[..., 0] = 255
bu[..., 1] = 252
bu[..., 2] = 226
bu[..., 3] = alpha * 255.0 * 0.92
save(bu, "burst.png")

# ── 6. full-frame exposure pop (RGBA) for the 2-frame muzzle hit ──
pop = np.zeros((H, W, 4), dtype=float)
pop[..., 0] = 255
pop[..., 1] = 255
pop[..., 2] = 248
pop[..., 3] = 255.0
save(pop, "flash_pop.png")
