"""Genera el icono de la app (calendario con check) en varios tamaños.

Uso: python3 tools/build_icons.py  (desde la carpeta mi-semana)
"""
import os
import sys
from PIL import Image, ImageDraw

def icon(size, pad_ratio=0.0, rounded=True, background=True):
    S = 1024
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Fondo degradado índigo → violeta
    top, bot = (91, 91, 240), (156, 54, 181)
    grad = Image.new("RGBA", (S, S))
    gd = ImageDraw.Draw(grad)
    for y in range(S):
        t = y / S
        gd.line([(0, y), (S, y)], fill=tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)) + (255,))
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S, S], radius=230 if rounded else 0, fill=255)
    if background:
        img.paste(grad, (0, 0), mask)
    # Hoja de calendario
    p = int(S * (0.22 + pad_ratio))
    x0, y0, x1, y1 = p, p + 20, S - p, S - p + 20
    d.rounded_rectangle([x0, y0, x1, y1], radius=70, fill=(255, 255, 255, 255))
    head = y0 + (y1 - y0) * 0.26
    d.rounded_rectangle([x0, y0, x1, head], radius=70, fill=(255, 107, 154, 255))
    d.rectangle([x0, head - 70, x1, head], fill=(255, 107, 154, 255))
    # Anillas
    w = x1 - x0
    for cx in (x0 + w * 0.3, x0 + w * 0.7):
        d.rounded_rectangle([cx - 22, y0 - 55, cx + 22, y0 + 55], radius=22, fill=(40, 40, 70, 255))
    # Check
    cx, cy = (x0 + x1) / 2, (head + y1) / 2 + 10
    s = w * 0.22
    d.line([(cx - s, cy), (cx - s * 0.25, cy + s * 0.75), (cx + s * 1.1, cy - s * 0.75)],
           fill=(18, 184, 134, 255), width=int(w * 0.11), joint="curve")
    return img.resize((size, size), Image.LANCZOS)

out = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
icon(192).save(f"{out}/www/icons/icon-192.png")
icon(512).save(f"{out}/www/icons/icon-512.png")
bg = Image.new("RGBA", (180, 180), (91, 91, 240, 255))
bg.alpha_composite(icon(180, rounded=False))
bg.convert("RGB").save(f"{out}/www/icons/apple-touch-icon.png")
# Fuente para @capacitor/assets (iconos nativos de Android)
import os
os.makedirs(f"{out}/assets", exist_ok=True)
icon(1024, rounded=False).save(f"{out}/assets/icon-only.png")
# Foreground adaptativo: solo el calendario sobre transparente (zona segura ~66%)
icon(1024, pad_ratio=0.08, rounded=False, background=False).save(f"{out}/assets/icon-foreground.png")
Image.new("RGBA", (1024, 1024), (91, 91, 240, 255)).save(f"{out}/assets/icon-background.png")
Image.new("RGBA", (2732, 2732), (91, 91, 240, 255)).save(f"{out}/assets/splash.png")

# Icono pequeño de notificación (Android): silueta blanca sobre transparente
def stat_icon(size):
    S = 256
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([28, 44, 228, 236], radius=30, outline=(255, 255, 255, 255), width=22)
    d.rectangle([28, 44, 228, 96], fill=(255, 255, 255, 255))
    for cx in (84, 172):
        d.rounded_rectangle([cx - 12, 16, cx + 12, 70], radius=12, fill=(255, 255, 255, 255))
    d.line([(78, 160), (114, 196), (182, 128)], fill=(255, 255, 255, 255), width=24, joint="curve")
    return im.resize((size, size), Image.LANCZOS)

for folder, px in {"mdpi": 24, "hdpi": 36, "xhdpi": 48, "xxhdpi": 72, "xxxhdpi": 96}.items():
    os.makedirs(f"{out}/assets/notification/drawable-{folder}", exist_ok=True)
    stat_icon(px).save(f"{out}/assets/notification/drawable-{folder}/ic_stat_icon.png")
