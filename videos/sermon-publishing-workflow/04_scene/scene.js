// scene.js: sermon-publishing-workflow (Video 1), 16:9, world 320x180, text layer 640x360.
// LAYOUT lives here (constants below). TIMING lives in 03_cues/cues.md, which compiles to cues.js.
// Animated scenes are authored illustrations and are labelled on screen. The planned recordings were replaced
// (2026-10-12) by an illustrated run and Tony's real capture C1, cropped so no names show. No client, parish or clergy names; the only name shown is Tony Callender.
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
const CHECKLIST = { x: 92, y: 26, w: 130, h: 112 };
const COUNT = { x: 268, y: 66 };
const NODES = [  // centre x of each flow node; y is shared
  { x: 84, label: 'Recorded service', icon: 'video' },
  { x: 145, label: 'Python worker', icon: 'gear' },
  { x: 206, label: 'WordPress draft', icon: 'page' },
  { x: 267, label: 'Editor review', icon: 'editor' },
];
const NODE = { y: 70, w: 46, h: 40 };
const CARDS = [
  { cue: 'close.steps', x: 100, label: 'Fewer repetitive steps', icon: 'collapse' },
  { cue: 'close.safe', x: 180, label: 'Safeguards kept', icon: 'shield' },
  { cue: 'close.people', x: 260, label: 'People in control', icon: 'editor' },
];

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

// ── scenes ─────────────────────────────────────────────────────────────────
function problem(g, t) {
  background(g); chip(g, 'ILLUSTRATED WORKFLOW'); nameTag(g); engineer(g, 'type');
  const c = CHECKLIST, px = g.px;
  px.rect(c.x + 3, c.y + 3, c.w, c.h, INK); px.rect(c.x, c.y, c.w, c.h, NAVY_CARD); px.rectb(c.x, c.y, c.w, c.h, GOLD);
  textBox(g, 'Sermon posting (before)', c.x, c.y + 3, c.w, 12, GOLD);
  const shown = Math.floor(clamp01((t - S('problem') - 0.3) / 2.2) * 13);
  for (let i = 0; i < 13; i++) {
    if (i >= shown) break;
    const col = i < 7 ? 0 : 1, row = i < 7 ? i : i - 7, bx = c.x + 12 + col * 60, by = c.y + 22 + row * 12;
    px.rectb(bx, by, 7, 7, CREAM);
    px.rect(bx + 11, by + 3, 30 + ((i * 7) % 12), 1, MUTED);  // unlabelled step line: the 13 steps are not named in the source
  }
  if (past('problem.count')) {
    const p = prog('problem.count', { dur: 0.35, ease: ease.back });
    E.plate(g, '13', COUNT.x, COUNT.y - 30 + (1 - p) * -8, { align: 'center', role: { font: 'VT323', size: 72 }, bg: NAVY_DEEP, fg: GOLD });
    E.plate(g, 'manual steps / by a volunteer', COUNT.x, COUNT.y + 20, { align: 'center', w: 84, role: 'body', bg: NAVY_DEEP, fg: CREAM, progress: prog('problem.count', { dur: 0.6, delay: 0.2, ease: ease.linear }) });
  }
}

function flow(g, t) {
  background(g); chip(g, 'ILLUSTRATED ARCHITECTURE'); nameTag(g); engineer(g, 'type');
  const px = g.px, n0 = S('flow'), y = NODE.y;
  const shown = (i) => clamp01((t - n0 - i * 0.6) / 0.4);
  NODES.forEach((n, i) => {
    const k = shown(i); if (k <= 0) return;
    if (i > 0) E.arrow(g, NODES[i - 1].x + NODE.w / 2 + 2, y, lerp(NODES[i - 1].x + NODE.w / 2 + 2, n.x - NODE.w / 2 - 3, k), y, { color: MUTED });
    const isDraft = i === 2 && past('flow.draft'), isEditor = i === 3;
    const bg = isDraft ? TEAL : NAVY_CARD, edge = isDraft ? TEAL_LIGHT : isEditor ? MUTED : GOLD;
    const x0 = n.x - NODE.w / 2, y0 = y - NODE.h / 2 + Math.round((1 - k) * 6);
    px.rect(x0 + 3, y0 + 3, NODE.w, NODE.h, INK); px.rect(x0, y0, NODE.w, NODE.h, bg); px.rectb(x0, y0, NODE.w, NODE.h, edge);
    drawIcon(g, n.icon, n.x, y0 + NODE.h / 2, { dim: isEditor, spin: i === 1 && past('flow.operator') ? t * 2 : 0 });
    wrapText(g, n.label, n.x, y0 + NODE.h + 4, NODE.w + 8, isEditor ? MUTED : CREAM);
  });
  if (past('flow.draft')) {
    const k = prog('flow.draft', { dur: 0.3 });
    E.label(g, 'DRAFT', NODES[2].x - 12, y - NODE.h / 2 - 12 + (1 - k) * 4, { bg: TEAL, fg: CREAM });
  }
  if (past('flow.operator')) {  // an operator starts the run; a pulse travels to the draft (not to the editor)
    const b = NODES[1], bx = b.x - 10, by = y - NODE.h / 2 - 24;
    px.rect(bx, by, 20, 10, NAVY_DEEP); px.rectb(bx, by, 20, 10, GOLD);
    px.rect(bx + 6, by + 3, 8, 4, (Math.floor(t * 4) % 2) ? GOLD : '#B8964F');
    textBox(g, 'operator starts it', b.x - 40, by - 11, 80, 10, GOLD, 'label');
    const q = ((t - S('flow.operator')) / 1.6) % 1, x = lerp(NODES[0].x + NODE.w / 2, NODES[2].x - NODE.w / 2, q);
    px.circ(Math.round(x), y, 2, TEAL_LIGHT);
  }
  if (past('flow.nolive')) {
    E.plate(g, '*Draft*, not published', NODES[2].x, y + NODE.h / 2 + 30, { align: 'center', role: 'body', bg: NAVY_DEEP, fg: CREAM, hl: GOLD,
      progress: prog('flow.nolive', { dur: 0.6, ease: ease.linear }) });
  }
}

// ── n8n-style illustrated run (labelled: not a recording) ─────────────────
const RUN_NODES = [  // two rows of four; label under each square, like a node canvas
  { label: 'YouTube service', icon: 'video' }, { label: 'Find sermon', sub: 'liturgical cues', icon: 'search' },
  { label: 'Prepare audio', icon: 'wave' }, { label: 'Attach approved details', sub: 'title / preacher / scripture', icon: 'tag' },
  { label: 'AI notes + claim check', icon: 'spark' }, { label: 'Duplicate check', icon: 'dup' },
  { label: 'WordPress draft', icon: 'page' }, { label: 'Editor review', icon: 'editor' },
];
const RUN_X = [96, 156, 216, 276], RUN_Y = [40, 104], SQ = 24;
const GREEN = '#3FBF7F', AMBER = '#E39B3B', IDLE = '#56698D';
// snake layout: row 1 runs left to right, row 2 right to left, so the wire drops straight down on the right
const runPos = (i) => { const row = Math.floor(i / 4), col = i % 4; return { x: RUN_X[row ? 3 - col : col], y: RUN_Y[row] }; };

// Node timing for run 1: [runningFrom, doneAt] in seconds, taken from the cues (voice-driven).
function run1Times() {
  const r = S('run'), f = S('run.flow');
  return [[r, r + 0.6], [r + 0.6, S('run.audio')], [S('run.audio'), S('run.audio') + 1.0], [S('run.attach'), S('run.attach') + 1.6],
    [f + 0.3, f + 0.9], [f + 0.9, f + 1.5], [f + 1.5, S('run.draft')], [S('run.editor'), S('run.editor') + 1.2]];
}
function runIcon(g, kind, cx, cy, c) {
  const px = g.px;
  if (kind === 'search') { px.circ(cx - 2, cy - 2, 5, c); px.circ(cx - 2, cy - 2, 3, NAVY_CARD); px.line(cx + 2, cy + 2, cx + 6, cy + 6, c, 2); }
  else if (kind === 'wave') { [3, 7, 11, 6, 9, 4, 8].forEach((h, k) => px.rect(cx - 9 + k * 3, Math.round(cy - h / 2), 2, h, c)); }
  else if (kind === 'tag') { px.poly([[cx - 8, cy - 5], [cx + 3, cy - 5], [cx + 8, cy], [cx + 3, cy + 5], [cx - 8, cy + 5]], c); px.rect(cx - 5, cy - 1, 2, 2, NAVY_CARD); }
  else if (kind === 'spark') { px.poly([[cx, cy - 8], [cx + 2, cy - 2], [cx + 8, cy], [cx + 2, cy + 2], [cx, cy + 8], [cx - 2, cy + 2], [cx - 8, cy], [cx - 2, cy - 2]], c); }
  else if (kind === 'dup') { px.rectb(cx - 8, cy - 7, 11, 13, c); px.rect(cx - 3, cy - 4, 11, 13, c); }
  else if (kind === 'video') { px.rect(cx - 9, cy - 6, 18, 12, c); px.poly([[cx - 2, cy - 4], [cx - 2, cy + 4], [cx + 4, cy]], c === IDLE ? NAVY_CARD : '#E05A4E'); }
  else drawIcon(g, kind, cx, cy, { color: c, dim: c === IDLE });
}
function wire(g, a, b, color) {  // connector from node a to node b
  const A = runPos(a), B = runPos(b), px = g.px, h = SQ / 2;
  let pts;
  if (A.y !== B.y) pts = [[A.x + h + 1, A.y], [A.x + h + 8, A.y], [A.x + h + 8, B.y], [B.x + h + 2, B.y]];  // drop on the right
  else if (B.x > A.x) pts = [[A.x + h + 1, A.y], [B.x - h - 2, B.y]];
  else pts = [[A.x - h - 1, A.y], [B.x + h + 2, B.y]];
  for (let k = 0; k < pts.length - 1; k++) px.line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], color, 1);
  return pts;
}
function along(pts, q) {  // the point at fraction q along a polyline
  const seg = pts.slice(1).map((p, k) => Math.hypot(p[0] - pts[k][0], p[1] - pts[k][1])), tot = seg.reduce((a, b) => a + b, 0);
  let d = q * tot;
  for (let k = 0; k < seg.length; k++) { if (d <= seg[k]) { const u = d / seg[k]; return [lerp(pts[k][0], pts[k + 1][0], u), lerp(pts[k][1], pts[k + 1][1], u)]; } d -= seg[k]; }
  return pts[pts.length - 1];
}
// states: per node 'idle' | 'running' | 'done' | 'skip' | 'blocked'; badges: { nodeIndex: { text, bg } }
function canvas(g, t, states, badges, runTag) {
  background(g); chip(g, 'ILLUSTRATED RUN / NOT A RECORDING'); nameTag(g); engineer(g, 'type');
  const px = g.px;
  E.label(g, runTag, 64, 19, { bg: NAVY_CARD, fg: CREAM });
  textBox(g, 'Simplified: step order is illustrative', 140, 136, 176, 8, MUTED, 'label');
  for (let i = 0; i < 7; i++) {
    const done = states[i] === 'done' || states[i] === 'skip', next = states[i + 1];
    const pts = wire(g, i, i + 1, done && (next === 'running' || next === 'done' || next === 'skip') ? GREEN : IDLE);
    if (done && next === 'running') { const [x, y] = along(pts, (t * 1.6) % 1); px.rect(Math.round(x) - 1, Math.round(y) - 1, 3, 3, GOLD); }
  }
  RUN_NODES.forEach((n, i) => {
    const { x, y } = runPos(i), st = states[i];
    const edge = st === 'done' ? GREEN : st === 'running' ? GOLD : st === 'skip' ? AMBER : IDLE;
    const iconC = st === 'idle' || st === 'blocked' ? IDLE : CREAM;
    px.rect(x - SQ / 2 + 2, y - SQ / 2 + 2, SQ, SQ, INK); px.rect(x - SQ / 2, y - SQ / 2, SQ, SQ, NAVY_CARD);
    px.rectb(x - SQ / 2, y - SQ / 2, SQ, SQ, edge); px.rectb(x - SQ / 2 + 1, y - SQ / 2 + 1, SQ - 2, SQ - 2, edge);
    runIcon(g, n.icon, x, y, iconC);
    if (st === 'running') for (let k = 0; k < 3; k++) { const a = t * 7 + k * 0.6; px.rect(Math.round(x + Math.cos(a) * 15), Math.round(y + Math.sin(a) * 15), 2, 2, GOLD); }
    if (st === 'done') { px.circ(x + SQ / 2, y - SQ / 2, 4, GREEN); px.line(x + SQ / 2 - 2, y - SQ / 2, x + SQ / 2 - 1, y - SQ / 2 + 2, INK, 1); px.line(x + SQ / 2 - 1, y - SQ / 2 + 2, x + SQ / 2 + 2, y - SQ / 2 - 2, INK, 1); }
    if (st === 'skip') { px.circ(x + SQ / 2, y - SQ / 2, 4, AMBER); px.rect(x + SQ / 2 - 2, y - SQ / 2, 5, 1, INK); }
    const lc = st === 'idle' || st === 'blocked' ? MUTED : CREAM;
    const L = E.plate(g, n.label, x, y + SQ / 2 + 5, { align: 'center', w: 58, role: 'label', bg: -1, fg: lc, pad: 0 });
    if (n.sub) E.plate(g, n.sub, x, L.y + L.h + 1, { align: 'center', w: 58, role: 'label', bg: -1, fg: st === 'idle' || st === 'blocked' ? MUTED : GOLD, pad: 0 });
    if (badges[i]) E.plate(g, badges[i].text, x, y - SQ / 2 - 11, { align: 'center', role: 'label', bg: badges[i].bg, fg: INK, pad: 3 });
  });
}
function runScene(g, t) {
  const T = run1Times();
  const states = T.map(([a, b]) => (t >= b ? 'done' : t >= a ? 'running' : 'idle'));
  const badges = {};
  if (states[5] === 'done') badges[5] = { text: 'NEW > CONTINUE', bg: GREEN };
  if (past('run.draft')) badges[6] = { text: 'DRAFT', bg: TEAL_LIGHT };
  if (past('run.flag')) badges[4] = { text: 'FLAGGED FOR REVIEW', bg: GOLD };
  if (states[7] === 'done') badges[7] = { text: 'PUBLISHED', bg: GREEN };
  canvas(g, t, states, badges, 'RUN 1 / NEW VIDEO');
  if (past('run.notes') && !past('run.editor')) {  // focus ring on the AI notes node
    const { x, y } = runPos(4);
    g.ui.rectb(x - SQ / 2 - 3, y - SQ / 2 - 3, SQ + 6, SQ + 6, Math.floor(t * 3) % 2 ? GOLD : '#B8964F');
  }
}
function rerunScene(g, t) {
  const r = S('rerun'), d = S('rerun.dup');
  const states = ['idle', 'blocked', 'blocked', 'blocked', 'blocked', 'idle', 'blocked', 'blocked'];
  states[0] = t >= r + 0.8 ? 'done' : t >= r + 0.2 ? 'running' : 'idle';
  states[5] = t >= d + 0.5 ? 'skip' : t >= d - 0.3 ? 'running' : 'idle';
  const badges = {};
  if (states[5] === 'skip') { badges[5] = { text: 'ALREADY EXISTS > SKIPPED', bg: AMBER }; badges[6] = { text: 'NO NEW POST', bg: MUTED }; }
  canvas(g, t, states, badges, 'RUN 2 / SAME VIDEO');
  if (past('rerun.dup')) E.plate(g, 'Two guards: worker check + WordPress 409 guard', 214, 19, { align: 'center', role: 'label', bg: NAVY_DEEP, fg: GOLD, pad: 3,
    progress: prog('rerun.dup', { dur: 0.8, delay: 0.5, ease: ease.linear }) });
}

// ── real capture C1: Tony's recording, cropped (no names, logo, assistant panel or URL) ──
const C1 = Desk.clip('c1');
// capture time u (s from the cue) -> clip time; two cuts so the page matches the words
function c1Time(u) {
  if (u < 1.0) return u;                         // archive -> sermon page
  if (u < 3.5) return 7.0 + (u - 1.0);           // page top: player + YouTube link ("listen", "watch")
  return Math.min(2.0 + (u - 3.5), 4.8);         // readings scrolling ("read the scripture")
}
function captureScene(g, t) {
  background(g); chip(g, 'REAL CAPTURE / NAMES HIDDEN'); nameTag(g);
  const px = g.px, cw = 150, ch = Math.round(cw * 750 / 990), x = Math.round((g.W - cw) / 2), y = 30;
  px.rect(x - 2 + 3, y - 10 + 3, cw + 4, ch + 12, INK); px.rect(x - 2, y - 10, cw + 4, ch + 12, '#C9CED8');
  [[4, '#E05A4E'], [9, '#E3B341'], [14, '#3FBF7F']].forEach(([dx, c]) => px.circ(x + dx, y - 5, 1, c));
  const u = t - S('capture'), img = C1.at(c1Time(u)), s = g.photo.scale, k = prog('capture', { dur: 0.4 });
  if (img && img.complete && img.naturalWidth) { g.photo.ctx.globalAlpha = k; g.photo.ctx.drawImage(img, x * s, y * s, cw * s, ch * s); g.photo.ctx.globalAlpha = 1; }
  if (past('capture.listen') && u >= 2.2 && u < 3.5) {  // gold box on the player, only while the page top is on screen
    g.ui.rectb(x + cw * 115 / 990, y + ch * 368 / 750, cw * 872 / 990, ch * 160 / 750, GOLD);
  }
}

function close(g, t) {
  background(g); chip(g, 'ILLUSTRATED'); nameTag(g);
  const cta = past('cta');
  engineer(g, cta ? 'wave' : 'present');
  const px = g.px;
  if (!cta) CARDS.forEach((c) => {
    if (!past(c.cue)) return;
    const k = prog(c.cue, { dur: 0.35, ease: ease.back }), x0 = c.x - 36, y0 = 40 + Math.round((1 - k) * 10);
    px.rect(x0 + 3, y0 + 3, 72, 80, INK); px.rect(x0, y0, 72, 80, NAVY_CARD); px.rectb(x0, y0, 72, 80, GOLD);
    drawIcon(g, c.icon, c.x, y0 + 22);
    wrapText(g, c.label, c.x, y0 + 40, 64, CREAM);
  });
  if (cta) {
    const p = prog('cta', { dur: 1.4, ease: ease.linear });
    E.plate(g, 'Need a reliable AI automation or integration? *Let\'s talk.*', 186, 48, { align: 'center', w: 220, role: 'head', bg: NAVY_DEEP, fg: CREAM, hl: GOLD, progress: p });
    if (prog('cta', { dur: 0.3, delay: 1.2 }) > 0) E.plate(g, 'Tony Callender | Upwork', 186, 112, { align: 'center', role: 'body', bg: GOLD, fg: INK });
  }
}

const SECTIONS = [['problem', problem], ['flow', flow], ['run', runScene], ['capture', captureScene],
  ['rerun', rerunScene], ['close', close]];

E.frame({ draw(g, t) {
  let fn = SECTIONS[0][1];
  for (const [id, f] of SECTIONS) if (t >= S(id)) fn = f;
  fn(g, t);
} });
