// scene.js: code-made-reel v2 (LinkedIn #17: how I make my videos, augmented not automated), dark kit from prayer-line-reel. No head.
// Near-black ground + faint dot grid, one or two UI objects at a time (upper-middle), the AI is a lavender orb,
// white bold captions (3-4 words) at CAP_Y, title only at the start, Tony's face opens and closes the reel.
// Numbers and metric definitions on screen are illustrations (labelled), not client data. The client stays anonymous.
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
const CAP_Y = 1480, END_T = 72.8;

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
function label(ctx, s) { txt(ctx, s, 540, 1590, { w: 500, s: 22, c: '#55586a' }); }

// ── this reel's pieces ──────────────────────────────────────────────────────
function line(ctx, x1, y1, x2, y2, p = 1, col = '#4a4e5a', dash = null) { if (p <= 0) return; ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round'; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(lerp(x1, x2, p), lerp(y1, y2, p)); ctx.stroke(); ctx.restore(); }
function person(ctx, x, y, r, col = '#3a3d4a') { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y - r * 0.35, r * 0.42, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y + r * 0.55, r * 0.7, r * 0.45, 0, Math.PI, 2 * Math.PI); ctx.fill(); }
const STEPS = [['Idea', 'Me', GOLD], ['Script', 'Me + AI', GOLD], ['Timing', 'AI', LAV], ['Board', 'AI → Me', GOLD], ['Code', 'AI', LAV], ['Review', 'Me', GOLD]];
function rail(ctx, on, t0 = -1, y = 300) {  // step rail; `on` = index of the current step
  STEPS.forEach(([s, who, wc], i) => { const x = 140 + i * 160, k = t0 < 0 ? 1 : pop(t0 + i * 0.15);
    if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    if (i < 5) { ctx.strokeStyle = i < on ? LAV : '#2c2e37'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(134, 0); ctx.stroke(); }
    ctx.fillStyle = i === on ? LAV : i < on ? LAV2 : '#1e1f26'; ctx.strokeStyle = i <= on ? LAV : EDGE; ctx.lineWidth = 3;
    if (i === on) { ctx.shadowColor = LAV; ctx.shadowBlur = 25; }
    ctx.beginPath(); ctx.arc(0, 0, 24, 0, 7); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
    txt(ctx, String(i + 1), 0, 1, { w: 800, s: 24, c: i <= on ? '#fff' : SUB });
    txt(ctx, s, 0, 56, { w: 700, s: 24, c: i === on || on < 0 ? TEXT : SUB });
    txt(ctx, who, 0, 90, { w: 700, s: 20, c: i === on || on < 0 ? wc : '#55586a' }); ctx.restore(); });
}
function panel(ctx, x, y, w, h, title, k = 1) { if (!card(ctx, x, y, w, h, { scale: k, fill: '#101116' })) return false;
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(-w / 2 + 34 + i * 26, -h / 2 + 32, 8, 0, 7); ctx.fill(); });
  txt(ctx, title, w / 2 - 30, -h / 2 + 32, { w: 600, s: 22, c: SUB, align: 'right' }); return true; }
function wave(ctx, x, y, w, t0, n = 34, col = LAV) { for (let i = 0; i < n; i++) { if (P.t <= t0 + i * 0.03) continue;
  const h = 18 + Math.abs(Math.sin(i * 1.7 + P.t * 6)) * 60 * (0.5 + 0.5 * Math.sin(i * 0.6)); ctx.fillStyle = col; rr(ctx, x - w / 2 + i * (w / n), y - h / 2, w / n - 8, h, 4); ctx.fill(); } }
function code(ctx, s, x, y, o = {}) { ctx.font = `${o.w || 500} ${o.s || 30}px "Cascadia Code", Consolas, monospace`; ctx.fillStyle = o.c || '#d6d8e0'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); }
function gate(ctx, s, x, y, t0) {  // "me" review gate: gold person + label + check
  if (card(ctx, x, y, 700, 130, { scale: pop(t0), edge: GOLD, glow: 'rgba(232,185,49,0.35)' })) {
    person(ctx, -290, 0, 70, GOLD); txt(ctx, s, -220, 0, { w: 700, s: 38, align: 'left' }); ctx.restore(); check(ctx, x + 300, y, 30, pop(t0 + 0.4)); }
}
const stepTitle = (ctx, n, s, t0) => { const k = since(t0, 0.3); if (k <= 0) return; ctx.save(); ctx.globalAlpha *= k; txt(ctx, `${n}. ${s}`, 540, 470, { w: 800, s: 60 }); ctx.restore(); };

const SCENES = {
  hook(ctx) {
    const ju = at('Just', 'hook', 2.7);
    ['Every video on', 'my feed was', 'made with AI.'].forEach((l, i) => txt(ctx, l, 540, 640 + i * 100, { w: 800, s: 86, c: i === 2 ? LAV : TEXT }));
    if (P.t > ju) { ctx.save(); ctx.globalAlpha *= since(ju, 0.3); txt(ctx, 'Just not the way you\'d think.', 540, 1000, { w: 700, s: 44, c: SUB }); ctx.restore(); }
  },
  not(ctx) {
    const a = S('not'), T = [['🎨', 'AI image generators', 'Midjourney.', a + 0.2], ['🎞️', 'Stock footage', 'stock', a + 1], ['🧑', 'AI-generated faces', 'AI-generated', a + 2.2]];
    T.forEach(([e, s, w, fb], i) => { const t0 = at(w, 'not', fb), y = 540 + i * 220;
      if (card(ctx, 540, y, 760, 170, { scale: pop(t0), alpha: P.t > t0 + 0.5 ? 0.55 : 1 })) { emoji(ctx, e, -290, 0, 64); txt(ctx, s, -220, 0, { w: 700, s: 44, align: 'left' }); ctx.restore(); }
      if (P.t > t0 + 0.4) { line(ctx, 190, y, 890, y, since(t0 + 0.4, 0.25), RED); cross(ctx, 900, y - 70, 30, pop(t0 + 0.5)); } });
  },
  aug(ctx) {
    const a = S('aug'), au = at('augmented.', 'aug', a + 1.8), lo = at('loop', 'aug', a + 3.4);
    // automated: AI -> post, nobody checks
    if (card(ctx, 540, 520, 860, 240, { scale: pop(a + 0.1), alpha: P.t > au ? 0.5 : 1 })) {
      txt(ctx, 'Automated', -390, -80, { w: 800, s: 40, c: '#ffb4b4', align: 'left' });
      orb(ctx, -250, 30, 40); line(ctx, -190, 30, 120, 30, 1, '#4a4e5a'); txt(ctx, '📤 Posted', 230, 30, { w: 700, s: 34 }); txt(ctx, 'nobody checks', -30, 80, { w: 600, s: 26, c: SUB }); ctx.restore(); }
    if (P.t > au - 0.2) cross(ctx, 930, 420, 32, pop(au - 0.2));
    if (card(ctx, 540, 900, 860, 340, { scale: pop(au), edge: GREEN, glow: 'rgba(34,197,94,0.3)' })) {
      txt(ctx, 'Augmented', -390, -120, { w: 800, s: 40, c: '#bff5d2', align: 'left' });
      [-300, -100, 100, 300].forEach((x, i) => { if (i % 2) person(ctx, x, 10, 70, GOLD); else orb(ctx, x, 10, 36);
        if (i < 3) line(ctx, x + 50, 10, x + 150, 10, 1, '#4a4e5a'); if (i % 2) check(ctx, x + 40, -40, 20, pop(lo + i * 0.2)); });
      txt(ctx, 'I review at every stage', 0, 120, { w: 700, s: 32, c: GOLD }); ctx.restore(); }
  },
  how(ctx) {
    const a = S('how');
    txt(ctx, 'How it works', 540, 800, { w: 800, s: 80 });
    rail(ctx, -1, a + 0.2, 420);
  },
  idea(ctx) {
    const a = S('idea'), vn = at('voice', 'idea', a + 2), co = at('conversations,', 'idea', a + 4.6), cm = at('comments', 'idea', a + 6);
    rail(ctx, 0); stepTitle(ctx, 1, 'The idea', a);
    if (card(ctx, 540, 680, 820, 200, { scale: pop(vn - 0.3) })) { emoji(ctx, '🎙️', -330, 0, 60); txt(ctx, 'Voice notes', -270, -50, { w: 700, s: 30, c: SUB, align: 'left' }); ctx.restore(); wave(ctx, 600, 700, 560, vn, 30, GOLD); }
    if (P.t > co) txt(ctx, 'From real conversations', 540, 880, { w: 700, s: 40, c: GOLD });
    [[400, 1010, 520], [640, 1140, 560]].forEach(([x, y, w], i) => { const k = pop(cm - 0.6 + i * 0.4); if (k <= 0) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k); rr(ctx, -w / 2, -45, w, 90, 24); ctx.fillStyle = '#1e1f26'; ctx.fill(); ctx.strokeStyle = EDGE; ctx.lineWidth = 3; ctx.stroke();
      emoji(ctx, '💬', -w / 2 + 50, 0, 40); ctx.fillStyle = '#3a3d4a'; rr(ctx, -w / 2 + 100, -14, w - 160 - i * 60, 28, 14); ctx.fill(); ctx.restore(); });
    if (P.t > cm) chip(ctx, 'Comments on my posts', 540, 1270, { scale: pop(cm), s: 32 });
  },
  script(ctx) {
    const a = S('script'), ow = at('own', 'script', a + 2.3), ti = at('tighten', 'script', a + 4.3), vc = at('voice', 'script', a + 6);
    rail(ctx, 1); stepTitle(ctx, 2, 'The script', a);
    if (card(ctx, 540, 700, 820, 300, { scale: pop(a + 0.2), fill: PAPERW, edge: '#d9d9d6' })) {
      txt(ctx, 'script.md', -360, -110, { w: 700, s: 26, c: '#777', align: 'left' });
      const s = 'Every video on my feed was made with AI. Just not the way you\'d think.', n = Math.ceil(typed(a + 0.6, 2) * s.length);
      wrap(ctx, s, 700, 600, 36).reduce((left, l, i) => { txt(ctx, l.slice(0, Math.max(0, left)), -360, -40 + i * 52, { w: 600, s: 36, c: '#111', align: 'left' }); return left - l.length - 1; }, n);
      ctx.restore(); }
    chip(ctx, '✍️  My own words', 340, 900, { scale: pop(ow), s: 32, edge: GOLD, c: GOLD, bg: '#2a2410' });
    chip(ctx, '✨  AI tightens it', 750, 900, { scale: pop(ti), s: 32, bg: '#221a3d', edge: LAV, c: '#e6dcff' });
    if (P.t > vc) { if (card(ctx, 540, 1100, 820, 180, { scale: pop(vc), edge: LAV })) ctx.restore();
      wave(ctx, 600, 1100, 600, vc + 0.2); emoji(ctx, '🎙️', 210, 1100, 56); txt(ctx, 'My AI voice clone', 540, 1240, { w: 700, s: 32, c: LAV }); }
  },
  timing(ctx) {
    const a = S('timing');
    rail(ctx, 2); stepTitle(ctx, 3, 'The timing', a);
    txt(ctx, 'Every word gets a timestamp', 540, 560, { w: 600, s: 36, c: SUB });
    P.words.slice(0, 9).forEach((w, i) => { const t0 = a + 1.2 + i * 0.28, x = 280 + (i % 3) * 260, y = 700 + Math.floor(i / 3) * 170;
      if (card(ctx, x, y, 230, 130, { scale: pop(t0), r: 18 })) { txt(ctx, w.text.replace(/[.,]/g, ''), 0, -18, { w: 700, s: 34 }); txt(ctx, w.start.toFixed(2) + 's', 0, 32, { w: 600, s: 26, c: LAV }); ctx.restore(); } });
  },
  board(ctx) {
    const a = S('board'), dr = at('drafts', 'board', a + 2), tw = at('word.', 'board', a + 4.1) , rv = at('review', 'board', a + 6.9);
    const W = P.words.filter((w) => w.start > a); const wd = W.find((w) => w.text === 'word.' && w.start > a + 3) || { start: tw };
    rail(ctx, 3); stepTitle(ctx, 4, 'The storyboard', a);
    if (P.t > dr) { ctx.save(); ctx.globalAlpha *= since(dr, 0.3); code(ctx, '## card "This card appears"', 120, 590, { s: 30, c: '#9fe3b5' }); ctx.restore(); }
    const words = ['This', 'card', 'appears', 'on', 'this', 'word.'];
    ctx.fillStyle = '#1e1f26'; rr(ctx, 100, 660, 880, 90, 16); ctx.fill();
    words.forEach((w, i) => txt(ctx, w, 170 + i * 150, 705, { w: 700, s: 32, c: i === 5 && P.t > wd.start ? LAV : TEXT }));
    const px = 920, pk = since(wd.start - 0.3, 0.4); if (pk > 0) line(ctx, px, 760, px, lerp(760, 830, pk), 1, LAV);
    if (card(ctx, 760, 920, 380, 150, { scale: pop(wd.start), edge: LAV, glow: 'rgba(167,139,250,0.4)' })) { txt(ctx, 'card appears', 0, -20, { w: 700, s: 34 }); txt(ctx, `at ${wd.start.toFixed(1)}s`, 0, 30, { w: 600, s: 28, c: LAV }); ctx.restore(); }
    if (P.t > rv - 0.2) gate(ctx, 'I review the board', 500, 1130, rv - 0.2);
  },
  code(ctx, t) {
    const a = S('code'), wr = at('writes', 'code', a + 2), dw = at('draws', 'code', a + 4.3), th = at('thirty', 'code', a + 5.5);
    rail(ctx, 4); stepTitle(ctx, 5, 'The code', a);
    if (panel(ctx, 540, 720, 900, 300, 'scene.js', pop(wr - 0.2))) {
      code(ctx, '// AI writes this. The code draws the frame.', -410, -70, { s: 26, c: '#6b6f80' });
      ['card(ctx, 540, 1060, 600, 220)', 'txt(ctx, \'frame\', 540, 1060)', 'check(ctx, 760, 990)'].forEach((s, i) => {
        const n = Math.ceil(typed(wr + i * 0.6, 0.6) * s.length); if (n > 0) code(ctx, s.slice(0, n), -410, -10 + i * 52, { s: 30 }); });
      ctx.restore(); }
    if (card(ctx, 540, 1000, 560, 150, { scale: pop(dw), edge: LAV })) { code(ctx, 'frame ' + String(Math.floor(t * 30)).padStart(4, '0'), -180, 0, { w: 700, s: 48, c: TEXT }); ctx.restore(); }
    chip(ctx, '30 frames / second', 540, 1150, { scale: pop(th), s: 36, bg: '#221a3d', edge: LAV, c: '#e6dcff' });
  },
  review(ctx) {
    const a = S('review'), fr = at('frames,', 'review', a + 1.5), ch = at('changes,', 'review', a + 2.5), ap = at('approve', 'review', a + 4.9);
    rail(ctx, 5); stepTitle(ctx, 6, 'The review', a);
    for (let i = 0; i < 8; i++) { const x = 225 + (i % 4) * 210, y = 640 + Math.floor(i / 4) * 230;
      if (card(ctx, x, y, 180, 200, { scale: pop(fr - 0.3 + i * 0.06), r: 12, fill: '#141519', edge: i === 5 && P.t > ch ? GOLD : EDGE })) {
        orb(ctx, 0, -30, 26); ctx.fillStyle = '#2c2e37'; ctx.fillRect(-50, 20, 100, 12); ctx.fillRect(-36, 44, 72, 10); ctx.restore(); } }
    chip(ctx, '↻  Change this', 435, 1000, { scale: pop(ch), s: 28, bg: '#2a2410', edge: GOLD, c: GOLD, rot: -3 });
    if (P.t > ap - 0.3) gate(ctx, 'Approved by me', 500, 1130, ap - 0.3);
    if (P.t > ap + 0.6) txt(ctx, 'Nothing posts without it', 540, 1260, { w: 600, s: 30, c: SUB });
  },
  why(ctx) {
    ['Why build it', 'this way?'].forEach((l, i) => txt(ctx, l, 540, 720 + i * 100, { w: 800, s: 80, c: i ? LAV : TEXT }));
  },
  precise(ctx) { whyCards(ctx, 0); },
  predict(ctx) { whyCards(ctx, 1); },
  me(ctx) { whyCards(ctx, 2); },
  meta(ctx, t) {
    if (t >= END_T) return endCard(ctx, t);
    const a = S('meta');
    ['This video was made', 'the same way.'].forEach((l, i) => txt(ctx, l, 540, 700 + i * 96, { w: 800, s: 72, c: i ? LAV : TEXT }));
    if (card(ctx, 540, 1000, 560, 150, { scale: pop(a + 0.5), edge: LAV })) { code(ctx, 'frame ' + String(Math.floor(t * 30)).padStart(4, '0'), -180, 0, { w: 700, s: 48 }); ctx.restore(); }
  },
};
function whyCards(ctx, upto) {
  const C = [['🎯', 'Precise', 'The number on screen is the real number', 'precise', GREEN],
             ['🔁', 'Predictable', 'Render it again: the same video', 'predict', LAV],
             ['🗣️', 'Still sounds like me', 'Because I\'m in the loop', 'me', GOLD]];
  txt(ctx, 'Why this way', 540, 380, { w: 800, s: 60 });
  C.forEach(([e, h, s, id, col], i) => { if (i > upto) return; const t0 = S(id) + 0.1, cur = i === upto;
    if (card(ctx, 540, 600 + i * 250, 880, 210, { scale: cur ? pop(t0) : 1, edge: cur ? col : EDGE, alpha: cur ? 1 : 0.55, glow: cur ? col + '55' : null })) {
      emoji(ctx, e, -350, 0, 70); txt(ctx, h, -280, -34, { w: 800, s: 46, align: 'left', c: cur ? col : TEXT }); txt(ctx, s, -280, 34, { w: 600, s: 32, align: 'left', c: SUB }); ctx.restore(); } });
}
function endCard(ctx, t) {
  const k = pop(END_T, 0.4);
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
  if (t >= S('not') && t < END_T) captions(ctx, t);  // the opening question is on screen as text already
} });
