/* Wingman Calculator, Part 2: "More calculators" (30 Oct 2026).
 * Renders the calculator definitions from v3.js (window.__v3.D) as one continuous ATO-style grid:
 *   search pill + filter button in one shell (v18 soft look), an inline filter panel that grows the shell and
 *   pushes the list (v9 motion), and one expandable card per calculator.
 * All maths lives in calc.js (window.WC). Each definition in v3.js carries its formula and source, shown in the
 * shared "i" sheet; the key formulas are also listed in FORMULAS below for review.
 * Motion is compositor-only: the page below never animates layout. It jumps once and is slid back with a transform
 * (FLIP), so it stays smooth on slow phones, and the calculator iframe is resized once per open or close.
 * Planning aid, not for flight.
 */
(function(){
'use strict';
const V=window.__v3;if(!V||!document.getElementById('mc'))return;
const D=V.D,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const EZ='cubic-bezier(.32,.72,0,1)',OPEN_MS=500,CLOSE_MS=420,CLOSE_DELAY=60,STAGGER=22;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc=v=>String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');

/* Key formulas (reference only; the code is in calc.js):
 *  TAS        TAS = CAS / √σ, σ = (1 − 6.8756e-6·DA)^4.2559           ISA troposphere, ICAO Doc 7488
 *  Wind tri.  WCA = asin(Ws·sin(W − TC)/TAS); GS = TAS·cos WCA − Ws·cos(W − TC)   FAA PHAK ch.16
 *  Components HW = Ws·cos θ, XW = Ws·sin θ                              FAA PHAK ch.16
 *  TSD        t = d / s × 60                                            E6B
 *  Fuel       required = trip + reserve + taxi; endurance = FOB / burn  SACAA Part 91 reserve arithmetic
 *  TOD        dist = Δh / (6076.12·tan θ); ROD = GS × 101.269 × tan θ   3° path, PANS-OPS rule of thumb
 *  Cloud base (T − Td) / 2.5 × 1000 ft AGL                              FAA AC 00-6B
 *  True alt   4 % per 10 °C below ISA of height above station           ICAO Doc 8168 cold-temperature rule
 *  W&B        CG = Σ(W·arm) / ΣW                                        FAA-H-8083-1B
 *  TO / LDG   SSL 09 factors, × 1.33 take-off / × 1.43 landing          UK CAA Safety Sense Leaflet 09
 *  Turn       tan φ = ω·V/g; R = V²/(g·tan φ); rate-1 bank ≈ TAS/10 + 7 FAA-H-8083-15B ch.5
 *  Glide      still air NM = h × ratio / 6076.12; × GS/TAS over ground  FAA-H-8083-3C ch.18
 */

/* ---------- grouping and copy (order follows the research: most used first, then by how often pilots need them) ---------- */
const MOST=['fuel','tsd','wt','tas'];
const GROUPS=[
 ['perf','Performance',['to','ld','roc','turn','glide']],
 ['nav','Navigation',['wt','tsd','tod','cmp','rl','msa','hold']],
 ['wind','Wind',['xw','mw','fw','drift']],
 ['speed','Speed',['tas','mach']],
 ['load','Fuel & loading',['fuel','fwv','cgs','wb']],
 ['atmo','Atmosphere',['ta','isa','alt']],
 ['wx','Weather',['cb','sun']],
 ['units','Units',['conv']]];
const PURPOSE={
 fuel:'Trip, reserve and spare fuel, and endurance.',tsd:'Solve time, speed or distance.',wt:'Heading and ground speed for a track.',tas:'True airspeed from calibrated airspeed.',
 to:'Factored take-off distance against TODA.',ld:'Factored landing distance against LDA.',roc:'Rate of climb for a climb gradient.',turn:'Rate, radius and rate-1 bank for a level turn.',glide:'How far you can glide from a height.',
 tod:'Where to start down and how fast.',cmp:'True to magnetic to compass heading.',rl:'Course and distance between two points.',msa:'Minimum safe altitude over an obstacle.',hold:'Direct, teardrop or parallel entry.',
 xw:'Headwind and crosswind on a runway.',mw:'Paste a METAR, get the best runway.',fw:'Work out the wind from heading and track.',drift:'Largest drift for a wind and TAS.',
 mach:'Mach number from TAS and temperature.',fwv:'Litres to kilograms and pounds.',cgs:'CG shift and %MAC after moving weight.',wb:'Centre of gravity from weights and arms.',
 ta:'Cold-temperature altitude correction.',isa:'ISA temperature and pressure at a level.',alt:'QNH, QFE and the transition altitude.',
 cb:'Cloud base, freezing level and humidity.',sun:'Sunrise, sunset and civil twilight in SAST.',conv:'Distance, speed, pressure, temperature, mass and fuel — either way.'};
const idx={};D.forEach((d,i)=>idx[d[0]]=i);
const groupOf={};GROUPS.forEach(g=>g[2].forEach(id=>{if(idx[id]!=null)groupOf[id]=g[0]}));
/* sections in display order: Most used, then each group without the pinned four */
const SECTIONS=[['most','Most used',MOST]].concat(GROUPS.map(g=>[g[0],g[1],g[2].filter(id=>!MOST.includes(id))]))
 .map(s=>[s[0],s[1],s[2].filter(id=>idx[id]!=null)]).filter(s=>s[2].length);
const ALL=SECTIONS.flatMap(s=>s[2]);

/* ---------- remembered inputs (localStorage, per calculator) ---------- */
const KEY='wm-calc2';let mem={};try{mem=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){mem={}}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(mem))}catch(e){}};

/* ---------- master slide segmented control ---------- */
function segHTML(k,opts,val,label){
 return `<div class="mseg" role="radiogroup" aria-label="${esc(label)}" data-k="${esc(k)}" style="--n:${opts.length}"><i aria-hidden="true"></i>${opts.map(o=>
  `<button type="button" role="radio" data-v="${esc(o[0])}">${esc(o[1])}</button>`).join('')}</div>`}
function segSet(el,v){const bs=$$('button',el);let ix=bs.findIndex(b=>b.dataset.v===v);if(ix<0)ix=0;
 bs.forEach((b,j)=>{b.classList.toggle('on',j===ix);b.setAttribute('aria-checked',j===ix)});el.style.setProperty('--ix',ix);el.dataset.v=bs[ix].dataset.v}
function segWire(el,cb){
 const up=()=>el.classList.remove('press');
 el.addEventListener('pointerdown',e=>{if(e.target.closest('button'))el.classList.add('press')});
 ['pointerup','pointercancel','pointerleave'].forEach(t=>el.addEventListener(t,up));
 el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;segSet(el,b.dataset.v);cb&&cb(b.dataset.v)})}

/* ---------- markup ---------- */
const ICON={mag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
 filt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
 chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'};
function fieldHTML(id,f){
 const k=f[0],lab=f[1],saved=mem[id]&&mem[id][k]!=null?String(mem[id][k]):String(f[2]);
 if(Array.isArray(f[3])){
  /* short option lists (≤ 3) become a sliding segmented control; longer ones stay a native select */
  if(f[3].length<=3)return `<div class="fld wide segf"><span>${esc(lab)}</span>${segHTML(k,f[3],saved,lab)}</div>`;
  return `<label class="fld"><span>${esc(lab)}</span><select data-k="${esc(k)}">${f[3].map(o=>`<option value="${esc(o[0])}"${o[0]===saved?' selected':''}>${esc(o[1])}</option>`).join('')}</select></label>`}
 const type=f[3]||'number';
 return `<label class="fld"><span>${esc(lab)}</span><input data-k="${esc(k)}" type="${type}"${type==='number'?' inputmode="decimal" step="any"':''} value="${esc(saved)}"></label>`}
function cardHTML(id){
 const i=idx[id],d=D[i];
 return `<article class="mcc" id="mc-${id}" data-id="${id}" data-g="${groupOf[id]||''}"${MOST.includes(id)?' data-most':''}>
<div class="mcc-hd"><span class="mcc-t"><b>${esc(d[1])}</b><small>${esc(PURPOSE[id]||'')}</small><span class="mcc-pv" aria-hidden="true"></span></span></div>
<div class="mcc-bd" id="mcb-${id}" role="region" aria-label="${esc(d[1])}"><div class="flds">${d[3].map(f=>fieldHTML(id,f)).join('')}</div><div class="res" aria-live="polite"></div>${id==='conv'?'<button type="button" class="mcc-fx mc-swap" aria-label="Swap conversion units">⇄ Swap units</button>':''}<button type="button" class="mcc-fx" data-i="${i}"><i>i</i>Formula &amp; source</button></div></article>`}
const root=$('#mc');
root.innerHTML=`<header class="mc-head"><h2 class="more" id="mcTitle">More calculators</h2><p class="mc-sub" aria-live="polite"></p></header>
<div class="mcf"><div class="mcf-sh" aria-hidden="true"></div>
 <div class="mcf-row"><label class="mcf-sp">${ICON.mag}<input type="search" placeholder="Search calculators" aria-label="Search calculators" autocomplete="off" spellcheck="false"></label>
 <button type="button" class="mcf-fb" aria-expanded="false" aria-controls="mcfPanel" aria-label="Filters">${ICON.filt}<span class="mcf-bd" aria-hidden="true"></span></button></div>
 <div class="mcf-pn" id="mcfPanel" role="region" aria-label="Calculator filters">
  <div class="mcf-it mcf-ph"><span>Filters</span><small></small></div>
  <div class="mcf-it mcf-chips" role="group" aria-label="Calculator filters"><button type="button" class="mcf-c" data-g="most" aria-pressed="false">Most used<small>${MOST.filter(id=>idx[id]!=null).length}</small></button>${GROUPS.filter(g=>g[2].some(id=>idx[id]!=null)).map(g=>`<button type="button" class="mcf-c" data-g="${g[0]}" aria-pressed="false">${esc(g[1])}<small>${g[2].filter(id=>idx[id]!=null).length}</small></button>`).join('')}</div>
  <div class="mcf-it mcf-ft"><button type="button" class="mcf-rs">Reset all</button><button type="button" class="mcf-ap"></button></div>
 </div></div>
<div class="mc-body"><h2 class="more mc-chosen" hidden aria-live="polite" aria-atomic="true"></h2><div class="mc-grp">${ALL.map(cardHTML).join('')}</div>
 <p class="mc-empty" hidden>No calculator matches. Try another word or reset the filters.</p>
 <p class="mc-note" role="note"><b>Planning aid, not for flight.</b> Always use your POH, the current AIP and an official briefing.</p></div>`;

/* ---------- calculation (live as you type; an invalid field never shows a number) ---------- */
function compute(id){
 const el=$('#mc-'+id),d=D[idx[id]];
 const g=k=>{const x=el.querySelector(`[data-k="${k}"]`);if(x.classList.contains('mseg'))return x.dataset.v;return x.tagName==='SELECT'||x.type!=='number'?x.value:parseFloat(x.value)};
 let r;try{r=$$('input[type=number]',el).some(x=>!isFinite(parseFloat(x.value)))?{err:'Enter a number in every field.'}:d[4](g)}catch(e){r={err:'Check the values.'}}
 if(!r||(!r.err&&!r.big))r={err:'Check the values.'};
 $('.res',el).innerHTML=r.err?`<div class="err">${esc(r.err)}</div>`:`<div class="big"><small>${r.big[0]}</small><b>${r.big[1]}<em>${r.big[2]}</em></b></div>`+r.rows.map(x=>`<div class="row"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
 $('.mcc-pv',el).textContent=r.err?'':(r.big[1]+(r.big[2]?' '+r.big[2]:''))}
function remember(id){const el=$('#mc-'+id),o={};$$('[data-k]',el).forEach(x=>{o[x.dataset.k]=x.classList.contains('mseg')?x.dataset.v:x.value});mem[id]=o;save()}
/* Keep legacy saved categories (alt, dist, etc.) and defaults. Unit lists are
   rebuilt only when the category changes; invalid stale saved units fall back. */
function conversionFields(reset=false){
 const card=$('#mc-conv'),category=$('[data-k="u"]',card).value;
 const group=window.WC.conversionGroups[category];if(!group)return;
 ['from','to'].forEach((key,i)=>{
  const select=$(`[data-k="${key}"]`,card),saved=mem.conv&&mem.conv[key];
  const value=reset?group.defaults[i]:(saved||group.defaults[i]);
  select.innerHTML=group.units.map(u=>`<option value="${u[0]}">${esc(u[1])}</option>`).join('');
  select.value=group.units.some(u=>u[0]===value)?value:group.defaults[i];
 });
}
conversionFields();
$('#mc-conv [data-k="u"]').addEventListener('change',()=>conversionFields(true));
$('.mc-swap',root).addEventListener('click',()=>{
 const card=$('#mc-conv'),field=k=>$(`[data-k="${k}"]`,card),from=field('from'),to=field('to'),input=field('v');
 const result=window.WC.convertUnits(field('u').value,parseFloat(input.value),from.value,to.value);
 if(!Number.isFinite(result)){compute('conv');return}
 const old=from.value;from.value=to.value;to.value=old;input.value=String(result);
 compute('conv');remember('conv');
});
ALL.forEach(id=>{
 const el=$('#mc-'+id);
 $$('.mseg',el).forEach(s=>{const f=D[idx[id]][3].find(f=>f[0]===s.dataset.k);segSet(s,mem[id]&&mem[id][f[0]]!=null?String(mem[id][f[0]]):String(f[2]));segWire(s,()=>{compute(id);remember(id)})});
 el.addEventListener('input',()=>{compute(id);remember(id)});el.addEventListener('change',()=>{compute(id);remember(id)});
 compute(id)});

/* ---------- FLIP helper: everything after `ref` that moves is slid back from where it was ---------- */
const movers=()=>$$('.mcc,.mc-empty,.mc-note',root).concat($$('body > .foot'));
function snap(list){return new Map(list.filter(e=>e.offsetParent!==null).map(e=>[e,e.getBoundingClientRect()]))}
function flip(before,ms,delay){
 const moved=[];
 before.forEach((r0,e)=>{if(!e.isConnected||e.offsetParent===null)return;const r1=e.getBoundingClientRect(),dx=r0.left-r1.left,dy=r0.top-r1.top;
  if(Math.abs(dx)<.5&&Math.abs(dy)<.5)return;e.style.transition='none';e.style.transform=`translate(${dx}px,${dy}px)`;moved.push(e)});
 if(!moved.length)return;void root.offsetHeight;
 moved.forEach(e=>{e.style.transition=`transform ${ms}ms ${EZ} ${delay}ms`;e.style.transform=''});
 setTimeout(()=>moved.forEach(e=>{e.style.transition='';e.style.transform=''}),ms+delay+40)}
/* slide `list` by dy (px) and then call done (used for closing, where the space is removed at the end) */
function slideThen(list,dyOf,ms,delay,done){
 list.forEach(e=>{const dy=dyOf(e);if(!dy)return;e.style.transition=`transform ${ms}ms ${EZ} ${delay}ms`;e.style.transform=`translateY(${dy}px)`});
 setTimeout(()=>{list.forEach(e=>{e.style.transition='none';e.style.transform=''});done();void root.offsetHeight;list.forEach(e=>e.style.transition='')},ms+delay)}

/* ---------- cards: always open. Expand/collapse removed completely (31 Oct 2026). ---------- */
root.addEventListener('click',e=>{
 const fx=e.target.closest('.mcc-fx[data-i]');if(fx)V.openSheet(+fx.dataset.i)});

/* ---------- filter state ---------- */
const F={q:'',groups:new Set()};
const mcf=$('.mcf',root),sh=$('.mcf-sh',mcf),pn=$('.mcf-pn',mcf),fb=$('.mcf-fb',mcf),q=$('.mcf-sp input',mcf);
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const match=id=>{const d=D[idx[id]];
 if(F.groups.size){const hit=(F.groups.has('most')&&MOST.includes(id))||F.groups.has(groupOf[id]);if(!hit)return false}
 if(!F.q)return true;const hay=norm([d[1],PURPOSE[id],d[2],(GROUPS.find(g=>g[0]===groupOf[id])||[])[1]].join(' '));
 return norm(F.q).split(/\s+/).filter(Boolean).every(w=>hay.includes(w))};
function apply(animate){
 const before=animate&&!reduced()?snap(movers()):null;let n=0;
 ALL.forEach(id=>{const el=$('#mc-'+id),on=match(id);if(on)n++;
  el.hidden=!on;el.classList.remove('in')});
 const chosen=$('.mc-chosen',root),names=[...F.groups].map(id=>id==='most'?'Most used':GROUPS.find(g=>g[0]===id)[1]);
 chosen.textContent=names.join(' · ');chosen.hidden=!names.length;
 $('.mc-empty',root).hidden=!!n;
 const k=F.groups.size;
 mcf.toggleAttribute('data-f',k>0);$('.mcf-bd',mcf).textContent=k||'';fb.setAttribute('aria-label',k?`Filters, ${k} on`:'Filters');
 $('.mc-sub',root).innerHTML=`<b>${n}</b> of ${ALL.length} calculators${k?` · ${k} filter${k>1?'s':''}`:''}`;
 $('.mcf-ph small',mcf).textContent=`${n} of ${ALL.length}`;
 $('.mcf-ap',mcf).textContent=n===1?'Show 1 calculator':`Show ${n} calculators`;
 $$('.mcf-c',mcf).forEach(c=>{const on=F.groups.has(c.dataset.g);c.classList.toggle('on',on);c.setAttribute('aria-pressed',on)});
 if(before)flip(before,OPEN_MS*.8,0);
 regrow()}

/* ---------- v9 shell geometry: open = 7 px up, 9 px out, wraps the panel, radius 30; closed = the row, radius 22.
   The content below is pushed by the shell's bottom margin, which never animates: it jumps once and the list
   is slid with a transform in step with the shell (the same push() as the ATO filter). ---------- */
const isOpen=()=>mcf.dataset.s==='open';
let extra=0,pushT=0;
function push(next,ms,delay){
 const d=next-extra;clearTimeout(pushT);if(!d)return;
 const L=[$('.mc-body',root)].concat($$('body > .foot')),setM=v=>{extra=v;mcf.style.marginBottom=v?(14+v)+'px':''};
 if(ms==null){setM(next);L.forEach(e=>{e.style.transition='';e.style.transform=''});return}
 if(d>0){setM(next);L.forEach(e=>{e.style.transition='none';e.style.transform=`translateY(${-d}px)`});void root.offsetHeight;
  L.forEach(e=>{e.style.transition=`transform ${ms}ms ${EZ} ${delay}ms`;e.style.transform=''})}
 else{L.forEach(e=>{e.style.transition=`transform ${ms}ms ${EZ} ${delay}ms`;e.style.transform=`translateY(${d}px)`});
  pushT=setTimeout(()=>{L.forEach(e=>{e.style.transition='none';e.style.transform=''});setM(next);void root.offsetHeight;L.forEach(e=>e.style.transition='')},ms+delay)}}
function geo(o,anim){
 const s=sh.style,bh=$('.mcf-row',mcf).offsetHeight+8,ph=pn.offsetHeight,ms=anim==null||reduced()?null:(anim?OPEN_MS:CLOSE_MS),delay=anim===false?CLOSE_DELAY:0;
 s.transition=ms==null?'none':['top','left','right','height','border-radius'].map(p=>`${p} ${ms}ms ${EZ} ${delay}ms`).join(',');
 if(o){s.top='-7px';s.left='-9px';s.right='-9px';s.height=(bh+7+6+ph+6)+'px';s.borderRadius='30px'}
 else{s.top='0';s.left='0';s.right='0';s.height=bh+'px';s.borderRadius='22px'}
 push(o?6+ph+6:0,ms,delay)}
function regrow(){if(isOpen())geo(true,true)}
function setPanel(o,anim=true){
 o?mcf.dataset.s='open':delete mcf.dataset.s;fb.setAttribute('aria-expanded',o);
 $$('.mcf-it',pn).forEach((e,k)=>e.style.setProperty('--d',k*STAGGER+'ms'));
 geo(o,anim?o:null);if(!o&&pn.contains(document.activeElement))fb.focus({preventScroll:true})}

/* only the filter button opens and closes the panel; the rest of the page stays usable while it is open */
fb.addEventListener('click',()=>setPanel(!isOpen()));
pn.addEventListener('click',e=>{const c=e.target.closest('.mcf-c');if(!c)return;const g=c.dataset.g;F.groups.has(g)?F.groups.delete(g):F.groups.add(g);apply(true)});
$('.mcf-rs',mcf).addEventListener('click',()=>{F.groups.clear();F.q='';q.value='';apply(true)});
$('.mcf-ap',mcf).addEventListener('click',()=>{const first=$$('.mcc',root).find(e=>!e.hidden);if(first)first.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'start'})});
let qT=0;q.addEventListener('input',()=>{clearTimeout(qT);qT=setTimeout(()=>{F.q=q.value.trim();apply(false)},90)});
addEventListener('resize',()=>{sh.style.transition='none';geo(isOpen(),null)});
new ResizeObserver(()=>{if(isOpen()){sh.style.transition='none';geo(true,null)}}).observe(pn);
apply(false);setPanel(false,false);
/* number steppers (option B capsule) — all .fld number inputs on the page */
(function numSteps(){
 const CHEV_UP='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 7.5L6 4.5L9 7.5"/></svg>';
 const CHEV_DN='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5L6 7.5L9 4.5"/></svg>';
 const stepOf=inp=>{const raw=inp.getAttribute('step');if(!raw||raw==='any')return 1;const n=parseFloat(raw);return isFinite(n)&&n>0?n:1};
 const bump=(inp,dir)=>{let v=parseFloat(inp.value);if(!isFinite(v))v=0;v+=dir*stepOf(inp);const mn=parseFloat(inp.min),mx=parseFloat(inp.max);if(isFinite(mn))v=Math.max(mn,v);if(isFinite(mx))v=Math.min(mx,v);const dec=(String(stepOf(inp)).split('.')[1]||'').length;inp.value=dec?v.toFixed(Math.min(dec,4)):String(Math.round(v*1000)/1000);inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}))};
 const enhance=inp=>{if(inp.dataset.wmStep)return;const fld=inp.closest('.fld');if(!fld)return;inp.dataset.wmStep='1';fld.classList.add('fld-num');const box=document.createElement('div');box.className='wm-step';box.setAttribute('aria-hidden','true');box.innerHTML=`<button type="button" class="wm-step-up" tabindex="-1" aria-label="Increase">${CHEV_UP}</button><button type="button" class="wm-step-dn" tabindex="-1" aria-label="Decrease">${CHEV_DN}</button>`;fld.appendChild(box)};
 const all=root=>{(root||document).querySelectorAll('.fld input[type=number]').forEach(enhance)};
 document.addEventListener('click',e=>{const up=e.target.closest('.wm-step-up'),dn=e.target.closest('.wm-step-dn');if(!up&&!dn)return;e.preventDefault();const fld=(up||dn).closest('.fld');const inp=fld&&fld.querySelector('input[type=number]');if(inp)bump(inp,up?1:-1)});
 all(document);
 window.__wmNumStep={enhance:all,bump};
})();
window.__mc={setPanel,F,apply,compute};
})();
