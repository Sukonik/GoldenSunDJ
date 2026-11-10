#!/usr/bin/env python3
"""Builds the GoldenSunDJ glass icon set (assets/icons/glass-<id>-<black|white>-<size>.png).
Style: Material Design tile (rounded square, soft elevation) in hand-blown Italian (Murano) glass:
translucent color that is deep at the thick rim and luminous in the center, a window highlight,
a pale lattimo swirl, tiny trapped air bubbles, and the GoldenSun emblem printed on top.
Needs: pillow, numpy. Usage: python3 tools/make_glass_icons.py"""
import math, os, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "icons")
MASK = os.path.join(HERE, "..", "assets", "brand", "emblem-mask-512.png")
S = 1024  # supersample

# id -> (name, [edge, mid, light] colors, optional gradient stops for opal)
ICONS = {
    "cobalt-disc":  ("Glass Blue",   [(14, 44, 190), (40, 122, 255), (160, 220, 255)], None),
    "gold-disc":    ("Amber",        [(185, 96, 0), (255, 170, 22), (255, 228, 130)], None),
    "silver-cd":    ("Cristallo",    [(112, 134, 162), (196, 212, 230), (246, 250, 255)], None),
    "rainbow-cd":   ("Opal",         [(150, 40, 190), (95, 200, 255), (255, 200, 240)], [(255, 95, 210), (53, 224, 255), (150, 95, 255)]),
    "studio-black": ("Smoke",        [(30, 18, 8), (118, 66, 18), (255, 170, 60)], None),
    "pink-cans":    ("Rose",         [(165, 16, 96), (255, 95, 168), (255, 195, 228)], None),
    "mint-buds":    ("Emerald",      [(6, 112, 84), (61, 238, 176), (196, 255, 236)], None),
    "sunset-cans":  ("Ruby",         [(140, 14, 28), (255, 77, 94), (255, 182, 70)], [(255, 190, 70), (255, 85, 96), (200, 25, 55)]),
}
SIZES = [32, 64]                 # every icon: favicon sizes
DEFAULT_SIZES = [180, 192, 512]  # only the default (glass blue, black logo): home screen + PWA


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def mix(a, b, t):
    return a * (1 - t[..., None]) + b * t[..., None]


def render(icon_id, logo, simple=False):
    name, (edge, mid, light), stops = ICONS[icon_id]
    edge, mid, light = [np.array(c, np.float32) / 255 for c in (edge, mid, light)]
    rng = random.Random(icon_id)
    y, x = np.mgrid[0:S, 0:S].astype(np.float32)
    x = (x / (S - 1)) * 2 - 1
    y = (y / (S - 1)) * 2 - 1
    half, rad = 0.84, 0.36
    qx, qy = np.abs(x) - (half - rad), np.abs(y) - (half - rad)
    d = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - rad  # <0 inside
    alpha = 1 - smooth(-0.004, 0.004, d)
    depth = np.clip(-d / 0.55, 0, 1)                                    # 0 at the rim, 1 deep inside
    lit = np.clip(0.5 - 0.35 * (x + y), 0, 1)                           # light from the top left

    # body: deep at the thick rim, luminous where the glass is thin
    t = depth ** 0.55
    body = mix(np.broadcast_to(edge, (S, S, 3)), np.broadcast_to(mid, (S, S, 3)), t)
    if stops:
        g = np.clip((x * 0.6 + y * 0.8 + 1) / 2, 0, 1)
        c = [np.array(s, np.float32) / 255 for s in stops]
        grad = mix(np.broadcast_to(c[0], (S, S, 3)), np.broadcast_to(c[1], (S, S, 3)), smooth(0, 0.55, g))
        grad = mix(grad, np.broadcast_to(c[2], (S, S, 3)), smooth(0.5, 1, g))
        body = mix(body, grad, np.full((S, S), 0.82, np.float32) * (0.55 + 0.45 * t))
    body = body * (0.82 + 0.3 * lit[..., None])
    # glowing core (light passing through)
    core = np.exp(-((x + 0.1) ** 2 + (y + 0.12) ** 2) / 0.28)
    body = body + light * (0.38 * core[..., None])
    # warm caustic near the bottom
    caus = np.exp(-((x - 0.1) ** 2 / 0.22 + (y - 0.72) ** 2 / 0.05))
    body = body + (light * 0.5 + mid * 0.2) * (0.28 * caus[..., None])
    # thick rim darkening + bright inner rim line on the lit side
    rim = np.exp(-np.maximum(-d, 0) / 0.05)
    body = body * (1 - 0.28 * rim[..., None])
    rimline = np.exp(-((-d - 0.035) / 0.012) ** 2) * (0.25 + 0.75 * lit)
    body = body + 0.55 * rimline[..., None]

    # window highlight (top-left crescent) and a slim reflection on the right
    def ell(cx, cy, ax, ay, ang):
        ca, sa = math.cos(ang), math.sin(ang)
        u = (x - cx) * ca + (y - cy) * sa
        v = -(x - cx) * sa + (y - cy) * ca
        return (u / ax) ** 2 + (v / ay) ** 2
    cres = smooth(1.0, 0.82, ell(-0.34, -0.5, 0.62, 0.2, -0.45)) - smooth(1.0, 0.82, ell(-0.3, -0.4, 0.6, 0.2, -0.45))
    body = body + np.clip(cres, 0, 1)[..., None] * 0.55
    streak = smooth(0.7, 0.45, np.abs(((x - 0.62) * 0.94 + (y + 0.05) * 0.3) / 0.045)) * smooth(0.55, 0.3, np.abs(y + 0.1) / 0.55)
    body = body + 0.28 * streak[..., None]

    img = Image.fromarray((np.clip(body, 0, 1) * 255).astype(np.uint8), "RGB").convert("RGBA")

    # lattimo swirl (pale twisted ribbon) and trapped air bubbles (skipped on tiny favicons)
    sw = Image.new("L", (S, S), 0)
    dr = ImageDraw.Draw(sw)
    pts = []
    for i in range(0, 520):
        th = i / 520 * 5.4 * math.pi
        r = 0.05 + 0.115 * th / (math.pi)
        pts.append((S / 2 + (r * 0.95 * math.cos(th + 0.6)) * S / 2 + 0.06 * S, S / 2 + (r * math.sin(th + 0.6)) * S / 2 + 0.05 * S))
    dr.line(pts, fill=70, width=int(S * 0.016))
    pts2 = [(S - px + 0.0 * S, S - py) for px, py in pts]
    dr.line(pts2, fill=40, width=int(S * 0.01))
    sw = sw.filter(ImageFilter.GaussianBlur(S * 0.004))
    swm = Image.new("RGBA", (S, S), (255, 255, 255, 0)); swm.putalpha(sw)
    if not simple:
        img = Image.alpha_composite(img, swm)

    bub = Image.new("RGBA", (S, S), (0, 0, 0, 0)); bd = ImageDraw.Draw(bub)
    for _ in range(9):
        for _try in range(40):
            bx, by, br = rng.uniform(-0.7, 0.7), rng.uniform(-0.7, 0.7), rng.uniform(0.012, 0.034)
            if math.hypot(bx, by) > 0.42 and math.hypot(bx, by) < 0.7:
                break
        cx, cy, rr = (bx + 1) / 2 * S, (by + 1) / 2 * S, br * S / 2 * 2
        bd.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(255, 255, 255, 22), outline=(255, 255, 255, 120), width=max(1, int(rr * 0.18)))
        bd.ellipse([cx - rr * 0.5, cy - rr * 0.6, cx - rr * 0.1, cy - rr * 0.2], fill=(255, 255, 255, 210))
    bub = bub.filter(ImageFilter.GaussianBlur(0.8))
    if not simple:
        img = Image.alpha_composite(img, bub)

    # the emblem, printed on the glass
    m = Image.open(MASK).convert("RGBA").getchannel("A")
    lsz = int(S * 0.9 * (0.74 if simple else 0.60))
    m = m.resize((lsz, lsz), Image.LANCZOS)
    pos = ((S - lsz) // 2, (S - lsz) // 2 + int(S * 0.005))
    hi = Image.new("RGBA", (S, S), (0, 0, 0, 0))                    # light catching the edge below the print
    hl = Image.new("RGBA", (lsz, lsz), (255, 255, 255, 0)); hl.putalpha(m.point(lambda v: int(v * 0.42)))
    hi.paste(hl, (pos[0] + int(S * 0.006), pos[1] + int(S * 0.010)), hl)
    hi = hi.filter(ImageFilter.GaussianBlur(S * 0.0025))
    img = Image.alpha_composite(img, hi)
    col = (10, 11, 15) if logo == "black" else (255, 255, 255)
    lg = Image.new("RGBA", (lsz, lsz), col + (0,)); lg.putalpha(m.point(lambda v: int(v * 0.93)))
    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0)); layer.paste(lg, pos, lg)
    img = Image.alpha_composite(img, layer)
    # gloss over the print (glass in front of it)
    gl = np.clip(smooth(0.1, -0.7, (x + y * 1.1)) * 0.16, 0, 1)
    gloss = Image.new("RGBA", (S, S), (255, 255, 255, 0)); gloss.putalpha(Image.fromarray((gl * 255).astype(np.uint8)))
    img = Image.alpha_composite(img, gloss)

    a = Image.fromarray((np.clip(alpha, 0, 1) * 255).astype(np.uint8), "L")
    img.putalpha(Image.fromarray((np.array(img.getchannel("A"), np.float32) * np.clip(alpha, 0, 1)).astype(np.uint8), "L"))
    return img


def with_elevation(tile, size):
    """Material elevation: soft shadow under the tile (only for icons big enough to show it)."""
    if size < 120:
        return tile.resize((size, size), Image.LANCZOS)
    big = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    a = tile.getchannel("A").point(lambda v: int(v * 0.45))
    sh.putalpha(a); sh = sh.filter(ImageFilter.GaussianBlur(S * 0.018))
    big.paste(sh, (0, int(S * 0.022)), sh)
    big = Image.alpha_composite(big, tile)
    return big.resize((size, size), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    for icon_id in ICONS:
        for logo in ("black", "white"):
            tile, small = render(icon_id, logo), render(icon_id, logo, simple=True)
            for size in SIZES + (DEFAULT_SIZES if (icon_id == "cobalt-disc" and logo == "black") else []):
                with_elevation(small if size <= 64 else tile, size).save(os.path.join(OUT, "glass-%s-%s-%d.png" % (icon_id, logo, size)), optimize=True)
            print("built", icon_id, logo)


if __name__ == "__main__":
    main()
