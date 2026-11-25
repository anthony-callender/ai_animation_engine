# Tony's take -> edited voice + head video + shifted words. Keeps are in raw-take seconds.
import json, subprocess, sys
K = [(0.85, 21.25), (22.58, 34.60), (37.65, 46.30), (46.85, 53.90), (58.10, 72.30)]
SRC = r"C:/Users/minec/Downloads/colossyan.mp4"
f = 0.012  # audio fade per edge, no clicks
a = ''.join(f"[0:a]atrim={s}:{e},asetpts=PTS-STARTPTS,afade=t=in:d={f},afade=t=out:st={e-s-f}:d={f}[a{i}];" for i, (s, e) in enumerate(K))
a += ''.join(f"[a{i}]" for i in range(len(K))) + f"concat=n={len(K)}:v=0:a=1[out]"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "01_voice/source/clean-full.wav", "-filter_complex", a, "-map", "[out]", "-b:a", "192k", "01_voice/voice.mp3"], check=True)
v = ''.join(f"[0:v]trim={s}:{e},setpts=PTS-STARTPTS[v{i}];" for i, (s, e) in enumerate(K))
v += ''.join(f"[v{i}]" for i in range(len(K))) + f"concat=n={len(K)}:v=1:a=0,fps=30[out]"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", SRC, "-filter_complex", v, "-map", "[out]", "-an", "-c:v", "libx264", "-crf", "20", "04_scene/source/head-edit.mp4"], check=True)
d = json.load(open("02_transcript/words.json", encoding="utf8")); out = []; off = 0
for s, e in K:
    for w in d["words"]:
        m = (w["start"] + w["end"]) / 2
        if s <= m < e: out.append({**w, "start": round(max(w["start"], s) - s + off, 3), "end": round(min(w["end"], e) - s + off, 3)})
    off += e - s
d["words"] = out; d["duration"] = round(off, 3)
json.dump(d, open("02_transcript/words.json", "w", encoding="utf8"), indent=1)
print("new length", round(off, 2)); print(' '.join(w["text"] for w in out))
