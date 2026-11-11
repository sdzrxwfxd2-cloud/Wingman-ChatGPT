/* Use the pilot's device-local time, like the original greeting. The SAST clock
   is deliberately separate: travelling pilots should not get a South African
   morning greeting during their local evening. No profile/auth data is needed. */
(function () {
  'use strict';
  var timer;
  function update() {
    var greeting = document.getElementById('greet');
    if (!greeting) return;
    var hour = new Date().getHours();
    var text = hour >= 5 && hour < 12 ? 'Good morning' : hour >= 12 && hour < 18 ? 'Good afternoon' : 'Good evening';
    if (greeting.textContent !== text) greeting.textContent = text;
  }
  function refresh() {
    clearTimeout(timer);
    update();
    // Recheck at each minute boundary, including after a device clock change.
    timer = setTimeout(refresh, 60000 - (Date.now() % 60000));
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh, { once: true });
  } else {
    refresh();
  }
  window.addEventListener('pageshow', refresh); // Back/forward cache restore.
  window.addEventListener('focus', refresh);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) refresh();
  });
})();
