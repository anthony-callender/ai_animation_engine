// scene.js: ai-search-myths-reel (I-009), paper collage, built on _templates/reel-paper/paper-kit.js.
// Every claim comes from _shared/research/geo-for-churches.md. Framed as myths you'll hear, never as "what agencies sell".
const C = STAGE;
function mythStamp(ctx, n, a) { stamp(ctx, 'MYTH ' + n, '', C.cx - 200, C.cy - 400, { scale: pop(a), s: 60, rot: -4 }); }
const SCENES = {
  hook(ctx) {
    stamp(ctx, '3 MYTHS', '', C.cx, C.cy - 330, { scale: pop(0.2), s: 80, rot: -4 });
    [['llms.txt', -8, -80], ['AI LANGUAGE', 4, 110], ['GUARANTEED #1', -3, 300]].forEach(([s, rot, dy], i) => {
      if (card(ctx, C.cx + Math.sin(P.t * 2 + i) * 4, C.cy + dy, 600, 160, { rot, scale: pop(0.6 + i * 0.35) })) { serif(ctx, s, 0, 4, { s: 54 }); ctx.restore(); }
    });
    return { pose: 'point' };
  },
  m1(ctx) {
    const a = S('m1'), f = at('llms.txt', 'm1'), u = at('use', 'm1'), h = at('help', 'm1'), hu = at('hurt', 'm1');
    if (card(ctx, C.cx, C.cy - 120, 620, 240, { rot: -4, scale: pop(f - 0.3) })) {
      ctx.font = MONO(56); ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('llms.txt', 0, -24);
      sans(ctx, '(for Google)', 0, 50, { w: 500, s: 30, c: '#7a746b', align: 'center' }); ctx.restore(); }
    redX(ctx, C.cx, C.cy - 120, 260, pop(u, 0.25));
    tag(ctx, "DOESN'T HELP", C.cx - 120, C.cy + 180, { scale: pop(h), rot: -5 });
    tag(ctx, "DOESN'T HURT", C.cx + 120, C.cy + 300, { scale: pop(hu), rot: 4 });
    mythStamp(ctx, 1, a);
    return { pose: P.t < u ? 'point' : 'think' };
  },
  m2(ctx) {
    const a = S('m2'), sp = at('special', 'm2'), no = at('no', 'm2'), len = at('length', 'm2'), mg = at('magic', 'm2');
    if (card(ctx, C.cx, C.cy - 160, 660, 220, { rot: 3, scale: pop(sp - 0.3), fill: '#f4ecff' })) { serif(ctx, '✨ Special AI language ✨', 0, 4, { s: 46 }); ctx.restore(); }
    redX(ctx, C.cx, C.cy - 160, 260, pop(no, 0.25));
    if (card(ctx, C.cx, C.cy + 90, 620, 150, { rot: -2, scale: pop(len - 0.6) })) {  // a ruler: "ideal page length?"
      ctx.fillStyle = GOLD; rr(ctx, -270, -40, 540, 50, 8); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
      for (let i = 0; i <= 20; i++) { ctx.beginPath(); ctx.moveTo(-260 + i * 26, -40); ctx.lineTo(-260 + i * 26, i % 5 ? -24 : -12); ctx.stroke(); }
      sans(ctx, 'ideal page length?', 0, 42, { w: 700, s: 30, align: 'center' }); ctx.restore(); }
    tag(ctx, 'NO IDEAL LENGTH', C.cx - 60, C.cy + 260, { scale: pop(len + 0.1), rot: -4 });
    tag(ctx, 'NO MAGIC PHRASING', C.cx + 60, C.cy + 380, { scale: pop(mg + 0.1), rot: 4 });
    mythStamp(ctx, 2, a);
    return { pose: P.t < no ? 'point' : 'think' };
  },
  m3(ctx) {
    const a = S('m3'), g = at('guarantee', 'm3'), ct = at('controls', 'm3'), w = at('warns', 'm3');
    sunburst(ctx, C.cx, C.cy - 80, 300, since(g, 0.4) * (P.t < ct ? 0.8 : 0.3));
    const shake = P.t > ct && P.t < ct + 0.6 ? Math.sin(P.t * 30) * 4 : 0;
    if (card(ctx, C.cx + shake, C.cy - 80, 620, 300, { rot: -3, scale: pop(g - 0.2), fill: GOLD })) {
      serif(ctx, 'GUARANTEED', 0, -60, { s: 62 }); serif(ctx, '#1 IN CHATGPT', 0, 20, { s: 62 }); sans(ctx, '★ 100% promise ★', 0, 90, { w: 800, s: 28, align: 'center' }); ctx.restore(); }
    redX(ctx, C.cx, C.cy - 80, 360, pop(ct, 0.25));
    popWord(ctx, 'NOBODY', C.cx - 40, C.cy + 170, { s: 84, scale: pop(ct + 0.3, 0.3), rot: -4 });
    popWord(ctx, 'CONTROLS IT', C.cx - 10, C.cy + 270, { s: 84, scale: pop(ct + 0.5, 0.3), rot: -3 });
    tag(ctx, 'GOOGLE WARNS ABOUT THIS', C.cx - 20, C.cy + 390, { scale: pop(w), rot: 3, check: w + 0.5 });
    mythStamp(ctx, 3, a);
    return { pose: P.t < ct ? 'point' : 'think' };
  },
  works(ctx) {
    const a = S('works'), seo = at('SEO', 'works');
    if (card(ctx, C.cx, C.cy - 40, 760, 560, { scale: pop(a + 0.2), rot: -1.5 })) {
      sans(ctx, 'Google Search Central · May 2026', -330, -220, { w: 700, s: 26, c: '#6a655d' });
      ctx.font = SERIF(46); const hx = ctx.measureText('thus ').width, hw = ctx.measureText('still SEO.').width;
      highlight(ctx, -334 + hx, 92, hw + 8, 58, since(seo - 0.3, 0.5));
      ['"optimizing for generative', 'AI search is optimizing for', 'the search experience, and', 'thus still SEO."'].forEach((l, i) => serif(ctx, l, -330, -130 + i * 74, { s: 46, align: 'left', c: INK }));
      ctx.restore(); }
    popWord(ctx, 'STILL SEO', C.cx - 40, C.cy + 360, { s: 100, scale: pop(seo + 0.1, 0.3), rot: -4 });
    return { pose: 'point' };
  },
  do(ctx) {
    const a = S('do'), ts = [at('findable', 'do'), at('Profile', 'do'), at('questions', 'do')];
    if (card(ctx, C.cx, C.cy - 20, 720, 560, { rot: -1, scale: pop(a) })) {
      serif(ctx, 'What actually works', 0, -200, { s: 46 });
      ['Be findable', 'Complete your Business Profile', 'Answer the questions families ask'].forEach((s, i) => {
        const y = -90 + i * 110; highlight(ctx, -270, y, 0, 46, 0);
        tick(ctx, -280, y, 26, since(ts[i], 0.25)); sans(ctx, s, -236, y, { w: 700, s: 32, c: P.t >= ts[i] ? INK : '#9a948a' }); });
      ctx.restore(); }
    sunburst(ctx, C.cx + 260, C.cy - 320, 120, since(ts[2] + 0.4, 0.3) * 0.6);
    tag(ctx, 'NO TRICKS', C.cx + 230, C.cy - 320, { scale: pop(ts[2] + 0.4), rot: 8, bg: GOLD });
    return { pose: 'cheer', jump: P.t < a + 1 ? Math.abs(Math.sin((P.t - a) * 5)) * since(a, 0.2) : 0 };
  },
  cta(ctx) {
    const a = S('cta'), cm = at('Comment', 'cta'), fd = at('FOUND', 'cta');
    sunburst(ctx, C.cx, C.cy - 60, 380, since(a + 0.2, 0.5) * 0.6);
    if (card(ctx, C.cx, C.cy - 60, 640, 560, { rot: -2, scale: pop(a + 0.1) })) {
      serif(ctx, 'Get your church found', 0, -210, { s: 44 }); sans(ctx, '5-step checklist · free', 0, -160, { w: 600, s: 26, c: '#7a746b', align: 'center' });
      ['Make sure AI can find you', 'Complete your Business Profile', 'Answer real questions', 'Post what only you have', 'Earn real reviews'].forEach((s, i) => {
        tick(ctx, -250, -90 + i * 66, 18, since(a + 0.6 + i * 0.25, 0.2)); sans(ctx, s, -215, -90 + i * 66, { w: 600, s: 27 }); });
      ctx.restore(); }
    tag(ctx, 'FREE', C.cx + 280, C.cy - 330, { scale: pop(a + 1.2), rot: 10, bg: GOLD });
    const k = pop(cm - 0.2);
    if (k) { ctx.save(); ctx.translate(C.cx, C.cy + 330); ctx.scale(k, k);
      rr(ctx, -400, -58, 800, 116, 58); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      const n = Math.floor(clamp01((P.t - fd + 0.3) / 0.5) * 5), s = 'FOUND'.slice(0, n);
      sans(ctx, s || 'Add a comment…', -350, 2, { w: s ? 800 : 500, s: 42, c: s ? INK : '#9a948a' });
      ctx.save(); ctx.translate(305, 0); rr(ctx, -75, -40, 150, 80, 40); ctx.fillStyle = RED; ctx.fill(); sans(ctx, 'Post', 0, 2, { w: 800, s: 32, c: '#fff', align: 'center' }); ctx.restore();
      ctx.restore(); }
    cursor(ctx, [[a + 1, C.cx + 380, C.cy + 520], [fd + 0.4, C.cx + 300, C.cy + 330, true]], P.t);
    return { pose: 'point' };
  },
};
paperFrame({ ORDER: ['hook', 'm1', 'm2', 'm3', 'works', 'do', 'cta'], SCENES,
  punches: ['m1', 'm2', 'm3', 'works', () => at('use', 'm1'), () => at('controls', 'm3'), () => at('SEO', 'works')],
  title: ['3 MYTHS ABOUT GETTING', 'YOUR CHURCH FOUND BY AI', 58], label: 'Sources: Google Search Central, OpenAI docs' });
