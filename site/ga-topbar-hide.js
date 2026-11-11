/* Phone-only top bar hide-on-scroll. Additive; does not edit wm-shell.js.
   - Non-aerodrome pages: hide topbar on scroll down, show on scroll up / top.
   - Aerodrome list (WMSHELL.page=main / #wmF-aero / html.wm-adopen): topbar stays;
     existing wm-pin status dock keeps working.
   - Aerodrome detail (/ad/): topbar stays; slim status + Land/Depart sticks under it.
   Transform + opacity only. Small hysteresis. prefers-reduced-motion respected.
   Coordinates with ga-nav-pill (same scroll direction, independent state). */
(function () {
  'use strict';
  if (window.__gaTopbarHide) return;
  window.__gaTopbarHide = 1;

  var HYST_DOWN = 10;
  var HYST_UP = 4;
  var TOP_Y = 8;
  var phoneMq = matchMedia('(max-width: 767px)');
  var rmMq = matchMedia('(prefers-reduced-motion: reduce)');

  function reduced() { return rmMq.matches; }

  function overlayOpen() {
    if (document.querySelector(
      '.sheet.on, .sheet.mp.on, .sheet.glass.on, .fs-spot.on, .ipop.on, .wm-tcard.on, .wx-menu.on, .wds-sm.on, .sug.on'
    )) return true;
    if (document.querySelector('.wmf[data-s="open"], .wmf-sh[data-s="open"]')) return true;
    if (document.querySelector('.wflt-b[aria-expanded="true"], .wflt [aria-expanded="true"]')) return true;
    try { if (window.W && typeof window.W.isOpen === 'function' && window.W.isOpen()) return true; } catch (e) {}
    return false;
  }

  function isAdDetail() {
    try {
      var p = (location.pathname || '').toLowerCase().replace(/\/+$/, '');
      /* Pages often serve /ad/ICAO without .html */
      return /\/ad\/[^/]+(?:\.html)?$/.test(p) || /\/c\/ad\/[^/]+(?:\.html)?$/.test(p);
    } catch (e) { return false; }
  }

  function isAeroShell() {
    if (document.documentElement.classList.contains('wm-adopen')) return true;
    try {
      if (window.WMMERGE && WMMERGE.cur === 'aero') return true;
    } catch (e) {}
    var aero = document.getElementById('wmF-aero');
    if (aero && aero.style.display !== 'none' && getComputedStyle(aero).display !== 'none') {
      /* only when this frame is the visible section */
      var on = false;
      try {
        document.querySelectorAll('iframe.wmsec').forEach(function (f) {
          if (f.style.display !== 'none' && f === aero) on = true;
        });
      } catch (e) {}
      if (on) return true;
    }
    /* standalone main.html (not embedded) */
    try {
      var p = (location.pathname || '').toLowerCase();
      if (/\/main(\.html)?$/.test(p) && window.top === window) return true;
    } catch (e) {}
    return false;
  }

  function isAerodrome() {
    return isAdDetail() || isAeroShell();
  }

  function ready(fn) {
    var n = 0;
    (function tick() {
      var tb = document.querySelector('body > header.topbar, header.topbar');
      if (tb) return fn(tb);
      if (++n < 200) setTimeout(tick, 40);
    })();
  }

  ready(function (tb) {
    document.documentElement.classList.add('ga-tb-ready');

    var hidden = false;
    var lastY = window.scrollY || 0;
    var acc = 0;
    var dirLock = 0;
    var scrollRaf = 0;
    var pendingY = null;
    var enabled = false; /* hide-on-scroll enabled */
    var aeroMode = false;

    /* ---- aerodrome detail sticky strip ---- */
    var stick = null, stickOn = false, verd = null, vsEl = null, sentinel = null, io = null;

    function measureTbH() {
      var h = tb.getBoundingClientRect().height || 58;
      document.documentElement.style.setProperty('--ga-tb-h', Math.round(h) + 'px');
      return h;
    }

    function statusKey() {
      /* Phase words (DEPART/LAND/NO DEPART/NO LAND) are the live labels; engine keys stay go/caution/nogo. */
      var t = ((vsEl && vsEl.textContent) || '').trim().toUpperCase().replace(/\s+/g, ' ');
      if (/NO[- ]?(GO|DEPART|LAND)|NOGO/.test(t)) return 'nogo';
      if (/CAUTION|MARGINAL/.test(t)) return 'caution';
      if (/^(GO|DEPART|LAND)$/.test(t) || /\b(GO|DEPART|LAND)\b/.test(t)) return 'go';
      if (/INCOMPLETE|HELIPORT/.test(t)) return 'none';
      if (!t || t === '—' || t === '-') return 'none';
      return 'none';
    }

    function statusLabel() {
      /* Mirror #vs exactly so phase.js word swaps stay in sync (no GO↔DEPART fight). */
      var t = ((vsEl && vsEl.textContent) || '').trim();
      return t || '—';
    }

    function phaseMode() {
      try {
        if (window.WMPHASE && (WMPHASE.mode === 'land' || WMPHASE.mode === 'depart')) return WMPHASE.mode;
      } catch (e) {}
      try {
        return localStorage.getItem('wm.phaseMode') === 'land' ? 'land' : 'depart';
      } catch (e) { return 'depart'; }
    }

    function ensureStick() {
      if (stick || !isAdDetail()) return;
      verd = document.getElementById('verd');
      vsEl = document.getElementById('vs');
      if (!verd) return;
      stick = document.createElement('div');
      stick.className = 'ga-ad-stick';
      stick.setAttribute('aria-hidden', 'true');
      stick.innerHTML =
        '<div class="ga-ad-stick-inner">' +
          '<span class="ga-ad-stat" data-s="none">—</span>' +
          '<div class="ga-ad-ld" aria-label="Land and Depart status">' +
            '<span data-s="none"><i></i>Land</span>' +
            '<span data-s="none"><i></i>Depart</span>' +
          '</div>' +
        '</div>';
      document.body.appendChild(stick);
      sentinel = document.createElement('div');
      sentinel.setAttribute('aria-hidden', 'true');
      sentinel.style.cssText = 'position:absolute;left:0;width:1px;height:1px;pointer-events:none;visibility:hidden';
      /* place sentinel at the top of the status section */
      var host = verd.parentElement || verd;
      if (host.style.position === '' || host.style.position === 'static') {
        try { if (getComputedStyle(host).position === 'static') host.style.position = 'relative'; } catch (e) {}
      }
      verd.parentElement.insertBefore(sentinel, verd);
      syncStickContent();
      watchStick();
      if (window.MutationObserver && vsEl) {
        new MutationObserver(syncStickContent).observe(vsEl, { childList: true, characterData: true, subtree: true });
      }
    }

    function syncStickContent() {
      if (!stick) return;
      var k = statusKey(), lab = statusLabel(), mode = phaseMode();
      var st = stick.querySelector('.ga-ad-stat');
      if (st) { st.textContent = lab; st.setAttribute('data-s', k); }
      stick.querySelectorAll('.ga-ad-ld > span').forEach(function (el, i) {
        el.setAttribute('data-s', k);
        var which = i === 0 ? 'land' : 'depart';
        el.classList.toggle('is-active', which === mode);
        el.setAttribute('aria-current', which === mode ? 'true' : 'false');
      });
    }

    function setStick(on) {
      if (!stick || on === stickOn) return;
      stickOn = on;
      if (reduced()) {
        stick.classList.toggle('is-on', on);
      } else {
        stick.classList.toggle('is-on', on);
      }
      document.documentElement.classList.toggle('ga-ad-stuck', on);
      stick.setAttribute('aria-hidden', on ? 'false' : 'true');
    }

    function watchStick() {
      if (!sentinel || !window.IntersectionObserver) return;
      if (io) io.disconnect();
      measureTbH();
      var top = measureTbH();
      io = new IntersectionObserver(function (es) {
        if (!phoneMq.matches || !aeroMode) { setStick(false); return; }
        var e = es[es.length - 1];
        var past = !e.isIntersecting && e.boundingClientRect.top < top;
        setStick(past);
      }, { rootMargin: (-top) + 'px 0px 0px 0px', threshold: 0 });
      io.observe(sentinel);
    }

    function showBar(force) {
      if (!hidden && !force) return;
      hidden = false;
      tb.classList.remove('ga-tb-hidden');
    }

    function hideBar() {
      if (hidden || !enabled || aeroMode) return;
      if (overlayOpen()) return;
      hidden = true;
      tb.classList.add('ga-tb-hidden');
    }

    function handleScrollY(y) {
      if (aeroMode || !enabled) {
        if (hidden) showBar(true);
        return;
      }
      var dy = y - lastY;
      lastY = y;
      if (overlayOpen()) {
        acc = 0; dirLock = 0;
        showBar(true);
        return;
      }
      if (dy === 0) return;
      var dir = dy > 0 ? 1 : -1;
      if (dirLock && dir !== dirLock) { acc = 0; dirLock = 0; }

      if (dir > 0) {
        if (hidden) { acc = 0; return; }
        acc += dy;
        if (acc >= HYST_DOWN && y > 40) {
          dirLock = 1; acc = 0;
          if (reduced()) { tb.style.transition = 'none'; hideBar(); requestAnimationFrame(function () { tb.style.transition = ''; }); }
          else hideBar();
        }
      } else {
        if (!hidden) { acc = 0; return; }
        acc += -dy;
        if (y <= TOP_Y || acc >= HYST_UP) {
          dirLock = -1; acc = 0;
          showBar(true);
        }
      }
    }

    function onScrollEvent(y) {
      pendingY = y;
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(function () {
        scrollRaf = 0;
        if (pendingY == null) return;
        var y2 = pendingY; pendingY = null;
        handleScrollY(y2);
      });
    }

    window.addEventListener('scroll', function () {
      onScrollEvent(window.scrollY || 0);
    }, { passive: true });

    /* iframe scroll (calculator etc. embeds) */
    function hookFrames() {
      document.querySelectorAll('iframe').forEach(function (f) {
        if (f.__gaTbHook) return;
        f.__gaTbHook = 1;
        try {
          var w = f.contentWindow, d = f.contentDocument;
          if (!w || !d) return;
          w.addEventListener('scroll', function () {
            onScrollEvent(w.scrollY || d.documentElement.scrollTop || 0);
          }, { passive: true });
        } catch (e) {}
      });
    }
    setInterval(hookFrames, 1200);

    function refreshMode() {
      var wasAero = aeroMode;
      aeroMode = isAerodrome();
      document.documentElement.classList.toggle('ga-tb-aero', aeroMode);
      enabled = phoneMq.matches && !aeroMode;
      if (aeroMode || !phoneMq.matches) {
        showBar(true);
        acc = 0; dirLock = 0;
      }
      if (isAdDetail() && phoneMq.matches) {
        ensureStick();
        measureTbH();
        watchStick();
      } else {
        setStick(false);
      }
      if (wasAero !== aeroMode) {
        lastY = window.scrollY || 0;
      }
    }

    /* show bar on internal page/tab switches */
    function onRoute() {
      showBar(true);
      acc = 0; dirLock = 0;
      lastY = window.scrollY || 0;
      refreshMode();
    }
    window.addEventListener('hashchange', onRoute);
    window.addEventListener('popstate', onRoute);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) onRoute();
    });

    /* shell tab / aerodrome open class */
    try {
      new MutationObserver(function () { refreshMode(); }).observe(document.documentElement, {
        attributes: true, attributeFilter: ['class']
      });
    } catch (e) {}
    try {
      var wrap = document.querySelector('main.wrap');
      if (wrap) new MutationObserver(function () { refreshMode(); }).observe(wrap, {
        attributes: true, subtree: true, attributeFilter: ['class', 'style']
      });
    } catch (e) {}

    /* pill tab clicks often navigate sections without a full reload */
    document.addEventListener('click', function (ev) {
      var t = ev.target && ev.target.closest && ev.target.closest('#wmC .wctab, .wctab, a[href]');
      if (t) setTimeout(onRoute, 30);
    }, true);

    function onMq() {
      refreshMode();
      if (!phoneMq.matches) showBar(true);
    }
    if (phoneMq.addEventListener) phoneMq.addEventListener('change', onMq);
    else if (phoneMq.addListener) phoneMq.addListener(onMq);

    window.addEventListener('resize', function () {
      measureTbH();
      if (aeroMode) watchStick();
      if (!phoneMq.matches) showBar(true);
    });

    refreshMode();
    hookFrames();
    measureTbH();
    try {
      window.addEventListener('wm:phase', function () { syncStickContent(); });
    } catch (e) {}


    /* WMMERGE.cur can change without a class mutation — light poll */
    var lastCur = null;
    setInterval(function () {
      var cur = null;
      try { cur = window.WMMERGE && WMMERGE.cur; } catch (e) {}
      if (cur !== lastCur) { lastCur = cur; refreshMode(); }
    }, 400);

    window.__gaTopbar = {
      show: function () { showBar(true); },
      hide: hideBar,
      isHidden: function () { return hidden; },
      isAero: function () { return aeroMode; },
      refresh: refreshMode
    };
  });
})();
