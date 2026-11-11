/* Theme toggle copy for Settings (MT t1553/t1556). An exact copy of the main page Settings switch:
   sun / moon slider, with the two theme names for the chosen side underneath (Pearl, Champagne by day; Midnight, Amethyst by night).
   Remembers the last choice: it writes the same keys the main page uses (wm-theme, wm-pal, wm-pal-day), so whatever the pilot
   picked last, on the main page or in Settings, is their default the next time any page opens. No theme values change here.
   Use: <div data-wm-theme-toggle></div> on any page that already carries the main page theme variables.
   Preview: c/main.html?st=1 opens a Settings card with the copy. */
(function () {
  var H = document.documentElement, LS = window.localStorage;
  var get = function (k, d) { try { return LS.getItem(k) || d } catch (e) { return d } };
  var put = function (k, v) { try { LS.setItem(k, v) } catch (e) {} };
  var TN = { white: 'Pearl', beige: 'Champagne', black: 'Midnight', purple: 'Amethyst' };
  var DI = {
    day: '<svg class="wmdn" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M5.3 18.7L7 17M17 7l1.7-1.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>',
    night: '<svg class="wmdn" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 14.6A8.4 8.4 0 0 1 9.4 3.8a8.4 8.4 0 1 0 10.8 10.8Z" fill="currentColor"/></svg>'
  };
  var CSS = '.wtt h6{margin:0 0 8px;font:600 11px/1 -apple-system,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--tx3)}' +
    '.wtt .sw{position:relative;display:grid;grid-auto-flow:column;grid-auto-columns:1fr;padding:3px;border-radius:14px;background:var(--gl2);box-shadow:inset 0 0 0 .5px var(--ln);margin-bottom:10px}' +
    '.wtt .sw button{position:relative;z-index:1;border:0;background:none;color:var(--tx2);font:600 13px/1 -apple-system,sans-serif;height:32px;border-radius:11px;cursor:pointer;transition:color .4s var(--ease)}' +
    '.wtt .sw button.on{color:var(--tx)}' +
    '.wtt .sw i{position:absolute;top:3px;bottom:3px;left:3px;border-radius:11px;background:var(--gl);box-shadow:inset 0 1px 0 var(--hl),inset 0 0 0 .5px var(--ln),0 3px 10px rgba(0,0,0,.18);transition:transform .5s var(--ease),width .5s var(--ease)}' +
    'html[data-theme=day] .wtt .sw i{background:#fff}.wtt .wmdn{width:18px;height:18px;display:block;margin:auto;pointer-events:none}' +
    '.wtt-note{margin:2px 2px 0;font:400 12px/1.4 -apple-system,sans-serif;color:var(--tx3)}';
  function sw(k, a, b) { return '<div class="sw" data-k="' + k + '"><i></i><button type="button" data-v="' + a[0] + '">' + a[1] + '</button><button type="button" data-v="' + b[0] + '">' + b[1] + '</button></div>' }
  function name(v) { return '<span class="wmtn wmtn-' + TN[v].toLowerCase() + '">' + TN[v] + '</span>' }
  function init(sw_, val, cb) {
    var bs = [].slice.call(sw_.querySelectorAll('button')), pill = sw_.querySelector('i');
    var set = function (b, user) { bs.forEach(function (x) { x.classList.toggle('on', x === b) }); pill.style.width = b.offsetWidth + 'px'; pill.style.transform = 'translateX(' + (b.offsetLeft - 3) + 'px)'; if (user) cb(b.dataset.v) };
    bs.forEach(function (b) { b.onclick = function () { set(b, 1) } });
    sw_._set = function (v) { var b = bs.filter(function (x) { return x.dataset.v === v })[0] || bs[0]; set(b, 0) };
    requestAnimationFrame(function () { sw_._set(val) });
  }
  function mount(el) {
    if (el.dataset.wttOn) return; el.dataset.wttOn = '1'; el.classList.add('wtt');
    el.innerHTML = '<h6>Theme</h6>' + sw('theme', ['day', DI.day], ['night', DI.night]) +
      sw('paln', ['black', name('black')], ['purple', name('purple')]) + sw('pald', ['white', name('white')], ['beige', name('beige')]) +
      '<p class="wtt-note">Your last choice is remembered and opens next time.</p>';
    var t = el.querySelector('[data-k=theme]'), pn = el.querySelector('[data-k=paln]'), pd = el.querySelector('[data-k=pald]');
    var gN = function () { return get('wm-pal', 'black') === 'purple' ? 'purple' : 'black' }, gD = function () { return get('wm-pal-day', 'white') === 'beige' ? 'beige' : 'white' };
    var show = function () { var d = H.dataset.theme === 'day'; pn.style.display = d ? 'none' : ''; pd.style.display = d ? '' : 'none'; H.dataset.pal = d ? gD() : gN(); requestAnimationFrame(function () { (d ? pd : pn)._set(d ? gD() : gN()) }) };
    init(t, H.dataset.theme === 'day' ? 'day' : 'night', function (v) { H.dataset.theme = v; H.classList.toggle('dark', v === 'night'); put('wm-theme', v); show(); sync() });
    init(pn, gN(), function (v) { put('wm-pal', v); if (H.dataset.theme !== 'day') H.dataset.pal = v; sync() });
    init(pd, gD(), function (v) { put('wm-pal-day', v); if (H.dataset.theme === 'day') H.dataset.pal = v; sync() });
    el._refresh = function () { t._set(H.dataset.theme === 'day' ? 'day' : 'night'); show() };
    show();
  }
  /* keep the main page sheet and every copy in step */
  function sync() { [].forEach.call(document.querySelectorAll('.sheet [data-k]'), function (s) { var k = s.dataset.k; if (!s._set) return; s._set(k === 'theme' ? H.dataset.theme : k === 'paln' ? get('wm-pal', 'black') : get('wm-pal-day', 'white')) }) }
  function all() { var s = document.getElementById('wtt-css'); if (!s) { s = document.createElement('style'); s.id = 'wtt-css'; s.textContent = CSS; document.head.appendChild(s) } [].forEach.call(document.querySelectorAll('[data-wm-theme-toggle]'), mount) }
  window.WMThemeToggle = { mount: function (el) { all(); mount(el) } };
  addEventListener('storage', function (e) { if (/^wm-(theme|pal)/.test(e.key || '')) location.reload() });
  if (new URLSearchParams(location.search).get('st') === '1') {
    var go = function () { var c = document.createElement('div'); c.className = 'sheet glass on'; c.style.cssText = 'position:fixed;left:12px;right:12px;top:96px;z-index:9999;max-width:420px;margin:auto'; c.innerHTML = '<h5 class="shh">Settings</h5><div data-wm-theme-toggle></div>'; document.body.appendChild(c); all(); new MutationObserver(function () { var x = c.querySelector('.wtt'); x && x._refresh && x._refresh() }).observe(H, { attributes: true, attributeFilter: ['data-theme'] }) };
    document.readyState === 'loading' ? addEventListener('DOMContentLoaded', go) : go();
  } else all();
})();
