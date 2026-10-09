// Thumbnails, one per ?v=. `python anim.py thumbnail <slug>` shoots them into 05_render/ at 1280x720.
// Say what the title says in 3 to 5 huge lowercase words, one accent word, one drawing with a feeling.
const L = Line;
const BIG = { size: 150, weight: 700 };

const THUMBS = {
  1: (g) => {
    L.room(g);
    L.coder(g, 210, 150, { s: 1.5, sip: 1, steam: true });
    L.text(g, 'the title,\n*four words*', 14, 30, { role: BIG });
  },
};
window.THUMBS = Object.keys(THUMBS);
const v = new URLSearchParams(location.search).get('v') || '1';
L.frame({ step: 0, boil: 0, draw: (g) => THUMBS[v](g) });
