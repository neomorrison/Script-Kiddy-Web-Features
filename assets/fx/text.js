/* ==========================================================================
   text.js — scramble/decode · glitch toggle · word-splitting for the
   CSS scroll-driven reader (the splitting is the only JS in that trick)
   ========================================================================== */
(() => {
  const k = window.kiddy;
  const { $, $$ } = k;

  /* ---------- scramble / decode ---------- */
  const GLYPHS = '!<>-_\\/[]{}=+*^?#%&@01';
  const running = new WeakMap();
  k.scramble = (el, text, duration = 1200) => {
    if (k.reduced) { el.textContent = text; return; }
    const chars = [...text];
    const reveal = chars.map((_, i) => (i / chars.length) * duration * 0.55 + Math.random() * duration * 0.45);
    const start = performance.now();
    const token = Symbol();
    running.set(el, token);
    const tick = now => {
      if (running.get(el) !== token) return;        // a newer run took over
      const t = now - start;
      el.textContent = chars.map((ch, i) =>
        ch === ' ' ? ' ' : t >= reveal[i] ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]
      ).join('');
      if (t < duration) requestAnimationFrame(tick);
      else el.textContent = text;
    };
    requestAnimationFrame(tick);
  };

  const hero = $('#hero-title');
  const runHero = () => k.scramble(hero, hero.dataset.text, 1500);
  runHero();
  $('#hero-rescramble').addEventListener('click', runHero);

  const target = $('#scramble-target'), input = $('#scramble-input');
  const runDemo = () => {
    const text = (input.value.trim() || 'ACCESS GRANTED').toUpperCase();
    target.textContent = text;
    k.scramble(target, text, 1100);
  };
  $('#scramble-run').addEventListener('click', runDemo);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') runDemo(); });

  /* ---------- glitch on/off ---------- */
  $('#glitch-toggle').addEventListener('change', e => $('#glitch').classList.toggle('paused', !e.target.checked));

  /* ---------- reader: wrap each word so CSS can animate it individually ---------- */
  const reader = $('#reader');
  const words = reader.textContent.trim().split(/\s+/);
  reader.textContent = '';
  words.forEach((w, i) => {
    const span = document.createElement('span');
    span.className = 'w';
    span.textContent = w;
    reader.appendChild(span);
    if (i < words.length - 1) reader.appendChild(document.createTextNode(' '));
  });
})();
