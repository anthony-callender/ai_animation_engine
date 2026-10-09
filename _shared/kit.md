# Kit: building a scene

Engine: `_runtime/eduba.js` (on `pixel.js` + `player.js`). See every piece: `_shared/gallery/*.png`; the calls that drew them: `_runtime/gallery.js`.

## Frame
```js
const E = Eduba, C = E.C;
E.frame({ draw(g, t) {
  const { floor } = E.room(g, 'library');
  const doug = E.actor(g, 'doug', { x: 60, y: floor, scale: 2, pose: P.live('intro') ? 'wave' : 'idle' });
  E.say(g, 'Doug', 'Every folder says what it is for.', 120, 30, 180, { to: doug.head, progress: P.prog('intro') });
} });
```
- Format comes from `index.html`: wide 1920x1080 (world 320x180) or tall 1080x1920 (world 180x320).
- All coordinates are world pixels. Art draws on the world layer; text and panels land on a 2x layer on top automatically.
- `g.W`, `g.H`, `g.tall`, `g.safe` (tall: the area the Shorts app UI leaves clear), `g.t` (time, stepped at 12 fps).
- Panels and cards live on the text layer, above the art. To draw a shape on top of one, use `g.ui.rect / rectb / line / poly` (same world coordinates).
- Real screens under the cast (the house look, `_shared/desk.md`):
  - `E.frame({ overlay: true, draw })` clears the art layer every frame.
  - A frame that sets `g.under = true` puts the full-resolution photo layer (`g.photo.ctx`) beneath the art. `desk.js` draws the screens there.
- Wipes between looks: `g.clip` sets a CSS clip-path for the layers this frame, either one string or `{ art, photo }` (`_shared/desk.md`, Style wipes).

## Timing (global `P`)
`P.prog(id, {dur, delay, ease})` 0 to 1 from a cue's start · `P.live(id, until?)` (a parent stays live through its sub-cues) · `P.past(id)` · `P.pick({cueId: value}, default)` · `P.at('word', cueId)` when a word is spoken · `P.since(t0, dur)` · `P.fade(id, {in, out, until})` · `P.cue(id)` `{start, end, phraseEnd, text}` · `P.level()` voice loudness · `P.ease.out/inOut/back/linear`.
`E.typeAt(g, P.at('usually', 'catch.you'), 0.6, 'usually *you*', x, y, {role})` types a plate on from a word, with no empty box before it.
Typewriter anything with `progress: P.prog('id', { dur, ease: P.ease.linear })`.

## Rooms
`E.room(g, kind)` fills the frame and returns `{ floor }`: `library` (the tablet house), `office` (night desk), `hall` (concert stage), `screening` (the sweatbox: also returns `screen: [x, y, w, h]`), `wall`, `dots` (plain, for diagrams), `night` (sky).

## Cast
`E.actor(g, who, { x, y, scale, pose, face, reach: { r: [x, y] }, walk, flip, talk })` returns `{ head, mouth, hands }` for pointing tails and props.
- `doug` narrator (Engelbart: headset, shirt and tie) · `dennis` Unix, C, pipes · `grace` bugs, compilers · `ada` algorithms · `alan` computation, the tape · `frank` the 1958 perceptron · `marvin` 1969, the limits · `william` Jevons, 1865 · `danny` fast and slow thinking · `herb` decisions, the 1956 program, Turing and Nobel · `geoff` neural nets, psychology to a physics Nobel · `john` structured procrastination · `learner`, `dev`, `shop`, `teacher` everyday people · `dub` a living clay tablet: a file (and the sorter, Jev).
- Poses: `idle wave point pointUp present cheer shrug think hold type hips sad`. `reach.r` aims the right hand at any point (point at the diagram).
- Mouths follow the voice; blinks are automatic. `face: 'happy'|'sad'` overrides. `talk: false` for anyone not speaking.
- New people: `E.person({ skin, hair, hairColor, top, bottom, bottomColor, parts: ['glasses', 'beard', 'tie', ...] })`.
- They are nods to real people, not portraits. Never put an invented quote in a real person's name.

## UI
| Call | Draws |
|---|---|
| `label(g, 'SECTION 01 / NAME', x, y, {dot})` | the system-voice chip |
| `say(g, who, text, x, y, w, {to, progress})` | dialog box, speaker's name on the folder tab |
| `caption(g, text, {progress, y})` | caption in the format's band |
| `subtitles(g, {max, y, role})` | spoken-word captions, 1 to 3 words, the word being said in amber (Shorts: every frame) |
| `plate(g, text, x, y, {align, anchor, w, role, fg, bg, progress})` | any text on a solid plate |
| `bubble(g, text, x, y, {to})` · `card(g, x, y, w, {theme, tab, title, lines})` · `panel(...)` | small speech, folder cards |
| `lowerThird(g, name, role)` · `chapter(g, n, title, {progress, sub})` · `rail(g, x, y, steps, current)` · `stamp(g, text, x, y)` | structure |
| `spot(g, rect, t0, {chip})` · `host(g, 'doug', {pose, rise})` · `speech(g, who, x, w, {to, bottom})` · `spoken(t)` | on real screens (`_shared/desk.md`): an amber box on a real rect (real px); Doug in the bottom band saying the words being spoken; `spoken` gives the chunk being said, for any caption |
Text roles: `label` (UPPERCASE system voice), `body`, `head`, `big`, `code`. `*word*` highlights in amber. Digits inside `body`/`head`/`big` draw in VT323 (Pixelify's 5 reads as S); a big number on its own: `role: { font: 'VT323', size: 40 }`.

## Concepts
| Topic | Calls |
|---|---|
| Files | `file(g, x, y, {name, kind: md/code/img/data/txt, lit})` · `folderIcon(g, x, y, {name, theme, open})` · `tree(g, x, y, ['work/', '  CLAUDE.md'], {highlight, progress})` |
| Unix and code | `terminal(g, x, y, w, h, ['$ ls', 'out'], {progress})` · `code(g, x, y, w, lines, {highlight, progress})` · `pipe(g, x, y, ['cat a', 'grep b'], {progress})` |
| Ideas | `flow(g, x, y, steps, {active, progress})` · `stack(g, x, y, w, layers, {highlight})` (index 0 at the bottom) · `graph(g, nodes, edges, {active})` · `arrow(g, x0, y0, x1, y1, {progress})` · `mark(g, x, y, 'check'/'cross')` |
| AI | `tokens(g, x, y, words, {w, window: [a, b]})` · `model(g, x, y, {thinking, label})` |
| Judgments | `choice(g, x, y, w, [[label, p], ...])` pick one · `noul(g, x, y, w, p)` yes or no · `score(g, x, y, w, levels, value)` rate it · all take `{progress}` and sit on panels |
| Machines | `bits(g, x, y, n, {places, label})` · `memory(g, x, y, values, {highlight, pointer})` · `cpu` · `disk` · `db` · `server` · `wire(g, pts)` + `packet(g, pts, p, {label})` |
| History | `crt` · `pdp` (minicomputer) · `teletype` · `mouse(g, x, y, {scale, cord})` (Engelbart's) · `cursor` · `window(g, x, y, w, h, {title, lines})` · `punchcard` · `tape(g, x, y, symbols, {head})` · `bug` |
| Room props | `tablet` · `shelf` · `lamp` · `arch` · `desk` · `cabinet` · `node` |
| Mail and paper | `envelope(g, x, y, {color, open, letter, scale})` · `pigeonholes(g, x, y, labels, {fill, lit})` returns slots to fly letters into · `papers(g, x, y, n)` · `newspaper` · `book(g, x, y, {title})` · `calendar(g, x, y, '1958')` |
| Everyday and history | `bicycle(g, x, y, {spin})` returns `{seat, bars, pedal}` · `loom(g, x, y, {p, woven})` (Jacquard, 1804) · `projector(g, x, y, {beam: [x1, y0, y1]})` (film, 1911) · `pbjar(g, x, y, {knife: 'in' / 'whole', lid})` · `knife(g, x, y, {flip, down})` · `bread(g, x, y, {spread})` · icons `horse dog fish bird car` |
| Then and now | `perceptron(g, x, y, {eye: 'left', out})` · `engine` (steam, 1865) · `coal(g, x, y, amount)` · `jar(g, x, y, fill)` · `coin` · `snow(g, {amount})` · `stopwatch(g, x, y, {p})` · `thumbs(g, x, y, cols, rows, {tags})` (a wall of videos) · `photo` · `chart(g, x, y, w, h, values, {progress})` |
| Real pages | `const HOME = E.image('assets/home.png')` at the top of scene.js (renders wait for it), then `screenshot(g, HOME, x, y, w, h, {url, progress, scroll, crop: [0.22, 0.78]})`: sharp picture, pixel browser frame; `scroll` 0..1 pans down the page, `crop` zooms a docs page to its main column. Capture pages at 1280 wide, 2x, into `04_scene/assets/`. |
| Music (the orchestra) | `sheet(g, x, y, w, h, {title, staves, names, bars, progress, letter, letterAt: [staff, bar], marks: [[staff, 'dolce']], lit: 'letter' / [staff, bar]})` sheet music on the text layer: a full score or one player's part, returns `{ staff, bar(s, b) }` · `orchestra(g, cx, y, {rows, play, guess, lit, stands, timpani})` seated players round the conductor's spot, returns each player's `{ x, y, head }` · `stand(g, x, y, {lit})` · `podium(g, x, y)` returns its top · `instrument(g, 'violin' / 'oboe' / 'flute' / 'horn' / 'timpani' / 'baton', x, y, {angle, r, mallets})` · `metronome(g, x, y, {bpm})` (a click track) · `note(g, x, y, {color})` · room `hall` (concert stage) |
| Animation studio | `mic(g, x, y, {on})` voice first · `xsheet(g, x, y, w, h, {dial, action, start, progress, lit})` the exposure sheet, one row a frame (text layer) · `storyboard(g, x, y, {cols, rows, pw, ph, shown, lit, draw})` panels pinned on cork, returns their rects · room `screening` |
| Strategy map (our own art, no game's) | `hexmap(g, x, y, {cols, rows, seed, island, reveal(c, r) 0..1, tint(c, r), roads: [[c0, r0, c1, r1]], roadP, cities: [[c, r, name]], crack: [[x, y], ...], crackP, stitches})` fog of war on pointy hexes (dx 12, dy 9, odd rows +6; a full frame is `hexmap(g, -6, -4)`), returns `{ at(c, r) }` tile centres · `unit(g, 'scout' / 'slinger' / 'warrior' / 'settler' / 'enemy', x, y)` counters · `city(g, x, y, {name})` · `eureka(g, x, y, {tech, how, drop, pct})` a boost pop-up with a bar that jumps · `techtree(g, x, y, nodes, {dx, dy, w, progress, lit})` nodes `{id, label, c, r, from, state: done / boost / open / locked}` · `victory(g, x, y, {lit, progress, gap})` science, culture, religion, diplomacy, conquest · `bell(g, x, y, w, h, {progress, band, noise, ruler, label})` a bell curve, 100 in the middle, a ruler that only spans it |
| People things | `faceIcon(g, x, y, {mood: 'annoyed'})` · `icon(g, 'inbox' / 'bank' / 'card' / 'calc' / 'calendar' / 'lock' / 'flag' / 'building' / 'shop' / 'mic' / 'captions' / 'clapper' / 'code' / 'film', x, y, {shadow})` · `coat(g, actorResult)` (a very expensive coat) · `chat(g, x, y, w, h, [{who: 'you', text}])` · `meter(g, x, y, w, {lit: 'check', value})` (review, check, act) |
Missing a piece? Add it to `eduba.js`, add it to `gallery.js`, run `anim.py gallery`, add a row here.

## Shorts energy
| Call | Does |
|---|---|
| `camera(g, zoom, x, y)` · `punch(g, [t0, t1], {amt, dur})` | scales every layer about a world point this frame; `punch` gives a zoom that jumps on each beat and eases back |
| `pop(g, t0, {h, dur})` | null before t0, then a y offset that drops in with a bounce: `const dy = E.pop(g, S('x')); if (dy != null) E.plate(g, s, x, y + dy)` |
| `burst(g, x, y, t0)` | pixel sparks flying out for a moment |
| `emote(g, '!' / '?' / '$' / 'sweat', x, y, {t0, until})` | a reaction over a head |
| `drift(g, 'mail' / 'coins' / 'dust', {n, y0, y1, speed})` | background life that never stops; draw it first |
| `takeaways(g, [[text, t], ...], {y})` | chips that tick as each fact lands (top of the safe area) |
How to use them: `_shared/shorts.md`.

## Sound
In `03_cues/cues.md`: a line `music: study` (or `tinker`, optional gain like `music: study 0.2`) before the first cue, and `[sfx: stamp]` on any cue heading. `render` ducks the music under the voice and plays effects at -12 dB (`FX_GAIN`; a line `sfx: 0.4` before the first cue overrides it). Hear everything with `python anim.py sounds` (`_shared/sound/`). Effects: blip, tick, select, coin, stamp, whoosh, pop, powerup, error, chime, step.

## Rules
- Words only ever sit on a plate, a panel or a card. Never on brick, dither or sky.
- One amber highlight per frame. Colours come from the palette (`E.C`), nothing else.
- Tall: everything inside `g.safe`, captions 2 to 4 words at a time, `body` is the smallest text.
- One idea per frame. Enter on the cue, move on the next one. Text types on; it never fades in.
- The character reacts on every cue: a pose change, a point with `reach`, a look.
- Calm motion in long videos: typewriter, slides, blinks, a node pulse. Shorts add pops, sparks and punches (`_shared/shorts.md`). Never shake, spin or rainbow.
- No emoji, no em dashes, sentence case for human text, UPPERCASE for labels.
