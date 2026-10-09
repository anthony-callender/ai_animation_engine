// gallery.js - renders every kit component, one sheet per ?page=. `python anim.py gallery` saves them
// to _shared/gallery/. Also the quickest place to see how each component is called.
const E = Eduba, C = E.C;
const PAGES = {
  cast: { tall: false, draw(g) {
    E.room(g, 'dots');
    E.label(g, 'THE CAST', 10, 8, { dot: true });
    const who = ['doug', 'dennis', 'grace', 'ada', 'alan', 'learner', 'dev', 'dub'];
    who.forEach((w, i) => { const x = 24 + i * 39; E.actor(g, w, { x, y: 92, scale: 2, talk: false }); g.textIn(w.toUpperCase(), x - 20, 96, 40, 8, C.cream, 'label'); });
    const poses = ['idle', 'wave', 'point', 'pointUp', 'present', 'cheer', 'shrug', 'think', 'hold', 'type', 'hips', 'sad'];
    poses.forEach((p, i) => { const x = 16 + i * 26; E.actor(g, 'doug', { x, y: 160, pose: p, talk: false }); g.textIn(p, x - 13, 163, 26, 8, C.rose, 'label'); });
  } },
  faces: { tall: false, draw(g) {
    E.room(g, 'dots');
    E.label(g, 'DOUG: FACES AND WALK', 10, 8, { dot: true });
    const faces = [['base', 0], ['talk', 0.3], ['shout', 0.8], ['happy', 0], ['sad', 0]];
    faces.forEach(([f, lv], i) => { const x = 34 + i * 52; E.actor(g, 'doug', { x, y: 150, scale: 4, face: f, level: lv }); g.textIn(f.toUpperCase(), x - 24, 154, 48, 8, C.cream, 'label'); });
    E.actor(g, 'doug', { x: 294, y: 150, scale: 2, walk: true, pose: 'idle', talk: false });
    g.textIn('WALK', 274, 154, 40, 8, C.cream, 'label');
  } },
  ui: { tall: false, draw(g) {
    const { floor } = E.room(g, 'library');
    E.label(g, 'SECTION 01 / THE TABLET HOUSE', 10, 8, { dot: true });
    const d = E.actor(g, 'doug', { x: 58, y: floor, scale: 2, pose: 'present', talk: false });
    E.say(g, 'Doug', 'Every folder says what it is for. *That is the whole trick.*', 110, 26, 150, { to: [d.head[0] + 12, d.head[1] + 14] });
    E.card(g, 232, 84, 80, { theme: 'rose', tab: 'CARD', title: 'one folder, one job', lines: ['Each stage reads the one before it.'] });
    E.rail(g, 122, 102, ['VOICE', 'WORDS', 'CUES'], 1);
    E.stamp(g, 'WHEN NOT TO USE AI', 150, 128, { role: 'label' });
    E.caption(g, 'Captions sit on a plate, one *highlight* per line.');
  } },
  files: { tall: false, draw(g) {
    E.room(g, 'dots');
    E.label(g, 'FILES AND FOLDERS', 10, 8, { dot: true });
    ['md', 'code', 'img', 'data', 'txt'].forEach((k, i) => E.file(g, 16 + i * 26, 28, { name: k, kind: k, lit: i === 0 }));
    E.THEME_ORDER.forEach((th, i) => E.folderIcon(g, 150 + i * 32, 30, { name: th.slice(0, 5), theme: th, open: i === 1 }));
    E.tree(g, 14, 64, ['workspace/', '  CLAUDE.md', '  stages/', '    01_voice/', '    02_words/', '  videos/', '    intro.md'], { highlight: 1 });
    E.terminal(g, 118, 64, 96, 64, ['$ ls stages', '01_voice  02_words', '$ cat CLAUDE.md', '# Workspace', '$ '], {});
    E.code(g, 222, 64, 90, ['# route', 'if task:', '  open(stage)', 'else:', '  stop()'], { highlight: 2 });
  } },
  machines: { tall: false, draw(g) {
    E.room(g, 'dots');
    E.label(g, 'MACHINES', 10, 8, { dot: true });
    E.cpu(g, 12, 26, { active: true });
    E.memory(g, 50, 28, [72, 101, 108, 108, 111, 0, 42, 7], { highlight: 1, pointer: 1, cols: 4 });
    E.bits(g, 170, 34, 42, { places: true, label: true });
    E.disk(g, 14, 76, { label: 'DISK' }); E.db(g, 44, 72, { label: 'DATA' }); E.server(g, 80, 70, { label: 'SERVER' });
    E.wire(g, [[106, 88], [150, 88], [150, 100], [176, 100]]); E.packet(g, [[106, 88], [150, 88], [150, 100], [176, 100]], (g.t * 0.4) % 1, { label: 'GET /' });
    E.crt(g, 180, 76, {});
    E.pdp(g, 240, 70, { label: 'MINI' });
    E.teletype(g, 16, 134, {}); E.mouse(g, 66, 146, { scale: 2, cord: [100, 132] }); E.cursor(g, 104, 140);
    E.window(g, 122, 126, 70, 44, { title: 'NLS', lines: ['outline', ' - item'] });
    E.punchcard(g, 204, 126, {}); E.tape(g, 206, 158, [0, 1, 1, 0, 1, 0], { head: 2 });
    E.bug(g, 262, 124, { scale: 2 }); g.textIn('BUG', 262, 140, 22, 8, C.cream, 'label');
  } },
  ideas: { tall: false, draw(g) {
    E.room(g, 'dots');
    E.label(g, 'IDEAS', 10, 8, { dot: true });
    E.pipe(g, 12, 28, ['cat notes.md', 'grep todo', 'wc -l']);
    E.flow(g, 12, 58, ['input', 'process', 'output'], { active: 1 });
    E.stack(g, 196, 26, 116, ['hardware', 'operating system', 'software', 'AI'], { highlight: 3 });
    E.graph(g, [{ id: 'a', x: 36, y: 104, label: 'CLAUDE.md' }, { id: 'b', x: 92, y: 96, label: 'stage 1' }, { id: 'c', x: 92, y: 128, label: 'stage 2' }, { id: 'd', x: 150, y: 112, label: 'output' }],
      [['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'd']], { active: 'b' });
    E.model(g, 196, 104, { thinking: true });
    E.tokens(g, 12, 146, ['The', ' folder', ' is', ' the', ' agent', '.', ' It', ' reads', ' files'], { w: 190, window: [2, 7] });
    E.mark(g, 262, 108, 'check'); E.mark(g, 262, 124, 'cross');
    g.textIn('USE AI', 274, 106, 40, 10, C.sage, 'label', { align: 'left', pad: 0 }); g.textIn("DON'T", 274, 122, 40, 10, C.clayDark, 'label', { align: 'left', pad: 0 });
  } },
  type: { tall: false, draw(g) {
    E.room(g, 'dots');
    E.label(g, 'TYPE ROLES', 10, 8, { dot: true });
    const rows = [['label', 'SECTION 01 / LABEL'], ['body', 'Body: the human voice.'], ['head', 'Head: one idea'], ['code', 'code: CLAUDE.md  ls -la  02_words/']];
    rows.forEach(([r, s], i) => { g.textIn(r.toUpperCase(), 10, 26 + i * 22, 30, 16, C.rose, 'label', { align: 'left', pad: 0 }); g.textIn(s, 44, 26 + i * 22, 270, 16, C.white, r, { align: 'left', pad: 0 }); });
    [16, 18, 20, 24, 32].forEach((sz, i) => g.textIn(`VT323 ${sz}: workspace/ 02_words wc -l`, 10, 118 + i * 11, 300, 10, C.cream, { font: 'VT323', size: sz }, { align: 'left', pad: 0 }));
  } },
  jev: { tall: false, draw(g) {
    E.room(g, 'dots');
    E.label(g, 'NEW CAST + JUDGMENTS', 10, 8, { dot: true });
    [['frank', '1958'], ['marvin', '1969'], ['william', '1865'], ['danny', 'FAST/SLOW']].forEach(([w, tag], i) => {
      const x = 22 + i * 30; E.actor(g, w, { x, y: 88, scale: 2, talk: false, pose: i === 0 ? 'present' : i === 1 ? 'hips' : i === 2 ? 'idle' : 'think' });
      g.textIn(w.toUpperCase(), x - 16, 92, 32, 8, C.cream, 'label'); g.textIn(tag, x - 16, 101, 32, 8, C.rose, 'label');
    });
    E.panel(g, 144, 20, 172, 70, { tab: 'PICK ONE' });
    E.choice(g, 152, 36, 156, [['plan', 1.0], ['build log', 0.0], ['question', 0.0], ['other', 0.0]]);
    E.panel(g, 14, 118, 140, 56, { tab: 'YES OR NO' });
    E.noul(g, 26, 128, 116, 0.09);
    E.panel(g, 162, 96, 154, 78, { tab: 'RATE IT' });
    E.score(g, 190, 110, 118, ['nothing formed', 'parts listed', 'receiver named', 'already built'], 1.6);
  } },
  mailroom: { tall: false, draw(g) {
    const { floor } = E.room(g, 'wall');
    E.label(g, 'MAIL AND PAPER', 10, 8, { dot: true });
    const slots = E.pigeonholes(g, 150, 30, ['ACCOUNTING', 'LEGAL', 'THE BIN'], { fill: [3, 1, 5], lit: 1 });
    const dub = E.actor(g, 'dub', { x: 120, y: floor, scale: 2, pose: 'pointUp', talk: false });
    E.envelope(g, dub.hands.r[0] - 6, dub.hands.r[1] - 10, {});
    E.envelope(g, 20, 40, { scale: 2 }); E.envelope(g, 52, 40, { scale: 2, color: C.clay }); E.envelope(g, 84, 48, { scale: 2, open: true, letter: true });
    E.papers(g, 60, floor, 14);
    E.actor(g, 'doug', { x: 28, y: floor, scale: 2, pose: 'hold', talk: false });
    E.newspaper(g, 222, 90, 88, 60, { title: 'NEWS', date: 'JULY 1958' });
    E.book(g, 170, 104, { title: 'RULES', color: C.navy });
  } },
  history: { tall: false, draw(g) {
    const { floor } = E.room(g, 'wall');
    E.label(g, 'MACHINES AND WEATHER', 10, 8, { dot: true });
    E.perceptron(g, 58, floor - 70, { eye: 'left', out: 'left', active: true });
    E.engine(g, 124, floor, { smoke: 1 });
    E.coal(g, 240, floor, 0.6);
    E.jar(g, 286, floor - 30, 0.45); E.coin(g, 280, floor - 2);
    E.stopwatch(g, 228, 34, { p: 0.3 });
    E.snow(g, { amount: 0.5 });
  } },
  things: { tall: false, draw(g) {
    E.room(g, 'dots');
    E.label(g, 'THINGS', 10, 8, { dot: true });
    E.thumbs(g, 10, 24, 3, 2, { tags: ['PICK ONE', 'YES OR NO', 'RATE IT'] });
    ['inbox', 'bank', 'card', 'calc', 'calendar', 'lock', 'flag', 'building', 'shop'].forEach((k, i) => E.icon(g, k, 12 + i * 22, 96));
    for (let i = 0; i < 12; i++) E.photo(g, 12 + (i % 6) * 15, 122 + Math.floor(i / 6) * 12, i);
    E.faceIcon(g, 120, 136, { mood: 'annoyed' }); E.faceIcon(g, 152, 136, { mood: 'happy' });
    E.chart(g, 176, 118, 60, 40, [0.05, 0.08, 0.1, 0.2, 0.45, 0.8, 1], {});
    E.calendar(g, 248, 118, '1958');
    const d = E.actor(g, 'dub', { x: 200, y: 88, scale: 2, talk: false }); E.coat(g, d);
    E.panel(g, 232, 20, 84, 60, { tab: 'BANDS' }); E.meter(g, 240, 42, 68, { lit: 'check', value: 0.59 });
  } },
  everyday: { tall: false, draw(g) {
    E.room(g, 'dots');
    E.label(g, 'EVERYDAY AND HISTORY', 10, 8, { dot: true });
    const b = E.bicycle(g, 40, 92, { spin: 1 });
    E.actor(g, 'learner', { x: 34, y: 88, scale: 1, talk: false, reach: { r: b.bars, l: b.bars } });
    ['horse', 'dog', 'fish', 'bird', 'car'].forEach((k, i) => { E.icon(g, k, 80 + i * 24, 70); g.textIn(k.toUpperCase(), 76 + i * 24, 86, 24, 8, C.cream, 'label'); });
    E.loom(g, 216, 22, { p: g.t * 2, woven: 0.7 });
    E.pbjar(g, 30, 162, { knife: 'in' }); E.pbjar(g, 66, 162, { knife: 'whole', lid: false }); E.bread(g, 90, 138, { spread: 0.6 });
    E.knife(g, 122, 150, {});
    E.projector(g, 150, 164, { beam: [204, 112, 152] });
  } },
  talk: { tall: false, draw(g) {
    E.room(g, 'dots');
    E.label(g, 'CHAT', 10, 8, { dot: true });
    E.chat(g, 20, 24, 170, 120, [{ who: 'you', text: 'Which desk does this letter go to?' }, { who: 'ai', text: 'Great question! Let us look at the letter together. It mentions an invoice, which suggests...' }]);
    const a = E.actor(g, 'shop', { x: 230, y: 150, scale: 2, talk: false });
    g.textIn('SHOPKEEPER', 200, 154, 60, 8, C.cream, 'label');
  } },
  'wide-layout': { tall: false, draw(g) {
    const { floor } = E.room(g, 'office');
    E.label(g, 'SECTION 02 / UNIX', 10, 8, { dot: true });
    E.pdp(g, 150, floor - 62, { label: 'MINI' });
    const d = E.actor(g, 'dennis', { x: 118, y: floor, scale: 2, pose: 'point', talk: false, reach: { r: [150, floor - 44] } });
    E.actor(g, 'doug', { x: 44, y: floor, scale: 2, pose: 'hips', talk: false });
    E.say(g, 'Dennis', 'Everything is a *file*. Programs pass text to each other.', 196, 24, 118, { to: [d.head[0] + 12, d.head[1] + 10] });
    E.pipe(g, 196, 96, ['ls', 'grep md', 'wc -l']);
    E.caption(g, 'Small tools, joined by pipes.');
  } },
  'tall-layout': { tall: true, draw(g) {
    const { floor } = E.room(g, 'library');
    E.label(g, 'ICM / 01', 14, 30, { dot: true });
    E.tree(g, 30, 60, ['workspace/', '  CLAUDE.md', '  stages/', '    01_voice/', '    02_words/'], { highlight: 1 });
    E.actor(g, 'doug', { x: 90, y: floor, scale: 2, pose: 'pointUp', talk: false });
    E.caption(g, 'every folder *says its job.*');
    guides(g);
  } },
  music: { tall: false, draw(g) {
    const { floor } = E.room(g, 'hall');
    E.label(g, 'MUSIC / THE HALL', 36, 14, { dot: true });
    E.orchestra(g, 196, floor - 6, { play: true, guess: true, lit: 4 });
    const top = E.podium(g, 72, floor);
    const d = E.actor(g, 'doug', { x: 72, y: top, scale: 2, pose: 'pointUp', flip: true, talk: false });
    E.instrument(g, 'baton', d.hands.r[0], d.hands.r[1], { angle: -1.1 });
    E.stand(g, 100, floor, { lit: false });
  } },
  'music-parts': { tall: false, draw(g) {
    E.room(g, 'dots');
    E.label(g, 'MUSIC / SCORE, PARTS, INSTRUMENTS', 10, 8, { dot: true });
    E.sheet(g, 10, 24, 124, 104, { title: 'FULL SCORE', staves: 6, names: ['VLN I', 'VLN II', 'FL', 'OB', 'HN', 'TIMP'], letter: 'C', letterAt: [0, 2], lit: 'letter' });
    E.sheet(g, 146, 24, 100, 44, { title: 'OBOE 2', staves: 1, letter: 'C', letterAt: [0, 1], marks: [[0, 'dolce']] });
    E.sheet(g, 146, 76, 100, 40, { title: 'WRITING', staves: 2, progress: (g.t * 0.5) % 1 });
    E.stand(g, 24, 170); E.metronome(g, 58, 170); E.podium(g, 96, 170);
    E.instrument(g, 'violin', 132, 170); E.instrument(g, 'oboe', 150, 170); E.instrument(g, 'flute', 164, 150, { angle: -0.25 });
    E.instrument(g, 'horn', 212, 150); E.instrument(g, 'timpani', 250, 170, { mallets: true }); E.note(g, 282, 150); E.note(g, 292, 144, { color: C.rose });
    ['stand', 'metronome', 'podium', 'violin', 'oboe', 'flute', 'horn', 'timpani', 'note'].forEach((n, i) => g.textIn(n, [10, 44, 82, 118, 142, 162, 198, 236, 276][i], 172, 34, 8, C.cream, 'label', { align: 'left', pad: 0 }));
  } },
  map: { tall: false, draw(g) {
    E.room(g, 'dots');
    const home = [13, 10], far = [[5, 5], [22, 6], [20, 15], [6, 15]];
    const m = E.hexmap(g, -6, -4, { seed: 7,
      reveal: (c, r) => {
        const d = Math.hypot(c - home[0], (r - home[1]) * 1.15);
        if (d < 4) return 1;
        if (d < 5.5) return 1 - (d - 4) / 1.5;
        return far.some(([fc, fr]) => Math.hypot(c - fc, (r - fr) * 1.15) < 2.2) ? 1 : 0;
      },
      roads: [[13, 10, 5, 5], [13, 10, 22, 6]], cities: [[13, 10]],
      crack: [[246, 118], [254, 124], [250, 131], [258, 138], [254, 146]], stitches: 2 });
    const at = (c, r) => m.at(c, r);
    E.unit(g, 'slinger', ...at(15, 11)); E.unit(g, 'enemy', ...at(16, 12)); E.unit(g, 'scout', ...at(11, 8)); E.unit(g, 'settler', ...at(12, 12));
    E.label(g, 'HEXMAP: FOG, ROADS, CITY, UNITS, A CRACK', 10, 8, { dot: true });
  } },
  strategy: { tall: false, draw(g) {
    E.room(g, 'dots');
    E.label(g, 'EUREKA / TECH TREE / VICTORY / BELL / NEW CAST', 10, 6, { dot: true });
    E.eureka(g, 10, 20, { tech: 'ARCHERY', how: 'A SLINGER WON A FIGHT', drop: 1 });
    E.techtree(g, 150, 22, [
      { id: 'pot', label: 'POTTERY', c: 0, r: 0, state: 'done' },
      { id: 'arch', label: 'ARCHERY', c: 1, r: 0, from: ['pot'], state: 'boost' },
      { id: 'writ', label: 'WRITING', c: 1, r: 1, from: ['pot'], state: 'open' },
      { id: 'math', label: 'MATHS', c: 2, r: 1, from: ['writ'], state: 'locked' },
    ], { dx: 58, w: 48 });
    E.victory(g, 24, 86, { gap: 34, lit: 0 });
    E.bell(g, 236, 70, 76, 36, { band: 0.35, noise: true, ruler: true });
    ['herb', 'geoff', 'john'].forEach((w, i) => E.actor(g, w, { x: 212 + i * 36, y: 176, scale: 2, talk: false }));
    E.city(g, 30, 150); E.city(g, 60, 150, { name: 'HOME' });
    ['scout', 'slinger', 'warrior', 'settler', 'enemy'].forEach((k, i) => E.unit(g, k, 100 + i * 16, 150));
  } },
  studio: { tall: false, draw(g) {  // the animation studio: voice first, the exposure sheet, the storyboard, the sweatbox
    const { floor, screen } = E.room(g, 'screening');
    E.label(g, 'THE ANIMATION STUDIO: ROOM SCREENING, MIC, XSHEET, STORYBOARD', 10, 4, { dot: true });
    const [sx, sy, sw, sh] = screen;
    E.storyboard(g, sx + 8, sy + 8, { cols: 4, rows: 2, pw: 26, ph: 18, shown: 7, lit: 5 });
    E.mic(g, 28, floor, { on: true });
    E.actor(g, 'doug', { x: 58, y: floor, scale: 2, pose: 'present', talk: false });
    E.xsheet(g, 246, 24, 64, 120, { dial: ['S', 'O', '', 'TH', 'I', 'S', '', 'W', 'H', 'O', 'LE', ''], start: 1, action: ['DOUG', '', '', 'POINTS'], progress: 1, lit: 3 });
  } },
  looks: { tall: false, overlay: true, draw(g) {  // one picture, three looks, seams between (looks.js, _shared/desk.md)
    const ctx = g.photo.ctx, M = Looks.modern, B = Looks.blueprint, a = Desk.seam(700, { phase: 1 }), b = Desk.seam(1300, { phase: 2.5 });
    ctx.save(); b.path(ctx, 'right'); ctx.clip();
    B.bg(ctx); B.sheet(ctx); B.box(ctx, 1600, 440, 212, 172, { icon: 'film', name: 'render', num: '05' }); B.dim(ctx, 1494, 1706, 300, '212', { down: 50 });
    B.titleBlock(ctx, 1326, 858, 556, 176, { title: 'LOOKS.JS', drawn: 'Example', checked: 'Learner', date: '2026-09-29', dwg: 'EDB-LOOKS', scale: '1:1', sheet: '1 OF 1' });
    ctx.restore();
    ctx.save(); a.path(ctx, 'right'); ctx.clip(); b.path(ctx, 'left'); ctx.clip();
    M.bg(ctx, 1); M.title(ctx, ['Same picture, ', 'any look'], 1000, 170, { size: 42 });
    M.card(ctx, 1000, 470, 224, 228, { icon: 'code-xml', name: 'Scene', sub: 'scene.js', num: '04', grad: M.grads[3], lit: 1 });
    M.host(ctx, 880, 960, { T: 1 }); M.caption(ctx, 'Looks.modern', 12, 1000, 1000);
    ctx.restore();
    a.draw(ctx, '#E8A860', { to: '#FF7A59', t: 1 }); b.draw(ctx, '#FF7A59', { to: '#8FD3FF', t: 1 });
    E.room(g, 'dots');
    g.clip = { art: a.left, photo: '' };
    E.label(g, 'LOOKS: PIXEL / MODERN / BLUEPRINT', 10, 8, { dot: true });
    ['mic', 'captions', 'clapper', 'code', 'film'].forEach((k, i) => {
      const x = 14 + i * 20, y = 40;
      g.px.rect(x - 3, y - 3, 19, 19, C.wine); g.px.rectb(x - 4, y - 4, 21, 21, C.ink);
      E.icon(g, k, x, y + (k === 'captions' || k === 'clapper' ? 1 : k === 'code' ? 2 : 0), { shadow: true });
    });
    E.actor(g, 'doug', { x: 40, y: 150, scale: 2, pose: 'present', talk: false });
  } },
  screens: { tall: false, overlay: true, draw(g) {  // desk.js: real screens under, the cast on top (_shared/desk.md)
    const D = Desk, ctx = g.photo.ctx;
    D.wallpaper(ctx);
    const c = D.win(ctx, 36, 30, 1848, 1020, { title: 'workspace' });
    const list = [['stages', true], ['stages/01_voice', true], ['stages/01_voice/CONTEXT.md', false], ['stages/02_words', true],
      ['videos', true], ['CLAUDE.md', false], ['CONTEXT.md', false]];
    const rows = D.rows(list, { open: { stages: 1, 'stages/01_voice': 1 }, sel: 'stages/01_voice/CONTEXT.md' });
    D.tree(ctx, c.x, c.y, 372, c.h, rows, { root: 'workspace', split: 520, outline: ['01_voice: get the take right'] });
    const ed = D.editor(ctx, 409, c.y, 1475, 440, { tabs: [{ name: 'CONTEXT.md', hint: 'stages\\01_voice' }, { name: 'scene.js' }],
      crumb: 'stages  ›  01_voice  ›  CONTEXT.md', lines: ['# 01_voice: get the take right', '', '**Plan first, with the person.** Who it is for, the one idea, the real screens.', '**Output:** `01_voice/voice.*`'] });
    D.editor(ctx, 1150, 170, 700, 260, { tabs: [{ name: 'scene.js' }], lines: ["const E = Eduba, D = Desk; // the kits", "E.spot(g, ed.line(2), S('plan'), { chip: 'PLAN' });", 'if (t > 4.5) return 12;'] });
    D.bar(ctx, 409, 472, 1475, { time: 27.5, duration: 633.36, marks: [0.2, 25.9, 51.8, 120, 300, 480], label: 'mail' });
    D.terminal(ctx, 409, 530, 1475, 520, [{ t0: -9, cmd: 'python anim.py real demo run "python anim.py status" --as status', out: ['video      01_voice   02_transcript', 'demo       done       done', 'run   status: 2 lines'] }], 1, { bottom: 866 });
    const rp = D.rowPoint(rows, 'stages/01_voice/CONTEXT.md', c.x, c.y);
    D.pointer(ctx, rp[0], rp[1], { click: 0.35 });
    g.under = true;
    E.label(g, 'REAL SCREENS: DESK.JS UNDER, THE CAST ON TOP', 90, 1, { dot: true });
    E.spot(g, ed.line(2, 0, 34), 0, { chip: 'E.SPOT' });
    E.host(g, 'doug', { pose: 'point' });
    E.say(g, 'Doug', 'E.host: Doug in the band, saying the words being spoken (E.speech).', 74, 146, 234, { to: [45, 125] });
  } },
  'tall-ideas': { tall: true, draw(g) {
    E.room(g, 'dots');
    E.label(g, 'IDEAS / TALL', 14, 30, { dot: true });
    E.pipe(g, 90, 58, ['cat notes', 'grep todo', 'wc -l']);
    E.tokens(g, 14, 150, ['The', ' folder', ' is', ' the', ' agent'], { w: 150, window: [1, 4] });
    E.model(g, 68, 150, { thinking: true });
    E.caption(g, 'small tools, *one job each.*');
    guides(g);
  } },
};
// Where the Shorts / TikTok app UI covers the frame (board only).
function guides(g) {
  const s = g.safe;
  for (let x = 0; x < g.W; x += 3) { g.px.pset(x, s.y, C.green); g.px.pset(x, s.y + s.h, C.green); }
  for (let y = s.y; y < s.y + s.h; y += 3) g.px.pset(s.x + s.w, y, C.green);
}

const page = PAGES[new URLSearchParams(location.search).get('page') || 'cast'];
const stage = document.getElementById('stage');
stage.dataset.width = page.tall ? 1080 : 1920; stage.dataset.height = page.tall ? 1920 : 1080;
E.frame({ overlay: !!page.overlay, draw: page.draw });
window.GALLERY_PAGES = Object.keys(PAGES);
