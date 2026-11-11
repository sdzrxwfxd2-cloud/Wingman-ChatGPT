/* Wingman general search (from demo_pill/search_ideas/final). Aerodromes · ATOs · DFEs. Real site data only (fs-data.js). */
(function(){if(window.WMFS)return;
const D=window.FS_D;if(!D)return;
const BASE=/\/ad\/[^/]*$/.test(location.pathname)?'../':'';
const touch=matchMedia('(hover:none)').matches;if(touch)document.documentElement.classList.add('fs-touch');
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
const LS={g:(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}},s:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
const I={s:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',x:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',ar:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
tw:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21h6M10 21l1-12h2l1 12M7 9h10l-1-4H8z"/></svg>',gl:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
cl:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',hg:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20V11a9 7 0 0118 0v9M3 20h18M8 20v-6h8v6"/></svg>',ps:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>'};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const el=h=>{const d=document.createElement('div');d.innerHTML=h.trim();return d.firstElementChild};
/* a: [ident, name, town, province, cat, status g/c/n/'', runways] */
const AD=D.a.map(a=>({ic:a[0],nm:a[1].replace(/ International Airport$/,' Intl').replace(/ Airport$/,''),full:a[1],town:a[2],pr:a[3],cat:a[4],st:a[5],rw:a[6]||[]}));
const BY=Object.fromEntries(AD.map(a=>[a.ic,a]));
/* live status written by the Aerodromes page (same GO/CAUTION/NO-GO the cards show), else the status baked into the build */
(function(){try{const c=JSON.parse(LS.g('wm-fs-wx','null'));if(c&&Date.now()-c.t<3*3600e3)for(const k in c.s)if(BY[k])BY[k].st=c.s[k]}catch(e){}})();
function syncCards(){const cs=document.querySelectorAll('#list .card[data-s]');if(!cs.length)return;const s={};cs.forEach(c=>{const i=c.querySelector('.icao');const v={go:'g',caution:'c',nogo:'n'}[c.dataset.s]||'';if(i&&BY[i.textContent.trim()]){s[i.textContent.trim()]=v;BY[i.textContent.trim()].st=v}});LS.s('wm-fs-wx',JSON.stringify({t:Date.now(),s}))}
const WX={g:['GO','#22C55E'],c:['CAUTION','#FF9F0A'],n:['NO-GO','#FF453A']};
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ');
const lev=(a,b)=>{if(Math.abs(a.length-b.length)>2)return 9;const m=[...Array(a.length+1)].map((_,i)=>[i]);for(let j=1;j<=b.length;j++)m[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]===b[j-1]?0:1));if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])m[i][j]=Math.min(m[i][j],m[i-2][j-2]+1)}return m[a.length][b.length]};
function score(a,q){const qn=norm(q).trim();if(!qn)return 0;const ic=a.ic.toLowerCase();
 if(ic===qn)return 1000;if(ic.startsWith(qn))return 800;
 const rq=qn.replace(/^rwy ?|^runway ?/,'');if(/^\d{2}[lrc]?$/.test(rq)&&a.rw.some(r=>r.toLowerCase()===rq))return 600;
 const hay=norm(a.nm+' '+a.town+' '+a.pr),words=hay.split(/\s+/).filter(Boolean),qt=qn.split(/\s+/);let s=0;
 for(const t of qt){if(hay.includes(t)){s+=words.some(w=>w.startsWith(t))?120:70;continue}
  const tol=t.length>=6?2:t.length>=3?1:0;let best=9;for(const w of words)best=Math.min(best,lev(t,w.slice(0,Math.max(t.length,w.length))),lev(t,w));if(best<=tol){s+=40-best*10;continue}return 0}
 if(norm(a.town).startsWith(qt[0]))s+=60;if(a.cat==='i')s+=25;else if(a.cat==='c')s+=12;return s}
function hl(text,q){const qn=norm(q).trim();if(!qn)return esc(text);const toks=qn.split(/\s+/);const n=norm(text);const marks=new Array(text.length).fill(0);
 for(const t of toks){let i=n.indexOf(t);if(i>=0){while(i>=0){for(let k=i;k<i+t.length;k++)marks[k]=1;i=n.indexOf(t,i+t.length)}continue}
  let pos=0;for(const w of n.split(' ')){const tol=t.length>=6?2:1;if(w&&t.length>=3&&lev(t,w)<=tol)for(let k=pos;k<pos+w.length;k++)marks[k]=1;pos+=w.length+1}}
 let o='',on=0;for(let i=0;i<text.length;i++){if(marks[i]&&!on){o+='<mark class="fs-m">';on=1}if(!marks[i]&&on){o+='</mark>';on=0}o+=esc(text[i])}return o+(on?'</mark>':'')}
const search=(q,n)=>AD.map(a=>[score(a,q),a]).filter(x=>x[0]>0).sort((x,y)=>y[0]-x[0]).slice(0,n).map(x=>x[1]);
/* ATOs: [name, number, region, valid, town, courses[]]  DFEs: [name, designation, province, valid] */
function tokOk(hay,q){const h=norm(hay);return norm(q).trim().split(/\s+/).every(t=>h.includes(t))}
function searchT(q,n){const qn=norm(q).trim();return D.t.map(t=>{const nm=norm(t[0]),cm=t[5].find(c=>tokOk(c,q));let s=0;
  if(nm.startsWith(qn))s=900;else if(tokOk(t[0],q))s=700;else if(tokOk(t[4]+' '+t[2],q))s=500;else if(cm)s=400;else if(norm(t[1]).includes(qn))s=300;
  return [s+(t[3]?50:0),t,cm]}).filter(x=>x[0]>50).sort((a,b)=>b[0]-a[0]||(a[1][0]<b[1][0]?-1:1)).slice(0,n)}
function searchF(q,n){const qn=norm(q).trim(),seen=new Set();return D.f.map(f=>{let s=0;if(norm(f[0]).startsWith(qn))s=900;else if(tokOk(f[0],q))s=700;else if(tokOk(f[1]+' '+f[2],q))s=500;return [s+(f[3]?50:0),f]}).filter(x=>x[0]>50).sort((a,b)=>b[0]-a[0]).filter(x=>!seen.has(x[1][0])&&seen.add(x[1][0])).slice(0,n)}
const hrefA=ic=>BASE+(ic==='FACT'?'fact.html':'ad/'+ic+'.html');
const hrefT=(k,nm)=>BASE+'app.html?tab='+k+'&q='+encodeURIComponent(nm);
const row=(a,q,hi)=>{const w=WX[a.st];const sub=[a.town,a.pr].filter(Boolean).join(', ')+(a.rw.length&&/\d/.test(q)?' · RWY '+a.rw.join('/'):'');
 return `<a class="fs-row${hi?' hi':''}" role="option" href="${hrefA(a.ic)}" data-ic="${a.ic}"><span class="fs-ic">${hl(a.ic,q)}</span><span class="fs-nm"><b>${hl(a.nm,q)}</b><small>${hl(sub,q)}</small></span>${w?`<span class="fs-wx" style="--c:${w[1]}" title="Status from the latest METAR"><i></i>${w[0]}</span>`:'<span class="fs-wx none" aria-hidden="true"></span>'}<span class="fs-ret" aria-hidden="true">↵</span></a>`};
const field=(kbd,lbl)=>`<label class="fs-field fs-gl">${I.s}<input type="search" enterkeyhint="go" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="${lbl}">${kbd?`<span class="fs-kbd" aria-hidden="true">${kbd}</span>`:''}</label>`;
const W_ALL=['FACT','Night rating','Cape Town','an examiner','FAGG','an ATO'],W_AD=['FACT','Lanseria','Wonderboom','George','Rand','FAGG'];
function rotor(f,words,stat){const inp=f.querySelector('input');inp.placeholder='';let ph=f.querySelector('.fs-ph');if(!ph){ph=el('<span class="fs-ph" aria-hidden="true"></span>');f.append(ph)}
 clearInterval(f._t);inp.setAttribute('aria-label',stat);if(RM){ph.textContent=stat;return}
 let k=0;ph.innerHTML='Search <i>'+words[0]+'</i>';const it=ph.querySelector('i');
 f._t=setInterval(()=>{if(f._stop||document.hidden)return;it.classList.add('out');setTimeout(()=>{k=(k+1)%words.length;it.textContent=words[k];it.classList.remove('out');it.classList.add('pre');it.offsetWidth;it.classList.remove('pre')},380)},2500);
 if(!f._sync){f._sync=1;const sync=()=>f.classList.toggle('has',!!inp.value);inp.addEventListener('input',sync);inp.addEventListener('focus',()=>f._stop=1);inp.addEventListener('blur',()=>f._stop=0);f.addEventListener('pointerdown',()=>f._stop=1)}f.classList.toggle('has',!!inp.value)}
function init(){
 if(document.querySelector('.fs-spot'))return;
 syncCards();
 const pg=document.querySelector('#list')?'main':document.querySelector('#engr')?'ad':'app';
 /* main bar */
 let bar=null;const anchor=pg==='main'?document.querySelector('section.hello'):pg==='ad'?document.querySelector('#engr'):null;
 if(anchor){bar=el(`<div class="fs-bar">${field(touch?'':'⌘K','Search aerodromes, ATOs, examiners')}</div>`);anchor.after(bar)}else document.body.classList.add('fs-nobar');
 /* top-bar icon, beside settings */
 const set=document.getElementById('tb-theme')||document.querySelector('.wmtb .wmicb[aria-label=Settings]')||document.querySelector('.wmicb');
 let ib=null;if(set){ib=el(`<button type="button" class="${set.classList.contains('wmicb')?'wmicb fs-ib-app':'icb'} fs-ib" aria-label="Search Go Around" title="Search Go Around (⌘K)">${I.s}</button>`);set.parentNode.insertBefore(ib,set);if(ib.classList.contains('fs-ib-app')){const w=set.getBoundingClientRect().width;if(w)ib.style.setProperty('--fs-ibw',Math.round(w)+'px')}}
 if(bar){rotor(bar.querySelector('.fs-field'),W_ALL,'Search aerodromes, ATOs, examiners');
  const upd=()=>document.body.classList.toggle('fs-tuck',bar.getBoundingClientRect().top<64+4&&scrollY>120);addEventListener('scroll',upd,{passive:true});upd()}
 /* spotlight */
 const sp=el(`<div class="fs-spot" role="dialog" aria-modal="true" aria-label="Search" aria-hidden="true"><div class="fs-in">
  <div class="fs-head">${field(touch?'':'esc','Search')}<button type="button" class="fs-cancel">Cancel</button></div>
  <div class="fs-mode"></div><div class="fs-scroll" role="listbox" aria-label="Results"></div></div></div>`);document.body.append(sp);sp.inert=true;
 const inp=sp.querySelector('input'),out=sp.querySelector('.fs-scroll'),md=sp.querySelector('.fs-mode');let mode='all',hiI=0,lastFocus=null;
 let recQ=[];try{recQ=JSON.parse(LS.g('fs-recq','[]'))||[]}catch(e){recQ=[]}
 const saveQ=q=>{q=String(q).trim();if(q.length<2)return;recQ=[q,...recQ.filter(x=>x.toLowerCase()!==q.toLowerCase())].slice(0,5);LS.s('fs-recq',JSON.stringify(recQ))};
 const foot=()=>touch?'':`<div class="fs-foot"><span><span class="fs-kbd">↑</span><span class="fs-kbd">↓</span> move</span><span><span class="fs-kbd">↵</span> open</span><span><span class="fs-kbd">esc</span> close</span></div>`;
 const empty=()=>{const ad=mode==='ad';const rq=ad?recQ.filter(x=>!/rating|examiner|school|instructor|dfe|ato/i.test(x)):recQ;
   const qc=ad?['FACT','FAGG','FAOR','Cape Town','Lanseria']:['FACT','FAGG','FAOR','Night rating','Cape Town','ATOs'];
   let h=`<div class="fs-lbl fs-lbl-q">Quick searches</div><div class="fs-qc">${qc.map(c=>`<button type="button" class="fs-qchip fs-gl" data-q="${c}">${c}</button>`).join('')}</div>`;
   if(rq.length)h+=`<div class="fs-card fs-gl"><div class="fs-lbl">Recent searches<a role="button" tabindex="0" data-act="clear">Clear</a></div>${rq.map(x=>`<div class="fs-row fs-rq" role="option" data-q="${esc(x)}"><span class="fs-ico2">${I.cl}</span><span class="fs-nm"><b>${esc(x)}</b></span><button type="button" class="fs-rx" data-rx="${esc(x)}" aria-label="Remove ${esc(x)}">${I.x}</button></div>`).join('')}</div>`;
   /* Favourites: the site has no favourites feature yet, so the section stays hidden (no example data). */
   out.innerHTML=h+foot();mark()};
 const qcMap={'atos':'school','an ato':'school','flight schools':'school','an examiner':'examiner','a flight school':'school'};
 function render(){const q=inp.value.trim();let h='';if(q){const ff=sp.querySelector('.fs-field');ff.classList.remove('pulse');void ff.offsetWidth;ff.classList.add('pulse');clearTimeout(ff._p);ff._p=setTimeout(()=>ff.classList.remove('pulse'),950)}
  if(!q){empty();return}
  const up=q.toUpperCase();
  if(mode==='all'){const ad=search(q,3),at=searchT(q,3),df=searchF(q,3);
   const g=(t,c,items)=>`<div class="fs-card fs-gl"><div class="fs-lbl">${t}<em>${c}</em></div>${items||'<div class="fs-row" style="cursor:default"><span class="fs-nm"><small>No matches</small></span></div>'}</div>`;
   h=g('Aerodromes',ad.length+' shown',ad.map((a,i)=>row(a,q,!i)).join(''))
    +g('ATOs',at.length+' shown',at.map(x=>{const t=x[1],sub=[t[4],t[2]].filter(Boolean).join(', ');return `<a class="fs-row" role="option" data-go="${esc(hrefT('ato',t[0]))}" href="${esc(hrefT('ato',t[0]))}"><span class="fs-ico2">${I.hg}</span><span class="fs-nm"><b>${hl(t[0],q)}</b><small>${x[2]?`<span class="fs-cc">${hl(x[2],q)}</span> · `:''}${hl(sub||t[1],q)}</small></span></a>`}).join(''))
    +g('DFEs',df.length+' shown',df.map(x=>{const f=x[1];return `<a class="fs-row" role="option" data-go="${esc(hrefT('dfe',f[0]))}" href="${esc(hrefT('dfe',f[0]))}"><span class="fs-ico2">${I.ps}</span><span class="fs-nm"><b>${hl(f[0],q)}</b><small>${hl(f[1],q)}${f[2]?' · '+hl(f[2],q):''}</small></span></a>`}).join(''));
   out.innerHTML=h+foot();mark();return}
  if(/^FA[A-Z]{2}$/.test(up)&&BY[up]){const a=BY[up];h+=`<div class="fs-card fs-gl" style="padding:8px"><a class="fs-go fs-row" href="${hrefA(a.ic)}" data-ic="${a.ic}"><span class="ar">${I.ar}</span><span class="fs-nm"><b>Go to ${a.ic}</b><small>${esc(a.full)}${a.town?' · '+esc(a.town):''}</small></span><span class="fs-kbd">${touch?'Go':'↵'}</span></a></div>`}
  const r=search(q,8).filter(a=>!(BY[up]&&a.ic===up));
  if(r.length||h)h+=r.length?`<div class="fs-card fs-gl"><div class="fs-lbl">Aerodromes<em>${r.length} best matches</em></div>${r.map((a,i)=>row(a,q,!h&&!i)).join('')}</div>`:'';
  else{let best=null,bd=9;const qn=norm(q).replace(/\s/g,'');for(const a of AD){for(const w of [a.ic,a.town,a.nm.split(' ')[0]]){if(!w)continue;const d=lev(qn,norm(w).replace(/\s/g,'').slice(0,qn.length+1));if(d<bd){bd=d;best=a}}}
   h=`<div class="fs-card fs-gl fs-empty"><div class="gl fs-gl">${I.s}</div><h4>No aerodrome found</h4><p>Nothing matches “${esc(q)}”.<br>Try an ICAO code, town or runway number.</p>${best&&bd<=3?`<div class="fs-dym fs-gl" role="button" tabindex="0" data-q="${esc(best.town||best.ic)}">Did you mean <span>${esc(best.town||best.nm)}</span> · ${best.ic}?</div>`:''}</div>`}
  out.innerHTML=h+foot();mark()}
 const rows=()=>[...out.querySelectorAll('.fs-row[href]')];
 function mark(){const R=rows();R.forEach(r=>{r.classList.remove('hi');r.removeAttribute('aria-selected')});if(R.length&&inp.value){hiI=Math.min(hiI,R.length-1);R[hiI].classList.add('hi');R[hiI].setAttribute('aria-selected','true')}}
 const go=a=>{saveQ(inp.value);const h=a.getAttribute('href');let T=null;try{T=window.WMMERGE?window:(window.parent!==window&&window.parent.WMMERGE?window.parent:null)}catch(e){}if(T&&T.WMMERGE.openItem&&T.WMMERGE.openItem(new URL(h,location.href).href)){close();return}location.href=h};
 function open(q,m){mode=m||'all';sp.classList.toggle('all',mode==='all');rotor(sp.querySelector('.fs-field'),mode==='all'?W_ALL:W_AD,mode==='all'?'Search aerodromes, ATOs, examiners':'Search aerodromes');
  md.innerHTML=mode==='all'?`<span>${I.gl}Everything</span><em>Aerodromes · ATOs · DFEs</em>`:`<span>${I.tw}Aerodromes only</span><em>${AD.length} SACAA aerodromes</em>`;
  lastFocus=document.activeElement;sp.inert=false;sp.removeAttribute('aria-hidden');sp.classList.add('on');inp.value=q||'';sp.querySelector('.fs-field').classList.toggle('has',!!inp.value);hiI=0;render();
  inp.focus({preventScroll:true});setTimeout(()=>inp.focus({preventScroll:true}),40);document.documentElement.style.overflow='hidden'}
 function close(){if(!sp.classList.contains('on'))return;sp.classList.remove('on');inp.blur();sp.inert=true;sp.setAttribute('aria-hidden','true');document.documentElement.style.overflow='';if(lastFocus&&lastFocus.focus&&lastFocus!==document.body)try{lastFocus.focus({preventScroll:true})}catch(e){}}
 if(bar){const bl=bar.querySelector('label'),bi=bar.querySelector('input');bl.addEventListener('click',e=>{e.preventDefault();open('','all')});bi.addEventListener('focus',e=>{e.target.blur();open('','all')});bi.readOnly=true}
 if(ib)ib.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open('','all')});
 sp.querySelector('.fs-cancel').onclick=close;sp.addEventListener('click',e=>{if(e.target===sp||e.target===sp.firstElementChild)close()});
 inp.addEventListener('input',()=>{hiI=0;render()});
 out.addEventListener('click',e=>{const c=e.target.closest('[data-act=clear]');if(c){recQ=[];LS.s('fs-recq','[]');render();inp.focus({preventScroll:true});return}
  const rx=e.target.closest('[data-rx]');if(rx){e.preventDefault();e.stopPropagation();recQ=recQ.filter(x=>x!==rx.dataset.rx);LS.s('fs-recq',JSON.stringify(recQ));render();return}
  const qq=e.target.closest('[data-q]');if(qq){inp.value=qq.dataset.q;sp.querySelector('.fs-field').classList.add('has');hiI=0;render();inp.focus({preventScroll:true});return}
  const r=e.target.closest('.fs-row[href]');if(r){e.preventDefault();go(r)}});
 out.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-act],[role=button]')){e.preventDefault();e.target.click()}});
 addEventListener('keydown',e=>{const on=sp.classList.contains('on');const ae=document.activeElement,typing=ae&&(/INPUT|TEXTAREA|SELECT/.test(ae.tagName)||ae.isContentEditable);
  if(!on&&(((e.metaKey||e.ctrlKey)&&!e.altKey&&e.key&&e.key.toLowerCase()==='k')||(e.key==='/'&&!typing&&!e.metaKey&&!e.ctrlKey))){e.preventDefault();open('','all');return}
  if(!on)return;if(e.key==='Escape'){e.preventDefault();close();return}
  if(e.key==='Tab'){const f=[...sp.querySelectorAll('input,button,a[href],[tabindex="0"]')].filter(x=>x.getClientRects().length);if(f.length){const i=f.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&i===f.length-1){e.preventDefault();f[0].focus()}}return}
  const R=rows();if(!R.length)return;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();hiI=(hiI+(e.key==='ArrowDown'?1:-1)+R.length)%R.length;mark();R[hiI].scrollIntoView({block:'nearest'})}
  if(e.key==='Enter'&&document.activeElement===inp&&R[hiI]&&inp.value.trim()){e.preventDefault();go(R[hiI])}});
 if(window.visualViewport){const vv=visualViewport;const fit=()=>{if(!sp.classList.contains('on'))return;sp.style.height=vv.height+'px';sp.style.top=vv.offsetTop+'px'};vv.addEventListener('resize',fit);vv.addEventListener('scroll',fit)}
 addEventListener('pageshow',e=>{if(e.persisted)close()});
 window.WMFS={open,close,isOpen:()=>sp.classList.contains('on'),bar:()=>bar,spot:sp,page:pg,syncCards};
 document.dispatchEvent(new CustomEvent('wmfs:ready'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
/* keep weather dots in step with the cards when the Aerodromes page refreshes METARs */
addEventListener('load',()=>{const L=document.getElementById('list');if(!L||!window.WMFS)return;WMFS.syncCards();let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(WMFS.syncCards,300)}).observe(L,{subtree:true,attributes:true,attributeFilter:['data-s']})});
})();
