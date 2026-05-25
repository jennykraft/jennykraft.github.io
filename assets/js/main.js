/* Site-wide behavior: nav drawer, back-to-top, TOC drawer + sidebar, active scroll-spy. */
(function () {
  'use strict';

  /* ─── Mobile nav drawer ─────────────────────────────── */
  function initNavToggle() {
    const toggle = document.querySelector('[data-nav-toggle]');
    const nav    = document.querySelector('[data-nav]');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    // Close on link click (mobile)
    nav.addEventListener('click', (e) => {
      if (e.target.matches('a')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ─── Back-to-top button ────────────────────────────── */
  function initBackToTop() {
    const btn = document.getElementById('backToTopBtn');
    if (!btn) return;

    const onScroll = () => {
      btn.classList.toggle('is-visible', window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ─── TOC sidebar (desktop) + drawer (mobile) ───────── */
  function initToc() {
    const sourceList = document.querySelector('.post__content > ul:first-of-type');
    if (!sourceList || sourceList.children.length === 0) return;

    // Mirror into desktop sidebar
    const sidebar = document.getElementById('postSidebarToc');
    if (sidebar) sidebar.innerHTML = sourceList.outerHTML;

    // Mirror into mobile drawer
    const drawer       = document.getElementById('tocDrawer');
    const drawerInner  = document.getElementById('tocDrawerContent');
    const drawerToggle = document.getElementById('tocToggleBtn');
    const drawerClose  = drawer ? drawer.querySelector('[data-toc-close]') : null;

    if (drawer && drawerInner && drawerToggle) {
      drawerInner.innerHTML = sourceList.outerHTML;
      drawerToggle.hidden = false;
      drawerToggle.classList.add('is-visible');

      drawerToggle.addEventListener('click', () => {
        const open = drawer.classList.toggle('is-open');
        drawerToggle.setAttribute('aria-expanded', String(open));
      });

      if (drawerClose) {
        drawerClose.addEventListener('click', () => {
          drawer.classList.remove('is-open');
          drawerToggle.setAttribute('aria-expanded', 'false');
        });
      }

      drawer.addEventListener('click', (e) => {
        if (e.target.matches('a')) {
          drawer.classList.remove('is-open');
          drawerToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  /* ─── Fiverr ratings carousel ───────────────────────── */
  function initFiverrRatings() {
    const root = document.querySelector('[data-fiverr-ratings]');
    if (!root) return;
    const track = root.querySelector('[data-fiverr-track]');
    const prev  = root.querySelector('[data-dir="prev"]');
    const next  = root.querySelector('[data-dir="next"]');
    const dots  = root.querySelector('[data-fiverr-dots]');
    if (!track) return;

    const slides = Array.from(track.children);
    if (slides.length === 0) return;

    // Build dots
    if (dots) {
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'fiverr-ratings__dot';
        dot.setAttribute('aria-label', `Go to rating ${i + 1}`);
        dot.addEventListener('click', () => scrollToIndex(i));
        dots.appendChild(dot);
      });
    }

    function currentIndex() {
      const center = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      slides.forEach((s, i) => {
        const mid = s.offsetLeft + s.offsetWidth / 2;
        const d = Math.abs(mid - center);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      return best;
    }

    function scrollToIndex(i) {
      const target = slides[Math.max(0, Math.min(slides.length - 1, i))];
      if (!target) return;
      const left = target.offsetLeft - (track.clientWidth - target.offsetWidth) / 2;
      track.scrollTo({ left, behavior: 'smooth' });
    }

    function updateUI() {
      const i = currentIndex();
      slides.forEach((s, idx) => s.classList.toggle('is-active', idx === i));
      if (dots) {
        Array.from(dots.children).forEach((d, idx) => {
          d.classList.toggle('is-active', idx === i);
        });
      }
      if (prev) prev.disabled = track.scrollLeft <= 1;
      if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
    }

    if (prev) prev.addEventListener('click', () => scrollToIndex(currentIndex() - 1));
    if (next) next.addEventListener('click', () => scrollToIndex(currentIndex() + 1));

    let raf = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateUI);
    }, { passive: true });
    window.addEventListener('resize', updateUI);
    window.addEventListener('load', updateUI);

    updateUI();
  }

  /* ─── Fiverr stat counters (count up on scroll into view) ─ */
  function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (counters.length === 0) return;

    function animate(el) {
      const target = parseInt(el.getAttribute('data-target'), 10) || 0;
      const duration = 1400;
      const start = performance.now();
      function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased).toString();
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = target.toString();
      }
      requestAnimationFrame(tick);
    }

    if (!('IntersectionObserver' in window)) {
      counters.forEach(animate);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach((el) => io.observe(el));
  }

  /* ─── Init ──────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initNavToggle();
      initBackToTop();
      initToc();
      initFiverrRatings();
      initCounters();
    });
  } else {
    initNavToggle();
    initBackToTop();
    initToc();
    initFiverrRatings();
    initCounters();
  }
})();
