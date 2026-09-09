/* ==========================================================================
   app.js — shared plumbing: scroll dispatcher, theme flip, toast, copy buttons
   Everything hangs off `window.kiddy` so the other scripts (and you, in the
   console) can reach it.
   ========================================================================== */
window.kiddy = window.kiddy || {};

(() => {
  const k = window.kiddy;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  k.$ = $; k.$$ = $$;

  k.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  k.clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /* 0..1 how far down the document we are */
  k.progress = () => {
    const el = document.documentElement;
    const max = el.scrollHeight - el.clientHeight;
    return max > 0 ? k.clamp(el.scrollTop / max, 0, 1) : 0;
  };

  /* one rAF-coalesced scroll listener that fans out to whoever asks */
  const scrollFns = new Set();
  k.onScroll = fn => { scrollFns.add(fn); return () => scrollFns.delete(fn); };
  let ticking = false;
  const dispatch = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const p = k.progress();
      scrollFns.forEach(fn => fn(p));
    });
  };
  addEventListener('scroll', dispatch, { passive: true });
  addEventListener('resize', dispatch, { passive: true });

  /* ---------- feature detection → classes the CSS can key off ---------- */
  const html = document.documentElement;
  if (!CSS.supports('animation-timeline: scroll()')) {
    html.classList.add('no-sda');
    k.onScroll(p => html.style.setProperty('--scroll', p));   // JS fallback for the top bar
  }
  if (!document.startViewTransition) html.classList.add('no-vt');
  if (!HTMLElement.prototype.hasOwnProperty('popover')) html.classList.add('no-popover');

  /* ---------- toast ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  k.toast = (msg, ms = 2600) => {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
  };

  /* ---------- theme flip with a view transition ---------- */
  k.flipTheme = (x = innerWidth / 2, y = innerHeight / 2) => {
    const flip = () => {
      html.classList.toggle('light');
      try { localStorage.setItem('kiddy-theme', html.classList.contains('light') ? 'light' : 'dark'); } catch (e) {}
    };
    if (!document.startViewTransition || k.reduced) return flip();
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(flip).ready.then(() => {
      html.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
      );
    });
  };
  $$('#theme-toggle, .theme-btn').forEach(btn =>
    btn.addEventListener('click', e => k.flipTheme(e.clientX || undefined, e.clientY || undefined)));

  /* ---------- copy buttons on code blocks ---------- */
  $$('.copy').forEach(btn => btn.addEventListener('click', async () => {
    const code = $('code', btn.parentElement)?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(code);
      btn.textContent = 'Copied';
    } catch (e) {
      btn.textContent = 'Nope';
    }
    setTimeout(() => (btn.textContent = 'Copy'), 1400);
  }));

  /* ---------- highlight the nav link for the section in view ---------- */
  const links = $$('.nav-links a');
  const byId = Object.fromEntries(links.map(a => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => a.removeAttribute('aria-current'));
      byId[en.target.id]?.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  $$('section[id]').forEach(s => io.observe(s));
})();
