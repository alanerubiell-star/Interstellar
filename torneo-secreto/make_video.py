#!/usr/bin/env python3
"""TORNEO SECRETO - Leyendas Liga MX.

Fan tribute inspired by the 2002 "secret tournament in a cage on a cargo ship"
football commercial format. Everything (backgrounds, cage, signs, titles,
music and SFX) is generated procedurally; the only external inputs are the
nine 3-player team photos in ./assets.

Usage:  python3 make_video.py [--out torneo_secreto.mp4] [--preview]
"""
import argparse
import math
import os
import subprocess
import sys
import wave
from multiprocessing import Pool

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1920, 1080, 30
SR = 48000
DUR = 81.0
BAR = 70  # letterbox height

F_TITLE = "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf"
F_BOLD = "/usr/share/fonts/opentype/inter/Inter-Black.otf"
F_MONO = "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-ExtraBold.ttf"

# name, file, nickname lines, club, accent RGB
TEAMS = [
    ("pumas", ["CANTERA", "DE ORO"], "PUMAS UNAM", (214, 168, 52)),
    ("atlas", ["LA", "ACADEMIA"], "ATLAS FC", (200, 30, 40)),
    ("toluca", ["DIABLOS", "ROJOS"], "DEPORTIVO TOLUCA", (220, 30, 40)),
    ("santos", ["GUERREROS", "DE LA LAGUNA"], "SANTOS LAGUNA", (40, 160, 70)),
    ("necaxa", ["LOS RAYOS", "DEL 95"], "CLUB NECAXA", (225, 40, 45)),
    ("tigres", ["GARRA", "FELINA"], "TIGRES UANL", (250, 190, 20)),
    ("monterrey", ["LA", "PANDILLA"], "RAYADOS DE MONTERREY", (60, 90, 190)),
    ("cruzazul", ["LA", "MÁQUINA"], "CRUZ AZUL", (40, 80, 220)),
    ("america", ["LAS", "ÁGUILAS"], "CLUB AMÉRICA", (250, 210, 30)),
]
NT = len(TEAMS)

# timeline (seconds)
T_S2, T_S3, T_INT = 4.0, 7.0, 10.0
SHOT = 4.0
SIGN_PHASE = 1.0
T_WALL = T_INT + NT * SHOT  # 46
T_MATCH = T_WALL + 6.0  # 52
PLAY_CARD, PLAY_REAL = 0.6, 3.9
PLAY = PLAY_CARD + PLAY_REAL  # 4.5
NPLAY = 4
T_MONT = T_MATCH + NPLAY * PLAY  # 70
T_TITLE = T_MONT + 4.0  # 74


def font(path, size):
    return ImageFont.truetype(path, size)


def ease_out(x):
    x = min(max(x, 0.0), 1.0)
    return 1 - (1 - x) ** 3


def clamp01(x):
    return min(max(x, 0.0), 1.0)


# ----------------------------------------------------------------------------
# Asset generation
# ----------------------------------------------------------------------------
RNG = np.random.default_rng(7)


def make_steel(w, h):
    """Dark riveted steel wall of a ship hold."""
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    noise = RNG.standard_normal((h // 4 + 1, w // 4 + 1)).astype(np.float32)
    noise = np.array(Image.fromarray(noise).resize((w, h), Image.BICUBIC))
    streak = np.convolve(RNG.standard_normal(w), np.ones(7) / 7 * 2.5, "same").astype(np.float32)
    streak = streak[None, :].repeat(h, 0)
    v = 30 + 6 * noise + 5 * streak - 10 * (y / h)
    panel = 240
    seam = (np.abs((x % panel) - panel / 2) > panel / 2 - 3).astype(np.float32)
    v -= 14 * seam
    hseam = (np.abs((y % 360) - 180) > 177).astype(np.float32)
    v -= 12 * hseam
    img = np.stack([v * 0.95, v * 1.0, v * 1.08], -1)
    # rust tint blotches
    rust = np.array(Image.fromarray(RNG.random((h // 40 + 1, w // 40 + 1)).astype(np.float32))
                    .resize((w, h), Image.BICUBIC))
    rust = np.clip((rust - 0.6) * 3, 0, 1)[..., None]
    img = img * (1 - 0.35 * rust) + rust * np.array([70, 38, 20]) * 0.35
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    for px in range(0, w, panel):
        for py in range(30, h, 60):
            for cx in (px + 10, px + panel - 10):
                d.ellipse([cx - 4, py - 4, cx + 4, py + 4], fill=(58, 60, 64))
                d.ellipse([cx - 2, py - 3, cx + 1, py], fill=(90, 92, 96))
    return im


def make_mesh(w, h, step=78, wire=4):
    """Chain-link fence (RGBA)."""
    big = 2
    im = Image.new("RGBA", (w * big, h * big), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    s = step * big
    for k in range(-h * big, w * big + h * big, s):
        d.line([(k, 0), (k + h * big, h * big)], fill=(150, 155, 160, 255), width=wire * big)
        d.line([(k, 0), (k - h * big, h * big)], fill=(110, 114, 120, 255), width=wire * big)
    im = im.resize((w, h), Image.LANCZOS)
    # shadow
    a = np.array(im).astype(np.float32)
    sh = Image.fromarray(a[..., 3].astype(np.uint8)).filter(ImageFilter.GaussianBlur(4))
    sh = np.array(sh).astype(np.float32) * 0.6
    out = np.zeros_like(a)
    alpha = np.maximum(a[..., 3], sh)
    out[..., :3] = np.where(a[..., 3:4] > 1, a[..., :3], 0)
    out[..., 3] = alpha
    return out  # float32 RGBA


def spotlight(w, h, cx, cy, rx, ry, floor=0.25):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    r = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
    return (floor + (1 - floor) * np.exp(-r)).astype(np.float32)


def vignette(w, h, strength=0.55):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    r = ((x - w / 2) / (w / 2)) ** 2 + ((y - h / 2) / (h / 2)) ** 2
    return np.clip(1 - strength * r ** 1.3, 0, 1).astype(np.float32)


def grade(img):
    """Gritty cinematic grade: contrast, teal shadows, warm highlights."""
    a = np.asarray(img).astype(np.float32) / 255
    lum = (0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2])[..., None]
    a = lum + (a - lum) * 1.12  # saturation
    a = np.clip((a - 0.5) * 1.28 + 0.44, 0, 1)  # contrast, darker
    shadows = (1 - lum) ** 2
    hi = lum ** 2
    a += shadows * np.array([-0.03, 0.01, 0.04]) + hi * np.array([0.03, 0.01, -0.03])
    return np.clip(a, 0, 1)


def stencil_text(draw_img, xy, text, fnt, fill, anchor="mm", gap=4):
    d = ImageDraw.Draw(draw_img)
    d.text(xy, text, font=fnt, fill=fill, anchor=anchor)


def make_sign(lines, idx, accent, scale=1.0):
    """Hanging metal plate with stencil team name (RGBA)."""
    sw, sh = int(640 * scale), int(330 * scale)
    a = np.asarray(make_steel(sw, sh)).astype(np.float32) * 0.7
    a[..., 0] += 6
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(im)
    b = int(8 * scale)
    d.rectangle([0, 0, sw - 1, sh - 1], outline=(18, 18, 20, 255), width=b)
    d.rectangle([b, b, sw - b - 1, sh - b - 1], outline=(80, 82, 86, 255), width=max(1, int(2 * scale)))
    for hx in (int(70 * scale), sw - int(70 * scale)):
        d.ellipse([hx - 12 * scale, 14 * scale, hx + 12 * scale, 38 * scale], fill=(10, 10, 10, 255),
                  outline=(120, 120, 120, 255))
    fs = int(92 * scale)
    fnt = font(F_MONO, fs)
    for k, ln in enumerate(lines):
        size = fs
        while fnt.getlength(ln) > sw - 70 * scale and size > 30:
            size -= 4
            fnt = font(F_MONO, size)
        y = sh * (0.42 + 0.32 * k) if len(lines) == 2 else sh / 2
        d.text((sw / 2, y), ln, font=fnt, fill=(232, 230, 222, 255), anchor="mm")
        fnt = font(F_MONO, fs)
    # stencil bridges: thin cuts through the letters
    arr = np.array(im)
    for k in range(len(lines)):
        yc = int(sh * (0.42 + 0.32 * k))
        arr[yc - int(3 * scale):yc + int(3 * scale), int(30 * scale):sw - int(30 * scale)] = \
            np.where(arr[yc - int(3 * scale):yc + int(3 * scale), int(30 * scale):sw - int(30 * scale), :1] > 150,
                     np.array([40, 40, 42, 255], np.uint8),
                     arr[yc - int(3 * scale):yc + int(3 * scale), int(30 * scale):sw - int(30 * scale)])
    im = Image.fromarray(arr)
    d = ImageDraw.Draw(im)
    d.rectangle([int(30 * scale), sh - int(26 * scale), int(30 * scale) + int(90 * scale), sh - int(18 * scale)],
                fill=accent + (255,))
    d.text((sw - int(30 * scale), sh - int(22 * scale)), f"{idx + 1:02d}", font=font(F_MONO, int(22 * scale)),
           fill=(170, 170, 165, 255), anchor="rm")
    # grime
    g = np.array(im).astype(np.float32)
    grime = RNG.random((sh, sw)).astype(np.float32)
    g[..., :3] *= (0.85 + 0.15 * grime)[..., None]
    return Image.fromarray(np.clip(g, 0, 255).astype(np.uint8))


def text_rgba(text, fnt, fill=(240, 238, 230), tracking=0, shadow=True):
    tw = int(fnt.getlength(text) + tracking * len(text) + 40)
    asc, desc = fnt.getmetrics()
    th = asc + desc + 40
    im = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x = 20
    for ch in text:
        d.text((x, 20), ch, font=fnt, fill=fill + (255,))
        x += fnt.getlength(ch) + tracking
    im = im.crop((0, 0, int(x + 20), th))
    if shadow:
        sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
        sh.putalpha(im.getchannel("A").filter(ImageFilter.GaussianBlur(10)).point(lambda v: v * 0.8))
        out = Image.alpha_composite(sh, im)
        return np.asarray(out).astype(np.float32)
    return np.asarray(im).astype(np.float32)


def blend(dst, rgba, cx, cy, alpha=1.0, anchor="center"):
    """Alpha-blend float RGBA (0..255) onto float RGB dst (0..1) in place."""
    if alpha <= 0:
        return
    h, w = rgba.shape[:2]
    if anchor == "center":
        x0, y0 = int(round(cx - w / 2)), int(round(cy - h / 2))
    else:
        x0, y0 = int(cx), int(cy)
    X0, Y0 = max(x0, 0), max(y0, 0)
    X1, Y1 = min(x0 + w, dst.shape[1]), min(y0 + h, dst.shape[0])
    if X0 >= X1 or Y0 >= Y1:
        return
    src = rgba[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0]
    a = src[..., 3:4] / 255 * alpha
    dst[Y0:Y1, X0:X1] = dst[Y0:Y1, X0:X1] * (1 - a) + src[..., :3] / 255 * a


def fit_crop(img, scale, cx=0.5, cy=0.5, out_w=W, out_h=H):
    """Resize a float/PIL image so it covers out_w x out_h at `scale`, crop around (cx,cy)."""
    iw, ih = img.size
    s = max(out_w / iw, out_h / ih) * scale
    nw, nh = iw * s, ih * s
    x0 = (nw - out_w) * cx
    y0 = (nh - out_h) * cy
    box = (x0 / s, y0 / s, (x0 + out_w) / s, (y0 + out_h) / s)
    return np.asarray(img.resize((out_w, out_h), Image.BILINEAR, box=box)).astype(np.float32) / 255


# ----------------------------------------------------------------------------
# Global assets (built once, inherited by worker processes)
# ----------------------------------------------------------------------------
A = {}


def build_assets():
    print("building assets...", flush=True)
    A["steel"] = make_steel(W + 400, H + 300)
    A["mesh"] = make_mesh(W + 200, H + 200)
    A["mesh_small"] = make_mesh(W + 200, H + 200, step=52, wire=3)
    A["vig"] = vignette(W, H)[..., None]
    A["spot"] = spotlight(W, H, W / 2, -80, 900, 900, 0.35)[..., None]
    A["grain"] = [RNG.normal(0, 1, (H // 2, W // 2)).astype(np.float32) for _ in range(6)]
    A["grain"] = [np.asarray(Image.fromarray(g).resize((W, H), Image.NEAREST))[..., None] for g in A["grain"]]
    photos, signs, lower, faces = [], [], [], []
    for i, (key, lines, club, acc) in enumerate(TEAMS):
        src = Image.open(os.path.join(HERE, "assets", key + ".jpg")).convert("RGB")
        w, h = src.size
        crop = src.crop((0, 110, w, 960))  # remove social-media UI and watermark
        g = grade(crop)
        photos.append(Image.fromarray((g * 255).astype(np.uint8)))
        signs.append(make_sign(lines, i, acc, 1.45))
        # lower third
        lt = Image.new("RGBA", (1100, 190), (0, 0, 0, 0))
        d = ImageDraw.Draw(lt)
        d.rectangle([0, 20, 14, 170], fill=acc + (255,))
        d.text((40, 14), " ".join(lines), font=font(F_TITLE, 84), fill=(245, 243, 235, 255))
        d.text((44, 118), f"{club}   ·   EQUIPO {i + 1:02d}/{NT:02d}", font=font(F_MONO, 30),
               fill=(200, 198, 190, 255))
        sh = Image.new("RGBA", lt.size, (0, 0, 0, 0))
        sh.putalpha(lt.getchannel("A").filter(ImageFilter.GaussianBlur(12)).point(lambda v: v * 0.85))
        lower.append(np.asarray(Image.alpha_composite(sh, lt)).astype(np.float32))
    A["photos"], A["signs"], A["lower"] = photos, signs, lower
    A["signs_small"] = [np.asarray(s.resize((s.width * 40 // 100, s.height * 40 // 100), Image.LANCZOS))
                        .astype(np.float32) for s in signs]
    # typography
    A["t_gulf"] = text_rgba("GOLFO DE MÉXICO", font(F_MONO, 54), tracking=14)
    A["t_time"] = text_rgba("02:47 AM", font(F_MONO, 34), fill=(190, 188, 180), tracking=10)
    A["t_ship"] = text_rgba("UN BARCO DE CARGA SIN BANDERA.", font(F_MONO, 40), tracking=6)
    A["t_27"] = text_rgba("27 LEYENDAS.", font(F_TITLE, 130))
    A["t_9"] = text_rgba("9 EQUIPOS.", font(F_TITLE, 130))
    A["t_1"] = text_rgba("1 JAULA.", font(F_TITLE, 130), fill=(255, 205, 60))
    A["t_3v3"] = text_rgba("3 VS 3", font(F_TITLE, 300))
    A["t_rule"] = text_rgba("EL PRIMER GOL GANA.", font(F_TITLE, 120), fill=(255, 205, 60))
    A["t_noref"] = text_rgba("SIN ÁRBITROS.", font(F_TITLE, 120))
    A["t_noexit"] = text_rgba("SIN SALIDA.", font(F_TITLE, 120), fill=(255, 205, 60))
    A["t_title1"] = metal_title("TORNEO", 250)
    A["t_title2"] = metal_title("SECRETO", 250)
    A["t_sub"] = text_rgba("LEYENDAS DE LA LIGA MX", font(F_MONO, 50), tracking=16)
    A["t_tag"] = text_rgba("PRIMER GOL GANA.", font(F_TITLE, 64), fill=(255, 205, 60))
    A["t_credit"] = text_rgba("HOMENAJE DE FANS  ·  FOTOS: JERSEYS LA GAMBETA", font(F_MONO, 22),
                              fill=(150, 148, 140), tracking=4, shadow=False)
    A["emblem"] = make_emblem(300)
    build_match_assets()
    print("assets ready", flush=True)


def metal_title(text, size):
    fnt = font(F_TITLE, size)
    tw = int(fnt.getlength(text)) + 60
    asc, desc = fnt.getmetrics()
    th = asc + desc + 40
    mask = Image.new("L", (tw, th), 0)
    ImageDraw.Draw(mask).text((30, 20), text, font=fnt, fill=255)
    y = np.linspace(0, 1, th)[:, None]
    grad = np.clip(0.55 + 0.45 * np.cos((y - 0.38) * 7.5), 0, 1) * 200 + 50
    rgb = np.repeat(grad[..., None], 3, -1).repeat(tw, 1)
    rgb[..., 2] += 8
    m = np.asarray(mask).astype(np.float32)
    edge = np.asarray(mask.filter(ImageFilter.FIND_EDGES)).astype(np.float32) / 255
    rgb = rgb * (1 - 0.6 * edge[..., None])
    sh = np.asarray(mask.filter(ImageFilter.GaussianBlur(16))).astype(np.float32) * 0.9
    out = np.zeros((th, tw, 4), np.float32)
    out[..., :3] = rgb * (m[..., None] / 255)
    out[..., 3] = np.maximum(m, sh)
    return out


def make_emblem(size):
    """Original emblem: a ball inside a diamond cage."""
    big = size * 3
    im = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = big / 2
    r = big * 0.46
    poly = [(c, c - r), (c + r, c), (c, c + r), (c - r, c)]
    d.polygon(poly, outline=(255, 205, 60, 255), width=big // 30)
    for k in range(-3, 4):
        off = k * r / 4
        d.line([(c - r / 2 + off, c - r / 2 - off * 0 + 0), (c + r / 2 + off, c + r / 2)],
               fill=(160, 160, 165, 140), width=big // 120)
    d.ellipse([c - r * 0.38, c - r * 0.38, c + r * 0.38, c + r * 0.38], fill=(240, 238, 230, 255))
    # pentagon panel
    pr = r * 0.13
    pts = [(c + pr * math.sin(a), c - pr * math.cos(a)) for a in np.linspace(0, 2 * math.pi, 6)[:-1]]
    d.polygon(pts, fill=(20, 20, 22, 255))
    for a in np.linspace(0, 2 * math.pi, 6)[:-1]:
        x1, y1 = c + pr * 1.7 * math.sin(a), c - pr * 1.7 * math.cos(a)
        x2, y2 = c + r * 0.38 * math.sin(a), c - r * 0.38 * math.cos(a)
        d.line([(x1, y1), (x2, y2)], fill=(20, 20, 22, 255), width=big // 90)
    im = im.resize((size, size), Image.LANCZOS)
    return np.asarray(im).astype(np.float32)


# ----------------------------------------------------------------------------
# Scene renderers -> float RGB (H, W, 3) in 0..1
# ----------------------------------------------------------------------------
def steel_bg(t, bright=1.0, dx=0.0, dy=0.0):
    st = A["steel"]
    x0 = int(200 + 120 * math.sin(t * 0.13) + dx)
    y0 = int(150 + 60 * math.sin(t * 0.09) + dy)
    x0 = min(max(x0, 0), st.width - W)
    y0 = min(max(y0, 0), st.height - H)
    a = np.asarray(st.crop((x0, y0, x0 + W, y0 + H))).astype(np.float32) / 255
    return a * bright


def add_mesh(img, t, alpha=0.55, speed=18.0, small=False):
    m = A["mesh_small" if small else "mesh"]
    ox = int((t * speed) % 78) + 40
    oy = int(30 + 10 * math.sin(t * 0.7))
    sub = m[oy:oy + H, ox:ox + W]
    a = sub[..., 3:4] / 255 * alpha
    col = sub[..., :3] / 255
    img *= (1 - a)
    img += col * a * 0.55


def flicker(t, seed):
    """Bulb switching on: returns brightness multiplier."""
    if t < 0:
        return 0.0
    steps = [(0.00, 0.15), (0.05, 0.9), (0.09, 0.25), (0.14, 1.0), (0.18, 0.45), (0.22, 1.0)]
    v = 0.15
    for s, val in steps:
        if t >= s:
            v = val
    if t > 0.22:
        r = np.random.default_rng(int(t * 30) + seed * 1000).random()
        v = 0.96 + 0.04 * r
    return v


def bulb(img, cx, cy, t, intensity=1.0):
    y0, y1 = max(0, int(cy - 260)), min(H, int(cy + 900))
    x0, x1 = max(0, int(cx - 700)), min(W, int(cx + 700))
    y, x = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    dx, dy = (x - cx), (y - cy)
    glow = np.exp(-(dx * dx + dy * dy) / (2 * 28 ** 2)) * 1.4 + np.exp(-(dx * dx + dy * dy) / (2 * 140 ** 2)) * 0.25
    cone = np.clip(1 - np.abs(dx) / (40 + 0.55 * np.clip(dy, 0, None)), 0, 1) * (dy > 0) * \
        np.exp(-np.clip(dy, 0, None) / 900) * 0.18
    img[y0:y1, x0:x1] += ((glow + cone) * intensity)[..., None] * np.array([1.0, 0.92, 0.75])


def finish(img, t, shake=0.0):
    img = img * A["vig"]
    g = A["grain"][int(t * FPS) % len(A["grain"])]
    img = img + g * 0.035
    if shake > 0:
        r = np.random.default_rng(int(t * 1000))
        dx, dy = r.integers(-int(shake), int(shake) + 1, 2)
        img = np.roll(img, (int(dy), int(dx)), (0, 1))
    img[:BAR] = 0
    img[H - BAR:] = 0
    return np.clip(img, 0, 1)


def scene_cold_open(t):
    img = steel_bg(t, 0.35)
    # rolling ship: slow tilt simulated by vertical drift of a bulb
    b = clamp01((t - 0.4) / 1.2)
    bulb(img, W * 0.5 + 40 * math.sin(t * 1.4), 160, t, 0.6 * b * flicker(t - 0.4, 1))
    img *= 0.35 + 0.65 * b
    add_mesh(img, t, 0.3)
    a1 = clamp01((t - 0.8) / 0.4) * clamp01((3.8 - t) / 0.3)
    blend(img, A["t_gulf"], W / 2, H / 2 - 60, a1)
    a2 = clamp01((t - 1.3) / 0.4) * clamp01((3.8 - t) / 0.3)
    blend(img, A["t_time"], W / 2, H / 2 + 10, a2)
    a3 = clamp01((t - 2.2) / 0.5) * clamp01((3.8 - t) / 0.3)
    blend(img, A["t_ship"], W / 2, H / 2 + 120, a3)
    return finish(img, t)


def scene_legends(t):
    lt = t - T_S2
    img = steel_bg(t, 0.5)
    bulb(img, W * 0.5 + 60 * math.sin(t * 1.3), 120, t, flicker(lt, 2))
    add_mesh(img, t, 0.6)
    hits = [0.0, 1.0, 2.0]
    for k, key in enumerate(["t_27", "t_9", "t_1"]):
        lk = lt - hits[k]
        if lk >= 0:
            pop = 1 + 0.25 * math.exp(-lk * 14)
            src = A[key]
            if abs(pop - 1) > 0.01:
                hh, ww = src.shape[:2]
                src = np.asarray(Image.fromarray(src.astype(np.uint8), "RGBA").resize(
                    (int(ww * pop), int(hh * pop)), Image.BILINEAR)).astype(np.float32)
            blend(img, src, W / 2, H / 2 - 170 + k * 170, clamp01(lk / 0.08))
    shake = 10 * max([math.exp(-(lt - h) * 12) if lt >= h else 0 for h in hits])
    return finish(img, t, shake)


def scene_rules(t):
    lt = t - T_S3
    img = steel_bg(t, 0.45)
    bulb(img, W / 2, 110, t, flicker(lt, 3) * (1.2 if lt < 1.5 else 1.0))
    add_mesh(img, t, 0.7)
    if lt < 1.5:
        s = 1.0 + 0.35 * math.exp(-lt * 10) + 0.04 * lt
        src = A["t_3v3"]
        hh, ww = src.shape[:2]
        src = np.asarray(Image.fromarray(src.astype(np.uint8), "RGBA").resize(
            (int(ww * s), int(hh * s)), Image.BILINEAR)).astype(np.float32)
        blend(img, src, W / 2, H / 2, clamp01(lt / 0.06) * clamp01((1.5 - lt) / 0.1))
        shake = 16 * math.exp(-lt * 10)
    else:
        l2 = lt - 1.5
        blend(img, A["t_rule"], W / 2, H / 2, clamp01(l2 / 0.06) * clamp01((2.85 - lt) / 0.1))
        shake = 14 * math.exp(-l2 * 10)
    if lt > 2.85:
        img *= 0.0
    return finish(img, t, shake)


def sign_frame(img, sign, lt, x_center, y_target, seed):
    """Sign dropping on chains with damped swing. lt: local time since drop."""
    drop = 0.22
    sw, sh = sign.size
    if lt < drop:
        y = -sh + (y_target + sh) * (lt / drop) ** 2
        ang = 0.0
    else:
        k = lt - drop
        y = y_target + 18 * math.exp(-k * 9) * math.sin(k * 30)
        ang = 9 * math.exp(-k * 2.6) * math.sin(k * 7.5 + seed)
    rot = sign.rotate(ang, resample=Image.BICUBIC, expand=True)
    arr = np.asarray(rot).astype(np.float32)
    # chains to hook points
    d_im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))
    d = ImageDraw.Draw(d_im)
    rad = math.radians(-ang)
    for hx in (70 * sw / 640 - sw / 2, sw / 2 - 70 * sw / 640):
        hy = 26 * sw / 640 - sh / 2
        px = x_center + hx * math.cos(rad) - hy * math.sin(rad)
        py = y + hx * math.sin(rad) + hy * math.cos(rad)
        top_x = x_center + hx * 1.4
        for j in range(0, 40):
            fx = top_x + (px - top_x) * j / 40
            fy = 0 + py * j / 40
            d.ellipse([fx - 5, fy - 9, fx + 5, fy + 9], outline=(120, 122, 126), width=3)
    img[:] = np.asarray(d_im).astype(np.float32) / 255
    blend(img, arr, x_center, y, 1.0)
    return y


def scene_team(t):
    i = min(int((t - T_INT) // SHOT), NT - 1)
    lt = t - T_INT - i * SHOT
    key, lines, club, acc = TEAMS[i]
    if lt < SIGN_PHASE:
        img = steel_bg(t, 0.42, dx=i * 37)
        bulb(img, W / 2 + 30 * math.sin(t * 2), 90, t, flicker(lt, i) * 0.9)
        # accent light wash
        img += A["spot"] * 0.06 * np.array(acc) / 255
        add_mesh(img, t, 0.5, small=True)
        sign_frame(img, A["signs"][i], lt - 0.03, W / 2, H / 2 + 40, i)
        land = lt - 0.25
        shake = 14 * math.exp(-land * 12) if land > 0 else 0
        out = finish(img, t, shake)
        if lt > SIGN_PHASE - 0.06:  # flash out
            out = np.clip(out + (lt - (SIGN_PHASE - 0.06)) / 0.06, 0, 1)
        return out
    pt = lt - SIGN_PHASE
    dur = SHOT - SIGN_PHASE
    u = pt / dur
    scale = 1.16 - 0.10 * ease_out(u)
    cx = 0.5 + 0.08 * math.sin(i * 1.7) * (1 - u)
    img = fit_crop(A["photos"][i], scale, cx, 0.2 + 0.1 * u)
    img = img * A["spot"] * 1.25 * flicker(pt, i + 20)
    img += A["spot"] * 0.04 * np.array(acc) / 255
    add_mesh(img, t, 0.42, speed=26)
    if pt < 0.08:
        img = img + (0.08 - pt) / 0.08 * 0.9
    la = ease_out((pt - 0.35) / 0.35)
    if la > 0:
        blend(img, A["lower"][i], 90 - 60 * (1 - la), H - BAR - 230, la, anchor="tl")
    out = finish(img, t, 6 * math.exp(-pt * 14))
    # glitch out at end
    if dur - pt < 0.1:
        k = (0.1 - (dur - pt)) / 0.1
        out = out.copy()
        out[..., 0] = np.roll(out[..., 0], int(30 * k), 1)
        out[..., 2] = np.roll(out[..., 2], -int(30 * k), 1)
        out *= 1 - 0.6 * k
    return out


WALL_POS = [(-1, -1), (0, -1), (1, -1), (-1, 0), (0, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]


def scene_wall(t):
    lt = t - T_WALL
    img = steel_bg(t, 0.55, dx=-lt * 40)
    bulb(img, W * 0.3, 100, t, 0.8 * flicker(lt, 40))
    bulb(img, W * 0.72, 120, t, 0.8 * flicker(lt - 0.15, 41))
    zoom = 1.0 + 0.06 * lt / 6
    for k, (gx, gy) in enumerate(WALL_POS):
        s = A["signs_small"][k]
        cx = W / 2 + gx * 440 * zoom + 25 * math.sin(k * 2.1) - lt * 12
        cy = H / 2 + gy * 250 * zoom + 15 * math.cos(k * 1.3) - 10
        appear = clamp01((lt - k * 0.12) / 0.12)
        if appear > 0:
            cy -= (1 - appear) * 80
            blend(img, s, cx, cy, appear)
    add_mesh(img, t, 0.75, speed=-30)
    if lt > 2.5:
        dark = clamp01((lt - 2.5) / 0.3) * 0.6
        img *= 1 - dark
        blend(img, A["t_noref"], W / 2, H / 2 - 80, clamp01((lt - 2.6) / 0.06))
        blend(img, A["t_noexit"], W / 2, H / 2 + 70, clamp01((lt - 4.0) / 0.06))
    sh = 0
    for h in (2.6, 4.0):
        if lt >= h:
            sh = max(sh, 12 * math.exp(-(lt - h) * 10))
    return finish(img, t, sh)


# ----------------------------------------------------------------------------
# Match plays: top-down "tactical cam" of the cage court. Original choreography.
# World units: court is 1600 x 820, goals centred on x=0 and x=1600.
# ----------------------------------------------------------------------------
CW, CH, CM, CS = 1600, 820, 200, 2  # court size, margin, supersample
TIDX = {t[0]: i for i, t in enumerate(TEAMS)}
SHORT = {"pumas": "PUMAS", "atlas": "ATLAS", "toluca": "TOLUCA", "santos": "SANTOS", "necaxa": "NECAXA",
         "tigres": "TIGRES", "monterrey": "RAYADOS", "cruzazul": "CRUZ AZUL", "america": "AMÉRICA"}
# face boxes (x, y, size) in the 110..960 crop, left / middle / right player
FACES = {
    "pumas": [(236, 238, 170), (560, 68, 147), (860, 235, 178)],
    "atlas": [(256, 44, 190), (548, 69, 174), (848, 77, 185)],
    "toluca": [(183, 236, 129), (505, 84, 171), (840, 200, 169)],
    "santos": [(247, 273, 165), (593, 2, 131), (929, 196, 215)],
    "necaxa": [(196, 138, 194), (543, 64, 173), (871, 148, 182)],
    "tigres": [(238, 183, 180), (560, 25, 171), (874, 222, 188)],
    "monterrey": [(243, 241, 160), (585, 49, 151), (884, 319, 176)],
    "cruzazul": [(201, 87, 207), (548, 73, 183), (885, 129, 197)],
    "america": [(205, 228, 191), (581, 6, 151), (897, 222, 187)],
}

# Each play: attacking team A (towards x=1600) vs B. Keyframes: (t, x, y).
# Ball keys: (t, x, y, h_end, arc_peak). Player order: [middle, left, right] photo.
PLAYS = [
    dict(name="EL CAÑO", a="america", b="cruzazul", slow=(1.35, 0.35), focus=(1150, 405), zoom=1.9, goal=2.6,
         A=[[(0, 720, 420), (0.6, 900, 410), (1.2, 1080, 405), (1.45, 1120, 380), (1.75, 1200, 440),
             (2.1, 1290, 432), (2.5, 1360, 420), (3.25, 1450, 385)],
            [(0, 520, 230), (3.25, 1150, 220)], [(0, 480, 620), (3.25, 1100, 640)]],
         B=[[(0, 1250, 400), (0.9, 1170, 405), (1.35, 1145, 405), (1.8, 1150, 395), (2.3, 1200, 380),
             (3.25, 1260, 390)],
            [(0, 1350, 230), (3.25, 1380, 300)], [(0, 1330, 600), (2.6, 1480, 480), (3.25, 1500, 470)]],
         ball=[(0, 748, 420, 0, 0), (0.3, 822, 415, 0, 0), (0.6, 928, 410, 0, 0), (0.9, 1010, 407, 0, 0),
               (1.2, 1108, 405, 0, 0), (1.6, 1215, 412, 0, 0), (1.95, 1272, 432, 0, 0), (2.25, 1335, 425, 0, 0),
               (2.6, 1600, 385, 0, 0), (3.25, 1642, 386, 0, 0)]),
    dict(name="LA PARED DE ACERO", a="pumas", b="toluca", slow=(0.78, 0.35), focus=(1120, 740), zoom=2.0,
         goal=2.45, wall=0.95,
         A=[[(0, 820, 700), (0.5, 960, 700), (0.9, 1080, 705), (1.3, 1250, 700), (1.8, 1360, 600),
             (2.3, 1420, 520), (3.25, 1480, 470)],
            [(0, 600, 300), (3.25, 1200, 280)], [(0, 560, 520), (3.25, 1100, 420)]],
         B=[[(0, 1120, 640), (0.6, 1060, 680), (1.0, 1050, 690), (1.5, 1100, 680), (3.25, 1200, 620)],
            [(0, 1400, 300), (2.0, 1470, 420), (3.25, 1480, 400)],
            [(0, 1300, 520), (1.9, 1360, 540), (3.25, 1420, 520)]],
         ball=[(0, 846, 700, 0, 0), (0.5, 986, 700, 0, 0), (0.62, 1002, 704, 0, 0), (0.95, 1130, 808, 0, 0),
               (1.3, 1266, 700, 0, 0), (1.8, 1386, 596, 0, 0), (2.05, 1402, 570, 0, 0),
               (2.45, 1600, 445, 0, 0), (3.25, 1642, 442, 0, 0)]),
    dict(name="LA CHILENA", a="atlas", b="santos", slow=(1.72, 0.35), focus=(1420, 400), zoom=2.1, goal=2.15,
         spin=(1.72, 2.05),
         A=[[(0, 1150, 560), (1.0, 1300, 500), (1.6, 1400, 420), (1.85, 1418, 405), (3.25, 1430, 400)],
            [(0, 980, 140), (0.6, 1100, 130), (1.0, 1180, 125), (3.25, 1230, 160)],
            [(0, 700, 420), (3.25, 1100, 500)]],
         B=[[(0, 1260, 560), (1.0, 1330, 480), (1.85, 1442, 452), (3.25, 1450, 462)],
            [(0, 1450, 250), (1.85, 1480, 330), (3.25, 1490, 340)], [(0, 1350, 650), (3.25, 1450, 560)]],
         ball=[(0, 1005, 140, 0, 0), (0.6, 1125, 130, 0, 0), (0.95, 1196, 128, 0, 0),
               (1.85, 1418, 398, 110, 230), (2.15, 1600, 430, 40, 0), (3.25, 1642, 430, 0, 0)]),
    dict(name="GOL DE ORO", a="tigres", b="monterrey", slow=(1.4, 0.35), focus=(900, 412), zoom=1.6, goal=2.05,
         A=[[(0, 700, 420), (0.9, 830, 420), (1.45, 878, 416), (3.25, 950, 415)],
            [(0, 560, 240), (3.25, 700, 250)], [(0, 600, 600), (0.45, 612, 598), (3.25, 760, 620)]],
         B=[[(0, 1050, 410), (1.45, 980, 412), (2.0, 1000, 410), (3.25, 1100, 400)],
            [(0, 1250, 250), (3.25, 1300, 300)], [(0, 1250, 560), (3.25, 1320, 500)]],
         ball=[(0, 586, 246, 0, 0), (0.45, 618, 586, 0, 0), (0.95, 858, 419, 0, 0), (1.45, 902, 416, 0, 0),
               (2.05, 1600, 385, 0, 70), (3.25, 1645, 386, 0, 0)]),
]


def remap(tau, play):
    """real local time -> play time (with a slow-motion window)."""
    s0, L = play["slow"]
    r = L / 1.0  # slow window lasts 1.0 s real
    if tau < s0:
        return tau
    if tau < s0 + 1.0:
        return s0 + (tau - s0) * r
    return s0 + L + (tau - s0 - 1.0)


def unmap(p, play):
    s0, L = play["slow"]
    if p < s0:
        return p
    if p < s0 + L:
        return s0 + (p - s0) / L
    return s0 + 1.0 + (p - s0 - L)


def interp_path(keys, t):
    if t <= keys[0][0]:
        return np.array(keys[0][1:3], float)
    if t >= keys[-1][0]:
        return np.array(keys[-1][1:3], float)
    P = [np.array(k[1:3], float) for k in keys]
    T = [k[0] for k in keys]
    i = max(j for j in range(len(T) - 1) if T[j] <= t)
    t0, t1 = T[i], T[i + 1]
    u = (t - t0) / (t1 - t0)

    def tan(j):
        if j == 0:
            return (P[1] - P[0]) / (T[1] - T[0])
        if j == len(P) - 1:
            return (P[-1] - P[-2]) / (T[-1] - T[-2])
        return (P[j + 1] - P[j - 1]) / (T[j + 1] - T[j - 1])

    m0, m1 = tan(i) * (t1 - t0), tan(i + 1) * (t1 - t0)
    h00, h10 = 2 * u ** 3 - 3 * u ** 2 + 1, u ** 3 - 2 * u ** 2 + u
    h01, h11 = -2 * u ** 3 + 3 * u ** 2, u ** 3 - u ** 2
    return h00 * P[i] + h10 * m0 + h01 * P[i + 1] + h11 * m1


def ball_at(keys, t):
    if t <= keys[0][0]:
        k = keys[0]
        return k[1], k[2], k[3]
    if t >= keys[-1][0]:
        k = keys[-1]
        return k[1], k[2], k[3]
    i = max(j for j in range(len(keys) - 1) if keys[j][0] <= t)
    a, b = keys[i], keys[i + 1]
    u = (t - a[0]) / (b[0] - a[0])
    ue = 1 - (1 - u) ** 1.5
    x = a[1] + (b[1] - a[1]) * ue
    y = a[2] + (b[2] - a[2]) * ue
    h = a[3] + (b[3] - a[3]) * u + 4 * b[4] * u * (1 - u)
    return x, y, h


def make_court():
    w, h = (CW + 2 * CM) * CS, (CH + 2 * CM) * CS

    def P(x, y):
        return ((x + CM) * CS, (y + CM) * CS)

    rng = np.random.default_rng(11)
    n = rng.standard_normal((h // 16 + 1, w // 16 + 1)).astype(np.float32)
    n = np.asarray(Image.fromarray(n).resize((w, h), Image.BICUBIC))
    fine = rng.standard_normal((h, w)).astype(np.float32)
    base = 44 + 6 * n + 3 * fine
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    inside = ((xx >= CM * CS) & (xx <= (CM + CW) * CS) & (yy >= CM * CS) & (yy <= (CM + CH) * CS))
    base = np.where(inside, base, base * 0.45)
    img = np.stack([base * 0.98, base, base * 1.04], -1)
    # overhead light pools
    for lx in (400, 800, 1200):
        cx, cy = P(lx, 410)
        r2 = ((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * (330 * CS) ** 2)
        img *= (1 + 0.55 * np.exp(-r2))[..., None]
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    lw = 5 * CS
    line = (200, 198, 188)
    d.rectangle([*P(0, 0), *P(CW, CH)], outline=line, width=lw)
    d.line([P(CW / 2, 0), P(CW / 2, CH)], fill=line, width=lw)
    cx, cy = P(CW / 2, CH / 2)
    d.ellipse([cx - 95 * CS, cy - 95 * CS, cx + 95 * CS, cy + 95 * CS], outline=line, width=lw)
    d.ellipse([cx - 8 * CS, cy - 8 * CS, cx + 8 * CS, cy + 8 * CS], fill=line)
    for gx, sgn in ((0, 1), (CW, -1)):
        x0, y0 = P(gx, CH / 2)
        bb = [x0 - 160 * CS, y0 - 160 * CS, x0 + 160 * CS, y0 + 160 * CS]
        d.arc(bb, -90 if sgn > 0 else 90, 90 if sgn > 0 else 270, fill=line, width=lw)
        # goal: posts + net
        gy0, gy1 = P(gx, CH / 2 - 80)[1], P(gx, CH / 2 + 80)[1]
        depth = 45 * CS * (-sgn)
        for k in range(0, 13):
            yk = gy0 + (gy1 - gy0) * k / 12
            d.line([(x0, yk), (x0 + depth, yk)], fill=(150, 150, 150), width=CS)
        for k in range(0, 5):
            xk = x0 + depth * k / 4
            d.line([(xk, gy0), (xk, gy1)], fill=(150, 150, 150), width=CS)
        d.line([(x0, gy0), (x0 + depth, gy0), (x0 + depth, gy1), (x0, gy1)], fill=(240, 240, 240), width=4 * CS)
        d.ellipse([x0 - 7 * CS, gy0 - 7 * CS, x0 + 7 * CS, gy0 + 7 * CS], fill=(250, 250, 250))
        d.ellipse([x0 - 7 * CS, gy1 - 7 * CS, x0 + 7 * CS, gy1 + 7 * CS], fill=(250, 250, 250))
    # cage fence ring (top-down) with posts
    fo = 34
    d.rectangle([*P(-fo, -fo), *P(CW + fo, CH + fo)], outline=(25, 26, 28), width=14 * CS)
    for x in range(-fo, CW + fo + 1, 200):
        for y in (-fo, CH + fo):
            px, py = P(x, y)
            d.rectangle([px - 9 * CS, py - 9 * CS, px + 9 * CS, py + 9 * CS], fill=(70, 72, 76),
                        outline=(20, 20, 20), width=2 * CS)
    for y in range(-fo, CH + fo + 1, 205):
        for x in (-fo, CW + fo):
            px, py = P(x, y)
            d.rectangle([px - 9 * CS, py - 9 * CS, px + 9 * CS, py + 9 * CS], fill=(70, 72, 76),
                        outline=(20, 20, 20), width=2 * CS)
    # fence mesh strip
    mesh = Image.new("L", im.size, 0)
    md = ImageDraw.Draw(mesh)
    st = 16 * CS
    for k in range(-h, w + h, st):
        md.line([(k, 0), (k + h, h)], fill=255, width=CS)
        md.line([(k, 0), (k - h, h)], fill=255, width=CS)
    strip = Image.new("L", im.size, 0)
    sd = ImageDraw.Draw(strip)
    sd.rectangle([*P(-fo - 22, -fo - 22), *P(CW + fo + 22, CH + fo + 22)], fill=255)
    sd.rectangle([*P(-fo + 6, -fo + 6), *P(CW + fo - 6, CH + fo - 6)], fill=0)
    mesh = Image.fromarray((np.asarray(mesh).astype(np.uint16) * np.asarray(strip) // 255).astype(np.uint8))
    im.paste((150, 152, 156), (0, 0), mesh)
    # faded centre emblem
    em = Image.fromarray(A["emblem"].astype(np.uint8), "RGBA").resize((150 * CS, 150 * CS), Image.LANCZOS)
    em.putalpha(em.getchannel("A").point(lambda v: v * 0.22))
    im.paste(em, (int(cx - 75 * CS), int(cy - 75 * CS)), em)
    return im


def make_badge(key, k, acc, size=200):
    src = Image.open(os.path.join(HERE, "assets", key + ".jpg")).convert("RGB")
    fx, fy, fs = FACES[key][k]
    cx, cy = fx + fs / 2, fy + 110 + fs * 0.52
    half = fs * 0.78
    face = src.crop((int(cx - half), int(cy - half), int(cx + half), int(cy + half))).resize((size, size),
                                                                                            Image.LANCZOS)
    face = Image.fromarray((grade(face) * 255).astype(np.uint8))
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mask = Image.new("L", (size, size), 0)
    ring = int(size * 0.09)
    ImageDraw.Draw(mask).ellipse([ring, ring, size - ring, size - ring], fill=255)
    d = ImageDraw.Draw(out)
    d.ellipse([0, 0, size - 1, size - 1], fill=(15, 15, 15, 255))
    d.ellipse([3, 3, size - 4, size - 4], fill=acc + (255,))
    out.paste(face, (0, 0), mask)
    return out


def build_match_assets():
    A["court"] = make_court()
    A["ball"] = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(A["ball"])
    d.ellipse([2, 2, 61, 61], fill=(245, 245, 240, 255), outline=(30, 30, 30, 255), width=3)
    for a in np.linspace(0, 2 * math.pi, 6)[:-1]:
        x, y = 32 + 15 * math.sin(a), 32 - 15 * math.cos(a)
        d.ellipse([x - 6, y - 6, x + 6, y + 6], fill=(30, 30, 30, 255))
    d.ellipse([25, 25, 39, 39], fill=(30, 30, 30, 255))
    shadow = Image.new("RGBA", (120, 120), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse([20, 20, 100, 100], fill=(0, 0, 0, 170))
    A["shadow"] = shadow.filter(ImageFilter.GaussianBlur(9))
    A["badges"] = {}
    for key, *_rest in TEAMS:
        acc = TEAMS[TIDX[key]][3]
        A["badges"][key] = [make_badge(key, k, acc) for k in (1, 0, 2)]  # middle, left, right
    A["vs"] = text_rgba("VS", font(F_TITLE, 220), fill=(255, 205, 60))
    A["gol"] = text_rgba("¡GOL!", font(F_TITLE, 260), fill=(255, 205, 60))
    for i, pl in enumerate(PLAYS):
        pl["title"] = text_rgba(f"JUGADA {i + 1:02d}  ·  {pl['name']}", font(F_TITLE, 64))
        pl["sub"] = text_rgba(f"{SHORT[pl['a']]} VS {SHORT[pl['b']]}", font(F_MONO, 30), fill=(200, 198, 190),
                              tracking=6)
        pl["score"] = [scoreboard(pl["a"], pl["b"], g) for g in (0, 1)]
        pl["slow_txt"] = text_rgba("CÁMARA LENTA", font(F_MONO, 26), fill=(255, 205, 60), tracking=8)


def scoreboard(a, b, ga):
    w, h = 760, 74
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w - 1, h - 1], fill=(12, 12, 14, 225))
    d.rectangle([0, 0, 12, h - 1], fill=TEAMS[TIDX[a]][3] + (255,))
    d.rectangle([w - 13, 0, w - 1, h - 1], fill=TEAMS[TIDX[b]][3] + (255,))
    f = font(F_MONO, 32)
    d.text((34, h / 2), SHORT[a], font=f, fill=(240, 238, 230, 255), anchor="lm")
    d.text((w - 34, h / 2), SHORT[b], font=f, fill=(240, 238, 230, 255), anchor="rm")
    d.rectangle([w / 2 - 70, 8, w / 2 + 70, h - 9], fill=(255, 205, 60, 255) if ga else (40, 40, 44, 255))
    d.text((w / 2, h / 2), f"{ga} - 0", font=font(F_TITLE, 40), fill=(15, 15, 15, 255) if ga else
           (240, 238, 230, 255), anchor="mm")
    return np.asarray(im).astype(np.float32)


def scene_match(t):
    pi = min(int((t - T_MATCH) // PLAY), NPLAY - 1)
    pl = PLAYS[pi]
    lt = t - T_MATCH - pi * PLAY
    ta, tb = TIDX[pl["a"]], TIDX[pl["b"]]
    if lt < PLAY_CARD:  # VS card
        half = W // 2
        img = np.zeros((H, W, 3), np.float32)
        slide = 1 - ease_out(lt / 0.25)
        la = fit_crop(A["photos"][ta], 1.05, 0.5, 0.25, half, H)
        lb = fit_crop(A["photos"][tb], 1.05, 0.5, 0.25, half, H)
        off = int(slide * half)
        img[:, : half - off] = la[:, off:]
        img[:, half + off:] = lb[:, : half - off]
        img[:, half - 4: half + 4] = np.array(TEAMS[ta][3]) / 255
        img *= A["spot"] * 1.1
        s = 1 + 0.4 * math.exp(-lt * 12)
        vs = A["vs"]
        vs = np.asarray(Image.fromarray(vs.astype(np.uint8), "RGBA").resize(
            (int(vs.shape[1] * s), int(vs.shape[0] * s)), Image.BILINEAR)).astype(np.float32)
        blend(img, vs, W / 2, H / 2, clamp01((lt - 0.12) / 0.06))
        if lt < 0.05:
            img += 0.7
        return finish(img, t, 12 * math.exp(-lt * 10))

    tau = lt - PLAY_CARD
    p = remap(tau, pl)
    s0, L = pl["slow"]
    # camera: zoom into the action during slow motion
    bump = clamp01((tau - (s0 - 0.35)) / 0.35) * clamp01(((s0 + 1.0 + 0.35) - tau) / 0.35)
    bump = bump * bump * (3 - 2 * bump)
    z = 1 + (pl["zoom"] - 1) * bump
    f = np.array([800.0, 410.0]) + (np.array(pl["focus"]) - np.array([800.0, 410.0])) * bump
    hx, hy = W / 2 / z, H / 2 / z
    f[0] = min(max(f[0], -CM + hx), CW + CM - hx)
    f[1] = min(max(f[1], -CM + hy), CH + CM - hy)
    # shakes
    shake = 0.0
    g = pl["goal"]
    if p >= g:
        shake = 18 * math.exp(-(tau - unmap(g, pl)) * 6)
    if "wall" in pl and p >= pl["wall"]:
        shake = max(shake, 10 * math.exp(-(tau - unmap(pl["wall"], pl)) * 9))
    box = ((f[0] - hx + CM) * CS, (f[1] - hy + CM) * CS, (f[0] + hx + CM) * CS, (f[1] + hy + CM) * CS)
    frame = A["court"].resize((W, H), Image.BILINEAR, box=box)

    def S(x, y):
        return ((x - f[0]) * z + W / 2, (y - f[1]) * z + H / 2)

    # net bulge after goal
    if p >= g:
        k = clamp01((tau - unmap(g, pl)) / 0.15) * math.exp(-max(0, tau - unmap(g, pl) - 0.15) * 2.5)
        gx, gy = S(CW + 22, CH / 2)
        glow = Image.new("RGBA", frame.size, (0, 0, 0, 0))
        ImageDraw.Draw(glow).ellipse([gx - 70 * z, gy - 95 * z, gx + 70 * z, gy + 95 * z],
                                     fill=(255, 215, 90, int(150 * k)))
        frame = Image.alpha_composite(frame.convert("RGBA"), glow.filter(ImageFilter.GaussianBlur(25 * z)))
    frame = frame.convert("RGBA")
    # trail
    trail = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    td = ImageDraw.Draw(trail)
    prev = None
    for kk in range(14, -1, -1):
        bx, by, bh = ball_at(pl["ball"], remap(max(tau - kk * 0.018, 0), pl))
        cur = S(bx, by - bh * 0.6)
        if prev is not None:
            a = int(200 * (1 - kk / 15))
            td.line([prev, cur], fill=(255, 220, 120, a), width=max(2, int((9 - kk * 0.5) * z)))
        prev = cur
    # shadows first, then players, then ball
    actors = []
    for side, team in (("A", pl["a"]), ("B", pl["b"])):
        for j, keys in enumerate(pl[side]):
            x, y = interp_path(keys, p)
            actors.append((A["badges"][team][j], x, y, side == "A" and j == 0))
    R = 54
    for _b, x, y, _m in actors:
        sx, sy = S(x + 6, y + 9)
        sz = int(2.3 * R * z)
        sh = A["shadow"].resize((sz, sz), Image.BILINEAR)
        frame.alpha_composite(sh, (int(sx - sz / 2), int(sy - sz / 2)))
    bx, by, bh = ball_at(pl["ball"], p)
    sx, sy = S(bx + bh * 0.25, by + bh * 0.15)
    sz = int(30 * z * (1 + bh / 220))
    sh = A["shadow"].resize((max(sz, 4), max(sz, 4)), Image.BILINEAR)
    frame.alpha_composite(sh, (int(sx - sz / 2), int(sy - sz / 2)))
    frame = Image.alpha_composite(frame, trail)
    for badge, x, y, main in actors:
        sx, sy = S(x, y)
        sz = int(2 * R * z)
        bimg = badge.resize((sz, sz), Image.BILINEAR)
        if main and "spin" in pl and pl["spin"][0] <= p <= pl["spin"][1]:
            u = (p - pl["spin"][0]) / (pl["spin"][1] - pl["spin"][0])
            bimg = bimg.rotate(-360 * ease_out(u), resample=Image.BICUBIC)
            sc = 1 + 0.35 * math.sin(math.pi * u)
            bimg = bimg.resize((int(sz * sc), int(sz * sc)), Image.BILINEAR)
            sz = int(sz * sc)
        frame.alpha_composite(bimg, (int(sx - sz / 2), int(sy - sz / 2)))
    bsz = max(6, int(26 * z * (1 + bh / 220)))
    bimg = A["ball"].resize((bsz, bsz), Image.BILINEAR).rotate(-p * 720, resample=Image.BILINEAR)
    sx, sy = S(bx, by - bh * 0.6)
    frame.alpha_composite(bimg, (int(sx - bsz / 2), int(sy - bsz / 2)))

    img = np.asarray(frame.convert("RGB")).astype(np.float32) / 255
    img *= 0.92
    # slow motion tint
    slow_k = clamp01((tau - s0) / 0.1) * clamp01((s0 + 1.0 - tau) / 0.1)
    if slow_k > 0:
        lum = img.mean(-1, keepdims=True)
        img = img * (1 - 0.35 * slow_k) + lum * np.array([1.0, 0.95, 0.8]) * 0.35 * slow_k
        blend(img, pl["slow_txt"], W - 240, BAR + 120, slow_k)
    # overlays
    scored = 1 if p >= g else 0
    blend(img, pl["score"][scored], W / 2, BAR + 60, clamp01(tau / 0.2))
    la = ease_out((tau - 0.1) / 0.3) * clamp01((PLAY_REAL - tau) / 0.15)
    blend(img, pl["title"], 70 - 50 * (1 - la), H - BAR - 150, la, anchor="tl")
    blend(img, pl["sub"], 72 - 50 * (1 - la), H - BAR - 70, la, anchor="tl")
    if p >= g:
        gt = tau - unmap(g, pl)
        sgol = 1 + 0.5 * math.exp(-gt * 10)
        gimg = A["gol"]
        gimg = np.asarray(Image.fromarray(gimg.astype(np.uint8), "RGBA").resize(
            (int(gimg.shape[1] * sgol), int(gimg.shape[0] * sgol)), Image.BILINEAR)).astype(np.float32)
        blend(img, gimg, W / 2, H / 2 - 20, clamp01(gt / 0.05) * clamp01((PLAY_REAL - tau) / 0.12))
        if gt < 0.06:
            img = img + 0.5 * (1 - gt / 0.06)
    out = finish(img, t, shake)
    if PLAY_REAL - tau < 0.08:
        out = out * ((PLAY_REAL - tau) / 0.08)
    return out


MONT_RNG = np.random.default_rng(99)
MONT_CUTS = []
for _k in range(16):
    MONT_CUTS.append((int(MONT_RNG.integers(0, NT)), float(MONT_RNG.uniform(1.5, 2.1)),
                      float(MONT_RNG.choice([0.12, 0.5, 0.88])), bool(MONT_RNG.random() < 0.18)))


def scene_montage(t):
    lt = t - T_MONT
    k = min(int(lt / 0.25), 15)
    ct = lt - k * 0.25
    team, sc, fx, inv = MONT_CUTS[k]
    img = fit_crop(A["photos"][team], sc + 0.25 * ct, fx, 0.0)
    img = img * A["spot"] * 1.15
    add_mesh(img, t, 0.5, speed=60)
    if ct < 0.04:
        img = img + 0.5
    if inv:
        lum = img.mean(-1, keepdims=True)
        img = np.clip(lum * 1.4, 0, 1) * np.array([1.0, 0.85, 0.3])
    out = finish(img, t, 10)
    if lt > 3.85:
        out = out * clamp01((4.0 - lt) / 0.15)
    return out


def scene_title(t):
    lt = t - T_TITLE
    img = steel_bg(t, 0.3)
    bulb(img, W / 2, 80, t, 1.1 * flicker(lt - 0.1, 77))
    add_mesh(img, t, 0.55, speed=8)
    img *= clamp01(lt / 0.2)
    s = 1.0 + 0.3 * math.exp(-lt * 9)
    em = A["emblem"]
    if s != 1.0:
        em = np.asarray(Image.fromarray(em.astype(np.uint8), "RGBA").resize(
            (int(em.shape[1] * s), int(em.shape[0] * s)), Image.BILINEAR)).astype(np.float32)
    blend(img, em, W / 2, 255, clamp01(lt / 0.1))
    blend(img, A["t_title1"], W / 2 - 20 + 600 * (1 - ease_out((lt - 0.15) / 0.3)), 500,
          clamp01((lt - 0.15) / 0.1))
    blend(img, A["t_title2"], W / 2 + 20 - 600 * (1 - ease_out((lt - 0.35) / 0.3)), 700,
          clamp01((lt - 0.35) / 0.1))
    blend(img, A["t_sub"], W / 2, 850, clamp01((lt - 1.3) / 0.5))
    blend(img, A["t_tag"], W / 2, 925, clamp01((lt - 2.3) / 0.15))
    blend(img, A["t_credit"], W / 2, H - BAR - 22, clamp01((lt - 3.5) / 0.5) * 0.9)
    out = finish(img, t, 14 * math.exp(-lt * 8))
    return out * clamp01((DUR - t) / 1.2)


def render(fi):
    t = fi / FPS
    if t < T_S2:
        img = scene_cold_open(t)
    elif t < T_S3:
        img = scene_legends(t)
    elif t < T_INT:
        img = scene_rules(t)
    elif t < T_WALL:
        img = scene_team(t)
    elif t < T_MATCH:
        img = scene_wall(t)
    elif t < T_MONT:
        img = scene_match(t)
    elif t < T_TITLE:
        img = scene_montage(t)
    else:
        img = scene_title(t)
    return (np.clip(img, 0, 1) * 255).astype(np.uint8).tobytes()


# ----------------------------------------------------------------------------
# Audio
# ----------------------------------------------------------------------------
def make_audio(path):
    n = int(DUR * SR)
    L = np.zeros(n, np.float32)
    R = np.zeros(n, np.float32)
    ar = np.random.default_rng(3)

    def add(sig, t0, gain=1.0, pan=0.0):
        i0 = int(t0 * SR)
        if i0 >= n:
            return
        sig = sig[: n - i0] * gain
        L[i0:i0 + len(sig)] += sig * math.sqrt(0.5 * (1 - pan))
        R[i0:i0 + len(sig)] += sig * math.sqrt(0.5 * (1 + pan))

    def env(dur, a=0.005, d=0.2):
        tt = np.arange(int(dur * SR)) / SR
        return np.minimum(tt / a, 1) * np.exp(-tt / d)

    def lp(x, cutoff):
        # one-pole low pass (vectorised via cumulative filter in blocks)
        alpha = 1 - math.exp(-2 * math.pi * cutoff / SR)
        y = np.empty_like(x)
        acc = 0.0
        for s in range(0, len(x), 4096):
            blk = x[s:s + 4096]
            # exact IIR via scan on small block
            out = np.empty_like(blk)
            for j in range(len(blk)):
                acc += alpha * (blk[j] - acc)
                out[j] = acc
            y[s:s + 4096] = out
        return y

    def lp_fft(x, cutoff, order=2):
        X = np.fft.rfft(x)
        f = np.fft.rfftfreq(len(x), 1 / SR)
        X /= np.sqrt(1 + (f / cutoff) ** (2 * order))
        return np.fft.irfft(X, len(x)).astype(np.float32)

    def hp_fft(x, cutoff, order=2):
        X = np.fft.rfft(x)
        f = np.fft.rfftfreq(len(x), 1 / SR) + 1e-6
        X /= np.sqrt(1 + (cutoff / f) ** (2 * order))
        return np.fft.irfft(X, len(x)).astype(np.float32)

    def kick(g=1.0):
        d = 0.45
        tt = np.arange(int(d * SR)) / SR
        f = 45 + 110 * np.exp(-tt / 0.035)
        ph = 2 * np.pi * np.cumsum(f) / SR
        s = np.sin(ph) * np.exp(-tt / 0.22)
        s[:200] += ar.normal(0, 0.4, 200) * np.linspace(1, 0, 200)
        return (np.tanh(s * 1.6) * g).astype(np.float32)

    def snare():
        d = 0.3
        tt = np.arange(int(d * SR)) / SR
        nz = hp_fft(ar.normal(0, 1, len(tt)).astype(np.float32), 1500) * np.exp(-tt / 0.11)
        tone = np.sin(2 * np.pi * 185 * tt) * np.exp(-tt / 0.06)
        return (nz * 0.8 + tone * 0.6).astype(np.float32)

    def hat():
        d = 0.08
        tt = np.arange(int(d * SR)) / SR
        return (hp_fft(ar.normal(0, 1, len(tt)).astype(np.float32), 7000) * np.exp(-tt / 0.025)).astype(np.float32)

    def clang():
        d = 2.2
        tt = np.arange(int(d * SR)) / SR
        s = np.zeros_like(tt)
        for f, dec, a in [(311, 1.4, 0.5), (743, 0.9, 0.45), (1187, 0.7, 0.35), (1629, 0.5, 0.3),
                          (2251, 0.35, 0.25), (3077, 0.25, 0.2), (4410, 0.15, 0.15)]:
            f *= ar.uniform(0.97, 1.03)
            s += a * np.sin(2 * np.pi * f * tt + ar.uniform(0, 6)) * np.exp(-tt / dec)
        nz = ar.normal(0, 1, len(tt)) * np.exp(-tt / 0.02) * 0.6
        return ((s + nz) * np.minimum(tt / 0.001, 1)).astype(np.float32)

    def boom(d=4.0):
        tt = np.arange(int(d * SR)) / SR
        f = 32 + 70 * np.exp(-tt / 0.08)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 1.2)
        nz = lp_fft(ar.normal(0, 1, len(tt)).astype(np.float32), 300) * np.exp(-tt / 0.9) * 2.5
        return np.tanh((s + nz) * 1.5).astype(np.float32)

    def whoosh(d=0.6, rev=False):
        tt = np.arange(int(d * SR)) / SR
        nz = ar.normal(0, 1, len(tt)).astype(np.float32)
        nz = hp_fft(nz, 400)
        e = (tt / d) ** 2.5 if not rev else (1 - tt / d) ** 2.5
        return (lp_fft(nz, 3000) * e).astype(np.float32)

    def horn(d=3.2):
        tt = np.arange(int(d * SR)) / SR
        s = np.zeros_like(tt)
        vib = 1 + 0.004 * np.sin(2 * np.pi * 4.5 * tt)
        for f, a in [(73.4, 1.0), (110.0, 0.7), (146.8, 0.5)]:
            for h in range(1, 9):
                s += a / h * np.sin(2 * np.pi * f * h * np.cumsum(vib) / SR)
        e = np.minimum(tt / 0.35, 1) * np.minimum((d - tt) / 1.0, 1)
        return (lp_fft(s.astype(np.float32), 900) * e * 0.35).astype(np.float32)

    # ambience: hull rumble + creaks across whole piece
    rumble = lp_fft(ar.normal(0, 1, n).astype(np.float32), 90) * 3.0
    rumble *= (0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * np.arange(n) / SR)).astype(np.float32)
    add(rumble, 0, 0.35)
    add(rumble[::-1].copy(), 0, 0.2, 0.5)
    add(horn(), 0.3, 0.9, -0.2)
    add(horn(2.5), 59.2, 0.35, 0.3)

    # drone pad (D minor) from 4s
    tt = np.arange(n) / SR
    drone = np.zeros(n, np.float32)
    for f in (36.71, 73.42, 110.0, 174.6):
        drone += np.sin(2 * np.pi * f * tt + ar.uniform(0, 6)).astype(np.float32) * (0.5 if f < 80 else 0.18)
    denv = np.clip((tt - 3.5) / 2.0, 0, 1) * np.clip((T_TITLE + 0.0 - tt) / 0.05, 0, 1)
    add((drone * denv).astype(np.float32), 0, 0.22)

    # heartbeat (S2)
    for b in (4.0, 5.0, 6.0):
        add(kick(0.9), b)
        add(kick(0.6), b + 0.3)
    # S2 word hits
    for b in (4.0, 5.0, 6.0):
        add(clang(), b, 0.18, ar.uniform(-0.5, 0.5))
    # S3 rules
    add(boom(2.0), 7.0, 0.9)
    add(clang(), 7.0, 0.3)
    add(boom(1.5), 8.5, 0.9)
    add(clang(), 8.5, 0.3, 0.3)
    rtt = np.arange(int(1.4 * SR)) / SR
    riser = hp_fft(ar.normal(0, 1, len(rtt)).astype(np.float32), 800) * (rtt / 1.4) ** 3
    add(riser.astype(np.float32), 8.45, 0.35)

    # main groove 10 -> 52 (120 bpm), filtered during wall scene
    beat = 0.5
    bass_notes = [36.71, 36.71, 43.65, 49.0]
    grooveL = np.zeros(n, np.float32)
    grooveR = np.zeros(n, np.float32)
    saveL, saveR = L.copy(), R.copy()
    L[:] = 0
    R[:] = 0
    tb = T_INT
    bi = 0
    while tb < T_MONT - 1e-6:
        add(kick(), tb, 0.95)
        if bi % 4 in (1, 3):
            add(snare(), tb, 0.55, 0.1)
        for h in (0, 0.25):
            add(hat(), tb + h, 0.16 if h else 0.1, 0.4)
        # bass
        note = bass_notes[(bi // 4) % 4]
        d = 0.45
        btt = np.arange(int(d * SR)) / SR
        bs = np.tanh(np.sin(2 * np.pi * note * 2 * btt) * 2.5) * np.exp(-btt / 0.3) * np.minimum(btt / 0.01, 1)
        add(bs.astype(np.float32), tb, 0.35)
        tb += beat
        bi += 1
    grooveL, grooveR = L.copy(), R.copy()
    L[:], R[:] = saveL, saveR
    # filter the wall section (tension)
    i0, i1 = int(T_WALL * SR), int(T_MATCH * SR)
    grooveL[i0:i1] = lp_fft(grooveL[i0:i1], 450)
    grooveR[i0:i1] = lp_fft(grooveR[i0:i1], 450)
    L += grooveL
    R += grooveR

    # per-team SFX
    for i in range(NT):
        t0 = T_INT + i * SHOT
        add(whoosh(0.35), t0 - 0.35, 0.25, -0.3)
        add(clang(), t0 + 0.25, 0.42, ar.uniform(-0.4, 0.4))
        add(boom(1.2), t0 + 0.25, 0.35)
        add(whoosh(0.5, rev=True), t0 + SIGN_PHASE, 0.25, 0.3)
        # chain rattle
        for c in range(6):
            add(clang()[: int(0.08 * SR)], t0 + 0.05 + c * 0.03, 0.05, ar.uniform(-0.6, 0.6))
    # wall: sign clacks + hits
    for k in range(NT):
        add(clang()[: int(0.4 * SR)], T_WALL + k * 0.12, 0.12, ar.uniform(-0.7, 0.7))
    add(boom(1.5), T_WALL + 2.6, 0.8)
    add(boom(1.5), T_WALL + 4.0, 0.8)
    add(clang(), T_WALL + 4.0, 0.25)

    # match plays: touches, slow-mo, wall hits, goals
    def thud():
        d = 0.12
        tt = np.arange(int(d * SR)) / SR
        s = np.sin(2 * np.pi * (90 + 120 * np.exp(-tt / 0.01)) * tt) * np.exp(-tt / 0.04)
        s += hp_fft(ar.normal(0, 1, len(tt)).astype(np.float32), 2000) * np.exp(-tt / 0.01) * 0.5
        return s.astype(np.float32)

    def net():
        d = 0.7
        tt = np.arange(int(d * SR)) / SR
        nz = lp_fft(hp_fft(ar.normal(0, 1, len(tt)).astype(np.float32), 900), 5000)
        return (nz * np.minimum(tt / 0.01, 1) * np.exp(-tt / 0.18)).astype(np.float32)

    for i, pl in enumerate(PLAYS):
        base = T_MATCH + i * PLAY
        add(boom(1.2), base, 0.6)
        add(clang(), base + 0.12, 0.3)
        b0 = base + PLAY_CARD
        for k in pl["ball"]:
            if k[1] < CW and k[0] > 0:
                add(thud(), b0 + unmap(k[0], pl), 0.55, ar.uniform(-0.3, 0.3))
        add(thud(), b0, 0.5)
        s0 = pl["slow"][0]
        add(whoosh(0.5, rev=True), b0 + s0, 0.35)
        add(boom(1.0), b0 + s0, 0.3)
        if "wall" in pl:
            add(clang(), b0 + unmap(pl["wall"], pl), 0.6, 0.2)
        tg = b0 + unmap(pl["goal"], pl)
        add(net(), tg, 0.6)
        add(boom(2.0), tg, 0.9)
        add(clang(), tg + 0.02, 0.45, 0.4)
        add(clang(), tg + 0.1, 0.3, -0.4)

    # montage: 8th-note drums + riser
    for k in range(16):
        tb = T_MONT + k * 0.25
        add(kick(0.9), tb, 0.8)
        add(snare(), tb + 0.125, 0.25 + 0.03 * k, 0.2 * (-1) ** k)
        add(hat(), tb, 0.12, -0.4)
    mtt = np.arange(int(4.0 * SR)) / SR
    riser = hp_fft(ar.normal(0, 1, len(mtt)).astype(np.float32), 600) * (mtt / 4.0) ** 2.5
    fs = 200 + 1200 * (mtt / 4.0) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(fs) / SR) * (mtt / 4.0) ** 2 * 0.3
    add((riser * 0.6 + tone).astype(np.float32), T_MONT, 0.45)

    # title impact
    add(boom(5.0), T_TITLE, 1.1)
    add(clang(), T_TITLE, 0.45)
    add(clang(), T_TITLE + 0.15, 0.25, 0.5)
    add(clang(), T_TITLE + 0.35, 0.25, -0.5)
    add(boom(2.0), T_TITLE + 2.3, 0.5)

    # simple reverb
    ir_t = np.arange(int(1.1 * SR)) / SR
    ir = ar.normal(0, 1, len(ir_t)) * np.exp(-ir_t / 0.35)
    ir = lp_fft(ir.astype(np.float32), 4000)
    ir /= np.sqrt((ir ** 2).sum())

    def conv(x):
        m = len(x) + len(ir) - 1
        nfft = 1 << (m - 1).bit_length()
        y = np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]
        return y.astype(np.float32)

    L2 = L + 0.22 * conv(L)
    R2 = R + 0.22 * conv(R)
    st = np.stack([L2, R2], -1)
    fade = np.clip((DUR - np.arange(n) / SR) / 1.5, 0, 1)[:, None]
    st *= fade
    st = np.tanh(st / (np.abs(st).max() + 1e-9) * 1.6) * 0.92
    st /= np.abs(st).max()
    st *= 0.89
    with wave.open(path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes((st * 32767).astype(np.int16).tobytes())


# ----------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(HERE, "torneo_secreto.mp4"))
    ap.add_argument("--preview", action="store_true", help="dump stills instead of a video")
    ap.add_argument("--workers", type=int, default=os.cpu_count())
    args = ap.parse_args()

    build_assets()
    if args.preview:
        os.makedirs(os.path.join(HERE, "preview"), exist_ok=True)
        for t in [12.5, 49.5, 52.3, 53.5, 54.6, 55.6, 57.3, 58.4, 59.6, 62.8, 64.6, 65.6, 67.6, 68.8, 70.5, 78.0]:
            fr = np.frombuffer(render(int(t * FPS)), np.uint8).reshape(H, W, 3)
            Image.fromarray(fr).resize((960, 540)).save(os.path.join(HERE, "preview", f"t{t:05.1f}.jpg"))
        return

    wav = os.path.splitext(args.out)[0] + ".wav"
    print("rendering audio...", flush=True)
    make_audio(wav)
    nframes = int(DUR * FPS)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-i", wav, "-c:v", "libx264", "-preset", "slow", "-crf", "19",
           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest",
           args.out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    with Pool(args.workers) as pool:
        for k, buf in enumerate(pool.imap(render, range(nframes), chunksize=4)):
            proc.stdin.write(buf)
            if k % 150 == 0:
                print(f"frame {k}/{nframes}", flush=True)
    proc.stdin.close()
    proc.wait()
    os.remove(wav)
    print("done:", args.out)
    sys.exit(proc.returncode)


if __name__ == "__main__":
    main()
