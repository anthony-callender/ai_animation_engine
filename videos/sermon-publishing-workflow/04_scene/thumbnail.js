// thumbnail.js: Upwork portfolio cover. `python anim.py thumbnail <slug>` shoots it into 05_render/thumbnail-1.png (1280x720).
// Upwork shows covers at 4:3, so everything sits inside the centre 240x180 of the 320x180 world (SAFE below);
// the 4:3 file is the centre 960x720 crop scaled x1.5 to 1440x1080 (whole pixels, so it stays crisp).
// Same brand and engineer as the video (scene.js). The art is an illustration, not a screenshot.
const E = Eduba;
const NAVY = '#17263F', NAVY_DOT = '#22365A', NAVY_DEEP = '#0F1A2C', NAVY_CARD = '#203556';
const TEAL = '#2B8980', TEAL_LIGHT = '#5FB8AE', GOLD = '#D9B877', CREAM = '#F3EBD9', MUTED = '#8C9AB3', INK = '#0B1220';
const SAFE = { x: 40, y: 0, w: 240, h: 180 };
const SKIN = '#A06A48', SKIN_SHADE = '#7A4E33', CAMEL = '#D6BC8E', CAMEL_SHADE = '#B39668';
const ENGINEER_SPRITE = (() => {  // copied from scene.js: medium-brown skin, afro, sand sweater, navy trousers
  const spr = E.person({ hair: 'bald', hairColor: '#1E1410', hairShade: '#3A2620', parts: ['brows'], top: CAMEL, topShade: CAMEL_SHADE,
    bottomColor: '#2A3B5C', bottomShade: INK, arms: { upper: CAMEL } });
  const ADD = ['....kkkkkkkk....', '..kkHHhHHhHHkk..', '.kHHhHHHHHhHHHk.'];
  const CROWN = ['kHHHHHhHHHHhHHHk', 'kHhHHHHHHhHHHHhk', 'kHHHhHHHHHHhHHHk'];
  for (const rows of Object.values(spr.frames)) {
    CROWN.forEach((r, i) => { rows[i] = r.split(''); });
    for (const [i, l, r] of [[3, 'kHh', 'hHk'], [4, '.kH', 'Hk.'], [5, '..k', 'k..']]) {
      [...l].forEach((ch, c) => { if (ch !== '.') rows[i][c] = ch; });
      [...r].forEach((ch, c) => { if (ch !== '.') rows[i][13 + c] = ch; });
    }
    rows.unshift(...ADD.map((r) => r.split('')));
  }
  spr.h += ADD.length;
  for (const a of Object.values(spr.anchors)) a[1] += ADD.length;
  spr.rig.shoulders = spr.rig.shoulders.map(([x, y]) => [x, y + ADD.length]);
  Object.assign(spr.pal, { S: SKIN, s: SKIN_SHADE });
  spr.rig.hand = SKIN;
  return spr;
})();
const HOOK = { font: 'Pixelify Sans', size: 46 };

function cover(g, o) {  // o: { hook, sub, icon(g, cx, cy) }
  const px = g.px;
  px.clear(NAVY);
  for (let y = 6; y < g.H; y += 12) for (let x = 6; x < g.W; x += 12) px.rect(x, y, 2, 1, NAVY_DOT);
  px.rect(SAFE.x, 168, SAFE.w, 3, TEAL);                                   // teal accent bar
  E.label(g, 'TONY CALLENDER', SAFE.x + 6, 10, { bg: NAVY_DEEP, fg: CREAM });
  // the engineer at his desk, bottom-left of the safe area
  E.actor(g, ENGINEER_SPRITE, { x: SAFE.x + 30, y: 160, scale: 3, pose: 'present', face: 'happy', talk: false });
  px.rect(SAFE.x + 4, 142, 58, 5, '#5B4636'); px.line(SAFE.x + 4, 142, SAFE.x + 61, 142, '#7A604B');
  px.rect(SAFE.x + 8, 147, 4, 18, '#3E2F25'); px.rect(SAFE.x + 54, 147, 4, 18, '#3E2F25');
  px.rect(SAFE.x + 40, 126, 22, 15, INK); px.rect(SAFE.x + 41, 127, 20, 13, TEAL);
  // hook: 4-5 huge words, one in gold
  E.plate(g, o.hook, SAFE.x + (o.cx ?? 152), o.y ?? 22, { align: 'center', w: o.w ?? 168, role: o.role ?? HOOK, bg: -1, fg: CREAM, hl: GOLD, pad: 0 });
  o.icon(g, SAFE.x + 152, 128);
  E.plate(g, o.sub, SAFE.x + 152, 150, { align: 'center', role: 'label', bg: NAVY_DEEP, fg: GOLD, pad: 4 });
}

// Video 1: a microphone (the recorded service) becomes a page (the sermon draft).
function micToPage(g, cx, cy) {
  const px = g.px, mx = cx - 30, pxx = cx + 30;
  px.rect(mx - 5, cy - 14, 10, 16, CREAM); px.circ(mx, cy - 14, 5, CREAM); px.circ(mx, cy + 2, 5, CREAM);
  for (let k = 0; k < 3; k++) px.rect(mx - 3, cy - 12 + k * 4, 6, 1, MUTED);
  px.line(mx - 8, cy + 2, mx - 8, cy + 6, CREAM, 2); px.line(mx + 8, cy + 2, mx + 8, cy + 6, CREAM, 2); px.line(mx - 8, cy + 7, mx + 8, cy + 7, CREAM, 2);
  px.rect(mx - 1, cy + 8, 2, 5, CREAM); px.rect(mx - 6, cy + 13, 12, 2, CREAM);
  E.arrow(g, mx + 12, cy, pxx - 14, cy, { color: TEAL_LIGHT, w: 3, head: 6 });
  px.rect(pxx - 10, cy - 14, 20, 27, CREAM); px.poly([[pxx + 4, cy - 14], [pxx + 10, cy - 14], [pxx + 10, cy - 8]], NAVY);
  for (let k = 0; k < 5; k++) px.rect(pxx - 6, cy - 8 + k * 4, k === 4 ? 8 : 12, 1, MUTED);
}
E.frame({ step: 0, draw: (g) => cover(g, { hook: 'SERMONS WITHOUT *REPETITIVE* WORK', role: { font: 'Pixelify Sans', size: 38 }, w: 182, cx: 150, y: 30, sub: 'PYTHON + WORDPRESS AUTOMATION', icon: micToPage }) });
window.THUMBS = ['1'];
