/* Filter + paginate the resource list on /links. */
(function () {
  'use strict';

  const PER_PAGE = 8;

  function init() {
    const buttons    = Array.from(document.querySelectorAll('.links-filter .chip'));
    const allRows    = Array.from(document.querySelectorAll('.link-row'));
    const pagination = document.getElementById('pagination');
    if (!buttons.length || !allRows.length || !pagination) return;

    let visible     = allRows;
    let currentPage = 1;

    function render() {
      allRows.forEach((row) => { row.style.display = 'none'; });
      visible
        .slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
        .forEach((row) => { row.style.display = ''; });
    }

    function makeBtn(label, page, opts) {
      opts = opts || {};
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pagination__btn' + (opts.active ? ' is-active' : '') + (opts.disabled ? ' is-disabled' : '');
      btn.textContent = label;
      btn.disabled = !!opts.disabled;
      btn.addEventListener('click', () => {
        if (opts.disabled || page === currentPage) return;
        currentPage = page;
        render();
        buildPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      li.appendChild(btn);
      return li;
    }

    function buildPagination() {
      pagination.innerHTML = '';
      const total = Math.ceil(visible.length / PER_PAGE);
      if (total <= 1) return;
      pagination.appendChild(makeBtn('‹', currentPage - 1, { disabled: currentPage === 1 }));
      for (let i = 1; i <= total; i++) {
        pagination.appendChild(makeBtn(String(i), i, { active: i === currentPage }));
      }
      pagination.appendChild(makeBtn('›', currentPage + 1, { disabled: currentPage === total }));
    }

    function applyFilter(category) {
      visible = (category === 'all')
        ? allRows
        : allRows.filter((row) => row.dataset.category.split(' ').includes(category));
      currentPage = 1;
      render();
      buildPagination();
    }

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        applyFilter(btn.dataset.category);
      });
    });

    applyFilter('all');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
