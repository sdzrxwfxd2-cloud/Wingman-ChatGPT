/* wm-pin.js — pins the Aerodromes GO / CAUTION / NO-GO bar under the shell top bar with zero lag.
 *
 * Why: the shell page scrolls, not the Aerodromes frame (it is sized to its content), so CSS sticky can never
 * engage inside the frame. The frame's bar is mirrored into this page (shadow root) and the mirror is position:sticky,
 * so the compositor pins it and no script runs on scroll. Taps on the mirror are forwarded to the real bar.
 * The real bar stays in the frame (hidden via html.wm-pinhost) so layout and all existing code are unchanged.
 *
 * DOCK ANIMATION (31 Oct 2026 rewrite, replaces the scroll-scrubbed v4-v6 path):
 *   The mirror holds TWO real layers: .wmp-big (the full bar) and .wmp-s (a real .slim clone, the docked bar).
 *   A 1px sentinel + IntersectionObserver (no scroll handler) reports the moment the bar touches the bottom of the top bar.
 *   On that edge a ~240 ms time-based Web Animation plays, transform + opacity only:
 *       dock   : full layer drifts up / softens out, slim layer rises in
 *       undock : the SAME two animations run in reverse
 *   A flip mid-animation calls Animation.reverse(), so it turns around from where it is (no jump).
 *   The final state is always carried by the .wmp-docked class, never by the animation, so if the animation is
 *   skipped (reduced motion, kill switch, old browser) the bar simply snaps to the right layer.
 *   Kill switch: window.WM_DOCK_ANIM = 0 (set before this script runs) or ?dock=0 in the URL => instant swap, no motion.
 *
 * NUMBER-FLASH FIX: nothing is measured or rebuilt when the bar changes any more. There are no measured pose variables, no
 * text twins, no wmp-meas toggling (that toggle destroyed and re-created every animation, and for one frame the bar
 * showed its base styles = full-size tiles at the wrong pose and no numbers). Changes in the real bar are patched in
 * place onto both layers, and a patch whose value is already there is skipped.
 *
 * Overlays: while an in-frame overlay (fv3 scrim) is open the mirror is hidden instantly (visibility).
 * Filter launcher (step 7): a copy of the filter button shows under the pinned bar once the real row scrolled under it.
 */
(function () {
  'use strict';
  if (window.wmPin) return;
  window.wmPin = true;

  var SCRIM = '.fv-scrim';
  var frame, fdoc, bar, host, shadow, track, stick, big, styleEl;
  var scrim = null, scrimObs = null;
  var headerH = 0, docked = false, sentinel, io = null, ioTop = null;
  var SLIM = 43, slimEl = null;                       // slim band height (launcher fallback only)
  var DOCK_MS = 240, DOCK_EASE = 'cubic-bezier(.2,.8,.2,1)';
  var dockAnims = null, dirtyMeasure = false;
  var frow = null, flBtn = null, flIo = null, flTop = null, flOn = false, flq = 0;
  var mq = matchMedia('(prefers-reduced-motion:reduce)');
  var OFF = (function () { try { return new URLSearchParams(location.search).get('dock') === '0'; } catch (e) { return false; } })();
  function animOk() { return !OFF && window.WM_DOCK_ANIM !== 0 && !mq.matches && typeof Element.prototype.animate === 'function'; }

  // Frame CSS, with html/:root/body selectors retargeted at the shadow wrapper so theme rules still apply.
  function frameCss() {
    var rules = [];
    Array.prototype.forEach.call(fdoc.styleSheets, function (sheet) {
      try { Array.prototype.forEach.call(sheet.cssRules, function (r) { rules.push(r.cssText); }); } catch (e) { /* cross-origin sheet */ }
    });
    return rules.join('\n').replace(/(^|[\s,{}>+~(])(html|:root|body)(?=[\s.#\[:,{>+~)])/g, '$1.wmp-root') +
      '\n:host{all:initial;display:block}' +
      '\n.wmp-root{background:none!important;margin:0!important;padding:0!important;min-height:0!important;overflow:visible!important}' +
      '\n.wmp-track{position:absolute;pointer-events:none}' +
      '\n.wmp-sent{position:absolute;left:0;top:0;width:1px;height:1px;visibility:hidden;pointer-events:none}' +
      '\n.wmp-stick>.tiles.slim{margin-top:18px!important}' +
      // Docked (slim) layer: the band is a continuation of the top bar's glass (MT 9 Nov): the same tint (70% --bg), the same
      // backdrop blur(20px) saturate(180%) and the same .5px --ln hairline as header.topbar, so stuck it reads as one surface.
      // While docked the top bar's own hairline is faded out (html shell header.wmp-joined) so there is one hairline, no seam.
      // It used to be an opaque painted copy (background-color var(--bg) under the tint, no backdrop) = flat black in the
      // night themes. The opaque paint is kept only for browsers without backdrop-filter.
      '\n.wmp-stick>.tiles.slim::before{inset:-6px -50vw!important;border-radius:0;box-shadow:none;border:0;border-bottom:.5px solid var(--ln);' +
      'background:color-mix(in srgb,var(--bg) 70%,transparent)!important;' +
      '-webkit-backdrop-filter:blur(20px) saturate(180%)!important;backdrop-filter:blur(20px) saturate(180%)!important}' +
      '\n@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.wmp-stick>.tiles.slim::before{' +
      'background:linear-gradient(color-mix(in srgb,var(--bg) 70%,transparent),color-mix(in srgb,var(--bg) 70%,transparent)),' +
      'radial-gradient(120% 60% at 50% -10%,var(--bg2),var(--bg) 70%) fixed var(--bg)!important}}' +
      // The sticky box is as tall as the full bar, so it must NOT catch taps itself (only the visible layer does).
      '\n.wmp-stick{position:sticky;display:flow-root;pointer-events:none;transition:none!important}' +
      '\n.wmp-root.wmp-covered .wmp-stick{visibility:hidden;pointer-events:none}' +
      '\n.wmp-stick>.tiles{position:relative!important;top:auto!important;transition:none!important;will-change:auto!important;pointer-events:auto;transform-origin:50% 0;' +
      'isolation:isolate;background:transparent!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}' +
      // Full layer glass: one blur layer under the bar content (same as main's unpinned status box).
      '\n.wmp-stick>.tiles::before{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;opacity:1;transition:none!important;' +
      'pointer-events:none;border:0;background:var(--gl);' +
      '-webkit-backdrop-filter:blur(30px) saturate(160%);backdrop-filter:blur(30px) saturate(160%);' +
      'box-shadow:inset 0 1px 0 var(--hl),inset 0 0 0 .5px var(--ln),var(--sh)}' +
      '\n@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.wmp-stick>.tiles::before{background:var(--bg)}}' +
      '\n.wmp-fl{position:absolute!important;z-index:2147483000!important;right:0;margin:0!important;visibility:hidden;pointer-events:none;transition:none!important}' +
      '\n.wmp-root.wmp-flon:not(.wmp-covered) .wmp-fl{visibility:visible;pointer-events:auto}' +
      '\n.wmp-stick .tile,.wmp-stick .tile *{transition-property:opacity,transform,box-shadow,background-color,color!important}' +
      dockCss();
  }

  // Two layers. Final state = class; animation is only an overlay on top of it.
  function dockCss() {
    return '\n.wmp-stick>.tiles.wmp-s{position:absolute!important;top:0!important;left:0;right:0;visibility:hidden;pointer-events:none}' +
      '\n.wmp-stick.wmp-docked>.tiles.wmp-big{visibility:hidden;pointer-events:none}' +
      '\n.wmp-stick.wmp-docked>.tiles.wmp-s{visibility:inherit;pointer-events:auto}' +   // inherit keeps .wmp-covered hiding it
      '\n.wmp-stick.wmp-anim>.tiles{visibility:inherit!important;pointer-events:none!important}' +
      // Only the children and the ::before glass animate, never the .tiles layer itself: opacity (or will-change:opacity) on
      // the layer would make it a backdrop root, so the glass inside it would blur nothing and flash flat for the whole dock.
      '\n.wmp-stick.wmp-anim>.tiles>*,.wmp-stick.wmp-anim>.tiles::before{will-change:transform,opacity}';
  }

  function rootClass(value, isSlim) {
    return (value || '').replace(/\b(slim|wmp-big|wmp-s)\b/g, '').replace(/\s+/g, ' ').trim() + ' ' + (isSlim ? 'slim wmp-s' : 'wmp-big');
  }

  // Slim layer: a permanent .slim clone, rebuilt ONLY when the structure of the bar changes (rebuild()).
  function syncSlim() {
    if (!big) return;
    if (!slimEl) { slimEl = document.createElement('nav'); stick.appendChild(slimEl); }
    slimEl.className = rootClass(bar.getAttribute('class'), true);
    slimEl.setAttribute('aria-hidden', 'true');
    slimEl.innerHTML = big.innerHTML;
    Array.prototype.forEach.call(slimEl.querySelectorAll('[id]'), function (e) { e.removeAttribute('id'); });
    Array.prototype.forEach.call(slimEl.querySelectorAll('button'), function (b) { b.tabIndex = -1; });
  }

  // ---- dock animation -------------------------------------------------------------------------------------------
  function endDock() {
    var d = dockAnims; dockAnims = null;
    if (stick) stick.classList.remove('wmp-anim');
    if (d) d.forEach(function (a) { try { a.cancel(); } catch (e) { } });     // class + cancel in one task: no in-between frame
    if (dirtyMeasure) { dirtyMeasure = false; requestAnimationFrame(measure); }
  }
  function playDock(on) {
    joinHeader(true, true);
    if (dockAnims) { dockAnims.forEach(function (a) { a.reverse(); }); return; }   // turn around mid-way, no jump
    var o = { duration: DOCK_MS, easing: DOCK_EASE, fill: 'both', direction: on ? 'normal' : 'reverse' };
    stick.classList.add('wmp-anim');
    var out = [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translate3d(0,-10px,0) scale(.97)' }];
    var inn = [{ opacity: 0, transform: 'translate3d(0,10px,0) scale(.985)' }, { opacity: 1, transform: 'none' }];
    // Full layer: its glass (::before) and its contents soften out separately. The layer itself is never faded (see dockCss).
    var anims = [pseudo(big, out, o)];
    Array.prototype.forEach.call(big.children, function (k) { anims.push(k.animate(out, o)); });
    // Docked band: the top bar glass fades in in place (opacity only, its top edge stays on the top bar); the tiles rise in.
    anims.push(pseudo(slimEl, [{ opacity: 0 }, { opacity: 1 }], o));
    Array.prototype.forEach.call(slimEl.children, function (k) { anims.push(k.animate(inn, o)); });
    anims = anims.filter(Boolean);
    dockAnims = anims;
    Promise.all(anims.map(function (a) { return a.finished; })).then(function () { if (dockAnims === anims) endDock(); }, function () { /* cancelled */ });
  }
  // Animate an element's ::before (Web Animations pseudoElement); null where that is not supported (the class still carries the end state).
  function pseudo(el, kf, o) {
    try { var a = new Animation(new KeyframeEffect(el, kf, { duration: o.duration, easing: o.easing, fill: o.fill, direction: o.direction, pseudoElement: '::before' })); if (!a.effect.pseudoElement) return null; a.play(); return a; } catch (e) { return null; }
  }
  // One hairline: while docked, the shell top bar's own bottom hairline fades out and the band's hairline is the only one.
  var joinCss = null;
  function joinHeader(on, anim) {
    var h = document.querySelector('header.topbar');
    if (!h) return;
    if (!joinCss) {
      joinCss = document.createElement('style');
      joinCss.id = 'wmp-join';
      joinCss.textContent = 'header.topbar.wmp-joined{border-bottom-color:transparent!important}' +
        'header.topbar.wmp-jt{transition:border-bottom-color ' + DOCK_MS + 'ms ' + DOCK_EASE + '!important}' +
        '@media (prefers-reduced-motion:reduce){header.topbar.wmp-jt{transition:none!important}}';
      document.head.appendChild(joinCss);
    }
    var wrap = shadow && shadow.querySelector('.wmp-root');
    var showing = !!track && track.style.display !== 'none' && !(wrap && wrap.classList.contains('wmp-covered'));
    if (h.classList.contains('wmp-jt') !== !!anim) h.classList.toggle('wmp-jt', !!anim);
    var j = !!on && docked && showing;
    if (h.classList.contains('wmp-joined') !== j) h.classList.toggle('wmp-joined', j);
  }
  function setDocked(on, instant) {
    if (on === docked) return;
    docked = on;
    stick.classList.toggle('wmp-docked', on);
    if (instant || !animOk() || !slimEl || !big) { endDock(); joinHeader(on, false); return; }
    playDock(on);
  }

  // ---- theme / overlay --------------------------------------------------------------------------------------------
  function syncTheme() {
    var win = fdoc.defaultView, rootCs = win.getComputedStyle(fdoc.documentElement), bodyCs = win.getComputedStyle(fdoc.body);
    var wrap = shadow.querySelector('.wmp-root'), vars = '';
    for (var i = 0; i < rootCs.length; i++) if (rootCs[i].indexOf('--') === 0) vars += rootCs[i] + ':' + rootCs.getPropertyValue(rootCs[i]) + ';';
    wrap.setAttribute('style', vars + 'font-family:' + bodyCs.fontFamily + ';color:' + bodyCs.color);
    Array.prototype.forEach.call(fdoc.documentElement.attributes, function (a) { if (a.name !== 'class' && a.name !== 'style') wrap.setAttribute(a.name, a.value); });
    wrap.className = ('wmp-root ' + fdoc.documentElement.className.replace(/\b(wm-pinhost|wm-apause)\b/g, '') + ' ' + fdoc.body.className).trim();
    wrap.classList.toggle('wmp-flon', flOn);
    syncOverlay();
  }
  function syncOverlay() {
    var wrap = shadow && shadow.querySelector('.wmp-root');
    if (wrap) wrap.classList.toggle('wmp-covered', !!(scrim && scrim.classList.contains('on')));
    joinHeader(docked, false);
  }
  function watchScrim() {
    var found = fdoc.body.querySelector(':scope>' + SCRIM);
    if (found !== scrim) {
      if (scrimObs) scrimObs.disconnect();
      scrim = found;
      scrimObs = scrim ? new MutationObserver(syncOverlay) : null;
      if (scrimObs) scrimObs.observe(scrim, { attributes: true, attributeFilter: ['class'] });
    }
    syncOverlay();
  }

  // ---- mirror -----------------------------------------------------------------------------------------------------
  function rebuild() {
    endDock();
    var nb = bar.cloneNode(true);
    nb.removeAttribute('id');
    nb.className = rootClass(bar.getAttribute('class'), false);
    if (big) stick.replaceChild(nb, big); else stick.appendChild(nb);
    big = nb;
    syncSlim();
  }
  function pathOf(node) {
    var path = [];
    for (; node && node !== bar; node = node.parentNode) {
      if (!node.parentNode) return null;
      path.unshift(Array.prototype.indexOf.call(node.parentNode.childNodes, node));
    }
    return node ? path : null;
  }
  function follow(root, path) {
    for (var i = 0; i < path.length && root; i++) root = root.childNodes[path[i]];
    return root;
  }
  // Every change is patched in place onto BOTH layers. Values that are already there are skipped (a no-op write in the real
  // bar, e.g. applyS rewriting the same count, therefore changes nothing in the mirror). Nothing is measured here.
  function onBarChange(records) {
    for (var i = 0; i < records.length; i++) {
      var rec = records[i], path = pathOf(rec.target);
      if (!path) continue;
      var copies = [big, slimEl];
      for (var c = 0; c < copies.length; c++) {
        if (!copies[c]) continue;
        if (!patch(copies[c], follow(copies[c], path), rec)) return rebuild();   // copies drifted: rebuild both
      }
    }
  }
  function patch(copy, node, rec) {
    if (!node) return false;
    var t = rec.target;
    if (rec.type === 'childList') {
      var textOnly = true;
      for (var ch = t.firstChild; ch; ch = ch.nextSibling) if (ch.nodeType !== 3) { textOnly = false; break; }
      if (textOnly) { if (node.textContent !== t.textContent) node.textContent = t.textContent; return true; }   // counts, "Updated hh:mm"
      node.replaceChildren.apply(node, Array.prototype.map.call(t.childNodes, function (n) { return n.cloneNode(true); }));
      return true;
    }
    if (rec.type === 'characterData') { if (node.data !== t.data) node.data = t.data; return true; }
    var name = rec.attributeName, value = t.getAttribute(name);
    if (node === copy) {
      if (name === 'id' || name === 'aria-hidden') return true;
      if (name === 'class') { var cls = rootClass(value, copy === slimEl); if (node.className !== cls) node.className = cls; return true; }
    }
    if (node.getAttribute(name) === value) return true;
    if (value === null) node.removeAttribute(name); else node.setAttribute(name, value);
    return true;
  }

  // ---- geometry (load, resize, size changes only; never per scroll frame, never per bar change) ----------------------
  var mT = 0;   // ported P1 (#251): don't measure while the WMTB transition has the frame fixed/animating
  function moving() { return frame.style.position === 'fixed' || (frame.getAnimations && frame.getAnimations().length > 0); }
  function measure() {
    if (!host || frame.style.display === 'none' || !frame.offsetHeight) return;
    if (moving()) { clearTimeout(mT); mT = setTimeout(measure, 60); return; }
    if (dockAnims) { dirtyMeasure = true; return; }            // transforms would skew the reads; redo when it ends
    var header = document.querySelector('header.topbar');
    headerH = header ? header.getBoundingClientRect().height : 0;
    var fr = frame.getBoundingClientRect(), r = bar.getBoundingClientRect(), box = bar.parentElement.getBoundingClientRect();
    var cs = fdoc.defaultView.getComputedStyle(bar);
    track.style.cssText = 'left:0;top:0;width:' + (r.width + (parseFloat(cs.marginLeft) || 0) + (parseFloat(cs.marginRight) || 0)) +
      'px;height:' + Math.max(r.height, box.bottom - r.top) + 'px';
    stick.style.position = 'static';
    var m = big.getBoundingClientRect(), sb = stick.getBoundingClientRect();
    track.style.left = (fr.left + r.left - sb.left) + 'px';
    track.style.top = (fr.top + r.top - m.top) + 'px';
    var m2 = big.getBoundingClientRect(), s2 = stick.getBoundingClientRect();
    stick.style.position = '';
    var top = Math.round(headerH - (m2.top - s2.top)) - 1;     // whole px, 1px under the top bar
    stick.style.top = top + 'px';
    // Docked band (slim ::before, inset -6px) starts exactly at the top bar's bottom edge: no gap, no overlap.
    if (slimEl) slimEl.style.setProperty('margin-top', (Math.round(headerH) - top + 6) + 'px', 'important');
    watchPin(top);
    placeLauncher(top);
  }

  // Docked state from a 1px sentinel at the track top, observed against a root whose top edge is the sticky line.
  // The sentinel never moves with the bar's size, so swapping layers cannot feed back into it.
  function watchPin(top) {
    if (!window.IntersectionObserver || top === ioTop) return;
    ioTop = top;
    if (io) io.disconnect();
    var first = true;
    io = new IntersectionObserver(function (es) {
      var e = es[es.length - 1];
      var on = !e.isIntersecting && !!e.rootBounds && e.boundingClientRect.height > 0 && e.boundingClientRect.top < e.rootBounds.top;
      setDocked(on, first);                                    // first report after (re)start = initial state, no motion
      first = false;
    }, { rootMargin: (-top) + 'px 0px 0px 0px', threshold: 0 });
    io.observe(sentinel);
  }

  // ---- filter launcher (step 7) ------------------------------------------------------------------------------------
  function buildLauncher() {
    frow = fdoc.querySelector('.wflt-row');
    var real = frow && frow.querySelector('.wflt-b');
    if (flBtn) { flBtn.remove(); flBtn = null; }
    if (!real) return;
    flBtn = real.cloneNode(true);
    flBtn.classList.add('wmp-fl');
    flBtn.setAttribute('aria-expanded', 'false');
    flBtn.addEventListener('click', function (ev) {
      ev.preventDefault(); ev.stopPropagation();
      var rb = frow.getBoundingClientRect(), fr = frame.getBoundingClientRect();
      var want = (flTop || headerH + SLIM + 18) + 20;
      window.scrollBy(0, Math.round(fr.top + rb.top - want));
      var b = frow.querySelector('.wflt-b');
      if (b && b.getAttribute('aria-expanded') !== 'true') b.click();
    });
    stick.appendChild(flBtn);
    // badge / count changes on the real button follow on the copy: one rAF, and only when the markup really differs
    new MutationObserver(function () {
      if (flq) return;
      flq = requestAnimationFrame(function () {
        flq = 0;
        if (!flBtn) return;
        var r = frow.querySelector('.wflt-b');
        if (r && flBtn.innerHTML !== r.innerHTML) flBtn.innerHTML = r.innerHTML;
      });
    }).observe(real, { subtree: true, childList: true, characterData: true, attributes: true });
  }
  function placeLauncher(top) {
    if (!flBtn || !frow) return;
    var bottom = slimEl ? slimEl.offsetTop + slimEl.offsetHeight : 18 + SLIM;   // layout values: unaffected by transforms
    flBtn.style.top = Math.round(bottom + 8) + 'px';
    flTop = Math.round(top + bottom);
    if (flIo && flIo._top === flTop) return;
    if (flIo) flIo.disconnect();
    flIo = new IntersectionObserver(function (es) {
      var e = es[es.length - 1], wrap = shadow.querySelector('.wmp-root');
      var under = !e.isIntersecting && !!e.rootBounds && e.boundingClientRect.top + frame.getBoundingClientRect().top < e.rootBounds.top;
      flOn = under && frame.style.display !== 'none';
      wrap.classList.toggle('wmp-flon', flOn);
    }, { rootMargin: (-flTop) + 'px 0px 0px 0px', threshold: 0 });
    flIo._top = flTop;
    flIo.observe(frow);
  }

  // Forward a tap on either layer to the matching element of the real bar (same children, same order).
  function forward(ev) {
    var path = [], el = ev.target;
    while (el && el !== big && el !== slimEl) { path.unshift(Array.prototype.indexOf.call(el.parentNode.children, el)); el = el.parentNode; }
    if (!el) return;
    var target = bar;
    for (var i = 0; i < path.length && target; i++) target = target.children[path[i]];
    if (target) { ev.preventDefault(); target.click(); }
  }

  function setVisible() {
    var shown = frame.style.display !== 'none';
    track.style.display = shown && frame.style.position !== 'fixed' ? '' : 'none';   // ported P2 (#251): hide while the frame is the ghost
    fdoc.documentElement.classList.toggle('wm-pinhost', shown);
    if (shown) measure();
    joinHeader(docked, false);
  }

  function attach() {
    if (host && fdoc === frame.contentDocument) return;
    fdoc = frame.contentDocument;
    bar = fdoc && fdoc.getElementById('tiles');
    if (!bar) return;
    if (host) host.remove();
    endDock();
    big = null; slimEl = null; docked = false; flBtn = null;
    host = document.createElement('div');
    host.id = 'wmPin';
    host.style.cssText = 'position:relative;height:0;z-index:20';
    frame.parentNode.insertBefore(host, frame);
    shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<style></style><div class="wmp-root"><div class="wmp-track"><div class="wmp-sent"></div><div class="wmp-stick"></div></div></div>';
    styleEl = shadow.querySelector('style');
    track = shadow.querySelector('.wmp-track');
    stick = shadow.querySelector('.wmp-stick');
    sentinel = shadow.querySelector('.wmp-sent');
    ioTop = null;
    styleEl.textContent = frameCss();
    syncTheme();
    bar.classList.remove('slim');
    rebuild();
    stick.addEventListener('click', forward);
    if (flIo) { flIo.disconnect(); flIo = null; }
    buildLauncher();

    new MutationObserver(onBarChange).observe(bar, { subtree: true, childList: true, characterData: true, attributes: true });

    // Theme: attribute changes on <html> only re-sync the theme variables (cheap). The frame's CSS text is re-read only when a
    // <style> is added to <head>. --wvt/--wvh (frame viewport vars, rewritten on every pointer/scroll by wm-fv-inview-js) are
    // ignored: the mirror does not use them, and they were what kept re-triggering a full restyle on every filter tap.
    var rq = 0, needCss = false, restyle = function (css) {
      if (css) needCss = true;
      if (rq) return;
      rq = requestAnimationFrame(function () { rq = 0; if (needCss) { needCss = false; styleEl.textContent = frameCss(); } syncTheme(); });
    };
    var rootSig = function () {
      var h = fdoc.documentElement, st = (h.getAttribute('style') || '').replace(/--wv[th]\s*:[^;]*;?/g, '');
      var s = h.className.replace(/\b(wm-pinhost|wm-apause)\b/g, '').replace(/\s+/g, ' ').trim() + '|' + st;
      Array.prototype.forEach.call(h.attributes, function (a) { if (a.name !== 'class' && a.name !== 'style') s += '|' + a.name + '=' + a.value; });
      return s;
    }, lastSig = rootSig();
    new MutationObserver(function () { var s = rootSig(); if (s !== lastSig) { lastSig = s; restyle(false); } }).observe(fdoc.documentElement, { attributes: true });
    new MutationObserver(function (ms) {
      var own = ms.every(function (m) { return !m.removedNodes.length && Array.prototype.every.call(m.addedNodes, function (n) { return n.id === 'wm-merge-embed'; }); });
      if (!own) restyle(true);
    }).observe(fdoc.head, { childList: true });
    if (scrimObs) scrimObs.disconnect();
    scrim = scrimObs = null;
    new MutationObserver(watchScrim).observe(fdoc.body, { childList: true });
    watchScrim();
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { requestAnimationFrame(measure); });
      ro.observe(frame); ro.observe(bar); ro.observe(bar.parentElement);
    }
    if (fdoc.fonts) { var fm = function () { requestAnimationFrame(measure); }; fdoc.fonts.addEventListener('loadingdone', fm); if (fdoc.fonts.ready) fdoc.fonts.ready.then(fm); }
    setVisible();
  }

  function init() {
    frame = Array.prototype.find.call(document.querySelectorAll('iframe.wmsec'), function (f) { return /(^|\/)main\.html/.test(f.getAttribute('src') || ''); });
    if (!frame) return setTimeout(init, 250);
    frame.addEventListener('load', attach);
    new MutationObserver(function () { if (track) setVisible(); }).observe(frame, { attributes: true, attributeFilter: ['style'] });
    var lastW = innerWidth; addEventListener('resize', function () { if (innerWidth !== lastW) { lastW = innerWidth; measure(); } });
    mq.addEventListener('change', function () { endDock(); });   // reduced motion toggled live: finish at once; next change is instant
    if (frame.contentDocument && frame.contentDocument.readyState === 'complete') attach();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();