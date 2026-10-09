# Desk: real screens under the cast

The house look since 2026-09-29. Anything the words name that exists (a file, a folder, a command, a page, an app) is shown for real, at full resolution. The pixel cast sits on top:

- Doug, saying the spoken words, in the bottom band.
- Amber spots on whatever he names.

Pixel rooms carry the ideas (and the metaphor, when there is one) between screens.

- Engine: `_runtime/desk.js` (`Desk`).
- Every piece: `_shared/gallery/screens.png`.
- The bundled silent project shows basic timing; use the runtime gallery for this API.

## Real content only
Use source-backed captures for factual demonstrations. Label authored fixtures. The capture helper filters some hidden paths and key-like text, but redaction is best-effort; review every capture.

| Capture | Command | In scene.js |
|---|---|---|
| a file's text | `python anim.py real <slug> file CONTEXT.md` | `REAL.files['CONTEXT.md']` (lines) |
| a folder | `real <slug> tree . --as animations --depth 2` | `Desk.rows(REAL.trees.animations, ...)` |
| what a command prints | `real <slug> run "python anim.py status" --as status` | `REAL.runs.status` = `{ cmd, out }` |
| footage (a render, a screen recording) | `real <slug> clip <video> --as jev --start 35.5 --end 39.5` | `const JEV = Desk.clip('jev')`, then `JEV.at(s)` |
| a web page | `grab <slug> <url> <name>` | `E.image('assets/<name>.png')` in `Desk.browser` |
| an app, a signed-in page | a screenshot or recording the person makes, cleaned, in `04_scene/assets/` | `E.image`, or `real clip` |

## Frame
```js
const D = Desk, R = window.REAL;
E.frame({ overlay: true, draw(g, t) {
  const ctx = g.photo.ctx, T = P.t;   // real px (1920x1080); smooth time for the screen, t (on twos) for the pixels
  D.wallpaper(ctx);
  const c = D.win(ctx, 36, 30, 1848, 1020, { title: 'animations' });
  const rows = D.rows(R.trees.animations, { open: { stages: P.prog('tree.stages', { dur: 0.3 }) }, sel: 'stages' });
  const tree = D.tree(ctx, c.x, c.y, 372, c.h, rows, { root: 'animations', split: 549, outline: ['Pipeline'] });
  D.editor(ctx, 409, c.y, 1475, c.h, { tabs: [{ name: 'CONTEXT.md' }], lines: R.files['CONTEXT.md'] });
  g.under = true;                     // the screen goes under the art
  E.spot(g, tree.stages, P.cue('tree.stages').start, { chip: 'THE RULES' });
  E.host(g, 'doug', { pose: 'point' });
} });
```

## Pieces
All in real px, all pure functions of what you pass.

| Call | Draws, returns |
|---|---|
| `wallpaper(ctx)` · `win(ctx, x, y, w, h, {title})` | the desktop; a window, returning its content rect |
| `rows(list, {open, sel})` · `rowPoint(rows, id, x, y)` | explorer rows from a captured tree (`open` 0..1 per folder animates it); where a row sits, for the pointer |
| `tree(ctx, x, y, w, h, rows, {root, split, outline})` | the explorer, returning `{ path: rect }`. `split` leaves room for the OUTLINE and TIMELINE panes |
| `editor(ctx, x, y, w, h, {tabs, active, crumb, lines, scroll, first, lang})` | tabs, gutter, highlighted text (md, js, py, json); returns `line(i, a, b)` rects |
| `terminal(ctx, x, y, w, h, entries, T, {bottom, prompt})` · `ends(entry)` | entries `{ t0, cmd, out }` type on and print; returns `cmd(k)` rects. `ends` gives when an entry finishes |
| `browser(ctx, x, y, w, h, img, {url, scroll})` | a grabbed page in a browser; returns `at(ix, iy)`, the screen point of an image pixel |
| `bar(ctx, x, y, w, {time, duration, marks, label})` | the studio's preview bar |
| `pointer(ctx, x, y, {click})` · `path(keys, T)` | the mouse and its click ring; an eased path through `[[t, x, y], ...]` |
| `zoom(z, ax, ay)` | a sharp tutorial zoom: `ctx.save(); z.apply(ctx); ...; ctx.restore()`, then `z.rect(r)` for spots |
| `clip(name)` | footage from `real clip`. Call it at the top of scene.js so renders wait for the frames |
| `seam(x, {phase})` · `layer()` | a style wipe (below) |

Pixel side (`eduba.js`):
- `E.spot(g, rect, t0, {chip})`: an amber box on a real rect.
- `E.host(g, 'doug', {pose, rise})`: Doug in the band with `E.speech`, the words being spoken, typing on a chunk at a time.

## Style wipes
One picture in several looks, with a flowing line wiping from one to the next. Each look draws the whole picture, and the seam decides which side you see.

- `Desk.seam(x, {phase})` gives `left` and `right` (CSS clip-paths), `path(ctx, side)` for two looks on one canvas, and `draw(ctx, color)` for the line itself.
- Set `g.clip` in `E.frame` (a string, or `{ art, photo }`) and in `Line.frame`, every frame.
- Draw the seam on `Desk.layer()`, a canvas above everything. Create it after the frames, and draw on it in a `P.onFrame` registered after them.
- More looks (`_runtime/looks.js`):
  - `Looks.modern`: `bg`, `title`, `card`, `link`, `packet`, `host` (flat Doug), `caption`.
  - `Looks.blueprint`: `bg`, `sheet`, `title`, `box`, `dim`, `leader`, `center`, `arrow`, `host`, `titleBlock` (checker signs by hand), `note`, `packet`. Lines plot themselves on with `p`.
- The same icons in every look, from Lucide (ISC license, kept in the file):
  - crisp: `Looks.icon(ctx, name, x, y, size)`
  - hand-drawn: `Looks.strokes(name)` through a Line pen
  - plotted: `Looks.blueprint.icon`
  - pixels: hand-placed sprites, `E.icon(g, 'mic' / 'captions' / 'clapper' / 'code' / 'film', x, y, { shadow: true })`
- Keep the content identical across looks: the same positions, the same icons, and one shared timeline (a file travelling the stages), so it stays continuous through the seam.
- The bundled silent project shows basic timing; use the runtime gallery for this API.

## Rules
- The band belongs to the pixel layer. On 16:9, keep what matters above y 866 (terminals: `bottom: 866`).
- The words lead. A folder opens, a command types, the pointer clicks, a spot lands: each on the word that names it.
- One spot at a time: it is the frame's one amber.
- Zoom a screen with `Desk.zoom`, never `E.camera`, which scales the canvas and blurs it.
- Screens move smoothly (`P.t`). The pixel cast stays on twos (`t`).
- Every idea gets a pixel room between screens. A screen growing out of a pixel prop (the CRT) links the two.
- Tall (Shorts): crop to the one thing that matters, big enough to read on a phone.
