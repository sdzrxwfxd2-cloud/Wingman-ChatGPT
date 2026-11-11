/* wm-adback.js (fix/double-topbar v2, MT t1583/t1585/t1587): one top bar while an aerodrome or ATO school page is open inside the app.
   Phone (<700px): a back icon appears where the logo sits, and the logo slides to the middle, equally spaced between the back icon
   and the clock (the #221 aerodrome-page layout). iPad/desktop: the bar stays exactly as main; only a "< Aerodromes" / "< ATOs"
   back pill fades in beside the logo. The pill (bottom nav) is not touched.
   Motion: transform/opacity only, about 200 ms. View Transitions API where supported (root cross-fade, logo morph), otherwise a
   WAAPI cross-slide of the two frames. Reduced motion jumps to the end state. Browser back and the iOS swipe use the same path
   (on iOS the page swap after a swipe is instant, because Safari already animated it).
   Switches: default is the WAAPI transform/opacity path (live blur, same on iOS); ?tbvt=1 opts into View Transitions, ?tbanim=0 turns page motion off.
   Undo: remove the <script src="wm-adback.js"> tag, the wm-adback-css style and the WMTB line in show() in index.html. */
(function(){
 'use strict';
 var D=document,R=D.documentElement,W=window;
 var mq=matchMedia('(max-width:699.98px)'),rm=matchMedia('(prefers-reduced-motion: reduce)');
 var Q=new URLSearchParams(location.search);
 var VT=Q.get('tbvt')==='1'&&typeof D.startViewTransition==='function';
 var ANIM=Q.get('tbanim')!=='0';
 var IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
 var EASE='cubic-bezier(.2,.8,.2,1)',T_IN=210,T_OUT=190;
 var hdr=null,logo=null,btn=null,state='',listY=null,fromPop=0,busy=0,apObs=null;
 var M=function(){return W.WMMERGE||{}};
 var FR=function(k){var f=M().frames;return f&&f[k]};
 function els(){hdr=D.querySelector('body>header.topbar');logo=hdr&&hdr.querySelector(':scope>.logo');return !!(hdr&&logo)}
 function make(){if(btn&&btn.parentNode===hdr)return btn;
  var b=D.createElement('a');b.className='icb wmadback';b.href='main.html';b.setAttribute('aria-label','Back to aerodromes');b.tabIndex=-1;
  b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg><span class="wmadbt">Aerodromes</span>';
  b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();back()},true);
  hdr.insertBefore(b,hdr.firstChild);btn=b;return b}
 /* geometry: measured on the untransformed logo (offsetLeft ignores transforms) */
 function layout(){if(!els())return;make();
  var hb=hdr.getBoundingClientRect(),lx=logo.offsetLeft,lw=logo.offsetWidth,ly=logo.offsetTop,lh=logo.offsetHeight,bh=btn.offsetHeight||38;
  btn.style.top=Math.round(ly+(lh-bh)/2)+'px';
  if(mq.matches){
   var tb=hdr.querySelector(':scope>.tbtn'),ck=tb&&tb.firstElementChild,cl=ck?ck.getBoundingClientRect().left-hb.left:hb.width;
   var bw=btn.offsetWidth||38;btn.style.left=lx+'px';
   var dx=((lx+bw)+cl)/2-(lx+lw/2);R.style.setProperty('--wmlx',(Math.round(dx*2)/2)+'px')}
  else{btn.style.left=(lx+lw+10)+'px';R.style.setProperty('--wmlx','0px')}}
 function apOpen(){try{var d=FR('c')&&FR('c').contentDocument,a=d&&d.querySelector('body>.ap');return !!(a&&!a.dataset.closing)}catch(e){return false}}
 function want(){var c=M().cur;if(c==='ad')return 'ad';if(c==='ato'&&apOpen())return 'ato';return ''}
 /* apply the bar state; instant=true skips the bar transition for this change */
 function setState(s,instant){if(!els())return;make();if(s===state&&!instant)return;
  if(s){var t=s==='ato'?'ATOs':'Aerodromes';btn.querySelector('.wmadbt').textContent=t;btn.setAttribute('aria-label','Back to '+t.toLowerCase());btn.dataset.k=s}
  layout();
  if(instant||rm.matches){R.classList.add('wm-tbinst');void hdr.offsetWidth}
  R.classList.toggle('wm-adopen',!!s);btn.tabIndex=s?0:-1;state=s;
  if(R.classList.contains('wm-tbinst')){void hdr.offsetWidth;requestAnimationFrame(function(){R.classList.remove('wm-tbinst')})}}
 function sync(instant){setState(want(),instant)}
 /* keep the list scroll position while the list is showing */
 addEventListener('scroll',function(){if(M().cur==='aero'&&!busy)listY=W.scrollY},{passive:true});
 addEventListener('popstate',function(){fromPop=1;setTimeout(function(){fromPop=0},0)},true);
 function restore(y){if(y==null)return;scrollTo(0,y);var k=0;(function f(){if(Math.abs(W.scrollY-y)>1)scrollTo(0,y);if(++k<6)requestAnimationFrame(f)})()}
 /* fixed "ghost" of the outgoing frame so both pages can cross-slide while the document scroll changes underneath */
 function pin(f){var r=f.getBoundingClientRect();f.style.cssText+=';position:fixed;top:'+r.top+'px;left:0;margin-left:0;z-index:5;pointer-events:none';f.style.display=''}
 function unpin(f){['position','top','left','margin-left','z-index','pointer-events','will-change'].forEach(function(p){f.style.removeProperty(p)})}
 function anim(f,kf,ms,ez){if(!f)return {finished:Promise.resolve(),cancel:function(){}};f.style.willChange='transform,opacity';var a=f.animate(kf,{duration:ms,easing:ez||EASE});a.finished.catch(function(){}).then(function(){f.style.removeProperty('will-change')});return a}
 function waapi(open,from,to,place,y){
  var out=FR(open?(from==='aero'?'aero':key(from)):'ad');
  if(out&&out.style.display!=='none')pin(out);else out=null;
  place();if(!open)restore(y);setState(want());
  if(out){out.style.display='';}
  var inn=FR(open?'ad':key(to));
  var dirIn=open?'translate3d(28px,0,0)':'translate3d(-18px,0,0)',dirOut=open?'translate3d(-18px,0,0)':'translate3d(28px,0,0)';
  busy++;
  var a1=anim(inn,[{opacity:0,transform:dirIn},{opacity:1,transform:'none'}],open?T_IN:T_OUT);
  var a2=out?anim(out,[{opacity:1,transform:'none'},{opacity:0,transform:dirOut}],open?T_IN-30:T_OUT-40,'cubic-bezier(.4,0,1,1)'):null;
  var done=function(){if(out){if(M().cur===(open?'ad':to)||true){var vis=key(M().cur)===out._k;out.style.display=vis?'':'none'}unpin(out)}busy=Math.max(0,busy-1)};
  (a2?Promise.all([a1.finished.catch(function(){}),a2.finished.catch(function(){})]):a1.finished.catch(function(){})).then(done)}
 function key(k){return /^(chart|map|ato|dfe)$/.test(k)?'c':k}
 function run(from,to,place){
  var open=to==='ad'&&from!=='ad',bk=from==='ad'&&to!=='ad',y=to==='aero'?listY:null;
  if(!open&&!bk){place();sync(false);return}
  if(open&&from==='aero')listY=W.scrollY;
  var still=!ANIM||rm.matches||(fromPop&&IOS)||D.hidden||from==null;
  if(still){busy++;place();if(bk)restore(y);sync(true);busy--;return}
  if(VT){busy++;R.classList.add('wm-vt',open?'wm-vt-open':'wm-vt-back');
   var t;try{t=D.startViewTransition(function(){place();if(bk)restore(y);sync(true)})}catch(e){t=null}
   if(!t){R.classList.remove('wm-vt','wm-vt-open','wm-vt-back');busy--;waapi(open,from,to,place,y);return}
   var end=function(){R.classList.remove('wm-vt','wm-vt-open','wm-vt-back');busy=Math.max(0,busy-1)};
   t.finished.then(end,end);return}
  waapi(open,from,to,place,y)}
 function back(){var s=state||want();
  if(s==='ato'){try{var w=FR('c').contentWindow;if(w.WMAtoPage){w.WMAtoPage.close();setTimeout(function(){sync(false)},0);return}}catch(e){}}
  var m=M();if(m.show){m.show('aero',false)}else location.href='main.html'}
 /* ATO school page lives inside the ATOs frame (c/app.html, ato-page.js); watch for it */
 function watchAto(){var f=FR('c');if(!f)return;try{var d=f.contentDocument;if(!d||!d.body||d.body._wmtb)return;d.body._wmtb=1;
  new MutationObserver(function(){sync(false)}).observe(d.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-closing']})}catch(e){}}
 setInterval(watchAto,1000);
 addEventListener('resize',function(){if(els()&&btn){var i=R.classList.contains('wm-adopen');R.classList.add('wm-tbinst');layout();requestAnimationFrame(function(){R.classList.remove('wm-tbinst')})}});
 if(mq.addEventListener)mq.addEventListener('change',function(){layout()});
 W.WMTB={run:run,back:back,sync:sync,layout:layout,get state(){return state},get vt(){return VT}};
 function init(){if(!els())return;make();layout();sync(true);if(D.fonts&&D.fonts.ready)D.fonts.ready.then(function(){layout()})}
 if(D.readyState!=='loading')init();else D.addEventListener('DOMContentLoaded',init);
 addEventListener('load',function(){layout()});
})();
