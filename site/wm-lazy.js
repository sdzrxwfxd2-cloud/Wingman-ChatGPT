/* wm-lazy.js - Claude plan step 4: render long lists 10 at a time with a skeleton fade.
   The cards are still created by the existing (protected) code; this only keeps everything past the first
   WM_LAZY_BATCH visible cards out of layout/paint (display:none via .wm-lz) and reveals the next batch when a
   skeleton sentinel near the end of the list comes within 900px of the screen. Filters, search and counts are
   untouched because they read the data or other classes, never .wm-lz.
   Undo: set window.WM_LAZY_BATCH=Infinity before this file loads (everything renders like today), or remove
   the <script src="wm-lazy.js"> tags. */
(function () {
  'use strict';
  var BATCH = typeof window.WM_LAZY_BATCH === 'number' ? window.WM_LAZY_BATCH : 10;
  if (!(BATCH > 0) || BATCH === Infinity || !('IntersectionObserver' in window)) { window.WMLazy = { flush: function () {} }; return; }
  var css = document.createElement('style');
  css.id = 'wm-lazy-css';
  css.textContent =
    'html body .wm-lz{display:none!important}' +
    '.wm-lz-in{animation:wmLzIn .24s cubic-bezier(.22,1,.36,1) both}' +
    '@keyframes wmLzIn{from{opacity:0}to{opacity:1}}' +
    '.wm-lz-sk{display:grid;gap:12px;margin:12px 0;transition:opacity .2s}' +
    '.wm-lz-sk[hidden]{display:none}' +
    '.wm-lz-sk i{display:block;height:96px;border-radius:18px;background:currentColor;opacity:.06;animation:wmLzP 1.2s ease-in-out infinite alternate}' +
    '@keyframes wmLzP{to{opacity:.12}}' +
    '@media (prefers-reduced-motion:reduce){.wm-lz-in,.wm-lz-sk i{animation:none}}';
  (document.head || document.documentElement).appendChild(css);
  var lists = [];
  function setup(box, cardSel, hiddenRe) {
    if (!box || box.__wmLazy) return;
    var L = { box: box, sel: cardSel, re: hiddenRe, shown: BATCH, busy: false, sig: '' };
    box.__wmLazy = L;
    var sk = document.createElement('div');
    sk.className = 'wm-lz-sk'; sk.setAttribute('aria-hidden', 'true'); sk.innerHTML = '<i></i><i></i>';
    box.after(sk); L.sk = sk;
    L.io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { L.shown += BATCH; apply(L, true); }
    }, { rootMargin: '900px 0px' });
    L.io.observe(sk);
    L.mo = new MutationObserver(function (rs) {
      if (L.busy) return;
      schedule(L);
    });
    L.mo.observe(box, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    lists.push(L); apply(L, false);
  }
  function schedule(L) { if (L.t) return; L.t = requestAnimationFrame(function () { L.t = 0; apply(L, false); }); }
  function apply(L, grow) {
    L.busy = true;
    var all = [].slice.call(L.box.querySelectorAll(L.sel));
    var vis = all.filter(function (c) { return !L.re.test(c.className.replace(/\bwm-lz(-in)?\b/g, '')); });
    var sig = vis.length + '|' + (vis[0] ? vis[0].id || vis[0].textContent.slice(0, 40) : '');
    if (!grow && sig !== L.sig) L.shown = BATCH;   /* new filter result: start again from the first 10 */
    L.sig = sig;
    vis.forEach(function (c, i) {
      var hide = i >= L.shown, was = c.classList.contains('wm-lz');
      if (hide !== was) c.classList.toggle('wm-lz', hide);
      if (was && !hide) { c.classList.add('wm-lz-in'); c.addEventListener('animationend', function f() { c.classList.remove('wm-lz-in'); c.removeEventListener('animationend', f); }); }
    });
    all.forEach(function (c) { if (L.re.test(c.className.replace(/\bwm-lz(-in)?\b/g, '')) && c.classList.contains('wm-lz')) c.classList.remove('wm-lz'); });
    L.sk.hidden = vis.length <= L.shown;
    L.mo && L.mo.takeRecords();
    L.busy = false;
    /* sentinel still on screen after a reveal (fast fling): keep going next frame */
    if (grow && !L.sk.hidden) requestAnimationFrame(function () {
      var r = L.sk.getBoundingClientRect(); if (r.top < innerHeight + 900 && r.bottom > -900) { L.shown += BATCH; apply(L, true); }
    });
  }
  function flush() { lists.forEach(function (L) { L.shown = 1e9; apply(L, true); }); }
  window.WMLazy = { flush: flush, setup: setup, batch: BATCH };
  addEventListener('hashchange', flush);
  addEventListener('beforeprint', flush);
  function init() {
    setup(document.getElementById('g2'), ':scope>.c.wx', /\bwds-h\b/);
    setup(document.getElementById('g3'), ':scope>.c.wx', /\bwds-h\b/);
    if (location.hash.length > 1) { try { var t = document.querySelector(location.hash); if (t && t.closest('.wm-lz')) flush(); } catch (e) {} }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
