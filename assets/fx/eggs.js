/* ==========================================================================
   eggs.js — konami · console banner + API · designMode · print
   ========================================================================== */
(() => {
  const k = window.kiddy;
  const { $, $$ } = k;

  /* ---------- barrel roll + disco ---------- */
  k.barrelRoll = () => {
    if (k.reduced) return k.toast('🎢 barrel roll skipped (reduced motion)');
    const body = document.body;
    body.style.transformOrigin = `50% ${scrollY + innerHeight / 2}px`;   // pivot on what you can see
    body.animate(
      [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      { duration: 1200, easing: 'cubic-bezier(0.6, 0, 0.4, 1)' }
    );
  };
  k.disco = (ms = 2400) => {
    const root = document.documentElement;
    const start = performance.now();
    const tick = now => {
      const t = now - start;
      if (t > ms) { root.style.removeProperty('--hue'); k.Fav?.draw(); return; }
      root.style.setProperty('--hue', String((t / 4) % 360));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  /* ---------- konami ---------- */
  const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  const keys = $$('#konami-keys kbd');
  let typed = [];
  const paint = () => keys.forEach((kbd, i) => kbd.classList.toggle('hit', i < typed.length));
  addEventListener('keydown', e => {
    if (e.target.matches('input, textarea') || document.designMode === 'on') return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    typed.push(key);
    // keep only a prefix of the code, so wrong keys reset the progress
    while (typed.length && typed.join() !== CODE.slice(0, typed.length).join()) typed.shift();
    paint();
    if (typed.length === CODE.length) {
      typed = [];
      k.toast('🎮 KONAMI');
      k.barrelRoll();
      k.disco();
      setTimeout(paint, 1200);
    }
  });
  $('#konami-cheat').addEventListener('click', () => { k.barrelRoll(); k.disco(); });

  /* ---------- designMode ---------- */
  const editBtn = $('#edit-toggle');
  k.edit = (on = document.designMode !== 'on') => {
    document.designMode = on ? 'on' : 'off';
    document.body.classList.toggle('editing', on);
    editBtn.textContent = on ? 'Stop editing' : 'Edit this page';
    k.toast(on ? '✏️ the whole page is editable now · Esc to stop' : 'saved nothing, as promised');
  };
  editBtn.addEventListener('click', () => k.edit());
  $('#edit-done').addEventListener('click', () => k.edit(false));
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.designMode === 'on') k.edit(false); });

  /* ---------- print ---------- */
  $('#print-btn').addEventListener('click', () => window.print());

  /* ---------- console ---------- */
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#60e0b0';
  console.log(
    '%c SCRIPT KIDDY %c you found the console. everything on the page is reachable from here:',
    `background:${accent};color:#0a0c10;font-weight:700;padding:4px 8px;border-radius:4px`,
    'color:#8d97a8'
  );
  console.log(
    '%ckiddy.barrelRoll()   kiddy.disco()   kiddy.title("hello")   kiddy.favicon("🍕")   kiddy.edit()   kiddy.spotlight(true)   kiddy.flipTheme()',
    'font-family:ui-monospace,Menlo,monospace;color:#e9edf3'
  );
})();
