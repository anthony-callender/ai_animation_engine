// paper-kit.js: the "paper collage" reel look (from Reel B, church-geo-reel), shared by paper reels.
// Load before a reel's scene.js. It defines the look constants, drawing helpers (card, stamp, tag, redX, tick, chatBubble,
// highlight, cursor, sunburst, popWord, arrowTo, pin), the ink ground, Tony (real head on an ink body) and serif captions.
// A reel's scene.js defines SCENES (one per top-level cue; each returns { pose, jump }) and calls paperFrame({...}).
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
// ── the frame: scene slides in from the right, punch-ins, ground, Tony, opening title, captions ──
function paperFrame({ ORDER, SCENES, punches = [], title = null, label = '' }) {
  const C = STAGE; let PUNCHES = null;
  Eduba.frame({ overlay: true, step: 30, draw(g, t) {
    const ctx = g.photo.ctx;
    if (!PUNCHES) PUNCHES = punches.map((p) => (typeof p === 'function' ? p() : S(p))).filter(Number.isFinite);
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, 1080, 1920);
    let id = ORDER[0]; for (const k of ORDER) if (t >= S(k)) id = k;
    const slide = 1 - ease.out(clamp01((t - S(id)) / 0.35));
    let zoom = 1; for (const p of PUNCHES) { const u = (t - p) / 0.45; if (u >= 0 && u < 1) zoom = Math.max(zoom, 1 + 0.045 * (1 - ease.out(u))); }
    ctx.save(); ctx.translate(540, 1100); ctx.scale(zoom, zoom); ctx.translate(-540, -1100);
    ctx.save(); ctx.translate(slide * 260, 0); ctx.globalAlpha = 1 - slide * 0.6;
    ctx.translate(STAGE_FIT.cx, C.cy); ctx.scale(STAGE_FIT.k, STAGE_FIT.k); ctx.translate(-C.cx, -C.cy);
    const r = SCENES[id](ctx, t) || {};
    ctx.restore();
    ground(ctx);
    tony(ctx, r.pose || 'stand', TONY_X + slide * 120, 0.92, r.jump || 0);
    ctx.restore();
    if (title && t < 1.6) {
      const k = 1 - clamp01((t - 1.2) / 0.4); ctx.globalAlpha = k;
      serif(ctx, title[0], 540, CAPTION_Y - 40, { s: title[2] || 64 }); serif(ctx, title[1], 540, CAPTION_Y + 40, { s: title[2] || 64, c: RED }); ctx.globalAlpha = 1;
    } else captions(ctx, t);
    if (label) sans(ctx, label, 540, 1880, { w: 500, s: 20, c: '#b5ad9f', align: 'center' });
  } });
}
