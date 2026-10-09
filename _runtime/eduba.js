// eduba.js - the Eduba pixel kit. Load after player.js and pixel.js.
// One frame = a world layer (the art, 320x180 wide / 180x320 tall) and a HUD layer at 2x on top
// (all text and UI panels). Components take world coordinates and draw on both.
//
//   Eduba.frame({ draw(g, t) {
//     const { floor } = Eduba.room(g, 'library');
//     Eduba.actor(g, 'doug', { x: 60, y: floor, scale: 2, pose: 'point' });
//     Eduba.say(g, 'Doug', 'Every folder says what it is for.', 120, 30, 180, { progress: P.prog('intro') });
//   }});
(() => {
  const NOGREET = new URLSearchParams(location.search).has('nogreet');
  // ── palette: Eduba 24 ───────────────────────────────────────────────────
  const PAL = [
    '#1A0D10', '#421D24', '#5D3136', '#7B5A5C', '#A2777A', '#D8BFC0', '#EAD5D6', '#F9ECDF', // 0-7 brand ramp
    '#FEFBF6', '#8E4630', '#C0714A', '#E8A860', '#F6D79B', '#23343B', '#5F8783', '#25CA58', // 8-15 white, clay, amber, glow, slate, sage, green
    '#EDB997', '#C98A69', '#8D5B42', '#5F3A2A', '#3A2620', '#BDB4AB', '#2B3957', '#56698D', // 16-23 skin x4, hair, gray, navy, steel
  ];
  const C = { ink: 0, deep: 1, wine: 2, mid: 3, light: 4, rose: 5, cream: 6, skin: 7, white: 8, clayDark: 9, clay: 10,
    amber: 11, glow: 12, slate: 13, sage: 14, green: 15, face: 16, faceShade: 17, faceDeep: 18, faceDeepShade: 19,
    hair: 20, gray: 21, navy: 22, steel: 23 };
  const THEMES = {
    rose: { bg: 5, title: 2, text: 1 }, mediumBrown: { bg: 3, title: 8, text: 7 }, paper: { bg: 8, title: 2, text: 1 },
    skin: { bg: 7, title: 2, text: 1 }, darkWine: { bg: 2, title: 8, text: 7 },
  };
  const THEME_ORDER = ['rose', 'mediumBrown', 'paper', 'skin', 'darkWine'];

  // Text roles (HUD sizes). Tall frames are read on phones, so small roles grow.
  const TYPE = {
    wide: { label: { font: 'Silkscreen', size: 8 }, body: { font: 'Pixelify Sans', size: 16 }, head: { font: 'Pixelify Sans', size: 32 },
      big: { font: 'Pixelify Sans', size: 48 }, code: { font: 'VT323', size: 20 } },
    tall: { label: { font: 'Silkscreen', size: 16 }, body: { font: 'Pixelify Sans', size: 16 }, head: { font: 'Pixelify Sans', size: 32 },
      big: { font: 'Pixelify Sans', size: 48 }, code: { font: 'VT323', size: 24 } },
  };

  const hash = (i, s = 1) => { let h = Math.imul(i ^ Math.imul(s, 0x27d4eb2d), 0x165667b1); h ^= h >>> 15; h = Math.imul(h, 0x85ebca77); return ((h ^ (h >>> 13)) >>> 0) / 4294967296; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const H2 = (v) => Math.round(v * 2);
  const st = (g, role) => (typeof role === 'object' && role ? role : g.type[role || 'body'] || g.type.body);

  // ── the frame ───────────────────────────────────────────────────────────
  function frame(opts) {
    const stage = document.getElementById('stage');
    const tall = (+stage.dataset.height || 1080) > (+stage.dataset.width || 1920);
    const W = tall ? 180 : 320, H = tall ? 320 : 180;
    const fonts = ['Silkscreen', 'Pixelify Sans', 'VT323'];
    const px = Pixel.screen({ w: W, h: H, palette: PAL, manual: true, fonts });
    const hud = Pixel.screen({ w: W * 2, h: H * 2, palette: PAL, manual: true, front: true });
    // Photo layer between the art and the text, at full resolution: real screenshots stay sharp.
    const sw = +stage.dataset.width || 1920, sh = +stage.dataset.height || 1080, pc = document.createElement('canvas');
    pc.width = sw; pc.height = sh;
    Object.assign(pc.style, { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' });
    stage.insertBefore(pc, hud.ctx.canvas);
    const photo = { ctx: pc.getContext('2d'), scale: sw / W };
    photo.ctx.imageSmoothingQuality = 'high';
    const g = { px, hud, photo, W, H, tall, wide: !tall, type: TYPE[tall ? 'tall' : 'wide'], t: 0,
      safe: tall ? { x: 12, y: 26, w: 144, h: 232 } : { x: 10, y: 8, w: 300, h: 164 } };
    g.text = (str, x, y, c, role, o = {}) => hud.text(str, H2(x), H2(y), c, st(g, role), o);
    // text centred in a world-px box (align: 'left' to left-align with o.pad HUD px)
    // Shapes on the text layer in world units: use these for anything drawn on top of a panel or card.
    g.ui = {
      rect: (x, y, w, h, c) => hud.rect(H2(x), H2(y), H2(w), H2(h), c),
      rectb: (x, y, w, h, c) => { hud.rectb(H2(x), H2(y), H2(w), H2(h), c); hud.rectb(H2(x) + 1, H2(y) + 1, H2(w) - 2, H2(h) - 2, c); },
      line: (x0, y0, x1, y1, c) => hud.line(H2(x0), H2(y0), H2(x1), H2(y1), c, 2),
      poly: (pts, c) => hud.poly(pts.map(([a, b]) => [H2(a), H2(b)]), c),
    };
    g.textIn = (str, x, y, w, h, c, role, o = {}) => {
      const s = st(g, role), m = hud.measure(str, s);
      const X = H2(x) + (o.align === 'left' ? (o.pad ?? 4) : o.align === 'right' ? H2(w) - m.w - (o.pad ?? 4) : (H2(w) - m.w) / 2);
      const Y = H2(y) + (H2(h) - (m.bottom - m.top + 1)) / 2 - m.top;
      hud.text(str, Math.round(X), Math.round(Y), c, s, o);
      return m.w / 2;
    };
    // Camera (Shorts): E.camera(g, zoom, x, y) scales every layer about a world point, this frame only.
    const layers = [px.ctx.canvas, pc, hud.ctx.canvas];
    let camKey = '', underNow = false, clipArt = '', clipPhoto = '';
    // Overlay (real screens with the cast on top): E.frame({ overlay: true }) clears the art layer to see-through
    // every frame, and a frame that sets g.under = true puts the photo layer beneath the art.
    // Wipes: g.clip = CSS clip-path for every layer, or { art, photo } per layer (Desk.seam makes them), this frame only.
    P.onFrame((t) => {
      const tt = opts.step === 0 ? t : P.step(opts.step || 12, t);
      g.t = tt; px.t = tt; hud.t = tt; g.cam = null; g.under = false; g.clip = null;
      hud.clear(-1); photo.ctx.clearRect(0, 0, sw, sh);
      if (opts.overlay) px.clear(-1);
      opts.draw(g, tt);
      if (g.under !== underNow) { stage.insertBefore(pc, g.under ? px.ctx.canvas : hud.ctx.canvas); underNow = g.under; }
      const ca = typeof g.clip === 'string' ? g.clip : (g.clip && g.clip.art) || '', cp = typeof g.clip === 'string' ? g.clip : (g.clip && g.clip.photo) || '';
      if (ca !== clipArt) { px.ctx.canvas.style.clipPath = ca; hud.ctx.canvas.style.clipPath = ca; clipArt = ca; }
      if (cp !== clipPhoto) { pc.style.clipPath = cp; clipPhoto = cp; }
      px.flush(); hud.flush();
      const c = g.cam && Math.abs(g.cam.z - 1) > 0.002 ? g.cam : null;
      const key = c ? `${c.z.toFixed(3)} ${c.x} ${c.y}` : '';
      if (key !== camKey) {
        layers.forEach((el) => { el.style.transform = c ? `scale(${c.z})` : ''; el.style.transformOrigin = c ? `${(c.x / W) * 100}% ${(c.y / H) * 100}%` : ''; });
        camKey = key;
      }
    });
    return g;
  }

  // Metrics for a text role: ink top/bottom of tall+descending letters, and line height (HUD px).
  const MET = new Map();
  function metrics(g, s) {
    const key = s.font + s.size;
    if (!MET.has(key)) {
      const m = g.hud.measure('Hdgjy', s), sp = g.hud.measure('a a', s).adv - g.hud.measure('aa', s).adv;
      MET.set(key, { top: m.top, bottom: m.bottom, lh: Math.round(s.size * 1.2), sp });
    }
    return MET.get(key);
  }
  // Words with *highlight* markup, wrapped to maxW (HUD px).
  function layout(g, str, s, maxW) {
    const M = metrics(g, s), lines = [];
    let cur = [], w = 0, hl = false;
    for (const tok of String(str).split(/\s+/).filter(Boolean)) {
      const m = tok.match(/^(\*?)(.*?)(\*?)([.,!?;:'")\]]*)$/);
      const on = hl || !!m[1], off = !!m[3], raw = m[2] + m[4];
      const ww = g.hud.measure(raw, s).adv;
      if (cur.length && w + M.sp + ww > maxW) { lines.push({ words: cur, w }); cur = []; w = 0; }
      cur.push({ text: raw, hl: on, x: cur.length ? w + M.sp : 0 });
      w = cur.length === 1 ? ww : w + M.sp + ww;
      hl = off ? false : on;
    }
    if (cur.length) lines.push({ words: cur, w });
    return { lines, M };
  }
  function drawLines(g, L, X, Y, s, fg, hlc, progress, align, boxW) {
    let n = progress == null ? Infinity : Math.floor(progress * L.lines.reduce((a, l) => a + l.words.reduce((b, w) => b + w.text.length + 1, 0), 0));
    L.lines.forEach((line, i) => {
      const lx = X + (align === 'center' ? (boxW - line.w) / 2 : 0), ly = Y - L.M.top + i * L.M.lh;
      for (const w of line.words) {
        if (n <= 0) return;
        g.hud.text(w.text, Math.round(lx + w.x), ly, w.hl ? hlc : fg, s, { chars: Math.min(w.text.length, n) });
        n -= w.text.length + 1;
      }
    });
  }
  const textH = (L) => (L.M.bottom - L.M.top + 1) + (L.lines.length - 1) * L.M.lh;

  // ── UI (drawn on the HUD) ───────────────────────────────────────────────
  // SECTION 0X / NAME chip. Returns its size in world px.
  function label(g, str, x, y, o = {}) {
    const s = st(g, o.role || 'label'), m = g.hud.measure(str, s), pad = g.tall ? 6 : 4;
    const X = H2(x), Y = H2(y), dot = o.dot ? (g.tall ? 14 : 9) : 0;
    const w = m.w + pad * 2 + dot, h = (m.bottom - m.top + 1) + pad * 2;
    g.hud.rect(X, Y, w, h, o.bg ?? C.wine);
    g.hud.text(str, X + pad, Y + pad - m.top, o.fg ?? C.white, s, { chars: o.chars });
    if (dot && Math.floor(g.t * 1.2) % 3) { const d = g.tall ? 6 : 4; g.hud.rect(X + w - pad - d, Y + (h - d) / 2, d, d, C.green); }
    return { w: w / 2, h: h / 2 };
  }
  // Text on a solid plate: the readability rule. *word* = amber highlight. o: align, anchor:'bottom',
  // w (max width, world px), role, fg, bg, progress (typewriter), pad (HUD px)
  function plate(g, str, x, y, o = {}) {
    // ?nogreet (anim.py cut --clean-to) hides the retired HEY, YOU card so an old Short's hook can play clean
    if (NOGREET && /^HEY, YOU[.!]?$/.test(str)) return { x, y, w: 0, h: 0 };
    const s = st(g, o.role || 'body'), pad = o.pad ?? (g.tall ? 10 : 7);
    const L = layout(g, str, s, o.w ? H2(o.w) - pad * 2 : 1e9);
    const tw = Math.max(...L.lines.map((l) => l.w)), bw = Math.ceil(tw + pad * 2), bh = textH(L) + pad * 2;
    let X = H2(x), Y = H2(y);
    if (o.align === 'center') X -= Math.round(bw / 2); else if (o.align === 'right') X -= bw;
    if (o.anchor === 'bottom') Y -= bh; else if (o.anchor === 'middle') Y -= Math.round(bh / 2);
    if (o.bg !== -1) { g.hud.rect(X + 4, Y + 4, bw, bh, C.ink); g.hud.rect(X, Y, bw, bh, o.bg ?? C.deep); }
    drawLines(g, L, X + pad, Y + pad, s, o.fg ?? C.white, o.hl ?? C.amber, o.progress, o.align === 'center' ? 'center' : 'left', tw);
    return { x: X / 2, y: Y / 2, w: bw / 2, h: bh / 2 };
  }
  // A centred plate that appears when t0 arrives and types on over dur (nothing before t0, so no empty box).
  // E.typeAt(g, P.at('usually', 'catch.you'), 0.6, 'usually *you*', 160, 40, { role: 'head' })
  function typeAt(g, t0, dur, text, x, y, o = {}) {
    if (g.t < t0) return null;
    return plate(g, text, x, y, { align: 'center', ...o, progress: clamp((g.t - t0) / Math.max(dur, 1e-6), 0, 1) });
  }
  // Caption in the format's caption band.
  function caption(g, str, o = {}) {
    if (g.tall) return plate(g, str, g.W / 2, o.y ?? 214, { align: 'center', w: 150, role: 'head', ...o });
    return plate(g, str, g.W / 2, o.y ?? g.H - 8, { align: 'center', anchor: 'bottom', w: g.W - 60, role: 'body', ...o });
  }
  // Spoken-word captions for Shorts: 1 to 3 words at a time from the transcript, the word being said in amber
  // (so the caption owns the frame's one highlight). o: y, role, max (words per chunk), fg, bg
  let SUBS = null;
  function subtitles(g, o = {}) {
    if (!SUBS) {
      SUBS = [];
      let cur = [];
      P.words.forEach((w, i) => {
        cur.push(w);
        const nx = P.words[i + 1];
        if (!nx || cur.length >= (o.max || 3) || /[.,!?;:]$/.test(w.text) || nx.start - w.end > 0.35) { SUBS.push(cur); cur = []; }
      });
    }
    const t = g.t;
    const i = SUBS.findIndex((c, k) => t >= c[0].start && t < (SUBS[k + 1] ? Math.min(SUBS[k + 1][0].start, c[c.length - 1].end + 0.6) : c[c.length - 1].end + 0.6));
    if (i < 0) return null;
    const lit = SUBS[i].reduce((k, w, n) => (t >= w.start ? n : k), 0);
    const words = SUBS[i].map((w, n) => { const s = w.text.replace(/[.,;:]+$/, ''); return n === lit ? `*${s}*` : s; });
    return plate(g, words.join(' '), g.W / 2, o.y ?? (g.tall ? 204 : g.H - 30), { align: 'center', role: o.role || (g.tall ? 'big' : 'head'),
      w: g.tall ? g.safe.w : g.W - 60, fg: o.fg, bg: o.bg });
  }
  // Folder-tab panel, the Eduba container (HUD). Returns the body rect in world px.
  function panel(g, x, y, w, h, o = {}) {
    const hud = g.hud, th = THEMES[o.theme || 'skin'], X = H2(x), Y = H2(y), Wd = H2(w), Ht = H2(h);
    const tab = o.tabH ?? (g.tall ? 20 : 14), tw = o.tabW ?? Math.round(Wd * 0.38), edge = o.edge ?? C.ink;
    hud.rect(X + 4, Y + tab + 4, Wd, Ht - tab, C.ink);
    hud.poly([[X, Y], [X + tw, Y], [X + tw + tab, Y + tab + 1], [X, Y + tab + 1]], th.bg);
    hud.rect(X, Y + tab, Wd, Ht - tab, th.bg);
    for (const d of [0, 1]) {
      hud.line(X + d, Y, X + d, Y + Ht - 1, edge); hud.line(X, Y + d, X + tw, Y + d, edge);
      hud.line(X + tw, Y + d, X + tw + tab, Y + tab + d, edge); hud.line(X + tw + tab, Y + tab + d, X + Wd - 1, Y + tab + d, edge);
      hud.line(X + Wd - 1 - d, Y + tab, X + Wd - 1 - d, Y + Ht - 1, edge); hud.line(X, Y + Ht - 1 - d, X + Wd - 1, Y + Ht - 1 - d, edge);
    }
    if (o.tab) { const s = st(g, 'label'), m = hud.measure(o.tab, s); hud.text(o.tab, X + (g.tall ? 8 : 6), Y + Math.round((tab - (m.bottom - m.top + 1)) / 2) - m.top + 1, th.title, s); }
    return { x, y: y + tab / 2, w, h: h - tab / 2, theme: th };
  }
  // Card: panel sized to its content. o: theme, tab, title, lines[], role (for lines), progress
  function card(g, x, y, w, o = {}) {
    const pad = g.tall ? 10 : 8, th = THEMES[o.theme || 'skin'], hs = st(g, o.titleRole || 'body'), bs = st(g, o.role || 'body');
    const T = o.title ? layout(g, o.title, hs, H2(w) - pad * 2) : null;
    const B = o.lines ? layout(g, o.lines.join('\n').replace(/\n/g, ' \n '), bs, H2(w) - pad * 2) : null;
    const tab = g.tall ? 20 : 14;
    const inner = (T ? textH(T) : 0) + (T && B ? pad : 0) + (B ? bodyLinesH(g, o.lines, bs, H2(w) - pad * 2) : 0);
    const h = (tab + pad * 2 + inner) / 2;
    panel(g, x, y, w, h, { theme: o.theme, tab: o.tab });
    let Y = H2(y) + tab + pad;
    if (T) { drawLines(g, T, H2(x) + pad, Y, hs, th.title, C.clayDark, o.progress); Y += textH(T) + pad; }
    if (o.lines) for (const line of o.lines) {
      const L = layout(g, line, bs, H2(w) - pad * 2);
      drawLines(g, L, H2(x) + pad, Y, bs, th.text, C.clayDark, o.progress); Y += textH(L) + Math.round(L.M.lh * 0.35);
    }
    return { x, y, w, h };
  }
  const bodyLinesH = (g, lines, s, maxW) => lines.reduce((a, l) => { const L = layout(g, l, s, maxW); return a + textH(L) + Math.round(L.M.lh * 0.35); }, 0) - Math.round(metrics(g, s).lh * 0.35);

  // Dialog box: a folder card with the speaker's name on the tab. o: to [x,y] (tail target), progress, role, theme
  function say(g, who, str, x, y, w, o = {}) {
    const hud = g.hud, s = st(g, o.role || 'body'), ls = st(g, 'label'), pad = g.tall ? 10 : 8, Wd = H2(w);
    const L = layout(g, str, s, Wd - pad * 2), bh = textH(L) + pad * 2;
    const name = who.toUpperCase(), nm = hud.measure(name, ls), LM = metrics(g, ls);
    const tab = (LM.bottom - LM.top + 1) + (g.tall ? 12 : 8), tw = nm.w + (g.tall ? 18 : 12);
    const X = H2(x), Y = H2(y), bg = o.bg ?? C.skin, tabBg = o.tabBg ?? C.wine;
    const by = Y + tab, bottom = by + bh;
    // tail
    if (o.to) {
      const tx = H2(o.to[0]), ty = H2(o.to[1]);
      let tri;
      if (tx < X) { const cy = clamp(ty, by + 8, bottom - 14); tri = [[X + 2, cy], [X + 2, cy + 12], [tx, ty]]; }
      else if (tx > X + Wd) { const cy = clamp(ty, by + 8, bottom - 14); tri = [[X + Wd - 3, cy], [X + Wd - 3, cy + 12], [tx, ty]]; }
      else { const cx = clamp(tx, X + 12, X + Wd - 24); tri = [[cx, bottom - 3], [cx + 12, bottom - 3], [tx, ty]]; }
      const bx = (tri[0][0] + tri[1][0]) / 2, byy = (tri[0][1] + tri[1][1]) / 2, dist = Math.hypot(tx - bx, ty - byy), cap = g.tall ? 44 : 30;
      if (dist > cap) tri[2] = [Math.round(bx + (tx - bx) * cap / dist), Math.round(byy + (ty - byy) * cap / dist)];
      hud.poly(tri.map(([a, b]) => [a + 4, b + 4]), C.ink);
      hud.poly(tri, bg);
      hud.line(tri[0][0], tri[0][1], tri[2][0], tri[2][1], C.ink); hud.line(tri[1][0], tri[1][1], tri[2][0], tri[2][1], C.ink);
    }
    hud.rect(X + 4, by + 4, Wd, bh, C.ink);
    hud.poly([[X, Y], [X + tw, Y], [X + tw + tab, by + 1], [X, by + 1]], tabBg);
    hud.text(name, X + (g.tall ? 8 : 6), Y + Math.round((tab - (LM.bottom - LM.top + 1)) / 2) - LM.top + 1, C.white, ls);
    hud.rect(X, by, Wd, bh, bg);
    hud.rectb(X, by, Wd, bh, C.ink); hud.rectb(X + 1, by + 1, Wd - 2, bh - 2, C.ink);
    if (o.to) { const tx = H2(o.to[0]); if (tx >= X && tx <= X + Wd) { const cx = clamp(tx, X + 12, X + Wd - 24); hud.rect(cx + 1, bottom - 2, 10, 2, bg); } else { const ty = H2(o.to[1]), cy = clamp(ty, by + 8, bottom - 14); hud.rect(tx < X ? X : X + Wd - 2, cy + 1, 2, 10, bg); } }
    drawLines(g, L, X + pad, by + pad, s, o.fg ?? C.deep, C.clayDark, o.progress);
    return { x, y, w, h: (tab + bh) / 2 };
  }
  // Small speech bubble (one short line). o.to = tail target.
  function bubble(g, str, x, y, o = {}) {
    const r = plate(g, str, x, y, { align: 'center', anchor: 'bottom', bg: C.white, fg: C.deep, role: o.role || 'body', progress: o.progress, pad: g.tall ? 8 : 6 });
    if (o.to) {
      const cx = H2(clamp(o.to[0], r.x + 4, r.x + r.w - 6)), by = H2(r.y + r.h), tx = H2(o.to[0]), ty = H2(o.to[1]);
      g.hud.poly([[cx, by - 1], [cx + 10, by - 1], [tx, ty]], C.white);
    }
    return r;
  }
  function lowerThird(g, name, role, o = {}) {
    const x = o.x ?? (g.tall ? 14 : 10), y = o.y ?? (g.tall ? 44 : g.H - 48);
    const a = plate(g, name, x, y, { role: 'body', bg: C.deep });
    g.hud.rect(H2(a.x) - 6, H2(a.y), 6, H2(a.h), C.amber);
    plate(g, role.toUpperCase(), x, y + a.h, { role: 'label', bg: C.wine, fg: C.rose, pad: g.tall ? 6 : 4 });
  }
  // Chapter card: full frame, a folder card rises in. o.progress 0..1, o.sub
  function chapter(g, n, title, o = {}) {
    room(g, 'dots');
    const p = P.ease.out(clamp(o.progress ?? 1, 0, 1));
    const w = g.tall ? 156 : 250, x = (g.W - w) / 2, y0 = g.tall ? 96 : 42;
    const y = Math.round(y0 + (1 - p) * (g.H - y0));
    const h = g.tall ? 110 : 88;
    panel(g, x, y, w, h, { theme: 'skin', tab: `SECTION ${String(n).padStart(2, '0')}` });
    const s = st(g, 'head'), L = layout(g, title, s, H2(w) - 24);
    drawLines(g, L, H2(x) + 12, H2(y) + (g.tall ? 34 : 26), s, C.deep, C.clayDark);
    if (o.sub) plate(g, o.sub, x + 6, y + h - (g.tall ? 22 : 16), { role: 'label', bg: C.wine, fg: C.rose, pad: g.tall ? 6 : 4 });
  }
  // Progress rail: nodes and edges, the current one lit. o.vertical, o.gap
  function rail(g, x, y, steps, cur, o = {}) {
    const px = g.px, vert = o.vertical ?? false, gap = o.gap ?? (vert ? 26 : 50);
    const pos = steps.map((_, i) => (vert ? [x, y + i * gap] : [x + i * gap, y]));
    for (let i = 0; i + 1 < pos.length; i++) px.line(pos[i][0], pos[i][1], pos[i + 1][0], pos[i + 1][1], i < cur ? C.cream : C.mid, 2);
    pos.forEach(([nx, ny], i) => {
      if (i === cur) { const r = 5 + (Math.floor(g.t * 4) % 2); px.circb(nx, ny, r, C.amber); }
      node(g, nx, ny, i === cur ? C.amber : i < cur ? C.wine : C.mid);
      const s = st(g, 'label');
      if (vert) g.textIn(steps[i], nx + 8, ny - 5, 90, 10, i === cur ? C.amber : C.cream, s, { align: 'left', pad: 0 });
      else g.textIn(steps[i], nx - 25, ny + 6, 50, 10, i === cur ? C.amber : C.cream, s);
    });
  }
  function stamp(g, str, x, y, o = {}) {
    const k = o.progress ?? 1;
    if (k <= 0 || (k < 0.15 && Math.floor(g.t * 12) % 2)) return;
    const s = st(g, o.role || 'body'), m = g.hud.measure(str, s), pad = 10, X = H2(x), Y = H2(y);
    const w = m.w + pad * 2, h = (m.bottom - m.top + 1) + pad * 2, c = o.color ?? C.clayDark;
    const bx = X - Math.round(w / 2), by = Y - Math.round(h / 2);
    g.hud.rect(bx + 4, by + 4, w, h, C.ink); g.hud.rect(bx, by, w, h, o.bg ?? C.skin);
    for (let d = 0; d < 3; d++) g.hud.rectb(bx + d, by + d, w - 2 * d, h - 2 * d, c);
    g.hud.text(str, bx + pad, by + pad - m.top, c, s);
  }

  // ── on real screens (desk.js draws them on the photo layer, in real px) ──
  // Amber pixel box round a real-screen rect, closing in when it arrives at t0. o: pad (real px), chip (a label beside it).
  function spot(g, r, t0 = -Infinity, o = {}) {
    if (!r || g.t < t0) return null;
    const s = g.photo.scale, k = P.ease.out(clamp((g.t - t0) / 0.25, 0, 1)), pad = (o.pad ?? 7) + (1 - k) * 22;
    const x = (r.x - pad) / s, y = (r.y - pad) / s, w = Math.min((r.w + 2 * pad) / s, g.W - 3 - x), h = (r.h + 2 * pad) / s;
    g.ui.rectb(x + 0.5, y + 0.5, w, h, C.ink);
    g.ui.rectb(x, y, w, h, o.color ?? C.amber);
    if (o.chip && k >= 1) {
      const lw = (g.hud.measure(o.chip, st(g, 'label')).w + 8) / 2;
      if (x + w + 3 + lw < g.W - 2) label(g, o.chip, x + w + 3, y + 1); else label(g, o.chip, x, y - 10);
    }
    return { x, y, w, h };
  }
  // What's being said at t, a chunk at a time (from the transcript): { text, n (characters spoken so far), p (0..1), words },
  // or null between chunks. Any caption can use it: E.speech draws it in a dialog box.
  let CHUNKS = null;
  function spoken(t, o = {}) {
    if (!CHUNKS) {
      CHUNKS = [];
      let cur = [];
      P.words.forEach((wd, i) => {
        cur.push(wd);
        const nx = P.words[i + 1];
        if (!nx || /[.?!]$/.test(wd.text) || (cur.length >= 9 && /,$/.test(wd.text)) || cur.length >= 16 || nx.start - wd.end > 0.6) { CHUNKS.push(cur); cur = []; }
      });
    }
    const c = CHUNKS.filter((q) => t >= q[0].start - 0.05).pop();
    if (!c || t > c[c.length - 1].end + (o.hold ?? 1.5)) return null;
    const text = c.map((wd) => wd.text).join(' ');
    const n = c.reduce((a, wd) => a + clamp((t - wd.start) / Math.max(wd.end - wd.start, 0.01), 0, 1) * wd.text.length + (t >= wd.end ? 1 : 0), 0);
    return { text, n, p: n / text.length, words: c };
  }
  // The words being spoken, typing on in a dialog box (E.spoken), bottom at o.bottom. Stands in for captions on real screens.
  // o: to (tail target), bottom, until (a time to stop).
  function speech(g, who, x, w, o = {}) {
    const sp = spoken(g.t);
    if (!sp || (o.until != null && g.t >= o.until)) return null;
    const s = st(g, 'body'), M = metrics(g, s), LM = metrics(g, st(g, 'label')), pad = g.tall ? 10 : 8;
    const lines = layout(g, sp.text, s, H2(w) - pad * 2).lines.length;
    const hh = (LM.bottom - LM.top + 1) + (g.tall ? 12 : 8) + (M.bottom - M.top + 1) + (lines - 1) * M.lh + pad * 2;
    return say(g, who, sp.text, x, (o.bottom ?? (g.tall ? g.safe.y + g.safe.h : 176)) - hh / 2, w, { to: o.to, progress: sp.p });
  }
  // The host over a real screen: bottom-left of the band, saying what's spoken. o: pose, face, reach, rise (a time:
  // rises in from below), name, speech (false = no dialog box). Returns the actor.
  function host(g, who, o = {}) {
    const k = o.rise == null ? 1 : clamp((g.t - o.rise) / 0.45, 0, 1), foot = g.tall ? g.safe.y + g.safe.h : 177;
    const a = actor(g, who, { x: o.x ?? (g.tall ? 30 : 36), y: foot + Math.round((1 - P.ease.back(k)) * 64), scale: 2, pose: o.pose, face: o.face, reach: o.reach });
    if (o.speech !== false && k > 0) speech(g, o.name ?? (typeof who === 'string' ? who[0].toUpperCase() + who.slice(1) : 'Host'),
      g.tall ? 52 : 74, g.tall ? 116 : 234, { to: [a.head[0] + 9, a.head[1] + 5], bottom: g.tall ? a.head[1] - 6 : 176 });
    return a;
  }

  // ── rooms (world backgrounds). Each returns { floor } for characters' feet. ──
  function wall(px, h) {
    px.rect(0, 0, px.W, h, C.deep);
    for (let r = 0; r * 8 < h; r++) for (let c = -1; c * 16 < px.W; c++) px.rect(c * 16 + (r % 2) * 8, r * 8 + 6, 15, 1, C.ink);
    px.dither(0, 0, px.W, h, null, C.ink, (i, j) => (1 - j / h) * 0.35);
  }
  function tiles(px, y, h, a = C.mid, b = C.wine) {
    for (let r = 0; r * 8 < h; r++) for (let c = -1; c * 16 < px.W; c++) px.rect(c * 16 + (r % 2) * 8, y + r * 8, 16, 8, (c + r) % 2 ? a : b);
    px.line(0, y, px.W, y, C.ink);
    px.dither(0, y, px.W, h, null, C.ink, (i, j) => ((j - y) / h) * 0.55);
  }
  function room(g, kind = 'dots', o = {}) {
    const px = g.px, W = g.W, H = g.H, t = g.t;
    if (kind === 'dots') {
      px.clear(C.deep);
      for (let y = 6; y < H; y += 12) for (let x = 6; x < W; x += 12) px.rect(x, y, 2, 1, C.wine);
      px.dither(0, 0, W, H, null, C.ink, (i, j) => Math.max(0, Math.hypot((i - W / 2) / W, (j - H / 2) / H) * 2.2 - 0.6));
      return { floor: g.tall ? 206 : H - 18 };
    }
    if (kind === 'screening') {  // the sweatbox: a small dark screening room, a screen on the back wall, seat backs in front
      const floor = g.tall ? 206 : H - 22, sw = g.tall ? 132 : 150, sh = g.tall ? 76 : 84, sx = Math.round((W - sw) / 2), sy = g.tall ? 56 : 14;
      px.gradient(0, 0, W, floor, C.ink, C.deep);
      for (let i = 8; i < W; i += 22) px.line(i, 0, i, floor - 1, C.ink);
      px.poly([[W / 2 - 4, H], [W / 2 + 4, H], [sx + sw, sy + sh], [sx, sy + sh]], C.deep);
      px.dither(0, 0, W, floor, null, C.wine, (i, j) => (i > sx - 6 && i < sx + sw + 6 && j < sy + sh + 8 ? 0.25 : 0));
      px.rect(sx - 3, sy - 3, sw + 6, sh + 6, C.ink); px.rect(sx - 2, sy - 2, sw + 4, sh + 4, C.mid); px.rect(sx, sy, sw, sh, C.cream);
      px.rect(0, floor, W, H - floor, C.ink); px.line(0, floor, W, floor, C.deep);
      for (let k = 0; k < (g.tall ? 5 : 9); k++) {
        const cx = 14 + k * 38, top = H - 14;
        px.rect(cx - 12, top, 24, 14, C.deep); px.rect(cx - 11, top - 2, 22, 2, C.deep); px.line(cx - 10, top - 2, cx + 9, top - 2, C.wine);
        px.line(cx - 12, top, cx - 12, H, C.ink); px.line(cx + 11, top, cx + 11, H, C.ink);
      }
      return { floor, screen: [sx, sy, sw, sh] };
    }
    if (kind === 'night') {
      const floor = g.tall ? 206 : H - 22;
      px.gradient(0, 0, W, floor, C.ink, C.slate);
      for (let k = 0; k < (g.tall ? 34 : 40); k++) if ((k + Math.floor(t * 2)) % 7) px.pset(Math.floor(hash(k, 3) * W), Math.floor(hash(k, 5) * floor * 0.7), C.cream);
      px.rect(0, floor, W, H - floor, C.deep); px.line(0, floor, W, floor, C.ink);
      return { floor };
    }
    const floor = g.tall ? 206 : H - 30;
    if (kind === 'office') {
      px.rect(0, 0, W, floor, C.deep);
      for (let i = 0; i < W; i += 12) px.line(i, 0, i, floor - 1, C.wine);
      px.rect(0, Math.round(floor * 0.68), W, 2, C.wine);
      const [wx, wy, ww, wh] = g.tall ? [16, 40, 60, 50] : [18, 16, 64, 50];
      px.rect(wx, wy, ww, wh, C.mid); px.gradient(wx + 3, wy + 3, ww - 6, wh - 6, C.ink, C.slate);
      px.circ(wx + ww - 16, wy + 14, 5, C.cream); px.circ(wx + ww - 14, wy + 12, 5, C.slate);
      for (let k = 0; k < 6; k++) px.rect(wx + 6 + k * 9, wy + wh - 16 + (k % 3) * 3, 5, 13 - (k % 3) * 3, C.ink);
      px.line(wx + ww / 2, wy + 3, wx + ww / 2, wy + wh - 4, C.mid); px.line(wx + 3, wy + wh / 2, wx + ww - 4, wy + wh / 2, C.mid);
      if (o.lamp !== false) lamp(g, g.tall ? 120 : 190, 0, 26, 40);
      tiles(px, floor, H - floor, C.wine, C.deep);
      return { floor };
    }
    if (kind === 'hall') {  // concert stage: dark hall, wine curtains, a soft spotlight, wooden boards
      px.gradient(0, 0, W, floor, C.ink, C.deep);
      px.dither(0, 11, W, floor - 11, null, C.wine, (i, j) => (Math.abs(i - W / 2) < 26 + (j - 11) * 0.55 ? 0.28 : 0));
      const cw = g.tall ? 20 : 30;
      for (const x0 of [0, W - cw]) {
        px.rect(x0, 0, cw, floor, C.wine);
        for (let i = 2; i < cw; i += 6) { px.line(x0 + i, 0, x0 + i, floor - 1, C.deep); px.line(x0 + i + 2, 0, x0 + i + 2, floor - 1, C.mid); }
      }
      px.rect(0, 0, W, 8, C.wine); px.line(0, 8, W, 8, C.deep); for (let i = 0; i < W; i += 10) px.rect(i + 2, 8, 6, 3, C.wine);
      px.rect(0, floor, W, H - floor, C.clay);
      for (let j = floor + 4; j < H; j += 4) px.line(0, j, W, j, C.clayDark);
      for (let k = 0; k < 14; k++) { const jx = Math.floor(hash(k, 31) * W), jy = floor + Math.floor(hash(k, 32) * ((H - floor) / 4)) * 4; px.line(jx, jy + 1, jx, jy + 3, C.clayDark); }
      px.line(0, floor, W, floor, C.glow);
      return { floor };
    }
    wall(px, floor);
    if (kind === 'library') {
      if (g.tall) { arch(g, W / 2 - 22, 34, 44, 66); lamp(g, 30, 0, 30, 30); lamp(g, W - 30, 0, 30, 30); shelf(g, 4, floor - 96, 46, 96); shelf(g, W - 50, floor - 96, 46, 96, 7); }
      else { shelf(g, 6, 14, 72, floor - 14); arch(g, 136, 12, 48, 72); lamp(g, 108, 0, 24, 34); lamp(g, 212, 0, 24, 34); shelf(g, W - 78, 14, 72, floor - 14, 9); }
    }
    tiles(px, floor, H - floor);
    return { floor };
  }

  // ── props (world) ───────────────────────────────────────────────────────
  function node(g, x, y, c = C.wine) { const px = g.px; px.rect(x - 3, y - 2, 7, 5, C.ink); px.rect(x - 2, y - 3, 5, 7, C.ink); px.rect(x - 2, y - 1, 5, 3, c); px.rect(x - 1, y - 2, 3, 5, c); }
  function ellipse(px, cx, cy, rx, ry, c) { for (let dy = -ry; dy <= ry; dy++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / (ry + 0.5)) ** 2))); px.rect(cx - w, cy + dy, 2 * w + 1, 1, c); } }
  function tablet(g, x, y, w, h, o = {}) {
    const px = g.px;
    px.rect(x + 1, y, w - 2, h, C.clay); px.rect(x, y + 1, w, h - 2, C.clay);
    px.line(x + 1, y + 1, x + w - 3, y + 1, C.amber); px.line(x + 1, y + 1, x + 1, y + h - 3, C.amber);
    px.line(x + 2, y + h - 2, x + w - 2, y + h - 2, C.clayDark); px.line(x + w - 2, y + 2, x + w - 2, y + h - 2, C.clayDark);
    px.line(x + 1, y - 1, x + w - 2, y - 1, C.ink); px.line(x + 1, y + h, x + w - 2, y + h, C.ink);
    px.line(x - 1, y + 1, x - 1, y + h - 2, C.ink); px.line(x + w, y + 1, x + w, y + h - 2, C.ink);
    if (o.blank) return;
    const step = w > 40 ? 6 : 4, seed = o.seed ?? x * 7 + y;
    for (let r = y + 4; r < y + h - 4; r += step) for (let c = x + 4; c < x + w - 5; c += step) {
      const k = hash(r * 31 + c, seed); if (k < 0.25) continue;
      px.pset(c, r, C.clayDark); px.pset(c + 1, r, C.clayDark); px.pset(c, r + 1, C.clayDark); if (k > 0.7) px.pset(c + 2, r, C.clayDark);
    }
  }
  function shelf(g, x, y, w, h, seed = 3) {
    const px = g.px;
    px.rect(x, y, w, h, C.deep); px.rect(x + 3, y + 3, w - 6, h - 3, C.ink); px.line(x, y, x + w - 1, y, C.mid);
    const colors = [5, 3, 8, 7, 2, 6];
    for (let sy = y + 3; sy + 22 <= y + h; sy += 24) {
      let cx = x + 4, i = 0;
      while (cx < x + w - 8) {
        const k = hash(sy * 7 + cx, seed);
        if (k < 0.12) { cx += 4; continue; }
        if (k > 0.82) { tablet(g, cx + 1, sy + 7, 8, 12, { blank: true }); cx += 11; continue; }
        const sw = 3 + Math.floor(hash(cx, sy) * 3), sh = 12 + Math.floor(hash(cx + 5, sy) * 7), c = colors[(i++ + Math.floor(k * 10)) % colors.length];
        px.rect(cx, sy + 20 - sh, sw, sh, c); px.line(cx, sy + 20 - sh, cx + sw - 1, sy + 20 - sh, C.ink);
        px.pset(cx + 1, sy + 23 - sh, c === 8 || c === 7 ? 3 : 7);
        cx += sw + 1;
      }
      px.rect(x + 3, sy + 20, w - 6, 3, C.mid); px.line(x + 3, sy + 20, x + w - 4, sy + 20, C.light);
    }
  }
  function lamp(g, x, y, len = 20, glow = 34) {
    const px = g.px, f = 0.55 + Math.sin(g.t * 3) * 0.03, cy = y + len + 4;
    px.dither(x - glow, cy - glow, glow * 2, glow * 2, null, C.wine, (i, j) => Math.max(0, 1 - Math.hypot(i - x, j - cy) / glow) * f * 1.4);
    px.dither(x - glow / 2, cy - glow / 2, glow, glow, null, C.mid, (i, j) => Math.max(0, 1 - Math.hypot(i - x, j - cy) / (glow / 2)) * f);
    px.line(x, y, x, y + len, C.mid);
    px.poly([[x - 3, y + len], [x + 3, y + len], [x + 6, y + len + 6], [x - 6, y + len + 6]], C.amber);
    px.line(x - 3, y + len, x + 3, y + len, C.ink); px.line(x - 6, y + len + 6, x + 5, y + len + 6, C.clayDark);
    px.rect(x - 1, y + len + 7, 3, 2, C.glow);
  }
  function arch(g, x, y, w, h) {
    const px = g.px, r = w / 2;
    px.circ(x + r, y + r, r, C.mid); px.rect(x, y + r, w, h - r, C.mid);
    px.circ(x + r, y + r, r - 2, C.slate); px.rect(x + 2, y + r, w - 4, h - r - 2, C.slate);
    px.gradient(x + 2, y + r, w - 4, h - r - 2, C.slate, C.deep);
    for (let k = 0; k < 7; k++) if ((Math.floor(g.t * 3) + k) % 5) px.pset(x + 4 + Math.floor(hash(k, 9) * (w - 8)), y + 4 + Math.floor(hash(k, 4) * h * 0.6), C.cream);
    px.line(x + r, y + 2, x + r, y + h - 2, C.mid); px.line(x + 2, y + r + 6, x + w - 3, y + r + 6, C.mid);
  }
  function desk(g, x, y, w) {
    const px = g.px;
    px.rect(x, y, w, 4, C.mid); px.line(x, y, x + w - 1, y, C.light); px.line(x, y + 4, x + w - 1, y + 4, C.ink);
    px.rect(x + 3, y + 5, 3, 20, C.deep); px.rect(x + w - 6, y + 5, 3, 20, C.deep);
  }
  function cabinet(g, x, y, w, drawers = 3) {
    const px = g.px, dh = 14, h = drawers * dh + 2;
    px.rect(x, y, w, h, C.light); px.rectb(x - 1, y - 1, w + 2, h + 2, C.ink);
    for (let i = 0; i < drawers; i++) {
      const dy = y + 1 + i * dh;
      px.rectb(x + 2, dy + 1, w - 4, dh - 2, C.mid); px.rect(x + w / 2 - 5, dy + 4, 10, 4, C.skin); px.rectb(x + w / 2 - 5, dy + 4, 10, 4, C.mid);
      px.rect(x + w / 2 - 3, dy + 9, 6, 2, C.deep);
    }
  }
  // Beige terminal. o.lines = short strings drawn as amber bars (too small for real text).
  function crt(g, x, y, o = {}) {
    const px = g.px, lines = o.lines || ['$ ls', 'CLAUDE.md', 'stages/', '$ _'];
    px.rect(x, y, 44, 34, C.cream); px.rectb(x - 1, y - 1, 46, 36, C.ink);
    px.line(x, y + 33, x + 43, y + 33, C.rose); px.line(x + 43, y, x + 43, y + 33, C.rose);
    px.rect(x + 4, y + 4, 36, 24, C.ink); px.rect(x + 5, y + 5, 34, 22, C.deep);
    lines.forEach((l, i) => px.rect(x + 7, y + 7 + i * 5, Math.min(30, l.length * 3), 2, i === lines.length - 1 && Math.floor(g.t * 2) % 2 ? C.deep : C.amber));
    px.rect(x + 36, y + 29, 2, 2, C.green);
    px.rect(x + 16, y + 35, 12, 3, C.rose); px.rect(x + 10, y + 38, 24, 2, C.cream); px.rectb(x + 9, y + 37, 26, 4, C.ink);
  }

  // ── computing concepts ──────────────────────────────────────────────────
  const KIND = { md: C.wine, code: C.sage, img: C.amber, data: C.steel, txt: C.light };
  // Document icon (12x15). o: name, kind (md|code|img|data|txt), lit, fg
  function file(g, x, y, o = {}) {
    const px = g.px;
    if (o.lit) px.rectb(x - 2, y - 2, 16, 19, C.amber);
    px.poly([[x, y], [x + 8, y], [x + 12, y + 4], [x + 12, y + 15], [x, y + 15]], C.white);
    px.line(x, y, x + 8, y, C.ink); px.line(x + 8, y, x + 12, y + 4, C.ink); px.line(x + 12, y + 4, x + 12, y + 15, C.ink);
    px.line(x, y + 15, x + 12, y + 15, C.ink); px.line(x, y, x, y + 15, C.ink);
    px.poly([[x + 8, y], [x + 8, y + 4], [x + 12, y + 4]], C.cream); px.line(x + 8, y, x + 8, y + 4, C.ink); px.line(x + 8, y + 4, x + 12, y + 4, C.ink);
    [5, 7, 4].forEach((w, i) => px.rect(x + 2, y + 5 + i * 2, w, 1, C.light));
    px.rect(x + 1, y + 11, 11, 4, KIND[o.kind || 'md']);
    if (o.name) g.textIn(o.name, x - 14, y + 17, 40, 8, o.fg ?? C.cream, 'code');
  }
  // Folder icon (18x13). o: name, theme, open, lit
  function folderIcon(g, x, y, o = {}) {
    const px = g.px, th = THEMES[o.theme || 'rose'];
    if (o.lit) px.rectb(x - 2, y - 3, 22, 18, C.amber);
    if (o.open) { px.rect(x + 3, y - 2, 12, 6, C.white); px.rectb(x + 3, y - 2, 12, 6, C.ink); }
    px.rect(x, y, 7, 3, th.bg); px.rect(x, y + 2, 18, 11, th.bg);
    px.line(x, y, x + 6, y, C.ink); px.line(x + 6, y, x + 8, y + 2, C.ink); px.line(x + 8, y + 2, x + 17, y + 2, C.ink);
    px.line(x, y, x, y + 12, C.ink); px.line(x + 17, y + 2, x + 17, y + 12, C.ink); px.line(x, y + 12, x + 17, y + 12, C.ink);
    px.line(x + 1, y + 11, x + 16, y + 11, THEMES[o.theme || 'rose'].bg === C.skin ? C.rose : C.mid);
    if (o.name) g.textIn(o.name, x - 16, y + 15, 50, 8, o.fg ?? C.cream, 'code');
  }
  // Folder tree. lines: ['work/', '  CLAUDE.md', '  stages/', '    01_voice/'] (2 spaces per level; '/' = folder).
  // o: progress (reveals rows), highlight (row index or name), rh (row height), fg
  function tree(g, x, y, lines, o = {}) {
    const px = g.px, rh = o.rh ?? (g.tall ? 15 : 12);
    const rows = lines.map((l) => ({ d: (l.length - l.trimStart().length) >> 1, name: l.trim() }));
    const n = o.progress == null ? rows.length : Math.ceil(clamp(o.progress, 0, 1) * rows.length);
    for (let i = 0; i < n; i++) {
      const r = rows[i], yy = y + i * rh, xx = x + r.d * 10, dir = r.name.endsWith('/');
      if (r.d > 0) {
        let p = i - 1; while (p >= 0 && rows[p].d >= r.d) p--;
        const vx = x + (r.d - 1) * 10 + 3;
        px.line(vx, y + (p + 1) * rh - 3, vx, yy + rh / 2, C.light); px.line(vx, yy + rh / 2, xx - 2, yy + rh / 2, C.light);
      }
      const lit = o.highlight === i || o.highlight === r.name;
      if (lit) { const w = g.hud.measure(r.name, st(g, 'code')).w / 2; px.rect(xx - 2, yy + 1, w + 16, rh - 2, C.wine); }
      const iy = yy + Math.round(rh / 2) - 3;
      if (dir) { px.rect(xx, iy, 3, 1, C.rose); px.rect(xx, iy + 1, 8, 6, C.rose); px.line(xx, iy + 6, xx + 7, iy + 6, C.light); }
      else { px.rect(xx + 1, iy, 6, 7, C.white); px.pset(xx + 6, iy, C.cream); px.rect(xx + 2, iy + 2, 3, 1, C.light); px.rect(xx + 2, iy + 4, 4, 1, C.light); }
      g.textIn(r.name, xx + 11, yy, 200, rh, lit ? C.amber : o.fg ?? C.cream, 'code', { align: 'left', pad: 0 });
    }
    return { h: rows.length * rh };
  }
  // Terminal window. lines starting '$ ' are commands. o: title, progress (types everything in order), scroll
  function terminal(g, x, y, w, h, lines, o = {}) {
    const px = g.px, s = st(g, 'code'), lh = g.tall ? 14 : 11;
    px.rect(x + 2, y + 2, w, h, C.ink);
    px.rect(x - 1, y - 1, w + 2, h + 2, C.mid); px.rect(x, y, w, h, C.ink); px.rect(x, y, w, 8, C.wine);
    g.textIn(o.title || 'TERMINAL', x, y, w - 10, 8, C.rose, 'label', { align: 'left', pad: 6 });
    if (Math.floor(g.t * 1.2) % 3) px.rect(x + w - 6, y + 3, 2, 2, C.green);
    // long lines wrap onto indented continuation rows
    const maxW = H2(w - 16), rows = [];
    for (const l of lines) {
      const cmd = l.startsWith('$ '), body = cmd ? l.slice(2) : l, kind = cmd ? 'cmd' : l.startsWith('#') ? 'note' : 'out';
      let cur = '', first = true;
      for (const word of body.split(' ')) {
        const next = cur ? cur + ' ' + word : word;
        if (cur && g.hud.measure(next, s).w > maxW) { rows.push({ text: cur, kind: first ? kind : kind + '+' }); cur = word; first = false; }
        else cur = next;
      }
      rows.push({ text: cur, kind: first ? kind : kind + '+' });
    }
    const total = rows.reduce((a, r) => a + r.text.length, 0);
    let left = o.progress == null ? total : Math.floor(clamp(o.progress, 0, 1) * total), cx = x + 4, cy = y + 11;
    const shown = [];
    for (const r of rows) { if (left <= 0) break; shown.push([r, Math.min(r.text.length, left)]); left -= r.text.length; }
    shown.slice(-Math.floor((h - 12) / lh)).forEach(([r, k], i) => {
      const yy = y + 11 + i * lh, tx = r.kind === 'cmd' || r.kind === 'cmd+' ? x + 10 : x + 4;
      if (r.kind === 'cmd') g.text('$', x + 4, yy, C.amber, s);
      g.text(r.text, tx, yy, r.kind.startsWith('cmd') ? C.glow : r.kind.startsWith('note') ? C.light : C.cream, s, { chars: k });
      cy = yy; cx = tx + g.hud.measure(r.text.slice(0, k), s).adv / 2 + 1;
    });
    if (Math.floor(g.t * 2.5) % 2) px.rect(Math.round(cx), cy + 1, g.tall ? 5 : 4, g.tall ? 10 : 7, C.amber);
  }
  // Code listing with line numbers. o: highlight (line index or [indices]), progress, title
  function code(g, x, y, w, lines, o = {}) {
    const px = g.px, s = st(g, 'code'), lh = g.tall ? 14 : 11, h = lines.length * lh + 6, hl = [].concat(o.highlight ?? []);
    px.rect(x + 2, y + 2, w, h, C.ink); px.rect(x, y, w, h, C.skin); px.rect(x, y, 13, h, C.cream); px.rectb(x - 1, y - 1, w + 2, h + 2, C.ink);
    const total = lines.reduce((a, l) => a + l.length, 0);
    let left = o.progress == null ? total : Math.floor(clamp(o.progress, 0, 1) * total);
    lines.forEach((l, i) => {
      const yy = y + 3 + i * lh;
      if (hl.includes(i)) px.rect(x + 13, yy - 1, w - 13, lh, C.glow);
      g.textIn(String(i + 1), x, yy, 11, lh - 1, C.light, s, { align: 'right', pad: 2 });
      if (left > 0) g.text(l, x + 16, yy + (g.tall ? 1 : 0), /^\s*(#|\/\/)/.test(l) ? C.light : C.deep, s, { chars: Math.min(l.length, left) });
      left -= l.length;
    });
    return { h };
  }
  // Unix pipeline: cmds joined by pipes, data flowing through. o: progress, vertical, flow
  function pipe(g, x, y, cmds, o = {}) {
    const px = g.px, s = st(g, 'code'), vert = o.vertical ?? g.tall, bh = g.tall ? 18 : 13, gap = vert ? 12 : 14;
    const ws = cmds.map((c) => Math.ceil(g.hud.measure(c, s).w / 2) + 10);
    const n = o.progress == null ? cmds.length : Math.ceil(clamp(o.progress, 0, 1) * cmds.length);
    let cx = x, cy = y;
    const boxes = cmds.map((c, i) => { const b = { x: vert ? x - ws[i] / 2 : cx, y: vert ? cy : y, w: ws[i], h: bh }; cx += ws[i] + gap; cy += bh + gap; return b; });
    for (let i = 0; i + 1 < n; i++) {
      const a = boxes[i], b = boxes[i + 1];
      if (vert) {
        const tx = x - 2, ty0 = a.y + a.h, ty1 = b.y;
        px.rect(tx - 1, ty0, 6, ty1 - ty0, C.ink); px.rect(tx, ty0, 4, ty1 - ty0, C.cream);
        if (o.flow !== false) for (let k = 0; k < 2; k++) { const f = (g.t * 1.5 + k / 2 + i * 0.3) % 1; px.rect(tx + 1, ty0 + Math.floor(f * (ty1 - ty0 - 2)), 2, 2, C.amber); }
      } else {
        const ty = y + bh / 2 - 2, tx0 = a.x + a.w, tx1 = b.x;
        px.rect(tx0, ty - 1, tx1 - tx0, 6, C.ink); px.rect(tx0, ty, tx1 - tx0, 4, C.cream);
        if (o.flow !== false) for (let k = 0; k < 2; k++) { const f = (g.t * 1.5 + k / 2 + i * 0.3) % 1; px.rect(tx0 + Math.floor(f * (tx1 - tx0 - 2)), ty + 1, 2, 2, C.amber); }
      }
    }
    boxes.slice(0, n).forEach((b, i) => {
      px.rect(b.x + 2, b.y + 2, b.w, b.h, C.ink); px.rect(b.x, b.y, b.w, b.h, C.skin); px.rectb(b.x, b.y, b.w, b.h, C.ink);
      g.textIn(cmds[i], b.x, b.y, b.w, b.h, C.deep, s);
    });
    return boxes;
  }
  // Bits as lamps. o: n, places (show 128..1), label (show = value)
  function bits(g, x, y, value, o = {}) {
    const px = g.px, n = o.n ?? 8, sz = o.size ?? (g.tall ? 13 : 10), gap = g.tall ? 3 : 4;
    for (let i = 0; i < n; i++) {
      const on = (value >> (n - 1 - i)) & 1, bx = x + i * (sz + gap);
      px.rect(bx - 1, y - 1, sz + 2, sz + 2, on ? C.clayDark : C.mid);
      px.rect(bx, y, sz, sz, on ? C.amber : C.deep);
      if (on) px.rect(bx + 1, y + 1, sz - 4, 2, C.glow);
      g.textIn(String(on), bx, y + sz + 2, sz, 9, on ? C.amber : C.light, 'code');
      if (o.places) g.textIn(String(2 ** (n - 1 - i)), bx - 2, y - 10, sz + 4, 8, C.light, 'label');
    }
    if (o.label) g.textIn(`= ${value}`, x + n * (sz + gap) + 2, y, 40, sz, C.white, 'code', { align: 'left', pad: 0 });
  }
  // Memory cells with addresses. o: cols, highlight (index or [..]), pointer (index)
  function memory(g, x, y, values, o = {}) {
    const px = g.px, cols = o.cols ?? (g.tall ? 4 : 8), cw = o.cw ?? (g.tall ? 30 : 18), ch = g.tall ? 16 : 11, s = st(g, 'code');
    const hl = [].concat(o.highlight ?? []);
    values.forEach((v, i) => {
      const r = Math.floor(i / cols), c = i % cols, cx = x + 20 + c * cw, cy = y + r * ch;
      px.rect(cx, cy, cw + 1, ch + 1, C.deep); px.rect(cx + 1, cy + 1, cw - 1, ch - 1, hl.includes(i) ? C.amber : C.skin);
      g.textIn(String(v), cx, cy, cw, ch, C.deep, s);
      if (c === 0) g.textIn('0x' + (i).toString(16).toUpperCase().padStart(2, '0'), x, cy, 19, ch, C.light, 'label', { align: 'left', pad: 0 });
      if (o.pointer === i) px.poly([[cx + cw / 2 - 3, cy - 6], [cx + cw / 2 + 4, cy - 6], [cx + cw / 2, cy - 1]], C.amber);
    });
  }
  function cpu(g, x, y, o = {}) {
    const px = g.px;
    for (let k = 0; k < 5; k++) { px.rect(x + 6 + k * 4, y, 2, 4, C.gray); px.rect(x + 6 + k * 4, y + 24, 2, 4, C.gray); px.rect(x, y + 6 + k * 4, 4, 2, C.gray); px.rect(x + 24, y + 6 + k * 4, 4, 2, C.gray); }
    px.rect(x + 4, y + 4, 20, 20, C.ink); px.rectb(x + 4, y + 4, 20, 20, C.mid);
    px.rect(x + 9, y + 9, 10, 10, o.active && Math.floor(g.t * 4) % 2 ? C.amber : C.slate);
    px.pset(x + 6, y + 6, C.light);
    if (o.label !== false) g.textIn(o.label || 'CPU', x - 6, y + 30, 40, 8, C.cream, 'label');
  }
  function disk(g, x, y, o = {}) {
    const px = g.px;
    px.poly([[x, y], [x + 12, y], [x + 15, y + 3], [x + 15, y + 15], [x, y + 15]], C.slate);
    px.rect(x + 3, y, 9, 5, C.gray); px.rect(x + 8, y + 1, 2, 3, C.slate);
    px.rect(x + 2, y + 7, 11, 7, C.white); px.rect(x + 3, y + 9, 7, 1, C.light); px.rect(x + 3, y + 11, 5, 1, C.light);
    if (o.label) g.textIn(o.label, x - 12, y + 18, 40, 8, C.cream, 'label');
  }
  function db(g, x, y, o = {}) {
    const px = g.px, w = 22, h = 26, cx = x + w / 2;
    ellipse(px, cx, y + h - 4, w / 2 + 1, 4, C.ink); px.rect(x - 1, y + 4, w + 2, h - 8, C.ink);
    ellipse(px, cx, y + h - 4, w / 2, 3, C.rose); px.rect(x, y + 4, w, h - 8, C.rose);
    for (const by of [y + 11, y + 17]) ellipse(px, cx, by, w / 2, 3, C.light), ellipse(px, cx, by - 1, w / 2, 3, C.rose);
    ellipse(px, cx, y + 4, w / 2 + 1, 4, C.ink); ellipse(px, cx, y + 4, w / 2, 3, C.cream);
    if (o.label) g.textIn(o.label, x - 10, y + h + 2, 42, 8, C.cream, 'label');
  }
  function server(g, x, y, o = {}) {
    const px = g.px;
    px.rect(x, y, 26, 36, C.ink); px.rectb(x, y, 26, 36, C.mid);
    for (let u = 0; u < 4; u++) {
      const uy = y + 3 + u * 8;
      px.rect(x + 3, uy, 20, 6, C.slate);
      px.rect(x + 5, uy + 2, 2, 2, (Math.floor(g.t * 3) + u * 7) % 3 ? C.green : C.deep);
      px.rect(x + 9, uy + 2, 2, 2, (Math.floor(g.t * 5) + u) % 2 ? C.amber : C.deep);
      px.rect(x + 14, uy + 1, 7, 1, C.steel); px.rect(x + 14, uy + 3, 7, 1, C.steel);
    }
    if (o.label) g.textIn(o.label, x - 8, y + 38, 42, 8, C.cream, 'label');
  }
  // Wire between points; packet travelling along it at p (0..1).
  function wire(g, pts, o = {}) { for (let i = 0; i + 1 < pts.length; i++) g.px.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], o.color ?? C.light, o.w ?? 1); }
  function along(pts, p) {
    const seg = [], tot = pts.slice(1).reduce((a, q, i) => { const d = Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]); seg.push(d); return a + d; }, 0);
    let d = clamp(p, 0, 1) * tot;
    for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const k = seg[i] ? d / seg[i] : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]; } d -= seg[i]; }
    return pts[pts.length - 1];
  }
  function packet(g, pts, p, o = {}) {
    const px = g.px, [cx, cy] = along(pts, p), x = Math.round(cx) - 5, y = Math.round(cy) - 4;
    px.rect(x - 1, y - 1, 12, 9, C.ink); px.rect(x, y, 10, 7, o.color ?? C.white);
    px.line(x, y, x + 5, y + 4, C.light); px.line(x + 9, y, x + 5, y + 4, C.light);
    if (o.label) g.textIn(o.label, cx - 20, y - 10, 40, 8, C.amber, 'label');
  }
  // Tokens as chips. o: w (wrap width, world), window [a, b) = inside the context window, progress
  function tokens(g, x, y, words, o = {}) {
    const hud = g.hud, s = st(g, 'code'), M = metrics(g, s), pad = g.tall ? 5 : 3, gap = g.tall ? 5 : 4, maxW = H2(o.w ?? (g.W - x - 10));
    const n = o.progress == null ? words.length : Math.ceil(clamp(o.progress, 0, 1) * words.length);
    const ch = (M.bottom - M.top + 1) + pad * 2, rowH = ch + (g.tall ? 14 : 10);
    let X = H2(x), Y = H2(y), rows = [];
    const inWin = (i) => !o.window || (i >= o.window[0] && i < o.window[1]);
    for (let i = 0; i < n; i++) {
      const w = hud.measure(words[i], s).w + pad * 2;
      if (X + w > H2(x) + maxW && X > H2(x)) { X = H2(x); Y += rowH; }
      const inside = inWin(i), bg = o.window ? (inside ? C.skin : C.wine) : (i % 2 ? C.cream : C.skin);
      hud.rect(X + 2, Y + 2, w, ch, C.ink); hud.rect(X, Y, w, ch, bg);
      hud.text(words[i], X + pad, Y + pad - M.top, o.window && !inside ? C.light : C.deep, s);
      if (o.window && inside) (rows[Y] = rows[Y] || []).push([X, X + w]);
      X += w + gap;
    }
    if (o.window) {
      let first = true;
      for (const [yy, spans] of Object.entries(rows)) {
        const a = Math.min(...spans.map((s2) => s2[0])), b = Math.max(...spans.map((s2) => s2[1])), by = +yy + ch + 4;
        hud.rect(a, by, b - a, 3, C.sage); hud.rect(a, by - 4, 3, 5, C.sage); hud.rect(b - 3, by - 4, 3, 5, C.sage);
        if (first) { hud.text('CONTEXT WINDOW', a, by + 6, C.sage, st(g, 'label')); first = false; }
      }
    }
  }
  // The model: a box with a small network inside that fires while thinking. o: label, thinking
  function model(g, x, y, o = {}) {
    const px = g.px, w = o.w ?? 44, h = o.h ?? 34;
    px.rect(x + 2, y + 2, w, h, C.ink); px.rect(x, y, w, h, C.deep); px.rectb(x, y, w, h, C.mid);
    const N = [[0.22, 0.3], [0.5, 0.2], [0.78, 0.36], [0.32, 0.72], [0.68, 0.76]].map(([a, b]) => [Math.round(x + a * w), Math.round(y + b * h)]);
    const E = [[0, 1], [1, 2], [0, 3], [1, 4], [2, 4], [3, 4], [1, 3]], hot = o.thinking ? Math.floor(g.t * 6) % E.length : -1;
    E.forEach(([a, b], i) => px.line(N[a][0], N[a][1], N[b][0], N[b][1], i === hot ? C.amber : C.mid, 1));
    N.forEach(([nx, ny], i) => { const lit = hot >= 0 && E[hot].includes(i); px.rect(nx - 2, ny - 1, 5, 3, lit ? C.amber : C.rose); px.rect(nx - 1, ny - 2, 3, 5, lit ? C.amber : C.rose); });
    if (o.label !== false) g.textIn(o.label || 'MODEL', x, y - 10, w, 8, C.rose, 'label');
  }
  // Abstraction layers, index 0 at the bottom. o: highlight, progress (builds up), lh
  function stack(g, x, y, w, layers, o = {}) {
    const px = g.px, n = layers.length, lh = o.lh ?? (g.tall ? 20 : 14), gap = 3;
    const shown = o.progress == null ? n : Math.ceil(clamp(o.progress, 0, 1) * n);
    for (let i = 0; i < shown; i++) {
      const th = THEMES[THEME_ORDER[i % 5]], yy = y + (n - 1 - i) * (lh + gap);
      px.rect(x + 2, yy + 2, w, lh, C.ink); px.rect(x, yy, w, lh, th.bg); px.rectb(x, yy, w, lh, C.ink);
      if (o.highlight === i) { px.rectb(x - 2, yy - 2, w + 4, lh + 4, C.amber); px.rectb(x - 3, yy - 3, w + 6, lh + 6, C.amber); }
      g.textIn(layers[i], x, yy, w, lh, th.title, 'body');
    }
  }
  // Node-and-edge graph. nodes: [{id, x, y, label}], edges: [[a, b]]. o: progress, active (id)
  function graph(g, nodes, edges, o = {}) {
    const px = g.px, by = Object.fromEntries(nodes.map((n) => [n.id, n])), p = o.progress ?? 1;
    const vis = (i) => i / nodes.length < p;
    edges.forEach(([a, b]) => {
      const A = by[a], B = by[b], ia = nodes.indexOf(A), ib = nodes.indexOf(B);
      if (vis(ia) && vis(ib)) px.line(A.x, A.y, B.x, B.y, o.edge ?? C.cream, 2);
    });
    nodes.forEach((n, i) => {
      if (!vis(i)) return;
      const act = o.active === n.id;
      if (act) px.circb(n.x, n.y, 6 + (Math.floor(g.t * 4) % 2), C.amber);
      node(g, n.x, n.y, act ? C.amber : C.wine);
      if (n.label) g.textIn(n.label, n.x - 30, n.y + 6, 60, 9, act ? C.amber : C.cream, 'label');
    });
  }
  // Boxes joined by arrows. o: progress, active (index), vertical, bw
  function flow(g, x, y, steps, o = {}) {
    const px = g.px, s = st(g, 'body'), vert = o.vertical ?? g.tall, bh = g.tall ? 24 : 18, gap = vert ? 14 : 16;
    const bw = o.bw ?? Math.max(...steps.map((t) => Math.ceil(g.hud.measure(t, s).w / 2) + 12));
    const n = o.progress == null ? steps.length : Math.ceil(clamp(o.progress, 0, 1) * steps.length);
    for (let i = 0; i < n; i++) {
      const bx = vert ? x : x + i * (bw + gap), byy = vert ? y + i * (bh + gap) : y, act = o.active === i;
      px.rect(bx + 2, byy + 2, bw, bh, C.ink); px.rect(bx, byy, bw, bh, act ? C.amber : C.skin); px.rectb(bx, byy, bw, bh, C.ink);
      g.textIn(steps[i], bx, byy, bw, bh, C.deep, s);
      if (i > 0) vert ? arrow(g, bx + bw / 2, byy - gap + 2, bx + bw / 2, byy - 2, { color: C.cream })
        : arrow(g, bx - gap + 2, byy + bh / 2, bx - 2, byy + bh / 2, { color: C.cream });
    }
    return { w: vert ? bw : steps.length * (bw + gap) - gap, h: vert ? steps.length * (bh + gap) - gap : bh };
  }
  function arrow(g, x0, y0, x1, y1, o = {}) {
    const p = o.progress ?? 1; if (p <= 0) return;
    const ex = x0 + (x1 - x0) * p, ey = y0 + (y1 - y0) * p, c = o.color ?? C.cream, w = o.w ?? 2, a = Math.atan2(ey - y0, ex - x0), L = o.head ?? 4;
    g.px.line(x0, y0, ex, ey, c, w);
    for (const s of [-1, 1]) g.px.line(ex, ey, ex - Math.cos(a + s * 0.7) * L, ey - Math.sin(a + s * 0.7) * L, c, w);
  }
  // GUI window (Alto / NLS era). o: title, lines
  function window_(g, x, y, w, h, o = {}) {
    const px = g.px;
    px.rect(x + 3, y + 3, w, h, C.ink); px.rect(x, y, w, h, C.white); px.rectb(x - 1, y - 1, w + 2, h + 2, C.ink);
    px.rect(x, y, w, 8, C.cream); for (let r = 1; r < 8; r += 2) px.line(x + 1, y + r, x + w - 2, y + r, C.rose);
    px.line(x, y + 8, x + w - 1, y + 8, C.ink); px.rect(x + 3, y + 2, 5, 5, C.white); px.rectb(x + 3, y + 2, 5, 5, C.ink);
    if (o.title) { const tw = Math.ceil(g.hud.measure(o.title, st(g, 'label')).w / 2) + 6; px.rect(x + (w - tw) / 2, y + 1, tw, 7, C.cream); g.textIn(o.title, x, y, w, 8, C.deep, 'label'); }
    (o.lines || []).forEach((l, i) => g.text(l, x + 4, y + 11 + i * (g.tall ? 14 : 10), C.deep, 'code'));
  }
  const CURSOR = Pixel.sprite({ pal: { k: 0, w: 8 }, rows: [
    'k.......', 'kk......', 'kwk.....', 'kwwk....', 'kwwwk...', 'kwwwwk..', 'kwwwwwk.', 'kwwwwwwk',
    'kwwwkkkk', 'kwwk....', 'kwk.k...', 'kk..kk..', 'k....k..', '.....kk.'] });
  function cursor(g, x, y, o = {}) { g.px.sprite(CURSOR, Math.round(x), Math.round(y), { scale: o.scale || 1 }); }
  // Engelbart's wooden mouse: a wood block with one red button, cord trailing to o.cord. o.scale
  const MOUSE = Pixel.sprite({ pal: { k: 0, a: 11, c: 10, d: 9, r: 2 }, rows: [
    '..kkkkkkkkkk..', '.kaaaaaarrrak.', '.kaaaaaarrrak.', '.kaaaaaaaaaak.', '.kccccccccccck', '.kccccccccccck', '.kddddddddddk.', '..kkkkkkkkkk..'].map((r) => r.padEnd(14, '.').slice(0, 14)) });
  function mouse(g, x, y, o = {}) {
    const px = g.px, s = o.scale || 1;
    if (o.cord) { const [cx2, cy2] = o.cord, mx = x + 3 * s; px.line(mx, y + 2 * s, mx - 6, y - 4, C.ink, s); px.line(mx - 6, y - 4, cx2, cy2, C.ink, s); }
    px.sprite(MOUSE, Math.round(x), Math.round(y), { scale: s });
  }  // Minicomputer front panel: blinkenlights and switches in groups of three.
  function pdp(g, x, y, o = {}) {
    const px = g.px, w = 66;
    px.rect(x + 2, y + 2, w, 40, C.ink); px.rect(x, y, w, 40, C.ink); px.rectb(x, y, w, 40, C.mid);
    px.rect(x + 3, y + 4, w - 6, 22, C.wine); px.line(x + 3, y + 4, x + w - 4, y + 4, C.rose);
    for (let row = 0; row < 2; row++) for (let i = 0; i < 16; i++) {
      const on = hash(i * 13 + row * 101, Math.floor(g.t * (o.speed ?? 6))) > 0.5;
      px.rect(x + 6 + i * 3.5, y + 8 + row * 5, 2, 2, on ? C.amber : C.deep);
    }
    for (let i = 0; i < 16; i++) px.rect(x + 6 + i * 3.5, y + 19, 2, 5, Math.floor(i / 3) % 2 ? C.rose : C.amber);
    px.rect(x + 3, y + 29, w - 6, 8, C.deep);
    if (o.label) g.textIn(o.label, x + 3, y + 29, w - 6, 8, C.rose, 'label');
  }
  // Teletype with paper coming out. o.lines = number of printed lines on the paper
  function teletype(g, x, y, o = {}) {
    const px = g.px;
    px.rect(x + 11, y - 12, 18, 14, C.white); px.rectb(x + 11, y - 12, 18, 14, C.light);
    for (let i = 0; i < (o.lines ?? 3); i++) px.rect(x + 13, y - 9 + i * 3, 8 + ((i * 5) % 6), 1, C.mid);
    px.rect(x + 5, y, 30, 8, C.rose); px.rectb(x + 5, y, 30, 8, C.ink);
    px.rect(x, y + 8, 40, 12, C.cream); px.rectb(x - 1, y + 7, 42, 14, C.ink);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) px.rect(x + 3 + c * 4 + (r % 2) * 2, y + 10 + r * 3, 2, 2, C.ink);
    px.rect(x + 6, y + 21, 3, 14, C.cream); px.rect(x + 31, y + 21, 3, 14, C.cream);
  }
  function punchcard(g, x, y, o = {}) {
    const px = g.px, w = o.w ?? 44, h = o.h ?? 20;
    px.poly([[x + 4, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y + 4]], C.glow);
    px.line(x + 4, y, x + w - 1, y, C.clayDark); px.line(x, y + 4, x + 4, y, C.clayDark); px.line(x, y + 4, x, y + h - 1, C.clayDark);
    px.line(x, y + h - 1, x + w - 1, y + h - 1, C.clayDark); px.line(x + w - 1, y, x + w - 1, y + h - 1, C.clayDark);
    for (let c = 0; c < (w - 6) / 2; c++) for (let r = 0; r < (h - 6) / 3; r++) if (hash(c * 7 + r, o.seed ?? 2) > 0.74) px.rect(x + 3 + c * 2, y + 3 + r * 3, 1, 2, C.ink);
  }
  // Turing tape. o.head (float index) positions the read/write head
  function tape(g, x, y, symbols, o = {}) {
    const px = g.px, cw = g.tall ? 14 : 11, s = st(g, 'code');
    px.rect(x - 8, y, 8, cw, C.cream); px.rect(x + symbols.length * cw, y, 8, cw, C.cream);
    symbols.forEach((sym, i) => { const cx = x + i * cw; px.rect(cx, y, cw, cw, C.skin); px.rectb(cx, y, cw + 1, cw, C.deep); g.textIn(String(sym), cx, y, cw, cw, C.deep, s); });
    if (o.head != null) {
      const hx = Math.round(x + o.head * cw);
      px.rect(hx + 1, y - 12, cw - 1, 6, C.amber); px.rectb(hx + 1, y - 12, cw - 1, 6, C.ink);
      px.poly([[hx + 2, y - 6], [hx + cw, y - 6], [hx + cw / 2 + 1, y - 1]], C.amber);
    }
  }
  const MOTH = Pixel.sprite({ pal: { k: 0, w: 4, b: 3 }, rows: [
    '..k.....k..', '...k...k...', '.kk.kkk.kk.', 'kwwkbbbkwwk', 'kwwwkbkwwwk', '.kwwkbkwwk.', '..kk.k.kk..'] });
  function bug(g, x, y, o = {}) { g.px.sprite(MOTH, Math.round(x), Math.round(y), { scale: o.scale || 1 }); }
  // ── mail, history, everyday things ──────────────────────────────────────
  // Envelope, 12x8 at scale 1. o: color, scale, open (flap up), letter (paper sticking out), seal (colour)
  function envelope(g, x, y, o = {}) {
    const px = g.px, s = o.scale || 1, w = 12 * s, h = 8 * s, c = o.color ?? C.white;
    x = Math.round(x); y = Math.round(y);
    if (o.letter) { px.rect(x + 2 * s, y - 6 * s, w - 4 * s, 8 * s, C.white); px.rectb(x + 2 * s, y - 6 * s, w - 4 * s, 8 * s, C.ink); for (let k = 0; k < 3; k++) px.rect(x + 4 * s, y - 4 * s + k * 2 * s, (5 - k) * s, s, C.light); }
    if (!o.flat) px.rect(x + s, y + s, w, h, C.ink);
    px.rect(x, y, w, h, c); px.rectb(x, y, w, h, C.ink);
    const f = c === C.white || c === C.cream ? C.light : C.ink;
    if (o.open) {
      px.poly([[x, y], [x + w / 2, y - h / 2], [x + w - 1, y]], c);
      px.line(x, y, x + w / 2, y - h / 2, C.ink); px.line(x + w - 1, y, x + w / 2, y - h / 2, C.ink);
    } else { px.line(x + 1, y + 1, x + w / 2, y + h / 2, f); px.line(x + w - 2, y + 1, x + w / 2, y + h / 2, f); }
    if (o.seal != null) px.rect(x + w / 2 - s, y + h / 2, 2 * s, 2 * s, o.seal);
  }
  // Mailroom sorting shelf, one slot per label. o: fill (letters per slot), colors (per slot), lit (index), sw, sh
  // Returns each slot { x, y, w, h, cx, cy } so a letter can be flown into it.
  function pigeonholes(g, x, y, labels, o = {}) {
    const px = g.px, sw = o.sw ?? 40, sh = o.sh ?? 24, w = labels.length * sw + 4, h = sh + 6;
    px.rect(x + 3, y + 3, w, h, C.ink); px.rect(x, y, w, h, C.clay); px.rectb(x - 1, y - 1, w + 2, h + 2, C.ink);
    px.line(x, y, x + w - 1, y, C.amber);
    const slots = labels.map((_, i) => {
      const r = { x: x + 3 + i * sw, y: y + 3, w: sw - 2, h: sh };
      r.cx = r.x + r.w / 2; r.cy = r.y + r.h / 2;
      px.rect(r.x, r.y, r.w, r.h, C.ink); px.rect(r.x + 1, r.y + 1, r.w - 2, r.h - 1, C.deep);
      const n = Math.min(7, (o.fill && o.fill[i]) || 0);
      for (let k = 0; k < n; k++) envelope(g, r.cx - 6 + (k % 2), r.y + r.h - 9 - k * 2, { color: (o.colors && o.colors[i]) ?? C.white, flat: true });
      if (o.lit === i) px.rectb(r.x - 1, r.y - 1, r.w + 2, r.h + 2, C.amber);
      return r;
    });
    labels.forEach((lab, i) => lab && plate(g, lab, slots[i].cx, y + h + 3, { align: 'center', role: 'label', pad: 4, bg: C.deep, fg: o.lit === i ? C.amber : C.cream }));
    return slots;
  }
  // A pile of paperwork, centred on x, sitting on y.
  function papers(g, x, y, n, o = {}) {
    const px = g.px, w = o.w ?? 16;
    for (let k = 0; k < n; k++) {
      const col = k % 3, row = Math.floor(k / 3);
      const sx = Math.round(x - w * 1.4 + col * w * 0.9 + (hash(k, 51) - 0.5) * 6), sy = y - 4 - row * 3 - Math.round(hash(k, 52) * 2);
      px.rect(sx + 1, sy + 1, w, 4, C.ink); px.rect(sx, sy, w, 4, k % 4 ? C.white : C.cream); px.rectb(sx, sy, w, 4, C.light);
    }
  }
  // Newspaper page. o: title (masthead), date
  function newspaper(g, x, y, w, h, o = {}) {
    const px = g.px, pw = Math.round((w - 10) * 0.45), top = y + 36;
    px.rect(x + 3, y + 3, w, h, C.ink); px.rect(x, y, w, h, C.cream); px.rectb(x - 1, y - 1, w + 2, h + 2, C.ink);
    if (o.title) g.textIn(o.title, x, y + 2, w, 10, C.deep, 'body');
    px.line(x + 3, y + 13, x + w - 4, y + 13, C.deep);
    if (o.date) g.textIn(o.date, x, y + 14, w, 6, C.mid, 'label');
    px.line(x + 3, y + 21, x + w - 4, y + 21, C.deep);
    px.rect(x + 4, y + 25, w - 8, 3, C.deep); px.rect(x + 4, y + 30, Math.round((w - 8) * 0.7), 3, C.deep);
    px.rect(x + 4, top, pw, 20, C.light); px.rectb(x + 4, top, pw, 20, C.mid);
    px.rect(x + 8, top + 7, pw - 8, 10, C.mid); for (let k = 0; k < 4; k++) px.pset(x + 10 + k * 3, top + 10, C.glow);
    for (let yy = top, r = 0; yy < y + h - 3; yy += 3, r++) {  // columns beside the photo, then full width
      const [cx, cw] = yy < top + 21 ? [x + 7 + pw, w - 11 - pw] : [x + 4, w - 8];
      px.rect(cx, yy, Math.round(cw * (0.72 + hash(r, 8) * 0.28)), 1, C.light);
    }
  }
  // A learning machine, 1958 style: patch wires, dials, two answer lamps, and a camera eye on a stand.
  // o: eye ('left' | 'right' | null: which side of the card it sees; false hides it), out ('left' | 'right'), active
  function perceptron(g, x, y, o = {}) {
    const px = g.px, w = 50, h = 66;
    px.rect(x + 3, y + 3, w, h, C.ink); px.rect(x, y, w, h, C.slate); px.rectb(x - 1, y - 1, w + 2, h + 2, C.ink);
    px.line(x, y, x + w - 1, y, C.steel);
    px.rect(x + 4, y + 4, w - 8, 36, C.ink);
    for (let r = 0; r < 7; r++) for (let c = 0; c < 10; c++) px.pset(x + 7 + c * 4, y + 7 + r * 5, C.gray);
    const cols = [C.clay, C.amber, C.rose, C.sage, C.steel, C.cream];
    for (let k = 0; k < 16; k++) {
      const a = [x + 7 + Math.floor(hash(k, 31) * 10) * 4, y + 7 + Math.floor(hash(k, 32) * 7) * 5];
      const b = [x + 7 + Math.floor(hash(k, 33) * 10) * 4, y + 7 + Math.floor(hash(k, 34) * 7) * 5];
      const sag = 3 + hash(k, 35) * 7;
      let prev = a;
      for (let i = 1; i <= 8; i++) {
        const u = i / 8, p = [a[0] + (b[0] - a[0]) * u, Math.min(y + 38, a[1] + (b[1] - a[1]) * u + Math.sin(u * Math.PI) * sag)];
        px.line(prev[0], prev[1], p[0], p[1], cols[k % cols.length]); prev = p;
      }
    }
    for (let i = 0; i < 3; i++) {
      const cx = x + 11 + i * 14, cy = y + 47, a = -2.4 + hash(i, o.active ? Math.floor(g.t * 3) : 1) * 1.6;
      px.circ(cx, cy, 4, C.cream); px.circb(cx, cy, 4, C.ink); px.line(cx, cy, cx + Math.cos(a) * 3, cy + Math.sin(a) * 3, C.clay);
    }
    [['left', x + 8], ['right', x + 30]].forEach(([k, lx]) => { px.rect(lx - 1, y + 55, 14, 8, C.ink); px.rect(lx, y + 56, 12, 6, o.out === k ? C.amber : C.deep); });
    if (o.eye === false) return;
    const ex = x - 36, ey = y + 16;
    for (const fx of [ex + 4, ex + 11, ex + 18]) px.line(ex + 11, ey + 24, fx, y + h + 2, C.gray);
    px.rect(ex + 2, ey + 2, 22, 22, C.ink); px.rect(ex, ey, 22, 22, C.mid); px.rect(ex + 2, ey + 2, 18, 18, C.ink);
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      const lit = r > 0 && r < 4 && (o.eye === 'left' ? c < 2 : o.eye === 'right' ? c > 2 : false);
      px.rect(ex + 4 + c * 3, ey + 4 + r * 3, 2, 2, lit ? C.glow : C.deep);
    }
    px.line(ex + 22, ey + 10, x - 1, y + 22, C.cream);
  }
  // Snow over the whole frame. o: amount (0..1), speed
  function snow(g, o = {}) {
    const px = g.px, n = Math.round((o.n ?? 110) * (o.amount ?? 1)), sp = o.speed ?? 12;
    for (let k = 0; k < n; k++) {
      const y = (hash(k, 12) * g.H + g.t * sp * (0.6 + hash(k, 13) * 0.8)) % g.H;
      const x = (hash(k, 11) * g.W + Math.sin(g.t * 1.3 + k) * 2 + g.W) % g.W;
      px.pset(x, y, k % 3 ? C.white : C.cream); if (k % 4 === 0) px.pset(x + 1, y, C.white);
    }
  }
  function coin(g, x, y) {
    const px = g.px; x = Math.round(x); y = Math.round(y);
    px.rect(x - 2, y - 1, 5, 3, C.clayDark); px.rect(x - 1, y - 2, 3, 5, C.clayDark); px.rect(x - 1, y - 1, 3, 3, C.amber); px.pset(x - 1, y - 1, C.glow);
  }
  // Money jar, fill 0..1.
  function jar(g, x, y, fill, o = {}) {
    const px = g.px, w = 22, h = 28, lvl = Math.round((h - 8) * clamp(fill, 0, 1));
    px.rect(x + 2, y + 5, w, h - 3, C.ink); px.rect(x, y + 3, w, h - 3, C.deep); px.rectb(x, y + 3, w, h - 3, C.light);
    for (let r = 0; r < lvl; r += 2) for (let c = 0; c + 3 < w - 3; c += 4) coin(g, x + 3 + c + (r % 4 ? 2 : 0), y + h - 3 - r);
    px.rect(x + 3, y, w - 6, 4, C.gray); px.rectb(x + 3, y, w - 6, 4, C.ink);
    px.line(x + 2, y + 6, x + 2, y + h - 4, C.cream);
  }
  // Steam engine, 1865: flywheel, boiler and a smoking chimney. x, y = its left end on the floor.
  // o: speed (flywheel turns a second), smoke (0..1)
  function engine(g, x, y, o = {}) {
    const px = g.px, t = g.t, bx = x + 30, by = y - 26, cx = bx + 28, ctop = y - 72;
    px.rect(x, y - 5, 84, 5, C.mid); px.line(x, y - 5, x + 83, y - 5, C.light);
    const sm = o.smoke ?? 1;
    for (let k = 0; k < 7; k++) {
      const ph = (t * 0.45 + k / 7) % 1;
      if (ph > sm) continue;
      px.circ(cx + 4 + ph * 20 + Math.sin(t + k) * 2, ctop - 4 - ph * 46, 2 + ph * 7, ph < 0.5 ? C.light : C.mid);
    }
    px.rect(cx, ctop, 8, by - ctop, C.clayDark); px.rectb(cx - 1, ctop - 1, 10, by - ctop + 1, C.ink);
    for (let r = ctop + 3; r < by; r += 4) px.line(cx, r, cx + 7, r, C.clay);
    px.rect(cx - 2, ctop - 3, 12, 3, C.ink);
    px.rect(bx + 2, by + 2, 40, 21, C.ink); px.rect(bx, by, 40, 21, C.navy); px.rectb(bx, by, 40, 21, C.ink);
    px.line(bx + 1, by + 2, bx + 38, by + 2, C.steel);
    for (let k = 0; k < 6; k++) { px.pset(bx + 4 + k * 6, by + 5, C.steel); px.pset(bx + 4 + k * 6, by + 17, C.steel); }
    const fx = x + 14, fy = y - 22, R = 15, a0 = t * (o.speed ?? 0.4) * Math.PI * 2;
    px.circb(fx, fy, R, C.ink); px.circb(fx, fy, R - 1, C.steel); px.circb(fx, fy, R - 2, C.ink);
    for (let k = 0; k < 6; k++) { const a = a0 + (k * Math.PI) / 3; px.line(fx, fy, fx + Math.cos(a) * (R - 2), fy + Math.sin(a) * (R - 2), C.steel); }
    px.line(fx + Math.cos(a0) * 8, fy + Math.sin(a0) * 8, bx, by + 11, C.gray, 2);
    px.rect(fx - 2, fy - 2, 5, 5, C.ink); px.rect(fx - 1, fy - 1, 3, 3, C.amber);
  }
  // Coal heap centred on x, sitting on y. amount 0..1
  function coal(g, x, y, amount, o = {}) {
    const px = g.px, w = 8 + amount * (o.w ?? 90), h = 3 + amount * (o.h ?? 30);
    for (let j = 0; j < h; j++) { const half = (w / 2) * Math.sqrt(1 - j / h); px.rect(x - half, y - j, half * 2, 1, C.ink); }
    for (let k = 0; k < (w * h) / 9; k++) {
      const j = hash(k, 22) * h, half = (w / 2) * Math.sqrt(1 - j / h);
      px.pset(x + (hash(k, 21) * 2 - 1) * half * 0.95, y - j, k % 3 ? C.deep : C.mid);
    }
  }
  // Stopwatch centred on x, y. o: p (hand, 0..1 of a turn), r
  function stopwatch(g, x, y, o = {}) {
    const px = g.px, r = o.r ?? 10, a = (o.p ?? 0) * Math.PI * 2;
    px.rect(x - 2, y - r - 5, 5, 3, C.gray); px.rect(x - 1, y - r - 2, 3, 2, C.gray);
    px.circ(x + 1, y + 1, r + 1, C.ink); px.circ(x, y, r + 1, C.ink); px.circ(x, y, r, C.white);
    for (let k = 0; k < 12; k++) { const b = (k / 12) * Math.PI * 2; px.pset(x + Math.round(Math.sin(b) * (r - 2)), y - Math.round(Math.cos(b) * (r - 2)), C.light); }
    px.line(x, y, x + Math.sin(a) * (r - 3), y - Math.cos(a) * (r - 3), C.clay); px.rect(x - 1, y - 1, 2, 2, C.ink);
  }
  // Tear-off calendar page (text layer). text: a year or a date
  function calendar(g, x, y, text, o = {}) {
    const w = o.w ?? 48, h = o.h ?? 40;
    g.ui.rect(x + 2, y + 2, w, h, C.ink); g.ui.rect(x, y, w, h, C.white); g.ui.rect(x, y, w, 8, C.wine);
    g.ui.rect(x + 9, y - 2, 3, 6, C.gray); g.ui.rect(x + w - 12, y - 2, 3, 6, C.gray);
    g.textIn(text, x, y + 8, w, h - 8, C.deep, o.role || 'head');
  }
  // A wall of video thumbnails. o: n (how many show), tags (cycled), word (big title), dim (0..1)
  function thumbs(g, x, y, cols, rows, o = {}) {
    const px = g.px, tw = o.tw ?? 50, th = o.th ?? 28, gap = o.gap ?? 6, n = Math.min(o.n ?? cols * rows, cols * rows);
    const bgs = [C.wine, C.slate, C.navy, C.clayDark, C.mid, C.sage], words = !o.dim || o.dim < 0.3;
    for (let i = 0; i < n; i++) {
      const tx = x + (i % cols) * (tw + gap), ty = y + Math.floor(i / cols) * (th + gap), hx = tx + tw - 13, hy = ty + th - 14;
      px.rect(tx + 2, ty + 2, tw, th, C.ink); px.rect(tx, ty, tw, th, bgs[(i * 7) % bgs.length]); px.rectb(tx - 1, ty - 1, tw + 2, th + 2, C.ink);
      px.rect(hx, hy + 3, 10, 11, C.face); px.rect(hx, hy, 10, 5, i % 3 ? C.hair : C.clayDark);
      px.pset(hx + 3, hy + 7, C.ink); px.pset(hx + 7, hy + 7, C.ink); px.rect(hx + 3, hy + 10, 4, 2, C.wine);
      px.rect(tx, ty + th - 2, Math.round(tw * (0.2 + hash(i, 7) * 0.7)), 2, C.clay);
      if (words) g.textIn(o.word ?? 'JEV', tx + 1, ty + 1, tw - 16, th - 12, i % 2 ? C.glow : C.white, 'head', { align: 'left', pad: 3 });
      if (words && o.tags) plate(g, o.tags[i % o.tags.length], tx + 2, ty + th - 11, { role: 'label', pad: 3, bg: C.ink, fg: C.cream });
    }
    if (o.dim) px.dither(x - 2, y - 2, cols * (tw + gap) + 2, rows * (th + gap) + 2, null, C.ink, o.dim);
  }
  // Tiny photo (for "a million photos"). seed picks what's in it.
  function photo(g, x, y, seed, o = {}) {
    const px = g.px, w = o.w ?? 12, h = o.h ?? 9, gy = y + Math.round(h * 0.6);
    const pick = (arr, k) => arr[Math.floor(hash(seed, k) * arr.length)];
    px.rect(x - 1, y - 1, w + 2, h + 2, C.ink);
    px.rect(x, y, w, h, pick([C.steel, C.slate, C.navy, C.glow], 41)); px.rect(x, gy, w, y + h - gy, pick([C.sage, C.clay, C.mid, C.slate], 42));
    px.rect(x + 2 + Math.floor(hash(seed, 44) * (w - 6)), y + 2, 4, gy - y, pick([C.amber, C.white, C.hair, C.rose, C.clayDark], 43));
  }
  // A face that shows one feeling at a glance. Centred on x, y. o: mood ('annoyed' | 'happy' | 'neutral'), r
  function faceIcon(g, x, y, o = {}) {
    const px = g.px, r = o.r ?? 14, m = o.mood || 'neutral';
    px.circ(x + 2, y + 2, r + 1, C.ink); px.circ(x, y, r + 1, C.ink); px.circ(x, y, r, C.face);
    px.rect(x - r + 2, y - r, 2 * r - 3, 4, C.hair); px.rect(x - r + 1, y - r + 3, 3, 5, C.hair); px.rect(x + r - 3, y - r + 3, 3, 5, C.hair);
    px.rect(x - 6, y - 2, 3, 4, C.ink); px.rect(x + 4, y - 2, 3, 4, C.ink);
    if (m === 'annoyed') { px.line(x - 9, y - 7, x - 3, y - 4, C.ink, 2); px.line(x + 9, y - 7, x + 3, y - 4, C.ink, 2); px.line(x - 5, y + 7, x + 5, y + 7, C.ink, 2); px.pset(x - 6, y + 8, C.ink); px.pset(x + 6, y + 8, C.ink); }
    else if (m === 'happy') { px.line(x - 5, y + 5, x - 2, y + 8, C.ink, 2); px.line(x - 2, y + 8, x + 3, y + 8, C.ink, 2); px.line(x + 3, y + 8, x + 6, y + 5, C.ink, 2); }
    else px.line(x - 4, y + 7, x + 4, y + 7, C.ink, 2);
    px.rect(x - r + 3, y + 3, 3, 2, C.faceShade); px.rect(x + r - 5, y + 3, 3, 2, C.faceShade);
  }
  // Small icons: inbox bank card calc calendar lock flag building shop, and horse dog fish bird car (things that move). o.scale
  const ICON_PAL = { k: 0, w: 8, l: 4, s: 23, c: 6, n: 22, a: 11, g: 21, r: 2, x: 10, b: 10, y: 12, d: 1, e: 14, h: 9, p: 18, m: 3 };
  const ICONS = Object.fromEntries(Object.entries({
    inbox: ['..kkkkkkkkkkkk..', '..kwwwwwwwwwwk..', '..kwlwwwwwwlwk..', '..kwwlwwwwlwwk..', '..kwwwllllwwwk..', 'kkkkkkkkkkkkkkkk', 'kssssssssssssssk', 'kssssssssssssssk', 'kkkkkkkkkkkkkkkk'],
    bank: ['........k........', '......kkckk......', '....kkccccckk....', '..kkccccccccckk..', 'kkkkkkkkkkkkkkkkk', '.kck.kck.kck.kck.', '.kck.kck.kck.kck.', '.kck.kck.kck.kck.', '.kck.kck.kck.kck.', 'kkkkkkkkkkkkkkkkk', 'kccccccccccccccck', 'kkkkkkkkkkkkkkkkk'],
    card: ['.kkkkkkkkkkkkkk.', 'knnnnnnnnnnnnnnk', 'knnnnnnnnnnnnnnk', 'knaaannnnnnnnnnk', 'knaaannnnnnnnnnk', 'knnnnnnnnnnnnnnk', 'knccnccnccnccnnk', 'knnnnnnnnnnnnnnk', '.kkkkkkkkkkkkkk.'],
    calc: ['kkkkkkkkkkkk', 'kddddddddddk', 'kdwwwwwwwwdk', 'kdwwwwwwwwdk', 'kddddddddddk', 'kdccdccdaadk', 'kdccdccdaadk', 'kddddddddddk', 'kdccdccdccdk', 'kdccdccdccdk', 'kddddddddddk', 'kdccdccdccdk', 'kdccdccdccdk', 'kddddddddddk', 'kkkkkkkkkkkk'],
    calendar: ['..k.....k....', 'kkkkkkkkkkkkk', 'krrrrrrrrrrrk', 'krrrrrrrrrrrk', 'kkkkkkkkkkkkk', 'kwwwwwwwwwwwk', 'kwlwlwlwlwlwk', 'kwwwwwwwwwwwk', 'kwlwlwlwawlwk', 'kwwwwwwwwwwwk', 'kwlwlwlwlwlwk', 'kwwwwwwwwwwwk', 'kkkkkkkkkkkkk'],
    lock: ['...kkkk...', '..kggggk..', '.kgk..kgk.', '.kgk..kgk.', '.kgk..kgk.', 'kkkkkkkkkk', 'kaaaaaaaak', 'kaaakkaaak', 'kaaakkaaak', 'kaaaaaaaak', 'kkkkkkkkkk'],
    flag: ['kk........', 'kgkkkkk...', 'kgxxxxxkk.', 'kgxxxxxxxk', 'kgxxxxxkk.', 'kgkkkkk...', 'kg........', 'kg........', 'kg........', 'kg........', 'kg........', 'kk........'],
    building: ['kkkkkkkkkkkkkkkk', 'kbbbbbbbbbbbbbbk', 'kbyybyybbyybyybk', 'kbyybyybbyybyybk', 'kbbbbbbbbbbbbbbk', 'kbyybyybbyybyybk', 'kbyybyybbyybyybk', 'kbbbbbbbbbbbbbbk', 'kbyybyybbyybyybk', 'kbyybyybbyybyybk', 'kbbbbbbbbbbbbbbk', 'kbbbbbkkkkbbbbbk', 'kbbbbbkddkbbbbbk', 'kbbbbbkddkbbbbbk', 'kkkkkkkkkkkkkkkk'],
    horse: ['..............kk..', '.............kppk.', '............kpppk.', '...........kpppppk', '..kkkkkkkkkppkkkk.', '.kpppppppppppk....', 'kkpppppppppppk....', 'k.kpppppppppk.....', '..kpk.....kpk.....', '..kpk.....kpk.....', '..kpk.....kpk.....', '..kk......kk......'],
    dog: ['..........kk..', '.........kppk.', '.k......kpppkk', '.kk.....kppk..', '..kkkkkkkppk..', '..kpppppppk...', '..kpppppppk...', '..kpk...kpk...', '..kpk...kpk...', '..kk....kk....'],
    fish: ['......kkkkkk....', '....kkxxxxxxkk..', 'k..kxxxxxxxxxkk.', 'kkkxxxxxxxxxkwk.', 'kkkxxxxxxxxxxxxk', 'k..kxxxxxxxxxkk.', '....kkxxxxxxkk..', '......kkkkkk....'],
    bird: ['.........kk...', '........kggk..', '........kgwkk.', '........kggkak', '..kkkkkkkggk..', '.kggggggggggk.', 'kgggsssgggggk.', '.kkgggggggkk..', '...kk..k.k....', '........k.k...'],
    car: ['....kkkkkkkk......', '...kwwkwwwwwk.....', '..kwwwkwwwwwwk....', 'kkkkkkkkkkkkkkkk..', 'kaxxxxxxxxxxxxxak.', 'kxxxxxxxxxxxxxxxk.', 'kxxkkkxxxxxxkkkxk.', '.kkkgkkkkkkkkgkkk.', '...kkk......kkk...'],
    // the pipeline's five stages, hand-placed: voice, words (captions), cues (clapper), scene (code), render (film)
    mic: ['....kkkkk....', '...kwcccck...', '...kgggggk...', '...kwcccck...', '...kgggggk...', '...kwcccck...', '.l.kgggggk.l.', '.l..kkkkk..l.', '..l.......l..', '...lllllll...', '......l......', '......l......', '....lllll....'],
    captions: ['kkkkkkkkkkkkk', 'kccccccccccck', 'kccccccccccck', 'kckkkcckkkcck', 'kckcccckcccck', 'kckcccckcccck', 'kckkkcckkkcck', 'kccccccccccck', 'kccccccccccck', 'kkkkkkkkkkkkk'],
    clapper: ['kkkkkkkkkkkkk', 'kwwkkwwkkwwkk', 'kkwwkkwwkkwwk', 'kkkkkkkkkkkkk', 'kccccccccccck', 'kcgggccccccck', 'kccccccccccck', 'kcgggggccccck', 'kccccccccccck', 'kkkkkkkkkkkkk'],
    code: ['.......c.....', '...c...c.c...', '..c....c..c..', '.c....c....c.', 'c.....c.....c', '.c....c....c.', '..c..c....c..', '...c.c...c...', '.....c.......'],
    film: ['kkkkkkkkkkkkk', 'kwkssssssskwk', 'kkkssssssskkk', 'kwkssssssskwk', 'kkkkkkkkkkkkk', 'kwkccccccckwk', 'kkkccccccckkk', 'kwkccccccckwk', 'kkkkkkkkkkkkk', 'kwkssssssskwk', 'kkkssssssskkk', 'kkkkkkkkkkkkk'],
    shop: ['.kkkkkkkkkkkkkkkk.', 'kxwxwxwxwxwxwxwxwk', 'kxwxwxwxwxwxwxwxwk', '.kkkkkkkkkkkkkkkk.', '.keeeeeeeeeeeeeek.', '.keyyyyyyekkkkeek.', '.keyyyyyyekddkeek.', '.keyyyyyyekddkeek.', '.keyyyyyyekddkeek.', '.keeeeeeeekddkeek.', '.kkkkkkkkkkkkkkkk.'],
  }).map(([k, rows]) => [k, Pixel.sprite({ pal: ICON_PAL, rows })]));
  // o: scale, shadow (a 1 px ink drop shadow, for icons on a coloured card), pal (letters to recolour)
  const ICON_INK = Object.fromEntries(Object.keys(ICON_PAL).map((k) => [k, 0]));
  function icon(g, kind, x, y, o = {}) {
    const I = ICONS[kind], s = o.scale || 1;
    if (!I) return null;
    if (o.shadow) g.px.sprite(I, Math.round(x) + s, Math.round(y) + s, { scale: s, pal: ICON_INK });
    g.px.sprite(I, Math.round(x), Math.round(y), { scale: s, pal: o.pal });
    return { w: I.w * s, h: I.h * s };
  }
  // Closed book, cover out. o: title (a label across the cover), color, w, h
  function book(g, x, y, o = {}) {
    const px = g.px, w = o.w ?? 30, h = o.h ?? 38;
    px.rect(x + 2, y + 2, w, h, C.ink); px.rect(x, y, w, h, o.color ?? C.navy); px.rectb(x - 1, y - 1, w + 2, h + 2, C.ink);
    px.rect(x, y, 3, h, C.ink); px.rect(x + w - 2, y + 2, 2, h - 4, C.cream);
    if (o.title) plate(g, o.title, x + w / 2, y + 8, { align: 'center', role: 'label', pad: 3, bg: C.cream, fg: C.deep });
  }
  // Line chart that draws itself left to right. values 0..1. o: progress, color
  function chart(g, x, y, w, h, values, o = {}) {
    const px = g.px, c = o.color ?? C.amber;
    px.rect(x, y, 2, h, C.cream); px.rect(x, y + h - 2, w, 2, C.cream);
    const pts = values.map((v, i) => [x + 5 + (i / (values.length - 1)) * (w - 9), y + h - 5 - v * (h - 9)]);
    const n = clamp(o.progress ?? 1, 0, 1) * (pts.length - 1);
    for (let i = 0; i < Math.ceil(n); i++) {
      const f = Math.min(1, n - i), [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      px.line(ax, ay, ax + (bx - ax) * f, ay + (by - ay) * f, c, 2);
    }
  }
  // A very expensive coat and a top hat for any actor. a = what actor() returned. o: from (sprite row), color
  function coat(g, a, o = {}) {
    const px = g.px, s = a.s, top = a.top + (o.from ?? 11) * s, bot = a.top + a.h + s, l = a.left + s, r = a.left + a.w - s, fl = 3 * s, mid = Math.round((l + r) / 2);
    px.poly([[l - s, top], [r + s, top], [r + fl, bot], [l - fl, bot]], C.ink);
    px.poly([[l, top + s], [r, top + s], [r + fl - s, bot - s], [l - fl + s, bot - s]], o.color ?? C.wine);
    px.line(mid, top + 2 * s, mid, bot - 2 * s, C.deep, s);
    for (let yy = top + 3 * s; yy < bot - 2 * s; yy += 3 * s) px.rect(mid + s, yy, s, s, C.amber);
    px.rect(l - s, top - s, r - l + 2 * s, 2 * s, C.cream); px.rect(l - s, top + s, r - l + 2 * s, s, C.white);
    for (let xx = l; xx < r; xx += 3 * s) px.rect(xx, top - s, s, s, C.white);
    const hx = Math.round(a.head[0]), hy = a.top;
    px.rect(hx - 7 * s, hy - s, 14 * s, s, C.ink); px.rect(hx - 4 * s, hy - 8 * s, 8 * s, 7 * s, C.ink); px.rect(hx - 4 * s, hy - 3 * s, 8 * s, s, C.wine);
  }
  // Band meter for a judgment's sureness: REVIEW below lo, CHECK between, ACT above hi (text layer; sits on a panel).
  // o: lo, hi, lit ('review' | 'check' | 'act'), value (needle, 0..1)
  function meter(g, x, y, w, o = {}) {
    const lo = o.lo ?? 0.5, hi = o.hi ?? 0.8, bh = g.tall ? 14 : 11;
    [['review', 0, lo, C.clay, C.white], ['check', lo, hi, C.glow, C.deep], ['act', hi, 1, C.sage, C.white]].forEach(([name, a, b, c, fg]) => {
      const bx = x + Math.round(w * a), bw = Math.round(w * (b - a)), on = !o.lit || o.lit === name;
      g.ui.rect(bx, y, bw, bh, on ? c : C.cream); g.ui.rectb(bx, y, bw, bh, C.deep);
      g.textIn(name.toUpperCase(), bx, y, bw, bh, on ? fg : C.mid, 'label');
    });
    [lo, hi].forEach((v) => g.textIn(v.toFixed(1), x + w * v - 10, y + bh + 2, 20, 8, C.mid, 'code'));
    if (o.value != null) { const nx = x + Math.round(w * clamp(o.value, 0, 1)); g.ui.poly([[nx - 4, y - 7], [nx + 5, y - 7], [nx, y - 1]], C.deep); }
    return { h: bh + 12 };
  }
  // Chat window (text layer). msgs: [{ who: 'you' | 'ai', text }]. o: title, progress (types the last message)
  function chat(g, x, y, w, h, msgs, o = {}) {
    panel(g, x, y, w, h, { theme: 'paper', tab: o.title || 'CHAT' });
    let yy = y + (g.tall ? 16 : 13);
    msgs.forEach((m, i) => {
      const you = m.who === 'you';
      const r = plate(g, m.text, you ? x + w - 5 : x + 5, yy, { align: you ? 'right' : undefined, w: Math.round(w * 0.8), role: m.role || 'body', pad: g.tall ? 8 : 5,
        bg: you ? C.wine : C.rose, fg: you ? C.white : C.deep, progress: i === msgs.length - 1 ? o.progress : undefined });
      yy += r.h + 4;
    });
  }

  // Bicycle standing on y, centred on x. o: spin (wheel turns a second), color. Returns { seat, bars, pedal } for a rider.
  function bicycle(g, x, y, o = {}) {
    const px = g.px, R = 9, rx = x - 15, fx = x + 15, hy = y - R - 1, a0 = g.t * (o.spin ?? 0) * Math.PI * 2, c = o.color ?? C.clay;
    for (const wx of [rx, fx]) {
      px.circb(wx, hy, R, C.ink); px.circb(wx, hy, R - 1, C.gray);
      for (let k = 0; k < 4; k++) { const a = a0 + (k * Math.PI) / 4; px.line(wx - Math.cos(a) * (R - 2), hy - Math.sin(a) * (R - 2), wx + Math.cos(a) * (R - 2), hy + Math.sin(a) * (R - 2), C.light); }
      px.rect(wx - 1, hy - 1, 3, 3, C.ink);
    }
    const bb = [x - 2, hy + 1], seat = [x - 7, y - 27], head = [x + 10, y - 26], fork = [x + 11, y - 21];
    [[[rx, hy], bb], [[rx, hy], seat], [bb, seat], [seat, head], [bb, fork], [head, [fx, hy]]].forEach(([p0, p1]) => { px.line(p0[0], p0[1], p1[0], p1[1], C.ink, 3); px.line(p0[0], p0[1], p1[0], p1[1], c, 1); });
    px.rect(seat[0] - 4, seat[1] - 2, 8, 2, C.ink); px.line(head[0], head[1], head[0] - 3, head[1] - 4, C.ink, 2); px.line(head[0] - 3, head[1] - 4, head[0] + 2, head[1] - 5, C.ink, 2);
    const pa = a0 * 0.8, pedal = [Math.round(bb[0] + Math.cos(pa) * 4), Math.round(bb[1] + Math.sin(pa) * 4)];
    px.line(bb[0], bb[1], pedal[0], pedal[1], C.gray, 2); px.rect(pedal[0] - 2, pedal[1], 4, 1, C.ink);
    return { seat: [seat[0], seat[1] - 2], bars: [head[0] + 1, head[1] - 5], pedal };
  }
  // Jacquard loom, 1804: a wooden frame, the card chain over the top, warp threads, cloth weaving at the front.
  // x, y = top-left; o: p (how far the card chain has advanced, in cards), woven (0..1 of the cloth done), seed
  function loom(g, x, y, o = {}) {
    const px = g.px, w = 70, h = 96, p = o.p ?? g.t * 2, woven = clamp(o.woven ?? 1, 0, 1);
    px.rect(x + 2, y + 16, 5, h - 16, C.clayDark); px.rect(x + w - 7, y + 16, 5, h - 16, C.clayDark);
    px.rect(x, y + 50, w, 4, C.clayDark); px.rect(x, y + h - 6, w, 4, C.clayDark);
    px.rect(x + 12, y, w - 24, 18, C.clay); px.rectb(x + 12, y, w - 24, 18, C.ink); px.line(x + 13, y + 1, x + w - 14, y + 1, C.amber);
    for (let i = 0; i < 9; i++) px.pset(x + 16 + i * 5, y + 9, C.ink);
    const off = (p % 1) * 7;  // the card chain: cards fold back and forth down the right side, moving as p grows
    for (let k = -1; k < 8; k++) {
      const cy = Math.round(y + 4 + k * 7 + off), cx = x + w - 12 + (k % 2 ? 3 : 0);
      if (cy < y + 2 || cy > y + 58) continue;
      px.rect(cx, cy, 16, 6, C.glow); px.rectb(cx, cy, 16, 6, C.clayDark);
      for (let i = 0; i < 6; i++) if (hash(i + (k - Math.floor(p)) * 7, o.seed ?? 5) > 0.5) px.pset(cx + 2 + i * 2, cy + 2 + (i % 2), C.ink);
    }
    for (let i = 0; i < 12; i++) px.line(x + 14 + i * 4, y + 18, x + 14 + i * 4, y + 72, C.light);
    const clothTop = y + 72, rows = Math.round(18 * woven);
    px.rect(x + 12, clothTop, w - 24, 18, C.deep); px.rectb(x + 11, clothTop - 1, w - 22, 20, C.ink);
    for (let r = 0; r < rows; r++) for (let c = 0; c < w - 26; c++) {  // the picture, woven row by row from the bottom
      const on = (Math.abs(c - (w - 26) / 2) + Math.abs(r - 9)) % 8 < 3;
      px.pset(x + 13 + c, clothTop + 17 - r, on ? C.amber : C.wine);
    }
  }
  // Table knife, handle at x, y, pointing right. o: flip (points left), down (points straight down)
  function knife(g, x, y, o = {}) {
    const px = g.px;
    if (o.down) { px.rectb(x - 2, y - 1, 5, 11, C.ink); px.rect(x - 1, y, 3, 9, C.clayDark); px.rect(x - 1, y + 10, 3, 11, C.gray); px.line(x + 1, y + 10, x + 1, y + 20, C.white); return; }
    const d = o.flip ? -1 : 1, hx = d > 0 ? x : x - 10, bx = d > 0 ? x + 10 : x - 23;
    px.rectb(hx - 1, y - 2, 12, 5, C.ink); px.rect(hx, y - 1, 10, 3, C.clayDark);
    px.rect(bx, y - 1, 13, 3, C.gray); px.line(bx, y - 1, bx + 12, y - 1, C.white);
  }
  // Peanut butter jar standing on y, centred on x. o: lid (false = off), knife ('in' = stuck in the top, 'whole' = the whole knife inside), fill 0..1
  function pbjar(g, x, y, o = {}) {
    const px = g.px, w = 26, h = 30, l = Math.round(x - w / 2), t = y - h, lvl = Math.round((h - 6) * (o.fill ?? 0.8));
    if (o.knife === 'in') knife(g, x + 2, t - 16, { down: true });
    px.rect(l + 2, t + 2, w, h, C.ink); px.rect(l, t, w, h, C.cream); px.rectb(l, t, w, h, C.ink);
    px.rect(l + 2, y - 2 - lvl, w - 4, lvl, C.clay); for (let k = 0; k < lvl; k += 3) px.line(l + 3, y - 3 - k, l + 7, y - 3 - k, C.amber);
    if (o.knife === 'whole') knife(g, l + 2, y - 6, {});
    px.rect(l + 4, t + 10, w - 8, 10, C.white); px.rectb(l + 4, t + 10, w - 8, 10, C.ink); g.textIn('PB', l + 4, t + 10, w - 8, 10, C.clayDark, 'label');
    px.line(l + 2, t + 3, l + 2, y - 4, C.white);
    if (o.lid !== false && o.knife !== 'in') { px.rect(l - 1, t - 5, w + 2, 6, C.wine); px.rectb(l - 1, t - 5, w + 2, 6, C.ink); }
  }
  // A slice of bread, top-left x, y. o: spread (0..1 of it covered)
  function bread(g, x, y, o = {}) {
    const px = g.px;
    px.rect(x + 1, y + 5, 24, 18, C.ink); px.rect(x, y + 4, 24, 18, C.clay); px.circ(x + 6, y + 6, 6, C.clay); px.circ(x + 17, y + 6, 6, C.clay);
    px.rect(x + 2, y + 6, 20, 14, C.cream); px.circ(x + 6, y + 7, 4, C.cream); px.circ(x + 17, y + 7, 4, C.cream);
    const sp = Math.round(18 * clamp(o.spread ?? 0, 0, 1));
    if (sp) px.rect(x + 3, y + 7, sp, 11, C.amber);
  }
  // Film projector, 1911 style, feet on y, lens facing right. o: beam [x1, yTop, yBottom] (light cone to a screen), spin
  function projector(g, x, y, o = {}) {
    const px = g.px, a0 = g.t * (o.spin ?? 1.5) * Math.PI * 2;
    if (o.beam) { const [bx, b0, b1] = o.beam; px.poly([[x + 34, y - 21], [bx, b0], [bx, b1], [x + 34, y - 17]], C.glow); }
    for (const [rx, ry] of [[x + 8, y - 40], [x + 24, y - 40]]) {
      px.circ(rx, ry, 8, C.ink); px.circ(rx, ry, 7, C.slate);
      for (let k = 0; k < 3; k++) { const a = a0 + (k * Math.PI * 2) / 3; px.line(rx, ry, rx + Math.cos(a) * 6, ry + Math.sin(a) * 6, C.gray); }
      px.rect(rx - 1, ry - 1, 3, 3, C.ink);
    }
    px.rect(x + 2, y - 30, 30, 18, C.ink); px.rect(x, y - 32, 30, 18, C.navy); px.rectb(x, y - 32, 30, 18, C.ink); px.line(x + 1, y - 31, x + 28, y - 31, C.steel);
    px.rect(x + 30, y - 24, 5, 8, C.gray); px.rectb(x + 30, y - 24, 5, 8, C.ink);
    px.line(x + 6, y - 14, x + 2, y, C.ink, 2); px.line(x + 24, y - 14, x + 28, y, C.ink, 2); px.line(x + 15, y - 14, x + 15, y, C.ink, 2);
  }
  // ── the animation studio: voice first, the exposure sheet, the storyboard, the sweatbox (room 'screening') ──
  // Studio ribbon mic on a floor stand, feet on y. o: h (stand height), on (a red light: recording). Returns { head }.
  function mic(g, x, y, o = {}) {
    const px = g.px, h = o.h ?? 36, hy = y - h;
    px.rect(x - 7, y - 2, 15, 2, C.ink); px.rect(x - 6, y - 3, 13, 1, C.gray);
    px.rect(x, hy + 9, 2, h - 11, C.gray); px.line(x + 1, hy + 9, x + 1, y - 3, C.ink);
    px.rect(x - 5, hy + 6, 12, 2, C.ink); px.rect(x - 5, hy + 1, 2, 6, C.ink); px.rect(x + 5, hy + 1, 2, 6, C.ink);
    px.rect(x - 4, hy - 9, 10, 17, C.ink); px.rect(x - 3, hy - 10, 8, 19, C.ink);
    px.rect(x - 3, hy - 8, 8, 15, C.gray);
    for (let r = hy - 7; r < hy + 7; r += 2) px.line(x - 2, r, x + 4, r, C.light);
    px.rect(x - 3, hy - 1, 8, 1, C.ink);
    if (o.on) px.rect(x, hy - 13, 2, 2, Math.floor(g.t * 2) % 2 ? C.clay : C.clayDark);
    return { head: [x + 1, hy - 1] };
  }
  // Exposure sheet on the text layer: the dialogue broken down frame by frame. x, y = top-left.
  // o: dial (one entry per frame: a sound, or '' where it holds), action (same, optional), start (first frame number),
  //    title, progress (0..1 of the frames written), lit (a frame index: amber box). Returns { row(i) -> [x, y] }.
  function xsheet(g, x, y, w, h, o = {}) {
    const ui = g.ui, dial = o.dial || [], n = Math.max(1, dial.length), top = 20, rh = (h - top - 3) / n;
    const cols = [['ACTION', 0.34], ['DIAL', 0.26], ['FR', 0.18], ['CAM', 0.22]], cx = [x];
    cols.forEach(([, f]) => cx.push(cx[cx.length - 1] + w * f));
    ui.rect(x + 2, y + 2, w, h, C.ink); ui.rect(x, y, w, h, C.white); ui.rectb(x - 1, y - 1, w + 2, h + 2, C.ink);
    ui.rect(x, y, w, 9, C.cream); g.textIn(o.title || 'EXPOSURE SHEET', x, y, w, 9, C.deep, 'label'); ui.line(x, y + 9, x + w, y + 9, C.light);
    cols.forEach(([name], i) => g.textIn(name, cx[i], y + 10, cx[i + 1] - cx[i], 9, C.mid, 'label'));
    for (let i = 1; i < cols.length; i++) ui.line(Math.round(cx[i]), y + 10, Math.round(cx[i]), y + h - 1, C.light);
    const shown = Math.round(clamp(o.progress ?? 1, 0, 1) * n), row = (i) => [Math.round(x + w / 2), Math.round(y + top + (i + 0.5) * rh)];
    for (let i = 0; i < n; i++) {
      const ry = Math.round(y + top + i * rh);
      ui.line(x, ry, x + w, ry, i % 8 ? C.cream : C.light);
      if (i >= shown) continue;
      g.textIn(String((o.start ?? 1) + i), cx[2], ry, cx[3] - cx[2], rh, C.mid, 'label');
      if (dial[i]) g.textIn(dial[i], cx[1], ry, cx[2] - cx[1], rh, C.deep, 'label');
      else if (i > 0 && dial.slice(0, i).some(Boolean)) ui.line(Math.round((cx[1] + cx[2]) / 2), ry + 1, Math.round((cx[1] + cx[2]) / 2), Math.round(ry + rh - 1), C.light);
      if (o.action && o.action[i]) g.textIn(o.action[i], cx[0], ry, cx[1] - cx[0], rh, C.wine, 'label');
    }
    if (o.lit != null) { const ry = Math.round(y + top + o.lit * rh); ui.rectb(x + 1, ry, w - 2, Math.round(rh), C.amber); }
    return { row };
  }
  // Storyboard wall: panels pinned to a cork board, going up one by one. o: cols, rows, pw, ph (panel size), shown (how many
  // are up), lit (a panel index: amber edge), draw(i, x, y, w, h) (a panel's picture; default a rough doodle). Returns panel rects.
  function storyboard(g, x, y, o = {}) {
    const px = g.px, cols = o.cols ?? 4, rows = o.rows ?? 2, pw = o.pw ?? 28, ph = o.ph ?? 20, gap = 6;
    const W = cols * pw + (cols + 1) * gap, H = rows * ph + (rows + 1) * gap + 2, out = [];
    px.rect(x + 2, y + 2, W, H, C.ink); px.rect(x, y, W, H, C.clayDark); px.rectb(x - 1, y - 1, W + 2, H + 2, C.ink);
    px.dither(x, y, W, H, null, C.clay, 0.18);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c, X = x + gap + c * (pw + gap), Y = y + gap + 2 + r * (ph + gap);
      out.push({ x: X, y: Y, w: pw, h: ph });
      if (i >= (o.shown ?? cols * rows)) continue;
      px.rect(X + 1, Y + 1, pw, ph, C.ink); px.rect(X, Y, pw, ph, C.white); px.rectb(X, Y, pw, ph, i === o.lit ? C.amber : C.ink);
      if (o.draw) o.draw(i, X, Y, pw, ph);
      else {
        px.line(X + 2, Y + ph - 5, X + pw - 3, Y + ph - 5, C.light);
        const fx = X + 4 + Math.floor(hash(i, 5) * (pw - 12)), fy = Y + ph - 6;
        px.rect(fx, fy - 8, 3, 3, C.mid); px.line(fx + 1, fy - 5, fx + 1, fy - 1, C.mid); px.line(fx - 1, fy - 4, fx + 3, fy - 4, C.mid);
        if (hash(i, 9) > 0.5) px.rectb(X + pw - 11, Y + 4, 7, 6, C.light); else px.circb(X + pw - 8, Y + 7, 3, C.light);
      }
      px.rect(X + Math.floor(pw / 2) - 1, Y - 2, 3, 3, C.clay);
    }
    return out;
  }
  // ── music: the orchestra image (score, parts, stands, players, instruments) ──
  // Sheet music on the text layer (above the art, like a card). x, y = top-left. o: title (strip across the top: 'FULL SCORE',
  // 'OBOE 2'), staves, names (a label per staff, left), bars (per staff), progress (0..1 of the notes written), letter ('C': a
  // rehearsal letter boxed over a bar), letterAt [staff, bar], marks [[staff, 'dolce'], ...] (words under a staff),
  // lit ('letter' or [staff, bar]: an amber box), seed. Returns { staff: [top line y], bar(staff, bar) -> [x, y] }
  function sheet(g, x, y, w, h, o = {}) {
    const ui = g.ui, top = (o.title ? 11 : 3) + (o.letter && !(o.letterAt || [0])[0] ? 8 : 0), left = o.names ? 18 : 5, right = 4;
    const n = o.staves ?? Math.max(1, Math.floor((h - top - 3) / 16)), gap = (h - top - 3) / n;
    ui.rect(x + 2, y + 2, w, h, C.ink); ui.rect(x, y, w, h, C.white); ui.rectb(x - 1, y - 1, w + 2, h + 2, C.ink);
    if (o.title) { ui.rect(x, y, w, 9, C.cream); g.textIn(o.title, x, y, w, 9, C.deep, 'label'); ui.line(x, y + 9, x + w, y + 9, C.light); }
    const sx0 = x + left, sx1 = x + w - right, bars = o.bars ?? Math.max(2, Math.round((sx1 - sx0) / 26)), bw = (sx1 - sx0) / bars;
    const perBar = 4, total = n * bars * perBar, shown = Math.round(clamp(o.progress ?? 1, 0, 1) * total), staffY = [];
    let k = 0;
    for (let s = 0; s < n; s++) {
      const sy = Math.round(y + top + s * gap + Math.max(4, (gap - 8) / 2));
      staffY.push(sy);
      for (let l = 0; l < 5; l++) ui.line(sx0, sy + l * 2, sx1, sy + l * 2, C.light);
      for (let b = 0; b <= bars; b++) ui.line(Math.round(sx0 + b * bw), sy, Math.round(sx0 + b * bw), sy + 8, b % bars ? C.light : C.mid);
      if (o.names && o.names[s]) g.textIn(o.names[s], x + 1, sy - 1, left - 2, 10, C.mid, 'label', { align: 'left', pad: 2 });
      for (let b = 0; b < bars; b++) for (let q = 0; q < perBar; q++, k++) {
        if (k >= shown) continue;
        const nx = Math.round(sx0 + b * bw + 3 + (q * (bw - 6)) / perBar), ny = sy + 7 - Math.floor(hash(k + s * 97, o.seed ?? 3) * 7);
        ui.rect(nx, ny, 2, 2, C.ink); ui.line(nx + 2, ny + 1, nx + 2, ny - 4, C.ink);
      }
    }
    const bar = (s, b) => [Math.round(sx0 + (b + 0.5) * bw), staffY[clamp(s, 0, n - 1)] + 4];
    for (const [s, word] of o.marks || []) g.textIn(word, sx0, staffY[clamp(s, 0, n - 1)] + 9, Math.max(40, (sx1 - sx0) * 0.6), 8, C.wine, 'body', { align: 'left', pad: 2 });
    if (o.letter) {
      const [ls, lb] = o.letterAt || [0, 1], lx = Math.round(sx0 + lb * bw) - 1, ly = staffY[clamp(ls, 0, n - 1)] - 10;
      ui.rect(lx, ly, 9, 9, C.white); ui.rectb(lx, ly, 9, 9, o.lit === 'letter' ? C.amber : C.deep);
      g.textIn(o.letter, lx, ly, 9, 9, C.deep, 'label');
    }
    if (Array.isArray(o.lit)) { const [bx, by] = bar(o.lit[0], o.lit[1]); ui.rectb(Math.round(bx - bw / 2), by - 8, Math.round(bw), 16, C.amber); }
    return { staff: staffY, bar };
  }
  // Music stand, feet on y, centred on x. o: h (height), part (false: empty desk), lit (amber edge on the sheet). Returns { sheet }
  function stand(g, x, y, o = {}) {
    const px = g.px, h = o.h ?? 26, dy = y - h;
    px.line(x, y - 4, x - 5, y, C.ink); px.line(x, y - 4, x + 5, y, C.ink); px.line(x, y - 4, x, y, C.ink);
    px.line(x, dy + 6, x, y - 4, C.gray); px.line(x + 1, dy + 6, x + 1, y - 4, C.ink);
    px.poly([[x - 9, dy - 3], [x + 9, dy - 3], [x + 10, dy + 8], [x - 10, dy + 8]], C.ink);
    px.poly([[x - 8, dy - 2], [x + 8, dy - 2], [x + 9, dy + 7], [x - 9, dy + 7]], C.deep);
    if (o.part !== false) {
      px.rect(x - 7, dy - 6, 14, 12, C.white); px.rectb(x - 7, dy - 6, 14, 12, o.lit ? C.amber : C.light);
      for (let l = 0; l < 3; l++) px.line(x - 5, dy - 3 + l * 3, x + 4, dy - 3 + l * 3, C.light);
      for (let k = 0; k < 4; k++) px.pset(x - 3 + k * 2, dy - 4 + Math.floor(hash(k, 17) * 7), C.ink);
    }
    return { sheet: [x, dy] };
  }
  // Conductor's podium, feet on y, centred on x. Returns the top y (stand the conductor there).
  function podium(g, x, y, o = {}) {
    const px = g.px, w = o.w ?? 26, h = o.h ?? 6;
    px.rect(x - w / 2 + 2, y - h + 2, w, h, C.ink); px.rect(x - w / 2, y - h, w, h, C.clayDark); px.rectb(x - w / 2, y - h, w, h, C.ink);
    px.line(x - w / 2 + 1, y - h + 1, x + w / 2 - 2, y - h + 1, C.clay);
    return y - h;
  }
  // Instruments. violin, oboe: x, y = bottom centre. flute, baton: x, y = the end that's held (o.angle in radians).
  // horn: centre. timpani: centre, feet on y (o.r size, o.mallets).
  function instrument(g, kind, x, y, o = {}) {
    const px = g.px; x = Math.round(x); y = Math.round(y);
    if (kind === 'violin') {
      px.line(x, y - 22, x, y - 11, C.ink, 2); px.rect(x - 1, y - 25, 3, 3, C.clayDark);
      ellipse(px, x, y - 9, 4, 3, C.ink); ellipse(px, x, y - 4, 5, 4, C.ink);
      ellipse(px, x, y - 9, 3, 2, C.clay); ellipse(px, x, y - 4, 4, 3, C.clay);
      px.pset(x - 2, y - 6, C.ink); px.pset(x + 2, y - 6, C.ink); px.line(x, y - 21, x, y - 2, C.cream); px.rect(x - 2, y - 5, 5, 1, C.ink);
    } else if (kind === 'oboe') {
      px.rect(x - 1, y - 24, 3, 20, C.ink); px.line(x, y - 23, x, y - 5, C.deep); px.rect(x, y - 27, 1, 3, C.clay);
      px.rect(x - 2, y - 4, 5, 4, C.ink); for (let k = 0; k < 5; k++) px.pset(x + 1, y - 21 + k * 3, C.gray);
    } else if (kind === 'flute' || kind === 'baton') {
      const flute = kind === 'flute', a = o.angle ?? (flute ? 0 : -0.6), L = flute ? 26 : 12, ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
      px.line(x, y, ex, ey, C.ink, flute ? 3 : 2); px.line(x, y, ex, ey, flute ? C.gray : C.white, 1);
      if (flute) for (let k = 1; k < 6; k++) px.pset(x + Math.cos(a) * k * 4, y + Math.sin(a) * k * 4 - 1, C.steel);
    } else if (kind === 'horn') {
      px.poly([[x + 3, y + 1], [x + 12, y + 4], [x + 12, y + 12], [x + 4, y + 5]], C.ink); px.poly([[x + 4, y + 2], [x + 11, y + 5], [x + 11, y + 10], [x + 5, y + 5]], C.glow);
      px.circ(x, y, 7, C.ink); px.circ(x, y, 6, C.glow); px.circ(x, y, 4, C.clay); px.circ(x, y, 2, C.ink);
      px.line(x - 6, y - 3, x - 10, y - 7, C.gray, 1);
    } else if (kind === 'timpani') {
      const r = o.r ?? 13, bh = Math.round(r * 0.8), top = y - Math.round(r * 1.4);
      px.line(x - r + 3, top + bh - 2, x - r + 1, y, C.ink, 2); px.line(x + r - 3, top + bh - 2, x + r - 1, y, C.ink, 2); px.line(x, top + bh, x, y, C.ink, 2);
      for (let j = 0; j <= bh; j++) { const hw = Math.round(r * Math.sqrt(1 - (j / (bh + 1)) ** 2)); px.rect(x - hw, top + j, 2 * hw + 1, 1, j < 3 ? C.clay : C.clayDark); }
      ellipse(px, x, top, r, 3, C.ink); ellipse(px, x, top, r - 1, 2, C.cream); px.line(x - r + 3, top + 3, x - r + 5, top + bh - 2, C.glow);
      if (o.mallets) { px.line(x - 5, top - 9, x - 2, top - 2, C.clayDark); px.rect(x - 3, top - 3, 3, 3, C.cream); px.line(x + 8, top - 10, x + 4, top - 3, C.clayDark); px.rect(x + 3, top - 4, 3, 3, C.cream); }
    }
  }
  // Metronome: the machine that keeps exact time (a click track). Feet on y, centred on x. o: bpm (arm swing), still
  function metronome(g, x, y, o = {}) {
    const px = g.px, h = 26, a = o.still ? 0 : Math.sin((g.t * Math.PI * (o.bpm ?? 120)) / 60) * 0.45;
    px.poly([[x - 11, y], [x + 11, y], [x + 5, y - h], [x - 5, y - h]], C.ink);
    px.poly([[x - 10, y - 1], [x + 10, y - 1], [x + 4, y - h + 1], [x - 4, y - h + 1]], C.clayDark);
    px.poly([[x - 6, y - 5], [x + 6, y - 5], [x + 3, y - h + 5], [x - 3, y - h + 5]], C.cream);
    for (let k = 0; k < 5; k++) px.line(x - 1, y - 8 - k * 3, x + 1, y - 8 - k * 3, C.light);
    const vy = y - 6; px.line(x, vy, x + Math.sin(a) * 20, vy - Math.cos(a) * 20, C.ink, 2);
    const wx = Math.round(x + Math.sin(a) * 13), wy = Math.round(vy - Math.cos(a) * 13); px.rect(wx - 2, wy - 1, 5, 3, C.gray); px.rectb(wx - 2, wy - 1, 5, 3, C.ink);
    px.rect(x - 11, y - 2, 22, 2, C.ink);
  }
  // One eighth note, x, y = its head. o: color
  function note(g, x, y, o = {}) {
    const px = g.px, c = o.color ?? C.cream; x = Math.round(x); y = Math.round(y);
    px.rect(x, y, 3, 2, c); px.line(x + 2, y, x + 2, y - 6, c); px.line(x + 3, y - 6, x + 5, y - 4, c);
  }
  // A seated orchestra seen from the hall: rows curve round the conductor's spot at (cx, y), strings in front, then winds,
  // then brass, timpani at the back. o: rows (players per row, front first), play (bob and bow), lit (index of one player:
  // amber box), guess (every player's note floats at its own height), stands (false hides them), timpani (false hides them).
  // Returns [{ x, y, row, head: [x, y] }], front row first, left to right.
  function orchestra(g, cx, y, o = {}) {
    const px = g.px, rows = o.rows ?? [9, 8, 7], tops = [C.wine, C.sage, C.navy, C.slate], hairs = [C.hair, C.ink, C.clayDark, C.gray], out = [];
    rows.forEach((n, r) => { const rx = 44 + r * 22, ry = 10 + r * 6, by = y - r * 12;
      for (let i = 0; i < n; i++) { const a = (-0.42 + (n === 1 ? 0.42 : (i / (n - 1)) * 0.84)) * Math.PI;
        out.push({ x: Math.round(cx + Math.sin(a) * rx), y: Math.round(by - Math.cos(a) * ry), row: r, i }); } });
    const back = y - rows.length * 12 - 16;
    if (o.timpani !== false) { instrument(g, 'timpani', cx - 9, back + 4, { r: 6 }); instrument(g, 'timpani', cx + 9, back + 4, { r: 6 }); }
    [...out].sort((p, q) => p.y - q.y).forEach((p) => {
      const k = out.indexOf(p), bob = o.play ? Math.round((Math.sin(g.t * 5 + p.i * 1.7 + p.row) + 1) / 2) : 0, hy = p.y - 8 - bob;
      px.rect(p.x - 2, p.y - 5, 5, 5, tops[p.row % tops.length]); px.rect(p.x - 1, p.y, 1, 2, C.ink); px.rect(p.x + 1, p.y, 1, 2, C.ink);
      px.rect(p.x - 1, hy, 3, 3, C.face); px.rect(p.x - 1, hy - 1, 3, 1, hairs[Math.floor(hash(k, 61) * 4)]);
      if (p.row === 0) { const s = o.play ? Math.round(Math.sin(g.t * 6 + p.i) * 2) : 0; px.line(p.x + 2, p.y - 6, p.x + 4, p.y - 3, C.clay); px.line(p.x + 1 + s, p.y - 7, p.x + 6 + s, p.y - 4, C.cream); }
      else if (p.row === 1) px.line(p.x + 2, hy + 3, p.x + 3, p.y - 1, C.ink);
      else px.rect(p.x + 2, p.y - 6, 2, 2, C.glow);
      if (o.stands !== false) { px.rect(p.x - 5, p.y - 6, 3, 2, C.white); px.line(p.x - 4, p.y - 4, p.x - 4, p.y + 1, C.gray); }
      if (o.guess) { const ph = (g.t * 0.5 + hash(k, 52)) % 1; note(g, p.x - 1, hy - 5 - hash(k, 53) * 10 - ph * 12, { color: [C.cream, C.rose, C.glow][k % 3] }); }
      if (o.lit === k) px.rectb(p.x - 6, hy - 3, 13, p.y - hy + 6, C.amber);
      p.head = [p.x, hy];
    });
    return out;
  }

  // ── real screenshots ────────────────────────────────────────────────────
  // Load at the top of scene.js (rendering waits for it): const HOME = Eduba.image('assets/home.png');
  const IMAGES = new Map();
  function image(src) {
    if (!IMAGES.has(src)) {
      const im = new Image(); im.src = src; IMAGES.set(src, im);
      P.wait(P.loaded(im, src));
    }
    return IMAGES.get(src);
  }
  // A real page in a pixel browser window: the picture stays sharp, the frame is pixel art.
  // o: url (in the bar), progress (0..1 rises it into place), scroll (0..1 down the picture),
  //    crop [left, right] as fractions of the width (a docs page's main column: [0.22, 0.78])
  function screenshot(g, img, x, y, w, h, o = {}) {
    const p = P.ease.out(clamp(o.progress ?? 1, 0, 1));
    if (p <= 0) return null;
    y = Math.round(y + (1 - p) * (g.H + 4 - y));
    const bar = g.tall ? 12 : 9, s = g.photo.scale;
    if (img.complete && img.naturalWidth) {
      const [c0, c1] = o.crop || [0, 1], ix = img.naturalWidth * c0, iw = img.naturalWidth * (c1 - c0);
      const k = (w * s) / iw, over = Math.max(0, img.naturalHeight * k - (h - bar) * s);
      const sy = (over * clamp(o.scroll ?? 0, 0, 1)) / k;
      g.photo.ctx.drawImage(img, ix, sy, iw, Math.min(img.naturalHeight - sy, ((h - bar) * s) / k), x * s, (y + bar) * s, w * s, Math.min((h - bar) * s, (img.naturalHeight - sy) * k));
    }
    g.ui.rect(x + w + 1, y + 2, 2, h, C.ink); g.ui.rect(x + 2, y + h + 1, w, 2, C.ink);
    g.ui.rectb(x - 1, y - 1, w + 2, h + 2, C.ink);
    g.ui.rect(x, y, w, bar, C.wine);
    [C.clay, C.amber, C.sage].forEach((c, i) => g.ui.rect(x + 4 + i * 5, y + bar / 2 - 1.5, 3, 3, c));
    if (o.url) { g.ui.rect(x + 21, y + 2, w - 25, bar - 4, C.deep); g.textIn(o.url, x + 24, y + 2, w - 30, bar - 4, C.rose, 'label', { align: 'left', pad: 0 }); }
    return { x, y: y + bar, w, h: h - bar };
  }

  // ── judgment answers (text layer, so they sit on panels). progress animates each in. ──
  // Pick one: options [[label, p], ...]; the most likely is lit.
  function choice(g, x, y, w, options, o = {}) {
    const top = Math.max(...options.map((q) => q[1])), grow = P.ease.out(clamp(o.progress ?? 1, 0, 1));
    const rh = o.rh ?? (g.tall ? 16 : 12), lw = o.labelW ?? Math.round(w * 0.42), bw = w - lw - 24;
    options.forEach(([label, p], i) => {
      const yy = y + i * rh, win = p === top;
      g.textIn(label.toUpperCase(), x, yy, lw, rh - 2, win ? C.deep : C.mid, 'label', { align: 'left', pad: 0 });
      g.ui.rect(x + lw, yy + 2, bw, rh - 6, C.cream);
      g.ui.rect(x + lw, yy + 2, Math.max(1, Math.round(bw * p * grow)), rh - 6, win ? C.amber : C.light);
      g.textIn(p.toFixed(2), x + lw + bw + 2, yy, 22, rh - 2, win ? C.clayDark : C.mid, 'code', { align: 'left', pad: 0 });
    });
    return { h: options.length * rh };
  }
  // Yes or no: the probability of yes on a no-to-yes track, read out as "no, 0.92 sure".
  function noul(g, x, y, w, p, o = {}) {
    const pos = 0.5 + (p - 0.5) * P.ease.out(clamp(o.progress ?? 1, 0, 1));
    g.ui.rect(x, y + 6, w, 8, C.cream); g.ui.rectb(x, y + 6, w, 8, C.deep);
    g.ui.rect(x + Math.round(w / 2), y + 4, 1, 12, C.light);
    g.ui.rect(x + Math.round(w * pos) - 1, y + 2, 3, 16, C.clayDark);
    g.textIn('NO', x, y + 20, 20, 8, C.deep, 'label', { align: 'left', pad: 0 });
    g.textIn('YES', x + w - 20, y + 20, 20, 8, C.deep, 'label', { align: 'right', pad: 0 });
    if (o.label !== false) g.textIn(`${p >= 0.5 ? 'yes' : 'no'}, ${Math.max(p, 1 - p).toFixed(2)} sure`, x, y + 30, w, 10, C.clayDark, 'code');
    return { h: 42 };
  }
  // Rate it: ordered levels, 0 at the bottom, a marker at a fractional value like 1.6.
  function score(g, x, y, w, levels, value, o = {}) {
    const n = levels.length, rh = o.rh ?? (g.tall ? 16 : 13), v = value * P.ease.out(clamp(o.progress ?? 1, 0, 1));
    levels.forEach((lab, i) => {
      const yy = y + (n - 1 - i) * rh, near = Math.round(value) === i;
      g.ui.rect(x + 12, yy, w - 12, rh - 3, near ? C.glow : C.cream); g.ui.rectb(x + 12, yy, w - 12, rh - 3, C.deep);
      g.textIn(String(i), x + 12, yy, 12, rh - 3, C.deep, 'code');
      if (lab) g.textIn(lab, x + 24, yy, w - 26, rh - 3, C.deep, 'label', { align: 'left', pad: 0 });
    });
    const my = y + (n - 1 - v) * rh + (rh - 3) / 2;
    g.ui.poly([[x + 1, my - 4], [x + 9, my], [x + 1, my + 4]], C.clayDark);
    if (o.label !== false) g.textIn(value.toFixed(1), x - 22, my - 5, 20, 10, C.clayDark, 'code', { align: 'right', pad: 0 });
    return { h: n * rh };
  }
  function mark(g, x, y, kind = 'check') {
    const px = g.px;
    if (kind === 'check') { px.line(x, y + 4, x + 3, y + 7, C.sage, 2); px.line(x + 3, y + 7, x + 9, y, C.sage, 2); }
    else { px.line(x, y, x + 7, y + 7, C.clay, 2); px.line(x + 7, y, x, y + 7, C.clay, 2); }
  }

  // ── Shorts energy: camera punches, pop-ins, sparks, emotes, background life, takeaways ──
  // Scale every layer about a world point, this frame only (the last call wins).
  function camera(g, z, x = g.W / 2, y = g.H / 2) { g.cam = { z, x: Math.round(x), y: Math.round(y) }; }
  // Zoom for a punch on each beat in ts: jumps to 1 + amt, eases back over dur. E.camera(g, E.punch(g, [S('a'), S('b')]), x, y)
  function punch(g, ts, o = {}) {
    const amt = o.amt ?? 0.08, dur = o.dur ?? 0.5;
    let z = 1;
    for (const t0 of [].concat(ts)) { const k = (g.t - t0) / dur; if (k >= 0 && k < 1) z = 1 + amt * (1 - P.ease.out(k)); }
    return z;
  }
  // Drop-in with a small bounce: null before t0 (draw nothing), then a y offset in world px that lands on 0.
  function pop(g, t0, o = {}) {
    if (t0 == null || g.t < t0) return null;
    const k = clamp((g.t - t0) / (o.dur ?? 0.3), 0, 1);
    return Math.round((1 - P.ease.back(k)) * -(o.h ?? 10));
  }
  // Pixel sparks flying out from a point for a moment after t0 (text layer, so they show over panels).
  function burst(g, x, y, t0, o = {}) {
    const k = (g.t - t0) / (o.dur ?? 0.35);
    if (t0 == null || k < 0 || k >= 1) return;
    const n = o.n ?? 8, r0 = (o.r ?? 8) + k * (o.spread ?? 12), len = Math.max(1, Math.round(4 * (1 - k)));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.3;
      for (let j = 0; j < len; j++) g.ui.rect(Math.round(x + Math.cos(a) * (r0 + j)), Math.round(y + Math.sin(a) * (r0 + j)), 1, 1, i % 2 ? (o.c ?? C.amber) : C.white);
    }
  }
  // A reaction over a head: '!' '?' '$' in a speech bubble, or 'sweat' (a drop). x, y = the point it sits above.
  // o: t0 (pops in then), until (gone then), scale, color
  const GLYPHS = {
    '!': ['..x..', '..x..', '..x..', '..x..', '.....', '..x..'],
    '?': ['.xxx.', 'x...x', '...x.', '..x..', '.....', '..x..'],
    '$': ['..x..', '.xxxx', 'x.x..', '.xxx.', '..x.x', 'xxxx.', '..x..'],
    sweat: ['..w..', '.xwx.', 'xxxxx', 'xxxxx', '.xxx.'],
  };
  function emote(g, kind, x, y, o = {}) {
    const dy = o.t0 == null ? 0 : pop(g, o.t0, { h: 8 });
    if (dy == null || (o.until != null && g.t >= o.until)) return;
    const rows = GLYPHS[kind] || GLYPHS['!'], s = o.scale ?? 2, px = g.px, gw = rows[0].length * s, gh = rows.length * s;
    y = Math.round(y + dy + (Math.floor(g.t * 3) % 2)); x = Math.round(x);
    const dot = (bx, by) => rows.forEach((r, j) => [...r].forEach((ch, i) => ch !== '.' && px.rect(bx + i * s, by + j * s, s, s, ch === 'w' ? C.white : o.color ?? C.clay)));
    if (kind === 'sweat') { dot(x - gw / 2, y - gh); return; }
    const bw = gw + 6, bh = gh + 6, bx = x - Math.round(bw / 2), by = y - bh - 4;
    px.rect(bx + 1, by + 1, bw, bh, C.ink); px.rect(bx, by, bw, bh, C.white); px.rectb(bx, by, bw, bh, C.ink);
    px.poly([[x - 3, by + bh - 1], [x + 3, by + bh - 1], [x, by + bh + 3]], C.white);
    px.line(x - 3, by + bh, x, by + bh + 3, C.ink); px.line(x + 3, by + bh, x, by + bh + 3, C.ink);
    dot(bx + 3, by + 3);
  }
  // Background life that never stops, drawn behind everything else. kind: 'mail' (envelopes crossing),
  // 'coins', 'dust' (motes rising). o: n, speed, y0, y1 (the band they live in)
  function drift(g, kind = 'dust', o = {}) {
    const px = g.px, y0 = o.y0 ?? 0, y1 = o.y1 ?? g.H, bandH = y1 - y0, sp = o.speed ?? 14, span = g.W + 40;
    const n = o.n ?? (kind === 'dust' ? 28 : 7);
    for (let k = 0; k < n; k++) {
      const depth = 0.5 + hash(k, 71) * 0.8;
      if (kind === 'dust') {
        const x = (hash(k, 72) * g.W + Math.sin(g.t * 0.9 + k) * 3 + g.W) % g.W;
        const y = y1 - ((hash(k, 73) * bandH + g.t * sp * 0.4 * depth) % bandH);
        px.pset(x, y, k % 3 ? C.light : C.rose); if (depth > 1.1) px.pset(x + 1, y, C.light);
        continue;
      }
      const x = ((hash(k, 72) * span + g.t * sp * depth) % span) - 20;
      const y = y0 + hash(k, 73) * bandH + Math.sin(g.t * 1.5 + k * 1.7) * 3;
      if (kind === 'coins') coin(g, x, y); else envelope(g, x, y, { color: depth > 0.9 ? C.white : C.cream, flat: depth < 0.9 });
    }
  }
  // Takeaways that tick as they land (Shorts: the top of the safe area). items: [[text, t], ...] (t: when it ticks).
  // o: x (centre), y, w. Returns its height in world px.
  function takeaways(g, items, o = {}) {
    const hud = g.hud, s = st(g, 'label'), pad = g.tall ? 6 : 4, gap = g.tall ? 8 : 6, maxW = H2(o.w ?? g.safe.w);
    const chips = items.map(([text, t0]) => { const m = hud.measure(text, s), b = m.bottom - m.top + 1; return { text, t0, m, b, w: b + m.w + pad * 3, h: b + pad * 2 }; });
    const rows = [[]];
    let rw = 0;
    chips.forEach((c) => { if (rows.at(-1).length && rw + gap + c.w > maxW) { rows.push([]); rw = 0; } rw += (rows.at(-1).length ? gap : 0) + c.w; rows.at(-1).push(c); });
    const Y0 = H2(o.y ?? g.safe.y + 2), cx = H2(o.x ?? g.safe.x + g.safe.w / 2);
    let Y = Y0;
    for (const row of rows) {
      let X = Math.round(cx - (row.reduce((a, c) => a + c.w, 0) + gap * (row.length - 1)) / 2);
      for (const c of row) {
        const done = c.t0 != null && g.t >= c.t0, k = done ? (g.t - c.t0) / 0.3 : 1, dy = k < 1 ? -Math.round(6 * Math.sin(k * Math.PI)) : 0;
        hud.rect(X + 3, Y + 3 + dy, c.w, c.h, C.ink); hud.rect(X, Y + dy, c.w, c.h, done ? C.deep : C.wine);
        const bx = X + pad, by = Y + pad + dy, b = c.b;
        hud.rect(bx, by, b, b, done ? C.sage : C.deep); hud.rectb(bx, by, b, b, done ? C.white : C.mid);
        if (done) { hud.line(bx + 2, by + b / 2, bx + b / 2 - 1, by + b - 3, C.white, 2); hud.line(bx + b / 2 - 1, by + b - 3, bx + b - 3, by + 2, C.white, 2); }
        hud.text(c.text, X + pad * 2 + b, Y + pad - c.m.top + dy, done ? C.white : C.light, s);
        X += c.w + gap;
      }
      Y += row[0].h + gap;
    }
    return { h: (Y - Y0) / 2 };
  }

  // ── strategy map: hex tiles, fog of war, units, cities, research (our own art, no game's) ──
  // Pointy-top hex, 12x11 px. It tiles exactly in odd-row offset: dx 12, dy 9, odd rows shifted 6.
  const HEX = ['....xxxx....', '..xxxxxxxx..', 'xxxxxxxxxxxx', 'xxxxxxxxxxxx', 'xxxxxxxxxxxx', 'xxxxxxxxxxxx',
    'xxxxxxxxxxxx', 'xxxxxxxxxxxx', 'xxxxxxxxxxxx', '..xxxxxxxx..', '....xxxx....'];
  const HEX_PX = [];
  HEX.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch !== 'x') return;
    const out = (a, b) => b < 0 || b >= HEX.length || a < 0 || a >= 12 || HEX[b][a] !== 'x';
    HEX_PX.push([i, j, out(i, j - 1) || out(i - 1, j)]);
  }));
  const hexAt = (x, y, c, r) => [x + c * 12 + (r & 1 ? 6 : 0) + 6, y + r * 9 + 5];
  function vnoise(c, r, seed, sc = 3.2) {
    const fx = c / sc, fy = r / sc, x0 = Math.floor(fx), y0 = Math.floor(fy);
    const h = (a, b) => hash((a * 73856093) ^ (b * 19349663), seed), s = (v) => v * v * (3 - 2 * v), u = s(fx - x0), v = s(fy - y0);
    return (h(x0, y0) * (1 - u) + h(x0 + 1, y0) * u) * (1 - v) + (h(x0, y0 + 1) * (1 - u) + h(x0 + 1, y0 + 1) * u) * v;
  }
  const TERR = { deep: [C.navy, C.slate], sea: [C.steel, C.navy], grass: [C.sage, C.slate], plains: [C.glow, C.amber],
    forest: [C.slate, C.ink], hills: [C.clay, C.clayDark], peak: [C.gray, C.mid] };
  // d: 0 at the map's centre, about 1 at its corners (o.island pulls land toward the middle)
  function terrain(c, r, seed, d, island) {
    let v = vnoise(c, r, seed) * 0.75 + vnoise(c * 2, r * 2, seed + 9) * 0.25;
    if (island) v = v * (1 - island) + (1 - d) * island;
    if (v < 0.34) return 'deep';
    if (v < 0.42) return 'sea';
    if (v > 0.8) return 'peak';
    if (v > 0.71) return 'hills';
    const w = vnoise(c + 40, r + 40, seed + 3);
    return w > 0.62 ? 'forest' : w < 0.3 ? 'plains' : 'grass';
  }
  // A hex map. o: cols, rows, seed, island (0..1), terrain(c, r) (override), reveal(c, r) 0..1 (0 = fog; between
  // dissolves), tint(c, r) colour or null, roads [[c0, r0, c1, r1]], roadP, cities [[c, r, name]],
  // crack [[x, y], ...] (a world-px polyline), crackP, stitches (band-aids along it). Returns { at(c, r), w, h }.
  function hexmap(g, x, y, o = {}) {
    const px = g.px, cols = o.cols ?? 28, rows = o.rows ?? 21, seed = o.seed ?? 7, t = g.t, rev = o.reveal || (() => 1);
    const cx0 = (cols - 1) / 2, cy0 = (rows - 1) / 2, drift = Math.floor(t * 2);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const [hx, hy] = hexAt(x, y, c, r), ox = hx - 6, oy = hy - 5;
      if (ox > g.W || oy > g.H || ox < -12 || oy < -11) continue;
      const d = Math.hypot((c - cx0) / cx0, (r - cy0) / cy0) / 1.3;
      const onCity = (o.cities || []).some(([cc, rr]) => cc === c && rr === r);
      const kind = onCity ? 'grass' : (o.terrain && o.terrain(c, r)) || terrain(c, r, seed, d, o.island ?? 0.35);
      const [base, shade] = TERR[kind], k = clamp(rev(c, r), 0, 1), tint = o.tint ? o.tint(c, r) : null;
      for (const [i, j, edge] of HEX_PX) {
        const X = ox + i, Y = oy + j;
        if (!(k >= 1 || (k > 0 && hash((X * 131 + Y * 977) | 0, 5) < k))) {
          const f = hash(((X + drift) * 31 + Y * 17) | 0, 11);
          px.pset(X, Y, edge ? C.ink : f < 0.1 ? C.wine : f < 0.55 ? C.deep : C.ink);
          continue;
        }
        let col = edge ? shade : base;
        if (!edge) {
          if (kind === 'forest' && j > 2 && j < 9 && (i + j * 2) % 5 === 0) col = C.sage;
          else if (kind === 'hills' && ((j === 5 && i > 1 && i < 6) || (j === 7 && i > 5 && i < 10))) col = C.clayDark;
          else if (kind === 'peak') { const a = Math.abs(i - 5.5); if (j > 1 && a < (j - 1) * 0.75) col = j < 5 ? C.white : C.mid; }
          else if ((kind === 'sea' || kind === 'deep') && (i + j * 3 + drift) % 11 === 0) col = C.gray;
          else if ((kind === 'grass' || kind === 'plains') && hash((c * 97 + r * 57 + i * 7 + j * 13) | 0, 21) < 0.06) col = shade;
        }
        if (tint != null && (X + Y) % 2 === 0) col = tint;
        px.pset(X, Y, col);
      }
    }
    const at = (c, r) => hexAt(x, y, c, r);
    for (const [c0, r0, c1, r1] of o.roads || []) {  // dotted roads, drawn from the first tile
      const [ax, ay] = at(c0, r0), [bx, by] = at(c1, r1), L = Math.hypot(bx - ax, by - ay), n = Math.floor(L * clamp(o.roadP ?? 1, 0, 1));
      for (let s = 0; s <= n; s++) if (s % 4 < 2) { const X = ax + ((bx - ax) * s) / L, Y = ay + ((by - ay) * s) / L; px.rect(X, Y, 2, 2, C.cream); }
    }
    for (const [c, r, name] of o.cities || []) { const [cx, cy] = at(c, r); city(g, cx, cy, { name }); }
    if (o.crack) {
      const P2 = o.crack, segs = P2.length - 1, n = clamp(o.crackP ?? 1, 0, 1) * segs;
      for (let s = 0; s < Math.ceil(n); s++) {
        const f = Math.min(1, n - s), [ax, ay] = P2[s], [bx, by] = P2[s + 1];
        px.line(ax, ay, ax + (bx - ax) * f, ay + (by - ay) * f, C.ink, 3); px.line(ax, ay, ax + (bx - ax) * f, ay + (by - ay) * f, C.amber, 1);
      }
      const st2 = Math.floor(o.stitches ?? 0);
      for (let s = 0; s < st2 && s < segs; s++) {  // a band-aid across each stitched segment
        const [ax, ay] = P2[s], [bx, by] = P2[s + 1], mx = Math.round((ax + bx) / 2), my = Math.round((ay + by) / 2);
        px.rect(mx - 4, my - 2, 9, 5, C.ink); px.rect(mx - 3, my - 1, 7, 3, C.glow); px.rect(mx - 1, my - 1, 3, 3, C.cream);
      }
    }
    return { at, w: cols * 12 + 6, h: rows * 9 + 2 };
  }
  // Unit tokens (board-game counters): scout, slinger, warrior, settler, enemy. o: color
  const UNIT_GLYPH = {
    scout: ['..x..', '.xxx.', '..x..', '.x.x.', 'x...x'], slinger: ['...xx', '..x.x', '.x...', 'x....', 'xx...'],
    warrior: ['.xx..', '.xx..', '..x..', '...x.', '....x'], settler: ['..x..', '.x.x.', 'x...x', 'xxxxx', 'x.x.x'],
    enemy: ['x...x', '.x.x.', '..x..', '.x.x.', 'x...x'],
  };
  function unit(g, kind, x, y, o = {}) {
    const px = g.px, G = UNIT_GLYPH[kind] || UNIT_GLYPH.scout, fill = o.color ?? (kind === 'enemy' ? C.clay : C.cream);
    x = Math.round(x); y = Math.round(y);
    px.circ(x + 1, y + 1, 5, C.ink); px.circ(x, y, 5, C.ink); px.circ(x, y, 4, fill);
    G.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'x') px.pset(x - 2 + i, y - 2 + j, kind === 'enemy' ? C.white : C.deep); }));
  }
  // A walled town that sits on one hex. o: name (a small label under it), flag (colour)
  function city(g, x, y, o = {}) {
    const px = g.px; x = Math.round(x); y = Math.round(y);
    px.rect(x - 6, y, 13, 5, C.ink); px.rect(x - 5, y + 1, 11, 3, C.cream);
    for (let i = -5; i <= 5; i += 2) px.pset(x + i, y - 1, C.cream);
    px.rect(x - 5, y - 4, 5, 4, C.white); px.rect(x - 6, y - 5, 7, 1, C.clay); px.rect(x - 5, y - 6, 5, 1, C.clay);
    px.rect(x + 1, y - 5, 5, 5, C.white); px.rect(x, y - 6, 7, 1, C.clayDark); px.rect(x + 1, y - 7, 5, 1, C.clayDark);
    px.line(x + 5, y - 12, x + 5, y - 7, C.ink); px.rect(x + 6, y - 12, 3, 2, o.flag ?? C.amber);
    if (o.name) plate(g, o.name, x, y + 7, { align: 'center', role: 'label', pad: 3, bg: C.deep, fg: C.cream });
  }
  // A research boost pop-up: which tech got cheaper, why, and a bar that jumps. o: tech, how, drop (0..1), base, gain, pct, w, tab
  function eureka(g, x, y, o = {}) {
    const w = o.w ?? 122, h = 46;
    const r = panel(g, x, y, w, h, { theme: 'darkWine', tab: o.tab ?? 'EUREKA!' });
    g.textIn(o.tech ?? 'ARCHERY', x + 6, r.y + 3, w - 12, 10, C.white, 'body', { align: 'left', pad: 0 });
    if (o.how) g.textIn(o.how, x + 6, r.y + 14, w - 12, 8, C.rose, 'label', { align: 'left', pad: 0 });
    const bx = x + 6, by = y + h - 10, bw = w - 42, base = o.base ?? 0.2, gain = (o.gain ?? 0.4) * clamp(o.drop ?? 1, 0, 1);
    g.ui.rect(bx, by, bw, 6, C.ink); g.ui.rect(bx + 1, by + 1, Math.round((bw - 2) * base), 4, C.cream);
    if (gain > 0) g.ui.rect(bx + 1 + Math.round((bw - 2) * base), by + 1, Math.max(1, Math.round((bw - 2) * gain)), 4, C.amber);
    if ((o.drop ?? 1) > 0) g.textIn(o.pct ?? '-40%', bx + bw + 2, by - 3, 32, 10, C.amber, 'body');
    return { x, y, w, h };
  }
  // A research tree. nodes: [{ id, label, c, r, from: [ids], state: 'done' | 'boost' | 'open' | 'locked', tag }].
  // o: dx, dy, w, progress (reveals columns left to right), lit (id). Returns { pos(id) } (a node's top-left).
  function techtree(g, x, y, nodes, o = {}) {
    const px = g.px, dx = o.dx ?? 70, dy = o.dy ?? 22, w = o.w ?? 56, h = 12, by = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const maxC = Math.max(...nodes.map((n) => n.c)) + 1, pos = (n) => [x + n.c * dx, y + n.r * dy];
    const shown = (n) => o.progress == null || n.c / maxC < o.progress;
    nodes.forEach((n) => (n.from || []).forEach((id) => {
      const a = by[id]; if (!a || !shown(n)) return;
      const [ax, ay] = pos(a), [bx, byy] = pos(n), mx = Math.round(ax + w + (dx - w) / 2), c = a.state === 'done' ? C.cream : C.mid;
      px.line(ax + w, ay + h / 2, mx, ay + h / 2, c); px.line(mx, ay + h / 2, mx, byy + h / 2, c); px.line(mx, byy + h / 2, bx, byy + h / 2, c);
    }));
    nodes.forEach((n) => {
      if (!shown(n)) return;
      const [nx, ny] = pos(n), s = n.state || 'open';
      const fill = s === 'done' ? C.cream : s === 'boost' ? C.glow : s === 'locked' ? C.mid : C.skin;
      g.ui.rect(nx + 1, ny + 1, w, h, C.ink); g.ui.rect(nx, ny, w, h, fill); g.ui.rectb(nx, ny, w, h, C.ink);
      if (s === 'boost' || o.lit === n.id) { const k = Math.floor(g.t * 4) % 2; g.ui.rectb(nx - 2 - k, ny - 2 - k, w + 4 + 2 * k, h + 4 + 2 * k, C.amber); }
      g.textIn(n.label, nx, ny, w, h, s === 'locked' ? C.light : C.deep, 'label');
      if (s === 'boost' && n.tag !== false) plate(g, n.tag ?? '-40%', nx + w - 6, ny - 8, { role: 'label', pad: 3, bg: C.amber, fg: C.deep });
    });
    return { pos: (id) => pos(by[id]) };
  }
  // More than one way to win: medallions in a row. o: kinds, lit (index | 'all'), progress, gap, labels
  const VICTORY = {
    science: ['..xxx..', '...x...', '...x...', '..xxx..', '.xxxxx.', 'xxxxxxx', 'xxxxxxx'],
    culture: ['x.....x', 'x.xxx.x', 'x.x.x.x', 'x.x.x.x', 'x.x.x.x', '.xxxxx.', '..xxx..'],
    religion: ['...x...', '.x.x.x.', '..xxx..', 'xxxxxxx', '..xxx..', '.x.x.x.', '...x...'],
    diplomacy: ['xxxxxx.', 'x....x.', 'x.xx.x.', 'x....x.', 'x.xx.xx', 'x....xx', 'xxxxxx.'],
    conquest: ['......x', '.....x.', '....x..', 'x..x...', '.xx....', '.xx....', 'x..x...'],
  };
  function victory(g, x, y, o = {}) {
    const px = g.px, kinds = o.kinds ?? Object.keys(VICTORY), gap = o.gap ?? 40;
    const n = o.progress == null ? kinds.length : Math.ceil(clamp(o.progress, 0, 1) * kinds.length);
    for (let i = 0; i < n; i++) {
      const cx = x + i * gap, lit = o.lit === 'all' || o.lit === i, G = VICTORY[kinds[i]];
      px.circ(cx + 2, y + 2, 13, C.ink); px.circ(cx, y, 13, C.ink); px.circ(cx, y, 12, lit ? C.amber : C.wine); px.circb(cx, y, 10, lit ? C.glow : C.mid);
      G.forEach((row, j) => [...row].forEach((ch, k) => { if (ch === 'x') px.rect(cx - 7 + k * 2, y - 7 + j * 2, 2, 2, lit ? C.deep : C.cream); }));
      if (o.labels !== false) g.textIn(kinds[i].toUpperCase(), cx - gap / 2, y + 16, gap, 8, lit ? C.amber : C.cream, 'label');
    }
  }
  // A bell curve with the middle marked (100 by design). o: progress (draws left to right), band (0..1 of the width
  // shaded), label, noise (static flickers at both tails), ruler (a ruler that only spans the middle)
  function bell(g, x, y, w, h, o = {}) {
    const px = g.px, mid = x + w / 2, sd = w / 6, p = clamp(o.progress ?? 1, 0, 1), band = o.band ?? 0;
    const f = (X) => y + h - 2 - Math.exp(-0.5 * ((X - mid) / sd) ** 2) * (h - 6);
    px.rect(x, y + h - 2, w, 2, C.cream);
    for (let X = x; X < x + w * p; X++) {
      const Y = Math.round(f(X));
      if (band && Math.abs(X - mid) < (band * w) / 2) px.rect(X, Y, 1, y + h - 2 - Y, C.wine);
      px.rect(X, Y, 1, 2, C.cream);
    }
    if (o.label !== false && p >= 0.5) { for (let j = y + 4; j < y + h - 2; j += 3) px.pset(Math.round(mid), j, C.amber); g.textIn(o.label ?? '100', mid - 15, y - 8, 30, 8, C.amber, 'label'); }
    if (o.noise) {
      const tick = Math.floor(g.t * 12);
      for (let k = 0; k < 44; k++) {
        const left = k % 2 === 0, u = hash(k * 57 + tick * 131, 3) * w * 0.2, X = left ? x + u : x + w - 1 - u;
        px.pset(X, y + h - 5 - hash(k * 7 + tick * 17, 9) * h * 0.85, k % 3 ? C.light : C.rose);
      }
    }
    if (o.ruler) {
      const rw = Math.round(w * 0.44), rx = Math.round(mid - rw / 2), ry = y + h + 3;
      px.rect(rx + 1, ry + 1, rw, 7, C.ink); px.rect(rx, ry, rw, 7, C.glow);
      for (let i = 0; i <= 10; i++) { const X = Math.round(rx + (i / 10) * (rw - 1)); px.line(X, ry, X, ry + (i % 5 ? 2 : 4), C.deep); }
    }
  }

  // ── characters ──────────────────────────────────────────────────────────
  // People are built from parts on one 16x30 body, so the cast stays consistent.
  const BODY = [
    '.....kkkkkk.....', '....kSSSSSSk....', '...kSSSSSSSSk...', '...kSSSSSSSSk...', '...kSSSSSSSSk...',
    '...kSSkSSkSSk...', '...kSSkSSkSSk...', '...kSSSsSSSSk...', '...kSSSkkSSSk...', '....kSSSSSSk....',
    '.....kSSSSk.....', '......kssk......', '..kkTTTTTTTTkk..', '..kTTTTTTTTTTk..', '..kTTTTTTTTTTk..',
    '..ktTTTTTTTTtk..', '..ktTTTTTTTTtk..', '..ktTTTTTTTTtk..', '..ktTTTTTTTTtk..', '..kttTTTTTTttk..',
  ];
  const BOTTOMS = {
    pants: { rows: ['..kkkkkkkkkkkk..', '...kBBBBBBBBk...', '...kBBBBBBBBk...', '...kBBBkkBBBk...', '...kbBBkkBBbk...',
      '...kbBBkkBBbk...', '...kbBBkkBBbk...', '...kbBBkkBBbk...', '..kOOOOkkOOOOk..', '..kkkkkkkkkkkk..'],
      walk: { 23: '...kBBBkkBBBk...', 24: '..kbBBk..kBBbk..', 25: '..kbBBk..kBBbk..', 26: '.kbBBk....kBBbk.', 27: '.kbBBk....kBBbk.', 28: 'kOOOOk....kOOOOk', 29: 'kkkkkk....kkkkkk' } },
    skirt: { rows: ['..kkkkkkkkkkkk..', '..kBBBBBBBBBBk..', '..kBBBBBBBBBBk..', '..kbBBBBBBBBbk..', '..kbBBBBBBBBbk..',
      '..kkkkkkkkkkkk..', '....kSk..kSk....', '....kSk..kSk....', '...kOOk..kOOk...', '...kkkk..kkkk...'],
      walk: { 26: '...kSk....kSk...', 27: '..kSk......kSk..', 28: '.kOOk......kOOk.', 29: '.kkkk......kkkk.' } },
    dress: { rows: ['..kkkkkkkkkkkk..', '..kTTTTTTTTTTk..', '..kTTTTTTTTTTk..', '.ktTTTTTTTTTTtk.', '.ktTTTTTTTTTTtk.',
      '.ktTTTTTTTTTTtk.', 'kttTTTTTTTTTTttk', 'kttTTTTTTTTTTttk', 'kttTTTTTTTTTTttk', 'kkkkkkkkkkkkkkkk'] },
  };
  const PARTS = {
    slick: { 0: '.....kkkkkk.....', 1: '....kHHHHHHk....', 2: '...kHHHHHHHHk...', 3: '....Hh....hH....', 4: '....H......H....' },
    long: { 0: '....kkkkkkkk....', 1: '...kHHHHHHHHk...', 2: '..kHHHHHHHHHHk..', 3: '..kHH......HHk..', 4: '..kH........Hk..', 5: '..kH........Hk..',
      6: '..kH........Hk..', 7: '..kH........Hk..', 8: '..kH........Hk..', 9: '..kH........Hk..', 10: '..kH........Hk..', 11: '..kH........Hk..', 12: '..kH........Hk..' },
    curly: { 0: '....kkkkkkkk....', 1: '...kHhHHhHHhk...', 2: '..kHHHhHHHhHHk..', 3: '..kHh......hHk..', 4: '...kH......Hk...' },
    ringlets: { 0: '.....kkkkkk.....', 1: '....kHHhHHHk....', 2: '...kHHHhHHHHk...', 3: '....HH....HH....', 4: '..kHHH....HHHk..',
      5: '..kHh......hHk..', 6: '..kHH......HHk..', 7: '..kHh......hHk..', 8: '...kH......Hk...' },
    wavy: { 0: '.....kkkkkkk....', 1: '....kHHhHHHHk...', 2: '...kHHHHhHHHHk..', 3: '....HhH....HH...', 4: '....H......H....' },
    short: { 0: '.....kkkkkk.....', 1: '....kHHHHHHk....', 2: '...kHHHHHHHHk...', 3: '....HHH..HHH....' },
    brows: { 4: '.....HH..HH.....' },
    beard: { 6: '....H......H....', 7: '....HH....HH....', 8: '....HHH..HHH....', 9: '.....HHHHHH.....', 10: '......HHHH......', 11: '.......HH.......' },
    glasses: { 4: '.....gggggg.....', 5: '.....g.gg.g.....', 6: '.....g.gg.g.....' },
    headset: { 1: '..........E.....', 2: '...........E....', 3: '............E...', 4: '............E...', 5: '............EE..', 6: '............EE..', 7: '............E...', 8: '...........E....', 9: '..........G.....' },
    tie: { 12: '.......AA.......', 13: '.......AA.......', 14: '.......AA.......', 15: '.......AA.......', 16: '.......AA.......', 17: '.......AA.......', 18: '.......AA.......' },
    jacket: { 12: '......WAAW......', 13: '......WAAW......', 14: '.......AA.......', 15: '.......AA.......' },
    uniform: { 12: '......WkkW......', 13: '.......kk.......', 14: '.......kk.......', 15: '.....Y....Y.....', 17: '.....Y....Y.....' },
    lace: { 12: '....WWWWWWWW....', 13: '.....WWWWWW.....', 14: '.......WW.......' },
    labcoat: { 20: '..kWW......WWk..', 21: '..kWW......WWk..', 22: '..kWW......WWk..', 23: '..kWW......WWk..', 24: '..kkk......kkk..' },
    bald: { 3: '....H......H....', 4: '....H......H....', 5: '....H......H....' },
    chain: { 16: '........YY......', 17: '..........Y.....' },
    apron: { 12: '.....W....W.....', 13: '.....WWWWWW.....', 14: '.....WWWWWW.....', 15: '.....WWWWWW.....', 16: '.....WWWWWW.....', 17: '.....WWWWWW.....',
      18: '.....WWWWWW.....', 19: '.....WWWWWW.....', 20: '..kkkWWWWWWkkk..', 21: '...kBWWWWWWBk...', 22: '...kBWWWWWWBk...' },
  };
  const SKINS = { light: [C.face, C.faceShade], deep: [C.faceDeep, C.faceDeepShade] };
  // spec: { skin, hair: style, hairColor, top, topShade, bottom: 'pants'|'skirt'|'dress', bottomColor, bottomShade,
  //         parts: ['glasses', 'beard', 'tie', ...], accent, arms: { upper, lower, cuff } }
  function person(spec) {
    const bottom = BOTTOMS[spec.bottom || 'pants'];
    const grid = BODY.concat(bottom.rows).map((r) => r.split(''));
    const put = (part) => { for (const [r, row] of Object.entries(PARTS[part] || {})) [...row].forEach((ch, c) => { if (ch !== '.') grid[r][c] = ch; }); };
    put(spec.hair || 'short');
    (spec.parts || []).forEach(put);
    const beard = (spec.parts || []).includes('beard');
    if (beard) grid[8][7] = grid[8][8] = 'S';
    const rows = grid.map((r) => r.join(''));
    const patch = (fn) => { const g2 = rows.map((r) => r.split('')); fn(g2); const out = {}; g2.forEach((r, i) => { const s = r.join(''); if (s !== rows[i]) out[i] = s; }); return out; };
    const frames = {
      blink: patch((f) => { f[5][6] = f[5][9] = 'S'; }),
      talk: patch((f) => { f[8][7] = f[8][8] = f[9][7] = f[9][8] = 'M'; }),
      shout: patch((f) => { for (const c of [6, 7, 8, 9]) { f[8][c] = 'M'; if (!beard || c === 7 || c === 8) f[9][c] = 'M'; } }),
      happy: patch((f) => { f[8][6] = f[8][9] = 'k'; f[8][7] = f[8][8] = 'S'; f[9][7] = f[9][8] = 'k'; }),
      sad: patch((f) => { f[9][6] = f[9][9] = 'k'; if (beard) f[8][7] = f[8][8] = 'k'; }),
    };
    if (bottom.walk) frames.walk = bottom.walk;
    const [S, s] = SKINS[spec.skin || 'light'];
    const A = spec.arms || {};
    return Pixel.sprite({
      rows, frames,
      pal: { k: C.ink, S, s, H: spec.hairColor ?? C.hair, h: spec.hairShade ?? C.ink, T: spec.top ?? C.sage, t: spec.topShade ?? C.slate,
        B: spec.bottomColor ?? C.slate, b: spec.bottomShade ?? C.ink, O: C.ink, W: C.white, A: spec.accent ?? C.deep, M: C.wine,
        E: C.gray, G: C.ink, g: spec.glassesColor ?? C.gray, Y: C.amber },
      anchors: { head: [8, 0], mouth: [8, 9] },
      rig: { shoulders: [[2, 13], [13, 13]], armLen: 4.5, armW: 1, upper: A.upper ?? spec.top ?? C.sage, lower: A.lower ?? A.upper ?? spec.top ?? C.sage, hand: S, cuff: A.cuff },
    });
  }
  // The cast: nods to people from computing history, not portraits of them. Never quote them.
  const CAST = {
    doug: person({ hair: 'slick', top: C.white, topShade: C.cream, parts: ['brows', 'headset', 'tie'], accent: C.deep, bottomColor: C.slate, arms: { upper: C.white, lower: C.face } }),
    dennis: person({ hair: 'long', parts: ['beard', 'glasses'], top: C.sage, topShade: C.slate, bottomColor: C.steel, bottomShade: C.navy }),
    grace: person({ hair: 'curly', hairColor: C.gray, hairShade: C.light, parts: ['glasses', 'uniform'], top: C.navy, topShade: C.slate, bottom: 'skirt', bottomColor: C.navy, bottomShade: C.slate, arms: { upper: C.navy, cuff: C.amber } }),
    ada: person({ hair: 'ringlets', hairShade: C.deep, parts: ['lace'], top: C.wine, topShade: C.deep, bottom: 'dress', arms: { upper: C.wine, cuff: C.white } }),
    alan: person({ hair: 'wavy', parts: ['brows', 'jacket'], top: C.mid, topShade: C.deep, accent: C.wine, bottomColor: C.gray, bottomShade: C.light }),
    learner: person({ skin: 'deep', hair: 'short', top: C.amber, topShade: C.clay, bottomColor: C.steel, bottomShade: C.navy }),
    frank: person({ hair: 'short', parts: ['brows', 'tie', 'labcoat'], top: C.white, topShade: C.cream, accent: C.navy, bottomColor: C.mid, bottomShade: C.deep, arms: { upper: C.white, lower: C.white } }),
    marvin: person({ hair: 'bald', hairColor: C.hair, parts: ['glasses'], top: C.steel, topShade: C.navy, bottomColor: C.slate }),
    danny: person({ hair: 'short', hairColor: C.gray, hairShade: C.light, parts: ['glasses'], top: C.light, topShade: C.mid, bottomColor: C.mid, bottomShade: C.deep }),
    william: person({ hair: 'wavy', parts: ['beard', 'jacket', 'chain'], top: C.deep, topShade: C.ink, accent: C.wine, bottomColor: C.ink, bottomShade: C.deep }),
    dev: person({ hair: 'long', hairColor: C.clayDark, top: C.rose, topShade: C.light, parts: ['glasses'], bottomColor: C.slate }),
    shop: person({ hair: 'short', parts: ['brows', 'apron'], top: C.clay, topShade: C.clayDark, bottomColor: C.mid, bottomShade: C.deep }),
    teacher: person({ skin: 'deep', hair: 'curly', hairColor: C.ink, hairShade: C.hair, parts: ['glasses'], top: C.sage, topShade: C.slate, bottom: 'skirt', bottomColor: C.wine, bottomShade: C.deep }),
    herb: person({ hair: 'short', hairColor: C.gray, hairShade: C.light, parts: ['brows', 'glasses', 'jacket'], top: C.slate, topShade: C.ink, accent: C.wine, bottomColor: C.mid, bottomShade: C.deep }),
    geoff: person({ hair: 'wavy', hairColor: C.white, hairShade: C.gray, parts: ['brows'], top: C.steel, topShade: C.navy, bottomColor: C.slate, bottomShade: C.ink }),
    john: person({ hair: 'short', hairColor: C.gray, hairShade: C.light, parts: ['beard', 'glasses'], top: C.clay, topShade: C.clayDark, bottomColor: C.mid, bottomShade: C.deep }),
  };
  CAST.dub = Pixel.sprite({  // a living clay tablet: a file with legs
    pal: { k: 0, c: 10, d: 9, h: 11, w: 8, m: 1 },
    rows: ['..kkkkkkkkkkkk..', '.khhhhhhhhhhhck.', '.khccccccccccdk.', '.khcdcddccdccdk.', '.khccccccccccdk.', '.khcwwccccwwcdk.',
      '.khcwkccccwkcdk.', '.khccccccccccdk.', '.khccckkkkcccdk.', '.khccccccccccdk.', '.khccccccccccdk.', '.khccccccccccdk.',
      '.kcdddddddddddk.', '..kkkkkkkkkkkk..', '....k......k....', '....k......k....', '...kk.....kk....'],
    frames: { blink: { 5: '.khccccccccccdk.', 6: '.khckkcccckkcdk.' }, talk: { 8: '.khccckmmkcccdk.', 9: '.khcccckkccccdk.' },
      happy: { 8: '.khcckcccckccdk.', 9: '.khccckkkkcccdk.' }, sad: { 8: '.khccccccccccdk.', 9: '.khccckkkkcccdk.' } },
    anchors: { head: [8, 0], mouth: [8, 9] },
    rig: { shoulders: [[1, 8], [14, 8]], armLen: 3.2, armW: 1, upper: C.ink, lower: C.ink, hand: C.skin },
  });
  // Draw a cast member (or any Pixel.sprite). o: x, y (feet), scale, pose, face, reach {r,l}, walk, flip, talk.
  function actor(g, who, o = {}) { return g.px.actor(typeof who === 'string' ? CAST[who] : who, o); }

  window.Eduba = {
    PAL, C, THEMES, THEME_ORDER, TYPE, CAST, frame, metrics, layout,
    label, plate, typeAt, caption, subtitles, panel, card, say, bubble, lowerThird, chapter, rail, stamp, spot, spoken, speech, host,
    room, node, tablet, shelf, lamp, arch, desk, cabinet, crt,
    file, folderIcon, tree, terminal, code, pipe, bits, memory, cpu, disk, db, server, wire, packet, tokens, model, stack, graph, flow, arrow,
    window: window_, cursor, mouse, pdp, teletype, punchcard, tape, bug, mark, choice, noul, score,
    envelope, pigeonholes, papers, newspaper, perceptron, snow, coin, jar, engine, coal, stopwatch, calendar, thumbs, photo,
    faceIcon, icon, book, chart, coat, meter, chat, image, screenshot, bicycle, loom, knife, pbjar, bread, projector,
    sheet, stand, podium, instrument, metronome, note, orchestra, mic, xsheet, storyboard,
    hexmap, unit, city, eureka, techtree, victory, bell,
    camera, punch, pop, burst, emote, drift, takeaways,
    person, actor,
  };
})();
