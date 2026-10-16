// scene.js: church-welcome-reel (Reel A), 9:16, 1080x1920. Rebuilt 2026-10-14 to follow the reference reel's style:
// one horizontal chain of agent nodes the camera slides along, with each node's detail panel animating below it,
// emoji branch circles on dashed wires, status rings, a canvas band tinted per step, and a zoom-out at the start and end.
// Drawn in real pixels on g.photo.ctx (no pixel art). LAYOUT: the constants below. TIMING: 03_cues/cues.md.
// The church and family are fictional (labelled). Service times are example values.
const { ease } = P;
const S = (id) => P.cue(id).start;
const lerp = (a, b, p) => a + (b - a) * p;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
P.wait(Promise.all(['500', '600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 40px Inter`))));

// ── look ───────────────────────────────────────────────────────────────────
const BG = '#17181d', NODE = '#23252c', CARD = '#262830', EDGE = '#3b3e48', TEXT = '#f5f5f7', SUB = '#9b9faa';
const CORAL = '#ff6b5b', GREEN = '#3fd27f', AMBER = '#f4b740', BLUE = '#4f8dff', WIRE = '#4a4e5a';
const FONT = (w, s) => `${w} ${s}px Inter, "Segoe UI", Arial, sans-serif`;
const EMOJI = (s) => `${s}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;

// ── layout (real px) ───────────────────────────────────────────────────────
const HEAD_Y = 440, PILL_Y = 592;                          // headline (2 lines) and step pill, centred like the reference
const BAND = { y0: 650, y1: 1330 }, CAPTION_Y = 1412;      // the canvas band and the caption pill right below it
const ANCHOR = { x: 540, y: 790 };                         // where the focused node sits on screen
const SPACING = 700;                                       // distance between chain nodes (neighbours peek in at the edges)
const CHAIN = [  // main nodes, left to right; each is focused from its cue
  { id: 'visitor', cue: 'step1', title: 'First-time visitor', sub: 'Day 1 · 9:04 PM', emoji: '👩', tint: '#1b2236' },
  { id: 'assistant', cue: 'step1.answer', title: 'Church assistant', sub: 'Answers in seconds', emoji: '💬', tint: '#1b2236' },
  { id: 'plan', cue: 'step2', title: 'Plan-a-visit agent', sub: 'Saves the details', emoji: '📅', tint: '#172a2a' },
  { id: 'welcome', cue: 'step3', title: 'Welcome agent', sub: 'Saturday text', emoji: '👋', tint: '#2a1f33' },
  { id: 'greeter', cue: 'step4', title: 'Greeter agent', sub: 'Preps the team', emoji: '🗂️', tint: '#2f1f24' },
  { id: 'follow', cue: 'step5', title: 'Follow-up agent', sub: 'Monday check-in', emoji: '🙏', tint: '#1d2b22' },
  { id: 'sermon', cue: 'step6', title: 'Sermon agent', sub: 'Sunday to post', emoji: '🎙️', tint: '#2d2619' },
  { id: 'social', cue: 'step6.social', title: 'Social agent', sub: 'Makes the posts', emoji: '📣', tint: '#2d2619' },
  { id: 'strategy', cue: 'step7', title: 'Strategy agent', sub: "Finds what's missing", emoji: '🧭', tint: '#1c2134' },
  { id: 'geo', cue: 'step7.geo', title: 'GEO agent', sub: 'Checks, then posts', emoji: '🚀', tint: '#1c2134' },
  { id: 'answer', cue: 'payoff', title: 'Next family asks AI', sub: 'Your church is ready', emoji: '🤖', tint: '#1d2b22' },
];
const PILLS = {
  step1: ['STEP 1', 'First question', 'Day 1 · 9:04 PM'], step2: ['STEP 2', 'Plan a visit', 'Day 1 · 9:06 PM'],
  step3: ['STEP 3', 'Welcome', 'Day 5 · 6 PM'], step4: ['STEP 4', 'Greeter', 'Day 5 · 6:05 PM'],
  step5: ['STEP 5', 'Follow-up', 'Day 8 · 10 AM'], step6: ['STEP 6', 'Sermon', 'Day 7 · 1 PM'],
  step7: ['STEP 7', 'Get found', 'Day 10'], payoff: ['STEP 8', 'Found', 'Day 30'], loop: ['', 'Back to step 1', 'Day 31'],
};
const PER_ROW = 4, ROW_GAP = 1150;                       // the chain wraps into rows like the reference's grid
const nx = (i) => (i % PER_ROW) * SPACING, ny = (i) => Math.floor(i / PER_ROW) * ROW_GAP;
const GRID_W = (PER_ROW - 1) * SPACING, GRID_H = Math.floor((CHAIN.length - 1) / PER_ROW) * ROW_GAP;

// ── helpers ────────────────────────────────────────────────────────────────
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function text(ctx, s, x, y, o = {}) {
  ctx.font = FONT(o.w || 600, o.s || 28); ctx.fillStyle = o.c || TEXT; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y);
}
function emoji(ctx, s, x, y, size) { ctx.font = EMOJI(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(s, x, y + size * 0.05); }
function wrap(ctx, s, maxW, w, size) {
  ctx.font = FONT(w, size); const out = []; let line = '';
  for (const word of s.split(' ')) { const t = line ? line + ' ' + word : word; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = word; } else line = t; }
  if (line) out.push(line); return out;
}
const since = (t0, d = 0.35) => clamp01((P.t - t0) / d);
const pop = (t0, d = 0.35) => { const k = since(t0, d); return k <= 0 ? 0 : ease.back(k); };
function checkDot(ctx, x, y, r = 17) {
  ctx.fillStyle = GREEN; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.strokeStyle = '#0c1a12'; ctx.lineWidth = r / 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x - r * 0.45, y); ctx.lineTo(x - r * 0.1, y + r * 0.35); ctx.lineTo(x + r * 0.5, y - r * 0.35); ctx.stroke();
}
function runDot(ctx, x, y, r = 17) {  // dark circle with a turning coral arc
  ctx.fillStyle = '#121318'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.strokeStyle = CORAL; ctx.lineWidth = 4; const a = P.t * 6; ctx.beginPath(); ctx.arc(x, y, r - 3, a, a + 4.2); ctx.stroke();
}
// The main node: emoji, title, sub; state 'idle' | 'run' | 'done'. The visitor is drawn as an avatar tile.
function chainNode(ctx, n, x, y, state) {
  const edge = state === 'done' ? GREEN : state === 'run' ? CORAL : EDGE;
  ctx.save();
  if (state === 'run') { ctx.shadowColor = CORAL; ctx.shadowBlur = 30 + Math.sin(P.t * 5) * 8; }
  if (n.id === 'visitor') {
    rr(ctx, x - 60, y - 60, 120, 120, 26); ctx.fillStyle = '#2e3140'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = edge; ctx.stroke();
    ctx.shadowBlur = 0; emoji(ctx, n.emoji, x, y, 64);
    text(ctx, n.title, x, y + 92, { w: 700, s: 26 }); text(ctx, n.sub, x, y + 124, { w: 500, s: 21, c: SUB });
    if (state === 'done') checkDot(ctx, x + 56, y - 56); else if (state === 'run') runDot(ctx, x + 56, y - 56);
    ctx.restore(); return;
  }
  const w = 460, h = 128;
  rr(ctx, x - w / 2, y - h / 2, w, h, 26); ctx.fillStyle = NODE; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = edge; ctx.stroke(); ctx.shadowBlur = 0;
  emoji(ctx, n.emoji, x - w / 2 + 62, y, 54);
  text(ctx, n.title, x - w / 2 + 112, y - 18, { w: 700, s: 33, align: 'left' });
  text(ctx, n.sub, x - w / 2 + 112, y + 24, { w: 500, s: 23, c: SUB, align: 'left' });
  if (state === 'done') checkDot(ctx, x + w / 2 - 4, y - h / 2 + 4); else if (state === 'run') runDot(ctx, x + w / 2 - 4, y - h / 2 + 4);
  ctx.restore();
}
function hwire(ctx, x0, x1, y, color) {  // the chain link: a line with a mid dot and, once active, an arrowhead
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  ctx.beginPath(); ctx.arc((x0 + x1) / 2, y, 7, 0, 7); ctx.fill();
  if (color === GREEN) { ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 - 14, y - 9); ctx.lineTo(x1 - 14, y + 9); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function rowWire(ctx, x0, y0, x1, y1, color) {  // from the end of one row down to the start of the next
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, y0);
  ctx.bezierCurveTo(x0 + 260, y0 + 620, x1 - 260, y1 - 620, x1, y1); ctx.stroke(); ctx.restore();
}
function branch(ctx, x0, y0, x1, y1, on, p = 1) {  // a curved branch: dashed grey until it is on, then solid green
  if (p <= 0) return; const my = (y0 + y1) / 2;
  ctx.save(); ctx.strokeStyle = on ? GREEN : WIRE; ctx.lineWidth = 4; ctx.setLineDash(on ? [] : [10, 10]); ctx.lineDashOffset = -P.t * 30;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.bezierCurveTo(x0, my, x1, my, x1, lerp(y0, y1, p)); ctx.stroke(); ctx.restore();
}
function circleNode(ctx, x, y, em, label, o = {}) {  // a branch child: a circle with an emoji and a label below
  const k = o.scale ?? 1; if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  const edge = o.state === 'warn' ? AMBER : o.on ? GREEN : EDGE;
  if (o.on || o.state === 'warn') { ctx.shadowColor = edge; ctx.shadowBlur = 22; }
  ctx.beginPath(); ctx.arc(0, 0, 66, 0, 7); ctx.fillStyle = '#2a2d36'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = edge; ctx.stroke(); ctx.shadowBlur = 0;
  emoji(ctx, em, 0, 0, 54);
  wrap(ctx, label, 220, 700, 25).forEach((l, i) => text(ctx, l, 0, 102 + i * 30, { w: 700, s: 25 }));
  if (o.on) checkDot(ctx, 48, -48, 15);
  ctx.restore();
}
function panel(ctx, x, y, w, h, o = {}) {  // a detail card under a node; returns false if not shown, else the caller must ctx.restore()
  const k = o.scale ?? 1; if (k <= 0) return false;
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= Math.min(1, k); ctx.translate(0, (1 - k) * 20);
  rr(ctx, -w / 2, 0, w, h, 24); ctx.fillStyle = CARD; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = o.edge || '#363944'; ctx.stroke();
  if (o.title) text(ctx, o.title, -w / 2 + 26, 32, { w: 600, s: 22, c: SUB, align: 'left' });
  return true;
}
function bubble(ctx, s, x, y, o = {}) {  // typed chat bubble; o.right anchors its right edge at x (a visitor message)
  const p = o.progress ?? 1; if (p <= 0) return 0;
  const size = o.s || 26, lines = wrap(ctx, s, (o.maxW || 420) - 40, 500, size), lh = size * 1.32;
  ctx.font = FONT(500, size);
  const w = Math.min(o.maxW || 420, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 40), h = lines.length * lh + 28;
  const bx = o.right ? x - w : x;
  rr(ctx, bx, y, w, h, 20); ctx.fillStyle = o.bg || '#353845'; ctx.fill();
  let n = Math.ceil(p * s.length);
  lines.forEach((l, i) => { text(ctx, l.slice(0, Math.max(0, n)), bx + 20, y + 14 + lh * (i + 0.5), { w: 500, s: size, c: o.fg || TEXT, align: 'left' }); n -= l.length + 1; });
  return h;
}
function pill(ctx, s, x, y, o = {}) {
  const k = o.scale ?? 1; if (k <= 0) return; ctx.font = FONT(700, o.s || 24); const w = ctx.measureText(s).width + 36, h = (o.s || 24) + 22;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = o.bg || '#353845'; ctx.fill();
  if (o.edge) { ctx.lineWidth = 3; ctx.strokeStyle = o.edge; ctx.stroke(); }
  text(ctx, s, 0, 1, { w: 700, s: o.s || 24, c: o.c || TEXT }); ctx.restore();
}
const typed = (t0, dur) => clamp01((P.t - t0) / dur);
const wordAt = (w, cue) => P.at(w, cue);  // when a word is spoken

// ── detail panels, drawn under the focused node (local coords: node centre at 0,0) ──
const DETAILS = {
  visitor(ctx, a) {
    if (!panel(ctx, 230, 190, 560, 300, { title: 'Church website · chat', scale: since(a + 0.5, 0.4) })) return;
    bubble(ctx, 'What time is service? Anything for my kids?', 250, 64, { right: true, bg: BLUE, maxW: 460, progress: typed(a + 1.2, 2.6) });
    ctx.restore();
  },
  assistant(ctx, a) {
    if (!panel(ctx, 0, 110, 600, 400, { title: 'Church assistant · approved church info', edge: GREEN })) return;
    bubble(ctx, 'What time is service? Anything for my kids?', 270, 60, { right: true, bg: BLUE, maxW: 440 });
    const h = bubble(ctx, 'Sundays at 10 AM, and kids church runs during the service 🙂', -270, 170, { bg: '#2f3a33', maxW: 480, progress: typed(a + 0.8, 2.2) });
    if (P.t > a + 4.2) pill(ctx, 'Plan a visit →', -120, 200 + h, { bg: GREEN, c: '#0b1a11', s: 26, scale: pop(a + 4.2) });
    ctx.restore();
  },
  plan(ctx, a) {
    if (!panel(ctx, 0, 110, 580, 400, { title: 'Plan a visit' })) return;
    [['Family', '4 people · 2 kids'], ['Service', 'Sunday 10 AM'], ['Phone', '(•••) ••• 0142']].forEach(([l, v], i) => {
      const y = 86 + i * 72; text(ctx, l, -264, y, { w: 500, s: 23, c: SUB, align: 'left' });
      rr(ctx, -120, y - 24, 380, 48, 12); ctx.fillStyle = '#1e2027'; ctx.fill();
      const p = typed(a + 0.6 + i * 0.7, 0.6); text(ctx, v.slice(0, Math.ceil(p * v.length)), -102, y, { w: 600, s: 24, align: 'left' });
      if (p >= 1) checkDot(ctx, 236, y, 12);
    });
    bubble(ctx, "You're all set for Sunday at 10 AM! ✅", -250, 300, { bg: '#1f5d3a', maxW: 520, progress: typed(a + 3, 1.2) });
    ctx.restore();
  },
  welcome(ctx, a) {
    [['🚗', 'Where to park', 'park'], ['🧒', 'Kids check-in', 'kids'], ['🎥', 'Pastor welcome video', 'video']].forEach(([em, l, w], i) => {
      const x = (i - 1) * 300, on = P.t >= wordAt(w, 'step3');
      branch(ctx, 0, 70, x, 240, on, since(a + 0.3 + i * 0.15, 0.5)); circleNode(ctx, x, 310, em, l, { on, scale: pop(a + 0.4 + i * 0.15) });
    });
  },
  greeter(ctx, a) {
    const tt = wordAt('team', 'step4') - 0.2;
    branch(ctx, 0, 70, -165, 160, P.t > a + 1, since(a + 0.3, 0.5)); branch(ctx, 0, 70, 170, 160, P.t > tt, since(a + 0.3, 0.5));
    if (panel(ctx, -165, 160, 320, 300, { title: 'People database', edge: P.t > a + 1 ? GREEN : undefined, scale: since(a + 0.8, 0.4) })) {
      [['👨‍👩‍👧‍👦', 'Family of 4'], ['🧒', '2 kids'], ['🕙', 'Sunday 10 AM'], ['⭐', 'First visit']].forEach(([em, s], i) => {
        if (P.t < a + 1.2 + i * 0.4) return; emoji(ctx, em, -120, 86 + i * 52, 30); text(ctx, s, -90, 86 + i * 52, { w: 600, s: 24, align: 'left' }); });
      ctx.restore();
    }
    if (panel(ctx, 175, 160, 320, 300, { title: 'Welcome team', edge: P.t > tt ? AMBER : undefined, scale: since(tt, 0.4) })) {
      emoji(ctx, '🔔', 0, 110, 56);
      ['New family Sunday', '10 AM · 2 kids', 'Meet them at the door'].forEach((s, i) => text(ctx, s, 0, 180 + i * 34, { w: i === 2 ? 700 : 500, s: 23, c: i === 2 ? AMBER : TEXT }));
      ctx.restore();
    }
  },
  follow(ctx, a) {
    if (panel(ctx, 0, 100, 560, 150, { title: 'Text message · Monday 10 AM', scale: since(a + 0.4, 0.4) })) {
      bubble(ctx, 'Thanks for coming Sunday! How was it? 😊', -250, 54, { bg: '#1f5d3a', maxW: 500, progress: typed(a + 0.9, 1.6) }); ctx.restore();
    }
    const lv = S('step5.loved'), wr = S('step5.wrong');
    branch(ctx, 0, 250, -180, 290, P.t >= lv, since(a + 1.5, 0.5)); circleNode(ctx, -180, 350, '🍽️', 'Newcomers lunch', { on: P.t >= lv, scale: pop(a + 1.6) });
    branch(ctx, 0, 250, 180, 290, false, since(a + 1.5, 0.5)); circleNode(ctx, 180, 350, '⚠️', 'Tell the pastor first', { state: P.t >= wr ? 'warn' : undefined, scale: pop(a + 1.7) });
  },
  sermon(ctx, a) {
    if (!panel(ctx, 0, 100, 620, 420, { title: "Sunday's service video", scale: since(a + 0.3, 0.4) })) return;
    rr(ctx, -284, 56, 250, 160, 14); ctx.fillStyle = '#3a3324'; ctx.fill(); emoji(ctx, '⛪', -159, 136, 70);
    if (P.t < a + 3) { const sy = 56 + ((P.t - a) * 120) % 160; ctx.fillStyle = BLUE; ctx.shadowColor = BLUE; ctx.shadowBlur = 16; ctx.fillRect(-284, sy, 250, 4); ctx.shadowBlur = 0; }
    text(ctx, P.t < a + 3 ? 'Transcribing…' : 'Transcript ready ✓', 10, 76, { w: 600, s: 22, c: P.t < a + 3 ? SUB : GREEN, align: 'left' });
    for (let i = 0; i < 5; i++) { const p = typed(a + 0.8 + i * 0.35, 0.5); if (p <= 0) break; rr(ctx, 10, 104 + i * 26, (180 + (i * 37) % 90) * p, 12, 6); ctx.fillStyle = '#41444f'; ctx.fill(); }
    [['📝 Notes', a + 3.2], ['🌐 Post · draft', a + 4.4]].forEach(([s, t0], i) => pill(ctx, s, -150 + i * 300, 270, { edge: GREEN, s: 24, scale: pop(t0) }));
    pill(ctx, '✓ Editor approved', 0, 350, { bg: GREEN, c: '#0b1a11', s: 26, scale: pop(wordAt('approves', 'step6')) });
    ctx.restore();
  },
  social(ctx, a) {
    [['📸', 'Instagram post', 'Instagram'], ['👍', 'Facebook post', 'Facebook']].forEach(([em, l, w], i) => {
      const x = (i - 0.5) * 340, on = P.t >= wordAt(w, 'step6.social');
      branch(ctx, 0, 70, x, 240, on, since(a + 0.3, 0.5)); circleNode(ctx, x, 310, em, l, { on, scale: pop(a + 0.4 + i * 0.2) });
    });
  },
  strategy(ctx, a) {
    if (!panel(ctx, 0, 100, 620, 440, { title: 'What visitors asked the assistant', scale: since(a + 0.3, 0.4) })) return;
    const qs = [['Service times?', true], ['Is there parking?', false], ['What ages for kids church?', false], ['Directions?', true], ['What should we wear?', false]];
    const scan = a + 1;
    qs.forEach(([q, ok], i) => {
      const y = 84 + i * 60; if (P.t < a + 0.6 + i * 0.25) return;
      text(ctx, '“' + q + '”', -282, y, { w: 500, s: 24, align: 'left' });
      if (P.t > scan + i * 0.5) { if (ok) pill(ctx, 'answered', 215, y, { s: 19, edge: GREEN }); else pill(ctx, 'not answered', 215, y, { s: 19, bg: '#4a2224', c: CORAL }); }
    });
    if (P.t < scan + 2.6 && P.t > scan) { const y = 62 + (P.t - scan) / 2.6 * 300; ctx.fillStyle = 'rgba(79,141,255,0.22)'; ctx.fillRect(-300, y, 600, 44); }
    pill(ctx, '3 FAQ drafts written ✍️', 0, 398, { bg: '#2f3a55', s: 24, scale: pop(wordAt('drafts', 'step7')) });
    ctx.restore();
  },
  geo(ctx, a) {
    if (!panel(ctx, 0, 100, 580, 380, { title: 'Before it goes live', scale: since(a + 0.3, 0.4) })) return;
    [['Google guidelines', 'Google'], ['ChatGPT search can reach it', 'ChatGPT'], ['Answers the real question', 'guidelines']].forEach(([s, w], i) => {
      const y = 92 + i * 70, on = P.t >= wordAt(w, 'step7.geo') + i * 0.2;
      rr(ctx, -250, y - 22, 44, 44, 10); ctx.fillStyle = on ? GREEN : '#1e2027'; ctx.fill();
      if (on) { ctx.strokeStyle = '#0b1a11'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-238, y); ctx.lineTo(-229, y + 9); ctx.lineTo(-214, y - 9); ctx.stroke(); }
      text(ctx, s, -186, y, { w: 600, s: 26, align: 'left', c: on ? TEXT : SUB });
    });
    pill(ctx, '🚀 LIVE on your website', 0, 320, { bg: GREEN, c: '#0b1a11', s: 28, scale: pop(wordAt('live', 'step7.geo')) });
    ctx.restore();
  },
  answer(ctx, a) {
    if (!panel(ctx, 0, 100, 640, 440, { title: 'AI answer · illustration', scale: since(a + 0.3, 0.4) })) return;
    bubble(ctx, 'Church near me with a great kids ministry?', 290, 56, { right: true, bg: BLUE, maxW: 470, progress: typed(a + 0.6, 1.6) });
    for (let i = 0; i < 3; i++) if (P.t > a + 2.2 + i * 0.2) { rr(ctx, -290, 170 + i * 30, 440 - i * 90, 14, 7); ctx.fillStyle = '#3a3d48'; ctx.fill(); }
    const k = pop(wordAt('ready', 'payoff'));
    if (k) { ctx.save(); ctx.translate(0, 330); ctx.scale(k, k); ctx.shadowColor = GREEN; ctx.shadowBlur = 30;
      rr(ctx, -290, -70, 580, 140, 22); ctx.fillStyle = '#1f3b2c'; ctx.fill(); ctx.shadowBlur = 0; ctx.lineWidth = 4; ctx.strokeStyle = GREEN; ctx.stroke();
      emoji(ctx, '⛪', -230, 0, 52); text(ctx, 'Your church', -180, -20, { w: 800, s: 32, align: 'left' });
      text(ctx, 'Sun 10 AM · Kids church · Plan a visit', -180, 22, { w: 500, s: 22, c: '#bfe9cf', align: 'left' }); ctx.restore(); }
    ctx.restore();
  },
};

// ── camera ─────────────────────────────────────────────────────────────────
function focusIndex(t) { let k = 0; CHAIN.forEach((n, i) => { if (t >= S(n.cue) - 0.45) k = i; }); return k; }
function stateOf(i, t) {
  const start = S(CHAIN[i].cue), next = CHAIN[i + 1] ? S(CHAIN[i + 1].cue) : Infinity;
  return t < start ? 'idle' : t < Math.min(start + 2.2, next - 0.3) ? 'run' : 'done';
}
function camera(t) {  // { x, y, z }: the plane point shown at ANCHOR, and the zoom
  const k = focusIndex(t), u = ease.inOut(clamp01((t - (S(CHAIN[k].cue) - 0.45)) / 0.7));
  const j = Math.max(0, k - 1), uu = k === 0 ? 1 : u;
  let x = lerp(nx(j), nx(k), uu), y = lerp(ny(j), ny(k), uu), z = 1;
  const midX = GRID_W / 2, ov = 0.215, y0c = y;
  const overY = (zz) => GRID_H / 2 + 250 - ((BAND.y0 + BAND.y1) / 2 - ANCHOR.y) / zz;  // keeps the whole grid centred in the band
  const intro = ease.inOut(clamp01((t - 0.15) / 1.0));                       // opens on the whole workflow, then dives in
  if (intro < 1) { z = lerp(ov, 1, intro); x = lerp(midX, x, intro); y = lerp(overY(ov), y0c, intro); }
  if (t >= S('loop') - 0.3) {                                                 // pulls back over the whole flywheel at the end
    const out = ease.inOut(clamp01((t - S('loop') + 0.3) / 1.0));
    z = lerp(1, ov, out); x = lerp(x, midX, out); y = lerp(y0c, overY(ov), out);
  }
  return { x, y, z };
}

// ── fixed parts ────────────────────────────────────────────────────────────
function headline(ctx, a = 'HOW MY ', b = 'AI CHURCH WEBSITE', c = 'WELCOMES NEW FAMILIES') {
  ctx.font = FONT(800, 62); const w1 = ctx.measureText(a).width, w2 = ctx.measureText(b).width, x0 = 540 - (w1 + w2) / 2;
  text(ctx, a, x0, HEAD_Y, { w: 800, s: 62, align: 'left' }); text(ctx, b, x0 + w1, HEAD_Y, { w: 800, s: 62, c: CORAL, align: 'left' });
  text(ctx, c, 540, HEAD_Y + 72, { w: 800, s: 62 });
}
function stepPill(ctx, t) {
  let id = null; for (const k of Object.keys(PILLS)) if (t >= S(k) && (id === null || S(k) >= S(id))) id = k;
  if (!id) return; const [a, b, c] = PILLS[id];
  ctx.font = FONT(800, 24); const wa = a ? ctx.measureText(a).width + 30 : 0; ctx.font = FONT(700, 32); const wb = ctx.measureText(b).width; ctx.font = FONT(500, 26); const wc = ctx.measureText(c).width;
  const w = 16 + wa + (a ? 14 : 0) + wb + 16 + wc + 22, x = 540 - w / 2;
  rr(ctx, x, PILL_Y - 32, w, 64, 32); ctx.fillStyle = '#121318'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#3a3d47'; ctx.stroke();
  let cx = x + 16;
  if (a) { rr(ctx, cx, PILL_Y - 21, wa, 42, 21); ctx.fillStyle = CORAL; ctx.fill(); text(ctx, a, cx + wa / 2, PILL_Y + 1, { w: 800, s: 24, c: '#1a0f0e' }); cx += wa + 14; }
  text(ctx, b, cx, PILL_Y, { w: 700, s: 32, align: 'left' }); cx += wb + 16; text(ctx, c, cx, PILL_Y + 2, { w: 500, s: 26, c: SUB, align: 'left' });
}
let CHUNKS = null;
function captions(ctx, t) {  // word by word, like the reference: said words dark, the current word coral, the rest grey
  if (!CHUNKS) { CHUNKS = []; let cur = [];
    P.words.forEach((w, i) => { cur.push(w); const n = P.words[i + 1];
      if (!n || cur.length >= 3 || /[.,!?;:]$/.test(w.text) || n.start - w.end > 0.3) { CHUNKS.push(cur); cur = []; } }); }
  const i = CHUNKS.findIndex((c, k) => t >= c[0].start && t < (CHUNKS[k + 1] ? CHUNKS[k + 1][0].start : c[c.length - 1].end + 0.6));
  if (i < 0) return;
  const words = CHUNKS[i], lit = words.reduce((k, w, n) => (t >= w.start ? n : k), 0);
  ctx.font = FONT(800, 54); const parts = words.map((w) => w.text.replace(/[,;:]$/, '')), sp = 15;
  const ws = parts.map((s) => ctx.measureText(s).width), W = ws.reduce((x, y) => x + y, 0) + sp * (parts.length - 1) + 60;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 24; rr(ctx, 540 - W / 2, CAPTION_Y - 46, W, 92, 20); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
  let x = 540 - W / 2 + 30;
  parts.forEach((s, n) => { text(ctx, s, x, CAPTION_Y + 2, { w: 800, s: 54, c: n === lit ? CORAL : n < lit ? '#14151a' : '#9a9ca5', align: 'left' }); x += ws[n] + sp; });
}
function cta(ctx, t) {
  const a = S('cta');
  headline(ctx, 'Turn your ', 'church website', 'into this digital front door');
  const k = pop(a + 0.4); if (!k) return;
  ctx.save(); ctx.translate(540, 720); ctx.scale(k, k);
  rr(ctx, -410, -62, 820, 124, 62); ctx.fillStyle = '#ffffff'; ctx.fill();
  const tp = Math.floor(clamp01((t - P.at('BUILD', 'cta') + 0.6) / 0.6) * 5), s = 'BUILD'.slice(0, tp);
  ctx.fillStyle = AMBER; ctx.beginPath(); ctx.arc(-350, 0, 12, 0, 7); ctx.fill();
  text(ctx, s || 'Add a comment…', -316, 2, { w: s ? 800 : 500, s: 42, c: s ? '#111' : '#9a9da6', align: 'left' });
  rr(ctx, 236, -38, 150, 76, 38); ctx.fillStyle = CORAL; ctx.fill(); text(ctx, 'Post', 311, 2, { w: 800, s: 32 });
  ctx.restore();
  if (t > P.at('send', 'cta')) { text(ctx, "and I'll send it over to you 🙌", 540, 840, { w: 600, s: 34, c: SUB }); text(ctx, '(for church leaders)', 540, 892, { w: 500, s: 28, c: '#6d717c' }); }
}

// ── frame ──────────────────────────────────────────────────────────────────
Eduba.frame({ overlay: true, step: 30, draw(g, t) {
  const ctx = g.photo.ctx;
  ctx.fillStyle = BG; ctx.fillRect(0, 0, 1080, 1920);
  if (t >= S('cta')) { cta(ctx, t); captions(ctx, t); return; }
  headline(ctx); stepPill(ctx, t);
  const cam = camera(t), k = focusIndex(t), overview = cam.z < 0.9;
  // the canvas band, tinted for the focused step, with a dot grid that moves with the camera
  ctx.save(); ctx.beginPath(); ctx.rect(0, BAND.y0, 1080, BAND.y1 - BAND.y0); ctx.clip();
  ctx.fillStyle = CHAIN[k].tint; ctx.fillRect(0, BAND.y0, 1080, BAND.y1 - BAND.y0);
  const gs = Math.max(12, 36 * cam.z), ox = (((ANCHOR.x - cam.x * cam.z) % gs) + gs) % gs, oy = (((ANCHOR.y - cam.y * cam.z) % gs) + gs) % gs;
  ctx.fillStyle = 'rgba(255,255,255,0.07)'; for (let y = BAND.y0 - gs + oy; y < BAND.y1; y += gs) for (let x = ox; x < 1080; x += gs) ctx.fillRect(x, y, 3, 3);
  ctx.translate(ANCHOR.x, ANCHOR.y); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  CHAIN.forEach((n, i) => { if (!i) return; const c = t >= S(n.cue) - 0.45 || (overview && t > 1) ? GREEN : WIRE, x0 = nx(i - 1) + (i === 1 ? 70 : 240);
    if (ny(i) === ny(i - 1)) hwire(ctx, x0, nx(i) - 240, ny(i), c); else rowWire(ctx, x0, ny(i - 1), nx(i) - 240, ny(i), c); });
  CHAIN.forEach((n, i) => chainNode(ctx, n, nx(i), ny(i), overview && t > 1 ? 'done' : stateOf(i, t)));
  CHAIN.forEach((n, i) => {  // the focused node's details; in the overviews, every node's details
    if (!(overview ? (t > 1 || i === 0) : i === k)) return;
    ctx.save(); ctx.translate(nx(i), ny(i)); ctx.globalAlpha = overview ? 0.9 : clamp01((t - (S(n.cue) - 0.3)) / 0.3);
    DETAILS[n.id](ctx, overview && t > 1 ? -1e3 : S(n.cue)); ctx.restore();
  });
  ctx.restore();
  let gr = ctx.createLinearGradient(0, BAND.y0, 0, BAND.y0 + 50); gr.addColorStop(0, BG); gr.addColorStop(1, 'rgba(23,24,29,0)'); ctx.fillStyle = gr; ctx.fillRect(0, BAND.y0, 1080, 50);
  gr = ctx.createLinearGradient(0, BAND.y1 - 50, 0, BAND.y1); gr.addColorStop(0, 'rgba(23,24,29,0)'); gr.addColorStop(1, BG); ctx.fillStyle = gr; ctx.fillRect(0, BAND.y1 - 50, 1080, 50);
  text(ctx, 'Example church and family · illustration', 540, 1488, { w: 500, s: 20, c: '#555963' });
  captions(ctx, t);
} });
