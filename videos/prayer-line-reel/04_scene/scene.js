// scene.js: prayer-line-reel (LinkedIn #16), same dark kit as ai-filters-reel. From Tony's own Charles-thread replies. No cartoon head.
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
const CAP_Y = 1480, END_T = 43.2;

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
function person(ctx, x, y, r, col = '#3a3d4a') { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y - r * 0.35, r * 0.42, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y + r * 0.55, r * 0.7, r * 0.45, 0, Math.PI, 2 * Math.PI); ctx.fill(); }
function pastor(ctx, x, y, k = 1, name = 'Pastor') { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = '#2a2c35'; ctx.beginPath(); ctx.arc(0, 0, 70, 0, 7); ctx.fill(); ctx.strokeStyle = GOLD; ctx.lineWidth = 5; ctx.stroke(); person(ctx, 0, 0, 74, GOLD);
  txt(ctx, name, 0, 110, { w: 700, s: 32 }); ctx.restore(); }
function envelope(ctx, x, y, s = 1, col = PAPERW) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(ctx, -60, -40, 120, 80, 10); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = '#c9c9c4'; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-58, -36); ctx.lineTo(0, 8); ctx.lineTo(58, -36); ctx.strokeStyle = '#b0b0aa'; ctx.stroke();
  emoji(ctx, '🙏', 0, 18, 28); ctx.restore(); }
function cloud(ctx, x, y, k = 1, s = 'Outside AI') { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = '#1e2030'; ctx.strokeStyle = '#3d4157'; ctx.lineWidth = 4; ctx.beginPath();
  ctx.arc(-50, 10, 50, Math.PI * 0.5, Math.PI * 1.5); ctx.arc(0, -30, 60, Math.PI, 0); ctx.arc(55, 10, 50, Math.PI * 1.5, Math.PI * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  txt(ctx, s, 0, 18, { w: 700, s: 28, c: SUB }); ctx.restore(); }
function shield(ctx, x, y, k = 1) { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.shadowColor = GREEN; ctx.shadowBlur = 30; ctx.beginPath(); ctx.moveTo(0, -80); ctx.lineTo(66, -54); ctx.lineTo(60, 20); ctx.quadraticCurveTo(40, 70, 0, 90); ctx.quadraticCurveTo(-40, 70, -60, 20); ctx.lineTo(-66, -54); ctx.closePath();
  ctx.fillStyle = '#11261a'; ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = GREEN; ctx.lineWidth = 5; ctx.stroke(); emoji(ctx, '🔒', 0, 4, 54); ctx.restore(); }
function line(ctx, x1, y1, x2, y2, p = 1, col = '#4a4e5a', dash = null) { if (p <= 0) return; ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round'; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(lerp(x1, x2, p), lerp(y1, y2, p)); ctx.stroke(); ctx.restore(); }
function strike(ctx, x, y, w, t0) { if (P.t < t0) return; line(ctx, x - w / 2, y, x + w / 2, y, since(t0, 0.3), RED); }
function bubble(ctx, s, x, y, w, k = 1, o = {}) { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  const L = wrap(ctx, s, w - 60, 600, o.s || 34), h = L.length * ((o.s || 34) + 12) + 44;
  rr(ctx, -w / 2, -h / 2, w, h, 26); ctx.fillStyle = o.fill || '#3b6ff5'; ctx.fill();
  L.forEach((l, i) => txt(ctx, l, -w / 2 + 30, -h / 2 + 22 + (o.s || 34) / 2 + 6 + i * ((o.s || 34) + 12), { w: 600, s: o.s || 34, c: o.c || '#fff', align: 'left' })); ctx.restore(); }

const SCENES = {
  q(ctx) {
    ['Should AI', 'handle prayer', 'requests?'].forEach((l, i) => txt(ctx, l, 540, 660 + i * 100, { w: 800, s: 88, c: i === 1 ? LAV : TEXT }));
    emoji(ctx, '🙏', 540, 470, 110);
  },
  depends(ctx) {
    const a = S('depends'), h = at('handle.', 'depends', a + 1.3);
    chip(ctx, '"handle"', 540, 440, { scale: pop(a + 0.1), s: 54, bg: '#221a3d', edge: LAV, c: '#e6dcff' });
    const k = since(h, 0.4);
    if (k > 0) { line(ctx, 540, 490, 300, 640, k); line(ctx, 540, 490, 780, 640, k);
      if (card(ctx, 300, 760, 420, 200, { scale: pop(h + 0.2) })) { emoji(ctx, '🙏', 0, -40, 60); txt(ctx, 'Pray for them', 0, 45, { w: 700, s: 34 }); ctx.restore(); }
      if (card(ctx, 780, 760, 420, 200, { scale: pop(h + 0.4) })) { emoji(ctx, '✉️', 0, -40, 60); txt(ctx, 'Get it to someone', 0, 45, { w: 700, s: 34 }); ctx.restore(); } }
  },
  pray(ctx) {
    const a = S('pray'), pe = at('person.', 'pray', a + 2), ne = at('Never', 'pray', a + 2.7);
    txt(ctx, 'Praying for someone', 540, 420, { w: 800, s: 60 });
    if (card(ctx, 540, 700, 760, 260, { scale: pop(pe - 0.3), edge: GREEN, glow: 'rgba(34,197,94,0.3)' })) {
      person(ctx, -250, 0, 110, '#5b7d68'); txt(ctx, 'Always a person', -150, 0, { w: 800, s: 50, align: 'left' }); ctx.restore(); }
    if (P.t > ne) { orb(ctx, 540, 1020, 64, { scale: pop(ne) }); cross(ctx, 600, 970, 30, pop(ne + 0.3)); txt(ctx, 'Never a machine', 540, 1130, { w: 700, s: 38, c: '#ffb4b4' }); }
  },
  route(ctx) {
    const a = S('route'), rp = at('person?', 'route', a + 1.3), ma = at('machine', 'route', a + 2.4);
    txt(ctx, 'Getting the request there', 540, 420, { w: 800, s: 54 });
    if (card(ctx, 220, 760, 220, 220, { scale: pop(a + 0.2) })) { person(ctx, 0, -10, 90); txt(ctx, 'Visitor', 0, 80, { w: 700, s: 28, c: SUB }); ctx.restore(); }
    pastor(ctx, 860, 740, pop(rp));
    line(ctx, 340, 760, 740, 760, since(a + 0.6, 0.6), '#3a3d4a', [10, 14]);
    if (P.t > ma) { orb(ctx, 540, 640, 46, { scale: pop(ma) }); chip(ctx, 'AI can help', 540, 1000, { scale: pop(ma + 0.2), s: 36, bg: '#221a3d', edge: LAV, c: '#e6dcff' }); }
    const p = clamp01((P.t - (a + 0.8)) / 2.4); if (p > 0) envelope(ctx, lerp(340, 760, ease.inOut(p)), 760 - Math.sin(p * Math.PI) * 60, 0.9);
  },
  line(ctx) {
    const a = S('line');
    ['Where I draw', 'the line'].forEach((l, i) => txt(ctx, l, 540, 700 + i * 100, { w: 800, s: 86, c: i ? LAV : TEXT }));
    line(ctx, 200, 880, 880, 880, since(a + 0.5, 0.6), LAV);
  },
  hard(ctx) {
    const a = S('hard'), pr = at('prayer,', 'hard', a + 1), hp = at('hard', 'hard', a + 2.4);
    const W = [['🩺  A diagnosis', 'diagnosis.', a + 4], ['💍  A marriage', 'marriage.', a + 5.2], ['📵  A son who stopped calling', 'son', a + 6.3]];
    if (card(ctx, 540, 640, 860, 420, { scale: pop(a + 0.1) })) {
      txt(ctx, 'Church website · chat', -400, -170, { w: 600, s: 26, c: SUB, align: 'left' }); ctx.restore(); }
    bubble(ctx, 'Can you pray for my family? …', 610, 600, 600, pop(pr - 0.2));
    if (P.t > hp) txt(ctx, 'The hard part comes with it', 540, 960, { w: 700, s: 40, c: GOLD });
    W.forEach(([s, w, fb], i) => chip(ctx, s, 540, 1080 + i * 110, { scale: pop(at(w, 'hard', fb)), s: 38, bg: '#2a2410', edge: GOLD, c: '#ffe9a8', rot: [-2, 2, -1][i] }));
  },
  nothere(ctx) {
    const a = S('nothere'), hi = at('history,', 'nothere', a + 1.4), ou = at('outside', 'nothere', a + 3.1);
    txt(ctx, 'It shouldn\'t…', 540, 400, { w: 800, s: 60 });
    if (card(ctx, 540, 620, 760, 200, { scale: pop(a + 0.3) })) { emoji(ctx, '🗂️', -290, 0, 64); txt(ctx, 'Sit in chat history', -220, 0, { w: 700, s: 42, align: 'left' }); ctx.restore(); }
    strike(ctx, 540, 620, 640, hi + 0.2);
    cloud(ctx, 540, 920, pop(ou - 0.3));
    if (P.t > ou + 0.3) { line(ctx, 400, 860, 680, 980, since(ou + 0.3, 0.3), RED); line(ctx, 680, 860, 400, 980, since(ou + 0.45, 0.3), RED); txt(ctx, 'Go to an outside AI', 540, 1070, { w: 700, s: 40, c: '#ffb4b4' }); }
  },
  form(ctx) {
    const a = S('form'), fo = at('form,', 'form', a + 1.7), pa = at('pastor.', 'form', a + 3.3);
    if (card(ctx, 330, 720, 480, 520, { scale: pop(a + 0.2), fill: PAPERW, edge: '#d9d9d6' })) {
      txt(ctx, '🙏 Prayer request', -200, -200, { w: 800, s: 36, c: '#111', align: 'left' });
      ['Name', 'How can we pray?'].forEach((f, i) => { txt(ctx, f, -200, -120 + i * 120, { w: 600, s: 24, c: '#555', align: 'left' });
        rr(ctx, -200, -100 + i * 120, 400, i ? 110 : 56, 10); ctx.strokeStyle = '#c9c9c4'; ctx.lineWidth = 3; ctx.stroke(); });
      rr(ctx, -200, 170, 400, 64, 32); ctx.fillStyle = '#2e7d4f'; ctx.fill(); txt(ctx, 'Send to the pastor', 0, 203, { w: 700, s: 28, c: '#fff' }); ctx.restore(); }
    chip(ctx, 'Its own form', 330, 1060, { scale: pop(fo), s: 36, bg: '#221a3d', edge: LAV, c: '#e6dcff' });
    line(ctx, 590, 720, 760, 720, since(pa - 0.6, 0.4));
    const p = clamp01((P.t - (pa - 0.6)) / 0.8); if (p > 0 && p < 1) envelope(ctx, lerp(560, 800, p), 720, 0.7);
    pastor(ctx, 880, 720, pop(pa));
    if (P.t > pa + 0.4) chip(ctx, 'Straight to a person', 880, 920, { scale: pop(pa + 0.4), s: 30, bg: '#11261a', edge: GREEN, c: '#bff5d2' });
  },
  filter(ctx) {
    const a = S('filter'), lo = at('local', 'filter', a + 2.7), be = at('before', 'filter', a + 4.1), ro = at('routes', 'filter', a + 5.6);
    txt(ctx, 'Typed into the chat anyway?', 540, 380, { w: 800, s: 50 });
    bubble(ctx, 'Please pray for my mom, the scan…', 540, 540, 640, pop(a + 0.4), { s: 32 });
    line(ctx, 540, 610, 540, 700, since(lo - 0.4, 0.3));
    shield(ctx, 540, 790, pop(lo - 0.2));
    if (P.t > lo) { txt(ctx, 'Small local filter', 630, 770, { w: 700, s: 36, c: '#bff5d2', align: 'left' }); txt(ctx, 'on our side', 630, 815, { w: 600, s: 28, c: SUB, align: 'left' }); }
    // blocked route to the outside AI (left), private route to the pastor (right)
    cloud(ctx, 240, 1150, pop(be)); if (P.t > be + 0.3) { line(ctx, 470, 860, 300, 1080, since(be + 0.2, 0.3), '#5a2a2a', [10, 12]); cross(ctx, 385, 970, 30, pop(be + 0.5)); txt(ctx, 'Nothing sent out', 240, 1270, { w: 700, s: 30, c: '#ffb4b4' }); }
    if (P.t > ro) { line(ctx, 610, 860, 790, 1060, since(ro, 0.3), GREEN); pastor(ctx, 840, 1150, pop(ro + 0.2)); txt(ctx, 'Routed privately', 840, 1310, { w: 700, s: 30, c: '#bff5d2' }); }
  },
  never(ctx, t) {
    if (t >= END_T) return endCard(ctx, t);
    const a = S('never'), ju = at('just', 'never', a + 1.8), wi = at('will.', 'never', a + 3.4);
    orb(ctx, 540, 540, 80, { scale: pop(a + 0.1) });
    if (P.t > a + 0.5) txt(ctx, 'The AI never prays', 540, 690, { w: 800, s: 60 });
    if (P.t > ju) { const p = clamp01((P.t - ju) / 1.2); line(ctx, 540, 760, 540, 960, p); if (p > 0 && p < 1) envelope(ctx, 540, lerp(780, 950, p), 0.7); }
    if (card(ctx, 540, 1080, 820, 200, { scale: pop(wi - 0.4), edge: GREEN, glow: 'rgba(34,197,94,0.3)' })) {
      person(ctx, -300, 0, 90, '#5b7d68'); txt(ctx, 'Someone who will', -220, 0, { w: 800, s: 50, align: 'left' }); ctx.restore(); }
  },
};
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
  if (t >= S('depends') && t < END_T) captions(ctx, t);  // the opening question is on screen as text already
} });
