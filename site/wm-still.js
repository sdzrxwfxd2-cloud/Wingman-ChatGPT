/* wm-still.js (t1882) — the pinned GO / CAUTION / NO-GO bar must not MOVE while it docks / undocks.
 * Cause: wm-pin.js's dock animation slides the full bar up 10px + shrinks it (scale .97) and slides the slim bar's tiles
 * up 10px from below (scale .985), so the bar visibly shifts position on every pin / unpin.
 * Fix: inside the mirror's shadow root, transforms are held at none ONLY while the dock animation runs (.wmp-anim).
 * !important author CSS wins over Web Animations, so the opacity crossfade (the animation) still plays, but nothing slides.
 * wm-pin.js is untouched. Kill switch: ?still=0. */
(function () {
  'use strict';
  try { if (new URLSearchParams(location.search).get('still') === '0') return; } catch (e) { }
  var CSS = '.wmp-stick.wmp-anim>.tiles,.wmp-stick.wmp-anim>.tiles.wmp-s>*{transform:none!important;translate:none!important;scale:none!important}';
  var done = null;
  function fix() {
    if (done && done.isConnected && done.shadowRoot.getElementById('wm-still')) return;
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var sr = all[i].shadowRoot;
      if (sr && sr.querySelector('.wmp-stick') && !sr.getElementById('wm-still')) {
        var s = document.createElement('style'); s.id = 'wm-still'; s.textContent = CSS; sr.appendChild(s);
      }
      if (sr && sr.getElementById('wm-still')) {
        done = all[i];
      }
    }
  }
  var q = 0;
  function sched() { if (q) return; q = 1; requestAnimationFrame(function () { q = 0; fix(); }); }
  function start() { fix(); new MutationObserver(sched).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
