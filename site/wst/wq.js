/* Wingman queue items (approved 2026-10-21) — shared by every page. Each block is one item. */
(function(){const P=location.pathname,isApp=/app\.html$/.test(P),up=/\/ad\//.test(P)?'../':'';
const Q=window.WQ={};
/* ---- item 2: chart opens fast — warm app.html + Leaflet + tiles while idle; fade-in instead of a blank wait ---- */
(function(){const add=(rel,href,as,co)=>{if(document.querySelector('link[rel="'+rel+'"][href="'+href+'"]'))return;const l=document.createElement('link');l.rel=rel;l.href=href;if(as)l.as=as;if(co)l.crossOrigin='';document.head.appendChild(l)};
 const warm=()=>{add('preconnect','https://tile.openstreetmap.org',0,1);
  if(!isApp){add('prefetch',up+'app.html','document');if(window.WQCFG&&WQCFG.appdata)add('prefetch',up+WQCFG.appdata,'script');add('prefetch','/vendor/leaflet/leaflet.js','script');add('prefetch','/vendor/leaflet/leaflet.css','style')}};
 if(!isApp){(window.requestIdleCallback||setTimeout)(warm,{timeout:2500});
  document.addEventListener('pointerdown',e=>{const a=e.target.closest&&e.target.closest('a[href*="tab=chart"]');if(a)warm()},{passive:true,capture:true})}
 else{add('preconnect','https://tile.openstreetmap.org',0,1);
  const m=document.getElementById('lmap');if(m){m.classList.add('wq-fade');const on=()=>m.classList.add('wq-on');let fb=0,hooked=0;
   const mk=()=>{if(m.classList.contains('wq-on'))return;const sec=document.getElementById('chart');if(sec&&!sec.hidden&&!fb){fb=setTimeout(on,1500)}
    let LMv=null;try{LMv=LM}catch(e){}if(LMv&&!hooked){hooked=1;LMv.eachLayer(l=>{if(l.once)l.once('load',on)})}setTimeout(mk,80)};mk()}}
 /* AIP chart thumbnails: web-sized copies, fade in when decoded */
 document.querySelectorAll('.tim[style*="aipcharts_t/"]').forEach(t=>{const u=(t.style.backgroundImage.match(/url\(["']?([^"')]+)/)||[])[1];if(!u)return;t.classList.add('wq-fade');const i=new Image();i.onload=i.onerror=()=>t.classList.add('wq-on');i.src=u})})();

/* ---- item 3: Settings opens from every page (in place) ---- */
(function(){const H=document.documentElement,qs=new URLSearchParams(location.search);
 if(qs.get('sheet')==='1'&&window.parent!==window){H.classList.add('wq-sheet');
  const open=()=>{const b=document.getElementById('tb-theme');const sh=document.querySelector('.sheet');if(b&&sh&&!sh.classList.contains('on'))b.click()};setTimeout(open,350);
  const sh=()=>document.querySelector('.sheet');let was=0;setInterval(()=>{const s=sh();if(!s)return;if(s.classList.contains('on'))was=1;else if(was){parent.postMessage({wq:'close'},'*');was=0}},150);return}
 const a=document.querySelector('a.wmicb[href$="main.html#settings"]');if(!a||document.getElementById('tb-theme'))return;
 const keys=()=>['wm-theme','wm-pal','wm-pal-day'].map(k=>localStorage.getItem(k)).join('|');
 a.addEventListener('click',e=>{e.preventDefault();const k0=keys();const o=document.createElement('div');o.className='wq-set';o.innerHTML='<iframe title="Settings" src="'+a.getAttribute('href').replace('#settings','?sheet=1#settings')+'"></iframe>';document.body.appendChild(o);requestAnimationFrame(()=>o.classList.add('on'));
  const close=()=>{removeEventListener('message',m);o.classList.remove('on');setTimeout(()=>o.remove(),260);if(keys()!==k0)location.reload()};const m=ev=>{if(ev.data&&ev.data.wq==='close')close()};addEventListener('message',m);
  o.addEventListener('click',ev=>{if(ev.target===o)close()})})})();
/* ---- item 6: show the night palette name next to the moon wherever the theme is picked ---- */
(function(){const TN={black:'Midnight',purple:'Amethyst'},H=document.documentElement;
 const upd=()=>{const n=TN[localStorage.getItem('wm-pal')||'black']||'Midnight';document.querySelectorAll('[data-k=theme] button[data-v=night]').forEach(b=>{b.title=n;b.setAttribute('aria-label','Night theme · '+n);let t=b.querySelector('.wqtn');if(!t){t=document.createElement('span');t.className='wqtn';b.appendChild(t)}if(t.textContent!==n)t.textContent=n})};
 upd();new MutationObserver(upd).observe(H,{attributes:true,attributeFilter:['data-pal','data-theme']});addEventListener('storage',upd);document.addEventListener('click',()=>setTimeout(upd,50),true)})();

/* ---- item 4 / 4b: ATO page — ONE location control: province, then city (normalised labels; SACAA spelling stays on the cards) ---- */
(function(){if(!isApp)return;let A=null;try{A=ATOLOC}catch(e){}const q=document.getElementById('q2');if(!A||!q||!window.WMX)return;
 const rg=document.getElementById('rg');if(rg){rg.value='';rg.style.display='none';rg.setAttribute('aria-hidden','true')} /* raw SACAA "region" field: 52 messy values, duplicated provinces → retired */
 const OU='Other / Unknown',PROV=['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','North West','Northern Cape','Western Cape'];
 const G=(lab,list)=>list.split('|').reduce((o,k)=>(o[k.toLowerCase()]=lab,o),{});
 const CN={
  'Gauteng':Object.assign(G('Ekurhuleni (East Rand)','Germiston|Germinston|Kempton Park|Bonaero Park|Banaero Park|Rhodesfield|Benoni|Boksburg|Brakpan|Edenvale|Bedfordview|Bedford Garden|Alberton|Springs (Springs Airfield)|Springs|Airways Park|Bartlett|Modderfontein|Greenstone Ext 22|Babsfontein|Bapsfontein|Rynveld'),
   G('Johannesburg','Johannesburg|Sandton|Bryanston|Fourways|Roodepoort|Fontainbleau'),G('Pretoria','Pretoria|Pretoria East|Moreleta Park|Doornpoort|Amandasig|Onderstepoort|Grootfontein'),G('Centurion','Centurion|Lyttelton'),
   G('Midrand','Midrand|Corporate Park'),G('Krugersdorp','Krugersdorp|Krugersdorp West'),G('Vereeniging / Vaal','Vereeniging|Meyerton')),
  'Western Cape':Object.assign(G('Cape Town','Cape Town|Cape Town International Airport|Belville|Bellville|Boston Estate|Brackenfell|Durbanville|Matroosfontein|Milnerton Ridge|Zonnebloem|Walmer Estate|West Beach|Cape Farms|Tamsui Dustria'),
   G('Somerset West / Helderberg','Somerset West|Strand|Gordons Bay'),G('George / Garden Route','George|Eden|Gardenroute|Wilderness|Wilderness Heights|Hoekwil'),G('Mossel Bay','Mossel Bay|Mosselbay'),G(OU,'Hanger C24|R45')),
  'Eastern Cape':G('Gqeberha (Port Elizabeth)','Gqeberha|Port Elizabeth|Kariega'),
  'Free State':G('Kroonstad','Kroonstand|Kroonstad'),
  'KwaZulu-Natal':Object.assign(G('Durban','Durban|Durban North|Umhlanga|Virginia|Virginia Airport|Pinetown|Ashley Drive'),G('Ballito / KwaDukuza','Ballito|KwaDukuza'),G(OU,'Leonora Drive')),
  'Limpopo':G('Mokopane','Mokopane|Potgietersrus'),
  'Mpumalanga':Object.assign(G('Mbombela (Nelspruit)','Nelspruit|Mombela|Mbombela|West Acres'),G('eMalahleni (Witbank)','Witbank Ext 54|Witbank'),G(OU,'Mpumalanga')),
  'North West':G('Rustenburg','Rustenburg|Rustenberg'),'Northern Cape':G(OU,'Part 4')};
 /* web-verified fixes for SACAA entries whose location field is blank/wrong (audit: /workspace/goaround/ato_locations_verified.csv) — keyed by the unique raw (city|province) pair */
 const OVR={'Hartbeesfontein|North West':['Free State','Parys'],'|North West':['North West','Brits'],'Bundu Fly Inn Estate|Gauteng':['Gauteng','Pretoria'],'Part 4|Northern Cape':['Northern Cape','Petrusville'],'Mpumalanga|Mpumalanga':['Mpumalanga','Middelburg'],'Leonora Drive|KwaZulu-Natal':['KwaZulu-Natal','Ballito / KwaDukuza'],'Hanger C24|Western Cape':['Western Cape','Worcester'],'Ashley Drive|KwaZulu-Natal':['KwaZulu-Natal','Durban'],'R45|Western Cape':['Western Cape','Wellington'],'Tamsui Dustria|Western Cape':['Western Cape','George / Garden Route'],'Skeerpoort|North West':['North West','Hartbeespoort'],'Suurbrak|Western Cape':['Western Cape','Swellendam']};
 const tidy=c=>c.replace(/\s+/g,' ').trim().replace(/\b\w/g,m=>m.toUpperCase());
 const N=l=>{const p0=(l&&l[1]||'').replace(/\s+/g,' ').trim(),c0=(l&&l[0]||'').replace(/\s+/g,' ').trim();const p=PROV.find(x=>x.toLowerCase().replace(/[\s-]/g,'')===p0.toLowerCase().replace(/[\s-]/g,''));
  const ov=OVR[c0+'|'+p0];if(ov)return ov;if(!p)return[OU,OU];if(!c0)return[p,OU];const m=CN[p]&&CN[p][c0.toLowerCase()];return[p,m||tidy(c0)]};
 window.WQLOCN=N;let P0=sessionStorage.getItem('wq-prov')||'',C0=sessionStorage.getItem('wq-city')||'',more=0,T1={},pend=0;
 if(P0&&P0!==OU&&!PROV.includes(P0))P0='',C0='';
 const bar=document.createElement('div');bar.className='wq-loc';bar.setAttribute('role','group');bar.setAttribute('aria-label','Filter by province and city');q.after(bar);
 /* counts = schools that pass every OTHER filter (search, DTO, non-valid, family) — collected while the list filters, so chip counts match the list */
 window.WQLOC=l=>{const [p,c]=N(l);if(!pend){pend=1;T1={};queueMicrotask(()=>{pend=0;draw()})}(T1[p]=T1[p]||{_:0})._++;T1[p][c]=(T1[p][c]||0)+1;return(!P0||p===P0)&&(!C0||c===C0)};
 const esc=v=>v.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
 const chip=(t,n,on,k,v,x)=>'<button type="button" class="wq-chip'+(on?' on':'')+(x?' '+x:'')+'" data-k="'+k+'" data-v="'+esc(v)+'" aria-pressed="'+(on?'true':'false')+'">'+esc(t)+(n!=null?'<small>'+n+'</small>':'')+(on&&k!=='m'?'<i aria-hidden="true">×</i>':'')+'</button>';
 function draw(){let h='',lbl;
  if(!P0){lbl='Province';const ps=PROV.concat(OU).filter(p=>T1[p]&&T1[p]._);h=ps.map(p=>chip(p,T1[p]._,0,'p',p,p===OU?'ou':'')).join('')}
  else{const cs=Object.entries(T1[P0]||{}).filter(([c])=>c!=='_'&&c!==OU).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));const ou=(T1[P0]||{})[OU];
   h=chip(P0,null,1,'p','','lead');
   if(C0)h+=chip(C0,null,1,'c','');
   else if(P0!==OU){lbl='Cities in '+P0;const top=more?cs:cs.slice(0,8);h+='<span class="wq-sep"></span>'+top.map(([c,n])=>chip(c,n,0,'c',c)).join('')+(ou&&(more||cs.length<=8)?chip(OU,ou,0,'c',OU,'ou'):'')+(cs.length>8?chip(more?'Fewer':'More · '+(cs.length-8+(ou?1:0)),null,0,'m','','more'):'')}
   lbl=lbl||(C0?'City':'Location')}
  bar.classList.toggle('open',!!more&&!!P0&&!C0);bar.innerHTML='<span class="wq-lbl">'+lbl+'</span><div class="wq-row">'+h+'</div>'}
 bar.addEventListener('click',e=>{const b=e.target.closest('.wq-chip');if(!b)return;const k=b.dataset.k;if(k==='m'){more=!more;draw();return}
  if(k==='p'){P0=b.dataset.v;C0='';more=0}else C0=b.dataset.v;sessionStorage.setItem('wq-prov',P0);sessionStorage.setItem('wq-city',C0);WMX.r2();
  const r=bar.querySelector('.wq-row');r&&(r.scrollLeft=0)});
 WMX.r2()})();
})();/* Q8 — aerodrome-page METAR report age/time from the live observation time (data-obs is rewritten by the live fetch). */
(function(){if(!document.querySelector('.age[data-obs]'))return;const z=n=>String(n).padStart(2,'0');
function run(){const now=Date.now()/1e3;document.querySelectorAll('.age[data-obs]').forEach(a=>{if(a.closest('.card'))return;const o=+a.dataset.obs;if(!o)return;
 const mn=Math.max(0,Math.round((now-o)/60)),d=new Date(o*1e3),t=z(d.getUTCHours())+z(d.getUTCMinutes())+'Z',ag=mn<60?mn+' min ago':Math.floor(mn/60)+' h '+z(mn%60)+' min ago';
 const tx=ag+' · '+t;if(a.textContent!==tx)a.textContent=tx;a.classList.toggle('wq-old',mn>90);a.title='Observed '+t+(mn>90?' — more than 90 min old, check the latest METAR':'')})}
run();/*5B: skip ticks while hidden; the visibilitychange handler below does the single catch-up run*/setInterval(()=>{document.hidden||run()},30e3);new MutationObserver(run).observe(document.body,{subtree:true,attributes:true,attributeFilter:['data-obs']});
document.addEventListener('visibilitychange',()=>{document.hidden||run()});addEventListener('pageshow',run)})();
/* Q7 — runway/taxiway diagram: pinch zoom, drag to pan, wheel/trackpad zoom, double-tap resets; tap a taxiway → highlight it, show its name, dim the rest. */
(function(){if(!window.WMRWY)return;const st=new WeakMap();
function S(svg){let o=st.get(svg);if(!o){const b=svg.viewBox.baseVal;o={x:b.x,y:b.y,w:b.width,h:b.height,b0:[b.x,b.y,b.width,b.height],p:new Map(),last:0,moved:0};st.set(svg,o)}return o}
function ap(svg,o){const[,,W,H]=o.b0;o.w=Math.min(W,Math.max(W/8,o.w));o.h=o.w*H/W;o.x=Math.min(o.b0[0]+W-o.w,Math.max(o.b0[0],o.x));o.y=Math.min(o.b0[1]+H-o.h,Math.max(o.b0[1],o.y));svg.setAttribute('viewBox',o.x+' '+o.y+' '+o.w+' '+o.h);const z=o.w<W-.5;svg.classList.toggle('wq-z',z);svg.style.touchAction=z?'none':'pan-y'}
function zoomAt(svg,o,f,cx,cy){const r=svg.getBoundingClientRect(),px=o.x+(cx-r.left)/r.width*o.w,py=o.y+(cy-r.top)/r.height*o.h;o.w/=f;o.h/=f;o.x=px-(cx-r.left)/r.width*o.w;o.y=py-(cy-r.top)/r.height*o.h;ap(svg,o)}
function reset(svg,o){[o.x,o.y,o.w,o.h]=o.b0;ap(svg,o);pick(svg,null)}
function tip(svg,t){const box=svg.parentNode;let e=box.querySelector('.wq-tn');if(!t){e&&e.remove();return}if(!e){if(getComputedStyle(box).position==='static')box.style.position='relative';e=document.createElement('div');e.className='wq-tn';box.append(e)}e.textContent=t}
function pick(svg,names){svg.querySelectorAll('.wmr-twy,.wmr-twy-o').forEach(p=>{const n=(p.dataset.tn||'').split(',');const on=!names||n.some(x=>names.includes(x));p.classList.toggle('wq-hi',!!names&&on);p.classList.toggle('wq-dim',!!names&&!on)});svg.classList.toggle('wq-pick',!!names);tip(svg,names&&names.length?'Taxiway '+names.join(' / '):null)}
function twyAt(x,y){for(const[dx,dy]of[[0,0],[6,0],[-6,0],[0,6],[0,-6],[10,10],[-10,-10],[10,-10],[-10,10]]){const p=document.elementsFromPoint(x+dx,y+dy).find(e=>e.classList&&e.classList.contains('wmr-twy')&&e.dataset.tn);if(p)return p}return null}
document.addEventListener('pointerdown',e=>{const svg=e.target.closest&&e.target.closest('svg.wmr-svg');if(!svg||svg.closest('.wmr-ex'))return;const o=S(svg);o.p.set(e.pointerId,[e.clientX,e.clientY]);o.moved=0;o.sx=e.clientX;o.sy=e.clientY;if(o.p.size===2){const[a,b]=[...o.p.values()];o.d0=Math.hypot(a[0]-b[0],a[1]-b[1])}try{svg.setPointerCapture(e.pointerId)}catch(x){}},true);
document.addEventListener('pointermove',e=>{const svg=e.target.closest&&e.target.closest('svg.wmr-svg');const o=svg&&st.get(svg);if(!o||!o.p.has(e.pointerId))return;const pr=o.p.get(e.pointerId);o.p.set(e.pointerId,[e.clientX,e.clientY]);
 if(Math.hypot(e.clientX-o.sx,e.clientY-o.sy)>6)o.moved=1;
 if(o.p.size===2){const[a,b]=[...o.p.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(o.d0){zoomAt(svg,o,d/o.d0,(a[0]+b[0])/2,(a[1]+b[1])/2)}o.d0=d;e.preventDefault()}
 else if(svg.classList.contains('wq-z')){const r=svg.getBoundingClientRect();o.x-=(e.clientX-pr[0])/r.width*o.w;o.y-=(e.clientY-pr[1])/r.height*o.h;ap(svg,o);e.preventDefault()}},{passive:false});
const up=e=>{const svg=e.target.closest&&e.target.closest('svg.wmr-svg');const o=svg&&st.get(svg);if(!o||!o.p.has(e.pointerId))return;o.p.delete(e.pointerId);if(o.p.size<2)o.d0=0;
 if(e.type==='pointerup'&&!o.moved&&!o.p.size){const n=Date.now();if(n-o.last<320){o.last=0;reset(svg,o);return}o.last=n;
  const t=twyAt(e.clientX,e.clientY);if(t)pick(svg,t.dataset.tn.split(',').filter(Boolean));else if(svg.classList.contains('wq-pick')&&!e.target.closest('.wmr-hit,.ahit,[data-i]'))pick(svg,null)}};
document.addEventListener('pointerup',up,true);document.addEventListener('pointercancel',up,true);
document.addEventListener('click',e=>{const svg=e.target.closest&&e.target.closest('svg.wmr-svg');const o=svg&&st.get(svg);if(o&&o.moved){e.stopPropagation();e.preventDefault()}},true);
document.addEventListener('wheel',e=>{const svg=e.target.closest&&e.target.closest('svg.wmr-svg');if(!svg||!(e.ctrlKey||svg.classList.contains('wq-z')))return;e.preventDefault();zoomAt(svg,S(svg),Math.exp(-e.deltaY*.0025),e.clientX,e.clientY)},{passive:false});
document.addEventListener('dblclick',e=>{const svg=e.target.closest&&e.target.closest('svg.wmr-svg');if(svg){e.preventDefault();reset(svg,S(svg))}});
const css=document.createElement('style');css.textContent='svg.wmr-svg{touch-action:pan-y}svg.wmr-svg.wq-z{cursor:grab}.wmr-twy.wq-dim,.wmr-twy-o.wq-dim{opacity:.18;transition:opacity .2s}.wmr-twy.wq-hi{stroke:#F5B83D!important;opacity:1;filter:drop-shadow(0 0 3px rgba(245,184,61,.6))}svg.wq-pick .wmr-labels text{opacity:.35}.wq-tn{position:absolute;left:50%;top:10px;transform:translateX(-50%);padding:5px 12px;border-radius:999px;font:600 12px/1.3 Sora,sans-serif;color:#1d1d1f;background:rgba(255,255,255,.88);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 4px 16px rgba(0,0,0,.18);pointer-events:none;z-index:3;white-space:nowrap}html[data-theme=night] .wq-tn{color:#F5F5F7;background:rgba(30,30,36,.82)}html[data-pal=purple] .wq-tn{background:rgba(40,28,64,.85)}';document.head.append(css)})();
/* Q9 — aerodrome-page ATO/DFE sections use the same card look, rating families and data (SACAA register, same build) as the ATO/DFE pages. */
(function(){const secs=document.querySelectorAll('#s-ato,#s-dfe');if(!secs.length)return;const F=window.WQFAM||{};
const fam=t=>{const k=t.replace(/\s*\(\d{4}-\d{2}-\d{2}\)\s*$/,'').trim();if(F[k])return F[k];const l=k.toLowerCase();return /night/.test(l)?'night':/instructor|grade [abc]\b/.test(l)?'instr':/instrument|gnss|pbn|rvsm|\bir\b/.test(l)?'inst':/type rating/.test(l)?'type':/\b(ppl|cpl|atpl|npl|mpl|class rating|licen[cs]e|rpc)\b/.test(l)?'lic':'other'};
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
secs.forEach(sec=>{const ato=sec.id==='s-ato';sec.classList.add('wq-cards');sec.querySelectorAll('details.cg').forEach(d=>{if(d.dataset.wq)return;d.dataset.wq=1;d.classList.add('wq-cg');
 const sm=d.querySelector('summary small');if(sm){const t=sm.textContent;const m=ato?t.match(/^(SACAA\/\d+\/ATO)\s*·\s*(.*)$/):t.match(/^(.*?)\s*·\s*(DFE[^·]*?)\s*·\s*(.*)$/);
  if(m){sm.innerHTML=ato?'<span class="wq-id">'+esc(m[1])+'</span> · '+esc(m[2]):esc(m[1])+' · <span class="wq-id">'+esc(m[2].trim())+'</span> · '+esc(m[3]);
   const exp=/expir|exp\b|expired/i.test(t)&&/Expired|not valid/i.test(t);if(exp)d.classList.add('wq-exp')}}
 d.querySelectorAll('.chips>span').forEach(c=>{c.classList.add('wq-chip');c.dataset.f=fam(c.textContent)});
 const b=d.querySelector('.cgb');if(b&&!b.querySelector('.wq-open')){const id=sm&&sm.querySelector('.wq-id');const a=document.createElement('a');a.className='wq-open';a.href=(location.pathname.includes('/ad/')?'../':'')+'app.html?tab='+(ato?'ato':'dfe');a.textContent=ato?'Open on the ATOs page →':'Open on the DFEs page →';
  a.onclick=()=>{try{sessionStorage.setItem('wq-q',JSON.stringify({t:ato?'ato':'dfe',q:ato&&id?id.textContent:d.querySelector('summary b').textContent}))}catch(x){}};b.append(a)}})})})();
/* receiving side (app.html): prefill the ATO/DFE search from an aerodrome page link */
(function(){if(!/app\.html/.test(location.pathname))return;let v;try{v=JSON.parse(sessionStorage.getItem('wq-q')||'null');sessionStorage.removeItem('wq-q')}catch(x){}if(!v)return;
 let n=0;const iv=setInterval(()=>{const q=document.getElementById(v.t==='ato'?'q2':'q3');if(q){clearInterval(iv);q.value=v.q;q.dispatchEvent(new Event('input',{bubbles:true}))}else if(++n>50)clearInterval(iv)},100)})();
/* Q13 — density altitude, computed live from the AIP elevation and the page's latest METAR (temp + QNH). */
(function(){const box=document.querySelector('.wq-da');if(!box)return;const el=parseFloat(box.dataset.elev),out=box.querySelector('.wq-dav');
function get(k){let v=null;document.querySelectorAll('#s-wx .pane[data-p=metar] .wxg>div').forEach(d=>{const l=d.querySelector('.lbl');if(l&&l.textContent.trim()===k)v=d.querySelector('b').textContent});return v}
function run(){if(isNaN(el)){out.textContent='Needs the AIP elevation';return}const t=parseFloat((get('Temp / Dew')||'').split('/')[0]),q=parseFloat(get('QNH')||'');
 if(isNaN(t)){out.textContent='No METAR temperature — not computed';return}const pa=el+(isNaN(q)?0:(1013.25-q)*30),isa=15-2*pa/1000,da=Math.round((pa+120*(t-isa))/10)*10;
 out.textContent=da.toLocaleString('en-ZA').replace(/\u00a0/g,' ')+' ft  ·  OAT '+t+' °C'+(isNaN(q)?'':', QNH '+q+' hPa');out.title='Pressure altitude '+Math.round(pa)+' ft; ISA '+isa.toFixed(1)+' °C'}
run();const w=document.querySelector('#s-wx');w&&new MutationObserver(run).observe(w,{subtree:true,childList:true,characterData:true})})();
/* Search pill beside the greeting on iPad/desktop (≥820 px); phones unchanged. Same element moved, so Spotlight/search behaviour is identical. */
(function go(n){const h=document.querySelector('section.hello');if(!h)return;const b=window.WMFS&&WMFS.bar&&WMFS.bar();if(!b){if((n|0)<40)setTimeout(()=>go((n|0)+1),100);return}const home=b.parentNode,mq=matchMedia('(min-width:820px)');
 const ph=document.createComment('wq-bar');home.insertBefore(ph,b);
 const ap=()=>{if(mq.matches){if(b.parentNode!==h){h.append(b);h.classList.add('wq-hs')}}else if(b.parentNode===h){home.insertBefore(b,ph);h.classList.remove('wq-hs')}};
 ap();mq.addEventListener?mq.addEventListener('change',ap):mq.addListener(ap)})(0);
/* Filter bar directly above the first aerodrome card (below the status tiles), all devices. Same element moved — behaviour, count line and Clear unchanged. */
(function(){const L=document.getElementById('list'),fb=document.querySelector('.wfb');if(!L||!fb)return;if(fb.nextElementSibling!==L)L.parentNode.insertBefore(fb,L);fb.classList.add('wq-fbpos')})();
/* Stat tiles as filters (single select; AND with filter chips + search; count + pager follow). Wraps the page's own tile handlers. */
(function go(n){const tl=document.getElementById('tiles'),st=document.getElementById('a1stats'),L=document.getElementById('list');if(!tl||!st||!L)return;
 if(!window.WMLIST){if((n|0)<40)setTimeout(()=>go((n|0)+1),100);return}
 const all=[...st.querySelectorAll('.st'),...tl.querySelectorAll('.tile')];
 const sync=()=>all.forEach(b=>b.setAttribute('aria-pressed',b.classList.contains('sel')?'true':'false'));
 all.forEach(b=>{if(b.dataset.wqt)return;b.dataset.wqt=1;b.setAttribute('type','button');const o=b.onclick;if(!o)return;
  b.onclick=e=>{const nav=/Valid (ATO|DFE)/.test(b.dataset.c||'');o.call(b,e);if(nav)return;
   const reset=b.dataset.c==='Airports';
   if(reset){all.forEach(x=>x.classList.remove('sel'));tl.classList.remove('dim');st.classList.remove('dim')}
   sync();
   /* The list refresh (pager, weather pull, status pass over 641 cards) blocks the main thread for a few hundred ms.
      Run it after the tile highlight has painted and its fade has finished (FILTER_FADE_MS in main.html). */
   requestAnimationFrame(()=>setTimeout(()=>{
    if(reset){document.querySelectorAll('#list .card.hide').forEach(c=>c.classList.remove('hide'));const h=document.getElementById('fhint');h&&(h.textContent='')}
    L.classList.remove('wq-lfade');void L.offsetWidth;L.classList.add('wq-lfade');WMLIST.apply(1,0)},350))}});
 /* live status changes: keep the GO / CAUTION / NO-GO selection true to the new verdicts */
 document.addEventListener('wst:data',()=>setTimeout(()=>{if(window.WMAeroMulti){WMLIST.apply(0,0);return}const s=tl.querySelector('.tile.sel');if(!s)return;document.querySelectorAll('#list .card').forEach(c=>c.classList.toggle('hide',c.dataset.s!==s.dataset.s));WMLIST.apply(0,0)},50));
 /* fix/refilter-on-weather: live model weather changes card verdicts without 'wst:data'; refilter the list when any card's status changes while a box is selected. Kill switch ?refw=0 */
 {let off=false;for(const w of [window,parent]){try{if(new URLSearchParams(w.location.search).get('refw')==='0')off=true}catch(e){}}const lst=document.getElementById('list');
  if(!off&&lst){let rt=0;new MutationObserver(()=>{if(!tl.querySelector('.tile.sel'))return;clearTimeout(rt);rt=setTimeout(()=>{if(window.WMAeroMulti){WMLIST.apply(0,0);return}const s=tl.querySelector('.tile.sel');if(!s)return;let ch=0;document.querySelectorAll('#list .card').forEach(c=>{const x=c.dataset.s!==s.dataset.s;if(c.classList.contains('hide')!==x){c.classList.toggle('hide',x);ch=1}});if(ch)WMLIST.apply(0,0)},120)}).observe(lst,{subtree:true,attributes:true,attributeFilter:['data-s']})}}
 sync()})(0);
/* Aerodrome pages: search hidden by default behind a glass magnifier in the top bar; tap → reveal + focus (Spotlight unchanged); Esc / tap outside / × hides. */
(function go(n){const P=location.pathname;if(!(/\/ad\//.test(P)||/fact\.html$/.test(P)))return;const b=window.WMFS&&WMFS.bar&&WMFS.bar(),tb=document.querySelector('.topbar .tbtn');
 if(!b||!tb){if((n|0)<40)setTimeout(()=>go((n|0)+1),100);return}if(b.dataset.wqad)return;b.dataset.wqad=1;
 const wrap=document.createElement('div');wrap.className='wq-adsw';b.parentNode.insertBefore(wrap,b);wrap.append(b);
 const x=document.createElement('button');x.type='button';x.className='wq-adx';x.setAttribute('aria-label','Close search');x.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';wrap.append(x);
 const m=document.createElement('button');m.type='button';m.className='wq-adm';m.setAttribute('aria-label','Search');m.setAttribute('aria-expanded','false');m.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';tb.parentNode.insertBefore(m,tb);
 const set=o=>{wrap.classList.toggle('on',o);m.setAttribute('aria-expanded',o?'true':'false');m.classList.toggle('on',o);if(o){const i=b.querySelector('input');setTimeout(()=>{i?i.focus():b.click()},220)}};
 m.onclick=e=>{e.stopPropagation();set(!wrap.classList.contains('on'))};x.onclick=e=>{e.stopPropagation();set(false);m.focus()};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&wrap.classList.contains('on')&&!(WMFS.isOpen&&WMFS.isOpen()))set(false)});
 document.addEventListener('click',e=>{if(!wrap.classList.contains('on')||(WMFS.isOpen&&WMFS.isOpen()))return;if(wrap.contains(e.target)||m.contains(e.target)||(WMFS.spot&&WMFS.spot.contains&&WMFS.spot.contains(e.target)))return;set(false)})})(0);
/* MT: the night-rating warning is independent of weather freshness/verdict.
   Missing weather makes a card INCOMPLETE, not daytime or night-enabled. Use the
   current sun calculation and saved profile, never the translated/truncated reason.
   For LAND, use the arrival ETA (WMPHASE.arrive), not now, so the pill also shows
   when you will land after dark. */
(function(){const list=document.getElementById('list');if(!list)return;const ic='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="currentColor"/></svg>';
 function landWhen(now){try{var mode=(window.WMPHASE&&WMPHASE.mode)||window.GA_PHASE;if(mode!=='land')return now;var A=window.WMPHASE&&WMPHASE.arrive;if(!A)return now;if(A.at!=null)return +A.at;if(A.off)return now+A.off*36e5}catch(e){}return now}
 function run(){const B=window.WMB,W=window.WST;if(!B||!W||!W.sunInfo)return;const p=B.prof(),now=Date.now(),when=landWhen(now),landNight=when!==now;
  list.querySelectorAll('.card').forEach(c=>{const w=c.querySelector('.why'),n=c.querySelector('.wq-nn'),m=c.querySelector('.cp[data-p=model]');
   const la=m&&m.dataset.la,lo=m&&m.dataset.lo,valid=la!=null&&la!==''&&lo!=null&&lo!==''&&Number.isFinite(+la)&&Number.isFinite(+lo)&&Math.abs(+la)<=90&&Math.abs(+lo)<=180;
   const id=(c.querySelector('.icao')||{}).textContent,heli=(c.__wm&&c.__wm.heliport)||(window.AD_CLASS&&window.AD_CLASS[id]);
   const sun=valid&&!heli?W.sunInfo(+la,+lo,when):null;
   const on=w&&!heli&&p.rules!=='ifr'&&!p.night&&p.licence!=='ir'&&sun&&sun.isNight;
   const label=landNight?'You\'ll land after dark · Night not enabled':'After sunset · Night not enabled';
   if(on){if(!n){const e=document.createElement('div');e.className='wq-nn';e.innerHTML=ic+label;w.after(e)}else{n.classList.remove('wq-nn-cau');const tx=ic+label;if(n.innerHTML!==tx)n.innerHTML=tx}}else if(n)n.remove()})}
 let queued=false;const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})};
 run();document.addEventListener('wm:pass',queue);document.addEventListener('wst:data',queue);document.addEventListener('wm:phase',queue);
 setInterval(()=>{document.hidden||queue()},30e3);document.addEventListener('visibilitychange',()=>{document.hidden||queue()});
 new MutationObserver(queue).observe(list,{attributes:true,subtree:true,attributeFilter:['data-s']});
})();
/* Settings segmented controls: selection shown by the silver highlight only; aria-pressed mirrors .on for assistive tech */
(function(){const sync=()=>document.querySelectorAll('.sheet .sw button').forEach(b=>{const v=b.classList.contains('on')?'true':'false';if(b.getAttribute('aria-pressed')!==v)b.setAttribute('aria-pressed',v)});sync();/* wmgo-scoped-watchers: watch the settings sheets only (+ new sheets, theme attrs, OS scheme) instead of every class change on the page */let q=0;const qs=()=>{if(q)return;q=1;requestAnimationFrame(()=>{q=0;sync()})},mo=new MutationObserver(qs),seen=new Set(),bind=()=>document.querySelectorAll('.sheet').forEach(sh=>{if(seen.has(sh))return;seen.add(sh);mo.observe(sh,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})});bind();new MutationObserver(()=>{bind();qs()}).observe(document.body,{childList:true});new MutationObserver(qs).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-pal']});try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',qs)}catch(e){}addEventListener('storage',qs);addEventListener('pageshow',qs)})();
/* Amethyst icon palette: MT picked option D (orchid icons, silver-lilac selected) */document.documentElement.dataset.wqico=document.documentElement.dataset.wqico||'d';
document.documentElement.dataset.wqswap=document.documentElement.dataset.wqswap||'1'; /* MT final: swapped night icons default */
/* #21 Pill dock hides while a Settings sheet is open. Replaces the CSS rule body:has(.sheet.on) .wmpill-dock (see wq.css).
   The class goes on the dock itself (the narrowest element), so no rule elsewhere has to be re-checked when it flips.
   syncDock() always derives the state from the DOM, with no open/close counter, so every path ends right: the
   settings button, a tap outside, switching page, swipe, Escape, back (popstate), one sheet replacing another,
   and a bfcache restore (pageshow). Each sheet's class attribute is observed, so any code that adds or removes .on
   is covered without editing it. It never waits for an animation's 'finished' promise (it never settles on cancel()). */
(function(){
 const OPEN='.sheet.on,.sheet.open',OFF='wq-dock-off',seen=new WeakSet();
 function syncDock(){
  const open=!!document.querySelector(OPEN);
  document.querySelectorAll('.wmpill-dock').forEach(d=>{if(d.classList.contains(OFF)!==open)d.classList.toggle(OFF,open)});
 }
 const sheetObs=new MutationObserver(syncDock);
 // Watch every sheet once, then sync. Re-run when body's direct children change (a sheet or the dock added or removed).
 function bind(){
  document.querySelectorAll('.sheet').forEach(s=>{if(!seen.has(s)){seen.add(s);sheetObs.observe(s,{attributes:true,attributeFilter:['class']})}});
  syncDock();
 }
 function start(){bind();new MutationObserver(bind).observe(document.body,{childList:true});
  addEventListener('pageshow',bind);addEventListener('popstate',syncDock)}
 if(document.body)start();else document.addEventListener('DOMContentLoaded',start);
 window.wqSyncDock=syncDock;
})();
