// scene.js: talking-head-intro. Dark UI kit (from ai-analyst-reel) + Tony's real talking head (full screen, then a corner bubble) + short real clips.
// Real clips: c1 sermon page (names hidden), c2 agent trace (client wording blurred), c3 status chart (values blurred). Publication gate: client permission.
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
const CAP_Y = 1420, END_T = 56.4;

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
function label(ctx, s) { txt(ctx, s, 540, 1230, { w: 500, s: 24, c: "#6b6f80" }); }

// ── Tony's talking head ─────────────────────────────────────────────────────
// Until Tony records, a placeholder. After: `python anim.py real talking-head-intro clip <his video> --as head --start 0 --end <len> --fps 30 --width 720`
// and the same video's audio becomes 01_voice/voice.mp3 (then transcribe + cues again).
const HEADV = (window.REAL && REAL.clips && REAL.clips.head) ? Desk.clip('head') : null;
const BUB = { x: 868, y: 1700, r: 165 };  // corner bubble (bottom right, under the captions)
function headFeed(ctx, x, y, w, h) {  // fills the box (cover), clipped by the caller
  const img = HEADV && HEADV.at(P.t);
  if (img && img.complete && img.naturalWidth) {
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight), iw = img.naturalWidth * s, ih = img.naturalHeight * s;
    ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) * 0.35, iw, ih); return;
  }
  const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, '#2b2540'); g.addColorStop(1, '#121019');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const cx = x + w / 2, u = Math.min(w, h * 0.62);  // silhouette
  ctx.fillStyle = '#463d63'; ctx.beginPath(); ctx.arc(cx, y + h * 0.42, u * 0.2, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, y + h * 0.42 + u * 0.62, u * 0.42, u * 0.36, 0, Math.PI, 0); ctx.fill();
  if (w > 500) { txt(ctx, 'TALKING HEAD', cx, y + h * 0.2, { w: 800, s: 54, c: '#8f86b8' }); txt(ctx, 'placeholder · Tony records this', cx, y + h * 0.2 + 64, { w: 500, s: 32, c: '#6f6890' }); }
}
function talkingHead(ctx, t) {
  // full screen until the first project, then it shrinks into the corner bubble; on the end card it sits centre
  const a = S('first'), m = ease.inOut(clamp01((t - a) / 0.6)), e = ease.inOut(clamp01((t - END_T) / 0.6));
  const full = { x: 540, y: 960, w: 1080, h: 1920, r: 0 }, bub = { x: BUB.x, y: BUB.y, w: BUB.r * 2, h: BUB.r * 2, r: BUB.r };
  const end = { x: 540, y: 600, w: 400, h: 400, r: 200 };
  const A = t < END_T ? full : bub, B = t < END_T ? bub : end, f = t < END_T ? m : e;
  const b = { x: lerp(A.x, B.x, f), y: lerp(A.y, B.y, f), w: lerp(A.w, B.w, f), h: lerp(A.h, B.h, f), r: lerp(A.r, B.r, f) };
  ctx.save();
  if (f > 0 || t >= END_T) { ctx.shadowColor = 'rgba(167,139,250,0.55)'; ctx.shadowBlur = 40; rr(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, b.r); ctx.fillStyle = '#000'; ctx.fill(); ctx.shadowBlur = 0; }
  rr(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, b.r); ctx.clip();
  headFeed(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
  ctx.restore();
  if (f > 0.02 || t >= END_T) { ctx.save(); ctx.lineWidth = 6; ctx.strokeStyle = LAV; rr(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, b.r); ctx.stroke(); ctx.restore(); }
  if (t < a + 0.3) {  // name lower third on the full-screen intro
    const k = since(0.4, 0.4) * (1 - since(a, 0.3)); if (k <= 0) return;
    ctx.save(); ctx.globalAlpha = k; ctx.translate((1 - k) * -40, 0);
    rr(ctx, 60, 1560, 640, 150, 22); ctx.fillStyle = 'rgba(11,11,14,0.82)'; ctx.fill(); ctx.fillStyle = LAV; ctx.fillRect(60, 1580, 8, 110);
    txt(ctx, 'Tony Callender', 100, 1610, { w: 800, s: 50, align: 'left' }); txt(ctx, 'AI systems for organizations', 100, 1666, { w: 500, s: 30, c: '#c9c3e6', align: 'left' }); ctx.restore();
  }
}

// ── real work: frame + "REAL WORK" chip; source rect so wide clips can be cropped ──
const C1 = Desk.clip('c1'), C2 = Desk.clip('c2'), C3 = Eduba.image('assets/c3-status-chart.png');
function realFrame(ctx, img, sx, sy, sw, sh, cy, tag, k) {
  if (k <= 0) return; const w = 1000, h = w * sh / sw, x = 540 - w / 2, y = cy - h / 2;
  ctx.save(); ctx.globalAlpha *= Math.min(1, k * 1.4); ctx.translate(540, cy); ctx.scale(0.92 + 0.08 * k, 0.92 + 0.08 * k); ctx.translate(-540, -cy);
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 50; rr(ctx, x - 6, y - 56, w + 12, h + 62, 22); ctx.fillStyle = '#1e1f26'; ctx.fill(); ctx.shadowBlur = 0;
  [RED, GOLD, GREEN].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 28 + i * 28, y - 28, 9, 0, 7); ctx.fill(); });
  ctx.save(); rr(ctx, x, y, w, h, [0, 0, 16, 16]); ctx.clip();
  if (img && img.complete && img.naturalWidth) ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h); ctx.restore();
  ctx.restore();
  chip(ctx, '● REAL WORK', 540, y - 130, { scale: k, s: 34, bg: '#2a0d10', edge: RED, c: '#ffd0d0' });
  txt(ctx, tag, 540, y + h + 50, { w: 500, s: 26, c: '#6b6f80' });
}
// sermon page: archive -> page top (player, "watch") -> scripture (same cuts as the portfolio video)
function c1Time(u) { if (u < 1.0) return u; if (u < 2.6) return 7.0 + (u - 1.0); return Math.min(2.0 + (u - 2.6), 4.8); }

const SCENES = {
  intro() {},  // the full-screen head is the scene
  first(ctx) {
    const a = S('first');
    txt(ctx, '01', 540, 620, { w: 800, s: 200, c: '#26252f' });
    if (card(ctx, 540, 820, 760, 240, { scale: pop(a + 0.35), edge: LAV })) {
      emoji(ctx, '⛪', -270, 0, 90); txt(ctx, 'Sermon publishing', -190, -26, { w: 800, s: 46, align: 'left' }); txt(ctx, 'for a church', -190, 34, { w: 500, s: 30, c: SUB, align: 'left' }); ctx.restore();
    }
  },
  steps(ctx) {
    const a = S('steps'), th = at('thirteen', 'steps', a + 1.4), on = at('online.', 'steps', a + 4.2);
    chip(ctx, '🙋  A volunteer · every Sunday', 540, 420, { scale: pop(a + 0.1), s: 32 });
    if (card(ctx, 540, 820, 860, 620, { scale: pop(a + 0.25) })) {
      txt(ctx, 'Manual steps', -390, -270, { w: 700, s: 32, align: 'left' });
      const n = Math.min(13, Math.floor(clamp01((P.t - th) / 2.4) * 13) + (P.t > th ? 1 : 0));
      for (let i = 0; i < 13; i++) { const col = i < 7 ? 0 : 1, row = i % 7, x = -390 + col * 420, y = -200 + row * 64;
        rr(ctx, x, y, 380, 48, 10); ctx.fillStyle = i < n ? '#1f2029' : '#17181d'; ctx.fill();
        if (i < n) { txt(ctx, `${i + 1}.`, x + 18, y + 25, { w: 700, s: 24, c: SUB, align: 'left' }); rr(ctx, x + 64, y + 18, 120 + ((i * 37) % 160), 12, 6); ctx.fillStyle = '#3b3f4d'; ctx.fill(); } }
      ctx.restore();
    }
    chip(ctx, '13 manual steps', 540, 1190, { scale: pop(th + 2.5), s: 44, bg: '#2a0d10', edge: RED, c: '#ffd0d0', rot: -3, glow: RED });
  },
  flow(ctx) {
    const a = S('flow'), dr = at('draft.', 'flow', a + 3.6), fi = at('finds', 'flow', a + 4.6), pr = at('prepares', 'flow', a + 5.8), ti = at('approved', 'flow', a + 7.2);
    const nodes = [['🎥', 'Recorded service', 430, a + 0.2], [null, 'Workflow', 700, a + 1.2], ['📝', 'WordPress draft', 970, dr]];
    nodes.forEach(([e, s, y, t0], i) => {
      if (i > 0) { const f = since(t0 - 0.4, 0.4); if (f > 0) { ctx.save(); ctx.strokeStyle = LAV; ctx.lineWidth = 5; ctx.setLineDash([12, 10]); ctx.lineDashOffset = -P.t * 40;
        ctx.beginPath(); ctx.moveTo(300, nodes[i - 1][2] + 70); ctx.lineTo(300, lerp(nodes[i - 1][2] + 70, y - 70, f)); ctx.stroke(); ctx.restore(); } }
      if (card(ctx, 300, y, 440, 140, { scale: pop(t0), edge: i === 1 ? LAV : EDGE, glow: i === 1 ? 'rgba(167,139,250,0.35)' : null })) {
        if (e) emoji(ctx, e, -150, 0, 60); else orb(ctx, -150, 0, 40); txt(ctx, s, -100, 0, { w: 700, s: 34, align: 'left' }); ctx.restore(); }
    });
    [['Finds the sermon', fi], ['Prepares the audio', pr], ['Title · preacher', ti], ['Scripture', ti + 0.6]].forEach(([s, t0], i) =>
      chip(ctx, s, 800, 520 + i * 130, { scale: pop(t0), s: 30, bg: '#1a1630', edge: LAV, c: '#e4dcff' }));
    label(ctx, 'Illustrated run · not a recording');
  },
  safe(ctx) {
    const a = S('safe');
    if (card(ctx, 540, 760, 760, 460, { scale: pop(a + 0.1) })) {
      chip(ctx, 'DRAFT', 250, -170, { s: 28, bg: '#2a2410', edge: GOLD, c: GOLD });
      txt(ctx, 'Sunday sermon', -330, -170, { w: 700, s: 36, align: 'left' });
      for (let i = 0; i < 4; i++) { rr(ctx, -330, -90 + i * 52, 520 - i * 70, 22, 8); ctx.fillStyle = '#2a2c35'; ctx.fill(); }
      emoji(ctx, '🔒', 0, 150, 70); ctx.restore();
    }
    chip(ctx, 'Nothing goes live on its own', 540, 1110, { scale: pop(a + 0.6), s: 34, bg: '#11261a', edge: GREEN, c: '#bff5d2' });
  },
  clip1(ctx) {
    const a = S('clip1'), k = ease.out(since(a, 0.35));
    realFrame(ctx, C1.at(c1Time(P.t - a)), 0, 0, 990, 750, 780, 'The published sermon page · names hidden', k);
  },
  second(ctx) {
    const a = S('second'), ins = at('insurance', 'second', a + 2.5);
    txt(ctx, '02', 540, 620, { w: 800, s: 200, c: '#26252f' });
    if (card(ctx, 540, 820, 760, 240, { scale: pop(a + 0.2), edge: LAV, glow: 'rgba(167,139,250,0.3)' })) {
      orb(ctx, -270, 0, 52); txt(ctx, 'AI analyst', -190, -26, { w: 800, s: 46, align: 'left' }); txt(ctx, 'answers questions about the data', -190, 34, { w: 500, s: 28, c: SUB, align: 'left' }); ctx.restore();
    }
    chip(ctx, '🏢  An insurance company', 540, 1060, { scale: pop(ins), s: 34 });
  },
  code(ctx) {
    const a = S('code'), rd = at('reads', 'code', a + 1.8), df = at('defines', 'code', a + 4.6);
    if (card(ctx, 540, 640, 860, 440, { scale: pop(a + 0.1) })) {
      txt(ctx, 'app code', -390, -180, { w: 600, s: 26, c: SUB, align: 'left' });
      const lines = ['class Case', '  def open?', '    !closed && !archived', '  end', 'end'];
      const hl = P.t > rd + 0.8;
      lines.forEach((s, i) => { const y = -110 + i * 58; if (hl && (i === 1 || i === 2)) { rr(ctx, -400, y - 24, 800, 48, 8); ctx.fillStyle = 'rgba(167,139,250,0.18)'; ctx.fill(); }
        ctx.font = '500 32px Consolas, "Cascadia Mono", monospace'; ctx.fillStyle = i === 2 ? '#bff5d2' : '#d6d8e2'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(s, -370, y); });
      if (P.t > rd) { const sy = -110 + ((P.t - rd) * 90 % 290); ctx.fillStyle = 'rgba(167,139,250,0.5)'; ctx.fillRect(-420, sy, 840, 3); }
      ctx.restore();
    }
    orb(ctx, 900, 440, 46, { scale: pop(a + 0.3) });
    if (card(ctx, 540, 1010, 860, 150, { scale: pop(df), edge: GOLD })) {
      txt(ctx, 'Open case', -390, -24, { w: 700, s: 34, align: 'left' }); txt(ctx, '= not closed, not archived', -390, 24, { w: 500, s: 28, c: SUB, align: 'left' });
      check(ctx, 360, 0, 26, pop(df + 0.3)); ctx.restore();
    }
    label(ctx, 'Illustration');
  },
  clip2(ctx) {
    const a = S('clip2'), k = ease.out(since(a, 0.35));
    realFrame(ctx, C2.at(P.t - a + 0.5), 0, 95, 720, 375, 760, 'The agent at work · client wording blurred', k);
  },
  guard(ctx) {
    const a = S('guard'), ch = at("can't", 'guard', a + 2.6);
    if (card(ctx, 540, 600, 520, 300, { scale: pop(a + 0.1), edge: GREEN, glow: 'rgba(34,197,94,0.3)' })) {
      emoji(ctx, '🛡️', 0, -50, 100); txt(ctx, 'READ-ONLY GUARD', 0, 80, { w: 800, s: 38, c: '#bff5d2' }); ctx.restore(); }
    const q = [['SELECT … FROM cases', a + 0.9, true], ['DELETE FROM cases', ch, false]];
    q.forEach(([s, t0, ok], i) => { if (card(ctx, 540, 900 + i * 150, 860, 120, { scale: pop(t0), edge: ok ? EDGE : RED })) {
      ctx.font = '600 34px Consolas, "Cascadia Mono", monospace'; ctx.fillStyle = ok ? '#d6d8e2' : '#ffd0d0'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(s, -390, 0);
      if (ok) check(ctx, 370, 0, 28, pop(t0 + 0.3)); else cross(ctx, 370, 0, 28, pop(t0 + 0.3)); ctx.restore(); } });
  },
  chart(ctx) {
    const a = S('chart'), k = ease.out(since(a, 0.35));
    realFrame(ctx, C3, 0, 0, 900, 560, 760, 'A chart from its report · values blurred', k);
  },
  close(ctx, t) {
    if (t >= END_T) return endCard(ctx, t);
    const a = S('close'), rm = at('Remove', 'close', a + 2.5), kp = at('keep', 'close', a + 4.2), lv = at('leave', 'close', a + 5.5);
    txt(ctx, 'Same approach', 540, 460, { w: 800, s: 64 });
    [['✂️  Remove the repetitive steps', rm, LAV, '#1a1630'], ['🛡️  Keep the safeguards', kp, GREEN, '#11261a'], ['🙋  Leave people in control', lv, GOLD, '#2a2410']].forEach(([s, t0, c, bg], i) =>
      chip(ctx, s, 540, 680 + i * 170, { scale: pop(t0), s: 40, bg, edge: c, rot: [-2, 2, -1][i] }));
  },
};
function endCard(ctx) {
  const k = since(END_T + 0.4, 0.4); if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = k; txt(ctx, 'Tony Callender', 540, 900, { w: 800, s: 64 });
  txt(ctx, 'AI systems built for the people who use them', 540, 976, { w: 500, s: 30, c: SUB });
  chip(ctx, 'Follow for more', 540, 1100, { scale: pop(END_T + 0.7), s: 34, bg: LAV2, edge: LAV, c: '#fff' }); ctx.restore();
}

// ── captions: white bold, 3-4 words ─────────────────────────────────────────
let CHUNKS = null;
function captions(ctx, t) {
  if (!CHUNKS) { CHUNKS = []; let cur = [];
    P.words.forEach((w, i) => { cur.push(w); const n = P.words[i + 1];
      if (!n || cur.length >= 4 || /[.,!?;:"]$/.test(w.text) || n.start - w.end > 0.3) { CHUNKS.push(cur); cur = []; } }); }
  const i = CHUNKS.findIndex((c, k) => t >= c[0].start && t < (CHUNKS[k + 1] ? CHUNKS[k + 1][0].start : c[c.length - 1].end + 0.5));
  if (i < 0) return;
  let s = CHUNKS[i].map((w) => w.text).join(' ').replace(/[,;:]$/, '');
  ctx.font = FONT(800, 60); let size = 60; const W = ctx.measureText(s).width; if (W > 960) size = Math.floor(60 * 960 / W);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 18; txt(ctx, s, 540, t < S('first') ? 1360 : CAP_Y, { w: 800, s: size }); ctx.restore();
}

// ── the frame ───────────────────────────────────────────────────────────────
const ORDER = Object.keys(SCENES);
Eduba.frame({ overlay: true, step: 30, draw(g, t) {
  const ctx = g.photo.ctx;
  ctx.fillStyle = BG; ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = DOT; for (let y = 20; y < 1920; y += 44) for (let x = 20; x < 1080; x += 44) ctx.fillRect(x, y, 3, 3);
  let id = ORDER[0]; for (const k of ORDER) if (t >= S(k)) id = k;
  const k = id === ORDER[0] ? 1 : ease.out(clamp01((t - S(id)) / 0.28));
  ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 30); SCENES[id](ctx, t); ctx.restore();
  talkingHead(ctx, t);
  if (t < END_T) captions(ctx, t);
} });
