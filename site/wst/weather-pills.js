/* Weather-condition capsules: presentation only. Category text remains the source of truth.
   Shared by Aerodromes, Status's cards, FACT and every aerodrome weather detail.
   Keep text as the last child: existing METAR writers update lastChild.textContent. */
(function(){
 'use strict';
 var D=document,paths={
  VMC:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  IMC:'<path d="M6 14a4 4 0 0 1-.3-8 5.5 5.5 0 0 1 10.1 1.2A3.5 3.5 0 1 1 18 14H6Zm-2 4h16M7 21h10"/>',
  VFR:'<path d="M3 17h18M7 13a5 5 0 0 1 10 0M12 3v2M4.9 5.9l1.4 1.4m11.4 0 1.4-1.4M3 21h18"/>',
  MVFR:'<path d="M5 15a3 3 0 0 1-.1-6 4.5 4.5 0 0 1 8.4 1A2.7 2.7 0 1 1 15 15H5ZM4 19h16M16 3v2m4 2 1.5-1.5M18 11a3 3 0 0 0-3-5"/>',
  IFR:'<circle cx="12" cy="12" r="9"/><path d="M3 12h5m8 0h5M8 10l4 2 4-2M12 3v3m0 12v3"/>',
  LIFR:'<circle cx="12" cy="12" r="9"/><path d="M4 15h4m8 0h4M8 10l4 2 4-2M12 3v3M9 18h6"/>'
 };
 // Shared weather vocabulary. Only decorate weather-pill surfaces, never metric rows,
 // minima inputs, aerodrome capability flags, navigation or course/rating chips.
 var cloud='<path d="M6 16a4 4 0 0 1-.3-8 5.5 5.5 0 0 1 10.1 1.2A3.5 3.5 0 1 1 18 16H6Z"/>';
 paths.wind='<path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h5a3 3 0 1 1-3 3"/>';
 paths.gust='<path d="M3 7h12a2.5 2.5 0 1 0-2.5-2.5M2 11h17M5 15h12a2.5 2.5 0 1 1-2.5 2.5M2 19h5"/>';
 paths.crosswind='<path d="M9 3h6v18H9ZM12 6v2m0 3v2m0 3v2M2 12h5m-3-3-3 3 3 3m13-3h5m-3-3 3 3-3 3"/>';
 paths.visibility='<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>';
 paths.cloud=cloud;
 paths.ceiling=cloud+'<path d="M4 21h16m-8-3v3m-2-2 2 2 2-2"/>';
 paths.rain=cloud+'<path d="m7 19-1 2m6-2-1 2m6-2-1 2"/>';
 paths.drizzle=cloud+'<path d="M7 20h.1m4 1h.1m4-1h.1"/>';
 paths.thunderstorm=cloud+'<path d="m12 16-3 4h4l-2 3"/>';
 paths.fog='<path d="M3 6h18M5 10h14M2 14h20M5 18h14"/>';
 paths.mist='<path d="M4 8h16M2 12h20M5 16h14"/>';
 paths.CAVOK=paths.VMC;
 paths.snow=cloud+'<path d="M10 18v5m-2-4 4 3m0-3-4 3m9-4v4m-1.5-3 3 2m0-2-3 2"/>';
 paths.hail=cloud+'<circle cx="7" cy="20" r="1"/><circle cx="12" cy="21" r="1"/><circle cx="17" cy="20" r="1"/>';
 paths.ice='<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3M9 20l3-3 3 3M3.8 10.5l4-1-1-4m10.4 13 1-4 4-1M3.8 13.5l4 1-1 4m10.4-13 1 4 4 1"/>';
 paths.haze='<circle cx="12" cy="8" r="4"/><path d="M3 14h18M5 18h14M7 22h10"/>';
 paths.day=paths.VMC;
 paths.night='<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>';
 paths.temperature='<path d="M9 5a3 3 0 0 1 6 0v9a5 5 0 1 1-6 0V5Zm3 3v9m0 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/>';
 paths.pressure='<circle cx="12" cy="12" r="9"/><path d="m12 12 4-5M5 12h2m10 0h2M12 5v2M8 18h8"/>';
 paths.turbulence='<path d="M2 8c4-7 6 7 10 0s6 7 10 0M2 16c4-7 6 7 10 0s6 7 10 0"/>';
 var selector='.fbadge, .weather-pill, [data-weather-pill], .wq-nn, .vb';
 function keyOf(b){
  var text=b.textContent.trim().toUpperCase();if(paths[text])return text;
  if(b.matches('.wsun2'))return /^DAY/.test(text)?'day':'night';
  if(b.matches('.wfzl2'))return 'ice';if(b.matches('.wq-nn'))return 'night';
  var keys=[[/CROSSWIND|X[- ]?WIND/,'crosswind'],[/THUNDER|(?:^|\s)[+-]?(?:VC)?TS(?:RA|GR)?(?:\s|$)/,'thunderstorm'],[/GUST|^SQ$/,'gust'],[/WIND|CALM/,'wind'],[/VISIBILITY|^VIS\b/,'visibility'],[/CEILING|^CEIL\b/,'ceiling'],[/CAVOK/,'CAVOK'],[/FOG|^FG$/,'fog'],[/MIST|^BR$/,'mist'],[/DRIZZLE|^[-+]?DZ$/,'drizzle'],[/RAIN|^[-+]?(?:SH|FZ)?RA$/,'rain'],[/SNOW|^[-+]?(?:SH)?SN$/,'snow'],[/HAIL|^[-+]?(?:SH)?G[RS]$/,'hail'],[/FREEZ|ICING|^FZL\b|^ICE\b/,'ice'],[/CLOUD|^(?:FEW|SCT|BKN|OVC|VV|NSC|NCD|SKC|CLR|CB|TCU)\b/,'cloud'],[/HAZE|SMOKE|DUST|^HZ$|^FU$|^DU$/,'haze'],[/^DAY\b|SUNRISE|SUNSET/,'day'],[/^NIGHT\b/,'night'],[/TEMP|DEW/,'temperature'],[/QNH|PRESSURE/,'pressure'],[/TURBULEN/,'turbulence']];
  for(var i=0;i<keys.length;i++)if(keys[i][0].test(text))return keys[i][1];return null;
 }

 function paint(b){
  var key=keyOf(b),old=b.querySelector('.wm-flight-icon');
  if(!key||!paths[key]){if(old)old.remove();b.removeAttribute('data-flight-icon');return}
  if(old&&b.getAttribute('data-flight-icon')===key&&!b.querySelector('i'))return;
  if(old)old.remove();b.querySelectorAll('i, :scope > svg').forEach(function(i){i.remove()});
  if(b.matches('.vb')&&b.style.background)b.style.setProperty('--wm-weather-color',b.style.background);
  if(!b.matches('.vb'))b.style.setProperty('--wm-weather-color','var(--c, currentColor)');
  var svg=D.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('class','wm-flight-icon');svg.setAttribute('viewBox','0 0 24 24');
  svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.innerHTML=paths[key];
  b.insertBefore(svg,b.firstChild);b.setAttribute('data-flight-icon',key);
 }
 var style=D.createElement('style');style.id='wm-flight-pill-css';
 style.textContent='[data-flight-icon]{box-sizing:border-box!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;width:auto!important;min-width:max-content!important;height:28px!important;padding:0 10px!important;gap:6px!important;border-radius:14px!important;font:650 11px/1 -apple-system,sans-serif!important;letter-spacing:.05em!important;white-space:nowrap!important;background:color-mix(in srgb,var(--wm-weather-color, currentColor) 14%,transparent)!important;box-shadow:inset 0 0 0 .5px color-mix(in srgb,var(--wm-weather-color, currentColor) 45%,transparent)!important}[data-flight-icon]::before{display:none!important}[data-flight-icon] .wm-flight-icon{width:14px!important;height:14px!important;flex:none;filter:none!important;fill:none!important;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}';
 style.textContent+='[data-flight-icon] .wm-flight-icon *{fill:none!important;stroke:currentColor!important;stroke-width:1.65!important;stroke-linecap:round;stroke-linejoin:round}[data-flight-icon].vb{color:var(--wm-weather-color)!important}[data-flight-icon].wsun2,[data-flight-icon].wfzl2,[data-flight-icon].wq-nn{width:fit-content!important;max-width:100%;height:auto!important;min-height:28px;flex-wrap:wrap;padding:5px 10px!important;line-height:1.4!important;overflow:visible;white-space:normal!important}[data-flight-icon].wsun2 .u{margin-left:0}';
 D.head.appendChild(style);
 function start(){
  var mo=new MutationObserver(function(records){
   var badges=new Set();
   function collect(n){if(n.nodeType===3)n=n.parentElement;if(!n||n.nodeType!==1)return;
    var b=n.closest(selector);if(b)badges.add(b);
    n.querySelectorAll(selector).forEach(function(x){badges.add(x)})}
   records.forEach(function(r){if(r.type==='characterData')collect(r.target);else{if(r.target.matches&&r.target.matches(selector))badges.add(r.target);r.addedNodes.forEach(collect)}});
   badges.forEach(paint);mo.takeRecords();
  });
  D.querySelectorAll(selector).forEach(paint);
  mo.observe(D.body,{subtree:true,childList:true,characterData:true});
 }
 if(D.body)start();else D.addEventListener('DOMContentLoaded',start,{once:true});
})();
