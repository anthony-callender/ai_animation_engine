// looks.js - more looks for the same picture (clean and modern, and a blueprint), plus the icons every look shares.
// Load after desk.js. Everything draws on a full-resolution canvas (g.photo.ctx) in real px, as pure functions of
// what you pass in, so a style wipe (Desk.seam) can carry one picture from look to look. Reference: _shared/desk.md.
// Fonts: Inter, JetBrains Mono and Caveat from Google Fonts (index.html).
//
// Icons: Lucide, https://lucide.dev. ISC License, Copyright (c) 2026 Lucide Icons and Contributors.
// Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby
// granted, provided that the above copyright notice and this permission notice appear in all copies.
window.Looks = (() => {
  const ICONS = {
    "mic": "M12 19v3 M19 10v2a7 7 0 0 1-14 0v-2 M12 2H12a3 3 0 0 1 3 3V12a3 3 0 0 1 -3 3H12a3 3 0 0 1 -3 -3V5a3 3 0 0 1 3 -3Z",
    "captions": "M5 5H19a2 2 0 0 1 2 2V17a2 2 0 0 1 -2 2H5a2 2 0 0 1 -2 -2V7a2 2 0 0 1 2 -2Z M7 15h4M15 15h2M7 11h2M13 11h4",
    "clapperboard": "M12.296 3.464 l3.02 3.956 M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M6.18 5.276 l3.1 3.899",
    "code-xml": "M18 16 l4 -4 -4 -4 M6 8 l-4 4 4 4 M14.5 4 l-5 16",
    "film": "M5 3H19a2 2 0 0 1 2 2V19a2 2 0 0 1 -2 2H5a2 2 0 0 1 -2 -2V5a2 2 0 0 1 2 -2Z M7 3v18 M3 7.5h4 M3 12h18 M3 16.5h4 M17 3v18 M17 7.5h4 M17 16.5h4",
    "folder": "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
    "file-text": "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z M14 2v5a1 1 0 0 0 1 1h5 M10 9H8 M16 13H8 M16 17H8",
    "check": "M20 6 9 17l-5-5",
    "play": "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",
    "layout-grid": "M4 3H9a1 1 0 0 1 1 1V9a1 1 0 0 1 -1 1H4a1 1 0 0 1 -1 -1V4a1 1 0 0 1 1 -1Z M15 3H20a1 1 0 0 1 1 1V9a1 1 0 0 1 -1 1H15a1 1 0 0 1 -1 -1V4a1 1 0 0 1 1 -1Z M15 14H20a1 1 0 0 1 1 1V20a1 1 0 0 1 -1 1H15a1 1 0 0 1 -1 -1V15a1 1 0 0 1 1 -1Z M4 14H9a1 1 0 0 1 1 1V20a1 1 0 0 1 -1 1H4a1 1 0 0 1 -1 -1V15a1 1 0 0 1 1 -1Z",
    "list": "M3 5h.01 M3 12h.01 M3 19h.01 M8 5h13 M8 12h13 M8 19h13",
    "search": "M21 21 l-4.34 -4.34 M3 11a8 8 0 1 0 16 0a8 8 0 1 0 -16 0"
  };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const hash = (i, s = 1) => { let h = Math.imul(i ^ Math.imul(s, 0x27d4eb2d), 0x165667b1); h ^= h >>> 15; h = Math.imul(h, 0x85ebca77); return ((h ^ (h >>> 13)) >>> 0) / 4294967296; };
  ['400 32px "Inter"', '600 32px "Inter"', '700 32px "Inter"', '800 32px "Inter"', '400 32px "JetBrains Mono"', '600 32px "JetBrains Mono"', '600 32px "Caveat"']
    .forEach((f) => P.wait(document.fonts.load(f).catch(() => {})));
  // Something arriving: 0..1 with a soft overshoot that settles.
  const spring = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-6 * x) * Math.cos(8 * x) * (1 - x * 0.2));

  // ── icons ─────────────────────────────────────────────────────────────────
  const P2 = {};
  const path2d = (n) => P2[n] || (P2[n] = new Path2D(ICONS[n] || ''));
  // Crisp, centred at (cx, cy), size px wide. o: color, lw (in icon units; Lucide's own is 2), alpha
  function icon(ctx, name, cx, cy, size = 32, o = {}) {
    ctx.save(); ctx.translate(cx - size / 2, cy - size / 2); ctx.scale(size / 24, size / 24);
    ctx.lineWidth = o.lw ?? 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = o.color || '#fff';
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    ctx.stroke(path2d(name)); ctx.restore();
  }
  // The same icon as polylines (icon units, centred on 0), for the hand-drawn and plotted looks. Sampled once.
  const ST = {};
  function strokes(name) {
    if (ST[name]) return ST[name];
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'), p = document.createElementNS(NS, 'path');
    Object.assign(svg.style, { position: 'absolute', width: '0px', height: '0px', overflow: 'hidden' });
    p.setAttribute('d', ICONS[name] || 'M0 0'); svg.appendChild(p); document.body.appendChild(svg);
    const L = p.getTotalLength(), n = Math.max(8, Math.ceil(L * 3)), out = [];
    let cur = [], prev = null;
    for (let i = 0; i <= n; i++) {
      const q = p.getPointAtLength((i / n) * L), pt = [q.x - 12, q.y - 12];
      if (prev && Math.hypot(pt[0] - prev[0], pt[1] - prev[1]) > 1.2) { if (cur.length > 1) out.push(cur); cur = []; }
      cur.push(pt); prev = pt;
    }
    if (cur.length > 1) out.push(cur);
    svg.remove();
    return (ST[name] = out);
  }
  // The same icon on an n x n pixel grid, for the pixel look: [x, y] cells to fill. Rasterised once.
  const CE = {};
  function cells(name, n = 14) {
    const key = name + ':' + n;
    if (CE[key]) return CE[key];
    const cv = document.createElement('canvas'); cv.width = cv.height = n;
    const c = cv.getContext('2d');
    c.scale(n / 24, n / 24); c.lineWidth = 2.6; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#000'; c.stroke(path2d(name));
    const d = c.getImageData(0, 0, n, n).data, out = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (d[(y * n + x) * 4 + 3] > 96) out.push([x, y]);
    return (CE[key] = out);
  }

  // ── clean and modern ──────────────────────────────────────────────────────
  const M = {
    ink: '#1C1917', dim: '#78716C', faint: '#A8A29E', line: '#D6CCC1',
    font: '"Inter", "Segoe UI", system-ui, sans-serif', mono: '"JetBrains Mono", "Cascadia Mono", Consolas, monospace',
    grads: [['#FF8A65', '#F4511E'], ['#FFC857', '#EF9B1A'], ['#3DD598', '#12A06B'], ['#6AA8FF', '#2F6FE0'], ['#A78BFA', '#7048E8']],
  };
  // A warm paper white with slow colour blooms drifting, and a faint dot grid.
  M.bg = (ctx, T = 0) => {
    const W = ctx.canvas.width, H = ctx.canvas.height, g0 = ctx.createLinearGradient(0, 0, W, H);
    g0.addColorStop(0, '#FCF8F3'); g0.addColorStop(1, '#F1E8DE');
    ctx.fillStyle = g0; ctx.fillRect(0, 0, W, H);
    [[0.84, 0.14, 0.34, '255,168,128', 0.5, 0.05], [0.1, 0.94, 0.3, '184,168,248', 0.45, 0.04], [0.6, 1.02, 0.22, '126,212,182', 0.38, 0.06], [0.36, 0.02, 0.2, '255,208,138', 0.38, 0.045]]
      .forEach(([x, y, r, rgb, a, sp], i) => {
        const cx = (x + Math.sin(T * sp * 6.283 + i * 1.7) * 0.04) * W, cy = (y + Math.cos(T * sp * 6.283 + i) * 0.05) * H, R = r * W;
        const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
        gr.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
        ctx.fillStyle = gr; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      });
    ctx.fillStyle = 'rgba(28,25,23,0.035)';
    for (let y = 20; y < H; y += 40) for (let x = 20; x < W; x += 40) ctx.fillRect(x, y, 2, 2);
  };
  // A headline with one gradient word. parts: [plain, accent]. o: size. y is the baseline.
  M.title = (ctx, parts, cx, y, o = {}) => {
    const size = o.size ?? 72;
    ctx.save(); ctx.font = '800 ' + size + 'px ' + M.font; ctx.textBaseline = 'alphabetic'; ctx.letterSpacing = (-size * 0.025) + 'px';
    const wa = ctx.measureText(parts[0]).width, wb = ctx.measureText(parts[1] || '').width, x0 = cx - (wa + wb) / 2;
    ctx.fillStyle = M.ink; ctx.fillText(parts[0], x0, y);
    if (parts[1]) { const tg = ctx.createLinearGradient(x0 + wa, 0, x0 + wa + wb, 0); tg.addColorStop(0, '#FF6A3D'); tg.addColorStop(1, '#FFB547'); ctx.fillStyle = tg; ctx.fillText(parts[1], x0 + wa, y); }
    ctx.restore();
  };
  // A card: a gradient icon disc, a name, a line under it. o: icon, name, sub, num, grad, lit 0..1, enter 0..1, float (px)
  M.card = (ctx, cx, cy, w, h, o = {}) => {
    const e = o.enter ?? 1;
    if (e <= 0) return;
    const lit = clamp(o.lit ?? 0), grad = o.grad || M.grads[0], a = clamp(e * 1.6);
    const y = cy + (1 - spring(e)) * 34 + (o.float ?? 0) - lit * 8, k = 0.95 + 0.05 * spring(e);
    const rr = () => { ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 28); };
    ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, y); ctx.scale(k, k);
    ctx.shadowColor = 'rgba(70,45,20,' + (0.1 + 0.07 * lit) + ')'; ctx.shadowBlur = 44 + 18 * lit; ctx.shadowOffsetY = 18 + 8 * lit;
    rr(); ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.shadowColor = 'rgba(0,0,0,0.05)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1; rr(); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(28,25,23,0.07)'; rr(); ctx.stroke();
    if (lit > 0) {
      const lg = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); lg.addColorStop(0, grad[0]); lg.addColorStop(1, grad[1]);
      ctx.globalAlpha = a * lit; ctx.lineWidth = 3; ctx.strokeStyle = lg; rr(); ctx.stroke(); ctx.globalAlpha = a;
    }
    const iy = -h / 2 + 74, dg = ctx.createLinearGradient(-38, iy - 38, 38, iy + 38);
    dg.addColorStop(0, grad[0]); dg.addColorStop(1, grad[1]);
    ctx.shadowColor = grad[1] + '55'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8;
    ctx.beginPath(); ctx.arc(0, iy, 38, 0, 7); ctx.fillStyle = dg; ctx.fill(); ctx.shadowColor = 'transparent';
    const hl = ctx.createRadialGradient(-12, iy - 18, 2, -12, iy - 18, 42);
    hl.addColorStop(0, 'rgba(255,255,255,0.38)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl; ctx.beginPath(); ctx.arc(0, iy, 38, 0, 7); ctx.fill();
    if (o.icon) icon(ctx, o.icon, 0, iy, 36, { color: '#fff', lw: 2.1 });
    ctx.textBaseline = 'alphabetic';
    if (o.num) { ctx.textAlign = 'left'; ctx.font = '600 15px ' + M.mono; ctx.fillStyle = M.faint; ctx.fillText(o.num, -w / 2 + 20, -h / 2 + 30); }
    ctx.textAlign = 'center'; ctx.font = '700 30px ' + M.font; ctx.letterSpacing = '-0.4px'; ctx.fillStyle = M.ink; ctx.fillText(o.name || '', 0, iy + 84);
    ctx.font = '400 18px ' + M.mono; ctx.letterSpacing = '0px'; ctx.fillStyle = M.dim; ctx.fillText(o.sub || '', 0, iy + 118);
    ctx.restore();
  };
  // The link between two cards: a dotted line flowing forward, and a chevron.
  M.link = (ctx, x0, x1, y, T = 0, o = {}) => {
    ctx.save(); ctx.strokeStyle = o.color || M.line; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.setLineDash([0.1, 11]); ctx.lineDashOffset = -T * 34;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1 - 12, y); ctx.stroke();
    ctx.setLineDash([]); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x1 - 13, y - 8); ctx.lineTo(x1 - 4, y); ctx.lineTo(x1 - 13, y + 8); ctx.stroke();
    ctx.restore();
  };
  // A file travelling the pipeline: a glowing dot with a short trail. o: color (#rrggbb), dir, alpha
  M.packet = (ctx, x, y, o = {}) => {
    const a = clamp(o.alpha ?? 1), c = o.color || M.grads[0][1], dir = o.dir ?? 1;
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    for (let k = 5; k >= 1; k--) { ctx.beginPath(); ctx.arc(x - dir * k * 10, y, 7 - k, 0, 7); ctx.fillStyle = c + Math.round(70 - k * 11).toString(16).padStart(2, '0'); ctx.fill(); }
    const gl = ctx.createRadialGradient(x, y, 0, x, y, 34); gl.addColorStop(0, c + '99'); gl.addColorStop(1, c + '00');
    ctx.fillStyle = gl; ctx.fillRect(x - 34, y - 34, 68, 68);
    ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = c; ctx.stroke();
    ctx.restore();
  };
  // A caption on a dark frosted pill; n = characters shown.
  M.caption = (ctx, text, n, cx, y, o = {}) => {
    ctx.save(); ctx.font = '600 28px ' + M.font; ctx.letterSpacing = '-0.2px';
    const tw = Math.min(o.max ?? 1500, ctx.measureText(text).width);
    ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; ctx.fillStyle = 'rgba(28,25,23,0.9)';
    ctx.beginPath(); ctx.roundRect(cx - tw / 2 - 32, y - 32, tw + 64, 64, 32); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#FFFFFF'; ctx.textBaseline = 'middle'; ctx.fillText(text.slice(0, Math.floor(n)), cx - tw / 2, y + 1);
    ctx.restore();
  };
  // The host, flat and friendly: Doug, with his headset, white shirt and tie. (x, foot) = where his feet meet the floor.
  // o: T (he breathes and blinks), pose ('present' reaches toward the right, or 'idle')
  M.host = (ctx, x, foot, o = {}) => {
    const T = o.T ?? 0, b = Math.sin(T * 2.1) * 2.2, blink = T % 3.7 < 0.12, pres = o.pose !== 'idle';
    const skin = '#EDB997', skinD = '#D99C78', shirt = '#FFFFFF', shirtD = '#ECE4DB', dark = '#1C1917', set = '#57534E';
    ctx.save(); ctx.translate(x, foot); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.save(); ctx.scale(1, 0.18);
    const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, 96); sh.addColorStop(0, 'rgba(70,45,20,0.24)'); sh.addColorStop(1, 'rgba(70,45,20,0)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(0, 0, 96, 0, 7); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#2B3957'; ctx.beginPath(); ctx.roundRect(-40, -156, 36, 150, 16); ctx.roundRect(4, -156, 36, 150, 16); ctx.fill();
    ctx.fillStyle = dark; ctx.beginPath(); ctx.roundRect(-48, -16, 46, 17, 8); ctx.roundRect(2, -16, 46, 17, 8); ctx.fill();
    ctx.translate(0, b);
    ctx.strokeStyle = shirtD; ctx.lineWidth = 32; ctx.beginPath(); ctx.moveTo(-56, -266); ctx.quadraticCurveTo(-80, -212, -72, -166); ctx.stroke();
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(-72, -154, 15, 0, 7); ctx.fill();
    const tg = ctx.createLinearGradient(-72, 0, 72, 0); tg.addColorStop(0, shirt); tg.addColorStop(1, shirtD);
    ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(-72, -262); ctx.quadraticCurveTo(-74, -294, -40, -298); ctx.lineTo(40, -298);
    ctx.quadraticCurveTo(74, -294, 72, -262); ctx.lineTo(62, -156); ctx.quadraticCurveTo(0, -148, -62, -156); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(28,25,23,0.08)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = dark; ctx.beginPath(); ctx.roundRect(-62, -166, 124, 10, 4); ctx.fill();
    ctx.fillStyle = shirtD; ctx.beginPath(); ctx.moveTo(-22, -298); ctx.lineTo(0, -276); ctx.lineTo(22, -298); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6B2D38'; ctx.beginPath(); ctx.moveTo(-9, -286); ctx.lineTo(9, -286); ctx.lineTo(7, -272); ctx.lineTo(-7, -272); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-7, -272); ctx.lineTo(7, -272); ctx.lineTo(14, -196); ctx.lineTo(0, -178); ctx.lineTo(-14, -196); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shirt; ctx.lineWidth = 32; ctx.beginPath(); ctx.moveTo(56, -268);
    if (pres) ctx.quadraticCurveTo(116, -228, 146, -262); else ctx.quadraticCurveTo(82, -214, 72, -166);
    ctx.stroke(); ctx.strokeStyle = 'rgba(28,25,23,0.07)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = skin; ctx.beginPath();
    if (pres) { ctx.ellipse(160, -270, 17, 14, -0.5, 0, 7); ctx.moveTo(158, -284); ctx.arc(152, -286, 6, 0, 7); } else ctx.arc(72, -154, 16, 0, 7);
    ctx.fill();
    ctx.fillStyle = skinD; ctx.fillRect(-14, -316, 28, 22);
    const hy = -370, hg = ctx.createRadialGradient(-18, hy - 22, 8, 0, hy, 66);
    hg.addColorStop(0, '#F6CDAB'); hg.addColorStop(1, skin);
    ctx.fillStyle = skinD; ctx.beginPath(); ctx.arc(-60, hy + 6, 12, 0, 7); ctx.arc(60, hy + 6, 12, 0, 7); ctx.fill();
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, hy, 60, 0, 7); ctx.fill();
    ctx.fillStyle = '#3A2620'; ctx.beginPath(); ctx.moveTo(-62, hy + 4); ctx.bezierCurveTo(-66, hy - 60, -20, hy - 80, 18, hy - 72);
    ctx.bezierCurveTo(54, hy - 64, 68, hy - 30, 62, hy - 2); ctx.bezierCurveTo(46, hy - 34, 10, hy - 46, -22, hy - 42);
    ctx.bezierCurveTo(-40, hy - 32, -52, hy - 16, -62, hy + 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = set; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, hy - 2, 68, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
    ctx.fillStyle = set; ctx.beginPath(); ctx.roundRect(56, hy - 16, 18, 36, 8); ctx.fill();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(64, hy + 18); ctx.quadraticCurveTo(58, hy + 44, 30, hy + 38); ctx.stroke();
    ctx.fillStyle = '#292524'; ctx.beginPath(); ctx.ellipse(27, hy + 38, 7, 5, 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = dark;
    if (blink) { ctx.fillRect(-26, hy + 2, 14, 3); ctx.fillRect(12, hy + 2, 14, 3); }
    else { ctx.beginPath(); ctx.ellipse(-19, hy + 2, 5.5, 7.5, 0, 0, 7); ctx.ellipse(19, hy + 2, 5.5, 7.5, 0, 0, 7); ctx.fill(); }
    ctx.strokeStyle = dark; ctx.lineWidth = 3.5; ctx.beginPath();
    ctx.moveTo(-28, hy - 15); ctx.quadraticCurveTo(-19, hy - 20, -10, hy - 15); ctx.moveTo(10, hy - 15); ctx.quadraticCurveTo(19, hy - 20, 28, hy - 15); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, hy + 16, 14, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.fillStyle = 'rgba(231,120,100,0.22)'; ctx.beginPath(); ctx.arc(-34, hy + 18, 10, 0, 7); ctx.arc(34, hy + 18, 10, 0, 7); ctx.fill();
    ctx.restore();
  };

  // ── a blueprint ───────────────────────────────────────────────────────────
  const B = { ink: 'rgba(238,247,255,0.96)', soft: 'rgba(238,247,255,0.55)', faint: 'rgba(238,247,255,0.14)', glow: 'rgba(150,210,255,0.9)',
    mono: M.mono, hand: '"Caveat", "Segoe Script", cursive' };
  let GRAIN = null;
  const grain = () => {
    if (GRAIN) return GRAIN;
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d'), d = x.createImageData(256, 256);
    for (let i = 0; i < 65536; i++) { const v = hash(i, 91); d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = 255; d.data[i * 4 + 3] = v < 0.1 ? 20 : v > 0.96 ? 12 : 0; }
    x.putImageData(d, 0, 0);
    return (GRAIN = c);
  };
  // Stroke a path the way a plotter draws it: p 0..1 of about len px of line.
  const plot = (ctx, draw, p = 1, len = 1000, lw = 2, c = B.ink) => {
    if (p <= 0) return;
    ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (p < 1) ctx.setLineDash([len * p, len * 2]);
    ctx.beginPath(); draw(); ctx.stroke(); ctx.restore();
  };
  B.plot = plot;
  // Prussian blue paper: a soft centre, grain, and a 24 px grid.
  B.bg = (ctx) => {
    const W = ctx.canvas.width, H = ctx.canvas.height, g0 = ctx.createRadialGradient(W * 0.55, H * 0.4, 80, W * 0.5, H * 0.5, W * 0.78);
    g0.addColorStop(0, '#1F5694'); g0.addColorStop(1, '#0A2A4E');
    ctx.fillStyle = g0; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = ctx.createPattern(grain(), 'repeat'); ctx.fillRect(0, 0, W, H);
    for (let x = 0; x <= W; x += 24) { ctx.fillStyle = x % 120 ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.11)'; ctx.fillRect(x, 0, 1, H); }
    for (let y = 0; y <= H; y += 24) { ctx.fillStyle = y % 120 ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.11)'; ctx.fillRect(0, y, W, 1); }
  };
  // The sheet's border with zone marks (8 to 1 across, A to D down).
  B.sheet = (ctx, p = 1) => {
    const W = ctx.canvas.width, H = ctx.canvas.height, m = 22, n = 40;
    plot(ctx, () => ctx.rect(m, m, W - 2 * m, H - 2 * m), p, 6000, 2.6);
    plot(ctx, () => ctx.rect(n, n, W - 2 * n, H - 2 * n), p, 6000, 1.1, B.soft);
    ctx.save(); ctx.globalAlpha = clamp(p * 2 - 1); ctx.fillStyle = B.soft; ctx.font = '500 13px ' + B.mono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < 8; i++) {
      const x = n + ((W - 2 * n) * (i + 0.5)) / 8;
      ctx.fillText(String(8 - i), x, (m + n) / 2); ctx.fillText(String(8 - i), x, H - (m + n) / 2);
      if (i) { const xi = n + ((W - 2 * n) * i) / 8; ctx.fillRect(xi, m, 1, n - m); ctx.fillRect(xi, H - n, 1, n - m); }
    }
    for (let j = 0; j < 4; j++) {
      const y = n + ((H - 2 * n) * (j + 0.5)) / 4;
      ctx.fillText('ABCD'[j], (m + n) / 2, y); ctx.fillText('ABCD'[j], W - (m + n) / 2, y);
      if (j) { const yj = n + ((H - 2 * n) * j) / 4; ctx.fillRect(m, yj, n - m, 1); ctx.fillRect(W - n, yj, n - m, 1); }
    }
    ctx.restore();
  };
  // Lettered title, double-ruled underneath. o: sub (a smaller line under it), p
  B.title = (ctx, text, cx, y, o = {}) => {
    const p = o.p ?? 1;
    ctx.save(); ctx.globalAlpha = clamp(p * 1.6); ctx.fillStyle = B.ink; ctx.font = '600 40px ' + B.mono; ctx.letterSpacing = '6px';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(text, cx, y);
    const w = ctx.measureText(text).width / 2 + 20;
    if (o.sub) { ctx.font = '500 16px ' + B.mono; ctx.letterSpacing = '4px'; ctx.fillStyle = B.soft; ctx.fillText(o.sub, cx, y + 58); }
    ctx.restore();
    plot(ctx, () => { ctx.moveTo(cx - w, y + 18); ctx.lineTo(cx + w, y + 18); ctx.moveTo(cx - w, y + 25); ctx.lineTo(cx + w, y + 25); }, p, 4 * w, 1.4);
  };
  // A centre line (long dash, dot) drawn out to p.
  B.center = (ctx, x0, x1, y, p = 1) => {
    if (p <= 0) return;
    ctx.save(); ctx.strokeStyle = B.soft; ctx.lineWidth = 1.2; ctx.setLineDash([26, 6, 5, 6]);
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + (x1 - x0) * p, y); ctx.stroke(); ctx.restore();
  };
  // An icon plotted with the pen (the same Lucide icon as the other looks).
  B.icon = (ctx, name, cx, cy, size = 40, p = 1, lw = 2) => {
    const s = size / 24, lines = strokes(name);
    plot(ctx, () => lines.forEach((l) => l.forEach(([x, y], i) => (i ? ctx.lineTo(cx + x * s, cy + y * s) : ctx.moveTo(cx + x * s, cy + y * s)))), p, 240 * s, lw);
  };
  // A part: double outline, its icon, its name, a numbered balloon. o: icon, name, num, lit 0..1, p
  B.box = (ctx, cx, cy, w, h, o = {}) => {
    const p = o.p ?? 1, lit = clamp(o.lit ?? 0);
    if (lit > 0) { ctx.save(); ctx.globalAlpha = lit; ctx.shadowColor = B.glow; ctx.shadowBlur = 24; plot(ctx, () => ctx.rect(cx - w / 2, cy - h / 2, w, h), 1, 1, 2.6); ctx.restore(); }
    plot(ctx, () => ctx.rect(cx - w / 2, cy - h / 2, w, h), p, 2 * (w + h), 2.4);
    plot(ctx, () => ctx.rect(cx - w / 2 + 7, cy - h / 2 + 7, w - 14, h - 14), p, 2 * (w + h), 1, B.soft);
    if (o.icon) B.icon(ctx, o.icon, cx, cy - 20, 42, clamp(p * 1.4 - 0.3), 2);
    ctx.save(); ctx.globalAlpha = clamp(p * 2 - 1); ctx.fillStyle = B.ink; ctx.font = '600 22px ' + B.mono; ctx.letterSpacing = '2px';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText((o.name || '').toUpperCase(), cx, cy + 40); ctx.restore();
    if (o.num) {
      const bx = cx - w / 2 - 26, by = cy - h / 2 - 28;
      plot(ctx, () => { ctx.arc(bx, by, 19, 0, 7); }, p, 130, 1.8);
      plot(ctx, () => { ctx.moveTo(bx + 14, by + 13); ctx.lineTo(cx - w / 2 + 12, cy - h / 2 + 12); }, p, 60, 1.2, B.soft);
      ctx.save(); ctx.globalAlpha = clamp(p * 2 - 1); ctx.fillStyle = B.ink; ctx.font = '600 16px ' + B.mono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(o.num, bx, by + 1); ctx.restore();
    }
  };
  // A leader from a point to a note. o: p, align, dy (text offset from the leader's end)
  B.leader = (ctx, x0, y0, x1, y1, text, o = {}) => {
    const p = o.p ?? 1;
    plot(ctx, () => { ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); }, p, Math.hypot(x1 - x0, y1 - y0) + 10, 1.3, B.soft);
    ctx.save(); ctx.globalAlpha = clamp(p * 2 - 1); ctx.fillStyle = B.ink; ctx.beginPath(); ctx.arc(x0, y0, 3.5, 0, 7); ctx.fill();
    ctx.font = '500 17px ' + B.mono; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x1, y1 + (o.dy ?? 16)); ctx.restore();
  };
  // A dimension: extension lines, arrows both ends, the size written over it. o: p, ext (above the line), down (below it, to the part)
  B.dim = (ctx, x0, x1, y, text, o = {}) => {
    const p = o.p ?? 1, ext = o.ext ?? 10, down = o.down ?? 6;
    plot(ctx, () => { ctx.moveTo(x0, y - ext); ctx.lineTo(x0, y + down); ctx.moveTo(x1, y - ext); ctx.lineTo(x1, y + down); ctx.moveTo(x0, y); ctx.lineTo(x1, y); }, p, 2 * (ext + down) + (x1 - x0) + 30, 1.2, B.soft);
    ctx.save(); ctx.globalAlpha = clamp(p * 2 - 1); ctx.fillStyle = B.soft;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 14, y - 5); ctx.lineTo(x0 + 14, y + 5); ctx.closePath();
    ctx.moveTo(x1, y); ctx.lineTo(x1 - 14, y - 5); ctx.lineTo(x1 - 14, y + 5); ctx.closePath(); ctx.fill();
    ctx.font = '500 15px ' + B.mono; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(text, (x0 + x1) / 2, y - 8); ctx.restore();
  };
  // An arrow along the centre line.
  B.arrow = (ctx, x0, x1, y, p = 1) => {
    plot(ctx, () => { ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.moveTo(x1 - 14, y - 7); ctx.lineTo(x1, y); ctx.lineTo(x1 - 14, y + 7); }, p, (x1 - x0) + 40, 2);
  };
  // The host as a drawing: Doug in outline, a centre mark on his head, his height dimensioned, a callout.
  B.host = (ctx, x, foot, o = {}) => {
    const p = o.p ?? 1, hy = foot - 370;
    plot(ctx, () => { ctx.arc(x, hy, 60, 0, 7); }, p, 400, 2.4);
    plot(ctx, () => { ctx.moveTo(x - 10, hy); ctx.lineTo(x + 10, hy); ctx.moveTo(x, hy - 10); ctx.lineTo(x, hy + 10); }, p, 50, 1, B.soft);
    plot(ctx, () => { ctx.arc(x, hy - 2, 68, Math.PI * 1.08, Math.PI * 1.92); ctx.moveTo(x + 56, hy - 16); ctx.rect(x + 56, hy - 16, 18, 36);
      ctx.moveTo(x + 64, hy + 18); ctx.quadraticCurveTo(x + 58, hy + 44, x + 30, hy + 38); }, p, 500, 1.8);
    plot(ctx, () => { ctx.moveTo(x - 72, foot - 262); ctx.quadraticCurveTo(x - 74, foot - 294, x - 40, foot - 298); ctx.lineTo(x + 40, foot - 298);
      ctx.quadraticCurveTo(x + 74, foot - 294, x + 72, foot - 262); ctx.lineTo(x + 62, foot - 156); ctx.lineTo(x - 62, foot - 156); ctx.closePath(); }, p, 900, 2.4);
    plot(ctx, () => { ctx.moveTo(x - 7, foot - 272); ctx.lineTo(x + 7, foot - 272); ctx.lineTo(x + 14, foot - 196); ctx.lineTo(x, foot - 178); ctx.lineTo(x - 14, foot - 196); ctx.closePath(); }, p, 260, 1.6);
    plot(ctx, () => { ctx.moveTo(x + 56, foot - 268); ctx.quadraticCurveTo(x + 116, foot - 228, x + 146, foot - 262); ctx.moveTo(x - 56, foot - 266); ctx.quadraticCurveTo(x - 80, foot - 212, x - 72, foot - 170);
      ctx.moveTo(x + 177, foot - 270); ctx.ellipse(x + 160, foot - 270, 17, 14, -0.5, 0, 7); ctx.moveTo(x - 57, foot - 154); ctx.arc(x - 72, foot - 154, 15, 0, 7); }, p, 600, 2.4);
    plot(ctx, () => { ctx.rect(x - 40, foot - 156, 36, 150); ctx.rect(x + 4, foot - 156, 36, 150); }, p, 800, 2.2);
    plot(ctx, () => { ctx.moveTo(x - 124, foot); ctx.lineTo(x - 124, hy - 60); ctx.moveTo(x - 136, foot); ctx.lineTo(x - 90, foot); ctx.moveTo(x - 136, hy - 60); ctx.lineTo(x - 90, hy - 60); }, p, 700, 1.1, B.soft);
    ctx.save(); ctx.globalAlpha = clamp(p * 2 - 1); ctx.fillStyle = B.soft; ctx.translate(x - 138, (foot + hy - 60) / 2); ctx.rotate(-Math.PI / 2);
    ctx.font = '500 15px ' + B.mono; ctx.textAlign = 'center'; ctx.fillText('HOST, 1:1', 0, 0); ctx.restore();
    B.leader(ctx, x + 44, hy - 44, x + 150, hy - 120, 'HOST: DOUG', { p, dy: -16 });
  };
  // Title block: the fields a drawing carries, with the checker's name signed by hand.
  // f: title, drawn, checked, date, dwg, scale, sheet. o: p
  B.titleBlock = (ctx, x, y, w, h, f = {}, o = {}) => {
    const p = o.p ?? 1, r1 = y + h * 0.36, r2 = y + h * 0.68, c1 = x + w * 0.5, c2 = x + w * 0.75;
    plot(ctx, () => { ctx.rect(x, y, w, h); ctx.moveTo(x, r1); ctx.lineTo(x + w, r1); ctx.moveTo(x, r2); ctx.lineTo(x + w, r2);
      ctx.moveTo(c1, r1); ctx.lineTo(c1, y + h); ctx.moveTo(c2, r1); ctx.lineTo(c2, y + h); }, p, 3000, 2);
    ctx.save(); ctx.globalAlpha = clamp(p * 2 - 1); ctx.textBaseline = 'alphabetic';
    const lab = (s, lx, ly) => { ctx.fillStyle = B.soft; ctx.font = '500 12px ' + B.mono; ctx.fillText(s, lx + 10, ly + 17); };
    const val = (s, lx, ly, hand) => { ctx.fillStyle = B.ink; ctx.font = hand ? '600 32px ' + B.hand : '600 19px ' + B.mono; ctx.fillText(s, lx + 10, ly + (hand ? 47 : 42)); };
    lab('TITLE', x, y); val(f.title || '', x, y);
    lab('DRAWN', x, r1); val(f.drawn || '', x, r1); lab('CHECKED', c1, r1); val(f.checked || '', c1, r1, true); lab('DATE', c2, r1); val(f.date || '', c2, r1);
    lab('DWG NO.', x, r2); val(f.dwg || '', x, r2); lab('SCALE', c1, r2); val(f.scale || '1:1', c1, r2); lab('SHEET', c2, r2); val(f.sheet || '1 OF 1', c2, r2);
    ctx.restore();
  };
  // Notes, typed on: the words being spoken. n = characters shown.
  B.note = (ctx, text, n, x, y, w) => {
    ctx.save(); ctx.fillStyle = B.soft; ctx.font = '600 14px ' + B.mono; ctx.textBaseline = 'alphabetic'; ctx.letterSpacing = '2px'; ctx.fillText('NOTES', x, y);
    ctx.fillRect(x, y + 6, 62, 1.5);
    ctx.fillStyle = B.ink; ctx.font = '500 20px ' + B.mono; ctx.letterSpacing = '0px';
    const words = ('1. ' + text.toUpperCase()).slice(0, 3 + Math.floor(n)).split(' '), lines = [''];
    words.forEach((wd) => { const tl = lines[lines.length - 1]; if (tl && ctx.measureText(tl + ' ' + wd).width > w) lines.push(wd); else lines[lines.length - 1] = tl ? tl + ' ' + wd : wd; });
    lines.slice(0, 3).forEach((l, k) => ctx.fillText(l, x, y + 36 + k * 28));
    ctx.restore();
  };
  // A file moving through: a ringed crosshair with a dashed wake. o: dir, alpha
  B.packet = (ctx, x, y, o = {}) => {
    const a = clamp(o.alpha ?? 1), dir = o.dir ?? 1;
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = B.ink; ctx.lineWidth = 2; ctx.shadowColor = B.glow; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.moveTo(x - 20, y); ctx.lineTo(x + 20, y); ctx.moveTo(x, y - 20); ctx.lineTo(x, y + 20); ctx.stroke();
    ctx.shadowBlur = 0; ctx.setLineDash([6, 6]); ctx.lineWidth = 1.5; ctx.strokeStyle = B.soft;
    ctx.beginPath(); ctx.moveTo(x - dir * 22, y); ctx.lineTo(x - dir * 90, y); ctx.stroke();
    ctx.restore();
  };

  return { ICONS, icon, strokes, cells, spring, modern: M, blueprint: B };
})();
