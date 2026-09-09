/* ==========================================================================
   chrome.js — effects that live OUTSIDE the page:
   tab title · favicon · address bar · visibility · tab census
   ========================================================================== */
(() => {
  const k = window.kiddy;
  const { $, $$ } = k;
  const NBSP = '\u00A0';

  /* the fake browser in the hero mirrors everything below */
  const mockTitle = $('#mock-title');
  const mockFavicon = $('#mock-favicon');
  const mockUrl = $('#mock-url');
  const renderMockUrl = () => {
    const host = location.host || 'file://';
    const path = location.pathname.split('/').filter(Boolean).pop() || '';
    const hash = location.hash;
    mockUrl.innerHTML = `<b>${host}</b>/${path}${hash ? `<b>${hash}</b>` : ''}`;
  };
  renderMockUrl();
  addEventListener('hashchange', renderMockUrl);

  /* =====================================================================
     1. TITLE
     ===================================================================== */
  const Title = {
    base: 'SCRIPT KIDDY',
    mode: 'marquee',
    timer: null,
    i: 0,
    paused: false,
    preview: $('#title-preview'),

    modes: {
      marquee: {
        every: 180,
        frame(i, base) {
          const s = `| ${base}${NBSP}`;
          const j = i % s.length;
          return s.slice(j) + s.slice(0, j);
        },
      },
      typewriter: {
        every: 110,
        frame(i, base) {
          const L = base.length, hold = 8;
          const cycle = L + hold + L + hold;
          const j = i % cycle;
          let n;
          if (j < L) n = j + 1;                       // typing
          else if (j < L + hold) n = L;               // holding
          else if (j < L + hold + L) n = L - (j - L - hold) - 1;   // deleting
          else n = 0;                                 // empty pause
          const caret = Math.floor(i / 3) % 2 ? '_' : NBSP;
          return (base.slice(0, n) || NBSP) + caret;
        },
      },
      wave: {
        every: 140,
        frame(i, base) {
          return [...base].map((ch, idx) => ((idx + i) % 6 < 3 ? ch.toUpperCase() : ch.toLowerCase())).join('');
        },
      },
      scroll: {
        every: 0,
        frame(i, base) {
          const p = k.progress(), n = 10, f = Math.round(p * n);
          return '▓'.repeat(f) + '░'.repeat(n - f) + ` ${Math.round(p * 100)}%`;
        },
      },
      static: { every: 0, frame: (i, base) => base },
    },

    render(str) {
      document.title = str;
      mockTitle.textContent = str;
      this.preview.textContent = str;
    },
    tick() {
      if (this.paused) return;
      this.render(this.modes[this.mode].frame(this.i++, this.base));
    },
    set(mode) {
      clearInterval(this.timer);
      this.mode = mode;
      this.i = 0;
      const m = this.modes[mode];
      if (m.every) this.timer = setInterval(() => this.tick(), m.every);
      this.tick();
    },
    setBase(text) {
      this.base = (text || '').trim() || 'SCRIPT KIDDY';
      this.i = 0;
      this.tick();
    },
    pause(withTitle) {
      this.paused = true;
      if (withTitle) { document.title = withTitle; mockTitle.textContent = withTitle; }
    },
    resume() { this.paused = false; this.tick(); },
  };

  $$('input[name="title-mode"]').forEach(r => r.addEventListener('change', e => Title.set(e.target.value)));
  $('#title-text').addEventListener('input', e => Title.setBase(e.target.value));
  k.onScroll(() => { if (Title.mode === 'scroll') Title.tick(); });

  if (k.reduced) {
    // respect reduced motion: don't auto-animate the tab, leave the option available
    $('input[name="title-mode"][value="static"]').checked = true;
    Title.set('static');
  } else {
    Title.set('marquee');
  }

  /* =====================================================================
     2. FAVICON
     ===================================================================== */
  const Fav = {
    link: $('#favicon'),
    canvas: $('#favicon-preview'),
    mode: 'clock',
    unread: 0,
    emoji: '🦄',
    pointer: { x: 0.5, y: 0.5 },      // 0..1 across the window, for the eyes
    asleep: false,
    lastPush: 0,
    readout: $('#favicon-readout'),

    accent() {
      const raw = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      return raw || '#60e0b0';
    },
    ink() { return document.documentElement.classList.contains('light') ? '#ffffff' : '#0a0c10'; },

    draw() {
      const c = this.canvas, ctx = c.getContext('2d');
      const ac = this.accent();
      ctx.clearRect(0, 0, 64, 64);
      const fill = (col, fallback) => { ctx.fillStyle = fallback; ctx.fillStyle = col; };
      const stroke = (col, fallback) => { ctx.strokeStyle = fallback; ctx.strokeStyle = col; };

      if (this.asleep) {
        // a dimmed sleepy face while the tab is hidden
        fill('#3a4150', '#3a4150');
        rounded(ctx, 0, 0, 64, 64, 14); ctx.fill();
        stroke('#0a0c10', '#0a0c10'); ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(16, 28); ctx.lineTo(28, 28); ctx.moveTo(36, 28); ctx.lineTo(48, 28); ctx.stroke();
        fill('#e9edf3', '#e9edf3'); ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('z', 46, 14);
        return this.push();
      }

      const p = k.progress();
      switch (this.mode) {
        case 'clock': {
          fill(ac, '#60e0b0');
          ctx.beginPath(); ctx.arc(32, 32, 30, 0, Math.PI * 2); ctx.fill();
          stroke(this.ink(), '#0a0c10');
          ctx.lineWidth = 3; ctx.lineCap = 'round';
          for (let t = 0; t < 12; t++) {
            const a = (t / 12) * Math.PI * 2, r1 = t % 3 ? 26 : 23;
            ctx.beginPath();
            ctx.moveTo(32 + r1 * Math.cos(a), 32 + r1 * Math.sin(a));
            ctx.lineTo(32 + 28 * Math.cos(a), 32 + 28 * Math.sin(a));
            ctx.stroke();
          }
          const a = p * Math.PI * 2 - Math.PI / 2;
          ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(32, 32); ctx.lineTo(32 + 21 * Math.cos(a), 32 + 21 * Math.sin(a)); ctx.stroke();
          fill(this.ink(), '#0a0c10');
          ctx.beginPath(); ctx.arc(32, 32, 4.5, 0, Math.PI * 2); ctx.fill();
          this.readout.textContent = `hand at ${Math.round(p * 360)}° · scroll to turn it`;
          break;
        }
        case 'ring': {
          fill('#1a1f2a', '#1a1f2a');
          rounded(ctx, 0, 0, 64, 64, 16); ctx.fill();
          ctx.lineWidth = 9; ctx.lineCap = 'round';
          stroke('#3a4150', '#3a4150');
          ctx.beginPath(); ctx.arc(32, 32, 22, 0, Math.PI * 2); ctx.stroke();
          stroke(ac, '#60e0b0');
          ctx.beginPath(); ctx.arc(32, 32, 22, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
          fill(ac, '#60e0b0');
          ctx.beginPath(); ctx.arc(32, 32, 6, 0, Math.PI * 2); ctx.fill();
          this.readout.textContent = `${Math.round(p * 100)}% read · scroll to fill the ring`;
          break;
        }
        case 'eyes': {
          fill(ac, '#60e0b0');
          rounded(ctx, 0, 0, 64, 64, 18); ctx.fill();
          const dx = (this.pointer.x - 0.5) * 2, dy = (this.pointer.y - 0.5) * 2;   // -1..1
          [[20, 32], [44, 32]].forEach(([ex, ey]) => {
            fill('#ffffff', '#ffffff');
            ctx.beginPath(); ctx.ellipse(ex, ey, 10, 13, 0, 0, Math.PI * 2); ctx.fill();
            fill('#0a0c10', '#0a0c10');
            ctx.beginPath(); ctx.arc(ex + dx * 4.5, ey + dy * 6.5, 5, 0, Math.PI * 2); ctx.fill();
          });
          this.readout.textContent = 'move the mouse · the favicon is watching';
          break;
        }
        case 'badge': {
          fill(ac, '#60e0b0');
          rounded(ctx, 0, 0, 64, 64, 16); ctx.fill();
          fill(this.ink(), '#0a0c10');
          ctx.font = 'bold 38px ui-monospace, Menlo, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('K', 30, 36);
          if (this.unread > 0) {
            const label = this.unread > 99 ? '99+' : String(this.unread);
            const w = 14 + label.length * 9;
            fill('#ff3b5c', '#ff3b5c');
            rounded(ctx, 64 - w - 2, 2, w, 24, 12); ctx.fill();
            fill('#ffffff', '#ffffff');
            ctx.font = 'bold 17px ui-monospace, Menlo, monospace';
            ctx.fillText(label, 64 - w / 2 - 2, 15);
          }
          this.readout.textContent = this.unread ? `${this.unread} unread · click +1 again` : 'click “+1 unread” to grow the badge';
          break;
        }
        case 'emoji': {
          ctx.font = '52px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(this.emoji, 32, 36);
          this.readout.textContent = 'type any emoji in the box · rendered straight onto the canvas';
          break;
        }
      }
      this.push();
    },

    /* swap the <link> href, throttled: browsers don't need 60 favicons a second */
    push(force) {
      const now = performance.now();
      if (!force && now - this.lastPush < 50) { clearTimeout(this._late); this._late = setTimeout(() => this.push(true), 60); return; }
      this.lastPush = now;
      const url = this.canvas.toDataURL('image/png');
      this.link.href = url;
      mockFavicon.src = url;
    },
    set(mode) { this.mode = mode; this.draw(); },
    sleep() { this.asleep = true; this.draw(); },
    wake() { this.asleep = false; this.draw(); },
  };

  function rounded(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  $$('input[name="favicon-mode"]').forEach(r => r.addEventListener('change', e => Fav.set(e.target.value)));
  $('#badge-bump').addEventListener('click', () => {
    Fav.unread++;
    $('input[name="favicon-mode"][value="badge"]').checked = true;
    Fav.set('badge');
  });
  $('#emoji-input').addEventListener('input', e => {
    const v = [...e.target.value.trim()][0];
    if (!v) return;
    Fav.emoji = e.target.value.trim();
    $('input[name="favicon-mode"][value="emoji"]').checked = true;
    Fav.set('emoji');
  });
  k.onScroll(() => { if (Fav.mode === 'clock' || Fav.mode === 'ring') Fav.draw(); });
  let eyeRaf = null;
  addEventListener('pointermove', e => {
    Fav.pointer = { x: e.clientX / innerWidth, y: e.clientY / innerHeight };
    if (Fav.mode !== 'eyes' || eyeRaf) return;
    eyeRaf = requestAnimationFrame(() => { eyeRaf = null; Fav.draw(); });
  }, { passive: true });
  // accent hue changes (the :has() swatches, theme flips) should recolour the icon too
  $$('input[name="hue"]').forEach(r => r.addEventListener('change', () => requestAnimationFrame(() => Fav.draw())));
  $$('#theme-toggle, .theme-btn').forEach(b => b.addEventListener('click', () => setTimeout(() => Fav.draw(), 50)));
  Fav.draw();

  /* =====================================================================
     3. ADDRESS BAR
     ===================================================================== */
  const Url = {
    on: false,
    last: '',
    lastWrite: 0,
    preview: $('#url-preview'),
    base: location.pathname + location.search,

    bar(p) {
      const n = 10, f = Math.round(p * n);
      return `#[${'='.repeat(f)}${'-'.repeat(n - f)}]-${Math.round(p * 20) * 5}`;
    },
    update(p) {
      const s = this.bar(p);
      this.preview.textContent = s;
      if (!this.on || s === this.last) return;
      // Safari throws if replaceState is called >100× per 30s; be polite and only write changes
      const now = performance.now();
      if (now - this.lastWrite < 150) { clearTimeout(this._late); this._late = setTimeout(() => this.update(k.progress()), 160); return; }
      this.lastWrite = now;
      this.last = s;
      try { history.replaceState(history.state, '', this.base + s); } catch (e) { location.hash = s; }
      renderMockUrl();
    },
    set(on) {
      this.on = on;
      if (on) { this.last = ''; this.update(k.progress()); }
      else {
        this.last = '';
        try { history.replaceState(history.state, '', this.base); } catch (e) { location.hash = ''; }
        renderMockUrl();
      }
    },
  };
  $('#url-toggle').addEventListener('change', e => Url.set(e.target.checked));
  k.onScroll(p => Url.update(p));
  Url.update(k.progress());

  /* =====================================================================
     4. VISIBILITY — notice when the user leaves and comes back
     ===================================================================== */
  const Away = { count: 0, longest: 0, leftAt: 0 };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      Away.leftAt = Date.now();
      Title.pause('👀 psst… come back');
      Fav.sleep();
    } else {
      const secs = (Date.now() - Away.leftAt) / 1000;
      Away.count++;
      Away.longest = Math.max(Away.longest, secs);
      $('#away-count').textContent = Away.count;
      $('#away-longest').textContent = fmtSecs(Away.longest);
      Title.resume();
      Fav.wake();
      k.toast(`👋 welcome back — you were gone ${fmtSecs(secs)}`);
    }
  });
  const fmtSecs = s => (s < 60 ? `${s.toFixed(s < 10 ? 1 : 0)}s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`);

  /* =====================================================================
     5. TAB CENSUS — count open tabs of this page with BroadcastChannel
     ===================================================================== */
  const Census = (() => {
    const out = { count: 1, id: '', supported: 'BroadcastChannel' in window };
    const nodes = [$('#tab-count'), $('#tab-count-nav')];
    const render = () => nodes.forEach(n => (n.textContent = out.count));
    if (!out.supported) { $('#tab-id').textContent = 'no BroadcastChannel here'; return out; }

    const me = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)).slice(0, 8);
    out.id = me;
    $('#tab-id').textContent = me;
    const bc = new BroadcastChannel('kiddy-census');
    const peers = new Map();
    const say = (type, extra = {}) => bc.postMessage({ type, id: me, ...extra });
    const recount = () => {
      const now = Date.now();
      for (const [id, t] of peers) if (now - t > 8000) peers.delete(id);
      out.count = peers.size + 1;
      render();
    };
    bc.onmessage = ({ data }) => {
      if (!data || data.id === me) return;
      if (data.type === 'bye') peers.delete(data.id);
      else peers.set(data.id, Date.now());
      if (data.type === 'hello' || data.type === 'ping') say('here');
      if (data.type === 'wave') k.toast(`👋 tab ${data.id} waved at you`);
      recount();
    };
    say('hello');
    setInterval(() => { say('ping'); recount(); }, 3000);
    addEventListener('pagehide', () => say('bye'));
    out.wave = () => { say('wave'); k.toast(out.count > 1 ? `waved at ${out.count - 1} other tab${out.count > 2 ? 's' : ''}` : 'nobody else is here yet — open another tab'); };
    return out;
  })();
  $('#open-tab').addEventListener('click', () => window.open(location.href.split('#')[0], '_blank'));
  $('#ping-tabs').addEventListener('click', () => Census.wave ? Census.wave() : k.toast('BroadcastChannel is not available here'));

  /* expose for the console + other scripts */
  Object.assign(k, {
    Title, Fav, Url, Census,
    title: text => { Title.setBase(text); $('#title-text').value = Title.base; },
    favicon: emoji => { $('#emoji-input').value = emoji; $('#emoji-input').dispatchEvent(new Event('input')); },
  });
})();
