/* Official SACAA AIP GEN 2.3 / ICAO Annex 4 Civil Land sign in the empty
   76px runway slot. Same pad, stroke, colours and theme tokens as the
   heliport (H) diagram, so it inverts between day and night the same way
   (--tx fill, --bg stroke). Applies only to fields with no runway data.
   Heliport cards and fields with runway lines are left alone.
   Military aerodromes with no runway get the matching Military Land sign
   (two concentric circles) in the same pad, size, frame, colours and layout;
   only the symbol changes. */
(function(){
'use strict';
var ST=document.createElement('style');
ST.id='no-rwy-civil-land-10nov';
ST.textContent=
'.card .rwd.cad{flex:none}'+
'svg.cad .cad-d{fill:var(--tx);fill-opacity:.82;stroke:none}'+
'svg.cad .cad-e{fill:none;stroke:var(--bg);stroke-opacity:.9;stroke-width:.8;stroke-dasharray:2.6 2.2}'+
'svg.cad .cad-c{fill:none;stroke:var(--bg);stroke-width:2.4;stroke-linecap:butt}'+
'svg.cad .cad-tick-box{fill:var(--bg);stroke:none}'+
'svg.cad .mad-c,svg.cad .mad-i{fill:none;stroke:var(--bg);stroke-width:2.4;stroke-linecap:butt}';
document.head.appendChild(ST);

var R=17, SW=2.4, TL=6.2, TW=2.4, OUTER=R+SW/2, HW=TW/2;
var TICKS=
  '<rect class="cad-tick-box" x="'+(-HW)+'" y="'+(-(OUTER+TL))+'" width="'+TW+'" height="'+TL+'"/>'+
  '<rect class="cad-tick-box" x="'+OUTER+'" y="'+(-HW)+'" width="'+TL+'" height="'+TW+'"/>'+
  '<rect class="cad-tick-box" x="'+(-HW)+'" y="'+OUTER+'" width="'+TW+'" height="'+TL+'"/>'+
  '<rect class="cad-tick-box" x="'+(-(OUTER+TL))+'" y="'+(-HW)+'" width="'+TL+'" height="'+TW+'"/>';
var INNER='<circle class="cad-d" r="35"/><circle class="cad-e" r="31.5"/><circle class="cad-c" r="17"/>'+TICKS;
/* ICAO Annex 4 / GEN 2.3 Military Land: two concentric circles, same pad and
   same outer circle as Civil Land (r=17). Inner circle 3/5 of that radius. No ticks. */
var MIL='<circle class="cad-d" r="35"/><circle class="cad-e" r="31.5"/><circle class="mad-c" r="17"/><circle class="mad-i" r="10.2"/>';
function svg(mil){
  if(mil) return '<svg class="rwd cad mad" viewBox="-40 -40 80 80" role="img" aria-label="Military land aerodrome symbol"><circle r="38"/><g class="cad-g">'+MIL+'</g></svg>';
  return '<svg class="rwd cad" viewBox="-40 -40 80 80" role="img" aria-label="Civil land aerodrome symbol"><circle r="38"/><g class="cad-g">'+INNER+'</g></svg>';
}
function isHeli(c){
  if(!c)return true;
  if(c.dataset.heli==='1'||c.dataset.s==='heli'||c.dataset.cat==='heliport')return true;
  var i=c.querySelector('.icao');
  var id=i&&i.textContent.trim();
  return !!(id&&window.AD_CLASS&&AD_CLASS[id]);
}
function isMil(c){
  if(!c)return false;
  if(c.dataset.adType==='military')return true;
  var i=c.querySelector('.icao');
  var id=i&&i.textContent.trim();
  var D=window.WM_AD_TYPES||{};
  return !!(id&&D[id]&&D[id].t==='military');
}
function isEmpty(r,c){
  if(!r||r.classList.contains('hpad'))return false;
  if(r.classList.contains('cad'))return false;
  if(r.querySelector('line.r'))return false;
  if(isHeli(c||r.closest('.card')))return false;
  return true;
}
function needsMil(r,c){
  if(!r||!c||!isMil(c)||isHeli(c))return false;
  if(r.querySelector('line.r')||r.classList.contains('hpad'))return false;
  if(r.classList.contains('mad'))return false;
  return r.classList.contains('cad')||isEmpty(r,c);
}
function paint(){
  document.querySelectorAll('#list .card .rwd, #wsp-cards .card .rwd, .card .rwd').forEach(function(r){
    var c=r.closest('.card');
    if(needsMil(r,c)){ r.insertAdjacentHTML('afterend',svg(true)); r.remove(); return; }
    if(!isEmpty(r,c))return;
    r.insertAdjacentHTML('afterend',svg(false));
    r.remove();
  });
}
function go(){paint();
  var L=document.getElementById('list')||document.getElementById('wsp-cards');
  if(L&&!L.__cadObs){L.__cadObs=1;new MutationObserver(function(){paint()}).observe(L,{childList:true,subtree:true})}
}
if(document.readyState==='complete')setTimeout(go,450);
else addEventListener('load',function(){setTimeout(go,450)});
})();
