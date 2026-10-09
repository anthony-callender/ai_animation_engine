// line-gallery.js - every Line kit piece, one sheet per ?page=. `python anim.py gallery` saves them to
// _shared/gallery/line-*.png. Also the quickest place to see how each piece is called.
const L = Line;
const tag = (g, s, x, y) => L.text(g, s, x, y, { role: 'label', c: 'dim', align: 'center' });
// A clipped panel with its own view, so a background fills only its box.
function panel(g, x, y, w, h, name, fn) {
  const ctx = g.ctx, v = g.view;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  g.view = { x, y, w, h };
  fn(x, y, w, h);
  ctx.restore(); g.view = v;
  L.pen(g, { nib: false }, 'panel').rect(x, y, w, h, { c: 'dim', w: 0.5 }).draw();
  L.text(g, name, x + 3, y + h + 2.5, { role: 'label', c: 'dim' });
}
// Grid cells for the prop sheets: 8 across, 4 down. c(i, j) -> { x (centre), b (baseline), t (top) }
const cell = (i, j) => ({ x: 22 + i * 39.4, b: 52 + j * 34, t: 22 + j * 34 });
const lab = (g, s, i, j) => L.text(g, s, cell(i, j).x, cell(i, j).b + 2, { role: 'label', c: 'dim', align: 'center' });
const PAGES = {
  'line-story': { draw(g) {
    L.room(g);
    L.hud(g, { left: '// 07 STORY PROPS', right: 'house() ... oldmouse()', clock: false });
    const c = cell;
    L.house(g, c(0, 0).x, c(0, 0).b, { lit: true }); lab(g, 'house lit', 0, 0);
    L.shop(g, c(1, 0).x, c(1, 0).b); lab(g, 'shop', 1, 0);
    L.mountains(g, c(2, 0).x, c(2, 0).b, { s: 0.7 }); lab(g, 'mountains', 2, 0);
    L.tower(g, c(3, 0).x, c(3, 0).b, { lit: true }); lab(g, 'tower', 3, 0);
    L.coin(g, c(4, 0).x - 3, c(4, 0).b - 11, { pick: true, label: 'b' }); lab(g, 'coin pick', 4, 0);
    L.chalkboard(g, c(5, 0).x - 16, c(5, 0).t + 2, 32, 22); lab(g, 'chalkboard', 5, 0);
    L.globe(g, c(6, 0).x, c(6, 0).b - 12, { r: 9, wires: true }); lab(g, 'globe wires', 6, 0);
    L.college(g, c(7, 0).x, c(7, 0).b, { s: 0.8 }); lab(g, 'college', 7, 0);
    L.college(g, c(0, 1).x, c(0, 1).b, { s: 0.62, kind: 'arch' }); lab(g, "college 'arch'", 0, 1);
    L.cheque(g, c(1, 1).x - 15, c(1, 1).b - 18, { lit: true }); lab(g, 'cheque', 1, 1);
    L.door(g, c(2, 1).x, c(2, 1).b, { open: 0.6 }); lab(g, 'door open', 2, 1);
    L.jar(g, c(3, 1).x, c(3, 1).b, { fill: 0.6, s: 1.2 }); lab(g, 'jar fill', 3, 1);
    L.bill(g, c(4, 1).x - 9, c(4, 1).b - 25, { s: 0.85, paid: 1 }); lab(g, 'bill paid', 4, 1);
    L.heart(g, c(5, 1).x, c(5, 1).b - 12, { fill: true, s: 1.2 }); lab(g, 'heart', 5, 1);
    L.signpost(g, c(6, 1).x, c(6, 1).b, { s: 0.8 }); lab(g, 'signpost', 6, 1);
    L.wave(g, c(7, 1).x + 4, c(7, 1).b, { s: 0.75, label: 'update' }); lab(g, 'wave', 7, 1);
    L.sun(g, c(0, 2).x, c(0, 2).b - 12); lab(g, 'sun', 0, 2);
    L.storm(g, c(1, 2).x, c(1, 2).b - 20, { bolt: true }); lab(g, 'storm bolt', 1, 2);
    L.ledger(g, c(2, 2).x - 15, c(2, 2).b - 23, { s: 0.68, lines: 11.5 }); lab(g, 'ledger', 2, 2);
    L.invoice(g, c(3, 2).x - 9, c(3, 2).b - 25, { s: 0.72, lit: true }); lab(g, 'invoice', 3, 2);
    L.robot(g, c(4, 2).x, c(4, 2).b - 11, { s: 1.8 }); lab(g, 'robot', 4, 2);
    L.playcard(g, c(5, 2).x, c(5, 2).b - 11); lab(g, 'playcard', 5, 2);
    L.bookshelf(g, c(6, 2).x - 17, c(6, 2).t - 18, 34, { shelves: 2, lit: 3 }); lab(g, 'bookshelf', 6, 2);
    L.openbook(g, c(7, 2).x - 17, c(7, 2).t + 4, 34); lab(g, 'openbook', 7, 2);
    L.building(g, c(0, 3).x, c(0, 3).b, { s: 0.55, lit: 'flag' }); lab(g, 'building', 0, 3);
    L.stairs(g, c(1, 3).x - 14, c(1, 3).b, { s: 0.7 }); lab(g, 'stairs', 1, 3);
    L.jet(g, c(2, 3).x, c(2, 3).b - 13, { s: 0.55 }); lab(g, 'jet', 2, 3);
    L.wrench(g, c(3, 3).x, c(3, 3).b - 14, { s: 0.85, rot: 0.6 }); lab(g, 'wrench', 3, 3);
    L.diploma(g, c(4, 3).x, c(4, 3).b - 12, { lit: true }); lab(g, 'diploma', 4, 3);
    L.funnel(g, c(5, 3).x, c(5, 3).t + 2, { s: 0.75 }); lab(g, 'funnel', 5, 3);
    L.mainframe(g, c(6, 3).x - 16, c(6, 3).b, { s: 0.62, n: 3, lit: true }); lab(g, 'mainframe', 6, 3);
    L.oldmouse(g, c(7, 3).x + 4, c(7, 3).b - 10, { s: 1.1 }); lab(g, 'oldmouse', 7, 3);
  } },
  'line-story2': { draw(g) {
    L.room(g);
    L.hud(g, { left: '// 08 STORY PROPS', right: 'stage() ... ask()', clock: false });
    const c = cell;
    const sc = L.stage(g, c(0, 0).x + 18, c(0, 0).b, { w: 64 }); L.text(g, 'screen', sc.x + sc.w / 2, sc.y + 3, { role: 'label', c: 'dim', align: 'center' }); lab(g, 'stage', 0, 0);
    L.hand(g, c(2, 0).x, c(2, 0).b - 8); L.pebble(g, c(2, 0).x, c(2, 0).b - 5); lab(g, 'hand + pebble', 2, 0);
    L.footprints(g, Array.from({ length: 8 }, (_, i) => [c(3, 0).x - 14 + i * 4, c(3, 0).b - 6 - Math.sin(i) * 3])); lab(g, 'footprints', 3, 0);
    L.fear(g, c(4, 0).x, c(4, 0).b - 14, { r: 16 }); lab(g, 'fear', 4, 0);
    L.ladder(g, c(5, 0).x, c(5, 0).b); lab(g, 'ladder', 5, 0);
    L.person(g, 'bun', { x: c(6, 0).x - 6, y: c(6, 0).b + 14, s: 0.55, talk: false }); L.person(g, 'beard', { x: c(6, 0).x + 8, y: c(6, 0).b + 14, s: 0.55, talk: false }); L.table(g, c(6, 0).x - 16, c(6, 0).b - 12, 32, { leg: 12 }); lab(g, 'table', 6, 0);
    L.bin(g, c(7, 0).x, c(7, 0).b, { label: 'converted' }); lab(g, 'bin', 7, 0);
    L.conveyor(g, c(0, 1).x - 16, c(1, 1).x + 14, c(0, 1).b - 10); lab(g, 'conveyor', 0, 1);
    L.face(g, c(2, 1).x, c(2, 1).b - 12, { r: 7, mood: 'smile', lit: true }); lab(g, 'face smile', 2, 1);
    L.spark(g, c(3, 1).x - 14, c(3, 1).b - 20, c(3, 1).x + 14, c(3, 1).b - 4); lab(g, 'spark', 3, 1);
    L.tag(g, '$20 / mo', c(4, 1).x - 12, c(4, 1).b - 12, { swing: 0.25, to: [c(4, 1).x - 16, c(4, 1).t + 2] }); lab(g, 'tag', 4, 1);
    L.stamp(g, 'missed the reason', c(5, 1).x + 10, c(5, 1).b - 12, { role: 'label' }); lab(g, 'stamp', 5, 1);
    L.filmcam(g, c(6, 1).x, c(6, 1).b, { lit: true }); lab(g, 'filmcam', 6, 1);
    L.promptbox(g, c(7, 1).x - 17, c(7, 1).b - 18, 34, { text: 'hey', h: 10 }); lab(g, 'promptbox', 7, 1);
    L.ask(g, 'jackson', 'now that everyone has that bicycle, what separates people now?', 14, 110, { w: 290 });
    L.ask(g, 'jackson', 'anything you\'ve automated that you wish you hadn\'t?', 14, 128, { w: 290, progress: 0.6 });
  } },
  'line-art': { draw(g) {
    L.room(g);
    L.hud(g, { left: '// 06 ART THAT TALKS', right: 'bg() morph() bicycle()', clock: false });
    const W = 96, H = 58, xs = [10, 112, 214], ys = [20, 98];
    panel(g, xs[0], ys[0], W, H, "bg 'topo', lit: 5", () => L.bg(g, 'topo', { lit: 5 }));
    panel(g, xs[1], ys[0], W, H, "bg 'flow'", () => L.bg(g, 'flow'));
    panel(g, xs[2], ys[0], W, H, "bg 'stars' + 'town', lit", () => { L.bg(g, 'stars'); L.bg(g, 'town', { ground: ys[0] + H - 2, lit: 9 }); });
    panel(g, xs[0], ys[1], W, H, "bg 'hills' + bicycle({ rider })", () => {
      const { ground } = L.bg(g, 'hills', { ground: ys[1] + H - 8, scroll: 40 });
      L.bicycle(g, xs[0] + W / 2, ground, { s: 1.05, rider: 'curly' });
    });
    panel(g, xs[1], ys[1], W, H, 'bicycle({ lit, fall }) + pencil', () => {
      L.bicycle(g, xs[1] + 26, ys[1] + H - 8, { s: 0.95, lit: 'frame' });
      L.bicycle(g, xs[1] + 72, ys[1] + H - 8, { s: 0.95, fall: 0.6, spin: false });
      L.pen(g, {}, 'demo').curve([[xs[1] + 10, ys[1] + 12], [xs[1] + 40, ys[1] + 6], [xs[1] + 70, ys[1] + 14], [xs[1] + 88, ys[1] + 8]], { c: 'accent' }).draw(0.6);
    });
    panel(g, xs[2], ys[1], W, H, 'morph(bicycle, head + brain, 0.5)', () => {
      const A = L.capture(g, () => L.bicycle(g, xs[2] + W / 2, ys[1] + H - 10, { s: 1.1, spin: false }));
      const B = L.capture(g, () => L.head(g, xs[2] + W / 2, ys[1] + 26, { s: 1.35, brain: true, lit: true }));
      L.morph(g, A, B, 0.5);
    });
  } },
  'line-mind': { draw(g) {
    L.room(g);
    L.hud(g, { left: '// 06 A BICYCLE FOR OUR MINDS', right: 'head() brain()', clock: false });
    L.bg(g, 'flow');
    L.bicycle(g, 90, 140, { s: 2.2, lit: 'wheels', spin: false });
    L.head(g, 232, 92, { s: 3, brain: true, lit: true });
  } },
  'line-hero': { draw(g) {
    L.room(g);
    L.hud(g, { left: '// SYS.ANALOG', right: 'terminal_audio', clock: '03:10:28' });
    L.coder(g, 150, 126, { s: 1.3, sip: 1 });
    L.caption(g, 'all *you.*', { role: 'big' });
  } },
  'line-type': { draw(g) {
    L.room(g);
    L.hud(g, { left: '// 01 TYPE', right: 'line_kit' });
    [['label', '// SECTION 01 / THE SYSTEM VOICE'], ['body', 'Body: the human voice, *one accent* a frame.'], ['head', 'Head: one idea'], ['code', '$ ls stages/  01_voice  02_words']].forEach(([r, s], i) => {
      L.text(g, r.toUpperCase(), 20, 28 + i * 20, { role: 'label', c: 'dim' });
      L.text(g, s, 56, 28 + i * 20, { role: r, c: r === 'label' ? 'sys' : 'ink' });
    });
    L.plate(g, 'plate, boxed', 60, 112, { box: true });
    L.plate(g, 'brackets', 150, 112, { brackets: true });
    L.label(g, '// label()', 230, 114);
    L.text(g, 'typing on_', 60, 134, { role: 'body', progress: 0.7, cursor: true });
    L.caption(g, 'all *you.*', { role: 'big' });
  } },
  'line-cast': { draw(g) {
    L.room(g, 'floor', { floor: 88 });
    L.hud(g, { left: '// 02 CAST', right: 'person()', clock: false });
    ['curly', 'bun', 'beard', 'long', 'bald'].forEach((w, i) => { const x = 40 + i * 60; L.person(g, w, { x, y: 88, s: 0.95, talk: false, pose: ['wave', 'point', 'hips', 'think', 'present'][i] }); tag(g, w, x, 92); });
    const poses = ['idle', 'cheer', 'shrug', 'hold', 'type', 'sad', 'pointUp', 'sip'];
    poses.forEach((ps, i) => { const x = 24 + i * 39; L.person(g, 'curly', { x, y: 168, s: 0.95 * 0.62, pose: ps, talk: false, hold: ps === 'sip' ? 'mug' : null, face: ps === 'sip' ? 'base' : undefined }); tag(g, ps, x, 171); });
  } },
  'line-props': { draw(g) {
    L.room(g);
    L.hud(g, { left: '// 03 PROPS', right: 'objects', clock: false });
    const row1 = 62, row2 = 112, row3 = 164;
    L.laptop(g, 40, row1, { s: 1.2 }); tag(g, 'laptop', 30, row1 + 4);
    L.mug(g, 78, row1, { s: 1.4 }); tag(g, 'mug', 78, row1 + 4);
    L.lamp(g, 118, row1, { s: 1.1, on: true }); tag(g, 'lamp on', 112, row1 + 4);
    L.plant(g, 152, row1, { s: 1.2 }); tag(g, 'plant', 152, row1 + 4);
    L.books(g, 190, row1, { n: 4, lit: 2 }); tag(g, 'books', 190, row1 + 4);
    L.bulb(g, 226, row1, { s: 1.2, on: true }); tag(g, 'bulb on', 226, row1 + 4);
    L.clock(g, 264, row1 - 12, { r: 10 }); tag(g, 'clock', 264, row1 + 4);
    L.hourglass(g, 298, row1, { s: 1.1, p: 0.4 }); tag(g, 'hourglass', 298, row1 + 4);
    L.envelope(g, 18, row2 - 16, { lit: true }); tag(g, 'envelope', 29, row2 + 4);
    L.phone(g, 56, row2 - 24, { lit: true }); tag(g, 'phone', 62, row2 + 4);
    L.monitor(g, 100, row2, { w: 36, h: 22 }); tag(g, 'monitor', 100, row2 + 4);
    L.crt(g, 148, row2); tag(g, 'crt', 148, row2 + 4);
    L.keyboard(g, 196, row2, { s: 0.9 }); tag(g, 'keyboard', 196, row2 + 4);
    L.server(g, 236, row2, { n: 4, active: true }); tag(g, 'server', 236, row2 + 4);
    L.db(g, 276, row2, { lit: true }); tag(g, 'db', 276, row2 + 4);
    L.gear(g, 22, row3 - 12, { lit: true }); tag(g, 'gear', 22, row3 + 4);
    L.cloud(g, 60, row3 - 10); tag(g, 'cloud', 60, row3 + 4);
    L.magnifier(g, 96, row3 - 14); tag(g, 'magnifier', 98, row3 + 4);
    L.lock(g, 130, row3, { s: 1.2 }); tag(g, 'lock', 130, row3 + 4);
    L.calendar(g, 154, row3 - 20, { text: '1958' }); tag(g, 'calendar', 164, row3 + 4);
    L.cursor(g, 196, row3 - 16, { s: 1.2 }); tag(g, 'cursor', 200, row3 + 4);
    L.chair(g, 236, row3, { s: 1.1 }); tag(g, 'chair', 236, row3 + 4);
    L.file(g, 262, row3 - 22, { lit: true }); tag(g, 'file', 270, row3 + 4);
    L.folder(g, 286, row3 - 18, { open: true }); tag(g, 'folder', 298, row3 + 4);
  } },
  'line-ideas': { draw(g) {
    L.room(g, 'grid');
    L.hud(g, { left: '// 04 IDEAS', right: 'diagrams', clock: false });
    L.flow(g, 16, 36, ['voice', 'words', 'cues', 'scene'], { active: 2, role: 'label' });
    L.stack(g, 206, 24, 100, ['hardware', 'os', 'software', 'AI'], { highlight: 3 });
    L.graph(g, [{ id: 'a', x: 40, y: 76, label: 'CLAUDE.md' }, { id: 'b', x: 100, y: 64, label: 'stage 1' }, { id: 'c', x: 100, y: 92, label: 'stage 2' }, { id: 'd', x: 156, y: 78, label: 'output' }],
      [['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'd']], { active: 'b' });
    L.chart(g, 16, 112, 80, 44, [3, 5, 4, 9], { lit: 3, labels: ['q1', 'q2', 'q3', 'q4'] });
    L.trend(g, 110, 116, 70, 38, [2, 3, 2.5, 4, 3.6, 6, 8]);
    L.bubble(g, 'a speech bubble', 190, 100, { w: 70, to: [205, 128] });
    L.thought(g, 'a thought', 250, 128, { w: 50, to: [300, 160] });
    L.arrow(g, 186, 146, 222, 156, { bend: 0.3 });
    L.text(g, 'ringed', 120, 164, { role: 'body' }); L.ring(g, 120, 164, 28, 6);
    L.text(g, 'underlined', 158, 164, { role: 'body' }); L.underline(g, 158, 172, 42);
    L.mark(g, 240, 168, 'check'); L.mark(g, 256, 168, 'cross');
    L.tokens(g, 16, 164, ['the', 'folder', 'is', 'the'], { window: [1, 3], role: 'label' });
  } },
  'line-screens': { draw(g) {
    L.room(g);
    L.hud(g, { left: '// 05 SCREENS', right: 'files', clock: false });
    L.terminal(g, 14, 26, 120, 70, ['$ ls stages', '01_voice  02_words', '$ cat CLAUDE.md', '# Workspace', '$ python anim.py status'], { title: 'zsh' });
    L.code(g, 148, 34, 80, ['# route', 'if task:', '    open(stage)', 'else:', '    stop()'], { highlight: 2 });
    L.browser(g, 236, 28, 74, 56, { url: 'eduba.io', lines: 5 });
    L.tree(g, 16, 112, ['workspace/', '  CLAUDE.md', '  stages/', '    01_voice/', '  videos/'], { highlight: 1 });
    ['md', 'js', 'png'].forEach((n, i) => L.file(g, 120 + i * 26, 112, { name: n, lit: i === 0 }));
    L.folder(g, 202, 114, { name: 'closed' }); L.folder(g, 238, 114, { name: 'open', open: true, lit: true });
    L.plate(g, 'screenshot() frames a real page in a browser()', 160, 160, { align: 'center', role: 'label', c: 'dim' });
  } },
  'line-tall': { tall: true, draw(g) {
    L.room(g);
    L.hud(g, { left: '// SHORTS', right: 'tall', clock: false });
    L.plate(g, 'one idea, *big.*', 90, 48, { align: 'center', role: 'head', w: 160 });
    L.person(g, 'curly', { x: 90, y: 190, s: 1.35, pose: 'point', talk: false });
    L.bulb(g, 140, 108, { s: 1.1, on: true });
    L.caption(g, 'captions *here*');
    guides(g);
  } },
};
// Where the Shorts app UI covers the frame (board only).
function guides(g) {
  const s = g.safe, ctx = g.ctx; ctx.strokeStyle = g.th.sys; ctx.lineWidth = 0.3; ctx.setLineDash([1.5, 1.5]);
  ctx.strokeRect(s.x, s.y, s.w, s.h); ctx.setLineDash([]);
}

const page = PAGES[new URLSearchParams(location.search).get('page') || 'line-hero'];
const stage = document.getElementById('stage');
stage.dataset.width = page.tall ? 1080 : 1920; stage.dataset.height = page.tall ? 1920 : 1080;
L.frame({ draw: page.draw });
window.GALLERY_PAGES = Object.keys(PAGES);
