// scene.js: ai-analyst-reel (LinkedIn #12), dark UI style modeled on videos/_inspiration/ig-DffO8yvD9EG (see STYLE.md there).
// Near-black ground + faint dot grid, one or two UI objects at a time (upper-middle), the AI is a lavender orb,
// white bold captions (3-4 words) at CAP_Y, title only at the start, Tony's face opens and closes the reel.
// Numbers and metric definitions on screen are illustrations (labelled), not client data. The client stays anonymous.
const { ease } = P;
const S = (id) => P.cue(id).start;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, p) => a + (b - a) * p;
P.wait(Promise.all(['500', '600', '700', '800'].map((w) => document.fonts.load(`${w} 40px Inter`))));
const HEAD = Eduba.image('assets/tony-head.png');

// ── look ───────────────────────────────────────────────────────────────────
const BG = '#0b0b0e', DOT = '#1b1c22', CARD = '#141519', EDGE = '#2c2e37', TEXT = '#f4f4f6', SUB = '#8d909c';
const LAV = '#a78bfa', LAV2 = '#7c5cf0', GREEN = '#22c55e', RED = '#ef4444', GOLD = '#e8b931', PAPERW = '#f6f6f4';
const FONT = (w, s) => `${w} ${s}px Inter, "Segoe UI", Arial, sans-serif`;
const EMOJI = (s) => `${s}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
const CAP_Y = 1300, END_T = 85.9;

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
function head(ctx, x, y, r, k = 1) { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.shadowColor = LAV; ctx.shadowBlur = 40; ctx.fillStyle = '#1d1a2b'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.clip();
  if (HEAD.complete && HEAD.naturalWidth) { const w = r * 2.05, h = w * HEAD.naturalHeight / HEAD.naturalWidth; ctx.drawImage(HEAD, -w / 2, -h * 0.5 + r * 0.12, w, h); }
  ctx.restore(); ctx.lineWidth = 6; ctx.strokeStyle = LAV; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke(); ctx.restore(); }
function cursor(ctx, x, y) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 46); ctx.lineTo(12, 35); ctx.lineTo(22, 56); ctx.lineTo(30, 52); ctx.lineTo(20, 32); ctx.lineTo(36, 32); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
function label(ctx, s) { txt(ctx, s, 540, 1590, { w: 500, s: 22, c: '#55586a' }); }

// ── scenes (one per cue; each draws its objects for local time) ─────────────
const SCENES = {
  q(ctx, t) {
    // just the question, big and centred (no head: Tony found it distracting)
    const nb = at('nobody', 'q', 2.8);
    ['How do you know', 'your AI is as good', 'as a person?'].forEach((l, i) => txt(ctx, l, 540, 640 + i * 96, { w: 800, s: 80, c: i === 2 ? LAV : TEXT }));
    const k = since(nb, 0.3);
    if (k > 0) { ctx.save(); ctx.globalAlpha *= k; ctx.translate(0, (1 - k) * 16);
      txt(ctx, 'When nobody logs', 540, 1000, { w: 700, s: 50, c: SUB }); txt(ctx, 'the person\'s mistakes', 540, 1064, { w: 700, s: 50, c: SUB }); ctx.restore(); }
  },
  ins(ctx) {
    const a = S('ins'), c = at('compliance', 'ins', a + 2.6), no = at("couldn't", 'ins', a + 4.4);
    chip(ctx, '🏢  An insurance company', 540, 480, { scale: pop(a + 0.1), s: 38 });
    if (card(ctx, 540, 820, 860, 470, { scale: pop(a + 0.35) })) {
      txt(ctx, 'Dashboards', -390, -190, { w: 600, s: 28, c: SUB, align: 'left' });
      const tiles = [[-205, -70], [205, -70], [-205, 110]];
      tiles.forEach(([x, y], i) => { rr(ctx, x - 185, y - 75, 370, 150, 18); ctx.fillStyle = '#1b1c22'; ctx.fill();
        for (let b = 0; b < 6; b++) { const h = 30 + ((i * 7 + b * 13) % 70); rr(ctx, x - 150 + b * 52, y + 55 - h, 34, h, 6); ctx.fillStyle = b % 2 ? '#3b3f4d' : '#555a6b'; ctx.fill(); } });
      const k = pop(c, 0.3);
      if (k > 0) { ctx.save(); ctx.translate(205, 110); ctx.scale(k, k);
        const warn = P.t > no; ctx.setLineDash([12, 10]); ctx.lineDashOffset = -P.t * 30; ctx.lineWidth = 4; ctx.strokeStyle = warn ? RED : '#6b6f80';
        rr(ctx, -185, -75, 370, 150, 18); ctx.stroke(); ctx.setLineDash([]);
        txt(ctx, '?', 0, -18, { w: 800, s: 64, c: warn ? RED : SUB }); txt(ctx, 'Compliance report', 0, 44, { w: 600, s: 24, c: warn ? RED : SUB }); ctx.restore(); }
      ctx.restore();
    }
  },
  built(ctx) {
    const a = S('built'), q = at('team', 'built', a + 2.7), ans = at('answers', 'built', a + 5.8);
    if (card(ctx, 540, 600, 420, 330, { scale: pop(a + 0.1), edge: LAV, glow: 'rgba(167,139,250,0.35)' })) {
      rr(ctx, -210, -165, 420, 62, [26, 26, 0, 0]); ctx.fillStyle = LAV2; ctx.fill(); txt(ctx, 'STAFF', 0, -134, { w: 800, s: 26, c: '#fff' });
      orb(ctx, 0, -10, 58); txt(ctx, 'AI analyst', 0, 90, { w: 700, s: 36 }); txt(ctx, 'Insurance co. · new starter', 0, 132, { w: 500, s: 22, c: SUB });
      ctx.restore();
    }
    if (card(ctx, 540, 940, 860, 150, { scale: pop(q), fill: PAPERW, edge: '#d9d9d6' })) {
      txt(ctx, 'Team', -390, -40, { w: 700, s: 24, c: '#555', align: 'left' });
      const s = 'How many compliance cases are still open this month?', n = Math.ceil(typed(q + 0.2, 1.2) * s.length);
      wrap(ctx, s, 790, 600, 32).reduce((left, l, i) => { txt(ctx, l.slice(0, Math.max(0, left)), -390, 4 + i * 42, { w: 600, s: 32, c: '#111', align: 'left' }); return left - l.length - 1; }, n);
      ctx.restore();
    }
    chip(ctx, '142 open cases · by region', 540, 1110, { scale: pop(ans), bg: '#11261a', edge: GREEN, c: '#bff5d2' });
    label(ctx, 'Illustration');
  },
  subj(ctx) {
    const a = S('subj'), su = at('subjective', 'subj', a + 4);
    txt(ctx, '"Active client" means…', 540, 470, { w: 700, s: 44, c: TEXT });
    const rows = [['Logged in this week', '1,204'], ['Bought in the last 90 days', '3,870'], ["Hasn't cancelled", '9,112']];
    rows.forEach(([d, n], i) => { const k = pop(a + 0.4 + i * 0.9);
      if (card(ctx, 540, 640 + i * 180, 860, 140, { scale: k })) { txt(ctx, d, -390, 0, { w: 600, s: 34, align: 'left' }); txt(ctx, n, 390, 0, { w: 800, s: 44, c: LAV, align: 'right' }); ctx.restore(); } });
    chip(ctx, 'SUBJECTIVE', 540, 1140, { scale: pop(su), s: 52, bg: '#221a3d', edge: LAV, c: '#fff', rot: -3, glow: LAV });
    label(ctx, 'Same word, three answers · illustration');
  },
  match(ctx) {
    const a = S('match'), gd = at('good', 'match', a + 1.4), g2 = at('guarantee', 'match', a + 3.3);
    if (card(ctx, 540, 560, 820, 220, { scale: pop(a + 0.1) })) {
      orb(ctx, -300, 0, 44); txt(ctx, 'Today\'s AI models', -220, -30, { w: 700, s: 36, align: 'left' });
      txt(ctx, 'Very good at analysis', -220, 26, { w: 500, s: 30, c: SUB, align: 'left' }); check(ctx, 340, 0, 26, pop(gd)); ctx.restore();
    }
    const k = pop(g2);
    if (k > 0) { ctx.save(); ctx.translate(540, 760); ctx.scale(k, k); ctx.fillStyle = '#2a0d10'; ctx.beginPath(); ctx.arc(0, 0, 56, 0, 7); ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = RED; ctx.stroke(); txt(ctx, '≠', 0, 2, { w: 800, s: 64, c: RED }); ctx.restore(); }
    if (card(ctx, 540, 960, 820, 220, { scale: pop(g2 + 0.25) })) {
      emoji(ctx, '🏢', -300, 0, 70); txt(ctx, 'How this company', -220, -30, { w: 700, s: 36, align: 'left' });
      txt(ctx, 'does things', -220, 26, { w: 700, s: 36, align: 'left' }); ctx.restore();
    }
  },
  nolog(ctx) {
    const a = S('nolog'), some = at('Some', 'nolog', a + 2.2);
    if (card(ctx, 540, 760, 860, 560, { scale: pop(a + 0.1) })) {
      txt(ctx, 'Human error log', -390, -230, { w: 700, s: 34, align: 'left' });
      ['Date', 'Mistake', 'Who'].forEach((h, i) => txt(ctx, h, -380 + i * 280, -160, { w: 600, s: 26, c: SUB, align: 'left' }));
      ctx.strokeStyle = EDGE; ctx.lineWidth = 2; ctx.setLineDash([10, 10]);
      for (let r = 0; r < 4; r++) { ctx.beginPath(); ctx.moveTo(-390, -110 + r * 80); ctx.lineTo(390, -110 + r * 80); ctx.stroke(); } ctx.setLineDash([]);
      txt(ctx, '0 entries', 0, 50, { w: 800, s: 64, c: '#5d6070' }); ctx.restore();
    }
    chip(ctx, 'Some companies do keep one', 540, 1130, { scale: pop(some), s: 30, c: SUB });
  },
  gold(ctx) {
    const a = S('gold'), ty = at('type', 'gold', a + 1.8), me = at('metrics', 'gold', a + 4.6), ta = at('tables', 'gold', a + 5.3), mp = at('mapped', 'gold', a + 6.3);
    const tiles = [370, 540, 710];
    tiles.forEach((x, i) => { const k = pop(mp + i * 0.12); if (card(ctx, x, 420, 140, 100, { scale: k, r: 16 })) {
      for (let b = 0; b < 4; b++) { rr(ctx, -50 + b * 27, 30 - (18 + b * 9), 18, 18 + b * 9, 4); ctx.fillStyle = '#555a6b'; ctx.fill(); } ctx.restore(); }
      const f = since(mp + 0.35 + i * 0.1, 0.5); if (f > 0) { ctx.save(); ctx.strokeStyle = GOLD; ctx.lineWidth = 4; ctx.setLineDash([8, 8]); ctx.lineDashOffset = -P.t * 40;
        ctx.beginPath(); ctx.moveTo(x, 475); ctx.lineTo(lerp(x, 540, f), lerp(475, 560, f)); ctx.stroke(); ctx.restore(); } });
    if (card(ctx, 540, 850, 860, 560, { scale: pop(a + 0.15), edge: GOLD, glow: 'rgba(232,185,49,0.35)', lw: 4 })) {
      txt(ctx, 'GOLD DATASET', -390, -225, { w: 800, s: 40, c: GOLD, align: 'left' });
      txt(ctx, 'How this company defines its metrics', -390, -172, { w: 500, s: 28, c: SUB, align: 'left' });
      const rows = [['Open case', 'not closed, not archived', ty], ['Active client', 'policy currently in force', me], ['Cases table', 'one row per case, not per person', ta]];
      rows.forEach(([m, d, t0], i) => { const k = since(t0, 0.3); if (k <= 0) return; ctx.save(); ctx.globalAlpha *= k; const y = -80 + i * 112;
        rr(ctx, -400, y - 44, 800, 92, 14); ctx.fillStyle = '#1c1a12'; ctx.fill();
        txt(ctx, m, -375, y - 14, { w: 700, s: 30, c: TEXT, align: 'left' }); txt(ctx, '= ' + d, -375, y + 22, { w: 500, s: 26, c: SUB, align: 'left' });
        check(ctx, 360, y, 20, pop(t0 + 0.2)); ctx.restore(); });
      ctx.restore();
    }
    label(ctx, 'Example definitions · illustration');
  },
  mgr(ctx) {
    const a = S('mgr'), y = at('yes', 'mgr', a + 3.6), st = at('standard', 'mgr', a + 6.9);
    if (card(ctx, 330, 560, 300, 300, { scale: pop(a + 0.1), edge: GOLD })) {
      txt(ctx, 'GOLD', 0, -70, { w: 800, s: 34, c: GOLD }); txt(ctx, 'DATASET', 0, -28, { w: 800, s: 34, c: GOLD });
      for (let i = 0; i < 3; i++) { rr(ctx, -110, 20 + i * 36, 220, 18, 6); ctx.fillStyle = '#3a3420'; ctx.fill(); } ctx.restore();
    }
    if (card(ctx, 760, 560, 300, 300, { scale: pop(a + 0.35) })) {
      ctx.fillStyle = '#3a3d4a'; ctx.beginPath(); ctx.arc(0, -40, 58, 0, 7); ctx.fill(); emoji(ctx, '👔', 0, -40, 60);
      txt(ctx, 'Manager', 0, 66, { w: 700, s: 34 }); txt(ctx, 'plain English', 0, 106, { w: 500, s: 24, c: SUB }); ctx.restore();
    }
    if (card(ctx, 540, 900, 860, 190, { scale: pop(y), fill: PAPERW, edge: '#d9d9d6' })) {
      txt(ctx, '"Yes, this is how we', -380, -26, { w: 700, s: 40, c: '#111', align: 'left' }); txt(ctx, 'define our metrics."', -380, 30, { w: 700, s: 40, c: '#111', align: 'left' });
      check(ctx, 370, 0, 32, pop(y + 0.4)); ctx.restore();
    }
    chip(ctx, 'THE STANDARD', 540, 1120, { scale: pop(st), s: 50, bg: '#2a2410', edge: GOLD, c: GOLD, rot: -4, glow: 'rgba(232,185,49,0.6)' });
  },
  notai(ctx) {
    const a = S('notai'), oa = at("OpenAI's", 'notai', a + 3.6), wb = at('was', 'notai', a + 6.1), gd = at('analyst', 'notai', a + 7.9);
    const dim = P.t > wb ? 0.35 : 1;
    if (card(ctx, 540, 560, 860, 230, { scale: pop(a + 0.1), alpha: dim })) {
      txt(ctx, 'An AI that\'s good at', 0, -46, { w: 700, s: 40 }); txt(ctx, 'data analysis', 0, 8, { w: 700, s: 40 });
      if (P.t > oa) txt(ctx, 'OpenAI\'s or Anthropic\'s job', 0, 70, { w: 500, s: 28, c: SUB }); ctx.restore();
    }
    if (P.t > wb + 0.2) { ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(150, 560); ctx.lineTo(lerp(150, 930, since(wb, 0.35)), 560); ctx.stroke(); ctx.restore(); }
    if (card(ctx, 540, 900, 860, 300, { scale: pop(wb + 0.3), edge: LAV, glow: 'rgba(167,139,250,0.4)', lw: 4 })) {
      orb(ctx, 0, -70, 48); txt(ctx, 'A good AI data analyst', 0, 30, { w: 800, s: 44 });
      txt(ctx, 'for THIS company', 0, 92, { w: 700, s: 36, c: LAV, }); check(ctx, 390, -110, 28, pop(gd + 0.3)); ctx.restore();
    }
  },
  pm(ctx) {
    const a = S('pm'), ck = at('check', 'pm', a + 2.3), x = at('X', 'pm', a + 2.9), cm = at('comment', 'pm', a + 3.8);
    if (card(ctx, 540, 820, 900, 680, { scale: pop(a + 0.1) })) {
      txt(ctx, 'Review: AI answers', -410, -290, { w: 700, s: 34, align: 'left' }); txt(ctx, 'Project manager', 410, -290, { w: 500, s: 24, c: SUB, align: 'right' });
      const rows = ['Open cases this month', 'Cases closed last quarter', 'Average turnaround by state'];
      rows.forEach((s, i) => { const y = -190 + i * 120 + (i === 2 && P.t > cm ? 120 : 0);
        rr(ctx, -420, y - 45, 840, 90, 14); ctx.fillStyle = '#1b1c22'; ctx.fill(); txt(ctx, s, -395, y, { w: 600, s: 28, align: 'left' });
        const on = i === 0 ? since(ck, 0.2) : i === 1 ? since(x, 0.2) : 0;
        ctx.globalAlpha = 1; rr(ctx, 230, y - 30, 80, 60, 12); ctx.fillStyle = i === 0 && on > 0 ? GREEN : '#2a2c35'; ctx.fill(); txt(ctx, '✓', 270, y + 2, { w: 800, s: 34, c: i === 0 && on > 0 ? '#06210f' : '#9a9db0' });
        rr(ctx, 320, y - 30, 80, 60, 12); ctx.fillStyle = i === 1 && on > 0 ? RED : '#2a2c35'; ctx.fill(); txt(ctx, '✗', 360, y + 2, { w: 800, s: 34, c: i === 1 && on > 0 ? '#2a0707' : '#9a9db0' }); });
      const k = since(cm, 0.25);
      if (k > 0) { ctx.save(); ctx.globalAlpha *= k; rr(ctx, -420, 0, 840, 100, 14); ctx.fillStyle = '#101115'; ctx.fill(); ctx.strokeStyle = RED; ctx.lineWidth = 3; ctx.stroke();
        const s = 'Wrong date range: use the policy year', n = Math.ceil(typed(cm + 0.2, 1.1) * s.length); txt(ctx, s.slice(0, n) + (P.t % 1 < 0.5 ? '|' : ''), -395, 50, { w: 500, s: 28, c: '#ffd0d0', align: 'left' }); ctx.restore(); }
      ctx.restore();
    }
    const path = [[700, 1300], [810, 650], [900, 770], [400, 950]], seg = P.t < ck ? 0 : P.t < x ? 1 : 2;
    const t0 = [a + 0.5, ck - 0.4, x - 0.3][seg], t1 = [ck, x, cm][seg], f = ease.inOut(clamp01((P.t - t0) / Math.max(0.2, t1 - t0)));
    if (P.t > a + 0.5) cursor(ctx, lerp(path[seg][0], path[seg + 1][0], f), lerp(path[seg][1], path[seg + 1][1], f));
    label(ctx, 'Illustration');
  },
  score(ctx) {
    const a = S('score'), fb = at('feedback', 'score', a + 2.9), im = at('improve', 'score', a + 3.4);
    chip(ctx, 'Scored against the GOLD DATASET', 540, 470, { scale: pop(a + 0.1), s: 34, edge: GOLD, c: GOLD, bg: '#1c1a12' });
    const bars = [['Round 1', 0.52, a + 0.6], ['Round 2', 0.74, fb], ['Round 3', 0.93, im + 0.2]];
    if (card(ctx, 540, 820, 860, 470, { scale: pop(a + 0.3) })) {
      txt(ctx, 'Match with the gold dataset', -390, -180, { w: 600, s: 28, c: SUB, align: 'left' });
      bars.forEach(([n, v, t0], i) => { const y = -80 + i * 110; txt(ctx, n, -390, y, { w: 600, s: 30, align: 'left' });
        rr(ctx, -200, y - 22, 580, 44, 22); ctx.fillStyle = '#1e1f26'; ctx.fill();
        const w = 580 * v * ease.out(since(t0, 0.7)); if (w > 1) { rr(ctx, -200, y - 22, w, 44, 22); ctx.fillStyle = i === 2 ? GREEN : LAV; ctx.fill(); } });
      ctx.restore();
    }
    label(ctx, 'Illustration');
  },
  rigor(ctx) {
    const a = S('rigor'), c = at('compliance', 'rigor', a + 1.5), su = at('subjective', 'rigor', a + 2.7), hi = at('high', 'rigor', a + 3.7);
    chip(ctx, 'Why the rigor?', 540, 470, { scale: pop(a + 0.1), s: 34, c: SUB });
    chip(ctx, 'COMPLIANCE DATA', 540, 660, { scale: pop(c), s: 54, rot: -3 });
    chip(ctx, 'SUBJECTIVE', 540, 830, { scale: pop(su), s: 54, bg: '#221a3d', edge: LAV, rot: 2, glow: LAV });
    chip(ctx, 'HIGH RISK', 540, 1000, { scale: pop(hi), s: 54, bg: '#2a0d10', edge: RED, c: '#ffd0d0', rot: -2, glow: RED });
  },
  same(ctx) {
    const a = S('same'), k = pop(a + 0.1, 0.4);
    if (k > 0) { ctx.save(); ctx.translate(540, 720); ctx.scale(k, k); ctx.shadowColor = LAV; ctx.shadowBlur = 60; txt(ctx, '?', 0, 0, { w: 800, s: 360, c: LAV }); ctx.restore(); }
    txt(ctx, 'Every AI project?', 540, 1020, { w: 700, s: 48, c: TEXT });
  },
  hvac(ctx) {
    const a = S('hvac'), lv = at('live', 'hvac', a + 3.8), wo = at('without', 'hvac', a + 4.9);
    if (card(ctx, 540, 600, 860, 280, { scale: pop(a + 0.3), edge: GREEN })) {
      emoji(ctx, '📞', -330, -30, 80); txt(ctx, 'Voice agent', -250, -60, { w: 700, s: 40, align: 'left' }); txt(ctx, 'Local HVAC business', -250, -10, { w: 500, s: 28, c: SUB, align: 'left' });
      chip(ctx, 'Live on day 1', 0, 80, { scale: pop(lv), s: 34, bg: '#11261a', edge: GREEN, c: '#bff5d2' }); ctx.restore();
    }
    if (card(ctx, 540, 940, 860, 280, { scale: pop(wo), edge: GOLD })) {
      emoji(ctx, '📊', -330, -30, 80); txt(ctx, 'AI analyst', -250, -60, { w: 700, s: 40, align: 'left' }); txt(ctx, 'Compliance data', -250, -10, { w: 500, s: 28, c: SUB, align: 'left' });
      chip(ctx, 'Gold dataset + evals + review', 0, 80, { scale: pop(wo + 0.3), s: 30, bg: '#1c1a12', edge: GOLD, c: GOLD }); ctx.restore();
    }
  },
  dep(ctx, t) {
    if (t >= END_T) return endCard(ctx, t);
    const a = S('dep'), dials = [['RISK', at('risk', 'dep', a + 0.9), 0.85, RED], ['NEEDS', at('needs', 'dep', a + 1.7), 0.55, LAV], ['URGENCY', at('urgency', 'dep', a + 2.6), 0.35, GOLD]];
    txt(ctx, 'It depends on', 540, 500, { w: 700, s: 44, c: SUB });
    dials.forEach(([n, t0, v, col], i) => { const x = 230 + i * 310, y = 820, k = pop(t0); if (k <= 0) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.lineCap = 'round';
      ctx.lineWidth = 22; ctx.strokeStyle = '#23242c'; ctx.beginPath(); ctx.arc(0, 0, 120, Math.PI, 2 * Math.PI); ctx.stroke();
      const f = v * ease.out(since(t0 + 0.1, 0.8)); ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(0, 0, 120, Math.PI, Math.PI + Math.PI * f); ctx.stroke();
      const ang = Math.PI + Math.PI * f; ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * 92, Math.sin(ang) * 92); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.fill(); txt(ctx, n, 0, 70, { w: 800, s: 34 }); ctx.restore(); });
  },
};
function endCard(ctx, t) {
  const k = pop(END_T, 0.4);  // no head on the end card either
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
  if (t >= S('ins') && t < END_T) captions(ctx, t);  // the opening question is on screen as text already
} });
