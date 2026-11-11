/* Claude plan step 8: pause infinite decorative animations (search glow fs-spin,
   card breathing glow) while the page scrolls or is hidden. Undo: remove the
   <script> tag that loads this file. */
(function(){
  if (window.__wmAnimPause) return; window.__wmAnimPause = 1;
  var d = document, h = d.documentElement, t = 0;
  var s = d.createElement('style'); s.id = 'wm-anim-pause';
  s.textContent = 'html.wm-apause .fs-field::before,html.wm-apause .fs-field::after,' +
    'html.wm-apause .v2glow,html.wm-apause .card::after,html.wm-apause .wmr-bloom' +
    '{animation-play-state:paused!important}';
  (d.head || h).appendChild(s);
  function on(){ h.classList.add('wm-apause'); clearTimeout(t); t = setTimeout(off, 160); }
  function off(){ if (!d.hidden) h.classList.remove('wm-apause'); }
  function vis(){ if (d.hidden) { clearTimeout(t); h.classList.add('wm-apause'); } else off(); }
  var o = {passive:true}; // document scroll only; inner scrollers (tickers) must not hold the pause
  window.addEventListener('scroll', on, o);
  try { if (window.parent !== window && window.parent.document) window.parent.addEventListener('scroll', on, o); } catch(e) {}
  d.addEventListener('visibilitychange', vis); vis();
})();
