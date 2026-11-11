/* Aerodrome page: day/night rows inside the existing General section (SAST, UTC underneath). */
(function(){const W=window.WST,a=window.WSTAD;if(!W||!a)return;
const kv=[...document.querySelectorAll('h4.lbl')].find(h=>h.textContent.trim()==='General');const box=kv&&kv.parentNode.querySelector('.kv');if(!box)return;
const tz=t=>new Date(t).toLocaleTimeString('en-GB',{timeZone:'Africa/Johannesburg',hour:'2-digit',minute:'2-digit'}),tu=t=>new Date(t).toISOString().slice(11,16)+'Z';
const d=m=>{m=Math.max(0,Math.round(m/6e4));const H=Math.floor(m/60);return H?H+' h'+(m%60?' '+m%60+' min':''):m+' min'};
const row=(k,v)=>'<div class="wdn"><span>'+k+'</span><span>'+v+'</span></div>',T=t=>tz(t)+' SAST<small>'+tu(t)+'</small>';
function draw(){const n=Date.now(),s=W.sunInfo(a.la,a.lo,n),day=!s.isNight;
 const cd=n<s.set?'Sunset in '+d(s.set-n):n<s.nightFrom?'Night in '+d(s.nightFrom-n):'Sunrise in '+d(s.nextRise-n);
 const ic=day?'<svg class="wdi" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#F5A524"/></svg>':'<svg class="wdi" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="#A9B8E8"/></svg>';
 box.querySelectorAll('.wdn').forEach(x=>x.remove());
 box.insertAdjacentHTML('beforeend',row('Now',ic+(day?'Day':'Night')+'<small>'+cd+'</small>')+row('Sunrise',T(s.rise))+row('Sunset',T(s.set))+row('Civil twilight',tz(s.cr)+' – '+tz(s.cs)+' SAST<small>'+tu(s.cr)+' – '+tu(s.cs)+'</small>')+row('Night (CAR)','from '+T(s.nightFrom)))}
draw();/*5B*/((f,t)=>{let miss=0;setInterval(()=>{if(document.hidden){miss=1;return}f()},t);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&miss){miss=0;f()}})})(draw,60e3);
const g=kv.parentNode.querySelector('.gsub');if(g&&!g.dataset.wdn){g.dataset.wdn=1;g.insertAdjacentHTML('beforeend',' Sun times computed offline from the aerodrome position (±2 min). Night per CAR Part 1: 15 min after sunset to 15 min before sunrise.')}})();

/* 30 Oct 2026 (MT): the "Can I go?" box uses the same rule engine as the main page (WST.status, docs/ENGINE_POLICY.md)
   instead of the page's simple METAR check, and the weather box shows "Cloud height not reported" for BKN/OVC///. */
(function(){const W=window.WST,A=window.WSTAD||{},ME=(document.currentScript&&document.currentScript.src)||'../wst/wst-ad.js';if(!W||!W.status)return;const $=q=>document.querySelector(q);
const ic=((location.pathname.match(/\/([A-Z0-9-]+)\.html$/i)||[])[1]||'').toUpperCase();if(!ic||!$('#verd'))return;
const LB={go:'GO',caution:'CAUTION',nogo:'NO-GO',none:'NO DATA'},HELI=/heli(?:port|pad|stop)?\b|hospital|\bHP\b/i,LS=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
function dayT(d,h,mi){const n=new Date();let t=Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),d,h,mi);if(t>Date.now()+864e5)t=Date.UTC(n.getUTCFullYear(),n.getUTCMonth()-1,d,h,mi);return t}
function awc(raw){let t=' '+raw.replace(/=/g,' ').replace(/^(METAR|SPECI) (COR )?/,'').split(/ (?:TEMPO|BECMG|NOSIG|RMK) /)[0]+' ',o={rawOb:raw,clouds:[]},m;
 o.obsTime=(m=/ (\d{2})(\d{2})(\d{2})Z /.exec(t))?dayT(+m[1],+m[2],+m[3])/1000:null;
 if((m=/ (\d{3}|VRB|\/\/\/)(\d{2}|\/\/)(?:G(\d{2}))?KT /.exec(t))){o.wdir=m[1]==='VRB'?'VRB':m[1]==='///'?null:+m[1];o.wspd=m[2]==='//'?null:+m[2];o.wgst=m[3]?+m[3]:null}
 if(/ CAVOK /.test(t))o.visib='6+';else if((m=/KT (?:\d{3}V\d{3} )?(\d{4})(?:NDV)? /.exec(t))){const v=+m[1];o.visib=v>=9999?'6+':v/1609.344}
 const r=/ (FEW|SCT|BKN|OVC|VV)(\d{3}|\/\/\/)(CB|TCU)?(?= )/g;let x;while((x=r.exec(t)))o.clouds.push({cover:x[1]==='VV'?'OVX':x[1],base:x[2]==='///'?null:+x[2]*100});
 if((m=/ (M?\d{2})\/(M?\d{2}) /.exec(t))){o.temp=+m[1].replace('M','-');o.dewp=+m[2].replace('M','-')}
 if((m=/ Q(\d{4}) /.exec(t)))o.altim=+m[1];return o}
function adRec(){const S=window.WMST;const a=S&&S.ads&&S.ads.find(x=>x.ic===ic);if(a)return a;
 const f=window.FS_D&&FS_D.a&&FS_D.a.find(x=>x[0]===ic),dec=(()=>{let b=null,bd=1e9;for(const x of (S&&S.ads)||[]){const d=(x.la-A.la)**2+(x.lo-A.lo)**2;if(d<bd){bd=d;b=x}}return b?b.dec:-22})();
 const rw=f&&f[6]?f[6].map(d=>({id:d,true:((+d.replace(/\D/g,'')*10+dec)%360+360)%360})):[];
 return{ic,nm:f?f[1]:ic,la:A.la,lo:A.lo,el:null,cat:f&&(f[4]==='i'||f[4]==='c')?'c':'u',iap:false,rw,heli:!rw.length&&HELI.test(f?f[1]:document.title)}}
let busy=0;
function run(){if(busy)return;const rm=$('#s-wx .rawb[data-r=metar]'),rt=$('#s-wx .rawb[data-r=taf]'),raw=rm?rm.textContent.trim():'';if(!/^(METAR|SPECI) /.test(raw))return;
 const ad=adRec(),S={metar:{},taf:{},om:{}};S.metar[ic]=awc(raw);const tf=rt?rt.textContent.trim():'';if(/^TAF /.test(tf))S.taf[ic]=tf;
 const lv=LS('wm-lvl')==='ppln'?'ppl':LS('wm-lvl'),P=Object.assign({},W.PRE[lv]||W.PRE.cpl);if(LS('wm-night')!=null)P.night=LS('wm-night')==='1'?1:0;
 let r;try{r=W.status(ad,W.obsOf(ad,S),LS('wm-ac')||'C172',LS('wm-rules')==='ifr'?'ifr':'vfr',P,Date.now())}catch(e){return}
 busy=1;try{const v=$('#verd');v.dataset.s=r.s;$('#vs').textContent=LB[r.s]||r.s;const why=String(r.why||'').replace(/ · METAR.*$/,'');
  $('#vw').textContent=r.s==='go'?'Within your limits: '+why+'.':r.s==='none'?why:'Because '+(r.F||[]).filter(f=>f.lv===r.s).map(f=>f.txt).join('; ')+'.';
  const row=[...v.querySelectorAll('.vsuit .kv>div')].find(d=>/^Status/.test(d.firstChild.textContent));if(row){row.lastChild.textContent=LB[r.s];row.lastChild.style.color='var(--'+(r.s==='nogo'?'nogo':r.s==='caution'?'cau':'go')+')'}
  const cnr=(r.F||[]).some(f=>f.k==='cnr');document.querySelectorAll('#s-wx .wcnr').forEach(e=>e.remove());
  if(cnr){const c=[...document.querySelectorAll('#s-wx .pane[data-p=metar] .wxg>div')].find(d=>(d.querySelector('.lbl')||{}).textContent==='Cloud');
   if(c)c.querySelector('b').insertAdjacentHTML('beforeend','<small class="wcnr" style="display:block;color:var(--nogo,#F80F3B);font-weight:600">Cloud height not reported</small>');
   v.querySelector('#vw').insertAdjacentHTML('afterend','<p class="wcnr" style="color:var(--nogo,#F80F3B);font-weight:600;margin:4px 0 0">Cloud height not reported</p>')}
 }finally{setTimeout(()=>{busy=0},0)}}
window.wstAdRun=run;
const go=()=>{run();const mo=new MutationObserver(()=>{if(!busy)setTimeout(run,0)});const s=$('#s-wx');if(s)mo.observe(s,{subtree:true,childList:true,characterData:true})};
if(!window.WMST){const sc=document.createElement('script');sc.src=ME.replace(/wst-ad\.js.*$/,'wst-data.js?v=82b2ceb849');sc.onload=sc.onerror=go;document.head.appendChild(sc)}else go();
})();

/* 30 Oct 2026 (MT): heliport/helipad pages. No GO / CAUTION / NO-GO verdict: the "Can I go?" box shows a steady grey HELIPORT or HELIPAD pill (AD_CLASS helistop = HELIPAD),
   a helipad sign (inline SVG, theme colours) and model weather from Open-Meteo for emergency reference only. */
(function(){const RUN=()=>{const $=q=>document.querySelector(q),ic=((location.pathname.match(/\/([A-Z0-9-]+)\.html$/i)||[])[1]||'').toUpperCase(),v=$('#verd');if(!ic||!v)return;
const HELI=/heli(?:port|pad|stop)?\b|hospital|\bHP\b/i,f=window.FS_D&&FS_D.a&&FS_D.a.find(x=>x[0]===ic);if(!f||(f[6]||[]).length||!HELI.test(f[1]))return;
const NOTE='Model weather, not an official report. For emergency reference only.',A=window.WSTAD||{},k=x=>x==null?'\u2014':Math.round(x);
const STOPS={'ZA-0140':1,'ZA-0167':1,'ZA-0170':1,'ZA-0171':1,'ZA-0172':1,'ZA-0173':1,'ZA-0174':1,'ZA-0175':1,'ZA-0202':1,'ZA-0203':1,'ZA-0206':1,'ZA-0207':1,'ZA-0208':1,'ZA-0209':1,'ZA-0211':1,'ZA-0213':1,'ZA-0214':1,'ZA-0290':1,'ZA-0291':1,'ZA-0292':1,'ZA-0311':1,'ZA-0312':1,'ZA-0318':1,'ZA-0319':1,'ZA-0356':1,'ZA-0357':1};
const LAB=((window.AD_CLASS||{})[ic]==='helistop'||STOPS[ic])?'HELIPAD':'HELIPORT';
const st=document.createElement('style');st.textContent='#verd[data-s=heli] #vs{background:color-mix(in srgb,var(--tx3,#8E8E93) 22%,transparent)!important;color:var(--tx2,#8E8E93)!important;animation:none!important;font:700 13px/1 -apple-system,sans-serif!important;letter-spacing:.08em;padding:7px 12px;border-radius:999px}#verd[data-s=heli],#verd[data-s=heli] *{animation:none!important}'+
 '.hdia{display:block;width:200px;height:200px;margin:4px auto 14px}.hdia .rwring{fill:none;stroke:var(--ln)}.hdia .rwna{fill:var(--acc)}.hdia .rwn{fill:var(--tx3);font:600 9px -apple-system,sans-serif;text-anchor:middle}svg .hp circle.hp-d{fill:var(--tx);fill-opacity:.82;stroke:none}svg .hp circle.hp-e{fill:none;stroke:var(--bg);stroke-opacity:.9;stroke-width:.8;stroke-dasharray:2.6 2.2}svg .hp circle.hp-t{fill:none;stroke:var(--bg);stroke-width:2.4}svg .hp .hp-h{fill:none;stroke:var(--bg);stroke-width:4;stroke-linecap:butt;stroke-linejoin:miter}svg .hp text.hp-n{fill:var(--bg);fill-opacity:.85;font:700 6.5px -apple-system,sans-serif;text-anchor:middle;letter-spacing:0}'+
 '.hwx{margin-top:10px}.hwx .g{display:grid;grid-template-columns:auto auto;gap:4px 14px;font:500 13px/1.3 -apple-system,sans-serif;color:var(--tx2)}.hwx .g .v{color:var(--tx);font-variant-numeric:tabular-nums}.hnote{margin:8px 0 0;font:500 11.5px/1.35 -apple-system,sans-serif;color:var(--tx3)}';
document.head.appendChild(st);
const PAD='<svg class="hdia" viewBox="-110 -110 220 220" role="img" aria-label="Helipad diagram"><circle r="106" class="rwring"/><path d="M0 -104 L4 -95 L-4 -95Z" class="rwna"/><g transform="scale(2.74)"><g class="hp"><circle class="hp-d" r="35"/><circle class="hp-e" r="31.5"/><circle class="hp-t" r="20.5"/><path class="hp-h" d="M-7.5 -12V12M7.5 -12V12M-7.5 0H7.5"/><text class="hp-n" y="-23.6">N</text></g></g></svg>';
let wx='<div class="g"><span>Model weather</span><span class="v">loading\u2026</span></div>',busy=0;
function paint(){if(busy)return;busy=1;v.dataset.s='heli';const s=$('#vs');if(s&&s.textContent!==LAB)s.textContent=LAB;const w=$('#vw');if(w&&w.style.display!=='none')w.style.display='none';
 let b=v.querySelector('.hwx');if(!b){v.insertAdjacentHTML('beforeend','<div class="hwx"></div>');b=v.querySelector('.hwx')}const h=PAD+wx;if(b.innerHTML!==h)b.innerHTML=h;setTimeout(()=>{busy=0},0)}
function load(){const la=A.la,lo=A.lo;if(la==null)return;
 fetch('https://api.open-meteo.com/v1/forecast?latitude='+la+'&longitude='+lo+'&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,cloud_cover,pressure_msl&wind_speed_unit=kn').then(r=>r.json()).then(j=>{const x=j.current;if(!x)throw 0;
  wx='<div class="g"><span>Wind</span><span class="v">'+String(k(x.wind_direction_10m)).padStart(3,'0')+'\u00b0 '+k(x.wind_speed_10m)+' kt, gust '+k(x.wind_gusts_10m)+'</span><span>Visibility</span><span class="v">'+(x.visibility==null?'\u2014':(x.visibility>=10000?'10+ km':(x.visibility/1000).toFixed(1)+' km'))+'</span><span>Cloud cover</span><span class="v">'+k(x.cloud_cover)+'%</span><span>Temp / QNH</span><span class="v">'+k(x.temperature_2m)+'\u00b0C / '+k(x.pressure_msl)+'</span><span>Source</span><span class="v">Open-Meteo model</span></div>';busy=0;paint()}).catch(()=>{wx='<div class="g"><span>Model weather</span><span class="v">unavailable</span></div>';busy=0;paint()})}
const lb=document.querySelector('#s-wx .boxhd .lbl');if(lb)lb.textContent=ic+' \u00b7 model only';paint();new MutationObserver(()=>{if(!busy)setTimeout(paint,0)}).observe(v,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-s']});load();setInterval(load,15*60e3)};if(document.readyState==='complete')RUN();else addEventListener('load',RUN)})();

/* MT t2148: Depart / Land words on the aerodrome page too (words only, loads wst/phase.js; bump ?v= with phase.js) */
;(function(){try{var c=document.currentScript,s=document.createElement("script");s.src=new URL("phase.js?v=c6f8a40774",c&&c.src||location.href).href;document.head.appendChild(s)}catch(e){}})();

/* Model page display cleanup (10 Nov 2026, MT t1104u / t1113u): one short
   forecast disclaimer, show FZL on model-only pages, and show a north-circle
   diagram when no published runway data exists. Keep the #omk model boxes.
   Display only — does not change engine logic. */
(function(){
  var SHORT='Open-Meteo model \u00b7 not an official observation';
  var DISC=/\s*[·]\s*Model estimate only [\u2014\-]+ not an official weather report\.?/g;
  if(!document.getElementById('wm-model-clean-css')){
    var st=document.createElement('style');st.id='wm-model-clean-css';
    st.textContent='#s-wx .wfzl2{display:flex;align-items:center;gap:7px;min-height:30px;box-sizing:border-box;margin:10px 16px 4px;padding:0 11px 0 9px;border-radius:15px;background:var(--gl);box-shadow:inset 0 1px 0 var(--hl),inset 0 0 0 .5px var(--ln);font:500 10.5px/1 -apple-system,sans-serif;letter-spacing:-.02em;color:var(--tx2);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;min-width:0}'+
      '#s-wx .wfzl2 svg{width:15px;height:15px;flex:none;filter:drop-shadow(0 0 3px rgba(200,210,230,.7)) drop-shadow(0 0 7px rgba(180,200,220,.4))}'+
      '#s-wx .wfzl2 b{color:var(--tx);font-weight:600}'+
      '#s-wx .wfzl2 .fz-amsl{font-weight:500;color:var(--tx3)}'+
      '#s-wx .wfzl2 .fz-meta{margin-left:auto;padding-left:8px;flex:none;display:inline-flex;align-items:center;gap:5px;color:var(--tx3)}'+
      '#s-wx .wfzl2 .fz-trend{font-size:12px;line-height:1;color:var(--tx2)}'+
      '#s-wx .wfzl2 .fz-warn{color:#FCA5A5;font-weight:600}';
    document.head.appendChild(st);
  }
  function tidyNote(){
    document.querySelectorAll('.pane[data-p=model] > p.gsub').forEach(function(p){
      var t=p.textContent||'';
      if(t===SHORT) return;
      if(/official observation|Open-Meteo model data|grid point|official weather report/i.test(t)) p.textContent=SHORT;
    });
  }
  function stripVw(){
    var vw=document.getElementById('vw'); if(!vw) return;
    var next=String(vw.textContent||'').replace(DISC,'').replace(/\s{2,}/g,' ').replace(/\s+([.;])/g,'$1').trim();
    if(next!==vw.textContent) vw.textContent=next;
  }
  tidyNote(); stripVw();
  setTimeout(tidyNote,400); setTimeout(tidyNote,1600);
  var verd=document.getElementById('verd');
  if(verd&&window.MutationObserver) new MutationObserver(function(){ stripVw(); tidyNote(); }).observe(verd,{subtree:true,childList:true,characterData:true});
  var modelPane=document.querySelector('.pane[data-p=model]');
  if(modelPane&&window.MutationObserver) new MutationObserver(tidyNote).observe(modelPane,{subtree:true,childList:true,characterData:true});

  var modelOnly=!!(verd&&verd.getAttribute('data-noobs')==='1')||/no METAR/i.test(((document.querySelector('#s-wx .boxhd .lbl')||{}).textContent)||'');
  var A=window.WSTAD||{};
  var ll=window.WMLL||[A.la,A.lo];
  var la=ll&&ll[0], lo=ll&&ll[1];
  var tzF=new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Johannesburg',hour:'2-digit',minute:'2-digit'});
  var tz=function(t){return tzF.format(new Date(t))};
  var ICE='<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="#DCE6F5" stroke-width="1.6" stroke-linecap="round"><path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11"/><path d="M12 6.2l2.2-2.2M12 6.2L9.8 4M12 17.8l2.2 2.2M12 17.8L9.8 20M6.8 9.2L4 8.2M6.8 9.2L5.2 11.8M17.2 9.2L20 8.2M17.2 9.2l1.6 2.6M6.8 14.8L4 15.8M6.8 14.8L5.2 12.2M17.2 14.8L20 15.8M17.2 14.8l1.6-2.6"/></g></svg>';

  function paintFzl(src){
    if(!src||src.fl==null) return;
    var fl=src.fl, elev=src.elev, next=src.next, t0=src.time;
    var FT=3.280839895, amsl=Math.round(fl*FT);
    var surface=elev!=null&&fl<=elev;
    var agl=elev!=null?Math.max(0,Math.round((fl-elev)*FT)):null;
    var trend='';
    if(next!=null){ var d=next-fl; trend=d>15?'\u2191':d<-15?'\u2193':'\u2192'; }
    var when=t0?tz(new Date(/Z$|[+-]\d{2}:?\d{2}$/.test(t0)?t0:t0+'Z').getTime()):'';
    var warn=surface?'<span class="fz-warn">Icing from surface</span>':'';
    var main=surface
      ? ('<span class="cd"><b>FZL</b> \u00b7 '+warn+'</span>')
      : (agl!=null
        ? ('<span class="cd"><b>FZL</b> \u00b7 '+agl.toLocaleString('en-US')+' ft AGL<span class="fz-amsl"> \u00b7 '+amsl.toLocaleString('en-US')+' ft AMSL</span></span>')
        : ('<span class="cd"><b>FZL</b> \u00b7 '+amsl.toLocaleString('en-US')+' ft AMSL</span>'));
    var meta='<span class="fz-meta">'+(when?when+' SAST':'')+(trend?'<span class="fz-trend" aria-label="trend">'+trend+'</span>':'')+'</span>';
    var el=document.querySelector('#s-wx .wfzl2');
    if(!el){
      el=document.createElement('div'); el.className='wfzl2';
      el.title='Freezing level (0\u00b0C) from Open-Meteo model';
      if(verd&&verd.parentNode) verd.insertAdjacentElement('afterend', el);
      else { var wx=document.getElementById('s-wx'); if(wx) wx.insertBefore(el, wx.firstChild); else return; }
    }
    el.innerHTML=ICE+main+meta;
  }

  function loadFzl(){
    if(!modelOnly) return;
    var hit= (la!=null && window.__wmFzlAt) ? window.__wmFzlAt(la, lo) : null;
    if(hit) paintFzl(hit);
    if(la==null||lo==null) return;
    fetch('https://api.open-meteo.com/v1/forecast?latitude='+la+'&longitude='+lo+'&current=temperature_2m&hourly=freezing_level_height&forecast_hours=4&wind_speed_unit=kn&timezone=UTC')
      .then(function(r){ return r.json(); })
      .then(function(j){
        var arr=(j.hourly&&j.hourly.freezing_level_height)||[];
        var times=(j.hourly&&j.hourly.time)||[];
        if(arr[0]==null) return;
        paintFzl({fl:arr[0], elev:j.elevation, next:arr[1], time:times[0]});
      }).catch(function(){});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(loadFzl, 200); });
  else setTimeout(loadFzl, 200);

  /* North-circle diagram when the generator omitted Runways (no published heading). */
  if(!window.RWD && !document.getElementById('rwys')){
    var mapLbl=[].slice.call(document.querySelectorAll('#s-data h4.lbl')).find(function(h){ return h.textContent.trim()==='Map'; });
    var box=document.createElement('div');
    box.className='box glass pad14';
    box.id='wm-ad-diag';
    box.innerHTML='<h4 class="lbl">Aerodrome diagram</h4>'+
      '<svg class="rwdia" viewBox="-110 -110 220 220" role="img" aria-label="Aerodrome diagram">'+
      '<circle r="106" class="rwring"/><path d="M0 -104 L4 -95 L-4 -95Z" class="rwna"/>'+
      '<text x="0" y="-82" class="rwn">N</text></svg>';
    if(mapLbl&&mapLbl.parentNode&&mapLbl.parentNode.parentNode){
      mapLbl.parentNode.parentNode.insertBefore(box, mapLbl.parentNode);
    } else {
      var data=document.getElementById('s-data');
      if(data) data.appendChild(box);
    }
  }
})();
