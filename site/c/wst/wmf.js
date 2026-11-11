/* wmf.js — Wingman directory filter for the ATO and DFE lists (c/app.html).
 *
 * Port of the design MT approved on 29 Oct 2026 (/workspace/filter_design):
 *   closed bar  = v8b   glass pill, Clash Display "Search ATOs" hint that slides up with a soft blur
 *   expand      = v9    outer glass shell grows a little up/left/right and a lot down; search pill stays put
 *   contents    = v13 option 2 chips (top 5 + "All N ›"), old soft theme-coloured selected glow
 *   city search = v16 option B magnifier + v18 "soft" fill search field under City
 * Also exported as window.WMFUI.make for the aerodrome page (fv3.js), which opens it with {modal:true}.
 * Non-modal (default): while open (and while animating) the page stays scrollable and tappable, nothing is blurred; the panel pushes the cards down.
 * Every chip tap filters the cards immediately (WMX.r2 / dfeList), "Show N" just closes.
 * Replaces the wq.js location bar and the wds.js filter row, which stay in the DOM (locked files) but hidden.
 * No external assets: Clash Display / Satoshi are the site's self-hosted fonts, icons are inline SVG.
 */
(function(){
'use strict';
const off=k=>{for(const w of [window,parent]){try{if(new URLSearchParams(w.location.search).get(k)==='0')return true}catch(e){}}return false};
const FQ=off('fq'),FM=off('fmatch'),FMO=off('fmorph'),FLB=off('fvlabel');
function setChips(u,h){
 if(FMO){u.chips.innerHTML=h;return}
 const t=document.createElement('template');t.innerHTML=h;const nw=[...t.content.children],old=[...u.chips.children];
 const k=n=>n.tagName+'|'+(n.dataset.v||n.dataset.more||'')+'|'+n.className.replace(/ ?\b(?:on|fv-z)\b/g,'');
 if(nw.length!==old.length||nw.some((n,i)=>k(n)!==k(old[i]))){u.chips.innerHTML=h;return}
 nw.forEach((n,i)=>{const o=old[i],keep=o.classList.contains('fv-z')?' fv-z':'';
  if(o.className.replace(' fv-z','')!==n.className)o.className=n.className+keep;
  if(o.disabled!==n.disabled)o.disabled=n.disabled;
  const a=n.getAttribute('aria-pressed');if(o.getAttribute('aria-pressed')!==a)a==null?o.removeAttribute('aria-pressed'):o.setAttribute('aria-pressed',a);
  if(o.innerHTML!==n.innerHTML)o.innerHTML=n.innerHTML})}

const CSS=`
.wmf{--gl:rgba(28,28,30,.55);--tx:#F5F5F7;--mu:rgba(235,235,245,.55);--ac:#0A84FF;--ln:rgba(255,255,255,.10);--hi:rgba(255,255,255,.10);--tint:rgba(10,132,255,.10);--card:#1c1c1e;--bgx:#000;
 --glow:linear-gradient(180deg,rgba(40,70,255,.20),rgba(0,25,201,.12));--gr:rgba(80,100,255,.30);--gt:#9DB1FF;
 position:relative;z-index:40;padding:4px;margin:0 0 12px;color:var(--tx);font-family:Satoshi,-apple-system,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
html.dark.pal-purple .wmf,html[data-theme=night][data-pal=purple] .wmf{--gl:rgba(40,26,74,.48);--tx:#F3EEFF;--mu:rgba(217,200,255,.58);--ac:#D4CCFF;--ln:rgba(196,176,255,.16);--hi:rgba(255,236,248,.12);--tint:rgba(170,140,255,.14);--card:#1a1230;--bgx:#0B0716;
 --glow:linear-gradient(180deg,rgba(170,140,255,.28),rgba(120,80,210,.14));--gr:rgba(196,176,255,.40);--gt:#D9C8FF}
html:not(.dark):not([data-theme=night]) .wmf{--gl:rgba(255,255,255,.62);--tx:#0B0B12;--mu:rgba(60,60,67,.6);--ac:#0019C9;--ln:rgba(0,0,0,.07);--hi:rgba(255,255,255,.9);--tint:rgba(0,25,201,.05);--card:#fff;--bgx:#F2F2F5;
 --glow:linear-gradient(180deg,rgba(0,25,201,.11),rgba(0,25,201,.06));--gr:rgba(0,25,201,.18);--gt:#0019C9}
html.pal-beige:not(.dark):not([data-theme]) .wmf,html[data-theme=day][data-pal=beige] .wmf{--gl:rgba(255,251,243,.66);--tx:#2A2012;--mu:rgba(110,83,31,.62);--ac:#8E6F33;--ln:rgba(142,111,51,.14);--hi:rgba(255,250,235,.9);--tint:rgba(201,150,58,.08);--card:#FBF7EF;--bgx:#F4EEE3;
 --glow:linear-gradient(180deg,rgba(201,150,58,.17),rgba(168,122,30,.08));--gr:rgba(168,122,30,.28);--gt:#8A6418}
.wmf button{font:inherit;color:inherit;background:none;border:0;margin:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
.wmf button:focus-visible{outline:2px solid var(--gt);outline-offset:2px}

/* v9 shell: the only element that resizes, so the search pill never moves */
.wmf-sh{position:absolute;z-index:-1;left:0;right:0;top:0;border-radius:22px;pointer-events:none;background:var(--gl);
 -webkit-backdrop-filter:blur(30px) saturate(160%);backdrop-filter:blur(30px) saturate(160%);
 box-shadow:inset 0 1px 0 var(--hi),inset 0 0 0 1px var(--ln),0 20px 40px -24px rgba(0,0,0,.35)}
.wmf[data-s=open]{z-index:90}
.wmf[data-s=open] .wmf-sh{background:linear-gradient(160deg,var(--tint),transparent 60%),var(--bgx);-webkit-backdrop-filter:none;backdrop-filter:none}
.bar>.wmf{flex:1 1 100%;width:100%;min-width:0;box-sizing:border-box}
.wmf-row{display:flex;gap:8px;align-items:center}

/* v8b search pill + rotating hint */
.wmf-sp{flex:1;min-width:0;height:36px;border-radius:18px;position:relative;display:flex;align-items:center;justify-content:center;gap:9px;overflow:hidden;
 background:linear-gradient(180deg,var(--tint),transparent),var(--gl)!important;box-shadow:inset 0 1px 0 var(--hi),inset 0 0 0 1px var(--ln)!important;color:var(--tx)!important;padding:0!important;margin:0!important}
.wmf-sp>svg{flex:none;opacity:.7;position:relative;z-index:1;pointer-events:none}
html body .wmf .wmf-sp input,html body section .wmf .wmf-sp input,html body #ato .wmf .wmf-sp input{position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0 16px 0 40px;border:0;outline:0;background:transparent;box-shadow:none;border-radius:18px;
 color:var(--tx);font:500 15px Satoshi,sans-serif;-webkit-appearance:none;appearance:none;background:transparent!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;filter:none!important;z-index:2}
.wmf-sp input::placeholder{color:transparent}
.wmf-sp input::-webkit-search-cancel-button{-webkit-appearance:none}
.wmf-sp:focus-within>svg,.wmf-sp.typed>svg{position:absolute;left:16px}
.wmf-hint{position:relative;height:22px;display:flex;align-items:center;gap:.32em;font:600 14px/22px "Clash Display",Satoshi,sans-serif;letter-spacing:.01em;white-space:nowrap;pointer-events:none;color:var(--tx)!important}
.wmf-sp:focus-within .wmf-hint,.wmf-sp.typed .wmf-hint{visibility:hidden}
.wmf-hint .fx{opacity:.5}
.wmf-hint .rot{display:inline-grid;height:22px;overflow:hidden;flex:none}
.wmf-hint .rot span{grid-area:1/1;white-space:nowrap;transition:opacity .5s cubic-bezier(.4,0,.2,1),transform .5s cubic-bezier(.4,0,.2,1),filter .5s cubic-bezier(.4,0,.2,1)}
.wmf-hint .rot span.out,.wmf-hint .rot span.in{opacity:0;filter:blur(3.5px)}
.wmf-hint .rot span.out{transform:translateY(-11px)}.wmf-hint .rot span.in{transform:translateY(11px);transition:none}

/* filter button: dimmed to match the pill; glowing dot only while a filter is on */
.wmf-fb{flex:none;width:36px;height:36px;border-radius:18px;display:grid;place-items:center;position:relative;color:var(--mu);
 background:linear-gradient(180deg,var(--tint),transparent),var(--gl)!important;box-shadow:inset 0 1px 0 var(--hi),inset 0 0 0 1px var(--ln)}
.wmf-fb svg{opacity:.7}
.wmf-fb i{display:none;position:absolute;top:7px;right:8px;width:7px;height:7px;border-radius:50%;background:var(--ac);box-shadow:0 0 8px var(--ac)}
.wmf[data-f] .wmf-fb{color:var(--ac)}.wmf[data-f] .wmf-fb svg{opacity:1}.wmf[data-f] .wmf-fb i{display:block}

/* panel sits under the pill inside the grown shell; items fade in with a short stagger (v9) */
.wmf.wmf-m{position:fixed!important;z-index:9001!important;margin:0!important}
.wmf-m .wmf-pn{overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
.wmf-scrim{position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.28);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);opacity:0;visibility:hidden;transition:opacity .4s ease,visibility 0s .4s}
.wmf-scrim.on{opacity:1;visibility:visible;transition:opacity .4s ease}
html:not(.dark):not([data-theme=night]) .wmf-scrim{background:rgba(242,242,245,.35)}
.wmf-pn{position:absolute;left:3px;right:3px;top:calc(100% + 6px);padding:6px 4px 4px;pointer-events:none;visibility:hidden}
.wmf[data-s=open] .wmf-pn{pointer-events:auto;visibility:visible}
.wmf .it{opacity:0;transform:translateY(-6px);transition:opacity .18s ease,transform .22s ease}
.wmf[data-s=open] .it{opacity:1;transform:none;filter:none;transition:opacity .34s cubic-bezier(.2,.8,.2,1) calc(.14s + var(--d)),transform .44s cubic-bezier(.22,1,.36,1) calc(.14s + var(--d))}
.wmf .ph{display:flex;justify-content:space-between;align-items:baseline;margin:6px 6px 2px}
.wmf .ph span{font:600 17px/1 "Clash Display",Satoshi,sans-serif;letter-spacing:.01em}.wmf .ph small{font:500 12px Satoshi;color:var(--mu)}

/* grouped rows (v13 list) */
.wmf .grp{border-radius:18px;background:color-mix(in srgb,var(--card) 45%,transparent);box-shadow:inset 0 0 0 1px var(--ln);margin-top:8px;overflow:hidden}
.wmf .gr{display:flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;font:500 14.5px Satoshi;position:relative;cursor:pointer}
.wmf .gr+.gr:before,.wmf .inl+.gr:before{content:"";position:absolute;top:0;left:14px;right:0;height:1px;background:var(--ln)}
.wmf .gr>span{flex:1}
.wmf .gv{display:flex;align-items:center;gap:8px;min-height:44px;margin-right:-14px;padding-right:14px;max-width:62%}
.wmf .gv b{font:600 14px Satoshi;color:var(--gt);text-shadow:0 0 14px var(--gr);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wmf .gv svg{flex:none;color:var(--mu);opacity:.6;transition:transform .3s cubic-bezier(.32,.72,0,1)}
.wmf .gr.op .gv svg{color:var(--gt);opacity:1;transform:rotate(90deg)}
.wmf .mi{display:grid;place-items:center;flex:none;width:26px;height:26px;min-width:0;min-height:0;padding:0;border-radius:50%;color:var(--mu);box-shadow:inset 0 0 0 1px var(--ln);transition:color .25s,box-shadow .25s,background .25s}
.wmf .mi.act{color:var(--gt);box-shadow:inset 0 0 0 1px var(--gr);background:var(--glow)}
.wmf .inl{padding:2px 14px 12px}.wmf .inl[hidden]{display:none}

/* v13 option 2 chips with the soft selected glow */
.wmf .chips{display:flex;flex-wrap:wrap;gap:8px}
.wmf .c{display:flex;gap:6px;align-items:center;padding:10px 14px;border-radius:999px;font:500 14px/1 Satoshi;color:var(--tx);box-shadow:inset 0 1px 0 var(--hi),inset 0 0 0 1px var(--ln);transition:background .2s,box-shadow .2s,color .2s}
.wmf .c small{color:var(--mu);font-size:11.5px}
.wmf .c.on{background:var(--glow);box-shadow:inset 0 1px 0 var(--hi),inset 0 0 0 1px var(--gr),0 6px 16px -10px var(--gr);color:var(--gt);font-weight:700}.wmf .c.on small{color:var(--gt)}
.wmf .c:disabled{opacity:.4;cursor:default}
.wmf .c.qm{box-shadow:none;color:var(--gt);font-weight:600;padding-left:6px;padding-right:6px}
.wmf .none{font:500 13px Satoshi;color:var(--mu);padding:6px 2px}

/* v18 soft-fill city search, slides open under the City row */
.wmf .sr{display:grid;grid-template-rows:0fr;transition:grid-template-rows .4s cubic-bezier(.32,.72,0,1)}.wmf .sr.o{grid-template-rows:1fr}
.wmf .sr>div{overflow:hidden;min-height:0}
.wmf .sq{display:flex;align-items:center;gap:7px;height:30px;margin:0 0 10px;padding:0 6px 0 10px;border-radius:999px;background:color-mix(in srgb,var(--ln) 70%,transparent);color:var(--mu);
 opacity:0;transform:translateY(-6px);transition:opacity .22s ease,transform .4s cubic-bezier(.32,.72,0,1)}
.wmf .sr.o .sq{opacity:1;transform:none;transition:opacity .3s ease .08s,transform .4s cubic-bezier(.32,.72,0,1)}
.wmf .sq svg{opacity:.6;flex:none}
html body .wmf .sq input{flex:1;min-width:0;height:28px;border:0;outline:0;background:transparent;box-shadow:none;padding:0;margin:0;color:var(--tx);font:500 12.5px Satoshi;caret-color:var(--gt)}
.wmf .sq input::placeholder{color:var(--mu)}
.wmf .sq input::-webkit-search-cancel-button{-webkit-appearance:none}

/* footer */
.wmf .ft2{display:flex;align-items:center;justify-content:space-between;margin:14px 4px 2px}
.wmf .rq{font:500 14px Satoshi;color:var(--mu);padding:8px}
.wmf .ap2{padding:13px 22px;border-radius:999px;font:700 14.5px Satoshi;background:var(--glow);box-shadow:inset 0 1px 0 var(--hi),inset 0 0 0 1px var(--gr),0 10px 24px -12px var(--gr);color:var(--gt)}
@media(prefers-reduced-motion:reduce){.wmf,.wmf *,.wmf-sh,.wmf-scrim{transition:none!important}}`;

const ICON={
 mag:s=>'<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
 filt:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
 chev:'<svg width="8" height="13" viewBox="0 0 8 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 1.5 6.5 6.5 1.5 11.5"/></svg>'};
const EASE='cubic-bezier(.32,.72,0,1)';
const esc=v=>String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let uid=0;

/**
 * Build one filter bar around an existing search input.
 * cfg = {section, input, hints:[...], noun:[one,many],
 *        groups:[{id,label, items()=>[[value,label,count|null]], on(v), tap(v), value()=>summary, top?:5, search?:true}],
 *        total(), base(), active(), reset(), refresh()}
 */
function make(cfg){
 if(!document.getElementById('wmf-css')){const s=document.createElement('style');s.id='wmf-css';s.textContent=CSS;document.head.append(s)}
 const id='wmf'+(++uid),root=document.createElement('div');root.className='wmf';
 root.innerHTML='<div class="wmf-sh"></div><div class="wmf-row"><label class="wmf-sp">'+ICON.mag(17)+'<span class="wmf-hint" aria-hidden="true"><span class="fx">Search</span><span class="rot"></span></span></label>'+
  '<button type="button" class="wmf-fb" aria-label="Filters" aria-expanded="false" aria-controls="'+id+'">'+ICON.filt+'<i></i></button></div>'+
  '<div class="wmf-pn" id="'+id+'" role="region" aria-label="Filters"><div class="it ph"><span>Filters</span><small aria-live="polite"></small></div><div class="it grp"></div>'+
  '<div class="it ft2"><button type="button" class="rq">Reset all</button><button type="button" class="ap2"></button></div></div>';
 cfg.input.before(root);
 /* non-modal by design (MT 30 Oct): no scrim, no blur, no scroll lock, no outside-tap close; the open panel pushes the page down inline */
 const $=s=>root.querySelector(s),sh=$('.wmf-sh'),sp=$('.wmf-sp'),fb=$('.wmf-fb'),pn=$('.wmf-pn'),grp=$('.grp');
 sp.append(cfg.input);cfg.input.setAttribute('aria-label',cfg.input.getAttribute('placeholder')||'Search '+cfg.hints[0]);cfg.input.removeAttribute('placeholder');

 /* rows + inline chip areas are built once; only their contents are redrawn */
 const ui={};let openG=cfg.open||'',more={};const Q={},qk=g=>FQ?'*':(g.id||g);
 cfg.groups.forEach(g=>{
  const r=document.createElement('div');r.className='gr';r.dataset.g=g.id;
  r.innerHTML='<span>'+g.label+'</span>'+(g.search?'<button type="button" class="mi" aria-label="Find a '+g.label.toLowerCase()+'" aria-pressed="false">'+ICON.mag(12)+'</button>':'')+
   '<button type="button" class="gv" aria-expanded="false" aria-controls="'+id+g.id+'"><b></b>'+ICON.chev+'</button>';
  const inl=document.createElement('div');inl.className='inl';inl.id=id+g.id;inl.hidden=true;
  inl.innerHTML=(g.search?'<div class="sr"><div><div class="sq">'+ICON.mag(12)+'<input type="search" placeholder="Find a '+g.label.toLowerCase()+'" aria-label="Find a '+g.label.toLowerCase()+'" tabindex="-1"></div></div></div>':'')+'<div class="chips" role="group" aria-label="'+g.label+'"></div>';
  grp.append(r,inl);ui[g.id]={r,inl,chips:inl.querySelector('.chips'),b:r.querySelector('b'),gv:r.querySelector('.gv'),mi:r.querySelector('.mi'),sr:inl.querySelector('.sr'),sq:inl.querySelector('.sq input')};
 });
 [...pn.querySelectorAll('.it')].forEach((e,k)=>e.style.setProperty('--d',k*22+'ms'));

 function chipsHTML(g){
  let it=g.items();const all=it.length,u=ui[g.id],q=Q[qk(g)]||'';
  if(g.search&&q){if(FM){const s=q.toLowerCase();it=it.filter(([,l])=>l.toLowerCase().startsWith(s)||l.toLowerCase().includes(' '+s))}
   else{const nz=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),re=new RegExp('(^|[\\s\\-\'’/(])'+nz(q).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));it=it.filter(([,l])=>re.test(nz(l)))}}
  else if(g.top&&!more[g.id]&&all>g.top){const on=it.filter(([v])=>g.on(v));it=it.slice(0,g.top);on.forEach(x=>{if(!it.includes(x))it.push(x)})}
  let h=it.map(([v,l,n])=>{const o=g.on(v);return '<button type="button" class="c'+(o?' on':'')+'" data-v="'+esc(v)+'" aria-pressed="'+o+'"'+(n===0&&!o?' disabled':'')+'>'+esc(l)+(n==null?'':' <small>'+n+'</small>')+'</button>'}).join('');
  if(!it.length)h='<span class="none">'+(q?'No match':'None')+'</span>';
  if(g.top&&!q&&all>g.top)h+='<button type="button" class="c qm" data-more="1">'+(more[g.id]?'Top '+g.top+' ‹':'All '+all+' ›')+'</button>';
  setChips(u,h)}
 function draw(){
  cfg.groups.forEach(g=>{const u=ui[g.id],o=openG===g.id;u.b.textContent=g.value();if(!FLB)u.gv.setAttribute('aria-label',g.label+': '+u.b.textContent);u.r.classList.toggle('op',o);u.gv.setAttribute('aria-expanded',o);u.inl.hidden=!o;if(o)chipsHTML(g)});
  const n=cfg.total();$('.ph small').textContent=n+' of '+cfg.base();
  $('.ap2').textContent='Show '+n+' '+(n===1?cfg.noun[0]:cfg.noun[1]);
  const a=cfg.active();a?root.dataset.f='1':delete root.dataset.f;fb.setAttribute('aria-label',a?'Filters, '+a+' on':'Filters')}

 /* v9 geometry: shell wraps pill row when closed; grows -7/-9/-9 and down to the panel when open */
 const isOpen=()=>root.dataset.s==='open';
 function geo(anim){const s=sh.style,o=isOpen(),bh=root.offsetHeight;
  if(anim!==undefined){s.transition=reduced()?'none':['top','left','right','height','border-radius'].map(p=>p+' '+(anim?'.5s':'.42s')+' '+EASE+' '+(anim?'0s':'.06s')).join(',');root.style.transition=reduced()?'none':'margin-bottom '+(anim?'.5s':'.42s')+' '+EASE+' '+(anim?'0s':'.06s')}
  else root.style.transition=sh.style.transition.replace(/height/,'margin-bottom');
  if(o){s.top='-7px';s.left='-9px';s.right='-9px';s.height=(bh+7+6+pn.offsetHeight+6)+'px';s.borderRadius='30px';if(!M)root.style.setProperty('margin-bottom',(12+6+pn.offsetHeight+6)+'px','important')}
  else{s.top='0';s.left='0';s.right='0';s.height=bh+'px';s.borderRadius='22px';root.style.removeProperty('margin-bottom')}}
 /* modal (aerodrome only): centred in the viewport over a blurred, inert page; FLIP so the pill glides from its slot to the centre */
 const M=cfg.modal&&{scrim:Object.assign(document.createElement('div'),{className:'wmf-scrim'}),ph:document.createElement('div'),t:0};
 if(M){M.scrim.setAttribute('aria-hidden','true');document.body.append(M.scrim);M.scrim.addEventListener('click',()=>set(false));root.setAttribute('aria-modal','true')}
 function float(o){clearTimeout(M.t);const r0=root.getBoundingClientRect(),st=root.style;
  if(o){M.ph.style.height=root.offsetHeight+'px';root.before(M.ph);root.classList.add('wmf-m');
   const w=Math.min(560,innerWidth-32),bh=root.offsetHeight,room=innerHeight-32,ph=Math.min(pn.scrollHeight,room-bh-26);pn.style.maxHeight=ph+'px';
   st.width=w+'px';st.left=(innerWidth-w)/2+'px';st.top=Math.max(16,(innerHeight-bh-ph-20)/2)+'px';document.documentElement.style.overflow='hidden'}
  else{document.documentElement.style.overflow=''}
  const r1=(o?root:M.ph).getBoundingClientRect();
  if(!reduced()&&o){st.transition='none';st.transform='translate('+(r0.left-r1.left)+'px,'+(r0.top-r1.top)+'px)';root.offsetWidth;st.transition='transform .5s '+EASE;st.transform=''}
  if(!o){const done=()=>{root.classList.remove('wmf-m');['width','left','top','transform','transition'].forEach(k=>st[k]='');pn.style.maxHeight='';M.ph.remove();geo()};
   if(reduced())done();else{st.transition='transform .42s '+EASE+' .06s';st.transform='translate('+(r1.left-r0.left)+'px,'+(r1.top-r0.top)+'px)';M.t=setTimeout(done,500)}}
  M.scrim.classList.toggle('on',o)}
 function set(o){if(o===isOpen())return;if(o){draw();root.dataset.s='open'}else delete root.dataset.s;if(M)float(o);
  fb.setAttribute('aria-expanded',o);geo(o);if(!o&&root.contains(document.activeElement))fb.focus({preventScroll:true})}
 const regrow=()=>{if(isOpen()){sh.style.transition='height .4s '+EASE;geo()}};

 fb.addEventListener('click',()=>set(!isOpen()));
 $('.ap2').addEventListener('click',()=>set(false));
 $('.rq').addEventListener('click',()=>{cfg.reset();for(const k in Q)delete Q[k];cfg.groups.forEach(x=>{if(x.search&&ui[x.id])ui[x.id].sq.value=''});more={};cfg.refresh();draw();regrow()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&isOpen())set(false)});
 grp.addEventListener('click',e=>{
  const c=e.target.closest('.c'),mi=e.target.closest('.mi'),r=e.target.closest('.gr');
  if(c){const g=cfg.groups.find(x=>x.id===c.closest('.inl').id.slice(id.length));
   if(c.dataset.more){more[g.id]=!more[g.id];chipsHTML(g);regrow();return}
   if(c.disabled)return;g.tap(c.dataset.v);cfg.refresh();draw();regrow();return}
  if(mi){const g=r.dataset.g,u=ui[g],on=!u.sr.classList.contains('o');if(on&&openG!==g){openG=g;draw()}
   u.sr.classList.toggle('o',on);mi.classList.toggle('act',on);mi.setAttribute('aria-pressed',on);u.sq.tabIndex=on?0:-1;
   if(on)u.sq.focus({preventScroll:true});else if(Q[qk(g)]){Q[qk(g)]='';u.sq.value='';chipsHTML(cfg.groups.find(x=>x.id===g))}
   sh.style.transition='height .4s '+EASE;requestAnimationFrame(()=>geo());setTimeout(regrow,420);return}
  if(r){openG=openG===r.dataset.g?'':r.dataset.g;draw();regrow()}});
 grp.addEventListener('input',e=>{if(!e.target.closest('.sq'))return;const g=cfg.groups.find(x=>x.search&&ui[x.id].sq===e.target)||cfg.groups.find(x=>x.search);Q[qk(g)]=e.target.value.trim();chipsHTML(g);regrow()});
 addEventListener('resize',()=>{sh.style.transition='none';geo()});

 /* v8b hint: "Search" + rotating word, slide up with soft blur every 2.6 s while idle */
 const rot=$('.rot');let hi=0;rot.innerHTML='<span>'+cfg.hints[0]+'</span>';
 const typed=()=>sp.classList.toggle('typed',!!cfg.input.value);cfg.input.addEventListener('input',typed);typed();
 setInterval(()=>{if(reduced()||document.hidden||isOpen()||sp.matches(':focus-within')||cfg.input.value||!root.offsetParent)return;
  const o=rot.firstChild;o.className='out';hi=(hi+1)%cfg.hints.length;const n=document.createElement('span');n.className='in';n.textContent=cfg.hints[hi];rot.append(n);
  requestAnimationFrame(()=>requestAnimationFrame(()=>n.className=''));setTimeout(()=>o.remove(),550)},2600);

 cfg.section.dataset.wmf='1';draw();geo();
 return {set,draw,root,isOpen}}

const toggle=(s,v)=>s.has(v)?s.delete(v):s.add(v);
const list=(s,all,none)=>!s.size?all:s.size===1?[...s][0]:[...s][0]+' +'+(s.size-1);
const byCount=(m)=>Object.keys(m).sort((a,b)=>m[b]-m[a]||a.localeCompare(b));

/* ---------------- ATO page ---------------- */
function ato(){
 const sec=document.getElementById('ato'),q=document.getElementById('q2'),M=window.WDSMF,X=window.WMX;
 if(!sec||!q||!M||!X||typeof T==='undefined')return false;
 const S=X.S.ato,dto=document.getElementById('dto'),inv=document.getElementById('inv'),FAMM=window.WMX_FAM||{};
 const FAMS=[['lic','Licences'],['inst','Instrument'],['night','Night'],['instr','Instructor'],['type','Multi-engine & type'],['other','Helicopter & other']];
 const SORT=[['name','Name A–Z'],['most','Most courses'],['exp1','Expiring soonest'],['exp2','Expiring latest']];
 const PER=[['10','10'],['20','20'],['50','50'],['all','All']];
 const menu=v=>sec.querySelector('.wx-menu [data-v="'+v+'"]');               /* wds.js sort menu (locked): drive it, don't copy it */
 const per=()=>localStorage.getItem('wds-pp-ato')||'50';
 const persist=()=>{try{sessionStorage.setItem('wds-mf',JSON.stringify({p:[...M.P],c:[...M.C],k:[...M.K]}))}catch(e){}};
 /* province counts ignore the city choice so another province is never greyed out by it */
 /* one counting row per ATO with the same merged province/city wq.js filters on */
 const ROWS=T.map(t=>{const l=(typeof ATOLOC!=='undefined'&&ATOLOC[t.certificate_number+'|'+t.name])||['',''];const [p,c]=M.N(l);
  return {p,c,fam:new Set(M.CS(t).map(x=>FAMM[x]||'other')),dto:typeof isDto==='function'&&isDto(t),ok:/^valid/i.test(t.status)}});
 const inc=r=>(dto.checked||!r.dto)&&(inv.checked||r.ok);
 const pass=(r,skip='')=>inc(r)&&(skip.includes('p')||!M.P.size||M.P.has(r.p))&&(skip.includes('c')||!M.C.size||M.C.has(r.p+'|'+r.c))&&(skip.includes('f')||!S.f||r.fam.has(S.f));
 const cnt=(skip,f)=>ROWS.filter(r=>pass(r,skip)&&f(r)).length;
 const real=v=>v&&!/^(Unknown|Other)$/.test(v);
 const ui=make({section:sec,input:q,hints:['ATOs','courses','cities','provinces'],noun:['school','schools'],open:'c',
  groups:[
   {id:'p',label:'Province',top:5,value:()=>list(M.P,'All'),on:v=>M.P.has(v),
    items:()=>{const m={};ROWS.forEach(r=>{if(real(r.p))m[r.p]=0});Object.keys(m).forEach(p=>m[p]=cnt('pc',r=>r.p===p));return byCount(m).map(p=>[p,p,m[p]])},
    tap:v=>{toggle(M.P,v);if(M.P.size)[...M.C].forEach(k=>{if(!M.P.has(k.split('|')[0]))M.C.delete(k)})}},
   {id:'c',label:'City',top:5,search:true,value:()=>M.C.size?list(new Set([...M.C].map(k=>k.split('|')[1])),''):'All',on:v=>M.C.has(v),
    /* cities are limited to the chosen province(s) */
    items:()=>{const m={};ROWS.forEach(r=>{if(real(r.c)&&(!M.P.size||M.P.has(r.p))&&pass(r,'c')){const k=r.p+'|'+r.c;m[k]=(m[k]||0)+1}});[...M.C].forEach(k=>m[k]=m[k]||0);
     return byCount(m).map(k=>[k,k.split('|')[1],m[k]])},tap:v=>toggle(M.C,v)},
   {id:'f',label:'Courses',value:()=>(FAMS.find(f=>f[0]===S.f)||[,'Any'])[1],on:v=>S.f===v,items:()=>FAMS.map(([f,l])=>[f,l,cnt('f',r=>r.fam.has(f))]),tap:v=>{S.f=S.f===v?'':v}},
   {id:'s',label:'Sort by',value:()=>(SORT.concat([['near','Near me']]).find(s=>s[0]===S.s)||SORT[0])[1],on:v=>S.s===v,items:()=>SORT.map(([v,l])=>[v,l,null]),tap:v=>{const b=menu(v);b&&b.click()}},
   {id:'n',label:'How many',value:()=>per()==='all'?'All':per(),on:v=>per()===v,items:()=>PER.map(([v,l])=>[v,l,null]),tap:v=>{const b=sec.querySelector('.wds-sm [data-pp="'+v+'"]');b&&b.click()}},
   {id:'o',label:'Include',value:()=>[S.s==='near'&&'Near me',dto.checked&&'DTO',inv.checked&&'Non-valid'].filter(Boolean).join(', ')||'Valid ATOs',
    on:v=>v==='near'?S.s==='near':(v==='dto'?dto:inv).checked,items:()=>[['near','Near me',null],['dto','DTO / paragliding',null],['inv','Non-valid ATOs',null]],
    tap:v=>{if(v==='near'){const b=menu(S.s==='near'?'name':'near');b&&b.click();return}const i=v==='dto'?dto:inv;i.checked=!i.checked}}],
  total:()=>ROWS.filter(r=>pass(r)).length,base:()=>ROWS.filter(inc).length,
  active:()=>M.P.size+M.C.size+(S.f?1:0)+(dto.checked?1:0)+(inv.checked?1:0)+(S.s==='near'?1:0),
  reset:()=>{M.P.clear();M.C.clear();M.K.clear();S.f='';dto.checked=false;inv.checked=false;if(S.s!=='name'){const b=menu('name');b&&b.click()}},
  refresh:()=>{persist();X.r2()}});
 window.WMFato=ui;X.r2();return true}

/* ---------------- DFE page: Province (merged spellings) + Designation; no City, no Near me ---------------- */
const PROV=['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','North West','Northern Cape','Western Cape'];
const ALIAS={kzn:'KwaZulu-Natal',natal:'KwaZulu-Natal',wc:'Western Cape',ec:'Eastern Cape',gp:'Gauteng',fs:'Free State',nw:'North West',nc:'Northern Cape',ofs:'Free State',orangefreestate:'Free State'};
const pkey=s=>String(s||'').toLowerCase().replace(/[^a-z]/g,'');
/** One canonical name per province ("Kwazulu Natal", "KZN" -> "KwaZulu-Natal"); blanks -> "Unknown". */
const prov=s=>{const k=pkey(s);return PROV.find(p=>pkey(p)===k)||ALIAS[k]||(k?'Other':'Unknown')};
function dfe(){
 const sec=document.getElementById('dfe'),q=document.getElementById('q3'),X=window.WMX;
 if(!sec||!q||!X||typeof DF==='undefined'||!window.HIDE_DFE)return false;
 const S=X.S.dfe,ex=document.getElementById('dx'),P=new Set(),G=new Set();
 const DES=['DFE 1 (A)','DFE 2 (A)','DFE 3 (A)','DFE 1 (H)','DFE 2 (H)','DFE 3 (H)'];
 const SORT=[['name','Name A–Z'],['most','Most ratings'],['exp1','Expiring soonest'],['exp2','Expiring latest']];
 const PER=[['10','10'],['20','20'],['50','50'],['all','All']];
 const menu=v=>sec.querySelector('.wx-menu [data-v="'+v+'"]');
 const per=()=>localStorage.getItem('wds-pp-dfe')||'50';
 try{const v=JSON.parse(sessionStorage.getItem('wmf-dfe')||'{}');(v.p||[]).forEach(x=>P.add(x));(v.g||[]).forEach(x=>G.add(x))}catch(e){}
 const ROWS=DF.filter(d=>!HIDE_DFE.has(d.name.trim().toLowerCase())).map(d=>({p:prov(d.province),g:d.desigs||[d.designation],ok:/^valid/i.test(d.status)}));
 const inc=r=>ex.checked||r.ok;
 const pass=(r,skip='')=>inc(r)&&(skip==='p'||!P.size||P.has(r.p))&&(skip==='g'||!G.size||r.g.some(x=>G.has(x)));
 const cnt=(skip,f)=>ROWS.filter(r=>pass(r,skip)&&f(r)).length;
 /* app.html dfeList() asks this predicate on top of its own search/expired test */
 window.FVDFE=d=>(!P.size||P.has(prov(d.province)))&&(!G.size||(d.desigs||[d.designation]).some(x=>G.has(x)));
 const ui=make({section:sec,input:q,hints:['DFEs','ratings','provinces','designations'],noun:['examiner','examiners'],open:'p',
  groups:[
   {id:'p',label:'Province',top:5,value:()=>list(P,'All'),on:v=>P.has(v),
    items:()=>{const m={};ROWS.forEach(r=>{if(PROV.includes(r.p))m[r.p]=0});Object.keys(m).forEach(p=>m[p]=cnt('p',r=>r.p===p));return byCount(m).map(p=>[p,p,m[p]])},tap:v=>toggle(P,v)},
   {id:'g',label:'Designation',value:()=>list(G,'All'),on:v=>G.has(v),items:()=>DES.map(g=>[g,g,cnt('g',r=>r.g.includes(g))]),tap:v=>toggle(G,v)},
   {id:'s',label:'Sort by',value:()=>(SORT.find(s=>s[0]===S.s)||SORT[0])[1],on:v=>S.s===v,items:()=>SORT.map(([v,l])=>[v,l,null]),tap:v=>{const b=menu(v);b&&b.click()}},
   {id:'n',label:'How many',value:()=>per()==='all'?'All':per(),on:v=>per()===v,items:()=>PER.map(([v,l])=>[v,l,null]),tap:v=>{const b=sec.querySelector('.wds-sm [data-pp="'+v+'"]');b&&b.click()}},
   {id:'o',label:'Include',value:()=>ex.checked?'Expired':'Valid DFEs',on:()=>ex.checked,items:()=>[['x','Expired DFEs',null]],tap:()=>{ex.checked=!ex.checked}}],
  total:()=>ROWS.filter(r=>pass(r)).length,base:()=>ROWS.filter(inc).length,
  active:()=>P.size+G.size+(ex.checked?1:0),
  reset:()=>{P.clear();G.clear();ex.checked=false;if(S.s!=='name'){const b=menu('name');b&&b.click()}},
  refresh:()=>{try{sessionStorage.setItem('wmf-dfe',JSON.stringify({p:[...P],g:[...G]}))}catch(e){}X.r3()}});
 window.WMFdfe=ui;X.r3();return true}

const HIDE='html body section#ato[data-wmf] .bar.wds-stack>.wq-loc,html body section#dfe[data-wmf] .bar>.wq-loc,html body section#dfe[data-wmf] .wds-dshow,html body section[data-wmf] .bar.wds-stack>.wq-loc,html body section[data-wmf] .wds-fa,html body section[data-wmf] .wds-fr,html body section[data-wmf] .wx-legend,'+
 'html body section[data-wmf] .wx-sortb,html body section[data-wmf] .wds-dshow,html body section[data-wmf] .bar>select,html body section[data-wmf] .bar>label{display:none!important}';

/* shared builder: the aerodrome filter (fv3.js on main.html) uses the same design */
window.WMFUI={make};

/* wq.js / wds.js build their bars after load: retry briefly until the page objects exist */
let n=0;const boot=()=>{if(!document.getElementById('wmf-hide')){const s=document.createElement('style');s.id='wmf-hide';s.textContent=HIDE;document.head.append(s)}
 const a=!document.getElementById('q2')||!!window.WMFato||ato(),d=!document.getElementById('q3')||!!window.WMFdfe||dfe();if(!(a&&d)&&++n<50)setTimeout(boot,100)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
