"""chip.py - 8-bit music and sound effects, synthesized from scratch: pulse, triangle, noise.

    render_song('study', 60)   loops a song to 60 s (float mono, 44.1 kHz), fading out at the end
    render_sfx('stamp')        one effect
    soundtrack(...)            music and effect stems for a whole video (anim.py render uses this)

`python anim.py sounds` writes every song and effect to _shared/sound/ to listen to.
Songs are written as step patterns: one token per 16th note, '-' holds, '.' rests, '|' is just a bar line.
"""
import re

import numpy as np

SR = 44100
_NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def hz(name: str) -> float:
    m = re.fullmatch(r"([A-G])([#b]?)(-?\d)", name)
    semi = _NOTE[m[1]] + {"#": 1, "b": -1, "": 0}[m[2]]
    return 440.0 * 2 ** ((12 * (int(m[3]) + 1) + semi - 69) / 12)


# ── oscillators ─────────────────────────────────────────────────────────────
def _phase(f, n):
    f = np.broadcast_to(np.asarray(f, dtype=float), (n,))
    return np.cumsum(f) / SR % 1.0


def pulse(f, n, duty=0.5):
    return np.where(_phase(f, n) < duty, 1.0, -1.0)


def triangle(f, n):
    tri = 4 * np.abs(_phase(f, n) - 0.5) - 1
    return np.round(tri * 7.5) / 7.5  # 4-bit steps, like the old console triangle channel


def noise(n, rate=8000.0, seed=7):
    rng = np.random.default_rng(seed)
    rate = np.broadcast_to(np.asarray(rate, dtype=float), (n,))
    idx = np.floor(np.cumsum(rate) / SR).astype(int)  # a new random value each 1/rate s
    return rng.choice([-1.0, 1.0], size=idx[-1] + 2)[idx]


def env(n, a=0.005, d=0.08, s=0.6, r=0.05):
    e = np.full(n, s, dtype=float)
    na = min(int(a * SR), n)
    nd = min(int(d * SR), n - na)
    nr = min(int(r * SR), n)
    e[:na] = np.linspace(0, 1, na, endpoint=False)
    e[na:na + nd] = np.linspace(1, s, nd, endpoint=False)
    if nr:
        e[n - nr:] *= np.linspace(1, 0, nr)
    return e


def sweep(f0, f1, n):
    return np.geomspace(max(f0, 1), max(f1, 1), n)


# ── instruments: (step seconds, note frequency or None) -> samples ──────────
def _lead(f, n):
    return pulse(f * (1 + 0.004 * np.sin(np.arange(n) / SR * 2 * np.pi * 5.5)), n, 0.25) * env(n, 0.004, 0.12, 0.45, 0.06) * 0.16


def _arp(f, n):
    return pulse(f, n, 0.125) * env(n, 0.002, 0.07, 0.2, 0.03) * 0.09


def _bass(f, n):
    return triangle(f, n) * env(n, 0.004, 0.05, 0.85, 0.03) * 0.34


def _pad(f, n):
    return triangle(f, n) * env(n, 0.08, 0.2, 0.7, 0.2) * 0.12


def _drum(kind, n):
    if kind == "k":
        m = int(0.11 * SR)
        return np.pad(triangle(sweep(130, 42, m), m) * env(m, 0.001, 0.1, 0, 0) * 0.55, (0, max(0, n - m)))[:max(n, m)]
    if kind == "s":
        m = int(0.14 * SR)
        return noise(m, 9000, 3) * env(m, 0.001, 0.13, 0, 0) * 0.16
    m = int(0.035 * SR)  # hat
    return noise(m, 20000, 5) * env(m, 0.001, 0.03, 0, 0) * 0.05


INSTRUMENTS = {"lead": _lead, "arp": _arp, "bass": _bass, "pad": _pad}

# ── songs (original) ────────────────────────────────────────────────────────
# study: calm bed for explaining. A minor, vi-IV-I-V, soft arpeggios, a sparse tune.
# tinker: playful for history and demos. F major, I-vi-ii-V, bouncy bass.
SONGS = {
    "study": {"bpm": 84, "tracks": {
        "arp": "A3 - C4 - E4 - C4 - A3 - C4 - E4 - C4 - | F3 - A3 - C4 - A3 - F3 - A3 - C4 - A3 - | C4 - E4 - G4 - E4 - C4 - E4 - G4 - E4 - | G3 - B3 - D4 - B3 - G3 - B3 - D4 - B3 - |"
               " A3 - C4 - E4 - C4 - A3 - C4 - E4 - C4 - | F3 - A3 - C4 - A3 - F3 - A3 - C4 - A3 - | C4 - E4 - G4 - E4 - C4 - E4 - G4 - E4 - | G3 - B3 - D4 - B3 - G3 - B3 - D4 - B3 - |",
        "bass": "A2 - - - - - - - A2 - - - E2 - - - | F2 - - - - - - - F2 - - - C2 - - - | C3 - - - - - - - C3 - - - G2 - - - | G2 - - - - - - - G2 - - - D2 - - - |"
                " A2 - - - - - - - A2 - - - E2 - - - | F2 - - - - - - - F2 - - - C2 - - - | C3 - - - - - - - C3 - - - G2 - - - | G2 - - - - - - - G2 - - - B2 - - - |",
        "lead": "E5 - - - - - . . D5 - C5 - - - . . | A4 - - - - - - - . . C5 - D5 - - - | E5 - - - G5 - - - E5 - D5 - C5 - - - | D5 - - - - - - - . . . . . . . . |"
                " . . . . . . . . . . . . . . . . | . . . . . . . . C5 - D5 - E5 - - - | G5 - - - E5 - - - D5 - - - C5 - - - | B4 - - - - - - - . . . . . . . . |",
        "drums": "k . h . . . h . s . h . . . h . | k . h . . . h . s . h . . . h k | k . h . . . h . s . h . . . h . | k . h . . . h . s . h . h . h . |" * 2,
    }},
    "tinker": {"bpm": 116, "tracks": {
        "bass": "F2 - F3 - F2 - F3 - F2 - F3 - F2 - F3 - | D2 - D3 - D2 - D3 - D2 - D3 - D2 - D3 - | G2 - G3 - G2 - G3 - G2 - G3 - G2 - G3 - | C2 - C3 - C2 - C3 - C2 - C3 - E2 - G2 - |" * 2,
        "arp": "F4 A4 C5 A4 F4 A4 C5 A4 F4 A4 C5 A4 F4 A4 C5 A4 | D4 F4 A4 F4 D4 F4 A4 F4 D4 F4 A4 F4 D4 F4 A4 F4 | G4 Bb4 D5 Bb4 G4 Bb4 D5 Bb4 G4 Bb4 D5 Bb4 G4 Bb4 D5 Bb4 | C4 E4 G4 E4 C4 E4 G4 E4 C4 E4 G4 E4 C4 E4 G4 E4 |" * 2,
        "lead": "C6 - A5 - F5 - - - G5 - A5 - - - . . | D6 - C6 - A5 - - - F5 - - - . . . . | G5 - A5 - Bb5 - D6 - C6 - Bb5 - A5 - G5 - | E5 - - - G5 - - - C6 - - - . . . . |"
                " C6 - A5 - F5 - - - G5 - A5 - - - . . | D6 - C6 - A5 - - - F5 - - - . . . . | G5 - A5 - Bb5 - D6 - C6 - Bb5 - A5 - G5 - | F5 - - - - - - - . . . . . . . . |",
        "drums": "k . h . s . h . k k h . s . h . | k . h . s . h . k . h . s . h h |" * 4,
    }},
}


def _tokens(s):
    return [t for t in re.split(r"[\s|]+", s) if t]


def render_pattern(song: dict) -> np.ndarray:
    step = 60.0 / song["bpm"] / 4
    n_steps = max(len(_tokens(p)) for p in song["tracks"].values())
    out = np.zeros(int(n_steps * step * SR) + SR)
    for name, pat in song["tracks"].items():
        toks = _tokens(pat)
        for i, tok in enumerate(toks):
            if tok in ("-", "."):
                continue
            start = int(i * step * SR)
            if name == "drums":
                for k in tok:
                    if k in "ksh":
                        s = _drum(k, 0)
                        out[start:start + len(s)] += s[:len(out) - start]
                continue
            hold = 1
            while i + hold < len(toks) and toks[i + hold] == "-":
                hold += 1
            n = int(hold * step * SR * 0.95)
            s = INSTRUMENTS[name](hz(tok), n)
            out[start:start + n] += s[:len(out) - start]
    return out[: int(n_steps * step * SR)]


def render_song(name: str, seconds: float, fade: float = 2.5) -> np.ndarray:
    loop = render_pattern(SONGS[name])
    n = int(seconds * SR)
    out = np.tile(loop, n // len(loop) + 1)[:n]
    nf = min(n, int(fade * SR))
    out[-nf:] *= np.linspace(1, 0, nf)
    out[: int(0.05 * SR)] *= np.linspace(0, 1, int(0.05 * SR))
    return out


# ── effects ─────────────────────────────────────────────────────────────────
def _n(sec):
    return int(sec * SR)


def _seq(*parts):
    return np.concatenate(parts)


SFX = {
    "blip": lambda: pulse(hz("A5"), _n(0.05)) * env(_n(0.05), 0.001, 0.045, 0, 0) * 0.3,
    "tick": lambda: noise(_n(0.014), 12000, 11) * env(_n(0.014), 0.0005, 0.013, 0, 0) * 0.18,
    "select": lambda: _seq(pulse(hz("E6"), _n(0.05), 0.25) * 0.25, pulse(hz("A6"), _n(0.09), 0.25) * env(_n(0.09), 0.001, 0.09, 0, 0) * 0.25),
    "coin": lambda: _seq(pulse(hz("B5"), _n(0.07)) * 0.22, pulse(hz("E6"), _n(0.3)) * env(_n(0.3), 0.001, 0.3, 0, 0) * 0.22),
    "stamp": lambda: triangle(sweep(95, 38, _n(0.16)), _n(0.16)) * env(_n(0.16), 0.001, 0.15, 0, 0) * 0.7
             + np.pad(noise(_n(0.06), 6000, 2) * env(_n(0.06), 0.001, 0.06, 0, 0) * 0.25, (0, _n(0.1))),
    "whoosh": lambda: noise(_n(0.4), np.concatenate([np.geomspace(1500, 14000, _n(0.2)), np.geomspace(14000, 1500, _n(0.2))]), 9)
              * np.sin(np.linspace(0, np.pi, _n(0.4))) ** 2 * 0.16,
    "pop": lambda: triangle(sweep(900, 180, _n(0.09)), _n(0.09)) * env(_n(0.09), 0.001, 0.09, 0, 0) * 0.45,
    "powerup": lambda: _seq(*[pulse(hz(nm), _n(0.05), 0.25) * env(_n(0.05), 0.001, 0.05, 0.4, 0.005) * 0.2 for nm in ("C5", "E5", "G5", "C6", "E6", "G6")]),
    "error": lambda: (pulse(110, _n(0.32), 0.3) + pulse(116.5, _n(0.32), 0.3)) * env(_n(0.32), 0.002, 0.3, 0.6, 0.05) * 0.12,
    "chime": lambda: _seq(triangle(hz("E6"), _n(0.12)) * 0.3, triangle(hz("B6"), _n(0.45)) * env(_n(0.45), 0.001, 0.45, 0, 0) * 0.3),
    "step": lambda: noise(_n(0.03), 2500, 4) * env(_n(0.03), 0.001, 0.03, 0, 0) * 0.14,
}


def render_sfx(name: str) -> np.ndarray:
    return np.asarray(SFX[name](), dtype=float)


def soundtrack(seconds: float, music: str | None, events: list[tuple[float, str]], music_gain: float = 0.5):
    """Two stems for a video: the looping music bed and the effects placed at their times."""
    n = int(seconds * SR) + SR
    bed = render_song(music, n / SR) * music_gain if music and music in SONGS else np.zeros(n)
    fx = np.zeros(n)
    for t, name in events:
        if name in SFX:
            s, i = render_sfx(name), int(max(0.0, t) * SR)
            fx[i:i + len(s)] += s[: n - i]
    return bed, fx


def write_wav(path, x: np.ndarray, peak: float | None = None):
    import wave
    if peak:
        m = np.max(np.abs(x)) or 1.0
        x = x / m * peak
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
