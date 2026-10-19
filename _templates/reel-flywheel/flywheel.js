// flywheel.js: data-driven 9:16 reel in the "agent canvas" style (from Reel A, church-welcome-reel).
// A project supplies window.STORYBOARD (04_scene/storyboard.js, written by pipeline/reel.py from storyboard.json):
//   { headline: [a, highlight, line2], keyword, cta: [line1, line2], ctaSub, ctaNote, label,
//     nodes: [{ cue, pill: [step, name, time], title, sub, emoji, tint, panel: { type, ... } }], loop: true|false }
// Cue ids are n0, n1, … (one per node), then 'loop' (optional) and 'cta'. Panel beats are keyed to spoken words (P.at).
// Panel types: chat · form · branches · list · checklist · steps · media · answer · kv. Drawn on g.photo.ctx in real px.
(function () {
const SB = window.STORYBOARD;
const { ease } = P;
const S = (id) => P.cue(id).start;
const lerp = (a, b, p) => a + (b - a) * p;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
P.wait(Promise.all(['500', '600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 40px Inter`))));

const BG = '#17181d', NODE = '#23252c', CARD = '#262830', EDGE = '#3b3e48', TEXT = '#f5f5f7', SUB = '#9b9faa';
const CORAL = '#ff6b5b', GREEN = '#3fd27f', AMBER = '#f4b740', BLUE = '#4f8dff', WIRE = '#4a4e5a';
const FONT = (w, s) => `${w} ${s}px Inter, "Segoe UI", Arial, sans-serif`;
const EMOJI = (s) => `${s}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
const HEAD_Y = 440, PILL_Y = 592, BAND = { y0: 650, y1: 1330 }, CAPTION_Y = 1412, ANCHOR = { x: 540, y: 790 };
const SPACING = 700, PER_ROW = 4, ROW_GAP = 1150;
const N = SB.nodes, cueOf = (i) => `n${i}`;
const nx = (i) => (i % PER_ROW) * SPACING, ny = (i) => Math.floor(i / PER_ROW) * ROW_GAP;
const GRID_W = (Math.min(PER_ROW, N.length) - 1) * SPACING, GRID_H = Math.floor((N.length - 1) / PER_ROW) * ROW_GAP;
const at = (w, cue, fallback) => { if (!w) return fallback; const v = P.at(w, cue); return Number.isFinite(v) ? v : fallback; };

// ── drawing helpers (same look as Reel A) ──────────────────────────────────
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function text(ctx, s, x, y, o = {}) { ctx.font = FONT(o.w || 600, o.s || 28); ctx.fillStyle = o.c || TEXT; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); }
function emoji(ctx, s, x, y, size) { ctx.font = EMOJI(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(s, x, y + size * 0.05); }
function wrap(ctx, s, maxW, w, size) { ctx.font = FONT(w, size); const out = []; let line = '';
  for (const word of s.split(' ')) { const t = line ? line + ' ' + word : word; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = word; } else line = t; }
  if (line) out.push(line); return out; }
const since = (t0, d = 0.35) => clamp01((P.t - t0) / d);
const pop = (t0, d = 0.35) => { const k = since(t0, d); return k <= 0 ? 0 : ease.back(k); };
const typed = (t0, d) => clamp01((P.t - t0) / d);
function checkDot(ctx, x, y, r = 17) { ctx.fillStyle = GREEN; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.strokeStyle = '#0c1a12'; ctx.lineWidth = r / 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x - r * 0.45, y); ctx.lineTo(x - r * 0.1, y + r * 0.35); ctx.lineTo(x + r * 0.5, y - r * 0.35); ctx.stroke(); }
function runDot(ctx, x, y, r = 17) { ctx.fillStyle = '#121318'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.strokeStyle = CORAL; ctx.lineWidth = 4; const a = P.t * 6; ctx.beginPath(); ctx.arc(x, y, r - 3, a, a + 4.2); ctx.stroke(); }
function chainNode(ctx, n, x, y, state) {
  const edge = state === 'done' ? GREEN : state === 'run' ? CORAL : EDGE; ctx.save();
  if (state === 'run') { ctx.shadowColor = CORAL; ctx.shadowBlur = 30 + Math.sin(P.t * 5) * 8; }
  if (n.avatar) {
    rr(ctx, x - 60, y - 60, 120, 120, 26); ctx.fillStyle = '#2e3140'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = edge; ctx.stroke(); ctx.shadowBlur = 0;
    emoji(ctx, n.emoji, x, y, 64); text(ctx, n.title, x, y + 92, { w: 700, s: 26 }); if (n.sub) text(ctx, n.sub, x, y + 124, { w: 500, s: 21, c: SUB });
    if (state === 'done') checkDot(ctx, x + 56, y - 56); else if (state === 'run') runDot(ctx, x + 56, y - 56); ctx.restore(); return;
  }
  const w = 460, h = 128;
  rr(ctx, x - w / 2, y - h / 2, w, h, 26); ctx.fillStyle = NODE; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = edge; ctx.stroke(); ctx.shadowBlur = 0;
  emoji(ctx, n.emoji, x - w / 2 + 62, y, 54);
  text(ctx, n.title, x - w / 2 + 112, y - (n.sub ? 18 : 0), { w: 700, s: 33, align: 'left' });
  if (n.sub) text(ctx, n.sub, x - w / 2 + 112, y + 24, { w: 500, s: 23, c: SUB, align: 'left' });
  if (state === 'done') checkDot(ctx, x + w / 2 - 4, y - h / 2 + 4); else if (state === 'run') runDot(ctx, x + w / 2 - 4, y - h / 2 + 4);
  ctx.restore();
}
function hwire(ctx, x0, x1, y, color) { ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  ctx.beginPath(); ctx.arc((x0 + x1) / 2, y, 7, 0, 7); ctx.fill();
  if (color === GREEN) { ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 - 14, y - 9); ctx.lineTo(x1 - 14, y + 9); ctx.closePath(); ctx.fill(); } ctx.restore(); }
function rowWire(ctx, x0, y0, x1, y1, color) { ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, y0);
  ctx.bezierCurveTo(x0 + 260, y0 + 620, x1 - 260, y1 - 620, x1, y1); ctx.stroke(); ctx.restore(); }
function branch(ctx, x0, y0, x1, y1, on, p = 1) { if (p <= 0) return; const my = (y0 + y1) / 2;
  ctx.save(); ctx.strokeStyle = on ? GREEN : WIRE; ctx.lineWidth = 4; ctx.setLineDash(on ? [] : [10, 10]); ctx.lineDashOffset = -P.t * 30;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.bezierCurveTo(x0, my, x1, my, x1, lerp(y0, y1, p)); ctx.stroke(); ctx.restore(); }
function circleNode(ctx, x, y, em, label, o = {}) { const k = o.scale ?? 1; if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); const edge = o.warn ? AMBER : o.on ? GREEN : EDGE;
  if (o.on || o.warn) { ctx.shadowColor = edge; ctx.shadowBlur = 22; }
  ctx.beginPath(); ctx.arc(0, 0, 66, 0, 7); ctx.fillStyle = '#2a2d36'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = edge; ctx.stroke(); ctx.shadowBlur = 0;
  emoji(ctx, em, 0, 0, 54); wrap(ctx, label, 220, 700, 25).forEach((l, i) => text(ctx, l, 0, 102 + i * 30, { w: 700, s: 25 }));
  if (o.on) checkDot(ctx, 48, -48, 15); ctx.restore(); }
function panel(ctx, x, y, w, h, o = {}) { const k = o.scale ?? 1; if (k <= 0) return false;
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= Math.min(1, k); ctx.translate(0, (1 - k) * 20);
  rr(ctx, -w / 2, 0, w, h, 24); ctx.fillStyle = CARD; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = o.edge || '#363944'; ctx.stroke();
  if (o.title) text(ctx, o.title, -w / 2 + 26, 32, { w: 600, s: 22, c: SUB, align: 'left' }); return true; }
function bubble(ctx, s, x, y, o = {}) { const p = o.progress ?? 1; if (p <= 0) return 0;
  const size = o.s || 26, lines = wrap(ctx, s, (o.maxW || 420) - 40, 500, size), lh = size * 1.32; ctx.font = FONT(500, size);
  const w = Math.min(o.maxW || 420, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 40), h = lines.length * lh + 28, bx = o.right ? x - w : x;
  rr(ctx, bx, y, w, h, 20); ctx.fillStyle = o.bg || '#353845'; ctx.fill();
  let n = Math.ceil(p * s.length);
  lines.forEach((l, i) => { text(ctx, l.slice(0, Math.max(0, n)), bx + 20, y + 14 + lh * (i + 0.5), { w: 500, s: size, c: o.fg || TEXT, align: 'left' }); n -= l.length + 1; });
  return h; }
function pill(ctx, s, x, y, o = {}) { const k = o.scale ?? 1; if (k <= 0) return; ctx.font = FONT(700, o.s || 24); const w = ctx.measureText(s).width + 36, h = (o.s || 24) + 22;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = o.bg || '#353845'; ctx.fill();
  if (o.edge) { ctx.lineWidth = 3; ctx.strokeStyle = o.edge; ctx.stroke(); } text(ctx, s, 0, 1, { w: 700, s: o.s || 24, c: o.c || TEXT }); ctx.restore(); }

// ── panel types (local coords: node centre at 0,0; a = node cue start, cue = node cue id) ──
const PANELS = {
  chat(ctx, p, a, cue) {  // messages: [{ who: 'visitor'|'bot', text, word }], button: { text, word }
    const h = p.height || 400; if (!panel(ctx, 0, 110, 620, h, { title: p.title, edge: p.edge === 'green' ? GREEN : undefined, scale: since(a + 0.3, 0.4) })) return;
    let y = 60;
    p.messages.forEach((m, i) => { const t0 = at(m.word, cue, a + 0.6 + i * 1.5), bot = m.who === 'bot';
      const hh = bubble(ctx, m.text, bot ? -280 : 290, y, { right: !bot, bg: bot ? '#2f3a33' : BLUE, maxW: 480, progress: m.instant ? 1 : typed(t0, Math.min(2.4, m.text.length / 22)) });
      y += (hh || 0) + 18; });
    if (p.button) pill(ctx, p.button.text, -140, y + 36, { bg: GREEN, c: '#0b1a11', s: 26, scale: pop(at(p.button.word, cue, a + 4)) });
    ctx.restore(); },
  form(ctx, p, a, cue) {  // fields: [[label, value, word]], bubble: { text, word }
    if (!panel(ctx, 0, 110, 580, p.height || 400, { title: p.title })) return;
    p.fields.forEach(([l, v, w], i) => { const y = 86 + i * 72, t0 = at(w, cue, a + 0.6 + i * 0.7); text(ctx, l, -264, y, { w: 500, s: 23, c: SUB, align: 'left' });
      rr(ctx, -120, y - 24, 380, 48, 12); ctx.fillStyle = '#1e2027'; ctx.fill(); const q = typed(t0, 0.6); text(ctx, v.slice(0, Math.ceil(q * v.length)), -102, y, { w: 600, s: 24, align: 'left' });
      if (q >= 1) checkDot(ctx, 236, y, 12); });
    if (p.bubble) bubble(ctx, p.bubble.text, -250, 86 + p.fields.length * 72, { bg: '#1f5d3a', maxW: 520, progress: typed(at(p.bubble.word, cue, a + 3), 1.2) });
    ctx.restore(); },
  branches(ctx, p, a, cue) {  // items: [[emoji, label, word, 'warn'?]]
    const n = p.items.length, gap = n >= 3 ? 300 : 340;
    p.items.forEach(([em, l, w, kind], i) => { const x = (i - (n - 1) / 2) * gap, t0 = at(w, cue, a + 0.8 + i * 0.8), on = P.t >= t0;
      branch(ctx, 0, 70, x, 240, on && kind !== 'warn', since(a + 0.3 + i * 0.15, 0.5));
      circleNode(ctx, x, 310, em, l, { on: on && kind !== 'warn', warn: on && kind === 'warn', scale: pop(a + 0.4 + i * 0.15) }); }); },
  list(ctx, p, a, cue) {  // rows: [[text, true|false|null]], scan: true, footer: { text, word }
    if (!panel(ctx, 0, 100, 620, p.height || 440, { title: p.title, scale: since(a + 0.3, 0.4) })) return;
    const scan = at(p.scanWord, cue, a + 1);
    p.rows.forEach(([q, ok], i) => { const y = 84 + i * 60; if (P.t < a + 0.6 + i * 0.25) return;
      text(ctx, q, -282, y, { w: 500, s: 24, align: 'left' });
      if (ok !== null && ok !== undefined && P.t > scan + i * 0.45) pill(ctx, ok ? (p.okText || 'answered') : (p.noText || 'not answered'), 215, y, ok ? { s: 19, edge: GREEN } : { s: 19, bg: '#4a2224', c: CORAL }); });
    if (p.scanLine !== false && P.t > scan && P.t < scan + 0.45 * p.rows.length + 0.4) { const y = 62 + (P.t - scan) / (0.45 * p.rows.length + 0.4) * p.rows.length * 60; ctx.fillStyle = 'rgba(79,141,255,0.22)'; ctx.fillRect(-300, y, 600, 44); }
    if (p.footer) pill(ctx, p.footer.text, 0, 104 + p.rows.length * 60 + 14, { bg: '#2f3a55', s: 24, scale: pop(at(p.footer.word, cue, a + 3)) });
    ctx.restore(); },
  checklist(ctx, p, a, cue) {  // items: [[text, word]], pill: { text, word }
    if (!panel(ctx, 0, 100, 580, p.height || 380, { title: p.title, scale: since(a + 0.3, 0.4) })) return;
    p.items.forEach(([s, w], i) => { const y = 92 + i * 70, on = P.t >= at(w, cue, a + 0.8 + i * 0.6);
      rr(ctx, -250, y - 22, 44, 44, 10); ctx.fillStyle = on ? GREEN : '#1e2027'; ctx.fill();
      if (on) { ctx.strokeStyle = '#0b1a11'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-238, y); ctx.lineTo(-229, y + 9); ctx.lineTo(-214, y - 9); ctx.stroke(); }
      text(ctx, s, -186, y, { w: 600, s: 26, align: 'left', c: on ? TEXT : SUB }); });
    if (p.pill) pill(ctx, p.pill.text, 0, 106 + p.items.length * 70, { bg: GREEN, c: '#0b1a11', s: 28, scale: pop(at(p.pill.word, cue, a + 3)) });
    ctx.restore(); },
  steps(ctx, p, a, cue) {  // a mini pipeline: steps: [[emoji, label, word]], final: { text, word }
    if (!panel(ctx, 0, 100, 640, p.height || 360, { title: p.title, scale: since(a + 0.3, 0.4) })) return;
    const n = p.steps.length, gap = 560 / Math.max(1, n - 1);
    p.steps.forEach(([em, l, w], i) => { const x = -280 + i * gap, t0 = at(w, cue, a + 0.6 + i * 0.9), k = pop(t0); if (!k) return;
      if (i) { ctx.strokeStyle = GREEN; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - gap + 58, 150); ctx.lineTo(lerp(x - gap + 58, x - 58, since(t0 - 0.3, 0.3)), 150); ctx.stroke(); }
      ctx.save(); ctx.translate(x, 150); ctx.scale(k, k); rr(ctx, -56, -56, 112, 112, 22); ctx.fillStyle = NODE; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = GREEN; ctx.stroke();
      emoji(ctx, em, 0, -6, 46); ctx.restore(); wrap(ctx, l, 150, 600, 21).forEach((ln, j) => text(ctx, ln, x, 228 + j * 26, { w: 600, s: 21 })); });
    if (p.final) pill(ctx, p.final.text, 0, (p.height || 360) - 40, { bg: GREEN, c: '#0b1a11', s: 26, scale: pop(at(p.final.word, cue, a + 4)) });
    ctx.restore(); },
  media(ctx, p, a, cue) {  // a video thumbnail scanned into lines, then pills: [[text, word]], final: { text, word }
    if (!panel(ctx, 0, 100, 620, p.height || 420, { title: p.title, scale: since(a + 0.3, 0.4) })) return;
    rr(ctx, -284, 56, 250, 160, 14); ctx.fillStyle = '#3a3324'; ctx.fill(); emoji(ctx, p.emoji || '⛪', -159, 136, 70);
    const done = a + (p.scanSeconds || 3);
    if (P.t < done) { const sy = 56 + ((P.t - a) * 120) % 160; ctx.fillStyle = BLUE; ctx.shadowColor = BLUE; ctx.shadowBlur = 16; ctx.fillRect(-284, sy, 250, 4); ctx.shadowBlur = 0; }
    text(ctx, P.t < done ? (p.working || 'Working…') : (p.ready || 'Ready ✓'), 10, 76, { w: 600, s: 22, c: P.t < done ? SUB : GREEN, align: 'left' });
    for (let i = 0; i < 5; i++) { const q = typed(a + 0.8 + i * 0.35, 0.5); if (q <= 0) break; rr(ctx, 10, 104 + i * 26, (180 + (i * 37) % 90) * q, 12, 6); ctx.fillStyle = '#41444f'; ctx.fill(); }
    (p.pills || []).forEach(([s, w], i, arr) => pill(ctx, s, (i - (arr.length - 1) / 2) * 290, 270, { edge: GREEN, s: 24, scale: pop(at(w, cue, a + 3 + i)) }));
    if (p.final) pill(ctx, p.final.text, 0, 350, { bg: GREEN, c: '#0b1a11', s: 26, scale: pop(at(p.final.word, cue, a + 5)) });
    ctx.restore(); },
  answer(ctx, p, a, cue) {  // question, result: { title, sub, word }
    if (!panel(ctx, 0, 100, 640, p.height || 440, { title: p.title || 'AI answer · illustration', scale: since(a + 0.3, 0.4) })) return;
    bubble(ctx, p.question, 290, 56, { right: true, bg: BLUE, maxW: 470, progress: typed(a + 0.6, 1.6) });
    for (let i = 0; i < 3; i++) if (P.t > a + 2.2 + i * 0.2) { rr(ctx, -290, 170 + i * 30, 440 - i * 90, 14, 7); ctx.fillStyle = '#3a3d48'; ctx.fill(); }
    const k = pop(at(p.result.word, cue, a + 3));
    if (k) { ctx.save(); ctx.translate(0, 330); ctx.scale(k, k); ctx.shadowColor = GREEN; ctx.shadowBlur = 30; rr(ctx, -290, -70, 580, 140, 22); ctx.fillStyle = '#1f3b2c'; ctx.fill();
      ctx.shadowBlur = 0; ctx.lineWidth = 4; ctx.strokeStyle = GREEN; ctx.stroke(); emoji(ctx, p.result.emoji || '⛪', -230, 0, 52);
      text(ctx, p.result.title, -180, -20, { w: 800, s: 32, align: 'left' }); text(ctx, p.result.sub, -180, 22, { w: 500, s: 22, c: '#bfe9cf', align: 'left' }); ctx.restore(); }
    ctx.restore(); },
  kv(ctx, p, a, cue) {  // rows: [[emoji, text, word]]
    if (!panel(ctx, 0, 110, 560, p.height || 340, { title: p.title, edge: p.edge === 'green' ? GREEN : p.edge === 'amber' ? AMBER : undefined, scale: since(a + 0.3, 0.4) })) return;
    p.rows.forEach(([em, s, w], i) => { if (P.t < at(w, cue, a + 0.6 + i * 0.5)) return; const y = 86 + i * 58;
      emoji(ctx, em, -230, y, 32); text(ctx, s, -196, y, { w: 600, s: 25, align: 'left', c: p.warnLast && i === p.rows.length - 1 ? AMBER : TEXT }); });
    ctx.restore(); },
};

// ── camera ─────────────────────────────────────────────────────────────────
function focusIndex(t) { let k = 0; N.forEach((n, i) => { if (t >= S(cueOf(i)) - 0.45) k = i; }); return k; }
function stateOf(i, t) { const s = S(cueOf(i)), nx2 = i + 1 < N.length ? S(cueOf(i + 1)) : Infinity; return t < s ? 'idle' : t < Math.min(s + 2.2, nx2 - 0.3) ? 'run' : 'done'; }
function camera(t) {
  const k = focusIndex(t), u = ease.inOut(clamp01((t - (S(cueOf(k)) - 0.45)) / 0.7)), j = Math.max(0, k - 1), uu = k === 0 ? 1 : u;
  let x = lerp(nx(j), nx(k), uu), y = lerp(ny(j), ny(k), uu), z = 1; const y0 = y;
  const ov = Math.min(0.9 * 1080 / (GRID_W + 700), 0.9 * (BAND.y1 - BAND.y0) / (GRID_H + 700)), midX = GRID_W / 2;
  const overY = (zz) => GRID_H / 2 + 250 - ((BAND.y0 + BAND.y1) / 2 - ANCHOR.y) / zz;
  const intro = ease.inOut(clamp01((t - 0.15) / 1.0));
  if (intro < 1) { z = lerp(ov, 1, intro); x = lerp(midX, x, intro); y = lerp(overY(ov), y0, intro); }
  if (SB.loop && t >= S('loop') - 0.3) { const out = ease.inOut(clamp01((t - S('loop') + 0.3) / 1.0)); z = lerp(1, ov, out); x = lerp(x, midX, out); y = lerp(y0, overY(ov), out); }
  return { x, y, z };
}

// ── fixed parts ────────────────────────────────────────────────────────────
function headline(ctx, a, b, c) { ctx.font = FONT(800, 62); const w1 = ctx.measureText(a).width, w2 = ctx.measureText(b).width;
  const scale = Math.min(1, 1000 / (w1 + w2)), x0 = 540 - (w1 + w2) * scale / 2; ctx.save(); ctx.translate(x0, HEAD_Y); ctx.scale(scale, scale);
  text(ctx, a, 0, 0, { w: 800, s: 62, align: 'left' }); text(ctx, b, w1, 0, { w: 800, s: 62, c: CORAL, align: 'left' }); ctx.restore();
  ctx.font = FONT(800, 62); const w3 = ctx.measureText(c).width, s3 = Math.min(1, 1000 / w3); ctx.save(); ctx.translate(540, HEAD_Y + 72); ctx.scale(s3, s3); text(ctx, c, 0, 0, { w: 800, s: 62 }); ctx.restore(); }
function stepPill(ctx, t) {
  let pillData = null; N.forEach((n, i) => { if (t >= S(cueOf(i)) && n.pill) pillData = n.pill; });
  if (SB.loop && t >= S('loop')) pillData = ['', 'Back to step 1', ''];
  if (!pillData) return; const [a, b, c] = pillData;
  ctx.font = FONT(800, 24); const wa = a ? ctx.measureText(a).width + 30 : 0; ctx.font = FONT(700, 32); const wb = ctx.measureText(b).width; ctx.font = FONT(500, 26); const wc = c ? ctx.measureText(c).width : 0;
  const w = 16 + wa + (a ? 14 : 0) + wb + (c ? 16 + wc : 0) + 22, x = 540 - w / 2;
  rr(ctx, x, PILL_Y - 32, w, 64, 32); ctx.fillStyle = '#121318'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#3a3d47'; ctx.stroke();
  let cx = x + 16; if (a) { rr(ctx, cx, PILL_Y - 21, wa, 42, 21); ctx.fillStyle = CORAL; ctx.fill(); text(ctx, a, cx + wa / 2, PILL_Y + 1, { w: 800, s: 24, c: '#1a0f0e' }); cx += wa + 14; }
  text(ctx, b, cx, PILL_Y, { w: 700, s: 32, align: 'left' }); cx += wb + 16; if (c) text(ctx, c, cx, PILL_Y + 2, { w: 500, s: 26, c: SUB, align: 'left' }); }
let CHUNKS = null;
function captions(ctx, t) {
  if (!CHUNKS) { CHUNKS = []; let cur = []; P.words.forEach((w, i) => { cur.push(w); const n = P.words[i + 1];
    if (!n || cur.length >= 3 || /[.,!?;:]$/.test(w.text) || n.start - w.end > 0.3) { CHUNKS.push(cur); cur = []; } }); }
  const i = CHUNKS.findIndex((c, k) => t >= c[0].start && t < (CHUNKS[k + 1] ? CHUNKS[k + 1][0].start : c[c.length - 1].end + 0.6)); if (i < 0) return;
  const words = CHUNKS[i], lit = words.reduce((k, w, n) => (t >= w.start ? n : k), 0);
  ctx.font = FONT(800, 54); const parts = words.map((w) => w.text.replace(/[,;:]$/, '')), sp = 15;
  let size = 54, ws = parts.map((s) => ctx.measureText(s).width), W = ws.reduce((x, y) => x + y, 0) + sp * (parts.length - 1) + 60;
  if (W > 1020) { size = Math.floor(54 * 1020 / W); ctx.font = FONT(800, size); ws = parts.map((s) => ctx.measureText(s).width); W = ws.reduce((x, y) => x + y, 0) + sp * (parts.length - 1) + 60; }
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 24; rr(ctx, 540 - W / 2, CAPTION_Y - 46, W, 92, 20); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
  let x = 540 - W / 2 + 30; parts.forEach((s, n) => { text(ctx, s, x, CAPTION_Y + 2, { w: 800, s: size, c: n === lit ? CORAL : n < lit ? '#14151a' : '#9a9ca5', align: 'left' }); x += ws[n] + sp; }); }
function cta(ctx, t) {
  const a = S('cta'), [l1, l2] = SB.cta;
  text(ctx, l1, 540, HEAD_Y, { w: 800, s: 58 }); text(ctx, l2, 540, HEAD_Y + 72, { w: 800, s: 58, c: CORAL });
  const k = pop(a + 0.4); if (!k) return;
  ctx.save(); ctx.translate(540, 720); ctx.scale(k, k); rr(ctx, -410, -62, 820, 124, 62); ctx.fillStyle = '#ffffff'; ctx.fill();
  const kw = SB.keyword, tk = at(kw, 'cta', a + 3), n = Math.floor(clamp01((t - tk + 0.6) / 0.6) * kw.length), s = kw.slice(0, n);
  ctx.fillStyle = AMBER; ctx.beginPath(); ctx.arc(-350, 0, 12, 0, 7); ctx.fill();
  text(ctx, s || 'Add a comment…', -316, 2, { w: s ? 800 : 500, s: 42, c: s ? '#111' : '#9a9da6', align: 'left' });
  rr(ctx, 236, -38, 150, 76, 38); ctx.fillStyle = CORAL; ctx.fill(); text(ctx, 'Post', 311, 2, { w: 800, s: 32 }); ctx.restore();
  if (t > tk + 0.8) { text(ctx, SB.ctaSub, 540, 840, { w: 600, s: 32, c: SUB }); if (SB.ctaNote) text(ctx, SB.ctaNote, 540, 892, { w: 500, s: 26, c: '#6d717c' }); } }

// ── frame ──────────────────────────────────────────────────────────────────
Eduba.frame({ overlay: true, step: 30, draw(g, t) {
  const ctx = g.photo.ctx; ctx.fillStyle = BG; ctx.fillRect(0, 0, 1080, 1920);
  if (t >= S('cta')) { cta(ctx, t); captions(ctx, t); return; }
  headline(ctx, ...SB.headline); stepPill(ctx, t);
  const cam = camera(t), k = focusIndex(t), overview = cam.z < 0.9;
  ctx.save(); ctx.beginPath(); ctx.rect(0, BAND.y0, 1080, BAND.y1 - BAND.y0); ctx.clip();
  ctx.fillStyle = N[k].tint || '#1b2236'; ctx.fillRect(0, BAND.y0, 1080, BAND.y1 - BAND.y0);
  const gs = Math.max(12, 36 * cam.z), ox = (((ANCHOR.x - cam.x * cam.z) % gs) + gs) % gs, oy = (((ANCHOR.y - cam.y * cam.z) % gs) + gs) % gs;
  ctx.fillStyle = 'rgba(255,255,255,0.07)'; for (let y = BAND.y0 - gs + oy; y < BAND.y1; y += gs) for (let x = ox; x < 1080; x += gs) ctx.fillRect(x, y, 3, 3);
  ctx.translate(ANCHOR.x, ANCHOR.y); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  N.forEach((n, i) => { if (!i) return; const c = t >= S(cueOf(i)) - 0.45 || (overview && t > 1) ? GREEN : WIRE, x0 = nx(i - 1) + (N[i - 1].avatar ? 70 : 240);
    if (ny(i) === ny(i - 1)) hwire(ctx, x0, nx(i) - (n.avatar ? 70 : 240), ny(i), c); else rowWire(ctx, x0, ny(i - 1), nx(i) - 240, ny(i), c); });
  N.forEach((n, i) => chainNode(ctx, n, nx(i), ny(i), overview && t > 1 ? 'done' : stateOf(i, t)));
  N.forEach((n, i) => { if (!n.panel || !(overview ? (t > 1 || i === 0) : i === k)) return;
    ctx.save(); ctx.translate(nx(i), ny(i)); ctx.globalAlpha = overview ? 0.9 : clamp01((t - (S(cueOf(i)) - 0.3)) / 0.3);
    PANELS[n.panel.type](ctx, n.panel, overview && t > 1 ? -1e3 : S(cueOf(i)), cueOf(i)); ctx.restore(); });
  ctx.restore();
  let gr = ctx.createLinearGradient(0, BAND.y0, 0, BAND.y0 + 50); gr.addColorStop(0, BG); gr.addColorStop(1, 'rgba(23,24,29,0)'); ctx.fillStyle = gr; ctx.fillRect(0, BAND.y0, 1080, 50);
  gr = ctx.createLinearGradient(0, BAND.y1 - 50, 0, BAND.y1); gr.addColorStop(0, 'rgba(23,24,29,0)'); gr.addColorStop(1, BG); ctx.fillStyle = gr; ctx.fillRect(0, BAND.y1 - 50, 1080, 50);
  if (SB.label) text(ctx, SB.label, 540, 1488, { w: 500, s: 20, c: '#555963' });
  captions(ctx, t);
} });
})();
