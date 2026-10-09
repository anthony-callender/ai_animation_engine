// scene.js: meeting-note-explainer, 16:9 (world 320x180, text layer 640x360).
// An authored illustration of a fictional note (01_voice/source.md). There are no captures, apps or real people.
// LAYOUT lives in this file (NOTE, CARD, FREE below). TIMING lives in 03_cues/cues.md, which compiles to cues.js.
// The only values on screen are "Sam will send the draft on Friday." / Send the draft / Sam / Friday.
const E = Eduba, C = E.C, { prog, live, past, ease } = P;
const S = (id) => P.cue(id).start;
const H2 = (v) => Math.round(v * 2);
const lerp = (a, b, p) => a + (b - a) * p;

// ── layout (world px) ──────────────────────────────────────────────────────
// FREE areas stay empty: a character can stand on the left, and captions sit in the bottom band
// (E.caption at y 157-172 or E.subtitles at y 150-169).
const FREE = { character: { x: 0, y: 24, w: 52, h: 120 }, captions: { x: 0, y: 146, w: 320, h: 34 } };
const NOTE = { x: 56, y: 26, w: 120, h: 92, introX: 100 };   // the note starts centred, then moves left
const CARD = { x: 194, y: 26, w: 116, h: 92 };
const PLATE = { x: 183, y: 123, w: 254 };                    // the "Nothing added" line, above the caption band
const TEXT = { font: 'Pixelify Sans', size: 24 };            // note and card values share one size

const SOURCE = 'Sam will send the draft on Friday.';
const WORDS = SOURCE.split(' ');
// src = indices into WORDS; lane = x (world) of the connector between the panels
const FIELDS = [
  { id: 'action', label: 'ACTION', value: 'Send the draft', src: [2, 3, 4], lane: 181 },
  { id: 'owner', label: 'OWNER', value: 'Sam', src: [0], lane: 185 },
  { id: 'due', label: 'DUE', value: 'Friday', src: [6], lane: 189 },
];

function tabPanel(g, x, y, w, h, theme, tab) {
  const m = g.hud.measure(tab, g.type.label);
  E.panel(g, x, y, w, h, { theme, tab, tabW: m.w + 14 });
}

// Word boxes for the note (HUD px), wrapped to the panel.
function noteWords(g, nx, ny) {
  const X0 = H2(nx) + 10, Y0 = H2(ny) + 14 + 14, maxW = H2(NOTE.w) - 20;
  const sp = g.hud.measure('a a', TEXT).adv - g.hud.measure('aa', TEXT).adv;
  const M = g.hud.measure('Hdgjy', TEXT), lh = Math.round(TEXT.size * 1.35);
  let x = 0, line = 0;
  return WORDS.map((w) => {
    const ww = g.hud.measure(w, TEXT).adv;
    if (x > 0 && x + ww > maxW) { x = 0; line++; }
    const box = { text: w, x: X0 + x, y: Y0 + line * lh, w: g.hud.measure(w.replace(/[.]$/, ''), TEXT).adv, top: M.top, h: M.bottom - M.top + 1, line };
    x += ww + sp;
    return box;
  });
}

// marks: { wordIndex: { color, under } }, under = underline progress 0..1 instead of a filled marker
function drawNote(g, nx, ny, typed, marks) {
  tabPanel(g, nx, ny, NOTE.w, NOTE.h, 'paper', 'FICTIONAL NOTE');
  const ws = noteWords(g, nx, ny), hud = g.hud;
  for (const [i, m] of Object.entries(marks)) {
    const b = ws[i];
    if (m.under != null) hud.rect(b.x, b.y + b.h + 3, Math.round((b.w + 2) * m.under), 4, m.color);
    else hud.rect(b.x - 3, b.y - 4, b.w + 6, b.h + 8, m.color);
  }
  let n = Math.floor(typed * SOURCE.length);
  for (const b of ws) {
    if (n <= 0) break;
    hud.text(b.text, b.x, b.y - b.top, C.deep, TEXT, { chars: Math.min(b.text.length, n) });
    n -= b.text.length + 1;
  }
  if (typed < 1 && Math.floor(g.t * 3) % 2 === 0) {  // caret while the line is still to come
    const done = ws.filter((b, k) => WORDS.slice(0, k + 1).join(' ').length <= typed * SOURCE.length);
    const last = done[done.length - 1], cx = last ? last.x + last.w + 6 : ws[0].x, cy = last ? last.y : ws[0].y;
    hud.rect(cx, cy, 3, ws[0].h, C.mid);
  }
  return ws;
}

// rows: [{ active, value: 0..1 (shown when 1), check, fill (color|null), border (color|null) }]
function drawCard(g, cx, cy, rows) {
  tabPanel(g, cx, cy, CARD.w, CARD.h, 'skin', 'ACTION CARD');
  const hud = g.hud, X = H2(cx) + 8, W = H2(CARD.w) - 16, lm = hud.measure('ACTION', g.type.label), vm = hud.measure('Hdgjy', TEXT);
  return FIELDS.map((f, i) => {
    const r = rows[i], top = H2(cy) + 14 + 8 + i * 52;
    if (r.fill != null) hud.rect(X, top, W, 48, r.fill);
    if (r.border != null) { hud.rectb(X, top, W, 48, r.border); hud.rectb(X + 1, top + 1, W - 2, 46, r.border); hud.rectb(X + 2, top + 2, W - 4, 44, r.border); }
    hud.text(f.label, X + 8, top + 7 - lm.top, r.active ? C.clayDark : C.mid, g.type.label);
    if (r.value >= 1) hud.text(f.value, X + 8, top + 20 - vm.top, C.deep, TEXT);
    else for (let d = X + 8; d < X + W - 30; d += 10) hud.rect(d, top + 40, 5, 2, C.light);  // empty field
    if (r.check) { hud.line(X + W - 26, top + 26, X + W - 19, top + 33, r.fill != null ? C.deep : C.sage, 3); hud.line(X + W - 19, top + 33, X + W - 8, top + 18, r.fill != null ? C.deep : C.sage, 3); }
    return { x: X, y: top, w: W, h: 48, mid: top + 24 };
  });
}

// A connector from a card row to the note's edge at the word's line, with an arrowhead on the note.
function connector(g, row, word, lane, nx, color) {
  const hud = g.hud, L = H2(lane), edge = H2(nx + NOTE.w) + 6, wy = word.y + Math.round(word.h / 2);
  hud.line(row.x - 8, row.mid, L, row.mid, color, 3);
  hud.line(L, row.mid, L, wy, color, 3);
  hud.line(L, wy, edge + 4, wy, color, 3);
  hud.poly([[edge, wy], [edge + 7, wy - 5], [edge + 7, wy + 5]], color);
}

function chips(g, section) {
  E.label(g, section, 10, 8, { dot: true });
  const tag = 'FICTIONAL / AUTHORED ILLUSTRATION', m = g.hud.measure(tag, g.type.label);
  E.label(g, tag, 310 - (m.w + 8) / 2, 8);
}

E.frame({ draw(g, t) {
  E.room(g, 'dots');
  const inCheck = t >= S('check'), hasCard = t >= S('card');
  chips(g, inCheck ? '03 / CHECK AGAINST THE SOURCE' : hasCard ? '02 / MAKE THE CARD' : '01 / THE NOTE');

  const nx = lerp(NOTE.introX, NOTE.x, prog('card', { dur: 0.6, ease: ease.inOut }));
  const ny = NOTE.y + Math.round((1 - prog('note', { dur: 0.5 })) * 10);
  const typed = t < S('note.read') ? 0 : prog('note.read', { dur: 1.9, ease: ease.linear });
  const cx = lerp(330, CARD.x, prog('card', { dur: 0.6, delay: 0.15 }));

  const marks = {}, rows = [], links = [], ghosts = [];
  FIELDS.forEach((f) => {
    const filled = past(`${f.id}.fill`), landed = prog(`${f.id}.fill`, { dur: 0.45 }) >= 1;
    const row = { active: false, value: filled && landed ? 1 : 0, check: filled && landed, fill: null, border: null };
    if (!inCheck) {
      row.active = live(f.id);
      if (row.active) row.border = C.amber;
      if (live(`${f.id}.find`)) f.src.forEach((k) => (marks[k] = { color: C.amber, under: prog(`${f.id}.find`, { dur: 0.5 }) }));
      if (row.active && filled) f.src.forEach((k) => (marks[k] = { color: C.amber }));
      if (filled && !landed) ghosts.push({ f, p: prog(`${f.id}.fill`, { dur: 0.45, ease: ease.inOut }) });
    } else if (past(`check.${f.id}`)) {
      const hot = live(`check.${f.id}`) || live('check.source');
      const color = hot ? C.amber : C.glow;
      row.fill = color; row.border = hot ? C.clayDark : null;
      f.src.forEach((k) => (marks[k] = { color }));
      links.push({ f, color });
    }
    rows.push(row);
  });

  const ws = drawNote(g, nx, ny, typed, marks);
  if (!hasCard) return;
  const rr = drawCard(g, cx, CARD.y, rows);
  links.forEach(({ f, color }) => connector(g, rr[FIELDS.indexOf(f)], ws[f.src[0]], f.lane, nx, color));

  // the named words lift off the note and land in their row
  ghosts.forEach(({ f, p }) => {
    const a = ws[f.src[0]], b = rr[FIELDS.indexOf(f)], m = g.hud.measure(f.value, TEXT);
    const x = Math.round(lerp(a.x, b.x + 8, p)), y = Math.round(lerp(a.y, b.y + 20, p) - Math.sin(p * Math.PI) * 16);
    g.hud.rect(x - 4, y - 5, m.w + 8, a.h + 10, C.amber);
    g.hud.text(f.value, x, y - a.top, C.deep, TEXT);
  });

  if (past('check.nothing')) {
    const head = '*Nothing added.*', tail = ' No calendar date. No extra work.';
    if (past('check.end')) {
      const k = (head.length - 2) / (head.length - 2 + tail.length);
      E.plate(g, head + tail, PLATE.x, PLATE.y, { align: 'center', w: PLATE.w, role: 'body', progress: lerp(k, 1, prog('check.end', { dur: 1.2, ease: ease.linear })) });
    } else E.plate(g, head, PLATE.x, PLATE.y, { align: 'center', w: PLATE.w, role: 'body', progress: prog('check.nothing', { dur: 0.4, ease: ease.linear }) });
  }
} });
