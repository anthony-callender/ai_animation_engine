"""sound.py: sound effects + a light music bed on a finished reel, without re-rendering frames.

  python pipeline/sound.py library            generate _shared/sound/*.mp3 once (ElevenLabs sound effects + music, paid plan)
  python pipeline/sound.py mix <slug> [kit]   05_render/<slug>.mp4 -> 05_render/<slug>-final.mp4 (video copied, audio remixed)

Placement (restraint: one sound per visual event):
  main cue (a new step/scene)   -> whoosh, timed so its peak lands on the cut
  sub-cue (a highlight)         -> ding
  storyboard beat words         -> soft pop (flywheel reels: a check, a chip, a bubble), at least 0.45 s apart
  cta                           -> success chime
Music sits about 20 dB under the voice, ducks further while the voice talks, fades in and out.
The final mix is normalized to -14 LUFS (Instagram/Reels loudness).
kit: "ui" (dark canvas reels, default) or "paper" (the paper collage reel: paper swishes, warm acoustic bed).
"""
import json
import subprocess
import sys
import urllib.request
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
LIB = ROOT / "_shared" / "sound"
SR = 44100
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "pipeline"))

SFX = {  # name: (prompt, seconds)
    "whoosh": ("soft subtle airy whoosh transition, short and clean, modern motion graphics UI, no impact", 0.8),
    "ding": ("gentle bright notification bell ding, single soft clean note, modern app UI, short tail", 1.2),
    "pop": ("very soft subtle UI pop, tiny bubble pop click, clean, quiet, modern app", 0.5),
    "success": ("soft pleasant two-note success chime, warm, modern app UI, gentle", 1.4),
    "paper-whoosh": ("quick soft paper swish, a cardboard cut-out sliding across a table, clean, short", 0.7),
    "paper-pop": ("soft paper tap, a paper card placed down on a table, gentle, short", 0.5),
}
MUSIC = {  # name: (prompt, seconds)
    "music-ui": ("Light, minimal, optimistic background music for a tech explainer video. Soft plucked synths, warm pads, "
                 "gentle light percussion, around 100 BPM, steady and unobtrusive, no build-ups, no drops, no vocals.", 100),
    "music-paper": ("Light, warm, playful acoustic background music for an explainer video. Soft ukulele, light piano, "
                    "gentle finger snaps, around 105 BPM, cheerful and unobtrusive, steady, no vocals.", 100),
}
KITS = {"ui": dict(whoosh="whoosh", ding="ding", pop="pop", success="success", music="music-ui"),
        "paper": dict(whoosh="paper-whoosh", ding="ding", pop="paper-pop", success="success", music="music-paper")}
GAIN = dict(whoosh=0.30, ding=0.22, pop=0.18, success=0.30)


def post(path: str, body: dict) -> bytes:
    import anim
    req = urllib.request.Request(anim.ELEVEN + path + "?output_format=mp3_44100_128", data=json.dumps(body).encode(),
                                 headers={"xi-api-key": anim.eleven_key(), "Content-Type": "application/json"})
    return urllib.request.urlopen(req, timeout=600).read()


def cmd_library() -> None:
    LIB.mkdir(parents=True, exist_ok=True)
    for name, (prompt, sec) in SFX.items():
        if not (LIB / f"{name}.mp3").exists():
            (LIB / f"{name}.mp3").write_bytes(post("/sound-generation", {"text": prompt, "duration_seconds": sec, "prompt_influence": 0.5}))
            print("  sfx", name)
    for name, (prompt, sec) in MUSIC.items():
        if not (LIB / f"{name}.mp3").exists():
            (LIB / f"{name}.mp3").write_bytes(post("/music", {"prompt": prompt, "music_length_ms": sec * 1000, "force_instrumental": True}))
            print("  music", name)
    (LIB / "SOURCES.md").write_text("# Sound library\n\nGenerated with ElevenLabs (sound effects + Eleven Music) on Tony's paid Starter plan: "
                                    "commercial use, no attribution needed. Prompts are in pipeline/sound.py.\n", encoding="utf-8")
    print("->", LIB)


def load_wav(p: Path) -> np.ndarray:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768


def events(d: Path) -> list:
    data = json.loads((d / "03_cues" / "cues.json").read_text(encoding="utf-8"))
    ev, cues = [], data["cueList"]
    for i, c in enumerate(cues):
        if c["id"] == "cta": ev.append((c["start"], "success"))
        elif "." in c["id"]: ev.append((c["start"], "ding"))
        elif i > 0: ev.append((c["start"], "whoosh"))
    sb = d / "storyboard.json"
    if sb.exists():  # flywheel reels: a soft pop on each panel beat, as the scene animates it
        import reel
        nodes, words, last = json.loads(sb.read_text(encoding="utf-8"))["nodes"], data["words"], -9
        for i, n in enumerate(nodes):
            c = data["cues"].get(f"n{i}")
            for w in reel.beat_words(n.get("panel") or {}) if c else []:
                t = reel.find_after(words, c["start"], w)
                if t is not None and t - last >= 0.45 and all(abs(t - e) > 0.35 for e, _ in ev):
                    ev.append((t, "pop")); last = t
    return sorted(ev)


def cmd_mix(slug: str, kit_name: str = "ui") -> None:
    d, kit = ROOT / "videos" / slug, KITS[kit_name]
    src, voice, out = d / "05_render" / f"{slug}.mp4", d / "01_voice" / "voice.mp3", d / "05_render" / f"{slug}-final.mp4"
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(src)], capture_output=True, text=True).stdout)
    n = int(dur * SR)
    fx, cache, ev = np.zeros(n, np.float32), {}, events(d)
    for t, kind in ev:
        s = cache.setdefault(kind, load_wav(LIB / f"{kit[kind]}.mp3"))
        s = s / (np.abs(s).max() + 1e-9) * GAIN[kind]
        lead = int(np.argmax(np.abs(s))) if kind == "whoosh" else 0  # the whoosh peaks on the cut
        a = max(0, int(t * SR) - lead)
        seg = s[: max(0, n - a)]
        fx[a:a + len(seg)] += seg
    tmp = d / "05_render" / "_mix"
    tmp.mkdir(exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", str(tmp / "fx.wav")], input=fx.tobytes(), check=True)
    music = LIB / f"{kit['music']}.mp3"
    fc = (f"[1:a]aresample={SR},aformat=channel_layouts=mono,asplit=2[v1][v2];"
          f"[2:a]aresample={SR},aformat=channel_layouts=mono,aloop=loop=-1:size={int(100 * SR)},atrim=0:{dur:.3f},"
          f"loudnorm=I=-36:TP=-9:LRA=7,afade=t=in:d=1.2,afade=t=out:st={max(0, dur - 2.5):.3f}:d=2.5[m];"
          f"[m][v1]sidechaincompress=threshold=0.03:ratio=4:attack=30:release=600[bed];"
          f"[v2][bed][3:a]amix=inputs=3:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11,aresample={SR}[a]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-i", str(voice), "-i", str(music), "-i", str(tmp / "fx.wav"),
                    "-filter_complex", fc, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-movflags", "+faststart", "-shortest", str(out)], check=True)
    for f in tmp.iterdir(): f.unlink()
    tmp.rmdir()
    counts = {k: sum(1 for _, x in ev if x == k) for k in GAIN}
    print(f"-> {out}  ({dur:.1f}s, kit {kit_name}: " + ", ".join(f"{v} {k}" for k, v in counts.items()) + ")")


def main() -> None:
    if len(sys.argv) >= 2 and sys.argv[1] == "library": cmd_library()
    elif len(sys.argv) >= 3 and sys.argv[1] == "mix": cmd_mix(sys.argv[2], *(sys.argv[3:4]))
    else: sys.exit(__doc__)


if __name__ == "__main__":
    main()
