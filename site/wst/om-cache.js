/* Open-Meteo model weather cache (MT 30 Oct 2026).
   Cause of "model weather not working": one aerodrome-list load asked Open-Meteo for about 810 locations
   (wst-common, the paged wst-card pull, the heliport cards, the map and pilot frames), and the free API
   allows about 600 location calls a minute per user. A reload inside a minute got HTTP 429 and the cards
   kept empty model panels. This wrapper, shared by every frame on the same origin:
   - keeps each location's result in localStorage for 15 minutes, so reloads and other frames reuse it
   - asks only for the locations it does not have, at most 100 per request, one request at a time
   - one shared set of variables for all callers, so the heliport and map calls reuse the list data
   - retries once 20 s after a 429
   - joins identical in-flight requests, and on 429 or a network error falls back to the last values kept (up to 90 min).
   Stale guard (6 Nov 2026, MT): a kept value is reused only while it was fetched <= 90 min ago AND its 'current' hour is
   valid <= 90 min ago, so old model weather can never be handed out as current (and can never make a status). */
(function(){
if(window.WM_OM_CACHE)return;window.WM_OM_CACHE=1;
var FULL=['temperature_2m','dew_point_2m','wind_speed_10m','wind_direction_10m','wind_gusts_10m','visibility','pressure_msl','cloud_cover_low','cloud_cover','cloud_base'],CANON='current='+FULL.join(',')+'&hourly=freezing_level_height&forecast_hours=4&wind_speed_unit=kn&timezone=UTC',FRESH=2*60e3;
var F=window.fetch.bind(window),KEY='wm-om1',TTL=15*60e3,STALE=90*60e3,MAX=100;
function fresh(e,n){if(!e||!e.o||!e.o.current||!(n-e.t<=STALE))return false;var s=e.o.current.time,v=typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)?Date.parse(s+'Z'):NaN;return isFinite(v)&&n-v<=STALE&&v-n<=STALE}
var mem=null;function load(){if(mem)return mem;try{mem=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){mem={}}return mem}
function save(){try{var m=load(),n=Date.now();Object.keys(m).forEach(function(k){if(n-m[k].t>STALE)delete m[k]});localStorage.setItem(KEY,JSON.stringify(m))}catch(e){}}
function sync(){mem=null}addEventListener('storage',function(e){if(e.key===KEY)sync()});
var chain=Promise.resolve(),pend={};
function ck(v,la,lo){return v+'|'+(+la).toFixed(4)+','+(+lo).toFixed(4)}
/* one retry 20 s after a 429 (minute limit) */
function get(u,n){return F(u,{cache:'no-store'}).then(function(r){if(r.status===429&&n>0)return new Promise(function(ok){setTimeout(ok,20e3)}).then(function(){return get(u,n-1)});if(!r.ok)throw new Error(r.status);return r.json()})}
function resp(o){return new Response(JSON.stringify(o),{status:200,headers:{'Content-Type':'application/json'}})}
window.fetch=function(input,init){
 var url=typeof input==='string'?input:(input&&input.url)||'';
 if(url.indexOf('https://api.open-meteo.com/v1/forecast?')!==0)return F(input,init);
 var u;try{u=new URL(url)}catch(e){return F(input,init)}
 var q=u.searchParams,la=(q.get('latitude')||'').split(','),lo=(q.get('longitude')||'').split(',');
 var hourly=q.get('hourly');
 if(!q.get('current')||q.get('daily')||la.length!==lo.length||!la[0])return F(input,init);
 if(hourly&&hourly!=='freezing_level_height')return F(input,init);
 var rest=new URLSearchParams(q);rest.delete('latitude');rest.delete('longitude');var V=rest.toString();
 var cur=q.get('current').split(','),ks=[];rest.forEach(function(v,k){ks.push(k)});
var FZL_LITE='current=temperature_2m&hourly=freezing_level_height&forecast_hours=4&wind_speed_unit=kn&timezone=UTC';
if(hourly==='freezing_level_height'&&cur.length===1&&cur[0]==='temperature_2m'&&q.get('forecast_hours')==='4'&&q.get('wind_speed_unit')==='kn'&&q.get('timezone')==='UTC')V=FZL_LITE;
 if(q.get('wind_speed_unit')==='kn'&&ks.every(function(k){return k==='current'||k==='wind_speed_unit'||k==='timezone'||k==='hourly'||k==='forecast_hours'})&&cur.every(function(c){return FULL.indexOf(c)>=0||c==='temperature_2m'})&&(!hourly||hourly==='freezing_level_height'))V=CANON;
 var force=init&&init.cache==='no-store',now=Date.now(),m=load(),out=new Array(la.length),miss=[];
 la.forEach(function(a,i){var k=ck(V,a,lo[i]),e=m[k];if(e&&now-e.t<(force?FRESH:TTL)&&fresh(e,now))out[i]=e.o;else miss.push(i)});
 if(!miss.length)return Promise.resolve(resp(la.length===1?out[0]:out));
 var job=function(){sync();var mm0=load(),t0=Date.now();miss=miss.filter(function(i){var e=mm0[ck(V,la[i],lo[i])];if(e&&t0-e.t<(force?FRESH:TTL)&&fresh(e,t0)){out[i]=e.o;return false}return true});var parts=[];for(var s=0;s<miss.length;s+=MAX)parts.push(miss.slice(s,s+MAX));
  return parts.reduce(function(p,P){return p.then(function(){
   var key=V+'#'+P.map(function(i){return la[i]+','+lo[i]}).join(';');
   var pr=pend[key]||(pend[key]=get('https://api.open-meteo.com/v1/forecast?latitude='+P.map(function(i){return la[i]}).join(',')+'&longitude='+P.map(function(i){return lo[i]}).join(',')+'&'+V,1).finally(function(){delete pend[key]}));
   return pr.then(function(j){j=[].concat(j);sync();var mm=load(),t=Date.now();P.forEach(function(i,x){if(j[x]&&j[x].current){out[i]=j[x];mm[ck(V,la[i],lo[i])]={t:t,o:j[x]}}});save()})
  })},Promise.resolve())};
 var run=chain.then(job,job);chain=run.catch(function(){});
 return run.then(function(){return resp(la.length===1?out[0]:out)},function(err){
  sync();var mm=load(),t=Date.now(),ok=false;miss.forEach(function(i){var e=mm[ck(V,la[i],lo[i])];if(fresh(e,t)){out[i]=e.o;ok=true}});
  if(miss.every(function(i){return out[i]}))return resp(la.length===1?out[0]:out);
  if(ok)return resp(la.length===1?out[0]:out.map(function(o){return o||{}}));
  throw err});
};
})();
