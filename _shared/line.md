# Line kit: building a scene

The second look: white hand-drawn line art on black, one orange accent, mono type, a green terminal header. Engine: `_runtime/line.js` (on `player.js`, no pixels). See every piece: `_shared/gallery/line-*.png`; the calls that drew them: `_runtime/line-gallery.js`. The bundled silent project shows basic timing; use the runtime gallery for this API.

Start a video in it: `python anim.py new <slug> --style line` (`--format tall` for a Short). Cues, stills, render and thumbnail work the same.

## Frame
```js
const L = Line;
L.frame({ draw(g, t) {
  L.room(g);
  L.hud(g, { left: '// 01 FILES', right: 'terminal_audio' });
  L.coder(g, 150, 126, { s: 1.3, sip: P.prog('intro', { dur: 1.5 }), progress: P.prog('intro', { dur: 2 }) });
  L.caption(g, 'all *you.*', { role: 'big', progress: P.prog('intro.you', { dur: 0.6, ease: P.ease.linear }) });
} });
```
- World units as Eduba: 320x180 wide, 180x320 tall, `g.safe` the same. One full-resolution canvas; everything is vector.
- Every stroke wobbles, tapers, and boils (redraws slightly differently 4 times a second). `L.frame({ boil: 0 })` holds it still; thumbnails do.
- **Drawing on is the motion.** Every piece takes `progress` 0..1 and pens itself on in stroke order. Enter by drawing on; leave by cutting to the next section. Text types on, with a block cursor while typing.
- Draw order is depth: later pieces knock out the lines behind them.
- **The art talks.** Lines follow the voice: louder and faster than usual means more wobble, a quicker boil and faster backgrounds and wheels (`g.energy` 0..1, `g.flow` the clock that speeds up; `L.frame({ talk: 0.5 })` tones it down, `0` turns it off). A pencil sits on the end of whatever is drawing itself on right now (`L.frame({ pencil: false })` hides it, a pen's `nib: false` skips one).
- Wipes into or out of another look: set `g.clip` (a CSS clip-path) each frame (`_shared/desk.md`, Style wipes).
- Camera: `look(g, cx, cy, z)` right after `room` puts a world point in the middle (pans, pull-backs, rides); backgrounds fill what it shows; `hud`, `caption` and `subtitles` stay on the screen; `screen(g, () => ...)` for any other overlay.

## Pieces
| Kind | Calls |
|---|---|
| Backgrounds | `bg(g, 'topo' / 'flow' / 'hills' / 'stars' / 'town', o)`, faint and always moving, drawn first: contour map (`lit`: one contour orange), ink currents, hills with trees and a road (`scroll`, `ground`; returns `{ ground }`), stars, a skyline (`lit`: the one window; returns `{ windows }`). `progress` grows one in from the middle. |
| Morphs | `const A = L.capture(g, () => ...)`, `B = L.capture(g, () => ...)`, then `L.morph(g, A, B, p)`: A's lines travel into B's. |
| Frame | `room(g, 'night' / 'grid' / 'paper' / 'desk' / 'floor')` returns `{ floor }` · `hud(g, { left, right, clock })` the terminal header (`clock: '03:10:28'` counts up, `'1973'` is shown as is, `false` hides it) · `camera(g, z, x, y)` right after `room` · `punch` · `pop` |
| Text | `text(g, s, x, y, { role, c, align, w, progress, cursor, raw })` · `plate` (knocked-out box; `box: true`, `brackets: true`) · `caption(g, s, { role: 'big' })` · `typeAt` · `label` (green system voice) · `subtitles(g)` (Shorts) · `measure(g, s, role)` |
| Marks | `arrow(g, x0, y0, x1, y1, { bend })` · `ring(g, x, y, w, h)` loops round a thing · `underline` · `mark(g, x, y, 'check' / 'cross')` · `scribble` (crossed out) · `bubble(g, s, x, y, { to })` · `thought` |
| Diagrams | `box(g, s, x, y, { w, h, lit, fill })` · `flow(g, x, y, steps, { active })` · `stack` · `graph(g, nodes, edges, { active })` · `chart(g, x, y, w, h, values, { lit, labels })` · `trend` · `tokens` |
| Screens | `terminal(g, x, y, w, h, ['$ ls', 'out'], { title, role })` · `code(g, x, y, w, lines, { highlight })` · `tree(g, x, y, lines, { highlight })` · `file` · `folder({ open, lit })` · `browser` · `screenshot(g, L.image('assets/x.png'), x, y, w, h, { url, scroll, crop })` |
| Props | `laptop({ screen: 'code' })` · `mug({ steam })` · `lamp({ on })` · `plant` · `books` · `bulb({ on })` · `clock` · `hourglass({ p })` · `envelope` · `phone` · `monitor` (returns its screen rect) · `crt` · `keyboard` · `server({ active })` · `db` · `gear` · `cloud` · `magnifier` · `lock` · `calendar({ text })` · `cursor({ click })` · `chair`. All take `{ s, flip, progress }`. |
| People | `person(g, 'curly' / 'bun' / 'beard' / 'long' / 'bald', { x, y, s, pose, face, reach: { r: [x, y] }, look, walk, hold: 'mug' })`, about 64 tall at `s: 1`; poses as Eduba plus `sip`; mouths follow the voice. New looks: `person(g, { hair, glasses, beard, top: 'hoodie' / 'sweater' / 'shirt', tie })`. |
| Hero | `coder(g, x, y, { s, sip, typing, screen })`: at a laptop in profile, mug in hand. |
| Bikes and minds | `bicycle(g, x, y, { s, rider: 'curly', lit: 'frame' / 'wheels' / 'bars', fall: 0..1, spin })`, origin on the ground; returns `{ seat, bars, hip, head, front, rear }` · `head(g, x, y, { s, brain: true, lit, hair: 'curly' })` in profile · `brain(g, x, y, { s, lit })`. The bundled silent project shows basic timing; use the runtime gallery for this API.
| Story | `ask(g, 'jackson', q, x, y, { w })` types `> jackson: q` (an interviewer's question) · `tag(g, s, x, y, { to })` · `stamp` · `promptbox` · `pebble` · `house({ lit })` · `shop` · `mountains` · `tower` · `coin` · `chalkboard` (returns the writing area) · `globe({ route })` · `college({ kind: 'temple' / 'arch' })` · `cheque` · `door({ open, lit })` · `jar({ fill })` · `bill({ paid })` · `heart` · `signpost({ arrows })` · `wave` · `sun` · `storm` · `ledger` · `invoice` · `robot` · `playcard` · `bookshelf` · `openbook` (returns the page rects) · `building` · `stairs` · `jet` · `wrench` · `diploma` · `funnel` · `mainframe` · `oldmouse` · `stage` · `hand` · `footprints(g, pts)` · `fear` (a scribble that grows) · `ladder` · `table` · `conveyor` · `bin` · `face({ mood })` · `spark` · `mini(g, x, y, { walk, look })` a small figure for crowds and queues. Sheets: `line-story*.png`. The bundled silent project shows basic timing; use the runtime gallery for this API.
| Your own | `L.pen(g, { x, y, s, progress }, 'name')` then `.line .curve .rect .ellipse .arc .poly .fill .knock .hatch .dot` and `.draw()`: any new piece, same hand. |

## Drawn art: trace it
For a hero picture beyond the kit, draw it (or get one drawn) as light lines on a plain dark background, or dark on light, then:
`python anim.py trace <image> <name> --slug <slug> [--crop x0,y0,x1,y1]`
It writes `04_scene/assets/<name>.js` and `<name>.trace.png`: look at the preview first (the first strokes drawn are brightest). Then `const ART = L.art('assets/<name>.js')` at the top of `scene.js` and `L.drawing(g, ART, x, y, w, { progress })`. Saturated colour in the drawing becomes the accent. Without `--slug` it goes to `_shared/line-art/` for every video. Only trace art we own or have rights to.

## Rules
- One orange accent per frame; green only in the header and labels. Colours come from the theme (`ink dim faint accent sys warn`), nothing else.
- Lowercase human text, mono throughout; UPPERCASE only in the header.
- One idea per frame, lots of black. A frame is a drawing plus at most one line of text.
- Calm motion: draw on, type on, steam, blinks, the boil. No fades, shakes or spins.
- No emoji, no em dashes.
