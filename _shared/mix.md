# Mix: combine visual styles

_runtime/mix.js coordinates pixel, line, modern and blueprint scenes on one timeline. Use a wipe when it helps compare the same content across styles. Captured material can appear in a drawn app view with a character and highlights above it.

This is an advanced API reference. The included silent project teaches basic timing; it does not demonstrate Mix. The runtime gallery's looks and screens pages demonstrate component styles and app views.

## Set up a mixed scene

Create a tall project with 'python anim.py new my-mixed-short --format tall'. Its HTML already loads local fonts and required runtimes. Complete voice and cues before writing the mixed scene.

For captured file content, follow desk.md, generate assets/real.js, and add that script before scene.js. Omit it when there are no captures. Begin with two looks, consistent content positions and one wipe. Inspect frames before, during and after the transition.

## API sketch

This is a sketch, not a runnable example. Replace ellipses, define helper variables and cue IDs, and supply any referenced capture. The table describes available pieces.

```js
const X = Mix, { FW, FH, K } = X;          // frame px; K = world px to real px (6 on tall)
function pixelLook(g, T) { ... }           // art: draw on g (world px 180x320), E.room first
function lineLook(g, T) { ... }            // line: draw on g, L.room first
function modernLook(ctx, T) { ... }        // photo: draw on ctx in real px, M.bg first
function fileLook(ctx, T) {                // a real screen
  const { zz, out } = X.zoomWin(ctx, X.TOP_Y, X.ZR, 'animations', (c) => X.edit(ctx, c, { tabs: [{ name: 'CLAUDE.md' }], crumb: 'animations', lines: R.files['CLAUDE.md'] }));
  RECT.line = zz.rect(out.find('Nothing moves'));
}
X.start({
  looks: { pixel: { layer: 'art', draw: pixelLook, color: '#E8A860' }, line: { layer: 'line', draw: lineLook, color: '#FF8A1C' },
           modern: { layer: 'photo', draw: modernLook, color: '#FF7A59' }, file: { layer: 'photo', real: true, draw: fileLook } },
  strips: { all: ['pixel', 'line', 'modern'] },               // a shot that shows these side by side
  shots: () => [[0, 'pixel', 0], [S('hook.line') - 0.15, 'line', 0.4], [S('x') - 0.1, 'all', 0.5], [S('y') - 0.1, 'file', 0.6]],
  overlay(g, look, T, rise) { if (look === 'file') E.spot(g, RECT.line, S('y.spot')); E.host(g, 'doug', { pose: 'point', rise }); },
});
```

| Piece | Does |
|---|---|
| `looks` | `layer`: `art` (Eduba pixels, one at a time), `line` (Line kit), `photo` (full resolution: Looks, Desk). `real: true` gets the pixel cast from `overlay`. `color` tints the seam. |
| `shots()` | `[t0, look, wipe]` in order. The first is `[0, look, 0]`. Each later one wipes in over `wipe` seconds (0.4 for a fast run of looks, 0.6 to 0.8 between scenes). Start a wipe about 0.1 s before its word. The last shot can wipe back to the first look, so the loop has no seam. |
| `strips` | a shot showing several looks side by side, split by flowing seams, with one caption across them all (`stripCaption`, default `caption.modern`) |
| `X.mixed()` | true while strips are on screen: a look skips its own caption then (`if (!X.mixed()) E.subtitles(g)`) |
| `X.caption.modern / blue(ctx, T, y)` | spoken-word captions, 3 words, the lit word in the accent. Pixel uses `E.subtitles(g, {y})`, line uses `L.subtitles(g, {y})`, real screens use the host's dialog box. |
| `X.zoomWin(ctx, top, z, title, fn)` | a real window zoomed `z` (`X.ZR` = 2.1 reads on a phone) from y `top` (`X.TOP_Y` 170; `X.STAGE_Y` 330 leaves room for a strip above). Returns `{ zz, out }`: `zz.rect(r)` maps a rect for `E.spot`. It runs on under the band, dimmed there. |
| `X.edit(ctx, c, o)` | `Desk.editor` in the window, with the path line kept clean while it scrolls |
| `X.rows(lines, z, wrap)` | an editor's rows without drawing: `.rowOf(i)` for scroll maths |

## Rules
- Real content only: `anim.py real` / `grab` (`desk.md`). Keep what matters above y 930 (px) on tall: Doug's dialog box and the band sit below it.
- Keep a picture's content in the same place across looks, so the seam reads as one picture changing style.
- One look's intro (a line drawing drawing itself, a blueprint plotting) has to fit before the next wipe: 0.5 s in a fast hook.
- Stills at every wipe and every strip shot. Check that every caption reads and nothing important sits under the dialog box.
