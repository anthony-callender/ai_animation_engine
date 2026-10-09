// line.js - the Line kit: hand-drawn white line art on black, one orange accent, mono type.
// Load after player.js (no pixel.js). One full-resolution canvas; coordinates are world units,
// 320x180 wide / 180x320 tall, the same as Eduba, so layouts and g.safe carry over.
// Every stroke wobbles like a pen line, draws itself on with `progress`, and boils (redraws a
// little differently) 4 times a second, the way hand-drawn animation does.
//
//   Line.frame({ draw(g, t) {
//     Line.room(g);
//     Line.hud(g, { left: '// SYS.ANALOG', right: 'terminal_audio' });
//     Line.coder(g, 150, 150, { s: 1.6, sip: P.prog('intro', { dur: 1 }) });
//     Line.caption(g, 'all *you.*', { role: 'big', progress: P.prog('intro.you', { dur: 0.6, ease: P.ease.linear }) });
//   }});
(() => {
  const THEMES = {
    night: { bg: '#050505', ink: '#F3F0E8', dim: '#77736B', ghost: '#34322E', faint: '#1D1D1B', accent: '#FF8A1C', sys: '#34D26B', warn: '#FF5B4F' },
    paper: { bg: '#F2EDE2', ink: '#171513', dim: '#8E877B', ghost: '#CDC4B3', faint: '#DCD4C4', accent: '#EF7A14', sys: '#1F8C4A', warn: '#C7412F' },
  };
  const C = { bg: 'bg', ink: 'ink', dim: 'dim', ghost: 'ghost', faint: 'faint', accent: 'accent', sys: 'sys', warn: 'warn' };
  const FONT = '"JetBrains Mono", "IBM Plex Mono", Consolas, monospace';
  // Text roles, sizes in output pixels. Tall frames are read on phones, so small roles grow.
  const TYPE = {
    wide: { label: { size: 22, weight: 500 }, body: { size: 34, weight: 400 }, head: { size: 54, weight: 500 },
      big: { size: 120, weight: 500 }, code: { size: 28, weight: 400 } },
    tall: { label: { size: 30, weight: 500 }, body: { size: 42, weight: 400 }, head: { size: 64, weight: 500 },
      big: { size: 110, weight: 500 }, code: { size: 34, weight: 400 } },
  };
  const LW = 1.0;  // base stroke width, world units (6 px on a 1080p frame)

  // ── math ────────────────────────────────────────────────────────────────
  const hash = (i, s = 1) => { let h = Math.imul((i | 0) ^ Math.imul(s | 0, 0x27d4eb2d), 0x165667b1); h ^= h >>> 15; h = Math.imul(h, 0x85ebca77); return ((h ^ (h >>> 13)) >>> 0) / 4294967296; };
  const hstr = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h >>> 0; };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const noise = (seed, x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i, seed), hash(i + 1, seed), u) * 2 - 1; };
  const noise2 = (seed, x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const h = (i, j) => hash(Math.imul(i, 73856093) ^ Math.imul(j, 19349663), seed);
    return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v) * 2 - 1;
  };
  const fbm = (seed, x, y) => noise2(seed, x, y) * 0.65 + noise2(seed + 1, x * 2.1 + 5.2, y * 2.1 + 1.3) * 0.35;
  const col = (g, c) => (c == null ? g.th.ink : g.th[c] ?? c);
  const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const plen = (pts, closed) => { let L = 0; for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]); return closed ? L + dist(pts[pts.length - 1], pts[0]) : L; };

  // Catmull-Rom through the points, `step` world units apart.
  function smooth(pts, step = 1, closed = false) {
    if (pts.length < 3) return pts;
    const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
    const out = [];
    for (let i = 1; i < P.length - 2; i++) {
      const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
      const n = Math.max(2, Math.ceil(dist(p1, p2) / step));
      for (let j = 0; j < n; j++) {
        const t = j / n, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
      }
    }
    out.push(closed ? pts[0] : pts[pts.length - 1]);
    return out;
  }
  // Points every `d` along a polyline, with their arc length s.
  function resample(pts, d, closed) {
    const P = closed ? [...pts, pts[0]] : pts, out = [[P[0][0], P[0][1], 0]];
    let s = 0, next = d;
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i], L = dist(a, b);
      while (next <= s + L && L > 0) { const u = (next - s) / L; out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, next]); next += d; }
      s += L;
    }
    const last = P[P.length - 1];
    if (s - out[out.length - 1][2] > 0.05) out.push([last[0], last[1], s]);
    return out;
  }

  // ── the frame ───────────────────────────────────────────────────────────
  function frame(opts = {}) {
    const stage = document.getElementById('stage');
    const sw = +stage.dataset.width || 1920, sh = +stage.dataset.height || 1080, tall = sh > sw;
    const W = tall ? 180 : 320, H = tall ? 320 : 180, k = sw / W;
    const cv = document.createElement('canvas');
    cv.width = sw; cv.height = sh;
    Object.assign(cv.style, { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' });
    stage.appendChild(cv);
    const ctx = cv.getContext('2d');
    [400, 500, 700].forEach((w) => P.wait(document.fonts.load(`${w} 32px "JetBrains Mono"`).catch(() => {})));
    const theme = opts.theme || stage.dataset.theme || 'night';
    const g = { ctx, W, H, k, tall, wide: !tall, sw, sh, t: 0, boil: 0, flow: 0, energy: 0, talk: opts.talk ?? 1, type: TYPE[tall ? 'tall' : 'wide'], th: THEMES[theme], seen: {},
      safe: tall ? { x: 12, y: 26, w: 144, h: 232 } : { x: 10, y: 8, w: 300, h: 164 } };
    const fps = opts.step === 0 ? 0 : opts.step || 12, boil = opts.boil ?? 4;
    let EN = null, clipNow = '';
    P.onFrame((t) => {
      const tt = fps ? P.step(fps, t) : t;
      if (!EN) EN = energyTable(g.talk);
      const f = Math.min(EN.en.length - 2, Math.max(0, t * EN.R)), i = Math.floor(f), u = f - i;
      g.energy = lerp(EN.en[i], EN.en[i + 1], u);
      g.flow = lerp(EN.clk[i], EN.clk[i + 1], u);  // a clock that runs faster while the voice is excited
      g.t = tt; g.boil = boil ? Math.floor(g.flow * boil) : 0; g.seen = {}; g.th = THEMES[theme]; g.cam = null; g.nib = null;
      g.clip = null;
      paint(g);
      opts.draw(g, tt);
      if (g.nib && opts.pencil !== false) pencil(g, g.nib);
      const cl = g.clip || '';  // a wipe: CSS clip-path for this canvas, this frame only (Desk.seam makes them)
      if (cl !== clipNow) { cv.style.clipPath = cl; clipNow = cl; }
    });
    return g;
  }
  // How excited the voice is, 0..1, 30 times a second: louder than usual and faster than usual both count.
  // clk integrates it into a clock: the boil, the backgrounds and the wheels run faster when the voice does.
  function energyTable(talk) {
    const R = 30, N = Math.ceil((P.duration || 1) * R) + 3, en = new Float32Array(N), clk = new Float32Array(N), W = P.words || [];
    let c = 0, a = 0, b = 0;
    for (let i = 0; i < N; i++) {
      const t = i / R;
      let loud = 0;
      for (let j = 0; j < 5; j++) loud += P.level(Math.max(0, t - j * 0.05));
      loud /= 5;
      while (b < W.length && W[b].start < t + 0.3) b++;
      while (a < b && W[a].start < t - 1.2) a++;
      const wps = (b - a) / 1.5, speaking = loud > 0.12;
      const e = speaking ? clamp(0.65 * clamp((loud - 0.35) / 0.55) + 0.45 * clamp((wps - 2.6) / 1.6)) : 0;
      en[i] = e * talk;
      c += (1 + 1.6 * en[i]) / R;
      clk[i] = c;
    }
    for (let i = 1; i < N; i++) en[i] = Math.max(en[i], en[i - 1] - 0.9 / R);  // settles over about a second
    return { R, en, clk };
  }
  function paint(g) {
    const { ctx } = g;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = g.th.bg; ctx.fillRect(0, 0, g.sw, g.sh);
    ctx.setTransform(g.k, 0, 0, g.k, 0, 0);
    g.view = { x: 0, y: 0, w: g.W, h: g.H };
  }
  // Zoom about a world point for the rest of this frame. Call it right after room(), before anything else.
  function camera(g, z, x = g.W / 2, y = g.H / 2) {
    g.cam = { z, x, y };
    g.ctx.setTransform(g.k * z, 0, 0, g.k * z, g.k * x * (1 - z), g.k * y * (1 - z));
    g.view = { x: x - x / z, y: y - y / z, w: g.W / z, h: g.H / z };
  }
  // Put world point (cx, cy) at the centre of the frame, zoomed by z: pans, pull-backs, rides down the road.
  // Text that belongs to the screen (hud, caption, subtitles) stays put; draw other overlays inside screen(g, fn).
  function look(g, cx, cy, z = 1) {
    g.cam = { z, x: cx, y: cy };
    g.ctx.setTransform(g.k * z, 0, 0, g.k * z, g.k * (g.W / 2 - cx * z), g.k * (g.H / 2 - cy * z));
    g.view = { x: cx - g.W / 2 / z, y: cy - g.H / 2 / z, w: g.W / z, h: g.H / z };
  }
  function screen(g, fn) {
    const m = g.ctx.getTransform(), v = g.view;
    g.ctx.setTransform(g.k, 0, 0, g.k, 0, 0); g.view = { x: 0, y: 0, w: g.W, h: g.H };
    try { return fn(); } finally { g.ctx.setTransform(m); g.view = v; }
  }
  // The pencil that draws: its tip sits on the end of whatever line is being drawn right now.
  function pencil(g, nib) {
    const ctx = g.ctx, m = ctx.getTransform();
    ctx.setTransform(nib.m);
    const [x, y] = nib.tip, s = (g.tall ? 1.15 : 1) / nib.z, a = -1.05 + Math.sin(g.t * 2.3) * 0.06 + nib.lean * 0.12;
    const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux, L = 17 * s, w = 1.35 * s, tl = 3.4 * s;
    const P2 = (d, o) => [x + ux * d + nx * o, y + uy * d + ny * o];
    const body = [P2(tl, -w), P2(L, -w), P2(L + 1.2 * s, 0), P2(L, w), P2(tl, w)];
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = g.th.bg; ctx.beginPath(); body.concat([P2(0, 0)]).forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = g.th.ink; ctx.lineWidth = 0.55 * s;
    ctx.beginPath(); [P2(tl, -w), P2(0, 0), P2(tl, w)].forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke();
    ctx.beginPath(); body.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); [P2(L - 3 * s, -w), P2(L - 3 * s, w)].forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke();
    ctx.fillStyle = g.th.ink; ctx.beginPath(); [P2(0, 0), P2(1.3 * s, -0.5 * s), P2(1.3 * s, 0.5 * s)].forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.fill();
    ctx.setTransform(m);
  }
  // Zoom for a punch on each beat in ts: jumps to 1 + amt, eases back over dur. Line.camera(g, Line.punch(g, [S('a')]), x, y)
  function punch(g, ts, o = {}) {
    const amt = o.amt ?? 0.06, dur = o.dur ?? 0.5;
    let z = 1;
    for (const t0 of [].concat(ts)) { const q = (g.t - t0) / dur; if (q >= 0 && q < 1) z = 1 + amt * (1 - P.ease.out(q)); }
    return z;
  }
  // null before t0, then a y offset that drops in with a small bounce
  function pop(g, t0, o = {}) {
    if (t0 == null || g.t < t0) return null;
    const q = clamp((g.t - t0) / (o.dur ?? 0.3));
    return (1 - P.ease.back(q)) * -(o.h ?? 8);
  }

  // ── the pen: every drawn thing goes through one ─────────────────────────
  // const p = pen(g, { x, y, s, flip, rot, sy, progress, seed, wob, weight, still, nib }, 'name'); p.line(...); p.draw();
  // Shapes take local units (scaled by s, flipped by flip, turned by rot, squashed by sy); widths are world units and don't scale.
  // Items draw in the order they were added; progress 0..1 spends a length budget, like a pen moving.
  function pen(g, o = {}, name = 'pen') {
    const n = (g.seen[name] = (g.seen[name] || 0) + 1);
    const seed = (hstr(name) + n * 104729 + (o.seed ?? 0) * 7919) >>> 0;
    const T = { x: o.x ?? 0, y: o.y ?? 0, s: o.s ?? 1, f: o.flip ? -1 : 1, rot: o.rot ?? 0, sy: o.sy ?? 1 };
    const items = [];
    let k = 0;
    const r = () => hash(k++, seed);
    const cr = Math.cos(T.rot), sr = Math.sin(T.rot);
    const map = ([x, y]) => { const X = x * T.s * T.f, Y = y * T.s * T.sy; return [T.x + X * cr - Y * sr, T.y + X * sr + Y * cr]; };
    const unmap = ([x, y]) => { const dx = x - T.x, dy = y - T.y, X = dx * cr + dy * sr, Y = -dx * sr + dy * cr; return [(X / T.s) * T.f, Y / (T.s * T.sy)]; };
    const shoot = 0.45 / T.s;  // pen overshoot past a corner, in local units
    const api = {
      r, T, map, unmap, items,
      // raw polyline, local units. so: { c, w, smooth, closed, wob }
      path(pts, so = {}) { if (pts.length > 1) items.push({ kind: 'stroke', pts: pts.map(map), so, sd: seed + items.length * 31 }); return api; },
      curve(pts, so = {}) { return api.path(pts, { smooth: true, ...so }); },
      // a hand line: a slight bow and a little overshoot at each end
      line(x0, y0, x1, y1, so = {}) {
        const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
        const b = (r() - 0.5) * 2 * Math.min((so.bow ?? 0.025) * L, 1.6 / T.s), a = so.exact ? 0 : r() * shoot, e = so.exact ? 0 : r() * shoot;
        return api.path([[x0 - ux * a, y0 - uy * a], [(x0 + x1) / 2 - uy * b, (y0 + y1) / 2 + ux * b], [x1 + ux * e, y1 + uy * e]], { smooth: true, ...so });
      },
      poly(pts, so = {}) { return api.path(pts, { closed: true, ...so }); },
      // two strokes, the way a hand draws a box; so.r rounds the corners
      rect(x, y, w, h, so = {}) {
        if (so.r) return api.path(rrect(x, y, w, h, so.r), { closed: true, ...so, smooth: false });
        const a = r() * shoot * 2, b = r() * shoot * 2;
        api.path([[x - a, y], [x + w, y], [x + w, y + h + b]], so);
        return api.path([[x + w + b, y + h], [x, y + h], [x, y - a]], so);
      },
      // one loop that doesn't quite close
      ellipse(cx, cy, rx, ry, so = {}) {
        const a0 = so.a0 ?? r() * Math.PI * 2, sweep = Math.PI * 2 + (so.over ?? 0.2 + r() * 0.25), pts = [];
        for (let i = 0; i <= 28; i++) { const q = i / 28, a = a0 + sweep * q, g2 = 1 + (so.drift ?? 0.05) * q; pts.push([cx + Math.cos(a) * rx * g2, cy + Math.sin(a) * ry * g2]); }
        return api.path(pts, { smooth: true, ...so });
      },
      circle(cx, cy, rr, so = {}) { return api.ellipse(cx, cy, rr, rr, so); },
      arc(cx, cy, rx, ry, a0, a1, so = {}) {
        const n = Math.max(4, Math.ceil(Math.abs(a1 - a0) * 8)), pts = [];
        for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
        return api.path(pts, { smooth: true, ...so });
      },
      // flat colour inside a shape (accent by default); drawn where it sits in the order
      fill(pts, so = {}) { items.push({ kind: 'fill', pts: pts.map(map), so: { c: 'accent', ...so }, sd: seed + items.length * 31 }); return api; },
      // background fill: hides the lines behind a shape so it reads as in front
      knock(pts, so = {}) { items.push({ kind: 'fill', pts: pts.map(map), so: { c: 'bg', knock: true, ...so }, sd: seed + items.length * 31 }); return api; },
      dot(x, y, rr = 0.6, so = {}) { items.push({ kind: 'dot', pts: [map([x, y])], so: { r: rr, ...so }, sd: seed + items.length * 31 }); return api; },
      // parallel hand strokes inside a polygon (shading). so: gap, angle (radians), w
      hatch(pts, so = {}) {
        const ang = so.angle ?? -0.9, gap = so.gap ?? 2.2, ca = Math.cos(ang), sa = Math.sin(ang);
        const rot = pts.map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]);
        const vs = rot.map((p) => p[1]), v0 = Math.min(...vs), v1 = Math.max(...vs);
        for (let v = v0 + gap / 2; v < v1; v += gap) {
          const xs = [];
          for (let i = 0; i < rot.length; i++) {
            const [ax, ay] = rot[i], [bx, by] = rot[(i + 1) % rot.length];
            if ((ay <= v && by > v) || (by <= v && ay > v)) xs.push(ax + ((v - ay) / (by - ay)) * (bx - ax));
          }
          xs.sort((a, b) => a - b);
          for (let j = 0; j + 1 < xs.length; j += 2) {
            const inset = Math.min(0.6, (xs[j + 1] - xs[j]) * 0.2);
            const back = (u) => [u * ca - v * sa, u * sa + v * ca];
            api.path([back(xs[j] + inset), back(xs[j + 1] - inset)], { w: 0.55, ...so });
          }
        }
        return api;
      },
      draw(progress = o.progress ?? 1) { render(g, items, clamp(progress), o); return api; },
    };
    return api;
  }
  function rrect(x, y, w, h, rr) {
    rr = Math.min(rr, w / 2, h / 2);
    const out = [];
    [[x + w - rr, y + rr, -Math.PI / 2], [x + w - rr, y + h - rr, 0], [x + rr, y + h - rr, Math.PI / 2], [x + rr, y + rr, Math.PI]].forEach(([cx, cy, a0]) => {
      for (let i = 0; i <= 4; i++) { const a = a0 + (i / 4) * (Math.PI / 2); out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    });
    return out;
  }

  function render(g, items, p, o) {
    if (g.capturing) {  // inside capture(): keep the finished geometry for a morph, draw nothing
      for (const it of items) {
        if (it.kind === 'stroke') {
          const base = it.so.smooth ? smooth(it.pts, 0.8, it.so.closed) : it.pts;
          g.capturing.push({ kind: 'stroke', pts: resample(base, 0.9, it.so.closed && !it.so.smooth).map(([x, y]) => [x, y]), c: it.so.c, w: (it.so.w ?? 1) * (o.weight ?? 1) });
        } else g.capturing.push({ kind: it.kind, pts: it.pts, c: it.so.c, knock: !!it.so.knock, r: it.so.r });
      }
      return;
    }
    if (p <= 0) return;
    const e = g.energy || 0, ctx = g.ctx, wob = (o.wob ?? 1) * (1 + 0.9 * e), wmul = (o.weight ?? 1) * (1 + 0.14 * e);
    const prep = items.map((it) => {
      if (it.kind === 'stroke') {
        const base = it.so.smooth ? smooth(it.pts, 0.8, it.so.closed) : it.pts;
        const rs = resample(base, 0.9, it.so.closed && !it.so.smooth);
        return { it, rs, len: rs[rs.length - 1][2] };
      }
      if (it.kind === 'fill') return { it, len: it.so.knock ? 0 : plen(it.pts, true) * 0.15 };
      return { it, len: 0.5 };
    });
    let budget = p * prep.reduce((a, q) => a + q.len, 0) + 1e-6;
    for (const q of prep) {
      if (budget <= 0 && q.len > 0) break;
      const f = q.len > 0 ? clamp(budget / q.len) : 1;
      budget -= q.len;
      const { it } = q, boilSeed = (it.sd + (o.still ? 0 : g.boil) * 7717) >>> 0, c = col(g, it.so.c);
      if (it.kind === 'stroke') {
        const tip = inkStroke(ctx, q.rs, q.len, f, it.so, boilSeed, wob, wmul, c);
        if (tip && f < 1 && o.nib !== false && !it.so.knock) g.nib = { tip, m: ctx.getTransform(), z: g.cam ? g.cam.z : 1, lean: tip[2] };
      }
      else if (it.kind === 'fill') inkFill(ctx, it.pts, f, it.so, boilSeed, wob, c);
      else { const [x, y] = it.pts[0]; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + (hash(1, boilSeed) - 0.5) * 0.3 * wob, y + (hash(2, boilSeed) - 0.5) * 0.3 * wob, it.so.r, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  function inkStroke(ctx, rs, L, f, so, sd, wob, wmul, c) {
    const amp = 0.3 * wob * (so.wob ?? 1), end = L * f, n = rs.length;
    const w0 = LW * (so.w ?? 1) * wmul, dx = (hash(3, sd) - 0.5) * amp * 0.8, dy = (hash(4, sd) - 0.5) * amp * 0.8;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const [x, y, s] = rs[i];
      if (s > end + 0.001) {
        const [px, py, ps] = rs[i - 1], u = (end - ps) / Math.max(1e-6, s - ps);
        pts.push([px + (x - px) * u, py + (y - py) * u, end]);
        break;
      }
      pts.push([x, y, s]);
    }
    if (pts.length < 2) { if (f > 0 && L < 0.5) pts.push([rs[0][0] + 0.01, rs[0][1], 0.01]); else return; }
    const out = pts.map(([x, y, s], i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1;
      const d = amp * (noise(sd, s / 8) + 0.35 * noise(sd + 17, s / 2.2));
      const taper = Math.min(1, 0.45 + 0.55 * (s / 2.2)) * Math.min(1, 0.45 + 0.55 * ((L - s) / 2.2));
      const w = w0 * taper * (1 + 0.14 * noise(sd + 5, s / 5));
      return [x - (ty / tl) * d + dx, y + (tx / tl) * d + dy, w];
    });
    ctx.strokeStyle = c; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < out.length - 1; i += 3) {
      const j = Math.min(out.length - 1, i + 3);
      ctx.lineWidth = (out[i][2] + out[j][2]) / 2;
      ctx.beginPath(); ctx.moveTo(out[i][0], out[i][1]);
      for (let m = i + 1; m <= j; m++) ctx.lineTo(out[m][0], out[m][1]);
      ctx.stroke();
    }
    const a = out[out.length - 1], b = out[Math.max(0, out.length - 3)];
    return [a[0], a[1], Math.sin(Math.atan2(a[1] - b[1], a[0] - b[0]))];  // where the pen is, and which way it's heading
  }
  function inkFill(ctx, pts, f, so, sd, wob, c) {
    const amp = so.knock ? 0 : 0.35 * wob * (so.wob ?? 1), rs = resample(pts, Math.min(2.5, plen(pts, true) / 12), true);
    const sx = so.knock ? 0 : (so.shift ?? 0.45), sy = so.knock ? 0 : (so.shift ?? 0.35);
    ctx.save();
    if (f < 1) {
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]), x0 = Math.min(...xs), x1 = Math.max(...xs);
      ctx.beginPath(); ctx.rect(x0 - 1, Math.min(...ys) - 1, (x1 - x0 + 2) * f, Math.max(...ys) - Math.min(...ys) + 2); ctx.clip();
    }
    ctx.fillStyle = c; ctx.beginPath();
    rs.forEach(([x, y, s], i) => {
      const d = amp * noise(sd, s / 6);
      const X = x + d + sx, Y = y + amp * noise(sd + 9, s / 6) + sy;
      if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
    });
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ── text ────────────────────────────────────────────────────────────────
  const role = (g, r) => (typeof r === 'object' && r ? { weight: 400, ...r } : g.type[r || 'body'] || g.type.body);
  const setFont = (g, R) => { g.ctx.font = `${R.weight} ${R.size / g.k}px ${FONT}`; };
  // Words with *highlight* markup, wrapped to maxW world units. Mono, so one advance per character.
  function layout(g, str, R, maxW, raw) {
    setFont(g, R);
    const cw = g.ctx.measureText('M').width, lines = [];
    if (raw) for (const ln of String(str).split('\n')) lines.push({ words: [{ text: ln, hl: false, x: 0 }], w: ln.length * cw });
    else for (const para of String(str).split('\n')) {
      let cur = [], w = 0, hl = false;
      for (const tok of para.split(' ').filter((s, i, a) => s || a.length === 1)) {
        const m = tok.match(/^(\*?)(.*?)(\*?)([.,!?;:'")\]]*)$/);
        const on = hl || !!m[1], off = !!m[3], raw = m[2] + m[4], ww = raw.length * cw;
        if (cur.length && w + cw + ww > maxW) { lines.push({ words: cur, w }); cur = []; w = 0; }
        cur.push({ text: raw, hl: on, x: cur.length ? w + cw : 0 });
        w = cur.length === 1 ? ww : w + cw + ww;
        hl = off ? false : on;
      }
      lines.push({ words: cur, w });
    }
    const lh = (R.size * 1.28) / g.k, cap = (R.size * 0.73) / g.k;
    return { lines, cw, lh, cap, R, w: Math.max(0, ...lines.map((l) => l.w)), h: cap + (lines.length - 1) * lh };
  }
  // Draw laid-out text with its cap-top at (X, Y). n = characters typed so far. Returns the cursor spot.
  function drawLayout(g, L, X, Y, fg, hl, n, align, boxW) {
    const ctx = g.ctx;
    setFont(g, L.R); ctx.textBaseline = 'alphabetic';
    let cur = null;
    L.lines.forEach((line, i) => {
      const lx = X + (align === 'center' ? (boxW - line.w) / 2 : align === 'right' ? boxW - line.w : 0), ly = Y + L.cap + i * L.lh;
      for (const w of line.words) {
        if (n <= 0) return;
        const part = w.text.slice(0, n);
        ctx.fillStyle = w.hl ? hl : fg;
        ctx.fillText(part, lx + w.x, ly);
        cur = [lx + w.x + part.length * L.cw, ly - L.cap, i];
        n -= w.text.length + 1;
        if (n > 0) cur = [lx + w.x + (w.text.length + 1) * L.cw, ly - L.cap, i];
      }
    });
    return cur;
  }
  const count = (L) => L.lines.reduce((a, l) => a + l.words.reduce((b, w) => b + w.text.length + 1, 0), 0);

  // Any text. o: role, c, hl, align, anchor ('bottom' | 'middle'), w (wrap width), progress (typewriter),
  // cursor (true | 'typing' | false), knock (a background box so lines behind don't cross the words), pad, raw (keep spaces, no markup)
  function text(g, str, x, y, o = {}) {
    const R = role(g, o.role), L = layout(g, str, R, o.w ?? 1e9, o.raw), pad = o.pad ?? 3;
    let X = x, Y = y;
    if (o.align === 'center') X -= L.w / 2; else if (o.align === 'right') X -= L.w;
    if (o.anchor === 'bottom') Y -= L.h; else if (o.anchor === 'middle') Y -= L.h / 2;
    const total = count(L), p = clamp(o.progress ?? 1), n = Math.floor(p * total + 1e-6);
    if (p <= 0 && o.cursor !== true) return { x: X, y: Y, w: L.w, h: L.h };
    if (o.knock) { g.ctx.fillStyle = g.th.bg; g.ctx.fillRect(X - pad, Y - pad, L.w + pad * 2, L.h + pad * 2); }
    const cur = drawLayout(g, L, X, Y, col(g, o.c), col(g, o.hl ?? 'accent'), n, o.align, L.w);
    const typing = p < 1, show = o.cursor === true ? (typing || Math.floor(g.t * 2) % 2 === 0) : o.cursor === 'typing' ? typing : false;
    if (show) {
      const [cx, cy] = cur || [X, Y];
      g.ctx.fillStyle = col(g, o.cursorC ?? o.c);
      g.ctx.fillRect(cx + L.cw * 0.1, cy - L.cap * 0.08, L.cw * 0.8, L.cap * 1.16);
    }
    return { x: X, y: Y, w: L.w, h: L.h };
  }
  // Text on a knocked-out box, optionally with a hand-drawn frame (o.box) or brackets (o.brackets).
  function plate(g, str, x, y, o = {}) {
    const pad = o.pad ?? (g.tall ? 5 : 4), R = role(g, o.role), L = layout(g, str, R, o.w ? o.w - pad * 2 : 1e9);
    const bw = L.w + pad * 2, bh = L.h + pad * 2;
    let X = x, Y = y;
    if (o.align === 'center') X -= bw / 2; else if (o.align === 'right') X -= bw;
    if (o.anchor === 'bottom') Y -= bh; else if (o.anchor === 'middle') Y -= bh / 2;
    if ((o.progress ?? 1) <= 0) return { x: X, y: Y, w: bw, h: bh };
    g.ctx.fillStyle = g.th.bg; g.ctx.fillRect(X, Y, bw, bh);
    if (o.box) pen(g, { progress: o.boxProgress ?? 1 }, 'plate').rect(X, Y, bw, bh, { c: o.box === true ? 'ink' : o.box, w: 0.7 }).draw();
    if (o.brackets) {
      const c = col(g, o.brackets === true ? 'dim' : o.brackets); g.ctx.fillStyle = c;
      setFont(g, R); g.ctx.textBaseline = 'alphabetic'; g.ctx.fillText('[', X - L.cw * 0.7, Y + pad + L.cap); g.ctx.fillText(']', X + bw - L.cw * 0.3, Y + pad + L.cap);
    }
    const mid = o.align === 'center';
    text(g, str, mid ? X + bw / 2 : X + pad, Y + pad, { ...o, align: mid ? 'center' : 'left', anchor: null, w: o.w ? o.w - pad * 2 : undefined, knock: false });
    return { x: X, y: Y, w: bw, h: bh };
  }
  // Size of a line of text in world units: { w, h, cw } (cw = one character, it's mono)
  function measure(g, str, r) { const L = layout(g, str, role(g, r), 1e9); return { w: L.w, h: L.h, cw: L.cw }; }
  // A centred plate that appears when t0 arrives and types on over dur (nothing before t0).
  function typeAt(g, t0, dur, str, x, y, o = {}) {
    if (g.t < t0) return null;
    return plate(g, str, x, y, { align: 'center', cursor: 'typing', ...o, progress: clamp((g.t - t0) / Math.max(dur, 1e-6)) });
  }
  // The system voice: a small green mono line. '// 01 folders'
  function label(g, str, x, y, o = {}) {
    return text(g, str, x, y, { role: 'label', c: 'sys', ...o });
  }
  // The terminal header: // LEFT ─── [ 00:12:04 ] ─── right. o: left, right, clock ('HH:MM:SS' start, or false), y, c
  function hud(g, o = {}) { return screen(g, () => hudOnScreen(g, o)); }
  function hudOnScreen(g, o) {
    const ctx = g.ctx, R = role(g, 'label'), y = o.y ?? (g.tall ? g.safe.y - 14 : 8), c = col(g, o.c ?? 'sys');
    const x0 = o.x0 ?? (g.tall ? g.safe.x : g.W * 0.12), x1 = o.x1 ?? (g.tall ? g.safe.x + g.safe.w : g.W * 0.88);
    const L = layout(g, 'M', R, 1e9), mid = y + L.cap / 2;
    let clock = '';
    const hms = (tot) => [tot / 3600, (tot / 60) % 60, tot % 60].map((v) => String(Math.floor(v)).padStart(2, '0')).join(':');
    if (o.time != null) clock = `[ ${hms(Math.max(0, o.time))} ]`;  // a fixed timestamp in seconds, e.g. where an answer sits in a recording
    else if (o.clock !== false && o.clock != null && !/^\d+:\d+:\d+$/.test(o.clock)) clock = `[ ${o.clock} ]`;  // a literal: '1973'
    else if (o.clock !== false) {
      const [h, m, s] = String(o.clock || '00:00:00').split(':').map(Number), tot = h * 3600 + m * 60 + s + Math.floor(g.t);
      clock = `[ ${[tot / 3600, (tot / 60) % 60, tot % 60].map((v) => String(Math.floor(v)).padStart(2, '0')).join(':')} ]`;
    }
    const left = o.left ?? '// SYS.ANALOG', right = o.right ?? 'terminal_audio';
    const a = text(g, left, x0, y, { role: 'label', c }), b = text(g, right, x1, y, { role: 'label', c, align: 'right' });
    ctx.strokeStyle = c; ctx.lineWidth = 0.22; ctx.lineCap = 'butt';
    const gap = L.cw * 1.2;
    if (clock) {
      const cw = clock.length * L.cw, cx = (x0 + a.w + x1 - b.w) / 2;
      text(g, clock, cx, y, { role: 'label', c, align: 'center' });
      [[x0 + a.w + gap, cx - cw / 2 - gap], [cx + cw / 2 + gap, x1 - b.w - gap]].forEach(([p, q]) => { ctx.beginPath(); ctx.moveTo(p, mid); ctx.lineTo(q, mid); ctx.stroke(); });
    } else { ctx.beginPath(); ctx.moveTo(x0 + a.w + gap, mid); ctx.lineTo(x1 - b.w - gap, mid); ctx.stroke(); }
    return { y, h: L.cap };
  }
  // The line under the picture. Short lines ('all you.') use role 'big'; o: role, y, progress, cursor
  function caption(g, str, o = {}) { return screen(g, () => captionOnScreen(g, str, o)); }
  function captionOnScreen(g, str, o) {
    const R = o.role ?? (str.replace(/\*/g, '').length <= 12 ? 'big' : g.tall ? 'head' : 'head');
    const y = o.y ?? (g.tall ? 222 : g.H - 12);
    return plate(g, str, g.W / 2, y, { align: 'center', anchor: 'bottom', w: g.tall ? g.safe.w : g.W - 40, cursor: 'typing', ...o, role: R });
  }
  // Spoken words for Shorts, 1 to 3 at a time, the word being said in the accent.
  let SUBS = null;
  function subtitles(g, o = {}) { return screen(g, () => subtitlesOnScreen(g, o)); }
  function subtitlesOnScreen(g, o) {
    if (!SUBS) {
      SUBS = []; let cur = [];
      P.words.forEach((w, i) => {
        cur.push(w);
        const nx = P.words[i + 1];
        if (!nx || cur.length >= (o.max || 3) || /[.,!?;:]$/.test(w.text) || nx.start - w.end > 0.35) { SUBS.push(cur); cur = []; }
      });
    }
    const t = g.t;
    const i = SUBS.findIndex((c, k) => t >= c[0].start && t < (SUBS[k + 1] ? Math.min(SUBS[k + 1][0].start, c[c.length - 1].end + 0.6) : c[c.length - 1].end + 0.6));
    if (i < 0) return null;
    const lit = SUBS[i].reduce((k, w, n) => (t >= w.start ? n : k), 0);
    const words = SUBS[i].map((w, n) => { const s = w.text.replace(/[.,;:]+$/, '').toLowerCase(); return n === lit ? `*${s}*` : s; });
    return plate(g, words.join(' '), g.W / 2, o.y ?? (g.tall ? 212 : g.H - 26), { align: 'center', role: o.role || 'head', w: g.tall ? g.safe.w : g.W - 60 });
  }

  // ── rooms ───────────────────────────────────────────────────────────────
  // 'night' (black, default), 'paper' (ink on cream), 'grid' (black with a faint dot grid),
  // 'desk' (a long desk line at y), 'floor' (a floor line). Returns { floor }.
  function room(g, kind = 'night', o = {}) {
    if (kind === 'paper' || o.theme === 'paper') { g.th = THEMES.paper; paint(g); }
    const floor = o.floor ?? (g.tall ? 250 : 150);
    if (kind === 'grid') {
      const ctx = g.ctx, gap = o.gap ?? 10; ctx.fillStyle = g.th.faint;
      for (let y = gap / 2; y < g.H; y += gap) for (let x = gap / 2; x < g.W; x += gap) ctx.fillRect(x - 0.3, y - 0.3, 0.6, 0.6);
    }
    if (kind === 'desk' || kind === 'floor') {
      const p = pen(g, { progress: o.progress, still: true }, 'room');
      const x0 = o.x0 ?? g.W * 0.08, x1 = o.x1 ?? g.W * 0.92;
      p.line(x0, floor, x1, floor + (kind === 'desk' ? -2 : 0), { bow: 0.004 });
      if (kind === 'desk') p.line(x0 + 30, floor + 6, x0 + (x1 - x0) * 0.55, floor + 5, { bow: 0.01, w: 0.8 });
      p.draw();
    }
    return { floor };
  }

  // ── marks: the hand pointing things out ─────────────────────────────────
  function arrow(g, x0, y0, x1, y1, o = {}) {
    const p = pen(g, o, 'arrow'), dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, b = (o.bend ?? 0.12) * L;
    const mx = (x0 + x1) / 2 + (-dy / L) * b, my = (y0 + y1) / 2 + (dx / L) * b;
    const pts = smooth([[x0, y0], [mx, my], [x1, y1]], 1);
    p.path(pts, { c: o.c });
    const [ax, ay] = pts[Math.max(0, pts.length - 5)], ang = Math.atan2(y1 - ay, x1 - ax), h = o.head ?? 4;
    p.path([[x1 + Math.cos(ang + 2.6) * h, y1 + Math.sin(ang + 2.6) * h], [x1, y1], [x1 + Math.cos(ang - 2.5) * h * 0.9, y1 + Math.sin(ang - 2.5) * h * 0.9]], { c: o.c });
    return p.draw();
  }
  // The loose loop drawn round something to say "this one". Accent by default.
  function ring(g, x, y, w, h, o = {}) {
    const p = pen(g, o, 'ring');
    p.ellipse(x + w / 2, y + h / 2, w / 2 + 3, h / 2 + 3, { c: o.c ?? 'accent', over: 0.5, drift: 0.08, a0: -2.4 });
    return p.draw();
  }
  function underline(g, x, y, w, o = {}) {
    const p = pen(g, o, 'underline');
    p.line(x - 1, y, x + w + 1, y - 1, { c: o.c ?? 'accent', bow: 0.03 });
    if (o.double) p.line(x + 2, y + 2, x + w - 3, y + 1.5, { c: o.c ?? 'accent', bow: 0.03, w: 0.8 });
    return p.draw();
  }
  function mark(g, x, y, kind = 'check', o = {}) {
    const p = pen(g, { ...o, x, y, s: o.s ?? 1 }, 'mark');
    if (kind === 'check') p.path([[-4, 0], [-1.2, 3.5], [5, -5]], { c: o.c ?? 'accent', smooth: true });
    else { p.line(-4, -4, 4, 4, { c: o.c ?? 'warn' }); p.line(4, -4, -4, 4, { c: o.c ?? 'warn' }); }
    return p.draw();
  }
  function scribble(g, x, y, w, h, o = {}) {  // crossed out
    const p = pen(g, o, 'scribble'), n = o.n ?? 5, pts = [];
    for (let i = 0; i <= n; i++) pts.push([x + (i / n) * w, i % 2 ? y + h : y]);
    p.path(pts, { c: o.c ?? 'warn', smooth: true, w: 0.8 });
    return p.draw();
  }
  // Speech bubble with a tail toward `to`. o: w, role, progress (types the words), c
  function bubble(g, str, x, y, o = {}) {
    const pad = 4, R = role(g, o.role || 'body'), L = layout(g, str, R, (o.w ?? 90) - pad * 2), w = L.w + pad * 2, h = L.h + pad * 2;
    const X = o.align === 'center' ? x - w / 2 : x, p = pen(g, { progress: o.boxProgress ?? 1 }, 'bubble');
    const pts = rrect(X, y, w, h, 4);
    p.knock(pts); p.path(pts, { closed: true, w: 0.8 });
    if (o.to) {
      const cx = clamp(o.to[0], X + 6, X + w - 6), below = o.to[1] > y + h, by = below ? y + h : y;
      p.knock([[cx - 3.5, by], [o.to[0], o.to[1]], [cx + 3.5, by]]);
      p.path([[cx - 3.5, by], [o.to[0], o.to[1]], [cx + 3.5, by]], { w: 0.8 });
      p.path([[cx - 2.6, by], [cx + 2.6, by]], { c: 'bg', w: 1.4, wob: 0 });
    }
    p.draw();
    text(g, str, X + pad, y + pad, { role: R, progress: o.progress, c: o.c, w: w - pad * 2, cursor: 'typing' });
    return { x: X, y, w, h };
  }
  // Thought cloud; o as bubble.
  function thought(g, str, x, y, o = {}) {
    const pad = 5, R = role(g, o.role || 'body'), L = layout(g, str, R, (o.w ?? 90) - pad * 2), w = L.w + pad * 2, h = L.h + pad * 2;
    const X = o.align === 'center' ? x - w / 2 : x, p = pen(g, {}, 'thought'), pts = [];
    const cx = X + w / 2, cy = y + h / 2, rx = w / 2 + 3, ry = h / 2 + 3, nb = Math.max(7, Math.round((w + h) / 9));
    for (let i = 0; i <= nb * 6; i++) { const a = (i / (nb * 6)) * Math.PI * 2, u = (i % 6) / 6, bump = 1 + 0.16 * Math.sin(u * Math.PI); pts.push([cx + Math.cos(a) * rx * bump, cy + Math.sin(a) * ry * bump]); }
    p.knock(pts); p.path(pts, { closed: true, w: 0.8 });
    if (o.to) [0.35, 0.62, 0.82].forEach((q, i) => p.circle(lerp(cx, o.to[0], q), lerp(cy + ry, o.to[1], q), 1.8 - i * 0.5, { w: 0.7 }));
    p.draw(o.boxProgress ?? 1);
    text(g, str, X + pad, y + pad, { role: R, progress: o.progress, c: o.c, w: w - pad * 2, cursor: 'typing' });
    return { x: X, y, w, h };
  }

  // ── diagrams ────────────────────────────────────────────────────────────
  // A box with words in it. o: lit (accent frame), fill (accent fill, dark words), role, progress, w, h
  function box(g, str, x, y, o = {}) {
    const pad = 4, R = role(g, o.role || 'body'), L = layout(g, str, R, o.w ? o.w - pad * 2 : 1e9);
    const w = o.w ?? L.w + pad * 2, h = o.h ?? L.h + pad * 2, X = o.align === 'center' ? x - w / 2 : x, Y = o.anchor === 'middle' ? y - h / 2 : y;
    const p = pen(g, { progress: o.progress }, 'box');
    const pts = [[X, Y], [X + w, Y], [X + w, Y + h], [X, Y + h]];
    p.knock(pts);
    if (o.fill) p.fill(pts, { c: o.fill === true ? 'accent' : o.fill });
    p.rect(X, Y, w, h, { c: o.lit ? 'accent' : o.c, r: o.r });
    p.draw();
    if ((o.progress ?? 1) > 0.5) text(g, str, X + w / 2, Y + (h - L.h) / 2, { role: R, align: 'center', c: o.fill ? 'bg' : o.lit ? 'accent' : o.tc, progress: clamp(((o.progress ?? 1) - 0.5) * 2), w: w - pad * 2 });
    return { x: X, y: Y, w, h, cx: X + w / 2, cy: Y + h / 2 };
  }
  // Boxes joined by arrows. steps: strings. o: active (index lit), progress (walks along), gap, w, vertical
  function flow(g, x, y, steps, o = {}) {
    const gap = o.gap ?? 14, n = steps.length, prog = o.progress ?? 1, out = [];
    let cx = x, cy = y;
    steps.forEach((s, i) => {
      const q = clamp(prog * n - i);
      const b = box(g, s, cx, cy, { w: o.w, lit: o.active === i, progress: q, role: o.role, anchor: o.vertical ? null : 'middle' });
      out.push(b);
      if (i < n - 1 && q >= 1) {
        const q2 = clamp((prog * n - i - 1) * 2);
        if (o.vertical) arrow(g, b.cx, b.y + b.h + 2, b.cx, b.y + b.h + gap - 2, { bend: 0, head: 2.5, progress: q2 });
        else arrow(g, b.x + b.w + 2, b.cy, b.x + b.w + gap - 2, b.cy, { bend: 0.05, head: 2.5, progress: q2 });
      }
      if (o.vertical) cy = b.y + b.h + gap; else cx = b.x + b.w + gap;
    });
    return out;
  }
  // Layers, index 0 at the bottom. o: highlight, progress, rh
  function stack(g, x, y, w, layers, o = {}) {
    const rh = o.rh ?? (g.tall ? 16 : 13), n = layers.length, prog = o.progress ?? 1;
    layers.forEach((s, i) => { const yy = y + (n - 1 - i) * (rh + 2); box(g, s, x, yy, { w, h: rh, lit: o.highlight === i, progress: clamp(prog * n - i), role: o.role ?? 'label' }); });
    return { h: n * (rh + 2) };
  }
  // nodes [{id, x, y, label}], edges [[a, b]]. o: active (id lit), progress
  function graph(g, nodes, edges, o = {}) {
    const by = Object.fromEntries(nodes.map((nd) => [nd.id, nd])), prog = o.progress ?? 1;
    edges.forEach(([a, b], i) => { const A = by[a], B = by[b]; pen(g, { progress: clamp(prog * 2 - 1 + (edges.length - i) * 0.05) }, 'edge').line(A.x, A.y, B.x, B.y, { w: 0.7, c: 'dim' }).draw(); });
    nodes.forEach((nd, i) => box(g, nd.label, nd.x, nd.y, { align: 'center', anchor: 'middle', lit: o.active === nd.id, role: 'label', progress: clamp(prog * 2 - i * 0.15), r: 3 }));
  }
  // Hand-drawn bars. o: labels, lit (index in accent), progress, max
  function chart(g, x, y, w, h, values, o = {}) {
    const p = pen(g, {}, 'chart'), n = values.length, max = o.max ?? Math.max(...values), bw = (w / n) * 0.6, prog = o.progress ?? 1;
    p.line(x, y, x, y + h, { w: 0.7 }); p.line(x, y + h, x + w, y + h, { w: 0.7 });
    p.draw(clamp(prog * 3));
    values.forEach((v, i) => {
      const q = P.ease.out(clamp(prog * (n + 1) - i - 1)), bh = (v / max) * (h - 4) * q, bx = x + (i + 0.5) * (w / n) - bw / 2;
      if (bh <= 0.5) return;
      const b = pen(g, {}, 'bar'), pts = [[bx, y + h], [bx, y + h - bh], [bx + bw, y + h - bh], [bx + bw, y + h]];
      if (o.lit === i) b.fill(pts); else b.hatch(pts, { gap: 1.8, c: 'dim' });
      b.path(pts, { c: o.lit === i ? 'accent' : 'ink', w: 0.8 }).draw();
      if (o.labels) text(g, o.labels[i], bx + bw / 2, y + h + 3, { role: 'label', align: 'center', c: o.lit === i ? 'accent' : 'dim' });
    });
  }
  // A hand line graph. o: progress, lit (last point dot)
  function trend(g, x, y, w, h, values, o = {}) {
    const p = pen(g, { progress: o.progress }, 'trend'), max = Math.max(...values), min = Math.min(...values, 0);
    const pts = values.map((v, i) => [x + (i / (values.length - 1)) * w, y + h - ((v - min) / (max - min || 1)) * h]);
    p.line(x, y + h, x + w, y + h, { w: 0.6, c: 'dim' });
    p.path(pts, { c: o.c ?? 'accent', smooth: true });
    p.draw();
    if ((o.progress ?? 1) >= 1 && o.lit !== false) { const [lx, ly] = pts[pts.length - 1]; g.ctx.fillStyle = col(g, o.c ?? 'accent'); g.ctx.beginPath(); g.ctx.arc(lx, ly, 1.4, 0, 7); g.ctx.fill(); }
    return pts;
  }

  // ── screens and files ───────────────────────────────────────────────────
  // A terminal window: hand frame, mono lines typed in order. '$ ' starts a command (accent prompt).
  // o: title, progress (types all lines), lines per second is up to you; cursor blinks at the end
  function terminal(g, x, y, w, h, lines, o = {}) {
    const p = pen(g, { progress: o.frame ?? 1 }, 'terminal'), bar = g.tall ? 9 : 8;
    p.knock([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
    p.rect(x, y, w, h, { r: 2 }); p.line(x, y + bar, x + w, y + bar, { w: 0.7 });
    [0, 1, 2].forEach((i) => p.circle(x + 4 + i * 4.2, y + bar / 2, 1.1, { w: 0.6, c: i === 0 ? 'accent' : 'dim' }));
    p.draw();
    if (o.title) text(g, o.title, x + w / 2, y + bar / 2 - 1.8, { role: 'label', align: 'center', c: 'dim' });
    const R = role(g, o.role || 'code'), L = layout(g, 'M', R, 1e9), total = lines.reduce((a, l) => a + l.length + 1, 0);
    let n = Math.floor(clamp(o.progress ?? 1) * total), yy = y + bar + 3;
    const maxLines = Math.floor((h - bar - 4) / L.lh), vis = lines.slice(Math.max(0, lines.length - maxLines));
    let cur = null;
    const skip = lines.length - vis.length;
    lines.forEach((ln, i) => {
      if (n <= 0 || i < skip) { n -= ln.length + 1; return; }
      const cmd = ln.startsWith('$ '), shown = ln.slice(0, n);
      if (cmd) { text(g, '$', x + 3, yy, { role: R, c: 'accent' }); text(g, shown.slice(2), x + 3 + L.cw * 2, yy, { role: R, c: o.c, raw: true }); }
      else text(g, shown, x + 3, yy, { role: R, c: 'dim', raw: true });
      cur = [x + 3 + shown.length * L.cw, yy];
      n -= ln.length + 1; yy += L.lh;
    });
    if (cur && Math.floor(g.t * 2) % 2 === 0) { g.ctx.fillStyle = g.th.ink; g.ctx.fillRect(cur[0] + L.cw * 0.1, cur[1] - L.cap * 0.05, L.cw * 0.75, L.cap * 1.1); }
    return { x, y: y + bar, w, h: h - bar };
  }
  // Code lines; o.highlight = line index underlined in accent
  function code(g, x, y, w, lines, o = {}) {
    const R = role(g, o.role || 'code'), L = layout(g, 'M', R, 1e9), total = lines.reduce((a, l) => a + l.length + 1, 0);
    let n = Math.floor(clamp(o.progress ?? 1) * total);
    lines.forEach((ln, i) => {
      const yy = y + i * L.lh, hl = o.highlight === i;
      if (n > 0) text(g, ln.slice(0, n), x, yy, { role: R, raw: true, c: hl ? 'accent' : ln.trim().startsWith('#') || ln.trim().startsWith('//') ? 'dim' : 'ink' });
      n -= ln.length + 1;
    });
    return { h: lines.length * L.lh };
  }
  // A page with a folded corner. o: name (label under it), lit (accent fold), lines (count of text lines), s
  function file(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y, s: o.s ?? 1 }, 'file'), w = 16, h = 20, f = 5;
    const pts = [[0, 0], [w - f, 0], [w, f], [w, h], [0, h]];
    p.knock(pts); p.poly(pts);
    p.path([[w - f, 0], [w - f, f], [w, f]], { w: 0.7 });
    if (o.lit) p.fill([[w - f, 0], [w - f, f], [w, f]]);
    for (let i = 0; i < (o.lines ?? 4); i++) p.line(3, 8 + i * 3, i === (o.lines ?? 4) - 1 ? 9 : w - 3, 8 + i * 3, { w: 0.5, c: 'dim' });
    p.draw();
    if (o.name && (o.progress ?? 1) > 0.6) text(g, o.name, x + (w / 2) * p.T.s, y + h * p.T.s + 3, { role: 'label', align: 'center', c: o.lit ? 'accent' : 'dim', progress: clamp(((o.progress ?? 1) - 0.6) / 0.4) });
    return { x, y, w: w * p.T.s, h: h * p.T.s };
  }
  function folder(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y, s: o.s ?? 1 }, 'folder'), w = 24, h = 17;
    const back = [[0, 2], [8, 2], [10, 0], [w, 0], [w, h], [0, h]];
    p.knock(back); p.poly(back);
    if (o.open) { const front = [[2, 6], [w + 2, 6], [w - 1, h], [0, h]]; p.knock(front); if (o.lit) p.fill(front); p.poly(front); }
    else { p.line(0, 4.5, w, 4.5, { w: 0.7 }); if (o.lit) p.fill([[0.5, 5], [w - 0.5, 5], [w - 0.5, h - 0.5], [0.5, h - 0.5]]); }
    p.draw();
    if (o.name && (o.progress ?? 1) > 0.6) text(g, o.name, x + (w / 2) * p.T.s, y + h * p.T.s + 3, { role: 'label', align: 'center', c: o.lit ? 'accent' : 'dim', progress: clamp(((o.progress ?? 1) - 0.6) / 0.4) });
    return { x, y, w: w * p.T.s, h: h * p.T.s };
  }
  // A folder tree in mono with hand-drawn branch lines. o: highlight (index), progress
  function tree(g, x, y, lines, o = {}) {
    const R = role(g, o.role || 'code'), L = layout(g, 'M', R, 1e9), n = lines.length, prog = o.progress ?? 1;
    lines.forEach((ln, i) => {
      const q = clamp(prog * n - i); if (q <= 0) return;
      const depth = ln.match(/^ */)[0].length / 2, name = ln.trim(), yy = y + i * L.lh, xx = x + depth * L.cw * 2.2;
      if (depth > 0) pen(g, { progress: q }, 'branch').path([[xx - L.cw * 1.6, yy - L.lh * 0.55], [xx - L.cw * 1.6, yy + L.cap / 2], [xx - L.cw * 0.4, yy + L.cap / 2]], { w: 0.5, c: 'dim' }).draw();
      text(g, name, xx, yy, { role: R, c: o.highlight === i ? 'accent' : name.endsWith('/') ? 'ink' : 'dim', progress: q });
    });
    return { h: n * L.lh };
  }
  // A browser window. o: title/url, lines (grey text bars), progress
  function browser(g, x, y, w, h, o = {}) {
    const p = pen(g, { progress: o.progress }, 'browser'), bar = 9;
    p.knock([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
    p.rect(x, y, w, h, { r: 2 }); p.line(x, y + bar, x + w, y + bar, { w: 0.7 });
    p.rect(x + 16, y + 2.2, w - 22, bar - 4.4, { r: 2, w: 0.5, c: 'dim' });
    [0, 1, 2].forEach((i) => p.circle(x + 3.6 + i * 3.6, y + bar / 2, 0.9, { w: 0.5, c: 'dim' }));
    for (let i = 0; i < (o.lines ?? 0); i++) p.line(x + 6, y + bar + 8 + i * 5, x + 6 + (w - 12) * (0.5 + 0.5 * hash(i, 9)), y + bar + 8 + i * 5, { w: 0.5, c: 'dim' });
    p.draw();
    if (o.url) text(g, o.url, x + 19, y + bar / 2 - 1.6, { role: 'label', c: 'dim' });
    return { x, y: y + bar, w, h: h - bar };
  }
  const IMAGES = new Map();
  function image(src) {
    if (!IMAGES.has(src)) { const im = new Image(); im.src = src; IMAGES.set(src, im); P.wait(P.loaded(im, src)); }
    return IMAGES.get(src);
  }
  // A real page inside a hand-drawn browser. o: url, progress (draws the frame, then the page wipes in), scroll 0..1, crop [l, r]
  function screenshot(g, img, x, y, w, h, o = {}) {
    const p = clamp(o.progress ?? 1);
    if (p <= 0) return null;
    const inner = browser(g, x, y, w, h, { url: o.url, progress: clamp(p * 2) });
    const q = clamp(p * 2 - 1);
    if (q > 0 && img.complete && img.naturalWidth) {
      const ctx = g.ctx, [c0, c1] = o.crop || [0, 1], ix = img.naturalWidth * c0, iw = img.naturalWidth * (c1 - c0);
      const ww = inner.w - 2, hh = inner.h - 1.5, k = ww / iw, over = Math.max(0, img.naturalHeight * k - hh), sy = (over * clamp(o.scroll ?? 0)) / k;
      ctx.save(); ctx.beginPath(); ctx.rect(inner.x + 1, inner.y + 0.5, ww * q, hh); ctx.clip();
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, ix, sy, iw, Math.min(img.naturalHeight - sy, hh / k), inner.x + 1, inner.y + 0.5, ww, Math.min(hh, (img.naturalHeight - sy) * k));
      ctx.restore();
    }
    return inner;
  }
  // Tokens in a row; o.window [a, b] brackets the ones the model can see
  function tokens(g, x, y, words, o = {}) {
    const R = role(g, o.role || 'code'), L = layout(g, 'M', R, 1e9);
    let xx = x;
    words.forEach((wd, i) => {
      const s = wd.trim(), w = s.length * L.cw + 4, inside = o.window && i >= o.window[0] && i < o.window[1];
      box(g, s, xx, y, { w, h: L.cap + 5, role: R, lit: inside, progress: o.progress == null ? 1 : clamp(o.progress * words.length - i) });
      xx += w + 2;
    });
    return { w: xx - x };
  }

  // ── props (local units, s scales) ───────────────────────────────────────
  // Each returns anchors in world units. All take { s, flip, progress }.
  function laptop(g, x, y, o = {}) {  // 3/4 view, screen facing right; o.screen: 'code' | 'lit' | 'off'
    const p = pen(g, { ...o, x, y }, 'laptop');
    const deck = [[-26, 0], [0, 0], [4, -4.5], [-22, -4.5]], scr = [[-22, -4.5], [4, -4.5], [0, -26], [-25, -24]];
    p.knock(scr); p.poly(scr, { smooth: false });
    const inner = [[-19.5, -7], [1.3, -7], [-1.8, -23.6], [-22.4, -22]];
    if ((o.screen ?? 'code') !== 'off') p.path(inner, { closed: true, c: 'accent', w: 0.8 });
    p.knock(deck); p.poly(deck);
    p.fill([[-22.5, -0.8], [-3.5, -0.8], [-1, -3.6], [-19.8, -3.6]], { shift: 0.2 });
    p.line(-26, 0, 0, 0, { w: 1.1 });
    if ((o.screen ?? 'code') === 'code') {
      const scroll = Math.floor((g.t * (o.speed ?? 3))) % 20;
      for (let i = 0; i < 7; i++) {
        const k = i + scroll, ind = [0, 2, 2, 4, 2, 0, 4][k % 7], len = 3 + hash(k, 5) * 9, yy = -20.5 + i * 2.1, u = (yy + 22) / 15, xl = lerp(-21.6, -19.3, u) + ind * 0.9;
        p.line(xl, yy, xl + len, yy - 0.1, { c: 'accent', w: 0.45, exact: true, bow: 0 });
        if (hash(k, 7) > 0.55) p.line(xl + len + 1.2, yy, xl + len + 1.2 + 2 + hash(k, 8) * 3, yy, { c: 'accent', w: 0.45, exact: true, bow: 0 });
      }
    }
    p.draw();
    return { screen: p.map([-10, -15]), keys: p.map([-10, -2.5]), hinge: p.map([-9, -4.5]) };
  }
  function mug(g, x, y, o = {}) {  // o.steam, o.coffee (accent inside), o.tilt
    const p = pen(g, { ...o, x, y }, 'mug'), w = 7, h = 8;
    const body = [[-w / 2, -h], [w / 2, -h], [w / 2 - 0.3, -0.4], [-w / 2 + 0.3, -0.4]];
    p.knock(body);
    p.ellipse(0, -h, w / 2, 1.1, { a0: 0, over: 0.1, drift: 0 });
    if (o.coffee !== false) p.fill([[-w / 2 + 0.6, -h + 0.3], [w / 2 - 0.6, -h + 0.3], [w / 2 - 0.9, -h + 1.1], [-w / 2 + 0.9, -h + 1.1]]);
    p.path([[-w / 2, -h], [-w / 2 + 0.3, -0.8], [0, 0], [w / 2 - 0.3, -0.8], [w / 2, -h]], { smooth: true });
    p.arc(w / 2 + 0.2, -h / 2 - 0.2, 2.4, 2.4, -1.4, 1.4, { w: 0.9 });
    p.arc(w / 2 + 0.2, -h / 2 - 0.2, 1.2, 1.3, -1.2, 1.2, { w: 0.6 });
    if (o.steam !== false) for (let i = 0; i < 3; i++) {
      const ph = g.t * 1.4 + i * 1.9, lift = (ph % 3) / 3, pts = [];
      for (let j = 0; j < 6; j++) pts.push([-1.6 + i * 1.6 + Math.sin(ph * 1.3 + j * 1.2) * 0.9, -h - 2 - j * 1.4 - lift * 2.5]);
      p.path(pts, { smooth: true, w: 0.55, c: 'dim' });
    }
    p.draw();
    return { top: p.map([0, -h]), handle: p.map([w / 2 + 2.4, -h / 2]) };
  }
  function lamp(g, x, y, o = {}) {  // desk lamp; o.on lights the bulb and the cone
    const p = pen(g, { ...o, x, y }, 'lamp');
    p.ellipse(0, -0.8, 7, 1.4, { over: 0.1 });
    p.line(0, -1.6, 5, -18); p.line(5, -18, -6, -28);
    p.dot(5, -18, 0.9);
    const shade = [[-6, -28], [-12, -32], [-15, -24], [-9, -22]];
    p.knock(shade); p.poly(shade);
    if (o.on) {
      p.fill([[-9, -22.6], [-14.2, -24.4], [-12.5, -22], [-10.2, -21.2]]);
      [[-16, -19], [-13, -16.5], [-9.5, -15]].forEach(([a, b], i) => p.line(-11.5 + i * 0.5, -21 + i * 0.3, a, b, { c: 'accent', w: 0.5 }));
    }
    p.draw();
    return { bulb: p.map([-11.5, -22]) };
  }
  function plant(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'plant'), pot = [[-5, -8], [5, -8], [3.8, 0], [-3.8, 0]];
    const sway = Math.sin(g.t * 0.8) * 0.6;
    [[-1, -9, -8 + sway, -22], [0.5, -9, 3 + sway, -26], [1, -9, 9 + sway, -19], [-0.5, -9, -4 + sway, -17]].forEach(([a, b, c2, d]) => {
      const mx = (a + c2) / 2, my = (b + d) / 2;
      p.path([[a, b], [mx - 3, my - 1], [c2, d], [mx + 2, my + 2], [a, b]], { smooth: true, w: 0.8 });
      p.line(a, b, (a + c2 * 2) / 3, (b + d * 2) / 3, { w: 0.45 });
    });
    p.knock(pot); p.poly(pot); p.line(-5.2, -6.6, 5.2, -6.6, { w: 0.7 });
    p.draw();
    return {};
  }
  function books(g, x, y, o = {}) {  // a stack; o.n, o.lit (index in accent)
    const p = pen(g, { ...o, x, y }, 'books'), n = o.n ?? 3;
    for (let i = 0; i < n; i++) {
      const w = 22 - hash(i, 3) * 6, h = 4.2, off = (hash(i, 4) - 0.5) * 4, yy = -(i + 1) * h;
      const pts = [[-w / 2 + off, yy], [w / 2 + off, yy], [w / 2 + off, yy + h], [-w / 2 + off, yy + h]];
      p.knock(pts); if (o.lit === i) p.fill(pts);
      p.rect(-w / 2 + off, yy, w, h, { r: 0.8 });
      p.line(w / 2 + off - 2.5, yy + 0.6, w / 2 + off - 2.5, yy + h - 0.6, { w: 0.45 });
    }
    p.draw();
    return { top: p.map([0, -n * 4.2]) };
  }
  function bulb(g, x, y, o = {}) {  // idea; o.on: accent glass and rays
    const p = pen(g, { ...o, x, y }, 'bulb'), glass = [];
    for (let i = 0; i <= 24; i++) { const a = Math.PI * 0.72 + (i / 24) * Math.PI * 1.56; glass.push([Math.cos(a) * 7, -17 + Math.sin(a) * 7]); }
    const shape = [...glass, [3.2, -6.5], [3, -3], [-3, -3], [-3.2, -6.5]];
    p.knock(shape);
    if (o.on) p.fill(glass.map(([a, b]) => [a * 0.85, -17 + (b + 17) * 0.85]));
    p.path([[-3.2, -6.5], ...glass, [3.2, -6.5]], { smooth: true });
    p.path([[-3, -6.5], [-3, -1.5], [3, -1.5], [3, -6.5]], { w: 0.8 });
    p.line(-3, -4, 3, -4, { w: 0.5 }); p.line(-1.5, -0.2, 1.5, -0.2, { w: 0.8 });
    p.path([[-1.5, -6.5], [-1.5, -13], [0, -11], [1.5, -13], [1.5, -6.5]], { w: 0.45, c: o.on ? 'bg' : 'dim' });
    if (o.on) for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.48, r0 = 10, r1 = 13 + (i % 2) * 1.5; p.line(Math.cos(a) * r0, -17 + Math.sin(a) * r0, Math.cos(a) * r1, -17 + Math.sin(a) * r1, { c: 'accent', w: 0.7 }); }
    p.draw();
    return { top: p.map([0, -26]) };
  }
  function clock(g, x, y, o = {}) {  // hands turn with time; o.speed (hours per second), o.r
    const p = pen(g, { ...o, x, y }, 'clock'), R = o.r ?? 9, t = g.t * (o.speed ?? 0.02) + (o.at ?? 10.1);
    p.knock(Array.from({ length: 20 }, (_, i) => [Math.cos(i / 20 * 7) * R, Math.sin(i / 20 * 7) * R]));
    p.circle(0, 0, R);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; p.line(Math.cos(a) * R * 0.78, Math.sin(a) * R * 0.78, Math.cos(a) * R * 0.88, Math.sin(a) * R * 0.88, { w: i % 3 ? 0.4 : 0.7, exact: true }); }
    const ha = (t / 12) * Math.PI * 2 - Math.PI / 2, ma = t * Math.PI * 2 - Math.PI / 2;
    p.line(0, 0, Math.cos(ha) * R * 0.5, Math.sin(ha) * R * 0.5, { w: 0.9, exact: true });
    p.line(0, 0, Math.cos(ma) * R * 0.75, Math.sin(ma) * R * 0.75, { w: 0.6, exact: true, c: o.lit ? 'accent' : 'ink' });
    p.dot(0, 0, 0.8);
    p.draw();
    return {};
  }
  function envelope(g, x, y, o = {}) {  // o.open, o.lit (accent seal)
    const p = pen(g, { ...o, x, y }, 'envelope'), w = 22, h = 14, pts = [[0, 0], [w, 0], [w, h], [0, h]];
    p.knock(pts); p.rect(0, 0, w, h, { r: 0.8 });
    if (o.open) { p.path([[0, 0], [w / 2, -8], [w, 0]], { w: 0.8 }); p.path([[0, h], [w / 2, h * 0.45], [w, h]], { w: 0.7 }); }
    else { p.path([[0, 0], [w / 2, h * 0.58], [w, 0]], { w: 0.8 }); if (o.lit) p.circle(w / 2, h * 0.58, 1.7, { c: 'accent' }); }
    p.draw();
    return { mouth: p.map([w / 2, 0]) };
  }
  function phone(g, x, y, o = {}) {  // o.lit (a notification), o.lines
    const p = pen(g, { ...o, x, y }, 'phone'), w = 12, h = 22;
    p.knock([[0, 0], [w, 0], [w, h], [0, h]]); p.rect(0, 0, w, h, { r: 2 });
    p.line(4.5, 1.8, 7.5, 1.8, { w: 0.6 });
    if (o.lit) p.fill([[1.8, 4], [w - 1.8, 4], [w - 1.8, 8], [1.8, 8]]);
    for (let i = 0; i < (o.lines ?? 3); i++) p.line(2.2, 11 + i * 2.6, w - 2.2 - hash(i, 2) * 3, 11 + i * 2.6, { w: 0.45, c: 'dim' });
    p.draw();
    return {};
  }
  function monitor(g, x, y, o = {}) {  // flat screen on a stand; o.w, o.h, returns the screen rect to draw into
    const p = pen(g, { ...o, x, y }, 'monitor'), w = o.w ?? 44, h = o.h ?? 28;
    p.knock([[-w / 2, -h - 8], [w / 2, -h - 8], [w / 2, -8], [-w / 2, -8]]);
    p.rect(-w / 2, -h - 8, w, h, { r: 1.5 });
    p.path([[-2.5, -8], [-3, -1], [3, -1], [2.5, -8]], { w: 0.8 });
    p.ellipse(0, -0.6, 9, 1.2, { over: 0.1, w: 0.9 });
    p.draw();
    const [ax, ay] = p.map([-w / 2 + 2, -h - 6]), [bx, by] = p.map([w / 2 - 2, -10]);
    return { x: Math.min(ax, bx), y: ay, w: Math.abs(bx - ax), h: by - ay };
  }
  function crt(g, x, y, o = {}) {  // the old terminal
    const p = pen(g, { ...o, x, y }, 'crt');
    p.knock([[-18, -34], [18, -34], [20, 0], [-20, 0]]);
    p.path([[-18, -34], [18, -34], [20, -4], [-20, -4]], { closed: true });
    p.rect(-14, -30.5, 28, 21, { r: 4, w: 0.8 });
    p.path([[-20, -4], [-21, 0], [21, 0], [20, -4]], { w: 0.8 });
    p.dot(15, -7, 0.7);
    if (o.lit !== false) { p.line(-11, -26, -1, -26, { c: 'accent', w: 0.55 }); p.line(-11, -23, 4, -23, { c: 'accent', w: 0.55 }); p.line(-11, -20, -6, -20, { c: 'accent', w: 0.55 }); if (Math.floor(g.t * 2) % 2 === 0) p.fill([[-5, -21], [-3.4, -21], [-3.4, -19], [-5, -19]]); }
    p.draw();
    return { screen: p.map([0, -20]) };
  }
  function keyboard(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'keyboard'), w = 40, h = 11;
    p.knock([[-w / 2, -h], [w / 2, -h], [w / 2 + 2, 0], [-w / 2 - 2, 0]]);
    p.path([[-w / 2, -h], [w / 2, -h], [w / 2 + 2, 0], [-w / 2 - 2, 0]], { closed: true });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) { const xx = -w / 2 + 2.5 + c * 3.6 + r * 0.7 - r * 0.2, yy = -h + 2 + r * 3; p.line(xx, yy, xx + 2, yy, { w: 0.45, exact: true }); }
    p.line(-8, -1.8, 8, -1.8, { w: 0.5, exact: true });
    p.draw();
    return {};
  }
  function server(g, x, y, o = {}) {  // a rack; o.n units, o.active blinks a light
    const p = pen(g, { ...o, x, y }, 'server'), n = o.n ?? 4, w = 22, uh = 7;
    for (let i = 0; i < n; i++) {
      const yy = -(i + 1) * uh; p.knock([[-w / 2, yy], [w / 2, yy], [w / 2, yy + uh], [-w / 2, yy + uh]]);
      p.rect(-w / 2, yy, w, uh - 0.8, { r: 0.8 });
      p.line(-w / 2 + 3, yy + uh / 2 - 0.4, 2, yy + uh / 2 - 0.4, { w: 0.45, c: 'dim' });
      const on = o.active && Math.floor(g.t * 3 + i * 1.7) % 2 === 0;
      p.circle(w / 2 - 3.5, yy + uh / 2 - 0.4, 0.9, { w: 0.5, c: on ? 'accent' : 'ink' });
    }
    p.draw();
    return { top: p.map([0, -n * uh]) };
  }
  function db(g, x, y, o = {}) {  // a database cylinder
    const p = pen(g, { ...o, x, y }, 'db'), w = 10, h = 18;
    p.knock([[-w, -h], [w, -h], [w, 0], [-w, 0]]);
    p.ellipse(0, -h, w, 2.6, { over: 0.1 });
    p.line(-w, -h, -w, -2); p.line(w, -h, w, -2);
    p.arc(0, -2, w, 2.6, Math.PI, 0, { });
    p.arc(0, -h / 2 - 1, w, 2.6, Math.PI, 0, { w: 0.6 });
    if (o.lit) p.fill(Array.from({ length: 16 }, (_, i) => [Math.cos(i / 16 * Math.PI * 2) * (w - 1), -h + Math.sin(i / 16 * Math.PI * 2) * 1.8]));
    p.draw();
    return { top: p.map([0, -h - 3]) };
  }
  function gear(g, x, y, o = {}) {  // turns with time; o.r, o.speed, o.lit
    const p = pen(g, { ...o, x, y }, 'gear'), R = o.r ?? 9, n = o.teeth ?? 8, a0 = g.t * (o.speed ?? 0.6), pts = [];
    for (let i = 0; i < n; i++) for (const [u, rr] of [[0, R], [0.18, R + 2.6], [0.42, R + 2.6], [0.6, R]]) { const a = a0 + ((i + u) / n) * Math.PI * 2; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    p.knock(pts);
    if (o.lit) p.fill(pts.map(([a, b]) => [a * 0.97, b * 0.97]));
    p.poly(pts, { w: 0.9 }); p.circle(0, 0, R * 0.35, { w: 0.8, c: o.lit ? 'bg' : 'ink' });
    p.draw();
    return {};
  }
  function cloud(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'cloud'), pts = [];
    const bumps = [[-10, 0, 5], [-5, -4, 6], [3, -5, 7], [10, -1, 5], [8, 3, 4], [-2, 3.5, 4], [-9, 3, 4]];
    bumps.forEach(([cx, cy, r2]) => { for (let i = 0; i <= 8; i++) { const a = Math.atan2(cy, cx) - 1.3 + (i / 8) * 2.6; pts.push([cx + Math.cos(a) * r2, cy + Math.sin(a) * r2]); } });
    p.knock(pts); p.path(pts, { closed: true, smooth: true });
    p.draw();
    return {};
  }
  function magnifier(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'magnifier');
    p.knock(Array.from({ length: 16 }, (_, i) => [Math.cos(i / 16 * 6.3) * 7, Math.sin(i / 16 * 6.3) * 7]));
    p.circle(0, 0, 7); p.arc(0, 0, 4.8, 4.8, -2.6, -1.6, { w: 0.5 });
    p.path([[5, 5], [12, 12]], { w: 2.2 });
    p.draw();
    return { lens: [x, y] };
  }
  function lock(g, x, y, o = {}) {  // o.open
    const p = pen(g, { ...o, x, y }, 'lock'), body = [[-7, -10], [7, -10], [7, 0], [-7, 0]];
    p.arc(o.open ? 3 : 0, -10, 4.5, 6, Math.PI, Math.PI * 2, { w: 1.1 });
    p.knock(body); if (o.lit) p.fill(body); p.rect(-7, -10, 14, 10, { r: 1.2 });
    p.circle(0, -5.5, 1.3, { w: 0.6, c: o.lit ? 'bg' : 'ink' });
    p.draw();
    return {};
  }
  function calendar(g, x, y, o = {}) {  // o.text on the page (a year, a day)
    const p = pen(g, { ...o, x, y }, 'calendar'), w = 20, h = 20;
    p.knock([[0, 0], [w, 0], [w, h], [0, h]]); p.rect(0, 0, w, h, { r: 1 }); p.line(0, 5, w, 5, { w: 0.8 });
    p.line(5, -1.8, 5, 2, { w: 0.9 }); p.line(15, -1.8, 15, 2, { w: 0.9 });
    p.draw();
    if (o.text) text(g, o.text, x + (w / 2) * p.T.s, y + 7.6 * p.T.s, { role: o.role || 'body', align: 'center', c: o.lit ? 'accent' : 'ink' });
    return {};
  }
  function hourglass(g, x, y, o = {}) {  // o.p 0..1 sand fallen
    const p = pen(g, { ...o, x, y }, 'hourglass'), q = clamp(o.p ?? (g.t * 0.1) % 1);
    p.line(-7, -24, 7, -24, { w: 1.1 }); p.line(-7, 0, 7, 0, { w: 1.1 });
    p.path([[-5.5, -23.5], [-5, -16], [-0.8, -12], [-5, -8], [-5.5, -0.5]], { smooth: true });
    p.path([[5.5, -23.5], [5, -16], [0.8, -12], [5, -8], [5.5, -0.5]], { smooth: true });
    const top = -12.5 - (1 - q) * 8, tw = 4.2 * (1 - q) + 0.8;
    if (q < 1) p.fill([[-tw, top], [tw, top], [0.5, -12.5], [-0.5, -12.5]], { shift: 0 });
    const bh = 1 + q * 7;
    p.fill([[-4.8, -0.6], [4.8, -0.6], [0.6 + (1 - q) * 3, -0.6 - bh], [-0.6 - (1 - q) * 3, -0.6 - bh]], { shift: 0 });
    if (q < 1) p.line(0, -12.5, 0, -1.5, { c: 'accent', w: 0.35, exact: true });
    p.draw();
    return {};
  }
  function cursorArrow(g, x, y, o = {}) {  // a mouse pointer; o.click (t0: ring pops out)
    const p = pen(g, { ...o, x, y }, 'cursor'), pts = [[0, 0], [0, 12], [3, 9.2], [5.4, 14], [7.2, 13.1], [4.9, 8.5], [8.6, 8.2]];
    p.knock(pts); p.poly(pts, { w: 0.8 });
    if (o.click != null && g.t >= o.click && g.t < o.click + 0.4) { const q = (g.t - o.click) / 0.4; p.circle(0, 0, 2 + q * 6, { c: 'accent', w: 0.6 }); }
    p.draw();
    return {};
  }
  function chair(g, x, y, o = {}) {  // side view, facing left
    const p = pen(g, { ...o, x, y }, 'chair');
    p.path([[-8, -18], [8, -18]], { w: 1 }); p.path([[7, -18], [9, -36], [12, -37]], { smooth: true });
    p.line(0, -18, 0, -6); p.path([[-9, 0], [0, -6], [9, 0]], { w: 0.8 });
    p.dot(-9, 0.6, 1); p.dot(9, 0.6, 1);
    p.draw();
    return { seat: p.map([0, -18]) };
  }

  // ── people ──────────────────────────────────────────────────────────────
  // Front-facing, drawn in contour lines. Local units: feet at y 0, about 64 tall at s 1.
  const CAST = {
    curly: { hair: 'curly', top: 'hoodie' },
    bun: { hair: 'bun', glasses: true, top: 'sweater' },
    beard: { hair: 'short', beard: true, top: 'shirt' },
    long: { hair: 'long', top: 'sweater' },
    bald: { hair: 'bald', glasses: true, top: 'shirt', tie: true },
  };
  // Hand targets relative to the shoulder, right arm, x outward (left arm mirrored). 'chin' / 'mouth' reach the face.
  const POSES = {
    idle: [[1.8, 18.5], [1.8, 18.5]], wave: [[1.8, 18.5], [7, -15]], point: [[1.8, 18.5], [18.5, -1.5]],
    pointUp: [[1.8, 18.5], [4.5, -18]], present: [[1.8, 18.5], [14, 5]], cheer: [[6.5, -17], [6.5, -17]],
    shrug: [[12, -1], [12, -1]], think: [[1.8, 18.5], 'chin'], hold: [[-5.5, 11.5], [-5.5, 11.5]],
    type: [[-4.5, 13.5], [-4.5, 13.5]], hips: [[0.2, 15.5], [0.2, 15.5]], sad: [[0.6, 19], [0.6, 19]], sip: [[1.8, 18.5], 'mouth'],
  };
  const FACE = { cheer: 'happy', wave: 'happy', present: 'happy', sad: 'sad', think: 'think' };
  // o: x, y (feet), s, pose, face ('happy' | 'sad' | 'think' | 'wow'), reach { r: [x, y], l: [x, y] } (world),
  //    look (-1..1 eyes), talk (false = mouth still), walk, progress (draws them on), hold ('mug' in the right hand)
  // Returns { head, mouth, hands: { l, r }, top } in world units.
  function person(g, who = 'curly', o = {}) {
    const d = typeof who === 'string' ? CAST[who] || CAST.curly : who;
    const p = pen(g, { ...o, s: o.s ?? 1 }, 'person:' + (typeof who === 'string' ? who : 'custom'));
    const t = g.t, lvl = o.talk === false ? 0 : o.level ?? P.level(t);
    const bob = o.walk ? (Math.floor(t * 6) % 2) * 0.8 : 0, Y = (v) => v - bob;
    const cx = 0, cy = Y(-54), rx = 6, ry = 7.2, look = (o.look ?? 0) * 0.9;
    const face = o.face || FACE[o.pose] || (lvl > 0.5 ? 'wow' : 'base');
    // legs and shoes (under everything)
    const step = o.walk ? (Math.floor(t * 6) % 2 ? 1 : -1) : 0;
    [-1, 1].forEach((sd) => {
      const lift = o.walk && step === sd ? 1.4 : 0;
      p.path([[sd * 9.3, Y(-22.5)], [sd * 8.8, -11 - lift], [sd * 8.3, -2.2 - lift]], { smooth: true });
      p.path([[sd * 1.2, Y(-19.5)], [sd * 1.8, -11 - lift], [sd * 2.4, -2.2 - lift]], { smooth: true });
      p.path([[sd * 8.4, -2.2 - lift], [sd * 10.8, -0.9 - lift], [sd * 10.4, 0.2 - lift], [sd * 2.2, 0.2 - lift], [sd * 2.4, -2.2 - lift]], { smooth: true, w: 0.95 });
    });
    p.path([[-1.2, Y(-19.5)], [0, Y(-20.6)], [1.2, Y(-19.5)]], { smooth: true, w: 0.8 });
    // torso
    const torso = [[-2.6, Y(-44.2)], [-6.2, Y(-43.6)], [-9.4, Y(-41.8)], [-10.6, Y(-37.5)], [-10.3, Y(-30)], [-9.6, Y(-22.5)],
      [0, Y(-22)], [9.6, Y(-22.5)], [10.3, Y(-30)], [10.6, Y(-37.5)], [9.4, Y(-41.8)], [6.2, Y(-43.6)], [2.6, Y(-44.2)]];
    p.knock(torso);
    p.path(torso.slice(0, 6), { smooth: true }); p.path(torso.slice(7).reverse(), { smooth: true });
    p.path([[-9.6, Y(-22.5)], [0, Y(-22)], [9.6, Y(-22.5)]], { smooth: true });
    if (d.top === 'hoodie') {
      p.path([[-5.8, Y(-43.8)], [-2.5, Y(-41.4)], [0, Y(-40.9)], [2.5, Y(-41.4)], [5.8, Y(-43.8)]], { smooth: true, w: 0.9 });
      p.line(-1.3, Y(-41.2), -1.5, Y(-36.5), { w: 0.55 }); p.line(1.3, Y(-41.2), 1.5, Y(-37.2), { w: 0.55 });
      p.path([[-5.2, Y(-22.2)], [-4.4, Y(-28)], [4.4, Y(-28)], [5.2, Y(-22.2)]], { w: 0.6 });
    } else if (d.top === 'sweater') {
      p.path([[-2.8, Y(-44)], [0, Y(-42.4)], [2.8, Y(-44)]], { smooth: true, w: 0.8 });
      p.path([[-9.4, Y(-24.3)], [0, Y(-23.8)], [9.4, Y(-24.3)]], { smooth: true, w: 0.5 });
    } else {
      p.path([[-2.8, Y(-44.2)], [-1.2, Y(-40.2)], [0, Y(-42)], [1.2, Y(-40.2)], [2.8, Y(-44.2)]], { w: 0.8 });
      if (d.tie) { const tie = [[0, Y(-41.6)], [-1.3, Y(-39.8)], [-1.8, Y(-30)], [0, Y(-28.2)], [1.8, Y(-30)], [1.3, Y(-39.8)]]; p.knock(tie); p.poly(tie, { w: 0.7 }); }
      else [-37, -32.5, -28].forEach((yy) => p.dot(0.2, Y(yy), 0.45));
    }
    // neck + head
    p.line(-1.9, Y(-47.6), -2.1, Y(-44.3), { w: 0.85 }); p.line(1.9, Y(-47.6), 2.1, Y(-44.3), { w: 0.85 });
    const headPts = [];
    for (let i = 0; i <= 24; i++) { const a = Math.PI * 1.08 - (i / 24) * Math.PI * 1.16, sn = Math.sin(a); headPts.push([cx + Math.cos(a) * rx * (1 - 0.12 * Math.max(0, sn) ** 3), cy + sn * ry * (sn > 0 ? 1.04 : 1)]); }
    const fullHead = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; fullHead.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    p.knock(fullHead);
    // ears
    p.arc(-rx - 0.2, cy + 0.6, 1.3, 1.7, Math.PI * 0.45, Math.PI * 1.55, { w: 0.7 }); p.arc(rx + 0.2, cy + 0.6, 1.3, 1.7, -Math.PI * 0.55, Math.PI * 0.55, { w: 0.7 });
    if (d.hair === 'bald') p.ellipse(cx, cy, rx, ry, { a0: -0.3, over: 0.15 }); else p.path(headPts, { smooth: true });
    hair(p, d.hair, cx, cy, rx, ry);
    // face
    const blink = (t + (o.blinkOffset ?? 0.4)) % 3.7 < 0.12;
    [-1, 1].forEach((sd) => {
      const ex = cx + sd * 2.3 + look, ey = cy - 0.6;
      if (blink) p.line(ex - 0.6, ey, ex + 0.6, ey, { w: 0.55, exact: true }); else p.dot(ex, ey, face === 'wow' ? 0.65 : 0.55);
      const lift = face === 'sad' ? (sd < 0 ? 0.6 : 0.6) : face === 'happy' ? -0.4 : face === 'think' && sd > 0 ? -0.8 : 0;
      const tilt = face === 'sad' ? -0.7 : face === 'angry' ? 0.8 : 0;
      p.line(ex - 1.1 * sd - 0.1, ey - 2.2 + lift + tilt * (sd < 0 ? 1 : -1) * -0.5, ex + 1.1 * sd, ey - 2.3 + lift - tilt * 0.3, { w: 0.5, exact: true });
      if (d.glasses) p.circle(ex, ey, 1.9, { w: 0.5 });
    });
    if (d.glasses) { p.line(cx - 0.5 + look, cy - 0.8, cx + 0.5 + look, cy - 0.8, { w: 0.45, exact: true }); p.line(cx - 4.2, cy - 0.8, cx - rx + 0.2, cy - 0.2, { w: 0.45 }); p.line(cx + 4.2, cy - 0.8, cx + rx - 0.2, cy - 0.2, { w: 0.45 }); }
    p.path([[cx + 0.2 + look, cy + 0.4], [cx + 0.9 + look, cy + 2.5], [cx - 0.1 + look, cy + 2.8]], { smooth: true, w: 0.5 });
    const my = cy + 4.6;
    if (face === 'happy') p.arc(cx, my - 1, 2.2, 1.6, 0.2, Math.PI - 0.2, { w: 0.55 });
    else if (face === 'sad') p.arc(cx, my + 0.9, 1.6, 1, Math.PI + 0.3, Math.PI * 2 - 0.3, { w: 0.55 });
    else if (lvl > 0.15) p.ellipse(cx, my, 1.1 + lvl * 0.3, 0.35 + lvl * 1.1, { w: 0.5, over: 0.05, a0: 0 });
    else p.line(cx - 1.4, my, cx + 1.3, my - 0.15, { w: 0.5, bow: 0.1 });
    if (d.beard) {
      const bpts = []; for (let i = 0; i <= 14; i++) { const a = Math.PI * 1.02 - (i / 14) * Math.PI * 1.04, sn = Math.sin(a); bpts.push([cx + Math.cos(a) * (rx + 0.5), cy + sn * (ry + 1.6) + 0.5]); }
      p.path(bpts, { smooth: true, w: 0.75 });
      p.path([[cx - 2.6, my - 0.7], [cx - 1, my - 1.5], [cx, my - 1.1], [cx + 1, my - 1.5], [cx + 2.6, my - 0.7]], { smooth: true, w: 0.6 });
      for (let i = 0; i < 5; i++) { const a = Math.PI * 0.2 + i * 0.16 * Math.PI; p.line(cx + Math.cos(a) * 4.2, cy + Math.sin(a) * 6.2 + 0.8, cx + Math.cos(a) * 5.2, cy + Math.sin(a) * 7.8 + 0.8, { w: 0.35 }); }
    }
    // arms, drawn over the torso
    const pose = POSES[o.pose] || POSES.idle, hands = {};
    [['l', -1, pose[0]], ['r', 1, pose[1]]].forEach(([key, sd, off]) => {
      const sx = sd * 8.2, sy = Y(-40.8);
      let tx, ty;
      const reach = o.reach && o.reach[key];
      if (reach) [tx, ty] = p.unmap(reach);
      else if (off === 'chin') { tx = cx + sd * 1.5; ty = cy + ry + 1.5; }
      else if (off === 'mouth') { tx = cx + sd * 3.5; ty = cy + 5.5; }
      else { let [dx, dy] = off; if (o.pose === 'wave' && key === 'r') dx += Math.sin(t * 10) * 2.2; if (o.pose === 'type') dy += (Math.floor(t * 8 + (sd > 0 ? 1 : 0)) % 2) * 0.8; tx = sx + sd * dx; ty = sy + dy; }
      const hand = arm(p, sx, sy, tx, ty, sd, (off === 'chin' || off === 'mouth') && !reach, key === 'r' && (o.pose === 'point' || o.pose === 'pointUp' || (!!reach && o.point !== false)));
      hands[key] = p.map(hand);
    });
    if (o.hold === 'mug') mugInHand(p, ...p.unmap(hands.r));
    p.draw();
    return { head: p.map([cx, cy - ry - 3]), mouth: p.map([cx, cy + 4.6]), hands, top: p.map([cx, cy - ry - 3]) };
  }
  // Two-bone arm drawn as a sleeve outline with a mitten hand. Returns the hand point (local).
  function arm(p, sx, sy, tx, ty, sd, inward, point) {
    const L1 = 9.6, L2 = 9.2;
    let vx = tx - sx, vy = ty - sy;
    const d = Math.hypot(vx, vy) || 1, dd = Math.min(d, (L1 + L2) * 0.985);
    vx /= d; vy /= d;
    const a = (dd * dd + L1 * L1 - L2 * L2) / (2 * dd), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    let nx = -vy, ny = vx;
    if (nx * sd + ny * (inward ? 0.9 : 0.4) < 0) { nx = -nx; ny = -ny; }
    const E = [sx + vx * a + nx * h, sy + vy * a + ny * h], Hn = [sx + vx * dd, sy + vy * dd];
    const center = smooth([[sx, sy], E, Hn], 0.8), side = (k) => {
      const out = [];
      center.forEach((c, i) => {
        const a2 = center[Math.max(0, i - 1)], b2 = center[Math.min(center.length - 1, i + 1)], tx2 = b2[0] - a2[0], ty2 = b2[1] - a2[1], tl = Math.hypot(tx2, ty2) || 1;
        const w = lerp(2.1, 1.55, i / (center.length - 1));
        out.push([c[0] - (ty2 / tl) * w * k, c[1] + (tx2 / tl) * w * k]);
      });
      return out;
    };
    const A = side(1), B = side(-1);
    p.knock([...A, ...B.slice().reverse()]);
    p.path(A.slice(1)); p.path(B.slice(1));
    const cuff = [A[A.length - 1], B[B.length - 1]];
    p.path(cuff, { w: 0.7 });
    const fx = Hn[0] - E[0], fy = Hn[1] - E[1], fl = Math.hypot(fx, fy) || 1, ux = fx / fl, uy = fy / fl;
    const hx = Hn[0] + ux * 1.7, hy = Hn[1] + uy * 1.7;
    let bx = -uy, by = ux; if (by > 0) { bx = -bx; by = -by; }  // the thumb side faces up
    const hand = [];
    for (let i = 0; i < 16; i++) { const a2 = (i / 16) * Math.PI * 2, al = Math.cos(a2) * 2.2, ac = Math.sin(a2) * 1.55; hand.push([hx + ux * al + bx * ac, hy + uy * al + by * ac]); }
    p.knock(hand); p.path(hand, { closed: true, smooth: true, w: 0.8 });
    p.path([[hx - ux * 0.6 + bx * 1.4, hy - uy * 0.6 + by * 1.4], [hx + ux * 0.4 + bx * 2.4, hy + uy * 0.4 + by * 2.4], [hx + ux * 1.3 + bx * 1.6, hy + uy * 1.3 + by * 1.6]], { smooth: true, w: 0.6 });
    if (point) p.path([[hx + ux * 2, hy + uy * 2], [hx + ux * 4.2, hy + uy * 4.2]], { w: 0.9 });
    return [hx + ux * (point ? 4 : 1.5), hy + uy * (point ? 4 : 1.5)];
  }
  function mugInHand(p, hx, hy) {
    const body = [[hx - 5.5, hy - 4.5], [hx + 0.5, hy - 4.5], [hx + 0.2, hy + 3], [hx - 5.2, hy + 3]];
    p.knock(body); p.path([[hx - 5.5, hy - 4.5], [hx - 5.2, hy + 3], [hx + 0.2, hy + 3], [hx + 0.5, hy - 4.5]]);
    p.ellipse(hx - 2.5, hy - 4.5, 3, 0.8, { w: 0.7, over: 0.1 });
    p.fill([[hx - 4.8, hy - 4.3], [hx - 0.2, hy - 4.3], [hx - 0.5, hy - 3.6], [hx - 4.5, hy - 3.6]]);
  }
  function hair(p, kind, cx, cy, rx, ry) {
    if (kind === 'bald') { p.arc(cx - rx + 0.8, cy - 1, 1.4, 2.4, Math.PI * 0.6, Math.PI * 1.4, { w: 0.6 }); p.arc(cx + rx - 0.8, cy - 1, 1.4, 2.4, -Math.PI * 0.4, Math.PI * 0.4, { w: 0.6 }); return; }
    const outer = [], n = kind === 'curly' ? 9 : 1, a0 = Math.PI * 1.1, a1 = Math.PI * 1.9 + 0.1;
    const R = kind === 'curly' ? 1.9 : 1.0;
    for (let i = 0; i <= 90; i++) {
      const q = i / 90, a = a0 + (a1 - a0) * q, u = (q * n) % 1, bump = kind === 'curly' ? 1.3 * Math.sqrt(Math.sin(u * Math.PI)) : 0;
      outer.push([cx + Math.cos(a) * (rx + R + bump), cy + Math.sin(a) * (ry + R + bump) - 0.6]);
    }
    const hairline = kind === 'curly'
      ? Array.from({ length: 31 }, (_, i) => { const q = i / 30, x = cx - rx - 0.6 + q * (2 * rx + 1.2), u = (q * 6) % 1; return [x, cy - ry * 0.42 + 1.4 * Math.sqrt(Math.sin(u * Math.PI)) - Math.sin(q * Math.PI) * 1.6]; })
      : [[cx - rx - 0.4, cy - 1], [cx - rx + 1.5, cy - ry * 0.55], [cx - 1.5, cy - ry * 0.72], [cx + 2.5, cy - ry * 0.52], [cx + rx - 0.8, cy - ry * 0.45], [cx + rx + 0.4, cy - 1]];
    p.knock([...outer, ...hairline.slice().reverse()]);
    if (kind === 'long') {
      p.path([[cx - rx - 1.1, cy - 2], [cx - rx - 2.2, cy + 5], [cx - rx - 2.8, cy + 11], [cx - rx - 1, cy + 12.5]], { smooth: true });
      p.path([[cx + rx + 1.1, cy - 2], [cx + rx + 2.2, cy + 5], [cx + rx + 2.8, cy + 11], [cx + rx + 1, cy + 12.5]], { smooth: true });
    }
    p.path(outer, { smooth: true });
    p.path(hairline, { smooth: true, w: 0.85 });
    if (kind === 'curly') {
      [[-3.8, -4.6], [0, -5.8], [3.6, -4.8], [-1.8, -3.2], [2, -3], [-5, -2.2], [5.2, -2.4]].forEach(([dx, dy], i) => {
        const a = p.r() * 6.28; p.arc(cx + dx, cy - ry + 2 + dy * 0.6 - 1, 1.1, 1.0, a, a + 4.2, { w: 0.55 });
      });
    } else if (kind === 'short') {
      p.line(cx - 1.5, cy - ry * 0.72, cx - 3.5, cy - ry - 0.4, { w: 0.5 }); p.line(cx + 1, cy - ry * 0.62, cx + 0.5, cy - ry - 0.6, { w: 0.5 });
    } else if (kind === 'bun') {
      p.circle(cx + 0.5, cy - ry - 4.2, 3, { w: 0.9 }); p.arc(cx + 0.5, cy - ry - 4.2, 1.5, 1.3, 0.5, 4.2, { w: 0.5 });
    } else if (kind === 'long') {
      p.line(cx - 0.5, cy - ry - 0.7, cx - 0.8, cy - ry * 0.6, { w: 0.5 });
    }
  }

  // The hero: someone at a laptop in profile, a mug in hand. Faces left. o: s, sip (0 = mug on the desk, 1 = at the mouth),
  // typing (the hand taps), steam, screen ('code' | 'lit' | 'off'), progress. Origin = the desk line under the laptop hinge.
  function coder(g, x, y, o = {}) {
    const s = o.s ?? 1, t = g.t, sip = P.ease.inOut(clamp(o.sip ?? 1));
    laptop(g, x - 1 * s * (o.flip ? -1 : 1), y, { s: s * 1.2, flip: o.flip, screen: o.screen, progress: o.progress });
    const p = pen(g, { ...o, x, y, s }, 'coder');
    // desk, then the body behind it: hunched back, the lap under the desk
    p.line(-46, 0.3, 23, -0.2, { bow: 0.004 }); p.line(-38, 6.5, 16, 6, { bow: 0.01, w: 0.8 });
    p.knock([[20, -40], [33, -46], [44, -41], [52, -28], [55, 0], [55.5, 10], [22, 10], [18, -10]]);
    p.path([[33, -45], [41, -42], [48, -35], [52, -24], [54, -10], [55, 2], [55.4, 10]], { smooth: true });
    p.path([[23, -17], [21.5, -7], [23.5, 3]], { smooth: true, w: 0.8 });
    p.path([[24.5, 3], [37, 7], [53, 8.5]], { smooth: true, w: 0.8 });
    p.path([[46, -31], [49, -20], [48.5, -9]], { smooth: true, w: 0.55 });
    p.path([[40, -27], [43.5, -18], [42.5, -12]], { smooth: true, w: 0.5 });
    // the far arm, down to the elbow and forward to the keys
    const tap = o.typing !== false ? (Math.floor(t * 8) % 2) * 0.5 : 0;
    sleeve(p, [[36, -35], [29, -18], [27, -10], [12, -7], [0, -5.6]], 3.4, 2.5);
    p.path([[26.5, -13.5], [29.5, -11.8]], { w: 0.5 });
    const hand = [[0.5, -8], [-4 - tap, -8.2], [-7.5 - tap, -6.7], [-8 - tap, -4.8], [-5, -3.5], [0.5, -3.3]];
    p.knock(hand); p.path(hand, { smooth: true, w: 0.85 });
    p.path([[-3.5 - tap, -5.6], [-6.8 - tap, -5.1]], { w: 0.45 });
    // head in profile, facing left
    const prof = [[21, -58.5], [17, -56], [15.6, -53.2], [15.2, -51.8], [12.8, -49.3], [14.6, -48.4], [14.2, -47.2], [14.9, -46.4], [14.2, -45.6], [14.6, -43.8], [16, -42.3], [19.5, -41.4], [24.5, -42.6]];
    p.knock([...prof, [28, -43], [32, -47], [33, -55], [28, -61]]);
    p.path([[19.8, -41.5], [20.6, -38], [21.2, -35]], { smooth: true, w: 0.9 });
    p.path([[31, -46.5], [32, -42], [33.5, -39]], { smooth: true, w: 0.9 });
    p.path(prof.slice(1), { smooth: true });
    p.arc(26.4, -49.3, 1.7, 2.4, -1.3, 1.9, { w: 0.8 }); p.arc(26.3, -49.3, 0.7, 1.1, -1, 1.5, { w: 0.5 });
    const blink = (t + 1.3) % 3.9 < 0.12;
    if (blink) p.line(17, -51.8, 18.4, -51.6, { w: 0.5, exact: true }); else p.dot(17.7, -51.9, 0.55);
    p.line(16.3, -54.3, 19.2, -54.8, { w: 0.5, exact: true });
    const mass = [], hc = [25.5, -53.5];
    for (let i = 0; i <= 120; i++) {
      const u = i / 120, a = Math.PI * 1.05 + u * Math.PI * 1.35, bump = 1.5 * Math.sqrt(Math.sin(((u * 12) % 1) * Math.PI));
      mass.push([hc[0] + Math.cos(a) * (9 + bump), hc[1] + Math.sin(a) * (8.6 + bump)]);
    }
    const hairline = [[17.3, -56.2], [21, -56.4], [24, -55.2], [26.6, -53.2], [28.1, -50.6], [28.9, -47.6], [29.6, -45]];
    p.knock([...mass, ...hairline.slice().reverse()]);
    p.path(mass, { smooth: true });
    p.path(hairline, { smooth: true, w: 0.7 });
    [[-4, -6], [0, -8.2], [4, -6.6], [7, -2], [7.6, 3], [-0.8, -4.4], [3.6, -2.6]].forEach(([dx, dy]) => { const a = p.r() * 6.28; p.arc(hc[0] + dx, hc[1] + dy, 1.25, 1.1, a, a + 4.3, { w: 0.55 }); });
    // the near arm brings the mug from the desk to the mouth
    const sh = [31, -36], mh = [lerp(13, 16.5, sip), lerp(-4, -42.5, sip)], L1 = 17, L2 = 20;
    const dx = mh[0] - sh[0], dy = mh[1] - sh[1], D0 = Math.hypot(dx, dy) || 1, D = Math.min(D0, L1 + L2 - 0.5), ux = dx / D0, uy = dy / D0;
    const a = (D * D + L1 * L1 - L2 * L2) / (2 * D), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const e1 = [sh[0] + ux * a - uy * h, sh[1] + uy * a + ux * h], e2 = [sh[0] + ux * a + uy * h, sh[1] + uy * a - ux * h];
    const el = e1[0] + e1[1] > e2[0] + e2[1] ? e1 : e2, wr = [mh[0] + (el[0] - mh[0]) * 0.12, mh[1] + (el[1] - mh[1]) * 0.12];
    sleeve(p, [sh, el, wr], 3.6, 2.6);
    const cup = [[mh[0] - 8.5, mh[1] - 6], [mh[0] - 1.5, mh[1] - 6], [mh[0] - 1.8, mh[1] + 3], [mh[0] - 8.2, mh[1] + 3]];
    p.knock(cup);
    p.path([[mh[0] - 8.5, mh[1] - 6], [mh[0] - 8.2, mh[1] + 2.6], [mh[0] - 5, mh[1] + 3.3], [mh[0] - 1.8, mh[1] + 2.6], [mh[0] - 1.5, mh[1] - 6]], { smooth: true });
    p.ellipse(mh[0] - 5, mh[1] - 6, 3.5, 0.9, { w: 0.7, over: 0.1 });
    p.fill([[mh[0] - 7.9, mh[1] + 0.8], [mh[0] - 2.1, mh[1] + 0.8], [mh[0] - 2.3, mh[1] + 2.2], [mh[0] - 7.7, mh[1] + 2.2]]);
    p.arc(mh[0] - 8.6, mh[1] - 1.8, 2, 2.5, Math.PI * 0.55, Math.PI * 1.45, { w: 0.8 });
    const fist = [[mh[0] - 2.5, mh[1] - 3.8], [mh[0] + 1.4, mh[1] - 4.4], [mh[0] + 2.8, mh[1] - 1], [mh[0] + 1.6, mh[1] + 1.8], [mh[0] - 2.5, mh[1] + 1.6]];
    p.knock(fist); p.path(fist, { smooth: true, w: 0.85 });
    p.path([[mh[0] - 1.8, mh[1] - 1.2], [mh[0] + 0.6, mh[1] - 1.4]], { w: 0.45 }); p.path([[mh[0] - 1.8, mh[1] + 0.3], [mh[0] + 0.4, mh[1] + 0.2]], { w: 0.45 });
    if (o.steam !== false) for (let i = 0; i < 2; i++) {
      const ph = t * 1.3 + i * 2.1, pts = [];
      for (let j = 0; j < 7; j++) pts.push([mh[0] - 6.5 + i * 2.6 + Math.sin(ph * 1.4 + j * 1.1) * 1.1, mh[1] - 8 - j * 1.6 - (ph % 3) * 0.6]);
      p.path(pts, { smooth: true, w: 0.55, c: 'dim' });
    }
    p.draw();
    return { head: p.map([24, -64]), mouth: p.map([14.5, -47]), screen: p.map([-19, -18]), mug: p.map([mh[0] - 5, mh[1] - 6]) };
  }
  // A sleeve along a centre path: a knock-out, then two outline strokes. w0 at the start, w1 at the end (half widths).
  function sleeve(p, pts, w0, w1) {
    const c = smooth(pts, 0.8), side = (k) => c.map((q, i) => {
      const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1, w = lerp(w0, w1, i / (c.length - 1));
      return [q[0] - (ty / tl) * w * k, q[1] + (tx / tl) * w * k];
    });
    const A = side(1), B = side(-1);
    p.knock([...A, ...B.slice().reverse()]);
    p.path(A); p.path(B);
    p.path([A[A.length - 1], B[B.length - 1]], { w: 0.7 });
  }

  // ── traced art: python anim.py trace <image> <name> turns a line drawing into strokes ──
  // const ART = Line.art('assets/coder.js') at the top of scene.js; Line.drawing(g, ART, x, y, w, { progress })
  const ARTS = new Map();
  function art(src) {
    if (!ARTS.has(src)) {
      const h = { src, data: null };
      ARTS.set(src, h);
      P.wait(new Promise((res) => {
        const s = document.createElement('script'); s.src = src;
        s.onload = () => { h.data = (window.LINE_ART || {})[src.split('/').pop().replace(/\.js$/, '')]; res(); };
        s.onerror = () => { console.error(`[anim] line art failed to load: ${src}`); res(); };
        document.head.appendChild(s);
      }));
    }
    return ARTS.get(src);
  }
  // Draws traced strokes at (x, y) top-left, w wide. o: progress (draws on in stroke order), wob (traced lines already wobble), weight (stroke width x)
  function drawing(g, a, x, y, w, o = {}) {
    const d = a && a.data;
    if (!d) return null;
    const s = w / d.w, p = pen(g, { wob: o.wob ?? 0.45, weight: o.weight ?? 1, progress: o.progress, x, y, s, seed: o.seed }, 'art:' + a.src);
    const lw = (d.lw * s) / LW;
    for (const f of d.fills || []) { const pts = []; for (let i = 0; i < f.p.length; i += 2) pts.push([f.p[i], f.p[i + 1]]); if (f.at === 'under') p.fill(pts, { c: f.c, shift: 0 }); }
    for (const st of d.strokes) {
      const pts = []; for (let i = 0; i < st.p.length; i += 2) pts.push([st.p[i], st.p[i + 1]]);
      p.path(pts, { c: st.c, w: lw * (st.w ?? 1) });
    }
    for (const f of d.fills || []) { if (f.at === 'under') continue; const pts = []; for (let i = 0; i < f.p.length; i += 2) pts.push([f.p[i], f.p[i + 1]]); p.fill(pts, { c: f.c, shift: 0 }); }
    p.draw();
    return { x, y, w, h: d.h * s };
  }

  // ── living backgrounds: faint, always moving, and faster while the voice is excited ──
  // bg(g, 'topo' | 'flow' | 'hills' | 'stars' | 'town', o). Draw them first. o: c (default 'ghost'), seed,
  // progress (grows out from the middle), speed. They fill whatever the camera shows (g.view).
  function bg(g, kind, o = {}) {
    const ctx = g.ctx, v = g.view, seed = o.seed ?? 7, p = clamp(o.progress ?? 1);
    if (p <= 0) return null;
    ctx.save();
    if (p < 1) {
      const cx = o.cx ?? v.x + v.w / 2, cy = o.cy ?? v.y + v.h / 2;
      ctx.beginPath(); ctx.arc(cx, cy, Math.hypot(v.w, v.h) * 0.6 * P.ease.out(p), 0, 7); ctx.clip();
    }
    ctx.strokeStyle = ctx.fillStyle = col(g, o.c ?? 'ghost'); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const clock = g.flow || g.t;
    let out = null;
    if (kind === 'topo') topo(g, v, seed, clock * (o.speed ?? 0.5), o);
    else if (kind === 'flow') flowField(g, v, seed, clock * (o.speed ?? 1), o);
    else if (kind === 'hills') out = hills(g, v, seed, o);
    else if (kind === 'stars') stars(g, v, seed, o);
    else if (kind === 'town') out = town(g, v, seed, o);
    ctx.restore();
    return out;
  }
  // Contour lines of a drifting landscape (marching squares). o: cell, scale, levels, lit (one level in the accent)
  function topo(g, v, seed, drift, o) {
    const ctx = g.ctx, cs = o.cell ?? 3, sc = o.scale ?? 0.02, m = cs * 2;
    const x0 = Math.floor((v.x - m) / cs) * cs, y0 = Math.floor((v.y - m) / cs) * cs;
    const nx = Math.ceil((v.w + 2 * m) / cs) + 1, ny = Math.ceil((v.h + 2 * m) / cs) + 1, F = new Float32Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) F[j * nx + i] = fbm(seed, (x0 + i * cs) * sc + drift * 0.08, (y0 + j * cs) * sc - drift * 0.03);
    const levels = o.levels ?? 18;
    for (let L = 0; L < levels; L++) {
      const th = -0.75 + (1.5 * (L + 0.5)) / levels;
      ctx.lineWidth = L % 4 === 0 ? 0.42 : 0.26;
      ctx.strokeStyle = col(g, o.lit === L ? 'accent' : o.c ?? 'ghost');
      ctx.beginPath();
      for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
        const a = F[j * nx + i], b = F[j * nx + i + 1], c = F[(j + 1) * nx + i + 1], d = F[(j + 1) * nx + i];
        const idx = (a > th ? 8 : 0) | (b > th ? 4 : 0) | (c > th ? 2 : 0) | (d > th ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const X = x0 + i * cs, Y = y0 + j * cs;
        const T = [X + (cs * (th - a)) / (b - a), Y], R = [X + cs, Y + (cs * (th - b)) / (c - b)];
        const B = [X + (cs * (th - d)) / (c - d), Y + cs], L2 = [X, Y + (cs * (th - a)) / (d - a)];
        const seg = (p1, p2) => { ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); };
        if (idx === 1 || idx === 14) seg(L2, B);
        else if (idx === 2 || idx === 13) seg(B, R);
        else if (idx === 3 || idx === 12) seg(L2, R);
        else if (idx === 4 || idx === 11) seg(T, R);
        else if (idx === 5) { seg(L2, T); seg(B, R); }
        else if (idx === 6 || idx === 9) seg(T, B);
        else if (idx === 7 || idx === 8) seg(L2, T);
        else if (idx === 10) { seg(L2, B); seg(T, R); }
      }
      ctx.stroke();
    }
  }
  // Ink currents: dashed streamlines through a slowly turning field. o: n, steps, dir (radians), pace
  function flowField(g, v, seed, clock, o) {
    const ctx = g.ctx, n = o.n ?? Math.round((v.w * v.h) / 240), steps = o.steps ?? 22, st = o.step ?? 2.4;
    ctx.lineWidth = o.w ?? 0.3; ctx.setLineDash([st * 3, st * 2.2]);
    for (let i = 0; i < n; i++) {
      let x = v.x + hash(i, seed) * v.w, y = v.y + hash(i, seed + 1) * v.h;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let q = 0; q < steps; q++) {
        const a = noise2(seed + 3, x * 0.011, y * 0.011 + clock * 0.02) * Math.PI * 1.3 + (o.dir ?? 0);
        x += Math.cos(a) * st; y += Math.sin(a) * st; ctx.lineTo(x, y);
      }
      ctx.lineDashOffset = -(clock * (o.pace ?? 9) + i * 7);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  // Rolling hills in three layers with trees and a road; o.scroll = how far along the road we are (the layers
  // slide at different speeds), o.ground = y of the road. Returns { ground }.
  function hills(g, v, seed, o) {
    const ground = o.ground ?? g.H * 0.8, scroll = o.scroll ?? 0;
    [[0.25, ground - 44, 12, 'ghost'], [0.5, ground - 25, 9, 'ghost'], [0.8, ground - 10, 5, 'dim']].forEach(([depth, base, amp, c], L) => {
      const off = scroll * depth, yAt = (x) => base + amp * noise(seed + L * 11, (x + off) * 0.018) + amp * 0.35 * noise(seed + L * 11 + 5, (x + off) * 0.07);
      const p = pen(g, { nib: false }, 'hill' + L), pts = [];
      for (let x = v.x - 8; x <= v.x + v.w + 8; x += 4) pts.push([x, yAt(x)]);
      p.path(pts, { c, w: L === 2 ? 0.7 : 0.55 });
      if (o.trees !== false && L > 0) {
        const cell = L === 1 ? 16 : 23;
        for (let q = Math.floor((v.x - 10 + off) / cell); q * cell - off < v.x + v.w + 10; q++) {
          if (hash(q, seed + 90 + L) < 0.62) continue;
          const tx = q * cell - off + cell * 0.5, ty = yAt(tx), s2 = L === 1 ? 0.8 : 1.2;
          p.line(tx, ty, tx, ty - 3.2 * s2, { c, w: 0.5 });
          if (hash(q, seed + 70) > 0.5) p.circle(tx, ty - 6 * s2, 3.1 * s2, { c, w: 0.5 });
          else p.path([[tx - 3 * s2, ty - 3 * s2], [tx, ty - 10 * s2], [tx + 3 * s2, ty - 3 * s2]], { closed: true, c, w: 0.5 });
        }
      }
      p.draw();
    });
    if (o.road !== false) {
      const p = pen(g, { nib: false }, 'road');
      p.line(v.x - 6, ground, v.x + v.w + 6, ground, { bow: 0.002, w: 0.9, c: o.roadC });
      for (let q = Math.floor((v.x + scroll) / 9); q * 9 - scroll < v.x + v.w + 9; q++) {
        const tx = q * 9 - scroll + hash(q, 5) * 4;
        p.line(tx, ground + 2.4 + hash(q, 6) * 2, tx + 2.5, ground + 2.2 + hash(q, 6) * 2, { w: 0.4, c: 'ghost', exact: true, bow: 0 });
      }
      p.draw();
    }
    return { ground };
  }
  function stars(g, v, seed, o) {
    const ctx = g.ctx, n = o.n ?? Math.round((v.w * v.h) / 170);
    for (let i = 0; i < n; i++) {
      const x = v.x + hash(i, seed) * v.w, y = v.y + hash(i, seed + 1) * v.h, tw = 0.5 + 0.5 * Math.sin(g.t * (1 + hash(i, seed + 2) * 2) + i);
      ctx.beginPath(); ctx.arc(x, y, 0.16 + hash(i, seed + 3) * 0.32 * (0.55 + 0.45 * tw), 0, 7); ctx.fill();
      if (hash(i, seed + 4) > 0.97) { ctx.lineWidth = 0.2; ctx.beginPath(); ctx.moveTo(x - 1.4 * tw, y); ctx.lineTo(x + 1.4 * tw, y); ctx.moveTo(x, y - 1.4 * tw); ctx.lineTo(x, y + 1.4 * tw); ctx.stroke(); }
    }
  }
  // A skyline along the ground; o.lit = the number of the one window lit in the accent. Returns { windows: [[x, y], ...] }.
  function town(g, v, seed, o) {
    const ground = o.ground ?? g.H * 0.86, p = pen(g, { nib: false }, 'town'), windows = [];
    let x = v.x - 4, i = 0;
    while (x < v.x + v.w + 4) {
      const w = 14 + hash(i, seed) * 18, h = 18 + hash(i, seed + 1) * 40;
      p.knock([[x, ground - h], [x + w, ground - h], [x + w, ground], [x, ground]]);
      p.rect(x, ground - h, w, h, { c: o.c ?? 'ghost', w: 0.6 });
      for (let wy = ground - h + 4; wy < ground - 5; wy += 6) for (let wx = x + 3; wx < x + w - 4; wx += 5) {
        if (hash(windows.length + i * 7, seed + 3) < 0.55) { windows.push(null); continue; }
        const idx = windows.length, lit = idx === o.lit, also = (o.also || []).includes(idx), pts = [[wx, wy], [wx + 1.8, wy], [wx + 1.8, wy + 2.4], [wx, wy + 2.4]];
        p.fill(pts, { shift: 0, wob: 0.12, c: lit ? 'accent' : also ? 'ink' : o.c ?? 'ghost' });
        windows.push([wx + 0.9, wy + 1.2]);
      }
      x += w + 1 + hash(i, seed + 2) * 3; i++;
    }
    p.draw();
    return { windows: windows.filter(Boolean) };
  }

  // ── morphs: one drawing flowing into the next ───────────────────────────
  // const A = Line.capture(g, () => Line.bicycle(g, ...)), B = Line.capture(g, () => Line.head(g, ...));
  // Line.morph(g, A, B, p): the strokes pair up by where they sit and travel; extras shrink away or grow in.
  function capture(g, fn) {
    const prev = g.capturing;
    g.capturing = [];
    let out;
    try { fn(); } finally { out = g.capturing; g.capturing = prev; }
    return out;
  }
  function resampleN(pts, K) {
    if (pts.length < 2) return Array.from({ length: K }, () => [pts[0][0], pts[0][1]]);
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
    const L = cum[cum.length - 1] || 1e-6, out = [];
    let j = 0;
    for (let i = 0; i < K; i++) {
      const s = (L * i) / (K - 1);
      while (j < cum.length - 2 && cum[j + 1] < s) j++;
      const u = clamp((s - cum[j]) / (cum[j + 1] - cum[j] || 1e-6));
      out.push([lerp(pts[j][0], pts[j + 1][0], u), lerp(pts[j][1], pts[j + 1][1], u)]);
    }
    return out;
  }
  function morph(g, A, B, p, o = {}) {
    p = clamp(p);
    if (p <= 0) return replay(g, A, o);
    if (p >= 1) return replay(g, B, o);
    const e = P.ease.inOut(p), K = 32;
    const prep = (S) => S.filter((s) => s.kind === 'stroke').map((s) => {
      const q = resampleN(s.pts, K);
      return { ...s, q, cen: [q.reduce((a, v) => a + v[0], 0) / K, q.reduce((a, v) => a + v[1], 0) / K], len: plen(s.pts) };
    });
    const a = prep(A).sort((u, v) => v.len - u.len), b = prep(B), used = b.map(() => false), pairs = [];
    for (const s of a) {
      let best = -1, bd = Infinity;
      b.forEach((t, i) => { if (!used[i]) { const d = dist(s.cen, t.cen) + Math.abs(s.len - t.len) * 0.3; if (d < bd) { bd = d; best = i; } } });
      if (best >= 0) { used[best] = true; pairs.push([s, b[best]]); } else pairs.push([s, { ...s, q: s.q.map(() => s.cen), w: 0.15 }]);
    }
    b.forEach((t, i) => {
      if (used[i]) return;
      const src = a.length ? a.reduce((m, s) => (dist(s.cen, t.cen) < dist(m.cen, t.cen) ? s : m), a[0]) : t;
      pairs.push([{ ...t, q: t.q.map(() => src.cen), w: 0.15 }, t]);
    });
    const pn = pen(g, { seed: o.seed, nib: false }, 'morph');
    for (const [s, t] of pairs) {
      let tq = t.q;
      if (dist(s.q[0], tq[K - 1]) + dist(s.q[K - 1], tq[0]) < dist(s.q[0], tq[0]) + dist(s.q[K - 1], tq[K - 1])) tq = tq.slice().reverse();
      pn.path(s.q.map((v, i) => [lerp(v[0], tq[i][0], e), lerp(v[1], tq[i][1], e)]), { c: e < 0.5 ? s.c : t.c, w: lerp(s.w ?? 1, t.w ?? 1, e) });
    }
    pn.draw();
    if (e < 0.2) replay(g, A.filter((s) => s.kind !== 'stroke' && !s.knock), o);
    if (e > 0.85) replay(g, B.filter((s) => s.kind !== 'stroke' && !s.knock), o);
  }
  function replay(g, items, o = {}) {
    const pn = pen(g, { seed: o.seed, nib: false }, 'replay');
    for (const it of items) {
      if (it.kind === 'stroke') pn.path(it.pts, { c: it.c, w: it.w });
      else if (it.kind === 'fill') { if (it.knock) pn.knock(it.pts); else pn.fill(it.pts, { c: it.c }); }
      else if (it.kind === 'dot') pn.dot(it.pts[0][0], it.pts[0][1], it.r, { c: it.c });
    }
    pn.draw();
  }

  // ── bicycles and minds ──────────────────────────────────────────────────
  // Two-bone reach: the joint between a and b, bent toward pref ([x, y]).
  function ik(a, b, L1, L2, pref) {
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const D0 = Math.hypot(dx, dy) || 1, D = Math.min(D0, L1 + L2 - 0.01);
    dx /= D0; dy /= D0;
    const aa = (D * D + L1 * L1 - L2 * L2) / (2 * D), h = Math.sqrt(Math.max(0, L1 * L1 - aa * aa));
    let nx = -dy, ny = dx;
    if (nx * pref[0] + ny * pref[1] < 0) { nx = -nx; ny = -ny; }
    return [a[0] + dx * aa + nx * h, a[1] + dy * aa + ny * h];
  }
  function leg(p, hip, foot) {
    const knee = ik(hip, foot, 12.3, 12.5, [1, -0.4]);
    sleeve(p, [hip, knee, foot], 2.2, 1.5);
    p.path([[foot[0] - 1.8, foot[1] - 0.9], [foot[0] + 2.6, foot[1] - 0.7], [foot[0] + 2.8, foot[1] + 0.7], [foot[0] - 1.8, foot[1] + 0.8]], { closed: true, smooth: true, w: 0.7 });
  }
  // A bicycle, side view, facing right; origin on the ground between the wheels. o: s, rider (a cast name: someone riding it),
  // spin (wheels turn with the voice clock; false to stop), speed, fall (0..1 tips it over), lit ('frame' | 'wheels' | 'bars'),
  // flip, progress. Returns { seat, bars, front, rear, head } in world units.
  function bicycle(g, x, y, o = {}) {
    const fall = clamp(o.fall ?? 0), sy = Math.max(0.1, Math.cos((fall * Math.PI) / 2));
    const p = pen(g, { ...o, x, y, sy }, 'bicycle');
    const R = 9, rh = [-16, -9], fh = [16, -9], bb = [-2, -8], st = [-6.4, -23], ht = [10.2, -22.5], hb = [11.6, -17.5], bars = [13.6, -25.8];
    const ang = o.spin === false ? o.angle ?? 0.4 : (g.flow || g.t) * (o.speed ?? 2.6);
    const base = o.c ?? 'ink', fc = o.lit === 'frame' ? 'accent' : base, wc = o.lit === 'wheels' ? 'accent' : base;
    const hip = [st[0] - 0.4, st[1] - 4.6], ca = ang * 0.7;
    const ped = (side) => [bb[0] + Math.cos(ca + side * Math.PI) * 4.2, bb[1] + Math.sin(ca + side * Math.PI) * 4.2];
    const who = o.rider && fall === 0 ? (typeof o.rider === 'string' ? CAST[o.rider] || CAST.curly : o.rider) : null;
    if (who) leg(p, hip, ped(1));  // the far leg, behind the frame
    [rh, fh].forEach((h) => {
      p.circle(h[0], h[1], R, { c: wc });
      p.circle(h[0], h[1], R - 1.4, { w: 0.35, c: 'dim' });
      for (let q = 0; q < 6; q++) { const a = ang + (q * Math.PI) / 3; p.line(h[0], h[1], h[0] + Math.cos(a) * (R - 1.5), h[1] + Math.sin(a) * (R - 1.5), { w: 0.3, exact: true, bow: 0, c: 'dim' }); }
      p.dot(h[0], h[1], 0.75, { c: base });
    });
    p.path([rh, bb, st, rh], { c: fc });
    p.path([[st[0] + 0.3, st[1] + 0.9], [ht[0], ht[1] + 0.9]], { c: fc });
    p.path([bb, hb], { c: fc });
    p.path([ht, hb], { c: fc, w: 1.25 });
    p.curve([hb, [13.4, -13], fh], { c: fc });
    p.line(st[0], st[1], st[0] - 0.8, st[1] - 3.2, { w: 0.9, c: base });
    p.path([[st[0] - 4.6, st[1] - 3.6], [st[0] + 2.2, st[1] - 3.3]], { w: 1.4, c: base });
    p.curve([ht, [9.6, -25.6], bars, [14.8, -24.4], [13.4, -23.1]], { w: 0.95, c: o.lit === 'bars' ? 'accent' : base });
    p.circle(bb[0], bb[1], 2.5, { w: 0.6, c: base });
    p.path([[bb[0], bb[1] - 2.5], [rh[0], rh[1] - 1.3]], { w: 0.35, c: 'dim' });
    p.path([[bb[0], bb[1] + 2.5], [rh[0], rh[1] + 1.3]], { w: 0.35, c: 'dim' });
    const pd = ped(0);
    p.line(bb[0], bb[1], pd[0], pd[1], { w: 0.8, exact: true, bow: 0, c: base });
    p.line(pd[0] - 1.5, pd[1], pd[0] + 1.5, pd[1], { w: 1, exact: true, bow: 0, c: base });
    let head = null;
    if (who) {  // the rider: torso leaning to the bars, near leg on the near pedal, head up
      const sh = [hip[0] + 9.5, hip[1] - 10.5];
      sleeve(p, [hip, [hip[0] + 4.4, hip[1] - 5.6], sh], 3.9, 3.2);
      leg(p, hip, pd);
      const hc = [sh[0] + 3.3, sh[1] - 5.2], r = 3.1, disc = [];
      for (let q = 0; q < 16; q++) disc.push([hc[0] + Math.cos((q / 16) * 6.283) * r, hc[1] + Math.sin((q / 16) * 6.283) * r]);
      p.knock(disc); p.circle(hc[0], hc[1], r, { w: 0.9 });
      p.path([[hc[0] + r - 0.2, hc[1] + 0.2], [hc[0] + r + 1.1, hc[1] + 1.2], [hc[0] + r - 0.1, hc[1] + 1.6]], { w: 0.5 });
      p.dot(hc[0] + 1.7, hc[1] - 0.5, 0.42);
      if (who.hair && who.hair !== 'bald') {
        const hairPts = [];
        for (let q = 0; q <= 40; q++) { const a = Math.PI * 0.95 + (q / 40) * Math.PI * 1.25, bump = who.hair === 'curly' ? 0.9 * Math.sqrt(Math.abs(Math.sin(((q / 40) * 7) * Math.PI))) : 0; hairPts.push([hc[0] - 0.4 + Math.cos(a) * (r + 0.6 + bump), hc[1] - 0.3 + Math.sin(a) * (r + 0.4 + bump)]); }
        p.path(hairPts, { smooth: true, w: 0.8 });
      }
      const elbow = ik(sh, bars, 8.6, 8.6, [-0.3, 1]);
      sleeve(p, [sh, elbow, bars], 1.8, 1.4);
      p.circle(bars[0], bars[1], 1.3, { w: 0.7 });
      head = hc;
    }
    p.draw();
    return { seat: p.map([st[0] - 1, st[1] - 3.6]), bars: p.map(bars), front: p.map(fh), rear: p.map(rh), head: head && p.map(head), hip: p.map(hip) };
  }
  // A brain, side view, front to the right. o: s, lit (the accent), flip, progress
  function brain(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'brain'), c = o.lit ? 'accent' : o.c, out = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2, bump = 1 + 0.07 * Math.sin(((i % 8) / 8) * Math.PI);
      out.push([Math.cos(a) * 11 * bump, -1 + Math.sin(a) * (Math.sin(a) > 0 ? 6.2 : 7.6) * bump]);
    }
    p.knock(out); p.path(out, { closed: true, smooth: true, c });
    p.curve([[-8, -3], [-5, -5.5], [-2, -3], [1, -6], [4, -3.4], [7.5, -5]], { w: 0.55, c });
    p.curve([[-9, 1.5], [-6, -0.5], [-3, 2], [0, -0.8], [3, 1.6], [6.5, -0.4], [9, 1.2]], { w: 0.55, c });
    p.curve([[-4, 4.4], [-1, 2.8], [2, 4.5]], { w: 0.5, c });
    p.arc(-7.2, 4.6, 3.2, 2.2, -0.2, Math.PI + 0.4, { w: 0.7, c });
    p.curve([[-3.5, 5], [-3.2, 7.5], [-2.6, 9.5]], { w: 0.8, c });
    p.draw();
    return {};
  }
  // A head in profile, facing left (flip: right), bald so a brain can show (brain: true), or hair: 'curly'.
  // o: s, brain, lit (brain in the accent), progress. Returns { top, mouth, brain }.
  function head(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'head');
    const prof = [[-4, -6.5], [-8, -4], [-9.4, -1.2], [-9.8, 0.2], [-12.2, 2.7], [-10.4, 3.6], [-10.8, 4.8], [-10.1, 5.6], [-10.8, 6.4], [-10.4, 8.2], [-9, 9.7], [-5.5, 10.6], [-0.5, 9.4]];
    const back = [[-4, -6.5], [0, -9.6], [5, -9.4], [8.6, -6], [9.8, -1], [8.6, 4], [5.8, 8.4]];
    p.knock([...prof, ...back.slice().reverse()]);
    p.path(prof, { smooth: true });
    p.path(back, { smooth: true });
    p.path([[-5.5, 10.6], [-5, 13], [-4.6, 15.2]], { smooth: true, w: 0.9 });
    p.path([[5.8, 8.4], [6.4, 12], [7.2, 15.2]], { smooth: true, w: 0.9 });
    p.path([[-4.6, 15.2], [-11, 17], [-15.5, 21.5]], { smooth: true });
    p.path([[7.2, 15.2], [13, 16.8], [17, 21.5]], { smooth: true });
    p.arc(4.8, 2.4, 1.6, 2.2, -1.3, 1.9, { w: 0.75 });
    if ((g.t + 0.7) % 4.1 < 0.12) p.line(-8.2, 0, -6.8, 0.1, { w: 0.5, exact: true }); else p.dot(-7.5, -0.1, 0.5);
    p.line(-8.6, -2.6, -6.2, -3, { w: 0.5, exact: true });
    if (o.hair === 'curly') {
      const mass = [];
      for (let i = 0; i <= 60; i++) { const u = i / 60, a = Math.PI * 1.05 + u * Math.PI * 1.35, bump = 1.4 * Math.sqrt(Math.sin(((u * 10) % 1) * Math.PI)); mass.push([0.6 + Math.cos(a) * (9.2 + bump), -1.6 + Math.sin(a) * (8.6 + bump)]); }
      p.path(mass, { smooth: true });
    }
    p.draw();
    const s = o.s ?? 1, bc = p.map([0.6, -3.6]);
    if (o.brain) brain(g, bc[0], bc[1], { s: s * 0.56, flip: !o.flip, lit: o.lit, progress: o.brainProgress ?? o.progress });
    return { top: p.map([0, -10]), mouth: p.map([-10.6, 5.6]), brain: bc };
  }

  // ── story props ─────────────────────────────────────────────────────────
  // Local units, origin at the bottom centre unless noted; all take { s, flip, rot, progress, lit, c }.
  // Text turned by ang radians about (x, y).
  function textRot(g, str, x, y, ang, o = {}) {
    const ctx = g.ctx; ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    const r = text(g, str, 0, 0, o); ctx.restore(); return r;
  }
  // An interview question typed like a terminal line: "> who: question". o: w, role, progress. Returns { h }.
  function ask(g, who, str, x, y, o = {}) {
    const R = role(g, o.role || 'body'), pre = `> ${who}: `, cw = layout(g, 'M', R, 1e9).cw, preW = pre.length * cw;
    const n = Math.floor(clamp(o.progress ?? 1) * (pre.length + str.length));
    if (n <= 0) return { h: 0 };
    text(g, pre, x, y, { role: R, c: 'sys', raw: true, progress: Math.min(1, n / pre.length) });
    let h = layout(g, 'M', R, 1e9).h;
    if (n > pre.length) h = text(g, str, x + preW, y, { role: R, w: (o.w ?? 240) - preW, progress: (n - pre.length) / str.length, cursor: 'typing' }).h;
    return { h };
  }
  // A hanging tag; x, y is its hole. o: to ([x, y] the string ties to), swing (radians), c
  function tag(g, str, x, y, o = {}) {
    const R = role(g, o.role || 'label'), L = layout(g, str, R, 1e9), w = L.w + 8, h = L.h + 5, a = o.swing ?? 0;
    if (clamp(o.progress ?? 1) <= 0) return null;
    if (o.to) pen(g, {}, 'tagstring').line(o.to[0], o.to[1], x, y, { w: 0.45, c: 'dim' }).draw(o.progress ?? 1);
    const p = pen(g, { ...o, x, y, rot: a }, 'tag'), pts = [[-1.5, 0], [2.5, -h / 2], [w, -h / 2], [w, h / 2], [2.5, h / 2]];
    p.knock(pts); p.fill(pts, { c: o.c ?? 'accent', shift: 0 }); p.poly(pts, { w: 0.6, c: o.c ?? 'accent' }); p.circle(1.8, 0, 0.8, { w: 0.4, c: 'bg' });
    p.draw();
    const ctx = g.ctx; ctx.save(); ctx.translate(x, y); ctx.rotate(a); text(g, str, 4.5, -L.h / 2, { role: R, c: 'bg', progress: clamp(((o.progress ?? 1) - 0.4) / 0.6) }); ctx.restore();
    return { w, h };
  }
  // A rubber stamp that lands (progress 0..1 drops it from a little above). o: rot, c, role
  function stamp(g, str, x, y, o = {}) {
    const q = clamp(o.progress ?? 1);
    if (q <= 0) return null;
    const ctx = g.ctx, R = role(g, o.role || 'head'), L = layout(g, str, R, 1e9), k = 1 + 0.35 * (1 - P.ease.out(clamp(q * 1.8)));
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? -0.1); ctx.scale(k, k);
    const w = L.w + 8, h = L.h + 6, c = o.c ?? 'accent', p = pen(g, { nib: false }, 'stamp');
    p.knock([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]);
    p.rect(-w / 2, -h / 2, w, h, { c, w: 0.9, r: 1.5 }); p.rect(-w / 2 + 1.4, -h / 2 + 1.4, w - 2.8, h - 2.8, { c, w: 0.45, r: 1 });
    p.draw();
    text(g, str, 0, -L.h / 2, { role: R, c, align: 'center' });
    ctx.restore();
    return { w, h };
  }
  // A film camera on a tripod, lens to the right.
  function filmcam(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'filmcam');
    [[-6, 0], [0, 0.4], [6, 0]].forEach(([fx, fy]) => p.line(0, -17, fx, fy, { w: 0.8 }));
    const body = [[-6.5, -26], [6, -26], [6, -17.5], [-6.5, -17.5]];
    p.knock(body); p.rect(-6.5, -26, 12.5, 8.5, { r: 1 });
    p.path([[6, -24.5], [11, -25.6], [11, -18], [6, -19.2]], { closed: true, w: 0.8 });
    [[-2.8, -30.2, 3.6], [4.2, -29.6, 3]].forEach(([cx, cy, r]) => { p.knock(Array.from({ length: 12 }, (_, i) => [cx + Math.cos(i / 1.9) * r, cy + Math.sin(i / 1.9) * r])); p.circle(cx, cy, r, { w: 0.8 }); p.circle(cx, cy, r * 0.3, { w: 0.4 }); });
    if (o.lit) p.dot(-4.5, -24, 0.8, { c: 'accent' });
    p.draw();
    return { lens: p.map([11, -22]) };
  }
  // A chat input: rounded box, an accent ">" and o.text typed in; returns its rect.
  function promptbox(g, x, y, w, o = {}) {
    const h = o.h ?? 12, p = pen(g, { progress: o.frame ?? o.progress }, 'promptbox');
    p.knock([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]); p.rect(x, y, w, h, { r: 3 });
    p.draw();
    if ((o.frame ?? o.progress ?? 1) >= 1) {
      text(g, '>', x + 3, y + h / 2 - 2.2, { role: 'body', c: 'accent' });
      text(g, o.text ?? '', x + 9, y + h / 2 - 2.2, { role: 'body', progress: o.typed ?? 1, cursor: true, w: w - 12 });
    }
    return { x, y, w, h };
  }
  function pebble(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'pebble'), pts = Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * 6.283; return [Math.cos(a) * 2.6 * (1 + 0.12 * Math.sin(a * 3)), -1.6 + Math.sin(a) * 1.6]; });
    p.fill(pts, { c: o.c ?? 'accent', shift: 0 }); p.poly(pts, { w: 0.55 });
    p.draw();
    return {};
  }
  function house(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'house'), wall = [[-10, -14], [10, -14], [10, 0], [-10, 0]];
    p.knock([...wall, [-12, -14], [0, -25], [12, -14]]);
    p.rect(-10, -14, 20, 14); p.path([[-12.5, -13.5], [0, -25], [12.5, -13.5]], { w: 1 });
    p.path([[6, -20], [6, -24], [8.4, -24], [8.4, -18]], { w: 0.7 });
    p.rect(-3, -8, 5, 8, { w: 0.7 }); p.dot(1, -4, 0.4);
    const win = [[4, -11], [8, -11], [8, -7], [4, -7]];
    if (o.lit) p.fill(win, { shift: 0, wob: 0.3 }); p.rect(4, -11, 4, 4, { w: 0.6 }); p.line(6, -11, 6, -7, { w: 0.35, exact: true });
    p.draw();
    return { window: p.map([6, -9]), door: p.map([-0.5, -4]) };
  }
  function shop(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'shop');
    p.knock([[-13, -22], [13, -22], [13, 0], [-13, 0]]);
    p.rect(-12, -16, 24, 16);
    const aw = [];
    for (let i = 0; i <= 8; i++) { const ax = -13 + i * 3.25; aw.push([ax, -16], [ax + 1.6, -13.4]); }
    p.path([[-13, -16], [-13, -19.5], [13, -19.5], [13, -16]], { w: 0.8 }); p.path(aw.slice(0, -1), { w: 0.7 });
    for (let i = 0; i < 8; i++) p.line(-13 + i * 3.25 + 1.6, -19.5, -13 + i * 3.25 + 1.6, -13.4, { w: 0.35, c: 'dim', exact: true });
    p.rect(-9, -10.5, 9, 7, { w: 0.6 }); p.rect(3, -10, 5, 10, { w: 0.7 });
    p.draw();
    return { door: p.map([5.5, -5]) };
  }
  function mountains(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'mountains');
    const pts = [[-26, 0], [-12, -20], [-5, -11], [5, -26], [24, 0]];
    p.knock(pts); p.path(pts, { w: 0.95 });
    p.path([[-15.5, -15], [-13, -16.4], [-11, -14.6], [-9, -16.5]], { w: 0.5 });
    p.path([[1.2, -20.6], [3.5, -22], [5.5, -20], [7.8, -21.8]], { w: 0.5 });
    p.draw();
    return { top: p.map([5, -26]) };
  }
  function tower(g, x, y, o = {}) {  // a PC tower, front view
    const p = pen(g, { ...o, x, y }, 'tower');
    p.knock([[-6, -24], [6, -24], [6, 0], [-6, 0]]); p.rect(-6, -24, 12, 24, { r: 1 });
    p.rect(-4, -21, 8, 2.4, { w: 0.5 }); p.rect(-4, -17.8, 8, 2.4, { w: 0.5 });
    p.circle(0, -12, 1.1, { w: 0.5, c: o.lit ? 'accent' : 'ink' });
    for (let i = 0; i < 4; i++) p.line(-3.6, -7 + i * 1.5, 3.6, -7 + i * 1.5, { w: 0.35, c: 'dim', exact: true });
    p.draw();
    return {};
  }
  function coin(g, x, y, o = {}) {  // centre origin. o: r, label, pick (a pickaxe beside it)
    const r = o.r ?? 7, p = pen(g, { ...o, x, y }, 'coin');
    p.knock(Array.from({ length: 16 }, (_, i) => [Math.cos(i / 2.55) * r, Math.sin(i / 2.55) * r]));
    if (o.lit) p.fill(Array.from({ length: 20 }, (_, i) => [Math.cos(i / 3.18) * r * 0.95, Math.sin(i / 3.18) * r * 0.95]), { shift: 0 });
    p.circle(0, 0, r, { w: 0.9 }); p.circle(0, 0, r * 0.78, { w: 0.4, c: o.lit ? 'bg' : 'dim' });
    if (o.pick) { p.line(r + 2, r + 1, r + 7, -r + 2, { w: 1 }); p.curve([[r + 2.4, -r - 0.8], [r + 7, -r + 1], [r + 11.5, -r + 4.5]], { w: 1.1 }); }
    p.draw();
    if (o.label) text(g, o.label, x, y - 2.6 * (o.s ?? 1), { role: 'body', align: 'center', c: o.lit ? 'bg' : 'ink' });
    return {};
  }
  // A chalkboard; x, y top-left. Returns the writing area.
  function chalkboard(g, x, y, w, h, o = {}) {
    const p = pen(g, { progress: o.progress }, 'chalkboard');
    p.knock([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]); p.rect(x, y, w, h, { w: 1.1 }); p.rect(x + 1.8, y + 1.8, w - 3.6, h - 3.6, { w: 0.45, c: 'dim' });
    p.line(x - 2, y + h + 1.6, x + w + 2, y + h + 1.6, { w: 0.8 });
    p.draw();
    return { x: x + 3, y: y + 3, w: w - 6, h: h - 6 };
  }
  // A globe, centre origin. o: r, wires (lines out to the edge, the internet), route (a dotted loop in the accent)
  function globe(g, x, y, o = {}) {
    const r = o.r ?? 12, p = pen(g, { ...o, x, y }, 'globe'), spin = (g.flow || g.t) * 0.25;
    p.knock(Array.from({ length: 20 }, (_, i) => [Math.cos(i / 3.18) * r, Math.sin(i / 3.18) * r]));
    p.circle(0, 0, r);
    p.arc(0, 0, r, r * 0.3, 0, Math.PI, { w: 0.4, c: 'dim' }); p.arc(0, -r * 0.5, r * 0.86, r * 0.18, 0, Math.PI, { w: 0.35, c: 'dim' }); p.arc(0, r * 0.5, r * 0.86, r * 0.18, 0, Math.PI, { w: 0.35, c: 'dim' });
    for (let k = 0; k < 3; k++) { const f = Math.cos(spin + (k * Math.PI) / 3); if (Math.abs(f) > 0.05) p.arc(0, 0, r * Math.abs(f), r, f > 0 ? -Math.PI / 2 : Math.PI / 2, f > 0 ? Math.PI / 2 : Math.PI * 1.5, { w: 0.4, c: 'dim' }); }
    if (o.wires) for (let k = 0; k < 6; k++) { const a = k * 1.05 + 0.3; p.line(Math.cos(a) * r, Math.sin(a) * r, Math.cos(a) * (r + 8), Math.sin(a) * (r + 8), { w: 0.5 }); p.dot(Math.cos(a) * (r + 8), Math.sin(a) * (r + 8), 0.8); }
    p.draw();
    if (o.route) { const q = pen(g, { progress: o.routeProgress ?? 1 }, 'globeroute'), pts = []; for (let i = 0; i <= 40; i++) { const a = (i / 40) * 6.283; pts.push([x + Math.cos(a) * r * 1.25, y + Math.sin(a) * r * 0.45 - 2]); } q.path(pts, { c: 'accent', w: 0.7 }); q.draw(); }
    return {};
  }
  // A college building. o.kind: 'temple' (columns and a pediment) or 'arch' (a stone gateway)
  function college(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'college');
    if (o.kind === 'arch') {
      const out = [[-22, 0], [-22, -30], [22, -30], [22, 0]];
      p.knock([...out, [-24, -30], [0, -42], [24, -30]]); p.path(out, { w: 1 });
      p.path([[-24, -30], [24, -30]], { w: 1 }); p.path([[-22, -33.5], [22, -33.5]], { w: 0.6 });
      p.path([[-8, 0], [-8, -14], [-7, -19], [-4, -22.5], [0, -23.6], [4, -22.5], [7, -19], [8, -14], [8, 0]], { smooth: true, w: 1 });
      p.arc(0, -34, 5, 5, Math.PI, Math.PI * 2, { w: 0.8 }); p.line(0, -39, 0, -44, { w: 0.6 });
      for (let i = 0; i < 4; i++) { p.line(-20 + i * 3.2, -6, -20 + i * 3.2, -26, { w: 0.35, c: 'dim' }); p.line(10.4 + i * 3.2, -6, 10.4 + i * 3.2, -26, { w: 0.35, c: 'dim' }); }
    } else {
      p.knock([[-20, 0], [20, 0], [20, -24], [-20, -24], [0, -33]]);
      p.line(-20, 0, 20, 0); p.line(-18.5, -2, 18.5, -2, { w: 0.6 }); p.line(-17, -4, 17, -4, { w: 0.6 });
      for (let i = 0; i < 5; i++) { const cx = -14 + i * 7; p.line(cx - 1.4, -4, cx - 1.4, -20, { w: 0.7 }); p.line(cx + 1.4, -4, cx + 1.4, -20, { w: 0.7 }); }
      p.rect(-18, -23, 36, 3, { w: 0.8 }); p.path([[-19.5, -23], [0, -32.5], [19.5, -23]], { w: 1 });
    }
    p.draw();
    return { door: p.map([0, -8]) };
  }
  // A paper cheque; top-left origin. o.lit: in the accent
  function cheque(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'cheque'), c = o.lit ? 'accent' : 'ink', w = 30, h = 13;
    p.knock([[0, 0], [w, 0], [w, h], [0, h]]); p.rect(0, 0, w, h, { c, r: 0.8 });
    p.line(3, 4, 16, 4, { w: 0.4, c }); p.line(3, 8, 20, 8, { w: 0.4, c }); p.rect(21, 3, 6.5, 3.4, { w: 0.4, c });
    p.path([[18, 11], [19.5, 9.4], [20.5, 11], [22, 9.2], [23, 11.2], [25.5, 10]], { smooth: true, w: 0.5, c });
    p.draw();
    return { w: w * (o.s ?? 1), h: h * (o.s ?? 1) };
  }
  // A door in its frame; o.open 0..1 swings it; o.dark hatches the gap. Returns { gap } (the middle of the doorway)
  function door(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'door'), q = clamp(o.open ?? 0);
    p.knock([[-8, -26], [8, -26], [8, 0], [-8, 0]]);
    p.path([[-8, 0], [-8, -26], [8, -26], [8, 0]], { w: 1 });
    if (q > 0 && o.dark !== false) p.hatch([[-7, -25], [7, -25], [7, 0], [-7, 0]], { gap: 1.8, c: 'ghost' });
    const ex = lerp(7, -3.5, q), lift = 2.2 * q, panel = [[-7, -25], [ex, -25 - lift], [ex, lift * 0.3], [-7, 0]];
    p.knock(panel); p.poly(panel, { w: 0.9, c: o.lit ? 'accent' : 'ink' });
    p.dot(lerp(5, -2.6, q), -12.5, 0.6);
    p.line(-9.5, 0, 9.5, 0, { w: 0.8 });
    p.draw();
    return { gap: p.map([2, -12]) };
  }
  // A glass jar; o.fill 0..1 of coins inside.
  function jar(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'jar'), n = Math.round(clamp(o.fill ?? 0) * 14);
    p.knock([[-7, -18], [7, -18], [7, 0], [-7, 0]]);
    for (let i = 0; i < n; i++) { const row = Math.floor(i / 4), cx = -4.5 + (i % 4) * 3 + (row % 2) * 1.2, cy = -1.6 - row * 2.1; p.ellipse(cx, cy, 1.4, 0.8, { w: 0.45, c: i === n - 1 && o.lit ? 'accent' : 'ink' }); }
    p.path([[-6, -17], [-7, -14], [-7, -1.5], [-5.5, 0], [5.5, 0], [7, -1.5], [7, -14], [6, -17]], { smooth: true });
    p.rect(-6.5, -20, 13, 3, { w: 0.8, r: 0.8 });
    p.draw();
    return { mouth: p.map([0, -20]) };
  }
  // A bill; top-left origin. o.paid (0..1 lands an orange heart stamp)
  function bill(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'bill'), w = 22, h = 28;
    p.knock([[0, 0], [w, 0], [w, h], [0, h]]); p.rect(0, 0, w, h, { r: 0.6 });
    p.line(3, 4, 12, 4, { w: 0.7 });
    for (let i = 0; i < 5; i++) { p.line(3, 9 + i * 3, 14, 9 + i * 3, { w: 0.35, c: 'dim' }); p.line(16, 9 + i * 3, 19, 9 + i * 3, { w: 0.35, c: 'dim' }); }
    p.line(3, 25, 19, 25, { w: 0.6 });
    p.draw();
    if ((o.paid ?? 0) > 0) heart(g, x + 14 * (o.s ?? 1), y + 18 * (o.s ?? 1), { s: (o.s ?? 1) * 1.1, fill: true, rot: -0.2, progress: o.paid });
    return {};
  }
  function heart(g, x, y, o = {}) {  // centre origin
    const p = pen(g, { ...o, x, y }, 'heart'), pts = [];
    for (let i = 0; i <= 30; i++) { const t = (i / 30) * Math.PI * 2; pts.push([0.3 * 16 * Math.sin(t) ** 3, -0.3 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); }
    if (o.fill) p.fill(pts, { c: o.c ?? 'accent', shift: 0 });
    p.path(pts, { closed: true, smooth: true, c: o.fill ? 'bg' : o.c ?? 'accent', w: 0.7 });
    p.draw();
    return {};
  }
  // A signpost; o.arrows: [[tilt, 'left' | 'right'], ...] from the top down.
  function signpost(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'signpost'), arrows = o.arrows ?? [[0.25, 'right'], [-0.3, 'left'], [0.1, 'left'], [-0.15, 'right'], [0.35, 'right']];
    p.line(0, 0, 0, -34, { w: 1.2 });
    arrows.forEach(([tilt, dir], i) => {
      const yy = -31 + i * 5.2, d = dir === 'left' ? -1 : 1, ca = Math.cos(tilt), sa = Math.sin(tilt);
      const shape = [[-1, -1.6], [11, -1.6], [13.5, 0], [11, 1.6], [-1, 1.6]].map(([bx, by]) => [bx * d * ca - by * sa, yy + bx * d * sa + by * ca]);
      p.knock(shape); p.poly(shape, { w: 0.7, c: o.lit === i ? 'accent' : 'ink' });
    });
    p.draw();
    return {};
  }
  // A breaking wave, curling to the right; o.label written on it
  function wave(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'wave');
    const crest = [[-34, 0], [-26, -4], [-18, -12], [-8, -22], [2, -27], [10, -26], [14, -21], [12, -16], [7, -16], [6, -20]];
    p.knock([...crest, [14, 0]]);
    p.path(crest, { smooth: true, w: 1.1 });
    p.path([[-24, -2], [-14, -9], [-4, -15], [4, -18]], { smooth: true, w: 0.5, c: 'dim' });
    p.path([[-30, 0], [-18, -4], [-8, -8], [2, -10], [12, -12]], { smooth: true, w: 0.4, c: 'dim' });
    for (let i = 0; i < 7; i++) p.dot(8 + hash(i, 3) * 10, -27 - hash(i, 4) * 5, 0.5);
    p.draw();
    if (o.label) text(g, o.label, x - 12 * (o.s ?? 1), y - 6 * (o.s ?? 1), { role: 'label', c: 'dim' });
    return {};
  }
  function sun(g, x, y, o = {}) {  // centre origin
    const p = pen(g, { ...o, x, y }, 'sun'), r = o.r ?? 5, spin = (g.flow || g.t) * 0.3;
    p.fill(Array.from({ length: 18 }, (_, i) => [Math.cos(i / 2.86) * r, Math.sin(i / 2.86) * r]), { c: 'accent', shift: 0 });
    for (let i = 0; i < 9; i++) { const a = spin + (i / 9) * 6.283; p.line(Math.cos(a) * (r + 2), Math.sin(a) * (r + 2), Math.cos(a) * (r + 4.5), Math.sin(a) * (r + 4.5), { c: 'accent', w: 0.6 }); }
    p.draw();
    return {};
  }
  // A cloud with rain under it (o.rain) and a lightning bolt (o.bolt). Centre origin.
  function storm(g, x, y, o = {}) {
    cloud(g, x, y, o);
    const p = pen(g, { ...o, x, y }, 'storm'), t = g.flow || g.t;
    if (o.rain !== false) for (let i = 0; i < 6; i++) { const rx = -8 + i * 3.2, off = ((t * 9 + i * 2.3) % 6); p.line(rx, 5 + off, rx - 0.8, 7.5 + off, { w: 0.4, c: 'dim', exact: true }); }
    if (o.bolt) p.path([[1, 4], [-1.5, 9], [1.5, 9], [-1, 14]], { w: 0.8, c: 'accent' });
    p.draw();
    return {};
  }
  // An open book of handwritten hours; top-left origin. o.lines (how many are written, can be fractional)
  function ledger(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'ledger'), n = o.lines ?? 8;
    const L = [[0, 2], [22, 0], [22, 30], [0, 32]], R = [[22, 0], [44, 2], [44, 32], [22, 30]];
    p.knock([...L, ...R]); p.poly(L, { w: 0.9 }); p.poly(R, { w: 0.9 }); p.line(22, 0, 22, 30, { w: 0.5 });
    for (let i = 0; i < Math.ceil(n); i++) {
      const pg = i < 8 ? 0 : 1, row = i % 8, yy = 5.5 + row * 3.2, x0 = pg ? 25 : 3, len = (0.55 + hash(i, 12) * 0.35) * 12;
      const f = clamp(n - i), pts = [];
      for (let k = 0; k <= 8; k++) pts.push([x0 + (k / 8) * len * f, yy + Math.sin(k * 1.9 + i) * 0.45]);
      p.path(pts, { smooth: true, w: 0.45 });
      if (f >= 1) p.path([[x0 + 14.5, yy - 0.6], [x0 + 15.5, yy + 0.6], [x0 + 16.5, yy - 0.6], [x0 + 17.5, yy + 0.4]], { w: 0.45, c: 'dim' });
    }
    p.draw();
    return { w: 44 * (o.s ?? 1), h: 32 * (o.s ?? 1) };
  }
  // An invoice; top-left origin. o.lit: the total in the accent
  function invoice(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'invoice'), w = 26, h = 34;
    p.knock([[0, 0], [w, 0], [w, h], [0, h]]); p.rect(0, 0, w, h, { r: 0.6 });
    p.rect(3, 3, 6, 4, { w: 0.5 }); p.line(15, 4, 23, 4, { w: 0.6 }); p.line(17, 6.4, 23, 6.4, { w: 0.4, c: 'dim' });
    for (let i = 0; i < 5; i++) { p.line(3, 12 + i * 3, 16, 12 + i * 3, { w: 0.4, c: 'dim' }); p.line(19, 12 + i * 3, 23, 12 + i * 3, { w: 0.4, c: 'dim' }); }
    p.line(13, 28, 23, 28, { w: 0.8, c: o.lit ? 'accent' : 'ink' });
    p.path([[3, 31], [5, 29], [6, 31.2], [8, 28.8], [9.5, 31], [12, 29.8]], { smooth: true, w: 0.55 });
    p.draw();
    return { w: w * (o.s ?? 1), h: h * (o.s ?? 1) };
  }
  function robot(g, x, y, o = {}) {  // a small robot head, centre origin
    const p = pen(g, { ...o, x, y }, 'robot');
    p.knock([[-4.5, -4], [4.5, -4], [4.5, 4], [-4.5, 4]]); p.rect(-4.5, -4, 9, 8, { r: 1.2, w: 0.7 });
    p.line(0, -4, 0, -6.4, { w: 0.5 }); p.dot(0, -7, 0.7);
    p.dot(-1.8, -0.8, 0.6); p.dot(1.8, -0.8, 0.6); p.line(-1.8, 2, 1.8, 2, { w: 0.45, exact: true });
    p.draw();
    return {};
  }
  function playcard(g, x, y, o = {}) {  // centre origin
    const p = pen(g, { ...o, x, y }, 'playcard');
    p.knock([[-9, -6], [9, -6], [9, 6], [-9, 6]]); p.rect(-9, -6, 18, 12, { r: 2 });
    p.fill([[-2.5, -3.5], [3.5, 0], [-2.5, 3.5]], { c: 'accent', shift: 0 });
    p.draw();
    return {};
  }
  // A shelf of old books; x, y top-left of the top shelf, w wide. o.labels: spine labels on the first shelf (years)
  function bookshelf(g, x, y, w, o = {}) {
    const p = pen(g, { progress: o.progress }, 'bookshelf'), shelves = o.shelves ?? 2, sh = 22, spines = [];
    for (let s2 = 0; s2 < shelves; s2++) {
      const base = y + (s2 + 1) * sh;
      p.line(x - 2, base, x + w + 2, base, { w: 1 });
      let bx = x + 1, i = 0;
      while (bx < x + w - 4) {
        const bw = 3.6 + hash(i + s2 * 40, 21) * 3, bh = 13 + hash(i + s2 * 40, 22) * 7, lean = hash(i + s2 * 40, 23) > 0.9 ? 1 : 0;
        const pts = [[bx, base], [bx + lean * 2, base - bh], [bx + bw + lean * 2, base - bh], [bx + bw, base]];
        p.knock(pts); p.path(pts, { w: 0.6, c: s2 === 0 && o.lit === i ? 'accent' : 'ink' });
        p.line(bx + 0.8, base - bh + 2.2, bx + bw - 0.8, base - bh + 2.2, { w: 0.3, c: 'dim', exact: true });
        if (s2 === 0) spines.push([bx + bw / 2, base - bh / 2]);
        bx += bw + 0.6; i++;
      }
    }
    p.draw();
    (o.labels || []).forEach((lab, i) => { if (spines[i * 3 + 1]) textRot(g, lab, spines[i * 3 + 1][0] + 1.4, spines[i * 3 + 1][1] + 4.5, -Math.PI / 2, { role: 'label', c: 'dim' }); });
    return { spines };
  }
  // An open book; x, y top-left, w wide. Returns the two page rects to draw on.
  function openbook(g, x, y, w, o = {}) {
    const p = pen(g, { progress: o.progress }, 'openbook'), h = w * 0.62, m = x + w / 2, sag = w * 0.035;
    const q = (a, c, b, n = 10) => Array.from({ length: n + 1 }, (_, i) => { const u = i / n; return [(1 - u) ** 2 * a[0] + 2 * u * (1 - u) * c[0] + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * u * (1 - u) * c[1] + u * u * b[1]]; });
    const L = [...q([x, y + sag], [m - w / 5, y - sag], [m, y + sag * 1.5]), ...q([m, y + h], [m - w / 5, y + h - sag * 2], [x, y + h - sag * 0.5])];
    const R = [...q([m, y + sag * 1.5], [m + w / 5, y - sag], [x + w, y + sag]), ...q([x + w, y + h - sag * 0.5], [m + w / 5, y + h - sag * 2], [m, y + h])];
    p.knock([...L, ...R]); p.path(L, { closed: true }); p.path(R, { closed: true });
    for (let i = 1; i <= 2; i++) { p.line(x + 1.2 * i, y + sag + 2 * i, x + 1.2 * i, y + h - 1 + i, { w: 0.35, c: 'dim' }); p.line(x + w - 1.2 * i, y + sag + 2 * i, x + w - 1.2 * i, y + h - 1 + i, { w: 0.35, c: 'dim' }); }
    p.draw();
    return { left: { x: x + 3, y: y + 5, w: w / 2 - 6, h: h - 9 }, right: { x: m + 3, y: y + 5, w: w / 2 - 6, h: h - 9 } };
  }
  // A building going up: foundation (hatched), then floors, then flags on the roof. o.progress builds it; o.floors
  function building(g, x, y, o = {}) {
    const floors = o.floors ?? 4, steps = floors + 2, q = clamp(o.progress ?? 1) * steps, fh = 9, w = 34;
    const p = pen(g, { x, y, s: o.s ?? 1 }, 'building');
    const f0 = clamp(q);
    if (f0 > 0) { const pts = [[-w / 2 - 2, 0], [w / 2 + 2, 0], [w / 2 + 2, -5], [-w / 2 - 2, -5]]; p.poly(pts, { w: 1 }); if (f0 >= 1) p.hatch(pts, { gap: 1.6, c: o.lit === 'foundation' ? 'accent' : 'dim' }); }
    for (let i = 0; i < floors; i++) {
      const f = clamp(q - 1 - i); if (f <= 0) break;
      const yy = -5 - (i + 1) * fh;
      p.path([[-w / 2, yy + fh], [-w / 2, yy], [w / 2, yy], [w / 2, yy + fh]], { w: 0.9 });
      for (let k = 0; k < 4; k++) p.rect(-w / 2 + 3 + k * 8, yy + 2.5, 4, 4, { w: 0.45 });
    }
    const fr = clamp(q - 1 - floors);
    if (fr > 0) { const top = -5 - floors * fh; [-10, 0, 10].forEach((fx, k) => { p.line(fx, top, fx, top - 7, { w: 0.6 }); p.path([[fx, top - 7], [fx + 4.5, top - 5.6], [fx, top - 4.2]], { closed: true, w: 0.5, c: k === 1 && o.lit === 'flag' ? 'accent' : 'ink' }); }); }
    p.draw();
    return { top: p.map([0, -5 - floors * fh]) };
  }
  function stairs(g, x, y, o = {}) {  // steps up to the right; o.n, o.step [w, h]
    const n = o.n ?? 5, [sw, sh] = o.step ?? [8, 5], p = pen(g, { ...o, x, y }, 'stairs'), pts = [[0, 0]];
    for (let i = 0; i < n; i++) pts.push([i * sw, -(i + 1) * sh], [(i + 1) * sw, -(i + 1) * sh]);
    p.path(pts, { w: 0.9 }); p.line(n * sw, -n * sh, n * sw, 0, { w: 0.5, c: 'dim' });
    p.draw();
    return { top: p.map([n * sw - sw / 2, -n * sh]), step: (i) => p.map([i * sw + sw / 2, -(i + 1) * sh]) };
  }
  function jet(g, x, y, o = {}) {  // a fighter jet from above, nose up; centre origin
    const p = pen(g, { ...o, x, y }, 'jet');
    const half = [[0, -24], [1.6, -18], [2.4, -8], [3, -2], [18, 8], [18, 10.5], [3.2, 7], [3.2, 13], [8, 19], [8, 21], [2, 19.5], [1, 22]];
    const body = [...half, ...half.slice().reverse().map(([a, b]) => [-a, b])];
    p.knock(body); p.poly(body, { w: 0.9 });
    p.ellipse(0, -12, 1.2, 3.6, { w: 0.6, over: 0.1 });
    p.line(-10, 5.5, -3, 1, { w: 0.4, c: 'dim' }); p.line(10, 5.5, 3, 1, { w: 0.4, c: 'dim' });
    p.draw();
    return {};
  }
  function wrench(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'wrench');
    p.path([[-2, 14], [-2, -6], [2, -6], [2, 14], [0, 15.4]], { closed: true, smooth: false, w: 0.8 });
    p.path([[-2, -6], [-4.6, -9], [-4.2, -13.5], [-1.8, -15], [-1.4, -11], [1.4, -11], [1.8, -15], [4.2, -13.5], [4.6, -9], [2, -6]], { smooth: true, w: 0.8 });
    p.draw();
    return {};
  }
  function diploma(g, x, y, o = {}) {  // a rolled diploma with a ribbon; centre origin
    const p = pen(g, { ...o, x, y }, 'diploma');
    p.knock([[-15, -3.4], [15, -3.4], [15, 3.4], [-15, 3.4]]);
    p.path([[-14, -3.4], [14, -3.4]], {}); p.path([[-14, 3.4], [14, 3.4]], {});
    p.ellipse(-14, 0, 1.6, 3.4, { w: 0.8, over: 0.1 }); p.ellipse(14, 0, 1.6, 3.4, { w: 0.8, over: 0.1 }); p.ellipse(14, 0, 0.6, 1.4, { w: 0.4 });
    const c = o.lit ? 'accent' : 'ink';
    p.path([[-3.6, -3.6], [-3.6, 3.6]], { w: 0.7, c }); p.path([[-2.2, -3.6], [-2.2, 3.6]], { w: 0.7, c });
    p.ellipse(-4.8, -4.6, 1.5, 1, { w: 0.6, c, over: 0.1 }); p.ellipse(-1, -4.6, 1.5, 1, { w: 0.6, c, over: 0.1 });
    p.path([[-3.2, -4], [-4.6, -1.4]], { w: 0.6, c }); p.path([[-2.6, -4], [-1.2, -1.4]], { w: 0.6, c });
    p.draw();
    return {};
  }
  function funnel(g, x, y, o = {}) {  // top centre origin
    const p = pen(g, { ...o, x, y }, 'funnel'), pts = [[-18, 0], [18, 0], [3, 16], [3, 24], [-3, 24], [-3, 16]];
    p.knock(pts); p.poly(pts, { w: 0.9 }); p.ellipse(0, 0, 18, 2.4, { w: 0.5, over: 0.1 });
    p.draw();
    return { spout: p.map([0, 24]) };
  }
  // A 1960s room-sized computer: cabinets with tape reels and panel lights; bottom-left origin.
  function mainframe(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'mainframe'), n = o.n ?? 3, t = g.t;
    for (let i = 0; i < n; i++) {
      const cx = i * 17;
      p.knock([[cx, -34], [cx + 15, -34], [cx + 15, 0], [cx, 0]]); p.rect(cx, -34, 15, 34, { w: 0.9 });
      if (i % 2 === 0) { const sp = t * 2 + i; [[cx + 4.2, -26], [cx + 10.8, -26]].forEach(([rx, ry]) => { p.circle(rx, ry, 3, { w: 0.6 }); p.line(rx, ry, rx + Math.cos(sp) * 2.6, ry + Math.sin(sp) * 2.6, { w: 0.4, exact: true }); }); p.rect(cx + 2, -18, 11, 5, { w: 0.5 }); }
      else for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { const on = hash(r * 4 + k + Math.floor(t * 3) * 17, i) > 0.55; p.circle(cx + 3 + k * 3, -29 + r * 3.6, 0.6, { w: 0.35, c: on && o.lit ? 'accent' : 'ink' }); }
      p.line(cx + 2, -6, cx + 13, -6, { w: 0.4, c: 'dim' });
    }
    p.draw();
    return { top: p.map([n * 8.5, -34]) };
  }
  // Engelbart's 1964 mouse: a wooden box with one button and a cord; centre origin
  function oldmouse(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'oldmouse');
    const top = [[-7, -4], [5, -5], [7.5, -2], [7, 4], [-6, 5], [-8, 1.5]];
    p.knock(top); p.path(top, { closed: true, smooth: true });
    p.path([[-7.5, 2.5], [-7.2, 5.8], [6.4, 5.4], [7.2, 3.6]], { smooth: true, w: 0.7 });
    p.rect(1.6, -3.4, 3.4, 2.2, { w: 0.5, c: o.lit ? 'accent' : 'ink' });
    p.curve([[-7.6, 0], [-14, -1.5], [-18, 2], [-24, 1]], { w: 0.6 });
    p.circle(-3, 6.6, 1.2, { w: 0.45 }); p.circle(3, 6.4, 1.2, { w: 0.45 });
    p.draw();
    return {};
  }
  // A stage with a big screen above it; bottom centre origin. Returns the screen rect (world).
  function stage(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'stage'), w = o.w ?? 90, sw = w * 0.8, sh = sw * 0.42;
    p.line(-w / 2, 0, w / 2, 0, { w: 1 }); p.line(-w / 2, 0, -w / 2 - 4, 6, { w: 0.6 }); p.line(w / 2, 0, w / 2 + 4, 6, { w: 0.6 });
    p.knock([[-sw / 2, -sh - 22], [sw / 2, -sh - 22], [sw / 2, -22], [-sw / 2, -22]]);
    p.rect(-sw / 2, -sh - 22, sw, sh, { w: 1 });
    p.path([[-w / 2, -sh - 30], [-w / 2 + 8, -sh - 22], [-w / 2 + 3, -8], [-w / 2 + 5, 0]], { smooth: true, w: 0.6 });
    p.path([[w / 2, -sh - 30], [w / 2 - 8, -sh - 22], [w / 2 - 3, -8], [w / 2 - 5, 0]], { smooth: true, w: 0.6 });
    p.draw();
    const [ax, ay] = p.map([-sw / 2 + 2, -sh - 20]), [bx, by] = p.map([sw / 2 - 2, -24]);
    return { x: ax, y: ay, w: bx - ax, h: by - ay };
  }
  // A hand coming down from above, pinching; (x, y) is the fingertips.
  function hand(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'hand');
    const fingers = [[-4.6, 7.5], [-1.6, 9], [1.4, 8.6], [4.2, 6.6]], palm = [[-6.2, -30], [-6.2, -16], [-6, -9.6], [6, -9.6], [6.4, -16], [6.2, -30]];
    p.knock([[-6.4, -30], [6.6, -30], [6.6, -9], [-6.4, -9], [-6.4, 0]]);
    fingers.forEach(([fx, len]) => { const top = -9.8, bot = top + len, f = [[fx - 1.35, top], [fx - 1.35, bot - 1.2], [fx, bot], [fx + 1.35, bot - 1.2], [fx + 1.35, top]]; p.knock(f); p.path(f, { smooth: true, w: 0.75 }); });
    p.path(palm, { smooth: true });
    p.path([[6.2, -17], [8.6, -13.5], [9, -10], [7.6, -8.2], [6.2, -10.5]], { smooth: true, w: 0.75 });
    p.path([[-6.2, -25], [6.2, -25]], { w: 0.55 });
    p.draw();
    return { tip: p.map([-1.6, -0.8]) };
  }
  // Footprints along a path of world points, o.progress lays them one by one.
  function footprints(g, pts, o = {}) {
    const n = pts.length, show = Math.floor(clamp(o.progress ?? 1) * n);
    const p = pen(g, { nib: false }, 'footprints');
    for (let i = 0; i < show; i++) {
      const [x, y] = pts[i], b = pts[Math.min(n - 1, i + 1)], a = Math.atan2(b[1] - y, b[0] - x), side = i % 2 ? 1 : -1;
      const ox = -Math.sin(a) * 1.4 * side, oy = Math.cos(a) * 1.4 * side;
      p.ellipse(x + ox, y + oy, 1.3, 0.7, { w: 0.4, c: o.c ?? 'dim', over: 0.1 });
    }
    p.draw();
    return {};
  }
  // A big dark scribble, the thing people are afraid of; centre origin. o.r, o.n (loops), o.c
  function scribbleMass(g, x, y, o = {}) {
    const r = o.r ?? 30, n = o.n ?? 14, t = g.flow || g.t, p = pen(g, { progress: o.progress, wob: 1.6 }, 'fear');
    for (let i = 0; i < n; i++) {
      const cx = x + (hash(i, 51) - 0.5) * r * 1.2, cy = y + (hash(i, 52) - 0.5) * r * 0.9, rr = r * (0.25 + hash(i, 53) * 0.35), pts = [];
      for (let k = 0; k <= 24; k++) { const a = (k / 24) * 6.283 * 1.3 + t * (0.3 + hash(i, 54) * 0.4) * (i % 2 ? 1 : -1); pts.push([cx + Math.cos(a) * rr * (1 + 0.25 * Math.sin(k * 1.7 + i)), cy + Math.sin(a) * rr * 0.8]); }
      p.path(pts, { smooth: true, w: 0.9 + hash(i, 55) * 0.6, c: o.c ?? (i % 3 ? 'dim' : 'ink') });
    }
    p.draw();
    return {};
  }
  function ladder(g, x, y, o = {}) {  // bottom origin, leaning right
    const p = pen(g, { ...o, x, y }, 'ladder'), h = o.h ?? 26;
    p.line(-3, 0, 1, -h, { w: 0.8 }); p.line(3, 0, 7, -h, { w: 0.8 });
    for (let i = 1; i < h / 4; i++) { const f = (i * 4) / h; p.line(-3 + 4 * f, -i * 4, 3 + 4 * f, -i * 4, { w: 0.5 }); }
    p.draw();
    return {};
  }
  // A table in side view; knocks out what's behind its front edge (the people behind it). y = the tabletop.
  function table(g, x, y, w, o = {}) {
    const p = pen(g, { progress: o.progress }, 'table');
    p.knock([[x, y], [x + w, y], [x + w, y + 60], [x, y + 60]]);
    p.line(x - 2, y, x + w + 2, y, { w: 1.1 }); p.line(x, y + 2.4, x + w, y + 2.4, { w: 0.5 });
    p.line(x + 4, y + 2.4, x + 5, y + (o.leg ?? 24), { w: 0.8 }); p.line(x + w - 4, y + 2.4, x + w - 5, y + (o.leg ?? 24), { w: 0.8 });
    p.draw();
    return {};
  }
  // A conveyor belt from x0 to x1 at y; rollers turn with the voice clock.
  function conveyor(g, x0, x1, y, o = {}) {
    const p = pen(g, { progress: o.progress }, 'conveyor'), t = (g.flow || g.t) * (o.speed ?? 1);
    p.line(x0, y, x1, y, { w: 0.9 }); p.line(x0, y + 5, x1, y + 5, { w: 0.9 });
    p.arc(x0, y + 2.5, 2.5, 2.5, Math.PI / 2, Math.PI * 1.5, { w: 0.9 }); p.arc(x1, y + 2.5, 2.5, 2.5, -Math.PI / 2, Math.PI / 2, { w: 0.9 });
    for (let x = x0 + 4; x < x1 - 2; x += 9) { p.circle(x, y + 2.5, 1.6, { w: 0.4, c: 'dim' }); p.line(x, y + 2.5, x + Math.cos(t * 4) * 1.4, y + 2.5 + Math.sin(t * 4) * 1.4, { w: 0.35, c: 'dim', exact: true }); }
    p.draw();
    return {};
  }
  function bin(g, x, y, o = {}) {  // an open box with a label; bottom centre origin
    const p = pen(g, { ...o, x, y }, 'bin'), pts = [[-11, -14], [11, -14], [9, 0], [-9, 0]];
    p.knock(pts); p.path([[-11, -14], [-9, 0], [9, 0], [11, -14]], { w: 0.9 }); p.ellipse(0, -14, 11, 1.6, { w: 0.5, over: 0.1 });
    p.draw();
    if (o.label) text(g, o.label, x, y - 8 * (o.s ?? 1), { role: 'label', align: 'center', c: o.lit ? 'accent' : 'dim' });
    return { mouth: p.map([0, -14]) };
  }
  function face(g, x, y, o = {}) {  // a round face; o.mood 'smile' | 'flat'
    const r = o.r ?? 4, p = pen(g, { ...o, x, y }, 'face');
    p.knock(Array.from({ length: 14 }, (_, i) => [Math.cos(i / 2.23) * r, Math.sin(i / 2.23) * r])); p.circle(0, 0, r, { w: 0.7 });
    p.dot(-r * 0.35, -r * 0.2, 0.45); p.dot(r * 0.35, -r * 0.2, 0.45);
    if (o.mood === 'smile') p.arc(0, r * 0.1, r * 0.45, r * 0.35, 0.3, Math.PI - 0.3, { w: 0.5, c: o.lit ? 'accent' : 'ink' }); else p.line(-r * 0.35, r * 0.35, r * 0.35, r * 0.35, { w: 0.5, exact: true });
    p.draw();
    return {};
  }
  function spark(g, x0, y0, x1, y1, o = {}) {  // a jagged spark between two points
    const p = pen(g, { progress: o.progress }, 'spark'), n = 6, pts = [], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    for (let i = 0; i <= n; i++) { const j = i === 0 || i === n ? 0 : (hash(i + g.boil * 7, 61) - 0.5) * 5; pts.push([x0 + (dx * i) / n - (dy / L) * j, y0 + (dy * i) / n + (dx / L) * j]); }
    p.path(pts, { c: o.c ?? 'accent', w: 0.8 });
    p.draw();
    return {};
  }

  // A small quick figure for crowds: head, body, arms, legs. o: s, c, look (-1..1), q (a question mark over it), walk, badge
  function mini(g, x, y, o = {}) {
    const p = pen(g, { ...o, x, y }, 'mini'), c = o.c ?? 'ink', step = o.walk ? Math.sin((g.flow || g.t) * 9 + x) * 1.6 : 0;
    const disc = Array.from({ length: 12 }, (_, i) => [Math.cos(i / 1.9) * 2.6, -15.5 + Math.sin(i / 1.9) * 2.6]);
    p.knock([[-3.4, -13], [3.4, -13], [3, -5], [-3, -5]]);
    p.path([[-3, -5.2], [-3.4, -11], [-1.6, -12.8], [1.6, -12.8], [3.4, -11], [3, -5.2]], { smooth: true, w: 0.7, c });
    p.line(-1.6, -5.2, -1.8 - step * 0.5, 0, { w: 0.7, c }); p.line(1.6, -5.2, 1.8 + step * 0.5, 0, { w: 0.7, c });
    p.knock(disc); p.circle(0, -15.5, 2.6, { w: 0.7, c });
    p.dot(-0.9 + (o.look ?? 0) * 0.8, -15.8, 0.3, { c }); p.dot(0.9 + (o.look ?? 0) * 0.8, -15.8, 0.3, { c });
    if (o.badge) p.fill(Array.from({ length: 10 }, (_, i) => [1.3 + Math.cos(i / 1.6) * 1, -10 + Math.sin(i / 1.6) * 1]), { shift: 0 });
    p.draw();
    if (o.q) text(g, '?', x + 3 * (o.s ?? 1), y - 22 * (o.s ?? 1), { role: 'body', c: o.q === true ? 'dim' : o.q });
    return { head: p.map([0, -18.5]) };
  }

  window.Line = {
    C, THEMES, POSES, CAST, frame, camera, look, screen, punch, pop, pen, room, bg, capture, morph,
    bicycle, brain, head, textRot, ask, tag, stamp, filmcam, promptbox, pebble, house, shop, mountains, tower, coin, chalkboard, globe,
    college, cheque, door, jar, mini, bill, heart, signpost, wave, sun, storm, ledger, invoice, robot, playcard, bookshelf, openbook, building,
    stairs, jet, wrench, diploma, funnel, mainframe, oldmouse, stage, hand, footprints, fear: scribbleMass, ladder, table, conveyor, bin, face, spark,
    text, plate, typeAt, label, hud, caption, subtitles, measure,
    arrow, ring, underline, mark, scribble, bubble, thought,
    box, flow, stack, graph, chart, trend, terminal, code, file, folder, tree, browser, image, screenshot, tokens,
    laptop, mug, lamp, plant, books, bulb, clock, envelope, phone, monitor, crt, keyboard, server, db, gear, cloud, magnifier, lock, calendar, hourglass, cursor: cursorArrow, chair,
    person, coder, art, drawing,
  };
})();
