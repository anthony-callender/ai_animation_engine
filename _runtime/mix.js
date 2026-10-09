// mix.js - one Short, many looks. Shots arrive on style wipes (a glowing seam sweeping across), a shot can show several
// looks side by side in strips, and real screens sit under the pixel cast. Load after eduba.js, desk.js, looks.js, line.js.
// Reference: _shared/mix.md. Worked example: the synthetic project in videos/silent-first-scene/.
window.Mix = (() => {
  const D = Desk, E = Eduba, M = Looks.modern, B = Looks.blueprint;
  const stage = document.getElementById('stage');
  const FW = +stage.dataset.width || 1080, FH = +stage.dataset.height || 1920, K = FW / (FH > FW ? 180 : 320);  // K: world px to real px

  // ── regions: the part of the frame a look shows, a left and a right edge down the height (a seam is one such edge) ──
  const NY = 64, YS = Array.from({ length: NY + 1 }, (_, i) => -40 + (i / NY) * (FH + 80));
  const FULL = { full: true, l: () => -40, r: () => FW + 40 };
  const inter = (a, b) => (a.full ? b : b.full ? a : { l: (y) => Math.max(a.l(y), b.l(y)), r: (y) => Math.min(a.r(y), b.r(y)) });
  const empty = (g) => !g.full && YS.every((y) => g.r(y) - g.l(y) < 1);
  const ptsOf = (g) => [...YS.map((y) => [g.l(y), y]), ...YS.slice().reverse().map((y) => [Math.max(g.l(y), g.r(y)), y])];
  const cssOf = (g) => (g.full ? '' : empty(g) ? 'inset(0 0 0 100%)' : 'polygon(' + ptsOf(g).map(([x, y]) => x.toFixed(1) + 'px ' + y.toFixed(1) + 'px').join(', ') + ')');
  function clipTo(ctx, g) { if (g.full) return; ctx.beginPath(); ptsOf(g).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.clip(); }

  // ── captions from the transcript, 1 to 3 words, the word being said in the accent ──
  let SUBS = null;
  function sub(T) {
    if (!SUBS) {
      SUBS = []; let cur = [];
      P.words.forEach((w, i) => { cur.push(w); const nx = P.words[i + 1];
        if (!nx || cur.length >= 3 || /[.,!?;:]$/.test(w.text) || nx.start - w.end > 0.35) { SUBS.push(cur); cur = []; } });
    }
    const i = SUBS.findIndex((c, k) => T >= c[0].start && T < (SUBS[k + 1] ? Math.min(SUBS[k + 1][0].start, c[c.length - 1].end + 0.6) : c[c.length - 1].end + 0.6));
    if (i < 0) return null;
    return { words: SUBS[i].map((w) => w.text.replace(/[.,;:]+$/, '')), lit: SUBS[i].reduce((k, w, n) => (T >= w.start ? n : k), 0) };
  }
  // One caption line drawn word by word. o: font, ls, fg, upper, glow, box(ctx, x, y, w), hl(ctx, x, w) -> fill for the lit word
  function pill(ctx, T, y, o) {
    const s = sub(T);
    if (!s) return;
    ctx.save(); ctx.font = o.font; ctx.letterSpacing = o.ls || '0px'; ctx.textBaseline = 'middle';
    const words = s.words.map((w) => (o.upper ? w.toUpperCase() : w)), sp = ctx.measureText(' ').width, ws = words.map((w) => ctx.measureText(w).width);
    const tw = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
    o.box(ctx, FW / 2 - tw / 2, y, tw);
    let x = FW / 2 - tw / 2;
    words.forEach((w, n) => { ctx.fillStyle = n === s.lit ? o.hl(ctx, x, ws[n]) : o.fg; if (o.glow && n === s.lit) { ctx.shadowColor = o.glow; ctx.shadowBlur = 18; } ctx.fillText(w, x, y); ctx.shadowBlur = 0; x += ws[n] + sp; });
    ctx.restore();
  }
  const caption = {
    // clean and modern: a dark pill, the lit word in an orange gradient
    modern: (ctx, T, y = 1420) => pill(ctx, T, y, { font: '700 60px ' + M.font, ls: '-0.6px', fg: '#FFFFFF',
      box: (c, x, yy, w) => { c.shadowColor = 'rgba(0,0,0,0.2)'; c.shadowBlur = 30; c.shadowOffsetY = 10; c.fillStyle = 'rgba(28,25,23,0.92)'; c.beginPath(); c.roundRect(x - 44, yy - 56, w + 88, 112, 56); c.fill(); c.shadowColor = 'transparent'; },
      hl: (c, x, w) => { const g0 = c.createLinearGradient(x, 0, x + w, 0); g0.addColorStop(0, '#FF8A5C'); g0.addColorStop(1, '#FFC061'); return g0; } }),
    // blueprint: a boxed note in plotter capitals, the lit word glowing
    blue: (ctx, T, y = 1420) => pill(ctx, T, y, { font: '600 54px ' + B.mono, ls: '3px', upper: true, fg: B.ink, glow: B.glow,
      box: (c, x, yy, w) => { c.fillStyle = 'rgba(8,34,64,0.85)'; c.fillRect(x - 34, yy - 50, w + 68, 100); c.strokeStyle = B.soft; c.lineWidth = 1.5; c.strokeRect(x - 34, yy - 50, w + 68, 100);
        c.fillStyle = B.soft; c.font = '600 16px ' + B.mono; c.letterSpacing = '3px'; c.fillText('NOTE 1', x - 34, yy - 66); c.font = '600 54px ' + B.mono; },
      hl: () => '#BFE6FF' }),
  };

  // ── real screens, zoomed to read on a phone (tall) ──
  const AX = 20, TOP_Y = 170, STAGE_Y = 330, BOT_Y = FH > FW ? 1580 : FH - 40, ZR = 2.1;
  // A window at (AX, top) filling the frame's width after a zoom of z; fn(c) draws into its content rect c (unzoomed
  // coords) and returns rects. Returns { zz, out }: zz.rect(r) maps a returned rect to frame px (for E.spot).
  // The screen runs on under the host's band, dimmed there so the band reads.
  function zoomWin(ctx, top, z, title, fn) {
    const zz = D.zoom(z, AX, top), w = (FW - 2 * AX) / z, h = (BOT_Y - top) / z;
    D.wallpaper(ctx);
    ctx.save(); zz.apply(ctx);
    const c = D.win(ctx, AX, top, w, h, { title });
    const out = fn(c) || {};
    ctx.restore();
    if (FH > FW) {
      const fade = ctx.createLinearGradient(0, 880, 0, 1260);
      fade.addColorStop(0, 'rgba(16,13,12,0)'); fade.addColorStop(1, 'rgba(16,13,12,0.85)');
      ctx.fillStyle = fade; ctx.fillRect(0, 880, FW, FH - 880);
    }
    return { zz, out };
  }
  // An editor in window c; the strip under the tabs is repainted so a row scrolling up never runs over the path line.
  function edit(ctx, c, o) {
    const out = D.editor(ctx, c.x, c.y, c.w, c.h, o);
    ctx.fillStyle = D.K.win; ctx.fillRect(c.x, c.y + 41, c.w, 37);
    ctx.fillStyle = D.K.dim; ctx.font = `14px ${D.UI}`; ctx.textBaseline = 'middle'; ctx.fillText(o.crumb || '', c.x + 24, c.y + 58);
    return out;
  }
  // An editor's rows without drawing it (for scroll maths): .rowOf(line), .rows
  const SCRATCH = document.createElement('canvas').getContext('2d');
  const rows = (lines, z = ZR, wrap = false) => D.editor(SCRATCH, 0, 0, (FW - 2 * AX) / z, 10, { lines, wrap });

  // ── the frame: shots, wipes, strips, the pixel cast on real screens ──
  let MIXED = false;
  const mixed = () => MIXED;  // a strips shot is on screen: looks skip their own captions, one runs across them all
  // o.looks: { name: { layer: 'photo' | 'art' | 'line', draw, real, color } }
  //   photo: draw(ctx, T) on the full-resolution photo layer. real: true adds the pixel cast via o.overlay.
  //   art: draw(g, T) on the Eduba pixel layer (one art look at a time). line: draw(g, T) on the Line layer.
  // o.strips: { name: [look, look, ...] } a shot showing those looks side by side, split by flowing seams.
  // o.shots: () => [[t0, look, wipeDur], ...] in order; the first is [0, look, 0]. Each later one wipes in over wipeDur.
  // o.overlay(g, look, T, rise): the pixel cast on a real look (E.spot, E.stamp, E.host(g, 'doug', { rise })).
  // o.stripCaption(ctx, T): the one caption across strips (default caption.modern).
  function start(o) {
    const LOOKS = o.looks, STRIPS = o.strips || {};
    let SH = null;
    const shots = () => SH || (SH = o.shots());
    const color = (lk) => (LOOKS[lk] && LOOKS[lk].color) || (STRIPS[lk] && LOOKS[STRIPS[lk][0]].color) || '#E8A860';
    const stripSeams = (lk, T) => { const n = STRIPS[lk].length; return Array.from({ length: n - 1 }, (_, k) => D.seam((FW * (k + 1)) / n, { w: FW, h: FH, amp: 26, waves: 1.1, phase: T * 2 + k * 1.7 })); };
    function expand(lk, reg, T) {
      if (!STRIPS[lk]) return [[lk, reg]];
      const e = [() => -40, ...stripSeams(lk, T).map((s) => s.x), () => FW + 40];
      return STRIPS[lk].map((l2, k) => [l2, inter({ l: e[k], r: e[k + 1] }, reg)]);
    }
    function state(T) {
      const L0 = shots();
      let i = 0;
      while (i + 1 < L0.length && T >= L0[i + 1][0]) i++;
      const [t0, look, dur] = L0[i];
      if (i > 0 && T < t0 + dur) {
        const p = P.ease.inOut((T - t0) / dur), sm = D.seam(P.lerp(-160, FW + 160, p), { w: FW, h: FH, amp: 46, phase: T * 2.4, tilt: Math.sin(p * Math.PI) * 150 });
        const left = { l: () => -40, r: sm.x }, right = { l: sm.x, r: () => FW + 40 };
        return { i, parts: [...expand(L0[i - 1][1], right, T), ...expand(look, left, T)], seam: sm, left, right, from: L0[i - 1][1], to: look };
      }
      return { i, parts: expand(look, FULL, T), seam: null, left: FULL, right: FULL, from: look, to: null };
    }
    const is = (lk, layer) => LOOKS[lk] && LOOKS[lk].layer === layer;
    const isReal = (lk) => LOOKS[lk] && LOOKS[lk].real;
    const artish = (lk) => is(lk, 'art') || (STRIPS[lk] && STRIPS[lk].some((l2) => is(l2, 'art')));
    E.frame({ overlay: true, draw(g) {
      const T = P.t, st = state(T), ctx = g.photo.ctx;
      MIXED = !!(STRIPS[st.from] || STRIPS[st.to]);
      for (const [lk, reg] of st.parts) {
        if (!is(lk, 'photo') || empty(reg)) continue;
        ctx.save(); clipTo(ctx, reg); LOOKS[lk].draw(ctx, T); ctx.restore();
      }
      const art = [...st.parts].reverse().find(([lk, reg]) => is(lk, 'art') && !empty(reg));
      if (art) { LOOKS[art[0]].draw(g, T); g.clip = { art: cssOf(art[1]), photo: '' }; return; }
      const real = [...st.parts].reverse().find(([lk, reg]) => isReal(lk) && !empty(reg));
      if (real && o.overlay) {
        g.under = true;
        const sh = shots()[st.i], prev = shots()[st.i - 1], afterArt = prev && artish(prev[1]);
        if (st.to != null && afterArt && st.to === real[0]) return;  // the art layer was busy with the outgoing look: the cast rises in after
        const rise = st.to == null && afterArt && T < sh[0] + sh[2] + 0.6 ? sh[0] + sh[2] : undefined;
        o.overlay(g, real[0], T, rise);
        g.clip = { art: st.parts.every(([lk]) => isReal(lk)) ? '' : cssOf(real[1]), photo: '' };
      }
    } });
    if (window.Line) Line.frame({ draw(g) {
      const T = P.t, st = state(T), part = [...st.parts].reverse().find(([lk, reg]) => is(lk, 'line') && !empty(reg));
      if (!part) { g.clip = 'inset(0 0 0 100%)'; return; }
      g.clip = cssOf(part[1]);
      LOOKS[part[0]].draw(g, T);
    } });
    const TOP = D.layer();
    P.onFrame(() => {
      const T = P.t, st = state(T);
      TOP.clearRect(0, 0, FW, FH);
      for (const [lk, side] of [[st.from, st.to ? st.right : FULL], [st.to, st.left]]) {
        if (!lk || !STRIPS[lk]) continue;  // the seams between strips, and the one caption, only where the strips show
        TOP.save(); clipTo(TOP, side);
        stripSeams(lk, T).forEach((s, k) => s.draw(TOP, color(STRIPS[lk][k]), { to: color(STRIPS[lk][k + 1]), t: T + k, dir: -1 }));
        (o.stripCaption || caption.modern)(TOP, T);
        TOP.restore();
      }
      if (st.seam) st.seam.draw(TOP, color(st.from), { to: color(st.to), t: T, dir: -1 });
    });
    return { state, shots };
  }

  return { FW, FH, K, FULL, inter, empty, cssOf, clipTo, sub, pill, caption, AX, TOP_Y, STAGE_Y, BOT_Y, ZR, zoomWin, edit, rows, mixed, start };
})();
