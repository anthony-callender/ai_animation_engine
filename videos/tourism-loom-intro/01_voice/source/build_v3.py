# v3 (2026-11-20): Tony's face only in the opening (~8.5 s) and on the end card; the middle is a
# voice-clone narration written for the ITS Malta brief. Every line comes from ElevenLabs with
# timestamps, so captions and cues are exact (no Whisper).
# Head windows are speech spans in the edited take (head-edit.mp4 / tony-edit.mp3 timeline).
# Run from the workspace root:  .venv/Scripts/python.exe videos/tourism-loom-intro/01_voice/source/build_v3.py
import base64, json, subprocess, sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd()))
import anim

HERE = Path(__file__).parent; VID = HERE.parent.parent
OUT = HERE / "v3"; OUT.mkdir(exist_ok=True)
A_END = 8.45                 # opening head segment: edited take 0 -> A_END
C_SRC0, C_SRC1 = 48.0, 60.6  # closing head segment in the edited take (stops before "Thanks a lot")

HEAD_A = [(0.97, 5.49, "Hi, I'm Tony Callender. And I create educational animated videos, and we made this one just for you."),
          (5.76, 8.23, "You've probably seen videos like this one, made in Colossyan.")]
VO = [  # text, pause after (s)
    ("A presenter, a few slides, and text on screen.", 0.7),
    ("I read your brief.", 0.35),
    ("The Institute of Tourism Studies in Malta needs around a hundred and twenty training videos, three to five minutes each, made in Colossyan from your own scripts.", 0.35),
    ("Delivered in batches, often at short notice, with consistent quality across all of them.", 0.7),
    ("We can build these in Colossyan for you. And we can also bring your lessons to life with animation.", 0.7),
    ("We start from your script and record a clear voiceover.", 0.35),
    ("Then we storyboard every scene, and animate each point on the exact word it's spoken.", 0.35),
    ("You review the storyboard and the draft before anything is final.", 0.7),
    ("Here's a quick ten-second sample, made for your students.", 1.0),
    ("Malta has three main islands: Malta, Gozo, and Comino.", 0.35),
    ("Its capital, Valletta, is a UNESCO World Heritage city.", 0.35),
    ("And both English and Maltese are official languages.", 0.9),
    ("And if you'd like a presenter, we can add a talking head from the Colossyan library, right on top of the animation, like this.", 3.2),
]
HEAD_C = [(48.17, 50.15, "So this is just a quick example for you guys."),
          (50.84, 52.08, "I do have a couple of questions."),
          (52.50, 52.98, "So,"),
          (53.26, 59.61, "let's hop on a video. Send me your script, and send me the type of work that you guys are doing, so I can get more of an idea of how I can help.")]

cfg = anim.voice_config(); key = anim.eleven_key()
voice, model, stab = cfg["voice_id"], cfg["model"], anim.STABILITY["creative"]

def speak(i, text):
    """mp3 + word timings (seconds in the raw take), cached by text."""
    mp3, js = OUT / f"{i:02d}.mp3", OUT / f"{i:02d}.json"
    if not (js.exists() and json.loads(js.read_text(encoding="utf-8"))["text"] == text):
        print(f"speaking {i:02d}: {text[:60]}")
        r = json.loads(anim.eleven(f"/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128", key,
                                   {"text": text, "model_id": model, "voice_settings": {"stability": stab}}))
        mp3.write_bytes(base64.b64decode(r["audio_base64"]))
        al = r.get("alignment") or r["normalized_alignment"]
        words, cur = [], None
        for ch, s, e in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
            if ch.isspace():
                cur = None; continue
            if cur is None:
                cur = {"text": "", "start": s, "end": e}; words.append(cur)
            cur["text"] += ch; cur["end"] = e
        js.write_text(json.dumps({"text": text, "words": words}), encoding="utf-8")
    return mp3, json.loads(js.read_text(encoding="utf-8"))["words"]

placed, words, n = [], [], 0   # placed: (mp3, a0, a1, tempo, at)
def place(text, at, room=None):
    global n
    mp3, ws = speak(n, text); n += 1
    a0, a1 = ws[0]["start"], ws[-1]["end"]; d = a1 - a0
    tempo = min(1.6, max(1.0, d / room)) if room else 1.0
    placed.append((mp3, a0, a1, tempo, at))
    words.extend({"text": w["text"], "start": round(at + (w["start"] - a0) / tempo, 3), "end": round(at + (w["end"] - a0) / tempo, 3)} for w in ws)
    return at + d / tempo

# A: lips-synced opening, word group by word group. Each group = (number of clone words, Tony's mouth start, end,
# latest end it may run to). Anchors come from pauses/dips in Tony's edited take (tony-edit.mp3).
GROUPS = [[(1, 0.97, 1.54, 1.54), (3, 1.60, 2.72, 2.85), (6, 2.92, 4.44, 4.44), (8, 4.47, 5.48, 5.85)],
          [(9, 5.90, 7.66, 7.66), (1, 7.70, 8.23, 8.40)]]
def place_groups(text, groups):
    global n
    mp3, ws = speak(n, text); n += 1
    assert sum(g[0] for g in groups) == len(ws), (text, len(ws))
    i = 0
    for cnt, t0, t1, tmax in groups:
        g = ws[i:i + cnt]; prev = ws[i - 1] if i else None; nxt = ws[i + cnt] if i + cnt < len(ws) else None
        c0 = (prev["end"] + g[0]["start"]) / 2 if prev else g[0]["start"] - 0.02
        c1 = (g[-1]["end"] + nxt["start"]) / 2 if nxt else g[-1]["end"] + 0.12
        d = g[-1]["end"] - g[0]["start"]
        span = t1 - t0
        if d / span > 1.45: span = min(tmax - t0, d / 1.45)  # too fast: borrow the pause after, up to tmax
        tempo = min(1.6, max(0.85, d / span))
        at = t0 - (g[0]["start"] - c0) / tempo
        placed.append((mp3, c0 + 0.02, c1 - 0.12, tempo, at))  # place() convention: cut is a0-0.02 .. a1+0.12
        words.extend({"text": w["text"], "start": round(t0 + (w["start"] - g[0]["start"]) / tempo, 3),
                      "end": round(t0 + (w["end"] - g[0]["start"]) / tempo, 3)} for w in g)
        i += cnt
for (s, e, text), groups in zip(HEAD_A, GROUPS):
    place_groups(text, groups)
# B: narration over the animation, then the close (no face any more)
t = A_END + 0.15
for text, pause in VO + [(h[2], p) for h, p in zip(HEAD_C, (0.6, 0.45, 0.2, 0.0))]:
    t = place(text, t) + pause
T_C = 1e9  # no closing head segment
DUR = round(t + 1.8, 3)

ins, flt = [], []
for i, (mp3, a0, a1, tempo, at) in enumerate(placed):
    ins += ["-i", str(mp3)]
    ms = int(at * 1000)
    flt.append(f"[{i}]atrim={max(0, a0 - 0.02):.3f}:{a1 + 0.12:.3f},asetpts=PTS-STARTPTS,aresample=48000,atempo={tempo:.4f},"
               f"afade=t=in:d=0.01,adelay={ms}|{ms},aresample=async=1:first_pts=0,apad=whole_dur={DUR}[p{i}]")
mix = ";".join(flt) + ";" + "".join(f"[p{i}]" for i in range(len(placed))) + f"amix=inputs={len(placed)}:normalize=0,atrim=0:{DUR}[m]"
subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", mix, "-map", "[m]", "-ac", "1", str(OUT / "mix.wav")], check=True)
# a semitone lower (timing unchanged), a little warmth, clarity kept
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(OUT / "mix.wav"), "-af",
                "rubberband=pitch=0.9439:transients=smooth:formant=shifted,equalizer=f=160:t=q:w=1:g=1.5,"
                "equalizer=f=3200:t=q:w=1.2:g=1.5,deesser=i=0.3", str(OUT / "voiced.wav")], check=True)
lufs = float(subprocess.run(["ffmpeg", "-hide_banner", "-i", str(OUT / "voiced.wav"), "-af", "ebur128", "-f", "null", "-"],
                            capture_output=True, text=True).stderr.split("I:")[-1].split("LUFS")[0])
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(OUT / "voiced.wav"), "-af", f"volume={-16 - lufs:.2f}dB,alimiter=limit=0.84:level=false",
                "-b:a", "192k", str(VID / "01_voice" / "voice.mp3")], check=True)
# head video: the opening only
v = f"[0:v]trim=0:{A_END},setpts=PTS-STARTPTS,fps=30[v]"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(VID / "04_scene" / "source" / "head-edit.mp4"), "-filter_complex", v,
                "-map", "[v]", "-an", "-c:v", "libx264", "-crf", "18", str(VID / "04_scene" / "source" / "head-v3.mp4")], check=True)
json.dump({"voice": "voice.mp3", "duration": DUR, "model": "elevenlabs-timestamps", "words": words},
          open(VID / "02_transcript" / "words.json", "w", encoding="utf-8"), indent=1)
print(f"A_END={A_END} DUR={DUR}")
print("tempos:", [round(p[3], 2) for p in placed])
print("opening words:", " ".join(f"{w['text']}@{w['start']:.2f}" for w in words[:28]))
