// scene.js - TEMPLATE, 9:16 Short (_shared/shorts.md). Everything inside g.safe (x 12..156, y 26..258): the app UI covers the rest.
// Frame 0 is already the content (no greeting): the first claim's picture on screen at t = 0. The last frame is frame 0
// again, so the loop has no seam. Subtitles own the amber.
// Build it cue by cue (stages/04_scene/CONTEXT.md), then delete the word TEMPLATE.
const E = Eduba, C = E.C, { prog, live, past, pick, at, ease, since } = P;
const S = (id) => P.cue(id).start;
const typed = (id, dur, delay = 0) => prog(id, { dur, delay, ease: ease.linear });
const FEET = 196, MID = 90, TOP = 68;  // TOP: first free row under the takeaway strip

// The opening claim, drawn complete at t = 0: its key object big and centre, Doug reacting beside it.
function hook(g, t) {
  E.actor(g, 'doug', { x: 44, y: FEET, scale: 2, pose: 'point', reach: { r: [MID + 20, 130] } });
}

function loop(g, t) {
  hook(g, t);  // = frame 0
}

const SECTIONS = [['hook', hook], ['loop', loop]];

E.frame({ draw(g, t) {
  E.room(g, 'dots');
  E.drift(g, 'mail', { n: 6, y0: 66, y1: 190, speed: 16 });
  let fn = SECTIONS[0][1];
  for (const [id, f] of SECTIONS) if (t >= S(id)) fn = f;
  fn(g, t);
  // E.takeaways(g, [['FACT ONE', S('teach.one')], ...], { y: 28 });  // until the loop
  E.camera(g, E.punch(g, [0, S('loop')]), MID, 150);
  E.subtitles(g);
} });
