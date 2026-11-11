/* CONCEPT preview only: makes the static mock-ups tappable */
(function(){
var $=function(s,r){return(r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var css=document.createElement('style');css.textContent=
'.pvtoast{position:fixed;left:50%;top:calc(80px + env(safe-area-inset-top));transform:translate(-50%,-20px);opacity:0;z-index:100000;padding:10px 16px;border-radius:999px;background:rgba(20,20,24,.86);color:#fff;font:600 13px Satoshi,system-ui;backdrop-filter:blur(12px);transition:.35s cubic-bezier(.32,.72,0,1);pointer-events:none}.pvtoast.on{opacity:1;transform:translate(-50%,0)}'+
'.pvfr{width:100%;height:320px;border:0;border-radius:18px;display:block;background:#0e1a24}.pvflash{animation:pvf 1.2s}@keyframes pvf{0%,100%{box-shadow:none}30%{box-shadow:0 0 0 3px var(--acc,#5AC8FA)}}'+
'.pvsc{position:fixed;inset:0;background:rgba(0,0,0,.45);opacity:0;pointer-events:none;transition:opacity .35s;z-index:9000}.pvsc.on{opacity:1;pointer-events:auto}'+
'body.pvr3 .main .shdiv{display:none}body.pvr3 .main .sh{position:fixed;left:0;right:0;bottom:0;margin:0 auto;max-width:760px;max-height:88vh;overflow:auto;z-index:9001;transform:translateY(105%);transition:transform .5s cubic-bezier(.32,.72,0,1);background:var(--bg);border-radius:30px 30px 0 0;padding-bottom:calc(90px + env(safe-area-inset-bottom));overscroll-behavior:contain}body.pvr3 .main .sh.on{transform:none}body.pvr3 .sh .x{cursor:pointer}'+
'.t[data-sh],.tile,.lock,.emb,[aria-label=Settings]{cursor:pointer}.t[data-sh]:active,.tile:active{transform:scale(.97)}.t[data-sh]{transition:transform .2s}'+
'.mbar{position:relative;touch-action:none;cursor:ew-resize}.mbar i.hl{filter:brightness(1.6)}.pvtip{position:absolute;top:-30px;transform:translateX(-50%);padding:4px 8px;border-radius:8px;background:var(--tx);color:var(--bg);font:600 11px JetBrains Mono,monospace;white-space:nowrap;pointer-events:none}';
document.head.appendChild(css);
var tt;function toast(m){var t=$('.pvtoast');if(!t){t=document.createElement('div');t.className='pvtoast';document.body.appendChild(t)}t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('on')},1600)}
function setTheme(t){document.querySelectorAll('.pvsw button[data-t="'+t+'"]').forEach(function(b){b.click()})}
function go(el){if(!el)return;var y=el.getBoundingClientRect().top+scrollY-130;scrollTo({top:y,behavior:'smooth'});el.classList.remove('pvflash');void el.offsetWidth;el.classList.add('pvflash')}
var page=(location.pathname.match(/(r\d)\.html/)||[])[1];
document.addEventListener('DOMContentLoaded',function(){
 if(page==='r3')document.body.classList.add('pvr3');
 /* segmented controls and button groups */
 $$('button').forEach(function(b){var p=b.parentElement,g=$$(':scope>button',p);if(g.length<2||!g.some(function(x){return x.classList.contains('on')}))return;
  b.addEventListener('click',function(){var i=g.indexOf(b);g.forEach(function(x){x.classList.toggle('on',x===b)});p.style.setProperty('--ix',i);var lab=b.textContent.trim();
   if(p.matches('nav.wseg')){var ids=page==='r1'?{Now:'now',Runways:'rwy',Radio:'radio',Charts:'charts',People:'people'}:{Brief:'brief',Weather:'wx',Ground:'gnd',Air:'air',Field:'fld',Docs:'docs'};go(document.getElementById(ids[lab]));return}
   if(/^(METAR|TAF|Model)$/.test(lab)){var card=p.closest('.card'),fs=$$('.fs',card);
     if(lab==='Model'){var m=document.querySelector('.lock');fs.forEach(function(f){f.style.display=''});if(m){go(m.closest('.card'));m.click()}return}
     fs.forEach(function(f){var s=(f.querySelector('small')||{}).textContent||'';f.style.display=(lab==='METAR'||/TAF/.test(s))?'':(/METAR/.test(s)?'none':'')});
     if(lab==='METAR')fs.forEach(function(f,k){f.style.display=k===0?'':'none'});return}
   if(/^(AIP|OA)$/.test(lab)){toast(lab==='AIP'?'Showing AIP frequencies':'Showing OurAirports frequencies');return}
  })});
 /* r2 side rail */
 $$('nav.rail a').forEach(function(a,i,all){a.addEventListener('click',function(){all.forEach(function(x){x.classList.toggle('on',x===a)});go($$('section.phase')[i])})});
 /* copy buttons */
 $$('button.cp').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();var f=b.parentElement.querySelector('.f');var v=f?f.textContent.trim():'';try{navigator.clipboard.writeText(v).catch(function(){})}catch(x){}toast('Copied '+v)})});
 /* tap-to-load */
 function frame(el,src,title){var f=document.createElement('iframe');f.className='pvfr';f.src=src;f.title=title;f.loading='lazy';el.replaceWith(f);toast(title+' loading…')}
 $$('a.tile').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();var w=/Windy/.test(a.textContent);frame(a,w?'https://embed.windy.com/embed.html?type=map&lat=-33.97&lon=18.60&zoom=9&overlay=wind&metricWind=kt':'https://globe.adsb.lol/?lat=-33.97&lon=18.60&zoom=9',w?'Windy':'Live traffic')})});
 $$('.emb').forEach(function(a){a.addEventListener('click',function(){frame(a,'https://embed.windy.com/embed.html?type=map&lat=-33.97&lon=18.60&zoom=9&overlay=wind&metricWind=kt','Windy')})});
 $$('.lock').forEach(function(l){l.addEventListener('click',function(){if(l.dataset.done)return;l.dataset.done=1;l.querySelector('b').textContent='13-hour model loaded';l.querySelector('small').innerHTML='Example data · drag across the bars to read each hour';l.querySelector('.play').textContent='✓';var p=l.parentElement.querySelector('.prev');if(p){p.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:450,easing:'ease-out'})}toast('Model loaded (example)')})});
 /* model bars scrubber (slider) */
 $$('.mbar').forEach(function(m){var bars=$$('i',m),tip=document.createElement('span');tip.className='pvtip';tip.style.display='none';m.appendChild(tip);var h0=16;
  function at(x){var r=m.getBoundingClientRect(),k=Math.max(0,Math.min(bars.length-1,Math.floor((x-r.left)/r.width*bars.length)));bars.forEach(function(b,j){b.classList.toggle('hl',j===k)});var hh=(h0+k)%24,ht=parseFloat(bars[k].style.height)||50;tip.style.display='';tip.style.left=((k+.5)/bars.length*100)+'%';tip.textContent=(hh<10?'0':'')+hh+':00 · '+Math.round(ht/4)+' kt'}
  m.addEventListener('pointerdown',function(e){m.setPointerCapture(e.pointerId);at(e.clientX)});m.addEventListener('pointermove',function(e){if(e.buttons||e.pointerType==='mouse')at(e.clientX)});m.addEventListener('pointerleave',function(){tip.style.display='none';bars.forEach(function(b){b.classList.remove('hl')})})});
 /* settings: chips + steppers + reset */
 $$('.chips .pill').forEach(function(p){p.style.cursor='pointer';p.addEventListener('click',function(){var t=p.textContent.trim().toLowerCase(),cur=document.documentElement.dataset.theme;var map={night:cur==='purple'?'purple':'night',day:cur==='beige'?'beige':'day',black:'night',purple:'purple',white:'day',beige:'beige'};if(map[t]){setTheme(map[t]);sync()}})});
 function sync(){var t=document.documentElement.dataset.theme,on={night:['night','black'],purple:['night','purple'],day:['day','white'],beige:['day','beige']}[t]||[];$$('.chips .pill').forEach(function(p){p.classList.toggle('acc',on.indexOf(p.textContent.trim().toLowerCase())>=0)})}
 new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});sync();
 var defs=[];$$('.step').forEach(function(s,k){var sp=s.lastElementChild,is=$$('i',sp);if(is.length<2)return;var tn=Array.prototype.find.call(sp.childNodes,function(n){return n.nodeType===3&&/\d/.test(n.textContent)});if(!tn)return;defs[k]=tn.textContent;
  function bump(d){var m=tn.textContent.match(/(-?\d+(?:\.\d+)?)(.*)/),v=parseFloat(m[1]),st=/km/.test(m[2])?1:/ft/.test(m[2])?100:1;v=Math.max(0,v+d*st);tn.textContent=v+m[2];s.animate([{background:'color-mix(in srgb,var(--acc) 14%,transparent)'},{background:'transparent'}],{duration:500})}
  is[0].style.cursor=is[1].style.cursor='pointer';is[0].addEventListener('click',function(){bump(-1)});is[1].addEventListener('click',function(){bump(1)})});
 $$('button.btn').forEach(function(b){b.addEventListener('click',function(){if(/Reset/.test(b.textContent)){$$('.step').forEach(function(s,k){if(defs[k]){var tn=Array.prototype.find.call(s.lastElementChild.childNodes,function(n){return n.nodeType===3&&/\d/.test(n.textContent)});tn.textContent=defs[k]}});setTheme('night');toast('Settings reset')}else{window.open('https://www.caa.co.za/industry-information/aeronautical-information/','_blank','noopener')}})});
 /* r3 sheets */
 if(page==='r3'){var shs=$$('.sh').filter(function(s){return !s.closest('aside')}),sc=document.createElement('div');sc.className='pvsc';document.body.appendChild(sc);
  var name={'Can I go?':0,'Density alt':0,'Light':0,'NOTAMs & SUP':0,'Wind':1,'QNH':1,'Next 3 h':1,'13-h model':1,'Runways':2,'Tower':3,'Traffic':3,'Field':4,'Fuel & hours':4,'Flight schools':4,'Examiners':4,'Charts':5,'AIP pages':5,'References':5};
  function open(i){shs.forEach(function(s,j){s.classList.toggle('on',j===i)});sc.classList.add('on');shs[i].scrollTop=0;document.documentElement.style.overflow='hidden'}
  function close(){shs.forEach(function(s){s.classList.remove('on')});sc.classList.remove('on');document.documentElement.style.overflow=''}
  $$('.bento .t').forEach(function(t){var k=t.querySelector('small.k');if(!k)return;var i=name[k.textContent.trim()];if(i==null)return;t.dataset.sh=i;t.addEventListener('click',function(e){e.preventDefault();open(i)})});
  $$('.shh .x').forEach(function(x){x.addEventListener('click',close)});sc.addEventListener('click',close);addEventListener('keydown',function(e){if(e.key==='Escape')close()});
  shs.forEach(function(s){var y0=null;s.querySelector('.grab').parentElement.addEventListener('touchstart',function(e){if(s.scrollTop<=0)y0=e.touches[0].clientY},{passive:true});s.addEventListener('touchend',function(e){if(y0!=null&&e.changedTouches[0].clientY-y0>90)close();y0=null})});
  var SET=Math.max(0,shs.findIndex(function(s){return s.querySelector('.chips')}));var jm={'Index':-1,'Go/Wx':1,'Runways':2,'Radio':3,'Charts':5,'AIP':5,'People':4,'Field':4,'Settings':SET};
  $$('nav.jump a').forEach(function(a,_,all){a.addEventListener('click',function(){all.forEach(function(x){x.classList.toggle('on',x===a)});var i=jm[a.textContent.trim()];if(i<0){close();scrollTo({top:0,behavior:'smooth'})}else open(i)})});
  $$('[aria-label=Settings]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();open(SET)})});
 } else {
  $$('[aria-label=Settings]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();var c=$$('.card').filter(function(c){return /Settings sheet/.test(c.textContent)})[0];if(c)go(c);else toast('Settings live in the Pilot page')})});
 }
 $$('[aria-label="Refresh weather"]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();a.animate([{transform:'rotate(0)'},{transform:'rotate(360deg)'}],{duration:700});toast('Weather refreshed (example)')})});
 $$('a.bk,[aria-label=Back]').forEach(function(a){a.setAttribute('href','./')});
 $$('nav.nav a,nav.bnav a').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();toast('Preview: bottom bar is display only')})});
});
})();
