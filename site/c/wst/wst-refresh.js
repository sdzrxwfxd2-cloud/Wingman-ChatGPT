/* ↻ refresh (all pages with the button): fresh METAR/TAF (cache-buster, past the CDN + browser cache), fresh Open-Meteo batch,
   then redraw everything (cards, Vis/Sky, badges, verdicts, tiles, search dots, sun pill). Smooth spin, Updated HH:MM, subtle offline state. */
(function(){const S=window.WMST,C=window.WSTC;let bust=0,memo={};
const of=window.fetch.bind(window);
window.fetch=function(u,o){const s=typeof u==='string'?u:(u&&u.url)||'';const m=s.match(/^\/api\/(metar|taf)$/);
 if(bust&&m){const k=m[1];if(!memo[k])memo[k]=of('/api/'+k+'?r='+bust,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.text()});return memo[k].then(t=>new Response(t,{status:200,headers:{'Content-Type':'application/json'}}))}
 return of(u,o)};
const css=document.createElement('style');css.textContent='.wrf svg{transition:opacity .3s}.wrf.ld svg{animation:wrs .9s cubic-bezier(.45,.05,.55,.95) infinite!important}.wrf.off{opacity:.62}.wrf.off::before{content:"";position:absolute;right:6px;top:6px;width:6px;height:6px;border-radius:50%;background:#F59E0B;box-shadow:0 0 0 1.5px var(--bg,#fff)}.wupd.off{color:#B45309!important}html[data-theme=night] .wupd.off{color:#FBBF24!important}';document.head.appendChild(css);
const tm=()=>new Date().toLocaleTimeString('en-GB',{timeZone:'Africa/Johannesburg',hour:'2-digit',minute:'2-digit'});
async function model(){if(window.WMCARD)return window.WMCARD.pull(1);if(!S||!S.ads)return;const mo=S.ads.filter(a=>!S.metar[a.ic]);if(!mo.length)return;
 const j=await of('https://api.open-meteo.com/v1/forecast?latitude='+mo.map(a=>a.la).join(',')+'&longitude='+mo.map(a=>a.lo).join(',')+'&current=temperature_2m,dew_point_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,pressure_msl,cloud_cover_low,cloud_cover,cloud_base&wind_speed_unit=kn&timezone=UTC',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()});
 [].concat(j).forEach((o,i)=>S.om[mo[i].ic]=o)}
function hook(){const b=document.querySelector('.wrf');if(!b||b.dataset.wr)return!!b;const orig=b.onclick;if(!orig)return false;b.dataset.wr=1;let busy=0;
 b.onclick=async e=>{e&&e.stopPropagation();if(busy)return;busy=1;const t0=Date.now();b.classList.add('ld');b.classList.remove('off');const lab=document.querySelector('.wupd');if(lab){lab.classList.remove('off');lab.textContent='Updating…'}
  bust=Date.now();memo={};let ok=1;
  try{const [M,T]=await Promise.all([fetch('/api/metar').then(r=>r.json()),fetch('/api/taf').then(r=>r.json()).catch(()=>[])]);if(!Array.isArray(M))throw 0;
   if(S){M.slice().sort((a,b)=>a.obsTime-b.obsTime).forEach(m=>{if(m&&m.icaoId)S.metar[m.icaoId]=m});(T||[]).forEach(t=>{if(t&&t.icaoId&&t.rawTAF)S.taf[t.icaoId]=t.rawTAF});try{await model()}catch(x){}}
   await new Promise(r=>{const o=new MutationObserver(()=>{if(!b.classList.contains('ld')||(lab&&/^(Updated|Snapshot)/.test(lab.textContent))){o.disconnect();r()}});o.observe(b,{attributes:true});lab&&o.observe(lab,{childList:true,characterData:true,subtree:true});try{orig.call(b,e||new Event('click'))}catch(x){o.disconnect();r()}setTimeout(()=>{o.disconnect();r()},15e3)});b.classList.add('ld');
   document.dispatchEvent(new Event('wst:data'));typeof window.applyS==='function'&&window.applyS();
  }catch(x){ok=0}
  bust=0;memo={};const w=Math.max(0,650-(Date.now()-t0));setTimeout(()=>{b.classList.remove('ld');
   if(ok){window.WQLAST=Date.now();if(lab)lab.textContent='Updated '+tm();b.title='Updated '+tm()}else{b.classList.add('off');b.title='Offline · showing saved data';if(lab){lab.classList.add('off');lab.textContent='Offline · showing saved data'}}busy=0},w)};
 return true}
if(!hook()){let n=0;const iv=setInterval(()=>{if(hook()||++n>40)clearInterval(iv)},100)}
addEventListener('online',()=>{const b=document.querySelector('.wrf.off');b&&b.click()});
/* Q11 — one shared auto-refresh: every 5 min while the page is visible, and at once on return to the foreground if the data is > 2 min old. */
window.WQLAST=Date.now();const auto=()=>{const b=document.querySelector('.wrf');if(b&&b.dataset.wr&&!b.classList.contains('ld')&&navigator.onLine!==false)b.click()};
setInterval(()=>{if(!document.hidden&&Date.now()-window.WQLAST>=290e3)auto()},30e3);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-window.WQLAST>120e3)auto()});
addEventListener('offline',()=>{const b=document.querySelector('.wrf'),l=document.querySelector('.wupd');b&&b.classList.add('off');if(l){l.classList.add('off');l.textContent='Offline · showing saved data'}});})();
