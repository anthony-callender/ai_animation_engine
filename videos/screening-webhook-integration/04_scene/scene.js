// scene.js - TEMPLATE, 16:9. One function per section, sub-cues inside.
// Two kinds of section. Anything the words name that exists (a file, a command, a page, an app) is shown for real:
// capture it (`anim.py real`, `anim.py grab`), draw it with Desk under the cast, and Doug hosts from the band
// (_shared/desk.md). Pixel rooms carry the ideas, and the metaphor when there is one (_shared/kit.md).
// Build it cue by cue (stages/04_scene/CONTEXT.md), then delete the word TEMPLATE so `status` counts it.
const E = Eduba, C = E.C, D = Desk, { prog, live, past, pick, at, ease } = P;
const S = (id) => P.cue(id).start;
const typed = (id, dur, delay = 0) => prog(id, { dur, delay, ease: ease.linear });
const section = (g, s) => E.label(g, s, 10, 8, { dot: true });
// Real content, loaded here so renders wait for it:
// const R = window.REAL;                             // python anim.py real <slug> file|tree|run|clip ...
// const SHOT = { home: E.image('assets/home.png') }; // python anim.py grab <slug> <url> home

function intro(g, t) {  // a pixel room: the idea
  const { floor } = E.room(g, 'library');           // 'dots' for diagrams and text-heavy beats
  section(g, 'SECTION 01 / TITLE');
  E.actor(g, 'doug', { x: 40, y: floor, scale: 2, pose: pick({ intro: 'wave' }, 'idle') });
  E.plate(g, 'Replace this with the *first idea*', 200, 40, { align: 'center', role: 'head', w: 200, progress: typed('intro', 1) });
  // A parent cue stays live through its sub-cues: end a parent-only visual with t < S('intro.next').
}

function screen(g, t) {  // a real screen: the how. Real px on g.photo.ctx; smooth time P.t for the screen, t for the pixels.
  const ctx = g.photo.ctx, T = P.t;
  D.wallpaper(ctx);
  const c = D.win(ctx, 36, 30, 1848, 1020, { title: 'workspace' });
  const ed = D.editor(ctx, c.x, c.y, c.w, c.h, { tabs: [{ name: 'CLAUDE.md' }], lines: ['# Replace with R.files[...]'] });
  g.under = true;                                   // the screen goes under the art
  E.spot(g, ed.line(0), S('screen'), { chip: 'WHAT HE NAMES' });  // amber box on what the words name
  E.host(g, 'doug', { pose: 'point' });             // Doug and the spoken words, in the bottom band
}

const SECTIONS = [['intro', intro]];  // [first cue id, draw function], in spoken order, e.g. ['screen', screen]

E.frame({ overlay: true, draw(g, t) {
  let fn = SECTIONS[0][1];
  for (const [id, f] of SECTIONS) if (t >= S(id)) fn = f;
  fn(g, t);
} });
