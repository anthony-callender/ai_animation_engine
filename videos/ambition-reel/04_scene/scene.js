// scene.js: ambition-reel (I-001), paper collage, built on _templates/reel-paper/paper-kit.js.
// Mission reel. Magnanimity: Aquinas, Summa Theologiae II-II q.129, building on Aristotle. Jesus as craftsman: Mark 6:3.
const C = STAGE;
function job(ctx, em, title, sub, x, y, o = {}) {  // a job card: big emoji + serif title
  const w = o.w || 640;
  if (!card(ctx, x, y, w, o.h || 300, { rot: o.rot || 0, scale: o.scale ?? 1 })) return;
  emoji(ctx, em, -w / 2 + 110, 0, o.es || 120); serif(ctx, title, -w / 2 + 200, sub ? -30 : 0, { s: o.s || 54, align: 'left' });
  if (sub) sans(ctx, sub, -w / 2 + 202, 36, { w: 500, s: 28, c: '#6a655d' });
  ctx.restore();
}
const jumpFrom = (a) => (P.t < a + 1.6 ? Math.abs(Math.sin((P.t - a) * 5)) * since(a, 0.2) : 0);
const SCENES = {
  hook(ctx) {
    const no = at('not', 'hook');
    if (card(ctx, C.cx, C.cy - 40, 680, 300, { rot: -3, scale: pop(0.2) })) { serif(ctx, 'AMBITION', 0, -40, { s: 80 }); serif(ctx, '= SIN?', 0, 50, { s: 70, c: RED }); ctx.restore(); }
    redX(ctx, C.cx, C.cy - 40, 340, pop(no, 0.25));
    popWord(ctx, 'NOT A SIN', C.cx, C.cy + 300, { s: 110, scale: pop(no + 0.3, 0.3), rot: -5 });
    return { pose: P.t < no ? 'think' : 'point' };
  },
  virtue(ctx) {
    const a = S('virtue'), ar = at('Aristotle', 'virtue'), aq = at('Aquinas', 'virtue'), m = at('magnanimity', 'virtue');
    if (card(ctx, C.cx, C.cy - 60, 740, 440, { rot: -1.5, scale: pop(a + 0.1), fill: '#efe2c4' })) {
      sans(ctx, 'A VIRTUE', 0, -150, { w: 800, s: 26, c: '#8a6d3b', align: 'center' });
      ctx.font = SERIF(84); const w = ctx.measureText('MAGNANIMITY').width;
      highlight(ctx, -w / 2 - 6, -50, w + 12, 70, since(m, 0.5)); serif(ctx, 'MAGNANIMITY', 0, -50, { s: 84 });
      serif(ctx, '"greatness of soul"', 0, 50, { s: 44, c: '#6a4d1f' });
      sans(ctx, 'Summa Theologiae II-II, Q.129', 0, 150, { w: 500, s: 24, c: '#8a6d3b', align: 'center' });
      ctx.restore();
    }
    tag(ctx, 'ARISTOTLE', C.cx - 170, C.cy + 260, { scale: pop(ar), rot: -5 });
    tag(ctx, 'ST. THOMAS AQUINAS', C.cx + 80, C.cy + 380, { scale: pop(aq), rot: 4, check: aq + 0.5 });
    return { pose: 'point' };
  },
  great(ctx) {
    const a = S('great'), r = at('right', 'great');
    sunburst(ctx, C.cx, C.cy - 40, 420, since(a, 0.4));
    stamp(ctx, 'GREAT', 'THINGS', C.cx, C.cy - 40, { scale: pop(a + 0.15), s: 84, rot: -5 });
    tag(ctx, 'FOR THE RIGHT REASONS', C.cx + 40, C.cy + 170, { scale: pop(r), rot: 5, check: r + 0.6 });
    return { pose: 'cheer', jump: jumpFrom(a) };
  },
  money(ctx) {  // Tony's voice note: excellent without proud, bold without harsh, successful without corrupt
    [['EXCELLENT', 'excellent', 'proud', 'proud'], ['BOLD', 'Bold', 'harsh', 'harsh'], ['SUCCESSFUL', 'Successful', 'corrupt', 'corrupt']].forEach(([good, gw, bad, bw], i) => {
      const g = at(gw, 'money'), b = at(bw, 'money'), y = C.cy - 270 + i * 230;
      if (!card(ctx, C.cx - 40, y, 700, 180, { rot: [-2, 1.5, -1][i], scale: pop(g - 0.2) })) return;
      tick(ctx, -290, -32, 26, since(g, 0.25)); serif(ctx, good, -248, -30, { s: 56, align: 'left' });
      ctx.font = SERIF(48); const bwid = ctx.measureText(bad).width, bx = -248;
      if (P.t >= b - 0.1) serif(ctx, bad, bx, 46, { s: 48, align: 'left', c: '#6a655d' });
      const k = since(b + 0.15, 0.25);
      if (k > 0) { ctx.strokeStyle = RED; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx - 8, 50); ctx.lineTo(bx - 8 + (bwid + 16) * k, 44); ctx.stroke(); }
      ctx.restore();
    });
    return { pose: P.t < at('corrupt', 'money') ? 'point' : 'cheer' };
  },
  roof(ctx) {
    const a = S('roof'), ex = at('excellent', 'roof');
    job(ctx, '🏠', 'ROOFER', 'Fix roofs', C.cx, C.cy - 60, { rot: -3, scale: pop(a + 0.1) });
    emoji(ctx, '🔨', C.cx + 260, C.cy - 210 - Math.abs(Math.sin(P.t * 8)) * 30, 90);
    popWord(ctx, 'EXCELLENT', C.cx, C.cy + 260, { s: 104, scale: pop(ex, 0.3), rot: -5 });
    return { pose: 'point' };
  },
  bread(ctx) {
    const a = S('bread'), b = at('best', 'bread');
    job(ctx, '🍞', 'BAKER', 'Make bread', C.cx, C.cy - 60, { rot: 3, scale: pop(a + 0.1) });
    sunburst(ctx, C.cx, C.cy + 250, 240, since(b, 0.4) * 0.7);
    tag(ctx, 'BEST IN TOWN', C.cx, C.cy + 250, { scale: pop(b), rot: -4, s: 52, bg: GOLD, check: b + 0.5 });
    return { pose: 'hold' };
  },
  code(ctx) {
    const a = S('code'), h = at('helps', 'code');
    if (card(ctx, C.cx, C.cy - 70, 700, 420, { rot: -2, scale: pop(a + 0.1) })) {
      rr(ctx, -320, -180, 640, 360, 18); ctx.fillStyle = '#1d1d1f'; ctx.fill();
      const lines = ['function serve(people) {', '  for (const p of people)', '    help(p);', '}'];
      ctx.font = MONO(32); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      lines.forEach((l, i) => { const q = typed(a + 0.5 + i * 0.6, 0.5); ctx.fillStyle = i ? '#fff' : '#9fe3b0'; ctx.fillText(l.slice(0, Math.ceil(q * l.length)), -290, -110 + i * 66); });
      ctx.restore(); }
    emoji(ctx, '💻', C.cx - 300, C.cy - 300, 90);
    tag(ctx, 'HELPS PEOPLE', C.cx + 60, C.cy + 250, { scale: pop(h), rot: 4, s: 50, check: h + 0.5 });
    return { pose: 'point' };
  },
  jesus(ctx) {
    const a = S('jesus'), m = at('matters', 'jesus');
    if (card(ctx, C.cx, C.cy - 80, 680, 360, { rot: -2, scale: pop(a + 0.1), fill: '#efe2c4' })) {
      emoji(ctx, '🪚', -200, -10, 130); serif(ctx, 'JESUS', 60, -60, { s: 64, align: 'left' }); serif(ctx, 'craftsman', 60, 10, { s: 50, align: 'left', c: '#6a4d1f' });
      sans(ctx, 'Mark 6:3', 62, 80, { w: 600, s: 28, c: '#8a6d3b' }); ctx.restore(); }
    popWord(ctx, 'OUR WORK', C.cx, C.cy + 220, { s: 100, scale: pop(m - 0.5, 0.3), rot: -5 });
    popWord(ctx, 'MATTERS', C.cx + 30, C.cy + 340, { s: 100, scale: pop(m, 0.3), rot: -3 });
    return { pose: 'point' };
  },
  fame(ctx) {
    const a = S('fame'), inf = at('influencers', 'fame');
    if (card(ctx, C.cx, C.cy - 40, 520, 640, { rot: 3, scale: pop(a + 0.1) })) {
      rr(ctx, -200, -270, 400, 540, 40); ctx.fillStyle = '#f6f3ec'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      emoji(ctx, '🤳', 0, -130, 110); serif(ctx, 'Famous Christian', 0, 10, { s: 36 }); serif(ctx, 'influencer', 0, 56, { s: 36 });
      const n = Math.floor(clamp01((P.t - a - 0.8) / 1.5) * 1000);
      sans(ctx, (n >= 1000 ? '1M' : n + 'K') + ' followers', 0, 140, { w: 700, s: 30, c: RED, align: 'center' });
      ctx.restore(); }
    redX(ctx, C.cx, C.cy - 40, 420, pop(inf + 0.2, 0.25));
    tag(ctx, 'NOT REQUIRED', C.cx + 40, C.cy + 330, { scale: pop(inf + 0.5), rot: -4 });
    return { pose: 'think' };
  },
  faithful(ctx) {
    const ex = at('excellent', 'faithful'), pl = at('places', 'faithful');
    [['🏠', 'Roofer', -8, -300], ['🍞', 'Baker', 4, -90], ['💻', 'Programmer', -3, 120]].forEach(([em, s, rot, dy], i) => {
      if (card(ctx, C.cx - 20 + i * 30, C.cy + dy, 580, 170, { rot, scale: pop(S('faithful') + 0.2 + i * 0.4) })) {
        emoji(ctx, em, -180, 0, 70); serif(ctx, s, -120, 4, { s: 44, align: 'left' }); tick(ctx, 240, 0, 26, since(ex + i * 0.15, 0.25)); ctx.restore(); }
    });
    popWord(ctx, 'ORDINARY PLACES', C.cx, C.cy + 360, { s: 84, scale: pop(pl - 0.2, 0.3), rot: -4 });
    return { pose: 'hold' };
  },
  calling(ctx) {
    const a = S('calling'), sv = at('serve', 'calling');
    sunburst(ctx, C.cx, C.cy - 60, 440, since(a, 0.4));
    stamp(ctx, 'YOUR', 'CALLING', C.cx, C.cy - 60, { scale: pop(a + 0.15), s: 84, rot: -4 });
    tag(ctx, 'SERVE OTHERS', C.cx + 30, C.cy + 170, { scale: pop(sv), rot: 5, s: 52, check: sv + 0.5 });
    return { pose: 'cheer', jump: jumpFrom(a) };
  },
  cta(ctx) {
    const a = S('cta'), ch = at('Christian', 'cta');
    if (card(ctx, C.cx, C.cy - 40, 660, 560, { rot: -2, scale: pop(a + 0.1) })) {
      serif(ctx, 'Send to…', -280, -200, { s: 48, align: 'left' }); ctx.fillStyle = '#e6e1d7'; ctx.fillRect(-300, -160, 600, 3);
      [['🙋', 'A Christian friend'], ['👷', 'Someone building something'], ['🧑‍🍳', 'Someone doubting their work']].forEach(([em, s], i) => {
        const y = -90 + i * 100; emoji(ctx, em, -250, y, 54); sans(ctx, s, -200, y, { w: 600, s: 30 });
        tick(ctx, 260, y, 22, i === 0 ? since(ch + 0.2, 0.25) : 0); });
      const k = pop(ch + 0.6);
      if (k) { ctx.save(); ctx.translate(0, 210); ctx.scale(k, k); rr(ctx, -150, -42, 300, 84, 42); ctx.fillStyle = RED; ctx.fill(); sans(ctx, 'Send', 0, 2, { w: 800, s: 34, c: '#fff', align: 'center' }); ctx.restore(); }
      ctx.restore(); }
    cursor(ctx, [[a + 0.6, C.cx + 380, C.cy + 400], [ch + 0.1, C.cx + 260, C.cy - 130, true], [ch + 0.7, C.cx + 40, C.cy + 170, true]], P.t);
    return { pose: 'phone' };
  },
};
paperFrame({ ORDER: ['hook', 'virtue', 'great', 'money', 'roof', 'bread', 'code', 'jesus', 'fame', 'faithful', 'calling', 'cta'], SCENES,
  punches: ['great', 'roof', 'bread', 'code', 'jesus', 'calling', () => at('not', 'hook')], title: ['AMBITION', "ISN'T A SIN", 76] });
