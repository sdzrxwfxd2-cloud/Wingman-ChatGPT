/* Main-page cards (approved 2026-10-21): no Model box, model weather on no-METAR cards (soft Model tag), Model tab default there, Vis/Sky decoded from the shown METAR, live sunrise/sunset pill. Model panels reuse the one batched Open-Meteo call (no per-card requests). */
(function(){const W=window.WST,S=window.WMST,C=window.WSTC;if(!W||!S)return;
const $$=(r,q)=>[...r.querySelectorAll(q)],LB={go:'DEPART',caution:'CAUTION',nogo:'NO DEPART',none:'No weather',noiap:'NO IFR APPROACH'};
const FCC={VFR:'#22C55E',MVFR:'#3B82F6',IFR:'#F80F3B',LIFR:'#C026D3'};
const css=`
html .card .cp[data-p=model]:not(#z):not(#y):not(#x){padding:0!important;background:none!important;box-shadow:none!important;border:0!important;border-radius:0!important;color:var(--tx)!important}
html .card .cp[data-p=model]:not(#z):not(#y):not(#x)>.mono{color:var(--tx3)!important;font:500 12px/1.4 -apple-system,sans-serif}
html .card .cp[data-p=model]:not(#z):not(#y):not(#x)>.mono::before{content:none}
html .card .cp[data-p=model] .mnote{color:var(--tx3)!important}
.card .temp .wmtag{display:none!important}
.card .wxd .wmtag{display:inline;margin-left:6px;padding:0;border:0;background:none;box-shadow:none;font:600 12.5px/1.2 -apple-system,sans-serif;letter-spacing:0;color:var(--tx3)}
.card .wxd .wmtag::before{content:none!important}
.card .fcb2 .fbadge.wmb{opacity:.82}
.card .wsun2{display:flex;align-items:center;gap:7px;height:30px;box-sizing:border-box;margin:-4px 0 14px;padding:0 11px 0 9px;border-radius:15px;background:var(--gl);box-shadow:inset 0 1px 0 var(--hl),inset 0 0 0 .5px var(--ln);font:500 11.5px/1 -apple-system,sans-serif;letter-spacing:-.01em;color:var(--tx2);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;min-width:0}
.card .wsun2 svg{width:15px;height:15px;flex:none}
.card .wfzl2{display:flex;align-items:center;gap:7px;height:30px;box-sizing:border-box;margin:-8px 0 14px;padding:0 11px 0 9px;border-radius:15px;background:var(--gl);box-shadow:inset 0 1px 0 var(--hl),inset 0 0 0 .5px var(--ln);font:500 10.5px/1 -apple-system,sans-serif;letter-spacing:-.02em;color:var(--tx2);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;min-width:0}
.card .wfzl2 svg{width:15px;height:15px;flex:none;filter:drop-shadow(0 0 3px rgba(200,210,230,.7)) drop-shadow(0 0 7px rgba(180,200,220,.4))}
.card .wfzl2 b{color:var(--tx);font-weight:600}
.card .wsun2 b{color:var(--tx);font-weight:600}
.card .wsun2 .cd{overflow:hidden;text-overflow:ellipsis;min-width:0}
.card .wsun2 .u{margin-left:auto;padding-left:4px;color:var(--tx3);font-size:10.5px;flex:none}.card .wsun2 .u .z{font-size:9.5px;letter-spacing:.02em}
@media (max-width:340px){.card .wsun2 .u .z{display:none}}`;
const st=document.createElement('style');st.id='wmcardprev';st.textContent=css;document.head.appendChild(st);
const z=n=>String(n).padStart(2,'0'),dd=w=>String(Math.round(w)%360).padStart(3,'0')+'°';
/* METAR decode for the Vis / Sky line */
function dec(raw){const R=' '+(raw||'').replace(/=/g,' ')+' ',cav=/ CAVOK /.test(R),vm=R.match(/ (\d{4})(?:NDV)? /),sm=R.match(/ (\d+(?:\/\d)?)SM /);
 let vis=cav||(vm&&vm[1]==='9999')?'10+ km':vm?(+vm[1]>=5000?Math.round(+vm[1]/1000):(+vm[1]/1000).toFixed(1))+' km':sm?sm[1]+' SM':'—';
 const L=[...R.matchAll(/ (FEW|SCT|BKN|OVC|VV)(\d{3}|\/\/\/)/g)].map(m=>m[1]+(m[2]==='///'?'':m[2]));
 const cl=L.find(x=>/^(BKN|OVC|VV)/.test(x)),nsc=R.match(/ (NSC|NCD|SKC|CLR) /);
 return{vis,sky:cav?'CAVOK':cl||L[0]||(nsc?nsc[1]:'—')}}
const isM=c=>/^(METAR|SPECI)\b/.test(((c.querySelector('.cp[data-p=metar] .mono')||{}).textContent||'').trim());
const lat=c=>{const m=c.querySelector('.cp[data-p=model]');return m&&m.dataset.la?[+m.dataset.la,+m.dataset.lo]:null};
const ic=c=>(c.querySelector('.icao')||{}).textContent;
/* runway true headings from the card diagram (for non-AIP strips) */
function rws(c){return $$(c,'.rwd line.r').map((l,i)=>{const dx=l.x2.baseVal.value-l.x1.baseVal.value,dy=l.y2.baseVal.value-l.y1.baseVal.value;const h=(Math.atan2(dx,-dy)*180/Math.PI+360)%360;return[{id:'~',true:h},{id:'~',true:(h+180)%360}]}).flat()}
/* model data for cards without a METAR: AIP ones come from WMST.om (live batch in wst-common); the rest in one batch per 100 */
const OM={},AT={};let busy=0,pendingPull=null;
/* one batched Open-Meteo request for the no-METAR cards on the visible page only (stale > 15 min, or forced by ↻) */
async function pull(force){if(!/^https?:/.test(location.protocol))return;if(busy){pendingPull=!!(pendingPull||force);return}if(!window.WMPAGE&&document.getElementById('list')){setTimeout(()=>pull(force),250);return} /* wait for the pager: only the visible page is fetched (641 cards) */busy=1;try{
 const now=Date.now(),seen={},Q=[],Qm=[];$$(document,'.card').forEach(c=>{const k=ic(c);if(seen[k]||!lat(c))return;if(window.WMPAGE&&!window.WMPAGE(k))return;if(!force&&AT[k]&&now-AT[k]<15*60e3)return;seen[k]=1;
  /* #352 v15: lightweight FZL for EVERY visible card (military / no-METAR / incomplete included) */
  Qm.push([k,lat(c)]);
  if(!isM(c)) Q.push([k,lat(c)]);});
 /* full model for no-METAR (own try so Qm still runs on rate-limit) */
 try{for(let i=0;i<Q.length;i+=100){const P=Q.slice(i,i+100);const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude='+P.map(p=>p[1][0]).join(',')+'&longitude='+P.map(p=>p[1][1]).join(',')+'&current=temperature_2m,dew_point_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,pressure_msl,cloud_cover_low,cloud_cover,cloud_base&hourly=freezing_level_height&forecast_hours=4&wind_speed_unit=kn&timezone=UTC',{cache:force?'no-store':'default'});if(!r.ok)throw new Error(r.status);const j=await r.json();
  [].concat(j).forEach((o,k)=>{if(o&&o.current){const id=P[k][0];AT[id]=now;if(C&&C.AD[id])S.om[id]=o;else OM[id]=o}})}}catch(e){}
 /* MT #352 v15: lightweight FZL-only fetch for every visible card (cached); separate try so it survives Q failures */
 try{for(let i=0;i<Qm.length;i+=100){const P=Qm.slice(i,i+100);const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude='+P.map(p=>p[1][0]).join(',')+'&longitude='+P.map(p=>p[1][1]).join(',')+'&current=temperature_2m&hourly=freezing_level_height&forecast_hours=4&wind_speed_unit=kn&timezone=UTC',{cache:force?'no-store':'default'});if(!r.ok)throw new Error(r.status);const j=await r.json();
  [].concat(j).forEach((o,k)=>{if(o&&(o.current||o.hourly)){const id=P[k][0];AT[id]=now;const prev=S.om[id]||OM[id];const prevCur=prev&&prev.current,nextCur=o.current;const current=(prevCur&&prevCur.wind_speed_10m!=null)?prevCur:(nextCur&&nextCur.wind_speed_10m!=null?nextCur:(prevCur||nextCur));const merged=prev?Object.assign({},prev,o,{hourly:Object.assign({},(prev.hourly||{}),(o.hourly||{})),elevation:o.elevation!=null?o.elevation:prev.elevation,current:current}):o;OM[id]=merged;if(S.om[id]||(C&&C.AD[id]))S.om[id]=merged}})}}catch(e){}
}finally{busy=0;const again=pendingPull;pendingPull=null;run();if(typeof window.applyS==='function')window.applyS();if(again!=null)setTimeout(()=>pull(!!again),0)}
}
window.WMCARD={pull};
function omOf(k){const a=S.om&&S.om[k],b=OM[k];if(!a)return b;if(!b)return a;const ah=a.hourly&&a.hourly.freezing_level_height,bh=b.hourly&&b.hourly.freezing_level_height;const hourly=(ah&&ah[0]!=null)?a.hourly:(bh||a.hourly);const elevation=a.elevation!=null?a.elevation:b.elevation;const ca=a.current,cb=b.current;const current=(ca&&ca.wind_speed_10m!=null)?ca:(cb&&cb.wind_speed_10m!=null?cb:(ca||cb));return Object.assign({},b,a,{hourly:hourly,elevation:elevation,current:current})}
function obM(k){const o=omOf(k);if(!o||!o.current)return null;return W.obsOf({ic:k},{metar:{},taf:{},om:{[k]:o}})}
function cat(ob){const v=ob.vis,c=ob.ceil;if(v==null)return null;const sm=v/1.609;const r=(c!=null&&c<500)||sm<1?'LIFR':(c!=null&&c<1000)||sm<3?'IFR':(c!=null&&c<=3000)||sm<=5?'MVFR':'VFR';return r}
function panel(c,o){const m=c.querySelector('.cp[data-p=model]');if(!m||!o||!o.current)return;const x=o.current;
 if(x.wind_speed_10m==null&&x.visibility==null&&x.pressure_msl==null)return;
 const SHORT='Open-Meteo model \u00b7 not an official observation';
 if(m.dataset.vt===x.time){const n=m.querySelector('.mnote');if(n&&n.textContent!==SHORT)n.textContent=SHORT;return}
 const l=(t,e)=>'<div class="mt2"><span>'+t+'</span><b>'+e+'</b></div>';
 m.innerHTML='<div class="mg2">'+l('Wind',String(Math.round(x.wind_direction_10m)).padStart(3,'0')+'° '+Math.round(x.wind_speed_10m)+' kt')+l('Gust',Math.round(x.wind_gusts_10m)+' kt')+l('Vis',x.visibility>=1e4?'10+ km':(x.visibility/1e3).toFixed(1)+' km')+l('Cloud',x.cloud_cover+'%')+l('Temp/Dew',Math.round(x.temperature_2m)+'°/'+Math.round(x.dew_point_2m)+'°')+l('QNH',Math.round(x.pressure_msl)+'')+'</div><small class="mnote">'+SHORT+'</small>';
 m.dataset.done=1;m.dataset.vt=x.time}
function fillModel(c,ob){const q=x=>c.querySelector(x),tp=q('.temp'),sp=c.querySelectorAll('.wxd span');
 if(tp){tp.style.color='';tp.innerHTML=ob.t!=null?Math.round(ob.t)+'<sup>°C</sup>':'—'}
 const g=ob.g&&ob.g-ob.ws>=10?' G'+ob.g:'';
 if(sp[0])sp[0].innerHTML='Wind <b class="num">'+(ob.ws<1?'Calm':dd(ob.wd)+' '+ob.ws+' kt'+g)+'</b>';
 if(sp[1])sp[1].innerHTML='Vis <b>'+(ob.vis==null?'—':ob.vis>=10?'10+ km':ob.vis.toFixed(1)+' km')+'</b> · '+(ob.ceil!=null?'Ceil <b>'+ob.ceil.toLocaleString('en-US')+' ft</b>':'Cloud <b>'+(ob.cc!=null?Math.round(ob.cc)+'%':'—')+'</b>');
 if(sp[2]){let qnh='QNH <b class="num">'+(ob.qnh!=null?Math.round(ob.qnh):'—')+'</b>'; const hasMetar=/METAR\s+[A-Z0-9]{4}/.test(((c.querySelector('.cp[data-p=metar] .mono')||{}).textContent)||''); const hasTaf=/TAF\s+[A-Z0-9]{4}/.test(((c.querySelector('.cp[data-p=taf] .mono')||{}).textContent)||''); if(!hasMetar&&!hasTaf)qnh+=' <span class="wmtag" title="Open-Meteo model weather · not an official observation">Model</span>'; sp[2].innerHTML=qnh;}
 const fc=q('.fcb2'),k=cat(ob);if(fc&&k){const vm=/^(VFR|MVFR)$/.test(k)?'VMC':'IMC';
  fc.innerHTML='<span class="fbadge wmb" style="--c:'+FCC[k]+'" title="From model data, not a METAR"><i></i>'+k+'</span><span class="fbadge wmb" style="--c:'+(vm==='VMC'?'#22C55E':'#F80F3B')+'"><i></i>'+vm+'</span><button class="inote" data-t="Flight conditions (model)" data-n="No METAR here, so the flight category is estimated from Open-Meteo model visibility and cloud base (VFR &gt; 3000 ft and &gt; 5 SM; MVFR 1000–3000 ft / 3–5 SM; IFR 500–999 ft / 1–3 SM; LIFR &lt; 500 ft / &lt; 1 SM). Model data is not an official observation. The pilot in command decides." aria-label="More info">i</button>'}
 c.dataset.model='1'}
/* sunrise / sunset pill */
const TZF=new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Johannesburg',hour:'2-digit',minute:'2-digit'}),tz=t=>TZF.format(new Date(t)); /* speed: one cached formatter, same output */
const du=m=>{m=Math.max(0,Math.round(m/6e4));const H=Math.floor(m/60);return H?H+' h'+(m%60?' '+m%60+' min':''):m+' min'};
const SUN='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.6" fill="#F5A524"/><g stroke="#F5A524" stroke-width="1.8" stroke-linecap="round"><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M5.3 18.7l1.5-1.5M17.2 6.8l1.5-1.5"/></g></svg>';
const MOON='<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="#A9B8E8"/></svg>';
function sun(c){const p=lat(c);if(!p)return;let el=c.querySelector('.wsun2');if(!el){el=document.createElement('div');el.className='wsun2';const w=c.querySelector('.wxrow');if(!w)return;w.after(el)}
 const n=Date.now(),s=W.sunInfo(p[0],p[1],n);if(!s)return;const day=n>=s.rise&&n<s.set;
 const cd=day?'Sunset in '+du(s.set-n):'Sunrise in '+du((n<s.rise?s.rise:s.nextRise)-n);
 const h=(day?SUN:MOON)+'<span class="cd"><b>'+(day?'Day':'Night')+'</b> · '+cd+'</span><span class="u">↑'+tz(n<s.rise||day?s.rise:s.nextRise)+' ↓'+tz(s.set)+'<span class="z"> SAST</span></span>';
 if(el._h!==h&&el.innerHTML!==h)el.innerHTML=h;el._h=h} /* speed: skip re-serialising unchanged pill */
function fzl(c){const o=omOf(ic(c));
 let arr=(o&&o.hourly&&o.hourly.freezing_level_height)||[];
 let times=(o&&o.hourly&&o.hourly.time)||[];
 let fl=arr[0], elev=o&&o.elevation;
 let next=arr.length>1&&arr[1]!=null?arr[1]:null;
 if(fl==null){const p=lat(c),x=p&&window.__wmFzlAt&&window.__wmFzlAt(p[0],p[1]);if(x&&x.fl!=null){fl=x.fl;if(elev==null)elev=x.elev;if(x.next!=null)next=x.next;if(x.time&&!times[0])times=[x.time]}}
 let el=c.querySelector('.wfzl2:not(.wda2)');const sunEl=c.querySelector('.wsun2');
 if(fl==null){if(el)el.remove();return}
 const FT=3.280839895;
 const amsl=Math.round(fl*FT);
 const surface=elev!=null&&fl<=elev;
 const agl=elev!=null?Math.max(0,Math.round((fl-elev)*FT)):null;
 let trend='';
 if(next!=null){
   const d=next-fl;
   if(d>15) trend='↑';
   else if(d<-15) trend='↓';
   else trend='→';
 }
 const t0=times[0];
 const when=t0?tz(new Date(/Z$|[+-]\d{2}:?\d{2}$/.test(t0)?t0:t0+'Z').getTime()):'';
 const ICE='<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="#DCE6F5" stroke-width="1.6" stroke-linecap="round"><path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11"/><path d="M12 6.2l2.2-2.2M12 6.2L9.8 4M12 17.8l2.2 2.2M12 17.8L9.8 20M6.8 9.2L4 8.2M6.8 9.2L5.2 11.8M17.2 9.2L20 8.2M17.2 9.2l1.6 2.6M6.8 14.8L4 15.8M6.8 14.8L5.2 12.2M17.2 14.8L20 15.8M17.2 14.8l1.6-2.6"/></g></svg>';
 const warn=surface?'<span class="fz-warn">Icing from surface</span>':'';
 const main=surface
   ? ('<span class="cd"><b>FZL</b> · '+warn+'</span>')
   : (agl!=null
      ? ('<span class="cd"><b>FZL</b> · '+agl.toLocaleString('en-US')+' ft AGL<span class="fz-amsl"> · '+amsl.toLocaleString('en-US')+' ft AMSL</span></span>')
      : ('<span class="cd"><b>FZL</b> · '+amsl.toLocaleString('en-US')+' ft AMSL</span>'));
 const meta='<span class="fz-meta">'+(when?when+' SAST':'')+(trend?'<span class="fz-trend" aria-label="trend">'+trend+'</span>':'')+'</span>';
 const h=ICE+main+meta;
 if(!el){el=document.createElement('div');el.className='wfzl2';el.title='Freezing level (0°C) from Open-Meteo model';
  if(sunEl)sunEl.after(el);else{const w=c.querySelector('.wxrow');if(!w)return;w.after(el)}}
 if(el._h!==h){el.innerHTML=h;el._h=h}}


function daPill(c){const k=ic(c),r10=n=>Math.round(n/10)*10,ft=n=>n.toLocaleString('en-US');
 const rec=window.WMB&&WMB.results&&WMB.results[k];
 const ad=(C&&C.AD&&C.AD[k])||(rec&&rec.ad)||null;
 const elev=ad&&(ad.el!=null?+ad.el:ad.elev!=null?+ad.elev:null);
 const used=rec&&rec.r&&((rec.r.v2&&rec.r.v2.weatherUsed)||rec.r.weatherUsed);
 let t=used&&used.temp!=null?+used.temp:(used&&used.t!=null?+used.t:null);
 let qnh=used&&used.qnh!=null?+used.qnh:null;
 let dA=rec&&rec.r&&rec.r.da!=null?+rec.r.da:null;
 if(t==null){const raw=((c.querySelector('.cp[data-p=metar] .mono')||{}).textContent||'');
  const tm=raw.match(/\s(M?\d{2})\/(M?\d{2}|\/\/)(?:\s|$)/);if(tm)t=(tm[1][0]==='M'?-1:1)*+tm[1].replace('M','');
  const qm=raw.match(/\sQ(\d{4})\b/);if(qnh==null&&qm)qnh=+qm[1]}
 if(t==null){const o=omOf(k);if(o&&o.current&&o.current.temperature_2m!=null){t=+o.current.temperature_2m;if(qnh==null&&o.current.pressure_msl!=null)qnh=+o.current.pressure_msl}}
 let el=c.querySelector('.wda2');
 if(t==null||elev==null||!isFinite(elev)){if(el)el.remove();return}
 if(dA==null&&window.GACoreV2&&GACoreV2.da)dA=GACoreV2.da(elev,t,qnh==null?1013:qnh);
 if(dA==null||!isFinite(dA)){if(el)el.remove();return}
 const above=dA-elev,lim=(window.GACoreV2&&GACoreV2.RULES&&GACoreV2.RULES.policy&&GACoreV2.RULES.policy.daAboveFt)||2500;
 const warn=above>lim,daR=r10(dA),abR=r10(Math.abs(above));
 const MTN='<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="#DCE6F5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19L8.5 7.5 12 14.2 15.4 8.5 21 19"/></g></svg>';
 const main=warn
   ?('<span class="cd"><b>DA</b> · <span class="fz-warn">'+ft(abR)+' ft above field</span></span><span class="fz-meta">'+ft(daR)+' ft AMSL</span>')
   :('<span class="cd"><b>DA</b> · '+ft(abR)+' ft '+(above<0?'below':'above')+' field<span class="fz-amsl"> · '+ft(daR)+' ft AMSL</span></span>');
 const h=MTN+main;
 const fzlEl=c.querySelector('.wfzl2:not(.wda2)'),sunEl=c.querySelector('.wsun2');
 if(!el){el=document.createElement('div');el.className='wfzl2 wda2';el.title='Density altitude from temperature and QNH';
  if(fzlEl)fzlEl.after(el);else if(sunEl)sunEl.after(el);else{const w=c.querySelector('.wxrow');if(!w)return;w.after(el)}}
 else if(fzlEl&&el.previousElementSibling!==fzlEl)fzlEl.after(el);
 if(el._h!==h){el.innerHTML=h;el._h=h}}

function run(){const P=C&&C.prof(C.sel()),sl=C&&C.sel(),now=Date.now();
 $$(document,'.card').forEach(c=>{const k=ic(c);
  if(isM(c)){const t=c.querySelector('.cp[data-p=metar] .mono').textContent,d=dec(t),sp=c.querySelectorAll('.wxd span');if(sp[1]){const h='Vis <b>'+d.vis+'</b> · Sky <b>'+d.sky+'</b>';if(sp[1].innerHTML!==h)sp[1].innerHTML=h}}
  else{const ob=obM(k);panel(c,omOf(k));const mn=c.querySelector('.cp[data-p=model] .mnote');if(mn){const SHORT='Open-Meteo model \u00b7 not an official observation';if(mn.textContent!==SHORT&&/official observation|older copy|official weather report/i.test(mn.textContent))mn.textContent=SHORT}if(ob){fillModel(c,ob);
    if(C&&!C.AD[k]&&P&&!window.WMF){/* wmgo-reason-writer: wm-final is the single writer of data-s/badge/.why when loaded */const r=W.status({ic:k,la:lat(c)[0],lo:lat(c)[1],el:null,rw:rws(c)},ob,sl.ac,sl.rules,P,now);if(r&&r.s!=='none'){const s=r.s==='noiap'?'nogo':r.s;c.dataset.s=s;const b=c.querySelector('.badge');if(b)b.textContent=LB[r.s];const w=c.querySelector('.why');if(w)w.innerHTML='<b>'+LB[r.s]+'</b> · '+String(r.why).replace(/ on RWY ~/g,'').replace(/[<>&]/g,'')}}}
   const sw=c.querySelector('.csw');if(sw&&!c.dataset.mtab){c.dataset.mtab=1;sw.dataset.init='model';if(sw._set){sw._set('model');c.querySelectorAll('.cp').forEach(e=>e.classList.toggle('on',e.dataset.p==='model'))}}}
  sun(c);fzl(c);daPill(c)});
 if(window.WMLIST){window.WMLIST.tiles();return}const n={go:0,caution:0,nogo:0};$$(document,'.card').forEach(c=>{if(n[c.dataset.s]!=null)n[c.dataset.s]++});
 if(window.WM_COUNTS)Object.assign(n,WM_COUNTS());$$(document,'#tiles .tile').forEach(t=>{const k=t.querySelector('.n');if(k&&n[t.dataset.s]!=null)k.textContent=n[t.dataset.s]})}
/* no-METAR cards: tab strip opens on Model (before the lazy swInit runs) */
$$(document,'.card').forEach(c=>{if(!isM(c)){const sw=c.querySelector('.csw');if(sw)sw.dataset.init='model'}});
const o=window.applyS;window.applyS=function(){try{o&&o()}catch(e){}run()};
document.addEventListener('wst:data',()=>run());document.addEventListener('wm:page',()=>pull());addEventListener('pageshow',run);setInterval(()=>{document.hidden||run()},60e3)/*5B*/;document.addEventListener("visibilitychange",()=>{document.hidden||run()});setInterval(()=>pull(),15*60e3);
run();setTimeout(()=>pull(),0)})();
