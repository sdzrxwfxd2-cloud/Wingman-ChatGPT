/* shared: read saved pills, compute status for the 65, write search-dot cache */
(function(){const W=window.WST,S=window.WMST;if(!W||!S)return;
const g=(k,d)=>{try{return localStorage.getItem(k)??d}catch(e){return d}};
const AD={};S.ads.forEach(a=>AD[a.ic]=a);
function sel(){let l=g('wm-lvl','ppl');if(l==='ppln'){l='ppl';try{localStorage.setItem('wm-lvl','ppl');localStorage.setItem('wm-night','1')}catch(e){}}if(!W.PRE[l])l='ppl';
 return{ac:g('wm-ac','C172'),rules:g('wm-rules','vfr')==='ifr'?'ifr':'vfr',lvl:l,night:g('wm-night','0')==='1'}}
function prof(s){return Object.assign({},W.PRE[s.lvl],{night:s.night?1:0})}
function all(){const s=sel(),P=prof(s),now=Date.now(),o={};S.ads.forEach(a=>{o[a.ic]=W.status(a,W.obsOf(a,S),s.ac,s.rules,P,now)});return o}
function dots(o){const m={go:'g',caution:'c',nogo:'n',noiap:'n'};let c={};try{c=JSON.parse(g('wm-fs-wx','null'))||{}}catch(e){}const s=Object.assign({},c.s||{});for(const k in o)s[k]=m[o[k].s]||'';try{localStorage.setItem('wm-fs-wx',JSON.stringify({t:Date.now(),s}))}catch(e){}}
window.WSTC={AD,sel,prof,all,dots};})();
/* when served: refresh the snapshot from the cached /api function (official) + one Open-Meteo batch (model), every 15 min */
(function(){const S=window.WMST,C=window.WSTC;if(!S||!C||!/^https?:/.test(location.protocol))return;
async function live(){try{const [M,T]=await Promise.all([fetch('/api/metar').then(r=>r.json()),fetch('/api/taf').then(r=>r.json()).catch(()=>[])]);
 M.sort((a,b)=>a.obsTime-b.obsTime).forEach(m=>{if(C.AD[m.icaoId])S.metar[m.icaoId]=m});(T||[]).forEach(t=>{if(C.AD[t.icaoId])S.taf[t.icaoId]=t.rawTAF});
 const mo=S.ads.filter(a=>!S.metar[a.ic]);if(mo.length){const j=await fetch('https://api.open-meteo.com/v1/forecast?latitude='+mo.map(a=>a.la).join(',')+'&longitude='+mo.map(a=>a.lo).join(',')+'&current=temperature_2m,dew_point_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,pressure_msl,cloud_cover_low,cloud_cover,cloud_base&hourly=freezing_level_height&forecast_hours=4&wind_speed_unit=kn&timezone=UTC').then(r=>r.json());[].concat(j).forEach((o,i)=>S.om[mo[i].ic]=o)}
 document.dispatchEvent(new Event('wst:data'))}catch(e){}}
live();setInterval(live,15*60e3)})();
