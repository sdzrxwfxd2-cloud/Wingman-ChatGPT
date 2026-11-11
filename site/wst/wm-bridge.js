/* wm-bridge.js — DEMO 28 Oct 2026 (MT approved 17:53 SAST).
 * ONE engine: every status on the page (cards, glow, counts, pager, filter chips, search dots, Status) comes from WMCore.
 * Loaded right after wst-engine.js: replaces WST.status with a WMCore adapter, adds a 15-min Open-Meteo cache,
 * and exposes WMB.evalCard(card) for cards outside the 65-aerodrome AIP set. Guidance only — the pilot in command decides. */
(function(){'use strict';var K=window.WMCore,W=window.WST;if(!K||!W)return;
/* 30 Oct 2026 (MT): GO/NO-GO decision comes from the rule engine in wst-engine.js (MT rules + SA CAR + weather/TAF/
   crosswind/tailwind/gust/VRB rules, tested by tests/engine/run.js). WMCore still supplies profile, minimums, wind
   geometry, DA and model fallback; the engine verdict overrides status/reasons/why when an observation exists. */
var ENG=W.status;
/* Usable-weather guard (6 Nov 2026, MT): a METAR or model observation counts only while its time is within 90 min of
   now. Older, undated or future-dated copies are dropped BEFORE any status is worked out, so they can never give
   DEPART / CAUTION / NO DEPART. The card then uses a TAF valid now, else a fresh model, else INCOMPLETE
   ("no current weather"). Heliports stay none/HELIPORT. Data freshness only; the status rules are unchanged. */
var MODEL_MAX_MS=90*60e3,METAR_MAX_MS=90*60e3,WX_MAX_MS=90*60e3;
function freshT(t,now){t=+t;return isFinite(t)&&t>1e12&&now-t<=WX_MAX_MS&&t-now<=WX_MAX_MS}
function freshOb(ob,now){if(!ob)return null;if((ob.src==='model'||ob.src==='off')&&!freshT(ob.time,now))return null;return ob}
window.WMB_FRESH={maxMs:WX_MAX_MS,metarMaxMs:METAR_MAX_MS,modelMaxMs:MODEL_MAX_MS,freshT:freshT,freshOb:freshOb};
/* 30 Oct 2026 (MT): night minimums are the SA CAR VFR minimums (CAR 91.06.21: 5 km visibility, 1,500 ft ceiling in
   CTR/ATZ), not the old stricter app default 8 km / 2,500 ft. wm-core.js stays md5-locked, so the numbers are set here. */
if(K.NIGHT){K.NIGHT.vis=W.VFR.vis;K.NIGHT.ceil=W.VFR.ceil;K.NIGHT.appDefault=false;K.NIGHT.label='Night (SA CAR 91.06.21 VFR minimums)'}
var HELI=/heli(?:port|pad|stop)?\b|hospital|\bHP\b/i;
function engP(r,p){var m=r.minimums||{},v=function(o,d){return o&&o.value!=null?o.value:d},b=W.PRE[p.licence]||W.PRE.cpl;
 return{xw:v(m.xw,b.xw),gust:v(m.gust,b.gust),ceil:v(m.ceil,b.ceil),vis:v(m.vis,b.vis),night:p.night?1:0,ir:b.ir,iceil:b.iceil,ivis:b.ivis}}
var SEV={go:'go',note:'go',caution:'caution',nogo:'nogo',noiap:'nogo',none:'none'};
function overlay(r,a,ob,now){if(!ob||!r||r.heliport)return r;var p=prof(),e;try{e=ENG(a,ob,p.aircraft,p.rules,engP(r,p),now)}catch(x){return r}
 if(!e||e.s==='none'&&r.status!=='none')return r;r.engine=e;r.status=SEV[e.s]||e.s;
 var F=(e.F||[]).filter(function(f){return f.lv!=='note'&&f.lv!=='go'});
 if(F.length)r.reasons=F.map(function(f){return{check:f.k||'engine',value:null,limit:null,severity:SEV[f.lv]||f.lv,text:f.txt}});
 else r.reasons=r.reasons.filter(function(x){return x.severity==='go'});
 r.whyShort=e.why;r.why=e.why;return r}
function awcOf(raw,obsMs){var t=' '+raw.replace(/=/g,' ').split(/ (?:TEMPO|BECMG|NOSIG|RMK) /)[0]+' ',o={rawOb:raw,clouds:[]},m;
 o.obsTime=obsMs?obsMs/1000:((m=/ (\d{2})(\d{2})(\d{2})Z /.exec(t))?dayT(+m[1],+m[2],+m[3])/1000:null);
 if((m=/ (\d{3}|VRB|\/\/\/)(\d{2}|\/\/)(?:G(\d{2}))?KT /.exec(t))){o.wdir=m[1]==='VRB'?'VRB':m[1]==='///'?null:+m[1];o.wspd=m[2]==='//'?null:+m[2];o.wgst=m[3]?+m[3]:null}
 if(/ CAVOK /.test(t))o.visib='6+';else if((m=/KT (?:\d{3}V\d{3} )?(\d{4})(?:NDV)? /.exec(t))){var v=+m[1];o.visib=v>=9999?'6+':v/1609.344}
 var r=/ (FEW|SCT|BKN|OVC|VV)(\d{3}|\/\/\/)(CB|TCU)?(?= )/g,x;while((x=r.exec(t)))o.clouds.push({cover:x[1]==='VV'?'OVX':x[1],base:x[2]==='///'?null:+x[2]*100});
 if((m=/ (M?\d{2})\/(M?\d{2}) /.exec(t))){o.temp=+m[1].replace('M','-');o.dewp=+m[2].replace('M','-')}
 if((m=/ Q(\d{4}) /.exec(t)))o.altim=+m[1];return o}
var LS=function(){try{return localStorage}catch(e){return null}}();
/* ---------- profile: Status pills still write wm-lvl / wm-ac / wm-rules / wm-night; custom numbers live in wm-profile ---------- */
function prof(){var p=K.getProfile(),g=function(k){return LS?LS.getItem(k):null};
 var l=g('wm-lvl');if(l==='ppln'){l='ppl'}if(K.LICENCE[l])p.licence=l;var a=g('wm-ac');if(a)p.aircraft=a;
 p.rules=g('wm-rules')==='ifr'?'ifr':'vfr';var n=g('wm-night');if(n!=null)p.night=n==='1';return K.normProfile(p)}
/* ---------- 15-min model cache (Open-Meteo HTTP 429 guard), keyed by URL ---------- */
var F0=window.fetch&&window.fetch.bind(window);
if(F0)window.fetch=function(u,o){var s=typeof u==='string'?u:(u&&u.url)||'';
 if(!/api\.open-meteo\.com\//.test(s))return F0(u,o);
 var key=s.length>180?'h'+hash(s):s,now=Date.now(),hit=K.getCachedModel(key,now);
 var mk=function(d){return new Response(JSON.stringify(d),{status:200,headers:{'Content-Type':'application/json'}})};
 if(hit)return Promise.resolve(mk(hit));
 return F0(u,o).then(function(r){if(!r.ok)return r;return r.clone().json().then(function(d){if(d&&d.error)return r;try{K.cacheModel(key,d,now)}catch(e){}return r},function(){return r})})};
function hash(s){var h=5381;for(var i=0;i<s.length;i++)h=(h*33^s.charCodeAt(i))>>>0;return h.toString(36)+s.length}
/* ---------- METAR / TAF text -> WMCore obs ---------- */
function grp(t){var o={},m;
 if(/(^| )CAVOK( |$)/.test(t)){o.vis=10;o.ceil=null;o.cavok=true}
 if((m=t.match(/(?:^| )(\d{3}|VRB)(\d{2,3})(?:G(\d{2,3}))?(KT|MPS)(?= |$)/))){var f=m[4]==='MPS'?1.944:1;o.wspd=Math.round(+m[2]*f);o.gust=m[3]?Math.round(+m[3]*f):null;o.vrb=m[1]==='VRB';o.wdir=o.vrb?null:+m[1]}
 if(!o.cavok){if((m=t.match(/(?:^| )(\d{4})(?:NDV)?(?= |$)/))&&!/^\d{4}\/\d{4}$/.test(m[1]))o.vis=m[1]==='9999'?10:Math.round(+m[1]/100)/10;
  else if((m=t.match(/(?:^| )(P?)(\d+(?:\/\d)?)SM(?= |$)/))){var fr=m[2].split('/'),v=fr.length>1?+fr[0]/+fr[1]:+fr[0];o.vis=Math.min(10,v*1.609)}
  var cl=[],r=/(?:^| )(FEW|SCT|BKN|OVC|VV)(\d{3}|\/\/\/)/g,x,any=false;while((x=r.exec(t))){any=true;if(/BKN|OVC|VV/.test(x[1])&&x[2]!=='///')cl.push(+x[2]*100)}
  if(cl.length)o.ceil=Math.min.apply(null,cl);else if(any||/(^| )(NSC|NCD|SKC|CLR)( |$)/.test(t))o.ceil=null}
 return o}
function metarObs(raw,obsMs){if(!raw)return null;var t=' '+raw.replace(/=/g,' ').split(/ (RMK|TEMPO|BECMG|NOSIG) /)[0]+' ',o=grp(t),m=raw.match(/ (\d{2})(\d{2})(\d{2})Z /);
 o.time=obsMs||(m?dayT(+m[1],+m[2],+m[3]):Date.now());var tm=raw.match(/ (M?\d{2})\/(M?\d{2})? /);if(tm)o.temp=+tm[1].replace('M','-');var q=raw.match(/ Q(\d{4})/);if(q)o.qnh=+q[1];o.raw=raw;return o}
function dayT(d,h,mi){var n=new Date(),y=n.getUTCFullYear(),mo=n.getUTCMonth(),t=Date.UTC(y,mo,d,h,mi||0);if(t-Date.now()>15*864e5)t=Date.UTC(y,mo-1,d,h,mi||0);else if(Date.now()-t>15*864e5)t=Date.UTC(y,mo+1,d,h,mi||0);return t}
function dh(s){return dayT(+s.slice(0,2),+s.slice(2,4)%24,0)+(+s.slice(2,4)===24?864e5/1:0)}
/** raw TAF -> {periods:[{from,to,...}]}; base + FM + BECMG (TEMPO/PROB are not the "current period"). */
function tafObs(raw){if(!raw)return null;var s=' '+raw.replace(/=/g,' ').replace(/\s+/g,' ')+' ',v=s.match(/ (\d{4})\/(\d{4}) /);if(!v)return null;
 var A=dh(v[1]),B=dh(v[2]),parts=s.slice(s.indexOf(v[0])+v[0].length).split(/ (?=FM\d{6}|BECMG |TEMPO |PROB\d{2} )/),P=[],st={},from=A;
 parts.forEach(function(p,i){p=' '+p.trim()+' ';var m;
  if(i===0){st=grp(p);P.push(mix({from:A,to:B},st));return}
  if((m=p.match(/^ FM(\d{2})(\d{2})(\d{2})/))){var t=dayT(+m[1],+m[2],+m[3]);P.forEach(function(q){if(q.to>t&&q.from<t)q.to=t});st=grp(p);P.push(mix({from:t,to:B},st));return}
  if((m=p.match(/^ BECMG (\d{4})\/(\d{4})/))){var g=grp(p.replace(m[0].trim(),'')),k;var ns=mix({},st);for(k in g)ns[k]=g[k];st=ns;P.push(mix({from:dh(m[1]),to:B},st))}});
 return{periods:P,raw:raw}}
function mix(a,b){for(var k in b)a[k]=b[k];return a}
/* ---------- old obsOf shape -> WMCore obs ---------- */
function fromOld(ob){if(!ob)return null;return{wdir:ob.wd==null?null:+ob.wd,vrb:!!ob.vrb,wspd:ob.ws,gust:ob.g||null,vis:ob.vis==null?undefined:ob.vis,
 ceil:ob.ceil,temp:ob.t,qnh:ob.qnh,time:ob.time,raw:ob.raw}}
function adOf(a){var c=a.cat;return{icao:a.ic,name:a.nm,lat:a.la,lon:a.lo,elev:a.el,iap:a.iap,
 airspace:c==='c'||c==='i'?'ctr':c==='u'?'other':c==='ctr'||c==='atz'||c==='other'?c:undefined,
 runways:(a.rw||[]).filter(function(r){return r&&r.true!=null}).map(function(r){return{id:r.id,hdg:+r.true}})}}
var R={};window.__wmR=R;
function run(ad,metar,taf,model,now){if(window.AD_CLASS&&AD_CLASS[ad.icao])ad.heliport=true;var w=K.pickWeather(metar,taf,model,now),r=K.evaluate(ad,w,prof(),now);r.icao=ad.icao;R[ad.icao]={r:r,t:now,w:w,ad:ad};return r}
function legacy(r,ob,a){var LVm={go:'go',caution:'caution',nogo:'nogo',none:'none'};var wd=r.wind;
 var why=r.status==='none'?r.why:r.whyShort+(r.source?' \u00b7 '+r.source+' '+K.util.sast(r.time):'');
 return{s:LVm[r.status],why:why,F:r.reasons.map(function(x){return{lv:x.severity,txt:x.text,k:x.check}}),
  wind:wd?{id:wd.id,hw:wd.hw,xw:wd.xw,gx:wd.gxw,a:Math.atan2(wd.xw,wd.hw)}:null,da:r.da,
  si:(a&&a.la!=null&&W.sunInfo)?W.sunInfo(a.la,a.lo,Date.now()):null,ob:ob,lim:r.minimums.xw.value,
  ac:K.util.aircraft(prof().aircraft),core:r}}
/* replaces the old engine everywhere WST.status is used (wst-main, wst-card, wst-common search dots) */
W.status=function(a,ob,acId,rules,P,now){now=now||Date.now();var S=window.WMST||{taf:{}},raw=ob;
 ob=freshOb(ob,now);
 /* Stale METAR dropped: still try a fresh model from the shared Open-Meteo copy so the card is not blank when a TAF is also missing. */
 if(!ob&&a&&S.om&&S.om[a.ic])ob=freshOb(W.obsOf(a,{metar:{},taf:S.taf||{},om:S.om}),now);
 var ad=adOf(a),met=ob&&ob.src==='off'?fromOld(ob):null,taf=tafObs((S.taf||{})[a.ic]||(raw&&raw.taf)||(ob&&ob.taf)),mod=ob&&ob.src==='model'?fromOld(ob):null;
 var r=overlay(run(ad,met,taf,mod,now),a,ob,now);R[ad.icao].r=r;return legacy(r,ob,a)};
/* any card (incl. Status page's hidden list and non-AIP strips) */
var $$=function(r,q){return Array.prototype.slice.call(r.querySelectorAll(q))};
function rws(c){return $$(c,'.rwd line.r').map(function(l){var dx=l.x2.baseVal.value-l.x1.baseVal.value,dy=l.y2.baseVal.value-l.y1.baseVal.value,h=(Math.atan2(dx,-dy)*180/Math.PI+360)%360;return[{id:String(Math.round(h/10)||36).padStart(2,'0'),hdg:h},{id:String(Math.round(((h+180)%360)/10)||36).padStart(2,'0'),hdg:(h+180)%360}]}).reduce(function(a,b){return a.concat(b)},[])}
function txt(c,q){var e=c.querySelector(q);return e?(e.textContent||'').trim():''}
function evalCard(c,now){now=now||Date.now();var ic=txt(c,'.icao'),C=window.WSTC,S=window.WMST;
 if(C&&C.AD&&C.AD[ic]&&S){var a=C.AD[ic];W.status(a,W.obsOf(a,S),null,null,null,now);var t=c.querySelector('.cp[data-p=taf] .mono');var t0=t;
  if(!S.taf[ic]&&t&&/^TAF/.test(t.textContent.trim())){var o=freshOb(W.obsOf(a,S),now);var S2={metar:S.metar,om:S.om||{},taf:{}};S2.taf[ic]=t0.textContent.trim();var o2=freshOb(W.obsOf(a,S2),now);R[ic].r=overlay(run(adOf(a),o&&o.src==='off'?fromOld(o):null,tafObs(t.textContent.trim()),o&&o.src==='model'?fromOld(o):null,now),a,o2,now)}
  return R[ic].r}
 var m=txt(c,'.cp[data-p=metar] .mono'),t2=txt(c,'.cp[data-p=taf] .mono'),la=c.querySelector('[data-la]'),cat=c.dataset.cat;
 var ad={icao:ic,lat:la?+la.dataset.la:null,lon:la?+la.dataset.lo:null,elev:null,iap:null,runways:rws(c),
  airspace:cat==='controlled'||cat==='international'?'ctr':cat==='uncontrolled'?'other':undefined};
 var met=/^(METAR|SPECI)\b/.test(m)?metarObs(m.replace(/^(METAR|SPECI) (COR )?/,'')):null;
 if(met){var ob=c.querySelector('[data-obs]');if(ob&&+ob.dataset.obs>1e9)met.time=+ob.dataset.obs*1000;if(!freshT(met.time,now))met=null}
 var mod=null;try{if(c.dataset.wxm){var d=JSON.parse(c.dataset.wxm);if(freshT(d.t,now))mod={wspd:d.w,gust:d.g,vis:d.v==null?undefined:d.v,ceil:d.c==null?null:d.c,vrb:true,wdir:null,time:+d.t}}}catch(e){} /* was time:now, which made any saved model look fresh */
 var rr=run(ad,met,/^TAF/.test(t2)?tafObs(t2):null,mod,now);
 if(met){var a2={ic:ic,la:ad.lat,lo:ad.lon,el:null,cat:ad.airspace==='ctr'?'c':'u',rw:ad.runways.map(function(x){return{id:x.id,true:x.hdg}}),heli:!ad.runways.length&&HELI.test((c.querySelector('h2,h3,.nm,.name')||{}).textContent||c.dataset.name||'')},S3={metar:{},taf:{},om:{}};
  S3.metar[ic]=awcOf(m.replace(/^(METAR|SPECI) (COR )?/,''),met.time);if(/^TAF/.test(t2))S3.taf[ic]=t2;rr=overlay(rr,a2,freshOb(W.obsOf(a2,S3),now),now);R[ic].r=rr}
 return rr}
window.WMB={prof:prof,evalCard:evalCard,metarObs:metarObs,tafObs:tafObs,results:R};
})();
