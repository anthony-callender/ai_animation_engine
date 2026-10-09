// pixel.js - pixel-art primitives on Canvas 2D. Load after player.js.
// A true low-res screen scaled up with hard edges: every call writes whole pixels.
// Most scenes use it through eduba.js (Eduba.frame), which sets up the screens for you.
//
//   const px = Pixel.screen({ w: 320, h: 180, palette: [...hex], step: 12, draw(px, t) { ... } });
//
// Colours are palette indices or '#rrggbb'. -1 / null = transparent.
(() => {
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  const hexTo32 = (h) => {
    const n = parseInt(h.slice(1), 16);
    return (0xff << 24 | (n & 0xff) << 16 | (n >> 8 & 0xff) << 8 | n >> 16) >>> 0;  // little-endian ABGR
  };

  // Sprite: rows of characters, pal maps characters to colours ('.' = clear),
  // frames replace whole rows: { blink: { 5: '....' } }. anchors: named sprite-px points.
  function sprite(def) {
    const base = def.rows.map((r) => r.split(''));
    const frames = { base };
    for (const [name, patch] of Object.entries(def.frames || {}))
      frames[name] = base.map((r, i) => (patch[i] ? patch[i].split('') : r));
    return { w: base[0].length, h: base.length, pal: def.pal, frames, anchors: def.anchors || {}, rig: def.rig || {} };
  }

  function screen(opts = {}) {
    const stage = document.getElementById('stage');
    const W = opts.w || 320, H = opts.h || 180;
    const pal = opts.palette;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    Object.assign(cv.style, { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', imageRendering: 'pixelated' });
    if (opts.front) stage.appendChild(cv); else stage.insertBefore(cv, stage.firstChild);
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(W, H), buf = new Uint32Array(img.data.buffer);
    const cache32 = new Map();
    const col = (c) => {
      if (c == null || c === -1) return null;
      if (typeof c === 'number') c = pal[((c % pal.length) + pal.length) % pal.length];
      if (!cache32.has(c)) cache32.set(c, hexTo32(c));
      return cache32.get(c);
    };
    (opts.fonts || []).forEach((f) => P.wait(document.fonts.load(`8px "${f}"`).catch(() => {})));

    const px = { W, H, pal, ctx, t: 0, col };
    px.pset = (x, y, c) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const v = typeof c === 'number' && c > 0xffffff ? c : col(c);
      if (v != null) buf[y * W + x] = v;
    };
    px.clear = (c = -1) => buf.fill(col(c) ?? 0);
    px.rect = (x, y, w, h, c) => {
      const v = col(c); if (v == null) return;
      x = Math.round(x); y = Math.round(y);
      for (let j = Math.max(0, y); j < Math.min(H, y + Math.round(h)); j++)
        for (let i = Math.max(0, x); i < Math.min(W, x + Math.round(w)); i++) buf[j * W + i] = v;
    };
    px.rectb = (x, y, w, h, c) => { px.rect(x, y, w, 1, c); px.rect(x, y + h - 1, w, 1, c); px.rect(x, y, 1, h, c); px.rect(x + w - 1, y, 1, h, c); };
    // Bresenham line; size > 1 stamps a square brush.
    px.line = (x0, y0, x1, y1, c, size = 1) => {
      const v = col(c); if (v == null) return;
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        if (size > 1) px.rect(x0 - (size >> 1), y0 - (size >> 1), size, size, c); else px.pset(x0, y0, v);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    };
    px.circ = (cx, cy, r, c) => {
      cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
      for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y + r * 0.8)); px.rect(cx - w, cy + y, 2 * w + 1, 1, c); }
    };
    px.circb = (cx, cy, r, c) => {
      cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
      let x = r, y = 0, e = 1 - r;
      while (x >= y) {
        for (const [a, b] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) px.pset(cx + a, cy + b, c);
        y++; if (e < 0) e += 2 * y + 1; else { x--; e += 2 * (y - x) + 1; }
      }
    };
    px.poly = (pts, c) => {  // filled, scanline even-odd
      const ys = pts.map((p) => p[1]), y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(H - 1, Math.ceil(Math.max(...ys)));
      for (let y = y0; y <= y1; y++) {
        const xs = [];
        for (let i = 0; i < pts.length; i++) {
          const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
          if ((ay <= y + 0.5 && by > y + 0.5) || (by <= y + 0.5 && ay > y + 0.5)) xs.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax));
        }
        xs.sort((a, b) => a - b);
        for (let k = 0; k + 1 < xs.length; k += 2) px.rect(Math.round(xs[k]), y, Math.round(xs[k + 1]) - Math.round(xs[k]), 1, c);
      }
    };
    // Ordered (Bayer) dithering between two colours. level 0..1, or fn(x, y) -> 0..1.
    px.dither = (x, y, w, h, c1, c2, level = 0.5) => {
      const v1 = col(c1), v2 = col(c2);
      for (let j = Math.max(0, y | 0); j < Math.min(H, (y + h) | 0); j++)
        for (let i = Math.max(0, x | 0); i < Math.min(W, (x + w) | 0); i++) {
          const L = typeof level === 'function' ? level(i, j) : level;
          const v = L > BAYER[(j & 3) * 4 + (i & 3)] ? v2 : v1;
          if (v != null) buf[j * W + i] = v;
        }
    };
    px.gradient = (x, y, w, h, c1, c2, dir = 'v') =>
      px.dither(x, y, w, h, c1, c2, dir === 'v' ? (i, j) => (j - y) / h : (i, j) => (i - x) / w);

    px.sprite = (spr, x, y, o = {}) => {
      const grid = spr.frames[o.frame || 'base'] || spr.frames.base, s = o.scale || 1;
      const pal2 = o.pal ? { ...spr.pal, ...o.pal } : spr.pal;
      for (let j = 0; j < spr.h; j++) for (let i = 0; i < spr.w; i++) {
        const ch = grid[j][o.flip ? spr.w - 1 - i : i];
        if (ch === '.' || pal2[ch] == null) continue;
        if (s === 1) px.pset(x + i, y + j, pal2[ch]); else px.rect(x + i * s, y + j * s, s, s, pal2[ch]);
      }
    };

    // Pixel text: drawn once 4x big, each 4x4 cell's centre sampled (exact for pixel fonts), cached.
    const textCache = new Map();
    const tmp = document.createElement('canvas'), tctx = tmp.getContext('2d', { willReadFrequently: true });
    const mask = (str, o) => {
      const font = o.font || 'Silkscreen', size = o.size || 8, key = `${font}|${size}|${o.digits !== false}|${str}`;
      let m = textCache.get(key);
      if (!m) {
        const K = 4, f = `${size * K}px "${font}"`, alt = `${Math.round(size * 1.25) * K}px "VT323"`;
        // Pixelify Sans draws 5 almost like S, so its digit runs come from VT323 at the same cap height, on the same baseline
        const digits = (r) => font === 'Pixelify Sans' && o.digits !== false && /^[0-9]+$/.test(r);  // style { digits: false } keeps Pixelify's own
        const runs = (font === 'Pixelify Sans' ? String(str).split(/([0-9]+)/) : [String(str)]).filter(Boolean)
          .map((r) => (digits(r) ? r : r.replace(/f(?=[filt])/g, 'f\u200C')));  // no fi/fl ligatures
        tctx.textBaseline = 'top';
        tctx.font = f; const baseMain = tctx.measureText('H').actualBoundingBoxDescent;
        tctx.font = alt; const dy = baseMain - tctx.measureText('0').actualBoundingBoxDescent;
        let adv = 0;
        for (const r of runs) { tctx.font = digits(r) ? alt : f; adv += tctx.measureText(r).width / K; }
        const w = Math.ceil(adv) + 2, h = Math.ceil(size * 1.4) + 2;
        tmp.width = w * K; tmp.height = h * K;
        tctx.textBaseline = 'top'; tctx.fillStyle = '#fff';
        let cx = K;
        for (const r of runs) { tctx.font = digits(r) ? alt : f; tctx.fillText(r, cx, K + (digits(r) ? dy : 0)); cx += tctx.measureText(r).width; }
        const d = tctx.getImageData(0, 0, w * K, h * K).data, pts = [];
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++)
          if (d[((j * K + K / 2) * w * K + i * K + K / 2) * 4 + 3] > 127) pts.push(i, j);
        // pts are offset by the 1-cell margin; store extents relative to the draw origin
        let x1 = 0, y0 = h, y1 = 0;
        for (let k = 0; k < pts.length; k += 2) { x1 = Math.max(x1, pts[k]); y0 = Math.min(y0, pts[k + 1]); y1 = Math.max(y1, pts[k + 1]); }
        m = { w: x1, adv, pts, top: pts.length ? y0 - 1 : 0, bottom: pts.length ? y1 - 1 : 0 };
        textCache.set(key, m);
      }
      return m;
    };
    // w = inked width, adv = advance (for placing text after text), top/bottom = inked rows.
    px.measure = (str, o = {}) => { const m = mask(str, o); return { w: m.w, adv: m.adv, top: m.top, bottom: m.bottom }; };
    // Draws with its top-left ink at (x, y + top). chars = typewriter count. Returns inked width.
    px.text = (str, x, y, c, o = {}) => {
      if (!str) return 0;
      const m = mask(str, o);
      const ox = Math.round(o.align === 'center' ? x - m.w / 2 : o.align === 'right' ? x - m.w : x) - 1, oy = Math.round(y) - 1;
      const n = o.chars != null ? o.chars : Infinity;
      const cut = n >= str.length ? Infinity : (m.adv * n) / Math.max(1, str.length);
      if (o.shadow != null) for (let k = 0; k < m.pts.length; k += 2) if (m.pts[k] - 1 <= cut) px.pset(ox + m.pts[k] + 1, oy + m.pts[k + 1] + 1, o.shadow);
      const v = col(c);
      for (let k = 0; k < m.pts.length; k += 2) if (m.pts[k] - 1 <= cut) px.pset(ox + m.pts[k], oy + m.pts[k + 1], v);
      return m.w;
    };
    // Word-wrap to lines no wider than maxW.
    px.wrap = (str, o, maxW) => {
      const out = [];
      for (const para of String(str).split('\n')) {
        let line = '';
        for (const word of para.split(' ')) {
          const next = line ? line + ' ' + word : word;
          if (line && mask(next, o).w > maxW) { out.push(line); line = word; } else line = next;
        }
        out.push(line);
      }
      return out;
    };

    px.actor = (spr, o = {}) => drawActor(px, spr, o);
    px.flush = () => ctx.putImageData(img, 0, 0);

    if (!opts.manual) P.onFrame((t) => {
      const tt = opts.step ? P.step(opts.step, t) : t;
      px.t = tt;
      opts.draw && opts.draw(px, tt);
      px.flush();
    });
    return px;
  }

  // ── Actor: a sprite plus two drawn arms, posed by where the hands go (2-bone IK). ──
  // Hand targets in sprite px, relative to the shoulder, for the RIGHT arm (left is mirrored).
  const POSES = {
    idle: [[1.5, 8.4], [1.5, 8.4]],
    wave: [[1.5, 8.4], [3, -8]],
    point: [[1.5, 8.4], [9, -0.5]],
    pointUp: [[1.5, 8.4], [3.5, -8.5]],
    present: [[1.5, 8.4], [7, 2]],
    cheer: [[3, -8.5], [3, -8.5]],
    shrug: [[6.5, -2.5], [6.5, -2.5]],
    think: [[1.5, 8.4], [-5.2, -3.2]],
    hold: [[-3.5, 6], [-3.5, 6]],
    type: [[-2, 7.5], [-2, 7.5]],
    hips: [[-0.8, 7.2], [-0.8, 7.2]],
    sad: [[0.3, 8.9], [0.3, 8.9]],
  };
  const FACE = { cheer: 'happy', wave: 'happy', present: 'happy', sad: 'sad' };

  // o: { x, y (feet, world px), scale, pose, face, reach: {r:[x,y], l:[x,y]} (world targets),
  //      walk, hop, flip, talk (false = mouth still), level (0..1 override), pal }
  // Returns anchors in world px: { left, top, w, h, head, mouth, hands: { l, r } }.
  function drawActor(px, spr, o) {
    const s = o.scale || 1, t = px.t, R = spr.rig;
    const has = (f) => !!spr.frames[f];
    const lvl = o.talk === false ? 0 : (o.level ?? P.level(t));
    const walking = o.walk && Math.floor(t * 6) % 2 === 1;
    const bob = (o.walk ? (Math.floor(t * 6) % 2) : 0) + (o.hop ? Math.round(Math.abs(Math.sin(t * 8)) * 2) : 0);
    const left = Math.round((o.x ?? 60) - (spr.w * s) / 2), top = Math.round((o.y ?? 150) - spr.h * s) - bob * s;
    const blink = (t + (o.blinkOffset || 0)) % 3.7 < 0.12;
    const face = o.face || FACE[o.pose] || 'base';
    let frame = lvl > 0.55 && has('shout') ? 'shout' : lvl > 0.18 && has('talk') ? 'talk' : has(face) ? face : 'base';
    if (frame === 'base' && walking && has('walk')) frame = 'walk';
    if (blink && frame === 'base' && has('blink')) frame = 'blink';
    px.sprite(spr, left, top, { scale: s, frame, pal: o.pal, flip: o.flip });

    const pose = POSES[o.pose] || POSES.idle;
    const L = (R.armLen || 4.5) * s, core = (R.armW || 2) * s;
    const sh = R.shoulders || [[1, Math.floor(spr.h / 2)], [spr.w - 2, Math.floor(spr.h / 2)]];
    const hands = {};
    [['l', -1, pose[0], sh[0]], ['r', 1, pose[1], sh[1]]].forEach(([key, side, off, [ax, ay]]) => {
      const sd = o.flip ? -side : side;
      const sx = left + (sd < 0 ? Math.min(ax, spr.w - 1 - ax) : Math.max(ax, spr.w - 1 - ax)) * s + s / 2, sy = top + ay * s + s / 2;
      let tx, ty;
      const reach = o.reach && o.reach[key];
      if (reach) { tx = reach[0]; ty = reach[1]; }
      else {
        let [dx, dy] = off;
        if (o.pose === 'wave' && key === 'r') dx += Math.floor(t * 6) % 2 ? 2 : -1;
        tx = sx + sd * dx * s; ty = sy + dy * s;
      }
      // two-bone IK, elbow bent outward/down
      let vx = tx - sx, vy = ty - sy, d = Math.hypot(vx, vy) || 1;
      const dd = Math.min(d, 2 * L * 0.98);
      vx /= d; vy /= d;
      const a = dd / 2, hgt = Math.sqrt(Math.max(0, L * L - a * a));
      let px1 = -vy, py1 = vx;
      if (px1 * sd + py1 * 0.4 < 0) { px1 = -px1; py1 = -py1; }
      const ex = sx + vx * a + px1 * hgt, ey = sy + vy * a + py1 * hgt;
      const hx = sx + vx * dd, hy = sy + vy * dd;
      const ol = R.outline ?? 0;
      px.line(sx, sy, ex, ey, ol, core + 2 * s); px.line(ex, ey, hx, hy, ol, core + 2 * s);
      px.line(sx, sy, ex, ey, R.upper ?? R.lower ?? 8, core); px.line(ex, ey, hx, hy, R.lower ?? 8, core);
      if (R.cuff != null) px.rect(hx - core / 2, hy - core / 2, core, core, R.cuff);
      const hs = (R.handW || 2) * s;
      px.rect(hx - hs / 2 - s, hy - hs / 2 - s, hs + 2 * s, hs + 2 * s, ol);
      px.rect(hx - hs / 2, hy - hs / 2, hs, hs, R.hand ?? 8);
      hands[key] = [Math.round(hx), Math.round(hy)];
    });
    const A = spr.anchors;
    const at = (p, dflt) => { const q = p || dflt; return [left + (o.flip ? spr.w - q[0] : q[0]) * s, top + q[1] * s]; };
    return { left, top, w: spr.w * s, h: spr.h * s, s, head: at(A.head, [spr.w / 2, 0]), mouth: at(A.mouth, [spr.w / 2, spr.h / 3]), hands };
  }

  window.Pixel = { screen, sprite, poses: POSES };
})();
