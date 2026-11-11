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
const FC=[{id:'cx3',name:'CX-3',src:'../flight-computer/cx3/?embed=1&v=11nov26p',purpose:'Electronic flight computer.'},{id:'e6b',name:'E6-B',src:'../flight-computer/e6b/?embed=1&v=11nov26p',purpose:'Slide-rule and wind-side trainer.'}];
const EXPAND_ICO='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4H4v5M15 4h5v5M4 15v5h5M20 15v5h-5"/></svg>';
function fcCard(f){return `<article class="mcc mcc-fc" id="mc-fc-${f.id}" data-fc="${f.id}" hidden>
<div class="mcc-hd"><span class="mcc-t"><b>${esc(f.name)}</b><small>${esc(f.purpose)}</small></span>
<button type="button" class="mcc-fx" data-fc-expand="${f.id}" aria-label="Open ${esc(f.name)} full page">${EXPAND_ICO}Expand</button></div>
<div class="mcc-bd"><iframe class="mcc-fc-frame" title="${esc(f.name)} flight computer" src="${esc(f.src)}" scrolling="no" loading="lazy"></iframe></div>
</article>`}


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
const TSD_U={
 du:{vals:['nm','km','sm'],lab:{nm:'NM',km:'km',sm:'sm'},aria:'Change distance unit',head:'Distance'},
 su:{vals:['kt','kmh','mph'],lab:{kt:'kt',kmh:'km/h',mph:'mph'},aria:'Change speed unit',head:'Ground speed'},
 tu:{vals:['hmm','min'],lab:{hmm:'(h:mm)',min:'min'},aria:'Change time unit',head:'Time'}
};
/* Tap-to-cycle units for every other calculator (MT 11 Nov 2026, same style as TSD). f: field -> [dim, base unit the maths
   expects, label with {u} where the tappable unit goes, optional suffix inside the unit word]. r: the big result's [dim, base].
   Calculators with no unit (sunrise, holding entry, compass heading) have no entry and stay as they were. */
const UF=(dim,b,l,x)=>[dim,b,l,x||''];
const perfU=land=>({f:{base:UF('len','m','Chart distance {u} (to/from 50 ft, at your weight)'),avail:UF('len','m',(land?'LDA':'TODA')+' {u}'),pa:UF('alt','ft','Pressure alt {u}'),oat:UF('temp','c','OAT {u}'),tw:UF('spd','kt','Tailwind {u}'),v:UF('spd','kt',(land?'Landing':'Lift-off')+' speed {u}')},r:['len','m']});
const SPEC={
 ta:{f:{ind:UF('alt','ft','Indicated alt {u}'),stn:UF('alt','ft','Station elev {u}'),qnh:UF('press','hpa','QNH {u}'),oat:UF('temp','c','OAT at alt {u}')},r:['alt','ft']},
 isa:{f:{h:UF('alt','ft','Pressure alt {u}')},r:['press','hpa']},
 alt:{f:{qnh:UF('press','hpa','QNH {u}'),elev:UF('alt','ft','Elevation {u}')},r:['press','hpa']},
 wt:{f:{tas:UF('spd','kt','TAS {u}'),ws:UF('spd','kt','Wind {u}')},r:['spd','kt']},
 xw:{f:{ws:UF('spd','kt','Wind {u}')},r:['spd','kt']},
 mw:{f:{xl:UF('spd','kt','Crosswind limit {u}'),tl:UF('spd','kt','Tailwind limit {u}')},r:['spd','kt']},
 fw:{f:{tas:UF('spd','kt','TAS {u}'),gs:UF('spd','kt','Ground speed {u}')},r:['spd','kt']},
 drift:{f:{ws:UF('spd','kt','Wind {u}'),tas:UF('spd','kt','TAS {u}')},r:null},
 tas:{f:{cas:UF('spd','kt','CAS {u}'),pa:UF('alt','ft','Pressure alt {u}'),oat:UF('temp','c','OAT {u}')},r:['spd','kt']},
 mach:{f:{tas:UF('spd','kt','TAS {u}'),oat:UF('temp','c','OAT {u}')},r:null},
 to:perfU(false),ld:perfU(true),
 roc:{f:{grad:UF('grad','ftnm','Gradient {u}'),gs:UF('spd','kt','Ground speed {u}')},r:['vs','fpm']},
 fuel:{f:{fob:UF('vol','l','Fuel on board {u}'),burn:UF('vol','l','Burn {u}','/h'),taxi:UF('vol','l','Taxi {u}')},r:['vol','l']},
 fwv:{f:{l:UF('vol','l','Volume {u}')},r:['mass','kg']},
 cgs:{f:{w:UF('mass','lb','Weight moved {u}'),d:UF('arm','in','Distance moved {u}'),tot:UF('mass','lb','Total weight {u}'),cg:UF('arm','in','CG {u}'),lemac:UF('arm','in','LEMAC {u}'),mac:UF('arm','in','MAC {u}')},r:['arm','in']},
 wb:{f:{w1:UF('mass','lb','Empty wt {u}'),a1:UF('arm','in','Empty arm {u}'),w2:UF('mass','lb','Front seats {u}'),a2:UF('arm','in','Front arm {u}'),w3:UF('mass','lb','Rear / baggage {u}'),a3:UF('arm','in','Rear arm {u}'),w4:UF('mass','lb','Fuel {u}'),a4:UF('arm','in','Fuel arm {u}')},r:['arm','in']},
 cb:{f:{t:UF('temp','c','Temp {u}'),td:UF('temp','c','Dewpoint {u}'),elev:UF('alt','ft','Elevation {u}')},r:['alt','ft']},
 tod:{f:{cr:UF('alt','ft','Cruise alt {u}'),tg:UF('alt','ft','Target alt {u}'),gs:UF('spd','kt','Ground speed {u}')},r:['dist','nm']},
 rl:{f:{},r:['dist','nm']},
 msa:{f:{obs:UF('alt','ft','Highest obstacle {u} AMSL'),m:UF('alt','ft','Margin {u}')},r:['alt','ft']},
 turn:{f:{tas:UF('spd','kt','TAS {u}')},r:null},
 glide:{f:{h:UF('alt','ft','Height above ground {u}'),tas:UF('spd','kt','Best-glide TAS {u}'),hw:UF('spd','kt','Headwind {u} (tail −)')},r:['dist','nm']}
};
/* every unit kind on a card -> its base unit, and the pilot's chosen unit per kind (saved per card as _u) */
const DIMS={},CU={};
Object.keys(SPEC).forEach(id=>{const sp=SPEC[id],d={};Object.values(sp.f).forEach(f=>{if(!(f[0] in d))d[f[0]]=f[1]});if(sp.r&&!(sp.r[0] in d))d[sp.r[0]]=sp.r[1];DIMS[id]=d;
 const saved=mem[id]&&mem[id]._u||{},c={};for(const k in d)c[k]=window.WC.uUnit(k,saved[k])?saved[k]:d[k];CU[id]=c});
const uBtn=(dim,unit,sfx,attr)=>`<button type="button" class="u-cyc" ${attr} aria-label="Change ${esc(dim==='temp'?'temperature':({alt:'altitude',len:'distance',dist:'distance',spd:'speed',vs:'vertical speed',press:'pressure',mass:'weight',vol:'fuel',arm:'arm',grad:'gradient'})[dim]||'')} unit"><span class="u-lab">${esc(window.WC.uLabel(dim,unit)+(sfx||''))}</span><i class="u-cue" aria-hidden="true">⇅</i></button>`;
/* unit converter: From is the unit word in the Value label, To is the unit word on the result. Tap to cycle each
   (never onto the other one). Tapping From re-reads the number you typed in the new unit; Swap still swaps both. */
const CV={cat:'alt',from:null,to:null};
const cvGroup=()=>window.WC.conversionGroups[CV.cat]||window.WC.conversionGroups.alt;
const cvReset=(keep)=>{const G=window.WC.conversionGroups,m=mem.conv||{};if(!keep)CV.cat=G[m.u]?m.u:'alt';const g=cvGroup(),has=id=>g.units.some(u=>u[0]===id);
 if(keep){CV.from=g.defaults[0];CV.to=g.defaults[1];return}CV.from=has(m.from)?m.from:g.defaults[0];CV.to=has(m.to)&&m.to!==CV.from?m.to:(g.defaults[1]===CV.from?g.defaults[0]:g.defaults[1])};
cvReset(false);
const cvLabel=id=>{const u=cvGroup().units.find(x=>x[0]===id);return u?u[1]:id};
const cvNext=(cur,skip)=>{const ids=cvGroup().units.map(u=>u[0]).filter(x=>x!==skip);const i=ids.indexOf(cur);return ids[(i<0?0:i+1)%ids.length]};
const cvBtn=k=>`<button type="button" class="u-cyc" data-cv="${k}" aria-label="Change ${k==='from'?'from':'to'} unit"><span class="u-lab">${esc(cvLabel(CV[k]))}</span><i class="u-cue" aria-hidden="true">⇅</i></button>`;
function fieldHTML(id,f){
 const k=f[0],lab=f[1],saved=mem[id]&&mem[id][k]!=null?String(mem[id][k]):String(f[2]);
 if(Array.isArray(f[3])){
  /* short option lists (≤ 3) become a sliding segmented control; longer ones stay a native select */
  if(f[3].length<=3)return `<div class="fld wide segf"><span>${esc(lab)}</span>${segHTML(k,f[3],saved,lab)}</div>`;
  return `<label class="fld"><span>${esc(lab)}</span><select data-k="${esc(k)}">${f[3].map(o=>`<option value="${esc(o[0])}"${o[0]===saved?' selected':''}>${esc(o[1])}</option>`).join('')}</select></label>`}
 const type=f[3]||'number';
 if(id==='tsd'&&(k==='d'||k==='s'||k==='t')){
  const uk=k==='d'?'du':k==='s'?'su':'tu',meta=TSD_U[uk];
  const uv=mem[id]&&meta.vals.includes(String(mem[id][uk]))?String(mem[id][uk]):meta.vals[0];
  return `<label class="fld"><span>${esc(meta.head)} <button type="button" class="u-cyc" data-k="${uk}" data-v="${esc(uv)}" aria-label="${esc(meta.aria)}"><span class="u-lab">${esc(meta.lab[uv])}</span><i class="u-cue" aria-hidden="true">⇅</i></button></span><input data-k="${esc(k)}" type="${type}"${type==='number'?' inputmode="decimal" step="any"':''} value="${esc(saved)}"></label>`}
 const uf=SPEC[id]&&SPEC[id].f[k];
 if(uf){const [dim,,tpl,sfx]=uf,cur=CU[id][dim],parts=tpl.split('{u}');
  return `<label class="fld"><span>${esc(parts[0])}${uBtn(dim,cur,sfx,`data-dim="${dim}"`)}${esc(parts[1]||'')}</span><input data-k="${esc(k)}" type="${type}"${type==='number'?' inputmode="decimal" step="any"':''} value="${esc(saved)}"></label>`}
 if(id==='conv'&&k==='v')return `<label class="fld"><span>${esc(lab)} ${cvBtn('from')}</span><input data-k="v" type="number" inputmode="decimal" step="any" value="${esc(saved)}"></label>`;
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
  <div class="mcf-it mcf-chips" role="group" aria-label="Calculator filters"><button type="button" class="mcf-c" data-g="most" aria-pressed="false">Most used<small>${MOST.filter(id=>idx[id]!=null).length}</small></button>${GROUPS.filter(g=>g[2].some(id=>idx[id]!=null)).map(g=>`<button type="button" class="mcf-c" data-g="${g[0]}" aria-pressed="false">${esc(g[1])}<small>${g[2].filter(id=>idx[id]!=null).length}</small></button>`).join('')}${FC.map(f=>`<button type="button" class="mcf-c" data-fc="${f.id}" aria-pressed="false">${esc(f.name)}<small>1</small></button>`).join('')}</div>
  <div class="mcf-it mcf-ft"><button type="button" class="mcf-rs">Reset all</button><button type="button" class="mcf-ap"></button></div>
 </div></div>
<div class="mc-body"><h2 class="more mc-chosen" hidden aria-live="polite" aria-atomic="true"></h2><div class="mc-grp">${ALL.map(cardHTML).join('')}</div>
 ${FC.map(fcCard).join('')}
 <p class="mc-empty" hidden>No calculator matches. Try another word or reset the filters.</p>
 <p class="mc-note" role="note"><b>Planning aid, not for flight.</b> Always use your POH, the current AIP and an official briefing.</p></div>`;

/* ---------- calculation (live as you type; an invalid field never shows a number) ---------- */
const TSD=['d','s','t'],tsdEdits={tsd:['d','s']};
const tsdFmt=x=>{if(!isFinite(x))return '';const r=Math.round(x*10)/10;return Math.abs(r-Math.round(r))<1e-9?String(Math.round(r)):r.toFixed(1)};
const tsdQty=(raw,name)=>{const s=String(raw==null?'':raw).trim().replace(/,/g,'');if(!s)return{error:'Enter two values.'};if(!/^[+-]?[0-9]*\.?[0-9]+$/.test(s))return{error:'Enter a number.'};const n=+s;if(!isFinite(n))return{error:'Enter a number.'};if(!(n>0))return{error:name+' must be more than 0.'};return{v:n}};
const tsdNote=k=>{if(TSD.includes(k)){const a=(tsdEdits.tsd||['d','s']).filter(x=>x!==k).concat(k);tsdEdits.tsd=a.slice(-2)}};
const tsdOut=()=>TSD.find(k=>(tsdEdits.tsd||['d','s']).indexOf(k)<0)||'t';
const tsdLab=el=>{
 $$('.u-cyc',el).forEach(b=>{
  const meta=TSD_U[b.dataset.k];if(!meta)return;
  const v=meta.vals.includes(b.dataset.v)?b.dataset.v:meta.vals[0];
  b.dataset.v=v;
  const s=b.querySelector('.u-lab');if(s)s.textContent=meta.lab[v];
 });
};
const tsdOnUnit=(el,btn,v)=>{
 const C=window.WC,k=btn.dataset.k,prev=btn.dataset.prev||btn.dataset.v;
 const fk=k==='du'?'d':k==='su'?'s':k==='tu'?'t':null;
 const inp=fk&&el.querySelector(`[data-k="${fk}"]`);
 if(inp&&prev&&prev!==v){
  if(k==='du'||k==='su'){const n=parseFloat(String(inp.value).replace(/,/g,''));if(isFinite(n)){const o=k==='du'?C.convertDist(n,prev,v):C.convertSpd(n,prev,v);if(isFinite(o))inp.value=tsdFmt(o)}}
  else{const p=C.parseTime(inp.value,prev);if(!p.error)inp.value=C.formatTime(p.min,v)}
 }
 btn.dataset.v=v;btn.dataset.prev=v;tsdLab(el);
};
const tsdCompute=el=>{
 const C=window.WC,g=k=>{const x=el.querySelector(`[data-k="${k}"]`);if(!x)return '';if(x.classList.contains('mseg')||x.classList.contains('u-cyc'))return x.dataset.v;return x.value};
 const solve=tsdOut(),du=g('du')||'nm',su=g('su')||'kt',tu=g('tu')||'hmm';
 const need=TSD.filter(k=>k!==solve);
 const parsed={};
 for(const k of need){
  if(k==='t'){const p=C.parseTime(g('t'),tu);if(p.error)return{err:String(g('t')).trim()?p.error:'Enter two values.'};parsed.t=p.min}
  else{const p=tsdQty(g(k),k==='d'?'Distance':'Speed');if(p.error)return{err:p.error};parsed[k]=p.v}
 }
 const dNm=parsed.d!=null?C.distToNm(parsed.d,du):null,sKt=parsed.s!=null?C.spdToKt(parsed.s,su):null,tMin=parsed.t!=null?parsed.t:null;
 const r=C.tsdSolve(dNm,sKt,tMin,solve);if(r.error)return{err:r.error};
 const dDisp=C.nmToDist(r.d,du),sDisp=C.ktToSpd(r.s,su),tDisp=r.t;
 const uD=du==='km'?'km':du==='sm'?'sm':'NM',uS=su==='kmh'?'km/h':su==='mph'?'mph':'kt';
 const hm=C.hm(tDisp),tBig=hm.h+'h '+String(hm.m).padStart(2,'0');
 /* fill the result field only (never treat it as a new edit) */
 const write=(k,val)=>{const inp=el.querySelector(`[data-k="${k}"]`);if(inp&&inp.value!==val)inp.value=val};
 if(solve==='t')write('t',C.formatTime(tDisp,tu));
 else if(solve==='d')write('d',tsdFmt(dDisp));
 else write('s',tsdFmt(sDisp));
 $$('.fld',el).forEach(f=>f.classList.remove('is-res'));
 const out=el.querySelector(`[data-k="${solve}"]`);if(out){const fld=out.closest('.fld');if(fld)fld.classList.add('is-res')}
 const alt=C.tsdAlt(solve,r.d,r.s,r.t,du,su);
 const altTxt=solve==='t'?(+tDisp).toFixed(1)+' min':tsdFmt(alt.value)+' '+alt.unit;
 if(solve==='t')return{big:['Time',tBig,'min'],rows:[[alt.label,altTxt]]};
 if(solve==='d')return{big:['Distance',tsdFmt(dDisp),uD],rows:[[alt.label,altTxt]]};
 return{big:['Ground speed',tsdFmt(sDisp),uS],rows:[[alt.label,altTxt]]};
};
/* value of a unit field in its base unit; after a unit tap the exact base value is kept so ft -> m -> ft never drifts */
const baseOf=(id,x)=>{const uf=SPEC[id]&&SPEC[id].f[x.dataset.k];const raw=parseFloat(x.value);if(!uf)return raw;
 if(x.dataset.shown===x.value&&x.dataset.exact!=null&&x.dataset.exact!=='')return +x.dataset.exact;
 return window.WC.uConv(uf[0],raw,CU[id][uf[0]],uf[1])};
function unitTap(id,dim,next){
 const el=$('#mc-'+id),sp=SPEC[id],C=window.WC,cur=CU[id][dim];if(!sp||next===cur)return;
 Object.entries(sp.f).forEach(([k,f])=>{if(f[0]!==dim)return;const x=el.querySelector(`input[data-k="${k}"]`);if(!x)return;const b=baseOf(id,x);
  if(isFinite(b)){const shown=C.uFmtIn(C.uConv(dim,b,f[1],next),next);x.value=shown;x.dataset.exact=String(b);x.dataset.shown=shown}});
 CU[id][dim]=next;
 $$(`.fld .u-cyc[data-dim="${dim}"]`,el).forEach(b=>{const k=b.closest('.fld').querySelector('input').dataset.k,f=sp.f[k];b.querySelector('.u-lab').textContent=C.uLabel(dim,next)+(f&&f[3]||'')});
}
function compute(id){
 const el=$('#mc-'+id),d=D[idx[id]];
 const g=k=>{if(id==='conv'&&(k==='from'||k==='to'))return CV[k];const x=el.querySelector(`[data-k="${k}"]`);if(!x)return '';if(x.classList.contains('mseg')||x.classList.contains('u-cyc'))return x.dataset.v;if(x.tagName==='SELECT'||x.type!=='number')return x.value;return baseOf(id,x)};
 let r;
 try{
  if(id==='tsd'){$$('.fld',el).forEach(f=>f.classList.remove('is-res'));r=tsdCompute(el)}
  else r=$$('input[type=number]',el).some(x=>!isFinite(parseFloat(x.value)))?{err:'Enter a number in every field.'}:d[4](g)
 }catch(e){r={err:'Check the values.'}}
 if(!r||(!r.err&&!r.big))r={err:'Check the values.'};
 if(r.err&&id==='tsd')$$('.fld',el).forEach(f=>f.classList.remove('is-res'));
 let unitHTML=r.big&&r.big[2],pvUnit=r.big&&r.big[2];
 if(!r.err&&SPEC[id]){r=window.WC.unitize(r,SPEC[id],DIMS[id],CU[id]);if(r.unitDim&&window.WC.uParse(r.big[1])){pvUnit=r.big[2];unitHTML=uBtn(r.unitDim,r.unitCur,'',`data-dim="${r.unitDim}"`)+esc(r.unitSuffix||'')}else{pvUnit=unitHTML=r.big[2]}}
 if(!r.err&&id==='conv'){pvUnit=r.big[2];unitHTML=cvBtn('to')}
 $('.res',el).innerHTML=r.err?`<div class="err">${esc(r.err)}</div>`:`<div class="big"><small>${r.big[0]}</small><b>${r.big[1]}<em>${unitHTML}</em></b></div>`+(r.rows||[]).map(x=>`<div class="row"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
 $('.mcc-pv',el).textContent=r.err?'':(r.big[1]+(pvUnit?' '+pvUnit:''))}
function remember(id){const el=$('#mc-'+id),o={};$$('[data-k]',el).forEach(x=>{o[x.dataset.k]=x.classList.contains('mseg')||x.classList.contains('u-cyc')?x.dataset.v:x.value});if(id==='tsd')o._ed=(tsdEdits.tsd||['d','s']).slice();if(CU[id])o._u=Object.assign({},CU[id]);if(id==='conv'){o.from=CV.from;o.to=CV.to}mem[id]=o;save()}
/* Unit converter: category select stays; From / To are the tappable unit words. Saved categories (alt, dist, etc.) are kept;
   invalid stale saved units fall back to the category defaults. */
const cvLabels=card=>{$$('.u-cyc[data-cv]',card).forEach(b=>{b.querySelector('.u-lab').textContent=cvLabel(CV[b.dataset.cv])})};
$('#mc-conv [data-k="u"]').addEventListener('change',e=>{CV.cat=e.target.value;cvReset(true);cvLabels($('#mc-conv'))});
$('.mc-swap',root).addEventListener('click',()=>{
 const card=$('#mc-conv'),input=$('[data-k="v"]',card);
 const result=window.WC.convertUnits(CV.cat,parseFloat(input.value),CV.from,CV.to);
 if(!Number.isFinite(result)){compute('conv');return}
 const old=CV.from;CV.from=CV.to;CV.to=old;input.value=String(Number(result.toPrecision(10)));cvLabels(card);
 compute('conv');remember('conv');
});
root.addEventListener('mousedown',e=>{if(e.target.closest('.u-cyc[data-dim],.u-cyc[data-cv]'))e.preventDefault()});
root.addEventListener('click',e=>{
 const b=e.target.closest('.u-cyc[data-dim],.u-cyc[data-cv]');if(!b)return;const card=b.closest('.mcc');if(!card)return;e.preventDefault();const id=card.dataset.id;
 if(b.dataset.cv){const k=b.dataset.cv,o=k==='from'?'to':'from';CV[k]=cvNext(CV[k],CV[o]);cvLabels(card)}
 else unitTap(id,b.dataset.dim,window.WC.uNext(b.dataset.dim,CU[id][b.dataset.dim]));
 compute(id);remember(id)});
ALL.forEach(id=>{
 const el=$('#mc-'+id);
 $$('.mseg',el).forEach(s=>{const f=D[idx[id]][3].find(f=>f[0]===s.dataset.k);segSet(s,mem[id]&&mem[id][f[0]]!=null?String(mem[id][f[0]]):String(f[2]));s.dataset.prev=s.dataset.v;segWire(s,v=>{if(id==='tsd')tsdOnUnit(el,s,v);compute(id);remember(id)})});
 if(id==='tsd'){const o=mem.tsd||{};tsdEdits.tsd=Array.isArray(o._ed)&&o._ed.length===2?o._ed.slice():['d','s'];$$('.u-cyc',el).forEach(b=>{b.dataset.prev=b.dataset.v});tsdLab(el);
  el.addEventListener('mousedown',e=>{if(e.target.closest('.u-cyc'))e.preventDefault()});
  el.addEventListener('click',e=>{const b=e.target.closest('.u-cyc');if(!b)return;e.preventDefault();const C=window.WC;tsdOnUnit(el,b,C.nextUnit(b.dataset.k,b.dataset.v));compute(id);remember(id)})}
 el.addEventListener('input',e=>{if(id==='tsd'){const k=e.target&&e.target.dataset&&e.target.dataset.k;if(TSD.includes(k))tsdNote(k)}compute(id);remember(id)});
 el.addEventListener('change',e=>{if(id==='tsd'){const k=e.target&&e.target.dataset&&e.target.dataset.k;if(TSD.includes(k))tsdNote(k)}compute(id);remember(id)});
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
const F={q:'',groups:new Set(),fc:''};
const mcf=$('.mcf',root),sh=$('.mcf-sh',mcf),pn=$('.mcf-pn',mcf),fb=$('.mcf-fb',mcf),q=$('.mcf-sp input',mcf);
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const match=id=>{const d=D[idx[id]];
 if(F.groups.size){const hit=(F.groups.has('most')&&MOST.includes(id))||F.groups.has(groupOf[id]);if(!hit)return false}
 if(!F.q)return true;const hay=norm([d[1],PURPOSE[id],d[2],(GROUPS.find(g=>g[0]===groupOf[id])||[])[1]].join(' '));
 return norm(F.q).split(/\s+/).filter(Boolean).every(w=>hay.includes(w))};
function apply(animate){
 const before=animate&&!reduced()?snap(movers()):null;let n=0;
 const fcOn=FC.some(f=>f.id===F.fc)?F.fc:'';
 F.fc=fcOn;
 ALL.forEach(id=>{const el=$('#mc-'+id),on=!fcOn&&match(id);if(on)n++;
  el.hidden=!on;el.classList.remove('in')});
 FC.forEach(f=>{const el=$('#mc-fc-'+f.id);if(!el)return;const on=fcOn===f.id;if(on)n++;el.hidden=!on;el.classList.remove('in')});
 const chosen=$('.mc-chosen',root),names=fcOn?[FC.find(f=>f.id===fcOn).name]:[...F.groups].map(id=>id==='most'?'Most used':GROUPS.find(g=>g[0]===id)[1]);
 chosen.textContent=names.join(' · ');chosen.hidden=!names.length;
 $('.mc-empty',root).hidden=!!n;
 const k=F.groups.size+(fcOn?1:0);
 mcf.toggleAttribute('data-f',k>0);$('.mcf-bd',mcf).textContent=k||'';fb.setAttribute('aria-label',k?`Filters, ${k} on`:'Filters');
 $('.mc-sub',root).innerHTML=fcOn?`<b>1</b> flight computer`:`<b>${n}</b> of ${ALL.length} calculators${k?` · ${k} filter${k>1?'s':''}`:''}`;
 $('.mcf-ph small',mcf).textContent=fcOn?'1 flight computer':`${n} of ${ALL.length}`;
 $('.mcf-ap',mcf).textContent=fcOn?('Show '+FC.find(f=>f.id===fcOn).name):(n===1?'Show 1 calculator':`Show ${n} calculators`);
 $$('.mcf-c',mcf).forEach(c=>{const on=c.dataset.fc?(c.dataset.fc===fcOn):(!fcOn&&F.groups.has(c.dataset.g));c.classList.toggle('on',on);c.setAttribute('aria-pressed',on)});
 if(before)flip(before,OPEN_MS*.8,0);
 sizeFcFrames();
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
pn.addEventListener('click',e=>{const c=e.target.closest('.mcf-c');if(!c)return;if(c.dataset.fc){F.fc=F.fc===c.dataset.fc?'':c.dataset.fc;try{F.fc?sessionStorage.setItem('ga-fc-open',F.fc):sessionStorage.removeItem('ga-fc-open')}catch(err){}}else{const g=c.dataset.g;F.fc='';try{sessionStorage.removeItem('ga-fc-open')}catch(err){}F.groups.has(g)?F.groups.delete(g):F.groups.add(g)}apply(true)});
$('.mcf-rs',mcf).addEventListener('click',()=>{F.groups.clear();F.fc='';F.q='';q.value='';try{sessionStorage.removeItem('ga-fc-open')}catch(err){}apply(true)});
$('.mcf-ap',mcf).addEventListener('click',()=>{const first=$$('.mcc',root).find(e=>!e.hidden);if(first)first.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'start'})});
let qT=0;q.addEventListener('input',()=>{clearTimeout(qT);qT=setTimeout(()=>{F.q=q.value.trim();apply(false)},90)});
addEventListener('resize',()=>{sh.style.transition='none';geo(isOpen(),null)});
new ResizeObserver(()=>{if(isOpen()){sh.style.transition='none';geo(true,null)}}).observe(pn);
function readFc(){try{const s=sessionStorage.getItem('ga-fc-open');if(s==='cx3'||s==='e6b')return s}catch(e){}
 try{const loc=(window.top||window).location,u=new URL(loc.href);let q=u.searchParams.get('fc');if(!q){const m=(u.hash||'').match(/(?:[?&#]fc=)(cx3|e6b)/);if(m)q=m[1]}if(q==='cx3'||q==='e6b')return q}catch(e){}
 return ''}
F.fc=readFc();
function sizeFcFrames(){$$('.mcc-fc-frame',root).forEach(frame=>{const go=()=>{try{const d=frame.contentDocument;if(!d||!d.body)return;const h=Math.ceil(d.body.getBoundingClientRect().height);if(h>80)frame.style.height=h+'px'}catch(e){}};if(frame.dataset.sz)return;frame.dataset.sz='1';frame.addEventListener('load',go);try{go()}catch(e){}})}
root.addEventListener('click',e=>{const ex=e.target.closest('[data-fc-expand]');if(!ex)return;const id=ex.getAttribute('data-fc-expand');if(id!=='cx3'&&id!=='e6b')return;try{sessionStorage.setItem('ga-fc-open',id)}catch(err){}const href='/flight-computer/'+id+'/index.html?from=calculator';try{(window.top||window).location.href=href}catch(err){location.href=href}});
apply(false);setPanel(false,false);sizeFcFrames();
/* number steppers (option B capsule) — all .fld number inputs, plus TSD Time */
(function numSteps(){
 const CHEV_UP='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 7.5L6 4.5L9 7.5"/></svg>';
 const CHEV_DN='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5L6 7.5L9 4.5"/></svg>';
 const stepOf=inp=>{const raw=inp.getAttribute('step');if(!raw||raw==='any')return 1;const n=parseFloat(raw);return isFinite(n)&&n>0?n:1};
 const fire=inp=>{inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}))};
 const bump=(inp,dir)=>{let v=parseFloat(inp.value);if(!isFinite(v))v=0;v+=dir*stepOf(inp);const mn=parseFloat(inp.min),mx=parseFloat(inp.max);if(isFinite(mn))v=Math.max(mn,v);if(isFinite(mx))v=Math.min(mx,v);const dec=(String(stepOf(inp)).split('.')[1]||'').length;inp.value=dec?v.toFixed(Math.min(dec,4)):String(Math.round(v*1000)/1000);fire(inp)};
 const isTsdTime=inp=>inp&&inp.dataset.k==='t'&&inp.closest('#mc-tsd');
 const bumpTime=(inp,dir)=>{const card=inp.closest('#mc-tsd');const tu=(card&&card.querySelector('[data-k=tu]')&&card.querySelector('[data-k=tu]').dataset.v)||'hmm';inp.value=window.WC.stepTime(inp.value,tu,dir);fire(inp)};
 const enhance=inp=>{if(inp.dataset.wmStep)return;const fld=inp.closest('.fld');if(!fld)return;inp.dataset.wmStep='1';fld.classList.add('fld-num');const box=document.createElement('div');box.className='wm-step';box.setAttribute('aria-hidden','true');box.innerHTML=`<button type="button" class="wm-step-up" tabindex="-1" aria-label="Increase">${CHEV_UP}</button><button type="button" class="wm-step-dn" tabindex="-1" aria-label="Decrease">${CHEV_DN}</button>`;fld.appendChild(box)};
 const all=root=>{const r=root||document;r.querySelectorAll('.fld input[type=number]').forEach(enhance);r.querySelectorAll('#mc-tsd .fld input[data-k=t]').forEach(enhance)};
 document.addEventListener('click',e=>{const up=e.target.closest('.wm-step-up'),dn=e.target.closest('.wm-step-dn');if(!up&&!dn)return;e.preventDefault();const fld=(up||dn).closest('.fld');const inp=fld&&fld.querySelector('input');if(!inp)return;if(isTsdTime(inp))bumpTime(inp,up?1:-1);else if(inp.type==='number')bump(inp,up?1:-1)});
 all(document);
 window.__wmNumStep={enhance:all,bump,bumpTime};
})();
window.__mc={setPanel,F,apply,compute};
})();
