"""cover.py: full-bleed reel covers that also survive the Instagram profile grid.

  python pipeline/cover.py <spec.json>

The grid shows only about the middle 630x1120 px of a 1080x1920 cover (measured on our own profile, 2026-10-19),
but the cover is also seen full screen. So it is designed at full size: the headline set large inside the visible
zone, a real moment of the reel (node + panel, or the character scene) enlarged under it, and the reel's own
background filling every edge. One spec entry per reel:
  dark reels:  {"slug", "t", "lines": [[text, "white"|"coral"]...], "art": [x0, y0, x1, y1]}
  paper reel:  {"slug", "t", "title_t", "paper": true, "ground"?: y of the ink ground (paper-kit reels: 1474)}
Writes videos/<slug>/05_render/cover.jpg and cover-tile-preview.png (what the grid shows).
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
W, H = 1080, 1920
SAFE = (225, 490, 855, 1610)
INK = {"white": (245, 245, 245), "coral": (255, 107, 90)}
PAPER_INK = {"ink": (21, 21, 21), "red": (200, 57, 43)}
FONT = ROOT / "_runtime" / "fonts" / "inter" / "Inter[opsz,wght].ttf"


def frame(slug: str, t: float) -> Image.Image:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t}", "-i", str(ROOT / "videos" / slug / "05_render" / f"{slug}-final.mp4"),
                          "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    return Image.frombytes("RGB", (W, H), raw)


def font(size: int) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(FONT), size)
    try:
        f.set_variation_by_axes([32, 850])
    except Exception:
        pass
    return f


def dark(spec: dict) -> Image.Image:
    f = frame(spec["slug"], spec["t"])
    width = SAFE[2] - SAFE[0] + 10
    probe = ImageDraw.Draw(Image.new("RGB", (8, 8)))
    size = 130
    while max(probe.textlength(t, font=font(size)) for t, _ in spec["lines"]) > width - 50:
        size -= 2
    ft, lh = font(size), int(size * 1.1)
    art = f.crop(tuple(spec["art"]))
    art = art.resize((width, int(art.height * width / art.width)), Image.LANCZOS)
    block = len(spec["lines"]) * lh + 50 + art.height
    top = (SAFE[1] + SAFE[3]) // 2 - block // 2
    art_y = top + len(spec["lines"]) * lh + 50
    # the reel's canvas everywhere: its tint glowing behind the art, fading to the edges, and the dot grid on top
    bg = np.array(f.getpixel((20, 60)), dtype=np.float32)
    tint = np.asarray(f.crop((0, 1000, 160, 1200)), dtype=np.float32).reshape(-1, 3).mean(0)
    a = np.clip(1 - np.abs(np.arange(H) - (art_y + art.height / 2)) / 900, 0, 1)[:, None] ** 1.5
    rows = (bg * (1 - a) + tint * a).astype(np.uint8)
    c = Image.fromarray(np.repeat(rows[:, None, :], W, axis=1))
    d = ImageDraw.Draw(c)
    dot = tuple(min(255, int(v) + 22) for v in tint)
    for y in range(18, H, 36):
        for x in range(18, W, 36):
            d.ellipse((x - 1.5, y - 1.5, x + 1.5, y + 1.5), fill=dot)
    c.paste(art, ((W - art.width) // 2, art_y))
    for i, (t, col) in enumerate(spec["lines"]):
        d.text(((W - d.textlength(t, font=ft)) / 2, top + i * lh), t, font=ft, fill=INK[col])
    return c


def paper(spec: dict) -> Image.Image:
    f, tf = frame(spec["slug"], spec["t"]), frame(spec["slug"], spec["title_t"])
    lum = lambda im, y0, y1: np.asarray(im.convert("L"))[y0:y1]
    c = Image.new("RGB", (W, H), f.getpixel((20, 60)))
    ink = np.asarray(tf.convert("RGB"), dtype=np.int16)[300:700]
    ink = (ink.min(2) < 120) | ((ink[..., 0] - ink[..., 1]) > 60)       # dark ink or red title text
    r, cols = np.where(ink.sum(1) > 5)[0] + 300, np.where(ink.sum(0) > 2)[0]
    title = tf.crop((max(0, cols.min() - 16), r.min() - 12, min(W, cols.max() + 16), r.max() + 12))  # tight to the words
    tw = SAFE[2] - SAFE[0] - 40
    title = title.resize((tw, int(title.height * tw / title.width)), Image.LANCZOS)
    ground = spec.get("ground") or int(np.where((lum(f, 0, H) < 60).mean(1) > 0.3)[0].min())
    cap = spec.get("scene_top") or int(np.where((lum(f, 300, 700) < 120).sum(1) > 5)[0].max()) + 330   # below the spoken caption
    s = 0.62
    top = 1420 - int(ground * s)
    floor_y = top + int(ground * s) + 10
    c.paste(f.crop((0, ground + 10, W, H)).resize((W, H - floor_y), Image.LANCZOS), (0, floor_y))
    scene = f.crop((0, cap, W, ground + 10)).resize((int(W * s), int((ground + 10 - cap) * s)), Image.LANCZOS)
    c.paste(scene, ((W - scene.width) // 2, top + int(cap * s)))
    if spec.get("lines"):  # set the title in the reel's serif instead of cropping a long one-line title
        d, f2 = ImageDraw.Draw(c), lambda n: ImageFont.truetype("C:/Windows/Fonts/georgiab.ttf", n)
        size = 110
        while max(d.textlength(t, font=f2(size)) for t, _ in spec["lines"]) > SAFE[2] - SAFE[0] - 30:
            size -= 2
        for i, (t, col) in enumerate(spec["lines"]):
            d.text(((W - d.textlength(t, font=f2(size))) / 2, SAFE[1] + 30 + i * int(size * 1.15)), t, font=f2(size), fill=PAPER_INK[col])
    else:
        c.paste(title, ((W - title.width) // 2, SAFE[1] + 40))
    return c


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    for spec in json.loads(Path(sys.argv[1]).read_text(encoding="utf-8")):
        c = paper(spec) if spec.get("paper") else dark(spec)
        out = ROOT / "videos" / spec["slug"] / "05_render" / "cover.jpg"
        c.save(out, quality=95)
        c.crop(SAFE).resize((315, 560), Image.LANCZOS).save(out.with_name("cover-tile-preview.png"))
        print("->", out)


if __name__ == "__main__":
    main()
