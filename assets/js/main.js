/*
 * Site-wide behaviour. Each feature is a small init function that looks for
 * its own data-* hooks in the markup and does nothing if they are absent.
 *
 *   data-nav / data-nav-toggle        mobile navigation drawer
 *   data-back-to-top                  floating back-to-top button
 *   data-toc-*                        post table of contents (sidebar + drawer)
 *   data-carousel                     image carousel
 *   data-counter="<number>"           count-up animation when scrolled into view
 *   data-welcome-pen                  pen button that writes "welcome!" (hero)
 */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Toggles `is-open` on a panel and keeps aria-expanded on its button in sync. */
  function bindDisclosure(button, panel) {
    const setOpen = (open) => {
      panel.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
    };
    button.addEventListener('click', () => setOpen(!panel.classList.contains('is-open')));
    // Close after following a link inside the panel.
    panel.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });
    return setOpen;
  }

  /* ─── Mobile navigation ─────────────────────────────── */
  function initNav() {
    const toggle = document.querySelector('[data-nav-toggle]');
    const nav = document.querySelector('[data-nav]');
    if (toggle && nav) bindDisclosure(toggle, nav);
  }

  /* ─── Back to top ───────────────────────────────────── */
  function initBackToTop() {
    const button = document.querySelector('[data-back-to-top]');
    if (!button) return;

    const update = () => button.classList.toggle('is-visible', window.scrollY > 400);
    window.addEventListener('scroll', update, { passive: true });
    update();

    button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ─── Table of contents ─────────────────────────────── */
  // Copies kramdown's generated TOC (#markdown-toc) into the desktop sidebar
  // and the mobile drawer. Posts without a TOC keep both hidden.
  function initToc() {
    const source = document.getElementById('markdown-toc');
    if (!source) return;

    document.querySelectorAll('[data-toc-target]').forEach((target) => {
      const copy = source.cloneNode(true);
      copy.removeAttribute('id');
      target.appendChild(copy);
    });

    const sidebar = document.querySelector('[data-toc-sidebar]');
    if (sidebar) sidebar.hidden = false;

    const toggle = document.querySelector('[data-toc-toggle]');
    const drawer = document.querySelector('[data-toc-drawer]');
    if (!toggle || !drawer) return;

    toggle.hidden = false;
    toggle.classList.add('is-visible');
    const setOpen = bindDisclosure(toggle, drawer);

    const close = drawer.querySelector('[data-toc-close]');
    if (close) close.addEventListener('click', () => setOpen(false));
  }

  /* ─── Carousel ──────────────────────────────────────── */
  function initCarousel(root) {
    const track = root.querySelector('[data-carousel-track]');
    const prev = root.querySelector('[data-carousel-prev]');
    const next = root.querySelector('[data-carousel-next]');
    const dotsContainer = root.querySelector('[data-carousel-dots]');
    const slides = track ? Array.from(track.children) : [];
    if (slides.length === 0) return;

    const dots = slides.map((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel__dot';
      dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
      dot.addEventListener('click', () => scrollToIndex(index));
      if (dotsContainer) dotsContainer.appendChild(dot);
      return dot;
    });

    function centeredIndex() {
      const center = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let bestDistance = Infinity;
      slides.forEach((slide, index) => {
        const distance = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center);
        if (distance < bestDistance) { bestDistance = distance; best = index; }
      });
      return best;
    }

    function scrollToIndex(index) {
      const slide = slides[Math.max(0, Math.min(slides.length - 1, index))];
      const left = slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2;
      track.scrollTo({ left, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }

    function update() {
      const active = centeredIndex();
      slides.forEach((slide, index) => slide.classList.toggle('is-active', index === active));
      dots.forEach((dot, index) => dot.classList.toggle('is-active', index === active));
      if (prev) prev.disabled = track.scrollLeft <= 1;
      if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
    }

    if (prev) prev.addEventListener('click', () => scrollToIndex(centeredIndex() - 1));
    if (next) next.addEventListener('click', () => scrollToIndex(centeredIndex() + 1));

    let frame = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('load', update);
    update();
  }

  function initCarousels() {
    document.querySelectorAll('[data-carousel]').forEach(initCarousel);
  }

  /* ─── Count-up numbers ──────────────────────────────── */
  // The final value is already in the HTML, so the number is correct without JS.
  function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (counters.length === 0 || prefersReducedMotion || !('IntersectionObserver' in window)) return;

    const DURATION_MS = 1400;

    function animate(element) {
      const target = parseInt(element.dataset.counter, 10) || 0;
      const start = performance.now();
      function tick(now) {
        const progress = Math.min(1, (now - start) / DURATION_MS);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        element.textContent = String(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    counters.forEach((element) => {
      element.textContent = '0';
      observer.observe(element);
    });
  }

  /* ─── Welcome pen ───────────────────────────────────── */
  // Clicking the pen makes it write "welcome!": it moves to the start of the word,
  // its nib follows the ink line while the ink is revealed, and finally it is laid
  // down to the right of the word. Clicking again picks it up and writes again.
  // The word SVG (_scripts/ink.py) is split into parts; each reveal path carries
  // --reveal-shift and pathLength in a shared 0–1000 scale along the whole word.
  const PEN = {
    moveIn: 600,            // ms to the start of the word
    write: 3000,            // ms to write the word
    pause: 200,             // ms at the end of the word
    layDown: 700,           // ms to lay the pen down
    nibTip: [0.006, 0.994], // nib position inside the icon (fraction of its box)
    baseline: 58,           // word baseline in the SVG's viewBox units
    samplesPerSecond: 90,   // positions on the pen's writing path
  };

  function initWelcomePen() {
    document.querySelectorAll('[data-welcome-pen]').forEach((root) => {
      const button = root.querySelector('[data-welcome-pen-button]');
      const word = root.querySelector('.welcome-pen__word');
      const svg = word && word.querySelector('svg');
      if (!button || !svg) return;

      const parts = Array.from(svg.querySelectorAll('.ink__reveal')).map((path) => ({
        path,
        shift: parseFloat(path.style.getPropertyValue('--reveal-shift')) || 0,
        length: parseFloat(path.getAttribute('pathLength')),
      }));
      let running = [];
      let restingPose = 'none'; // the pen's transform after the last writing

      const ends = (part) => {
        const length = part.path.getTotalLength();
        return [part.path.getPointAtLength(0), part.path.getPointAtLength(length)];
      };

      // Point on the whole word at `units` (0–1000), in the root's pixel space.
      // Between strokes (e.g. before the "!"), the pen glides through the air.
      function pointAt(units, origin, scale) {
        const index = Math.max(0, parts.findLastIndex((p) => p.shift <= units));
        const part = parts[index];
        const next = parts[index + 1];
        const end = part.shift + part.length;
        let point;
        if (units > end && next && next.shift > end) {
          const t = (units - end) / (next.shift - end);
          const from = ends(part)[1];
          const to = ends(next)[0];
          point = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
        } else {
          const local = Math.min(1, Math.max(0, (units - part.shift) / part.length));
          point = part.path.getPointAtLength(local * part.path.getTotalLength());
        }
        return [origin[0] + point.x * scale, origin[1] + point.y * scale];
      }

      function write() {
        running.forEach((animation) => animation.cancel());
        root.classList.add('is-writing');
        if (prefersReducedMotion) return; // CSS shows the finished word

        // Layout positions (offset*, unaffected by transforms)
        const icon = button.querySelector('svg');
        const iconSize = parseFloat(getComputedStyle(icon).width);
        const penCenter = [button.offsetLeft + button.offsetWidth / 2, button.offsetTop + button.offsetHeight / 2];
        const nib = [
          penCenter[0] - iconSize / 2 + iconSize * PEN.nibTip[0],
          penCenter[1] - iconSize / 2 + iconSize * PEN.nibTip[1],
        ];
        const scale = word.offsetWidth / svg.viewBox.baseVal.width;
        const origin = [word.offsetLeft, word.offsetTop];
        const nibAt = (units) => {
          const [x, y] = pointAt(units, origin, scale);
          return `translate(${x - nib[0]}px, ${y - nib[1]}px)`;
        };

        // Laid down: turned flat (nib towards the word), resting on the baseline after the word.
        const penLength = iconSize * Math.SQRT2;
        const lying = [
          word.offsetLeft + word.offsetWidth + 6 + penLength / 2,
          origin[1] + PEN.baseline * scale - 4,
        ];
        const laidDown = `translate(${lying[0] - penCenter[0]}px, ${lying[1] - penCenter[1]}px) rotate(45deg)`;

        const total = PEN.moveIn + PEN.write + PEN.pause + PEN.layDown;
        const at = (ms) => ms / total;
        const steps = Math.round((PEN.write / 1000) * PEN.samplesPerSecond);
        const keyframes = [{ offset: 0, transform: restingPose, easing: 'ease-in-out' }];
        for (let i = 0; i <= steps; i++) {
          keyframes.push({ offset: at(PEN.moveIn + (PEN.write * i) / steps), transform: nibAt((1000 * i) / steps) });
        }
        keyframes.push({ offset: at(PEN.moveIn + PEN.write + PEN.pause), transform: nibAt(1000), easing: 'ease-in-out' });
        keyframes.push({ offset: 1, transform: laidDown });
        restingPose = laidDown;

        running = [button.animate(keyframes, { duration: total, fill: 'forwards' })].concat(parts.map((p) => p.path.animate(
          [{ strokeDashoffset: `${1000 + p.shift}px` }, { strokeDashoffset: `${p.shift}px` }],
          { duration: PEN.write, delay: PEN.moveIn, fill: 'both', easing: 'linear' },
        )));
      }

      button.addEventListener('click', write);
    });
  }

  /* ─── Scroll animations (AOS, only loaded on pages with show_aos) ─ */
  function initAos() {
    if (window.AOS) window.AOS.init({ duration: 600, easing: 'ease-out', once: true, offset: 40 });
  }

  /* ─── Boot ──────────────────────────────────────────── */
  function init() {
    [initNav, initBackToTop, initToc, initCarousels, initCounters, initWelcomePen, initAos].forEach((fn) => fn());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
