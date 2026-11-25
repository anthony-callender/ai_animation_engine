# Tony's words in his voice clone, each phrase fitted to the moment his lips say it in the edited video.
# Windows are speech spans (s) in the edited take (01_voice/voice.mp3 before this script; kept as tony-edit.mp3).
# Visible phrases (face on screen) are stretched to the window exactly; hidden ones keep natural pace.
# Run from the workspace root:  .venv/Scripts/python.exe videos/tourism-loom-intro/01_voice/source/clone_sync.py
import json, re, subprocess, sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd()))
import anim

HERE = Path(__file__).parent
OUT = HERE / "clone"; OUT.mkdir(exist_ok=True)
DUR = 62.136
P = [  # start, end, visible, text
    (0.97, 5.49, 1, "Hi, I'm Tony Callender. And I create educational animated videos, and we made this one just for you."),
    (5.76, 8.23, 1, "You've probably seen videos like this one, made in Colossyan."),
    (8.81, 11.01, 1, "A presenter, a few slides, and text on screen."),
    (11.47, 12.97, 1, "We can make videos like these too."),
    (13.61, 16.07, 1, "But we can also bring your lessons to life with animation."),
    (16.90, 19.97, 1, "We start from your script and record a clear voiceover."),
    (20.40, 24.33, 1, "Then we storyboard every scene, and animate each point on the exact word it's spoken."),
    (24.75, 27.93, 1, "You review the storyboard and the draft before anything is final."),
    (28.38, 31.08, 1, "Here's a quick ten-second sample, for a tourist environment."),
    (32.56, 36.90, 0, "Heading out on the trail? Pack water, a map, and an extra layer. Stay on the marked path."),
    (37.40, 40.33, 0, "It protects the plants, and keeps you safe. And leave only footprints."),
    (41.18, 44.85, 0, "And if you'd like a presenter, we can add a talking head from the Colossyan library,"),
    (45.37, 47.63, 0, "right on top of the animation, like this."),
    (48.17, 50.15, 1, "So this is just a quick example for you guys."),
    (50.84, 52.08, 1, "I do have a couple of questions."),
    (52.50, 52.98, 1, "So,"),
    (53.26, 59.61, 1, "let's hop on a video. Send me your script, and send me the type of work that you guys are doing, so I can get more of an idea of how I can help."),
    (60.81, 61.47, 1, "Thanks a lot."),
]

def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout)

cfg = anim.voice_config(); key = anim.eleven_key()
voice, model, stab = cfg["voice_id"], cfg["model"], anim.STABILITY["creative"]  # Tony asked for a more casual read (2026-11-20)
trim = "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse"
inputs, filt, report = [], [], []
SPEED = json.loads((OUT / "speed.json").read_text()) if (OUT / "speed.json").exists() else {}  # ElevenLabs speed per phrase (max 1.2)
for i, (s, e, vis, text) in enumerate(P):
    mp3, txt, wav = OUT / f"{i:02d}.mp3", OUT / f"{i:02d}.txt", OUT / f"{i:02d}.wav"
    sp = SPEED.get(str(i), 1.0); tag = f"{text}|{sp}|{stab}"
    if not (mp3.exists() and txt.exists() and txt.read_text(encoding="utf-8") == tag):
        print(f"speaking {i:02d} (speed {sp}): {text[:60]}")
        mp3.write_bytes(anim.eleven(f"/text-to-speech/{voice}?output_format=mp3_44100_128", key,
                                    {"text": text, "model_id": model, "voice_settings": {"stability": stab, "speed": sp}}))
        txt.write_text(tag, encoding="utf-8")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-af", trim, "-ar", "48000", "-ac", "1", str(wav)], check=True)
    d = dur(wav); w = e - s
    nxt = P[i + 1][0] if i + 1 < len(P) else DUR
    room = (nxt - 0.08) - s
    tempo = max(1.0, d / room)  # starts locked to the lips; may run into the pause after, never into the next phrase
    tempo = min(1.6, max(0.7, tempo))
    report.append(f"{i:02d} {'face' if vis else 'hid '} window {w:4.2f}s  clone {d:4.2f}s  tempo x{tempo:.2f}")
    inputs += ["-i", str(wav)]
    filt.append(f"[{i}]atempo={tempo:.4f},adelay={int(s * 1000)}|{int(s * 1000)},apad=whole_dur={DUR}[p{i}]")
mix = ";".join(filt) + ";" + "".join(f"[p{i}]" for i in range(len(P))) + f"amix=inputs={len(P)}:normalize=0,atrim=0:{DUR}[m]"
subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", mix, "-map", "[m]", str(HERE / "clone-mix.wav")], check=True)
# a semitone lower (timing unchanged), a little warmth, clarity kept
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(HERE / "clone-mix.wav"), "-af",
  "rubberband=pitch=0.9439:transients=smooth:formant=shifted,equalizer=f=160:t=q:w=1:g=1.5,equalizer=f=3200:t=q:w=1.2:g=1.5,deesser=i=0.3",
  str(HERE / "clone-synced.wav")], check=True)
print("\n".join(report))
