/* Dentix. landing — interactions */
(() => {
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const hdr = $('.hdr');

  /* ---------- smooth scroll (Lenis, native fallback) ---------- */
  let lenis = null;
  function initLenis() {
    if (reduce || !window.Lenis || matchMedia('(pointer: coarse)').matches) return;
    lenis = new Lenis({ duration: 1.15, easing: t => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  let navLock = 0;
  function scrollToTarget(el) {
    navLock = performance.now() + 1700;
    hdr.classList.remove('is-hidden');
    const off = el.id === 'top' ? 0 : -(hdr.offsetHeight - 1);
    if (lenis) { navLock = Infinity; lenis.scrollTo(el, { offset: off, duration: 1.4, onComplete: () => { navLock = performance.now() + 250; } }); }
    else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + off, behavior: reduce ? 'auto' : 'smooth' });
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#') { e.preventDefault(); return; }
    const el = id === '#top' ? document.body : $(id);
    if (!el) return;
    e.preventDefault();
    closeMenu();
    scrollToTarget(id === '#top' ? $('#top') : el);
    history.replaceState(null, '', id);
  });

  /* ---------- header: glass on scroll, hide on fast scroll-down ---------- */
  let lastY = scrollY;
  function onScroll() {
    const y = scrollY;
    hdr.classList.toggle('is-scrolled', y > 24);
    if (!document.body.classList.contains('menu-open') && performance.now() > navLock) {
      if (y > lastY + 4 && y > 600) hdr.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 600) hdr.classList.remove('is-hidden');
    }
    lastY = y;
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* active nav link */
  const navLinks = $$('.nav a');
  const spy = new IntersectionObserver(es => {
    es.forEach(en => {
      if (!en.isIntersecting) return;
      navLinks.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['about', 'services', 'results', 'articles'].forEach(id => $('#' + id) && spy.observe($('#' + id)));

  /* ---------- mobile menu ---------- */
  const burger = $('.burger'), mnav = $('#mnav');
  function closeMenu() {
    if (!document.body.classList.contains('menu-open')) return;
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    mnav.setAttribute('aria-hidden', 'true');
    lenis && lenis.start();
  }
  burger.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    if (!open) return closeMenu();
    document.body.classList.add('menu-open');
    hdr.classList.remove('is-hidden');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    mnav.setAttribute('aria-hidden', 'false');
    lenis && lenis.stop();
  });
  addEventListener('keydown', e => e.key === 'Escape' && closeMenu());
  addEventListener('resize', () => innerWidth >= 1024 && closeMenu());

  /* ---------- count-up ---------- */
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = 1;
    const to = +el.dataset.count, dur = reduce ? 0 : 1800, t0 = performance.now();
    const tick = t => {
      const p = Math.min(1, (t - t0) / (dur || 1));
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    el.textContent = '0';
    requestAnimationFrame(tick);
  }

  /* ---------- scroll reveals ---------- */
  const io = new IntersectionObserver(es => {
    es.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      $$('[data-count]', en.target).forEach(countUp);
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
  $$('[data-reveal], .ftr__mark').forEach(el => io.observe(el));

  /* ---------- parallax (hero bg + process image) ---------- */
  const px = [
    { el: $('.hero__bg img'), box: $('.hero'), k: 0.18, mode: 'top' },
    { el: $('.proc__bg img'), box: $('.proc'), k: 0.08, mode: 'center' }
  ].filter(p => p.el);
  let ticking = false;
  function parallax() {
    ticking = false;
    const vh = innerHeight;
    px.forEach(p => {
      const r = p.box.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const d = p.mode === 'top' ? -r.top : (vh / 2 - (r.top + r.height / 2));
      p.el.style.translate = `0 ${(d * p.k).toFixed(1)}px`;
    });
  }
  if (!reduce) {
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }, { passive: true });
    parallax();
  }

  /* ---------- infinite loop carousel ---------- */
  function Carousel(root, nav) {
    const track = $('.car__track', root);
    const originals = [...track.children];
    const N = originals.length;
    const mk = () => originals.map(n => {
      const c = n.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.setAttribute('inert', '');
      return c;
    });
    track.prepend(...mk());
    track.append(...mk());
    let idx = N, busy = false, step = 0;
    const DUR = 700, EASE = 'cubic-bezier(.65,0,.35,1)';
    const measure = () => {
      const a = track.children[0].getBoundingClientRect(), b = track.children[1].getBoundingClientRect();
      step = b.left - a.left;
    };
    const place = (anim, extra = 0) => {
      track.style.transition = anim ? `transform ${DUR}ms ${EASE}` : 'none';
      track.style.transform = `translate3d(${-idx * step + extra}px,0,0)`;
    };
    const normalize = () => {
      if (idx >= 2 * N) idx -= N;
      else if (idx < N) idx += N;
      place(false);
    };
    track.addEventListener('transitionend', e => {
      if (e.target !== track) return;
      busy = false;
      normalize();
    });
    const go = dir => {
      if (busy) return;
      busy = true;
      idx += dir;
      place(!reduce);
      if (reduce) { busy = false; normalize(); }
      schedule();
    };

    /* autoplay: endless loop, pauses on hover / focus / drag / off-screen / hidden tab */
    const auto = root.hasAttribute('data-autoplay') && !reduce;
    let timer = 0, inView = false, hover = false, focus = false;
    function schedule() {
      clearTimeout(timer);
      if (!auto) return;
      timer = setTimeout(() => {
        if (inView && !hover && !focus && !dragging && !document.hidden) go(1);
        else schedule();
      }, 3200);
    }
    if (auto) {
      new IntersectionObserver(([en]) => { inView = en.intersectionRatio >= 0.25; if (inView) schedule(); }, { threshold: [0, 0.25] }).observe(root);
      root.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hover = true; });
      root.addEventListener('pointerleave', () => { hover = false; schedule(); });
      root.addEventListener('focusin', () => { focus = true; });
      root.addEventListener('focusout', () => { focus = false; schedule(); });
      document.addEventListener('visibilitychange', () => !document.hidden && schedule());
    }
    nav && $('[data-prev]', nav).addEventListener('click', () => go(-1));
    nav && $('[data-next]', nav).addEventListener('click', () => go(1));
    root.tabIndex = 0;
    root.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });

    /* drag / swipe */
    track.addEventListener('dragstart', e => e.preventDefault());
    $$('a, img', track).forEach(n => n.setAttribute('draggable', 'false'));
    let sx = 0, sy = 0, dx = 0, dragging = false, locked = null, moved = false;
    track.addEventListener('pointerdown', e => {
      if (busy || e.button !== 0) return;
      dragging = true; locked = null; moved = false;
      sx = e.clientX; sy = e.clientY; dx = 0;
    });
    addEventListener('pointermove', e => {
      if (!dragging) return;
      const mx = e.clientX - sx, my = e.clientY - sy;
      if (locked === null && (Math.abs(mx) > 6 || Math.abs(my) > 6)) {
        locked = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
        if (locked === 'x') { track.classList.add('is-drag'); try { track.setPointerCapture(e.pointerId); } catch (_) {} }
      }
      if (locked !== 'x') return;
      moved = true;
      dx = mx;
      place(false, dx);
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-drag');
      if (locked !== 'x') return;
      const th = Math.min(120, step * 0.18);
      if (dx < -th) { busy = true; idx += 1; place(true); }
      else if (dx > th) { busy = true; idx -= 1; place(true); }
      else place(true);
      schedule();
    };
    addEventListener('pointerup', end);
    addEventListener('pointercancel', end);
    track.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

    const ro = new ResizeObserver(() => { measure(); place(false); });
    ro.observe(root);
    measure(); place(false);
  }
  $$('[data-carousel]').forEach(root => Carousel(root, $(`[data-nav="${root.dataset.carousel}"]`)));

  /* ---------- RESULTS: swipeable card stack ---------- */
  const stack = $('.stack');
  const ba = $('.ba');
  const lb = $('#lb');
  if (stack) {
    const cards = [...stack.querySelectorAll('.rcard')];
    const N = cards.length;
    let busy = false;
    const front = () => cards.find(c => c.dataset.slot === '0');
    const wait = ms => new Promise(r => setTimeout(r, ms));
    // after the entrance fan, drop the stagger delays
    const mo = new MutationObserver(() => {
      if (ba.classList.contains('is-in')) { mo.disconnect(); setTimeout(() => ba.classList.add('is-ready'), 1300); }
    });
    mo.observe(ba, { attributes: true, attributeFilter: ['class'] });

    async function cycle(dir, fromX = 0, fromR = 0) {
      if (busy) return;
      busy = true;
      stack.classList.add('is-busy');
      const f = front();
      const w = stack.offsetWidth;
      // 1) top card flies out to the side (continuing from the drag position)
      f.classList.add('is-fly');
      f.style.transition = 'none';
      f.style.translate = `${fromX}px ${-Math.abs(fromX) * 0.04}px`;
      f.style.rotate = `${fromR}deg`;
      f.offsetWidth;
      const outMs = reduce ? 0 : 520;
      f.style.transition = `translate ${outMs}ms cubic-bezier(.33,.8,.36,1), rotate ${outMs}ms cubic-bezier(.33,.8,.36,1)`;
      f.style.translate = `${dir * (w * 0.92 + 40)}px -18px`;
      f.style.rotate = `${dir * 16}deg`;
      // the others move up one slot at the same time
      cards.forEach(c => { if (c !== f) c.dataset.slot = String(+c.dataset.slot - 1); });
      await wait(outMs);
      // 2) fully clear of the stack -> drop it underneath and glide into the last slot
      f.classList.remove('is-fly');
      f.classList.add('is-under');
      f.dataset.slot = String(N - 1);
      f.style.transition = '';
      f.style.translate = '';
      f.style.rotate = '';
      await wait(reduce ? 0 : 950);
      f.classList.remove('is-under');
      stack.classList.remove('is-busy');
      busy = false;
    }

    /* drag / swipe the top card */
    let sx = 0, sy = 0, dx = 0, down = false, axis = null, lastX = 0, lastT = 0, vx = 0;
    stack.addEventListener('dragstart', e => e.preventDefault());
    stack.addEventListener('pointerdown', e => {
      if (busy || e.button !== 0 || lb.classList.contains('is-open')) return;
      down = true; axis = null; dx = 0; vx = 0;
      sx = lastX = e.clientX; sy = e.clientY; lastT = performance.now();
    });
    addEventListener('pointermove', e => {
      if (!down) return;
      const mx = e.clientX - sx, my = e.clientY - sy;
      if (axis === null && (Math.abs(mx) > 6 || Math.abs(my) > 6)) {
        axis = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
        if (axis === 'x') {
          stack.classList.add('is-drag', 'is-busy');
          const f = front();
          f.classList.add('is-fly');
          f.style.transition = 'none';
          try { stack.setPointerCapture(e.pointerId); } catch (_) {}
        }
      }
      if (axis !== 'x') return;
      const t = performance.now();
      vx = (e.clientX - lastX) / Math.max(1, t - lastT);
      lastX = e.clientX; lastT = t;
      dx = mx;
      const f = front();
      f.style.translate = `${dx}px ${-Math.abs(dx) * 0.04}px`;
      f.style.rotate = `${dx * 0.045}deg`;
    });
    const release = () => {
      if (!down) return;
      down = false;
      stack.classList.remove('is-drag');
      if (axis !== 'x') { if (axis === null) openLB(); return; }
      const f = front();
      const proj = dx + vx * 180;
      if (Math.abs(proj) > Math.min(110, stack.offsetWidth * 0.25)) {
        cycle(proj > 0 ? 1 : -1, dx, dx * 0.045);
      } else {
        // not far enough: settle back smoothly
        f.style.transition = 'translate .6s cubic-bezier(.22,1,.36,1), rotate .6s cubic-bezier(.22,1,.36,1)';
        f.style.translate = '';
        f.style.rotate = '';
        setTimeout(() => { f.classList.remove('is-fly'); f.style.transition = ''; stack.classList.remove('is-busy'); }, 600);
      }
    };
    addEventListener('pointerup', release);
    addEventListener('pointercancel', () => { if (down) { axis = axis === 'x' ? 'x' : 'y'; dx = 0; vx = 0; release(); } });
    stack.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); cycle(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); cycle(-1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLB(); }
    });

    /* ---------- full-screen image viewer (morphs from the card) ---------- */
    const fig = $('.lb__fig', lb), big = $('img', fig), scrim = $('.lb__scrim', lb);
    let src = null, anim = null, open = false, lastFocus = null;
    const EASE = 'cubic-bezier(.65,0,.35,1)';
    const rectOf = el => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; };
    function target(img) {
      const pad = innerWidth < 640 ? 16 : 48, top = innerWidth < 640 ? 88 : 96;
      const ar = (img.naturalWidth || 4) / (img.naturalHeight || 3);
      let w = Math.min(innerWidth - pad * 2, 1280), h = w / ar;
      const maxH = innerHeight - top - pad;
      if (h > maxH) { h = maxH; w = h * ar; }
      return { left: (innerWidth - w) / 2, top: top + (maxH - h) / 2, width: w, height: h };
    }
    const px = r => ({ left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    const stopWheel = e => e.preventDefault();
    function openLB() {
      if (open || busy) return;
      const f = front();
      src = $('.rcard__img img', f);
      open = true;
      lastFocus = document.activeElement;
      big.src = src.currentSrc || src.src;
      big.alt = src.alt;
      big.style.objectPosition = getComputedStyle(src).objectPosition;
      const from = rectOf($('.rcard__img', f));
      const to = target(src);
      Object.assign(fig.style, px(to));
      lb.classList.add('is-open');
      lb.classList.remove('is-closing');
      lb.setAttribute('aria-hidden', 'false');
      src.style.visibility = 'hidden';
      lenis && lenis.stop();
      addEventListener('wheel', stopWheel, { passive: false });
      addEventListener('touchmove', stopWheel, { passive: false });
      const d = reduce ? 1 : 850;
      anim = fig.animate([
        { ...px(from), borderRadius: '36px 36px 0 0' },
        { ...px(to), borderRadius: '24px' }
      ], { duration: d, easing: EASE, fill: 'both' });
      big.animate([{ objectPosition: big.style.objectPosition }, { objectPosition: '50% 50%' }], { duration: d, easing: EASE, fill: 'both' });
      scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: d * 0.8, easing: 'cubic-bezier(.33,1,.68,1)', fill: 'both' });
      setTimeout(() => $('.lb__close', lb).focus({ preventScroll: true }), d * 0.5);
    }
    function closeLB() {
      if (!open) return;
      open = false;
      lb.classList.add('is-closing');
      const f = src.closest('.rcard');
      const cur = rectOf(fig);
      const to = rectOf($('.rcard__img', f));
      const d = reduce ? 1 : 750;
      fig.getAnimations().forEach(a => a.cancel());
      big.getAnimations().forEach(a => a.cancel());
      Object.assign(fig.style, px(cur));
      const a = fig.animate([
        { ...px(cur), borderRadius: '24px' },
        { ...px(to), borderRadius: '36px 36px 0 0' }
      ], { duration: d, easing: EASE, fill: 'both' });
      big.animate([{ objectPosition: '50% 50%' }, { objectPosition: getComputedStyle(src).objectPosition }], { duration: d, easing: EASE, fill: 'both' });
      scrim.getAnimations().forEach(x => x.cancel());
      scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: d * 0.9, easing: 'cubic-bezier(.32,0,.67,0)', fill: 'both' });
      a.finished.then(() => {
        if (open) return;
        src.style.visibility = '';
        lb.classList.remove('is-open', 'is-closing');
        lb.setAttribute('aria-hidden', 'true');
        fig.getAnimations().forEach(x => x.cancel());
        big.getAnimations().forEach(x => x.cancel());
        scrim.getAnimations().forEach(x => x.cancel());
        removeEventListener('wheel', stopWheel);
        removeEventListener('touchmove', stopWheel);
        lenis && lenis.start();
        lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
      });
    }
    lb.addEventListener('click', e => { if (e.target.closest('[data-lb-close], .lb__fig')) closeLB(); });
    addEventListener('keydown', e => {
      if (!open) return;
      if (e.key === 'Escape') closeLB();
      if (e.key === 'Tab') { e.preventDefault(); $('.lb__close', lb).focus(); }
    });
    addEventListener('resize', () => {
      if (!open) return;
      fig.getAnimations().forEach(a => a.cancel());
      Object.assign(fig.style, px(target(src)));
      fig.style.borderRadius = '24px';
    });
  }

  /* ---------- hero intro ---------- */
  let started = false;
  function start() {
    if (started) return;
    started = true;
    initLenis();
    const img = $('.hero__bg img');
    const go = () => requestAnimationFrame(() => requestAnimationFrame(() => {
      document.body.classList.remove('is-loading');
      document.body.classList.add('is-ready');
      setTimeout(() => {
        document.body.classList.add('hero-done');
        $$('.hero [data-count]').forEach(countUp);
      }, 1900);
    }));
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    const imgReady = img.complete ? Promise.resolve() : new Promise(r => { img.onload = img.onerror = r; });
    Promise.race([Promise.all([fontsReady, imgReady]), new Promise(r => setTimeout(r, 1500))]).then(go);
  }
  if (document.readyState === 'complete') start(); else addEventListener('load', start, { once: true });
  // safety: if load is slow, still start reveal sequence
  setTimeout(() => { if (!document.body.classList.contains('is-ready')) start(); }, 3000);
})();
