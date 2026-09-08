"""Stamp the official TOLS T (exact SVG geometry) onto selected game covers."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path("/workspace")
LIME = (205, 243, 43, 255)
LIME_HI = (230, 255, 120, 220)
SHADOW = (8, 8, 10, 200)

# Official path in 32x32 viewBox (favicon.svg)
OUTER = [(5, 5.2), (27, 5.2), (27, 13.6), (19.6, 13.6), (19.6, 29), (12.4, 29), (12.4, 13.6), (5, 13.6)]
INNER = [(8.4, 8.6), (23.6, 8.6), (23.6, 11.2), (16.6, 11.2), (16.6, 26.4), (15.4, 26.4), (15.4, 11.2), (8.4, 11.2)]

COVERS = {
    "dice": "d8023788-a163-4b2b-8e1e-29690a224de9.jpg",
    "crash": "fef40df8-9d6a-4a67-b795-893e918e7c0b.jpg",
    "pool": "88e9bc5e-e9f4-4c5a-b12c-d32f6212f2b9.jpg",
    "roulette": "68e4761b-e01c-478f-b1ed-372ead5cfce3.jpg",
    "slots": "d1751fb8-7759-443b-bd07-72d6cd9d9aea.jpg",
    "blackjack": "06c1d3c7-a62e-4d65-b9f4-9c62b87da2f9.jpg",
    "mines": "7a1eae38-08cc-4876-a9f0-e1e711561a86.jpg",
    "keno": "06f678e7-83bd-474f-a915-86b76bdd0c40.jpg",
    "hilo": "079f60f3-f8c7-41de-a681-e1fb6f632fb1.jpg",
}


def scale(pts, s: float):
    return [(x * s, y * s) for x, y in pts]


def official_t(size: int) -> Image.Image:
    s = size / 32
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(scale(OUTER, s), fill=255)
    draw.polygon(scale(INNER, s), fill=0)
    layer = Image.new("RGBA", (size, size), LIME)
    layer.putalpha(mask)
    return layer


def relief(size: int) -> Image.Image:
    canvas = Image.new("RGBA", (size + 16, size + 16), (0, 0, 0, 0))
    t = official_t(size)
    sh = Image.new("RGBA", t.size, SHADOW)
    sh.putalpha(t.split()[-1])
    sh = sh.filter(ImageFilter.GaussianBlur(3))
    hi = Image.new("RGBA", t.size, LIME_HI)
    hi.putalpha(t.split()[-1])
    canvas.alpha_composite(sh, (10, 12))
    canvas.alpha_composite(hi, (4, 4))
    canvas.alpha_composite(t, (6, 6))
    return canvas


def stamp(src: Path, dest: Path, mark: Image.Image) -> None:
    base = Image.open(src).convert("RGBA")
    w, h = base.size
    mw = int(w * 0.28)
    mark_r = mark.resize((mw, int(mark.height * mw / mark.width)), Image.Resampling.LANCZOS)
    x = (w - mark_r.width) // 2
    y = int(h * 0.62)
    out = base.copy()
    out.alpha_composite(mark_r, (x, y))
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.convert("RGB").save(dest, "JPEG", quality=92)


def main() -> None:
    mark = relief(512)
    mark.save(ROOT / "public/brand/tols-t-relief.png")
    art = ROOT / "artifacts/imagine_images"
    dest_dir = ROOT / "public/brand/games"
    for name, file in COVERS.items():
        stamp(art / file, dest_dir / f"{name}.jpg", mark)
        print("stamped", name)


if __name__ == "__main__":
    main()
