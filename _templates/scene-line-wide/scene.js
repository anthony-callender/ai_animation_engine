// scene.js - TEMPLATE, 16:9, Line kit (_shared/line.md). One function per section; sub-cues inside.
// Build it cue by cue (stages/04_scene/CONTEXT.md), then delete the word TEMPLATE so `status` counts it.
const L = Line, { prog, live, past, pick, at, ease } = P;
const S = (id) => P.cue(id).start;
const drawn = (id, dur = 1.2, delay = 0) => prog(id, { dur, delay, ease: ease.inOut });  // a drawing pens itself on
const typed = (id, dur, delay = 0) => prog(id, { dur, delay, ease: ease.linear });       // text types on
// Traced drawings (python anim.py trace <image> <name> --slug <slug>), loaded here so renders wait for them:
// const ART = { desk: L.art('assets/desk.js') };

function intro(g, t) {
  L.hud(g, { left: '// 01 TITLE', right: 'terminal_audio' });
  L.coder(g, 150, 126, { s: 1.3, sip: prog('intro', { dur: 1.5, ease: ease.inOut }), progress: drawn('intro', 2) });
  L.caption(g, 'replace with the *first idea*', { progress: typed('intro', 1, 1.5) });
  // A plate that waits for its word: L.typeAt(g, at('word', 'intro'), 0.6, 'text', 160, 40);
  // A parent cue stays live through its sub-cues: end a parent-only visual with t < S('intro.next').
}

const SECTIONS = [['intro', intro]];  // [first cue id, draw function], in spoken order

L.frame({ draw(g, t) {
  L.room(g);  // 'grid' for diagrams, 'paper' for ink on cream
  let fn = SECTIONS[0][1];
  for (const [id, f] of SECTIONS) if (t >= S(id)) fn = f;
  fn(g, t);
} });
