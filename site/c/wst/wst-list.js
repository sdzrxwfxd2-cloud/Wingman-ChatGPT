/* Main page list (approved 2026-10-21): filter bar (item 18, chips AND) + pagination 50/page (hash #page=N).
   Works for any number of cards (65 now, 641 later). Tiles count the full filtered set. */
(function(){const L=document.getElementById('list'),W=window.WST,FL=(window.WMFLT||{}).ad||{};if(!L)return;
const PER=50,cards=()=>[...L.querySelectorAll('.card')],ic=c=>(c.querySelector('.icao')||{}).textContent;
const ll=c=>{const m=c.querySelector('.cp[data-p=model]');return m&&m.dataset.la?[+m.dataset.la,+m.dataset.lo]:null};
const cat=c=>{const b=c.querySelector('.fcb2 .fbadge');return b?b.textContent.trim():''};
const night=c=>{const p=ll(c);if(!p||!W)return null;const s=W.sunInfo(p[0],p[1],Date.now());return s?s.isNight:null};
const AIP=k=>c=>{const f=FL[ic(c)];return !!(f&&f[k])};
const DEF=[['VFR',c=>cat(c)==='VFR','Flight category'],['MVFR',c=>cat(c)==='MVFR','Flight category'],['IFR',c=>cat(c)==='IFR','Flight category'],['LIFR',c=>cat(c)==='LIFR','Flight category (low IFR)'],
 ['Night',c=>night(c)===true,'Sun now'],['No night',c=>night(c)===false,'Sun now'],
 ['Go',c=>c.dataset.s==='go','Status'],['Caution',c=>c.dataset.s==='caution','Status'],['No go',c=>c.dataset.s==='nogo','Status'],
 ['Licensed',AIP('Licensed'),'SACAA AIP AD 0.6 / AD 2'],['Unlicensed',AIP('Unlicensed'),'SACAA AIP AD 0.6 (marked UNLICENSED)'],
 ...['VOR','VOR/DME','ILS','ILS/DME','DME'].map(k=>[k,AIP(k),'AIP AD 2.19']),['GNSS',AIP('GNSS'),'AIP AD 2.24 approaches'],
 ...['LOC','LOC/DME'].map(k=>[k,AIP(k),'AIP AD 2.19']),['Fuel',AIP('Fuel'),'AIP AD 2.4'],['PPR',AIP('PPR'),'AIP AD 2'],['Customs',AIP('Customs'),'AIP AD 2.3'],['Tower',AIP('Tower'),'AIP AD 2.18'],
 ...['TACAN','GS'].map(k=>[k,AIP(k),'AIP AD 2.19']),['RNAV',AIP('RNAV'),'AIP AD 2.24 approaches'],['RNP',AIP('RNP'),'AIP AD 2.24 approaches']];
const DYN=new Set(['VFR','MVFR','IFR','LIFR','Night','No night','Go','Caution','No go']);
const css=`
.wfb{position:relative;margin:14px 0 4px;z-index:5}
.wfb .bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-height:44px;box-sizing:border-box;padding:6px 8px 6px 12px;border-radius:22px;background:var(--gl);box-shadow:inset 0 1px 0 var(--hl),inset 0 0 0 .5px var(--ln),0 8px 24px -18px rgba(0,0,0,.35);-webkit-backdrop-filter:blur(20px) saturate(170%);backdrop-filter:blur(20px) saturate(170%)}
.wfb .bar>svg{width:15px;height:15px;flex:none;stroke:var(--tx3);fill:none;stroke-width:2;stroke-linecap:round}
.wfb input{flex:1 1 90px;min-width:90px;height:30px;border:0;outline:0;background:none;font:500 15px/1 -apple-system,sans-serif;color:var(--tx);padding:0 2px}
.wfb input::placeholder{color:var(--tx3)}
.wfb .chip{display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 6px 0 11px;border-radius:14px;font:600 12.5px/1 -apple-system,sans-serif;color:var(--tx);background:var(--gl2,var(--gl));box-shadow:inset 0 1px 0 var(--hl),inset 0 0 0 .5px var(--ln)}
.wfb .chip button{width:20px;height:20px;border:0;border-radius:50%;display:grid;place-items:center;background:none;color:var(--tx3);font:600 14px/1 -apple-system,sans-serif;cursor:pointer;padding:0}
.wfb .clr{margin-left:auto;border:0;background:none;color:var(--tx3);font:600 12.5px/1 -apple-system,sans-serif;padding:6px 6px;cursor:pointer}
.wfb .sug{position:absolute;left:0;right:0;top:calc(100% + 6px);max-height:300px;overflow:auto;padding:6px;border-radius:20px;display:none;background:color-mix(in srgb,var(--bg) 95%,transparent);-webkit-backdrop-filter:blur(30px) saturate(180%);backdrop-filter:blur(30px) saturate(180%);box-shadow:inset 0 1px 0 var(--hl),inset 0 0 0 .5px var(--ln),0 18px 40px -18px rgba(0,0,0,.45)}
.wfb .sug.on{display:block}
.wfb .sug button{display:flex;width:100%;align-items:center;gap:10px;border:0;background:none;padding:10px 12px;border-radius:13px;text-align:left;cursor:pointer;color:var(--tx);font:600 14px/1.1 -apple-system,sans-serif}
.wfb .sug button small{color:var(--tx3);font:500 11.5px/1.2 -apple-system,sans-serif}
.wfb .sug button .n{margin-left:auto;color:var(--tx2);font:600 12px/1 -apple-system,sans-serif;font-variant-numeric:tabular-nums}
.wfb .sug button.sel,.wfb .sug button:hover:not([disabled]){background:var(--gl);box-shadow:inset 0 0 0 .5px var(--ln)}
.wfb .sug button[disabled]{opacity:.42;cursor:default}
.wfb .cnt{margin:8px 4px 0;font:500 12px/1.2 -apple-system,sans-serif;color:var(--tx3);font-variant-numeric:tabular-nums}
.card.wpg-off,.card.wfl-off{display:none!important}
.wpager{display:flex;flex-direction:column;align-items:center;gap:10px;margin:22px 0 4px;grid-column:1/-1}
.wpager .row{display:flex;align-items:center;gap:6px;padding:5px;border-radius:22px;background:var(--gl);box-shadow:inset 0 1px 0 var(--hl),inset 0 0 0 .5px var(--ln),0 8px 24px -18px rgba(0,0,0,.35);-webkit-backdrop-filter:blur(20px) saturate(170%);backdrop-filter:blur(20px) saturate(170%)}
.wpager button{min-width:36px;height:36px;padding:0 10px;border:0;border-radius:18px;background:none;color:var(--tx2);font:600 14px/1 -apple-system,sans-serif;font-variant-numeric:tabular-nums;cursor:pointer}
.wpager button.on{color:var(--tx);background:var(--bg);box-shadow:inset 0 1px 0 var(--hl),inset 0 0 0 .5px var(--ln),0 4px 12px -6px rgba(0,0,0,.3)}
.wpager button[disabled]{opacity:.35;cursor:default}
.wpager .dots{color:var(--tx3);padding:0 2px}
.wpager .lbl{text-transform:none;letter-spacing:0;font:500 12px/1 -apple-system,sans-serif;color:var(--tx3);font-variant-numeric:tabular-nums}`;
const st=document.createElement('style');st.id='wmlistcss';st.textContent=css;document.head.appendChild(st);
const fb=document.createElement('div');fb.className='wfb';fb.innerHTML='<div class="bar"><svg viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"/></svg><input type="text" placeholder="Filter: VFR, ILS, Fuel…" aria-label="Filter aerodromes" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done"><button class="clr" hidden>Clear</button></div><div class="sug" role="listbox"></div><div class="cnt"></div>';
const hint=document.getElementById('fhint');(hint||L).parentNode.insertBefore(fb,hint?hint.nextSibling:L);
const pg=document.createElement('nav');pg.className='wpager';pg.setAttribute('aria-label','Pages');L.after(pg);
const inp=fb.querySelector('input'),sug=fb.querySelector('.sug'),bar=fb.querySelector('.bar'),clr=fb.querySelector('.clr'),cnt=fb.querySelector('.cnt');
let chips=[],page=1,sel=0;
const m0=location.hash.match(/page=(\d+)/);if(m0)page=+m0[1];
const pass=c=>chips.every(k=>{const d=DEF.find(x=>x[0]===k);return d&&d[1](c)});
function counts(){const A=cards(),n={};DEF.forEach(d=>n[d[0]]=A.filter(c=>pass(c)&&d[1](c)).length);return n}
function total(k){const d=DEF.find(x=>x[0]===k);return cards().filter(d[1]).length}
function drawSug(){const q=inp.value.trim().toLowerCase();if(document.activeElement!==inp&&!q){sug.classList.remove('on');return}
 const n=counts();let L2=DEF.filter(d=>!chips.includes(d[0])&&(DYN.has(d[0])||total(d[0])>0)).filter(d=>!q||d[0].toLowerCase().includes(q));L2.sort((a,b)=>(b[0].toLowerCase().startsWith(q))-(a[0].toLowerCase().startsWith(q)));
 if(!L2.length){sug.classList.remove('on');return}sel=Math.min(sel,L2.length-1);
 sug.innerHTML=L2.map((d,i)=>{const t=total(d[0]),dis=!t&&!DYN.has(d[0]);return '<button data-k="'+d[0]+'"'+(dis?' disabled title="No data"':'')+(i===sel&&!dis?' class="sel"':'')+'><span>'+d[0]+'<br><small>'+(dis?'no data · '+d[2]:d[2])+'</small></span><span class="n">'+(dis?'—':n[d[0]])+'</span></button>'}).join('');sug.classList.add('on')}
function add(k){if(!k||chips.includes(k)||(!DYN.has(k)&&!total(k)))return;chips.push(k);inp.value='';sel=0;page=1;apply(1);drawSug()}
function drawChips(){bar.querySelectorAll('.chip').forEach(e=>e.remove());chips.forEach(k=>{const e=document.createElement('span');e.className='chip';e.innerHTML=k+'<button aria-label="Remove '+k+'">×</button>';e.querySelector('button').onclick=ev=>{ev.stopPropagation();chips=chips.filter(x=>x!==k);page=1;apply(1)};bar.insertBefore(e,inp)});clr.hidden=!chips.length;inp.placeholder=chips.length?'Add filter…':'Filter: VFR, ILS, Fuel…'}
function tiles(){const A=cards().filter(c=>!c.classList.contains('wfl-off')||c.dataset.wst==='1'),n={go:0,caution:0,nogo:0};
 cards().forEach(c=>{if(pass(c)&&!c.dataset.chide&&n[c.dataset.s]!=null)n[c.dataset.s]++});
 document.querySelectorAll('#tiles .tile').forEach(t=>{const k=t.querySelector('.n');if(k&&n[t.dataset.s]!=null&&k.textContent!=String(n[t.dataset.s]))k.textContent=n[t.dataset.s]})}
let lock=0;
function apply(reset,scroll){lock=1;const A=cards();
 // existing tile / stat filters use .hide; tiles ignore their own status filter but respect category (CF) filter
 const vis=A.filter(c=>{const ok=pass(c);c.classList.toggle('wfl-off',!ok);return ok&&!c.classList.contains('hide')});
 const P=Math.max(1,Math.ceil(vis.length/PER));if(page>P)page=P;if(page<1)page=1;
 A.forEach(c=>c.classList.add('wpg-off'));vis.slice((page-1)*PER,page*PER).forEach(c=>c.classList.remove('wpg-off'));
 drawChips();const tot=A.length;cnt.textContent=(chips.length||document.querySelector('#a1stats .st.sel,#tiles .tile.sel'))?vis.length+' of '+tot+' aerodromes':'';
 pg.innerHTML='';if(vis.length){const r=document.createElement('div');r.className='row';const B=(t,p,on,dis,al)=>{const b=document.createElement('button');b.textContent=t;if(on)b.className='on';if(dis)b.disabled=true;if(al)b.setAttribute('aria-label',al);if(on)b.setAttribute('aria-current','page');b.onclick=()=>go(p);r.append(b)};
  B('‹',page-1,0,page<=1,'Previous page');const S=new Set([1,P,page-1,page,page+1].filter(x=>x>=1&&x<=P));let last=0;[...S].sort((a,b)=>a-b).forEach(x=>{if(x-last>1){const d=document.createElement('span');d.className='dots';d.textContent='…';r.append(d)}B(String(x),x,x===page);last=x});B('›',page+1,0,page>=P,'Next page');
  if(P>1)pg.append(r);const l=document.createElement('div');l.className='lbl';l.textContent='Page '+page+' of '+P+' · '+vis.length+' aerodrome'+(vis.length===1?'':'s');pg.append(l)}
 const h=page>1?'#page='+page:'';if(location.hash!==h&&!/settings/.test(location.hash))history.replaceState(null,'',location.pathname+location.search+h);
 tiles();lock=0;window.WMPAGE_SET=new Set(vis.slice((page-1)*PER,page*PER).map(ic));document.dispatchEvent(new Event('wm:page'))}
function go(p){page=p;apply();const y=fb.getBoundingClientRect().top+scrollY-80;scrollTo({top:Math.max(0,y),behavior:'smooth'})}
window.WMPAGE=k=>!window.WMPAGE_SET||window.WMPAGE_SET.has(k);
window.WMLIST={apply,tiles,counts,DEF};
inp.addEventListener('input',()=>{sel=0;drawSug()});inp.addEventListener('focus',drawSug);
inp.addEventListener('keydown',e=>{const B=[...sug.querySelectorAll('button:not([disabled])')];if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const all=[...sug.querySelectorAll('button')];let i=all.findIndex(b=>b.classList.contains('sel'));do{i=(i+(e.key==='ArrowDown'?1:-1)+all.length)%all.length}while(all[i].disabled&&B.length);all.forEach(b=>b.classList.remove('sel'));all[i]&&all[i].classList.add('sel')}
 else if(e.key==='Enter'){e.preventDefault();const b=sug.querySelector('button.sel')||B[0];b&&add(b.dataset.k)}else if(e.key==='Backspace'&&!inp.value&&chips.length){chips.pop();page=1;apply(1);drawSug()}else if(e.key==='Escape'){inp.blur();sug.classList.remove('on')}});
sug.addEventListener('mousedown',e=>e.preventDefault());sug.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!b.disabled){add(b.dataset.k);inp.focus()}});
bar.addEventListener('click',()=>inp.focus());clr.onclick=e=>{e.stopPropagation();chips=[];inp.value='';page=1;apply(1);sug.classList.remove('on')};
document.addEventListener('click',e=>{if(!fb.contains(e.target))sug.classList.remove('on')});
new MutationObserver(M=>{if(lock)return;if(M.some(m=>m.attributeName==='class'&&m.oldValue&&(/\bhide\b/.test(m.oldValue)!==m.target.classList.contains('hide')))){page=1;apply(1)}else if(M.some(m=>m.attributeName==='data-s'))tiles()}).observe(L,{subtree:true,attributes:true,attributeFilter:['class','data-s'],attributeOldValue:true});
const o=window.applyS;window.applyS=function(){try{o&&o()}catch(e){}tiles()};
document.addEventListener('wst:data',()=>setTimeout(()=>{if(chips.length)apply();else tiles()},0));/*5B*/((f,t)=>{let miss=0;setInterval(()=>{if(document.hidden){miss=1;return}f()},t);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&miss){miss=0;f()}})})(()=>{if(chips.length)apply();else tiles()},60e3);
apply()})();
