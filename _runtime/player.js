// player.js - the runtime every scene loads (after 03_cues/cues.js, before scene.js).
// One clock, one contract: everything on screen is a function of time t (seconds).
//
//   Preview: open 04_scene/index.html in Chrome. The voice plays, the bar scrubs.
//   Render:  anim.py opens index.html?render and calls __seek(t) once per frame,
//            so the video is frame-perfect no matter how slow the scene is.
//
// Scene API (global P):
//   P.onFrame(t => ...)              runs every frame with the current time
//   P.cue('id')                      { start, end, phraseEnd, text, note } from cues.json
//   P.prog('id', {dur, ease, delay}) 0..1 from the cue's start (default dur: the whole cue)
//   P.fade('id', {in, out, until})   opacity: rises at the cue, falls before it ends
//   P.live('id')                     true while t is inside the cue (a parent cue stays live through its sub-cues)
//   P.past('id')  P.pick(map, dflt)  P.since(t0, dur)  P.at('word', afterCueOrTime)
//   P.ease.out / inOut / back / ...  P.lerp(a, b, p)  P.clamp(v, lo, hi)
//   P.wordAt(t)  P.line(t)  P.captions(el)   spoken words, for captions and karaoke
//   P.level(t)                       voice loudness 0..1 (mouths, pulses)
//   P.step(fps)                      t held in 1/fps steps (12 = hand-drawn "on twos")
//   P.wait(promise)                  hold rendering until an asset has loaded (P.loaded(img) for an image)
//
// HTML shortcuts, no JS needed:
//   data-cue="id"          CSS @keyframes animations on this element (and its children)
//                          start when the cue is spoken; data-state = before | live | after
//   data-cue-offset="0.3"  shift that start in seconds
//   data-until="id"        treat the element as live until another cue starts
(() => {
  const A = window.ANIM || { meta: { duration: 10 }, cueList: [], cues: {}, words: [] };
  if (!window.ANIM) console.warn('[anim] no cues.js loaded. Run `python anim.py cues <slug>`.');
  const RENDER = new URLSearchParams(location.search).has('render');
  const frames = [];
  const waits = [];
  const missing = new Set();
  let t = 0;
  let stage, cueEls = [];

  // ── math ────────────────────────────────────────────────────────────────
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const ease = {
    linear: (x) => x,
    in: (x) => x * x * x,
    out: (x) => 1 - Math.pow(1 - x, 3),
    inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    outQuart: (x) => 1 - Math.pow(1 - x, 4),
    outExpo: (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    back: (x) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
    sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  };

  // ── cues ────────────────────────────────────────────────────────────────
  const NONE = { id: '?', start: Infinity, end: Infinity, phraseEnd: Infinity, text: '', note: '' };
  function cue(id) {
    if (typeof id === 'number') return { id: String(id), start: id, end: A.meta.duration, phraseEnd: id, text: '', note: '' };
    const c = A.cues[id];
    if (c) return c;
    if (!missing.has(id)) { missing.add(id); console.warn(`[anim] no cue "${id}" in cues.json`); }
    return NONE;
  }
  const endOf = (c, until) => (until == null ? c.end : typeof until === 'number' ? until : cue(until).start);
  function prog(id, o = {}) {
    const c = cue(id);
    const dur = o.dur ?? c.end - c.start;
    return (o.ease || ease.out)(clamp((t - c.start - (o.delay || 0)) / Math.max(dur, 1e-6)));
  }
  function fade(id, o = {}) {
    const c = cue(id), inD = o.in ?? 0.4, outD = o.out ?? 0.3, end = endOf(c, o.until);
    return ease.out(clamp((t - c.start - (o.delay || 0)) / inD)) * (1 - ease.in(clamp((t - (end - outD)) / outD)));
  }
  const live = (id, until) => { const c = cue(id); return t >= c.start && t < endOf(c, until); };
  const past = (id) => t >= cue(id).start;
  // value of the latest cue that has one: P.pick({ intro: 'wave', 'intro.why': 'point' }, 'idle')
  const pick = (map, dflt) => (A.cueList || []).reduce((v, c) => (t >= c.start && c.id in map ? map[c.id] : v), dflt);
  const since = (t0, dur) => clamp((t - t0) / Math.max(dur, 1e-6));  // 0..1 from any time, linear
  // when a word is spoken: the first word starting with `word` at or after `after` (a time or a cue id)
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9$%]/g, '');
  function at(word, after = 0) {
    const from = typeof after === 'string' ? cue(after).start : after, key = norm(word);
    const w = W.find((x) => x.start >= from - 0.05 && norm(x.text).startsWith(key));
    return w ? w.start : Infinity;
  }

  // ── words / captions ────────────────────────────────────────────────────
  const W = A.words || [];
  function wordAt(time = t) {
    let lo = 0, hi = W.length - 1, k = -1;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (W[m].start <= time) { k = m; lo = m + 1; } else hi = m - 1; }
    return k;
  }
  const LINES = [];
  (function buildLines(max = 7) {
    let cur = [];
    W.forEach((w, i) => {
      cur.push(i);
      const nx = W[i + 1];
      if (!nx || /[.?!,]$/.test(w.text) && cur.length >= 3 || nx.start - w.end > 0.6 || cur.length >= max) {
        LINES.push(cur); cur = [];
      }
    });
  })();
  function line(time = t) {
    const k = wordAt(time);
    if (k < 0) return null;
    const L = LINES.find((l) => k >= l[0] && k <= l[l.length - 1]);
    if (!L || time > W[L[L.length - 1]].end + 0.5) return null;
    return { words: L.map((i) => W[i]), active: k - L[0] };
  }
  function captions(el) {
    let last = '';
    onFrame(() => {
      const l = line();
      const key = l ? l.words[0].start + ':' + l.active : '';
      if (key === last) return;
      last = key;
      el.innerHTML = l ? l.words.map((w, i) =>
        `<span class="${i < l.active ? 'said' : i === l.active ? 'now' : 'next'}">${w.text}</span>`).join(' ') : '';
    });
  }

  // ── voice loudness + stepped time ───────────────────────────────────────
  const LV = A.levels || { rate: 60, data: [] };
  function level(time = t) {  // 0..1, how loud the voice is right now
    const f = time * LV.rate, i = Math.floor(f), d = LV.data;
    if (!d.length || i < 0) return 0;
    if (i >= d.length - 1) return (d[d.length - 1] || 0) / 100;
    return lerp(d[i], d[i + 1], f - i) / 100;
  }
  // Time held for 1/fps at a time. Hand-drawn animation is "on twos": 12 drawings a second.
  const step = (fps = 12, time = t) => Math.floor(time * fps) / fps;

  // An image is ready once it has loaded. (decode() can stall while the tab is hidden; drawing a loaded image decodes it.)
  const loaded = (im, src) => new Promise((res) => {
    const fail = () => { console.error(`[anim] image failed to load: ${src || im.src}`); res(); };
    if (im.complete) { if (!im.naturalWidth) fail(); else res(); return; }
    im.addEventListener('load', () => res(), { once: true });
    im.addEventListener('error', fail, { once: true });
  });

  // ── frame loop ──────────────────────────────────────────────────────────
  function onFrame(fn) { frames.push(fn); if (stage) fn(t); }
  function draw() {
    for (const fn of frames) fn(t);
    for (const { el, c, off, until } of cueEls) {
      const s = t < c.start + off ? 'before' : t < endOf(c, until) ? 'live' : 'after';
      if (el.dataset.state !== s) el.dataset.state = s;
    }
    // CSS @keyframes / Web Animations follow the same clock, so they scrub and render too.
    for (const a of document.getAnimations()) { a.pause(); a.currentTime = t * 1000; }
  }

  function wireCueElements() {
    cueEls = [...document.querySelectorAll('[data-cue]')].map((el) => {
      const c = cue(el.dataset.cue), off = parseFloat(el.dataset.cueOffset || 0);
      const start = c.start + off;
      const targets = [el, ...el.querySelectorAll('*')].filter((n) => n === el || !n.closest('[data-cue]') || n.closest('[data-cue]') === el);
      for (const n of targets) {
        const cs = getComputedStyle(n);
        if (cs.animationName === 'none' || !isFinite(start)) continue;
        n.style.animationDelay = cs.animationDelay.split(',').map((d) => `${start + parseFloat(d)}s`).join(',');
      }
      return { el, c, off, until: el.dataset.until };
    });
  }

  // ── stage sizing ────────────────────────────────────────────────────────
  const BAR = 64;
  function fit() {
    const w = +stage.dataset.width || 1920, h = +stage.dataset.height || 1080;
    Object.assign(stage.style, { width: w + 'px', height: h + 'px', position: 'absolute', overflow: 'hidden', transformOrigin: '0 0' });
    if (RENDER) { Object.assign(stage.style, { left: 0, top: 0, transform: 'none' }); return { w, h }; }
    const s = Math.min(innerWidth / w, (innerHeight - BAR) / h);
    Object.assign(stage.style, { left: (innerWidth - w * s) / 2 + 'px', top: (innerHeight - BAR - h * s) / 2 + 'px', transform: `scale(${s})` });
    return { w, h };
  }

  // ── boot ────────────────────────────────────────────────────────────────
  window.P = {
    get t() { return t; }, get duration() { return A.meta.duration; }, render: RENDER,
    cue, prog, fade, live, past, pick, since, at, ease, clamp, lerp, onFrame, wait: (p) => waits.push(p), loaded,
    words: W, cues: A.cueList, wordAt, line, captions, level, step,
  };

  window.addEventListener('load', async () => {
    stage = document.getElementById('stage');
    if (!stage) { document.body.innerHTML = '<p style="color:red">index.html needs &lt;div id="stage"&gt;</p>'; return; }
    document.documentElement.style.cssText += ';margin:0;height:100%;overflow:hidden;background:#111';
    document.body.style.margin = '0';
    const size = fit();
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => loaded(i)));
    await Promise.all(waits).catch((e) => console.error('[anim] asset failed', e));
    wireCueElements();

    if (RENDER) {
      window.__size = size;
      window.__seek = (time) => { t = time; draw(); return new Promise((r) => requestAnimationFrame(() => r())); };
      draw();
      window.__ready = true;
      return;
    }
    addEventListener('resize', fit);
    preview();
  });

  // ── preview: voice-synced player bar ────────────────────────────────────
  function preview() {
    const key = 'anim:' + (A.meta.slug || location.pathname);
    try { t = clamp(parseFloat(localStorage.getItem(key)) || 0, 0, A.meta.duration); } catch {}
    const audio = A.meta.voice ? new Audio(A.meta.voice) : null;
    let playing = false, lastTs = null, audioOk = !!audio;
    if (audio) audio.addEventListener('error', () => { audioOk = false; console.warn('[anim] voice failed to load:', A.meta.voice); });

    const bar = document.createElement('div');
    bar.innerHTML = `
      <button data-k="play">&#9654;</button>
      <span data-k="time"></span>
      <div data-k="track"><div data-k="fill"></div>${A.cueList.map((c) =>
        `<i title="${c.id}  ${c.start.toFixed(2)}s\n${(c.text || '').replace(/"/g, '')}" style="left:${(c.start / A.meta.duration) * 100}%" data-t="${c.start}"></i>`).join('')}</div>
      <span data-k="cue"></span>
      <div data-k="cap"></div>`;
    const css = document.createElement('style');
    css.textContent = `
      #anim-bar{position:fixed;left:0;right:0;bottom:0;height:${BAR}px;display:grid;grid-template-columns:44px 150px 1fr 180px;
        grid-template-rows:34px 30px;align-items:center;gap:0 12px;padding:0 16px;background:#161412;color:#e9e3d6;
        font:13px/1 ui-monospace,Consolas,monospace;user-select:none;z-index:99999}
      #anim-bar button{grid-row:span 2;width:40px;height:40px;border:1px solid #3a3530;background:#221f1c;color:inherit;border-radius:6px;cursor:pointer;font-size:15px}
      #anim-bar [data-k=track]{position:relative;height:18px;cursor:pointer}
      #anim-bar [data-k=track]::before{content:'';position:absolute;left:0;right:0;top:7px;height:4px;background:#3a3530;border-radius:2px}
      #anim-bar [data-k=fill]{position:absolute;left:0;top:7px;height:4px;background:#c8491c;border-radius:2px}
      #anim-bar i{position:absolute;top:1px;width:2px;height:16px;margin-left:-1px;background:#e9e3d6;opacity:.55}
      #anim-bar i:hover{opacity:1;background:#e4a07e;width:4px}
      #anim-bar [data-k=cue]{color:#e4a07e;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
      #anim-bar [data-k=cap]{grid-column:2/5;color:#8a8175;font:14px system-ui;white-space:nowrap;overflow:hidden}
      #anim-bar [data-k=cap] b{color:#fff;font-weight:600}
      #anim-bar.hide{display:none}`;
    bar.id = 'anim-bar';
    document.head.appendChild(css);
    document.body.appendChild(bar);
    const $ = (k) => bar.querySelector(`[data-k=${k}]`);
    const track = $('track');

    const seek = (time) => { t = clamp(time, 0, A.meta.duration); if (audioOk) audio.currentTime = t; };
    const setPlaying = (p) => {
      playing = p; lastTs = null;
      if (audioOk) { if (p) { audio.currentTime = t; audio.play().catch(() => { audioOk = false; }); } else audio.pause(); }
      $('play').innerHTML = p ? '&#10074;&#10074;' : '&#9654;';
    };
    $('play').onclick = () => setPlaying(!playing);
    let drag = false;
    const fromX = (e) => { const r = track.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * A.meta.duration; };
    track.onmousedown = (e) => { drag = true; seek(e.target.dataset.t ? +e.target.dataset.t : fromX(e)); };
    addEventListener('mousemove', (e) => drag && seek(fromX(e)));
    addEventListener('mouseup', () => (drag = false));
    const starts = A.cueList.map((c) => c.start);
    addEventListener('keydown', (e) => {
      if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;
      const k = e.key;
      if (k === ' ') { e.preventDefault(); setPlaying(!playing); }
      else if (k === 'ArrowLeft') seek(t - (e.shiftKey ? 1 : 0.1));
      else if (k === 'ArrowRight') seek(t + (e.shiftKey ? 1 : 0.1));
      else if (k === ',') seek(t - 1 / 30);
      else if (k === '.') seek(t + 1 / 30);
      else if (k === '[') seek([...starts].reverse().find((s) => s < t - 0.05) ?? 0);
      else if (k === ']') seek(starts.find((s) => s > t + 0.05) ?? t);
      else if (k === '0' || k === 'Home') seek(0);
      else if (k === 'h') bar.classList.toggle('hide');
    });

    // Served by `anim.py studio`: reload when the scene, cues or kit change. The saved position lands you on the same moment.
    if (location.protocol.startsWith('http')) {
      const srcs = [...document.scripts].map((s) => s.src).filter((u) => u.startsWith(location.origin));
      let seen = null;
      setInterval(async () => {
        try {
          const now = (await Promise.all(srcs.map((u) => fetch(u, { method: 'HEAD', cache: 'no-store' }).then((r) => r.headers.get('last-modified'))))).join('|');
          if (seen && now !== seen) location.reload();
          seen = now;
        } catch {}
      }, 1000);
    }

    const fmt = (x) => `${String(Math.floor(x / 60)).padStart(2, '0')}:${(x % 60).toFixed(2).padStart(5, '0')}`;
    let saved = 0;
    const loop = (ts) => {
      if (playing) {
        if (audioOk && !audio.paused) t = audio.currentTime;
        else if (lastTs != null) t += (ts - lastTs) / 1000;
        lastTs = ts;
        if (t >= A.meta.duration) { t = A.meta.duration; setPlaying(false); }
      }
      draw();
      $('time').textContent = `${fmt(t)} / ${fmt(A.meta.duration)}`;
      $('fill').style.width = (t / A.meta.duration) * 100 + '%';
      const cur = [...A.cueList].reverse().find((c) => c.start <= t);
      $('cue').textContent = (missing.size ? `missing: ${[...missing].join(', ')}  ` : '') + (cur ? cur.id : '');
      const l = line();
      $('cap').innerHTML = l ? l.words.map((w, i) => (i === l.active ? `<b>${w.text}</b>` : w.text)).join(' ') : '';
      if (ts - saved > 500) { saved = ts; try { localStorage.setItem(key, t); } catch {} }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
})();
