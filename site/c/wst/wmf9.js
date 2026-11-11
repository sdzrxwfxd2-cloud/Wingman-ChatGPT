/* wmf9.js: inline ATO + DFE filters for c/app.html (MT, 30 Oct 2026).
 *
 * One shared builder, make(cfg), draws the filter; each page only supplies a config
 * (ato() and dfe() below). The DFE filter (MT, 30 Oct 11:41) reuses the ATO look and motion exactly,
 * with the DFE register's own fields: Province, Designation, Sort, Per page and "Include expired".
 *
 * Motion and layout follow the v9 "expand" reference (filter_expand_midnight_390):
 *   - a single glass shell sits behind the search row; on open it grows 7 px up, 9 px left/right
 *     and down around the panel (0.5 s, cubic-bezier(.32,.72,0,1)); on close it shrinks (0.42 s, 60 ms delay).
 *   - panel items fade/slide in with a 22 ms stagger (opacity .34 s, transform .44 s, 140 ms lead-in).
 *   - the search pill never moves.
 * Page behaviour confirmed by MT:
 *   1. inline: the panel lives inside the ATO page and pushes the school list down (no overlay, no scrim);
 *   2. it stays open: only the filter button closes it (no outside-tap, Escape or "Show" auto-collapse);
 *   3. starts collapsed on every page load (MT 9 Nov); open with the filter button;
 *   4. count badge on the filter button (17 px, bold 10 px numeral, 2 px ring) and a page subtitle
 *      "N of M ATOs · k filters" with the real numbers.
 * The old wq.js / wds.js filter controls (locked files) stay in the DOM and are driven, just hidden.
 * No external assets: fonts are the site's self-hosted Clash Display / Satoshi, icons are inline SVG.
 */
(function(){
'use strict';

/* ---------- theme tokens (V18 soft spec) + count-badge colours ---------- */
const CSS=`
.wmf{--gl:rgba(28,28,30,.55);--tx:#F5F5F7;--mu:rgba(235,235,245,.55);--ac:#0A84FF;--ln:rgba(255,255,255,.10);--hi:rgba(255,255,255,.10);--tint:rgba(10,132,255,.10);
 --glow:linear-gradient(180deg,rgba(40,70,255,.20),rgba(0,25,201,.12));--gr:rgba(80,100,255,.30);--gt:#9DB1FF;
 --b1:#F5F5F7;--b2:#C9CCD6;--bn:#0B0B12;--bgl:0 0 10px rgba(255,255,255,.18);--br:#000;--n1:#F5F5F7;
 position:relative;z-index:40;padding:4px;margin:0 0 12px;color:var(--tx);font-family:Satoshi,-apple-system,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
html.dark.pal-purple .wmf{--gl:rgba(40,26,74,.48);--tx:#F3EEFF;--mu:rgba(217,200,255,.58);--ac:#D4CCFF;--ln:rgba(196,176,255,.16);--hi:rgba(255,236,248,.12);--tint:rgba(170,140,255,.14);
 --glow:linear-gradient(180deg,rgba(170,140,255,.28),rgba(120,80,210,.14));--gr:rgba(196,176,255,.40);--gt:#D9C8FF;
 --b1:#E6E0FF;--b2:#BFB2FF;--bn:#1A1230;--bgl:0 0 10px rgba(191,178,255,.35);--br:#0B0716;--n1:#F3EEFF}
html:not(.dark) .wmf{--gl:rgba(255,255,255,.62);--tx:#0B0B12;--mu:rgba(60,60,67,.6);--ac:#0019C9;--ln:rgba(0,0,0,.07);--hi:rgba(255,255,255,.9);--tint:rgba(0,25,201,.05);
 --glow:linear-gradient(180deg,rgba(0,25,201,.11),rgba(0,25,201,.06));--gr:rgba(0,25,201,.18);--gt:#0019C9;
 --b1:#2438D6;--b2:#0019C9;--bn:#fff;--bgl:none;--br:#F2F2F5;--n1:#0019C9}
html.pal-beige:not(.dark) .wmf{--gl:rgba(255,251,243,.66);--tx:#2A2012;--mu:rgba(110,83,31,.62);--ac:#8E6F33;--ln:rgba(142,111,51,.14);--hi:rgba(255,250,235,.9);--tint:rgba(201,150,58,.08);
 --glow:linear-gradient(180deg,rgba(201,150,58,.17),rgba(168,122,30,.08));--gr:rgba(168,122,30,.28);--gt:#8A6418;
 --b1:#A88443;--b2:#8E6F33;--bn:#FFF8EA;--bgl:none;--br:#F4EEE3;--n1:#6E531F}
.wmf button{font:inherit;color:inherit;background:none;border:0;margin:0;padding:0;min-height:0;min-width:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
.wmf button:focus-visible{outline:2px solid var(--gt);outline-offset:2px}

/* v9 shell: the only element that resizes, so the search pill never moves */
.wmf-sh{position:absolute;z-index:-1;left:0;right:0;top:0;border-radius:22px;pointer-events:none;background:var(--gl);
 -webkit-backdrop-filter:blur(30px) saturate(160%);backdrop-filter:blur(30px) saturate(160%);
 box-shadow:inset 0 1px 0 var(--hi),inset 0 0 0 1px var(--ln),0 20px 40px -24px rgba(0,0,0,.35)}
.wmf[data-s=open]{z-index:90}
.wmf[data-s=open] .wmf-sh{background:linear-gradient(160deg,var(--tint),transparent 60%),var(--gl);-webkit-backdrop-filter:blur(30px) saturate(160%);backdrop-filter:blur(30px) saturate(160%)}
.wmf-row{display:flex;gap:8px;align-items:center}

/* v8b search pill + rotating hint */
.wmf-sp{flex:1;min-width:0;height:36px;border-radius:18px;position:relative;display:flex;align-items:center;justify-content:center;gap:9px;overflow:hidden;
 background:linear-gradient(180deg,var(--tint),transparent),var(--gl)!important;box-shadow:inset 0 1px 0 var(--hi),inset 0 0 0 1px var(--ln)!important;color:var(--tx)!important;padding:0!important;margin:0!important}
.wmf-sp>svg{flex:none;opacity:.7;position:relative;z-index:1;pointer-events:none}
html body section .wmf .wmf-sp input,html body #ato .wmf .wmf-sp input,html body #dfe .wmf .wmf-sp input{position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0 16px 0 40px;border:0;outline:0;background:transparent;box-shadow:none;border-radius:18px;
 color:var(--tx);font:500 15px Satoshi,sans-serif;-webkit-appearance:none;appearance:none;background:transparent!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;filter:none!important;z-index:2}
.wmf-sp input::placeholder{color:transparent}
.wmf-sp input::-webkit-search-cancel-button{-webkit-appearance:none}
.wmf-sp:focus-within>svg,.wmf-sp.typed>svg{position:absolute;left:16px}
.wmf-sp:focus-within>svg,.wmf-sp.typed>svg{opacity:0;transition:opacity .18s ease}html body section .wmf .wmf-sp:focus-within input,html body section .wmf .wmf-sp.typed input{padding-left:16px!important}
.wmf-hint{position:relative;height:22px;display:flex;align-items:center;gap:.32em;font:600 14px/22px "Clash Display",Satoshi,sans-serif;letter-spacing:.01em;white-space:nowrap;pointer-events:none;color:var(--tx)!important}
.wmf-sp:focus-within .wmf-hint,.wmf-sp.typed .wmf-hint{visibility:hidden}
.wmf-hint .fx{opacity:.5}
.wmf .wmf-sgw+.wmf-sgw{margin-top:10px}.wmf .wmf-note{margin:6px 4px 2px;font:500 12px Satoshi,sans-serif;color:var(--tx);opacity:.6;text-align:center}
.wmf .wmf-mh{margin:2px 6px 8px;font:500 12px/1.35 Satoshi,sans-serif;color:var(--mu);text-align:left;letter-spacing:.01em}
.wmf-hint .rot{display:inline-grid;height:22px;overflow:hidden;flex:none}
.wmf-hint .rot span{grid-area:1/1;white-space:nowrap;transition:opacity .5s cubic-bezier(.4,0,.2,1),transform .5s cubic-bezier(.4,0,.2,1),filter .5s cubic-bezier(.4,0,.2,1)}
.wmf-hint .rot span.out,.wmf-hint .rot span.in{opacity:0;filter:blur(3.5px)}
.wmf-hint .rot span.out{transform:translateY(-11px)}.wmf-hint .rot span.in{transform:translateY(11px);transition:none}

/* filter button + approved count badge */
.wmf-fb{flex:none;width:36px;height:36px;border-radius:18px;display:grid;place-items:center;position:relative;overflow:visible;color:var(--mu);
 background:linear-gradient(180deg,var(--tint),transparent),var(--gl)!important;box-shadow:inset 0 1px 0 var(--hi),inset 0 0 0 1px var(--ln)}
.wmf-fb svg{opacity:.7}
.wmf[data-f] .wmf-fb{color:var(--ac)}.wmf[data-f] .wmf-fb svg{opacity:1}
.wmf-bd{position:absolute;top:-5px;right:-5px;width:17px;height:17px;border-radius:50%;display:none;place-items:center;
 background:linear-gradient(180deg,var(--gt),var(--ac));color:var(--bn);font:700 10px/1 Satoshi;box-shadow:0 0 0 2px var(--br),0 2px 8px -1px var(--gr);
 transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
/* count badge = theme accent (--gt -> --ac) with the theme's badge ink, pinned against outer colour rules */
html body .wmf .wmf-fb .wmf-bd{color:var(--bn)!important}
/* MT 30 Oct 11:38: midnight = original silver fill (--b1 -> --b2) with dark ink; midnight + amethyst drop the dark ring */
html.dark:not(.pal-purple) body .wmf .wmf-fb .wmf-bd{background:linear-gradient(180deg,var(--b1),var(--b2));box-shadow:var(--bgl)}
html.dark.pal-purple body .wmf .wmf-fb .wmf-bd{box-shadow:0 2px 8px -1px var(--gr)}
.wmf[data-f] .wmf-bd{display:grid}.wmf-bd.pop{transform:scale(1.18)}

/* subtitle "N of M ATOs · k filters": the live number takes the badge's theme ink */
#ato,#dfe{--wmf-n1:#F5F5F7}html.dark.pal-purple #ato,html.dark.pal-purple #dfe{--wmf-n1:#F3EEFF}html:not(.dark) #ato,html:not(.dark) #dfe{--wmf-n1:#0019C9}html.pal-beige:not(.dark) #ato,html.pal-beige:not(.dark) #dfe{--wmf-n1:#6E531F}
#ato .wmvh p b.wmf-n,#dfe .wmvh p b.wmf-n{color:var(--wmf-n1);font-weight:700}

/* panel sits under the pill inside the grown shell; items fade in with a short stagger (v9) */
.wmf-pn{position:absolute;left:3px;right:3px;top:calc(100% + 6px);padding:6px 4px 4px;pointer-events:none;visibility:hidden}
.wmf[data-s=open] .wmf-pn{pointer-events:auto;visibility:visible}
.wmf .wmf-it{opacity:0;transform:translateY(-6px);filter:blur(2px);transition:opacity .18s ease,transform .22s ease,filter .18s ease}
.wmf[data-s=open] .wmf-it{opacity:1;transform:none;filter:none;transition:opacity .34s cubic-bezier(.2,.8,.2,1) calc(.14s + var(--d)),transform .44s cubic-bezier(.22,1,.36,1) calc(.14s + var(--d)),filter .34s ease calc(.14s + var(--d))}
.wmf .wmf-ph{display:flex;justify-content:space-between;align-items:baseline;margin:6px 6px 2px}
.wmf .wmf-ph span{font:600 17px/1 "Clash Display",Satoshi,sans-serif;letter-spacing:.01em}.wmf .wmf-ph small{font:500 12px Satoshi;color:var(--mu)}
.wmf .wmf-lab{font:600 11px/1 Satoshi;letter-spacing:.14em;text-transform:uppercase;color:var(--mu);margin:12px 6px 7px}
.wmf .wmf-chips{display:flex;flex-wrap:wrap;gap:7px}
.wmf .wmf-c{display:flex;gap:6px;align-items:center;padding:8px 12px;border-radius:999px;font:500 13px/1 Satoshi;color:var(--tx);box-shadow:inset 0 1px 0 var(--hi),inset 0 0 0 1px var(--ln);transition:background .2s,box-shadow .2s,color .2s}
.wmf .wmf-c small{color:var(--mu);font-size:11.5px}
.wmf .wmf-c.on{background:var(--glow);box-shadow:inset 0 1px 0 var(--hi),inset 0 0 0 1px var(--gr),0 6px 16px -10px var(--gr);color:var(--gt);font-weight:700}.wmf .wmf-c.on small{color:var(--gt)}
.wmf .wmf-c:disabled{opacity:.4;cursor:default}
.wmf .wmf-c.qm{box-shadow:none;color:var(--gt);font-weight:600;padding-left:6px;padding-right:6px}
.wmf .wmf-none{font:500 13px Satoshi;color:var(--mu);padding:6px 2px}
.wmf .wmf-tg{display:flex;justify-content:space-between;align-items:center;padding:10px 13px;border-radius:18px;box-shadow:inset 0 0 0 1px var(--ln);margin-top:6px;font:500 14px Satoshi;cursor:pointer}
.wmf .wmf-sw{width:42px;height:25px;border-radius:13px;background:var(--ln);position:relative;flex:none;transition:background .2s}
.wmf .wmf-sw:after{content:"";position:absolute;top:2px;left:2px;width:21px;height:21px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.25);transition:left .2s}
.wmf .wmf-sw.on{background:var(--glow),var(--ac);box-shadow:inset 0 0 0 1px var(--gr)}.wmf .wmf-sw.on:after{left:19px}
.wmf .wmf-ft{display:flex;gap:8px;margin-top:12px}
.wmf .wmf-dv{height:1px;margin:12px 2px 10px;background:var(--ln)}
/* ATO concept B: full-width glow switch rows with a hint line (Include expired, DTO / paragliding, Near me) */
/* ATO plain switch rows: one clean line, no box, no glow, hairline between rows */
#ato .wmf .wmf-tg.gl{width:100%;box-sizing:border-box;text-align:left;margin:0;padding:12px 2px;border-radius:0;box-shadow:none;background:none;color:var(--tx);font:500 14px Satoshi}
#ato .wmf .wmf-tg.gl+.wmf-tg.gl{box-shadow:inset 0 .5px 0 var(--ln)}
#ato .wmf .wmf-tg.gl .tl b{font-weight:500;color:var(--mu)}
#ato .wmf .wmf-tg.gl .wmf-sw.on{background:var(--ac);box-shadow:none}
.wmf .wmf-ft button{flex:1;text-align:center;padding:12px;border-radius:999px;font:600 14px Satoshi}
.wmf .wmf-rs{box-shadow:inset 0 0 0 1px var(--ln);color:var(--mu)}
.wmf .wmf-ap{background:var(--glow);box-shadow:inset 0 1px 0 var(--hi),inset 0 0 0 1px var(--gr);color:var(--gt)}
/* while the list slides, cards drop their backdrop blur (it would be recomputed for 50 cards every frame;
   the page behind them is a flat theme colour, so the swap is not visible) */
#ato.wmf-moving #g2 .wx,#dfe.wmf-moving #g3 .wx{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
/* v18 "soft" layout (opts16.js + a18.js): grouped rows card, one row open at a time, soft in-row search, text Reset + pill Show */
.wmf .wmf-grp{border-radius:18px;background:color-mix(in srgb,var(--hi) 40%,transparent);box-shadow:inset 0 0 0 1px var(--ln);margin-top:8px;overflow:hidden}
.wmf .wmf-gr{display:flex;width:100%;text-align:left;align-items:center;gap:8px;min-height:44px;padding:0 14px;font:500 14.5px Satoshi;position:relative}
.wmf .wmf-gr+.wmf-gr:before,.wmf .wmf-inl+.wmf-gr:before{content:"";position:absolute;top:0;left:14px;right:0;height:1px;background:var(--ln)}
.wmf .wmf-gr>span{flex:1}.wmf .wmf-gr b{font:600 14px Satoshi;color:var(--gt);text-shadow:0 0 14px var(--gr);max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wmf .wmf-gr>svg{color:var(--mu);opacity:.6;flex:none;transition:transform .3s cubic-bezier(.32,.72,0,1)}
.wmf .wmf-gr.op>svg{color:var(--gt);opacity:1;transform:rotate(90deg)}
.wmf .wmf-inl{display:none;padding:2px 14px 12px}.wmf .wmf-inl.o{display:block}
/* section headlines: each group row reads as a headline label, its options sit directly underneath */
html body section .wmf .wmf-gr>span{font:700 11.5px/1 Satoshi,sans-serif!important;letter-spacing:.09em!important;text-transform:uppercase!important;color:var(--mu)!important}html body section .wmf .wmf-gr.op>span{color:var(--gt)!important}
.wmf .wmf-gr.op+.wmf-inl{padding-top:0}
.wmf .wmf-inl .wmf-chips{gap:8px}.wmf .wmf-inl .wmf-c{padding:10px 14px;font-size:14px}
.wmf .wmf-mi{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;color:var(--mu);box-shadow:inset 0 0 0 1px var(--ln);flex:none;transition:color .25s,box-shadow .25s,background .25s}
.wmf .wmf-mi.act{color:var(--gt);box-shadow:inset 0 0 0 1px var(--gr);background:var(--glow)}
/* Claude plan step 6: the row search snaps open (no grid-template-rows tween = no per-frame layout); the field itself fades/slides in (.wmf-sq) */.wmf .wmf-sr{display:grid;grid-template-rows:0fr}.wmf .wmf-sr.o{grid-template-rows:1fr}.wmf .wmf-sr>div{overflow:hidden;min-height:0}
.wmf .wmf-sq{display:flex;align-items:center;gap:7px;height:30px;margin:0 0 10px;padding:0 6px 0 10px;color:var(--mu);border-radius:999px;background:color-mix(in srgb,var(--ln) 70%,transparent);opacity:0;transform:translateY(-6px);transition:opacity .22s ease,transform .4s cubic-bezier(.32,.72,0,1)}
.wmf .wmf-sr.o .wmf-sq{opacity:1;transform:none;transition:opacity .3s ease .08s,transform .4s cubic-bezier(.32,.72,0,1)}
.wmf .wmf-sq svg{opacity:.6;flex:none}
html body section .wmf .wmf-sq input{flex:1;min-width:0;height:30px;border:0;outline:0;margin:0;padding:0;background:transparent!important;box-shadow:none!important;color:var(--tx);font:500 12.5px Satoshi;-webkit-appearance:none;appearance:none;caret-color:var(--gt)}
.wmf .wmf-sq input::placeholder{color:var(--mu)}
.wmf .wmf-sq input::-webkit-search-cancel-button{-webkit-appearance:none;display:none}
/* demo search: clear button, chips fade/blur out and glide (FLIP) into place */
.wmf .wmf-sx{flex:none;margin-left:auto;width:16px;height:16px;border-radius:50%;background:var(--mu);opacity:.55;position:relative;cursor:pointer;visibility:hidden}.wmf .wmf-sq.typed .wmf-sx{visibility:visible}
.wmf .wmf-sx:before,.wmf .wmf-sx:after{content:"";position:absolute;left:50%;top:50%;width:7px;height:1.4px;border-radius:1px;background:var(--br);transform:translate(-50%,-50%) rotate(45deg)}.wmf .wmf-sx:after{transform:translate(-50%,-50%) rotate(-45deg)}
/* magnifier stays visible while typing */
/* inline row search: beat page-wide ".bar label" chip + ".bar input[type=search]" big-search styles (v18 soft demo sizes) */
html[data-theme] body section .wmf .wmf-sq,html body section .wmf .wmf-sq{display:flex!important;width:auto!important;max-width:none!important;flex:none!important;height:30px!important;min-height:0!important;margin:0 0 10px!important;padding:0 6px 0 10px!important;gap:7px!important;border:0!important;border-radius:999px!important;background:var(--gl)!important;box-shadow:inset 0 1px 0 var(--hl),inset 0 0 0 .5px var(--ln)!important;-webkit-backdrop-filter:blur(24px) saturate(180%)!important;backdrop-filter:blur(24px) saturate(180%)!important;font:500 12.5px Satoshi,-apple-system,sans-serif!important;color:var(--tx2,var(--mu))!important}
/* pre-#107 glass chip look (page --gl glass, --hl top edge, .5px --ln rim, soft shadow) at the v18 30px scale */
html[data-theme] body section .wmf .wmf-sq input[type=search],html body section .wmf .wmf-sq input[type=search]{height:30px!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;font:500 12.5px Satoshi,-apple-system,sans-serif!important;color:var(--tx)!important}
.wmf .wmf-c.in{animation:wmfIn .26s ease both}@keyframes wmfIn{from{opacity:0;transform:scale(.9);filter:blur(3px)}}
/* groups: the open group sits on a dimmer shade of the theme colour */
.wmf .wmf-gr.op,.wmf .wmf-gr.op+.wmf-inl{background:color-mix(in srgb,var(--tx) 4%,transparent)}
.wmf .wmf-sw2{transform:scale(.9)}.wmf .wmf-inl .wmf-seg{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:0;padding:3px;border-radius:16px;box-shadow:inset 0 0 0 1px var(--ln);background:color-mix(in srgb,var(--tx) 3%,transparent)}.wmf .wmf-inl .wmf-seg .wmf-c{justify-content:center;text-align:center;border-radius:13px;box-shadow:none;padding:9px 6px}.wmf .wmf-inl .wmf-seg .wmf-c.on{box-shadow:inset 0 1px 0 var(--hi),inset 0 0 0 1px var(--gr),0 6px 16px -10px var(--gr)}/* v16 Include pills: sliding bubble copied from the status page Flight rules / Pilot level .wseg (wst.css .wseg i geometry + status_demo.html #wsp .wseg>i / button transitions). Colours unchanged: the bubble wears the old .on look */.wmf .wmf-inl .wmf-seg.wmf-sl{position:relative}.wmf .wmf-inl .wmf-seg.wmf-sl>i{position:absolute;top:3px;bottom:3px;left:3px;width:calc(50% - 3px);border-radius:13px;pointer-events:none;background:var(--glow);box-shadow:inset 0 1px 0 var(--hi),inset 0 0 0 1px var(--gr),0 6px 16px -10px var(--gr);transform:translateX(calc(var(--ix,0)*100%));transition:transform .45s cubic-bezier(.32,.72,0,1)!important;will-change:transform}.wmf .wmf-inl .wmf-seg.wmf-sl>.wmf-c{position:relative;z-index:1;transition:color .3s ease,background-color .3s ease,transform .2s ease!important}.wmf .wmf-inl .wmf-seg.wmf-sl>.wmf-c:active{transform:scale(.92)}.wmf .wmf-inl .wmf-seg.wmf-sl>.wmf-c.on{background:none;box-shadow:none}
.wmf .wmf-ft{align-items:center;justify-content:space-between;margin:14px 4px 2px}
.wmf .wmf-ft button.wmf-rs{flex:none;box-shadow:none;padding:0 8px;font:500 14px Satoshi;color:var(--mu)}
.wmf .wmf-ft button.wmf-ap{flex:none;padding:13px 22px;font:700 14.5px Satoshi;box-shadow:inset 0 1px 0 var(--hi),inset 0 0 0 1px var(--gr),0 10px 24px -12px var(--gr)}
/* NO GLOW (MT 30 Oct): keep colours, drop glow shadows/halos; slide motion unchanged */
html body .wmf,html body .wmf *{text-shadow:none!important;filter:none!important}
html body .wmf .wmf-c.on,html body .wmf .wmf-sl>i,html body .wmf .wmf-ap,html body .wmf .wmf-ft button.wmf-ap{box-shadow:inset 0 1px 0 var(--hi),inset 0 0 0 1px var(--gr)!important}
html body .wmf .wmf-sl>.wmf-c.on{box-shadow:none!important}
html body .wmf .wmf-fb .wmf-bd{box-shadow:0 0 0 2px var(--br)!important}
/* MT 31 Oct (t1522): filter text style A, tuned per theme. Selected = --fa1 at 600, labels/unselected/counts/Reset = --fa2 at 500.
   Show button = clear neutral glass (card-tag glass) (no icon disc, MT t1558). Theme values themselves are not changed. */
#ato .wmf,#dfe .wmf{--fa1:#FFFFFF;--fa2:rgba(255,255,255,.62);--fag:rgba(255,255,255,.08);--fal:rgba(255,255,255,.16);--fah:rgba(255,255,255,.14)}
html.dark.pal-purple #ato .wmf,html.dark.pal-purple #dfe .wmf{--fa1:#FFFFFF;--fa2:rgba(243,238,255,.62);--fag:rgba(200,170,255,.08);--fal:rgba(214,196,255,.20);--fah:rgba(255,245,255,.14)}
html:not(.dark) #ato .wmf,html:not(.dark) #dfe .wmf{--fa1:#111114;--fa2:#6B7280;--fag:rgba(255,255,255,.55);--fal:rgba(0,0,0,.08);--fah:rgba(255,255,255,.95)}
html.pal-beige:not(.dark) #ato .wmf,html.pal-beige:not(.dark) #dfe .wmf{--fa1:#1C1814;--fa2:#6B6255;--fag:rgba(255,250,240,.55);--fal:rgba(60,45,20,.10);--fah:rgba(255,252,244,.95)}
html body section .wmf .wmf-gr>span,html body section .wmf .wmf-lab{color:var(--fa2)!important;font-weight:500!important}
html body section .wmf .wmf-gr.op>span{color:var(--fa1)!important;font-weight:600!important}
html body section .wmf .wmf-gr b{color:var(--fa1);font-weight:600}
html body section .wmf .wmf-gr>svg,html body section .wmf .wmf-gr.op>svg{color:var(--fa1);opacity:.55}
html body section .wmf .wmf-gr.op>svg{opacity:.9}
html body section .wmf .wmf-c{color:var(--fa2);font-weight:500}
html body section .wmf .wmf-c small{color:var(--fa2)}
html body section .wmf .wmf-c.on,html body section .wmf .wmf-c.on small,html body section .wmf .wmf-c.qm{color:var(--fa1);font-weight:600}
html body section .wmf .wmf-ph small{color:var(--fa2);font-weight:500}
html body section .wmf .wmf-ft button.wmf-rs{color:var(--fa2);font-weight:500}
html body section .wmf .wmf-mi.act{color:var(--fa1)}
html body section .wmf .wmf-ft button.wmf-ap,html body section .wmf .wmf-ap{display:inline-flex;align-items:center;justify-content:center;padding:13px 22px;color:var(--fa1);font-weight:600;
 background:var(--fag)!important;-webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);box-shadow:inset 0 1px 0 var(--fah),inset 0 0 0 1px var(--fal)!important}
@media(prefers-reduced-motion:reduce){.wmf,.wmf *,.wmf-sh{transition:none!important}}`;

const ICON={
 mag:s=>'<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
 chev:'<svg width="8" height="13" viewBox="0 0 8 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 1.5 6.5 6.5 1.5 11.5"/></svg>',
 filt:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>'};
const EASE='cubic-bezier(.32,.72,0,1)',OPEN_MS=500,CLOSE_MS=420,CLOSE_DELAY=60;
const esc=v=>String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let uid=0;

/**
 * Build the filter around an existing search input.
 * cfg = {section, input, hints, noun, title, groups, toggles, total, base, active, reset, refresh, list}
 * title = page noun for the subtitle ("N of M ATOs"); defaults to 'ATOs'.
 */
function make(cfg){
 if(!document.getElementById('wmf-css')){const s=document.createElement('style');s.id='wmf-css';s.textContent=CSS;document.head.append(s)}
 const id='wmf'+(++uid),root=document.createElement('div');root.className='wmf';
 root.innerHTML='<div class="wmf-sh"></div><div class="wmf-row"><label class="wmf-sp">'+ICON.mag(17)+'<span class="wmf-hint" aria-hidden="true"><span class="fx">Search</span><span class="rot"></span></span></label>'+
  '<button type="button" class="wmf-fb" aria-label="Filters" aria-expanded="false" aria-controls="'+id+'">'+ICON.filt+'<b class="wmf-bd" aria-hidden="true"></b></button></div>'+
  '<div class="wmf-pn" id="'+id+'" role="region" aria-label="Filters"><div class="wmf-it wmf-ph"><span>Filters</span><small aria-live="polite"></small></div></div>';
 cfg.input.before(root);
 const $=s=>root.querySelector(s),sh=$('.wmf-sh'),sp=$('.wmf-sp'),fb=$('.wmf-fb'),bd=$('.wmf-bd'),pn=$('.wmf-pn');
 sp.append(cfg.input);cfg.input.setAttribute('aria-label',cfg.input.getAttribute('placeholder')||'Search '+cfg.hints[0]);cfg.input.removeAttribute('placeholder');

 const ui={},more={},find={};let openRow=cfg.open||'';
 /* v18 layout: one card of rows; tapping a row opens its chips underneath (one open at a time) */
 const grp=document.createElement('div');grp.className='wmf-it wmf-grp';pn.append(grp);
 const addRow=(id,label,search,fid,flab)=>{fid=fid||id;flab=flab||label;
  const row=document.createElement('button');row.type='button';row.className='wmf-gr';row.dataset.r=id;row.dataset.f=fid;row.setAttribute('aria-expanded','false');
  row.innerHTML='<span>'+esc(label)+'</span>'+(search?'<i class="wmf-mi" data-find="1" aria-label="Search '+esc(label)+'">'+ICON.mag(12)+'</i>':'')+'<b></b>'+ICON.chev;
  const inl=document.createElement('div');inl.className='wmf-inl';inl.dataset.r=id;
  if(search){inl.innerHTML='<div class="wmf-sr"><div><label class="wmf-sq">'+ICON.mag(12)+'<input type="search" autocomplete="off" placeholder="Find a '+esc(flab.toLowerCase())+'" aria-label="Find a '+esc(flab.toLowerCase())+'"><i class="wmf-sx" role="button" aria-label="Clear"></i></label></div></div>';
   const fi=inl.querySelector('input'),sq=inl.querySelector('.wmf-sq');
   const upd=()=>{find[fid]=fi.value.trim().toLowerCase();sq.classList.toggle('typed',!!fi.value);const g=cfg.groups.find(x=>x.id===fid),ch=ui[fid]&&ui[fid].chips;
    const P=new Map();if(ch)ch.querySelectorAll('.wmf-c[data-v]').forEach(c=>P.set(c.dataset.v,c.getBoundingClientRect()));
    chipsHTML(g);regrow();
    if(ch&&!reduced())ch.querySelectorAll('.wmf-c').forEach(c=>{const a=P.get(c.dataset.v);if(!a){c.classList.add('in');return}const n=c.getBoundingClientRect();if(a.left===n.left&&a.top===n.top)return;
     c.style.transition='none';c.style.transform='translate('+(a.left-n.left)+'px,'+(a.top-n.top)+'px)';c.offsetWidth;c.style.transition='transform .38s cubic-bezier(.32,.72,0,1)';c.style.transform=''})};
   fi.addEventListener('input',upd);
   inl.querySelector('.wmf-sx').addEventListener('click',e=>{e.preventDefault();fi.value='';upd();fi.focus({preventScroll:true})})}
  grp.append(row,inl);return {row,inl,val:row.querySelector('b')}};
 const slSet=function(el){const bs=[...el.querySelectorAll(':scope>button')],k=bs.findIndex(b=>b.classList.contains('on'));el.style.setProperty('--ix',Math.max(0,k))};
 const slInit=function(el){el.classList.add('wmf-sl');el.insertBefore(document.createElement('i'),el.firstChild)};
 if(cfg.incl){cfg.incl.sl=1;cfg.groups.push(cfg.incl)}
 /* MT t2192/t2193: a group with join:'<id>' has no row of its own; its chips sit inside that group's open space,
    under a thin divider (ATO: Courses on top, then the course / rating list). The host row carries the joined group's search. */
 cfg.groups.forEach(g=>{
  if(g.join){const h=ui[g.join],dv=document.createElement('div');dv.className='wmf-dv';dv.setAttribute('role','separator');
   const chips=document.createElement('div');chips.className='wmf-chips';chips.dataset.g=g.id;chips.setAttribute('role','group');chips.setAttribute('aria-label',g.label);
   /* MT t2194: the whole combined group (host chips, divider, joined chips) scrolls as one inside the fixed space (.wmf-jn) */
   let jn=h.inl.querySelector(':scope>.wmf-jn');if(!jn){jn=document.createElement('div');jn.className='wmf-jn';h.inl.append(jn);jn.append(h.chips)}jn.append(dv,chips);ui[g.id]={row:h.row,inl:h.inl,val:null,chips,join:1};return}
  const j=cfg.groups.find(x=>x.join===g.id&&x.top);
  const r=j?addRow(g.id,g.label,true,j.id,j.findLabel||j.label):addRow(g.id,g.label,!!g.top);
  const chips=document.createElement('div');chips.className='wmf-chips'+(g.seg?' wmf-seg':'');chips.dataset.g=g.id;chips.setAttribute('role','group');chips.setAttribute('aria-label',g.label);
  if(g.sl)slInit(chips);r.inl.append(chips);ui[g.id]=Object.assign(r,{chips})});
 if((cfg.toggles||[]).length){const r=addRow('inc','Include',false);ui.inc=r;
  (cfg.toggles||[]).forEach(t=>{
   const row=document.createElement('button');row.type='button';row.className='wmf-tg';row.dataset.t=t.id;
   if(cfg.seg&&t.seg){const w=document.createElement('div');w.className='wmf-sgw';w.innerHTML='<div class="wmf-chips wmf-seg" role="group" aria-label="'+esc(t.label)+'"><button type="button" class="wmf-c" data-st="'+t.id+'" data-sv="0">'+esc(t.seg[0])+'</button><button type="button" class="wmf-c" data-st="'+t.id+'" data-sv="1">'+esc(t.seg[1])+'</button></div><p class="wmf-note"></p>';
    const sc=w.querySelector('.wmf-seg');slInit(sc);r.inl.append(w);ui[t.id]={seg:w.querySelectorAll('.wmf-c'),sc,note:w.querySelector('.wmf-note')};return}
   if(t.hint)row.classList.add('gl');if(t.nr)row.classList.add('nr');
   row.innerHTML='<span class="tl">'+esc(t.label)+(t.hint?'<b></b>':'')+'</span><span class="wmf-sw wmf-sw2" aria-hidden="true"></span>';
   r.inl.append(row);ui[t.id]={row,sw:row.querySelector('.wmf-sw'),hint:row.querySelector('.tl b')}})}
 const ft=document.createElement('div');ft.className='wmf-it wmf-ft';
 ft.innerHTML='<button type="button" class="wmf-rs">Reset all</button><button type="button" class="wmf-ap"></button>';
 pn.append(ft);
 [...pn.querySelectorAll('.wmf-it')].forEach((e,k)=>e.style.setProperty('--d',k*22+'ms'));
 function rows(){Object.keys(ui).forEach(k=>{const u=ui[k];if(!u.inl||u.join)return;const o=k===openRow;u.row.classList.toggle('op',o);u.inl.classList.toggle('o',o);u.row.setAttribute('aria-expanded',o)})}

 function chipsHTML(g){
  let it=g.items();const u=ui[g.id],f=find[g.id]||'';
  if(f)it=it.filter(([v,l])=>String(l).toLowerCase().startsWith(f)||g.on(v));
  const all=it.length;
  if(!f&&g.top&&!more[g.id]&&all>g.top){const on=it.filter(([v])=>g.on(v));it=it.slice(0,g.top);on.forEach(x=>{if(!it.includes(x))it.push(x)})}
  let h=it.map(([v,l,n])=>{const o=g.on(v);return '<button type="button" class="wmf-c'+(o?' on':'')+'" data-v="'+esc(v)+'" aria-pressed="'+o+'"'+(n===0&&!o?' disabled':'')+'>'+esc(l)+(n==null?'':' <small>'+n+'</small>')+'</button>'}).join('');
  if(!it.length)h='<span class="wmf-none">None</span>';
  if(!f&&g.top&&all>g.top){
   if(!more[g.id])h+='<button type="button" class="wmf-c qm" data-more="1">All '+all+' ›</button>';
   else h+='<button type="button" class="wmf-c qm" data-more="1">Top '+g.top+' ‹</button>'}
  if(g.sl&&u.chips.querySelectorAll(':scope>button').length===it.length){u.chips.querySelectorAll(':scope>button').forEach(b=>{const o=g.on(b.dataset.v);b.classList.toggle('on',o);b.setAttribute('aria-pressed',o)});slSet(u.chips)}
  else if(g.sl){u.chips.innerHTML='<i></i>'+h;slSet(u.chips)}
  else u.chips.innerHTML=h;
  if(u.val){const sel=g.items().filter(([v])=>g.on(v)).map(x=>x[1]);u.val.textContent=g.val?g.val():sel.length?sel.join(', '):(g.any||'Any')}
  if(g.note){let t=u.inl.querySelector('.wmf-note');if(!t){t=document.createElement('p');t.className='wmf-note';u.inl.append(t)}t.textContent=g.note()}}
 function draw(){
  cfg.groups.forEach(g=>chipsHTML(g));
  (cfg.toggles||[]).forEach(t=>{const on=!!t.on();if(ui[t.id].seg){ui[t.id].seg.forEach(b=>{const o=(b.dataset.sv==='1')===on;b.classList.toggle('on',o);b.setAttribute('aria-pressed',o)});slSet(ui[t.id].sc);ui[t.id].note.textContent=t.note(on);return}ui[t.id].sw.classList.toggle('on',on);ui[t.id].row.setAttribute('aria-pressed',on);ui[t.id].row.classList.toggle('on',on);if(t.hint){const h=t.hint(on);ui[t.id].hint.textContent=h?' · '+h:''}});
  if(ui.inc){const on=(cfg.toggles||[]).filter(t=>t.on()).map(t=>t.short||t.label);ui.inc.val.textContent=on.length?on.join(', '):'None'}
  rows();
  const n=cfg.total(),m=cfg.base(),k=cfg.active();
  $('.wmf-ph small').textContent=n+' of '+m;
  $('.wmf-ap').textContent='Show '+n+' '+(n===1?cfg.noun[0]:cfg.noun[1]);
  const sub=cfg.section.querySelector('.wmvh p');
  {const bar=cfg.section.querySelector(':scope>.bar');if(bar&&sub&&!sub.parentNode.classList.contains('wmf-cl')){const h=document.createElement('div');h.className='wmvh wmf-cl';h.appendChild(sub);bar.appendChild(h)}}
  if(sub)sub.innerHTML='<b class="wmf-n">'+n+'</b> of '+m+' '+(cfg.title||'ATOs')+(k?' · '+k+' filter'+(k===1?'':'s'):'');
  if(k){root.dataset.f='1';bd.textContent=k;bd.classList.add('pop');clearTimeout(bd._t);bd._t=setTimeout(()=>bd.classList.remove('pop'),160)}
  else{delete root.dataset.f;bd.textContent=''}
  fb.setAttribute('aria-label',k?'Filters, '+k+' on':'Filters')}

 /* v9 geometry. Open: shell -7 top / -9 sides, height wraps the panel, radius 30.
    The page below is pushed by the root's bottom margin. To keep it smooth on phones the margin is never
    animated (that would re-lay out every card each frame): it jumps once and the list (<main>) is slid with a
    compositor-only transform (FLIP), in step with the shell. */
 const isOpen=()=>root.dataset.s==='open',list=cfg.section.querySelector('main');
 let extra=0,flipT=0;
 function push(next,ms,delay){
  const d=next-extra;clearTimeout(flipT);if(!d)return;
  if(ms!=null){const sec=cfg.section;sec.classList.add('wmf-moving');clearTimeout(push.mv);push.mv=setTimeout(()=>sec.classList.remove('wmf-moving'),ms+delay+60)}
  const L=list&&list.style,setM=v=>{extra=v;v?root.style.setProperty('margin-bottom',(12+v)+'px','important'):root.style.removeProperty('margin-bottom')};
  if(!L||ms==null){setM(next);if(L){L.transition='';L.transform=''}return}
  if(d>0){setM(next);L.transition='none';L.transform='translateY('+(-d)+'px)';list.offsetHeight;          /* grow: jump, then slide from old spot */
   L.transition='transform '+ms+'ms '+EASE+' '+delay+'ms';L.transform=''}
  else{L.transition='transform '+ms+'ms '+EASE+' '+delay+'ms';L.transform='translateY('+d+'px)';           /* shrink: slide up, then drop the margin */
   flipT=setTimeout(()=>{L.transition='none';L.transform='';setM(next)},ms+delay)}}
 /* Claude plan step 6: the shell jumps to its final box and is animated from the old box with a
    compositor transform (FLIP: translate + scale). The corner radius is counter-scaled per keyframe so the
    corners look the same as the old top/left/right/height tween. No layout runs during the animation. */
 let shAnim=null;
 function geo(o,anim){
  const s=sh.style,bh=root.offsetHeight,ph=pn.offsetHeight,ms=anim==null||reduced()?null:(anim?OPEN_MS:CLOSE_MS),delay=anim?0:CLOSE_DELAY;
  const r0=shAnim?null:sh.getBoundingClientRect(),rad0=parseFloat(getComputedStyle(sh).borderTopLeftRadius)||22;
  const from=shAnim&&shAnim._to?shAnim._now():{r:r0,rad:rad0};
  if(shAnim){shAnim.cancel();shAnim=null}
  s.transition='none';
  if(o){s.top='-7px';s.left='-9px';s.right='-9px';s.height=(bh+7+6+ph+6)+'px';s.borderRadius='30px'}
  else{s.top='0';s.left='0';s.right='0';s.height=bh+'px';s.borderRadius='22px'}
  push(o?6+ph+6:0,ms,delay);
  if(ms==null||!from.r||!sh.animate)return;
  const b=sh.getBoundingClientRect(),rad1=o?30:22;
  if(!b.width||!b.height||!from.r.width)return;
  const sx0=from.r.width/b.width,sy0=from.r.height/b.height,dx0=from.r.left-b.left,dy0=from.r.top-b.top,kf=[];
  for(let i=0;i<=10;i++){const p=i/10,sx=sx0+(1-sx0)*p,sy=sy0+(1-sy0)*p,rr=from.rad+(rad1-from.rad)*p;
   kf.push({offset:p,transform:'translate('+(dx0*(1-p))+'px,'+(dy0*(1-p))+'px) scale('+sx+','+sy+')',borderRadius:(rr/sx)+'px / '+(rr/sy)+'px'})}
  s.transformOrigin='0 0';
  const a=sh.animate(kf,{duration:ms,delay,easing:EASE,fill:'backwards'});shAnim=a;a._to=b;
  a._now=()=>({r:sh.getBoundingClientRect(),rad:rad1});
  a.oncancel=()=>{if(shAnim===a)shAnim=null};
  a.onfinish=()=>{if(shAnim===a){shAnim=null;if(isOpen()&&Math.abs(sh.offsetHeight-(root.offsetHeight+7+6+pn.offsetHeight+6))>1)geo(true,null)}}}
 /* set(open, animate): the filter button is the only thing that collapses the panel */
 function set(o,anim=true){
  if(o)draw();o?root.dataset.s='open':delete root.dataset.s;
  fb.setAttribute('aria-expanded',o);geo(o,anim?o:null);
  if(!o&&pn.contains(document.activeElement))fb.focus({preventScroll:true})}
 const regrow=()=>{if(isOpen())geo(true,true)};

 fb.addEventListener('click',()=>set(!isOpen()));
 /* "Show N": scroll to the first school, the panel stays open (MT: no auto-collapse) */
 $('.wmf-ap').addEventListener('click',()=>{const g=cfg.list();if(g)g.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'start'})});
 $('.wmf-rs').addEventListener('click',()=>{cfg.reset();/* t1749: Reset all also clears the typed / chip-filled search */if(cfg.input&&cfg.input.value){cfg.input.value='';cfg.input.dispatchEvent(new Event('input',{bubbles:true}))}Object.keys(more).forEach(k=>delete more[k]);cfg.refresh();draw();regrow()});
 pn.addEventListener('click',e=>{
  const gr=e.target.closest('.wmf-gr');
  if(gr){const id=gr.dataset.r,u=ui[id];
   if(e.target.closest('[data-find]')){if(openRow!==id){openRow=id;rows()}const sr=u.inl.querySelector('.wmf-sr'),fi=sr.querySelector('input'),o=!sr.classList.contains('o');
    sr.classList.toggle('o',o);gr.querySelector('.wmf-mi').classList.toggle('act',o);if(o)fi.focus({preventScroll:true});else if(fi.value){const fid=gr.dataset.f||id;fi.value='';find[fid]='';sr.querySelector('.wmf-sq').classList.remove('typed');chipsHTML(cfg.groups.find(x=>x.id===fid))}
    setTimeout(regrow,0);return}
   openRow=openRow===id?'':id;rows();regrow();return}
  const sb=e.target.closest('[data-st]');if(sb){const t=cfg.toggles.find(x=>x.id===sb.dataset.st);if(!!t.on()!==(sb.dataset.sv==='1')){t.tap();cfg.refresh();draw();regrow()}return}
  const c=e.target.closest('.wmf-c'),tg=e.target.closest('.wmf-tg');
  if(c){const g=cfg.groups.find(x=>x.id===c.closest('.wmf-chips').dataset.g);
   if(c.dataset.more){more[g.id]=!more[g.id];chipsHTML(g);regrow();return}
   if(c.disabled)return;g.tap(c.dataset.v);cfg.refresh();draw();regrow();return}
  if(tg){const t=(cfg.toggles||[]).find(x=>x.id===tg.dataset.t);t.tap();cfg.refresh();draw();regrow()}});
 addEventListener('resize',()=>{if(shAnim){shAnim.cancel();shAnim=null}geo(isOpen(),null)});
 new ResizeObserver(()=>{if(isOpen()&&!shAnim)geo(true,null)}).observe(pn);

 /* v8b hint: "Search" + rotating word, slide up with soft blur every 2.6 s while idle */
 const rot=$('.rot');let hi=0;rot.innerHTML='<span>'+cfg.hints[0]+'</span>';
 const typed=()=>sp.classList.toggle('typed',!!cfg.input.value);cfg.input.addEventListener('input',typed);typed();
 /* fix/dfe-rating-search: code that sets input.value directly (rating/course chip taps, restored searches) fires no 'input' event, so the hint stayed visible under the text. Re-sync on every value write. */
 try{const vd=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');Object.defineProperty(cfg.input,'value',{configurable:true,get(){return vd.get.call(this)},set(v){vd.set.call(this,v);typed()}})}catch(e){}
 cfg.input.addEventListener('search',typed);cfg.input.addEventListener('change',typed);
 setInterval(()=>{if(reduced()||document.hidden||isOpen()||sp.matches(':focus-within')||cfg.input.value||!root.offsetParent)return;
  const o=rot.firstChild;o.className='out';hi=(hi+1)%cfg.hints.length;const n=document.createElement('span');n.className='in';n.textContent=cfg.hints[hi];rot.append(n);
  requestAnimationFrame(()=>requestAnimationFrame(()=>n.className=''));setTimeout(()=>o.remove(),550)},2600);

 cfg.section.dataset.wmf='1';draw();set(false,false);
 return {set,draw,root,isOpen}}

const toggle=(s,v)=>s.has(v)?s.delete(v):s.add(v);
const byCount=(m)=>Object.keys(m).sort((a,b)=>m[b]-m[a]||a.localeCompare(b));

/* ---------------- ATO page ---------------- */
function ato(){
 const sec=document.getElementById('ato'),q=document.getElementById('q2'),M=window.WDSMF,X=window.WMX;
 if(!sec||!q||!M||!X||typeof T==='undefined')return false;
 const S=X.S.ato,dto=document.getElementById('dto'),inv=document.getElementById('inv'),FAMM=window.WMX_FAM||{};
 const FAMS=[['lic','Licences'],['inst','Instrument'],['night','Night'],['instr','Instructor'],['type','Multi-engine & type'],['other','Helicopter & other']];
 const SORT=[['name','Name A–Z'],['most','Most courses'],['exp1','Expiring soonest'],['exp2','Expiring latest']];
 const PER=[['10','10'],['20','20'],['50','50'],['all','All']];
 const menu=v=>sec.querySelector('.wx-menu [data-v="'+v+'"]');
 const per=()=>localStorage.getItem('wds-pp-ato')||'50';
 const persist=()=>{try{sessionStorage.setItem('wds-mf',JSON.stringify({p:[...M.P],c:[...M.C],k:[...M.K]}))}catch(e){}};
 const ROWS=T.map(t=>{const l=(typeof ATOLOC!=='undefined'&&ATOLOC[t.certificate_number+'|'+t.name])||['',''];const [p,c]=M.N(l);
  return {p,c,fam:new Set(M.CS(t).map(x=>FAMM[x]||'other')),dto:typeof isDto==='function'&&isDto(t),ok:/^valid/i.test(t.status),cs:M.CS(t),h:(Object.values(t).join(' ')+' '+(typeof loc==='function'?loc(t):l).join(' ')).toLowerCase()}});
 /* backlog 4: the count under the bar also follows the search box, same match as atoList() */
 const qok=r=>{const v=(q.value||'').toLowerCase().trim();return !v||r.h.includes(v)};q.addEventListener('input',()=>setTimeout(()=>ui.draw(),0));
 const inc=r=>(dto.checked||!r.dto)&&(inv.checked||r.ok);
 const pass=(r,skip='')=>inc(r)&&(skip.includes('p')||!M.P.size||M.P.has(r.p))&&(skip.includes('c')||!M.C.size||M.C.has(r.p+'|'+r.c))&&(skip.includes('f')||!S.f||r.fam.has(S.f))&&(skip.includes('k')||!S.ch||r.cs.includes(S.ch));
 const cnt=(skip,f)=>ROWS.filter(r=>pass(r,skip)&&f(r)).length;
 /* MT t2132: one approved course, exact match (same rule as atoList); the course pills on the cards set it */
 const COURSES=[...new Set(ROWS.flatMap(r=>r.cs))];
 const real=v=>v&&!/^(Unknown|Other)$/.test(v);
 const ui=make({seg:1,section:sec,input:q,hints:['ATOs','courses','cities','provinces'],noun:['ATO','ATOs'],open:'c',
  groups:[
   {id:'p',label:'Province',top:4,on:v=>M.P.has(v),
    items:()=>{const m={};ROWS.forEach(r=>{if(real(r.p))m[r.p]=0});Object.keys(m).forEach(p=>m[p]=cnt('pc',r=>r.p===p));return byCount(m).map(p=>[p,p,m[p]])},
    tap:v=>{toggle(M.P,v);if(M.P.size)[...M.C].forEach(k=>{if(!M.P.has(k.split('|')[0]))M.C.delete(k)})}},
   {id:'c',label:'City',top:4,on:v=>M.C.has(v),
    items:()=>{const m={};ROWS.forEach(r=>{if(real(r.c)&&(!M.P.size||M.P.has(r.p))&&pass(r,'c')){const k=r.p+'|'+r.c;m[k]=(m[k]||0)+1}});[...M.C].forEach(k=>m[k]=m[k]||0);
     return byCount(m).map(k=>[k,k.split('|')[1],m[k]])},tap:v=>toggle(M.C,v)},
   {id:'f',label:'Courses & ratings',any:'All',val:()=>{const a=[];const f=FAMS.find(x=>x[0]===S.f);if(f)a.push(f[1]);if(S.ch)a.push(S.ch);return a.length?a.join(', '):'All'},on:v=>S.f===v,items:()=>FAMS.map(([f,l])=>[f,l,cnt('f',r=>r.fam.has(f))]),tap:v=>{S.f=S.f===v?'':v}},
   {id:'k',label:'Course',join:'f',findLabel:'course or rating',top:4,search:true,any:'Any',on:v=>S.ch===v,
    items:()=>{const m={};COURSES.forEach(c=>m[c]=cnt('k',r=>r.cs.includes(c)));if(S.ch&&!(S.ch in m))m[S.ch]=0;return byCount(m).filter(c=>m[c]||c===S.ch).map(c=>[c,c,m[c]])},tap:v=>{S.ch=S.ch===v?'':v}},
   {id:'s',label:'Sort by',on:v=>S.s===v,items:()=>SORT.map(([v,l])=>[v,l,null]),tap:v=>{const b=menu(v);b&&b.click()}},
   /* backlog 3: ranking is view-only for now (stars show on cards); high/low ranking sort comes later */
   {id:'n',label:'Per page',seg:1,on:v=>per()===v,items:()=>PER.map(([v,l])=>[v,l,null]),tap:v=>{const b=sec.querySelector('.wds-sm [data-pp="'+v+'"]');b&&b.click()}}],
  toggles:[
   {id:'inv',seg:['Valid only','Include expired'],note:on=>{const n=ROWS.filter(r=>!r.ok).length;return n+' expired ATOs '+(on?'shown':'hidden')},label:'Expired',short:'Expired',hint:()=>ROWS.filter(r=>!r.ok).length+' ATOs',on:()=>inv.checked,tap:()=>{inv.checked=!inv.checked}},
   {id:'dto',seg:['ATO only','Include DTO'],note:on=>{const n=ROWS.filter(r=>r.dto).length;return n+' DTOs '+(on?'shown':'hidden')},label:'DTO / paragliding',short:'DTO',hint:()=>ROWS.filter(r=>r.dto).length+' DTOs',on:()=>dto.checked,tap:()=>{dto.checked=!dto.checked}},
   {id:'near',seg:['Off','Near me'],note:on=>on?'Sorted by distance from you':'Sort by distance from you',label:'Near me',short:'Near me',on:()=>S.s==='near',tap:()=>{const b=menu(S.s==='near'?'name':'near');b&&b.click()}}
],
  total:()=>ROWS.filter(r=>pass(r)&&qok(r)).length,base:()=>ROWS.filter(inc).length,
  active:()=>(window.WMStars&&WMStars.mode?1:0)+M.P.size+M.C.size+(S.f?1:0)+(S.ch?1:0)+(dto.checked?1:0)+(inv.checked?1:0)+(S.s==='near'?1:0),
  reset:()=>{if(window.WMStars)WMStars.mode='';M.P.clear();M.C.clear();M.K.clear();S.f='';S.ch='';dto.checked=false;inv.checked=false;if(S.s!=='name'){const b=menu('name');b&&b.click()}},
  refresh:()=>{persist();X.r2()},
  list:()=>document.getElementById('g2')});
 window.WMFato=ui;X.r2();ui.draw();return true}

/* ---------------- DFE page ----------------
   Same builder as ATO. Province + designation are multi-select Sets (window.WDSDF),
   matching ATO's WDSMF P/C. #dx (include expired), .wx-menu sort and wds.js page size
   stay the page's controls. #dp/#dd are cleared while the filter is mounted. */
function dfe(){
 const sec=document.getElementById('dfe'),q=document.getElementById('q3'),X=window.WMX;
 const dp=document.getElementById('dp'),dd=document.getElementById('dd'),dx=document.getElementById('dx');
 if(!sec||!q||!dp||!dd||!dx||!X||typeof DF==='undefined')return false;
 const S=X.S.dfe,HIDE=new Set(['pexo test three cm person']);        /* same hidden test record as dfeList() */
 const SORT=[['name','Name A–Z'],['most','Most ratings'],['exp1','Expiring soonest'],['exp2','Expiring latest']];
 const PER=[['10','10'],['20','20'],['50','50'],['all','All']];
 const menu=v=>sec.querySelector('.wx-menu [data-v="'+v+'"]');
 const per=()=>localStorage.getItem('wds-pp-dfe')||'50';
 /* multi-select Sets — same pattern as ATO WDSMF.P / WDSMF.C (DFE has no city field) */
 const P=new Set(),G=new Set();
 try{const s=JSON.parse(sessionStorage.getItem('wds-df')||'{}');(s.p||[]).forEach(v=>P.add(v));(s.g||[]).forEach(v=>G.add(v))}catch(e){}
 window.WDSDF={P,G};
 const persist=()=>{try{sessionStorage.setItem('wds-df',JSON.stringify({p:[...P],g:[...G]}))}catch(e){}};
 const ROWS=DF.filter(d=>!HIDE.has(d.name.trim().toLowerCase())).map(d=>({p:d.province||'',g:d.desigs||[d.designation],ok:/^valid/i.test(d.status),rs:X.ratings?X.ratings(d):[],d}));
 const RATINGS=[...new Set(ROWS.flatMap(r=>r.rs))];
 /* backlog 4: count follows the search box, same match as dfeList() */
 const qok=r=>{const v=(q.value||'').toLowerCase().trim(),d=r.d;if(!v)return true;/* MT t2132: dfeHit/dfeTest live inside app.html's closure (never global), so the old fallback counted plain text only; use the list's own match */if(X.dfeQ)return X.dfeQ(d,v);const hit=typeof dfeHit==='function'?dfeHit:()=>false;
  return (typeof dfeTest==='function'&&dfeTest(v))?!!hit(d,v):((d.name+' '+d.ratings+' '+d.operator+' '+d.designation+' '+d.province).toLowerCase().includes(v)||!!hit(d,v))};q.addEventListener('input',()=>setTimeout(()=>ui.draw(),0));
 const inc=r=>dx.checked||r.ok;
 const pass=(r,skip='')=>inc(r)&&(skip.includes('p')||!P.size||P.has(r.p))&&(skip.includes('g')||!G.size||r.g.some(x=>G.has(x)))&&(skip.includes('r')||!S.ch||r.rs.includes(S.ch));
 const cnt=(skip,f)=>ROWS.filter(r=>pass(r,skip)&&f(r)).length;
 const real=v=>v&&!/^(Unknown|Other)$/.test(v);
 /* keep legacy selects empty so dfeList Set path is the only source */
 dp.value='';dd.value='';
 const ui=make({section:sec,input:q,hints:['examiners','ratings','provinces','operators'],noun:['DFE','DFEs'],title:'DFEs',open:'p',
  groups:[
   {id:'p',label:'Province',top:4,on:v=>P.has(v),
    items:()=>{const m={};ROWS.forEach(r=>{if(real(r.p))m[r.p]=0});Object.keys(m).forEach(p=>m[p]=cnt('p',r=>r.p===p));return byCount(m).map(p=>[p,p,m[p]])},
    tap:v=>toggle(P,v)},
   {id:'g',label:'Designation',top:4,on:v=>G.has(v),
    items:()=>{const m={};ROWS.forEach(r=>{if(pass(r,'g'))r.g.forEach(x=>{if(real(x))m[x]=(m[x]||0)+1})});[...G].forEach(k=>{if(!(k in m))m[k]=0});
     return byCount(m).map(g=>[g,g,m[g]])},tap:v=>toggle(G,v)},
   /* MT t2132: one aircraft rating, exact match (same rule as dfeList); the rating pills on the cards set it */
   {id:'r',label:'Rating',top:4,search:true,on:v=>S.ch===v,
    items:()=>{const m={};RATINGS.forEach(x=>m[x]=cnt('r',r=>r.rs.includes(x)));if(S.ch&&!(S.ch in m))m[S.ch]=0;return byCount(m).filter(x=>m[x]||x===S.ch).map(x=>[x,x,m[x]])},tap:v=>{S.ch=S.ch===v?'':v}},
   {id:'s',label:'Sort by',on:v=>S.s===v,items:()=>SORT.map(([v,l])=>[v,l,null]),tap:v=>{const b=menu(v);b&&b.click()}},
   {id:'n',label:'Per page',seg:1,on:v=>per()===v,items:()=>PER.map(([v,l])=>[v,l,null]),tap:v=>{const b=sec.querySelector('.wds-sm [data-pp="'+v+'"]');b&&b.click()}}],
  /* Include: same segmented pill as Per page; "Include expired" = the hidden #dx checkbox */
  incl:{id:'x',label:'Include',seg:1,on:v=>(v==='all')===dx.checked,items:()=>[['act','Valid only',null],['all','Include expired',null]],tap:v=>{dx.checked=v==='all'},
   val:()=>dx.checked?'Incl. expired':'Valid only',note:()=>{const n=ROWS.filter(r=>!r.ok).length;return n+' expired examiner'+(n===1?'':'s')+(dx.checked?' shown':' hidden')}},
  total:()=>ROWS.filter(r=>pass(r)&&qok(r)).length,base:()=>ROWS.filter(inc).length,
  active:()=>P.size+G.size+(dx.checked?1:0)+(S.ch?1:0),
  reset:()=>{P.clear();G.clear();dp.value='';dd.value='';dx.checked=false;S.ch='';if(S.s!=='name'){const b=menu('name');b&&b.click()}},
  refresh:()=>{persist();dp.value='';dd.value='';X.r3()},
  list:()=>document.getElementById('g3')});
 window.WMFdfe=ui;X.r3();ui.draw();return true}


/* the old .bar wrapper keeps a full-height glass layer (backdrop-filter) that the sliding list would pass
   under (blurring it) and that is repainted every frame; the new shell provides the glass, so drop it */
const HIDE='html body section#ato[data-wmf]>.bar,html body section#dfe[data-wmf]>.bar{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:none!important;box-shadow:none!important;border-color:transparent!important}'+
 'html body section#ato[data-wmf] .bar.wds-stack>.wq-loc,html body section#ato[data-wmf] .wds-fa,html body section#ato[data-wmf] .wds-fr,html body section#ato[data-wmf] .wx-legend,'+
 'html body section#ato[data-wmf] .wx-sortb,html body section#ato[data-wmf] .wds-dshow,html body section#ato[data-wmf] .bar>select,html body section#ato[data-wmf] .bar>label,'+
 /* DFE: old selects, "Include expired", page-size chip and sort button are driven by the new filter */
 'html body section#dfe[data-wmf] .bar>select,html body section#dfe[data-wmf] .bar>label,html body section#dfe[data-wmf] .wds-dshow,html body section#dfe[data-wmf] .wx-sortb{display:none!important}'+
 /* DFE bar is a wrapping row (ATO's is the wds-stack column): stack it so the filter spans the full width like ATO */
 'html body section#dfe[data-wmf]>.bar{flex-direction:column!important;flex-wrap:nowrap!important;align-items:stretch!important;grid-template-columns:minmax(0,1fr)!important}html body section#dfe[data-wmf]>.bar>.wmf{grid-column:1/-1!important}';

/* wq.js / wds.js build their bars after load: retry briefly until the page objects exist */
let tries=0;const boot=()=>{if(!document.getElementById('wmf-hide')){const s=document.createElement('style');s.id='wmf-hide';s.textContent=HIDE;document.head.append(s)}
 const a=!document.getElementById('q2')||!!window.WMFato||ato(),d=!document.getElementById('q3')||!!window.WMFdfe||dfe();
 if(!(a&&d)&&++tries<50)setTimeout(boot,100)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
/* MT t1797: "Show N ATOs / DFEs" is a neat pill whose glass hugs the words, same as the aerodrome "Show 316 aerodromes"
   pill (feature/aero-filter-oldlook fv3.js .wmf-aero .ap2): 8px/14px padding, full radius, --gl2 glass, top highlight,
   1px --tx3 ring, soft drop, blur(18px) saturate(1.6). Nothing else changes. */
(()=>{const s=document.createElement('style');s.id='wmf9-show-pill';s.textContent=
'html body .wmf .wmf-ft button.wmf-ap{flex:none!important;width:auto!important;min-width:0!important;padding:8px 14px!important;border-radius:999px!important;line-height:1.2!important;'+
'background:var(--gl2)!important;box-shadow:inset 0 1px 0 var(--hl,var(--hi)),inset 0 0 0 1px var(--tx3),0 8px 24px -14px rgba(0,0,0,.35)!important;color:var(--tx)!important;'+
'-webkit-backdrop-filter:blur(18px) saturate(1.6);backdrop-filter:blur(18px) saturate(1.6);transition:transform .25s cubic-bezier(.32,.72,0,1),background .3s,box-shadow .3s}'+
'html body .wmf .wmf-ft button.wmf-ap:active{transform:scale(.97)}';document.head.append(s)})();
/* MT t2186/t2187: long option groups (Course / Rating "All N", long Province or City lists) open into their own
   fixed-height space that scrolls inside, so the filter panel never stretches the page. Explicit exception to the
   no-inner-scroll rule (MT asked for it). Segmented groups (Per page, Include) are never capped. Nothing else changes. */
(()=>{const s=document.createElement('style');s.id='wmf9-grp-scroll';s.textContent=
'html body section .wmf .wmf-inl>.wmf-jn,html body section .wmf .wmf-inl>.wmf-chips:not(.wmf-seg){max-height:min(264px,36dvh);overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin;padding:2px;margin:-2px}';
document.head.append(s)})();
