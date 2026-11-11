/* Wingman general search (from demo_pill/search_ideas/final). Aerodromes · ATOs · DFEs · Library. Real site data only.
   Split (Claude split plan, MT t2265): this file is the always-loaded launcher (search bar, top-bar icon, Spotlight shell, quick and
   recent searches, keyboard, motion). The engine (fs-core.js) and the ATO/DFE data (fs-data-td.js) load on the first search intent,
   never at page load. fs-data.js keeps only the aerodrome list (also read by fv3.js and wst-ad.js). Nothing on screen changes. */
(function(){if(window.WMFS)return;
/* Search motion v2 (MT 6 Nov 2026), preview only: on with ?motion=2 (remembered on this device), off again with ?motion=1, or window.WM_MOTION_V2=true. Off = the old motion, unchanged. */
const MV2=(()=>{try{const q=location.search;if(/[?&]motion=2\b/.test(q))localStorage.setItem('wm-motion','2');else if(/[?&]motion=1\b/.test(q))localStorage.removeItem('wm-motion');return window.WM_MOTION_V2===true||localStorage.getItem('wm-motion')==='2'}catch(e){return window.WM_MOTION_V2===true}})();
if(MV2)document.documentElement.classList.add('wm-m2');
const ME=(document.currentScript&&document.currentScript.src)||'';
const D=window.FS_D;if(!D)return;
const BASE=/\/ad\/[^/]*$/.test(location.pathname)?'../':'';
const touch=matchMedia('(hover:none)').matches;if(touch)document.documentElement.classList.add('fs-touch');
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
const LS={g:(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}},s:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
const I={bk:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 21V5M8 7h7"/></svg>',s:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',x:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',ar:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
tw:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21h6M10 21l1-12h2l1 12M7 9h10l-1-4H8z"/></svg>',gl:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
cl:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',hg:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20V11a9 7 0 0118 0v9M3 20h18M8 20v-6h8v6"/></svg>',ps:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>'};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const el=h=>{const d=document.createElement('div');d.innerHTML=h.trim();return d.firstElementChild};
const IDS=new Set(D.a.map(a=>a[0]));
/* lazy engine: fs-data-td.js (ATOs + DFEs) then fs-core.js, in order, once; retried on the next intent if it fails */
let CORE=null,loading=null,PEND=null;window.WMFSK={BASE,LS,I,esc,touch,rerender:()=>{}};
const js=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
const at=n=>{try{return new URL(n,ME||location.href).href}catch(e){return n}};
function load(){if(CORE)return Promise.resolve(CORE);if(loading)return loading;
 loading=Promise.all([D.t?0:js(at('fs-data-td.js?v=c5b58d531b')),window.WMFSCore?0:js(at('fs-core.js?v=46128b9443'))]).then(()=>{CORE=window.WMFSCore||null;if(!CORE)throw new Error('fs-core');if(PEND)CORE.setSt(PEND);return CORE}).catch(e=>{loading=null;throw e});return loading}
const warm=()=>{load().catch(()=>{})};
/* live status written by the Aerodromes page (same GO/CAUTION/NO-GO the cards show); the engine reads it when it loads */
function syncCards(){const cs=document.querySelectorAll('#list .card[data-s]');if(!cs.length)return;const s={};cs.forEach(c=>{const i=c.querySelector('.icao');const v={go:'g',caution:'c',nogo:'n'}[c.dataset.s]||'';if(i&&IDS.has(i.textContent.trim()))s[i.textContent.trim()]=v});LS.s('wm-fs-wx',JSON.stringify({t:Date.now(),s}));PEND=s;if(CORE)CORE.setSt(s)}
const field=(kbd,lbl)=>`<label class="fs-field fs-gl">${I.s}<input type="search" enterkeyhint="go" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="${lbl}">${kbd?`<span class="fs-kbd" aria-hidden="true">${kbd}</span>`:''}</label>`;
const W_ALL=['FACT','Night rating','Cape Town','an examiner','FAGG','an ATO'],W_AD=['FACT','Lanseria','Wonderboom','George','Rand','FAGG'];
function rotor(f,words,stat){const inp=f.querySelector('input');inp.placeholder='';let ph=f.querySelector('.fs-ph');if(!ph){ph=el('<span class="fs-ph" aria-hidden="true"></span>');f.append(ph)}
 clearInterval(f._t);inp.setAttribute('aria-label',stat);if(RM){ph.textContent=stat;return}
 let k=0;ph.innerHTML='Search <i>'+words[0]+'</i>';const it=ph.querySelector('i');
 f._t=setInterval(()=>{if(f._stop||document.hidden)return;it.classList.add('out');setTimeout(()=>{k=(k+1)%words.length;it.textContent=words[k];it.classList.remove('out');it.classList.add('pre');it.offsetWidth;it.classList.remove('pre')},380)},2500);
 if(!f._sync){f._sync=1;const sync=()=>f.classList.toggle('has',!!inp.value);inp.addEventListener('input',sync);inp.addEventListener('focus',()=>f._stop=1);inp.addEventListener('blur',()=>f._stop=0);f.addEventListener('pointerdown',()=>f._stop=1)}f.classList.toggle('has',!!inp.value)}
function init(){
 if(document.querySelector('.fs-spot'))return;
 syncCards();
 const pg=document.querySelector('#list')?'main':document.querySelector('#engr')?'ad':'app';
 /* main bar */
 let bar=null;const anchor=(pg==='main'&&(!window.WMSEARCH2||matchMedia('(min-width:768px)').matches))?document.querySelector('section.hello'):null;
 if(anchor){bar=el(`<div class="fs-bar">${field(touch?'':'⌘K','Search aerodromes, ATOs, examiners')}</div>`);anchor.after(bar)}else document.body.classList.add('fs-nobar');
 /* top-bar icon, beside settings */
 const set=document.getElementById('tb-theme')||document.querySelector('.wmtb .wmicb[aria-label=Settings]')||document.querySelector('.wmicb');
 let ib=null;if(set){ib=el(`<button type="button" class="${set.classList.contains('wmicb')?'wmicb fs-ib-app':'icb'} fs-ib" aria-label="Search Go Around" title="Search Go Around (⌘K)">${I.s}</button>`);set.parentNode.insertBefore(ib,set);if(ib.classList.contains('fs-ib-app')){const w=set.getBoundingClientRect().width;if(w)ib.style.setProperty('--fs-ibw',Math.round(w)+'px')}}
 if(bar){rotor(bar.querySelector('.fs-field'),W_ALL,'Search aerodromes, ATOs, examiners');
  const upd=()=>document.body.classList.toggle('fs-tuck',bar.getBoundingClientRect().top<64+4&&scrollY>120);addEventListener('scroll',upd,{passive:true});upd()}
 /* spotlight */
 const sp=el(`<div class="fs-spot" role="dialog" aria-modal="true" aria-label="Search" aria-hidden="true"><div class="fs-in">
  <div class="fs-head">${field(touch?'':'esc','Search')}<button type="button" class="fs-cancel">Cancel</button></div>
  <div class="fs-mode"></div><div class="fs-scroll" role="listbox" aria-label="Results"></div></div></div>`);document.body.append(sp);sp.inert=true;
 const inp=sp.querySelector('input'),out=sp.querySelector('.fs-scroll'),md=sp.querySelector('.fs-mode');let mode='all',hiI=0,lastFocus=null;
 let recQ=[];try{recQ=JSON.parse(LS.g('fs-recq','[]'))||[]}catch(e){recQ=[]}
 const saveQ=q=>{q=String(q).trim();if(q.length<2)return;recQ=[q,...recQ.filter(x=>x.toLowerCase()!==q.toLowerCase())].slice(0,5);LS.s('fs-recq',JSON.stringify(recQ))};
 const foot=()=>touch?'':`<div class="fs-foot"><span><span class="fs-kbd">↑</span><span class="fs-kbd">↓</span> move</span><span><span class="fs-kbd">↵</span> open</span><span><span class="fs-kbd">esc</span> close</span></div>`;
 const empty=()=>{const ad=mode==='ad';const rq=ad?recQ.filter(x=>!/rating|examiner|school|instructor|dfe|ato/i.test(x)):recQ;
   const qc=ad?['FACT','FAGG','FAOR','Cape Town','Lanseria']:['FACT','FAGG','FAOR','Night rating','Cape Town','ATOs'];
   let h=`<div class="fs-lbl fs-lbl-q">Quick searches</div><div class="fs-qc">${qc.map(c=>`<button type="button" class="fs-qchip fs-gl" data-q="${c}">${c}</button>`).join('')}</div>`;
   if(rq.length)h+=`<div class="fs-card fs-gl"><div class="fs-lbl">Recent searches<a role="button" tabindex="0" data-act="clear">Clear</a></div>${rq.map(x=>`<div class="fs-row fs-rq" role="option" data-q="${esc(x)}"><span class="fs-ico2">${I.cl}</span><span class="fs-nm"><b>${esc(x)}</b></span><button type="button" class="fs-rx" data-rx="${esc(x)}" aria-label="Remove ${esc(x)}">${I.x}</button></div>`).join('')}</div>`;
   /* Favourites: the site has no favourites feature yet, so the section stays hidden (no example data). */
   out.innerHTML=h+foot();mark()};
 const qcMap={'atos':'school','an ato':'school','flight schools':'school','an examiner':'examiner','a flight school':'school'};
 function render(){const q=inp.value.trim();let h='';if(q){const ff=sp.querySelector('.fs-field');ff.classList.remove('pulse');void ff.offsetWidth;ff.classList.add('pulse');clearTimeout(ff._p);ff._p=setTimeout(()=>ff.classList.remove('pulse'),950)}
  if(!q){empty();return}
  if(!CORE){load().then(()=>{if(sp.classList.contains('on')&&inp.value.trim())render()}).catch(()=>{});return}
  out.innerHTML=CORE.results(q,mode)+foot();mark()}
 window.WMFSK.rerender=render;
 const rows=()=>[...out.querySelectorAll('.fs-row[href]')];
 function mark(){const R=rows();R.forEach(r=>{r.classList.remove('hi');r.removeAttribute('aria-selected')});if(R.length&&inp.value){hiI=Math.min(hiI,R.length-1);R[hiI].classList.add('hi');R[hiI].setAttribute('aria-selected','true')}}
 const go=a=>{saveQ(inp.value);const h=a.getAttribute('href');if(a.dataset.ext){window.open(h,'_blank','noopener');close();return}let T=null;try{T=window.WMMERGE?window:(window.parent!==window&&window.parent.WMMERGE?window.parent:null)}catch(e){}if(T&&T.WMMERGE.openItem&&T.WMMERGE.openItem(new URL(h,location.href).href)){close();return}location.href=h};
 /* v2: blur is off and the fill is solid only while the sheet moves (fs-moving); it scales from the search icon. Ends on the panel's own transitionend, with a timeout as a safety net. */
 const fsIn=sp.querySelector('.fs-in');let mvT=0;
 const moving=from=>{if(!MV2||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(from&&from.getBoundingClientRect){const r=from.getBoundingClientRect(),p=fsIn.getBoundingClientRect();if(r.width&&p.width)fsIn.style.transformOrigin=Math.round(Math.min(Math.max(r.left+r.width/2-p.left,0),p.width))+'px 0px'}
  sp.classList.add('fs-moving');clearTimeout(mvT);const done=e=>{if(e&&(e.target!==fsIn||e.propertyName!=='transform'))return;fsIn.removeEventListener('transitionend',done);clearTimeout(mvT);sp.classList.remove('fs-moving')};
  fsIn.addEventListener('transitionend',done);mvT=setTimeout(done,480)};
 function open(q,m){mode=m||'all';load().then(c=>c.lib(()=>{if(inp.value.trim())render()})).catch(()=>{});sp.classList.toggle('all',mode==='all');rotor(sp.querySelector('.fs-field'),mode==='all'?W_ALL:W_AD,mode==='all'?'Search aerodromes, ATOs, examiners':'Search aerodromes');
  md.innerHTML=mode==='all'?`<span>${I.gl}Everything</span><em>Aerodromes · ATOs · DFEs · Library</em>`:`<span>${I.tw}Aerodromes only</span><em>${D.a.length} SACAA aerodromes</em>`;
  lastFocus=document.activeElement;sp.inert=false;sp.removeAttribute('aria-hidden');moving(ib&&ib.offsetWidth?ib:null);sp.classList.add('on');inp.value=q||'';sp.querySelector('.fs-field').classList.toggle('has',!!inp.value);hiI=0;render();
  inp.focus({preventScroll:true});setTimeout(()=>inp.focus({preventScroll:true}),40);document.documentElement.style.overflow='hidden'}
 function close(){if(!sp.classList.contains('on'))return;moving(null);sp.classList.remove('on');inp.blur();sp.inert=true;sp.setAttribute('aria-hidden','true');document.documentElement.style.overflow='';if(lastFocus&&lastFocus.focus&&lastFocus!==document.body)try{lastFocus.focus({preventScroll:true})}catch(e){}}
 if(bar){const bl=bar.querySelector('label'),bi=bar.querySelector('input');bl.addEventListener('click',e=>{e.preventDefault();open('','all')});bi.addEventListener('focus',e=>{e.target.blur();open('','all')});bi.readOnly=true}
 if(ib)ib.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open('','all')});
 /* first intent loads the engine (pointer down, focus, hover), so results are ready by the first letter */
 for(const t of [bar&&bar.querySelector('label'),ib])if(t)['pointerdown','focusin','mouseenter'].forEach(ev=>t.addEventListener(ev,warm,{once:true,passive:true}));
 sp.querySelector('.fs-cancel').onclick=close;sp.addEventListener('click',e=>{if(e.target===sp||e.target===sp.firstElementChild)close()});
 inp.addEventListener('input',()=>{hiI=0;render()});
 out.addEventListener('click',e=>{const c=e.target.closest('[data-act=clear]');if(c){recQ=[];LS.s('fs-recq','[]');render();inp.focus({preventScroll:true});return}
  const rx=e.target.closest('[data-rx]');if(rx){e.preventDefault();e.stopPropagation();recQ=recQ.filter(x=>x!==rx.dataset.rx);LS.s('fs-recq',JSON.stringify(recQ));render();return}
  const qq=e.target.closest('[data-q]');if(qq){inp.value=qq.dataset.q;sp.querySelector('.fs-field').classList.add('has');hiI=0;render();inp.focus({preventScroll:true});return}
  const r=e.target.closest('.fs-row[href]');if(r){e.preventDefault();go(r)}});
 out.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-act],[role=button]')){e.preventDefault();e.target.click()}});
 addEventListener('keydown',e=>{const on=sp.classList.contains('on');const ae=document.activeElement,typing=ae&&(/INPUT|TEXTAREA|SELECT/.test(ae.tagName)||ae.isContentEditable);
  if(!on&&(((e.metaKey||e.ctrlKey)&&!e.altKey&&e.key&&e.key.toLowerCase()==='k')||(e.key==='/'&&!typing&&!e.metaKey&&!e.ctrlKey))){e.preventDefault();open('','all');return}
  if(!on)return;if(e.key==='Escape'){e.preventDefault();close();return}
  if(e.key==='Tab'){const f=[...sp.querySelectorAll('input,button,a[href],[tabindex="0"]')].filter(x=>x.getClientRects().length);if(f.length){const i=f.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&i===f.length-1){e.preventDefault();f[0].focus()}}return}
  const R=rows();if(!R.length)return;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();hiI=(hiI+(e.key==='ArrowDown'?1:-1)+R.length)%R.length;mark();R[hiI].scrollIntoView({block:'nearest'})}
  if(e.key==='Enter'&&document.activeElement===inp&&R[hiI]&&inp.value.trim()){e.preventDefault();go(R[hiI])}});
 if(window.visualViewport){const vv=visualViewport;const fit=()=>{if(!sp.classList.contains('on'))return;sp.style.height=vv.height+'px';sp.style.top=vv.offsetTop+'px'};vv.addEventListener('resize',fit);vv.addEventListener('scroll',fit)}
 addEventListener('pageshow',e=>{if(e.persisted)close()});
 window.WMFS={open,close,isOpen:()=>sp.classList.contains('on'),bar:()=>bar,spot:sp,page:pg,syncCards};
 document.dispatchEvent(new CustomEvent('wmfs:ready'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
/* keep weather dots in step with the cards when the Aerodromes page refreshes METARs */
addEventListener('load',()=>{const L=document.getElementById('list');if(!L||!window.WMFS)return;WMFS.syncCards();let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(WMFS.syncCards,300)}).observe(L,{subtree:true,attributes:true,attributeFilter:['data-s']})});
})();
