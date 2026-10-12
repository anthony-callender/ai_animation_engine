// scene.js: code-grounded-analytics-agent (Video 2), 16:9, world 320x180, text layer 640x360.
// LAYOUT lives here (constants below). TIMING lives in 03_cues/cues.md, which compiles to cues.js.
// Everything is an authored illustration, labelled on screen. Nothing is recorded: no real code, SQL, data, numbers,
// organization names or UI. The brand, helpers and engineer are copied from Video 1 (sermon-publishing-workflow).
const E = Eduba, { prog, live, past, ease } = P;
const S = (id) => P.cue(id).start;
const lerp = (a, b, p) => a + (b - a) * p;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// ── brand ──────────────────────────────────────────────────────────────────
const NAVY = '#17263F', NAVY_DOT = '#22365A', NAVY_DEEP = '#0F1A2C', NAVY_CARD = '#203556';
const TEAL = '#2B8980', TEAL_LIGHT = '#5FB8AE', GOLD = '#D9B877', CREAM = '#F3EBD9', MUTED = '#8C9AB3', INK = '#0B1220';

// ── layout (world px) ──────────────────────────────────────────────────────
// Keep-clear zones: captions use the bottom band; the engineer owns the bottom-left corner in animated scenes.
const FREE = { captions: { x: 0, y: 146, w: 320, h: 34 }, engineer: { x: 2, y: 92, w: 58, h: 54 } };
const ENGINEER = { x: 26, floor: 140, scale: 2, desk: { x: 6, y: 128, w: 50 } };

// The generic engineer (not a likeness of anyone): medium-brown skin, an afro, a light sand sweater and navy trousers.
// The kit has no afro and only two skin presets, so the sprite is adjusted here, in this project only.
const SKIN = '#A06A48', SKIN_SHADE = '#7A4E33', CAMEL = '#D6BC8E', CAMEL_SHADE = '#B39668';
const ENGINEER_SPRITE = (() => {
  const spr = E.person({ hair: 'bald', hairColor: '#1E1410', hairShade: '#3A2620', parts: ['brows'], top: CAMEL, topShade: CAMEL_SHADE,
    bottomColor: '#2A3B5C', bottomShade: INK, arms: { upper: CAMEL } });
  const ADD = ['....kkkkkkkk....', '..kkHHhHHhHHkk..', '.kHHhHHHHHhHHHk.'];  // afro crown above the head
  const CROWN = ['kHHHHHhHHHHhHHHk', 'kHhHHHHHHhHHHHhk', 'kHHHhHHHHHHhHHHk'];
  for (const rows of Object.values(spr.frames)) {
    CROWN.forEach((r, i) => { rows[i] = r.split(''); });
    for (const [i, l, r] of [[3, 'kHh', 'hHk'], [4, '.kH', 'Hk.'], [5, '..k', 'k..']]) {  // hair around the sides of the face
      [...l].forEach((ch, c) => { if (ch !== '.') rows[i][c] = ch; });
      [...r].forEach((ch, c) => { if (ch !== '.') rows[i][13 + c] = ch; });
    }
    rows.unshift(...ADD.map((r) => r.split('')));
  }
  spr.h += ADD.length;
  for (const a of Object.values(spr.anchors)) a[1] += ADD.length;
  spr.rig.shoulders = spr.rig.shoulders.map(([x, y]) => [x, y + ADD.length]);
  Object.assign(spr.pal, { S: SKIN, s: SKIN_SHADE });
  spr.rig.hand = SKIN;
  return spr;
})();

// ── helpers ────────────────────────────────────────────────────────────────
function background(g) {
  const px = g.px;
  px.clear(NAVY);
  for (let y = 6; y < g.H; y += 12) for (let x = 6; x < g.W; x += 12) px.rect(x, y, 2, 1, NAVY_DOT);
}
function chip(g, text) { E.label(g, text, 10, 8, { bg: NAVY_DEEP, fg: GOLD }); }
function nameTag(g) {  // top-right, every animated scene
  const s = g.type.label, m = g.hud.measure('TONY CALLENDER', s);
  E.label(g, 'TONY CALLENDER', 310 - (m.w + 8) / 2, 8, { bg: NAVY_DEEP, fg: CREAM });
}
function engineer(g, pose) {
  E.actor(g, ENGINEER_SPRITE, { x: ENGINEER.x, y: ENGINEER.floor, scale: ENGINEER.scale, pose, talk: false });
  const d = ENGINEER.desk, px = g.px;
  px.rect(d.x, d.y, d.w, 4, '#5B4636'); px.line(d.x, d.y, d.x + d.w - 1, d.y, '#7A604B');
  px.rect(d.x + 3, d.y + 4, 3, 12, '#3E2F25'); px.rect(d.x + d.w - 6, d.y + 4, 3, 12, '#3E2F25');
  px.rect(d.x + 30, d.y - 14, 18, 12, INK); px.rect(d.x + 31, d.y - 13, 16, 10, TEAL);  // monitor
  px.rect(d.x + 38, d.y - 2, 2, 2, INK);
}
function textBox(g, str, x, y, w, h, color, role = 'body') { g.textIn(str, x, y, w, h, color, role); }
// centred text wrapped to w (world px), no plate behind it
function wrapText(g, str, cx, y, w, color, role = 'body') { E.plate(g, str, cx, y, { align: 'center', w, role, bg: -1, fg: color, pad: 0 }); }

// pixel icons, centred on (cx, cy)
function drawIcon(g, kind, cx, cy, o = {}) {
  const px = g.px, c = o.color || CREAM, dim = o.dim;
  if (kind === 'video') {
    px.rect(cx - 12, cy - 8, 24, 16, dim ? MUTED : CREAM); px.rect(cx - 11, cy - 7, 22, 14, INK);
    px.poly([[cx - 3, cy - 5], [cx - 3, cy + 5], [cx + 5, cy]], dim ? MUTED : '#E05A4E');
  } else if (kind === 'gear') {
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + (o.spin || 0); px.rect(Math.round(cx + Math.cos(a) * 9) - 2, Math.round(cy + Math.sin(a) * 9) - 2, 4, 4, c); }
    px.circ(cx, cy, 8, c); px.circ(cx, cy, 3, NAVY_CARD);
  } else if (kind === 'page') {
    px.rect(cx - 9, cy - 11, 18, 22, c); px.poly([[cx + 4, cy - 11], [cx + 9, cy - 11], [cx + 9, cy - 6]], NAVY_CARD);
    for (let k = 0; k < 4; k++) px.rect(cx - 6, cy - 6 + k * 4, k === 3 ? 7 : 12, 1, MUTED);
  } else if (kind === 'editor') {
    const col = dim ? MUTED : c;
    px.circ(cx - 3, cy - 5, 4, col); px.rect(cx - 9, cy, 12, 9, col);
    if (!dim) { px.line(cx + 3, cy + 2, cx + 6, cy + 5, TEAL_LIGHT, 2); px.line(cx + 6, cy + 5, cx + 12, cy - 2, TEAL_LIGHT, 2); }
  } else if (kind === 'shield') {
    px.poly([[cx - 9, cy - 10], [cx + 9, cy - 10], [cx + 9, cy + 1], [cx, cy + 11], [cx - 9, cy + 1]], TEAL);
    px.line(cx - 4, cy, cx - 1, cy + 3, CREAM, 2); px.line(cx - 1, cy + 3, cx + 5, cy - 4, CREAM, 2);
  } else if (kind === 'collapse') {  // a stack of boxes folding into one checked box
    for (let k = 0; k < 3; k++) px.rectb(cx - 12 + k * 3, cy - 8 + k * 3, 10, 10, MUTED);
    px.rect(cx + 2, cy - 2, 11, 11, GOLD); px.line(cx + 4, cy + 3, cx + 6, cy + 6, INK, 2); px.line(cx + 6, cy + 6, cx + 11, cy, INK, 2);
  }
}

// ── Video 2 layout and scenes ──────────────────────────────────────────────
const GREEN = '#3FBF7F', RED = '#E05A4E', IDLE = '#56698D';
const ARCH = [  // the architecture row: centre x of each node
  { x: 84, label: 'Source code snapshot', icon: 'code' }, { x: 132, label: 'AI agent', icon: 'agent' },
  { x: 180, label: 'Read-only SQL guard', icon: 'shield' }, { x: 228, label: 'PostgreSQL', icon: 'db' },
  { x: 276, label: 'Answer + evidence', icon: 'answer' },
];
const STACK = ['Python', 'Claude Agent SDK', 'FastAPI', 'PostgreSQL'];
const GUARD_ROWS = [
  { cue: 'guard.select', text: 'Single SELECT / WITH' }, { cue: 'guard.write', text: 'No write keywords' },
  { cue: 'guard.tables', text: 'Tables + columns checked' }, { cue: 'guard.tx', text: 'Read-only transaction' },
  { cue: 'guard.limit', text: 'Timeout + row limit' },
];
const CODE_PANEL = { x: 66, y: 40, w: 110, h: 88 }, GUARD = { x: 184, y: 40, w: 128, h: 88 };
const CLOSE_CARDS = [
  { cue: 'close', x: 100, label: 'Not a claim of perfect AI', icon: 'scale' },
  { cue: 'close.control', x: 180, label: 'Evidence you can check', icon: 'search' },
  { cue: 'close.control', x: 260, label: 'Hard limits in code', icon: 'shield', delay: 0.6 },
];
const BARS = [34, 52, 28, 60, 44, 22, 56, 38];  // abstract code lines (no real code is shown)
const DEF_BAR = 6;                                      // the bar that stands for the business definition

function icon2(g, kind, cx, cy, c = CREAM) {
  const px = g.px;
  if (kind === 'code') { px.rect(cx - 9, cy - 11, 18, 22, c); [10, 6, 12, 8].forEach((w, k) => px.rect(cx - 6, cy - 7 + k * 4, w, 1, NAVY_CARD)); }
  else if (kind === 'agent') { px.rect(cx - 8, cy - 6, 16, 12, c); px.rect(cx - 5, cy - 3, 3, 3, TEAL); px.rect(cx + 2, cy - 3, 3, 3, TEAL); px.rect(cx - 3, cy + 2, 6, 1, NAVY_CARD); px.rect(cx - 1, cy - 10, 2, 4, c); px.rect(cx - 2, cy - 11, 4, 2, GOLD); }
  else if (kind === 'db') { px.rect(cx - 9, cy - 7, 18, 14, c); px.circ(cx, cy - 7, 4, c); px.rect(cx - 9, cy - 9, 18, 3, c); px.line(cx - 9, cy - 2, cx + 8, cy - 2, MUTED); px.line(cx - 9, cy + 3, cx + 8, cy + 3, MUTED); }
  else if (kind === 'answer') { px.rect(cx - 10, cy - 8, 20, 16, c); px.rect(cx - 7, cy - 5, 9, 1, NAVY_CARD); px.rect(cx - 7, cy - 2, 12, 1, NAVY_CARD); px.line(cx + 1, cy + 3, cx + 3, cy + 5, GREEN, 2); px.line(cx + 3, cy + 5, cx + 7, cy + 1, GREEN, 2); }
  else if (kind === 'search') { px.circ(cx - 2, cy - 2, 6, c); px.circ(cx - 2, cy - 2, 4, NAVY_CARD); px.line(cx + 3, cy + 3, cx + 8, cy + 8, c, 2); }
  else if (kind === 'scale') {  // a balance: post, tilted beam, two hanging pans
    px.rect(cx - 1, cy - 8, 2, 16, c); px.rect(cx - 5, cy + 7, 10, 2, c); px.line(cx - 10, cy - 5, cx + 10, cy - 8, c, 2);
    px.line(cx - 10, cy - 5, cx - 10, cy + 1, MUTED); px.line(cx + 10, cy - 8, cx + 10, cy - 2, MUTED);
    px.poly([[cx - 14, cy + 1], [cx - 6, cy + 1], [cx - 8, cy + 4], [cx - 12, cy + 4]], GOLD); px.poly([[cx + 6, cy - 2], [cx + 14, cy - 2], [cx + 12, cy + 1], [cx + 8, cy + 1]], GOLD); }
  else drawIcon(g, kind, cx, cy, { color: c });
}
function card(g, x, y, w, h, edge = GOLD, fill = NAVY_CARD) {
  const px = g.px; px.rect(x + 3, y + 3, w, h, INK); px.rect(x, y, w, h, fill); px.rectb(x, y, w, h, edge);
}
function tick(g, x, y, ok) {  // a 9x9 check (green) or cross (red) box on the art layer
  const px = g.px;
  px.rect(x, y, 9, 9, ok ? GREEN : RED);
  if (ok) { px.line(x + 2, y + 4, x + 4, y + 6, INK, 1); px.line(x + 4, y + 6, x + 7, y + 2, INK, 1); }
  else { px.line(x + 2, y + 2, x + 6, y + 6, INK, 1); px.line(x + 6, y + 2, x + 2, y + 6, INK, 1); }
}
function cta(g) {
  const p = prog('cta', { dur: 1.4, ease: ease.linear });
  E.plate(g, 'Need a reliable AI automation or integration? *Let\'s talk.*', 186, 48, { align: 'center', w: 220, role: 'head', bg: NAVY_DEEP, fg: CREAM, hl: GOLD, progress: p });
  if (prog('cta', { dur: 0.3, delay: 1.2 }) > 0) E.plate(g, 'Tony Callender | Upwork', 186, 112, { align: 'center', role: 'body', bg: GOLD, fg: INK });
}

function problem(g, t) {
  background(g); chip(g, 'ILLUSTRATED'); nameTag(g); engineer(g, 'type');
  const px = g.px;
  card(g, 80, 28, 92, 46);  // dashboard tile
  textBox(g, 'Active accounts', 80, 31, 92, 10, MUTED, 'label');
  E.plate(g, '?', 126, 42, { align: 'center', role: { font: 'VT323', size: 48 }, bg: -1, fg: GOLD, pad: 0 });
  icon2(g, 'db', 126, 104, CREAM);
  textBox(g, 'Database', 96, 116, 60, 10, CREAM, 'label');
  px.line(126, 76, 126, 92, MUTED); px.line(126, 76, 123, 79, MUTED); px.line(126, 76, 129, 79, MUTED);
  if (past('problem.rules')) {
    const k = prog('problem.rules', { dur: 0.4, ease: ease.back });
    const x = Math.round(lerp(330, 262, k));
    icon2(g, 'code', x, 66, CREAM); textBox(g, 'App rules', x - 30, 80, 60, 10, CREAM, 'label');
    if (k >= 1) {  // a funnel between the rules and the number
      px.poly([[188, 52], [214, 52], [205, 64], [205, 72], [197, 72], [197, 64]], TEAL);
      E.arrow(g, 248, 62, 218, 60, { color: MUTED }); E.arrow(g, 186, 58, 176, 54, { color: MUTED });
      E.plate(g, 'The *rules* decide what counts', 220, 96, { align: 'center', w: 120, role: 'body', bg: NAVY_DEEP, fg: CREAM, hl: GOLD,
        progress: prog('problem.rules', { dur: 0.8, delay: 0.4, ease: ease.linear }) });
    }
  }
}

function arch(g, t) {
  background(g); chip(g, 'ILLUSTRATED ARCHITECTURE'); nameTag(g); engineer(g, 'type');
  const px = g.px, y = 66, n0 = S('arch');
  ARCH.forEach((n, i) => {
    const k = clamp01((t - n0 - 0.3 - i * 0.7) / 0.4); if (k <= 0) return;
    if (i > 0) E.arrow(g, ARCH[i - 1].x + 21, y, lerp(ARCH[i - 1].x + 21, n.x - 22, k), y, { color: MUTED });
    const x0 = n.x - 19, y0 = y - 18 + Math.round((1 - k) * 5);
    card(g, x0, y0, 38, 36, i === 2 ? TEAL_LIGHT : GOLD);
    icon2(g, n.icon, n.x, y0 + 18);
    wrapText(g, n.label, n.x, y0 + 40, 46, CREAM, 'label');
  });
  if (past('arch.stack')) {
    let x = 82;
    STACK.forEach((s, i) => {
      if (prog('arch.stack', { dur: 0.2, delay: i * 0.35 }) <= 0) return;
      const r = E.label(g, s.toUpperCase(), x, 116, { bg: i === 1 ? TEAL : NAVY_CARD, fg: CREAM });
      x += r.w + 4;
    });
  }
}

function codePanel(g, t, lit) {
  const c = CODE_PANEL, px = g.px;
  card(g, c.x, c.y, c.w, c.h, IDLE);
  textBox(g, 'Code snapshot (abstract)', c.x, c.y + 2, c.w, 9, MUTED, 'label');
  BARS.forEach((w, i) => {
    const y = c.y + 26 + i * 6, hot = lit && i === DEF_BAR;
    if (hot) px.rect(c.x + 4, y - 2, c.w - 8, 5, '#3A3220');
    px.rect(c.x + 8 + (i % 3) * 4, y, w, 2, hot ? GOLD : '#41557A');
  });
}
function guardPanel(g, t, rowState) {  // rowState(i) -> 'idle' | 'ok' | 'fail'
  const c = GUARD;
  card(g, c.x, c.y, c.w, c.h, TEAL_LIGHT);
  textBox(g, 'READ-ONLY SQL GUARD', c.x, c.y + 3, c.w, 9, TEAL_LIGHT, 'label');
  GUARD_ROWS.forEach((r, i) => {
    const y = c.y + 16 + i * 14, st = rowState(i);
    if (st === 'idle') g.px.rectb(c.x + 6, y, 9, 9, IDLE); else tick(g, c.x + 6, y, st === 'ok');
    E.plate(g, r.text, c.x + 19, y - 1, { role: 'body', bg: -1, fg: st === 'idle' ? MUTED : st === 'fail' ? RED : CREAM, pad: 0 });
  });
}
function queryCard(g, text, x, y, edge) {
  card(g, x, y, 62, 14, edge, NAVY_DEEP);
  E.plate(g, text, x + 31, y + 2, { align: 'center', role: 'code', bg: -1, fg: edge === RED ? RED : CREAM, pad: 0 });
}

// ── real captures (Tony's test environment; it holds a copy of real data, so no names or figures are shown) ──
// C2: the agent's trace, cropped to the question and steps (no URL, header, greeting or results; one line masked).
// C3: one chart from the agent's report, with every number and the axis title blurred.
const C2 = Desk.clip('c2');
const C3 = E.image('assets/c3-status-chart.png');
// C4: three sections of the agent's text report (overview + status, monthly, definitions), stacked; every figure blurred,
// and no diocese tables or names. 1180x1630 px.
const C4 = E.image('assets/c4-report.png'), C4_W = 1180, C4_H = 1630;
function reportScroll(g, t) {  // "The answer comes back...": scroll through the real report, like Tony did
  background(g); chip(g, 'REAL REPORT / NUMBERS BLURRED'); nameTag(g);
  const w = 232, h = 104, x = Math.round((g.W - w) / 2), y = 32, s = g.photo.scale;
  browserFrame(g, x, y, w, h);
  const viewH = C4_W * h / w, q = ease.inOut(clamp01((t - S('answer') - 0.3) / (S('answer.code') - S('answer') - 0.5)));
  if (C4.complete && C4.naturalWidth) g.photo.ctx.drawImage(C4, 0, q * (C4_H - viewH), C4_W, viewH, x * s, y * s, w * s, h * s);
}
function browserFrame(g, x, y, w, h) {  // a plain pixel window frame (no URL bar)
  const px = g.px;
  px.rect(x - 2 + 3, y - 10 + 3, w + 4, h + 12, INK); px.rect(x - 2, y - 10, w + 4, h + 12, '#C9CED8');
  [[4, RED], [9, '#E3B341'], [14, GREEN]].forEach(([dx, c]) => px.circ(x + dx, y - 5, 1, c));
}
function drawPhoto(g, img, x, y, w, h) {
  const s = g.photo.scale;
  if (img && img.complete && img.naturalWidth) g.photo.ctx.drawImage(img, x * s, y * s, w * s, h * s);
}
function traceCapture(g, t) {  // during "First, it searches the code...": the real trace, sped up to fit the line
  background(g); chip(g, 'REAL CAPTURE / TEST ENVIRONMENT / SPED UP'); nameTag(g);
  const w = 248, h = Math.round(w * 484 / 1470), x = Math.round((g.W - w) / 2), y = 44;
  browserFrame(g, x, y, w, h);
  const u = t - S('run.search'), dur = S('run.query') - S('run.search');
  drawPhoto(g, C2.at(clamp01(u / dur) * (C2.dur - 0.01)), x, y, w, h);
  E.plate(g, 'The agent checks how the metric is *defined* before it queries', g.W / 2, y + h + 8, { align: 'center', w: 250, role: 'body', bg: NAVY_DEEP, fg: CREAM, hl: GOLD });
}

function run(g, t) {
  if (t >= S('run.search') && t < S('run.query')) return traceCapture(g, t);
  background(g); chip(g, 'ILLUSTRATED RUN / NOT A RECORDING'); nameTag(g); engineer(g, 'type');
  E.plate(g, '*QUESTION:* CAN YOU BUILD ME A REPORT ON BACKGROUND CHECK ACTIVITY?', 189, 22, { align: 'center', w: 250, role: 'label', bg: NAVY_DEEP, fg: CREAM, hl: GOLD, pad: 4,
    progress: prog('run', { dur: 1.2, ease: ease.linear }) });
  const found = past('run.search') && t >= S('run.search') + 2.2;
  codePanel(g, t, found);
  if (past('run.search')) {  // tool calls tick in: Read, Grep, Glob
    ['READ', 'GREP', 'GLOB'].forEach((tool, i) => {
      if (t < S('run.search') + i * 0.6) return;
      E.label(g, tool, CODE_PANEL.x + 6 + i * 34, CODE_PANEL.y + 12, { bg: t >= S('run.search') + i * 0.6 + 0.4 ? GREEN : GOLD, fg: INK });
    });
    if (found) E.plate(g, 'Business definition found', CODE_PANEL.x + CODE_PANEL.w / 2, CODE_PANEL.y + CODE_PANEL.h - 13,
      { align: 'center', role: 'label', bg: GOLD, fg: INK, pad: 3 });
  }
  const guardOn = past('run.query');
  if (guardOn) {
    guardPanel(g, t, (i) => (past(GUARD_ROWS[i].cue) ? 'ok' : 'idle'));
    const k = prog('run.query', { dur: 0.8, delay: 0.6, ease: ease.inOut });
    const passed = past('guard.limit') && t >= S('guard.limit') + 0.6;
    if (!passed) queryCard(g, 'SELECT ...', Math.round(lerp(CODE_PANEL.x + 24, GUARD.x + 33, k)), Math.round(lerp(CODE_PANEL.y + CODE_PANEL.h - 30, GUARD.y + GUARD.h + 3, k)), GOLD);
    else E.plate(g, 'PASSED > POSTGRESQL', GUARD.x + GUARD.w / 2, GUARD.y + GUARD.h + 4, { align: 'center', role: 'label', bg: GREEN, fg: INK, pad: 3 });
  }
}

function answer(g, t) {  // left: one real chart from the agent's report (values blurred); right: the evidence it returns
  if (t < S('answer.code')) return reportScroll(g, t);
  background(g); chip(g, 'REAL CAPTURE + ILLUSTRATION'); nameTag(g); engineer(g, 'type');
  const px = g.px, cw = 118, ch = Math.round(cw * 560 / 900), cx = 66, cy = 40;
  browserFrame(g, cx, cy, cw, ch);
  drawPhoto(g, C3, cx, cy, cw, ch);
  E.plate(g, 'REAL CHART / VALUES BLURRED', cx + cw / 2, cy + ch + 5, { align: 'center', role: 'label', bg: NAVY_DEEP, fg: GOLD, pad: 3 });
  const x = 192, y = 30, w = 120, h = 100, k = prog('answer', { dur: 0.4, ease: ease.back });
  card(g, x, y + Math.round((1 - k) * 8), w, h);
  E.plate(g, 'Evidence', x + 8, y + 6, { role: 'body', bg: -1, fg: CREAM, pad: 0 });
  E.label(g, 'ILLUSTRATIVE', x + w - 52, y + 7, { bg: MUTED, fg: INK });
  const tab = past('answer.sql') ? 1 : past('answer.code') ? 0 : -1;
  ['Code it read', 'SQL it ran'].forEach((s, i) => {
    const tx = x + 6 + i * 55, on = tab === i;
    px.rect(tx, y + 22, 53, 12, on ? TEAL : NAVY_DEEP); px.rectb(tx, y + 22, 53, 12, on ? TEAL_LIGHT : IDLE);
    textBox(g, s, tx, y + 24, 53, 9, on ? CREAM : MUTED, 'label');
  });
  px.rect(x + 6, y + 36, w - 12, 56, NAVY_DEEP); px.rectb(x + 6, y + 36, w - 12, 56, IDLE);
  if (tab === 0) BARS.slice(2, 8).forEach((bw, i) => { const hot = i + 2 === DEF_BAR; px.rect(x + 12, y + 44 + i * 7, Math.min(bw + 20, w - 26), 2, hot ? GOLD : '#41557A'); });
  if (tab === 1) E.plate(g, 'SELECT ...', x + 12, y + 44, { role: 'code', bg: -1, fg: CREAM, pad: 0 });
  if (tab === -1) textBox(g, 'source + SQL', x + 6, y + 60, w - 12, 10, MUTED, 'label');
}

function reject(g, t) {
  background(g); chip(g, 'ILLUSTRATED RUN / NOT A RECORDING'); nameTag(g); engineer(g, 'type');
  const hit = t >= S('reject') + 1.2;
  guardPanel(g, t, (i) => (i === 1 && hit ? 'fail' : 'idle'));
  const tools = past('reject.tools');
  if (!tools) {
    const k = prog('reject', { dur: 1.0, delay: 0.2, ease: ease.inOut });
    queryCard(g, 'DELETE ...', Math.round(lerp(CODE_PANEL.x + 20, GUARD.x - 66, k)), GUARD.y + 30, RED);
  } else {
    const c = CODE_PANEL; card(g, c.x, c.y, c.w, c.h, IDLE);
    textBox(g, 'AGENT TOOL PERMISSIONS', c.x, c.y + 3, c.w, 9, MUTED, 'label');
    ['Shell', 'File writes', 'Web access'].forEach((s, i) => {
      if (prog('reject.tools', { dur: 0.2, delay: i * 0.5 }) <= 0) return;
      const y = c.y + 22 + i * 20; tick(g, c.x + 10, y, false);
      E.plate(g, s, c.x + 24, y - 1, { role: 'body', bg: -1, fg: CREAM, pad: 0 });
    });
  }
  if (hit) E.plate(g, 'Rejected: write operation', GUARD.x + GUARD.w / 2, GUARD.y + GUARD.h + 2, { align: 'center', role: 'body', bg: RED, fg: INK });
}

function close(g, t) {
  background(g); chip(g, 'ILLUSTRATED'); nameTag(g);
  const ctaOn = past('cta');
  engineer(g, ctaOn ? 'wave' : 'present');
  if (ctaOn) { cta(g); return; }
  CLOSE_CARDS.forEach((c) => {
    const p = prog(c.cue, { dur: 0.35, delay: c.delay || 0, ease: ease.back });
    if (!past(c.cue) || p <= 0) return;
    const x0 = c.x - 36, y0 = 40 + Math.round((1 - p) * 10);
    card(g, x0, y0, 72, 80);
    icon2(g, c.icon, c.x, y0 + 22);
    wrapText(g, c.label, c.x, y0 + 40, 64, CREAM);
  });
}

const SECTIONS = [['problem', problem], ['arch', arch], ['run', run], ['answer', answer], ['reject', reject], ['close', close]];

E.frame({ draw(g, t) {
  let fn = SECTIONS[0][1];
  for (const [id, f] of SECTIONS) if (t >= S(id)) fn = f;
  fn(g, t);
} });
