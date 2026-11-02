"""edit.py: cut Tony's 7:09 Loom demo into a ~3:20 personalized demo for Vineyard Church.

  python edit.py            render 05_render/vineyard-demo.mp4 + vineyard-demo.srt
  python edit.py --plan     print the cut list and the final duration only

Source: ~/Downloads/AI Assistant for Church Visits and Q&A.mp4 (1920x1080, Loom, camera bubble bottom-left).
Word timings: source/words.json (Whisper small). No synthetic narration: every spoken word is Tony's.
Modes: WIDE = browser without the Loom bar and taskbar; WIDGET = zoom on the assistant. The camera bubble is
re-composited bottom-left in both, so Tony's face stays on screen.
"""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
SRC = Path.home() / "Downloads" / "AI Assistant for Church Visits and Q&A.mp4"
OUT = HERE / "05_render"
TMP = OUT / "_parts"
W, H, FPS = 1920, 1080, 30
WORDS = json.loads((HERE / "source" / "words.json").read_text(encoding="utf-8"))
FIX = {"calendar.": "Callender.", "Calender": "Callender", "servers,": "service,", "9": "9:30", "30": None, "930": "9:30",
       "tap": "tab", "merely": "immediately"}

MODES = {"FULL": (0, 0, 1920, 1080), "WIDE": (292, 0, 1628, 916), "WIDGET": (498, 110, 1422, 800)}  # crop x, y, w, h in source pixels
CAM = (10, 732, 280, 280)       # Loom camera bubble in the source
CAM_OUT = (24, H - 24 - 300, 300)

# (start, end, mode, [overlay names], speed). Overlays are drawn below; times inside a part are local.
CUTS = [
    (0.00, 7.54, "FULL", ["name", "local"], 1),          # how the system works… a prototype I built this morning
    (17.50, 18.52, "FULL", ["localbar"], 1),                # this is your live website
    (22.28, 28.66, "FULL", ["localbar"], 1),                # you use Wix and Planning Center… won't replace or remove anything
    (28.66, 32.74, "WIDE", ["local"], 1),                # a very frictionless integration
    (42.08, 46.86, "WIDE", [], 1),                       # very familiar with these tools; working with churches is what I do
    (50.46, 58.10, "WIDGET", ["s1"], 1),                 # a basic AI assistant that answers questions about the church
    (58.92, 66.56, "WIDGET", ["s1"], 1),                 # I'd build the knowledge base with you and keep it up to date
    (110.60, 114.40, "WIDGET", ["s1"], 1),               # let's ask: what times are services?
    (115.32, 122.50, "WIDGET", ["s1", "answer@4.9"], 1),     # click the predefined question → 9:30 and 11
    (132.06, 140.72, "WIDGET", ["s1"], 1),     # I always add guardrails: prayer requests go to a pastor
    (156.06, 163.88, "WIDE", ["s1"], 1),                 # always redirect to a human for personal questions
    (164.44, 166.86, "WIDGET", ["s2"], 1),               # now let's suppose I want to plan a visit
    (174.40, 184.58, "WIDGET", ["s2"], 1),               # it gives the address, times, parking… and a Plan My Visit link
    (184.82, 187.34, "WIDGET", ["s2"], 1),               # click it → this tab
    (220.40, 222.56, "WIDGET", ["s2"], 1),               # right here they fill in their information
    (223.72, 227.02, "WIDGET", ["s2", "demo"], 1),       # I'm planning a visit, my name is…, bringing two people
    (227.02, 238.10, "WIDGET", ["s2", "ff", "optin"], 4),  # form typing, fast-forward, no audio
    (238.16, 239.70, "WIDGET", ["s2", "optin"], 1),      # this is not my actual phone number
    (256.76, 275.82, "WIDGET", ["s3", "notsent"], 1),    # click Plan My Visit → behind the scenes → you're all set → a text like this
    (276.24, 279.16, "WIDGET", ["s3", "notsent"], 1),    # not just a text message…
    (281.90, 286.80, "WIDGET", ["s3", "proposed"], 1),   # …they can text back and reach the assistant
    (288.04, 293.54, "WIDGET", ["s3", "proposed"], 1),   # ask about upcoming events and information
    (310.08, 323.56, "WIDGET", ["s4", "simulated"], 1),  # greeter agent gets notified
    (326.58, 337.02, "WIDGET", ["s4", "simulated"], 1),  # greeter follows up by call or text
    (368.70, 390.48, "WIDE", ["flow"], 1),               # the idea is to grow the church… because we actually care
    (390.94, 397.84, "WIDGET", [], 1),                   # any questions, let's hop on a call
    (398.02, 406.18, "WIDGET", ["local2"], 1),           # again, a small demo prototype of what's possible
    (425.32, 430.08, "WIDE", [], 1),                     # thank you for watching. God bless you. Bye.
]
END_CARD = 5.0

# ── overlays (full-frame transparent PNGs) ─────────────────────────────────────
F = lambda name, size: ImageFont.truetype(f"C:/Windows/Fonts/{name}", size)
INK, GREEN, CREAM, AMBER = (24, 32, 28), (38, 84, 60), (250, 247, 240), (196, 120, 22)


def pill(d, x, y, text, font, fg, bg, pad=(22, 12), r=None, border=None):
    tw = d.textlength(text, font=font)
    h = font.size + 2 * pad[1]
    d.rounded_rectangle([x, y, x + tw + 2 * pad[0], y + h], r or h // 2, fill=bg, outline=border, width=2 if border else 0)
    d.text((x + pad[0], y + pad[1] - font.size * 0.12), text, font=font, fill=fg)
    return x + tw + 2 * pad[0]


def overlay(name):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    small, mid, big = F("seguisb.ttf", 26), F("seguisb.ttf", 30), F("segoeuib.ttf", 34)
    if name == "name":       # lower third next to the camera bubble
        d.rounded_rectangle([330, 922, 1320, 1042], 18, fill=(255, 255, 255, 255))
        d.text((366, 934), "Anthony Callender", font=F("segoeuib.ttf", 38), fill=INK)
        d.text((366, 984), "Digital Welcome System · prototype for Vineyard Church", font=small, fill=GREEN)
    elif name == "localbar":   # FULL mode: sits over the Loom "sharing your screen" bar
        t = "Interactive browser-local prototype · no changes made to Vineyard's live site"
        tw = d.textlength(t, font=small)
        d.rounded_rectangle([(W - tw) / 2 - 30, 932, (W + tw) / 2 + 30, 1028], 20, fill=(24, 32, 28, 240))
        d.text(((W - tw) / 2, 964), t, font=small, fill=(255, 255, 255))
    elif name in ("local", "local2"):
        pill(d, 28, 132, "Interactive browser-local prototype · no changes made to Vineyard's live site", small,
             (255, 255, 255), (24, 32, 28, 215))
    elif name[:1] == "s" and name[1:].isdigit():
        n = int(name[1:])
        labels = ["Ask the assistant", "Plan a visit", "Welcome text", "Greeter heads-up"]
        x = 28
        tot = sum(d.textlength(f"{i}  {l}", font=small) + 44 + 10 for i, l in enumerate(labels, 1))
        d.rounded_rectangle([16, 18, 28 + tot + 2, 84], 33, fill=(255, 255, 255, 255))
        for i, l in enumerate(labels, 1):
            on = i == n
            x = pill(d, x, 28, f"{i}  {l}", small, (255, 255, 255) if on else (90, 98, 94),
                     (38, 84, 60, 255) if on else (255, 255, 255, 255)) + 10
    elif name == "answer":   # the service-times answer and its source links (WIDGET coords)
        x0, y0, x1, y1 = [round(v) for v in ((1400 - 498) * 1.35, (452 - 110) * 1.35, (1825 - 498) * 1.35, (718 - 110) * 1.35)]
        for k in range(4):
            d.rounded_rectangle([x0 - k, y0 - k, x1 + k, y1 + k], 22, outline=(242, 183, 5, 230))
        pill(d, x0, y1 + 14, "Answers cite the church's own pages", small, INK, (242, 183, 5, 240))
    elif name == "demo":
        pill(d, 28, 96, "Fictional demo details", small, INK, (255, 255, 255, 230), border=(200, 200, 200))
    elif name == "ff":
        pill(d, 28, 96, "Fast-forward ×4", small, (255, 255, 255), (24, 32, 28, 215))
    elif name == "optin":
        d.rounded_rectangle([28, 160, 760, 268], 16, fill=(255, 251, 235, 245), outline=AMBER, width=3)
        d.text((52, 170), "Text messages are opt-in", font=big, fill=INK)
        d.text((52, 216), "In production this box starts unchecked: visitors choose.", font=small, fill=(80, 70, 50))
    elif name == "notsent":
        pill(d, 28, 96, "Demo simulation · no text was sent", small, (255, 255, 255), (150, 60, 40, 225))
    elif name == "proposed":
        pill(d, 28, 96, "Proposed capability · two-way texting isn't in this prototype", small, (255, 255, 255), (150, 60, 40, 225))
    elif name == "simulated":
        pill(d, 28, 96, "Simulated · no one was notified", small, (255, 255, 255), (150, 60, 40, 225))
    return im


def flow_frames(dur):
    """The Visitor → Welcome text → Greeter → Follow-up strip, one step lighting up at a time (PNG per step)."""
    steps = ["Visitor plans a visit", "Welcome text", "Greeter heads-up", "Follow-up"]
    ims = []
    for k in range(len(steps) + 1):
        im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        font = F("seguisb.ttf", 30)
        widths = [d.textlength(s, font=font) + 56 for s in steps]
        total = sum(widths) + 70 * (len(steps) - 1)
        x, y = (W - total) / 2 + 160, 40
        d.rounded_rectangle([x - 24, y - 18, x + total + 24, y + 84], 24, fill=(255, 255, 255, 225))
        for i, (s, w) in enumerate(zip(steps, widths)):
            on = i < k
            d.rounded_rectangle([x, y, x + w, y + 66], 33, fill=(38, 84, 60) if on else (235, 238, 236))
            d.text((x + 28, y + 13), s, font=font, fill=(255, 255, 255) if on else (120, 128, 124))
            if i < len(steps) - 1:
                d.text((x + w + 18, y + 6), "→", font=F("segoeuib.ttf", 40), fill=(38, 84, 60) if i < k - 1 else (170, 175, 172))
            x += w + 70
        ims.append(im)
    return ims


def end_card():
    im = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(im)
    q = "Would you be open to a quick"
    q2 = "15-minute conversation?"
    f1 = F("georgiab.ttf", 84)
    for i, line in enumerate((q, q2)):
        d.text(((W - d.textlength(line, font=f1)) / 2, 380 + i * 110), line, font=f1, fill=INK)
    f2 = F("seguisb.ttf", 34)
    s = "Anthony Callender  ·  just reply to my email"
    d.text(((W - d.textlength(s, font=f2)) / 2, 640), s, font=f2, fill=GREEN)
    d.rounded_rectangle([(W - 160) / 2, 340, (W + 160) / 2, 346], 3, fill=(196, 120, 22))
    return im


def cam_mask():
    s = 4 * CAM[2]
    m = Image.new("L", (s, s), 0)
    ImageDraw.Draw(m).ellipse([8, 8, s - 8, s - 8], fill=255)
    m = m.resize((CAM_OUT[2], CAM_OUT[2]), Image.LANCZOS)
    ring = Image.new("RGBA", (CAM_OUT[2], CAM_OUT[2]), (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse([1, 1, CAM_OUT[2] - 2, CAM_OUT[2] - 2], outline=(255, 255, 255, 255), width=5)
    return m, ring


# ── cutting ─────────────────────────────────────────────────────────────────────
def padded(a, b):
    """Pad each cut into the silence around it, never into a neighbouring word."""
    before = [x["e"] for x in WORDS if x["e"] <= a + 0.01]
    after = [x["s"] for x in WORDS if x["s"] >= b - 0.01]
    lo = max(a - 0.12, (before[-1] + a) / 2 if before else 0)
    hi = min(b + 0.18, (after[0] + b) / 2 if after else b + 0.18)
    return round(lo, 3), round(hi, 3)


def plan():
    t, rows = 0.0, []
    for a, b, mode, ovs, sp in CUTS:
        lo, hi = (a, b) if sp != 1 else padded(a, b)
        d = (hi - lo) / sp
        rows.append((lo, hi, mode, ovs, sp, t, d))
        t += d
    return rows, t + END_CARD


def srt(rows):
    def ts(v):
        ms = int(round(v * 1000)); return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
    cues = []
    for lo, hi, mode, ovs, sp, t0, d in rows:
        if sp != 1:
            continue
        ws = [dict(x) for x in WORDS if x["s"] >= lo - 0.01 and x["e"] <= hi + 0.01]
        for x in ws:
            x["w"] = FIX.get(x["w"], x["w"])
        ws = [x for x in ws if x["w"]]
        line = []
        for i, x in enumerate(ws):
            line.append(x)
            end = i == len(ws) - 1 or len(" ".join(y["w"] for y in line)) > 52 or x["w"][-1] in ".?!" or ws[i + 1]["s"] - x["e"] > 0.7
            if end:
                cues.append((t0 + line[0]["s"] - lo, t0 + min(x["e"], hi) - lo + 0.1, " ".join(y["w"] for y in line)))
                line = []
    text = ""
    prev = "."
    for i, (a, b, s) in enumerate(cues, 1):
        if i < len(cues):
            b = min(b, cues[i][0] - 0.02)
        if prev[-1] in ".?!":
            s = s[0].upper() + s[1:]
        prev = s
        s = s.replace("Either way that I can", "Either way, the AI can").replace("plan my visit", "Plan My Visit").replace("booked to visit", "booked a visit")
        text += f"{i}\n{ts(a)} --> {ts(b)}\n{s}\n\n"
    return text


def run(cmd):
    subprocess.run(cmd, check=True)


def render(only=None):
    rows, total = plan()
    TMP.mkdir(parents=True, exist_ok=True)
    mask, ring = cam_mask()
    mask.save(TMP / "cam_mask.png"); ring.save(TMP / "cam_ring.png")
    names = sorted({o.split("@")[0] for r in rows for o in r[3] if o != "flow"})
    for n in names:
        overlay(n).save(TMP / f"ov_{n}.png")
    for k, im in enumerate(flow_frames(0)):
        im.save(TMP / f"flow_{k}.png")
    end_card().save(TMP / "endcard.png")
    parts = []
    for i, (lo, hi, mode, ovs, sp, t0, d) in enumerate(rows):
        x, y, cw, ch = MODES[mode]
        cx, cy, cs, _ = CAM
        ox, oy, osz = CAM_OUT
        ins = ["-ss", f"{lo:.3f}", "-t", f"{hi - lo:.3f}", "-i", str(SRC), "-loop", "1", "-i", str(TMP / "cam_mask.png"),
               "-loop", "1", "-i", str(TMP / "cam_ring.png")]
        if only and i not in only:
            parts.append(TMP / f"p{i:02d}.mp4"); continue
        if mode == "FULL":
            fc = f"[0:v]fps={FPS},setpts=(PTS-STARTPTS)/{sp},scale={W}:{H}[v1]"
        else:
          fc = (f"[0:v]fps={FPS},setpts=(PTS-STARTPTS)/{sp},split[a][b];"
              f"[a]crop={cw}:{ch}:{x}:{y},scale={W}:{H}:flags=lanczos[bg];"
              f"[b]crop={cs}:{cs}:{cx}:{cy},scale={osz}:{osz}:flags=lanczos,format=rgba[cam];"
              f"[1:v]format=gray,scale={osz}:{osz}[m];[cam][m]alphamerge[camc];"
              f"[bg][camc]overlay={ox}:{oy}:shortest=1[v0];[v0][2:v]overlay={ox}:{oy}:shortest=1[v1]")
        last, n_in = "v1", 3
        for o in ovs:
            if o == "flow":
                step = d / 5
                for k in range(1, 5):
                    ins += ["-loop", "1", "-i", str(TMP / f"flow_{k}.png")]
                    fc += f";[{n_in}:v]format=rgba,fade=in:st={step * (k - 1) + 0.3:.2f}:d=0.4:alpha=1[f{k}];[{last}][f{k}]overlay=0:0:shortest=1[v{n_in}]"
                    last, n_in = f"v{n_in}", n_in + 1
                continue
            o, _, delay = o.partition("@")
            ins += ["-loop", "1", "-i", str(TMP / f"ov_{o}.png")]
            fade = f",fade=in:st={float(delay or 0.15):.2f}:d=0.35:alpha=1" if o in ("answer", "optin", "name") else ""
            fc += f";[{n_in}:v]format=rgba{fade}[o{n_in}];[{last}][o{n_in}]overlay=0:0:shortest=1[v{n_in}]"
            last, n_in = f"v{n_in}", n_in + 1
        if sp == 1:
            fc += f";[0:a]aresample=48000,afade=t=in:d=0.03,afade=t=out:st={max(0, d - 0.05):.3f}:d=0.05[a]"
            amap = ["-map", "[a]"]
        else:
            ins += ["-f", "lavfi", "-t", f"{d:.3f}", "-i", "anullsrc=r=48000:cl=mono"]
            amap = ["-map", f"{n_in}:a"]
        part = TMP / f"p{i:02d}.mp4"
        run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", fc + f";[{last}]format=yuv420p,trim=duration={d:.3f}[v]",
             "-map", "[v]", *amap, "-t", f"{d:.3f}", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-r", str(FPS),
             "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "1", str(part)])
        parts.append(part)
        print(f"  part {i:02d}  {d:5.2f}s  {mode}")
    if only:
        return
    card = TMP / "p99.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-i", str(TMP / "endcard.png"), "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
         "-t", f"{END_CARD}", "-vf", "fade=in:d=0.5,format=yuv420p", "-c:v", "libx264", "-crf", "18", "-r", str(FPS),
         "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "1", str(card)])
    parts.append(card)
    (TMP / "list.txt").write_text("".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="utf-8")
    joined = TMP / "joined.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(TMP / "list.txt"), "-c", "copy", str(joined)])
    out = OUT / "vineyard-demo.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-i", str(joined), "-c:v", "copy",
         "-af", "highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
         "-movflags", "+faststart", str(out)])
    (OUT / "vineyard-demo.srt").write_text(srt(rows), encoding="utf-8")
    print(f"-> {out}  ({total:.1f}s planned)")


if __name__ == "__main__":
    rows, total = plan()
    if "--srt" in sys.argv:
        (OUT / "vineyard-demo.srt").write_text(srt(rows), encoding="utf-8"); sys.exit()
    if "--plan" in sys.argv:
        for lo, hi, mode, ovs, sp, t0, d in rows:
            text = " ".join(x["w"] for x in WORDS if x["s"] >= lo - 0.01 and x["e"] <= hi + 0.01)
            print(f"{t0:6.1f}  {d:5.1f}s  {mode:6} {'x' + str(sp) if sp != 1 else '  '}  {text[:90]}")
        print(f"total {total:.1f}s = {int(total // 60)}:{total % 60:04.1f}")
    else:
        only = next((set(map(int, a.split("=")[1].split(","))) for a in sys.argv if a.startswith("--parts=")), None)
        render(only)
