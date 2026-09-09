/* ==========================================================================
   pointer.js — spotlight · tilt card · magnetic buttons
   ========================================================================== */
(() => {
  const k = window.kiddy;
  const { $, $$ } = k;
  const canHover = matchMedia('(hover: hover)').matches;

  /* ---------- inverting spotlight ---------- */
  const spot = $('#spotlight');
  const Spot = { on: false, tx: innerWidth / 2, ty: innerHeight / 2, x: innerWidth / 2, y: innerHeight / 2, raf: null };
  const spotLoop = () => {
    Spot.raf = requestAnimationFrame(() => {
      Spot.x += (Spot.tx - Spot.x) * 0.16;
      Spot.y += (Spot.ty - Spot.y) * 0.16;
      spot.style.translate = `${Spot.x}px ${Spot.y}px`;
      Spot.raf = null;
      if (Spot.on && Math.abs(Spot.tx - Spot.x) + Math.abs(Spot.ty - Spot.y) > 0.3) spotLoop();
    });
  };
  addEventListener('pointermove', e => {
    Spot.tx = e.clientX; Spot.ty = e.clientY;
    if (Spot.on && !Spot.raf) spotLoop();
  }, { passive: true });
  const setSpot = on => {
    Spot.on = on;
    spot.classList.toggle('on', on);
    $('#spot-toggle').checked = on;
    if (on) { Spot.x = Spot.tx; Spot.y = Spot.ty; spotLoop(); }
  };
  $('#spot-toggle').addEventListener('change', e => setSpot(e.target.checked));
  $('#spot-size').addEventListener('input', e => spot.style.setProperty('--size', `${e.target.value}px`));
  if (!canHover) { $('#spot-toggle').disabled = true; }
  k.spotlight = setSpot;

  /* ---------- 3D tilt with glare ---------- */
  const tilt = $('#tilt');
  const setTilt = (px, py) => {
    tilt.style.setProperty('--rx', `${(0.5 - py) * 18}deg`);
    tilt.style.setProperty('--ry', `${(px - 0.5) * 18}deg`);
    tilt.style.setProperty('--gx', `${px * 100}%`);
    tilt.style.setProperty('--gy', `${py * 100}%`);
  };
  tilt.addEventListener('pointermove', e => {
    const r = tilt.getBoundingClientRect();
    tilt.classList.remove('settle');
    setTilt(k.clamp((e.clientX - r.left) / r.width, 0, 1), k.clamp((e.clientY - r.top) / r.height, 0, 1));
  });
  tilt.addEventListener('pointerleave', () => { tilt.classList.add('settle'); setTilt(0.5, 0.5); });

  /* ---------- magnetic buttons ---------- */
  $$('.magnet-zone').forEach(zone => {
    const btn = $('.magnet', zone);
    zone.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      btn.classList.remove('release');
      btn.style.translate = `${dx * 0.4}px ${dy * 0.4}px`;
    });
    zone.addEventListener('pointerleave', () => {
      btn.classList.add('release');
      btn.style.translate = '0 0';
    });
    btn.addEventListener('click', () => k.toast('✨ magnetic'));
  });
})();
