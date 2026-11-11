/* wm-backpos.js: top-bar back from an aerodrome page returns to the list at the same
   scroll position, filter and card. Filter state is already kept by fv3.js (localStorage).
   Undo: remove the <script src="/wm-backpos.js"> tags. */
(function(){
 'use strict';
 var K='wm-backpos',W=window,D=document;
 function get(){try{return JSON.parse(sessionStorage.getItem(K)||'null')}catch(e){return null}}
 function put(o){try{sessionStorage.setItem(K,JSON.stringify(o))}catch(e){}}
 var isDetail=!!D.querySelector('header.topbar a.back[href$="main.html"]')||/\/ad\/[^\/]+\.html$|\/fact\.html$/.test(location.pathname);
 if(isDetail){
  /* back button: go back in history when we came from the list, so iOS bfcache restores it as it was */
  D.addEventListener('click',function(e){
   var a=e.target.closest&&e.target.closest('header.topbar a.back');if(!a)return;
   var s=get(),ref='';try{ref=D.referrer?new URL(D.referrer):''}catch(x){}
   var same=ref&&ref.origin===location.origin;
   if(same&&s&&ref.pathname===s.p&&history.length>1){e.preventDefault();s.back=1;put(s);history.back()}
   else if(s&&s.p){e.preventDefault();s.back=1;put(s);location.href=s.p+(s.q||'')+(s.h||'')}
  },true);
  return;
 }
 /* list pages (main.html, app.html): remember position when opening an aerodrome */
 function icaoOf(a){var m=(a.getAttribute('href')||'').match(/(?:ad\/|#\/airport\/)([A-Za-z0-9-]+)|(fact)\.html/);return m?(m[1]||'FACT').toUpperCase():''}
 D.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('a[href*="ad/"],a[href^="#/airport/"],a[href$="fact.html"]');if(!a)return;
  var c=a.closest('article,.c,.card'),top=c?c.getBoundingClientRect().top:null;
  put({p:location.pathname,q:location.search,h:/^#\/airport\//.test(location.hash)?'':location.hash,y:W.scrollY,i:icaoOf(a),t:top,ts:Date.now()});
 },true);
 var s=get();if(!s||s.p!==location.pathname||!s.back||Date.now()-s.ts>36e5)return;
 try{history.scrollRestoration='manual'}catch(e){}
 function card(){if(!s.i)return null;var a=D.querySelector('a[href$="ad/'+s.i+'.html"],a[href="#/airport/'+s.i+'"]');return a&&(a.closest('article,.c,.card')||a)}
 function fix(){
  var y=s.y,c=card();
  if(c&&s.t!=null&&c.offsetParent){var r=c.getBoundingClientRect();y=W.scrollY+r.top-s.t}
  if(Math.abs(W.scrollY-y)>0.5)W.scrollTo({top:y,left:0,behavior:'instant'});
 }
 var n=0,end=Date.now()+1500;
 function loop(){fix();if(Date.now()<end&&n++<120)requestAnimationFrame(loop);else{s.back=0;put(s)}}
 if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',loop);else loop();
 W.addEventListener('pageshow',function(ev){var t=get();if(t&&t.back&&t.p===location.pathname){s=t;end=Date.now()+800;n=0;loop()}});
})();
