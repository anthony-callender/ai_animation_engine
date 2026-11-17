// scene.js: truthly-application (16:9). Same kit and format as upwork-intro; scenes mapped to the role (ownership, debugging, data accuracy, integrations, idempotency, AI, communication).
// Employer and client stay unnamed on screen. Real clips c2-c4 are blurred copies; publication gate: client permission.
const { ease } = P;
const S = (id) => P.cue(id).start;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, p) => a + (b - a) * p;
P.wait(Promise.all(['500', '600', '700', '800'].map((w) => document.fonts.load(`${w} 40px Inter`))));

// ── look ───────────────────────────────────────────────────────────────────
const BG = '#0b0b0e', DOT = '#1b1c22', CARD = '#141519', EDGE = '#2c2e37', TEXT = '#f4f4f6', SUB = '#8d909c';
const LAV = '#a78bfa', LAV2 = '#7c5cf0', GREEN = '#22c55e', RED = '#ef4444', GOLD = '#e8b931', PAPERW = '#f6f6f4';
const FONT = (w, s) => `${w} ${s}px Inter, "Segoe UI", Arial, sans-serif`;
const EMOJI = (s) => `${s}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
const CX = 800, CAP_Y = 985, END_T = 153.2;

// ── helpers ────────────────────────────────────────────────────────────────
const since = (t0, d = 0.3) => clamp01((P.t - t0) / d);
const pop = (t0, d = 0.32) => { const k = since(t0, d); return k <= 0 ? 0 : ease.back(k); };
const typed = (t0, d) => clamp01((P.t - t0) / d);
const at = (w, cue, fb) => { const v = P.at(w, cue); return Number.isFinite(v) ? v : fb; };
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function txt(ctx, s, x, y, o = {}) { ctx.font = FONT(o.w || 600, o.s || 32); ctx.fillStyle = o.c || TEXT; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); }
function emoji(ctx, s, x, y, size) { ctx.font = EMOJI(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(s, x, y); }
function wrap(ctx, s, maxW, w, size) { ctx.font = FONT(w, size); const out = []; let line = '';
  for (const word of s.split(' ')) { const t = line ? line + ' ' + word : word; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = word; } else line = t; }
  if (line) out.push(line); return out; }
// a card centred on (x, y); returns false when not yet visible. Caller must ctx.restore() when true.
function card(ctx, x, y, w, h, o = {}) {
  const k = o.scale ?? 1; if (k <= 0) return false;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.globalAlpha *= (o.alpha ?? 1) * Math.min(1, k * 1.5);
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 40; }
  rr(ctx, -w / 2, -h / 2, w, h, o.r || 26); ctx.fillStyle = o.fill || CARD; ctx.fill(); ctx.shadowBlur = 0;
  ctx.lineWidth = o.lw || 3; ctx.strokeStyle = o.edge || EDGE; ctx.stroke(); return true;
}
function orb(ctx, x, y, r, o = {}) {
  const k = o.scale ?? 1; if (k <= 0) return; r *= k;
  ctx.save(); ctx.shadowColor = LAV; ctx.shadowBlur = r * 1.1 + Math.sin(P.t * 3) * 6;
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, '#e9e0ff'); g.addColorStop(0.45, LAV); g.addColorStop(1, LAV2);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.restore();
}
function check(ctx, x, y, r = 22, k = 1) { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = GREEN; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.strokeStyle = '#06210f'; ctx.lineWidth = r / 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-r * 0.45, 0); ctx.lineTo(-r * 0.1, r * 0.35); ctx.lineTo(r * 0.5, -r * 0.35); ctx.stroke(); ctx.restore(); }
function cross(ctx, x, y, r = 22, k = 1) { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.strokeStyle = '#2a0707'; ctx.lineWidth = r / 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-r * 0.38, -r * 0.38); ctx.lineTo(r * 0.38, r * 0.38); ctx.moveTo(r * 0.38, -r * 0.38); ctx.lineTo(-r * 0.38, r * 0.38); ctx.stroke(); ctx.restore(); }
function chip(ctx, s, x, y, o = {}) { const k = o.scale ?? 1; if (k <= 0) return; const size = o.s || 34; ctx.font = FONT(700, size);
  const w = ctx.measureText(s).width + 56, h = size + 34; ctx.save(); ctx.translate(x, y); ctx.rotate((o.rot || 0) * Math.PI / 180); ctx.scale(k, k);
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 30; }
  rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = o.bg || '#1e1f26'; ctx.fill(); ctx.shadowBlur = 0; ctx.lineWidth = 3; ctx.strokeStyle = o.edge || EDGE; ctx.stroke();
  txt(ctx, s, 0, 2, { w: 700, s: size, c: o.c || TEXT }); ctx.restore(); }
function cursor(ctx, x, y) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 46); ctx.lineTo(12, 35); ctx.lineTo(22, 56); ctx.lineTo(30, 52); ctx.lineTo(20, 32); ctx.lineTo(36, 32); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
function label(ctx, s) { txt(ctx, s, CX, 915, { w: 500, s: 24, c: '#6b6f80' }); }
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const count = (t0, d, to) => to * ease.out(clamp01((P.t - t0) / d));

// ── Tony's talking head ─────────────────────────────────────────────────────
// The canvas draws only the frame and ring; Tony's real video (01_voice/source/tony-cut.mp4, vertical) is composited
// afterwards with ffmpeg (05_render/composite_head.py) at these exact boxes, so the browser never loads thousands of frames.
const PR = { x: 120, y: 40, w: 562, h: 1000, r: 28 };     // intro: portrait card on the left
const BUB = { x: 1730, y: 875, r: 165 };                  // corner bubble
const ENDB = { x: 560, y: 540, r: 230 };                  // end card
function talkingHead(ctx, t) {
  const a = S('platform'), m = ease.inOut(clamp01((t - a) / 0.6)), e = ease.inOut(clamp01((t - END_T) / 0.6));
  const port = { x: PR.x + PR.w / 2, y: PR.y + PR.h / 2, w: PR.w, h: PR.h, r: PR.r };
  const bub = { x: BUB.x, y: BUB.y, w: BUB.r * 2, h: BUB.r * 2, r: BUB.r }, end = { x: ENDB.x, y: ENDB.y, w: ENDB.r * 2, h: ENDB.r * 2, r: ENDB.r };
  const A = t < END_T ? port : bub, B = t < END_T ? bub : end, f = t < END_T ? m : e;
  const b = { x: lerp(A.x, B.x, f), y: lerp(A.y, B.y, f), w: lerp(A.w, B.w, f), h: lerp(A.h, B.h, f), r: lerp(A.r, B.r, f) };
  ctx.save(); ctx.shadowColor = 'rgba(167,139,250,0.55)'; ctx.shadowBlur = 40; rr(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, b.r); ctx.fillStyle = '#000'; ctx.fill(); ctx.restore();
  ctx.save(); ctx.lineWidth = 6; ctx.strokeStyle = LAV; rr(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, b.r); ctx.stroke(); ctx.restore();
  if (t < a + 0.3) {  // intro: name + title to the right of the portrait
    const k = since(0.3, 0.4) * (1 - since(a, 0.3)); if (k <= 0) return;
    ctx.save(); ctx.globalAlpha = k; ctx.translate((1 - k) * 40, 0);
    chip(ctx, 'Hi Edward & the Truthly team 👋', 1210, 150, { s: 34, bg: LAV2, edge: LAV, c: '#fff' });
    txt(ctx, 'Tony Callender', 780, 330, { w: 800, s: 96, align: 'left' }); ctx.fillStyle = LAV; ctx.fillRect(780, 400, 120, 8);
    txt(ctx, 'Backend & AI Engineer', 780, 460, { w: 600, s: 44, c: '#c9c3e6', align: 'left' });
    txt(ctx, 'Rails · Integrations · Data repairs · AI agents', 780, 520, { w: 500, s: 32, c: SUB, align: 'left' }); ctx.restore();
  }
}
// ── real work frame (source rect so wide clips can be cropped) ───────────────
const C2 = Desk.clip('c2'), C3 = Eduba.image('assets/c3-status-chart.png'), C4 = Eduba.image('assets/c4-report.png');
function realFrame(ctx, img, sx, sy, sw, sh, cx, cy, w, tag, k) {
  if (k <= 0) return; const h = w * sh / sw, x = cx - w / 2, y = cy - h / 2;
  ctx.save(); ctx.globalAlpha *= Math.min(1, k * 1.4); ctx.translate(cx, cy); ctx.scale(0.92 + 0.08 * k, 0.92 + 0.08 * k); ctx.translate(-cx, -cy);
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 50; rr(ctx, x - 6, y - 50, w + 12, h + 56, 20); ctx.fillStyle = '#1e1f26'; ctx.fill(); ctx.shadowBlur = 0;
  [RED, GOLD, GREEN].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 26 + i * 26, y - 25, 8, 0, 7); ctx.fill(); });
  chip(ctx, '● REAL WORK', x + w - 110, y - 25, { s: 22, bg: '#2a0d10', edge: RED, c: '#ffd0d0' });
  ctx.save(); rr(ctx, x, y, w, h, [0, 0, 14, 14]); ctx.clip();
  if (img && img.complete && img.naturalWidth) ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h); ctx.restore();
  txt(ctx, tag, cx, y + h + 34, { w: 500, s: 24, c: '#7d8092' });
  ctx.restore();
}
function arrow(ctx, x1, y1, x2, y2, f, col = LAV) { if (f <= 0) return; ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.setLineDash([12, 10]); ctx.lineDashOffset = -P.t * 40;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(lerp(x1, x2, f), lerp(y1, y2, f)); ctx.stroke(); ctx.restore(); }

function node(ctx, x, y, w, h, e, s, sub, k, o = {}) {
  if (!card(ctx, x, y, w, h, { scale: k, edge: o.edge || EDGE, glow: o.glow })) return;
  if (e === 'orb') orb(ctx, -w / 2 + 70, 0, 38); else emoji(ctx, e, -w / 2 + 70, 0, 56);
  txt(ctx, s, -w / 2 + 125, sub ? -18 : 0, { w: 700, s: 32, align: 'left' }); if (sub) txt(ctx, sub, -w / 2 + 125, 24, { w: 500, s: 24, c: SUB, align: 'left' });
  ctx.restore();
}
const SCENES = {
  intro() {},
  platform(ctx) {
    const a = S('platform'), t1 = at('163', 'platform', a + 5), t2 = at('17,000', 'platform', a + 6.5), t3 = at('1.6', 'platform', a + 8);
    chip(ctx, '💎  Production Ruby on Rails', CX, 140, { scale: pop(a + 0.4), s: 34, bg: '#2a0d10', edge: RED, c: '#ffd0d0' });
    txt(ctx, 'A compliance platform serving', CX, 250, { w: 600, s: 38, c: SUB, });
    [['⛪', t1, (v) => fmt(v), 163, 'dioceses'], ['🏫', t2, (v) => fmt(v) + '+', 17000, 'churches & schools'], ['👥', t3, (v) => (v / 1e6).toFixed(1) + 'M', 1600000, 'registered users']].forEach(([e, t0, f, to, s], i) => {
      if (card(ctx, 320 + i * 480, 560, 420, 360, { scale: pop(t0), edge: [LAV, GOLD, GREEN][i] })) {
        emoji(ctx, e, 0, -95, 80); txt(ctx, f(count(t0, 1.0, to)), 0, 20, { w: 800, s: 84 }); txt(ctx, s, 0, 105, { w: 500, s: 32, c: SUB }); ctx.restore(); } });
  },
  inbox(ctx) {
    const a = S('inbox'), ow = at('owned', 'inbox', a + 1.4), mi = at('million', 'inbox', a + 4.8), ms = at('messages.', 'inbox', a + 6.5);
    chip(ctx, 'OWNED END TO END', CX, 130, { scale: pop(ow), s: 36, bg: '#1a1630', edge: LAV, c: '#e4dcff', rot: -2, glow: LAV });
    const fixed = since(ms + 0.2, 0.3);
    if (card(ctx, 460, 560, 600, 520, { scale: pop(a + 0.3) })) {
      txt(ctx, '📥  Inbox', -270, -220, { w: 700, s: 32, align: 'left' });
      ctx.save(); rr(ctx, -280, -185, 560, 420, 12); ctx.clip();
      const e = Math.min(P.t, ms + 0.2) - a, sp = e * (2 + e * 2.2);
      for (let i = -1; i < 8; i++) { const y = -185 + ((i * 60 + sp * 60) % 540) - 60; ctx.globalAlpha = 1 - fixed * 0.85;
        rr(ctx, -270, y, 540, 50, 10); ctx.fillStyle = '#1e1f26'; ctx.fill(); ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(-245, y + 25, 6, 0, 7); ctx.fill();
        rr(ctx, -225, y + 14, 140 + ((i * 53) & 127), 10, 5); ctx.fillStyle = '#4a4e5c'; ctx.fill(); rr(ctx, -225, y + 30, 260, 8, 4); ctx.fillStyle = '#30333d'; ctx.fill(); }
      ctx.restore(); ctx.globalAlpha = 1;
      chip(ctx, '✓ FIXED', 0, 30, { scale: pop(ms + 0.2), s: 56, bg: '#11261a', edge: GREEN, c: '#bff5d2', rot: -6, glow: GREEN });
      ctx.restore();
    }
    const n = count(mi - 1.4, 1.4, 2300000);
    if (P.t > mi - 1.4) { txt(ctx, fmt(n), 1170, 500, { w: 800, s: 110, c: n >= 2299999 ? '#fff' : LAV }); txt(ctx, 'unnecessary inbox messages', 1170, 590, { w: 600, s: 34, c: SUB }); }
  },
  records(ctx) {
    const a = S('records'), n = at('9,231', 'records', a + 0.8), ev = at('every', 'records', a + 5.5);
    const sweep = clamp01((P.t - n) / 3.2);
    if (card(ctx, 470, 500, 640, 560, { scale: pop(a + 0.1) })) {
      txt(ctx, 'Records', -290, -240, { w: 700, s: 30, align: 'left' });
      for (let r = 0; r < 12; r++) for (let c = 0; c < 16; c++) { const ok = (c + r * 16) / 192 < sweep;
        rr(ctx, -290 + c * 36.5, -195 + r * 37, 30, 30, 6); ctx.fillStyle = ok ? GREEN : ((r * 7 + c * 3) % 5 ? '#7a2a2a' : RED); ctx.fill(); }
      ctx.restore();
    }
    if (P.t > n - 0.2) { txt(ctx, fmt(count(n - 0.2, 3.0, 9231)), 1170, 400, { w: 800, s: 120, c: GREEN }); txt(ctx, 'background-check records', 1170, 495, { w: 600, s: 34, c: TEXT }); txt(ctx, 'repaired', 1170, 545, { w: 600, s: 34, c: SUB }); }
    chip(ctx, 'Every record has to be right', 1170, 680, { scale: pop(ev), s: 32, bg: '#11261a', edge: GREEN, c: '#bff5d2' });
  },
  integ(ctx) {
    const a = S('integ'), bs = at('background-screening', 'integ', a + 1.5), mv = at('motor', 'integ', a + 2.8), rs = at('REST', 'integ', a + 4.8), wh = at('webhooks', 'integ', a + 6.6);
    node(ctx, 330, 470, 400, 150, '💎', 'Rails app', 'production', pop(a + 0.3), { edge: RED });
    node(ctx, 1230, 330, 470, 140, '🔎', 'Screening vendor', 'background checks', pop(bs));
    node(ctx, 1230, 610, 470, 140, '🚗', 'MVR vendor', 'motor vehicle records', pop(mv));
    [[330, bs], [610, mv]].forEach(([y, t0]) => { arrow(ctx, 535, 470, 990, y, since(t0 + 0.2, 0.4));
      if (P.t > rs) chip(ctx, 'REST · SOAP', 760, lerp(470, y, 0.5) - 26, { scale: pop(rs), s: 22, bg: '#1a1630', edge: LAV, c: '#e4dcff' }); });
    if (P.t > wh) { const f = (P.t - wh) % 1.6 / 1.6, x = lerp(990, 540, f), y = lerp(610, 500, f);
      ctx.save(); ctx.strokeStyle = GOLD; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(990, 640); ctx.lineTo(540, 510); ctx.stroke(); ctx.restore();
      emoji(ctx, '⚡', x, y + 20, 44); chip(ctx, 'webhook', 760, 640, { scale: pop(wh), s: 24, bg: '#2a2410', edge: GOLD, c: GOLD }); }
    label(ctx, 'Simplified architecture illustration');
  },
  race(ctx) {
    const a = S('race'), sm = at('same', 'race', a + 1.8), du = at('duplicate', 'race', a + 3.6), id = at('idempotent', 'race', a + 5.0), on = at('one', 'race', a + 8.5);
    [0, 1].forEach((i) => { const t0 = i ? sm : a + 0.3, f = ease.out(clamp01((P.t - t0) / 0.6)) * (P.t > id + 0.4 ? 1 : 1); if (P.t < t0) return;
      const x = lerp(120, 330, f), y = 330 + i * 200;
      if (card(ctx, x + 110, y, 380, 120, { r: 18, edge: GOLD })) { emoji(ctx, '⚡', -140, 0, 44); txt(ctx, 'event #4821', -100, -18, { w: 700, s: 28, align: 'left' }); txt(ctx, 'status: complete', -100, 20, { w: 500, s: 24, c: SUB, align: 'left' }); ctx.restore(); }
      arrow(ctx, 640, y, 820, 430, since(id, 0.4), i ? RED : GOLD); });
    if (P.t > sm + 0.3) chip(ctx, 'same event, twice', 440, 210, { scale: pop(sm + 0.3), s: 26, bg: '#2a0d10', edge: RED, c: '#ffd0d0', rot: -3 });
    if (card(ctx, 960, 430, 260, 220, { scale: pop(du), edge: LAV, glow: 'rgba(167,139,250,0.35)' })) {
      emoji(ctx, '🔑', 0, -40, 70); txt(ctx, 'Idempotency', 0, 40, { w: 800, s: 28, c: '#e4dcff' }); txt(ctx, 'check', 0, 76, { w: 500, s: 24, c: SUB }); ctx.restore(); }
    arrow(ctx, 1095, 430, 1270, 430, since(id + 0.6, 0.4), GREEN);
    if (card(ctx, 1450, 430, 340, 150, { scale: pop(id + 0.9), edge: GREEN })) { txt(ctx, '1 record', 0, -20, { w: 800, s: 40, c: '#bff5d2' }); txt(ctx, 'correct', 0, 26, { w: 500, s: 26, c: SUB }); check(ctx, 140, -50, 22, pop(on)); ctx.restore(); }
    chip(ctx, 'duplicate ignored', 960, 640, { scale: pop(id + 1.2), s: 26, bg: '#1e1f26', edge: EDGE, c: SUB });
    label(ctx, 'Illustration');
  },
  agent(ctx) {
    const a = S('agent'), q = at('questions', 'agent', a + 4.2), tk = at('ticket', 'agent', a + 7.6), db = at('dashboard,', 'agent', a + 9.7), dc = at('decided', 'agent', a + 13.6);
    chip(ctx, 'AI analytics agent', CX, 120, { scale: pop(dc), s: 38, bg: '#1a1630', edge: LAV, c: '#e4dcff', glow: LAV });
    if (card(ctx, 300, 300, 360, 170, { scale: pop(a + 2.4) })) { emoji(ctx, '👔', -110, 0, 76); txt(ctx, 'Leaders', -45, 0, { w: 700, s: 38, align: 'left' }); ctx.restore(); }
    if (card(ctx, 830, 300, 600, 150, { scale: pop(q - 0.3), fill: PAPERW, edge: '#d9d9d6' })) {
      const s = 'How many cases are still open this month?', n = Math.ceil(typed(q - 0.1, 1.4) * s.length);
      wrap(ctx, s, 540, 600, 32).reduce((left, l, i) => { txt(ctx, l.slice(0, Math.max(0, left)), -270, -20 + i * 42, { w: 600, s: 32, c: '#111', align: 'left' }); return left - l.length - 1; }, n); ctx.restore(); }
    const stackN = P.t < tk ? 0 : Math.min(9, 1 + Math.floor((P.t - tk) * 2.2)), dim = P.t > dc ? 0.35 : 1;
    for (let i = 0; i < stackN; i++) { ctx.save(); ctx.globalAlpha *= dim; const x = 380 + i * 22, y = 560 + i * 26;
      if (card(ctx, x, y, 420, 90, { r: 14, scale: pop(tk + i / 2.2, 0.25) })) { emoji(ctx, '🎫', -170, 0, 40); txt(ctx, 'Report request #' + (311 + i * 7), -130, 0, { w: 600, s: 26, align: 'left' }); ctx.restore(); } ctx.restore(); }
    chip(ctx, 'Not in the dashboard', 1060, 560, { scale: pop(db) * dim, s: 30, bg: '#2a0d10', edge: RED, c: '#ffd0d0', rot: -3 });
    if (P.t > dc) { orb(ctx, 1200, 720, 70, { scale: pop(dc + 0.2) }); txt(ctx, 'Ask it directly', 1200, 830, { w: 700, s: 32, c: LAV }); arrow(ctx, 860, 380, 1150, 650, since(dc + 0.4, 0.5)); }
    label(ctx, 'Illustration');
  },
  clip2(ctx) {
    const a = S('clip2');
    realFrame(ctx, C2.at(P.t - a + 0.5), 0, 95, 720, 375, CX, 470, 1180, 'The agent at work · client wording blurred', ease.out(since(a, 0.35)));
  },
  report(ctx) {
    const a = S('report'), end = S('guard'), w = 1100, h = 640, viewH = 1180 * h / w;
    const q = ease.inOut(clamp01((P.t - a - 0.2) / (end - a - 0.6)));
    realFrame(ctx, C4, 0, q * (1630 - viewH), 1180, viewH, CX, 480, w, 'Its report, with its definitions · numbers blurred', ease.out(since(a, 0.35)));
  },
  guard(ctx) {
    const a = S('guard'), ch = at("can't", 'guard', a + 1.8);
    if (card(ctx, 420, 260, 460, 240, { scale: pop(a + 0.1), edge: GREEN, glow: 'rgba(34,197,94,0.3)' })) {
      emoji(ctx, '🛡️', 0, -40, 90); txt(ctx, 'READ-ONLY GUARD', 0, 75, { w: 800, s: 34, c: '#bff5d2' }); ctx.restore(); }
    [['SELECT … FROM cases', a + 0.7, true], ['DELETE FROM cases', ch, false]].forEach(([s, t0, ok], i) => {
      if (card(ctx, 420, 520 + i * 140, 640, 110, { scale: pop(t0), edge: ok ? EDGE : RED })) {
        ctx.font = '600 32px Consolas, "Cascadia Mono", monospace'; ctx.fillStyle = ok ? '#d6d8e2' : '#ffd0d0'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(s, -290, 0);
        if (ok) check(ctx, 270, 0, 26, pop(t0 + 0.3)); else cross(ctx, 270, 0, 26, pop(t0 + 0.3)); ctx.restore(); } });
    realFrame(ctx, C3, 0, 0, 900, 560, 1140, 470, 660, 'A chart from its report · values blurred', ease.out(since(a + 0.6, 0.4)));
  },
  people(ctx) {
    const a = S('people'), mg = at('managers,', 'people', a + 1.8), wr = at('wrote', 'people', a + 2.3), so = at('sign', 'people', a + 5.0), te = at('tested', 'people', a + 6.0);
    node(ctx, 260, 420, 360, 150, '👔', 'Managers', null, pop(mg));
    arrow(ctx, 445, 420, 565, 420, since(wr, 0.4));
    if (card(ctx, 800, 420, 440, 300, { scale: pop(wr), edge: GOLD })) {
      txt(ctx, 'How we define', -190, -110, { w: 700, s: 28, c: GOLD, align: 'left' }); txt(ctx, 'our numbers', -190, -74, { w: 700, s: 28, c: GOLD, align: 'left' });
      for (let i = 0; i < 3; i++) { rr(ctx, -190, -30 + i * 44, 330 - i * 50, 18, 6); ctx.fillStyle = '#3a3420'; ctx.fill(); }
      if (P.t > so) { chip(ctx, '✍️ Signed off', 60, 115, { scale: pop(so), s: 26, bg: '#11261a', edge: GREEN, c: '#bff5d2', rot: -4 }); }
      ctx.restore(); }
    arrow(ctx, 1025, 420, 1150, 420, since(te, 0.4));
    node(ctx, 1360, 420, 380, 150, 'orb', 'AI tested', 'against it', pop(te + 0.2), { edge: LAV });
    chip(ctx, 'Customer communication', CX, 700, { scale: pop(a + 0.3), s: 30, c: SUB });
  },
  meta(ctx) {
    const a = S('meta'), mj = at('Midjourney,', 'meta', a + 4.7), st = at('stock', 'meta', a + 6);
    const wait = 1 - since(mj - 0.3, 0.3);
    if (wait > 0) { ctx.save(); ctx.globalAlpha *= wait; txt(ctx, '🤔', CX, 360, { w: 400, s: 160 }); txt(ctx, 'Wait… this video?', CX, 540, { w: 800, s: 72 });
      if (P.t > a + 1.9) txt(ctx, 'Made with AI. Just not the usual way.', CX, 630, { w: 600, s: 38, c: LAV }); ctx.restore(); }
    [['🎨', 'AI image & video generators', mj], ['🎞️', 'Generated stock footage', st]].forEach(([e, s, t0], i) => {
      if (card(ctx, 420 + i * 760, 470, 660, 260, { scale: pop(t0), alpha: 0.85 })) { emoji(ctx, e, 0, -50, 80); txt(ctx, s, 0, 60, { w: 700, s: 36, c: SUB }); ctx.restore();
        const k = since(t0 + 0.4, 0.3); if (k > 0) { ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 8; ctx.lineCap = 'round'; const x0 = 420 + i * 760 - 300;
          ctx.beginPath(); ctx.moveTo(x0, 470); ctx.lineTo(x0 + 600 * k, 470); ctx.stroke(); ctx.restore(); cross(ctx, 420 + i * 760 + 300, 360, 30, pop(t0 + 0.4)); } } });
  },
  code(ctx) {
    const a = S('code'), dr = at('draws', 'code', a + 2.2), bx = at('box,', 'code', a + 3.3), nm = at('number,', 'code', a + 4.1), tw = at('timed', 'code', a + 4.6),
      pr = at('precise,', 'code', a + 8.6), on = at('only', 'code', a + 12.4);
    const lines = [["// I use AI to write code. The code draws the frame.", a + 0.3, '#6b6f80'], ["card(ctx, 1290, 380, 420, 260)", bx - 0.6, '#d6d8e2'],
      ["txt(ctx, '9,231', 1290, 360)", nm - 0.5, '#d6d8e2'], ["check(ctx, 1450, 290)", nm + 0.4, '#d6d8e2'], ["at('timed')  // synced to my voice", tw, '#bff5d2']];
    if (card(ctx, 470, 400, 860, 440, { scale: pop(a + 0.1) })) {
      [RED, GOLD, GREEN].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(-400 + i * 26, -190, 8, 0, 7); ctx.fill(); });
      txt(ctx, 'scene.js', 400, -190, { w: 600, s: 22, c: SUB, align: 'right' });
      lines.forEach(([s, t0, c], i) => { const n = Math.ceil(typed(t0, 0.8) * s.length); if (n <= 0) return;
        ctx.font = '500 26px Consolas, "Cascadia Mono", monospace'; ctx.fillStyle = c; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(s.slice(0, n), -400, -120 + i * 62); });
      ctx.restore(); }
    arrow(ctx, 920, 400, 1060, 400, since(dr, 0.4));
    if (card(ctx, 1290, 380, 420, 260, { scale: pop(bx) })) { if (P.t > nm) txt(ctx, '9,231', 0, -20, { w: 800, s: 90, c: GREEN }); check(ctx, 160, -90, 26, pop(nm + 0.5));
      if (P.t > tw) { for (let i = 0; i < 24; i++) { const h = 10 + Math.abs(Math.sin(i * 1.7 + P.t * 6)) * 34; rr(ctx, -170 + i * 14.5, 80 - h / 2, 8, h, 4); ctx.fillStyle = LAV; ctx.fill(); } }
      ctx.restore(); }
    chip(ctx, '✓ Precise, predictable, on cue', 640, 720, { scale: pop(pr), s: 32, bg: '#11261a', edge: GREEN, c: '#bff5d2', rot: -2 });
    chip(ctx, '✗ Generic AI look', 1180, 720, { scale: pop(pr + 1.5), s: 32, bg: '#2a0d10', edge: RED, c: '#ffd0d0', rot: 2 });
    if (P.t > on) chip(ctx, 'My part: show up and talk 👉', 1200, 830, { scale: pop(on), s: 32, bg: '#2a2410', edge: GOLD, c: GOLD, rot: -3 });
  },
  mission(ctx) {
    const a = S('mission'), mi = at('mission,', 'mission', a + 4.2), og = at('organizations', 'mission', a + 8), or = at('oriented', 'mission', a + 10.5);
    txt(ctx, 'Why Truthly?', CX, 150, { w: 800, s: 72 });
    [['🧭', 'A mission, not just a product', mi, LAV], ['🤝', 'Organizations that serve people', og, GOLD], ['🎯', 'Mission-oriented teams', or, GREEN]].forEach(([e, s, t0, c], i) => {
      if (card(ctx, CX, 330 + i * 190, 820, 160, { scale: pop(t0), edge: c })) { emoji(ctx, e, -330, 0, 64); txt(ctx, s, -270, 0, { w: 700, s: 38, align: 'left' }); ctx.restore(); } });
  },
  faith(ctx) {
    const a = S('faith'), sv = at('serve', 'faith', a + 3.5), te = at('technology.', 'faith', a + 6.5);
    const k = pop(a + 0.2, 0.4);
    if (k > 0) { ctx.save(); ctx.translate(CX, 330); ctx.scale(k, k); ctx.shadowColor = GOLD; ctx.shadowBlur = 50; ctx.fillStyle = GOLD; ctx.fillRect(-14, -120, 28, 240); ctx.fillRect(-80, -60, 160, 28); ctx.restore(); }
    chip(ctx, 'Anglican', CX, 520, { scale: pop(a + 0.6), s: 34, bg: '#2a2410', edge: GOLD, c: GOLD });
    if (P.t > sv) { ctx.save(); ctx.globalAlpha *= since(sv, 0.4); txt(ctx, 'Serve Christendom at its best', CX, 650, { w: 800, s: 60 }); ctx.restore(); }
    if (P.t > te) { ctx.save(); ctx.globalAlpha *= since(te, 0.4); txt(ctx, 'with technology', CX, 730, { w: 700, s: 48, c: LAV }); ctx.restore(); }
  },
  close(ctx, t) {
    const a = S('close'), ca = at('call', 'close', a + 4.2), ty = at('Thank', 'close', a + 9.8);
    txt(ctx, 'What I bring', CX, 140, { w: 700, s: 40, c: SUB });
    [['🧭  Ownership', LAV, '#1a1630'], ['🐞  Careful debugging', RED, '#2a0d10'], ['✅  Accurate data', GREEN, '#11261a'], ['🤖  Practical AI', GOLD, '#2a2410']].forEach(([s, c, bg], i) =>
      chip(ctx, s, i % 2 ? 1120 : 480, 260 + Math.floor(i / 2) * 160, { scale: pop(a + 0.3 + i * 0.35), s: 44, bg, edge: c, rot: [-2, 2, 1, -1][i] }));
    chip(ctx, '📞  Let\'s hop on a call', CX, 640, { scale: pop(ca), s: 50, bg: LAV2, edge: LAV, c: '#fff', glow: 'rgba(167,139,250,0.6)' });
    if (P.t > ty) txt(ctx, 'Thank you 🙏', CX, 790, { w: 700, s: 44, c: TEXT });
  },
};
SCENES.close = ((orig) => (ctx, t) => { if (t >= END_T) { const k = since(END_T + 0.4, 0.4); if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = k; txt(ctx, 'Tony Callender', 880, 470, { w: 800, s: 76, align: 'left' });
  txt(ctx, 'Backend & AI Engineer', 880, 550, { w: 600, s: 36, c: LAV, align: 'left' }); txt(ctx, 'Rails · Integrations · Data repairs · AI agents', 880, 600, { w: 500, s: 32, c: SUB, align: 'left' });
  ctx.restore(); chip(ctx, 'Thanks, Edward 👋', 1060, 700, { scale: pop(END_T + 0.7), s: 36, bg: LAV2, edge: LAV, c: '#fff' }); return; } orig(ctx, t); })(SCENES.close);

// ── captions ────────────────────────────────────────────────────────────────
let CHUNKS = null;
function captions(ctx, t) {
  if (!CHUNKS) { CHUNKS = []; let cur = [];
    P.words.forEach((w, i) => { cur.push(w); const n = P.words[i + 1];
      if (!n || cur.length >= 5 || /[.,!?;:"]$/.test(w.text) || n.start - w.end > 0.3) { CHUNKS.push(cur); cur = []; } }); }
  const i = CHUNKS.findIndex((c, k) => t >= c[0].start && t < (CHUNKS[k + 1] ? CHUNKS[k + 1][0].start : c[c.length - 1].end + 0.5));
  if (i < 0) return;
  const s = CHUNKS[i].map((w) => w.text).join(' ').replace(/[,;:]$/, '').replace('background check', 'background-check');
  const full = t < S('platform'), MW = full ? 1000 : 1300; ctx.font = FONT(800, 56); let size = 56; const W = ctx.measureText(s).width; if (W > MW) size = Math.floor(56 * MW / W);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 18; txt(ctx, s, full ? 1290 : CX, full ? 820 : CAP_Y, { w: 800, s: size }); ctx.restore();
}

// ── the frame ───────────────────────────────────────────────────────────────
const ORDER = Object.keys(SCENES);
Eduba.frame({ overlay: true, step: 30, draw(g, t) {
  const ctx = g.photo.ctx;
  ctx.fillStyle = BG; ctx.fillRect(0, 0, 1920, 1080);
  ctx.fillStyle = DOT; for (let y = 20; y < 1080; y += 44) for (let x = 20; x < 1920; x += 44) ctx.fillRect(x, y, 3, 3);
  let id = ORDER[0]; for (const k of ORDER) if (t >= S(k)) id = k;
  const k = id === ORDER[0] ? 1 : ease.out(clamp01((t - S(id)) / 0.28));
  ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 30); SCENES[id](ctx, t); ctx.restore();
  talkingHead(ctx, t);
  if (t < END_T) captions(ctx, t);
} });
