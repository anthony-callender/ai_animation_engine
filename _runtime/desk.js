// desk.js - real screens at full resolution, under the Eduba cast. Load after eduba.js.
// Everything here draws on the photo layer (g.photo.ctx: 1920x1080 wide, 1080x1920 tall) in real px,
// as pure functions of what you pass in: a desktop, windows, a file tree, an editor, a terminal, a browser,
// the studio's preview bar and a mouse pointer. Content comes from `anim.py real` (window.REAL) and `anim.py grab`.
// Put the photo layer under the art with E.frame({ overlay: true }) and g.under = true, then E.host / E.spot on top.
// Reference: _shared/desk.md. Worked example: the synthetic project in videos/silent-first-scene/.
window.Desk = (() => {
  const K = {
    wall: '#100d0c', wall2: '#1f1815', win: '#1d1a17', side: '#181512', title: '#131110', line: '#2e2823',
    text: '#e9e3d6', dim: '#8a8175', faint: '#5b534b', sel: '#3a2b25',
    head: '#F6D79B', bold: '#e4a07e', code: '#a9c9bd', num: '#D8BFC0', md: '#56698D', py: '#5F8783', folder: '#C98A69',
    red: '#C0714A', amber: '#E8A860', sage: '#5F8783', prompt: '#9fc4b7', out: '#bdb4ab',
    bar: '#161412', barBtn: '#221f1c', barEdge: '#3a3530', barFill: '#c8491c', barCue: '#e4a07e',
  };
  const MONO = '"Cascadia Mono", "Cascadia Code", Consolas, monospace', UI = '"Segoe UI", system-ui, sans-serif';
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

  function wallpaper(ctx) {
    const W = ctx.canvas.width, H = ctx.canvas.height, gr = ctx.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0, K.wall2); gr.addColorStop(1, K.wall);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let y = 18; y < H; y += 36) for (let x = 18; x < W; x += 36) ctx.fillRect(x, y, 2, 2);
  }

  // A window with a title bar. Returns the content rect.
  function win(ctx, x, y, w, h, o = {}) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 16;
    rr(ctx, x, y, w, h, 12); ctx.fillStyle = o.bg || K.win; ctx.fill();
    ctx.restore();
    ctx.save(); rr(ctx, x, y, w, h, 12); ctx.clip();
    ctx.fillStyle = K.title; ctx.fillRect(x, y, w, 40);
    ctx.fillStyle = K.line; ctx.fillRect(x, y + 40, w, 1);
    [K.red, K.amber, K.sage].forEach((c, i) => { ctx.beginPath(); ctx.arc(x + 24 + i * 22, y + 20, 6.5, 0, 7); ctx.fillStyle = c; ctx.fill(); });
    ctx.fillStyle = K.dim; ctx.font = `15px ${UI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(o.title || '', x + w / 2, y + 21); ctx.textAlign = 'left';
    ctx.restore();
    ctx.save(); rr(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 12); ctx.strokeStyle = K.line; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    return { x, y: y + 41, w, h: h - 41 };
  }

  function folderGlyph(ctx, x, y, open) {
    ctx.fillStyle = K.folder;
    ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x + 7, y + 2); ctx.lineTo(x + 9, y + 4); ctx.lineTo(x + 18, y + 4);
    ctx.lineTo(x + 18, y + 15); ctx.lineTo(x, y + 15); ctx.closePath(); ctx.fill();
    if (open) { ctx.fillStyle = '#e0a987'; ctx.beginPath(); ctx.moveTo(x + 2, y + 7); ctx.lineTo(x + 20, y + 7); ctx.lineTo(x + 18, y + 15); ctx.lineTo(x, y + 15); ctx.closePath(); ctx.fill(); }
  }
  function fileGlyph(ctx, x, y, name) {
    const c = /\.(py|js)$/.test(name) ? K.py : /\.md$/.test(name) ? K.md : K.dim;
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x + 2, y); ctx.lineTo(x + 11, y); ctx.lineTo(x + 16, y + 5); ctx.lineTo(x + 16, y + 18); ctx.lineTo(x + 2, y + 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 5, y + 9, 8, 2); ctx.fillRect(x + 5, y + 13, 6, 2);
  }
  function chevron(ctx, x, y, open) {
    ctx.strokeStyle = K.dim; ctx.lineWidth = 2; ctx.beginPath();
    if (open) { ctx.moveTo(x, y - 3); ctx.lineTo(x + 5, y + 2); ctx.lineTo(x + 10, y - 3); }
    else { ctx.moveTo(x + 2, y - 5); ctx.lineTo(x + 7, y); ctx.lineTo(x + 2, y + 5); }
    ctx.stroke();
  }

  // ── file tree ─────────────────────────────────────────────────────────────
  const RH = 32, TREE_TOP = 74;
  // Rows for tree() from a captured listing (REAL.trees[...]: [[path, isDir], ...], dirs first, depth first).
  // o.open: { 'stages': 0..1, ... } how open each folder is (animate it with a cue's progress); o.sel: the selected path.
  // Each row gets .top, its offset from the tree's top, so a pointer can find it before anything is drawn.
  function rows(list, o = {}) {
    const open = o.open || {}, out = [];
    let top = TREE_TOP;
    for (const [path, dir] of list) {
      const parts = path.split('/');
      let f = 1;
      for (let k = 1; k < parts.length; k++) f *= clamp(open[parts.slice(0, k).join('/')] ?? 0);
      if (f <= 0) continue;
      out.push({ id: path, name: parts[parts.length - 1], depth: parts.length - 1, dir, open: dir && (open[path] ?? 0) > 0, f, sel: o.sel === path, top });
      top += RH * f;
    }
    return out;
  }
  // Where a row's name sits, for a pointer: [x, y] with the tree drawn at (x, y), scrolled by `scroll` px.
  const rowPoint = (list, id, x, y, scroll = 0) => { const r = list.find((q) => q.id === id); return r ? [x + 16 + r.depth * 20 + 84, y + r.top - scroll + RH / 2] : [x, y]; };

  // Explorer. Returns { id: rect } for pointers and spots. o.root (the workspace name), o.split (height given to the
  // tree; the OUTLINE pane, o.outline = the open file's headings, and TIMELINE take the rest), o.scroll (px the rows scroll up).
  function tree(ctx, x, y, w, h, list, o = {}) {
    const out = {}, th = o.split ?? h;
    ctx.fillStyle = K.side; ctx.fillRect(x, y, w, h);
    if (th < h) {
      const pane = (label, py, open) => {
        ctx.fillStyle = K.line; ctx.fillRect(x, py, w, 1);
        chevron(ctx, x + 12, py + 18, open); ctx.fillStyle = K.text; ctx.font = `700 14px ${UI}`; ctx.textBaseline = 'middle'; ctx.fillText(label, x + 30, py + 18);
      };
      pane('OUTLINE', y + th, true);
      ctx.font = `17px ${UI}`;
      (o.outline || []).forEach((s, i) => { ctx.fillStyle = K.bold; ctx.fillText('#', x + 36, y + th + 54 + i * RH); ctx.fillStyle = K.text; ctx.fillText(s, x + 58, y + th + 54 + i * RH); });
      pane('TIMELINE', y + h - 36, false);
    }
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, th); ctx.clip();
    ctx.fillStyle = K.dim; ctx.font = `600 13px ${UI}`; ctx.textBaseline = 'middle';
    ctx.fillText('EXPLORER', x + 22, y + 22);
    ctx.fillStyle = K.text; ctx.font = `700 14px ${UI}`;
    chevron(ctx, x + 12, y + 56, true); ctx.fillText((o.root || 'workspace').toUpperCase(), x + 30, y + 56);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y + TREE_TOP - 4, w, th - TREE_TOP + 4); ctx.clip();
    let yy = y + TREE_TOP - (o.scroll || 0);
    for (const r of list) {
      const f = clamp(r.f ?? 1);
      if (f <= 0) continue;
      const rh = RH * f;
      ctx.save(); ctx.beginPath(); ctx.rect(x, yy, w, rh); ctx.clip(); ctx.globalAlpha = f;
      if (r.sel) { ctx.fillStyle = K.sel; ctx.fillRect(x, yy, w, RH); }
      const ix = x + 16 + r.depth * 20, cy = yy + RH / 2;
      if (r.dir) { chevron(ctx, ix, cy, r.open); folderGlyph(ctx, ix + 16, cy - 9, r.open); }
      else fileGlyph(ctx, ix + 17, cy - 9, r.name);
      ctx.fillStyle = r.dim ? K.dim : K.text; ctx.font = `17px ${UI}`;
      ctx.fillText(r.name, ix + 44, cy + 1);
      ctx.restore();
      out[r.id] = { x, y: yy, w, h: rh, tx: ix + 44 };
      yy += rh;
    }
    ctx.restore(); ctx.restore();
    ctx.fillStyle = K.line; ctx.fillRect(x + w, y, 1, h);
    return out;
  }

  // ── editor ────────────────────────────────────────────────────────────────
  // Markdown: headings, **bold**, `code`, table pipes.
  function mdSpans(line) {
    if (/^#{1,6}\s/.test(line)) return [[line, K.head, '700 ']];
    if (/^\|?[\s|:-]+\|[\s|:-]*$/.test(line)) return [[line, K.faint]];
    const out = [], re = /(\*\*[^*]+\*\*|`[^`]+`|\|)/g;
    let k = 0, m;
    while ((m = re.exec(line))) {
      if (m.index > k) out.push([line.slice(k, m.index), K.text]);
      out.push([m[0], m[0] === '|' ? K.faint : m[0][0] === '`' ? K.code : K.bold, m[0][0] === '*' ? '700 ' : '']);
      k = m.index + m[0].length;
    }
    if (k < line.length) out.push([line.slice(k), K.text]);
    return out;
  }
  // Code (js, py, json): comments, strings, numbers, keywords.
  const KW = new Set(('const let var function return if else for while of in new class import from export default async await '
    + 'true false null undefined this def None True False and or not with as elif try except raise lambda yield print').split(' '));
  function codeSpans(line, lang) {
    const out = [], cm = lang === 'py' ? '#' : '//';
    let i = 0, cur = '';
    const push = (s, c) => { if (s) out.push([s, c]); };
    while (i < line.length) {
      const ch = line[i];
      if (lang !== 'json' && line.startsWith(cm, i)) { push(cur, K.text); push(line.slice(i), K.faint); return out; }
      if (ch === '"' || ch === "'" || ch === '`') {
        push(cur, K.text); cur = '';
        let j = i + 1;
        while (j < line.length && line[j] !== ch) j += line[j] === '\\' ? 2 : 1;
        push(line.slice(i, j + 1), K.code); i = j + 1; continue;
      }
      if (/[A-Za-z_$]/.test(ch)) {
        let j = i; while (j < line.length && /[\w$]/.test(line[j])) j++;
        const w = line.slice(i, j); push(cur, K.text); cur = '';
        push(w, KW.has(w) ? K.bold : K.text); i = j; continue;
      }
      if (/[0-9]/.test(ch) && !/[\w$]/.test(line[i - 1] || '')) {
        let j = i; while (j < line.length && /[0-9.]/.test(line[j])) j++;
        push(cur, K.text); cur = ''; push(line.slice(i, j), K.num); i = j; continue;
      }
      cur += ch; i++;
    }
    push(cur, K.text);
    return out;
  }
  const langOf = (name = '') => (/\.md$/.test(name) ? 'md' : /\.js$/.test(name) ? 'js' : /\.py$/.test(name) ? 'py' : /\.json$/.test(name) ? 'json' : 'txt');

  // Tabs, breadcrumb, gutter, text. o: tabs [{ name, hint, p }], active, crumb, lines, scroll (visual rows, fractional is
  // fine), top (a line index to scroll to the top, fractional is fine; wins over scroll, and counts wrapped rows for you),
  // lang (default: from the active tab's name), first (number of line 1, for excerpts), wrap (word wrap, for prose).
  // Returns { line(i, a, b) -> rect of line i from column a to b (spanning its wrapped rows), find(text, from) -> that rect
  // for the first match (from: a line index to search from), rowOf(i, a) -> the visual row of a column, cw, lh }.
  function editor(ctx, x, y, w, h, o = {}) {
    ctx.save(); ctx.font = `18px ${MONO}`;
    const cw0 = ctx.measureText('M').width, cols = Math.max(20, Math.floor((w - 70 - 24) / cw0));
    ctx.restore();
    const src = (o.lines || []).map((l) => l.replace(/\t/g, '    ')), R = [];  // visual rows: { i, a, b }
    src.forEach((ln, i) => {
      if (!o.wrap || ln.length <= cols) { R.push({ i, a: 0, b: ln.length }); return; }
      let a = 0;
      while (a < ln.length) {
        let b = Math.min(ln.length, a + cols);
        if (b < ln.length) { const sp = ln.lastIndexOf(' ', b); if (sp > a) b = sp + 1; }
        R.push({ i, a, b }); a = b;
      }
    });
    return editorRows(ctx, x, y, w, h, o, src, R);
  }
  function editorRows(ctx, x, y, w, h, o, src, R) {
    const LH = 30, FS = 18, tabs = o.tabs || [], act = o.active ?? 0, lang = o.lang || langOf(tabs[act] && tabs[act].name);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = K.win; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = K.title; ctx.fillRect(x, y, w, 40);
    let tx = x;
    ctx.font = `15px ${UI}`; ctx.textBaseline = 'middle';
    tabs.forEach((t, i) => {
      const tw = ctx.measureText(t.name).width + (t.hint ? ctx.measureText(t.hint).width + 10 : 0) + 64;
      const on = i === act, p = clamp(t.p ?? 1);
      ctx.globalAlpha = p;
      ctx.fillStyle = on ? K.win : K.title; ctx.fillRect(tx, y, tw, 40);
      if (on) { ctx.fillStyle = K.bold; ctx.fillRect(tx, y, tw, 2); }
      fileGlyph(ctx, tx + 14, y + 11, t.name);
      ctx.fillStyle = on ? K.text : K.dim; ctx.fillText(t.name, tx + 40, y + 21);
      if (t.hint) { ctx.fillStyle = K.faint; ctx.fillText(t.hint, tx + 48 + ctx.measureText(t.name).width, y + 21); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = K.line; ctx.fillRect(tx + tw, y, 1, 40);
      tx += tw * p;
    });
    ctx.fillStyle = K.dim; ctx.font = `14px ${UI}`;
    ctx.fillText(o.crumb || '', x + 24, y + 58);
    const rowAt = (i) => { const k = R.findIndex((r) => r.i >= i); return k < 0 ? R.length : k; }, ti = Math.floor(o.top || 0);
    const top = y + 78, gut = 70, first = o.first || 1;
    const sc = o.top != null ? rowAt(ti) + (rowAt(ti + 1) - rowAt(ti)) * ((o.top || 0) - ti) : o.scroll || 0;
    ctx.font = `${FS}px ${MONO}`;
    const cw = ctx.measureText('M').width, spansOf = new Map();
    const spans = (i) => {  // colour a whole line once, then cut each wrapped row out of it
      if (!spansOf.has(i)) { const t = src[i]; spansOf.set(i, lang === 'md' ? mdSpans(t) : lang === 'txt' ? [[t, K.text]] : codeSpans(t, lang)); }
      return spansOf.get(i);
    };
    R.forEach((r, k) => {
      const ly = top + (k - sc) * LH;
      if (ly < top - LH || ly > y + h) return;
      if (r.a === 0) { ctx.fillStyle = K.faint; ctx.textAlign = 'right'; ctx.font = `${FS}px ${MONO}`; ctx.fillText(String(r.i + first), x + gut - 18, ly + LH / 2); ctx.textAlign = 'left'; }
      let pos = 0;
      for (const [s, c, wt] of spans(r.i)) {
        const s0 = Math.max(pos, r.a), s1 = Math.min(pos + s.length, r.b);
        if (s1 > s0) { ctx.fillStyle = c; ctx.font = `${wt || ''}${FS}px ${MONO}`; ctx.fillText(s.slice(s0 - pos, s1 - pos), x + gut + (s0 - r.a) * cw, ly + LH / 2); }
        pos += s.length;
      }
    });
    ctx.restore();
    const rowOf = (i, a = 0) => { const k = R.findIndex((r) => r.i === i && a >= r.a && (a < r.b || r.b === r.a || a === src[i].length)); return k < 0 ? R.findIndex((r) => r.i === i) : k; };
    const line = (i, a = 0, b) => {
      b = b ?? (src[i] || '').length;
      const k0 = rowOf(i, a), k1 = rowOf(i, Math.max(a, b - 1));
      if (k0 < 0) return null;
      const one = k0 === k1, r0 = R[k0];
      const x0 = one ? x + gut + (a - r0.a) * cw : x + gut, x1 = one ? x + gut + (b - r0.a) * cw : x + gut + Math.max(...R.slice(k0, k1 + 1).map((r) => r.b - r.a)) * cw;
      return { x: x0, y: top + (k0 - sc) * LH, w: x1 - x0, h: (k1 - k0 + 1) * LH };
    };
    const find = (text, from = 0) => { for (let i = from; i < src.length; i++) { const a = src[i].indexOf(text); if (a >= 0) return line(i, a, a + text.length); } return null; };
    return { line, find, rowOf, rows: R.length, cw, lh: LH };
  }

  // An image viewer: a window with a picture fit inside (a contact sheet, a thumbnail). Returns { at(ix, iy), k }.
  function view(ctx, img, x, y, w, h, o = {}) {
    const c = win(ctx, x, y, w, h, { title: o.title || '' });
    ctx.fillStyle = '#0e0c0b'; ctx.fillRect(c.x, c.y, c.w, c.h);
    const iw = img.naturalWidth || 16, ih = img.naturalHeight || 9, k = Math.min((c.w - 24) / iw, (c.h - 24) / ih);
    const ox = c.x + (c.w - iw * k) / 2, oy = c.y + (c.h - ih * k) / 2;
    if (img.naturalWidth) ctx.drawImage(img, ox, oy, iw * k, ih * k);
    return { at: (ix, iy) => [ox + ix * k, oy + iy * k], k };
  }

  // ── terminal ──────────────────────────────────────────────────────────────
  const CPS = 30, LPS = 36;  // typing speed (chars a second) and how fast output prints (lines a second)
  // When an entry's output has finished printing.
  const ends = (e, o = {}) => e.t0 + e.cmd.length / (o.cps || CPS) + 0.25 + e.out.length / (o.lps || LPS);
  // entries: [{ t0, cmd, out: [...] }] (a run from REAL.runs gives cmd and out), typed and printed as a function of t.
  // o.bottom: keep text above this y (the pixel band on wide). Returns { cmd(k) -> rect of entry k's command line, or null }.
  function terminal(ctx, x, y, w, h, entries, t, o = {}) {
    const LH = 26, FS = 17, cps = o.cps || CPS, lps = o.lps || LPS, PR = o.prompt ?? 'PS ...\\animations> ';
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = K.title; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = K.line; ctx.fillRect(x, y, w, 1);
    ctx.font = `600 13px ${UI}`; ctx.textBaseline = 'middle';
    ['PROBLEMS', 'OUTPUT', 'TERMINAL'].forEach((s, i) => {
      ctx.fillStyle = i === 2 ? K.text : K.faint; ctx.fillText(s, x + 24 + i * 110, y + 22);
      if (i === 2) { ctx.fillStyle = K.bold; ctx.fillRect(x + 24 + i * 110, y + 38, ctx.measureText(s).width, 2); }
    });
    const L = [], cmdAt = {};
    let busy = false;
    entries.forEach((e, k) => {
      if (t < e.t0) return;
      const n = Math.floor((t - e.t0) * cps), done = e.t0 + e.cmd.length / cps + 0.25;
      cmdAt[k] = L.length;
      L.push({ p: PR, s: e.cmd.slice(0, n), cur: n < e.cmd.length });
      if (t >= done) { const m = Math.floor((t - done) * lps); e.out.slice(0, m).forEach((s) => L.push({ s: s.replace(/\t/g, '    '), out: true })); busy = m < e.out.length; }
      else busy = true;
    });
    if (!busy) L.push({ p: PR, s: '', cur: true });
    const top = y + 54, rowsN = Math.floor(((o.bottom ?? y + h) - top) / LH), first = Math.max(0, L.length - rowsN);
    ctx.font = `${FS}px ${MONO}`;
    const cw = ctx.measureText('M').width;
    L.slice(first).forEach((l, i) => {
      const ly = top + i * LH + LH / 2;
      let cx = x + 24;
      if (l.p) { ctx.fillStyle = K.prompt; ctx.fillText(l.p, cx, ly); cx += l.p.length * cw; }
      ctx.fillStyle = l.out ? K.out : K.text; ctx.fillText(l.s, cx, ly); cx += l.s.length * cw;
      if (l.cur && Math.floor(t * 2.5) % 2 === 0) { ctx.fillStyle = K.text; ctx.fillRect(cx + 2, ly - 11, cw - 2, 22); }
    });
    ctx.restore();
    return {
      cmd: (k) => { const i = cmdAt[k]; if (i == null || i < first) return null; const e = entries[k];
        return { x: x + 24, y: top + (i - first) * LH, w: (PR.length + e.cmd.length) * cw, h: LH }; },
      // output line j of entry k, once printed and on screen
      out: (k, j) => { const i = cmdAt[k]; if (i == null) return null; const n = i + 1 + j; if (n < first || n >= L.length || !L[n].out) return null;
        return { x: x + 24, y: top + (n - first) * LH, w: L[n].s.length * cw, h: LH }; },
    };
  }

  // ── browser, preview bar, pointer ─────────────────────────────────────────
  // A browser window with a real screenshot (anim.py grab). o: url, title, scroll (image px down the page).
  // Returns { at(ix, iy) -> screen point of an image pixel, k (scale) }.
  function browser(ctx, x, y, w, h, img, o = {}) {
    const c = win(ctx, x, y, w, h, { title: o.title || '' });
    ctx.fillStyle = K.title; ctx.fillRect(c.x, c.y, c.w, 46);
    rr(ctx, c.x + 110, c.y + 8, c.w - 140, 30, 15); ctx.fillStyle = '#26211d'; ctx.fill();
    ctx.fillStyle = K.dim; ctx.font = `15px ${UI}`; ctx.textBaseline = 'middle'; ctx.fillText(o.url || '', c.x + 132, c.y + 23);
    ctx.strokeStyle = K.dim; ctx.lineWidth = 2;
    [[c.x + 26, -1], [c.x + 56, 1]].forEach(([ax, d]) => { ctx.beginPath(); ctx.moveTo(ax + 5 * d, c.y + 16); ctx.lineTo(ax - 2 * d, c.y + 23); ctx.lineTo(ax + 5 * d, c.y + 30); ctx.stroke(); });
    const top = c.y + 46, k = c.w / (img.naturalWidth || 1), sy = o.scroll || 0;
    ctx.save(); rr(ctx, c.x, top, c.w, c.h - 46, [0, 0, 12, 12]); ctx.clip();
    if (img.naturalWidth) ctx.drawImage(img, c.x, top - sy * k, c.w, img.naturalHeight * k);
    ctx.restore();
    return { at: (ix, iy) => [c.x + ix * k, top + (iy - sy) * k], k };
  }

  // The studio's preview bar (colours from player.js), 58 px tall. o: time, duration (s), marks (cue starts), label.
  function bar(ctx, x, y, w, o = {}) {
    const h = 58, T = o.duration || 1, tv = clamp(o.time || 0, 0, T);
    ctx.fillStyle = K.bar; ctx.fillRect(x, y, w, h);
    rr(ctx, x + 16, y + 9, 40, 40, 6); ctx.fillStyle = K.barBtn; ctx.fill(); ctx.strokeStyle = K.barEdge; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = K.text;
    if (o.playing !== false) { ctx.fillRect(x + 29, y + 21, 5, 16); ctx.fillRect(x + 38, y + 21, 5, 16); }
    else { ctx.beginPath(); ctx.moveTo(x + 30, y + 19); ctx.lineTo(x + 44, y + 29); ctx.lineTo(x + 30, y + 39); ctx.fill(); }
    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`;
    ctx.font = `14px ${MONO}`; ctx.textBaseline = 'middle'; ctx.fillText(`${fmt(tv)} / ${fmt(T)}`, x + 72, y + 29);
    const a = x + 270, b = x + w - 170, ty = y + 29;
    ctx.fillStyle = K.barEdge; ctx.fillRect(a, ty - 2, b - a, 4);
    ctx.fillStyle = K.barFill; ctx.fillRect(a, ty - 2, (b - a) * tv / T, 4);
    ctx.globalAlpha = 0.55; ctx.fillStyle = K.text;
    (o.marks || []).forEach((s) => ctx.fillRect(a + (b - a) * s / T - 1, ty - 8, 2, 16));
    ctx.globalAlpha = 1; ctx.fillStyle = K.barCue;
    if (o.label) ctx.fillText(o.label, b + 20, ty);
    return h;
  }

  // Mouse pointer; o.click 0..1 draws a ring that grows and fades (pass the progress since the click).
  function pointer(ctx, x, y, o = {}) {
    const c = o.click;
    if (c != null && c > 0 && c < 1) {
      ctx.beginPath(); ctx.arc(x, y, 8 + 26 * c, 0, 7); ctx.strokeStyle = `rgba(233,227,214,${0.8 * (1 - c)})`; ctx.lineWidth = 3; ctx.stroke();
    }
    const PTS = [[0, 0], [0, 17], [4.5, 13], [7.5, 20], [10, 19], [7, 12.5], [12.5, 12.5]];
    ctx.save(); ctx.translate(x, y); ctx.scale(1.5, 1.5);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
    ctx.beginPath(); PTS.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  }

  // Pointer path through keys [[t, x, y], ...], eased between them (repeat a key to hold still).
  function path(keys, t) {
    if (t <= keys[0][0]) return keys[0].slice(1);
    for (let i = 1; i < keys.length; i++) {
      const [t0, x0, y0] = keys[i - 1], [t1, x1, y1] = keys[i];
      if (t < t1) { const p = P.ease.inOut(clamp((t - t0) / Math.max(t1 - t0, 1e-6))); return [x0 + (x1 - x0) * p, y0 + (y1 - y0) * p]; }
    }
    return keys[keys.length - 1].slice(1);
  }

  // Tutorial zoom about an anchor point: the anchor stays put, everything else grows round it, text stays sharp.
  // ctx.save(); z.apply(ctx); ...draw...; ctx.restore(); then z.rect(r) maps a rect you got back to where it landed.
  const zoom = (z, ax, ay) => ({ z, ax, ay, map: (x, y) => [ax + (x - ax) * z, ay + (y - ay) * z],
    rect: (r) => r && { x: ax + (r.x - ax) * z, y: ay + (r.y - ay) * z, w: r.w * z, h: r.h * z },
    apply: (ctx) => ctx.transform(z, 0, 0, z, ax - ax * z, ay - ay * z) });

  // Real footage (anim.py real <slug> clip): call at the top of scene.js so renders wait for every frame.
  // Returns { at(s) -> the frame s seconds in, dur }.
  function clip(name) {
    const c = window.REAL && REAL.clips && REAL.clips[name];
    if (!c) { console.error(`[desk] no clip "${name}". Run: python anim.py real <slug> clip <video> --as ${name} --start .. --end ..`); return { at: () => ({}), dur: 0 }; }
    const frames = Array.from({ length: c.n }, (_, i) => Eduba.image(`assets/${name}/f${String(i + 1).padStart(3, '0')}.jpg`));
    return { dur: c.n / c.fps, at: (s) => frames[Math.max(0, Math.min(c.n - 1, Math.floor(s * c.fps)))] };
  }

  // ── style wipes: one scene, several looks, a flowing line between them ──
  // A seam at x (real px): a wave down the frame that flows as it moves. Returns { left, right } (CSS clip-paths for
  // g.clip, the layers on each side), path(ctx, side) (the same shape as a canvas clip, for two looks on one canvas) and
  // draw(ctx, color, { to, t, dir }) (the line itself: a gradient from color to `to`, a soft glow, and sparks trailing
  // in its wake at time t). o: amp (px), waves (down the height), phase (the flow; pass time), tilt (px of lean), w, h.
  const shash = (i, s) => { let h = Math.imul(i ^ Math.imul(s, 0x27d4eb2d), 0x165667b1); h ^= h >>> 15; h = Math.imul(h, 0x85ebca77); return ((h ^ (h >>> 13)) >>> 0) / 4294967296; };
  function seam(x, o = {}) {
    const W = o.w ?? 1920, H = o.h ?? 1080, amp = o.amp ?? 38, n = 96, k = ((o.waves ?? 1.3) * Math.PI * 2) / H, ph = o.phase ?? 0, tilt = o.tilt ?? 0;
    const X = (y) => x + Math.sin(y * k + ph) * amp + Math.sin(y * k * 2.3 - ph * 1.7) * amp * 0.25 + (0.5 - y / H) * tilt;
    const pts = Array.from({ length: n + 1 }, (_, i) => { const y = (i / n) * H; return [X(y), y]; });
    const css = (ps) => 'polygon(' + ps.map(([a, b]) => `${a.toFixed(1)}px ${b.toFixed(1)}px`).join(', ') + ')';
    const leftPts = [[-40, -40], [pts[0][0], -40], ...pts, [pts[n][0], H + 40], [-40, H + 40]];
    const rightPts = [[W + 40, -40], [W + 40, H + 40], [pts[n][0], H + 40], ...pts.slice().reverse(), [pts[0][0], -40]];
    const trace = (ctx, ps) => { ctx.beginPath(); ps.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); };
    const smooth = (ctx) => {
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < n; i++) ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
      ctx.lineTo(pts[n][0], pts[n][1]);
    };
    return {
      left: css(leftPts), right: css(rightPts), x: X,
      path: (ctx, side = 'left') => trace(ctx, side === 'left' ? leftPts : rightPts),
      draw: (ctx, color = '#FFFFFF', d = {}) => {
        const c2 = d.to || color, t = d.t ?? 0, dir = d.dir ?? -1, gr = ctx.createLinearGradient(0, 0, 0, H);
        gr.addColorStop(0, color); gr.addColorStop(1, c2);
        ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = gr;
        smooth(ctx);
        ctx.shadowColor = color; ctx.shadowBlur = 44; ctx.globalAlpha = 0.22; ctx.lineWidth = 30; ctx.stroke();
        ctx.shadowBlur = 18; ctx.globalAlpha = 0.55; ctx.lineWidth = 10; ctx.stroke();
        ctx.shadowBlur = 8; ctx.globalAlpha = 1; ctx.lineWidth = 3; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
        for (let s = 0; s < 40; s++) {  // sparks thrown off the line, drifting into its wake
          const y = shash(s, 5) * H, life = (t * (0.7 + shash(s, 9) * 0.8) + shash(s, 3)) % 1, fade = Math.pow(1 - life, 1.6);
          const sx = X(y) + dir * life * (30 + shash(s, 7) * 110), sy = y + (shash(s, 13) - 0.5) * life * 60;
          ctx.globalAlpha = 0.85 * fade; ctx.shadowColor = y < H / 2 ? color : c2; ctx.shadowBlur = 12; ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(sx, sy, 1 + shash(s, 11) * 2.4 * (1 - life * 0.5), 0, 7); ctx.fill();
        }
        ctx.restore();
      },
    };
  }
  // A full-resolution canvas on top of every layer (for seams). Call once in scene.js after E.frame / Line.frame;
  // clear it and draw on it in a P.onFrame registered after them.
  function layer() {
    const stage = document.getElementById('stage'), cv = document.createElement('canvas');
    cv.width = +stage.dataset.width || 1920; cv.height = +stage.dataset.height || 1080;
    Object.assign(cv.style, { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' });
    stage.appendChild(cv);
    return cv.getContext('2d');
  }

  return { K, MONO, UI, wallpaper, win, rows, rowPoint, tree, editor, view, ends, terminal, browser, bar, pointer, path, zoom, clip, seam, layer };
})();
