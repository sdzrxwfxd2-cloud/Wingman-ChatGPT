/* Wingman pull-to-search — separate, self-contained module.
   Switch off: set PULL_SEARCH=False in v2/fs/fs_inject.py and re-run it (this file is then not loaded at all),
   or flip the runtime flag below. Nothing else depends on this file.
   Aerodromes page: pull down at the top → aerodrome-only search (70 px threshold, stretch, armed glow, one-time hint).
   ATO / DFE pages: the same pull focuses that page's own search box. */
(function(){var PULL_SEARCH=false;if(!PULL_SEARCH||window.__wmPull)return;window.__wmPull=1;
const TH=70,RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
const LS={g:k=>{try{return localStorage.getItem(k)}catch(e){return null}},s:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
const css=`.fs-pull{position:fixed;left:0;right:0;top:calc(70px + env(safe-area-inset-top));z-index:45;display:flex;justify-content:center;pointer-events:none;--p:0;opacity:var(--p);transform:translateY(calc(var(--p) * 18px - 18px)) scale(calc(.85 + var(--p) * .15))}
.fs-pull span{display:flex;align-items:center;gap:8px;height:36px;padding:0 14px;border-radius:18px;font:600 13px 'Sora',sans-serif;color:var(--tx2)}
.fs-pull svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round}
.fs-pull.ready span{color:var(--tx);box-shadow:inset 0 1px 0 var(--hl),inset 0 0 0 1px color-mix(in srgb,var(--fsa,#6B78FF) 55%,transparent)}
html.fs-attop,html.fs-attop body{overscroll-behavior-y:contain}
body.fs-ease .fs-bar .fs-field{transition:transform .42s cubic-bezier(.2,.9,.25,1.15)!important}body.fs-ease .fs-pullmain{transition:transform .42s cubic-bezier(.2,.9,.25,1.15)!important}
.fs-bar.armed .fs-field::before{animation-duration:3s;opacity:1}.fs-bar.armed .fs-field{--gi:1!important}
.fs-tgt-armed{box-shadow:0 0 0 2px color-mix(in srgb,var(--acc) 55%,transparent),0 0 18px -4px var(--acc)!important;transition:box-shadow .2s}
@media(prefers-reduced-motion:reduce){.fs-pullmain{transform:none!important}.fs-bar .fs-field{transform:none!important}}`;
function start(){const W=window.WMFS;const tab=new URLSearchParams(location.search).get('tab');
 let kind=null,tgt=null;
 if(W&&W.page==='main'&&W.bar())kind='ad';
 else if(/^(ato|dfe)$/.test(tab||'')){kind='box';tgt=()=>document.getElementById(tab==='ato'?'q2':'q3')}
 if(!kind)return;
 document.head.append(Object.assign(document.createElement('style'),{id:'fspullcss',textContent:css}));
 const S='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
 const word=kind==='ad'?'aerodromes':tab==='ato'?'ATOs':'examiners';
 const pull=document.createElement('div');pull.className='fs-pull';pull.setAttribute('aria-hidden','true');pull.innerHTML='<span class="fs-gl">'+S+'<b>Pull to search '+word+'</b></span>';document.body.append(pull);
 const bar=kind==='ad'?W.bar():null,fld=bar&&bar.querySelector('.fs-field');
 const main=kind==='ad'?document.querySelector('main'):null;if(main)main.classList.add('fs-pullmain');
 const hintKey='fs-pullhint'+(kind==='ad'?'':'-'+tab),hintSeen=()=>LS.g(hintKey)==='1';
 const atTop=()=>document.documentElement.classList.toggle('fs-attop',scrollY<=0);atTop();addEventListener('scroll',atTop,{passive:true});
 const set=d=>{const p=Math.min(d/TH,1),arm=d>=TH;document.body.classList.toggle('fs-pulling',d>0);
  if(bar){bar.classList.toggle('armed',arm);if(!RM){main.style.transform=d?`translateY(${Math.min(d,140)*.5}px)`:'';fld.style.transform=d?`scale(${(1+Math.min(d,140)*.0004).toFixed(4)})`:''}fld.style.setProperty('--gi',d?(.3+p*.7).toFixed(2):'')}
  else{const b=tgt();if(b)b.classList.toggle('fs-tgt-armed',arm)}
  pull.style.setProperty('--p',hintSeen()?0:p);pull.classList.toggle('ready',arm);pull.querySelector('b').textContent=(arm?'Release':'Pull')+' to search '+word};
 const release=d=>{document.body.classList.add('fs-ease');set(0);setTimeout(()=>document.body.classList.remove('fs-ease'),420);
  if(d>=TH){LS.s(hintKey,'1');if(kind==='ad')W.open('','ad');else{const b=tgt();if(b){b.scrollIntoView({block:'center',behavior:RM?'auto':'smooth'});b.focus({preventScroll:true});b.select&&b.select()}}}};
 let y0=null,dy=0;
 addEventListener('touchstart',e=>{y0=(scrollY<=0&&!(W&&W.isOpen())&&e.touches.length===1)?e.touches[0].clientY:null;dy=0},{passive:true});
 addEventListener('touchmove',e=>{if(y0==null)return;dy=Math.max(0,e.touches[0].clientY-y0);if(scrollY>0){dy=0;y0=null}set(dy)},{passive:true});
 addEventListener('touchend',()=>{if(y0!=null)release(dy);y0=null;dy=0});addEventListener('touchcancel',()=>{if(y0!=null)set(0);y0=null;dy=0});
 window.__fsPull={set,release,kind};}
if(window.WMFS)start();else document.addEventListener('wmfs:ready',start,{once:true});
})();
