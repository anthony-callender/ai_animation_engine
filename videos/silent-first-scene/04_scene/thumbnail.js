// Thumbnails, one per ?v=. `python anim.py thumbnail <slug>` shoots them into 05_render/ at 1280x720.
// Say what the title says in 4 or 5 huge words, one amber word, one character with a feeling, one clear contrast.
const E = Eduba, C = E.C;
const BIG = { font: 'Pixelify Sans', size: 64 }, MID = { font: 'Pixelify Sans', size: 32 };

const THUMBS = {
  1: (g) => {
    E.room(g, 'dots');
    E.plate(g, 'THE TITLE IN *FOUR WORDS*', 160, 6, { align: 'center', role: BIG, w: 300 });
    E.actor(g, 'dub', { x: 250, y: 172, scale: 4, talk: false, pose: 'cheer', face: 'happy' });
  },
};
window.THUMBS = Object.keys(THUMBS);
const v = new URLSearchParams(location.search).get('v') || '1';
E.frame({ step: 0, draw: (g) => THUMBS[v](g) });
