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

/* ==========================================================================
   custom cursor — ring · crosshair · trail · emoji · svg (css only)
   ========================================================================== */
(() => {
  const k = window.kiddy;
  const { $, $$ } = k;
  const canHover = matchMedia('(hover: hover)').matches;
  const html = document.documentElement;
  const layer = $('#cursor-layer');
  const dot = $('.cur-dot', layer), ring = $('.cur-ring', layer);
  const lineX = $('.cur-x', layer), lineY = $('.cur-y', layer), label = $('.cur-label', layer);
  const emoji = $('.cur-emoji', layer), canvas = $('.cur-canvas', layer);
  const readout = $('#cursor-readout');
  const INTERACTIVE = 'a, button, summary, label, input, select, textarea, [popovertarget], .tilt';
  const DOM_MODES = ['ring', 'crosshair', 'trail', 'emoji'];

  const Cur = { mode: 'off', x: innerWidth / 2, y: innerHeight / 2, rx: 0, ry: 0, angle: -45, points: [], raf: null };
  let dpr = 1;
  const sizeCanvas = () => { dpr = devicePixelRatio || 1; canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; };
  addEventListener('resize', sizeCanvas, { passive: true });
  sizeCanvas();

  const accent = () => getComputedStyle(html).getPropertyValue('--accent').trim() || '#60e0b0';

  /* the only per-frame work: ring lag and trail fade */
  const loop = () => {
    Cur.raf = requestAnimationFrame(() => {
      Cur.raf = null;
      let again = false;
      if (Cur.mode === 'ring') {
        Cur.rx += (Cur.x - Cur.rx) * 0.2;
        Cur.ry += (Cur.y - Cur.ry) * 0.2;
        ring.style.translate = `${Cur.rx}px ${Cur.ry}px`;
        again = Math.abs(Cur.x - Cur.rx) + Math.abs(Cur.y - Cur.ry) > 0.2;
      } else if (Cur.mode === 'trail') {
        const ctx = canvas.getContext('2d'), now = performance.now(), life = 550;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        Cur.points = Cur.points.filter(p => now - p.t < life);
        ctx.fillStyle = '#60e0b0'; ctx.fillStyle = accent();
        for (const p of Cur.points) {
          const a = 1 - (now - p.t) / life;                       // 1 = fresh, 0 = gone
          ctx.globalAlpha = a * 0.85;
          ctx.beginPath(); ctx.arc(p.x * dpr, p.y * dpr, (1.5 + 9 * a) * dpr, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        again = Cur.points.length > 0;
      }
      if (again) loop();
    });
  };

  addEventListener('pointermove', e => {
    if (!DOM_MODES.includes(Cur.mode)) return;
    const dx = e.clientX - Cur.x, dy = e.clientY - Cur.y;
    Cur.x = Math.round(e.clientX); Cur.y = Math.round(e.clientY);
    layer.classList.remove('hidden');
    dot.style.translate = `${Cur.x}px ${Cur.y}px`;
    readout.textContent = `${Cur.x}, ${Cur.y}`;
    switch (Cur.mode) {
      case 'ring':
        layer.classList.toggle('hover', !!(e.target.closest && e.target.closest(INTERACTIVE)));
        if (!Cur.raf) loop();
        break;
      case 'crosshair': {
        lineX.style.translate = `0 ${Cur.y}px`;
        lineY.style.translate = `${Cur.x}px 0`;
        const lx = Cur.x > innerWidth - 150 ? Cur.x - 132 : Cur.x + 14;    // keep the label on screen
        const ly = Cur.y > innerHeight - 50 ? Cur.y - 34 : Cur.y + 14;
        label.style.translate = `${lx}px ${ly}px`;
        label.textContent = `x ${Cur.x}  y ${Cur.y}`;
        break;
      }
      case 'trail': {
        // interpolate so a fast flick still leaves a continuous comet
        const dist = Math.hypot(dx, dy), steps = Math.min(8, Math.ceil(dist / 6)), now = performance.now();
        for (let i = 1; i <= steps; i++) Cur.points.push({ x: Cur.x - dx * (1 - i / steps), y: Cur.y - dy * (1 - i / steps), t: now });
        if (!Cur.raf) loop();
        break;
      }
      case 'emoji':
        if (Math.hypot(dx, dy) > 2) Cur.angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        emoji.style.translate = `${Cur.x}px ${Cur.y}px`;
        emoji.style.rotate = `${Cur.angle + 45}deg`;                // 🚀 points up-right at rest
        break;
    }
  }, { passive: true });
  addEventListener('pointerdown', () => layer.classList.add('down'));
  addEventListener('pointerup', () => layer.classList.remove('down'));
  document.addEventListener('mouseout', e => { if (!e.relatedTarget) layer.classList.add('hidden'); });

  k.cursor = mode => {
    if (!canHover && mode !== 'off') mode = 'off';
    if (!['off', 'svg', ...DOM_MODES].includes(mode)) mode = 'off';
    Cur.mode = mode;
    const dom = DOM_MODES.includes(mode);
    layer.dataset.mode = mode;
    layer.classList.toggle('on', dom);
    layer.classList.remove('hover', 'down');
    html.classList.toggle('custom-cursor', dom);
    html.classList.toggle('cursor-svg', mode === 'svg');
    const radio = $(`input[name="cursor-mode"][value="${mode}"]`);
    if (radio) radio.checked = true;
    // start everything at the current pointer position so nothing flashes at 0,0
    Cur.rx = Cur.x; Cur.ry = Cur.y; Cur.points = [];
    dot.style.translate = ring.style.translate = emoji.style.translate = `${Cur.x}px ${Cur.y}px`;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    if (mode === 'emoji') emoji.textContent = $('#cursor-emoji').value.trim() || '🚀';
    readout.textContent = mode === 'off' ? 'pick a mode' : mode === 'svg' ? 'that arrow is an SVG data URL' : 'move the mouse';
  };
  $$('input[name="cursor-mode"]').forEach(r => r.addEventListener('change', e => k.cursor(e.target.value)));
  $('#cursor-emoji').addEventListener('input', e => { if (e.target.value.trim()) k.cursor('emoji'); });
  if (!canHover) $$('input[name="cursor-mode"]').forEach(r => { if (r.value !== 'off') r.disabled = true; });
})();
