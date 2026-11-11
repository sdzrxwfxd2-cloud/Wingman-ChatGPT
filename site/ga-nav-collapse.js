/* Phone-only nav pill collapse — additive; does not edit wm-shell.js.
   Phones: max-width 767px. Motion: WAAPI transform+opacity on wrappers only.
   Backdrop-filter nodes are never animated. */
(function () {
  if (window.__gaNavCollapse) return;
  window.__gaNavCollapse = 1;

  var CIRCLE = 64, SIDE = 16;
  var OPEN_MS = 300, CLOSE_MS = 220;
  var EASE = 'cubic-bezier(.32,.72,0,1)';
  var HYST = 10; /* px scroll hysteresis */
  var phoneMq = window.matchMedia('(max-width: 767px)');

  function reduced() {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function isPhone() { return phoneMq.matches; }

  function overlayOpen() {
    if (document.querySelector(
      '.sheet.on, .sheet.mp.on, .sheet.glass.on, .fs-spot.on, .ipop.on, .wm-tcard.on, .wx-menu.on, .wds-sm.on, .sug.on'
    )) return true;
    if (document.querySelector('.wmf[data-s="open"], [data-s="open"].wmf, .wmf-sh[data-s="open"]')) return true;
    if (document.querySelector('.wflt-b[aria-expanded="true"], .wflt [aria-expanded="true"]')) return true;
    try {
      if (window.W && typeof window.W.isOpen === 'function' && window.W.isOpen()) return true;
    } catch (e) {}
    return false;
  }

  function ready(fn) {
    var n = 0;
    (function tick() {
      var dock = document.getElementById('wmC');
      var pill = dock && dock.querySelector('.wcpill');
      var tabs = pill && pill.querySelectorAll('.wctab');
      if (dock && pill && tabs && tabs.length) return fn(dock, pill);
      if (++n < 200) return setTimeout(tick, 50);
    })();
  }

  ready(function (dock, pill) {
    /* Do NOT set wmCnoNav — tabs / More / knob keep normal navigation. */

    /* --- layers: pill proxy wrap + circle wrap (wrappers animate; glass children do not) --- */
    var pillWrap = document.createElement('div');
    pillWrap.className = 'wm-coll-pill-wrap';
    pillWrap.setAttribute('aria-hidden', 'true');
    var pillGlass = document.createElement('div');
    pillGlass.className = 'wm-coll-pill-glass';
    var pillFace = document.createElement('div');
    pillFace.className = 'wm-coll-pill-face';
    pillWrap.appendChild(pillGlass);
    pillWrap.appendChild(pillFace);

    var circleWrap = document.createElement('div');
    circleWrap.className = 'wm-coll-circle-wrap';
    var circleGlass = document.createElement('div');
    circleGlass.className = 'wm-coll-circle-glass';
    var ic = document.createElement('div');
    ic.className = 'wm-coll-ic';
    ic.setAttribute('aria-hidden', 'true');
    var hit = document.createElement('button');
    hit.type = 'button';
    hit.className = 'wm-coll-hit';
    hit.setAttribute('aria-label', 'Expand navigation');
    circleWrap.appendChild(circleGlass);
    circleWrap.appendChild(ic);
    circleWrap.appendChild(hit);

    /* Layers on #wmC, NOT inside .wcpill — parent opacity must never hide the circle */
    dock.appendChild(pillWrap);
    dock.appendChild(circleWrap);

    var collapsed = false, animating = false, enabled = false;
    var pillAnim = null, circleAnim = null;
    var lastY = 0, acc = 0, dirLock = 0; /* -1 up, +1 down, 0 none */
    var scrollRaf = 0, pendingY = null;

    function realTabs() {
      var out = [], all = pill.querySelectorAll('.wctab');
      for (var i = 0; i < all.length; i++) {
        if (all[i].closest('.wm-coll-pill-wrap, .wm-coll-circle-wrap')) continue;
        out.push(all[i]);
      }
      return out;
    }
    function activeTab() {
      var tabs = realTabs(), on = null, i;
      for (i = 0; i < tabs.length; i++) if (tabs[i].classList.contains('on')) on = tabs[i];
      return on || tabs[0] || null;
    }

    function syncIcon() {
      var tab = activeTab();
      if (!tab) return;
      var svg = tab.querySelector('svg');
      if (!svg) return;
      ic.innerHTML = '';
      ic.appendChild(svg.cloneNode(true));
    }

    /* Snapshot open pill face (icons row) into proxy — labels fade with wrap opacity, no slide */
    var faceTabKey = '';
    function syncPillFace() {
      var tab = activeTab();
      var key = tab ? (tab.getAttribute('data-n') || tab.textContent || '') : '';
      if (faceTabKey === key && pillFace.childNodes.length) return;
      faceTabKey = key;
      pillFace.innerHTML = '';
      var face = document.createElement('div');
      face.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:space-around;padding:0 10px;pointer-events:none;';
      var kids = pill.children;
      for (var i = 0; i < kids.length; i++) {
        var el = kids[i];
        if (el.classList.contains('wcglass') || el.classList.contains('wclabs')) continue;
        if (!(el.classList.contains('wctab') || el.classList.contains('wckb') || el.classList.contains('wcx'))) continue;
        var c = el.cloneNode(true);
        c.style.pointerEvents = 'none';
        c.removeAttribute('href');
        face.appendChild(c);
      }
      pillFace.appendChild(face);
    }

    function circleOriginInPill() {
      /* transform-origin at circle centre = right SIDE of pill, vertically centered */
      var pr = pill.getBoundingClientRect();
      if (pr.width < 1) return '100% 50%';
      var ox = ((pr.width - CIRCLE / 2) / pr.width) * 100;
      return ox + '% 50%';
    }

    function scaleFromPillToCircle() {
      var pr = pill.getBoundingClientRect();
      if (pr.width < 1) return CIRCLE / 358;
      return CIRCLE / pr.width;
    }

    function cancelAnims() {
      if (pillAnim) { try { pillAnim.cancel(); } catch (e) {} pillAnim = null; }
      if (circleAnim) { try { circleAnim.cancel(); } catch (e) {} circleAnim = null; }
      pillWrap.classList.remove('is-animating');
      circleWrap.classList.remove('is-animating');
    }

    function setRestOpen() {
      cancelAnims();
      dock.classList.remove('is-collapsed', 'is-morphing');
      pillWrap.style.opacity = '0';
      pillWrap.style.transform = 'translate3d(0,0,0) scale(1)';
      circleWrap.style.opacity = '0';
      circleWrap.style.transform = 'translate3d(0,0,0) scale(1)';
      collapsed = false;
      animating = false;
    }

    function setRestCollapsed() {
      cancelAnims();
      dock.classList.add('is-collapsed');
      dock.classList.remove('is-morphing');
      pillWrap.style.opacity = '0';
      pillWrap.style.transform = 'translate3d(0,0,0) scale(' + scaleFromPillToCircle() + ')';
      circleWrap.style.opacity = '1';
      circleWrap.style.transform = 'translate3d(0,0,0) scale(1)';
      syncIcon();
      collapsed = true;
      animating = false;
    }

    function collapse() {
      if (!enabled || collapsed || animating) return;
      if (overlayOpen()) return;
      animating = true;
      syncIcon();
      syncPillFace();
      var origin = circleOriginInPill();
      var s = scaleFromPillToCircle();
      pillWrap.style.transformOrigin = origin;
      /* circle wrap origin = its own centre */
      circleWrap.style.transformOrigin = '50% 50%';

      if (reduced()) {
        setRestCollapsed();
        return;
      }

      dock.classList.add('is-morphing');
      dock.classList.remove('is-collapsed');
      /* Start: pill proxy visible at full; real pill hidden; circle small+faded */
      pillWrap.style.opacity = '1';
      pillWrap.style.transform = 'translate3d(0,0,0) scale(1)';
      /* circle starts scaled up so it matches pill width, then settles to 1 */
      circleWrap.style.opacity = '0';
      circleWrap.style.transform = 'translate3d(0,0,0) scale(' + (1 / s) + ')';

      pillWrap.classList.add('is-animating');
      circleWrap.classList.add('is-animating');

      pillAnim = pillWrap.animate(
        [
          { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' },
          { opacity: 0, transform: 'translate3d(0,0,0) scale(' + s + ')' }
        ],
        { duration: CLOSE_MS, easing: EASE, fill: 'forwards' }
      );
      circleAnim = circleWrap.animate(
        [
          { opacity: 0, transform: 'translate3d(0,0,0) scale(' + (1 / s) + ')' },
          { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' }
        ],
        { duration: CLOSE_MS, easing: EASE, fill: 'forwards' }
      );

      var done = function () {
        setRestCollapsed();
      };
      circleAnim.onfinish = done;
      pillAnim.onfinish = function () {};
      /* safety */
      setTimeout(function () { if (animating) done(); }, CLOSE_MS + 80);
    }

    function expand() {
      if (!collapsed || animating) return;
      animating = true;
      syncIcon();
      syncPillFace();
      var origin = circleOriginInPill();
      var s = scaleFromPillToCircle();
      pillWrap.style.transformOrigin = origin;
      circleWrap.style.transformOrigin = '50% 50%';

      if (reduced()) {
        setRestOpen();
        return;
      }

      dock.classList.add('is-morphing');
      dock.classList.remove('is-collapsed');
      pillWrap.style.opacity = '0';
      pillWrap.style.transform = 'translate3d(0,0,0) scale(' + s + ')';
      circleWrap.style.opacity = '1';
      circleWrap.style.transform = 'translate3d(0,0,0) scale(1)';

      pillWrap.classList.add('is-animating');
      circleWrap.classList.add('is-animating');

      pillAnim = pillWrap.animate(
        [
          { opacity: 0, transform: 'translate3d(0,0,0) scale(' + s + ')' },
          { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' }
        ],
        { duration: OPEN_MS, easing: EASE, fill: 'forwards' }
      );
      circleAnim = circleWrap.animate(
        [
          { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' },
          { opacity: 0, transform: 'translate3d(0,0,0) scale(' + (1 / s) + ')' }
        ],
        { duration: OPEN_MS, easing: EASE, fill: 'forwards' }
      );

      var done = function () {
        setRestOpen();
      };
      pillAnim.onfinish = done;
      setTimeout(function () { if (animating) done(); }, OPEN_MS + 80);
    }

    hit.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      expand();
    });

    /* --- scroll: rAF throttle + hysteresis + direction lock --- */
    function handleScrollY(y) {
      if (!enabled) return;
      var dy = y - lastY;
      lastY = y;
      if (animating) return;
      if (overlayOpen()) {
        acc = 0; dirLock = 0;
        if (collapsed) expand();
        return;
      }
      if (dy === 0) return;

      var dir = dy > 0 ? 1 : -1;
      if (dirLock && dir !== dirLock) {
        /* direction changed — reset accumulator; require hysteresis the other way */
        acc = 0;
        dirLock = 0;
      }

      if (dir > 0) {
        /* scrolling down */
        if (collapsed) { acc = 0; return; }
        acc += dy;
        if (acc >= HYST && y > 40) {
          dirLock = 1;
          acc = 0;
          collapse();
        }
      } else {
        /* scrolling up */
        if (!collapsed) { acc = 0; return; }
        acc += -dy;
        if (y < 16) {
          dirLock = -1;
          acc = 0;
          expand();
          return;
        }
        if (acc >= HYST) {
          dirLock = -1;
          acc = 0;
          expand();
        }
      }
    }

    function onScrollEvent(y) {
      pendingY = y;
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(function () {
        scrollRaf = 0;
        if (pendingY == null) return;
        var y2 = pendingY;
        pendingY = null;
        handleScrollY(y2);
      });
    }

    window.addEventListener('scroll', function () {
      onScrollEvent(window.scrollY || 0);
    }, { passive: true });

    function hookFrames() {
      if (!enabled) return;
      document.querySelectorAll('iframe').forEach(function (f) {
        if (f.__gaCollHook) return;
        f.__gaCollHook = 1;
        try {
          var w = f.contentWindow, d = f.contentDocument;
          if (!w || !d) return;
          w.addEventListener('scroll', function () {
            onScrollEvent(w.scrollY || d.documentElement.scrollTop || 0);
          }, { passive: true });
        } catch (e) {}
      });
    }
    setInterval(hookFrames, 1000);

    var obs = new MutationObserver(function () {
      if (collapsed) syncIcon();
      if (enabled && overlayOpen() && collapsed && !animating) expand();
    });
    obs.observe(pill, { attributes: true, subtree: true, attributeFilter: ['class'] });
    try {
      obs.observe(document.documentElement, {
        attributes: true, subtree: true, attributeFilter: ['class', 'data-s', 'aria-expanded']
      });
    } catch (e) {}

    function setEnabled(on) {
      enabled = !!on;
      if (!enabled) {
        animating = false;
        cancelAnims();
        if (collapsed || dock.classList.contains('is-collapsed') || dock.classList.contains('is-morphing')) {
          setRestOpen();
        }
        collapsed = false;
        acc = 0; dirLock = 0;
      } else {
        lastY = window.scrollY || 0;
        hookFrames();
        syncIcon();
      }
    }

    function onMq(e) { setEnabled(e.matches); }
    if (phoneMq.addEventListener) phoneMq.addEventListener('change', onMq);
    else if (phoneMq.addListener) phoneMq.addListener(onMq);

    window.addEventListener('resize', function () {
      if (!isPhone()) {
        if (enabled || collapsed) setEnabled(false);
      }
    });

    setEnabled(isPhone());

    window.__gaNavPill = {
      collapse: collapse,
      expand: expand,
      syncIcon: syncIcon,
      isCollapsed: function () { return collapsed; },
      isEnabled: function () { return enabled; },
      isAnimating: function () { return animating; },
      measure: function () {
        var r = dock.getBoundingClientRect();
        var cr = circleWrap.getBoundingClientRect();
        var tab = activeTab();
        return {
          x: collapsed ? cr.x : r.x,
          y: collapsed ? cr.y : r.y,
          w: collapsed ? cr.width : r.width,
          h: collapsed ? cr.height : r.height,
          dockW: r.width, dockH: r.height,
          bottom: window.innerHeight - (collapsed ? cr.bottom : r.bottom),
          right: window.innerWidth - (collapsed ? cr.right : r.right),
          collapsed: collapsed,
          enabled: enabled,
          animating: animating,
          tab: tab && tab.getAttribute('data-n'),
          iconOk: !!(ic.querySelector('svg')),
          docH: document.documentElement.scrollHeight
        };
      },
      selectTab: function (i) {
        if (window.wmCsel) window.wmCsel(i, true);
        setTimeout(syncIcon, 50);
      },
      resetOpen: function () {
        setRestOpen();
      },
      /* perf probe: sample rAF during next collapse/expand */
      profile: function (which) {
        return new Promise(function (resolve) {
          var frames = [];
          var xfSamples = [];
          var last = performance.now();
          var startDocH = document.documentElement.scrollHeight;
          var startDock = dock.getBoundingClientRect();
          var root = document.documentElement;
          var prevOverflow = root.style.overflow;
          root.style.overflow = 'hidden';
          var raf = 0;
          var sampling = true;
          function readXf() {
            var csP = getComputedStyle(pillWrap);
            var csC = getComputedStyle(circleWrap);
            return {
              pill: { opacity: csP.opacity, transform: csP.transform },
              circle: { opacity: csC.opacity, transform: csC.transform },
              collapsedClass: dock.classList.contains('is-collapsed'),
              morphing: dock.classList.contains('is-morphing'),
              circleW: circleWrap.getBoundingClientRect().width,
              circleVisible: parseFloat(csC.opacity) > 0.05 && circleWrap.getBoundingClientRect().width > 40
            };
          }
          var xfStart = null;
          function sample(now) {
            if (!sampling) return;
            frames.push(now - last);
            last = now;
            xfSamples.push(readXf());
            raf = requestAnimationFrame(sample);
          }
          raf = requestAnimationFrame(sample);
          var stop = function () {
            sampling = false;
            cancelAnimationFrame(raf);
            var endDocH = document.documentElement.scrollHeight;
            var endDock = dock.getBoundingClientRect();
            root.style.overflow = prevOverflow;
            var drops = 0, longest = 0, i;
            for (i = 0; i < frames.length; i++) {
              if (i === 0) continue;
              if (frames[i] > longest) longest = frames[i];
              if (frames[i] > 25) drops++;
            }
            var xfEnd = readXf();
            var sawCircleAnim = xfSamples.some(function (s) {
              return s.circleVisible || (s.morphing && parseFloat(s.circle.opacity) > 0);
            });
            resolve({
              which: which,
              frames: frames.length,
              frameDts: frames,
              longestMs: Math.round(longest * 100) / 100,
              droppedOver25ms: drops,
              layoutShiftDock: Math.abs(startDock.top - endDock.top) + Math.abs(startDock.height - endDock.height) + Math.abs(startDock.width - endDock.width),
              docHChange: endDocH - startDocH,
              transformStart: xfStart,
              transformEnd: xfEnd,
              sawCircleAnimating: sawCircleAnim,
              sampleCount: xfSamples.length
            });
          };
          if (which === 'collapse') {
            setRestOpen();
            setTimeout(function () {
              xfStart = readXf();
              collapse();
              setTimeout(stop, CLOSE_MS + 120);
            }, 30);
          } else {
            setRestCollapsed();
            setTimeout(function () {
              xfStart = readXf();
              expand();
              setTimeout(stop, OPEN_MS + 120);
            }, 30);
          }
        });
      }
    };
  });
})();
