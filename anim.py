#!/usr/bin/env python3
"""
anim.py - the whole toolchain for the voice-first animation workspace.

    python anim.py new <slug> [voice-file] [--format wide|tall] [--style pixel|line]   start a video (16:9 or 9:16)
    python anim.py speak <slug>               01_voice/script.md -> voice.mp3 via your configured ElevenLabs voice/model
    python anim.py tighten <slug>             cut dead air to 0.35 s (Shorts), then transcribe --force
    python anim.py transcribe <slug>          01_voice   -> 02_transcript/words.json + transcript.md
    python anim.py cues <slug>                03_cues/cues.md -> cues.json + cues.js (timed to the words)
    python anim.py stills <slug>              one PNG per cue + contact sheet, the cheap look
    python anim.py render <slug>              frame-perfect mp4 with the voice on it
    python anim.py cut <slug> --keep A-B ...  keep only those stretches of the render -> 05_render/<slug>-post.mp4
    python anim.py thumbnail <slug>           04_scene/thumbnail.js -> 05_render/thumbnail-N.png (1280x720)
    python anim.py chapters <slug>            top-level cues as YouTube chapter times
    python anim.py grab <slug> <url> <name>   a real web page -> 04_scene/assets/<name>.png, for Eduba.screenshot
    python anim.py real <slug> file|tree|run|clip <target> --as <name>   real files, folders, command output, footage -> assets/real.js
    python anim.py status [slug]              what exists, stage by stage
    python anim.py studio                     every preview, stills sheet and render at http://127.0.0.1:8765
    python anim.py gallery [--style line]     re-shoot the kit sheets in _shared/gallery/
    python anim.py trace <image> <name>       a line drawing -> strokes for the Line kit (Line.drawing)
    python anim.py new <slug> --from <long> --start 0:26 --end 1:12   a 9:16 Short cut from a long video's voice

Each command does one stage and stops. Read the output, edit it, then run the next.
Needs: ffmpeg/ffprobe on PATH, requirements.txt, Chrome or Playwright Chromium. Whisper is optional; see START-HERE.md.
"""

from __future__ import annotations

import argparse
import asyncio
import difflib
import html
import json
import math
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VIDEOS = ROOT / "videos"
TEMPLATE = ROOT / "_templates" / "video"
VOCAB = ROOT / "_shared" / "vocab.txt"
AUDIO_EXT = {".wav", ".mp3", ".m4a", ".aac", ".flac", ".ogg", ".opus", ".mp4", ".mov", ".webm"}

FX_GAIN = 0.25  # sound effects at -12 dB: loud enough to mark a beat, never over the voice

STAGES = [
    ("01_voice", "voice file"),
    ("02_transcript", "words.json"),
    ("03_cues", "cues.json"),
    ("04_scene", "scene.js"),
    ("05_render", "*.mp4"),
]


# ── helpers ─────────────────────────────────────────────────────────────────

def die(msg: str) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def video_dir(slug: str) -> Path:
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", slug):
        die("slug must contain lowercase letters, digits and hyphens only")
    d = VIDEOS / slug
    if not d.is_dir():
        known = ", ".join(p.name for p in VIDEOS.iterdir() if p.is_dir()) if VIDEOS.exists() else ""
        die(f"no video '{slug}' in videos/. Known: {known or 'none'}")
    return d


def find_voice(vdir: Path) -> Path:
    files = sorted(p for p in (vdir / "01_voice").glob("*") if p.suffix.lower() in AUDIO_EXT)
    named = [p for p in files if p.stem == "voice"]
    if named:
        return named[0]
    if files:
        return files[0]
    die(f"no voice file in {vdir / '01_voice'} (expected voice.wav / voice.mp3 / ...)")


def probe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True,
    )
    try:
        return float(out.stdout.strip())
    except ValueError:
        die(f"ffprobe could not read {path}: {out.stderr.strip()}")


def audio_peak(path: Path) -> float | None:
    out = subprocess.run(["ffmpeg", "-i", str(path), "-af", "volumedetect", "-vn", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = re.search(r"max_volume: (-?[\d.]+) dB", out)
    return float(m.group(1)) if m else None


def fmt_t(t: float) -> str:
    m, s = divmod(max(0.0, t), 60)
    return f"{int(m):02d}:{s:04.1f}"


def parse_t(s: str) -> float:
    parts = s.split(":")
    return sum(float(p) * 60 ** i for i, p in enumerate(reversed(parts)))


def norm(word: str) -> str:
    return re.sub(r"[^a-z0-9]", "", word.lower())


# ── new ─────────────────────────────────────────────────────────────────────

def cmd_new(a) -> None:
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", a.slug):
        die("slug must be lowercase letters, digits and hyphens, e.g. 2026-09-24-folder-thesis")
    dest = VIDEOS / a.slug
    if dest.exists():
        die(f"{dest} already exists")
    a.format = a.format or ("tall" if a.src else "wide")
    shutil.copytree(TEMPLATE, dest)
    kit = "line-" if a.style == "line" else ""  # the Line kit (hand-drawn line art) or the Eduba pixel kit
    shutil.copytree(ROOT / "_templates" / f"scene-{kit}{a.format}", dest / "04_scene", dirs_exist_ok=True)
    if a.src:  # a Short cut from a longer video: its voice between --start and --end, its script for spellings
        sdir = video_dir(a.src)
        if not (a.start and a.end):
            die("--from needs --start and --end (seconds or m:ss, from the long video's transcript.md)")
        t0, t1 = parse_t(a.start), parse_t(a.end)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{t0:.3f}", "-to", f"{t1:.3f}", "-i", str(find_voice(sdir)),
                        "-af", f"afade=t=in:d=0.04,afade=t=out:st={max(0, t1 - t0 - 0.2):.3f}:d=0.2",
                        "-c:a", "libmp3lame", "-q:a", "2", str(dest / "01_voice" / "voice.mp3")], check=True)
        if (sdir / "01_voice" / "script.md").exists():
            shutil.copy2(sdir / "01_voice" / "script.md", dest / "01_voice" / "script.md")
        (dest / "01_voice" / "brief.md").write_text(
            f"# Brief\n\nCut from `{a.src}`, {fmt_t(t0)} to {fmt_t(t1)}.\n\n- Audience:\n- The one idea:\n- Hook (first 2 seconds):\n", encoding="utf-8")
        print(f"voice <- {a.src} {fmt_t(t0)}-{fmt_t(t1)} ({t1 - t0:.1f}s)")
    elif a.voice:
        src = Path(a.voice)
        if not src.is_file():
            die(f"voice file not found: {src}")
        shutil.copy2(src, dest / "01_voice" / f"voice{src.suffix.lower()}")
        print(f"voice -> {dest / '01_voice' / ('voice' + src.suffix.lower())}")
    print(f"created videos/{a.slug}/ ({a.format}, {a.style or 'pixel'})")
    print("next: record into 01_voice/, or write 01_voice/script.md and `python anim.py speak " + a.slug + "`")


# ── speak (ElevenLabs v4) ───────────────────────────────────────────────────

ELEVEN = "https://api.elevenlabs.io/v1"
STABILITY = {"creative": 0.0, "natural": 0.5, "robust": 1.0}  # v3 and v4 take these three values


def voice_config() -> dict:
    """Frontmatter of _shared/voice.md: voice_id, model, stability."""
    text = (ROOT / "_shared" / "voice.md").read_text(encoding="utf-8")
    m = re.match(r"---\r?\n(.*?)\r?\n---", text, re.S)
    return dict(re.findall(r"^(\w+):\s*(.+?)\s*$", m.group(1), re.M)) if m else {}


def eleven_key() -> str:
    import os
    key = next((os.environ[k] for k in ("ELEVENLABS_API_KEY", "ELEVEN_API_KEY") if os.environ.get(k)), None)
    env = ROOT / ".env"
    if not key and env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            k, _, v = line.partition("=")
            if k.strip() in ("ELEVENLABS_API_KEY", "ELEVEN_API_KEY") and v.strip():
                key = v.strip().strip('"')
    if not key:
        die("no ElevenLabs key. Put ELEVEN_API_KEY=sk_... in animations/.env (or set the env var).")
    if not key.startswith("sk_"):
        die("that is an ElevenLabs key ID, not a key. Keys start with sk_ and are shown once when "
            "created or rotated (elevenlabs.io > Developers > API Keys).")
    return key


def eleven(path: str, key: str, body: dict | None = None) -> bytes:
    import urllib.error
    import urllib.request
    req = urllib.request.Request(ELEVEN + path, method="POST" if body else "GET",
                                 data=json.dumps(body).encode() if body else None,
                                 headers={"xi-api-key": key, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        die(f"ElevenLabs {e.code}: {e.read().decode(errors='replace')[:400]}")


def script_chunks(text: str) -> list[str]:
    """The script (first ``` block if there is one), about one paragraph per chunk: a paragraph of 250+ chars
    is its own chunk, shorter ones join the next, up to 700. Short requests sound better on v4 (voice.md)."""
    block = re.search(r"```[^\n]*\n(.*?)```", text, re.S)
    body = block.group(1) if block else re.sub(r"^#.*$", "", text, flags=re.M)
    paras = [p.strip() for p in re.split(r"\n\s*\n", body) if p.strip()]
    chunks, cur = [], ""
    for p in paras:
        if cur and (len(cur) >= 250 or len(cur) + len(p) > 700):
            chunks.append(cur); cur = p
        else:
            cur = f"{cur}\n\n{p}" if cur else p
    if cur:
        if chunks and len(cur) < 250:
            chunks[-1] += "\n\n" + cur
        else:
            chunks.append(cur)
    return chunks


def cmd_speak(a) -> None:
    cfg = voice_config()
    voice_id, model = cfg.get("voice_id"), cfg.get("model", "YOUR_SUPPORTED_MODEL_ID")
    stability = STABILITY[a.stability or cfg.get("stability", "natural")]
    fmt = cfg.get("format", "mp3_44100_192")
    if a.check:
        if not voice_id or voice_id.startswith("YOUR_") or not model or model.startswith("YOUR_"):
            die("Choose your permitted voice_id and supported model in _shared/voice.md first.")
        key = eleven_key()
        tts = [m for m in json.loads(eleven("/models", key)) if m.get("can_do_text_to_speech")]
        print("text-to-speech models on this key: " + ", ".join(m["model_id"] for m in tts))
        print(f"using {model}: {'available' if any(m['model_id'] == model for m in tts) else 'NOT available'}")
        v = json.loads(eleven(f"/voices/{voice_id}", key))
        print(f"voice {voice_id}: {v.get('name')} ({v.get('category')})")
        sub = json.loads(eleven("/user/subscription", key))
        print(f"plan {sub.get('tier')}: {sub.get('character_limit', 0) - sub.get('character_count', 0):,} characters left")
        return
    vdir = video_dir(a.slug)
    print(f"{model}, voice {voice_id}")
    script = vdir / "01_voice" / "script.md"
    if not script.exists():
        die("no 01_voice/script.md. Write it first (style: _shared/voice.md).")
    chunks = script_chunks(script.read_text(encoding="utf-8"))
    for i, c in enumerate(chunks, 1):
        flag = "" if len(c) >= 250 else "  (under 250 chars: may come out uneven)"
        print(f"chunk {i}: {len(c)} chars{flag}  | {c[:70].replace(chr(10), ' ')}")
    if a.dry_run:
        return
    if not voice_id or voice_id.startswith("YOUR_") or not model or model.startswith("YOUR_"):
        die("Choose your permitted voice_id and supported model in _shared/voice.md first.")
    others = [p for p in (vdir / "01_voice").glob("voice.*") if p.suffix != ".mp3"]
    if others:
        die(f"01_voice already has {others[0].name}. Move it out first so the new voice is the only one.")
    key = eleven_key()
    takes = vdir / "01_voice" / "takes"
    takes.mkdir(exist_ok=True)
    made = takes / "voice.json"   # takes from another model or voice get re-spoken, never mixed in
    same = made.exists() and json.loads(made.read_text(encoding="utf-8")) == {"model": model, "voice": voice_id}
    made.write_text(json.dumps({"model": model, "voice": voice_id}), encoding="utf-8")
    for i, c in enumerate(chunks, 1):
        mp3, txt = takes / f"{i:02d}.mp3", takes / f"{i:02d}.txt"
        fresh = same and mp3.exists() and txt.exists() and txt.read_text(encoding="utf-8") == c
        if (a.chunk and a.chunk != i) or (fresh and not a.chunk):
            continue
        print(f"speaking chunk {i}/{len(chunks)} ...")
        audio = eleven(f"/text-to-speech/{voice_id}?output_format={fmt}", key,
                       {"text": c, "model_id": model, "voice_settings": {"stability": stability}})
        mp3.write_bytes(audio)
        txt.write_text(c, encoding="utf-8")
    parts = [takes / f"{i:02d}.mp3" for i in range(1, len(chunks) + 1)]
    done = [p for p in parts if p.exists()]
    if len(done) < len(parts):
        print(f"{len(done)} of {len(parts)} chunks in 01_voice/takes/. Listen, then run without --chunk for the rest.")
        return
    ins = sum((["-i", str(p)] for p in parts), [])
    fc = "".join(f"[{i}:a]aresample=44100,aformat=channel_layouts=mono,apad=pad_dur=0.3[a{i}];" for i in range(len(parts)))
    fc += "".join(f"[a{i}]" for i in range(len(parts))) + f"concat=n={len(parts)}:v=0:a=1[out]"
    out = vdir / "01_voice" / "voice.mp3"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *ins, "-filter_complex", fc, "-map", "[out]",
                    "-c:a", "libmp3lame", "-q:a", "2", str(out)], check=True)
    print(f"-> {out}  ({fmt_t(probe_duration(out))}). Listen; redo a bad chunk with --chunk N.")


# ── tighten: shorten dead air (Shorts) ──────────────────────────────────────

def cmd_tighten(a) -> None:
    """Every silence longer than --max becomes --max long; laughs and breaths are sound, so they stay.
    The voice as it was goes to 01_voice/takes/voice-loose.mp3 (run it again after a re-roll; a tight
    voice has nothing left to cut). Transcribe again after (--force)."""
    vdir = video_dir(a.slug)
    src = find_voice(vdir)
    loose = vdir / "01_voice" / "takes" / f"voice-loose{src.suffix}"
    loose.parent.mkdir(exist_ok=True)
    shutil.copy2(src, loose)
    dur = probe_duration(loose)
    log = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(loose), "-af", f"silencedetect=noise={a.noise}dB:d={a.max}", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)] + [dur]
    keep, t, cut = [], 0.0, 0.0
    for s0, s1 in zip(starts, ends):
        end_of_file = s1 >= dur - 0.01
        hold = a.tail if end_of_file else a.max
        if s1 - s0 <= hold:
            continue
        keep.append((t, s0 + hold / 2 if not end_of_file else s0 + hold))
        cut += (s1 - s0) - hold
        t = s1 - hold / 2 if not end_of_file else dur
    if t < dur:
        keep.append((t, dur))
    if cut < 0.05:
        print(f"nothing over {a.max}s to cut")
        return
    parts = "".join(f"[0:a]atrim={k0:.3f}:{k1:.3f},asetpts=PTS-STARTPTS[p{i}];" for i, (k0, k1) in enumerate(keep))
    graph = parts + "".join(f"[p{i}]" for i in range(len(keep))) + f"concat=n={len(keep)}:v=0:a=1[out]"
    out = vdir / "01_voice" / "voice.mp3"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(loose), "-filter_complex", graph, "-map", "[out]",
                    "-c:a", "libmp3lame", "-q:a", "2", str(out)], check=True)
    if src != out and src.exists():
        src.unlink()
    print(f"-> {out}  {fmt_t(dur)} -> {fmt_t(probe_duration(out))} ({cut:.1f}s of silence cut, {len(keep) - 1} gaps)")
    print(f"next: python anim.py transcribe {a.slug} --force")


# ── transcribe ──────────────────────────────────────────────────────────────

def cmd_transcribe(a) -> None:
    vdir = video_dir(a.slug)
    voice = find_voice(vdir)
    out = vdir / "02_transcript"
    out.mkdir(exist_ok=True)
    if (out / "words.json").exists() and not a.force:
        die("02_transcript/words.json exists (you may have edited it). Re-run with --force to overwrite.")

    import warnings
    warnings.filterwarnings("ignore", message=".*Triton.*")
    warnings.filterwarnings("ignore", message=".*FP16 is not supported.*")
    import torch
    import whisper

    device = "cuda" if torch.cuda.is_available() else "cpu"
    prompt = a.prompt
    if prompt is None and VOCAB.exists():
        terms = [l.strip() for l in VOCAB.read_text(encoding="utf-8").splitlines()
                 if l.strip() and not l.startswith("#")]
        prompt = ", ".join(terms) or None

    print(f"whisper {a.model} on {device} <- {voice.name}")
    t0 = time.time()
    model = whisper.load_model(a.model, device=device)
    result = model.transcribe(
        str(voice), word_timestamps=True, condition_on_previous_text=False,
        initial_prompt=prompt, language=a.language, fp16=(device == "cuda"), verbose=None,
    )

    words = []
    for seg in result["segments"]:
        for w in seg.get("words", []):
            text = w["word"].strip()
            if text:
                words.append({"text": text, "start": round(w["start"], 3), "end": round(w["end"], 3)})

    script = vdir / "01_voice" / "script.md"
    script_md = script.read_text(encoding="utf-8") if script.exists() else ""
    if script_md and "Replace this with the script" not in script_md:  # scripted: Whisper's timing, the script's spelling
        fixed, notes = snap_to_script(words, script_md)
        print(f"{fixed} words re-spelled from script.md")
        if notes and not a.no_verify:  # Whisper sometimes doubles or invents a word: ask a second model what it hears
            del model
            if device == "cuda":
                torch.cuda.empty_cache()
            other = whisper.load_model("medium.en" if a.model == "large-v3-turbo" else "large-v3-turbo", device=device)
            audio = whisper.load_audio(str(voice))
            for at, msg in notes:
                clip = audio[int(max(0.0, at - 2.5) * 16000): int((at + 3.0) * 16000)]
                heard = other.transcribe(clip, language=a.language, condition_on_previous_text=False, fp16=(device == "cuda"))["text"].strip()
                print(f"  {fmt_t(at)} {msg}\n        second model hears: {heard}")
        else:
            for at, msg in notes:
                print(f"  {fmt_t(at)} {msg}")
        print_pace(vdir, words)
    duration = probe_duration(voice)
    data = {"voice": voice.name, "duration": round(duration, 3), "model": a.model, "words": words}
    (out / "words.json").write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")
    (out / "transcript.md").write_text(transcript_md(a.slug, words, duration), encoding="utf-8")
    print(f"{len(words)} words, {fmt_t(duration)} of audio, {time.time() - t0:.1f}s")
    print(f"-> {out / 'transcript.md'}  (read it; fix misheard words in words.json)")


def print_pace(vdir: Path, words: list[dict]) -> None:
    """Scripted voice: words a minute per take. On v4 a re-roll changes the take but hardly the pace (2026-09-29):
    a chunk far off the target gets its words changed (voice.md, Pace), then speak --chunk N."""
    takes = sorted((vdir / "01_voice" / "takes").glob("*.mp3"))
    if not takes:
        return
    t, slow = 0.0, []
    print("pace per take (target: _shared/voice.md, Pace):")
    for f in takes:
        d = probe_duration(f) + 0.3  # speak pads each take by 0.3 s
        ws = [w for w in words if t <= w["start"] < t + d]
        if len(ws) > 5:
            wpm = len(ws) / (ws[-1]["end"] - ws[0]["start"]) * 60
            note = "   slow: rewrite it as talk, then speak --chunk " if wpm < 165 else "   fast: give it a landing beat, then speak --chunk " if wpm > 205 else ""
            print(f"  {f.stem}  {fmt_t(t)}  {wpm:4.0f} wpm" + (note + str(int(f.stem)) if note else ""))
            if note:
                slow.append(f.stem)
        t += d
    if slow:
        print(f"  then transcribe again with --force")


def snap_to_script(words: list[dict], script_md: str) -> tuple[int, list[tuple[float, str]]]:
    """Scripted voice: keep Whisper's timing and numerals (1958 reads better on screen than nineteen
    fifty-eight), take every other spelling from the script, drop short words Whisper doubled."""
    for i in range(len(words) - 1, 0, -1):  # Whisper splits "zero -shot", "$2 .65"
        if re.match(r"[-.,']\w", words[i]["text"]):
            words[i - 1]["text"] += words[i]["text"]
            words[i - 1]["end"] = words.pop(i)["end"]
    block = re.search(r"```[^\n]*\n(.*?)```", script_md, re.S)
    text = re.sub(r"\[[a-z ,'-]+\]", " ", block.group(1) if block else script_md, flags=re.I)  # v4 tags can be capitalised
    ref = [w for w in text.split() if norm(w)]
    a, b = [norm(w["text"]) for w in words], [norm(w) for w in ref]
    blocks = [m for m in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks() if m.size >= 3]
    clip = bool(blocks) and blocks[-1].b + blocks[-1].size - blocks[0].b < len(b) * 0.8
    if clip:  # a Short: only its stretch of the long script
        j0, j1 = max(0, blocks[0].b - 3), blocks[-1].b + blocks[-1].size + 3
        ref, b = ref[j0:j1], b[j0:j1]
    keep, fixed, notes = [], 0, []
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        span, said = words[i1:i2], " ".join(w["text"] for w in words[i1:i2])
        nbrs = (a[i1 - 1] if i1 else "", a[i2] if i2 < len(a) else "")
        if op in ("equal", "replace") and i2 - i1 == j2 - j1:
            for w, r in zip(span, ref[j1:j2]):
                fixed += op == "replace" and w["text"] != r
                w["text"] = r
        elif op == "delete" and len(span) <= 2 and all(
                w["end"] - w["start"] < 0.25 or norm(w["text"]) in nbrs for w in span):
            if i2 < len(words) and nbrs[1] == norm(span[-1]["text"]):  # "and and": the kept word takes the whole sound
                words[i2]["start"] = span[0]["start"]
            elif keep:
                keep[-1]["end"] = span[-1]["end"]
            notes.append((span[0]["start"], f"dropped {said!r}: not in the script"))
            continue
        elif op == "replace" and len(span) <= 3 and j2 - j1 <= 3 and not re.search(r"\d", said):
            t0, t1, new = span[0]["start"], span[-1]["end"], ref[j1:j2]  # "mail room" -> "mailroom"
            per = (t1 - t0) / sum(len(r) for r in new)
            for r in new:
                keep.append({"text": r, "start": round(t0, 3), "end": round(t0 + per * len(r), 3)})
                t0 += per * len(r)
            fixed += len(new)
            continue
        elif clip and op == "insert" and i1 in (0, len(a)):
            pass  # script words just outside the clip's edges
        elif not (op == "replace" and len(span) <= 3 and re.search(r"\d", said)):
            at = span[0]["start"] if span else keep[-1]["end"] if keep else 0
            notes.append((at, f"heard {said!r}, script says {' '.join(ref[j1:j2])[:80]!r}: listen"))
        keep.extend(span)
    words[:] = keep
    return fixed, notes


def transcript_md(slug: str, words: list[dict], duration: float) -> str:
    lines, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        gap = (nxt["start"] - w["end"]) if nxt else 99
        if w["text"][-1:] in ".?!" or gap > 0.7 or len(cur) >= 22:
            lines.append(f"`{fmt_t(cur[0]['start'])}` " + " ".join(x["text"] for x in cur)
                         + (f"  _(pause {gap:.1f}s)_" if 1.2 < gap < 99 else ""))
            cur = []
    return (f"# Transcript: {slug}\n\n{len(words)} words, {fmt_t(duration)}. "
            f"Generated from words.json. Edit words.json, not this file.\n\n" + "\n\n".join(lines) + "\n")


# ── cues ────────────────────────────────────────────────────────────────────

HEAD = re.compile(r"^##\s+([A-Za-z0-9_.\-]+)\s*(.*)$")


def parse_cues_md(text: str) -> list[dict]:
    cues, cur = [], None
    for raw in text.splitlines():
        m = HEAD.match(raw)
        if m:
            rest = m.group(2)
            sfx = [s.strip() for grp in re.findall(r"\[sfx:\s*([^\]]+)\]", rest) for s in grp.split(",") if s.strip()]
            rest = re.sub(r"\[sfx:[^\]]*\]", "", rest)
            phrase = re.search(r'"([^"]+)"', rest)
            at = re.search(r"@\s*([\d:.]+)", rest)
            off = re.search(r"(?:^|\s)([+-]\d*\.?\d+)s?\b", re.sub(r'"[^"]*"', "", rest))
            cur = {"id": m.group(1), "phrase": phrase.group(1) if phrase else None,
                   "at": parse_t(at.group(1)) if at else None,
                   "offset": float(off.group(1)) if off else 0.0, "note": [], "sfx": sfx}
            if cur["phrase"] is None and cur["at"] is None:
                die(f'cue "{cur["id"]}" needs a "spoken phrase" or an @time')
            cues.append(cur)
        elif cur is not None and not raw.startswith("# "):
            cur["note"].append(raw)
    for c in cues:
        c["note"] = "\n".join(c["note"]).strip()
    return cues


def match_phrase(phrase: str, toks: list[str], cursor: int) -> tuple[int, int, float]:
    """Best fuzzy window for phrase at or after cursor. Returns (first, last, score)."""
    target = [norm(w) for w in phrase.split() if norm(w)]
    tjoin = " ".join(target)
    n, tset = len(target), set(target)
    best = (-1, -1, 0.0)
    scored = []
    for i in range(cursor, len(toks)):
        for L in (n, n - 1, n + 1):
            if L < 1 or i + L > len(toks) or not tset.intersection(toks[i:i + L]):
                continue
            s = difflib.SequenceMatcher(None, tjoin, " ".join(toks[i:i + L])).ratio()
            if s >= 0.999:
                return i, i + L - 1, s  # earliest exact match wins
            scored.append((i, i + L - 1, s))
            if s > best[2]:
                best = (i, i + L - 1, s)
    # earliest window that is essentially as good as the best one
    for i, j, s in scored:
        if s >= best[2] - 0.03:
            return i, j, s
    return best


def cmd_cues(a) -> None:
    vdir = video_dir(a.slug)
    wpath = vdir / "02_transcript" / "words.json"
    if not wpath.exists():
        die("no 02_transcript/words.json yet. Run transcribe first.")
    wdata = json.loads(wpath.read_text(encoding="utf-8"))
    words, duration = wdata["words"], wdata["duration"]
    toks = [norm(w["text"]) for w in words]
    md = vdir / "03_cues" / "cues.md"
    if not md.exists():
        die("no 03_cues/cues.md. Write the cue sheet first (see stages/03_cues/CONTEXT.md).")
    cues = parse_cues_md(md.read_text(encoding="utf-8"))
    if not cues:
        die('cues.md has no cues. Each cue is a line like: ## intro "every folder is a workspace"')

    seen, problems, cursor = set(), [], 0
    for c in cues:
        if c["id"] in seen:
            problems.append(f"duplicate id {c['id']}")
        seen.add(c["id"])
        if c["phrase"]:
            i, j, score = match_phrase(c["phrase"], toks, cursor)
            if i < 0 or score < a.threshold:
                near = " ".join(w["text"] for w in words[max(i, 0):max(j, 0) + 1]) if i >= 0 else "-"
                problems.append(f'{c["id"]}: "{c["phrase"]}" not found after {fmt_t(words[cursor]["start"] if cursor < len(words) else duration)}'
                                f' (closest: "{near}" {score:.2f})')
                c.update(start=None, phraseEnd=None, text=near, score=round(score, 2))
                continue
            c.update(start=words[i]["start"], phraseEnd=words[j]["end"], score=round(score, 2),
                     text=" ".join(w["text"] for w in words[i:j + 1]))
            cursor = i
        else:
            c.update(start=c["at"], phraseEnd=c["at"], score=1.0, text="")
            cursor = next((k for k, w in enumerate(words) if w["start"] >= c["at"]), cursor)
        c["start"] = round(max(0.0, c["start"] + c["offset"]), 3)

    if problems:
        print("\n".join("  x " + p for p in problems))
        die("fix cues.md (reword the phrase to match transcript.md, or use @time) and re-run")

    order = sorted(cues, key=lambda c: c["start"])
    depth = lambda c: c["id"].count(".")
    for k, c in enumerate(order):
        c["end"] = next((d["start"] for d in order[k + 1:] if depth(d) <= depth(c)), round(duration, 3))

    voice_rel = f"../01_voice/{wdata['voice']}"
    out_list = [{k: c[k] for k in ("id", "start", "end", "phraseEnd", "phrase", "text", "note", "score", "sfx")} for c in order]
    # optional sound: a "music: <song> [gain]" line before the first cue; [sfx: name] on any cue heading
    mus = re.search(r"^music:\s*(\w+)(?:\s+([\d.]+))?", md.read_text(encoding="utf-8").split("\n## ")[0], re.M)
    payload = {"meta": {"duration": duration, "voice": voice_rel, "slug": a.slug,
                        "music": mus.group(1) if mus else None, "music_gain": float(mus.group(2)) if mus and mus.group(2) else 0.25},
               "cueList": out_list, "cues": {c["id"]: c for c in out_list}, "words": words}
    (vdir / "03_cues" / "cues.json").write_text(json.dumps(payload, indent=1, ensure_ascii=False), encoding="utf-8")
    payload["levels"] = voice_levels(vdir)  # loudness envelope, for mouths and pulses; kept out of cues.json
    (vdir / "03_cues" / "cues.js").write_text(
        "// GENERATED by `python anim.py cues`. Edit cues.md, not this file.\nwindow.ANIM = "
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")

    print(f"{'cue':<24}{'start':>8}{'end':>8}  said")
    for c in order:
        flag = "" if c["score"] >= 0.9 else f"  (fuzzy {c['score']:.2f})"
        print(f"{'  ' * depth(c) + c['id']:<24}{fmt_t(c['start']):>8}{fmt_t(c['end']):>8}  {c['text'][:60]}{flag}")
    print(f"-> {vdir / '03_cues' / 'cues.js'}")


def voice_levels(vdir: Path, rate: int = 60) -> dict:
    """Voice loudness 0-100 at `rate` per second. Cached in 02_transcript/levels.json."""
    voice = find_voice(vdir)
    cache = vdir / "02_transcript" / "levels.json"
    if cache.exists() and cache.stat().st_mtime >= voice.stat().st_mtime:
        return json.loads(cache.read_text())
    import numpy as np
    sr = 12000
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(voice), "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    if x.size == 0 or np.max(np.abs(x)) < 1e-7:
        data = {"rate": rate, "data": [0] * max(1, int(len(x) / sr * rate))}
        cache.write_text(json.dumps(data, separators=(",", ":")))
        return data
    hop = sr // rate
    n = len(x) // hop
    rms = np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-10)
    db = 20 * np.log10(rms)
    top = np.percentile(db, 97)
    lv = np.clip((db - (top - 38)) / 38, 0, 1) ** 1.4  # ~38 dB of range below the loud parts
    out, cur = [], 0.0
    for v in lv:  # fast attack, slower release, like a mouth
        cur = v if v > cur else cur + (v - cur) * 0.35
        out.append(int(round(cur * 100)))
    data = {"rate": rate, "data": out}
    cache.write_text(json.dumps(data, separators=(",", ":")))
    return data


# ── browser rendering (stills + render) ─────────────────────────────────────

def scene_url(vdir: Path) -> str:
    idx = vdir / "04_scene" / "index.html"
    if not idx.exists():
        die("no 04_scene/index.html")
    if not (vdir / "03_cues" / "cues.js").exists():
        die("no 03_cues/cues.js. Run `cues` first.")
    return idx.resolve().as_uri() + "?render"


async def open_page(p, url: str):
    try:
        browser = await p.chromium.launch(channel="chrome")
    except Exception:
        browser = await p.chromium.launch()
    page = await browser.new_page(viewport={"width": 1920, "height": 1080})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: m.type == "error" and errors.append(m.text))
    import os
    if os.environ.get("ANIM_OFFLINE") == "1":
        async def block_external(route):
            if route.request.url.startswith(("http://", "https://")) and not route.request.url.startswith(("http://127.0.0.1:", "http://localhost:")):
                await route.abort()
            else:
                await route.continue_()
        await page.route("**/*", block_external)
    await page.goto(url)
    await page.wait_for_function("window.__ready === true", timeout=30000)
    size = await page.evaluate("window.__size")
    await page.set_viewport_size({"width": size["w"], "height": size["h"]})
    await page.evaluate("window.__seek(0)")
    if errors:
        await browser.close()
        die("scene startup failed: " + "; ".join(errors[:5]))
    return browser, page, size, errors


async def seek_shot(page, t: float, fmt: str = "jpeg", quality: int = 92) -> bytes:
    await page.evaluate(f"window.__seek({t:.4f})")
    if fmt == "png":
        return await page.screenshot(type="png")
    return await page.screenshot(type="jpeg", quality=quality)


def cmd_stills(a) -> None:
    vdir = video_dir(a.slug)
    url = scene_url(vdir)
    cues = json.loads((vdir / "03_cues" / "cues.json").read_text(encoding="utf-8"))["cueList"]
    out = vdir / "05_render" / "stills"
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    if a.at:
        shots = [{"id": f"t{parse_t(t):.1f}", "t": parse_t(t), "text": "", "note": ""} for t in a.at.split(",")]
    else:
        shots = [{"id": c["id"], "t": c["start"] + min(a.hold, (c["end"] - c["start"]) * 0.6),
                  "text": c["text"], "note": c["note"]} for c in cues]

    async def run():
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser, page, _, errors = await open_page(p, url)
            for k, s in enumerate(shots):
                s["file"] = f"{k:03d}_{s['id']}.png"
                (out / s["file"]).write_bytes(await seek_shot(page, s["t"], "png"))
            await browser.close()
            return errors

    errors = asyncio.run(run())
    write_contact(vdir, a.slug, shots)
    n = write_sheets(vdir, shots)
    for e in errors[:10]:
        print("  page error: " + e)
    print(f"{len(shots)} stills -> {vdir / '05_render' / 'contact.html'}  (+ contact.png, sheets/ x{n})")


def write_sheets(vdir: Path, shots: list[dict]) -> int:
    """Labelled review sheets, 12 stills each (10 for tall): quick to read, for a person or for Claude."""
    from PIL import Image, ImageDraw
    out = vdir / "05_render" / "sheets"
    shutil.rmtree(out, ignore_errors=True)
    out.mkdir(parents=True)
    tall = 'data-height="1920"' in (vdir / "04_scene" / "index.html").read_text(encoding="utf-8")
    w, h, cols, rows = (270, 480, 5, 2) if tall else (640, 360, 3, 4)
    per = cols * rows
    for s0 in range(0, len(shots), per):
        sheet = Image.new("RGB", (w * cols, (h + 22) * rows), (20, 18, 16))
        d = ImageDraw.Draw(sheet)
        for k, s in enumerate(shots[s0:s0 + per]):
            x, y = (k % cols) * w, (k // cols) * (h + 22)
            sheet.paste(Image.open(vdir / "05_render" / "stills" / s["file"]).convert("RGB").resize((w, h), Image.NEAREST), (x, y + 22))
            d.text((x + 6, y + 4), f"{s['id']}  {fmt_t(s['t'])}", fill=(240, 200, 150))
        sheet.save(out / f"sheet_{s0 // per:02d}.png")
    return (len(shots) + per - 1) // per


def write_contact(vdir: Path, slug: str, shots: list[dict]) -> None:
    cards = "\n".join(
        f'<figure><img src="stills/{s["file"]}"><figcaption><b>{html.escape(s["id"])}</b> '
        f'<code>{fmt_t(s["t"])}</code><br><q>{html.escape(s["text"])}</q>'
        f'<small>{html.escape(s["note"])}</small></figcaption></figure>' for s in shots)
    page = vdir / "05_render" / "contact.html"
    page.write_text(CONTACT.format(slug=slug, cards=cards), encoding="utf-8")

    async def shoot():  # one image of the whole sheet, handy for a quick look (or for Claude to read)
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            try:
                b = await p.chromium.launch(channel="chrome")
            except Exception:
                b = await p.chromium.launch()
            pg = await b.new_page(viewport={"width": 1800, "height": 900})
            await pg.goto(page.resolve().as_uri())
            await pg.screenshot(path=str(vdir / "05_render" / "contact.png"), full_page=True)
            await b.close()
    asyncio.run(shoot())


CONTACT = """<!doctype html><meta charset="utf-8"><title>{slug} stills</title>
<style>body{{font:14px system-ui;background:#1b1917;color:#e9e3d6;margin:24px}}
main{{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:20px}}
figure{{margin:0}}img{{width:100%;display:block;border-radius:4px}}
figcaption{{padding:8px 2px;line-height:1.4}}code{{color:#e4a07e}}q{{color:#b9b1a3}}
small{{display:block;color:#8a8175;white-space:pre-wrap;margin-top:4px}}</style>
<h1>{slug}</h1><main>{cards}</main>"""


def cmd_render(a) -> None:
    if not shutil.which("ffmpeg"):
        die("ffmpeg not on PATH")
    vdir = video_dir(a.slug)
    url = scene_url(vdir)
    meta = json.loads((vdir / "03_cues" / "cues.json").read_text(encoding="utf-8"))["meta"]
    voice = find_voice(vdir)
    t0 = parse_t(a.start) if a.start else 0.0
    t1 = min(parse_t(a.end), meta["duration"]) if a.end else meta["duration"]
    if t1 <= t0:
        die("--end must be after --start")
    fps = a.fps
    total = math.ceil((t1 - t0) * fps)
    workers = max(1, min(a.workers, total // (fps * 2) or 1))
    out_dir = vdir / "05_render"
    tmp = out_dir / "_segments"
    shutil.rmtree(tmp, ignore_errors=True)
    tmp.mkdir(parents=True)
    suffix = f"_{int(t0)}-{int(t1)}s" if (a.start or a.end) else ""
    final = out_dir / f"{a.slug}{suffix}.mp4"
    chunks = [(k * total // workers, (k + 1) * total // workers) for k in range(workers)]
    done = [0]
    started = time.time()

    async def worker(p, k, f0, f1):
        browser, page, size, errors = await open_page(p, url)
        seg = tmp / f"seg{k:02d}.mp4"
        ff = await asyncio.create_subprocess_exec(
            "ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(fps), "-i", "-",
            "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2", "-c:v", "libx264", "-preset", "medium",
            "-crf", str(a.crf), "-pix_fmt", "yuv420p", str(seg),
            stdin=asyncio.subprocess.PIPE)
        for f in range(f0, f1):
            ff.stdin.write(await seek_shot(page, t0 + f / fps, quality=a.quality))
            await ff.stdin.drain()
            done[0] += 1
            if k == 0 and done[0] % (fps * 2) == 0:
                el = time.time() - started
                print(f"\r  {done[0]}/{total} frames  {done[0] / el:.1f} fps  "
                      f"eta {fmt_t((total - done[0]) / (done[0] / el))}", end="", flush=True)
        ff.stdin.close()
        await ff.wait()
        await browser.close()
        return seg, errors

    async def run():
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            return await asyncio.gather(*(worker(p, k, f0, f1) for k, (f0, f1) in enumerate(chunks)))

    print(f"rendering {total} frames @ {fps}fps, {workers} workers, {fmt_t(t0)} -> {fmt_t(t1)}")
    results = asyncio.run(run())
    print()
    (tmp / "list.txt").write_text("".join(f"file '{seg.name}'\n" for seg, _ in results))
    cut = ["-ss", f"{t0:.3f}", "-t", f"{t1 - t0:.3f}"]
    audio_in, amap = cut + ["-i", str(voice)], ["-filter_complex", "[1:a]alimiter=limit=0.89:level=false[a]", "-map", "[a]"]
    cue_list = json.loads((vdir / "03_cues" / "cues.json").read_text(encoding="utf-8"))["cueList"]
    events = [(c["start"], s) for c in cue_list for s in c.get("sfx") or []]
    if meta.get("music") or events:  # 8-bit bed ducked under the voice, effects on top
        sys.path.insert(0, str(ROOT / "_runtime"))
        import chip
        bed, fx = chip.soundtrack(meta["duration"], meta.get("music"), events, meta.get("music_gain", 0.25))
        # effects sit well under the voice (at full level they were louder than it); "sfx: 0.4" in cues.md overrides
        fxm = re.search(r"^sfx:\s*([\d.]+)", (vdir / "03_cues" / "cues.md").read_text(encoding="utf-8").split("\n## ")[0], re.M)
        fx = fx * (float(fxm.group(1)) if fxm else FX_GAIN)
        chip.write_wav(tmp / "music.wav", bed)
        chip.write_wav(tmp / "fx.wav", fx)
        audio_in += cut + ["-i", str(tmp / "music.wav")] + cut + ["-i", str(tmp / "fx.wav")]
        amap = ["-filter_complex", "[1:a]aresample=44100,asplit=2[v1][v2];[2:a][v1]sidechaincompress=threshold=0.02:ratio=10:"
                "attack=15:release=500[bed];[v2][bed][3:a]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.89:level=false[a]", "-map", "[a]"]
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(tmp / "list.txt"),
                    *audio_in, "-map", "0:v", *amap, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-movflags", "+faststart", "-shortest", str(final)], check=True)
    shutil.rmtree(tmp, ignore_errors=True)
    for e in sorted({e for _, errs in results for e in errs})[:10]:
        print("  page error: " + e)
    peak = audio_peak(final)
    if peak is not None and peak > -0.5:  # a sharp effect can slip past the limiter and AAC overshoots: pull the mix down
        fixed = final.with_name(final.stem + "-level.mp4")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(final), "-map", "0", "-c:v", "copy", "-af", f"volume={-1.0 - peak:.2f}dB",
                        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(fixed)], check=True)
        fixed.replace(final)
        print(f"  audio peak was {peak:.1f} dB, mix lowered to -1 dB")
        peak = audio_peak(final)
    print(f"-> {final}  ({time.time() - started:.0f}s, audio peak {peak if peak is not None else '?'} dB)")
    if a.phone:
        small = phone_copy(final, smooth="line.js" in (vdir / "04_scene" / "index.html").read_text(encoding="utf-8"))
        print(f"-> {small}  ({small.stat().st_size / 2**20:.0f} MiB)")


def phone_copy(final: Path, smooth: bool) -> Path:
    """A copy under the 30 MiB cap for phone and web viewers, named by its height (<slug>-720p.mp4).
    Exact scale steps (2/3, 1/2, 1/3) keep pixel art crisp with nearest; line art scales smooth. The bitrate is capped
    to what fits the length, and a long video drops a step, because fewer pixels at the same bits look cleaner."""
    probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration",
                                       "-of", "json", str(final)], capture_output=True, text=True).stdout)
    w, h, dur = probe["streams"][0]["width"], probe["streams"][0]["height"], float(probe["format"]["duration"])
    audio = 96 if dur < 300 else 48  # kbps; long videos are mostly voice
    video = int(28 * 2**20 * 8 / dur / 1000) - audio  # kbps that fit 28 MiB, room left for the container
    num, den = (2, 3) if video >= 600 else (1, 2) if video >= 150 else (1, 3)
    small = final.with_name(f"{final.stem}-{h * num // den}p.mp4")
    for old in final.parent.glob(f"{final.stem}-*p.mp4"):
        if re.fullmatch(r"\d+p", old.stem[len(final.stem) + 1:]):
            old.unlink()
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(final), "-vf", f"scale={w * num // den}:{h * num // den}:flags={'lanczos' if smooth else 'neighbor'}",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-maxrate", f"{video}k", "-bufsize", f"{video * 2}k", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-b:a", f"{audio}k", *(["-ac", "1"] if audio < 96 else []), "-movflags", "+faststart", str(small)], check=True)
    return small


# ── cut: keep only some stretches of a finished render (no re-render) ────────

def cmd_cut(a) -> None:
    """05_render/<slug>.mp4 -> 05_render/<slug>-post.mp4, keeping only the --keep stretches, joined in order.
    Joins get a 20 ms audio fade so nothing clicks; the start fades in over --fade-in, the end out over --fade-out.
    Also writes post-first.png and post-last.png to check the new first and last frames."""
    vdir = video_dir(a.slug)
    src = vdir / "05_render" / f"{a.slug}.mp4"
    if not src.exists():
        die(f"no {src.name}. Run `render` first.")
    keep, vends = [], []  # vends: where each stretch's picture ends (A-B@V), None = with its sound
    for k in a.keep:
        m = re.fullmatch(r"([\d:.]+)?-([\d:.]+|end)?(?:@([\d:.]+))?", k)
        if not m:
            die(f"--keep {k}: use A-B in seconds or m:ss, e.g. 0.82-51.3 or 0.82-end (A-B@V ends its picture at V)")
        t0 = parse_t(m.group(1)) if m.group(1) else 0.0
        t1 = None if m.group(2) in (None, "end") else parse_t(m.group(2))
        keep.append((t0, t1))
        vends.append(parse_t(m.group(3)) if m.group(3) else None)
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(src)],
                               capture_output=True, text=True, check=True).stdout.strip())
    keep = [(t0, dur if t1 is None else min(t1, dur)) for t0, t1 in keep]
    if any(t1 - t0 < 0.1 for t0, t1 in keep) or any(keep[i][1] > keep[i + 1][0] for i in range(len(keep) - 1)):
        die("each --keep must be at least 0.1 s long, in order, not overlapping")
    vfrom = parse_t(a.video_from) if a.video_from else keep[0][0]
    if not keep[0][0] <= vfrom < keep[0][1]:
        die("--video-from must fall inside the first --keep")
    if a.video_to:
        if vends[-1] is not None:
            die("end the last picture once: --video-to or @V on the last --keep, not both")
        vends[-1] = parse_t(a.video_to)
        if not keep[-1][0] < vends[-1] <= keep[-1][1]:
            die("--video-to must fall inside the last --keep")
    for i, ((t0, t1), ve) in enumerate(zip(keep, vends)):
        if ve is not None and not (vfrom if i == 0 else t0) < ve <= t1:
            die(f"--keep {a.keep[i]}: the picture end @V must fall inside A-B (and after --video-from)")
    j, parts, n = 0.02, [], len(keep)
    inputs, vsrc = ["-i", str(src)], ["[0:v]"] * n
    if a.clean_to:  # re-draw 0..T with the HEY, YOU card hidden (?nogreet), then the render's own frames from T on
        fps = 30
        k = round(parse_t(a.clean_to) * fps)
        head = vdir / "05_render" / "_clean-head.mp4"

        async def shoot():
            from playwright.async_api import async_playwright
            async with async_playwright() as p:
                browser, page, size, errors = await open_page(p, scene_url(vdir) + "&nogreet")
                ff = await asyncio.create_subprocess_exec(
                    "ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(fps), "-i", "-",
                    "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
                    "-pix_fmt", "yuv420p", str(head), stdin=asyncio.subprocess.PIPE)
                for f in range(k):
                    ff.stdin.write(await seek_shot(page, f / fps, quality=92))
                    await ff.stdin.drain()
                ff.stdin.close()
                await ff.wait()
                await browser.close()
                return errors

        print(f"re-drawing 0-{k / fps:.2f} s without the greeting card ({k} frames)")
        for e in asyncio.run(shoot())[:10]:
            print("  page error: " + e)
        inputs += ["-i", str(head)]
        parts.append(f"[1:v]setpts=PTS-STARTPTS[hd];[0:v]trim=start={k / fps:.4f},setpts=PTS-STARTPTS[tl];"
                     f"[hd][tl]concat=n=2:v=1:a=0,split={n}" + "".join(f"[s{i}]" for i in range(n)) + ";")
        vsrc = [f"[s{i}]" for i in range(n)]
    for i, (t0, t1) in enumerate(keep):
        fin = a.fade_in if i == 0 else j
        fout = a.fade_out if i == n - 1 else j
        v0, hold = (vfrom, vfrom - t0) if i == 0 else (t0, 0.0)  # the picture may start a beat later, first frame held
        v1 = t1 if vends[i] is None else vends[i]                  # or end a beat early (A-B@V, --video-to),
        tail = t1 - v1                                             # its last frame held while the sound finishes
        pad = f",tpad=start_mode=clone:start_duration={hold:.3f}" if hold > 0 else ""
        pad += f",tpad=stop_mode=clone:stop_duration={tail:.3f}" if tail > 0 else ""
        parts.append(f"{vsrc[i]}trim=start={v0:.3f}:end={v1:.3f},setpts=PTS-STARTPTS{pad}[v{i}];"
                     f"[0:a]atrim=start={t0:.3f}:end={t1:.3f},asetpts=PTS-STARTPTS,afade=t=in:d={fin:.3f},"
                     f"afade=t=out:st={max(0.0, t1 - t0 - fout):.3f}:d={fout:.3f}[a{i}];")
    graph = "".join(parts) + "".join(f"[v{i}][a{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=1[v][a]"
    out = vdir / "05_render" / f"{a.slug}-post.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", graph, "-map", "[v]", "-map", "[a]",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out)], check=True)
    (vdir / "05_render" / "_clean-head.mp4").unlink(missing_ok=True)
    for name, pos in (("post-first.png", ["-ss", "0"]), ("post-last.png", ["-sseof", "-0.5"])):  # -update keeps the last frame read
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *pos, "-i", str(out), "-update", "1",
                        *(["-frames:v", "1"] if name == "post-first.png" else []), str(vdir / "05_render" / name)], check=True)
    new = sum(t1 - t0 for t0, t1 in keep)
    print("kept " + ", ".join(f"{fmt_t(t0)}-{fmt_t(t1)}" for t0, t1 in keep) + f"  ({dur:.2f} s -> {new:.2f} s)")
    print(f"-> {out}  (audio peak {audio_peak(out)} dB); first and last frames: 05_render/post-first.png, post-last.png")


# ── chapters: top-level cues as YouTube chapter times ──────────────────────

def cmd_chapters(a) -> None:
    vdir = video_dir(a.slug)
    cues = [c for c in json.loads((vdir / "03_cues" / "cues.json").read_text(encoding="utf-8"))["cueList"] if "." not in c["id"]]
    cues = [c for i, c in enumerate(cues) if i + 1 == len(cues) or cues[i + 1]["start"] - c["start"] >= 10 or i == 0]
    print("Top-level cues (merge any under 10 s; YouTube needs 0:00 first and 10 s per chapter). Write real titles:")
    for i, c in enumerate(cues):
        s = 0 if i == 0 else int(c["start"])
        print(f"{s // 60}:{s % 60:02d} {c['id']}: {c['text']}")


# ── grab: a real web page into 04_scene/assets/, for Eduba.screenshot ───────

def cmd_grab(a) -> None:
    vdir = video_dir(a.slug)
    out = vdir / "04_scene" / "assets"
    out.mkdir(parents=True, exist_ok=True)
    f = out / f"{a.name}.png"

    async def run():
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            try:
                b = await p.chromium.launch(channel="chrome")
            except Exception:
                b = await p.chromium.launch()
            ctx = await b.new_context(viewport={"width": 1280, "height": 800}, device_scale_factor=2,
                                      color_scheme="light" if a.light else "dark")
            pg = await ctx.new_page()
            await pg.goto(a.url, wait_until="networkidle", timeout=60000)
            await pg.wait_for_timeout(2500)  # let fonts and animations settle
            top = 0
            if a.find:
                el = pg.get_by_text(a.find).first
                await el.scroll_into_view_if_needed()
                top = max(0, int(await el.evaluate("e => e.getBoundingClientRect().top + window.scrollY")) - a.above)
            await pg.screenshot(path=str(f), full_page=True, clip={"x": 0, "y": top, "width": a.width, "height": a.height})
            await b.close()

    asyncio.run(run())
    print(f"-> {f}  (in scene.js: const X = E.image('assets/{a.name}.png'); then E.screenshot(g, X, ...) or Desk.browser)")


# ── real: real content for the screens (desk.js), captured, never typed ────
# Everything lands in 04_scene/assets/real.js as window.REAL = { files, trees, runs, clips }.

REAL_SKIP = {"__pycache__", "node_modules"}
SECRET = re.compile(r"sk_[A-Za-z0-9]{8,}")


def real_path(p: str) -> Path:
    path = (ROOT / p).resolve() if not Path(p).is_absolute() else Path(p).resolve()
    if any(part.startswith(".") for part in path.relative_to(path.anchor).parts):
        die(f"{p}: hidden files and folders (.env, .claude, ...) never go on screen")
    if not path.exists():
        die(f"{p} not found")
    return path


def real_tree(root: Path, depth: int) -> list:
    out = []
    def walk(d: Path, rel: str, level: int):
        kids = [k for k in d.iterdir() if not k.name.startswith(".") and k.name not in REAL_SKIP]
        for k in sorted(kids, key=lambda k: (not k.is_dir(), k.name.lower())):
            path = f"{rel}{k.name}"
            out.append([path, k.is_dir()])
            if k.is_dir() and level < depth:
                walk(k, path + "/", level + 1)
    walk(root, "", 1)
    return out


def cmd_real(a) -> None:
    ran = None
    if a.kind == "run" and a.target:  # run first: the command may be the `new` that makes this video
        if ".env" in a.target:
            die("never put .env on screen")
        import os
        env = {**os.environ, "PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"}
        ran = subprocess.run(a.target, shell=True, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                             text=True, encoding="utf-8", errors="replace", timeout=a.timeout, env=env)
    vdir = video_dir(a.slug)
    assets = vdir / "04_scene" / "assets"
    assets.mkdir(parents=True, exist_ok=True)
    js = assets / "real.js"
    data = {}
    if js.exists():
        m = re.search(r"window\.REAL = (\{.*\});\s*$", js.read_text(encoding="utf-8"), re.S)
        data = json.loads(m.group(1)) if m else {}
    for k in ("files", "trees", "runs", "clips"):
        data.setdefault(k, {})

    if a.kind == "list":
        for k in ("files", "trees", "runs", "clips"):
            for name, v in data[k].items():
                size = f"{len(v)} lines" if k == "files" else f"{len(v)} entries" if k == "trees" else \
                       f"{len(v['out'])} lines of output" if k == "runs" else f"{v['n']} frames at {v['fps']} fps"
                print(f"{k[:-1]:<5} {name:<40} {size}")
        return
    if not a.target:
        die(f"real {a.kind} needs a target (a path, a command in quotes, or a video)")

    if a.kind == "file":
        path = real_path(a.target)
        name = a.name or path.relative_to(ROOT).as_posix()
        data["files"][name] = path.read_text(encoding="utf-8", errors="replace").splitlines()[:a.head or None]
        print(f"file  {name}: {len(data['files'][name])} lines")
    elif a.kind == "tree":
        path = real_path(a.target)
        name = a.name or (path.relative_to(ROOT).as_posix() if path != ROOT else ROOT.name)
        data["trees"][name] = real_tree(path, a.depth)
        print(f"tree  {name}: {len(data['trees'][name])} entries, {a.depth} levels deep")
    elif a.kind == "run":
        r = ran
        out = [SECRET.sub("sk_...", re.sub(r"\x1b\[[0-9;?]*[A-Za-z]", "", ln)).rstrip() for ln in r.stdout.splitlines()]
        while out and not out[-1]:
            out.pop()
        name = a.name or re.sub(r"[^a-z0-9]+", "-", a.target.lower()).strip("-")[:40]
        data["runs"][name] = {"cmd": a.target, "out": out, "code": r.returncode}
        print("\n".join(out[-12:]))
        print(f"run   {name}: {len(out)} lines" + (f"  (exit code {r.returncode})" if r.returncode else ""))
    elif a.kind == "clip":
        src = real_path(a.target)
        if not (a.name and a.start and a.end):
            die("real clip needs --as NAME --start A --end B")
        t0, t1 = parse_t(a.start), parse_t(a.end)
        out = assets / a.name
        out.mkdir(exist_ok=True)
        for old in out.glob("f*.jpg"):
            old.unlink()
        vf = f"fps={a.fps}" + (f",scale={a.width}:-2" if a.width else "")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0:.3f}", "-t", f"{t1 - t0:.3f}", "-i", str(src),
                        "-vf", vf, "-q:v", "3", str(out / "f%03d.jpg")], check=True)
        n = len(list(out.glob("f*.jpg")))
        data["clips"][a.name] = {"n": n, "fps": a.fps, "src": src.name, "start": t0, "end": t1}
        print(f"clip  {a.name}: {n} frames at {a.fps} fps -> {out}  (in scene.js: const X = Desk.clip('{a.name}'))")

    data["captured"] = time.strftime("%Y-%m-%d")
    # paths on screen start at the workspace, like the prompt (...\animations): never the user's home folder
    here = [(str(ROOT), "..." + "\\" + ROOT.name), (ROOT.as_posix(), ".../" + ROOT.name), (str(Path.home()), "~"), (Path.home().as_posix(), "~")]
    def trim(line: str) -> str:
        for a, b in here:
            line = line.replace(a, b)
        return line
    data["files"] = {k: [trim(l) for l in v] for k, v in data["files"].items()}
    data["runs"] = {k: {**v, "cmd": trim(v["cmd"]), "out": [trim(l) for l in v["out"]]} for k, v in data["runs"].items()}
    js.write_text("// GENERATED by `python anim.py real`. Real content for the screens: capture it again, never edit it.\n"
                  "window.REAL = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    idx = vdir / "04_scene" / "index.html"
    if idx.exists():  # the page loads desk.js and real.js before scene.js
        page = idx.read_text(encoding="utf-8")
        if "desk.js" not in page:
            page = page.replace('<script src="../../../_runtime/eduba.js"></script>',
                                '<script src="../../../_runtime/eduba.js"></script>\n<script src="../../../_runtime/desk.js"></script>')
        if "assets/real.js" not in page:
            page = page.replace('<script src="scene.js"></script>', '<script src="assets/real.js"></script>\n<script src="scene.js"></script>')
        idx.write_text(page, encoding="utf-8")


# ── thumbnail ───────────────────────────────────────────────────────────────

def cmd_thumbnail(a) -> None:
    vdir = video_dir(a.slug)
    page = vdir / "04_scene" / "thumbnail.html"
    if not page.exists():
        die("no 04_scene/thumbnail.html (copy the one from a past video and change thumbnail.js)")
    out = vdir / "05_render"
    out.mkdir(exist_ok=True)

    async def run():
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser, pg, _, errors = await open_page(p, page.resolve().as_uri() + "?render&v=1")
            for v in await pg.evaluate("window.THUMBS"):
                await pg.goto(page.resolve().as_uri() + f"?render&v={v}")
                await pg.wait_for_function("window.__ready === true", timeout=30000)
                await pg.evaluate("window.__seek(0)")
                f = out / f"thumbnail-{v}.png"
                f.write_bytes(await pg.screenshot(type="png"))
                print(f"  {f.name}")
            await browser.close()
            return errors

    errors = asyncio.run(run())
    from PIL import Image  # YouTube size; 1080p to 720p is an exact 2/3 step for this art, so the pixels stay crisp
    tall = False
    smooth = "line.js" in page.read_text(encoding="utf-8")  # line art is anti-aliased; pixel art stays nearest
    for f in out.glob("thumbnail-*.png"):
        im = Image.open(f)
        tall = im.height > im.width  # a Short's cover stays 1080x1920; keep it inside the middle 3:4 for Instagram's grid
        if not tall:
            im.resize((1280, 720), Image.LANCZOS if smooth else Image.NEAREST).save(f)
    for e in errors[:10]:
        print("  page error: " + e)
    print(f"-> {out}  ({'1080x1920' if tall else '1280x720'})")


# ── trace (Line kit) ────────────────────────────────────────────────────────
# A line drawing -> strokes Line.drawing() can draw on and boil. Light lines on dark or dark on light;
# saturated colour becomes the accent (thin marks as strokes, big areas as fills).

def _thin(mask):
    """Zhang-Suen thinning, vectorised."""
    import numpy as np
    img = np.pad(mask.astype(np.uint8), 1)
    changed = True
    while changed:
        changed = False
        for step in (0, 1):
            c = img[1:-1, 1:-1]
            n = [img[:-2, 1:-1], img[:-2, 2:], img[1:-1, 2:], img[2:, 2:], img[2:, 1:-1], img[2:, :-2], img[1:-1, :-2], img[:-2, :-2]]
            b = sum(x.astype(np.int16) for x in n)
            a = sum(((n[i] == 0) & (n[(i + 1) % 8] == 1)).astype(np.int16) for i in range(8))
            m = ((n[0] * n[2] * n[4] == 0) & (n[2] * n[4] * n[6] == 0)) if step == 0 else ((n[0] * n[2] * n[6] == 0) & (n[0] * n[4] * n[6] == 0))
            rem = (c == 1) & (b >= 2) & (b <= 6) & (a == 1) & m
            if rem.any():
                c[rem] = 0
                changed = True
    return img[1:-1, 1:-1].astype(bool)


def _paths(skel, spur):
    """Skeleton pixels -> polylines (x, y), walked on m-adjacency so stair steps aren't junctions."""
    import numpy as np
    pts = set(zip(*[v.tolist() for v in np.nonzero(skel)]))

    def nb(p):
        y, x = p
        out = [(y + dy, x + dx) for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)) if (y + dy, x + dx) in pts]
        for dy, dx in ((-1, -1), (-1, 1), (1, -1), (1, 1)):
            q = (y + dy, x + dx)
            if q in pts and (y + dy, x) not in pts and (y, x + dx) not in pts:
                out.append(q)
        return out
    N = {p: nb(p) for p in pts}
    junction = {p for p in pts if len(N[p]) >= 3}
    seen, paths = set(), []

    def walk(a, b):
        path, prev, cur = [a, b], a, b
        seen.add(frozenset((a, b)))
        while cur not in junction and len(N[cur]) == 2:
            nxt = [q for q in N[cur] if q != prev and frozenset((cur, q)) not in seen]
            if not nxt:
                break
            prev, cur = cur, nxt[0]
            seen.add(frozenset((prev, cur)))
            path.append(cur)
        return path
    for group in ([p for p in pts if len(N[p]) == 1], sorted(junction), sorted(pts)):
        for p in group:
            for q in N[p]:
                if frozenset((p, q)) not in seen:
                    paths.append(walk(p, q))
    # drop spurs: short branches from a junction to a free end
    paths = [q for q in paths if not (len(q) < spur and ((q[0] in junction) != (q[-1] in junction)))]

    def direction(path, at_start):
        k = min(len(path) - 1, 6)
        a, b = (path[0], path[k]) if at_start else (path[-1], path[-1 - k])
        v = np.array([b[1] - a[1], b[0] - a[0]], float)
        return v / (np.linalg.norm(v) or 1)
    # join paths that run straight on through a junction, so the pen draws them as one line
    merged = True
    while merged:
        merged = False
        ends = {}
        for i, q in enumerate(paths):
            for at_start in (True, False):
                j = q[0] if at_start else q[-1]
                if j in junction:
                    ends.setdefault(j, []).append((i, at_start))
        for lst in ends.values():
            best = None
            for x in range(len(lst)):
                for y in range(x + 1, len(lst)):
                    (i1, s1), (i2, s2) = lst[x], lst[y]
                    if i1 == i2:
                        continue
                    d = float(direction(paths[i1], s1) @ direction(paths[i2], s2))
                    if d < -0.8 and (best is None or d < best[0]):
                        best = (d, i1, s1, i2, s2)
            if best:
                _, i1, s1, i2, s2 = best
                a = paths[i1][::-1] if s1 else paths[i1]
                b = paths[i2] if s2 else paths[i2][::-1]
                paths[i1] = a + b[1:]
                paths.pop(i2)
                merged = True
                break
    return [[(x + 0.5, y + 0.5) for y, x in q] for q in paths]


def _rdp(pts, eps):
    import numpy as np
    if len(pts) < 3:
        return pts
    a, b, P = np.array(pts[0]), np.array(pts[-1]), np.array(pts)
    d = b - a
    L = float(np.hypot(*d))
    dist = np.abs(d[0] * (P[:, 1] - a[1]) - d[1] * (P[:, 0] - a[0])) / L if L else np.hypot(*(P - a).T)
    i = int(np.argmax(dist))
    if dist[i] > eps:
        return _rdp(pts[: i + 1], eps)[:-1] + _rdp(pts[i:], eps)
    return [pts[0], pts[-1]]


def _smooth(pts, k=2):
    if len(pts) < 2 * k + 1:
        return pts
    out = [pts[0]]
    for i in range(1, len(pts) - 1):
        w = pts[max(0, i - k): i + k + 1]
        out.append((sum(p[0] for p in w) / len(w), sum(p[1] for p in w) / len(w)))
    return out + [pts[-1]]


def _outline(mask):
    """Outer boundary of one blob (Moore neighbour tracing), as (x, y)."""
    import numpy as np
    ys, xs = np.nonzero(mask)
    i = int(np.argmin(ys * mask.shape[1] + xs))
    start = (int(ys[i]), int(xs[i]))
    dirs = [(-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1)]
    H, W = mask.shape
    cur, d, out = start, 6, [start]
    for _ in range(int(mask.sum()) * 4 + 8):
        for k in range(8):
            nd = (d + 6 + k) % 8
            y, x = cur[0] + dirs[nd][0], cur[1] + dirs[nd][1]
            if 0 <= y < H and 0 <= x < W and mask[y, x]:
                cur, d = (y, x), nd
                break
        else:
            break
        if cur == start:
            break
        out.append(cur)
    return [(x + 0.5, y + 0.5) for y, x in out]


def cmd_trace(a) -> None:
    import numpy as np
    from PIL import Image, ImageDraw
    from scipy import ndimage as ndi
    src = Path(a.image)
    if not src.is_file():
        die(f"no image: {src}")
    im = Image.open(src).convert("RGB")
    if a.crop:
        c = [float(v) for v in a.crop.split(",")]
        if all(v <= 1 for v in c):
            c = [c[0] * im.width, c[1] * im.height, c[2] * im.width, c[3] * im.height]
        im = im.crop(tuple(int(v) for v in c))
    k = min(1.0, a.size / max(im.size))
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    arr = np.asarray(im).astype(np.float32) / 255
    lum = arr @ np.array([0.299, 0.587, 0.114], np.float32)
    mx, mn = arr.max(2), arr.min(2)
    sat = (mx - mn) / (mx + 1e-6)
    bg = float(np.median(np.concatenate([lum[0], lum[-1], lum[:, 0], lum[:, -1]])))
    contrast = lum - bg if bg < 0.5 else bg - lum
    accent = (sat > 0.45) & (mx > 0.3) & (np.abs(lum - bg) > 0.12)
    ink = (contrast > a.threshold) & ~accent

    def clean(m):
        lab, n = ndi.label(m, structure=np.ones((3, 3)))
        if not n:
            return m
        sizes = ndi.sum(m, lab, range(1, n + 1))
        return np.isin(lab, 1 + np.nonzero(sizes >= a.min_area)[0])
    ink, accent = clean(ink), clean(accent)
    if not ink.any() and not accent.any():
        die("found no lines. Try --threshold 0.2, or check it is line art on a plain background")
    dt = ndi.distance_transform_edt(ink)
    sk = _thin(ink)
    lw = float(2 * np.median(dt[sk])) if sk.any() else 3.0
    strokes, fills = [], []
    # solid ink areas (much thicker than a line) become fills, not a tangle of centre lines
    solid = ndi.binary_dilation(dt > 1.8 * lw, iterations=max(1, int(1.8 * lw))) & ink
    if solid.sum() > 20 * lw * lw:
        lab, n = ndi.label(solid, structure=np.ones((3, 3)))
        for i in range(1, n + 1):
            m = lab == i
            if m.sum() > 12 * lw * lw:
                fills.append(("ink", _outline(m)))
        sk = _thin(ink & ~solid)

    def add_strokes(skel, colour):
        for q in _paths(skel, spur=max(4, int(lw * 1.6))):
            q = _rdp(_smooth(q), a.eps)
            L = sum(math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]) for i in range(1, len(q)))
            if L >= a.min_len:
                strokes.append((colour, q))
    add_strokes(sk, "ink")
    if accent.any():
        adt = ndi.distance_transform_edt(accent)
        lab, n = ndi.label(accent, structure=np.ones((3, 3)))
        for i in range(1, n + 1):
            m = lab == i
            if 2 * adt[m].max() <= 2.2 * lw:
                add_strokes(_thin(m), "accent")
            else:
                fills.append(("accent", _outline(m)))
    # draw order: the nearest stroke next, from the top-left, each one flipped to start at its near end
    order, left, pos = [], list(range(len(strokes))), (0.0, 0.0)
    d2 = lambda p: (p[0] - pos[0]) ** 2 + (p[1] - pos[1]) ** 2
    while left:
        best = min(left, key=lambda i: min(d2(strokes[i][1][0]), d2(strokes[i][1][-1])))
        c, q = strokes[best]
        if d2(q[-1]) < d2(q[0]):
            q = q[::-1]
        order.append((c, q))
        pos = q[-1]
        left.remove(best)
    flat = lambda q: [round(v, 1) for p in q for v in p]
    data = {"w": im.width, "h": im.height, "lw": round(lw, 2),
            "strokes": [{"c": c, "p": flat(q)} for c, q in order],
            "fills": [{"c": c, "p": flat(_rdp(q + [q[0]], 0.8)[:-1]), "at": "under" if c == "accent" else "over"} for c, q in fills if len(q) > 2]}
    out_dir = video_dir(a.slug) / "04_scene" / "assets" if a.slug else ROOT / "_shared" / "line-art"
    out_dir.mkdir(parents=True, exist_ok=True)
    js = out_dir / f"{a.name}.js"
    js.write_text(f"// traced from {src.name} by anim.py trace\n(window.LINE_ART = window.LINE_ART || {{}})[{json.dumps(a.name)}] = "
                  + json.dumps(data, separators=(",", ":")) + ";\n", encoding="utf-8")
    # a preview to check before using it: the first strokes drawn brightest
    S = 2
    pv = Image.new("RGB", (im.width * S, im.height * S), (5, 5, 5))
    dr = ImageDraw.Draw(pv)
    for c, q in fills:
        dr.polygon([(x * S, y * S) for x, y in q], fill=(255, 138, 28) if c == "accent" else (243, 240, 232))
    for i, (c, q) in enumerate(order):
        f = 1 - 0.45 * i / max(1, len(order))
        col = (255, 138, 28) if c == "accent" else (int(243 * f), int(240 * f), int(232 * f))
        dr.line([(x * S, y * S) for x, y in q], fill=col, width=max(2, int(lw * S)), joint="curve")
    pv.save(out_dir / f"{a.name}.trace.png")
    rel = js.relative_to(ROOT)
    use = f"assets/{js.name}" if a.slug else f"../../../_shared/line-art/{js.name}"
    print(f"{len(order)} strokes, {len(data['fills'])} fills, line {lw:.1f}px -> {rel}")
    print(f"check {rel.with_suffix('.trace.png')}, then in scene.js: const ART = Line.art('{use}'); ... Line.drawing(g, ART, x, y, w, {{ progress }})")


# ── gallery ─────────────────────────────────────────────────────────────────

GALLERIES = {"pixel": "gallery.html", "line": "line-gallery.html"}  # line pages are named line-*


def cmd_gallery(a) -> None:
    out = ROOT / "_shared" / "gallery"
    out.mkdir(parents=True, exist_ok=True)
    kits = [a.style] if a.style else list(GALLERIES)

    async def run():
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            errors = []
            for kit in kits:
                page = (ROOT / "_runtime" / GALLERIES[kit]).resolve().as_uri()
                browser, pg, _, errs = await open_page(p, page + "?render")
                names = await pg.evaluate("window.GALLERY_PAGES")
                for n in names:
                    if a.page and n != a.page:
                        continue
                    await pg.goto(page + f"?render&page={n}")
                    await pg.wait_for_function("window.__ready === true", timeout=30000)
                    size = await pg.evaluate("window.__size")
                    await pg.set_viewport_size({"width": size["w"], "height": size["h"]})
                    await pg.evaluate("window.__seek(1.0)")
                    await pg.screenshot(path=str(out / f"{n}.png"))
                    print(f"  {n}.png")
                await browser.close()
                errors += errs
            return errors

    for e in asyncio.run(run())[:10]:
        print("  page error: " + e)
    print(f"-> {out}")


# ── sounds ──────────────────────────────────────────────────────────────────

def cmd_sounds(a) -> None:
    sys.path.insert(0, str(ROOT / "_runtime"))
    import chip
    import numpy as np
    out = ROOT / "_shared" / "sound"
    out.mkdir(parents=True, exist_ok=True)
    for name in chip.SONGS:
        chip.write_wav(out / f"song-{name}.wav", chip.render_song(name, 30), peak=0.8)
        print(f"  song-{name}.wav")
    gap = np.zeros(int(0.45 * chip.SR))
    reel = []
    for name in chip.SFX:
        s = chip.render_sfx(name)
        chip.write_wav(out / f"sfx-{name}.wav", s, peak=0.8)
        reel += [s / (np.max(np.abs(s)) or 1) * 0.8, gap]
    chip.write_wav(out / "sfx-all.wav", np.concatenate(reel))
    print(f"  sfx-*.wav ({', '.join(chip.SFX)}) + sfx-all.wav\n-> {out}")


# ── status ──────────────────────────────────────────────────────────────────

def stage_state(vdir: Path) -> list[str]:
    out = []
    for folder, _ in STAGES:
        d = vdir / folder
        if folder == "01_voice":
            ok = any(p.suffix.lower() in AUDIO_EXT for p in d.glob("*"))
        elif folder == "02_transcript":
            ok = (d / "words.json").exists()
        elif folder == "03_cues":
            ok = (d / "cues.json").exists() and (d / "cues.md").exists() \
                and (d / "cues.json").stat().st_mtime >= (d / "cues.md").stat().st_mtime
        elif folder == "04_scene":
            ok = (d / "scene.js").exists() and "TEMPLATE" not in (d / "scene.js").read_text(encoding="utf-8")
        else:
            ok = any(d.glob("*.mp4"))
        out.append("done" if ok else "-")
    return out


def cmd_status(a) -> None:
    vids = [video_dir(a.slug)] if a.slug else sorted(p for p in VIDEOS.glob("*") if p.is_dir())
    if not vids:
        print("no videos yet. `python anim.py new <slug> <voice-file>`")
        return
    print(f"{'video':<36}" + "".join(f"{f:<15}" for f, _ in STAGES))
    for v in vids:
        print(f"{v.name:<36}" + "".join(f"{s:<15}" for s in stage_state(v)))


# ── studio: every preview, stills sheet, render and kit page, served here ──

STUDIO = """<!doctype html><meta charset="utf-8"><title>animations studio</title>
<style>body{{font:15px system-ui;background:#1b1917;color:#e9e3d6;margin:32px}}a{{color:#e4a07e}}td{{padding:7px 22px 7px 0}}
i{{display:inline-block;width:10px;height:10px;margin-right:4px;border-radius:2px;background:#3a3530}}i.on{{background:#8fb89b}}
small{{color:#8a8175}}</style>
<h1>studio</h1><table>{rows}</table><h2>kit</h2><p>{pages}</p>
<small>A preview plays with the voice and reloads itself, at the same moment, when the scene, cues or kit change.</small>"""


def studio_page() -> str:
    rows = []
    for v in sorted(p for p in VIDEOS.glob("*") if p.is_dir()):
        base = f"/videos/{v.name}"
        links = [f'<a href="{base}/04_scene/index.html">preview</a>'] if (v / "04_scene" / "index.html").exists() else []
        if (v / "05_render" / "contact.html").exists():
            links.append(f'<a href="{base}/05_render/contact.html">stills</a>')
        links += [f'<a href="{base}/05_render/{m.name}">{html.escape(m.name)}</a>' for m in sorted((v / "05_render").glob("*.mp4"))]
        dots = "".join(f'<i class="{"on" if s == "done" else ""}" title="{f}"></i>' for (f, _), s in zip(STAGES, stage_state(v)))
        rows.append(f"<tr><td>{html.escape(v.name)}</td><td>{dots}</td><td>{' &middot; '.join(links)}</td></tr>")
    pages = " &middot; ".join(f'<a href="/_runtime/{GALLERIES["line" if p.stem.startswith("line-") else "pixel"]}?page={p.stem}">{p.stem}</a>'
                              for p in sorted((ROOT / "_shared" / "gallery").glob("*.png")))
    return STUDIO.format(rows="\n".join(rows), pages=pages)


def cmd_studio(a) -> None:
    import functools
    import http.server
    import io
    import os

    class Handler(http.server.SimpleHTTPRequestHandler):
        def send_head(self):
            path = self.path.split("?")[0]
            if any(part.startswith(".") for part in path.split("/") if part):  # never .env, .claude, ...
                self.send_error(404)
                return None
            if path in ("/", "/index.html"):
                body = studio_page().encode()
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                return io.BytesIO(body)
            file = self.translate_path(path)
            m = re.match(r"bytes=(\d*)-(\d*)$", self.headers.get("Range", ""))
            if m and os.path.isfile(file):  # ranges, so audio and video can seek
                size = os.path.getsize(file)
                start = int(m.group(1)) if m.group(1) else max(0, size - int(m.group(2) or 0))
                end = min(int(m.group(2)) if m.group(1) and m.group(2) else size - 1, size - 1)
                if start > end:
                    self.send_error(416)
                    return None
                with open(file, "rb") as f:
                    f.seek(start)
                    data = f.read(end - start + 1)
                self.send_response(206)
                self.send_header("Content-Type", self.guess_type(file))
                self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
                self.send_header("Content-Length", str(len(data)))
                self.send_header("Last-Modified", self.date_time_string(os.path.getmtime(file)))
                self.end_headers()
                return io.BytesIO(data)
            return super().send_head()

        def list_directory(self, path):
            self.send_error(404)
            return None

        def end_headers(self):
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Cache-Control", "no-cache")
            super().end_headers()

        def log_message(self, *args):
            pass

    srv = http.server.ThreadingHTTPServer(("127.0.0.1", a.port), functools.partial(Handler, directory=str(ROOT)))
    print(f"studio: http://127.0.0.1:{a.port}/  (Ctrl+C stops it)")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


# ── cli ─────────────────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("new"); s.add_argument("slug"); s.add_argument("voice", nargs="?")
    s.add_argument("--format", choices=["wide", "tall"], help="wide = 16:9 YouTube (default), tall = 9:16 Shorts (default with --from)")
    s.add_argument("--style", choices=["pixel", "line"], help="pixel = the Eduba kit (default), line = hand-drawn line art (_shared/line.md)")
    s.add_argument("--from", dest="src", help="cut the voice from another video (a Short from a long one)")
    s.add_argument("--start", help="with --from: where the clip starts (sec or m:ss)")
    s.add_argument("--end", help="with --from: where it ends")
    s.set_defaults(fn=cmd_new)

    s = sub.add_parser("speak"); s.add_argument("slug")
    s.add_argument("--chunk", type=int, help="re-generate only this chunk number")
    s.add_argument("--dry-run", action="store_true", help="show the chunks, call nothing")
    s.add_argument("--check", action="store_true", help="confirm the key, model and voice work; generates nothing")
    s.add_argument("--stability", choices=["creative", "natural", "robust"], help="override _shared/voice.md")
    s.set_defaults(fn=cmd_speak)

    s = sub.add_parser("tighten"); s.add_argument("slug")
    s.add_argument("--max", type=float, default=0.35, help="longest pause kept, seconds")
    s.add_argument("--tail", type=float, default=0.25, help="silence kept after the last word (a Short's loop seam)")
    s.add_argument("--noise", type=int, default=-38, help="silence threshold, dB")
    s.set_defaults(fn=cmd_tighten)

    s = sub.add_parser("gallery"); s.add_argument("--style", choices=list(GALLERIES), help="one kit only")
    s.add_argument("--page", help="one sheet only, e.g. line-cast"); s.set_defaults(fn=cmd_gallery)
    s = sub.add_parser("sounds"); s.set_defaults(fn=cmd_sounds)
    s = sub.add_parser("trace", help="a line drawing -> strokes for the Line kit"); s.add_argument("image"); s.add_argument("name")
    s.add_argument("--slug", help="into that video's 04_scene/assets/ (default: _shared/line-art/)")
    s.add_argument("--crop", help="x0,y0,x1,y1 in pixels or 0..1 fractions")
    s.add_argument("--size", type=int, default=1000, help="longest side to trace at (default 1000)")
    s.add_argument("--threshold", type=float, default=0.35, help="how far from the background a line must be, 0..1")
    s.add_argument("--eps", type=float, default=0.6, help="simplify: max error in px")
    s.add_argument("--min-len", dest="min_len", type=float, default=5, help="drop strokes shorter than this (px)")
    s.add_argument("--min-area", dest="min_area", type=int, default=6, help="drop specks smaller than this (px)")
    s.set_defaults(fn=cmd_trace)

    s = sub.add_parser("transcribe"); s.add_argument("slug")
    s.add_argument("--model", default="large-v3", help="large-v3-turbo is 3x faster but drops or doubles the odd word")
    s.add_argument("--language", default="en")
    s.add_argument("--prompt", help="names/jargon hint (default: _shared/vocab.txt)")
    s.add_argument("--force", action="store_true", help="overwrite an existing words.json")
    s.add_argument("--no-verify", action="store_true", help="skip the second-model check of flagged words")
    s.set_defaults(fn=cmd_transcribe)

    s = sub.add_parser("cues"); s.add_argument("slug")
    s.add_argument("--threshold", type=float, default=0.75, help="fuzzy match floor, 0-1")
    s.set_defaults(fn=cmd_cues)

    s = sub.add_parser("stills"); s.add_argument("slug")
    s.add_argument("--hold", type=float, default=0.9, help="seconds after each cue start to shoot")
    s.add_argument("--at", help="comma list of times instead of cues, e.g. 3.2,1:04")
    s.set_defaults(fn=cmd_stills)

    s = sub.add_parser("render"); s.add_argument("slug")
    s.add_argument("--fps", type=int, default=30)
    s.add_argument("--start", help="render only from here (sec or m:ss)")
    s.add_argument("--end", help="render only to here")
    s.add_argument("--workers", type=int, default=4, help="parallel browser pages")
    s.add_argument("--crf", type=int, default=18, help="x264 quality, lower is better")
    s.add_argument("--quality", type=int, default=92, help="frame JPEG quality")
    s.add_argument("--phone", action="store_true", help="also write a copy under 30 MB for phone and web viewers (720p; 540p past about five minutes)")
    s.set_defaults(fn=cmd_render)

    s = sub.add_parser("cut"); s.add_argument("slug")
    s.add_argument("--keep", nargs="+", required=True, help="stretches to keep, in order: A-B (sec or m:ss; B may be 'end'); "
                   "A-B@V ends that stretch's picture at V, holding that frame while its sound finishes")
    s.add_argument("--video-from", help="start the picture here instead (inside the first --keep), holding that frame "
                   "until the sound catches up: for when a card leaves on the very word the new start needs")
    s.add_argument("--video-to", help="end the picture here instead (inside the last --keep), holding that frame while the sound finishes")
    s.add_argument("--clean-to", help="re-draw the picture from 0 to here with the HEY, YOU card hidden (the page's ?nogreet), "
                   "so a hook spoken under the card can stay; the render's own frames are used after it")
    s.add_argument("--fade-in", type=float, default=0.04, help="audio fade at the new start, seconds")
    s.add_argument("--fade-out", type=float, default=0.25, help="audio fade at the new end, seconds")
    s.set_defaults(fn=cmd_cut)

    s = sub.add_parser("status"); s.add_argument("slug", nargs="?")
    s.set_defaults(fn=cmd_status)

    s = sub.add_parser("thumbnail"); s.add_argument("slug")
    s.set_defaults(fn=cmd_thumbnail)

    s = sub.add_parser("chapters"); s.add_argument("slug")
    s.set_defaults(fn=cmd_chapters)

    s = sub.add_parser("grab"); s.add_argument("slug"); s.add_argument("url"); s.add_argument("name", help="file name, no extension")
    s.add_argument("--find", help="scroll to this text first")
    s.add_argument("--above", type=int, default=140, help="css px kept above the --find text")
    s.add_argument("--height", type=int, default=1600, help="css px of page to keep (the scene can scroll it)")
    s.add_argument("--width", type=int, default=1280, help="css px wide, from the left (smaller = a tight crop)")
    s.add_argument("--light", action="store_true", help="light colour scheme (default dark)")
    s.set_defaults(fn=cmd_grab)

    s = sub.add_parser("real", help="real content for the screens (desk.js) -> 04_scene/assets/real.js")
    s.add_argument("slug"); s.add_argument("kind", choices=["file", "tree", "run", "clip", "list"])
    s.add_argument("target", nargs="?", help="file: a path · tree: a folder · run: a command in quotes · clip: a video")
    s.add_argument("--as", dest="name", help="the name the scene uses (default: the path, or the command)")
    s.add_argument("--depth", type=int, default=3, help="tree: how many levels deep")
    s.add_argument("--head", type=int, help="file: keep the first N lines (an excerpt of a big file)")
    s.add_argument("--timeout", type=int, default=600, help="run: seconds before giving up")
    s.add_argument("--start", help="clip: from (sec or m:ss)"); s.add_argument("--end", help="clip: to")
    s.add_argument("--fps", type=int, default=12, help="clip: frames a second (12 matches the kit)")
    s.add_argument("--width", type=int, default=1280, help="clip: frame width, 0 keeps the source size")
    s.set_defaults(fn=cmd_real)

    s = sub.add_parser("studio"); s.add_argument("--port", type=int, default=8765)
    s.set_defaults(fn=cmd_studio)

    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
