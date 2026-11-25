// scene.js: tourism-loom-intro (16:9, light theme). Upwork Loom pitch for a tourism org's educational videos.
// Placeholders until Tony supplies them (each is drawn automatically once imported with `anim.py real ... clip`):
//   head      Tony's talking head        --as head      --fps 30 --width 720
//   colossyan Colossyan example (YouTube) --as colossyan --fps 30 --width 1280
//   presenter Colossyan library presenter --as presenter --fps 30 --width 720
// The 10-second trail sample is an authored illustration (generic tips), labelled SAMPLE.
const { ease } = P;
const S = (id) => P.cue(id).start;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, p) => a + (b - a) * p;
P.wait(Promise.all(['500', '600', '700', '800'].map((w) => document.fonts.load(`${w} 40px Inter`))));

// ── look: light, calm, travel ──────────────────────────────────────────────
const BG = '#F6F8FB', DOT = '#E2E8F0', CARD = '#FFFFFF', EDGE = '#DCE3EC', TEXT = '#13233A', SUB = '#5B6B80';
const TEAL = '#0E8C86', TEAL2 = '#E2F4F2', CORAL = '#EE7A4D', CORAL2 = '#FDECE4', GOLD = '#F2B544', GOLD2 = '#FDF3DC', GREEN = '#3E9E5F', GREEN2 = '#E3F3E8';
const FONT = (w, s) => `${w} ${s}px Inter, "Segoe UI", Arial, sans-serif`;
const EMOJI = (s) => `${s}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
const CAP_Y = 1012;

// ── helpers (NOW lets the sample replay inside the presenter scene) ─────────
let NOW = 0, REPLAY = false;
const since = (t0, d = 0.3) => clamp01((NOW - t0) / d);
const pop = (t0, d = 0.32) => { const k = since(t0, d); return k <= 0 ? 0 : ease.back(k); };
const at = (w, cue, fb) => { const v = P.at(w, cue); return Number.isFinite(v) ? v : fb; };
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function txt(ctx, s, x, y, o = {}) { ctx.font = FONT(o.w || 600, o.s || 32); ctx.fillStyle = o.c || TEXT; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); }
function emoji(ctx, s, x, y, size) { ctx.font = EMOJI(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(s, x, y); }
function shadow(ctx, a = 0.12, b = 30, y = 10) { ctx.shadowColor = `rgba(19,35,58,${a})`; ctx.shadowBlur = b; ctx.shadowOffsetY = y; }
function noShadow(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }
// a card centred on (x, y); returns false when not yet visible. Caller must ctx.restore() when true.
function card(ctx, x, y, w, h, o = {}) {
  const k = o.scale ?? 1; if (k <= 0) return false;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.globalAlpha *= (o.alpha ?? 1) * Math.min(1, k * 1.5);
  shadow(ctx); rr(ctx, -w / 2, -h / 2, w, h, o.r || 24); ctx.fillStyle = o.fill || CARD; ctx.fill(); noShadow(ctx);
  ctx.lineWidth = o.lw || 2; ctx.strokeStyle = o.edge || EDGE; ctx.stroke(); return true;
}
function chip(ctx, s, x, y, o = {}) {
  const k = o.scale ?? 1; if (k <= 0) return; const size = o.s || 30; ctx.font = FONT(700, size);
  const w = ctx.measureText(s).width + 52, h = size + 30; ctx.save(); ctx.translate(x, y); ctx.rotate((o.rot || 0) * Math.PI / 180); ctx.scale(k, k);
  shadow(ctx, 0.1, 18, 6); rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = o.bg || CARD; ctx.fill(); noShadow(ctx);
  ctx.lineWidth = 2; ctx.strokeStyle = o.edge || EDGE; ctx.stroke(); txt(ctx, s, 0, 2, { w: 700, s: size, c: o.c || TEXT }); ctx.restore();
}
function check(ctx, x, y, r = 20, k = 1) {
  if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.fillStyle = GREEN; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = r / 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-r * 0.45, 0); ctx.lineTo(-r * 0.1, r * 0.35); ctx.lineTo(r * 0.5, -r * 0.35); ctx.stroke(); ctx.restore();
}
function label(ctx, s, x = 960, y = 1056) { txt(ctx, s, x, y, { w: 600, s: 20, c: '#8A97A8' }); }
const clipOf = (name) => (window.REAL && REAL.clips && REAL.clips[name]) ? Desk.clip(name) : null;
function cover(ctx, img, x, y, w, h, fy = 0.5) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight), iw = img.naturalWidth * s, ih = img.naturalHeight * s;
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) * fy, iw, ih);
}
const ready = (img) => img && img.complete && img.naturalWidth;
// a placeholder for footage Tony drops in later
function placeholder(ctx, x, y, w, h, title, sub, person = false) {
  const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, '#EAF1F8'); g.addColorStop(1, '#D9E4EF');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const cx = x + w / 2;
  if (person) { const u = Math.min(w, h * 0.62);
    ctx.fillStyle = '#C3D1E0'; ctx.beginPath(); ctx.arc(cx, y + h * 0.46, u * 0.19, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, y + h * 0.46 + u * 0.6, u * 0.42, u * 0.36, 0, Math.PI, 0); ctx.fill(); }
  else { ctx.fillStyle = '#C3D1E0'; ctx.beginPath(); ctx.arc(cx, y + h * 0.45, 56, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(cx - 18, y + h * 0.45 - 28); ctx.lineTo(cx + 30, y + h * 0.45); ctx.lineTo(cx - 18, y + h * 0.45 + 28); ctx.fill(); }
  if (w > 380) { txt(ctx, title, cx, y + h * (person ? 0.14 : 0.68), { w: 800, s: Math.min(44, w / 14), c: '#6E86A3' });
    txt(ctx, sub, cx, y + h * (person ? 0.14 : 0.68) + 46, { w: 500, s: Math.min(26, w / 22), c: '#8DA1B9' }); }
}

// ── Tony's talking head: full → corner bubble → away for the sample → end card ──
const HEADV = clipOf('head');
const BUB = { x: 1730, y: 875, r: 160 };
function headBox(t) {
  const full = { x: 960, y: 540, w: 1920, h: 1080, r: 0 }, bub = { x: BUB.x, y: BUB.y, w: BUB.r * 2, h: BUB.r * 2, r: BUB.r };
  const off = { ...bub, x: BUB.x + 420 }, end = { x: 560, y: 520, w: 440, h: 440, r: 220 };
  const mix = (A, B, f) => ({ x: lerp(A.x, B.x, f), y: lerp(A.y, B.y, f), w: lerp(A.w, B.w, f), h: lerp(A.h, B.h, f), r: lerp(A.r, B.r, f) });
  const c = S('close');
  if (t >= c) return { ...mix({ ...end, x: -300 }, end, ease.out(clamp01((t - c) / 0.6))), ring: true };
  if (t >= S('title')) { const f = ease.inOut(clamp01((t - S('title') - 0.3) / 0.6)); return f >= 1 ? null : { ...mix(bub, off, f), ring: true }; }
  const f = ease.inOut(clamp01((t - S('colossyan')) / 0.6));
  return { ...mix(full, bub, f), ring: f > 0.02 };
}
function talkingHead(ctx, t) {
  const b = headBox(t); if (!b) return;
  const x = b.x - b.w / 2, y = b.y - b.h / 2;
  ctx.save(); if (b.ring) { shadow(ctx, 0.25, 40, 12); rr(ctx, x, y, b.w, b.h, b.r); ctx.fillStyle = '#fff'; ctx.fill(); noShadow(ctx); }
  rr(ctx, x, y, b.w, b.h, b.r); ctx.clip();
  const img = HEADV && HEADV.at(t);
  if (ready(img)) {  // zoom toward the face as the box shrinks
    const z = lerp(1.55, 1, clamp01((b.w - 320) / 1600)), sc = Math.max(b.w / img.naturalWidth, b.h / img.naturalHeight) * z;
    const iw = img.naturalWidth * sc, ih = img.naturalHeight * sc;
    let dx = b.x - 0.5 * iw, dy = b.y - 0.58 * ih; dx = Math.min(x, Math.max(x + b.w - iw, dx)); dy = Math.min(y, Math.max(y + b.h - ih, dy));
    ctx.drawImage(img, dx, dy, iw, ih);
  } else placeholder(ctx, x, y, b.w, b.h, 'TALKING HEAD', 'placeholder · Tony records this', true);
  ctx.restore();
  if (b.ring) { ctx.save(); ctx.lineWidth = 7; ctx.strokeStyle = '#fff'; rr(ctx, x, y, b.w, b.h, b.r); ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = TEAL; rr(ctx, x - 5, y - 5, b.w + 10, b.h + 10, b.r + 5); ctx.stroke(); ctx.restore(); }
  if (t < S('colossyan') + 0.3) {  // name lower third
    const k = since(0.4, 0.4) * (1 - since(S('colossyan'), 0.3)); if (k <= 0) return;
    ctx.save(); ctx.globalAlpha = k; ctx.translate((1 - k) * -40, 0);
    shadow(ctx, 0.18, 30, 8); rr(ctx, 80, 760, 640, 140, 20); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill(); noShadow(ctx);
    ctx.fillStyle = TEAL; rr(ctx, 80, 760, 12, 140, [20, 0, 0, 20]); ctx.fill();
    txt(ctx, 'Tony Callender', 124, 806, { w: 800, s: 46, align: 'left' }); txt(ctx, 'Educational animated videos', 124, 858, { w: 500, s: 28, c: SUB, align: 'left' });
    ctx.restore();
  }
}

// ── the 10-second sample: an illustrated trail lesson ───────────────────────
function hill(ctx, pts, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, 1080); pts.forEach(([x, y], i) => {
  if (i === 0) ctx.lineTo(x, y); else { const [px, py] = pts[i - 1]; ctx.quadraticCurveTo(px + (x - px) / 2, Math.min(py, y) - 30, x, y); } }); ctx.lineTo(1920, 1080); ctx.closePath(); ctx.fill(); }
function cloud(ctx, x, y, s) { ctx.fillStyle = 'rgba(255,255,255,0.95)'; [[0, 0, 40], [38, -16, 46], [80, 0, 38], [40, 10, 40]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, 7); ctx.fill(); }); }
// path from (960,1080) winding to the horizon (1180,560)
const PATH = (u) => { const y = lerp(1100, 560, u); const x = 960 + Math.sin(u * 3.4) * 240 * (1 - u) + u * 220; return [x, y]; };
function trailPath(ctx, prog) {
  const N = 60; ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let pass = 0; pass < 2; pass++) { ctx.beginPath();
    for (let i = 0; i <= N * prog; i++) { const u = i / N, [x, y] = PATH(u); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.strokeStyle = pass ? '#F3E2BC' : '#E2C995'; ctx.lineWidth = pass ? 120 : 136; ctx.stroke(); }
  ctx.restore();
}
function marker(ctx, x, y, k) {  // trail marker post with a teal arrow
  if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = '#8B6A4A'; ctx.fillRect(-8, -150, 16, 150);
  shadow(ctx, 0.2, 12, 4); rr(ctx, -70, -190, 140, 70, 12); ctx.fillStyle = TEAL; ctx.fill(); noShadow(ctx);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-36, -165); ctx.lineTo(14, -165); ctx.lineTo(14, -178); ctx.lineTo(44, -155); ctx.lineTo(14, -132); ctx.lineTo(14, -145); ctx.lineTo(-36, -145); ctx.fill();
  ctx.restore();
}
function flower(ctx, x, y, k, c) { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.strokeStyle = GREEN; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -40); ctx.stroke();
  ctx.fillStyle = c; for (let i = 0; i < 5; i++) { const a = i * 1.2566; ctx.beginPath(); ctx.arc(Math.cos(a) * 11, -40 + Math.sin(a) * 11, 9, 0, 7); ctx.fill(); }
  ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(0, -40, 7, 0, 7); ctx.fill(); ctx.restore(); }
function footprint(ctx, x, y, s, flip, a) { ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s * (flip ? -1 : 1), s); ctx.fillStyle = '#B59460';
  ctx.beginPath(); ctx.ellipse(0, 0, 11, 18, -0.2, 0, 7); ctx.fill(); [[-8, -24, 4], [-1, -27, 4.5], [6, -25, 4], [11, -20, 3.5]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(dx, dy, r, 0, 7); ctx.fill(); }); ctx.restore(); }

function sampleDraw(ctx) {
  const a = S('sample');
  const wa = at('water', 'sample', a + 2.2), mp = at('map', 'sample', a + 2.9), ly = at('layer', 'sample', a + 3.8);
  const mk = at('marked', 'sample', a + 5.2), pl = at('plants', 'sample', a + 6.6), sf = at('safe', 'sample', a + 7.8), fp = at('footprints', 'sample', a + 9.4);
  // sky + sun
  const g = ctx.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, '#BFE2F5'); g.addColorStop(1, '#F2F9FC'); ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
  const sunY = lerp(420, 230, ease.out(since(a, 1.6)));
  ctx.save(); ctx.shadowColor = 'rgba(242,181,68,0.6)'; ctx.shadowBlur = 60; ctx.fillStyle = '#FFD27A'; ctx.beginPath(); ctx.arc(1560, sunY, 90, 0, 7); ctx.fill(); ctx.restore();
  cloud(ctx, 260 + (NOW * 14) % 300, 170, 1.2); cloud(ctx, 1150 + (NOW * 9) % 200, 120, 0.9);
  // mountains + hills
  ctx.fillStyle = '#A9BCD8'; ctx.beginPath(); ctx.moveTo(0, 640); ctx.lineTo(420, 330); ctx.lineTo(760, 600); ctx.lineTo(1100, 300); ctx.lineTo(1500, 620); ctx.lineTo(1920, 380); ctx.lineTo(1920, 700); ctx.lineTo(0, 700); ctx.fill();
  ctx.fillStyle = '#fff'; [[420, 330, 70], [1100, 300, 80]].forEach(([x, y, s]) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s, y + s * 0.85); ctx.lineTo(x - s * 0.3, y + s * 0.65); ctx.lineTo(x, y + s * 0.85); ctx.lineTo(x + s * 0.4, y + s * 0.6); ctx.lineTo(x + s * 0.9, y + s * 0.8); ctx.fill(); });
  hill(ctx, [[0, 640], [500, 560], [1000, 620], [1500, 560], [1920, 620]], '#9FD3B5');
  hill(ctx, [[0, 760], [600, 700], [1200, 760], [1920, 700]], '#74BF8F');
  trailPath(ctx, ease.inOut(since(a + 0.2, 1.4)));
  // trees
  [[180, 760], [300, 800], [1640, 760], [1780, 800], [1500, 820]].forEach(([x, y], i) => { const k = pop(a + 0.5 + i * 0.12); if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.fillStyle = '#8B6A4A'; ctx.fillRect(-7, -10, 14, 40);
    ctx.fillStyle = '#2F8A5B'; ctx.beginPath(); ctx.moveTo(0, -120); ctx.lineTo(-48, -10); ctx.lineTo(48, -10); ctx.fill(); ctx.restore(); });
  // stay on the marked path: marker + glowing edges, then flowers along it
  marker(ctx, 1240, 900, pop(mk, 0.4));
  if (NOW > mk) { const k = since(mk, 0.6); ctx.save(); ctx.globalAlpha = k * (0.6 + 0.4 * Math.sin(NOW * 5)); ctx.strokeStyle = TEAL; ctx.lineWidth = 5; ctx.setLineDash([16, 14]);
    [-70, 70].forEach((d) => { ctx.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40, [x, y] = PATH(u); const s = 1 - u * 0.75; i ? ctx.lineTo(x + d * s, y) : ctx.moveTo(x + d * s, y); } ctx.stroke(); }); ctx.restore(); }
  [[700, 980, CORAL], [760, 900, '#E86A9A'], [1300, 1000, '#9B7BE0'], [1360, 930, CORAL], [640, 860, '#E86A9A'], [1420, 860, '#F2B544']].forEach(([x, y, c], i) => flower(ctx, x, y, pop(pl + i * 0.08, 0.4), c));
  // footprints walking up the path
  if (NOW > fp - 0.2) { const n = Math.floor(since(fp - 0.2, 1.4) * 10);
    for (let i = 0; i < n; i++) { const u = 0.04 + i * 0.07, [x, y] = PATH(u); footprint(ctx, x + (i % 2 ? 18 : -18) * (1 - u), y, 1.6 * (1 - u * 0.7), i % 2, 1); } }
  // packing list
  const anyK = pop(wa - 0.25);
  if (card(ctx, 340, 400, 440, 380, { scale: anyK * (1 - since(fp, 0.4)) + 0, alpha: 0.97 })) {
    emoji(ctx, '🎒', -150, -130, 54); txt(ctx, 'Pack', -100, -130, { w: 800, s: 40, align: 'left' });
    [['💧', 'Water', wa], ['🗺️', 'A map', mp], ['🧥', 'An extra layer', ly]].forEach(([e, s, t0], i) => { const k = pop(t0); if (k <= 0) return;
      const y = -40 + i * 92; ctx.save(); ctx.translate(-40 + 40 * k, y); ctx.globalAlpha *= Math.min(1, k);
      emoji(ctx, e, -140, 0, 44); txt(ctx, s, -100, 0, { w: 600, s: 34, align: 'left' }); ctx.restore(); check(ctx, 160, y, 20, pop(t0 + 0.2)); });
    ctx.restore();
  }
  // lesson chips
  chip(ctx, '🥾  Trail tips', 220, 110, { scale: pop(a + 0.3), s: 34, bg: CARD, edge: TEAL });
  if (!REPLAY) {
  chip(ctx, 'Stay on the marked path', 1240, 640, { scale: pop(mk + 0.2) * (1 - since(pl, 0.3)), s: 32, bg: TEAL2, edge: TEAL, c: '#0A5F5B' });
  chip(ctx, '🌱  Protects the plants', 1240, 640, { scale: pop(pl + 0.1) * (1 - since(sf, 0.3)), s: 32, bg: GREEN2, edge: GREEN, c: '#24613A' });
  chip(ctx, '🛡️  Keeps you safe', 1240, 640, { scale: pop(sf + 0.1) * (1 - since(fp, 0.3)), s: 32, bg: GOLD2, edge: GOLD, c: '#7A5510' });
  chip(ctx, '👣  Leave only footprints', 960, 420, { scale: pop(fp + 0.2, 0.45), s: 44, bg: CARD, edge: CORAL, c: TEXT });
  }
}

// ── scenes ──────────────────────────────────────────────────────────────────
const COLV = clipOf('colossyan'), PRESV = clipOf('presenter');
function browser(ctx, cx, cy, w, h, k) {  // a light browser frame; returns the content rect
  const x = cx - w / 2, y = cy - h / 2;
  ctx.save(); ctx.globalAlpha *= Math.min(1, k * 1.4); ctx.translate(cx, cy); ctx.scale(0.94 + 0.06 * k, 0.94 + 0.06 * k); ctx.translate(-cx, -cy);
  shadow(ctx, 0.16, 50, 16); rr(ctx, x - 4, y - 50, w + 8, h + 54, 20); ctx.fillStyle = '#fff'; ctx.fill(); noShadow(ctx); ctx.strokeStyle = EDGE; ctx.lineWidth = 2; ctx.stroke();
  ['#F26D6D', '#F2C14E', '#5CC27A'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 26 + i * 26, y - 25, 8, 0, 7); ctx.fill(); });
  rr(ctx, x + 110, y - 38, w - 220, 26, 13); ctx.fillStyle = '#F0F3F7'; ctx.fill();
  return { x, y, w, h };
}
const SCENES = {
  intro() {},  // the full-screen head is the scene
  colossyan(ctx) {
    const a = S('colossyan'), k = ease.out(since(a + 0.2, 0.4));
    if (k > 0) { const r = browser(ctx, 780, 450, 1080, 608, k);
      ctx.save(); rr(ctx, r.x, r.y, r.w, r.h, [0, 0, 16, 16]); ctx.clip();
      const img = COLV && COLV.at(NOW - a - 0.2);
      if (ready(img)) cover(ctx, img, r.x, r.y, r.w, r.h); else placeholder(ctx, r.x, r.y, r.w, r.h, 'COLOSSYAN EXAMPLE CLIP', 'placeholder · Tony adds it from YouTube');
      ctx.restore(); ctx.restore(); label(ctx, 'Clip: Colossyan product demo (YouTube)', 780, 790); }
    [['🧑‍💼  A presenter', at('presenter', 'colossyan', a + 3.2), 400], ['🖼️  A few slides', at('slides', 'colossyan', a + 4), 780], ['🔤  Text on screen', at('text', 'colossyan', a + 4.8), 1160]].forEach(([s, t0, x]) =>
      chip(ctx, s, x, 880, { scale: pop(t0), s: 30 }));
  },
  too(ctx) {
    const a = S('too'), too = at('too', 'too', a + 1.2), an = at('animation', 'too', a + 4);
    chip(ctx, '✓  We make these too', 780, 150, { scale: pop(too), s: 36, bg: GREEN2, edge: GREEN, c: '#24613A' });
    // static slide
    if (card(ctx, 440, 520, 520, 330, { scale: pop(a + 0.2) })) {
      rr(ctx, -260, -165, 520, 64, [24, 24, 0, 0]); ctx.fillStyle = '#EEF2F7'; ctx.fill(); txt(ctx, 'Slide', -220, -133, { w: 700, s: 28, c: SUB, align: 'left' });
      for (let i = 0; i < 4; i++) { ctx.fillStyle = '#C9D3DF'; ctx.beginPath(); ctx.arc(-200, -50 + i * 56, 7, 0, 7); ctx.fill(); rr(ctx, -180, -60 + i * 56, 300 - i * 40, 18, 9); ctx.fillStyle = '#DCE3EC'; ctx.fill(); }
      ctx.restore(); }
    // arrow
    const ak = since(an - 0.6, 0.5); if (ak > 0) { ctx.save(); ctx.strokeStyle = CORAL; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(740, 520); ctx.lineTo(740 + 80 * ak, 520); ctx.stroke();
      if (ak >= 1) { ctx.beginPath(); ctx.moveTo(800, 496); ctx.lineTo(826, 520); ctx.lineTo(800, 544); ctx.stroke(); } ctx.restore(); }
    // the same lesson, animated: a tiny living landscape
    if (card(ctx, 1150, 520, 560, 360, { scale: pop(an - 0.3), edge: TEAL, lw: 3 })) {
      ctx.save(); rr(ctx, -280, -180, 560, 360, 24); ctx.clip();
      const g = ctx.createLinearGradient(0, -180, 0, 180); g.addColorStop(0, '#BFE2F5'); g.addColorStop(1, '#F2F9FC'); ctx.fillStyle = g; ctx.fillRect(-280, -180, 560, 360);
      const su = ease.out(since(an, 1.2)); ctx.fillStyle = '#FFD27A'; ctx.beginPath(); ctx.arc(150, lerp(60, -80, su), 46, 0, 7); ctx.fill();
      cloud(ctx, -220 + ((NOW - an) * 30) % 300, -110, 0.6);
      ctx.fillStyle = '#9FD3B5'; ctx.beginPath(); ctx.moveTo(-280, 180); ctx.lineTo(-280, 40); ctx.quadraticCurveTo(-60, -40, 120, 50); ctx.quadraticCurveTo(220, 0, 280, 30); ctx.lineTo(280, 180); ctx.fill();
      ctx.fillStyle = '#74BF8F'; ctx.beginPath(); ctx.moveTo(-280, 180); ctx.lineTo(-280, 110); ctx.quadraticCurveTo(0, 60, 280, 120); ctx.lineTo(280, 180); ctx.fill();
      const wk = ((NOW - an) * 0.25) % 1; emoji(ctx, '🚶', lerp(-200, 220, wk), 100 - Math.abs(Math.sin(NOW * 8)) * 6, 48);
      ctx.restore(); ctx.restore(); }
    chip(ctx, '+ Animation', 1150, 760, { scale: pop(an), s: 36, bg: CORAL2, edge: CORAL, c: '#9A3E1C', rot: -3 });
  },
  process(ctx) {
    const a = S('process');
    const steps = [['📝', 'Your script', at('script', 'process', a + 0.9)], ['🎙️', 'Voiceover', at('voiceover', 'process', a + 2.4)],
      ['🎬', 'Storyboard', at('storyboard', 'process', a + 3.6)], ['✨', 'Animation', at('animate', 'process', a + 5)]];
    const X = [230, 590, 950, 1310], Y = 330;
    steps.forEach(([e, s, t0], i) => {
      if (i > 0) { const f = since(t0 - 0.35, 0.35); if (f > 0) { ctx.save(); ctx.strokeStyle = TEAL; ctx.lineWidth = 5; ctx.setLineDash([12, 10]); ctx.lineDashOffset = -NOW * 40;
        ctx.beginPath(); ctx.moveTo(X[i - 1] + 140, Y); ctx.lineTo(lerp(X[i - 1] + 140, X[i] - 140, f), Y); ctx.stroke(); ctx.restore(); } }
      if (card(ctx, X[i], Y, 280, 200, { scale: pop(t0), edge: i === 3 ? TEAL : EDGE, lw: i === 3 ? 3 : 2 })) {
        txt(ctx, `${i + 1}`, -110, -70, { w: 800, s: 24, c: '#A7B3C2' }); emoji(ctx, e, 0, -22, 64); txt(ctx, s, 0, 58, { w: 700, s: 32 }); ctx.restore(); }
    });
    // timed to the exact word: a waveform with word ticks and a playhead
    const ex = at('exact', 'process', a + 6.3), wk = pop(ex - 0.1);
    if (card(ctx, 770, 620, 1180, 150, { scale: wk })) {
      for (let i = 0; i < 110; i++) { const h = 10 + Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.23)) * 70; ctx.fillStyle = '#CFE3E1'; rr(ctx, -540 + i * 9.8, -h / 2 - 10, 5, h, 3); ctx.fill(); }
      const ph = clamp01((NOW - ex) / 3); const px = lerp(-540, 540, ph);
      ['pack', 'water', 'map', 'layer'].forEach((w, i) => { const x = -420 + i * 280, on = px > x;
        rr(ctx, x - 60, 32, 120, 36, 18); ctx.fillStyle = on ? TEAL : '#EEF2F7'; ctx.fill(); txt(ctx, w, x, 51, { w: 700, s: 20, c: on ? '#fff' : SUB }); });
      ctx.fillStyle = CORAL; ctx.fillRect(px - 2, -62, 4, 100); ctx.restore(); }
    // review gates
    const rv = at('review', 'process', a + 8), dr = at('draft', 'process', a + 9.2);
    chip(ctx, '👀  You review', X[2], 470, { scale: pop(rv), s: 26, bg: GOLD2, edge: GOLD, c: '#7A5510' });
    chip(ctx, '👀  You review', X[3], 470, { scale: pop(dr), s: 26, bg: GOLD2, edge: GOLD, c: '#7A5510' });
    chip(ctx, 'Nothing is final until you approve it', 770, 120, { scale: pop(at('final', 'process', a + 10)), s: 30, bg: GREEN2, edge: GREEN, c: '#24613A' });
  },
  title(ctx) {
    const a = S('title');
    if (card(ctx, 960, 470, 820, 360, { scale: pop(a + 0.15), edge: TEAL, lw: 3 })) {
      chip(ctx, 'SAMPLE', 0, -120, { s: 26, bg: TEAL, edge: TEAL, c: '#fff' });
      txt(ctx, '10-second sample', 0, -10, { w: 800, s: 72 }); txt(ctx, 'for a tourism audience', 0, 70, { w: 500, s: 36, c: SUB });
      ctx.restore(); }
    // a 10-second ring counting down the moment before it starts
    const k = since(a + 0.6, 2.2); ctx.save(); ctx.strokeStyle = TEAL; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(960, 790, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke(); ctx.restore(); emoji(ctx, '⏱️', 960, 790, 36);
  },
  sample(ctx) { sampleDraw(ctx); label(ctx, 'SAMPLE · illustrated lesson', 1740, 1056); },
  avatar(ctx) {
    const a = S('avatar'), len = S('avatar') - S('sample');
    // the sample keeps playing underneath
    const save = NOW; NOW = S('sample') + 1.6 + ((save - a) % (len - 1.6)); REPLAY = true; sampleDraw(ctx); REPLAY = false; NOW = save;
    ctx.fillStyle = 'rgba(246,248,251,0.25)'; ctx.fillRect(0, 0, 1920, 1080);
    // a presenter from the Colossyan library, on top of the animation
    const t0 = at('presenter', 'avatar', a + 1.4) - 0.1, k = ease.out(since(t0, 0.5));
    if (k > 0) { const w = 800, h = 450, x = 1440 - w / 2 + (1 - k) * 900, y = 430 - h / 2;
      ctx.save(); shadow(ctx, 0.25, 50, 16); rr(ctx, x, y, w, h, 28); ctx.fillStyle = '#fff'; ctx.fill(); noShadow(ctx); rr(ctx, x, y, w, h, 28); ctx.clip();
      const img = PRESV && PRESV.at(Math.max(0, NOW - t0)); if (ready(img)) cover(ctx, img, x, y, w, h, 0.5); else placeholder(ctx, x, y, w, h, 'COLOSSYAN PRESENTER', 'placeholder · library clip', true);
      ctx.restore(); ctx.save(); ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; rr(ctx, x, y, w, h, 28); ctx.stroke(); ctx.restore();
      chip(ctx, '🧑‍💼  From the Colossyan library', x + w / 2, y + h + 40, { scale: pop(at('library', 'avatar', a + 3)), s: 26, bg: CARD, edge: TEAL });
      label(ctx, 'Clip: Colossyan product demo (YouTube)', x + w / 2, y + h + 100); }
  },
  close(ctx) {
    const a = S('close'), sc = at('script', 'close', a + 6), fv = at('hop', 'close', a + 4.5), qs = at('questions', 'close', a + 3);
    txt(ctx, 'Tony Callender', 860, 400, { w: 800, s: 72, align: 'left', c: TEXT });
    txt(ctx, 'Educational animated videos', 860, 470, { w: 500, s: 36, c: SUB, align: 'left' });
    ['📝 Script', '🎙️ Voice', '🎬 Storyboard', '✨ Animation'].forEach((s, i) => chip(ctx, s, 950 + i * 215, 560, { scale: pop(a + 0.5 + i * 0.12), s: 24 }));
    chip(ctx, '❓  A couple of questions', 1000, 680, { scale: pop(qs), s: 30, bg: GOLD2, edge: GOLD, c: '#7A5510', rot: 1 });
    chip(ctx, '📩  Send me your script', 1440, 680, { scale: pop(sc), s: 30, bg: TEAL, edge: TEAL, c: '#fff' });
    chip(ctx, "📞  Let's hop on a call", 1160, 790, { scale: pop(fv), s: 30, bg: CORAL2, edge: CORAL, c: '#9A3E1C', rot: -2 });
  },
};

// ── captions: dark text on a white pill (light over video in the intro) ─────
let CHUNKS = null;
function captions(ctx, t) {
  if (!CHUNKS) { CHUNKS = []; let cur = [];
    P.words.forEach((w, i) => { cur.push(w); const n = P.words[i + 1];
      if (!n || cur.length >= 5 || /[.,!?;:"]$/.test(w.text) || n.start - w.end > 0.3) { CHUNKS.push(cur); cur = []; } }); }
  const i = CHUNKS.findIndex((c, k) => t >= c[0].start && t < (CHUNKS[k + 1] ? CHUNKS[k + 1][0].start : c[c.length - 1].end + 0.5));
  if (i < 0) return;
  const s = CHUNKS[i].map((w) => w.text).join(' ').replace(/[,;:]$/, '');
  const bubble = t >= S('colossyan') && t < S('title') + 0.6, cx = bubble ? 800 : 960;
  ctx.font = FONT(700, 40); const W = ctx.measureText(s).width;
  ctx.save(); shadow(ctx, 0.15, 20, 6); rr(ctx, cx - W / 2 - 28, CAP_Y - 34, W + 56, 68, 34); ctx.fillStyle = 'rgba(255,255,255,0.94)'; ctx.fill(); noShadow(ctx);
  txt(ctx, s, cx, CAP_Y + 1, { w: 700, s: 40, c: TEXT }); ctx.restore();
}

// ── the frame ───────────────────────────────────────────────────────────────
const ORDER = Object.keys(SCENES);
Eduba.frame({ overlay: true, step: 30, draw(g, t) {
  NOW = t; const ctx = g.photo.ctx;
  ctx.fillStyle = BG; ctx.fillRect(0, 0, 1920, 1080);
  ctx.fillStyle = DOT; for (let y = 22; y < 1080; y += 44) for (let x = 22; x < 1920; x += 44) ctx.fillRect(x, y, 3, 3);
  let id = ORDER[0]; for (const k of ORDER) if (t >= S(k)) id = k;
  const k = id === ORDER[0] ? 1 : ease.out(clamp01((t - S(id)) / 0.28));
  ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 24); SCENES[id](ctx, t); ctx.restore();
  talkingHead(ctx, t);
  captions(ctx, t);
} });
