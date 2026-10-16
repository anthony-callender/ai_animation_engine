// scene.js: church-geo-reel (Reel B), 9:16, 1080x1920, in the style of the reference "paper collage" reel:
// cream paper, an ink-hatched ground, white cards with thick outlines and hard shadows, tilted red step stamps,
// big serif word-by-word captions, and Tony: his real cut-out head on a plain animated ink-style body.
// Engagement details from the reference: a clicking cursor, typing, highlighter sweeps, a sunburst, big red pop-words,
// stickers, hand-drawn arrows, map pins and small camera punch-ins.
// Every claim comes from _shared/research/geo-for-churches.md. Example church content is fictional (labelled).
// Drawn in real pixels on g.photo.ctx. LAYOUT: the constants below. TIMING: 03_cues/cues.md.
const { ease } = P;
const S = (id) => P.cue(id).start;
const lerp = (a, b, p) => a + (b - a) * p;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
P.wait(Promise.all(['500', '700', '800'].map((w) => document.fonts.load(`${w} 40px Inter`))));
const HEAD = Eduba.image('assets/tony-head.png');        // 562x509, from Tony's photo (background removed)

// ── look ───────────────────────────────────────────────────────────────────
const PAPER = '#f3ede2', INK = '#151515', RED = '#c8392b', MUTE = '#b9b2a6', CARD = '#ffffff', LINE = '#1b1b1b';
const SKIN = '#bc886a', GOLD = '#f4c430', HILITE = 'rgba(255, 214, 64, 0.75)', BLUE = '#3b6fd8', OK = '#2e9d57';
const SERIF = (s) => `700 ${s}px Georgia, "Cambria", serif`;
const SANS = (w, s) => `${w} ${s}px Inter, "Segoe UI", Arial, sans-serif`;
const MONO = (s) => `500 ${s}px "JetBrains Mono", Consolas, monospace`;
const EMOJI = (s) => `${s}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;

// ── layout (real px) ───────────────────────────────────────────────────────
const CAPTION_Y = 520, GROUND_Y = 1480;                  // serif captions near the top; the ground strip below
const STAGE = { cx: 470, cy: 1060 };                     // scenes are authored around this point…
const STAGE_FIT = { cx: 425, k: 0.87 };                  // …then fitted to the left of Tony
const TONY_X = 900;                                      // Tony stands here on the ground

// ── helpers ────────────────────────────────────────────────────────────────
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function sans(ctx, s, x, y, o = {}) { ctx.font = SANS(o.w || 600, o.s || 30); ctx.fillStyle = o.c || INK; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); }
function serif(ctx, s, x, y, o = {}) { ctx.font = SERIF(o.s || 60); ctx.fillStyle = o.c || INK; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); }
function emoji(ctx, s, x, y, size) { ctx.font = EMOJI(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); }
const since = (t0, d = 0.3) => clamp01((P.t - t0) / d);
const pop = (t0, d = 0.3) => { const k = since(t0, d); return k <= 0 ? 0 : ease.back(k); };
const typed = (t0, d) => clamp01((P.t - t0) / d);
const at = (w, cue) => P.at(w, cue);
function card(ctx, x, y, w, h, o = {}) {  // white card, thick outline, hard shadow; (x, y) is the centre. Caller must ctx.restore().
  const k = o.scale ?? 1; if (k <= 0) return false;
  ctx.save(); ctx.translate(x, y); ctx.rotate((o.rot || 0) * Math.PI / 180); ctx.scale(k, k);
  rr(ctx, -w / 2 + 12, -h / 2 + 12, w, h, 26); ctx.fillStyle = INK; ctx.fill();
  rr(ctx, -w / 2, -h / 2, w, h, 26); ctx.fillStyle = o.fill || CARD; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = LINE; ctx.stroke();
  return true;
}
function stamp(ctx, a, b, x, y, o = {}) {  // red rubber stamp: "STEP 1" + "GET FOUND"
  const k = o.scale ?? 1; if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate((o.rot ?? -4) * Math.PI / 180); ctx.scale(k, k);
  const s = o.s || 46; ctx.font = SERIF(s); const wa = ctx.measureText(a).width; ctx.font = SERIF(s * 0.62); const wb = b ? ctx.measureText(b).width + 16 : 0;
  const w = wa + wb + 44, h = s + 30;
  rr(ctx, -w / 2 + 8, -h / 2 + 8, w, h, 8); ctx.fillStyle = INK; ctx.fill();
  rr(ctx, -w / 2, -h / 2, w, h, 8); ctx.fillStyle = o.bg || RED; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  serif(ctx, a, -w / 2 + 22 + wa / 2, 2, { s, c: '#fff' });
  if (b) serif(ctx, b, -w / 2 + 22 + wa + 16 + (wb - 16) / 2, 4, { s: s * 0.62, c: '#fff' });
  ctx.restore();
}
function tag(ctx, s, x, y, o = {}) {  // white sticker tag with a black border; o.check adds a red tick, like the reference
  const k = o.scale ?? 1; if (k <= 0) return; const size = o.s || 38; ctx.font = SERIF(size); const w = ctx.measureText(s).width + 40, h = size + 26;
  ctx.save(); ctx.translate(x, y); ctx.rotate((o.rot ?? -3) * Math.PI / 180); ctx.scale(k, k);
  rr(ctx, -w / 2 + 6, -h / 2 + 6, w, h, 10); ctx.fillStyle = INK; ctx.fill();
  rr(ctx, -w / 2, -h / 2, w, h, 10); ctx.fillStyle = o.bg || '#fff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  serif(ctx, s, 0, 3, { s: size, c: o.c || INK });
  if (o.check) { const p = since(o.check, 0.25); if (p > 0) { ctx.strokeStyle = RED; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(w / 2 - 6, -h / 2 + 6);
    ctx.lineTo(w / 2 + 8 * p, -h / 2 + 18 * p); ctx.lineTo(w / 2 + 8 + 26 * p, -h / 2 - 22 * p); ctx.stroke(); } }
  ctx.restore();
}
function redX(ctx, x, y, size, k) {
  if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.strokeStyle = RED; ctx.lineCap = 'round'; ctx.lineWidth = size * 0.13;
  ctx.globalAlpha = 0.92; ctx.beginPath(); ctx.moveTo(-size / 2, -size / 2); ctx.lineTo(size / 2, size / 2); ctx.moveTo(size / 2, -size / 2); ctx.lineTo(-size / 2, size / 2); ctx.stroke(); ctx.restore();
}
function tick(ctx, x, y, r = 20, on = true) {  // on: true/false or 0..1 (animates in)
  const k = on === true ? 1 : typeof on === 'number' ? on : 0;
  ctx.fillStyle = k > 0 ? OK : '#e3ded4'; ctx.beginPath(); ctx.arc(x, y, r * (k > 0 ? 0.8 + 0.2 * ease.back(k) : 1), 0, 7); ctx.fill();
  if (k <= 0) return; ctx.strokeStyle = '#fff'; ctx.lineWidth = r / 3.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x - r * 0.45, y); ctx.lineTo(x - r * 0.1, y + r * 0.35); ctx.lineTo(x + r * 0.5, y - r * 0.35); ctx.stroke();
}
function chatBubble(ctx, s, x, y, o = {}) {
  const size = o.s || 30; ctx.font = SANS(500, size); const p = o.progress ?? 1; if (p <= 0) return;
  const shown = s.slice(0, Math.ceil(p * s.length)), w = Math.min(o.maxW || 560, ctx.measureText(s).width + 50);
  const lines = []; let line = '';
  for (const word of shown.split(' ')) { const tt = line ? line + ' ' + word : word; if (ctx.measureText(tt).width > w - 50 && line) { lines.push(line); line = word; } else line = tt; }
  lines.push(line); const h = lines.length * size * 1.3 + 32;
  rr(ctx, o.right ? x - w : x, y, w, h, 24); ctx.fillStyle = o.bg || '#ececec'; ctx.fill();
  lines.forEach((l, i) => sans(ctx, l, (o.right ? x - w : x) + 25, y + 16 + size * 1.3 * (i + 0.5), { w: 500, s: size, c: o.c || INK }));
}
function highlight(ctx, x, y, w, h, p) {  // a yellow marker sweep, drawn behind text
  if (p <= 0) return; ctx.save(); ctx.fillStyle = HILITE; ctx.beginPath(); ctx.roundRect(x, y - h / 2, w * p, h, 6); ctx.fill(); ctx.restore();
}
function cursor(ctx, path, t) {  // an arrow cursor gliding along [[t, x, y, click?], ...] with a click ripple
  if (t < path[0][0]) return; let x = path[0][1], y = path[0][2], clickT = null;
  for (let i = 0; i < path.length; i++) { const [t1, x1, y1, c] = path[i]; if (t >= t1) { x = x1; y = y1; if (c) clickT = t1; }
    if (i + 1 < path.length && t >= t1 && t < path[i + 1][0]) { const [t2, x2, y2] = path[i + 1], u = ease.inOut(clamp01((t - t1) / Math.max(0.05, Math.min(0.6, t2 - t1)))); x = lerp(x1, x2, u); y = lerp(y1, y2, u); } }
  if (clickT !== null && t - clickT < 0.5) { const r = 10 + (t - clickT) * 90; ctx.strokeStyle = `rgba(200,57,43,${1 - (t - clickT) * 2})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); }
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 46); ctx.lineTo(12, 35); ctx.lineTo(21, 54); ctx.lineTo(29, 50); ctx.lineTo(20, 32); ctx.lineTo(36, 32); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}
function sunburst(ctx, x, y, r, k) {  // the yellow glow and rays behind a big moment, like "10X EASIER"
  if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(P.t * 0.4); ctx.globalAlpha = 0.85 * Math.min(1, k);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, 'rgba(255,224,90,0.95)'); g.addColorStop(1, 'rgba(255,224,90,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * k, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,200,40,0.55)'; for (let i = 0; i < 16; i++) { ctx.rotate(Math.PI / 8); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 1.15 * k, -18); ctx.lineTo(r * 1.15 * k, 18); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function popWord(ctx, s, x, y, o = {}) {  // big red outlined words that slam in, like "NOBODY HANGS UP"
  const k = o.scale ?? 1; if (k <= 0) return; const size = o.s || 110, z = lerp(1.6, 1, Math.min(1, k)) * Math.min(1, k * 1.2);
  ctx.save(); ctx.translate(x, y); ctx.rotate((o.rot ?? -5) * Math.PI / 180); ctx.scale(z, z);
  ctx.font = SERIF(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.strokeText(s, 6, 8); ctx.lineWidth = 12; ctx.strokeStyle = '#fff'; ctx.strokeText(s, 0, 0);
  ctx.fillStyle = o.c || RED; ctx.fillText(s, 0, 0); ctx.restore();
}
function arrowTo(ctx, x0, y0, x1, y1, p) {  // a hand-drawn red arrow, drawn on
  if (p <= 0) return; const mx = (x0 + x1) / 2 + (y1 - y0) * 0.25, my = (y0 + y1) / 2 - (x1 - x0) * 0.25;
  ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const N = 30, pts = []; for (let i = 0; i <= N * p; i++) { const u = i / N, v = 1 - u; pts.push([v * v * x0 + 2 * v * u * mx + u * u * x1, v * v * y0 + 2 * v * u * my + u * u * y1]); }
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  if (p >= 1 && pts.length > 1) { const [xa, ya] = pts[pts.length - 2], a = Math.atan2(y1 - ya, x1 - xa); ctx.beginPath();
    ctx.moveTo(x1 - Math.cos(a - 0.5) * 34, y1 - Math.sin(a - 0.5) * 34); ctx.lineTo(x1, y1); ctx.lineTo(x1 - Math.cos(a + 0.5) * 34, y1 - Math.sin(a + 0.5) * 34); ctx.stroke(); }
  ctx.restore();
}
function pin(ctx, x, y, k) {  // a red map pin dropping in
  if (k <= 0) return; ctx.save(); ctx.translate(x, y - (1 - Math.min(1, k)) * 60); ctx.fillStyle = RED; ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, -26, 16, Math.PI, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -27, 6, 0, 7); ctx.fill(); ctx.restore();
}

// ── the ground: an ink-hatched strip, drawn once ───────────────────────────
let GROUND = null;
function ground(ctx) {
  if (!GROUND) {
    GROUND = document.createElement('canvas'); GROUND.width = 1080; GROUND.height = 1920 - GROUND_Y + 20;
    const c = GROUND.getContext('2d'); c.fillStyle = INK; c.fillRect(0, 12, 1080, GROUND.height);
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    c.strokeStyle = PAPER; c.lineCap = 'round';
    for (let row = 0; row < 15; row++) for (let i = 0; i < 46; i++) {  // tufts of curved grass blades
      const x = i * 24 + rnd() * 30 - 15, y = 30 + row * 30 + rnd() * 26, l = 24 + rnd() * 22, dir = rnd() < 0.5 ? -1 : 1;
      for (let b = 0; b < 3; b++) { c.lineWidth = 2.2 + rnd() * 1.4; c.beginPath(); c.moveTo(x + b * 5, y); c.quadraticCurveTo(x + b * 5 + dir * l * 0.5, y - l * 0.35, x + b * 5 + dir * l, y - l * 0.15); c.stroke(); } }
    c.fillStyle = INK; c.fillRect(0, 0, 1080, 14);
  }
  ctx.drawImage(GROUND, 0, GROUND_Y - 6);
}

// ── Tony: his real head on a plain animated ink-style body (like the reference) ──
// pose: 'stand' | 'point' | 'cheer' | 'think' | 'hold' | 'phone'. x: feet centre. jump: 0..1 lifts him.
function limb(ctx, pts, w) {  // a black sleeve or trouser leg with a pale edge line
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  ctx.strokeStyle = 'rgba(243,237,226,0.85)'; ctx.lineWidth = 3; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + w * 0.28, y) : ctx.moveTo(x + w * 0.28, y))); ctx.stroke();
  ctx.restore();
}
function hand(ctx, x, y, r = 19) { ctx.fillStyle = SKIN; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke(); }
function tony(ctx, pose, x, k = 1, jump = 0) {
  if (k <= 0) return;
  const bob = Math.sin(P.t * 3) * 3, lift = jump * 70, foot = GROUND_Y + 4 - lift;
  ctx.save(); ctx.translate(x, foot); ctx.scale(k, k);
  const hip = -250, sh = -470 + bob;  // hip and shoulder heights (relative to the feet)
  const spread = pose === 'cheer' ? 30 : 0;
  limb(ctx, [[-30, hip], [-34 - spread, -120], [-36 - spread, -26]], 56); limb(ctx, [[30, hip], [34 + spread, -120], [36 + spread, -26]], 56);
  [[-40 - spread, 1], [40 + spread, -1]].forEach(([fx, d]) => { ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(fx - d * 8, -10, 46, 20, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.fillRect(fx - d * 8 - 44, -6, 88, 6); });
  const L = (p) => limb(ctx, p, 46), lsh = [-82, sh + 28], rsh = [82, sh + 28];
  let lh, rh;
  if (pose === 'point') { lh = [-300, sh + 40]; L([lsh, [-190, sh + 46], lh]); rh = [92, sh + 210]; L([rsh, [104, sh + 120], rh]); }
  else if (pose === 'cheer') { const w = Math.sin(P.t * 10) * 10; lh = [-150 + w, sh - 180]; L([lsh, [-136, sh - 60], lh]); rh = [150 - w, sh - 180]; L([rsh, [136, sh - 60], rh]); }
  else if (pose === 'think') { lh = [-98, sh + 210]; L([lsh, [-110, sh + 120], lh]); rh = [62, sh + 4]; L([rsh, [118, sh + 110], [80, sh + 50], rh]); }
  else if (pose === 'hold') { lh = [-200, sh + 120]; L([lsh, [-130, sh + 120], lh]); rh = [-150, sh + 150]; L([rsh, [40, sh + 170], rh]); }
  else if (pose === 'phone') { lh = [-98, sh + 210]; L([lsh, [-110, sh + 120], lh]); rh = [112, sh - 66]; L([rsh, [150, sh + 70], [132, sh - 10], rh]); }
  else { lh = [-98, sh + 210]; L([lsh, [-110, sh + 120], lh]); rh = [98, sh + 210]; L([rsh, [110, sh + 120], rh]); }
  // torso: a black hoodie with pale line details (pocket, drawstrings, folds)
  ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(-88, sh + 10); ctx.quadraticCurveTo(-100, sh + 140, -82, hip + 10); ctx.lineTo(82, hip + 10);
  ctx.quadraticCurveTo(100, sh + 140, 88, sh + 10); ctx.quadraticCurveTo(0, sh - 18, -88, sh + 10); ctx.fill();
  ctx.strokeStyle = 'rgba(243,237,226,0.9)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-58, hip - 20); ctx.lineTo(58, hip - 20); ctx.moveTo(-50, hip - 20); ctx.quadraticCurveTo(-40, hip - 80, 0, hip - 82); ctx.quadraticCurveTo(40, hip - 80, 50, hip - 20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-14, sh + 30); ctx.lineTo(-18, sh + 100); ctx.moveTo(14, sh + 30); ctx.lineTo(18, sh + 96); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-70, sh + 60); ctx.quadraticCurveTo(-78, sh + 140, -64, hip + 4); ctx.moveTo(70, sh + 60); ctx.quadraticCurveTo(78, sh + 140, 64, hip + 4); ctx.stroke();
  // hood collar, then the cut-out head, then the collar front over the neck cut
  ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(0, sh + 8, 74, 30, 0, 0, 7); ctx.fill();
  if (HEAD.complete && HEAD.naturalWidth) {
    const hw = 236, hh = hw * HEAD.naturalHeight / HEAD.naturalWidth, tilt = pose === 'think' ? -0.08 : pose === 'cheer' ? Math.sin(P.t * 10) * 0.05 : 0;
    ctx.save(); ctx.translate(0, sh + 14); ctx.rotate(tilt); ctx.drawImage(HEAD, -hw / 2, -hh * 0.97, hw, hh); ctx.restore();
  }
  ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(0, sh + 16, 62, 16, 0, 0, Math.PI); ctx.fill();
  hand(ctx, ...lh); hand(ctx, ...rh);
  if (pose === 'phone') { ctx.fillStyle = '#2b2926'; rr(ctx, rh[0] - 12, rh[1] - 40, 26, 54, 6); ctx.fill(); hand(ctx, rh[0], rh[1], 17); }
  ctx.restore();
}

// ── captions: big serif, word by word (said words ink, the current word red, the rest muted) ──
let CHUNKS = null;
function captions(ctx, t) {
  if (!CHUNKS) { CHUNKS = []; let cur = [];
    P.words.forEach((w, i) => { cur.push(w); const n = P.words[i + 1];
      if (!n || cur.length >= 3 || /[.,!?;:]$/.test(w.text) || n.start - w.end > 0.3) { CHUNKS.push(cur); cur = []; } }); }
  const i = CHUNKS.findIndex((c, k) => t >= c[0].start && t < (CHUNKS[k + 1] ? CHUNKS[k + 1][0].start : c[c.length - 1].end + 0.6));
  if (i < 0) return;
  const words = CHUNKS[i], lit = words.reduce((k, w, n) => (t >= w.start ? n : k), 0);
  const parts = words.map((w) => w.text.replace(/[,;:]$/, '')), sp = 22;
  ctx.font = SERIF(72); let size = 72, W = parts.reduce((a, s) => a + ctx.measureText(s).width, 0) + sp * (parts.length - 1);
  if (W > 980) { size = Math.floor(72 * 980 / W); ctx.font = SERIF(size); }
  const ws = parts.map((s) => ctx.measureText(s).width); W = ws.reduce((a, b) => a + b, 0) + sp * (parts.length - 1);
  let x = 540 - W / 2;
  parts.forEach((s, n) => { serif(ctx, s, x + ws[n] / 2, CAPTION_Y, { s: size, c: n === lit ? RED : n < lit ? INK : MUTE }); x += ws[n] + sp; });
}

// ── scenes (one per top-level cue). Each returns { pose, jump }. Local coords are STAGE-based. ──
const C = STAGE;
const SCENES = {
  hook(ctx, t) {
    if (card(ctx, C.cx, C.cy, 720, 640, { scale: pop(S('hook')) })) {
      sans(ctx, '🤖  AI answer', -320, -270, { w: 700, s: 30 }); ctx.fillStyle = '#e6e1d7'; ctx.fillRect(-360, -230, 720, 3);
      chatBubble(ctx, 'Church near me with a great kids ministry?', 330, -180, { right: true, bg: BLUE, c: '#fff', maxW: 520, progress: typed(0.3, 2.6) });
      if (t >= S('hook.q')) { [0, 1, 2].forEach((i) => { ctx.fillStyle = '#c9c3b8'; ctx.beginPath(); ctx.arc(-260 + i * 40, 90, 12 + Math.sin(P.t * 6 + i) * 3, 0, 7); ctx.fill(); }); }
      ctx.restore();
    }
    popWord(ctx, '?', C.cx + 120, C.cy + 140, { s: 320, rot: 8, scale: pop(S('hook.q') + 0.1, 0.25) });
    return { pose: t < S('hook.q') ? 'point' : 'think' };
  },
  hype(ctx) {
    const a = S('hype'), x = at("isn't", 'hype');
    [['GEO SECRET TRICK', RED, -9, -170], ['RANK #1 IN CHATGPT', '#2f5bd3', 4, 10], ['THE AI HACK', OK, -5, 190]].forEach(([s, col, rot, dy], i) => {
      if (card(ctx, C.cx + Math.sin(P.t * 2 + i) * 4, C.cy + dy, 640, 170, { rot: rot + Math.sin(P.t * 1.5 + i) * 1.2, scale: pop(a + 0.2 + i * 0.4), fill: col })) { serif(ctx, s, 0, 4, { s: 54, c: '#fff' }); ctx.restore(); }
    });
    tag(ctx, "EVERYONE'S SELLING IT", C.cx, C.cy - 380, { scale: pop(a + 0.6), rot: 3, check: a + 1 });
    redX(ctx, C.cx, C.cy, 640, pop(x - 0.05, 0.25));
    popWord(ctx, 'NO TRICKS', C.cx + 40, C.cy + 400, { s: 104, scale: pop(x + 0.3, 0.3), rot: -6 });
    return { pose: P.t < x ? 'think' : 'point' };
  },
  google(ctx) {
    const a = S('google'), seo = at('SEO', 'google');
    if (card(ctx, C.cx, C.cy, 760, 560, { scale: pop(a), rot: -1.5 })) {
      sans(ctx, 'Google Search Central · May 2026', -330, -220, { w: 700, s: 26, c: '#6a655d' });
      ctx.font = SERIF(46); const hx = ctx.measureText('thus ').width, hw = ctx.measureText('still SEO.').width;
      highlight(ctx, -334 + hx, 92, hw + 8, 58, since(seo - 0.3, 0.5));
      ['“optimizing for generative', 'AI search is optimizing for', 'the search experience, and', 'thus still SEO.”'].forEach((l, i) => serif(ctx, l, -330, -130 + i * 74, { s: 46, align: 'left', c: INK }));
      ctx.restore();
    }
    arrowTo(ctx, C.cx + 250, C.cy + 330, C.cx + 30, C.cy + 140, since(seo, 0.4));
    popWord(ctx, 'STILL SEO', C.cx - 40, C.cy + 400, { s: 100, scale: pop(seo + 0.1, 0.3), rot: -4 });
    return { pose: 'point' };
  },
  works(ctx) {
    const a = S('works');
    sunburst(ctx, C.cx, C.cy, 420, since(a, 0.4));
    stamp(ctx, '5 STEPS', 'THAT WORK', C.cx, C.cy, { scale: pop(a + 0.15), s: 74, rot: -5 });
    tag(ctx, 'NO HYPE', C.cx + 120, C.cy + 170, { scale: pop(a + 0.7), rot: 6, check: a + 1 });
    return { pose: 'cheer', jump: P.t < a + 1.8 ? Math.abs(Math.sin((P.t - a) * 5)) * since(a, 0.2) : 0 };
  },
  s1(ctx) {
    const a = S('s1'), g = at('Google', 's1'), cr = at('crawler', 's1'), sh = at('show', 's1');
    if (card(ctx, C.cx, C.cy + 40, 740, 640, { scale: pop(a + 0.1) })) {
      rr(ctx, -330, -270, 660, 64, 32); ctx.fillStyle = '#f1efe9'; ctx.fill();
      const q = 'your church', n = Math.ceil(typed(a + 0.6, 0.9) * q.length); sans(ctx, '🔍  ' + q.slice(0, n), -300, -238, { w: 500, s: 28, c: '#555' });
      tick(ctx, -300, -140, 22, since(g, 0.25)); sans(ctx, 'Indexed in Google', -260, -140, { w: 700, s: 34, c: P.t >= g ? INK : '#9a948a' });
      const k = since(cr - 0.8, 0.3);
      if (k > 0) {
        ctx.globalAlpha = k; rr(ctx, -330, -70, 660, 210, 18); ctx.fillStyle = '#1d1d1f'; ctx.fill();
        ctx.font = MONO(30); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#9fe3b0'; ctx.fillText('# robots.txt', -300, -24);
        ctx.fillStyle = '#fff'; ctx.fillText('User-agent: OAI-SearchBot', -300, 26); ctx.fillText('Allow: /', -300, 74);
        const pct = Math.round(100 * clamp01((P.t - cr + 0.5) / 1.6)); sans(ctx, `checking… ${pct}%`, 300, -24, { w: 700, s: 22, c: pct < 100 ? '#e8a20b' : '#9fe3b0', align: 'right' });
        ctx.globalAlpha = 1;
        emoji(ctx, '🕷️', lerp(-460, -150, ease.out(clamp01((P.t - cr + 0.6) / 1.2))), 165, 54);  // the search crawler walks in
      }
      tick(ctx, -300, 230, 22, since(sh, 0.25)); sans(ctx, 'ChatGPT search can show it', -260, 230, { w: 700, s: 34, c: P.t >= sh ? INK : '#9a948a' });
      ctx.restore();
    }
    stamp(ctx, 'STEP 1', 'GET FOUND', C.cx - 180, C.cy - 300, { scale: pop(a) });
    cursor(ctx, [[a + 0.3, C.cx + 200, C.cy + 330], [a + 0.6, C.cx - 120, C.cy - 196, true], [g - 0.4, C.cx - 120, C.cy - 196], [g, C.cx - 290, C.cy - 90, true], [sh - 0.5, C.cx - 290, C.cy - 90], [sh, C.cx - 290, C.cy + 280, true]], P.t);
    return { pose: 'point' };
  },
  s2(ctx, t) {
    const a = S('s2'), m = S('s2.match');
    if (t < m) {
      const ts = [at('times', 's2'), at('photos', 's2'), at('website', 's2')];
      if (card(ctx, C.cx, C.cy + 40, 740, 660, { scale: pop(a + 0.1) })) {
        rr(ctx, -330, -280, 660, 150, 18); ctx.fillStyle = '#e8eef9'; ctx.fill(); emoji(ctx, '⛪', -250, -205, 80);
        sans(ctx, 'Grace Community Church', -180, -225, { w: 800, s: 34 }); sans(ctx, 'Example church · Google Business Profile', -180, -180, { w: 500, s: 22, c: '#6a655d' });
        [['🕘', 'Service times', 'Sundays 9 & 11 AM'], ['📷', 'Photos', 'Sanctuary, kids room, parking'], ['🌐', 'Website', 'gracecommunity.example']].forEach(([em, l, v], i) => {
          const y = -60 + i * 110, tw = ts[i]; emoji(ctx, em, -290, y, 40);
          highlight(ctx, -246, y - 18, 260, 40, since(tw - 0.1, 0.35));
          sans(ctx, l, -240, y - 18, { w: 700, s: 30 }); sans(ctx, v.slice(0, Math.ceil(typed(tw, 0.6) * v.length)) || ' ', -240, y + 20, { w: 500, s: 24, c: '#6a655d' });
          tick(ctx, 290, y, 22, since(tw + 0.3, 0.25)); });
        ctx.restore();
      }
      cursor(ctx, [[a + 0.4, C.cx + 250, C.cy + 400], ...ts.map((tt, i) => [tt, C.cx + 290, C.cy - 20 + i * 110, true])], P.t);
      tag(ctx, 'HELPS IN AI ANSWERS', C.cx + 20, C.cy + 430, { scale: pop(at('helps', 's2')), rot: -3, check: at('helps', 's2') + 0.5 });
    } else {
      [['Google Maps', -6, -260], ['Bing Places', 3, 0], ['Apple Maps', -3, 260]].forEach(([s, rot, dy], i) => {
        if (card(ctx, C.cx, C.cy + dy, 620, 200, { rot, scale: pop(m + i * 0.25) })) {
          ctx.fillStyle = '#e9efe4'; rr(ctx, 160, -70, 130, 140, 14); ctx.fill(); ctx.strokeStyle = '#cfd7c6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(160, 0); ctx.lineTo(290, 0); ctx.moveTo(225, -70); ctx.lineTo(225, 70); ctx.stroke();
          pin(ctx, 225, 10, pop(m + i * 0.25 + 0.3, 0.35));
          sans(ctx, s, -270, -50, { w: 800, s: 30 }); sans(ctx, 'Grace Community Church', -270, 0, { w: 600, s: 24 }); sans(ctx, 'Sun 9 & 11 AM · same address', -270, 40, { w: 500, s: 22, c: '#6a655d' });
          ctx.restore(); }
      });
      popWord(ctx, 'ALL MATCH', C.cx, C.cy + 430, { s: 90, scale: pop(m + 1.2, 0.3), rot: -4, c: OK });
    }
    stamp(ctx, 'STEP 2', 'PROFILE', C.cx - 200, C.cy - 320, { scale: pop(a) });
    return { pose: t < m ? 'point' : 'hold' };
  },
  s3(ctx) {
    const a = S('s3');
    if (card(ctx, C.cx, C.cy + 40, 740, 660, { scale: pop(a + 0.1) })) {
      serif(ctx, 'Plan your visit · FAQ', -320, -260, { s: 40, align: 'left' });
      [['What time is service?', 'time', 'Sundays at 9 & 11 AM'], ['What about my kids?', 'kids', 'Kids church, ages 3 to 11'], ['Where do I park?', 'park', 'Free lot behind the building'], ['What should I wear?', 'wear', 'Come as you are']].forEach(([q, w, ans], i) => {
        const tw = at(w, 's3'), k = pop(tw - 0.25); if (!k) return; const y = -150 + i * 115;
        ctx.save(); ctx.translate(0, y); ctx.scale(1, k); rr(ctx, -330, -48, 660, 96, 16); ctx.fillStyle = '#f6f2ea'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#d9d2c4'; ctx.stroke();
        sans(ctx, q, -300, -14, { w: 700, s: 30 }); sans(ctx, ans.slice(0, Math.ceil(typed(tw + 0.3, 0.7) * ans.length)), -300, 22, { w: 500, s: 24, c: '#6a655d' });
        tick(ctx, 290, 0, 20, since(tw + 1, 0.25)); ctx.restore(); });
      ctx.restore();
    }
    const pw = at('words', 's3');
    arrowTo(ctx, C.cx + 420, C.cy + 400, C.cx + 290, C.cy + 270, since(pw, 0.4));
    tag(ctx, 'PLAIN WORDS', C.cx + 250, C.cy + 450, { scale: pop(pw + 0.2), rot: 4 });
    stamp(ctx, 'STEP 3', 'ANSWER', C.cx - 200, C.cy - 320, { scale: pop(a) });
    return { pose: 'point' };
  },
  s4(ctx) {
    const a = S('s4'), on = at('only', 's4'), rc = at('recycle', 's4');
    [['🎙️', 'This week’s sermon', 'sermons', -9, -230], ['💬', 'A member’s story', 'stories', 4, -20], ['📅', 'Fall festival', 'events', -4, 190]].forEach(([em, s, w, rot, dy], i) => {
      if (card(ctx, C.cx - 40 + i * 30, C.cy + dy + Math.sin(P.t * 2 + i) * 4, 560, 170, { rot, scale: pop(at(w, 's4') - 0.2) })) { emoji(ctx, em, -210, 0, 64); serif(ctx, s, -150, 4, { s: 40, align: 'left' }); ctx.restore(); }
    });
    tag(ctx, 'ONLY YOURS', C.cx + 240, C.cy - 380, { scale: pop(on), rot: 5, check: on + 0.5 });
    const k = pop(rc - 0.1);
    if (k) { tag(ctx, 'copy-paste content', C.cx + 40, C.cy + 400, { scale: k, rot: 4, c: '#7a746b' }); redX(ctx, C.cx + 40, C.cy + 400, 150, pop(rc + 0.3, 0.25)); }
    stamp(ctx, 'STEP 4', 'ONLY YOU', C.cx - 200, C.cy - 380, { scale: pop(a) });
    return { pose: 'hold' };
  },
  s5(ctx, t) {
    const a = S('s5'), f = S('s5.fake');
    if (t < f) {
      const rv = at('reviews', 's5'), nw = at('news', 's5'), rl = at('real', 's5');
      if (card(ctx, C.cx, C.cy - 120, 640, 260, { rot: -3, scale: pop(rv - 0.2) })) {
        const n = Math.floor(clamp01((P.t - rv) / 0.8) * 5); sans(ctx, '★★★★★'.slice(0, n) || ' ', -270, -60, { w: 700, s: 44, c: '#e8a20b' });
        highlight(ctx, -276, 20, 470, 50, since(rv + 0.9, 0.4)); serif(ctx, '“Our kids loved it here.”', -270, 20, { s: 38, align: 'left' });
        sans(ctx, 'Example review', -270, 80, { w: 500, s: 22, c: '#7a746b' }); ctx.restore(); }
      if (card(ctx, C.cx + 20, C.cy + 210, 640, 260, { rot: 3, scale: pop(nw - 0.2), fill: '#f4efe3' })) {
        sans(ctx, 'LOCAL NEWS', -270, -80, { w: 800, s: 24, c: '#7a746b' }); serif(ctx, 'Church hosts community', -270, -10, { s: 40, align: 'left' }); serif(ctx, 'food drive', -270, 46, { s: 40, align: 'left' });
        sans(ctx, 'Example headline', -270, 100, { w: 500, s: 22, c: '#7a746b' }); ctx.restore(); }
      tag(ctx, 'REAL', C.cx + 300, C.cy - 360, { scale: pop(rl), rot: 6, check: rl + 0.4 });
    } else {
      if (card(ctx, C.cx + (P.t < f + 0.8 ? Math.sin(P.t * 30) * 4 : 0), C.cy, 640, 220, { rot: -4, scale: pop(f) })) { serif(ctx, 'FAKE MENTIONS', 0, 4, { s: 60 }); ctx.restore(); }
      redX(ctx, C.cx, C.cy, 380, pop(f + 0.4, 0.25));
      popWord(ctx, "DON'T HELP", C.cx, C.cy + 330, { s: 96, scale: pop(at('help', 's5.fake'), 0.3), rot: -5 });
    }
    stamp(ctx, 'STEP 5', 'TRUST', C.cx - 200, C.cy - 380, { scale: pop(a) });
    return { pose: t < f ? 'point' : 'think' };
  },
  skip(ctx) {
    const a = S('skip');
    if (card(ctx, C.cx, C.cy - 150, 620, 200, { rot: -4, scale: pop(at('file', 'skip') - 0.3) })) { ctx.font = MONO(40); ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('llms.txt', 0, -14); sans(ctx, '(for Google)', 0, 44, { w: 500, s: 28, c: '#7a746b', align: 'center' }); ctx.restore(); }
    redX(ctx, C.cx, C.cy - 150, 220, pop(at('Google', 'skip') + 0.1, 0.25));
    if (card(ctx, C.cx + 10, C.cy + 160, 660, 200, { rot: 3, scale: pop(at('guarantee', 'skip') - 0.2) })) { serif(ctx, 'GUARANTEED #1', 0, -24, { s: 52 }); serif(ctx, 'IN CHATGPT', 0, 36, { s: 52 }); ctx.restore(); }
    redX(ctx, C.cx + 10, C.cy + 160, 240, pop(at('ChatGPT', 'skip') + 0.1, 0.25));
    stamp(ctx, 'SKIP THE HYPE', '', C.cx, C.cy - 400, { scale: pop(a), s: 60, rot: -3 });
    return { pose: 'think' };
  },
  test(ctx) {
    const a = S('test'), sw = at('shows', 'test');
    if (card(ctx, C.cx, C.cy + 20, 640, 700, { scale: pop(a + 0.1), rot: -1 })) {
      rr(ctx, -260, -310, 520, 620, 40); ctx.fillStyle = '#f6f3ec'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      chatBubble(ctx, 'Church near me with a great kids ministry?', 230, -230, { right: true, bg: BLUE, c: '#fff', maxW: 420, s: 28, progress: typed(at('Ask', 'test'), 1.6) });
      chatBubble(ctx, 'What time is the service at…', 230, -60, { right: true, bg: BLUE, c: '#fff', maxW: 420, s: 28, progress: typed(at('family', 'test'), 1.2) });
      if (P.t >= sw) { const k = pop(sw); ctx.save(); ctx.translate(Math.sin(P.t * 4) * 30, 170); ctx.scale(k, k); emoji(ctx, '🔍', 0, 0, 120); ctx.restore(); }
      ctx.restore();
    }
    tag(ctx, 'TEST IT YOURSELF', C.cx, C.cy - 400, { scale: pop(a), rot: -3, check: a + 0.6 });
    return { pose: 'phone' };
  },
  cta(ctx) {
    const a = S('cta'), cm = at('Comment', 'cta'), fd = at('FOUND', 'cta');
    sunburst(ctx, C.cx, C.cy - 60, 380, since(a + 0.2, 0.5) * 0.6);
    if (card(ctx, C.cx, C.cy - 60, 640, 560, { rot: -2, scale: pop(a + 0.1) })) {
      serif(ctx, 'Get your church found', 0, -210, { s: 44 }); sans(ctx, '5-step checklist · free', 0, -160, { w: 600, s: 26, c: '#7a746b', align: 'center' });
      ['Make sure AI can find you', 'Complete your Business Profile', 'Answer real questions', 'Post what only you have', 'Earn real reviews'].forEach((s, i) => {
        tick(ctx, -250, -90 + i * 66, 18, since(a + 0.6 + i * 0.25, 0.2)); sans(ctx, s, -215, -90 + i * 66, { w: 600, s: 27 }); });
      ctx.restore();
    }
    tag(ctx, 'FREE', C.cx + 280, C.cy - 330, { scale: pop(a + 1.2), rot: 10, bg: GOLD });
    const k = pop(cm - 0.2);
    if (k) { ctx.save(); ctx.translate(C.cx, C.cy + 330); ctx.scale(k, k);
      rr(ctx, -400, -58, 800, 116, 58); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      const n = Math.floor(clamp01((P.t - fd + 0.3) / 0.5) * 5), s = 'FOUND'.slice(0, n);
      sans(ctx, s || 'Add a comment…', -350, 2, { w: s ? 800 : 500, s: 42, c: s ? INK : '#9a948a' });
      const press = P.t > fd + 0.4 && P.t < fd + 0.6 ? 0.92 : 1;
      ctx.save(); ctx.translate(305, 0); ctx.scale(press, press); rr(ctx, -75, -40, 150, 80, 40); ctx.fillStyle = RED; ctx.fill(); sans(ctx, 'Post', 0, 2, { w: 800, s: 32, c: '#fff', align: 'center' }); ctx.restore();
      ctx.restore(); }
    cursor(ctx, [[a + 1, C.cx + 380, C.cy + 520], [fd + 0.4, C.cx + 300, C.cy + 330, true]], P.t);
    return { pose: 'point' };
  },
};
const ORDER = ['hook', 'hype', 'google', 'works', 's1', 's2', 's3', 's4', 's5', 'skip', 'test', 'cta'];
let PUNCHES = null;  // small camera punch-ins on key beats

// ── frame ──────────────────────────────────────────────────────────────────
Eduba.frame({ overlay: true, step: 30, draw(g, t) {
  const ctx = g.photo.ctx;
  if (!PUNCHES) PUNCHES = ['works', 's1', 's2', 's3', 's4', 's5', 'skip'].map((k) => S(k)).concat([at("isn't", 'hype'), at('SEO', 'google')]);
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, 1080, 1920);
  let id = ORDER[0]; for (const k of ORDER) if (t >= S(k)) id = k;
  const slide = 1 - ease.out(clamp01((t - S(id)) / 0.35));            // each scene slides in from the right
  let zoom = 1; for (const p of PUNCHES) { const u = (t - p) / 0.45; if (u >= 0 && u < 1) zoom = Math.max(zoom, 1 + 0.045 * (1 - ease.out(u))); }
  ctx.save(); ctx.translate(540, 1100); ctx.scale(zoom, zoom); ctx.translate(-540, -1100);
  ctx.save(); ctx.translate(slide * 260, 0); ctx.globalAlpha = 1 - slide * 0.6;
  ctx.translate(STAGE_FIT.cx, C.cy); ctx.scale(STAGE_FIT.k, STAGE_FIT.k); ctx.translate(-C.cx, -C.cy);
  const r = SCENES[id](ctx, t) || {};
  ctx.restore();
  ground(ctx);
  tony(ctx, r.pose || 'stand', TONY_X + slide * 120, 0.92, r.jump || 0);
  ctx.restore();
  if (t < 1.6) {  // opening title, like the reference
    const k = 1 - clamp01((t - 1.2) / 0.4);
    ctx.globalAlpha = k; serif(ctx, 'HOW TO GET YOUR CHURCH', 540, CAPTION_Y - 40, { s: 64 }); serif(ctx, 'FOUND BY AI', 540, CAPTION_Y + 40, { s: 64, c: RED }); ctx.globalAlpha = 1;
  } else captions(ctx, t);
  sans(ctx, 'Example church content · illustration', 540, 1880, { w: 500, s: 20, c: '#b5ad9f', align: 'center' });
} });
