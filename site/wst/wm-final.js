/* wm-final.js — single authoritative WMCore pass over every card (main + Status). Guidance only — the pilot in command decides. */
(function(){var K=window.WMCore,B=window.WMB;if(!K||!B)return;
/* #21 perf marks (instrumentation only, no behaviour change). User Timing entries, read with
   performance.getEntriesByName('wm:applyS') etc. or tools/perf21_trace.mjs:
   wm:final-pass  one WMCore pass over every card (runs twice per applyS)
   wm:applyS      the whole applyS chain, both passes included
   wm:tap         filter tap -> next frame painted (event time to after the next rAF) */
var PF=window.performance&&performance.mark&&performance.measure?performance:null;
function timed(name,fn,self,args){if(!PF)return fn.apply(self,args);var s=name+':start';PF.mark(s);try{return fn.apply(self,args)}finally{PF.measure(name,s)}}
var TAP='.wflt-b,.fv button,.wfr,#tiles .tile',tapBusy=false;
document.addEventListener('click',function(e){
 // Capture phase, passive: observes the tap and never alters it. One measure per tap, even when a tap is
 // forwarded as a second synthetic click (wm-pin mirror, fv3 proxy buttons).
 if(!PF||tapBusy||!e.target.closest||!e.target.closest(TAP))return;tapBusy=true;var t0=e.timeStamp;
 requestAnimationFrame(function(){setTimeout(function(){tapBusy=false;try{PF.measure('wm:tap',{start:t0,end:performance.now()})}catch(x){}},0)});
},{capture:true,passive:true});
var LB={go:'GO',caution:'CAUTION',nogo:'NO-GO',none:'INCOMPLETE'},SRC={metar:'METAR',taf:'TAF',model:'Model'};
var isI=function(c){return /^[A-Z]{4}$/.test(((c.querySelector('.icao')||{}).textContent||'').trim())};
var mode=function(){return localStorage.getItem('wm-count')==='all'?'all':'icao'};
function srcL(s){return SRC[(s||'').toLowerCase()]||s||''}
function hasOfficialWx(c){
  try{var d=c.dataset.wx?JSON.parse(c.dataset.wx):null;if(d&&(d.v!=null||d.c!=null||d.w!=null))return true}catch(e){}
  var m=c.querySelector('.cp[data-p=metar] .mono');
  return !!(m&&/^(METAR|SPECI)\b/.test((m.textContent||'').trim()));
}
function modelReady(c){
  if(c.dataset.wxm||c.dataset.model==='1')return true;
  try{if(localStorage.getItem('wm.mw.v2'))return true}catch(e){}
  return false;
}
function pass(){return timed('wm:final-pass',passRun,this,arguments)}
function passRun(){var now=Date.now(),n={go:0,caution:0,nogo:0},res=[],m=mode();
 document.querySelectorAll('.card').forEach(function(c){var r;try{r=B.evalCard(c,now)}catch(e){console.log('wmf',e);return}if(!r)return;
  var s=r.status;
  if(s==='none'&&!hasOfficialWx(c)&&!modelReady(c)){
    c.dataset.s='';c.__wm=null;
    var bb=c.querySelector('.badge');if(bb)bb.textContent='';
    var ww=c.querySelector('.why');if(ww)ww.textContent='';
    return;
  }
  c.dataset.src=srcL(r.source);c.__wm=r;
  /* Heliports: ad-class owns the steady HELIPORT pill (no flash). Skip our badge/why rewrite. */
  if(r.heliport){var inSh=!!c.closest('#wsp-cards');if(isI(c)&&(inSh||!document.getElementById('wsp-cards')))res.push(r);return}
  /* INCOMPLETE = no usable weather. data-s=incomplete keeps the same breathe/beam glow as DEPART/CAUTION/NO DEPART, but grey.
     data-s=none would kill the flash (legacy). Never a 4th top box; not counted in GO/CAUTION/NO-GO. */
  var ds=(s==='none')?'incomplete':s;c.dataset.s=ds;
  var noneLab=s==='none'?(r.label||(r.v2&&(r.v2.label||'No weather'))||''):'';
  var b=c.querySelector('.badge');if(b){b.textContent=(s==='none'&&noneLab)?noneLab:(LB[s]||s);/* MT #352: never show source mtag beside status (Model only after QNH when sole source) */
   c.querySelectorAll('.mtag').forEach(function(t){t.remove()})}
  var w=c.querySelector('.why');if(!w){w=document.createElement('p');w.className='why';var ch=c.querySelector('.ch');if(ch)ch.after(w)}
  var tm=r.time?' · '+srcL(r.source)+' '+K.util.sast(r.time):'';
  var whyTxt=String(r.whyShort||r.why||'').replace(/\s*[·]\s*Model estimate only [\u2014\-]+ not an official weather report\.?/g,'').replace(/\s*[·]\s*older(?: copy, fetched [^·]+)?/gi,'').replace(/\s{2,}/g,' ').replace(/\s+([.;])/g,'$1').trim();
  w.innerHTML=s==='none'?(noneLab||'INCOMPLETE · no current weather'):'<b>'+LB[s]+'</b> · '+whyTxt+tm;
  var inS=!!c.closest('#wsp-cards');if((m==='all'||isI(c))&&n[s]!=null&&(inS||!document.getElementById('wsp-cards')))n[s]++;
  if(isI(c)&&(inS||!document.getElementById('wsp-cards')))res.push(r)});
 if(window.WM_COUNTS)n=WM_COUNTS();document.querySelectorAll('#tiles .tile').forEach(function(t){var e=t.querySelector('.n');if(e&&n[t.dataset.s]!=null)e.textContent=n[t.dataset.s]});
 window.__n=n;window.__wmSum=K.summarize(res);document.dispatchEvent(new CustomEvent('wm:pass',{detail:n}));return n}
window.WMF={pass:pass};
var st=document.createElement('style');st.textContent=".card .why{font-family:Satoshi,-apple-system,BlinkMacSystemFont,sans-serif;font-weight:500}.card .why b{font-weight:700;color:var(--tx2)}.card[data-s=incomplete]{--c:var(--tx3)}.card[data-s=incomplete] .badge{letter-spacing:.04em;color:var(--tx3)}.card[data-s=incomplete] .why{color:var(--tx3)}";document.head.appendChild(st);
var lock=false;function tiles(){if(lock||!window.__n)return;lock=true;document.querySelectorAll('#tiles .tile').forEach(function(t){var e=t.querySelector('.n'),v=(window.WM_COUNTS?WM_COUNTS():window.__n)[t.dataset.s];if(e&&v!=null&&e.textContent!=String(v))e.textContent=v});lock=false}
var T=document.getElementById('tiles');if(T)new MutationObserver(tiles).observe(T,{subtree:true,childList:true,characterData:true});
var A=window.applyS;
/* wmgo-one-pass (default OFF; localStorage wm-1pass=1 turns it on). On main.html the previous applyS is the one-line stub
   "return WMF.pass()", so pass -> stub(pass) -> pass ran the same WMCore pass three times. With the flag on, the stub's pass
   is the only pass. Any other previous applyS keeps the full pass / prev / pass sandwich (wm-final stays the last writer). */
var STUB=!!A&&/^function\s*\(\)\s*\{\s*return window\.WMF\s*\?\s*WMF\.pass\(\)\s*:\s*\{go:0,caution:0,nogo:0\}\s*\}$/.test(String(A));
/* Back to default OFF on 29 Oct per review: this is the GO/NO-GO engine, so it stays opt-in (wm-1pass=1) for a week of dogfooding.
   Without the flag the old 3-pass sandwich runs exactly as before. */
function one(){try{return localStorage.getItem('wm-1pass')==='1'}catch(e){return false}}   // default OFF (Claude v3 G): opt in with wm-1pass=1 while dogfooding
function applyRun(){var r;if(STUB&&one()){try{r=A.apply(this,arguments)}catch(e){console.log('wmf-prev',e);r=pass()}return r}
 pass();try{r=A&&A.apply(this,arguments)}catch(e){console.log('wmf-prev',e)}pass();return r}
window.__wmOnePass={stub:STUB,on:one};
window.applyS=function(){return timed('wm:applyS',applyRun,this,arguments)};
if(document.readyState!=='loading')setTimeout(window.applyS,0);else document.addEventListener('DOMContentLoaded',function(){window.applyS()});
})();
