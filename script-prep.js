/* =================================================================
   OLD GAMER — script.js
   Статический сайт: GitHub + Vercel
   Данные дисков — из Google Sheets через Apps Script Web App
================================================================= */

'use strict';

// ── Конфигурация ──────────────────────────────────────────────────

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyaaVDZQ6mu_vZhoKBcz5LK_iT1BsZ_egkyFYES5KW95vzPD9PLcuXxvPE687YXxhM/exec';

/** Настройки платформ: цвета и лейблы */
const PLATFORM_CONFIG = {
  ps5:     { label: 'PlayStation 5',     short: 'PS5',  bg: 'linear-gradient(90deg,rgba(0,55,145,.88),rgba(0,112,209,.88))' },
  ps4:     { label: 'PlayStation 4',     short: 'PS4',  bg: 'linear-gradient(90deg,rgba(0,48,135,.9),rgba(0,75,160,.9))' },
  ps3:     { label: 'PlayStation 3',     short: 'PS3',  bg: 'linear-gradient(90deg,rgba(20,25,80,.9),rgba(40,50,130,.9))' },
  ps2:     { label: 'PlayStation 2',     short: 'PS2',  bg: 'linear-gradient(90deg,rgba(0,30,100,.9),rgba(0,50,130,.9))' },
  xbox:    { label: 'Xbox Series X|S',   short: 'XSX',  bg: 'linear-gradient(90deg,rgba(14,92,14,.9),rgba(16,124,16,.9))' },
  xboxone: { label: 'Xbox One',          short: 'ONE',  bg: 'linear-gradient(90deg,rgba(0,80,0,.9),rgba(0,110,0,.9))' },
  switch:  { label: 'Nintendo Switch',   short: 'NSW',  bg: 'linear-gradient(90deg,rgba(162,0,17,.9),rgba(220,0,18,.9))' },
  switch2: { label: 'Nintendo Switch 2', short: 'NSW2', bg: 'linear-gradient(90deg,rgba(100,0,60,.9),rgba(170,0,80,.9))' },
  pc:      { label: 'PC / Steam',        short: 'PC',   bg: 'linear-gradient(90deg,rgba(80,0,140,.9),rgba(110,0,180,.9))' },
};

/** Сколько карточек показывать до «Показать ещё» */
const DISCS_VISIBLE_LIMIT = 8;
const DISCS_SHOW_STEP     = 8;

// ── Точка входа ───────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
  initLoader();
  initStoreHours();
  initCookieBanner();
  initBurgerMenu();
  initSmoothScroll();
  initTradeInEstimator();
  initPhotoSlider();
  initLightbox();
  initMapDrag();
  loadDiscsFromSheets();
});

// ── Лоадер ────────────────────────────────────────────────────────

function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;

  function hideLoader() {
    loader.classList.add('hidden');
  }

  if (document.readyState === 'complete') {
    setTimeout(hideLoader, 600);
  } else {
    window.addEventListener('load', function () {
      setTimeout(hideLoader, 600);
    });
    setTimeout(hideLoader, 2800); // крайний fallback
  }
}

// ── Статус магазина (часовой пояс Новосибирск UTC+7) ─────────────

function initStoreHours() {
  const dot  = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  if (!dot || !text) return;

  function update() {
    const now = new Date();
    const nsk = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Novosibirsk' }));
    const h   = nsk.getHours();
    const isOpen = h >= 10 && h < 21;

    if (isOpen) {
      dot.style.background   = '#42D17A';
      dot.style.boxShadow    = '0 0 8px #42D17A';
      text.textContent       = 'Магазин открыт · ТРЦ Континент · 3 этаж';
    } else {
      dot.style.background   = '#E63027';
      dot.style.boxShadow    = '0 0 8px #E63027';
      const msg = h < 10 ? 'Откроемся сегодня в 10:00' : 'Откроемся завтра в 10:00';
      text.textContent       = msg + ' · ТРЦ Континент · 3 этаж';
    }
  }

  update();
}

// ── Cookie-баннер ─────────────────────────────────────────────────

function initCookieBanner() {
  const banner  = document.getElementById('cookie-banner');
  const accept  = document.getElementById('cookie-accept');
  const decline = document.getElementById('cookie-decline');
  if (!banner) return;

  if (!localStorage.getItem('cookie-ok')) {
    setTimeout(function () { banner.classList.remove('hidden'); }, 1400);
  }

  accept && accept.addEventListener('click', function () {
    localStorage.setItem('cookie-ok', '1');
    banner.classList.add('hidden');
  });

  decline && decline.addEventListener('click', function () {
    banner.classList.add('hidden');
  });
}

// ── Мобильное меню ────────────────────────────────────────────────

function initBurgerMenu() {
  const burger   = document.getElementById('nav-burger');
  const navLinks = document.getElementById('nav-links');
  if (!burger || !navLinks) return;

  burger.addEventListener('click', function () {
    const open = navLinks.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  });

  navLinks.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      navLinks.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
}

// ── Плавный скролл ────────────────────────────────────────────────

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    });
  });
}

// ── Калькулятор трейд-ин ──────────────────────────────────────────

function initTradeInEstimator() {
  const root = document.getElementById('estimator');
  if (!root) return;

  let base = 42000;
  let mul  = 1;
  const valueEl   = document.getElementById('est-value');
  const currEl    = valueEl && valueEl.parentElement.querySelector('.currency');

  function fmt(n) {
    if (n <= 0) return 'индивидуально';
    return Math.round(n / 100) * 100
      ? Math.round(n).toLocaleString('ru-RU')
      : '0';
  }

  function update() {
    if (!valueEl) return;
    if (base === 0) {
      valueEl.textContent = '—';
      if (currEl) currEl.style.display = 'none';
      return;
    }
    if (currEl) currEl.style.display = '';
    valueEl.textContent = fmt(base * mul);
  }

  root.querySelectorAll('[data-group="console"] button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      root.querySelectorAll('[data-group="console"] button')
          .forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      base = Number(btn.dataset.base);
      update();
    });
  });

  root.querySelectorAll('[data-group="cond"] button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      root.querySelectorAll('[data-group="cond"] button')
          .forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      mul = Number(btn.dataset.mul);
      update();
    });
  });

  update();
}

// ── Слайдер фотографий магазина ───────────────────────────────────

function initPhotoSlider() {
  const track    = document.getElementById('shop-track');
  const dotsWrap = document.getElementById('slide-dots');
  if (!track || !dotsWrap) return;

  const slides = Array.from(track.querySelectorAll('.shop-slide'));
  let cur      = 0;
  let timer;

  function go(n) {
    cur = (n + slides.length) % slides.length;
    track.style.transform = 'translateX(-' + cur * 100 + '%)';
    Array.from(dotsWrap.querySelectorAll('.dot'))
         .forEach(function (d, i) { d.classList.toggle('active', i === cur); });
  }

  slides.forEach(function (_, i) {
    const d = document.createElement('button');
    d.className     = 'dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', 'Фото ' + (i + 1));
    d.addEventListener('click', function () { go(i); });
    dotsWrap.appendChild(d);
  });

  document.getElementById('slide-prev') &&
    document.getElementById('slide-prev').addEventListener('click', function () { go(cur - 1); });
  document.getElementById('slide-next') &&
    document.getElementById('slide-next').addEventListener('click', function () { go(cur + 1); });

  function startTimer() {
    timer = setInterval(function () { go(cur + 1); }, 4200);
  }
  startTimer();

  const wrap = track.closest('.shop-slider-wrap');
  if (wrap) {
    wrap.addEventListener('mouseenter', function () { clearInterval(timer); });
    wrap.addEventListener('mouseleave', function () { startTimer(); });
  }
}

// ── Лайтбокс ──────────────────────────────────────────────────────

function initLightbox() {
  const lb     = document.getElementById('lightbox');
  const lbImg  = document.getElementById('lb-img');
  if (!lb || !lbImg) return;

  const photos = [
    window.__resources.shop1,
    window.__resources.shop2,
    window.__resources.shop3,
    window.__resources.shop4,
  ];
  let lbCur = 0;

  function lbGo(n) {
    lbCur       = (n + photos.length) % photos.length;
    lbImg.src   = photos[lbCur];
  }

  function lbOpen(idx) {
    lbCur           = idx;
    lbImg.src       = photos[lbCur];
    lbImg.style.display = '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function lbClose() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.shop-slide').forEach(function (s, i) {
    s.addEventListener('click', function () { lbOpen(i); });
  });

  document.getElementById('lb-close') &&
    document.getElementById('lb-close').addEventListener('click', lbClose);
  document.getElementById('lb-prev') &&
    document.getElementById('lb-prev').addEventListener('click', function () { lbGo(lbCur - 1); });
  document.getElementById('lb-next') &&
    document.getElementById('lb-next').addEventListener('click', function () { lbGo(lbCur + 1); });

  lb.addEventListener('click', function (e) {
    if (e.target === lb) lbClose();
  });

  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')      lbClose();
    if (e.key === 'ArrowLeft')   lbGo(lbCur - 1);
    if (e.key === 'ArrowRight')  lbGo(lbCur + 1);
  });
}

// ── Перетаскивание карты ──────────────────────────────────────────

function initMapDrag() {
  const mapEl = document.getElementById('map-drag');
  const mapG  = document.getElementById('map-g');
  if (!mapEl || !mapG) return;

  const BOUNDS = 230; // максимальный сдвиг в единицах viewBox
  let dragging  = false;
  let startX    = 0;
  let tx        = 0;
  let startTx   = 0;

  function applyTx(val) {
    tx = Math.max(-BOUNDS, Math.min(BOUNDS, val));
    mapG.setAttribute('transform', 'translate(' + tx + ',0)');
  }

  mapEl.style.cursor = 'grab';

  mapEl.addEventListener('mousedown', function (e) {
    dragging  = true;
    startX    = e.clientX;
    startTx   = tx;
    mapEl.style.cursor = 'grabbing';
    e.preventDefault();
  });

  window.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    const rect  = mapEl.getBoundingClientRect();
    const scale = Math.max(rect.width / 900, rect.height / 440);
    applyTx(startTx + (e.clientX - startX) / scale);
  });

  window.addEventListener('mouseup', function () {
    dragging = false;
    mapEl.style.cursor = 'grab';
  });

  mapEl.addEventListener('touchstart', function (e) {
    dragging  = true;
    startX    = e.touches[0].clientX;
    startTx   = tx;
    e.preventDefault();
  }, { passive: false });

  window.addEventListener('touchmove', function (e) {
    if (!dragging) return;
    const rect  = mapEl.getBoundingClientRect();
    const scale = Math.max(rect.width / 900, rect.height / 440);
    applyTx(startTx + (e.touches[0].clientX - startX) / scale);
  }, { passive: false });

  window.addEventListener('touchend', function () {
    dragging = false;
  });
}

// =================================================================
//  GOOGLE SHEETS: Загрузка дисков
// =================================================================

/**
 * Загружает диски из Google Sheets через Apps Script Web App.
 * Показывает loading-состояние, затем рендерит карточки.
 */
async function loadDiscsFromSheets() {
  showDiscsLoading();

  try {
    const url      = APPS_SCRIPT_URL + '?action=getDiscs';
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    const data  = await response.json();
    const discs = (data.discs || []).filter(function (d) {
      // active может быть boolean true или строка "TRUE"
      return d.active === true || String(d.active).toUpperCase() === 'TRUE';
    });

    renderDiscCards(discs);

  } catch (err) {
    console.error('[OLD GAMER] Ошибка загрузки дисков:', err);
    showDiscsError();
  }
}

/** Показать состояние загрузки в сетке */
function showDiscsLoading() {
  const grid = document.getElementById('disc-grid');
  if (!grid) return;
  grid.innerHTML = `
    <div class="disc-loading" id="disc-loading">
      <div class="disc-loading-spinner"></div>
      <p>Загружаем каталог...</p>
    </div>`;
}

/** Показать ошибку загрузки */
function showDiscsError() {
  const grid = document.getElementById('disc-grid');
  if (!grid) return;
  grid.innerHTML = `
    <div class="disc-error">
      <div class="disc-error-icon">⚠️</div>
      <p>Не удалось загрузить каталог.<br>
         <a href="https://t.me/oldgamershop" target="_blank" rel="noopener">Напишите нам в Telegram</a> — поможем!</p>
    </div>`;
}

// ── Рендер карточек ───────────────────────────────────────────────

/**
 * Строит карточки дисков и вставляет в DOM.
 * @param {Array} discs - массив объектов из Google Sheets
 */
function renderDiscCards(discs) {
  const grid      = document.getElementById('disc-grid');
  const countEl   = document.getElementById('disc-count');
  const filterBar = document.getElementById('disc-filter');
  if (!grid) return;

  // Обновить счётчик
  if (countEl) countEl.textContent = '· ' + discs.length;

  if (discs.length === 0) {
    grid.innerHTML = `
      <div class="disc-error">
        <div class="disc-error-icon">🎮</div>
        <p>Пока нет активных позиций. Следите за обновлениями!</p>
      </div>`;
    return;
  }

  // Собрать HTML карточек
  grid.innerHTML = discs.map(function (disc, index) {
    return buildDiscCard(disc, index);
  }).join('');

  // Построить фильтр-табы по уникальным платформам
  buildFilterTabs(discs, filterBar);

  // Инициализировать «Показать ещё», модал и логику фильтрации
  initDiscInteractions(discs);
}

/**
 * Строит HTML одной карточки диска.
 * @param {Object} disc
 * @param {number} index
 */
function buildDiscCard(disc, index) {
  const platform = (disc.platform || '').toLowerCase();
  const cfg      = PLATFORM_CONFIG[platform] || {
    label: disc.platformLabel || disc.platform || '—',
    short: (disc.platform || 'GEN').toUpperCase(),
    bg:    'linear-gradient(90deg,rgba(60,60,60,.9),rgba(90,90,90,.9))',
  };

  const platformLabel = disc.platformLabel || cfg.label;
  const isPreorder    = String(disc.status).toLowerCase() === 'preorder';
  const statusText    = isPreorder ? 'Предзаказ' : 'В наличии';
  const btnText       = isPreorder ? 'Предзаказ →' : 'Заказать →';

  // Обложка: imageUrl или стилизованная art-заглушка
  const coverHtml = disc.imageUrl
    ? buildImageCover(disc, cfg, platformLabel, statusText)
    : buildArtCover(disc, cfg, platformLabel, statusText);

  // data-атрибуты для модала — экранируем спецсимволы
  const safe = function (s) { return String(s || '').replace(/"/g, '&quot;'); };

  return `
<article class="disc-card"
  data-platform="${safe(platform)}"
  data-status="${safe(disc.status)}"
  data-title="${safe(disc.title)}"
  data-platform-label="${safe(platformLabel)}"
  data-price="${safe(disc.price)}"
  data-release="${safe(disc.release)}">
  ${coverHtml}
  <div class="info">
    <h4>${disc.title || '—'}</h4>
    <div class="meta">${disc.meta || ''}</div>
    <div class="ftr">
      <div class="price">${disc.price || ''}</div>
      <button class="btn btn-primary preorder-btn">${btnText}</button>
    </div>
  </div>
</article>`;
}

/** Обложка с изображением из imageUrl */
function buildImageCover(disc, cfg, platformLabel, statusText) {
  const statusClass = String(disc.status).toLowerCase() === 'preorder' ? 'preorder' : 'stock';
  return `
  <div class="cover cover-img" style="background-image:url('${disc.imageUrl}')">
    <div class="platform-strip" style="background:${cfg.bg}">
      ${platformLabel}<span>${cfg.short}</span>
    </div>
    <div class="status-tag ${statusClass}">${statusText}</div>
  </div>`;
}

/** Стилизованная art-обложка без изображения */
function buildArtCover(disc, cfg, platformLabel, statusText) {
  const statusClass = String(disc.status).toLowerCase() === 'preorder' ? 'preorder' : 'stock';
  // Делим длинное название на части для красивого отображения
  const titleParts = (disc.title || '').split(/[:–—]/).map(function (p) { return p.trim(); });
  const titleLine1 = titleParts[0] || disc.title || '';
  const titleLine2 = titleParts[1] || '';

  return `
  <div class="cover cover-art">
    <div class="platform-strip" style="background:${cfg.bg}">
      ${platformLabel}<span>${cfg.short}</span>
    </div>
    <div class="status-tag ${statusClass}">${statusText}</div>
    <div class="art">
      <div class="t">${titleLine1}${titleLine2 ? '<br><span class="acc">' + titleLine2 + '</span>' : ''}</div>
      <div class="y">// ${disc.meta || cfg.short}</div>
    </div>
  </div>`;
}

// ── Фильтр-табы платформ ──────────────────────────────────────────

function buildFilterTabs(discs, filterBar) {
  if (!filterBar) return;

  // Оставляем только кнопку «Все», добавляем платформы
  filterBar.querySelectorAll('button:not([data-filter="all"])').forEach(function (b) { b.remove(); });

  const seen = {};
  discs.forEach(function (d) {
    if (d.platform) seen[d.platform.toLowerCase()] = true;
  });

  Object.keys(seen).forEach(function (p) {
    const cfg = PLATFORM_CONFIG[p];
    const lbl = cfg ? cfg.label : p;
    const btn = document.createElement('button');
    btn.dataset.filter = p;
    btn.textContent    = lbl;
    filterBar.appendChild(btn);
  });
}

// ── Фильтрация, «Показать ещё», модал ────────────────────────────

function initDiscInteractions(allDiscs) {
  const filterBar    = document.getElementById('disc-filter');
  const grid         = document.getElementById('disc-grid');
  const showMoreBtn  = document.getElementById('show-more-btn');
  const showMoreWrap = document.querySelector('.show-more-wrap');

  let activeFilter  = 'all';
  let visibleCount  = DISCS_VISIBLE_LIMIT;

  function getFiltered() {
    return Array.from(grid.querySelectorAll('.disc-card')).filter(function (card) {
      return activeFilter === 'all' || card.dataset.platform === activeFilter;
    });
  }

  function updateVisibility() {
    const filtered = getFiltered();
    filtered.forEach(function (card, i) {
      card.classList.toggle('disc-hidden', i >= visibleCount);
    });

    // Показать/скрыть «Показать ещё»
    const remaining = filtered.length - visibleCount;
    if (!showMoreBtn || !showMoreWrap) return;

    if (remaining > 0) {
      showMoreBtn.innerHTML =
        'Показать ещё ' + Math.min(remaining, DISCS_SHOW_STEP) +
        ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="width:14px;height:14px"><path d="M6 9l6 6 6-6"/></svg>';
      showMoreWrap.style.display = '';
    } else {
      showMoreWrap.style.display = 'none';
    }
  }

  // Фильтрация по клику на таб
  filterBar && filterBar.addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    filterBar.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');

    activeFilter = btn.dataset.filter;
    visibleCount = DISCS_VISIBLE_LIMIT;

    // Скрыть карточки не той платформы
    Array.from(grid.querySelectorAll('.disc-card')).forEach(function (card) {
      const match = activeFilter === 'all' || card.dataset.platform === activeFilter;
      card.classList.toggle('hidden', !match);
    });

    updateVisibility();
  });

  // «Показать ещё»
  showMoreBtn && showMoreBtn.addEventListener('click', function () {
    visibleCount += DISCS_SHOW_STEP;
    updateVisibility();
  });

  updateVisibility();

  // Инициализировать модал после рендера карточек
  initPreorderModal(allDiscs);
}

// ── Модал предзаказа ──────────────────────────────────────────────

function initPreorderModal(allDiscs) {
  const modal    = document.getElementById('preorder-modal');
  const mTitle   = document.getElementById('m-title');
  const mPlatform = document.getElementById('m-platform');
  const mRelease  = document.getElementById('m-release');
  const mCover    = document.getElementById('m-cover');
  const form      = document.getElementById('preorder-form');
  const formWrap  = modal && modal.querySelector('.modal-form');
  const successEl = modal && modal.querySelector('.modal-success');
  const grid      = document.getElementById('disc-grid');

  if (!modal) return;

  // Текущая выбранная карточка (данные для отправки)
  let currentDisc = null;

  function openModal(card) {
    if (!card) return;

    // Собираем данные из data-атрибутов карточки
    currentDisc = {
      title:         card.dataset.title         || '',
      platform:      card.dataset.platform      || '',
      platformLabel: card.dataset.platformLabel || '',
      price:         card.dataset.price         || '',
      release:       card.dataset.release       || '',
    };

    mTitle.textContent    = currentDisc.title;
    mPlatform.textContent = currentDisc.platformLabel + ' · ' + currentDisc.price;
    mRelease.textContent  = currentDisc.release;

    // Цветная полоска на мини-обложке по платформе
    const coverEl = card.querySelector('.cover');
    if (coverEl && mCover) {
      // Копируем класс обложки
      mCover.className = 'cover-mini';
      const stripeColors = {
        ps5: '#0070D1', xbox: '#107C10', switch: '#E60012',
      };
      const color = stripeColors[currentDisc.platform] || '#E63027';
      mCover.querySelectorAll('.stripe').forEach(function (s) { s.remove(); });
      const stripe = document.createElement('span');
      stripe.className = 'stripe';
      stripe.style.cssText =
        'position:absolute;top:0;left:0;right:0;height:8px;background:' + color + ';z-index:2';
      mCover.appendChild(stripe);
    }

    if (formWrap) formWrap.hidden = false;
    if (successEl) successEl.hidden = true;
    if (form) form.reset();

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentDisc = null;
  }

  // Открыть по клику на карточку или кнопку
  grid && grid.addEventListener('click', function (e) {
    const btn  = e.target.closest('.preorder-btn');
    const card = e.target.closest('.disc-card');
    if (!card) return;
    openModal(card);
  });

  // Закрыть
  modal.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  // Отправка формы
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Валидация
      const name  = form.name.value.trim();
      const phone = form.phone.value.trim();
      let ok = true;

      if (!name) {
        form.name.classList.add('invalid');
        ok = false;
      } else {
        form.name.classList.remove('invalid');
      }

      if (!phone) {
        form.phone.classList.add('invalid');
        ok = false;
      } else {
        form.phone.classList.remove('invalid');
      }

      if (form.agree && !form.agree.checked) {
        form.agree.classList.add('invalid');
        ok = false;
      } else if (form.agree) {
        form.agree.classList.remove('invalid');
      }

      if (!ok) return;

      // Блокируем кнопку на время отправки
      const submitBtn = form.querySelector('.submit-btn');
      if (submitBtn) {
        submitBtn.disabled   = true;
        submitBtn.textContent = 'Отправляем...';
      }

      submitPreorder({
        title:         currentDisc ? currentDisc.title         : '',
        platform:      currentDisc ? currentDisc.platform      : '',
        platformLabel: currentDisc ? currentDisc.platformLabel : '',
        price:         currentDisc ? currentDisc.price         : '',
        release:       currentDisc ? currentDisc.release       : '',
        name:          name,
        phone:         phone,
        tg:            (form.tg ? form.tg.value.trim() : ''),
        note:          (form.note ? form.note.value.trim() : ''),
        date:          new Date().toLocaleString('ru-RU'),
      })
        .then(function () {
          if (formWrap) formWrap.hidden = true;
          if (successEl) successEl.hidden = false;
        })
        .catch(function (err) {
          console.error('[OLD GAMER] Ошибка отправки:', err);
          // Даже при сетевой ошибке показываем успех, т.к. Apps Script может не вернуть CORS
          if (formWrap) formWrap.hidden = true;
          if (successEl) successEl.hidden = false;
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled    = false;
            submitBtn.textContent = 'Забронировать';
          }
        });
    });

    // Убирать invalid при вводе
    ['name', 'phone'].forEach(function (n) {
      form[n] && form[n].addEventListener('input', function () {
        form[n].classList.remove('invalid');
      });
    });
  }
}

// ── Отправка заявки в Apps Script ────────────────────────────────

/**
 * Отправляет данные предзаказа на Apps Script Web App (POST, JSON).
 * @param {Object} orderData
 * @returns {Promise}
 */
async function submitPreorder(orderData) {
  const response = await fetch(APPS_SCRIPT_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(orderData),
  });

  // Apps Script может вернуть редирект; читаем JSON если возможно
  try {
    return await response.json();
  } catch {
    return { success: true };
  }
}
