"""Overlay Tony's real talking-head video onto the rendered animation.

The canvas (04_scene/scene.js) draws only the frame/ring at three spots; this puts the video inside them:
  intro portrait (rounded card, left) -> corner bubble (from the 'platform' cue) -> end-card circle (from END_T).
Usage: python composite_head.py   (reads <slug>-final.mp4, writes <slug>-head.mp4)
"""
import json, re, subprocess
from pathlib import Path
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
V = HERE.parent
SLUG = V.name
SRC = V / '01_voice' / 'source' / 'tony-cut.mp4'
IN = HERE / f'{SLUG}-final.mp4'
OUT = HERE / f'{SLUG}-head.mp4'

cues = json.loads((V / '03_cues' / 'cues.json').read_text(encoding='utf-8'))
cl = cues['cueList']
A = next(c['start'] for c in cl if c['id'] == 'platform')
END_T = float(re.search(r'END_T = ([\d.]+)', (V / '04_scene' / 'scene.js').read_text(encoding='utf-8')).group(1))

PR = (120, 40, 562, 1000, 28)          # x, y, w, h, radius (matches scene.js PR)
BUB = (1730, 875, 162)                 # centre + inner radius (ring is 165, 6 px stroke)
ENDB = (560, 540, 227)
Y0 = 121                               # top of the square crop from the 478x850 source (face centred)

def mask(path, w, h, r):
    k = 4; im = Image.new('L', (w * k, h * k), 0)
    ImageDraw.Draw(im).rounded_rectangle((0, 0, w * k - 1, h * k - 1), radius=r * k, fill=255)
    im.resize((w, h), Image.LANCZOS).save(path)

m1, m2, m3 = HERE / '_mask_portrait.png', HERE / '_mask_bubble.png', HERE / '_mask_end.png'
mask(m1, PR[2], PR[3], PR[4]); mask(m2, BUB[2] * 2, BUB[2] * 2, BUB[2]); mask(m3, ENDB[2] * 2, ENDB[2] * 2, ENDB[2])
b, e = BUB[2] * 2, ENDB[2] * 2
fc = (
    f"[1:v]fps=30,split=3[s1][s2][s3];"
    f"[s1]scale={PR[2]}:{PR[3]},format=yuva420p[p0];[p0][2:v]alphamerge,fade=t=out:st={A:.2f}:d=0.3:alpha=1[p];"
    f"[s2]crop=478:478:0:{Y0},scale={b}:{b},format=yuva420p[b0];[b0][3:v]alphamerge,"
    f"fade=t=in:st={A + 0.35:.2f}:d=0.35:alpha=1,fade=t=out:st={END_T:.2f}:d=0.2:alpha=1[bb];"
    f"[s3]crop=478:478:0:{Y0},scale={e}:{e},format=yuva420p[e0];[e0][4:v]alphamerge,fade=t=in:st={END_T + 0.45:.2f}:d=0.3:alpha=1[ee];"
    f"[0:v][p]overlay={PR[0]}:{PR[1]}[v1];[v1][bb]overlay={BUB[0] - BUB[2]}:{BUB[1] - BUB[2]}[v2];"
    f"[v2][ee]overlay={ENDB[0] - ENDB[2]}:{ENDB[1] - ENDB[2]},format=yuv420p[v]"
)
cmd = ['ffmpeg', '-loglevel', 'error', '-y', '-i', str(IN), '-i', str(SRC)]
for m in (m1, m2, m3): cmd += ['-loop', '1', '-i', str(m)]
cmd += ['-filter_complex', fc, '-map', '[v]', '-map', '0:a', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-c:a', 'copy', '-shortest', str(OUT)]
subprocess.run(cmd, check=True)
print('->', OUT, f'(bubble from {A:.2f}s, end card from {END_T:.2f}s)')
