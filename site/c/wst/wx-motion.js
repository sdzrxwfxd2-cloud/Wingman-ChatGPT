/* wx-motion — open/close motion for ATO/DFE cards (MT-approved, 29 Oct 2026).
 * One owner per tap. Every tap reads where cards are on screen right now (mid-flight included),
 * cancels only its own running animations, snaps the layout, then glides from there (FLIP).
 * Only translate/transform, clip-path, opacity and filter are animated; height is never animated.
 * Open: card unfolds via clip reveal, content arrives blur -> sharp with a small rise, staggered.
 * Opening card is lifted above open ones while it unfolds; max 3 open per list, counted at tap time.
 * Close (#17): the exact reverse of the open, same length (~1.07 s). The open's animations are
 * kept on the card and played backwards; a tap mid-open turns back from where it is, and a tap
 * mid-close turns forward again. Reduced motion: instant.
 */
(function () {
  'use strict';
  if (window.WM_CARD_MOTION_V2 === true) return;   // Claude plan step 5: card-motion.js owns the cards
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const touch = matchMedia('(hover: none)');
  // MT t1955: cards use the live ATO/DFE filter motion (c/wst/wmf9.js + wm-filter-kit.js): EASE .32,.72,0,1, open 500 / close 420 + 60 delay,
  // items: opacity + translateY(-6px) + blur(2px), .14s + 22ms stagger, ease .22,1,.36,1 (values copied, unchanged).
  const EASE = 'cubic-bezier(.32,.72,0,1)';
  const ITEM_EASE = 'cubic-bezier(.22,1,.36,1)';
  // open: card unfold; itemIn/itemDelay/itemStep: staggered content; fadeOut: eviction dissolve.
  const T = { open: 500, close: 420, closeDelay: 60, fadeOut: 150, itemIn: 440, itemDelay: 140, itemStep: 22 };
  const MAX_BLURRED = 6;            // later items fade without blur (cheaper on phones)
  const TAG = 'wx-motion';          // id on our animations, so we never cancel anyone else's
  const MAX_OPEN = 3;               // per list; opening a 4th closes the oldest
  const MOVING = 'wxmot';           // html class: glass blur is paused while cards move
  let seq = 0, settleTimer = 0;

  const items = card => card.querySelectorAll('.wx-in > *');
  const cancelOwn = el => el.getAnimations().forEach(a => { if (a.id === TAG) a.cancel(); });

  function setOpen(card, open) {
    card.classList.toggle('open', open);
    const head = card.querySelector('.wx-head');
    if (head) head.setAttribute('aria-expanded', String(open));
  }

  function nearbyCards(card) {
    const vh = innerHeight;
    const list = [...card.parentElement.children].filter(el => {
      if (!el.classList.contains('wx') || el.classList.contains('wds-h')) return false;
      const r = el.getBoundingClientRect();
      return r.bottom > -300 && r.top < vh + 400;
    });
    if (!list.includes(card)) list.push(card);
    return list;
  }

  // Staggered content entrance. Returns the animations so the close can play them backwards.
  function contentIn(card) {
    const blur = 2;   // wmf9 .wmf-it: blur(2px), translateY(-6px)
    return [...items(card)].map((el, i) => {
      const from = i < MAX_BLURRED
        ? { opacity: 0, filter: `blur(${blur}px)`, transform: 'translateY(-6px)' }
        : { opacity: 0, transform: 'translateY(-6px)' };
      const to = i < MAX_BLURRED ? { opacity: 1, filter: 'blur(0)', transform: 'none' } : { opacity: 1, transform: 'none' };
      return el.animate([from, to], {
        id: TAG, duration: T.itemIn, easing: ITEM_EASE, fill: 'both',
        delay: T.itemDelay + Math.min(i, MAX_BLURRED) * T.itemStep,
      });
    });
  }

  // FLIP keyframes for one card: from its old box `a` to its new box `b`. The revealing card
  // also unclips from its old size. Returns null when the card does not move.
  function flipFrames(el, a, b, reveal, radius) {
    const dx = a.left - b.left, dy = a.top - b.top;
    if (!reveal && Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return null;
    // `translate` (not `transform`): wds.css pins card transform:none !important.
    const from = { translate: `${dx}px ${dy}px` }, to = { translate: '0 0' };
    if (reveal) {
      from.clipPath = `inset(0 ${Math.max(0, b.width - a.width)}px ${Math.max(0, b.height - a.height)}px 0 round ${radius})`;
      to.clipPath = `inset(0 0 0 0 round ${radius})`;
    }
    return [from, to];
  }

  /* The open timeline of a card: every animation it started, kept on the card so the close can
   * reverse it. Each is padded with endDelay to one shared end time, so played backwards the
   * stagger mirrors the open exactly (content leaves last-in-first-out, then the card folds).
   * will-change is set only while the timeline is moving and removed on finish or cancel. */
  function track(card, anims) {
    const end = Math.max(...anims.map(a => a.effect.getComputedTiming().endTime));
    const movers = [card, ...items(card)];
    anims.forEach(a => {
      const t = a.currentTime;
      a.effect.updateTiming({ fill: 'both', endDelay: end - a.effect.getComputedTiming().endTime });
      a.currentTime = t;                           // updateTiming must not move the playhead
    });
    movers.forEach(el => { el.style.willChange = 'translate, opacity'; });
    const tl = { anims, closing: false };
    card._wxTimeline = tl;
    const release = () => {
      if (card._wxTimeline !== tl) return;         // a newer timeline owns the card
      card._wxTimeline = null;
      movers.forEach(el => { el.style.willChange = ''; });
    };
    Promise.all(anims.map(a => a.finished)).then(() => {
      if (card._wxTimeline !== tl) return;
      if (tl.closing) { setOpen(card, false); card.classList.remove('wx-closing'); }
      anims.forEach(a => a.cancel());              // hand the final frame back to plain CSS
      release();
      if (tl.seq === seq) document.documentElement.classList.remove(MOVING);
    }, release);                                   // cancelled by a newer tap
    return tl;
  }

  function settle(card, opening, duration, mySeq) {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      if (mySeq !== seq) return;                 // a newer tap owns the motion now
      document.documentElement.classList.remove(MOVING);
      if (!opening || !card.classList.contains('open')) return;
      const top = card.getBoundingClientRect().top;
      if (top < 80 || top > innerHeight - 160) scrollTo({ top: scrollY + top - 100, behavior: 'smooth' });
    }, duration + T.itemIn - 100);
  }

  // Lift the opening card above already-open ones for the duration of its reveal animation.
  // The animation is remembered on the card; cleanup runs when it finishes OR is cancelled
  // (a quick next tap cancels it), but only if it is still the card's current lift — so a
  // newer lift started by that next tap is never undone by the old one's cleanup.
  function lift(card, anim) {
    card._wxLift = anim;
    if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
    card.style.zIndex = '3';
    const drop = () => {
      if (card._wxLift !== anim) return;
      card._wxLift = null;
      card.style.zIndex = ''; card.style.position = '';
    };
    anim.addEventListener('finish', drop);
    anim.addEventListener('cancel', drop);
  }

  // A card "wants" to be open if it is open (and not fading out), or if its opening is
  // scheduled behind an eviction fade. Counting scheduled openings is what keeps the
  // per-list limit at MAX_OPEN even when taps arrive faster than the fade.
  const wantsOpen = el => !!el._wxPending ||
    (el.classList.contains('open') && !el.classList.contains('wx-closing'));

  function oldestOpen(card) {
    const open = [...card.parentElement.children].filter(el =>
      el !== card && el.classList.contains('wx') && wantsOpen(el));
    if (open.length < MAX_OPEN) return null;
    // Prefer evicting a card that is really open; within each group, the oldest tap goes first.
    return open.sort((a, b) => (!!a._wxPending - !!b._wxPending) || (a._wxAt || 0) - (b._wxAt || 0))[0];
  }

  // Drop a scheduled (not yet started) opening. The card it was about to replace has already
  // faded its content, so fold that one now instead of leaving it half-closed.
  function cancelPending(card) {
    clearTimeout(card._wxClose);
    const ev = card._wxPending;
    card._wxPending = null;
    if (ev instanceof Element && ev.classList.contains('wx-closing')) glide(ev, false);
  }

  function fadeOut(card) {
    card.classList.add('wx-closing');
    [...items(card)].slice(0, 8).forEach(el => {
      cancelOwn(el);
      el.animate([{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(4px)' }],
        { id: TAG, duration: T.fadeOut, easing: 'ease-in', fill: 'forwards' });
    });
  }

  function glide(card, opening, evict) {
    const mySeq = ++seq;
    const cards = nearbyCards(card);
    if (evict && !cards.includes(evict)) cards.push(evict);
    const before = new Map(cards.map(el => [el, el.getBoundingClientRect()]));
    cards.forEach(el => { if (el !== card) snapClosed(el); });
    cards.forEach(cancelOwn);
    items(card).forEach(cancelOwn);

    setOpen(card, opening);
    card.classList.remove('wx-closing');
    if (evict) { setOpen(evict, false); evict.classList.remove('wx-closing'); }
    document.documentElement.classList.add(MOVING);

    const duration = T.open;
    const radius = getComputedStyle(card).borderRadius || '22px';
    const anims = [];
    cards.forEach(el => {
      const reveal = el === card && opening;
      const frames = flipFrames(el, before.get(el), el.getBoundingClientRect(), reveal, radius);
      if (!frames) return;
      const an = el.animate(frames, { id: TAG, duration, easing: EASE });
      if (reveal) lift(card, an);
      if (opening) anims.push(an);
    });
    if (opening) track(card, anims.concat(contentIn(card))).seq = mySeq;
    settle(card, opening, duration, mySeq);
  }

  /* toggle(card, fill): fill() builds the card body on first open. */
  function toggle(card, fill) {
    // A tap on a card whose opening is still scheduled simply calls that opening off.
    if (card._wxPending) { cancelPending(card); return; }
    // A tap mid-close turns the same timeline forward again, from where it is.
    const tl = card._wxTimeline;
    if (tl && tl.closing) { tl.seq = ++seq; turn(card, tl, false); return; }
    const opening = !card.classList.contains('open') || card.classList.contains('wx-closing');
    if (opening) fill();
    clearTimeout(card._wxClose);
    let evict = opening ? oldestOpen(card) : null;
    // Limit is enforced at tap time; if the only candidate is itself still scheduled, cancel it.
    if (evict && evict._wxPending) { cancelPending(evict); evict = null; }
    if (evict) clearTimeout(evict._wxClose);
    if (opening) card._wxAt = performance.now();     // tap order decides who is "oldest"
    if (reduced.matches) {
      card.classList.remove('wx-closing'); setOpen(card, opening);
      if (evict) { evict.classList.remove('wx-closing'); setOpen(evict, false); }
      return;
    }
    if (opening && !evict) { glide(card, true); return; }
    // Opening a 4th: the oldest card's content dissolves, then both fold/unfold in one glide.
    // Until then the card counts as open (_wxPending), so further taps respect the limit.
    if (evict) {
      fadeOut(evict);
      card._wxPending = evict;
      card._wxClose = setTimeout(() => {
        card._wxPending = null;
        // If the evicted card was re-opened meanwhile, it is no longer ours to fold.
        glide(card, true, evict.classList.contains('wx-closing') ? evict : null);
      }, T.fadeOut);
      return;
    }

    closeReverse(card);
  }

  /* Close = the open played backwards, same duration. If the open is still running, its own
   * animations turn around from where they are; otherwise the finished open is rebuilt, parked
   * on its last frame (one layout read, no visible change) and reversed. */
  function closeReverse(card) {
    const mySeq = ++seq;
    let tl = card._wxTimeline;
    if (!tl) {
      const cards = nearbyCards(card);
      cards.forEach(el => { if (el !== card) snapClosed(el); });
      const openBox = new Map(cards.map(el => [el, el.getBoundingClientRect()]));
      setOpen(card, false);
      const closedBox = new Map(cards.map(el => [el, el.getBoundingClientRect()]));
      setOpen(card, true);
      cards.forEach(cancelOwn);
      items(card).forEach(cancelOwn);
      const radius = getComputedStyle(card).borderRadius || '22px';
      const anims = [];
      cards.forEach(el => {
        const frames = flipFrames(el, closedBox.get(el), openBox.get(el), el === card, radius);
        if (frames) anims.push(el.animate(frames, { id: TAG, duration: T.open, easing: EASE }));
      });
      anims.push(...contentIn(card));
      anims.forEach(a => a.pause());
      tl = track(card, anims);
      anims.forEach(a => { a.currentTime = a.effect.getComputedTiming().endTime; });
    }
    tl.seq = mySeq;
    turn(card, tl, true);
  }

  // Finish a neighbour's running close at once, so a new FLIP measures its real closed box.
  function snapClosed(el) {
    const tl = el._wxTimeline;
    if (!tl || !tl.closing) return;
    el._wxTimeline = null;
    [el, ...items(el)].forEach(x => { x.style.willChange = ''; });
    setOpen(el, false); el.classList.remove('wx-closing');
    tl.anims.forEach(a => a.cancel());
  }

  // Point a timeline backwards (closing) or forwards (re-opening) from its current frame.
  function turn(card, tl, closing) {
    tl.closing = closing;
    card.classList.toggle('wx-closing', closing);
    document.documentElement.classList.add(MOVING);
    // close runs at the filter's close length (420 ms + 60 ms delay vs the 500 ms open)
    const rate = closing ? -(T.open + T.itemDelay) / (T.close + T.closeDelay) : 1;
    tl.anims.forEach(a => {
      a.playbackRate = rate;
      a.play();
    });
  }

  window.WXMotion = { toggle };
})();
