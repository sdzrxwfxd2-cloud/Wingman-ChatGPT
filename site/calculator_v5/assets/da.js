/* Wingman v4 — Density altitude hero (DEMO). Maths: window.WC (calc.js, unchanged). Data: window.AD (aerodromes.js, read-only copy), window.TA (ta.js). */
(function(){
const C=window.WC,AD=window.AD||[],$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const LSG=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},LSS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const U=Object.assign({alt:0,temp:0,press:0},LSG('wm-calc-units',{}));
const S=Object.assign({mode:'auto',src:'metar',time:'now',icao:'FAOR'},LSG('wm-da',{}));if(S.src==='taf')S.src='metar';
const save=()=>LSS('wm-da',{mode:S.mode,src:S.src,time:S.time,icao:S.ad&&S.ad[0]});
let WX=null; /* {oat,qnh,label,raw,warn} */
const sp=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
const alt=v=>sp(C.toUnit('alt',v,U.alt))+' '+(U.alt?'m':'ft');
const tmp=(v,d=1)=>(+C.toUnit('temp',v,U.temp)).toFixed(d)+(U.temp?' °F':' °C');
const dtmp=v=>{const x=U.temp?v*9/5:v;return(x>=0?'+':'')+x.toFixed(1)+(U.temp?' °F':' °C')};
const prs=v=>U.press?C.toUnit('press',v,1).toFixed(2)+' inHg':v.toFixed(0)+' hPa';
const sast=d=>new Date(d.getTime()+7200e3).toISOString().replace('T',' ').slice(0,16)+' SAST';
const ago=d=>{const m=Math.round((Date.now()-d)/6e4);return m<0?'in '+(-m<120?-m+' min':Math.round(-m/60)+' h'):m<120?m+' min ago':Math.round(m/60)+' h ago'};
/* ---------- segmented controls (bubble moves with transform only) ---------- */
function seg(el,val,cb){const i=el.querySelector('i'),bs=[...el.querySelectorAll('button')];
 const set=(v,quiet)=>{bs.forEach(b=>b.classList.toggle('on',b.dataset.v==v));const b=bs.find(b=>b.dataset.v==v)||bs[0];i.style.width=b.offsetWidth+'px';i.style.transform=`translateX(${b.offsetLeft}px)`;if(!quiet)cb(b.dataset.v)};
 bs.forEach(b=>b.onclick=()=>{set(b.dataset.v);requestAnimationFrame(relayout)});el._set=set;requestAnimationFrame(()=>set(val,1));window.addEventListener('resize',()=>set(el.querySelector('.on')?.dataset.v??val,1));}
const relayout=()=>$$('.seg').forEach(e=>e._set&&e._set(e.querySelector('.on')?.dataset.v,1));document.fonts&&document.fonts.ready.then(relayout);
/* ---------- aerodrome search ---------- */
const q=$('#adq'),dl=$('#adlist');let hits=[],hi=0;
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function placeList(){if(!dl||!dl.classList.contains('on'))return;
 /* Stay absolutely positioned under .srch (left/right/top in CSS). Viewport-fixed
    coords went wrong inside the tall calculator iframe on a phone-sized window. */
 dl.style.left=dl.style.width=dl.style.top='';
 const r=q.getBoundingClientRect(),vh=(window.visualViewport&&visualViewport.height)||window.innerHeight;
 dl.style.maxHeight=Math.min(300,Math.max(140,vh-r.bottom-16))+'px'}
function search(){const t=norm(q.value.trim());if(!t){dl.classList.remove('on');return}
 hits=AD.filter(a=>norm(a[0]).startsWith(t)).concat(AD.filter(a=>!norm(a[0]).startsWith(t)&&(norm(a[1]).includes(t)||norm(a[2]).includes(t)))).slice(0,8);hi=0;
 dl.innerHTML=hits.length?hits.map((a,k)=>`<button role="option" data-k="${k}" class="${k?'':'hi'}"><b>${a[0]}</b>${a[1]}<small>${a[3]||''}</small></button>`).join(''):'<div class="note">No aerodrome found</div>';dl.classList.add('on');placeList()}
q.addEventListener('input',search);q.addEventListener('focus',()=>{q.select();search()});
window.addEventListener('resize',placeList);if(window.visualViewport)visualViewport.addEventListener('resize',placeList);
q.addEventListener('keydown',e=>{if(!dl.classList.contains('on'))return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){hi=(hi+(e.key==='ArrowDown'?1:-1)+hits.length)%hits.length;$$('#adlist button').forEach((b,k)=>b.classList.toggle('hi',k===hi));e.preventDefault()}else if(e.key==='Enter'&&hits[hi]){pick(hits[hi]);e.preventDefault()}else if(e.key==='Escape')dl.classList.remove('on')});
dl.addEventListener('click',e=>{const b=e.target.closest('button');if(b)pick(hits[+b.dataset.k])});
document.addEventListener('click',e=>{if(!e.target.closest('.srch'))dl.classList.remove('on')});
function pick(a,quiet){S.ad=a;q.value=a[0]+' · '+a[1];dl.classList.remove('on');q.blur();save();
 const t=C.taLookup(a[0],a[4],a[5],a[6],AD,window.TA||[]),rw=(a[7]||[]);
 $('#adInfo').innerHTML=`<div class="nm">${a[1]}</div><span class="tag"><span>ICAO</span>${a[0]}</span><span class="tag"><span>Elev</span>${alt(a[6])}</span>`+
  rw.map(r=>`<span class="tag"><span>RWY ${r[0]}</span>${alt(r[1]).replace(' m',' m').replace(' ft',' ft')} ${r[2]||''}</span>`).join('')+
  `<span class="tag"><span>TA</span>${t.ta?sp(t.ta)+' ft'+(t.kind==='near'?' (near '+t.via+')':''):'VMC: elev + 2 000 ft'}</span>`;
 if(S.mode==='manual'){$('#mElev').value=Math.round(C.toUnit('alt',a[6],U.alt))}
 if(!quiet&&S.mode==='auto')getWx();else calc()}
/* ---------- weather (same chain as the original calculator: site /api, live Netlify /api, aviationweather.gov; Open-Meteo direct) ---------- */
function timeoutFetch(url,ms){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms||8000);
 return fetch(url,{cache:'no-store',signal:c.signal}).finally(()=>clearTimeout(t))}
async function tryJson(urls){let last;for(const u of urls){for(let n=0;n<2;n++){try{const r=await timeoutFetch(u,8000);if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();if(j&&!j.error)return j;throw new Error((j&&j.reason)||'empty response')}catch(e){last=e.name==='AbortError'?new Error('the request timed out'):e;await new Promise(res=>setTimeout(res,350*(n+1)))}}}throw last||new Error('no source')}
async function fetchModelHourly(a,w){
 const la=a[4],lo=a[5],elev=(a[6]*0.3048).toFixed(0);
 const urls=[
  `https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&hourly=temperature_2m,pressure_msl,surface_pressure&timezone=GMT&wind_speed_unit=kn&forecast_hours=24`,
  `https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&hourly=temperature_2m,pressure_msl,surface_pressure&elevation=${elev}&timezone=GMT&past_days=1&forecast_days=7&models=best_match`
 ];
 let last, fallback=null;
 for(const u of urls){
  for(let n=0;n<2;n++){
   try{
    const res=await timeoutFetch(u,8000);
    if(!res.ok)throw new Error('HTTP '+res.status);
    const j=await res.json();
    if(!j||j.error||!j.hourly||!Array.isArray(j.hourly.time))throw new Error((j&&j.reason)||'no hourly data');
    const want=w.toISOString().slice(0,13),i=j.hourly.time.findIndex(x=>String(x).slice(0,13)===want);
    if(i<0){last=Object.assign(new Error(`The model can’t give ${sast(w)}.`),{range:'It covers the current model hours, or yesterday to 7 days ahead on a full fetch. Pick a time inside that window, or Now.'});break}
    /* URL 1 is served from the model copy, which has no surface_pressure. Skip that
       reply and try URL 2 (direct, with elevation=). If URL 2 also lacks it, keep the
       hourly so getWx can use MSLP as QNH — do not throw. */
    const ps=j.hourly.surface_pressure&&j.hourly.surface_pressure[i];
    if(!(isFinite(ps)&&ps>450)){fallback={h:j.hourly,i};break}
    return {h:j.hourly,i};
   }catch(e){last=e.name==='AbortError'?new Error('the request timed out'):e;await new Promise(res=>setTimeout(res,350*(n+1)))}
  }
 }
 if(fallback)return fallback;
 throw last||new Error('no source')}
const wxUrls=(k,ic)=>['/api/'+k+'?ids='+ic,'https://wingman-aero.netlify.app/api/'+k,`https://aviationweather.gov/api/data/${k}?ids=${ic}&format=json`];
const when=()=>S.time==='now'?new Date():new Date(new Date($('#wtime').value+':00Z').getTime()-7200e3);
let seq=0;
async function getWx(){const a=S.ad;if(!a){WX=null;calc();return}const my=++seq,src=S.src,w=when();
 $('#wxNote').innerHTML='Loading '+src.toUpperCase()+' for '+a[0]+'…';$('#raw').hidden=true;
 try{let r;
  if(src==='metar'){const j=await tryJson(wxUrls('metar',a[0]));const m=(Array.isArray(j)?j:[]).filter(x=>x.icaoId===a[0]).sort((x,y)=>y.obsTime-x.obsTime)[0];
   if(!m)throw new Error(`No METAR for ${a[0]}. Only about 60 SA aerodromes report METARs. Try Model.`);const t=new Date(m.obsTime*1000);
   /* A3: null-safe altimeter (25–35 inHg, 850–1090 hPa, else null -> 'waiting' instead of a bogus DA) */
   r={oat:m.temp,qnh:C.qnhFromAltim(m.altim),label:`METAR · observed ${sast(t)} (${ago(t)})`,raw:m.rawOb,
    warn:S.time==='pick'&&Math.abs(w-t)>90*6e4?`<b>METAR can’t give ${sast(w)}.</b> A METAR is an observation, so this is the latest one. Pick Model for a forecast.`:''}}
  /* TAF source removed (MT 31 Oct): a TAF has no hourly OAT/QNH, so it could never give a density altitude */
  else{const {h,i}=await fetchModelHourly(a,w);
   const t=new Date(h.time[i]+':00Z');
   /* A3: the model's MSLP is not a QNH. PA/DA come from model STATION pressure at the aerodrome elevation (elevation= param);
      QNH is only displayed, computed from that station pressure and clearly labelled. */
   const ps=h.surface_pressure[i],ok=isFinite(ps)&&ps>450;
   r={oat:h.temperature_2m[i],qnh:ok?C.qnhFromStn(ps,a[6]):h.pressure_msl[i],pstn:ok?ps:null,label:`Model (Open-Meteo) · valid ${sast(t)}`,raw:`Open-Meteo ${h.time[i]}Z  T ${h.temperature_2m[i]} °C  station ${ps} hPa`,
    warn:ok?'Model: PA and DA from model station pressure. QNH shown is <b>computed from it, not observed</b>: never set it on your altimeter.':'Model station pressure missing, so model MSLP is used as QNH (approximate).'}}
  if(my!==seq)return;WX=r;$('#wxNote').innerHTML=r.warn||'';$('#wxNote').className='note'+(r.warn?' warn':'');$('#raw').textContent=r.raw;$('#raw').hidden=false}
 catch(e){if(my!==seq)return;WX={oat:null,qnh:null,label:src.toUpperCase()+' unavailable'};$('#wxNote').className='note warn';
   const hint=src==='model'?'Try again in a moment, or switch to Manual and type the values in.':'Switch to Manual and type the values in.';
   $('#wxNote').innerHTML=e.range?`<b>${e.message}</b> ${e.range}`:`<b>${src==='model'?'Model weather isn’t available just now':'Live weather couldn’t be fetched'}</b> (${e.message||'unknown error'}). ${hint}`}
 calc()}
/* ---------- calculate ---------- */
function inputs(){if(S.mode==='manual'){const g=(id,d)=>{const v=parseFloat($(id).value);return isFinite(v)?C.fromUnit(d,v,U[d]):NaN};return{elev:g('#mElev','alt'),oat:g('#mOat','temp'),qnh:g('#mQnh','press'),rh:(()=>{const r=parseFloat($('#mRh').value);return isFinite(r)?Math.max(0,Math.min(100,r)):0})(),label:'Manual values'+(S.ad?' · '+S.ad[0]:'')}}
 return{elev:S.ad?S.ad[6]:NaN,oat:WX?WX.oat:NaN,qnh:WX?WX.qnh:NaN,pstn:WX?WX.pstn:null,rh:WX&&WX.rh||0,label:WX?WX.label:'Pick an aerodrome'}}
let last='';
function calc(){const v=inputs(),ok=[v.elev,v.oat,v.qnh].every(x=>x!=null&&isFinite(x)),b=$('#daVal');
 lab();$('#srcLine').textContent=v.label;
 if(!ok){b.textContent='—';['#paVal','#devVal','#isaVal'].forEach(s=>$(s).textContent='—');$('#daAlt').textContent='';$('#daSub').textContent='Waiting for OAT, QNH and elevation';return}
 /* A3: with station pressure use it directly (PA exact; humidity only if the user typed RH, as before), otherwise the QNH rule-of-thumb path */
 const a=v.pstn?(()=>{const z=C.densAltStn(v.pstn,v.oat,C.dewFromRH(v.oat,v.rh)),isa=C.isaTemp(z.pa),dry=C.densAltStn(v.pstn,v.oat,null).da;return{pa:z.pa,isa,dev:v.oat-isa,da:z.da,hum:z.da-dry}})():C.atmosRH(v.elev,v.qnh,v.oat,v.rh||0),x=C.daAdvice(a.da,v.elev),txt=sp(C.toUnit('alt',a.da,U.alt));
 if(txt!==last){b.classList.add('tick');requestAnimationFrame(()=>requestAnimationFrame(()=>{b.textContent=txt;b.classList.remove('tick')}));last=txt}
 /* second, different unit under the big number (ft -> m, m -> ft) */
 $('#daAlt').textContent=sp(U.alt?a.da:a.da*0.3048)+(U.alt?' ft':' m');
 $('#paVal').textContent=alt(a.pa);$('#devVal').textContent=dtmp(a.dev);$('#isaVal').textContent=tmp(a.isa);
 /* OAT and QNH units in this line are tappable too, so Auto mode can switch them without the old unit rows */
 const ub=d=>`<button type="button" class="u-cyc" data-u="${d}" aria-label="Change ${d==='temp'?'temperature':'pressure'} unit"><span class="u-lab">${UL[d][U[d]?1:0]}</span><i class="u-cue" aria-hidden="true">⇅</i></button>`;
 $('#daSub').innerHTML=`${(x.above>=0?'+':'−')+alt(Math.abs(x.above))} above field · OAT <span class="nowrap">${(+C.toUnit('temp',v.oat,U.temp)).toFixed(0)}&nbsp;${ub('temp')}</span> · QNH <span class="nowrap">${prs(v.qnh).split(' ')[0]}&nbsp;${ub('press')}</span>${v.pstn?' (computed)':''} · elev ${alt(v.elev)}`+(v.rh>0?` · RH ${Math.round(v.rh)}% (+${alt(a.hum)} humidity)`:'')+(x.lean?' · lean for take-off (above 5 000 ft DA)':'')}
/* ---------- wiring ---------- */
seg($('#modeSeg'),S.mode,v=>{S.mode=v;save();$('#autoBox').hidden=v!=='auto';$('#manBox').hidden=v!=='manual';if(v==='manual'){const c=inputs.call?null:null;if(S.ad)$('#mElev').value=Math.round(C.toUnit('alt',S.ad[6],U.alt));if(WX&&isFinite(WX.oat))$('#mOat').value=+C.toUnit('temp',WX.oat,U.temp).toFixed(1);if(WX&&isFinite(WX.qnh))$('#mQnh').value=U.press?C.toUnit('press',WX.qnh,1).toFixed(2):Math.round(WX.qnh)}calc();if(v==='auto')getWx()});
$('#autoBox').hidden=S.mode!=='auto';$('#manBox').hidden=S.mode!=='manual';
seg($('#srcSeg'),S.src,v=>{S.src=v;save();getWx()});
const now2=new Date(Date.now()+7200e3+3600e3);now2.setUTCMinutes(0);$('#wtime').value=now2.toISOString().slice(0,16);
seg($('#timeSeg'),S.time,v=>{S.time=v;save();$('#timeFld').hidden=v!=='pick';getWx()});$('#timeFld').hidden=S.time!=='pick';
$('#wtime').addEventListener('change',getWx);
$('#manBox').addEventListener('input',calc);
/* units: tap the unit word (big result, OAT, QNH, elevation) to cycle it, same as the other calculators; no unit rows */
const UL={alt:['ft','m'],temp:['°C','°F'],press:['hPa','inHg']};
function lab(){$$('.dapage .u-cyc[data-u]').forEach(b=>{b.querySelector('.u-lab').textContent=UL[b.dataset.u][U[b.dataset.u]?1:0]})}lab();
function unitTap(d){const id={alt:'#mElev',temp:'#mOat',press:'#mQnh'}[d],inp=$(id),base=C.fromUnit(d,parseFloat(inp.value),U[d]);U[d]=U[d]?0:1;
 if(isFinite(base)){const o=C.toUnit(d,base,U[d]);inp.value=d==='press'&&U[d]?o.toFixed(2):d==='temp'?+o.toFixed(1):Math.round(o)}LSS('wm-calc-units',Object.assign(LSG('wm-calc-units',{}),U));lab();if(S.ad)pick(S.ad,1);else calc()}
document.querySelector('.dapage').addEventListener('mousedown',e=>{if(e.target.closest('.u-cyc[data-u]'))e.preventDefault()});
document.querySelector('.dapage').addEventListener('click',e=>{const b=e.target.closest('.u-cyc[data-u]');if(!b)return;e.preventDefault();unitTap(b.dataset.u)});
if(U.alt)$('#mElev').value=Math.round(C.toUnit('alt',5558,1));if(U.temp)$('#mOat').value=77;if(U.press)$('#mQnh').value=C.toUnit('press',1013,1).toFixed(2);
$('#daInfo').onclick=()=>{$('#shT').textContent='Density altitude';$('#shF').textContent='PA = elevation + (1013.25 − QNH) × 30\nISA temp = 15 − 2 × PA / 1000\nISA deviation = OAT − ISA temp\nDA = PA + 120 × (OAT − ISA temp)\nManual RH: e = RH/100 × 6.1078 × 10^(7.5T/(T+237.3))\nTv = T / (1 − 0.378 e/p);  DA += DA(ρ humid) − DA(ρ dry)';
 $('#shS').innerHTML='FAA PHAK (FAA-H-8083-25) ch.4 rules of thumb, cross-checked against ICAO Doc 7488 Standard Atmosphere. Leaning above 5 000 ft DA: FAA-P-8740-2. Elevation, runways and TA from the Go Around aerodrome data and CAA SA AIP ENR 1.7. Weather from aviationweather.gov (METAR) and Open-Meteo (model). Planning aid only: always use your POH performance charts.';$('#sheet').classList.add('on');$('#scrim').classList.add('on')};
const a0=AD.find(a=>a[0]===S.icao)||AD.find(a=>a[0]==='FAOR');if(a0)pick(a0);else calc();
window.__da={S,U,getWx,pick,AD,unitTap};
})();
