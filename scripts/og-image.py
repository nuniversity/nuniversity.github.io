#!/usr/bin/env python3
"""Generate public/og-image.png (1200x630) brand card."""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
OUT = Path(__file__).resolve().parents[1] / "public" / "og-image.png"
FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")


def load_font(name: str, size: int) -> ImageFont.FreeTypeFont:
    path = FONT_DIR / name
    if not path.exists():
        print(f"missing font: {path}", file=sys.stderr)
        sys.exit(1)
    return ImageFont.truetype(str(path), size)


def main() -> None:
    img = Image.new("RGB", (W, H))
    px = img.load()
    top = (59, 130, 246)
    bottom = (147, 51, 234)
    for y in range(H):
        t = y / (H - 1)
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        for x in range(W):
            px[x, y] = (r, g, b)

    draw = ImageDraw.Draw(img)
    badge = (80, 80, 240, 140)
    draw.rounded_rectangle(badge, radius=24, fill=(255, 255, 255))
    badge_font = load_font("DejaVuSans-Bold.ttf", 56)
    draw.text((110, 95), "NU", font=badge_font, fill=(59, 130, 246))

    title_font = load_font("DejaVuSans-Bold.ttf", 96)
    draw.text((80, 280), "Nuniversity", font=title_font, fill=(255, 255, 255))

    sub_font = load_font("DejaVuSans.ttf", 40)
    draw.text((82, 400), "Learn, Code, and Grow", font=sub_font, fill=(226, 232, 240))

    url_font = load_font("DejaVuSans.ttf", 28)
    draw.text((82, 540), "nuniversity.github.io", font=url_font, fill=(191, 219, 254))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
