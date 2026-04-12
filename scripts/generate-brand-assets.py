#!/usr/bin/env python3
"""Build public brand assets from repo-root logo.png (crop, alpha, PWA sizes)."""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[1]
SRC = REPO / "logo.png"
OUT_DIR = REPO / "apps" / "web" / "public"

# rgb below this (all channels) becomes transparent background
BLACK_CUTOFF = 42
# final in-app / marketing logo (square, transparent)
LOGO_SIZE = 512
# maskable safe zone: content fits in this fraction of the canvas (centered)
MASKABLE_INNER = 0.78
THEME_DARK = (31, 41, 55)  # #1f2937 — matches manifest theme_color
SPLASH_LIGHT = (249, 250, 251)  # #f9fafb — matches manifest background_color


def rgba_from_rgb(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r <= BLACK_CUTOFF and g <= BLACK_CUTOFF and b <= BLACK_CUTOFF:
                px[x, y] = (0, 0, 0, 0)
            else:
                px[x, y] = (r, g, b, a)
    return rgba


def crop_to_alpha(im: Image.Image) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    return im.crop(bbox)


def pad_square(im: Image.Image) -> Image.Image:
    w, h = im.size
    side = max(w, h)
    out = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    ox = (side - w) // 2
    oy = (side - h) // 2
    out.paste(im, (ox, oy), im)
    return out


def paste_scaled(canvas: Image.Image, src: Image.Image, scale: float) -> None:
    """paste rgb/rgba src centered on canvas, scaled to fraction of min(canvas)."""
    cw, ch = canvas.size
    target = int(min(cw, ch) * scale)
    sq = pad_square(src)
    thumb = sq.resize((target, target), Image.Resampling.LANCZOS)
    x = (cw - target) // 2
    y = (ch - target) // 2
    if thumb.mode == "RGBA":
        canvas.paste(thumb, (x, y), thumb)
    else:
        canvas.paste(thumb, (x, y))


def main() -> int:
    if not SRC.is_file():
        print(f"missing source: {SRC}", file=sys.stderr)
        return 1
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    raw = Image.open(SRC).convert("RGB")
    cut = crop_to_alpha(rgba_from_rgb(raw))
    square = pad_square(cut)
    logo = square.resize((LOGO_SIZE, LOGO_SIZE), Image.Resampling.LANCZOS)
    logo.save(OUT_DIR / "logo.png", optimize=True, compress_level=9)

    # pwa / favicon sources (square rgb for opaque tiles)
    rgb_square = Image.new("RGB", square.size, SPLASH_LIGHT)
    rgb_square.paste(square, mask=square.split()[3])

    rgb_square.resize((192, 192), Image.Resampling.LANCZOS).save(
        OUT_DIR / "pwa-icon-192.png", optimize=True
    )

    any512 = Image.new("RGB", (512, 512), SPLASH_LIGHT)
    paste_scaled(any512, square, 0.88)
    any512.save(OUT_DIR / "pwa-icon-512-any.png", optimize=True)

    mask512 = Image.new("RGB", (512, 512), THEME_DARK)
    paste_scaled(mask512, square, MASKABLE_INNER)
    mask512.save(OUT_DIR / "pwa-icon-512-maskable.png", optimize=True)

    apple = Image.new("RGB", (180, 180), SPLASH_LIGHT)
    paste_scaled(apple, square, 0.82)
    apple.save(OUT_DIR / "apple-touch-icon.png", optimize=True)

    fav32 = rgb_square.resize((32, 32), Image.Resampling.LANCZOS)
    fav16 = rgb_square.resize((16, 16), Image.Resampling.LANCZOS)
    fav16.save(OUT_DIR / "favicon-16x16.png", optimize=True, compress_level=9)
    fav32.save(OUT_DIR / "favicon-32x32.png", optimize=True, compress_level=9)
    fav32.save(
        OUT_DIR / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32)],
    )

    print(f"wrote assets to {OUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
