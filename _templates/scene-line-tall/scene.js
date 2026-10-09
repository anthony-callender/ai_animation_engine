// scene.js - TEMPLATE, 9:16 Short, Line kit (_shared/shorts.md, _shared/line.md). Everything inside g.safe
// (x 12..156, y 26..258): the app UI covers the rest. Frame 0 is already the content; the last frame is frame 0
// again, so the loop has no seam. Subtitles own the accent.
// Build it cue by cue (stages/04_scene/CONTEXT.md), then delete the word TEMPLATE.
const L = Line, { prog, live, past, pick, at, ease, since } = P;
const S = (id) => P.cue(id).start;
const drawn = (id, dur = 0.8, delay = 0) => prog(id, { dur, delay, ease: ease.inOut });
const typed = (id, dur, delay = 0) => prog(id, { dur, delay, ease: ease.linear });
const FEET = 196, MID = 90;

// The opening claim, drawn complete at t = 0: its key object big and centre, a person reacting beside it.
function hook(g, t) {
  L.person(g, 'curly', { x: 50, y: FEET, s: 1.1, pose: 'point', reach: { r: [MID + 30, 130] } });
}

function loop(g, t) {
  hook(g, t);  // = frame 0
}

const SECTIONS = [['hook', hook], ['loop', loop]];

L.frame({ draw(g, t) {
  L.room(g);
  L.camera(g, L.punch(g, [0, S('loop')]), MID, 150);  // camera before drawing
  L.hud(g, { left: '// SHORT', right: 'terminal_audio', clock: false });
  let fn = SECTIONS[0][1];
  for (const [id, f] of SECTIONS) if (t >= S(id)) fn = f;
  fn(g, t);
  L.subtitles(g);
} });
