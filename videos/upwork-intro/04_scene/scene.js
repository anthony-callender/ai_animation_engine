// scene.js: upwork-intro (16:9). Dark UI kit + Tony's real talking head (full screen, then a corner bubble) + real clips c1-c4.
// Outcomes and numbers come from Tony's Upwork profile copy. Clients stay unnamed. Publication gate: client permission for the real clips.
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
const CX = 800, CAP_Y = 985, END_T = 75.7;

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

// ── Tony's talking head (placeholder until he records) ──────────────────────
// After recording: `python anim.py real upwork-intro clip <his video> --as head --start 0 --end <len> --fps 30 --width 960`,
// and the video's audio becomes 01_voice/voice.mp3 (then transcribe, cues, render).
const HEADV = (window.REAL && REAL.clips && REAL.clips.head) ? Desk.clip('head') : null;
const BUB = { x: 1730, y: 875, r: 165 };
function headFeed(ctx, x, y, w, h) {
  const img = HEADV && HEADV.at(P.t);
  if (img && img.complete && img.naturalWidth) {
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight), iw = img.naturalWidth * s, ih = img.naturalHeight * s;
    ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) * 0.35, iw, ih); return;
  }
  const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, '#2b2540'); g.addColorStop(1, '#121019');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const cx = x + w / 2, u = Math.min(w, h * 0.9);
  ctx.fillStyle = '#463d63'; ctx.beginPath(); ctx.arc(cx, y + h * 0.42, u * 0.2, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, y + h * 0.42 + u * 0.62, u * 0.42, u * 0.36, 0, Math.PI, 0); ctx.fill();
  if (w > 800) { txt(ctx, 'TALKING HEAD', cx, y + h * 0.12, { w: 800, s: 50, c: '#8f86b8' }); txt(ctx, 'placeholder · Tony records this', cx, y + h * 0.12 + 56, { w: 500, s: 28, c: '#6f6890' }); }
}
function talkingHead(ctx, t) {
  const a = S('inbox'), m = ease.inOut(clamp01((t - a) / 0.6)), e = ease.inOut(clamp01((t - END_T) / 0.6));
  const full = { x: 960, y: 540, w: 1920, h: 1080, r: 0 }, bub = { x: BUB.x, y: BUB.y, w: BUB.r * 2, h: BUB.r * 2, r: BUB.r };
  const end = { x: 560, y: 540, w: 460, h: 460, r: 230 };
  const A = t < END_T ? full : bub, B = t < END_T ? bub : end, f = t < END_T ? m : e;
  let b = { x: lerp(A.x, B.x, f), y: lerp(A.y, B.y, f), w: lerp(A.w, B.w, f), h: lerp(A.h, B.h, f), r: lerp(A.r, B.r, f) };
  const on = at('only', 'meta', S('meta') + 4.5);
  if (t > on && t < on + 2) { const p = 1 + 0.07 * Math.abs(Math.sin((t - on) * 5)); b = { x: b.x, y: b.y, w: b.w * p, h: b.h * p, r: b.r * p }; }
  ctx.save();
  if (f > 0 || t >= END_T) { ctx.shadowColor = 'rgba(167,139,250,0.55)'; ctx.shadowBlur = 40; rr(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, b.r); ctx.fillStyle = '#000'; ctx.fill(); ctx.shadowBlur = 0; }
  rr(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, b.r); ctx.clip(); headFeed(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h); ctx.restore();
  if (f > 0.02 || t >= END_T) { ctx.save(); ctx.lineWidth = 6; ctx.strokeStyle = LAV; rr(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, b.r); ctx.stroke(); ctx.restore(); }
  if (t < a + 0.3) {  // lower third
    const k = since(0.4, 0.4) * (1 - since(a, 0.3)); if (k <= 0) return;
    ctx.save(); ctx.globalAlpha = k; ctx.translate((1 - k) * -40, 0);
    rr(ctx, 70, 760, 980, 150, 22); ctx.fillStyle = 'rgba(11,11,14,0.85)'; ctx.fill(); ctx.fillStyle = LAV; ctx.fillRect(70, 780, 8, 110);
    txt(ctx, 'Tony Callender', 110, 810, { w: 800, s: 52, align: 'left' }); txt(ctx, 'AI Automation Engineer · AI Agents, APIs & Custom Software', 110, 866, { w: 500, s: 28, c: '#c9c3e6', align: 'left' }); ctx.restore();
  }
}

// ── real work frame (source rect so wide clips can be cropped) ───────────────
const C1 = Desk.clip('c1'), C2 = Desk.clip('c2'), C3 = Eduba.image('assets/c3-status-chart.png'), C4 = Eduba.image('assets/c4-report.png');
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
function c1Time(u) { if (u < 1.0) return u; if (u < 2.8) return 7.0 + (u - 1.0); return Math.min(2.0 + (u - 2.8), 4.8); }
function arrow(ctx, x1, y1, x2, y2, f, col = LAV) { if (f <= 0) return; ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.setLineDash([12, 10]); ctx.lineDashOffset = -P.t * 40;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(lerp(x1, x2, f), lerp(y1, y2, f)); ctx.stroke(); ctx.restore(); }

const SCENES = {
  intro() {},
  inbox(ctx) {
    const a = S('inbox'), mi = at('million', 'inbox', a + 4.3), ms = at('messages,', 'inbox', a + 5.6);
    chip(ctx, '🏢  A major U.S. compliance platform', CX, 130, { scale: pop(a + 0.5), s: 34 });
    const fixed = since(ms + 0.3, 0.3);
    if (card(ctx, 460, 540, 600, 560, { scale: pop(a + 0.8) })) {
      txt(ctx, '📥  Inbox', -270, -240, { w: 700, s: 32, align: 'left' });
      ctx.save(); rr(ctx, -280, -200, 560, 450, 12); ctx.clip();
      const sp = P.t < ms + 0.3 ? (P.t - a) * (2 + (P.t - a) * 2.2) : (ms + 0.3 - a) * (2 + (ms + 0.3 - a) * 2.2);
      for (let i = -1; i < 8; i++) { const y = -200 + ((i * 60 + sp * 60) % 540) - 60; ctx.globalAlpha = 1 - fixed * 0.85;
        rr(ctx, -270, y, 540, 50, 10); ctx.fillStyle = '#1e1f26'; ctx.fill(); ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(-245, y + 25, 6, 0, 7); ctx.fill();
        rr(ctx, -225, y + 14, 140 + ((i * 53) & 127), 10, 5); ctx.fillStyle = '#4a4e5c'; ctx.fill(); rr(ctx, -225, y + 30, 260, 8, 4); ctx.fillStyle = '#30333d'; ctx.fill(); }
      ctx.restore(); ctx.globalAlpha = 1;
      chip(ctx, '✓ FIXED', 0, 30, { scale: pop(ms + 0.3), s: 56, bg: '#11261a', edge: GREEN, c: '#bff5d2', rot: -6, glow: GREEN });
      ctx.restore();
    }
    const n = count(mi - 1.4, 1.4, 2300000);
    if (P.t > mi - 1.4) { txt(ctx, fmt(n), 1170, 470, { w: 800, s: 110, c: n >= 2299999 ? '#fff' : LAV }); txt(ctx, 'unnecessary inbox messages', 1170, 560, { w: 600, s: 34, c: SUB }); }
  },
  records(ctx) {
    const a = S('records'), n = at('9,231', 'records', a + 0.5);
    const sweep = clamp01((P.t - n) / 2.4);
    if (card(ctx, 470, 500, 640, 560, { scale: pop(a + 0.1) })) {
      txt(ctx, 'Records', -290, -240, { w: 700, s: 30, align: 'left' });
      for (let r = 0; r < 12; r++) for (let c = 0; c < 16; c++) { const ok = (c + r * 16) / 192 < sweep;
        rr(ctx, -290 + c * 36.5, -195 + r * 37, 30, 30, 6); ctx.fillStyle = ok ? GREEN : ((r * 7 + c * 3) % 5 ? '#7a2a2a' : RED); ctx.fill(); }
      ctx.restore();
    }
    if (P.t > n - 0.2) { txt(ctx, fmt(count(n - 0.2, 2.4, 9231)), 1170, 450, { w: 800, s: 120, c: GREEN }); txt(ctx, 'background-check records', 1170, 545, { w: 600, s: 34, c: TEXT }); txt(ctx, 'repaired', 1170, 595, { w: 600, s: 34, c: SUB }); }
  },
  scale(ctx) {
    const a = S('scale'), t1 = at('163', 'scale', a + 3.5), t2 = at('17,000', 'scale', a + 5), t3 = at('1.6', 'scale', a + 7.5);
    txt(ctx, 'Modernized systems for an organization serving', CX, 190, { w: 600, s: 40, c: SUB });
    [['⛪', t1, (v) => fmt(v), 163, 'dioceses'], ['🏫', t2, (v) => fmt(v) + '+', 17000, 'churches & schools'], ['👥', t3, (v) => (v / 1e6).toFixed(1) + 'M', 1600000, 'registered users']].forEach(([e, t0, f, to, s], i) => {
      if (card(ctx, 320 + i * 480, 520, 420, 380, { scale: pop(t0), edge: [LAV, GOLD, GREEN][i] })) {
        emoji(ctx, e, 0, -100, 80); txt(ctx, f(count(t0, 1.0, to)), 0, 20, { w: 800, s: 84 }); txt(ctx, s, 0, 110, { w: 500, s: 32, c: SUB }); ctx.restore(); } });
  },
  assistant(ctx) {
    const a = S('assistant'), q = at('ask', 'assistant', a + 1.8);
    if (card(ctx, 330, 300, 380, 200, { scale: pop(a + 0.2) })) { emoji(ctx, '👔', -120, 0, 80); txt(ctx, 'Business', -50, -22, { w: 700, s: 36, align: 'left' }); txt(ctx, 'leader', -50, 24, { w: 700, s: 36, align: 'left' }); ctx.restore(); }
    if (card(ctx, 860, 300, 560, 150, { scale: pop(q), fill: PAPERW, edge: '#d9d9d6' })) {
      const s = 'How many cases are still open this month?', n = Math.ceil(typed(q + 0.2, 1.4) * s.length);
      wrap(ctx, s, 500, 600, 32).reduce((left, l, i) => { txt(ctx, l.slice(0, Math.max(0, left)), -250, -20 + i * 42, { w: 600, s: 32, c: '#111', align: 'left' }); return left - l.length - 1; }, n); ctx.restore(); }
    arrow(ctx, 860, 380, 860, 560, since(q + 1.6, 0.4));
    orb(ctx, 860, 650, 70, { scale: pop(q + 2.0) }); txt(ctx, 'AI assistant', 860, 760, { w: 700, s: 34, c: LAV });
    if (P.t > q + 2.0) { emoji(ctx, '🗄️', 1260, 650, 90); txt(ctx, 'your data', 1260, 760, { w: 600, s: 28, c: SUB }); arrow(ctx, 950, 650, 1190, 650, since(q + 2.3, 0.4), GOLD); }
    label(ctx, 'Illustration');
  },
  agent(ctx) {
    const a = S('agent');
    realFrame(ctx, C2.at(P.t - a + 0.5), 0, 95, 720, 375, CX, 470, 1180, 'The assistant at work · client wording blurred', ease.out(since(a, 0.35)));
  },
  report(ctx) {
    const a = S('report'), end = S('guard'), w = 1100, h = 640, viewH = 1180 * h / w;
    const q = ease.inOut(clamp01((P.t - a - 0.4) / (end - a - 1.2)));
    const k = ease.out(since(a, 0.35)); if (k <= 0) return;
    realFrame(ctx, C4, 0, q * (1630 - viewH), 1180, viewH, CX, 480, w, 'Its report, with its definitions · numbers blurred', k);
  },
  guard(ctx) {
    const a = S('guard'), ch = at("can't", 'guard', a + 1.8);
    if (card(ctx, 420, 260, 460, 240, { scale: pop(a + 0.1), edge: GREEN, glow: 'rgba(34,197,94,0.3)' })) {
      emoji(ctx, '🛡️', 0, -40, 90); txt(ctx, 'READ-ONLY GUARD', 0, 75, { w: 800, s: 34, c: '#bff5d2' }); ctx.restore(); }
    [['SELECT … FROM cases', a + 0.7, true], ['DELETE FROM cases', ch, false]].forEach(([s, t0, ok], i) => {
      if (card(ctx, 420, 520 + i * 140, 640, 110, { scale: pop(t0), edge: ok ? EDGE : RED })) {
        ctx.font = '600 32px Consolas, "Cascadia Mono", monospace'; ctx.fillStyle = ok ? '#d6d8e2' : '#ffd0d0'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(s, -290, 0);
        if (ok) check(ctx, 270, 0, 26, pop(t0 + 0.3)); else cross(ctx, 270, 0, 26, pop(t0 + 0.3)); ctx.restore(); } });
    realFrame(ctx, C3, 0, 0, 900, 560, 1140, 470, 660, 'A chart from its report · values blurred', ease.out(since(a + 0.9, 0.4)));
  },
  sermon(ctx) {
    const a = S('sermon'), wk = at('weekly', 'sermon', a + 2.0);
    chip(ctx, '⛪  A church', CX, 150, { scale: pop(a + 0.1), s: 34 });
    [['🎥', 'Recording', 300], [null, 'Workflow', 800], ['📝', 'Ready to publish', 1300]].forEach(([e, s, x], i) => {
      const t0 = a + 0.4 + i * 0.7; if (i) arrow(ctx, x - 500 + 200, 480, x - 200, 480, since(t0 - 0.3, 0.4));
      if (card(ctx, x, 480, 380, 160, { scale: pop(t0), edge: i === 1 ? LAV : EDGE })) { if (e) emoji(ctx, e, -120, 0, 60); else orb(ctx, -120, 0, 40); txt(ctx, s, -70, 0, { w: 700, s: 32, align: 'left' }); ctx.restore(); } });
    chip(ctx, 'Every week · no manual steps', CX, 700, { scale: pop(wk + 0.4), s: 34, bg: '#11261a', edge: GREEN, c: '#bff5d2' });
    label(ctx, 'Illustration');
  },
  clip1(ctx) {
    const a = S('clip1');
    realFrame(ctx, C1.at(c1Time(P.t - a)), 0, 0, 990, 750, CX, 470, 900, 'A published sermon page · names hidden', ease.out(since(a, 0.35)));
  },
  more(ctx) {
    const a = S('more'), l = at('language-learning', 'more', a + 1.5), fr = at('fraud-detection', 'more', a + 5.0);
    txt(ctx, 'Also', CX, 160, { w: 700, s: 40, c: SUB });
    [['🗣️', 'AI language-learning company', 'Found its most engaged users', l, LAV], ['🕵️', 'AI fraud-detection startup', 'Researched + integrated new tech', fr, GOLD]].forEach(([e, t1, t2, t0, c], i) => {
      if (card(ctx, 420 + i * 760, 480, 680, 380, { scale: pop(t0), edge: c })) {
        emoji(ctx, e, 0, -100, 90); txt(ctx, t1, 0, 20, { w: 800, s: 38 }); txt(ctx, t2, 0, 80, { w: 500, s: 30, c: SUB }); check(ctx, 290, -150, 24, pop(t0 + 1.2)); ctx.restore(); } });
  },
  meta(ctx) {
    const a = S('meta'), wf = at('workflows', 'meta', a + 3), on = at('only', 'meta', a + 4.5), tk = at('talk.', 'meta', a + 6);
    const wait = 1 - since(wf - 0.3, 0.3);
    if (wait > 0) { ctx.save(); ctx.globalAlpha *= wait; txt(ctx, '🤔', CX, 380, { w: 400, s: 160 }); txt(ctx, 'Wait… this video?', CX, 560, { w: 800, s: 72 }); ctx.restore(); }
    const steps = [['📝', 'Script draft'], ['🎬', 'Animation'], ['🎞️', 'Real clips'], ['💬', 'Captions'], ['📺', 'This video']];
    steps.forEach(([e, s], i) => { const t0 = wf - 0.3 + i * 0.25, x = 190 + i * 300;
      if (i) arrow(ctx, x - 300 + 115, 400, x - 115, 400, since(t0 - 0.1, 0.25));
      if (card(ctx, x, 400, 220, 200, { scale: pop(t0), edge: i === 4 ? LAV : EDGE, glow: i === 4 ? 'rgba(167,139,250,0.4)' : null })) { emoji(ctx, e, 0, -30, 64); txt(ctx, s, 0, 55, { w: 700, s: 26 }); ctx.restore(); } });
    if (P.t > wf + 1.2) { const b = Math.abs(Math.sin((P.t - wf) * 4)) * 14; chip(ctx, '📍 You are here', 1390, 245 - b, { s: 28, bg: LAV2, edge: LAV, c: '#fff' }); }
    if (P.t > wf) txt(ctx, 'Made by one of my AI-augmented content workflows', CX, 600, { w: 600, s: 34, c: SUB });
    if (P.t > on) { const k = pop(on); chip(ctx, 'My part: show up and talk 👉', 1200, 780, { scale: k, s: 34, bg: '#2a2410', edge: GOLD, c: GOLD, rot: -3 }); }
  },
  close(ctx, t) {
    const a = S('close'), s1 = at('save', 'close', a + 0.9), s2 = at('eliminate', 'close', a + 1.7), s3 = at('grow', 'close', a + 3.4), inv = at('Invite', 'close', a + 5.5);
    txt(ctx, 'What I do', CX, 150, { w: 700, s: 40, c: SUB });
    [['⏱️  Save time', s1, LAV, '#1a1630'], ['🛡️  Eliminate costly mistakes', s2, GREEN, '#11261a'], ['📈  Grow through AI & automation', s3, GOLD, '#2a2410']].forEach(([s, t0, c, bg], i) =>
      chip(ctx, s, CX, 290 + i * 140, { scale: pop(t0), s: 44, bg, edge: c, rot: [-2, 2, -1][i] }));
    chip(ctx, 'Invite me to your job', CX, 750, { scale: pop(inv), s: 46, bg: '#14a800', edge: '#5fd34a', c: '#fff', glow: 'rgba(20,168,0,0.6)' });
  },
};
SCENES.close = ((orig) => (ctx, t) => { if (t >= END_T) { const k = since(END_T + 0.4, 0.4); if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = k; txt(ctx, 'Tony Callender', 880, 470, { w: 800, s: 76, align: 'left' });
  txt(ctx, 'AI Automation Engineer', 880, 550, { w: 600, s: 36, c: LAV, align: 'left' }); txt(ctx, 'AI Agents · APIs · Custom Software', 880, 600, { w: 500, s: 32, c: SUB, align: 'left' });
  ctx.restore(); chip(ctx, 'Invite me to your job', 1080, 700, { scale: pop(END_T + 0.7), s: 36, bg: '#14a800', edge: '#5fd34a', c: '#fff' }); return; } orig(ctx, t); })(SCENES.close);

// ── captions ────────────────────────────────────────────────────────────────
let CHUNKS = null;
function captions(ctx, t) {
  if (!CHUNKS) { CHUNKS = []; let cur = [];
    P.words.forEach((w, i) => { cur.push(w); const n = P.words[i + 1];
      if (!n || cur.length >= 5 || /[.,!?;:"]$/.test(w.text) || n.start - w.end > 0.3) { CHUNKS.push(cur); cur = []; } }); }
  const i = CHUNKS.findIndex((c, k) => t >= c[0].start && t < (CHUNKS[k + 1] ? CHUNKS[k + 1][0].start : c[c.length - 1].end + 0.5));
  if (i < 0) return;
  const s = CHUNKS[i].map((w) => w.text).join(' ').replace(/[,;:]$/, '').replace('background check', 'background-check');
  const full = t < S('inbox'); ctx.font = FONT(800, 56); let size = 56; const W = ctx.measureText(s).width; if (W > 1300) size = Math.floor(56 * 1300 / W);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 18; txt(ctx, s, full ? 960 : CX, full ? 690 : CAP_Y, { w: 800, s: size }); ctx.restore();
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
