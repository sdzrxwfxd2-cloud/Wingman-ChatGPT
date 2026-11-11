/* filter_v3 — aerodrome filter (main.html).
   UNLOCKED by owner MT on 30 Oct 2026 (authorized_by pt517u) to swap the view for the approved v18 design.
   Engine unchanged: hidden .wflt panel buttons + WMLIST chips (wst-list.js) do all the filtering.
   View = window.WMFUI.make from c/wst/wmf.js, the same bar as the ATO/DFE pages:
     v8b closed pill + filter button (dot only when a filter is on), v9 shell expanding round the pill; opens as a centred panel over the blurred page (MT 30 Oct), only the panel is interactive,
     v13 opt2 rows (top 5 + "All N ›"), every tap filters the list at once, Reset all restores everything. */
(function(){let n=0;function init(){
const box=document.querySelector('.wflt'),btn=document.querySelector('.wflt-b'),list=document.getElementById('list'),L=window.WMLIST,hint=document.getElementById('fhint');
if(!box||!btn||!list||!L||!L.toggle||!window.WMFUI){if(++n<50)setTimeout(init,100);return}
const st=document.createElement('style');st.id='fv3-css';
st.textContent='.wflt-wrap,.wfb,.wflt-b .wbdg{display:none!important}.wflt-b .fvb{position:absolute;top:-3px;right:-3px;min-width:17px;height:17px;padding:0 5px;border-radius:9px;background:var(--tx);color:var(--bg);font:700 10.5px/17px Satoshi,-apple-system,sans-serif;text-align:center;pointer-events:none}.wflt-b .fvb[hidden]{display:none}.wflt-row+.wmf,.wmf+.wflt-row{margin-top:0}.stfoot .wupd+.inote{margin:0 0 0 2px!important;align-self:center}';
document.head.append(st);
const P=s=>box.querySelector(s),inp0=box.querySelector('.wfq-f input');
const K={},add=(id,o)=>K[id]=o;
const def=k=>L.DEF.find(d=>d[0]===k);
/* chip kinds: c = WMLIST chip; b = proxy .wflt button */
['VFR','MVFR','IFR','LIFR','Night','Licensed','ILS','VOR','NDB','DME','GNSS','RNAV','RNP','Fuel','Customs','Tower','PPR'].forEach(k=>add(k,{c:k,lab:k}));
add('go',{b:'[data-ws="go"]',lab:'GO',dot:'var(--go)',s:'go'});add('caution',{b:'[data-ws="caution"]',lab:'CAUTION',dot:'var(--cau)',s:'caution'});add('nogo',{b:'[data-ws="nogo"]',lab:'NO-GO',dot:'var(--nogo)',s:'nogo'});
add('Controlled',{b:'[data-wt="Controlled"]',lab:'Controlled'});
/* MT t2265: Status also offers INCOMPLETE (no fresh METAR, no TAF valid now, no fresh model). It rides the engine as one dynamic
   WMLIST chip "__inc" (cards with data-s=incomplete). No 4th top box: top DEPART/CAUTION/NO DEPART numbers never change.
   Multi-pick: Status choices are combined with OR. */
const INC='__inc',INCS=c=>c.dataset.s==='incomplete'||c.dataset.s==='none';/* wm-final writes data-s=incomplete; before its first pass the card says none */if(L.DEF&&!L.DEF.some(d=>d[0]===INC)){L.DEF.push([INC,c=>INCS(c),'Incomplete']);L.DYN&&L.DYN.add(INC)}
add('incomplete',{c:INC,lab:'INCOMPLETE',dot:'var(--tx3)',s:'incomplete'});
add('nonicao',{b:'[data-f="nonicao"]',lab:'Hide non-ICAO',f:c=>ISO(c)});add('heli',{b:'[data-f="heli"]',lab:'Hide heliports',f:c=>c.dataset.cat!=='heliport'});
/* MT 31 Oct: Tower and Hide non-ICAO restored (were dropped in the v2 dedupe) */
/* Reorganised filter groups (MT t2006): Status · Type · Facilities.
   Aerodrome category renamed Type; old Controlled/Licensed/Hide options replaced by Major·Regional·Small·Military·Helipad·Near prohibited. */
const SEC=[['Status',['go','caution','nogo','incomplete','VFR','MVFR','IFR','LIFR','Night']],
 ['Facilities',['ILS','VOR','DME','GNSS','RNAV','RNP','Fuel','Customs','Tower','PPR']]];
const SORT=[['name','Name A–Z'],['wx','Best weather'],['near','Nearest'],['icao','ICAO']],PER=['10','20','50','all'];
const ISO=c=>/^[A-Z]{4}$/.test(((c.querySelector('.icao')||{}).textContent||'').trim());
const mode=()=>localStorage.getItem('wm-count')==='all'?'all':'icao';
const on=k=>{if(window.WMAeroMulti&&STAT.has(k))return LS.has(k);const o=K[k];if(o.c)return L.chips().includes(o.c);const b=P(o.b);return !!(b&&b.classList.contains('on'))};
const allC=()=>[...list.querySelectorAll('.card')];
const visC=()=>allC().filter(c=>!/\b(hide|wfh|wfq|wfl-off)\b/.test(c.className)&&(mode()==='all'||ISO(c)));
const base=()=>{const A=allC();return mode()==='all'?A.length:A.filter(ISO).length};
const curSort=()=>(SORT.find(x=>{const b=P('[data-sort="'+x[0]+'"]');return b&&b.classList.contains('on')})||SORT[0]);
const curPer=()=>window.WMpg?WMpg.per:'10';
function active(){return Object.keys(K).filter(k=>k!=='Controlled'&&on(k)).length+document.querySelectorAll('#a1stats .st.sel').length+LP.size+LC.size+LT.size+(inp0&&inp0.value.trim()?1:0)+(curSort()[0]!=='name'?1:0)}
const click=sel=>{const b=P(sel);b&&b.click()};
const later=()=>{setTimeout(draw,60);setTimeout(draw,300)};
const F=window.WMflt;let geoAsked=false,sortNote='';
/* Near me must run on the top window: the list lives in #wmF-aero, and iOS Safari
   often denies iframe geolocation immediately (no prompt) even with allow="geolocation"
   and Permissions-Policy geolocation=(self). window.top is same-origin and is allowed. */
function geoApi(){try{if(window.top&&window.top.navigator&&window.top.navigator.geolocation)return window.top.navigator.geolocation}catch(e){}return navigator.geolocation}
function geoNote(msg){sortNote=msg||'';draw()}
function geoFail(err){const c=err&&err.code;sortNote=c===1?'Location permission denied. Allow location in your browser settings, or search for a place.':c===3?'Location timed out. Try again, or search for a place.':'Location unavailable. Try again, or search for a place.';click('[data-sort="name"]');saveSort('name');draw();setTimeout(()=>{if(sortNote){sortNote='';draw()}},8000)}
function saveSort(k){try{localStorage.setItem('wm-fv3-sort',k)}catch(e){}}
const repage=()=>{stamp();setTimeout(()=>{L.apply(1);draw()},40)};
function requestGeo(ok,err,opts){try{if(window.top&&typeof window.top.wmGeo==='function')return window.top.wmGeo(ok,err,opts)}catch(e){}const g=geoApi();if(!g){err&&err({code:2,message:'Location not available on this device'});return}g.getCurrentPosition(ok,err,opts)}
function setSort(k,quiet){if(k!=='near'){click('[data-sort="'+k+'"]');saveSort(k);repage();return}
 const g=geoApi();
 if(!g||(geoAsked&&quiet)){geoFail();return}
 /* quiet = auto-restore from localStorage: never request geo without a user tap (iOS needs a gesture). */
 if(quiet){return}
 geoAsked=true;geoNote('Finding your location…');
 requestGeo(pp=>{try{if(window.WMflt)WMflt.pos=[pp.coords.latitude,pp.coords.longitude]}catch(e){}click('[data-sort="near"]');saveSort('near');geoNote('');let n=0;const w=()=>{if(curSort()[0]==='near'){repage();return}if(++n>80){geoFail();return}setTimeout(w,100)};w()},geoFail,{timeout:15000,maximumAge:6e4,enableHighAccuracy:false})}

const lab=k=>K[k].lab.replace(/^Hide /,'No ');
/* live count for a chip = cards it would leave (or the current total when it is on), exactly as the old panel showed */
/* MT t2182: Status options (GO/CAUTION/NO-GO, VFR/MVFR/IFR/LIFR/Night) follow the picks in the OTHER groups
   (Province, City, Type incl. the International/Controlled/Uncontrolled boxes, Facilities, search) and the Count mode,
   but ignore picks inside the Status group itself. Type options stay fixed (tcnt / ctcnt). */
const baseC=()=>allC().filter(c=>mode()==='all'||ISO(c));
const STAT=new Set(['go','caution','nogo','incomplete','VFR','MVFR','IFR','LIFR','Night']);
const STATC=new Set(['VFR','MVFR','IFR','LIFR','Night']);
const statBase=()=>{return baseC().filter(c=>!/\bwfq\b/.test(c.className)&&!(window.WM_HX&&WM_HX(c))&&locPass(c)&&typePass(c)&&
   L.chips().every(ch=>{if(ch===LOC||ch===TYPE||ch===STATUS||ch===INC||STATC.has(ch))return true;const d=def(ch);return !d||d[1](c)}))};
function cnt(k,V){const o=on(k),x=K[k];
 if(STAT.has(k)){const B=statBase();if(k==='incomplete')return B.filter(INCS).length;if(x.s)return B.filter(c=>c.dataset.s===x.s).length;if(x.c){const d=def(x.c);return d?B.filter(d[1]).length:0}}if(x.c){const d=def(x.c);return d?(o?V.length:V.filter(d[1]).length):0}
 /* (MT t2147 status rule now covered by STAT above) */if(x.f)return o?V.length:V.filter(x.f).length;return null}
let animT=0;const stamp=()=>{animT=performance.now()};
function tap(k){stamp();const x=K[k];if(STAT.has(k)){toggle(LS,k);syncGroups();save();return}if(x.c){L.toggle(x.c);save()}else if(k==='Controlled'){click(x.b)}else click(x.b)}
const summary=a=>!a.length?'Any':a[0]+(a.length>1?' +'+(a.length-1):'');
const groups=SEC.map(([name,keys])=>({id:name.toLowerCase(),label:name,top:keys.length>6?5:0,
  items:()=>{const V=visC();return keys.map(k=>[k,lab(k),cnt(k,V)])},on,tap,value:()=>summary(keys.filter(on).map(lab))}));
/* MT 31 Oct: Sort by / How many / Count rows restored exactly as before c7f45140 */
groups.push(
 {id:'sort',label:'Sort by',items:()=>SORT.map(([v,l])=>[v,l,null]),on:v=>curSort()[0]===v,tap:v=>setSort(v),value:()=>curSort()[1]},
 {id:'per',label:'Per page',items:()=>PER.map(v=>[v,v==='all'?'All':v,null]),on:v=>curPer()===v,tap:v=>click('[data-wp="'+v+'"]'),value:()=>curPer()==='all'?'All':curPer()},
 {id:'cnt',label:'Count',items:()=>[['icao','ICAO only',null],['all','All aerodromes',null]],on:v=>mode()===v,
  tap:v=>{click('[data-wc="'+v+'"]');setTimeout(()=>L.apply(1),30)},value:()=>mode()==='all'?'All':'ICAO'});

/* MT t1863: Province + City groups, copied from the ATO page (wmf9.js ato()): top 4 + "All N ›", counts, zero = dimmed,
   City narrows to the chosen provinces, picking a province drops cities outside it. Province comes from the card, city from
   fs/fs-data.js (FS_D.a: [icao,name,city,province,...]); aerodromes without a city still match by province.
   Filtering rides the engine as one dynamic WMLIST chip "__loc", so search, status, chips, paging and tiles all combine. */
const toggle=(s,v)=>s.has(v)?s.delete(v):s.add(v),byCount=m=>Object.keys(m).sort((a,b)=>m[b]-m[a]||a.localeCompare(b));
const LP=new Set(),LC=new Set(),LT=new Set(),LS=new Set(),LOC='__loc',TYPE='__type',STATUS='__status';
let CITY0=null;const CITY=()=>{if(CITY0)return CITY0;const a=window.FS_D&&FS_D.a;if(!a)return {};CITY0={};a.forEach(r=>{if(r[0]&&r[2])CITY0[r[0]]=String(r[2]).trim()});return CITY0};
const icOf=c=>((c.querySelector('.icao')||{}).textContent||'').trim();
const provOf=c=>{if(c._wp==null){const s=c.querySelectorAll('.sub span');c._wp=s.length?(s[s.length-1].textContent||'').trim():''}return c._wp};
const cityOf=c=>CITY()[icOf(c)]||'';
const locPass=(c,skip='')=>(skip.includes('p')||!LP.size||LP.has(provOf(c)))&&(skip.includes('c')||!LC.size||LC.has(provOf(c)+'|'+cityOf(c)));
if(L.DEF&&!L.DEF.some(d=>d[0]===LOC)){L.DEF.push([LOC,c=>locPass(c),'Province / City']);L.DYN&&L.DYN.add(LOC)}
const syncLoc=()=>{const want=LP.size+LC.size>0,has=L.chips().includes(LOC);if(want!==has)L.toggle(LOC);else L.apply(1)};
const baseV=()=>allC().filter(c=>!/\b(hide|wfh|wfq)\b/.test(c.className)&&(mode()==='all'||ISO(c))&&L.chips().every(k=>{if(k===LOC)return true;const d=def(k);return d&&d[1](c)}));
const lcnt=(skip,f)=>baseV().filter(c=>locPass(c,skip)&&f(c)).length;
const realP=v=>v&&!/^(Unknown|Other)$/.test(v);
groups.unshift(
 {id:'prov',label:'Province',top:4,search:true,on:v=>LP.has(v),
  items:()=>{const m={};allC().forEach(c=>{const p=provOf(c);if(realP(p))m[p]=0});const V=baseV();Object.keys(m).forEach(p=>m[p]=V.filter(c=>locPass(c,'pc')&&provOf(c)===p).length);return byCount(m).map(p=>[p,p,m[p]])},
  tap:v=>{stamp();toggle(LP,v);if(LP.size)[...LC].forEach(k=>{if(!LP.has(k.split('|')[0]))LC.delete(k)});syncLoc();save()},value:()=>summary([...LP])},
 {id:'city',label:'City',top:4,search:true,on:v=>LC.has(v),
  items:()=>{const m={};baseV().forEach(c=>{const ci=cityOf(c),p=provOf(c);if(ci&&(!LP.size||LP.has(p))&&locPass(c,'c')){const k=p+'|'+ci;m[k]=(m[k]||0)+1}});[...LC].forEach(k=>m[k]=m[k]||0);
   return byCount(m).map(k=>[k,k.split('|')[1],m[k]])},tap:v=>{stamp();toggle(LC,v);syncLoc();save()},value:()=>summary([...LC].map(k=>k.split('|')[1]))});

/* Type category (MT t2006): renamed from Aerodrome; options = Major·Regional·Small·Military·Helipad·Near prohibited.
   OR within selected types, AND with other filters. Card category chip stays in ad-types.js. */
const TLAB=Object.assign({},window.WM_AD_TYPE_LAB||{major:'International',regional:'Regional',small:'Airfield',military:'Military',helipad:'Helipad',nearpro:'Near prohibited'},{heliport:'Heliport',helipad:'Helipad'});
const TORD=(window.WM_AD_TYPE_ORDER||['regional','small','military','helipad','nearpro']).slice();
/* Rotary choices must survive older deployment-copy type orders, including orders missing both. */
if(!TORD.includes('helipad'))TORD.splice(TORD.includes('nearpro')?TORD.indexOf('nearpro'):TORD.length,0,'helipad');
if(!TORD.includes('heliport'))TORD.splice(TORD.indexOf('helipad'),0,'heliport');
const TDATA=window.WM_AD_TYPES||{};
const typeOf=c=>{const info=TDATA[icOf(c)];return info||null};
/* MT t2382: Heliport and Helipad are separate. Rotary class from AD_CLASS (ad-class.js): heliport -> Heliport, helistop -> Helipad.
   Applies whatever the WM_AD_TYPES type is, so near-prohibited heliports/helipads are counted too. */
const heliOf=c=>{const a=c.dataset.adc||(window.AD_CLASS||{})[icOf(c)];return a==='heliport'?'heliport':a==='helistop'?'helipad':null};
const typePass=(c,skip='')=>{
  const ct=CTY.filter(x=>ctOn(x[0])).map(x=>x[0]);
  if(skip.includes('t')||!LT.size&&!ct.length) return true;
  if(ct.some(v=>c.dataset.cat===v||v==='international'&&(c.dataset.adType==='major'||(typeOf(c)||{}).t==='major')))return true;
  const h=heliOf(c); if(h&&LT.has(h)) return true;
  const info=typeOf(c); if(!info) return false;
  if(info.t!=='helipad'&&LT.has(info.t)) return true;
  if(LT.has('nearpro')&&info.p) return true;
  return false;
};
if(L.DEF&&!L.DEF.some(d=>d[0]===TYPE)){L.DEF.push([TYPE,c=>typePass(c),'Aerodrome type']);L.DYN&&L.DYN.add(TYPE)}
const syncType=()=>{const want=LT.size>0||CTY.some(x=>ctOn(x[0])),has=L.chips().includes(TYPE);if(want!==has)L.toggle(TYPE);else L.apply(1)};
/* Type counts ignore ICAO-only so Helipad (ZA-*) stays visible; list still respects Count. */
const tcnt=k=>{
  /* MT t2163: every card of that type (ICAO-only ignored so Helipad ZA-* stays visible, as before); no other filter changes it */
  const V=allC();
  if(k==='nearpro') return V.filter(c=>{const i=typeOf(c);return i&&(i.t==='nearpro'||i.p)}).length;
  if(k==='heliport'||k==='helipad') return V.filter(c=>heliOf(c)===k).length;
  return V.filter(c=>{const i=typeOf(c);return i&&i.t===k}).length;
};
/* MT t2132 (+ steer): Type also offers International · Controlled · Uncontrolled. They are the same filter as the
   INTL / CTRL / UNCTRL boxes at the top of the page (one source of truth: the box's .sel), so tapping a box
   selects the option here and tapping the option selects the box. Multi-pick alongside the other Type choices. */
const CTY=[['international','International'],['controlled','Controlled'],['uncontrolled','Uncontrolled']];
const ctTile=v=>{const e=CTY.find(x=>x[0]===v);return e?document.querySelector('#a1stats .st[data-c="'+e[1]+'"]'):null};
const ctOn=v=>{const t=ctTile(v);return !!(t&&t.classList.contains('sel'))};
const ctSel=()=>CTY.filter(x=>ctOn(x[0])).map(x=>x[1]);
/* count = cards in that class that the other filters keep (status boxes hide with .hide, class boxes never stack with them) */
const ctcnt=v=>baseC().filter(c=>c.dataset.cat===v||(v==='international'&&(c.dataset.adType==='major'||(typeOf(c)||{}).t==='major'))).length;
{const i=groups.findIndex(g=>g.id==='status'); const at=i>=0?i+1:2;
 groups.splice(at,0,{id:'type',label:'Type',top:0,
  items:()=>CTY.map(([k,l])=>[k,l,ctcnt(k)]).concat(TORD.map(k=>[k,TLAB[k]||k,tcnt(k)])),
  on:v=>ctTile(v)?ctOn(v):LT.has(v),
  tap:v=>{stamp();const t=ctTile(v);if(t){t.click();later();return}toggle(LT,v);if((LT.has('helipad')||LT.has('heliport'))&&mode()==='icao')click('[data-wc="all"]');syncType();save()},
  value:()=>summary(ctSel().concat([...LT].map(k=>TLAB[k]||k)))});}

/* Multi-pick: one OR predicate per Status / Type group; WMLIST ANDs the groups.
   Tile highlights remain the source of truth for class picks and deep links. */
const statusPass=c=>!LS.size||[...LS].some(k=>{
 const x=K[k];if(k==='incomplete')return INCS(c);if(x.s)return c.dataset.s===x.s;
 const d=def(x.c);return !!(d&&d[1](c));
});
L.DEF.push([STATUS,statusPass,'Status']);L.DYN.add(STATUS);
function syncGroups(){
 document.querySelectorAll('#tiles .tile[data-s]').forEach(t=>t.classList.toggle('sel',LS.has(t.dataset.s)));
 document.querySelectorAll('#a1stats .st,#tiles .tile[data-s]').forEach(t=>t.setAttribute('aria-pressed',t.classList.contains('sel')));
 document.getElementById('tiles').classList.toggle('dim',LS.size>0);
 document.getElementById('a1stats').classList.toggle('dim',CTY.some(x=>ctOn(x[0])));
 const chips=L.chips().filter(k=>k!==STATUS&&k!==TYPE&&k!==INC&&!STATC.has(k));
 if(LS.size)chips.push(STATUS);if(LT.size||CTY.some(x=>ctOn(x[0])))chips.push(TYPE);
 list.querySelectorAll('.card.hide').forEach(c=>c.classList.remove('hide'));
 L.set(chips);later();
}
document.querySelectorAll('#tiles .tile[data-s]').forEach(t=>{
 if(t.classList.contains('sel'))LS.add(t.dataset.s);
 t.onclick=()=>{stamp();toggle(LS,t.dataset.s);syncGroups();save()};
});
document.querySelectorAll('#a1stats .st').forEach(t=>{
 if(t.dataset.c==='Airports')t.onclick=()=>{LS.clear();CTY.forEach(x=>ctTile(x[0]).classList.remove('sel'));syncGroups();save()};
 else if(CTY.some(x=>x[1]===t.dataset.c))t.onclick=()=>{stamp();t.classList.toggle('sel');syncGroups();save()};
});
window.WMAeroMulti=true;

/* search pill: our own input, mirrored into the engine's hidden .wfq-f input */
const inp=document.createElement('input');inp.type='search';inp.placeholder='Search aerodromes by name, province or ICAO';
['autocomplete','autocorrect','autocapitalize'].forEach(a=>inp.setAttribute(a,'off'));inp.spellcheck=false;inp.enterKeyHint='search';
function save(){try{localStorage.setItem('wm-fv3',JSON.stringify({chips:L.chips(),q:inp.value,lp:[...LP],lc:[...LC],lt:[...LT],ls:[...LS]}))}catch(e){}}
try{const s=JSON.parse(localStorage.getItem('wm-fv3')||'null');if(s){(s.lp||[]).forEach(v=>LP.add(v));(s.lc||[]).forEach(v=>LC.add(v));(s.lt||[]).forEach(v=>LT.add(v));(s.ls||[]).forEach(v=>{if(STAT.has(v))LS.add(v)});(s.chips||[]).forEach(v=>{if(STATC.has(v))LS.add(v);if(v===INC)LS.add('incomplete')});if(s.chips&&s.chips.length)L.set(s.chips);if(s.q&&inp0&&!inp0.value){inp0.value=s.q;inp0.dispatchEvent(new Event('input',{bubbles:true}))}inp.value=s.q||''}}catch(e){}
syncGroups();
const row=btn.closest('.wflt-row')||btn.parentNode;row.before(inp);
let tq;inp.addEventListener('input',()=>{clearTimeout(tq);tq=setTimeout(()=>{stamp();if(inp0){inp0.value=inp.value;inp0.dispatchEvent(new Event('input',{bubbles:true}))}save();later()},150)});

const ui=WMFUI.make({section:row.parentNode,input:inp,hints:['aerodromes','ICAO codes','provinces'],noun:['aerodrome','aerodromes'],open:'type',modal:false,
 groups,total:()=>visC().length,base,active,
 reset:()=>{stamp();LP.clear();LC.clear();LT.clear();LS.clear();document.querySelectorAll('#a1stats .st.sel,#tiles .tile.sel').forEach(t=>t.classList.remove('sel'));syncGroups();L.set([]);inp.value='';if(inp0){inp0.value='';inp0.dispatchEvent(new Event('input',{bubbles:true}))}click('[data-reset]');click('[data-wc="icao"]');setTimeout(()=>L.apply(1),30);try{localStorage.removeItem('wm-fv3')}catch(e){}},
 refresh:later});

/* v2 look (aerodrome only, wmf.js untouched so ATO/DFE do not change): no blue, colours copied from the status tiles per theme, solid grey Sort/How many/Count */
ui.root.classList.add('wmf-aero');
/* MT 30 Oct: filter icon dead-centre in its button, and a small chevron inside the open panel that collapses it */
(function(){const r=ui.root,fb=r.querySelector('.wmf-fb'),ph=r.querySelector('.ph');
 const c=document.createElement('style');c.id='fv-chev-css';c.textContent='.wmf.wmf-aero .wmf-fb{padding:0!important;display:grid!important;place-items:center!important;line-height:0}'+
 '.wmf.wmf-aero .wmf-fb svg{display:block;margin:0;transform:translateY(1px)}'+
 '.wmf.wmf-aero .ph{align-items:center}.wmf.wmf-aero .ph .fvr{display:flex;align-items:center;gap:6px}'+
 '.wmf.wmf-aero .fvc{flex:none;width:28px;height:28px;margin:-4px -4px -4px 0;padding:0;border:0;border-radius:14px;background:transparent;color:var(--mu);display:grid;place-items:center;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background-color .2s ease,color .2s ease}'+
 '.wmf.wmf-aero .fvc:hover{background:rgba(142,142,150,.16);color:var(--tx)}.wmf.wmf-aero .fvc svg{display:block;width:14px;height:14px;transform:rotate(180deg);transition:transform .3s cubic-bezier(.32,.72,0,1)}'+
 '.wmf.wmf-aero:not([data-s=open]) .fvc svg{transform:none}';document.head.append(c);
 if(!fb||!ph)return;const sm=ph.querySelector('small'),w=document.createElement('span');w.className='fvr';
 const b=document.createElement('button');b.type='button';b.className='fvc';b.setAttribute('aria-label','Collapse filters');b.setAttribute('aria-controls',fb.getAttribute('aria-controls')||'');
 b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
 if(sm){sm.before(w);w.append(sm)}else ph.append(w);w.append(b);
 b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fb.click()});})();
const v2=document.createElement('style');v2.id='fv-v2-css';v2.textContent=`
html .wmf.wmf-aero{--tint:transparent!important;--ac:var(--tx)!important;--gt:var(--tx)!important;--gr:rgba(142,142,150,.38)!important;--glow:rgba(142,142,150,.22)!important}
/* MT 31 Oct: tapped chips + "Show N" use the OLDEST filter's selected look (archive/aerodrome-filter-old .fv .ch.on / .fv .go):
   liquid-glass fill var(--gl2), top highlight, 1px ring, press-scale and soft .3s fade. GO/CAUTION/NO-GO chips add their own status colour on that same style. */
.wmf.wmf-aero .c{--cc:var(--tx3);transition:transform .25s var(--ease,cubic-bezier(.32,.72,0,1)),background-color .3s,background .3s,box-shadow .3s,color .3s,opacity .3s;-webkit-tap-highlight-color:transparent}
.wmf.wmf-aero .c:active{transform:scale(.94)}
/* MT 31 Oct (t1331): non-status chips use a segmented-control selected look: solid raised thumb, soft drop shadow, no ring, no blur */
.wmf.wmf-aero .c.on{text-shadow:none;background:rgba(255,255,255,.96);box-shadow:0 1px 2px rgba(0,0,0,.10),0 3px 8px -2px rgba(0,0,0,.14);color:var(--tx);font-weight:600}
html[data-theme=night] .wmf.wmf-aero .c.on:not([data-v=go],[data-v=caution],[data-v=nogo],[data-v=international],[data-v=controlled],[data-v=uncontrolled],[data-v=incomplete]){background:rgba(255,255,255,.16);box-shadow:inset 0 .5px 0 rgba(255,255,255,.18),0 1px 2px rgba(0,0,0,.35),0 3px 8px -2px rgba(0,0,0,.4)}
.wmf.wmf-aero .c.on small{color:var(--tx2)}
.wmf.wmf-aero .c.qm{transform:none}
.wmf.wmf-aero .c[data-v=go]{--cc:var(--go,#22C55E)}.wmf.wmf-aero .c[data-v=caution]{--cc:var(--cau,#FF8A00)}.wmf.wmf-aero .c[data-v=nogo]{--cc:var(--nogo,#F80F3B)}
/* MT t2227: International / Controlled / Uncontrolled Type chips use the INTL/CTRL/UNCTRL box dot colours */
.wmf.wmf-aero .c[data-v=international]{--cc:#D4A017}.wmf.wmf-aero .c[data-v=controlled]{--cc:#0A84FF}.wmf.wmf-aero .c[data-v=uncontrolled]{--cc:#E879F9}.wmf.wmf-aero .c[data-v=incomplete]{--cc:var(--tx3,#8E8E93)}
/* MT 31 Oct: GO / CAUTION / NO-GO keep status colour; VFR/MVFR/IFR/LIFR/Night stay neutral.
   MT t2227: International / Controlled / Uncontrolled get the SAME glass glow as status chips, in gold / blue / pink. Top boxes unchanged. */
.wmf.wmf-aero .c.on:is([data-v=go],[data-v=caution],[data-v=nogo],[data-v=international],[data-v=controlled],[data-v=uncontrolled],[data-v=incomplete]){
 background:linear-gradient(color-mix(in srgb,var(--cc) 20%,transparent),color-mix(in srgb,var(--cc) 20%,transparent)),var(--gl2);
 box-shadow:inset 0 1px 0 var(--hl),inset 0 0 0 1px var(--cc),0 0 16px -4px color-mix(in srgb,var(--cc) 55%,transparent);color:var(--tx)}
.wmf.wmf-aero .c.on:is([data-v=go],[data-v=caution],[data-v=nogo],[data-v=international],[data-v=controlled],[data-v=uncontrolled],[data-v=incomplete]) small{color:var(--cc)}
.wmf.wmf-aero .gv b{text-shadow:none}
.wmf.wmf-aero .gr[data-g=sort] .gv svg,.wmf.wmf-aero .gr[data-g=per] .gv svg,.wmf.wmf-aero .gr[data-g=cnt] .gv svg{color:var(--mu)}
.wmf.wmf-aero .ap2{background:var(--gl2);box-shadow:inset 0 1px 0 var(--hl),inset 0 0 0 1px var(--tx3),0 8px 24px -14px rgba(0,0,0,.35);color:var(--tx);-webkit-backdrop-filter:blur(18px) saturate(1.6);backdrop-filter:blur(18px) saturate(1.6);transition:transform .25s var(--ease,cubic-bezier(.32,.72,0,1)),background .3s,box-shadow .3s}
.wmf.wmf-aero .ap2:active{transform:scale(.97)}
`;document.head.append(v2);
/* ---------------------------------------------------------------------------------------------
   Aerodrome filter v5/v6: icon -> status-box morph (MT, 30 Oct 2026)
   Closed : main's single filter icon (.wflt-b), untouched, in its usual place.
   Open   : a "morph box" carrying the status box's own look (#tiles: background, border, radius,
            shadow, backdrop blur, read live from the theme) grows out of the icon's exact rect to the
            status box's left/right edges and to the height of the filter content. Its border and
            shadow stay visible the whole way. From ~55% of the grow the contents cascade in
            (v6): search bar, header + Status, Aerodrome (types), Facilities, then
            Sort by / How many / Count + buttons; each slides up 7 px and fades over 160 ms, 35 ms apart.
   Below  : a spacer reserves (box height - icon height) so the gap above (status box -> box) and
            below (box -> first card) equals the closed gaps exactly. Content below slides with a
            transform during the morph, so it never reflows per frame.
   Close  : contents fade out in reverse (~120 ms total) while the box shrinks back into the icon.
   Shared : wmf.js is not modified; ATO/DFE keep their own behaviour. Only .wmf-aero is restyled here.
   Motion : 360 ms grow (+ cascade, ~530 ms total open) / 360 ms close, iOS-like ease; prefers-reduced-motion = instant.
   --------------------------------------------------------------------------------------------- */
{
const R=ui.root,                                   // wmf panel root (shared component, aerodrome instance)
      pn=R.querySelector('.wmf-pn'),               // its options panel (absolutely positioned inside R)
      PUSH=true, /* MT 31 Oct: panel pushes the cards down again (old position), smoothly; false = Claude overlay */
      /* MT t1821: motion = filter kit (wmf9.js geo(): FLIP, OPEN_MS 500 / CLOSE_MS 420 / CLOSE_DELAY 60, EASE .32,.72,0,1) */ EASE='cubic-bezier(.32,.72,0,1)', T_OPEN=500, T_CLOSE=420, /* push: ease-in-out, cards start/stop gently */
      /* Content timing is copied below from the ATO filter. */
      SHRINK_DELAY=60,      // same close delay as wmf9.js
      PAD=10;                                       // inner padding of the box around the panel content
/* fix/ipad-smooth: iPad Safari reports a Mac UA ("Request Desktop Website"), so detect it by touch points, and give
   iPad/desktop widths (>=700px) the lighter motion path. Phones (<700px, not MacIntel) never enter it: iPhone unchanged.
   Rollback in one line: window.WM_IPAD_SMOOTH=0 (or set LITE=false below). */
/* one iPad rule for the whole app: the shell's html.wm-ipad flag (index.html, set before paint); same test if run standalone */
const IPADOS=(()=>{try{if(parent!==window&&parent.document.documentElement.classList.contains('wm-ipad'))return true}catch(e){}
 const u=navigator.userAgent;return /iPad/.test(u)||/Macintosh/.test(u)&&navigator.maxTouchPoints>1})();
const LITE=window.WM_IPAD_SMOOTH!==0&&(IPADOS||matchMedia('(min-width:700px)').matches);

/* DOM: spacer (in flow, right after the icon row) -> box (absolute) + panel (absolute) */
const spacer=document.createElement('div');spacer.className='fv5-sp';
const box=document.createElement('div');box.className='fv5-box';box.setAttribute('aria-hidden','true');
const glyph=btn.querySelector('svg')?btn.querySelector('svg').cloneNode(true):null;
if(glyph){glyph.classList.add('fv5-ic');box.append(glyph)}
row.after(spacer);spacer.append(box,R);

/* active-filter count badge on the closed icon */
const badge=document.createElement('span');badge.className='fvb';badge.hidden=true;btn.append(badge);

const css=document.createElement('style');css.id='fv5-css';css.textContent=`
/* The status slim observer and browser anchoring must not fight over scroll position. */
html:has(.fv5-sp){overflow-anchor:none}
.fv5-sp{position:relative;height:0;z-index:30;overflow-anchor:none}
.fv5-box{position:absolute;display:none;box-sizing:border-box;pointer-events:none;
 background:var(--g-bg);border:var(--g-bd);box-shadow:var(--g-sh),0 0 22px -4px var(--g-gl,transparent);border-radius:var(--g-r);
 -webkit-backdrop-filter:var(--g-bf);backdrop-filter:var(--g-bf)}
.fv5-box.on{display:block}
.fv5-box.fv5-mv{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}

.fv5-ic{position:absolute;width:20px;height:20px;left:50%;top:50%;margin:-10px 0 0 -10px;color:var(--tx3,currentColor)}
.wmf.wmf-aero{position:absolute!important;left:0;right:0;margin:0!important;max-width:none!important;padding:${PAD}px ${PAD}px 0!important;
 box-sizing:border-box;transition:none!important}
.wmf.wmf-aero .wmf-sh{display:none!important}
.wmf.wmf-aero:not(.fv5-show){display:none!important}
/* v7: on wide screens the box keeps the status box's full width, but the filter rows are capped and centred
   so "Weather ... Any" is not stretched across 1000+ px */
@media (min-width:1000px){/* backlog 5: search row fills the box like the closed bar; filter rows stay capped */.wmf.wmf-aero>.wmf-pn{max-width:760px;margin-left:auto!important;margin-right:auto!important}
 .wmf.wmf-aero>.wmf-pn{left:0!important;right:0!important}}`;
document.head.append(css);
{const s6=document.createElement('style');s6.id='fv6-css';s6.textContent=`
.fv5-box .fv5-ic{display:none}
.wmf.wmf-aero .it{transition:none!important}
.wmf.wmf-aero .chips{justify-content:center}
.wflt-row .fhint{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}`;document.head.append(s6)}

const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const isOpen=()=>R.dataset.s==='open';
let busy=false,slid=[];

/* copy the status box's glass onto the morph box (re-run on theme change) */
function glass(){const t=document.getElementById('tiles');if(!t)return;const c=getComputedStyle(t),s=box.style;
 s.setProperty('--g-bg',c.backgroundImage!=='none'?c.backgroundImage+','+c.backgroundColor:c.backgroundColor);
 s.setProperty('--g-bd',c.borderTopWidth+' '+c.borderTopStyle+' '+c.borderTopColor);
 s.setProperty('--g-sh',c.boxShadow);s.setProperty('--g-r',c.borderTopLeftRadius);
 s.setProperty('--g-gl','color-mix(in srgb,'+(getComputedStyle(document.documentElement).getPropertyValue('--acc').trim()||getComputedStyle(document.documentElement).getPropertyValue('--tx').trim()||'#888')+' 30%,transparent)');s.setProperty('--g-bf',c.backdropFilter||c.webkitBackdropFilter||'none')}

/* geometry, all relative to the spacer. closed = icon rect, open = status-box edges x content height */
const GR=()=>parseFloat(getComputedStyle(box).getPropertyValue('--g-r'))||28;
function rects(){const sp=spacer.getBoundingClientRect(),b=btn.getBoundingClientRect(),t=document.getElementById('tiles'),
 tr=t?t.getBoundingClientRect():sp,top=b.top-sp.top;
 const contentH=R.offsetHeight+6+pn.offsetHeight+PAD;           // search row + gap + panel + bottom padding
 const rw=row.getBoundingClientRect();
 return{shell:{left:0,top:rw.top-sp.top,width:sp.width,height:rw.height,r:GR()},closed:{left:b.left-sp.left,top,width:b.width,height:b.height,r:Math.min(b.width,b.height)/2},
        open:{left:0,top:rw.top-sp.top,width:sp.width,height:contentH,r:GR()},/* t1827: expanded box = original (full width, status radius, PAD 10); closed = it trimmed to the top row */
        grow:PUSH?contentH-rw.height:0}}
const frame=g=>({left:g.left+'px',top:g.top+'px',width:g.width+'px',height:g.height+'px',borderRadius:g.r+'px'});
const place=g=>Object.assign(box.style,frame(g));

/* everything after the spacer in the page (in flow), slid with transform during the morph */
function below(){const out=[];for(let n=spacer;n&&n!==document.body;n=n.parentElement)
 for(let s=n.nextElementSibling;s;s=s.nextElementSibling){const c=getComputedStyle(s),p=c.position;if(p!=='fixed'&&p!=='absolute'&&(!LITE||c.display!=='none'&&s.offsetHeight>0))out.push(s)}return out}
/* push path: layout is committed ONCE (spacer height) and everything below rides a single transform animation
   with the same duration/easing as the box, so nothing snaps; transform only, will-change only while moving */
function slide(from,to,ms,delay=0){if(!PUSH||!from&&!to){slid=[];return Promise.resolve()}slid=below();
 slid.forEach(e=>e.style.willChange='transform');
 return Promise.all(slid.map(e=>e.animate([{transform:'translateY('+from+'px)'},{transform:'translateY('+to+'px)'}],{duration:ms,delay,easing:EASE,fill:'both'}).finished.catch(()=>{})))}
function unslide(){slid.forEach(e=>{e.getAnimations().forEach(a=>a.cancel());e.style.willChange=''});slid=[]}
/* scroll lock: the scrolling page is the shell (frame is content-sized), so keep its scrollY across the height commit */
const scr=()=>{try{return parent!==window&&parent.scrollY!==undefined?parent:window}catch(e){return window}};
function lockScroll(fn){const w=scr(),y=w.scrollY;fn();if(w.scrollY!==y)w.scrollTo(0,y);requestAnimationFrame(()=>{if(Math.abs(w.scrollY-y)>.5&&y<=w.document.documentElement.scrollHeight-w.innerHeight)w.scrollTo(0,y)})}

let items=[];
/* Content motion = calculator .mcf-it (more.css): opacity .34s + translateY .44s, 140 ms + i*22 ms; out .18s/.22s ease; no blur (MT t390u). */
function reveal(){items=[];
 [...pn.querySelectorAll('.it')].forEach((e,i)=>{
  const delay=140+i*22;
  items.push(e.animate([{opacity:0},{opacity:1}],{duration:340,delay,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'}));
  items.push(e.animate([{transform:'translateY(-6px)'},{transform:'none'}],{duration:440,delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'}));
 });return Promise.all(items.map(a=>a.finished.catch(()=>{})))}
function hide(){items.forEach(a=>a.cancel());items=[];
 [...pn.querySelectorAll('.it')].forEach(e=>{
  items.push(e.animate([{opacity:1},{opacity:0}],{duration:180,easing:'ease',fill:'forwards'}));
  items.push(e.animate([{transform:'none'},{transform:'translateY(-6px)'}],{duration:220,easing:'ease',fill:'forwards'}));
 })}
const clearItems=()=>{items.forEach(a=>a.cancel());items=[]};

function syncBtn(){const o=isOpen(),a=active();btn.setAttribute('aria-expanded',o);badge.hidden=!a;badge.textContent=a}

const origin=g=>{box.style.transformOrigin=(g.closed.left+g.closed.width/2-g.open.left)+'px '+(g.closed.top+g.closed.height/2-g.open.top)+'px'};
const S0='scale(.12)';
/* MT t1813/t1815: backing pill behind search + icon in BOTH states, ATO/DFE .wmf-sh behaviour:
   closed it hugs the row (radius 22), open it is the status box; FLIP translate+scale, radius counter-scaled */
/* Calculator geo() timing exactly: EZ .32,.72,0,1; OPEN 500 / CLOSE 420 + 60ms.
   Reveal its measured extent with a compositor clip instead of per-frame layout. */
function flip(a,b,ms,delay,fill){
 /* Measure once, then reveal a fixed-size glass surface. No layout/reflow per frame;
    the calculator's exact curve and timing still drive the reveal and card push. */
 const full=a.height>b.height?a:b;
 place(full);box.style.transformOrigin='';box.style.willChange='clip-path';
 const mask=g=>'inset(0px 0px '+Math.max(0,full.height-g.height)+'px 0px round '+g.r+'px)';
 return box.animate([{clipPath:mask(a)},{clipPath:mask(b)}],{duration:ms,delay,easing:EASE,fill})}
function rest(){if(isOpen()||busy)return;box.classList.add('on');place(rects().shell)}
const fadeBtn=(a,b,ms,delay)=>btn.animate([{opacity:a},{opacity:b}],{duration:ms,delay,easing:'linear',fill:'both'});

async function open(){if(busy||isOpen())return;busy=true;glass();
  clearItems();R.classList.add('fv5-show');ui.set(true);syncBtn();
  const g=rects();R.style.top=g.open.top+'px';
  box.classList.add('on');place(g.open);
  if(reduced()){lockScroll(()=>{spacer.style.height=g.grow+'px'});btn.style.visibility='hidden';busy=false;return}
  /* start the slide at -grow in the same frame the spacer grows, so the cards stay put on the first painted frame */
  const sl=slide(-g.grow,0,T_OPEN);lockScroll(()=>{spacer.style.height=g.grow+'px'});
  /* No live backdrop sampling while the measured surface is being revealed. */
  origin(g);box.classList.add('fv5-mv');
  row.classList.remove('fv-up');const morph=flip(g.shell,g.open,T_OPEN,0,'backwards');
  fadeBtn(1,0,120,0);
  await Promise.all([morph.finished.catch(()=>{}),sl,reveal()]);
  unslide();box.style.willChange='';box.classList.remove('fv5-mv');btn.style.visibility='hidden';btn.getAnimations().forEach(a=>a.cancel());
  clearItems();busy=false;if(LITE)settle()}

async function close(){if(busy||!isOpen())return;busy=true;
  const g=rects();
  const done=()=>{ui.set(false);syncBtn();clearItems();R.classList.remove('fv5-show');row.classList.add('fv-up');
   box.style.willChange='';box.classList.remove('fv5-mv');lockScroll(()=>{spacer.style.height='0px';unslide()});btn.getAnimations().forEach(a=>a.cancel());btn.style.visibility='';busy=false};
  if(reduced()){done();place(rects().shell);return}
  btn.style.visibility='';origin(g);box.classList.add('fv5-mv');
  hide();
  const morph=flip(g.open,g.shell,T_CLOSE,SHRINK_DELAY,'backwards');
  fadeBtn(0,1,120,SHRINK_DELAY+T_CLOSE*.6);
  await Promise.all([morph.finished.catch(()=>{}),slide(0,-g.grow,T_CLOSE,SHRINK_DELAY)]);
  done();morph.cancel();place(rects().shell)}

/* panel content changes height while open (group expanded, "All N", search) -> box and spacer follow */
new ResizeObserver(()=>{if(!isOpen()||busy)return;const g=rects();
 place(g.open);lockScroll(()=>{spacer.style.height=g.grow+'px'})}).observe(pn);

/* one tap handler for the icon, the panel's own filter button and "Show N" */
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('.wflt-b,.wmf-aero .wmf-fb,.wmf-aero .ap2');if(!t)return;
 e.stopImmediatePropagation();e.preventDefault();isOpen()?close():open()},true);
/* wmf.js closes itself on Escape: put the state back and run the normal close */
new MutationObserver(()=>{syncBtn();if(!isOpen()&&R.classList.contains('fv5-show')&&!busy){ui.set(true);close()}})
 .observe(R,{attributes:true,attributeFilter:['data-s','data-f']});
new MutationObserver(()=>requestAnimationFrame(()=>{glass();rest()})).observe(document.documentElement,{attributes:true,attributeFilter:['class','data-theme','data-pal']});
/* MT t1805 (fix/aero-filter-main-polish): old filter kept as is (layout + motion). Added only:
   (a) glass on the option chips, the same glass as the "Show N" pill / status bar (--gl2, top highlight, ring, blur), all themes;
   (b) counts on the chips, neat: tabular figures, small gap, muted;
   (c) chips with 0 aerodromes dimmed (GO / CAUTION / NO-GO and any other);
   (d) closed: only the search bar (plus its filter icon), nothing else. Tapping the bar opens the filter and focuses search. */
{const sb=document.createElement('label');sb.className='fv-sb';sb.setAttribute('role','button');sb.setAttribute('aria-label','Search aerodromes');
 sb.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg><input type="search" class="fv-si" placeholder="Search aerodromes" aria-label="Search aerodromes" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="search">';
 btn.before(sb);
 const ff=()=>{const h=R.querySelector('.wmf-hint');if(h){const c=getComputedStyle(h);sb.style.fontFamily=c.fontFamily;sb.style.letterSpacing=c.letterSpacing;sb.style.fontSize=c.fontSize}};ff();setTimeout(ff,600);
 /* MT t1817: closed search bar searches directly (no open); mirrors the filter's own input both ways; Reset all clears it */
 const si=sb.querySelector('.fv-si');si.value=inp.value;
 sb.addEventListener('click',e=>{e.stopPropagation();if(e.target!==si)si.focus()});
 /* MT t1841/t1842: one static placeholder; colours copied live from the expanded search row (hint text + icon) per theme */
 si.placeholder='Search aerodromes';
 {const cp=()=>{const sp=R.querySelector('.wmf-sp'),fx=R.querySelector('.wmf-hint .fx'),ic=sp&&sp.querySelector('svg');if(!fx)return;
   const c=getComputedStyle(fx),o=+c.opacity*(+getComputedStyle(fx.parentNode).opacity||1);sb.style.setProperty('--fv-ph',c.color);sb.style.setProperty('--fv-pho',String(o));
   if(ic){const k=getComputedStyle(ic);sb.style.setProperty('--fv-ic',k.color);sb.style.setProperty('--fv-ico',k.opacity)}sb.style.color=getComputedStyle(sp).color};
  cp();setTimeout(cp,600);setTimeout(cp,1800);new MutationObserver(()=>setTimeout(cp,60)).observe(document.documentElement,{attributes:true,attributeFilter:['class','data-theme']})}
 si.addEventListener('input',()=>{inp.value=si.value;inp.dispatchEvent(new Event('input',{bubbles:true}))});
 inp.addEventListener('input',()=>{if(si.value!==inp.value)si.value=inp.value});
 {const sy=()=>{if(si.value!==inp.value)si.value=inp.value;const sp=R.querySelector('.wmf-sp');if(sp)sp.classList.toggle('typed',!!inp.value)};inp.addEventListener('input',sy);new MutationObserver(sy).observe(R,{attributes:true,attributeFilter:['data-s','class']})}
 R.addEventListener('click',e=>{if(e.target.closest('.rq'))requestAnimationFrame(()=>{si.value='';inp.value=''})});
 new MutationObserver(()=>sb.classList.toggle('off',isOpen()||R.classList.contains('fv5-show'))).observe(R,{attributes:true,attributeFilter:['data-s','class']});
 const st=document.createElement('style');st.id='fv-polish-css';st.textContent=`
.wflt-row .fhint{display:none!important}
.wflt-row .fv-sb{flex:1;min-width:0;height:40px;display:flex;align-items:center;justify-content:center;gap:8px;padding:0 14px;border-radius:999px;cursor:text;
 background:var(--gl2);box-shadow:inset 0 1px 0 var(--hl),inset 0 0 0 1px var(--tx3),0 8px 24px -14px rgba(0,0,0,.35);color:var(--tx);
 -webkit-backdrop-filter:blur(18px) saturate(1.6);backdrop-filter:blur(18px) saturate(1.6);font-size:15px;letter-spacing:.02em;transition:opacity .16s ease-out;-webkit-tap-highlight-color:transparent}
.wflt-row .fv-sb svg{width:16px;height:16px;flex:none;opacity:.7}
.wflt-row .fv-sb .fv-si{flex:1;min-width:0;height:100%;border:0!important;outline:0;margin:0!important;padding:0!important;background:transparent!important;box-shadow:none!important;color:inherit;font:inherit;text-align:center;-webkit-appearance:none;appearance:none}.wflt-row .fv-sb .fv-si::placeholder{color:var(--tx);opacity:.5}.wflt-row .fv-sb .fv-si:focus{text-align:left}
.wflt-row .fv-sb.off{opacity:0;pointer-events:none}
.wflt-row .fv-sb:not(.off){transition:none}
.wmf.wmf-aero .chips .c:not(.on):not(.qm){background:var(--gl2);box-shadow:inset 0 1px 0 var(--hl),inset 0 0 0 1px var(--tx3),0 6px 18px -14px rgba(0,0,0,.35);
 -webkit-backdrop-filter:blur(18px) saturate(1.6);backdrop-filter:blur(18px) saturate(1.6)}
.wmf.wmf-aero .chips .c small{margin-left:6px;font-variant-numeric:tabular-nums;font-size:.82em;font-weight:500;color:var(--tx3);opacity:.9}
.wmf.wmf-aero .chips .c.fv-z{opacity:.38!important}
.wmf.wmf-aero .chips .c.fv-z small{color:var(--tx3)!important}`;document.head.append(st);
 const dim=()=>R.querySelectorAll('.chips .c').forEach(c=>{const n=c.querySelector('small');c.classList.toggle('fv-z',!!n&&n.textContent.trim()==='0'&&!c.classList.contains('on'))});
 dim();new MutationObserver(dim).observe(R,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});}
let rzq=0,rzMiss=false;
function settle(){if(!rzMiss)return;rzMiss=false;if(isOpen()&&!busy){const g=rects();place(g.open);lockScroll(()=>{spacer.style.height=g.grow+'px'})}}
addEventListener('resize',()=>{if(!LITE){if(isOpen()&&!busy){const g=rects();place(g.open);spacer.style.height=g.grow+'px'}return}
 if(busy){rzMiss=true;return}if(rzq)return;rzq=requestAnimationFrame(()=>{rzq=0;rzMiss=true;settle()})});

{const g7=document.createElement('style');g7.id='fv-showglass-css';g7.textContent=`
/* MT t1818: #277 Show pill glass (wmf9.js e7b25a01/b4c97af4 tokens, copied, values unchanged) on the backing pill and chips */
.fv5-box,.wmf.wmf-aero{--fa1:#FFFFFF;--fag:rgba(255,255,255,.08);--fal:rgba(255,255,255,.16);--fah:rgba(255,255,255,.14)}
html.dark.pal-purple .fv5-box,html.dark.pal-purple .wmf.wmf-aero{--fag:rgba(200,170,255,.08);--fal:rgba(214,196,255,.20);--fah:rgba(255,245,255,.14)}
html:not(.dark) .fv5-box,html:not(.dark) .wmf.wmf-aero{--fa1:#111114;--fag:rgba(255,255,255,.55);--fal:rgba(0,0,0,.08);--fah:rgba(255,255,255,.95)}
html.pal-beige:not(.dark) .fv5-box,html.pal-beige:not(.dark) .wmf.wmf-aero{--fa1:#1C1814;--fag:rgba(255,250,240,.55);--fal:rgba(60,45,20,.10);--fah:rgba(255,252,244,.95)}
.fv5-box{background:var(--fag)!important;border:0!important;-webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
 box-shadow:inset 0 1px 0 var(--fah),inset 0 0 0 1px var(--fal),0 0 22px -4px var(--g-gl,transparent)!important}
.wmf.wmf-aero .chips .c:not(.on):not(.qm){background:var(--fag)!important;-webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);box-shadow:inset 0 1px 0 var(--fah),inset 0 0 0 1px var(--fal)!important}`;document.head.append(g7)}

{const g8=document.createElement('style');g8.id='fv-t1831-css';g8.textContent=`
/* MT t1831: "Show N aerodromes" = the neat #277 pill (glass hugging the words, wmf9 .wmf-ap) */
html body .wmf.wmf-aero .ft2 .ap2{flex:none;display:inline-flex;align-items:center;justify-content:center;padding:13px 22px;color:var(--fa1);font-weight:600;
 background:var(--fag)!important;-webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);box-shadow:inset 0 1px 0 var(--fah),inset 0 0 0 1px var(--fal)!important}
/* selected chips: same #277 glass, ring a step stronger so on/off still reads; layout untouched */
html body .wmf.wmf-aero .chips .c.on:not([data-v=go]):not([data-v=caution]):not([data-v=nogo]):not([data-v=international]):not([data-v=controlled]):not([data-v=uncontrolled]):not([data-v=incomplete]){background:var(--fag)!important;color:var(--fa1);
 -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);box-shadow:inset 0 1px 0 var(--fah),inset 0 0 0 1.5px color-mix(in srgb,var(--fa1) 38%,transparent)!important}
/* MT t1832: aerodrome page only, room under the status box so its shadow no longer lies on the filter */
html body .wflt-row{margin-top:12px!important}
/* MT t1852: chips use EXACTLY the wmf9.js #277 "Show ATOs" pill glass (wmf9-show-pill); GO/CAUTION/NO-GO selected keep their 1730479 colouring */
html body .wmf.wmf-aero .chips .c:not(.on):not(.qm),html body .wmf.wmf-aero .chips .c.on:not([data-v=go]):not([data-v=caution]):not([data-v=nogo]):not([data-v=international]):not([data-v=controlled]):not([data-v=uncontrolled]):not([data-v=incomplete]){background:var(--gl2)!important;box-shadow:inset 0 1px 0 var(--hl,var(--hi)),inset 0 0 0 1px var(--tx3),0 8px 24px -14px rgba(0,0,0,.35)!important;-webkit-backdrop-filter:blur(18px) saturate(1.6)!important;backdrop-filter:blur(18px) saturate(1.6)!important}
html body .wmf.wmf-aero .chips .c.fv-z{opacity:.38!important}
/* Show pill = ATO/DFE #277 Show pill (wmf9-show-pill): 8px 14px, full radius, glass, 600 */
html body .wmf.wmf-aero .ft2 .ap2{flex:none!important;width:auto!important;min-width:0!important;margin-left:auto;padding:8px 14px!important;border-radius:999px!important;line-height:1.2!important;font-size:14.5px!important;font-weight:600!important;color:var(--tx)!important;
 background:var(--gl2)!important;box-shadow:inset 0 1px 0 var(--hl,var(--hi)),inset 0 0 0 1px var(--tx3),0 8px 24px -14px rgba(0,0,0,.35)!important;-webkit-backdrop-filter:blur(18px) saturate(1.6)!important;backdrop-filter:blur(18px) saturate(1.6)!important;transition:transform .25s cubic-bezier(.32,.72,0,1)}
html body .wmf.wmf-aero .ft2 .ap2:active{transform:scale(.97)}
html body .wmf.wmf-aero .ft2{display:flex!important;align-items:center!important;justify-content:space-between!important}
/* filter box background = the status bar glass (.tiles) in each theme */
html body .fv5-box{background:var(--gl)!important;-webkit-backdrop-filter:blur(28px) saturate(180%)!important;backdrop-filter:blur(28px) saturate(180%)!important;box-shadow:inset 0 1px 0 var(--hl),inset 0 0 0 .5px var(--ln),var(--sh)!important}
/* collapsed search hint: static, same colours as the expanded search row */
html body .wflt-row .fv-sb .fv-si::placeholder{color:var(--fv-ph,var(--tx))!important;opacity:var(--fv-pho,.5)!important}
html body .wflt-row .fv-sb svg{color:var(--fv-ic,currentColor);opacity:var(--fv-ico,.7)!important}
/* wm-glass.css strips nested backdrop-filter (6-id rule); 7-id rules restore it */
html:not(#_fv0):not(#_fv1):not(#_fv2):not(#_fv3):not(#_fv4):not(#_fv5):not(#_fv6) body .fv5-box:not(.fv5-mv){-webkit-backdrop-filter:blur(28px) saturate(180%)!important;backdrop-filter:blur(28px) saturate(180%)!important}
/* MT t1851/t1852: chips, Show pill, search pill (closed + expanded) and filter icon (both states) = the exact #277 Show ATOs glass */
html:not(#_fv0):not(#_fv1):not(#_fv2):not(#_fv3):not(#_fv4):not(#_fv5):not(#_fv6) body .wmf.wmf-aero .chips .c:not(.on):not(.qm),html:not(#_fv0):not(#_fv1):not(#_fv2):not(#_fv3):not(#_fv4):not(#_fv5):not(#_fv6) body .wmf.wmf-aero .chips .c.on:not([data-v=go]):not([data-v=caution]):not([data-v=nogo]):not([data-v=international]):not([data-v=controlled]):not([data-v=uncontrolled]):not([data-v=incomplete]),html:not(#_fv0):not(#_fv1):not(#_fv2):not(#_fv3):not(#_fv4):not(#_fv5):not(#_fv6) body .wmf.wmf-aero .ft2 .ap2,html:not(#_fv0):not(#_fv1):not(#_fv2):not(#_fv3):not(#_fv4):not(#_fv5):not(#_fv6) body .wflt-row .fv-sb,html:not(#_fv0):not(#_fv1):not(#_fv2):not(#_fv3):not(#_fv4):not(#_fv5):not(#_fv6) body .wflt-row .wflt-b,html:not(#_fv0):not(#_fv1):not(#_fv2):not(#_fv3):not(#_fv4):not(#_fv5):not(#_fv6) body .wflt-row .wflt-b.on,html:not(#_fv0):not(#_fv1):not(#_fv2):not(#_fv3):not(#_fv4):not(#_fv5):not(#_fv6) body .wmf.wmf-aero .wmf-sp,html:not(#_fv0):not(#_fv1):not(#_fv2):not(#_fv3):not(#_fv4):not(#_fv5):not(#_fv6) body .wmf.wmf-aero .wmf-fb{background:var(--gl2)!important;box-shadow:inset 0 1px 0 var(--hl,var(--hi)),inset 0 0 0 1px var(--tx3),0 8px 24px -14px rgba(0,0,0,.35)!important;-webkit-backdrop-filter:blur(18px) saturate(1.6)!important;backdrop-filter:blur(18px) saturate(1.6)!important}
/* MT t1853: search pill (closed + expanded) background = the GO/CAUTION/NO-GO status tiles (.tile.glass = var(--gl)) per theme */
html:not(#_fv0):not(#_fv1):not(#_fv2):not(#_fv3):not(#_fv4):not(#_fv5):not(#_fv6) body .wflt-row .fv-sb,html:not(#_fv0):not(#_fv1):not(#_fv2):not(#_fv3):not(#_fv4):not(#_fv5):not(#_fv6) body .wmf.wmf-aero .wmf-sp{background:var(--gl)!important}`;document.head.append(g8)}
glass();row.classList.add('fv-up');rest();setTimeout(rest,400);setTimeout(rest,1500);
addEventListener('resize',()=>requestAnimationFrame(rest));
{const u=document.createElement('style');u.id='fv-back-css';u.textContent='.wflt-row.fv-up{position:relative;z-index:31}/* t1827: closed top row = the expanded box top row trimmed: same 10px inset, 36px search pill + 36px icon, 8px gap, 760 cap on wide */html body .wflt-row{padding:10px!important;box-sizing:border-box;gap:8px!important;margin:0!important}html body .wflt-row .fv-sb{height:36px!important}html body .wflt-row .wflt-b{width:36px!important;height:36px!important;min-width:0!important;margin:0!important}/* backlog 5 (MT): closed search row is no longer capped at 760 on wide screens, it fills the status box width */';document.head.append(u)}
window.WMfv5={open,close,rects};
}

const FLZ=(()=>{for(const w of [window,parent]){try{if(new URLSearchParams(w.location.search).get('fvlazy')==='0')return true}catch(e){}}return false})();
let lastA=-1;
function draw(){const N=visC().length,a=active();if(FLZ||ui.isOpen()||ui.root.classList.contains('fv5-show')||a!==lastA){ui.draw();lastA=a}tiles();
 if(sortNote){const sm=ui.root&&ui.root.querySelector('.ph small');if(sm)sm.textContent=sortNote}
 if(hint){if(sortNote){hint.textContent=sortNote}else{const t=a?'Showing '+N+' of '+base():hint.dataset.fv0||hint.textContent;if(!a&&!hint.dataset.fv0)hint.dataset.fv0=hint.textContent;if(a&&!hint.dataset.fv0)hint.dataset.fv0='';if(hint.textContent!==t&&t)hint.textContent=t}}}
let rq=0;const tick=()=>{if(rq)return;rq=1;requestAnimationFrame(()=>{rq=0;draw()})};
new MutationObserver(tick).observe(list,{subtree:true,attributes:true,attributeFilter:['class','data-s']});
document.addEventListener('wst:data',tick);document.addEventListener('wm:page',tick);addEventListener('storage',tick);
/* Site totals use the full catalogue, independent of search, filters and Count.
   Verdict tiles below retain their existing live weather / Count behaviour. */
const ISOc=c=>/^[A-Z]{4}$/.test(((c.querySelector('.icao')||{}).textContent||'').trim());
const CMt={Airports:null,International:'international',Controlled:'controlled',Uncontrolled:'uncontrolled'};
const siteCards=[...list.querySelectorAll('.card')];
const siteTotals=Object.fromEntries(Object.entries(CMt).map(([k,v])=>[k,(v?siteCards.filter(c=>c.dataset.cat===v||(v==='international'&&(c.dataset.adType==='major'||(window.WM_AD_TYPE_OF&&(WM_AD_TYPE_OF(c)||{}).t==='major')))):siteCards).length]));
function tiles(){const m=mode(),cs=[...list.querySelectorAll('.card')].filter(c=>m==='all'||ISOc(c));
 document.querySelectorAll('#a1stats .st').forEach(t=>{if(!(t.dataset.c in CMt))return;const n=siteTotals[t.dataset.c],e=t.querySelector('.n');if(e&&e.textContent!=String(n))e.textContent=n});
 let g={go:0,caution:0,nogo:0};cs.forEach(c=>{if(c.dataset.s in g)g[c.dataset.s]++});if(window.WM_COUNTS)g=WM_COUNTS();
 document.querySelectorAll('#tiles .tile[data-s]').forEach(t=>{const e=t.querySelector('.n');if(e&&e.textContent!=String(g[t.dataset.s]))e.textContent=g[t.dataset.s]})}
/* fv3b: i icon inline right after "Updated HH:MM" */
function moveI(){const f=document.querySelector('#tiles .stfoot'),u=f&&f.querySelector('.wupd'),i=f&&f.querySelector('.inote');if(u&&i&&u.nextElementSibling!==i)u.after(i)}
moveI();setTimeout(moveI,500);setTimeout(moveI,2500);
try{const k=localStorage.getItem('wm-fv3-sort');if(k&&k!=='name'&&k!=='near')setTimeout(()=>setSort(k),300)}catch(e){}
draw();setTimeout(draw,400);
document.addEventListener('wm:page',()=>{
 if(!animT||performance.now()-animT>800)return;animT=0;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 requestAnimationFrame(()=>{
  let a=0,b=innerHeight;try{const fe=window.frameElement;if(fe&&parent!==window){a=-fe.getBoundingClientRect().top;b=a+parent.innerHeight}}catch(e){}
  let i=0;for(const c of visC()){if(i>=10)break;const r=c.getBoundingClientRect();if(!r.height||r.bottom<a||r.top>b)continue;
   c.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:260,delay:i*28,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'});i++}})});
window.WMfv3={set:o=>o?window.WMfv5.open():window.WMfv5.close(),draw,state:()=>ui.isOpen()?'open':'',visC,base};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()})();

/* MT t1858: swap + remove. The open panel's own dotted filter button (.wmf-fb with its .wmf-bd dot) now shows the
   same icon as the closed filter icon (.wflt-b glyph + its count badge); the dot is removed. No theme or motion change. */
(function go(n){const R=document.querySelector('.wmf.wmf-aero'),fb=R&&R.querySelector('.wmf-fb'),btn=document.querySelector('.wflt-row .wflt-b');if(!fb||!btn||!btn.querySelector('.fvb')){if((n|0)<60)setTimeout(()=>go((n|0)+1),100);return}if(fb.dataset.fvSwap)return;fb.dataset.fvSwap=1;
 const sv=btn.querySelector('svg'),old=fb.querySelector('svg');if(sv&&old){const c=sv.cloneNode(true);c.setAttribute('width','20');c.setAttribute('height','20');old.replaceWith(c)}
 const mb=document.createElement('span');mb.className='fvb fv-fbb';mb.hidden=true;fb.append(mb);
 const src=btn.querySelector('.fvb'),sync=()=>{if(!src)return;mb.textContent=src.textContent;mb.hidden=src.hidden};sync();
 if(src)new MutationObserver(sync).observe(src,{attributes:true,childList:true,characterData:true,subtree:true});
 const s=document.createElement('style');s.id='fv-swap-css';
 s.textContent='html body .wmf.wmf-aero .wmf-fb .wmf-bd,html body .wmf.wmf-aero .wmf-fb>i{display:none!important}'+
  'html body .wmf.wmf-aero .wmf-fb svg{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}'+
  'html body .wmf.wmf-aero .wmf-fb .fv-fbb{position:absolute;top:-3px;right:-3px;min-width:17px;height:17px;padding:0 5px;border-radius:9px;background:var(--tx);color:var(--bg);font:700 10.5px/17px Satoshi,-apple-system,sans-serif;text-align:center;pointer-events:none;box-sizing:border-box}'+
  'html body .wmf.wmf-aero .wmf-fb .fv-fbb[hidden]{display:none}'+
/* MT t1860 (Amethyst): search pill closed + open = the GO/CAUTION/NO-GO tile surface (fill --gl, the tiles own top highlight and 0.5px ring),
   on the Show ATOs blur. Before it carried the Show pill's bright 1px ring (rgba(236,228,255,.38)), so it read as an outlined pill, not a tile. */
  'html.pal-purple:not(#_fv0):not(#_fv1):not(#_fv2):not(#_fv3):not(#_fv4):not(#_fv5):not(#_fv6):not(#_fv7) body .wflt-row .fv-sb,html.pal-purple:not(#_fv0):not(#_fv1):not(#_fv2):not(#_fv3):not(#_fv4):not(#_fv5):not(#_fv6):not(#_fv7) body .wmf.wmf-aero .wmf-sp{background:var(--fvt-bg,var(--gl))!important;background-image:var(--fvt-bi,none)!important;box-shadow:var(--fvt-sh)!important;-webkit-backdrop-filter:var(--fvt-bf,none)!important;backdrop-filter:var(--fvt-bf,none)!important;border:var(--fvt-bd,0)!important}';
 document.head.append(s)})();

/* MT t1873: closed "Search aerodromes" hint = a static copy-paste of the expanded hint: the expanded glyph + "Search" + "aerodromes"
   are cloned and every computed text/colour/size property is copied inline from the live expanded nodes, at the same x offsets. No animation. */
(function go(n){const R=document.querySelector('.wmf.wmf-aero'),sb=document.querySelector('.wflt-row .fv-sb');
 const sp=R&&R.querySelector('.wmf-sp'),hn=sp&&sp.querySelector('.wmf-hint'),sv=sp&&sp.querySelector('svg');
 if(!sb||!hn||!sv){if((n|0)<60)setTimeout(()=>go((n|0)+1),100);return}if(sb.dataset.fvHint)return;sb.dataset.fvHint=1;
 const si=sb.querySelector('.fv-si'),own=sb.querySelector(':scope>svg');
 const ov=document.createElement('span');ov.className='fv-hc';ov.setAttribute('aria-hidden','true');
 const cs=sv.cloneNode(true),ch=hn.cloneNode(true);ch.className='fv-hc-t';ov.append(cs,ch);sb.append(ov);
 const K=['color','opacity','font-family','font-size','font-weight','font-style','font-stretch','letter-spacing','word-spacing','line-height','text-transform','white-space','width','height','stroke-width','vertical-align','display','margin-left','margin-right','padding-left','padding-right','word-spacing','column-gap','align-items'];
 const pairs=()=>{const a=[sv,hn,...hn.querySelectorAll('*')],b=[cs,ch,...ch.querySelectorAll('*')];return a.map((e,k)=>[e,b[k]])};
 const cp=()=>{let r=sp.getBoundingClientRect(),un=null;
  if(!r.width){/* panel not laid out while closed: measure the expanded row once, invisibly, without any motion */
   const bx=R.closest('.fv5-sp')||R;un=[];for(const e of [R,R.parentElement]){if(!e)continue;un.push([e,e.getAttribute('style')]);}
   R.style.setProperty('display','block','important');R.style.setProperty('visibility','hidden','important');R.style.setProperty('position','absolute','important');R.style.setProperty('left','0');R.style.setProperty('right','0');
   R.setAttribute('data-fvm','1');r=sp.getBoundingClientRect()}
  const fin=()=>{if(un){for(const[e,v]of un){v==null?e.removeAttribute('style'):e.setAttribute('style',v)}R.removeAttribute('data-fvm')}};
  if(!r.width){fin();return}
  for(const[a,b]of pairs()){if(!b)continue;const c=getComputedStyle(a);K.forEach(k=>b.style.setProperty(k,c.getPropertyValue(k),'important'));b.style.setProperty('animation','none','important');b.style.setProperty('transition','none','important');b.style.setProperty('transform','none','important')}
  ch.style.setProperty('width','auto','important');
  const q=sv.getBoundingClientRect(),h=hn.getBoundingClientRect();
  ov.style.setProperty('--hc-x',Math.round(q.left-r.left)+'px');ov.style.setProperty('--hc-g',Math.round(h.left-q.right)+'px');{const f1=hn.querySelector('.fx'),r1=hn.querySelector('.rot'),f2=ch.querySelector('.fx'),r2=ch.querySelector('.rot');if(f1&&r1&&f2&&r2)r2.style.setProperty('margin-left',Math.round(r1.getBoundingClientRect().left-f1.getBoundingClientRect().right-(parseFloat(getComputedStyle(hn).columnGap)||0))+'px','important')}ov.style.setProperty('--hc-sx',Math.round(r.width)+'px');ov.dataset.ok=1;fin()};
 const st=()=>{sb.classList.toggle('fv-hc-on',!si.value&&ov.dataset.ok==='1')};
 cp();st();setTimeout(()=>{cp();st()},600);
 new MutationObserver(()=>setTimeout(()=>{cp();st()},80)).observe(R,{attributes:true,attributeFilter:['data-s']});
 new MutationObserver(()=>setTimeout(()=>{cp();st()},120)).observe(document.documentElement,{attributes:true,attributeFilter:['class','data-theme']});
 si.addEventListener('input',st);new MutationObserver(st).observe(R,{attributes:true,attributeFilter:['data-s','class']});
 /* until the expanded hint has been laid out once, measure it off-screen-free by a one-off hidden open is NOT done (no motion change): fall back to the old placeholder */
 const s=document.createElement('style');s.id='fv-hint-copy-css';
 s.textContent='.wflt-row .fv-sb{position:relative}.wflt-row .fv-sb .fv-hc{display:none;position:absolute;left:var(--hc-x);top:0;bottom:0;align-items:center;gap:var(--hc-g);pointer-events:none}'+
  'html body .wflt-row .fv-sb.fv-hc-on .fv-hc{display:flex}html body .wflt-row .fv-sb.fv-hc-on>svg{visibility:hidden!important}html body .wflt-row .fv-sb.fv-hc-on .fv-si::placeholder{color:transparent!important}';
 document.head.append(s)})();

/* MT t1874 (Amethyst only): search bar surface copied live from the status GO/CAUTION/NO-GO tile computed style */
(function go(n){const t=[...document.querySelectorAll('.tile')].find(x=>/CAUTION/.test(x.textContent));if(!t){if((n|0)<60)setTimeout(()=>go((n|0)+1),100);return}
 const H=document.documentElement,cp=()=>{if(!H.classList.contains('pal-purple'))return;const c=getComputedStyle(t);
  /* MT t1877: the tile's visible fill is its own --gl layered on the status card's --gl over the page: paint that composite (solid) */
  {const P=x=>{const m=(x||'').match(/[\d.]+/g)||[0,0,0,0];return[+m[0],+m[1],+m[2],m[3]===undefined?1:+m[3]]};
   const L=[c.backgroundColor];for(let e=t.parentElement;e;e=e.parentElement){const b=getComputedStyle(e).backgroundColor;if(P(b)[3]>0)L.push(b);if(P(b)[3]>=1)break}
   let o=[0,0,0];for(const x of L.reverse()){const[r,g,b,a]=P(x);o=[o[0]+(r-o[0])*a,o[1]+(g-o[1])*a,o[2]+(b-o[2])*a]}
   H.style.setProperty('--fvt-bg','rgb('+o.map(v=>Math.round(v)).join(',')+')')}
  H.style.setProperty('--fvt-bg','rgb(35,19,77)');/* MT t1877: the on-screen fill of the GO/CAUTION/NO-GO tiles in Amethyst (sampled 32-34,16-18,69-73) */H.style.setProperty('--fvt-bi',c.backgroundImage);H.style.setProperty('--fvt-sh',(c.boxShadow.match(/(?:[^,(]|\([^)]*\))+/g)||[]).map(x=>x.trim()).filter(x=>!/0px 0px 0px [\d.]+px inset/.test(x)).join(', ')||'none');/* MT t1876: tile's faint inset ring removed */
  H.style.setProperty('--fvt-bf',c.backdropFilter||'none');H.style.setProperty('--fvt-bd',c.borderTopWidth+' '+c.borderTopStyle+' '+c.borderTopColor)};
 cp();setTimeout(cp,600);setTimeout(cp,1800);new MutationObserver(()=>setTimeout(cp,60)).observe(H,{attributes:true,attributeFilter:['class','data-theme']})})();

/* MT t1879: filter icon button (closed .wflt-b + open .wmf-fb): outline (1px inset ring) removed in every theme, top highlight and
   drop shadow kept; Amethyst also gets the search bar's lighter purple fill and shadow. Glyph dead-centre (the open glyph sat 1px low). */
(function(){const X='html:not(#_fv0):not(#_fv1):not(#_fv2):not(#_fv3):not(#_fv4):not(#_fv5):not(#_fv6):not(#_fv7):not(#_fv8)',
 B=[' body .wflt-row .wflt-b',' body .wflt-row .wflt-b.on',' body .wmf.wmf-aero .wmf-fb'],A=s=>B.map(b=>X+s+b).join(',');
 const s=document.createElement('style');s.id='fv-icon-noline-css';
 s.textContent=A('')+'{box-shadow:inset 0 1px 0 var(--hl,var(--hi)),0 8px 24px -14px rgba(0,0,0,.35)!important;border:0!important}'+
  A('.pal-purple')+'{background:var(--fvt-bg,var(--gl))!important;background-image:var(--fvt-bi,none)!important;box-shadow:var(--fvt-sh)!important;-webkit-backdrop-filter:var(--fvt-bf,none)!important;backdrop-filter:var(--fvt-bf,none)!important}'+
  X+' body .wmf.wmf-aero .wmf-fb svg,'+X+' body .wflt-row .wflt-b svg{transform:none!important;margin:0!important;display:block}';
 document.head.append(s)})();
/* MT t1881: unselected option chips inside the aerodrome filter - remove the 1px inset outline ring only (all themes). Nothing else changed. */
(function(){const s=document.createElement('style');s.id='fv-t1881';
 s.textContent='html:not(#_fv0):not(#_fv1):not(#_fv2):not(#_fv3):not(#_fv4):not(#_fv5):not(#_fv6):not(#_fv7):not(#_fv8):not(#_fv9) body .wmf.wmf-aero .chips .c:not(.on):not(.qm){box-shadow:inset 0 1px 0 var(--hl,var(--hi)),0 8px 24px -14px rgba(0,0,0,.35)!important}';
 document.head.append(s)})();
/* MT t1887: "Search aerodromes" bar - remove the 1px inset outline ring and any border/outline, collapsed and expanded, all themes. Fill, colour, size, radius unchanged. Amethyst already has no ring. */

/* MT t2227: International / Controlled / Uncontrolled Type chips = same glass glow as DEPART/CAUTION/NO DEPART status chips, in gold/blue/pink. Top boxes unchanged. */
;(function(){const s=document.createElement('style');s.id='fv-type-chip-glow';
const P='html:not(#_fv0):not(#_fv1):not(#_fv2):not(#_fv3):not(#_fv4):not(#_fv5):not(#_fv6):not(#_fv7):not(#_fv8):not(#_fv9) body .wmf.wmf-aero .chips .c.on';
s.textContent=
 P+':is([data-v=international],[data-v=controlled],[data-v=uncontrolled],[data-v=incomplete]){'+
 'background:linear-gradient(color-mix(in srgb,var(--cc) 20%,transparent),color-mix(in srgb,var(--cc) 20%,transparent)),var(--gl2)!important;'+
 'box-shadow:inset 0 1px 0 var(--hl,var(--hi)),inset 0 0 0 1px var(--cc),0 0 16px -4px color-mix(in srgb,var(--cc) 55%,transparent)!important;'+
 'color:var(--tx)!important;font-weight:600;'+
 '-webkit-backdrop-filter:blur(18px) saturate(1.6)!important;backdrop-filter:blur(18px) saturate(1.6)!important}'+
 P+':is([data-v=international],[data-v=controlled],[data-v=uncontrolled],[data-v=incomplete]) small{color:var(--cc)!important}';
document.head.append(s)})();
(function(){const s=document.createElement('style');s.id='fv-t1887';const P='html:not(.pal-purple):not(#_fv0):not(#_fv1):not(#_fv2):not(#_fv3):not(#_fv4):not(#_fv5):not(#_fv6):not(#_fv7):not(#_fv8):not(#_fv9) body .wflt-row .fv-sb',A='html:not(#_fv0):not(#_fv1):not(#_fv2):not(#_fv3):not(#_fv4):not(#_fv5):not(#_fv6):not(#_fv7):not(#_fv8):not(#_fv9) body .wflt-row .fv-sb';
 const Q=P.replace(' .wflt-row .fv-sb',' .wmf.wmf-aero .wmf-sp'),B=A.replace(' .wflt-row .fv-sb',' .wmf.wmf-aero .wmf-sp');
 s.textContent=P+','+P+':focus-within,'+Q+','+Q+':focus-within{box-shadow:inset 0 1px 0 var(--hl,var(--hi)),0 8px 24px -14px rgba(0,0,0,.35)!important}'+A+','+A+':focus-within,'+B+','+B+':focus-within{border:0!important;outline:0!important}';
 document.head.append(s)})();

/* MT t2265: INCOMPLETE status chip = the SAME liquid-glass glow as DEPART/CAUTION/NO DEPART, in grey (var(--tx3), the card's INCOMPLETE grey). */
;(function(){const s=document.createElement('style');s.id='fv-inc-chip-glow';
const P='html:not(#_fv0):not(#_fv1):not(#_fv2):not(#_fv3):not(#_fv4):not(#_fv5):not(#_fv6):not(#_fv7):not(#_fv8):not(#_fv9) body .wmf.wmf-aero .chips .c';
s.textContent=P+'[data-v=incomplete]{--cc:var(--tx3,#8E8E93)}'+
 P+'.on[data-v=incomplete]{'+
 'background:linear-gradient(color-mix(in srgb,var(--cc) 20%,transparent),color-mix(in srgb,var(--cc) 20%,transparent)),var(--gl2)!important;'+
 'box-shadow:inset 0 1px 0 var(--hl,var(--hi)),inset 0 0 0 1px var(--cc),0 0 16px -4px color-mix(in srgb,var(--cc) 55%,transparent)!important;'+
 'color:var(--tx)!important;font-weight:600;'+
 '-webkit-backdrop-filter:blur(18px) saturate(1.6)!important;backdrop-filter:blur(18px) saturate(1.6)!important}'+
 P+'.on[data-v=incomplete] small{color:var(--cc)!important}';
document.head.append(s)})();
/* MT t2265: INCOMPLETE and the three status boxes are one choice; the INCOMPLETE list follows live verdict changes. */
;(function w(n){const L=window.WMLIST,tl=document.getElementById('tiles'),list=document.getElementById('list');
 if(!L||!L.chips||!tl||!list){if((n|0)<100)setTimeout(()=>w((n|0)+1),100);return}
 const onI=()=>L.chips().includes(window.WMAeroMulti?'__status':'__inc');
 new MutationObserver(()=>{if(!window.WMAeroMulti&&onI()&&tl.querySelector('.tile.sel'))L.toggle('__inc')}).observe(tl,{subtree:true,attributes:true,attributeFilter:['class']});
 let t=0;new MutationObserver(()=>{if(!onI())return;clearTimeout(t);t=setTimeout(()=>L.apply(0,0),150)}).observe(list,{subtree:true,attributes:true,attributeFilter:['data-s']})})();

/* MT t368u: collapse missing-data slots without deleting nodes used by weather refresh.
   Observe content, not layout/style/class writes; batch only the cards that changed. */
(function(){
 const list=document.getElementById('list');if(!list)return;
 const missing=e=>!e||!/[^\s—–−-]/.test(e.textContent.replace(/°C/g,''));
 const mark=(e,empty)=>{if(e&&e.hasAttribute('data-ad-empty')!==!!empty)e.toggleAttribute('data-ad-empty',!!empty)};
 function compact(c){
  mark(c.querySelector('.why'),missing(c.querySelector('.why')));
  const temp=c.querySelector('.temp');mark(temp,missing(temp));
  const wxd=c.querySelector('.wxd');
  if(wxd){[...wxd.children].forEach(e=>{const values=[...e.querySelectorAll('b')];mark(e,values.length?values.every(missing):missing(e))});mark(wxd,[...wxd.children].every(e=>e.hasAttribute('data-ad-empty')))}
  const rwd=c.querySelector('.rwd');
  /* MT t1104u: keep the north-circle diagram even when no published runway lines exist (ZA-0269). */
  mark(rwd,false);
  mark(c.querySelector('.wxrow'),[temp,wxd].every(e=>!e||e.hasAttribute('data-ad-empty'))&&!rwd);
  const meta=c.querySelector('.meta');
  if(meta){[...meta.children].forEach(e=>{const b=e.querySelector('b');mark(e,b?missing(b):missing(e))});mark(meta,[...meta.children].every(e=>e.hasAttribute('data-ad-empty')))}
  const fr=c.querySelector('.fr');
  if(fr){[...fr.children].forEach(e=>mark(e,missing(e.querySelector('b'))));mark(fr,[...fr.children].every(e=>e.hasAttribute('data-ad-empty')))}
 }
 list.querySelectorAll(':scope > .card').forEach(compact);
 const pending=new Set();let queued=false;
 new MutationObserver(ms=>{
  for(const m of ms){const e=m.target.nodeType===1?m.target:m.target.parentElement,c=e&&e.closest('#list > .card');if(c)pending.add(c);
   if(m.type==='childList')for(const n of m.addedNodes)if(n.nodeType===1&&n.matches('#list > .card'))pending.add(n)}
  if(!pending.size||queued)return;queued=true;
  requestAnimationFrame(()=>{queued=false;pending.forEach(compact);pending.clear()});
 }).observe(list,{subtree:true,childList:true,characterData:true});
})();
