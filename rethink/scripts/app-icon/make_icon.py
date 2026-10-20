"""Draws the Rethink "r." mark. Usage: make_icon.py <font.ttf> <out_dir> [preview]"""
import sys, os
from PIL import Image, ImageDraw, ImageFont

FONT = sys.argv[1]
OUT = sys.argv[2]
SUN = (255, 221, 60, 255)
INK = (27, 26, 31, 255)
TOMATO = (255, 107, 74, 255)
SS = 4  # supersample factor for smooth edges


def mark(canvas, box, scale=1.0):
    """Draw "r." centred in box=(x0,y0,x1,y1); scale is glyph height as fraction of the box."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    d = ImageDraw.Draw(canvas)
    size = int(h * scale * 1.35)
    font = ImageFont.truetype(FONT, size)
    l, t, r, b = font.getbbox("r")
    gw, gh = r - l, b - t
    dot = gh * 0.42            # dot diameter
    stroke = max(1, round(gh * 0.07))
    gap = gh * 0.05
    total_w = gw + gap + dot
    gx = x0 + (w - total_w) / 2 - l
    gy = y0 + (h - gh) / 2 - t
    d.text((gx, gy), "r", font=font, fill=INK)
    # Dot sits on the baseline of the r.
    dx = gx + l + gw + gap
    dy = gy + t + gh - dot
    d.ellipse([dx, dy, dx + dot, dy + dot], fill=TOMATO, outline=INK, width=stroke)


def render(px, kind):
    S = px * SS
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if kind == "square":      # legacy launcher: rounded square
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=S * 0.22, fill=SUN)
        mark(img, (0, 0, S, S), 0.6)
    elif kind == "round":     # legacy round launcher
        d.ellipse([0, 0, S - 1, S - 1], fill=SUN)
        mark(img, (0, 0, S, S), 0.55)
    elif kind == "full":      # iOS / Play: full bleed, the platform rounds it
        d.rectangle([0, 0, S, S], fill=SUN)
        mark(img, (0, 0, S, S), 0.6)
    elif kind == "foreground":  # adaptive: 108dp canvas, keep inside the 66dp safe zone
        inset = S * (21 / 108)
        mark(img, (inset, inset, S - inset, S - inset), 0.88)
    img = img.resize((px, px), Image.LANCZOS)
    if kind == "full":
        img = img.convert("RGB")  # iOS rejects alpha in app icons
    return img


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    if len(sys.argv) > 3 and sys.argv[3] == "preview":
        sheet = Image.new("RGBA", (4 * 300 + 50, 350), (243, 238, 227, 255))
        for i, kind in enumerate(["square", "round", "full"]):
            im = render(256, kind).convert("RGBA")
            sheet.paste(im, (20 + i * 300, 40), im)
        # adaptive preview: foreground over sun bg, circle-masked like a launcher
        fg = render(256, "foreground")
        bg = Image.new("RGBA", (256, 256), SUN)
        bg.alpha_composite(fg)
        mask = Image.new("L", (256, 256), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, 255, 255], fill=255)
        sheet.paste(bg, (20 + 3 * 300, 40), mask)
        small = render(48, "round")
        sheet.paste(small, (20, 300 - 4), small)
        sheet.save(os.path.join(OUT, "preview.png"))
        print("preview")
