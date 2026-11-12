// scene.js: ai-filters-reel (LinkedIn #14), same dark kit as ai-analyst-reel (helpers copied from it), dark UI style modeled on videos/_inspiration/ig-DffO8yvD9EG (see STYLE.md there).
// Near-black ground + faint dot grid, one or two UI objects at a time (upper-middle), the AI is a lavender orb,
// white bold captions (3-4 words) at CAP_Y, title only at the start, Tony's face opens and closes the reel.
// Numbers and metric definitions on screen are illustrations (labelled), not client data. The client stays anonymous.
const { ease } = P;
const S = (id) => P.cue(id).start;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, p) => a + (b - a) * p;
P.wait(Promise.all(['500', '600', '700', '800'].map((w) => document.fonts.load(`${w} 40px Inter`))));
const HEAD = Eduba.image('assets/tony-head.png');

// ── look ───────────────────────────────────────────────────────────────────
const BG = '#0b0b0e', DOT = '#1b1c22', CARD = '#141519', EDGE = '#2c2e37', TEXT = '#f4f4f6', SUB = '#8d909c';
const LAV = '#a78bfa', LAV2 = '#7c5cf0', GREEN = '#22c55e', RED = '#ef4444', GOLD = '#e8b931', PAPERW = '#f6f6f4';
const FONT = (w, s) => `${w} ${s}px Inter, "Segoe UI", Arial, sans-serif`;
const EMOJI = (s) => `${s}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
const CAP_Y = 1300, END_T = 57.9;

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
function head(ctx, x, y, r, k = 1) { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.shadowColor = LAV; ctx.shadowBlur = 40; ctx.fillStyle = '#1d1a2b'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.clip();
  if (HEAD.complete && HEAD.naturalWidth) { const w = r * 2.05, h = w * HEAD.naturalHeight / HEAD.naturalWidth; ctx.drawImage(HEAD, -w / 2, -h * 0.5 + r * 0.12, w, h); }
  ctx.restore(); ctx.lineWidth = 6; ctx.strokeStyle = LAV; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke(); ctx.restore(); }
function cursor(ctx, x, y) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 46); ctx.lineTo(12, 35); ctx.lineTo(22, 56); ctx.lineTo(30, 52); ctx.lineTo(20, 32); ctx.lineTo(36, 32); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
function label(ctx, s) { txt(ctx, s, 540, 1590, { w: 500, s: 22, c: '#55586a' }); }

// ── scenes (one per cue; each draws its objects for local time) ─────────────
// ── this reel's pieces ──────────────────────────────────────────────────────
function filterHead(ctx, n, title, t0) {  // "FILTER n" chip + the filter question, top of frame
  chip(ctx, `FILTER ${n}`, 540, 400, { scale: pop(t0), s: 30, bg: '#221a3d', edge: LAV, c: '#e6dcff' });
  const k = since(t0 + 0.15, 0.3); if (k <= 0) return; ctx.save(); ctx.globalAlpha *= k; ctx.translate(0, (1 - k) * 20);
  title.forEach((l, i) => txt(ctx, l, 540, 520 + i * 74, { w: 800, s: 64 })); ctx.restore();
}
// a 10x10 grid of cases; `miss` = indexes drawn red, revealed from t0 over `dur`
function grid(ctx, x, y, cell, miss, t0, dur = 1.2) {
  for (let i = 0; i < 100; i++) { const r = Math.floor(i / 10), c = i % 10, on = P.t >= t0 + (i / 100) * dur;
    ctx.beginPath(); ctx.arc(x + c * cell, y + r * cell, cell * 0.36, 0, 7);
    if (!on) { ctx.strokeStyle = '#2c2e37'; ctx.lineWidth = 2; ctx.stroke(); continue; }
    ctx.fillStyle = miss.includes(i) ? RED : GREEN; ctx.fill(); }
}
const HUMAN_MISS = [7, 23, 41, 58, 76, 92], AI_MISS = [15, 49, 66, 88];
function person(ctx, x, y, r, col = '#3a3d4a') { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y - r * 0.35, r * 0.42, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y + r * 0.55, r * 0.7, r * 0.45, 0, Math.PI, 2 * Math.PI); ctx.fill(); }

const SCENES = {
  q(ctx) {
    ['How do you decide', 'what\'s safe to', 'automate with AI?'].forEach((l, i) => txt(ctx, l, 540, 660 + i * 96, { w: 800, s: 80, c: i === 2 ? LAV : TEXT }));
  },
  three(ctx) {
    const a = S('three');
    txt(ctx, '3 filters', 540, 420, { w: 800, s: 70, c: LAV });
    [['1', 'Does it touch a soul?'], ['2', 'What does a wrong answer cost?'], ['3', 'Is the AI as good as a person?']].forEach(([n, s], i) => {
      if (card(ctx, 540, 600 + i * 170, 860, 130, { scale: pop(a + 0.3 + i * 0.25) })) {
        ctx.fillStyle = LAV2; ctx.beginPath(); ctx.arc(-360, 0, 36, 0, 7); ctx.fill(); txt(ctx, n, -360, 2, { w: 800, s: 38, c: '#fff' });
        txt(ctx, s, -300, 0, { w: 700, s: 36, align: 'left' }); ctx.restore(); } });
  },
  f1(ctx) {
    const a = S('f1'), words = [['Prayer', 'Prayer', '🙏'], ['Care', 'care', '🤝'], ['Counsel', 'counsel', '💬']], pe = at('person', 'f1', a + 5.6);
    filterHead(ctx, 1, ['Does it touch', 'a soul?'], a + 0.1);
    words.forEach(([s, w, e], i) => chip(ctx, `${e}  ${s}`, 230 + i * 310, 800, { scale: pop(at(w, 'f1', a + 2 + i)), s: 36 }));
    if (card(ctx, 540, 1010, 860, 150, { scale: pop(pe), edge: GREEN, glow: 'rgba(34,197,94,0.3)' })) {
      person(ctx, -340, 0, 70, '#5b7d68'); txt(ctx, 'A person always handles it', -270, 0, { w: 700, s: 40, align: 'left' }); ctx.restore(); }
  },
  f2(ctx) {
    const a = S('f2'), ch = at('cheap', 'f2', a + 3.1), au = at('automate', 'f2', a + 4.2);
    filterHead(ctx, 2, ['What does a', 'wrong answer cost?'], a + 0.1);
    if (card(ctx, 540, 880, 860, 260, { scale: pop(ch) })) {
      txt(ctx, 'Cheap to undo', -390, -80, { w: 700, s: 30, c: GREEN, align: 'left' });
      txt(ctx, 'e.g. drafting an internal summary', -390, -30, { w: 600, s: 36, align: 'left' });
      chip(ctx, '✓  AUTOMATE IT', 0, 70, { scale: pop(au), s: 36, bg: '#11261a', edge: GREEN, c: '#bff5d2' }); ctx.restore(); }
  },
  costly(ctx) {
    const a = S('costly'), fi = at('financially', 'costly', a + 1.6), re = at('reputation', 'costly', a + 3), ke = at('keep', 'costly', a + 4.7);
    txt(ctx, 'Costly to get wrong', 540, 420, { w: 800, s: 60, c: '#ffb4b4' });
    chip(ctx, '💰  Money', 360, 580, { scale: pop(fi), s: 40, edge: RED });
    chip(ctx, '⭐  Reputation', 720, 580, { scale: pop(re), s: 40, edge: RED });
    const k = since(ke, 0.3);
    if (k > 0) { ctx.save(); ctx.globalAlpha *= k;
      orb(ctx, 260, 860, 54); txt(ctx, 'AI drafts', 260, 960, { w: 700, s: 32 });
      ctx.strokeStyle = '#4a4e5a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(340, 860); ctx.lineTo(460, 860); ctx.stroke();
      ctx.fillStyle = '#2a2c35'; ctx.beginPath(); ctx.arc(540, 860, 66, 0, 7); ctx.fill(); ctx.strokeStyle = GOLD; ctx.lineWidth = 5; ctx.stroke(); person(ctx, 540, 860, 70, GOLD);
      txt(ctx, 'A person checks', 540, 960, { w: 700, s: 32 });
      ctx.strokeStyle = '#4a4e5a'; ctx.beginPath(); ctx.moveTo(620, 860); ctx.lineTo(740, 860); ctx.stroke(); check(ctx, 820, 860, 44, pop(ke + 0.5)); txt(ctx, 'Then it goes out', 820, 960, { w: 700, s: 32 });
      chip(ctx, 'Human in the loop', 540, 1100, { scale: pop(ke + 0.3), s: 38, bg: '#2a2410', edge: GOLD, c: GOLD }); ctx.restore(); }
  },
  f3(ctx) {
    const a = S('f3'), sk = at('skip', 'f3', a + 4.1);
    filterHead(ctx, 3, ['Is the AI at least', 'as good as the person?'], a + 0.1);
    chip(ctx, 'Most people skip this one', 540, 820, { scale: pop(sk), s: 40, bg: '#2a0d10', edge: RED, c: '#ffd0d0', rot: -3, glow: RED });
  },
  err(ctx) {
    const a = S('err'), er = at('error', 'err', a + 1.8);
    if (card(ctx, 540, 830, 700, 680, { scale: pop(a + 0.1) })) {
      person(ctx, -270, -268, 52); txt(ctx, 'A typical hire', -210, -272, { w: 700, s: 38, align: 'left' }); ctx.restore(); }
    if (P.t > a + 0.3) grid(ctx, 540 - 4.5 * 52, 610, 52, HUMAN_MISS, a + 0.3, 1.0);
    chip(ctx, 'Not error free either', 540, 1240 - 80, { scale: pop(er), s: 36, bg: '#2a0d10', edge: RED, c: '#ffd0d0' });
  },
  goal(ctx) {
    const a = S('goal'), pf = at('perfect', 'goal', a + 1.1), ma = at('matches', 'goal', a + 3.3);
    if (card(ctx, 540, 560, 760, 170, { scale: pop(a + 0.1), alpha: P.t > ma ? 0.4 : 1 })) { txt(ctx, 'A perfect AI', 0, 0, { w: 800, s: 54 }); ctx.restore(); }
    if (P.t > pf + 0.2) { ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(220, 560); ctx.lineTo(lerp(220, 860, since(pf + 0.2, 0.3)), 560); ctx.stroke(); ctx.restore(); }
    if (card(ctx, 540, 860, 860, 240, { scale: pop(ma), edge: GREEN, glow: 'rgba(34,197,94,0.3)', lw: 4 })) {
      txt(ctx, 'Matches or beats', 0, -40, { w: 800, s: 54 }); txt(ctx, 'a typical hire', 0, 36, { w: 800, s: 54, c: GREEN }); ctx.restore(); }
  },
  measure(ctx) {
    const a = S('measure'), ac = at('actually', 'measure', a + 3.9);
    txt(ctx, 'Same 100 cases', 540, 400, { w: 700, s: 40, c: SUB });
    if (card(ctx, 540, 830, 700, 680, { scale: pop(a + 0.1) })) { person(ctx, -270, -268, 52); txt(ctx, 'Typical hire', -210, -272, { w: 700, s: 38, align: 'left' }); ctx.restore(); }
    if (P.t > a + 0.3) grid(ctx, 540 - 4.5 * 52, 610, 52, HUMAN_MISS, a + 0.4, 2.2);
    chip(ctx, 'Someone you\'d actually hire', 540, 1160, { scale: pop(ac), s: 34 });
    label(ctx, 'Illustration');
  },
  run(ctx) {
    const a = S('run'), co = at('compare', 'run', a + 2.5);
    txt(ctx, 'Same 100 cases', 540, 400, { w: 700, s: 40, c: SUB });
    [[290, 'Typical hire', HUMAN_MISS, a - 10, '94 / 100'], [790, 'AI', AI_MISS, a + 0.4, '96 / 100']].forEach(([x, n, miss, t0, sc], i) => {
      if (card(ctx, x, 800, 440, 560, { scale: i === 0 ? 1 : pop(a + 0.15), edge: i ? LAV : EDGE })) {
        if (i) orb(ctx, -150, -220, 26); else person(ctx, -150, -220, 44);
        txt(ctx, n, -110, -220, { w: 700, s: 36, align: 'left' }); ctx.restore(); }
      if (i === 0 || P.t > a + 0.3) grid(ctx, x - 4.5 * 36, 680, 36, miss, t0, 1.2);
      const k = pop(co + i * 0.25); if (k > 0) chip(ctx, sc, x, 1150, { scale: k, s: 44, bg: i ? '#221a3d' : '#1e1f26', edge: i ? LAV : EDGE }); });
    label(ctx, 'Illustration');
  },
  stats(ctx) {
    const a = S('stats'), ig = at('ignore', 'stats', a + 2.1);
    if (card(ctx, 540, 720, 860, 360, { scale: pop(a + 0.1), edge: LAV })) {
      emoji(ctx, '📊', 0, -100, 80);
      txt(ctx, 'Statistical test', 0, 10, { w: 800, s: 52 }); txt(ctx, 'Is the gap real, or just noise?', 0, 90, { w: 600, s: 36, c: SUB }); ctx.restore(); }
    chip(ctx, 'Most people ignore this', 540, 1020, { scale: pop(ig), s: 36, bg: '#2a0d10', edge: RED, c: '#ffd0d0', rot: -2 });
  },
  decide(ctx, t) {
    if (t >= END_T) return endCard(ctx, t);
    const a = S('decide'), au = at('automate', 'decide', a + 3.8), no = at('not', 'decide', a + 4.9), im = at('improving', 'decide', a + 7);
    if (card(ctx, 540, 560, 860, 260, { scale: pop(a + 0.1), edge: GREEN, glow: P.t > au ? 'rgba(34,197,94,0.35)' : null })) {
      txt(ctx, 'As good or better?', 0, -50, { w: 800, s: 50 }); chip(ctx, '✓  AUTOMATE IT', 0, 50, { scale: pop(au), s: 40, bg: '#11261a', edge: GREEN, c: '#bff5d2' }); ctx.restore(); }
    if (card(ctx, 540, 900, 860, 300, { scale: pop(no), edge: GOLD })) {
      txt(ctx, 'Not yet?', 0, -80, { w: 800, s: 50 }); txt(ctx, 'Keep the human in the loop', 0, -10, { w: 700, s: 38, c: GOLD });
      if (P.t > im) { const r = 34, sp = P.t * 3; ctx.save(); ctx.translate(-150, 80); ctx.strokeStyle = LAV; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, r, sp, sp + 4.6); ctx.stroke(); ctx.restore();
        txt(ctx, 'and keep improving', 40, 80, { w: 700, s: 36, c: LAV }); }
      ctx.restore(); }
  },
};
function endCard(ctx, t) {
  const k = pop(END_T, 0.4);  // no head on the end card either
  if (k > 0) { ctx.globalAlpha = since(END_T + 0.2, 0.3); txt(ctx, 'Tony Callender', 540, 700, { w: 800, s: 64 });
    txt(ctx, 'AI systems built for the people who use them', 540, 776, { w: 500, s: 30, c: SUB });
    chip(ctx, 'Follow for more', 540, 900, { scale: pop(END_T + 0.5), s: 34, bg: LAV2, edge: LAV, c: '#fff' }); ctx.globalAlpha = 1; }
}

// ── captions: white bold, 3-4 words, no box (like the reference) ────────────
let CHUNKS = null;
function captions(ctx, t) {
  if (!CHUNKS) { CHUNKS = []; let cur = [];
    P.words.forEach((w, i) => { cur.push(w); const n = P.words[i + 1];
      if (!n || cur.length >= 4 || /[.,!?;:"]$/.test(w.text) || n.start - w.end > 0.3) { CHUNKS.push(cur); cur = []; } }); }
  const i = CHUNKS.findIndex((c, k) => t >= c[0].start && t < (CHUNKS[k + 1] ? CHUNKS[k + 1][0].start : c[c.length - 1].end + 0.5));
  if (i < 0) return;
  let s = CHUNKS[i].map((w) => w.text).join(' ').replace(/[,;:]$/, '');
  ctx.font = FONT(800, 60); let size = 60; const W = ctx.measureText(s).width; if (W > 960) size = Math.floor(60 * 960 / W);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 16; txt(ctx, s, 540, CAP_Y, { w: 800, s: size }); ctx.restore();
}

// ── the frame ───────────────────────────────────────────────────────────────
const ORDER = Object.keys(SCENES);
Eduba.frame({ overlay: true, step: 30, draw(g, t) {
  const ctx = g.photo.ctx;
  ctx.fillStyle = BG; ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = DOT; for (let y = 20; y < 1920; y += 44) for (let x = 20; x < 1080; x += 44) ctx.fillRect(x, y, 3, 3);
  let id = ORDER[0]; for (const k of ORDER) if (t >= S(k)) id = k;
  const k = id === ORDER[0] ? 1 : ease.out(clamp01((t - S(id)) / 0.28));  // frame 0 = the thumbnail, fully drawn
  ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 30);
  SCENES[id](ctx, t);
  ctx.restore();
  if (t >= S('three') && t < END_T) captions(ctx, t);  // the opening question is on screen as text already
} });
