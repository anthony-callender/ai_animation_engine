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

// ── Tony's talking head: full screen for the opening only, then the end card ──
// head clip = opening (0..A_END) + close (from T_C). Both numbers come from 01_voice/source/build_v3.py.
const HEADV = clipOf('head');
const A_END = 8.45;  // Tony is on screen for the opening only
function headBox(t) {
  if (t < A_END) return { x: 960, y: 540, w: 1920, h: 1080, r: 0, ring: false, alpha: 1 - clamp01((t - (A_END - 0.25)) / 0.25) };
  return null;
}
function talkingHead(ctx, t) {
  const b = headBox(t); if (!b || b.alpha <= 0) return;
  const x = b.x - b.w / 2, y = b.y - b.h / 2;
  ctx.save(); ctx.globalAlpha = b.alpha;
  if (b.ring) { shadow(ctx, 0.25, 40, 12); rr(ctx, x, y, b.w, b.h, b.r); ctx.fillStyle = '#fff'; ctx.fill(); noShadow(ctx); }
  rr(ctx, x, y, b.w, b.h, b.r); ctx.clip();
  const img = HEADV && HEADV.at(t);
  if (ready(img)) {  // zoom toward the face in the small circle
    const z = lerp(1.55, 1, clamp01((b.w - 320) / 1600)), sc = Math.max(b.w / img.naturalWidth, b.h / img.naturalHeight) * z;
    const iw = img.naturalWidth * sc, ih = img.naturalHeight * sc;
    let dx = b.x - 0.5 * iw, dy = b.y - 0.58 * ih; dx = Math.min(x, Math.max(x + b.w - iw, dx)); dy = Math.min(y, Math.max(y + b.h - ih, dy));
    ctx.drawImage(img, dx, dy, iw, ih);
  } else placeholder(ctx, x, y, b.w, b.h, 'TALKING HEAD', 'placeholder', true);
  ctx.restore();
  if (b.ring) { ctx.save(); ctx.lineWidth = 7; ctx.strokeStyle = '#fff'; rr(ctx, x, y, b.w, b.h, b.r); ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = TEAL; rr(ctx, x - 5, y - 5, b.w + 10, b.h + 10, b.r + 5); ctx.stroke(); ctx.restore(); }
  if (t < A_END) {  // name lower third + a "made for ITS Malta" chip
    const k = since(0.4, 0.4) * (1 - since(A_END - 0.5, 0.3));
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; ctx.translate((1 - k) * -40, 0);
      shadow(ctx, 0.18, 30, 8); rr(ctx, 80, 760, 640, 140, 20); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill(); noShadow(ctx);
      ctx.fillStyle = TEAL; rr(ctx, 80, 760, 12, 140, [20, 0, 0, 20]); ctx.fill();
      txt(ctx, 'Tony Callender', 124, 806, { w: 800, s: 46, align: 'left' }); txt(ctx, 'Educational animated videos', 124, 858, { w: 500, s: 28, c: SUB, align: 'left' });
      ctx.restore(); }
    chip(ctx, '🎬  Made for ITS Malta', 1600, 110, { scale: pop(at('you', 'intro', 4.6)) * (1 - since(A_END - 0.4, 0.3)), s: 32, bg: CARD, edge: TEAL });
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

// Malta in ten seconds: three main islands, Valletta (UNESCO World Heritage city), English and Maltese official.
function island(ctx, pts, k, sand = '#F1DDB3', land = '#8CC79A') {
  if (k <= 0) return;
  const cx = pts.reduce((q, p) => q + p[0], 0) / pts.length, cy = pts.reduce((q, p) => q + p[1], 0) / pts.length;
  const path = (g) => { const P2 = pts.map(([x, y]) => [cx + (x - cx) * g, cy + (y - cy) * g]); const n = P2.length;
    ctx.beginPath(); const m0 = [(P2[n - 1][0] + P2[0][0]) / 2, (P2[n - 1][1] + P2[0][1]) / 2]; ctx.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) { const [x, y] = P2[i], [nx, ny] = P2[(i + 1) % n]; ctx.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2); }
    ctx.closePath(); };
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-cx, -cy);
  shadow(ctx, 0.18, 24, 8); path(1.0); ctx.fillStyle = sand; ctx.fill(); noShadow(ctx);
  path(0.84); ctx.fillStyle = land; ctx.fill(); ctx.restore();
}
const GOZO = [[470, 470], [560, 430], [690, 440], [760, 490], [720, 560], [600, 580], [500, 550]];
const COMINO = [[835, 585], [880, 575], [905, 600], [870, 625], [835, 615]];
const MALTA = [[960, 610], [1080, 560], [1260, 560], [1420, 620], [1500, 720], [1440, 830], [1260, 860], [1100, 800], [990, 720]];
function sampleDraw(ctx) {
  const a = S('sample');
  const th = at('three', 'sample', a + 0.6), isl = at('islands', 'sample', a + 1.2);
  const ma = at('Malta', isl, a + 1.8), go = at('Gozo', 'sample', a + 2.4), co = at('Comino', 'sample', a + 3.0);
  const va = at('Valletta', 'sample', a + 4.6), un = at('UNESCO', 'sample', a + 5.4), en = at('English', 'sample', a + 7.2), mt = at('Maltese', 'sample', a + 7.8), of = at('official', 'sample', a + 8.4);
  const g = ctx.createLinearGradient(0, 0, 0, 1080); g.addColorStop(0, '#CFEAF7'); g.addColorStop(0.32, '#EAF6FB'); g.addColorStop(0.34, '#7CC3DD'); g.addColorStop(1, '#3E97BF');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
  ctx.save(); ctx.shadowColor = 'rgba(242,181,68,0.6)'; ctx.shadowBlur = 60; ctx.fillStyle = '#FFD27A'; ctx.beginPath(); ctx.arc(1640, lerp(330, 190, ease.out(since(a, 1.4))), 80, 0, 7); ctx.fill(); ctx.restore();
  cloud(ctx, 200 + (NOW * 12) % 300, 120, 1.0); cloud(ctx, 1000 + (NOW * 8) % 200, 90, 0.8);
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3;
  for (let r = 0; r < 7; r++) { const y = 420 + r * 95, o = (NOW * 30 + r * 70) % 160; ctx.beginPath();
    for (let x = -160 + o; x < 1920; x += 160) { ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 20, y - 10, x + 40, y); } ctx.stroke(); }
  ctx.restore();
  island(ctx, GOZO, pop(go - 0.05, 0.45)); island(ctx, COMINO, pop(co - 0.05, 0.45)); island(ctx, MALTA, pop(ma - 0.05, 0.45));
  [['Gozo', 615, 395, go], ['Comino', 870, 670, co], ['Malta', 1230, 710, ma]].forEach(([n, x, y, t0]) => chip(ctx, n, x, y, { scale: pop(t0 + 0.1), s: 30, bg: CARD, edge: TEAL }));
  const vk = pop(va, 0.4);
  if (vk > 0) { ctx.save(); ctx.translate(1400, 640); ctx.scale(vk, vk); shadow(ctx, 0.25, 12, 4);
    ctx.fillStyle = CORAL; ctx.beginPath(); ctx.arc(0, -46, 24, Math.PI, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); noShadow(ctx);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -46, 9, 0, 7); ctx.fill(); ctx.restore(); }
  if (card(ctx, 1560, 470, 420, 170, { scale: pop(va + 0.15) })) {
    ctx.fillStyle = '#E2C995'; ctx.fillRect(-180, 20, 150, 50); ctx.fillStyle = '#D4B57A'; for (let i = 0; i < 5; i++) ctx.fillRect(-180 + i * 32, 10, 18, 12);
    ctx.fillStyle = '#C9A866'; ctx.beginPath(); ctx.arc(-105, 20, 34, Math.PI, 0); ctx.fill(); ctx.fillRect(-110, -26, 10, 14); ctx.fillRect(-60, -30, 12, 50);
    txt(ctx, 'Valletta', 10, -28, { w: 800, s: 38, align: 'left' }); txt(ctx, 'the capital', 10, 18, { w: 500, s: 26, c: SUB, align: 'left' });
    ctx.restore(); }
  if (!REPLAY) {
    chip(ctx, 'Malta in 10 seconds', 300, 110, { scale: pop(a + 0.2), s: 32, bg: CARD, edge: TEAL });
    chip(ctx, '3 main islands', 960, 300, { scale: pop(th) * (1 - since(va, 0.3)), s: 40, bg: TEAL2, edge: TEAL, c: '#0A5F5B' });
    chip(ctx, '🏛️  UNESCO World Heritage city', 1560, 345, { scale: pop(un), s: 28, bg: GOLD2, edge: GOLD, c: '#7A5510' });
    chip(ctx, 'Official languages', 420, 800, { scale: pop(of - 0.4), s: 30, bg: CARD, edge: EDGE, c: SUB });
    chip(ctx, '🗣️  English', 300, 890, { scale: pop(en), s: 36, bg: CARD, edge: CORAL });
    chip(ctx, '🗣️  Maltese', 560, 890, { scale: pop(mt), s: 36, bg: CARD, edge: CORAL });
  }
}

// ── scenes ──────────────────────────────────────────────────────────────────
const COLV = clipOf('colossyan'), PRESV = clipOf('presenter'), BRIEF = Eduba.image('assets/brief.png');
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
    if (k > 0) { const r = browser(ctx, 960, 450, 1080, 608, k);
      ctx.save(); rr(ctx, r.x, r.y, r.w, r.h, [0, 0, 16, 16]); ctx.clip();
      const img = COLV && COLV.at(NOW - a - 0.2);
      if (ready(img)) cover(ctx, img, r.x, r.y, r.w, r.h); else placeholder(ctx, r.x, r.y, r.w, r.h, 'COLOSSYAN EXAMPLE CLIP', 'placeholder · Tony adds it from YouTube');
      ctx.restore(); ctx.restore(); label(ctx, 'Clip: Colossyan product demo (YouTube)', 960, 790); }
    [['🧑‍💼  A presenter', at('presenter', 'colossyan', a + 0.3), 580], ['🖼️  A few slides', at('slides', 'colossyan', a + 1.2), 960], ['🔤  Text on screen', at('text', 'colossyan', a + 2), 1340]].forEach(([s, t0, x]) =>
      chip(ctx, s, x, 880, { scale: pop(t0), s: 30 }));
  },
  brief(ctx) {
    const a = S('brief'), k = ease.out(since(a + 0.1, 0.45)), SC = 1.6, X0 = 960 - 410 * SC, Y0 = 455 - 170 * SC;
    chip(ctx, '📄  Your job post', 960, 92, { scale: pop(a + 0.2), s: 30, bg: CARD, edge: TEAL });
    if (k > 0) { ctx.save(); ctx.globalAlpha *= k; const z = (1 + 0.03 * clamp01((NOW - a) / 14)) * (0.96 + 0.04 * k);
      ctx.translate(960, 455); ctx.scale(z, z); ctx.translate(-960, -455);
      shadow(ctx, 0.16, 50, 16); rr(ctx, X0 - 20, Y0 - 20, 820 * SC + 40, 340 * SC + 40, 22); ctx.fillStyle = '#fff'; ctx.fill(); noShadow(ctx); ctx.strokeStyle = EDGE; ctx.lineWidth = 2; ctx.stroke();
      if (ready(BRIEF)) ctx.drawImage(BRIEF, X0, Y0, 820 * SC, 340 * SC);
      [['institute', 95, 207, 236], ['colossyan', 626, 207, 66], ['three', 468, 228, 72], ['hundred', 672, 228, 146], ['batches', 30, 248, 214], ['short', 556, 269, 160], ['consistent', 30, 290, 106]].forEach(([w, x, y, wd]) => {
        const t0 = at(w, 'brief', 1e9), f = ease.out(since(t0, 0.35)); if (f <= 0) return;
        ctx.fillStyle = 'rgba(242,181,68,0.38)'; rr(ctx, X0 + (x - 3) * SC, Y0 + (y - 10) * SC, (wd + 6) * SC * f, 20 * SC, 4); ctx.fill(); });
      ctx.restore(); }
    [['🏫  ITS Malta', 'institute', 420], ['🎞️  ~120 videos', 'hundred', 760], ['⏱️  3–5 min each', 'three', 1100], ['⚡  Short-notice batches', 'short', 1480]].forEach(([s2, w, x]) =>
      chip(ctx, s2, x, 900, { scale: pop(at(w, 'brief', 1e9) + 0.2), s: 28, bg: CARD, edge: TEAL }));
  },
  too(ctx) {
    const a = S('too'), too = at('Colossyan', 'too', a + 1.2), an = at('animation', 'too', a + 4.5);
    ctx.translate(165, 0);
    chip(ctx, '✓  Built in Colossyan', 795, 150, { scale: pop(too), s: 36, bg: GREEN2, edge: GREEN, c: '#24613A' });
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
    const a = S('process'); ctx.translate(190, 0);
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
      ['Malta', 'Gozo', 'Comino', 'Valletta'].forEach((w, i) => { const x = -420 + i * 280, on = px > x;
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
      txt(ctx, '10-second sample', 0, -10, { w: 800, s: 72 }); txt(ctx, 'made for your students', 0, 70, { w: 500, s: 36, c: SUB });
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
    const mk = pop(a + 0.1, 0.45);  // monogram in place of the face
    if (mk > 0) { ctx.save(); ctx.translate(560, 520); ctx.scale(mk, mk); shadow(ctx, 0.2, 40, 12);
      const g = ctx.createLinearGradient(-200, -200, 200, 200); g.addColorStop(0, TEAL); g.addColorStop(1, '#0A5F5B');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 200, 0, 7); ctx.fill(); noShadow(ctx);
      ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.stroke(); txt(ctx, 'TC', 0, 6, { w: 800, s: 140, c: '#fff' }); ctx.restore(); }
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
  const cx = 960;
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
