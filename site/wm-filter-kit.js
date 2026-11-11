/* COPY of tools/filter-kit/filter-kit.js (served). Edit the tools/ file, then copy here. */
/* filter-kit.js: the ATO/DFE filter motion (site/c/wst/wmf9.js, Claude plan step 6) as a reusable engine.
 * "When MT says filter, use this."
 *   const f = WMFilter.create(rootEl, { list: mainEl | [els] | ()=>els, open: false, gap: 12, growSide: 9 (px the open shell grows left/right; 0 = stay aligned with the column), growTop: 7 (px it grows up; 0 = never rises over what sits above), beforeToggle, onToggle, bindButton: true });
 *   count: { noun:'DFEs', shown:()=>n, total:()=>m, filters:()=>k, after:el (default rootEl) }  REQUIRED: the count line.
 *   f.count() redraws the line (call it after every filter change).
 *   f.open(); f.close(); f.toggle(); f.regrow(); f.isOpen(); f.destroy();
 * rootEl must contain .wmf-sh (glass shell), .wmf-fb (filter button) and .wmf-pn (panel).
 * Rules: transform only during the animation (FLIP); layout (margin) changes once per toggle, never per frame;
 * reduced motion = instant; no inner scroll (panel is never a scroll box).
 */
/* --- count line (MT t1761/t1765/t1766): MANDATORY part of every kit filter ---
 * One line under the filter: "<b class=wmf-n>N</b> of M nouns · k filters" (the old DFE header line text and code),
 * plain text exactly like the old DFE header line (no glass, MT t1771): 500 13px Satoshi, --tx2, number bold in the theme ink (4 themes).
 * WMCountLine.put(afterEl, n, m, noun, k) puts/updates the line right after afterEl. Pages hide any other count. */
(function(g){if(g.WMCountLine)return;
 var css='.wmcl{display:block;margin:6px 0 0;padding:0;background:none;box-shadow:none;border:0}' +
    '.wmcl p{margin:0;padding:0;background:none;box-shadow:none;border:0;-webkit-backdrop-filter:none;backdrop-filter:none;color:var(--tx2);font:500 13px/1.4 \'Satoshi\',-apple-system,sans-serif;font-variant-numeric:normal}' +
    /* number ink: same values as wmf9.js --wmf-n1 */
    '.wmcl{--wmcl-n:#0019C9}html.pal-beige:not(.dark) .wmcl,html[data-theme=day][data-pal=beige] .wmcl{--wmcl-n:#6E531F}' +
    'html.dark .wmcl,html[data-theme=night] .wmcl{--wmcl-n:#F5F5F7}html.dark.pal-purple .wmcl,html[data-theme=night][data-pal=purple] .wmcl{--wmcl-n:#F3EEFF}' +
    '.wmcl p b.wmf-n{color:var(--wmcl-n);font-weight:700}';
 function addCss(){if(document.getElementById('wmcl-css'))return;var st=document.createElement('style');st.id='wmcl-css';st.textContent=css;(document.head||document.documentElement).appendChild(st);document.documentElement.classList.add('has-wmcl')}
 addCss();
 g.WMCountLine={put:function(after,n,m,noun,k){if(!after||!after.parentNode)return null;addCss();
  var el=after.nextElementSibling;
  if(!el||!el.classList.contains('wmcl')){el=document.createElement('div');el.className='wmcl';el.setAttribute('aria-live','polite');el.innerHTML='<p></p>';after.parentNode.insertBefore(el,after.nextSibling)}
  var h='<b class="wmf-n">'+n+'</b> of '+m+' '+noun+(k?' \u00b7 '+k+' filter'+(k===1?'':'s'):'');
  if(el.firstChild.innerHTML!==h)el.firstChild.innerHTML=h;return el}};
})(window);
(function(g){'use strict';
const EASE='cubic-bezier(.32,.72,0,1)',OPEN_MS=500,CLOSE_MS=420,CLOSE_DELAY=60,R_CLOSED=22,R_OPEN=30,GAP=12;
const reduced=()=>g.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function create(root,o){o=o||{};
 const sh=root.querySelector('.wmf-sh'),pn=root.querySelector('.wmf-pn'),fb=o.button||root.querySelector('.wmf-fb'),lists=()=>{const l=typeof o.list==='function'?o.list():o.list;return !l?[]:Array.isArray(l)?l.filter(Boolean):[l]};
 if(!o.count)console.error('WMFilter.create: opts.count is required (the count line is a mandatory part of the kit)');
 const count=()=>{const c=o.count;if(!c||!g.WMCountLine)return null;return WMCountLine.put(c.after||root,c.shown(),c.total(),c.noun,c.filters?c.filters():0)};
 let extra=0,flipT=0,shAnim=null;const isOpen=()=>root.dataset.s==='open';
 let anT;
 function push(next,ms,delay){const d=next-extra;clearTimeout(flipT);if(!d)return;
  const Ls=lists(),gap=o.gap!=null?o.gap:GAP,setM=v=>{extra=v;v?root.style.setProperty('margin-bottom',(gap+v)+'px','important'):root.style.removeProperty('margin-bottom')},
   each=f=>Ls.forEach(e=>f(e.style));
  // Scroll anchoring + a moving list makes Chrome flip scrollY every frame when the page is scrolled; pin it off while we animate.
  const SE=document.scrollingElement||document.documentElement;clearTimeout(anT);SE.style.overflowAnchor='none';anT=setTimeout(()=>{SE.style.overflowAnchor=''},(ms||0)+(delay||0)+80);
  if(!Ls.length||ms==null){setM(next);each(L=>{L.transition='';L.transform=''});return}
  if(d>0){setM(next);each(L=>{L.transition='none';L.transform='translateY('+(-d)+'px)'});root.offsetHeight;each(L=>{L.transition='transform '+ms+'ms '+EASE+' '+delay+'ms';L.transform=''})}
  else{each(L=>{L.transition='transform '+ms+'ms '+EASE+' '+delay+'ms';L.transform='translateY('+d+'px)'});flipT=setTimeout(()=>{each(L=>{L.transition='none';L.transform=''});setM(next)},ms+delay)}}
 function geo(op,anim){
  const s=sh.style,bh=root.offsetHeight,ph=pn.offsetHeight,ms=anim==null||reduced()?null:(anim?OPEN_MS:CLOSE_MS),delay=anim?0:CLOSE_DELAY;
  const r0=shAnim?null:sh.getBoundingClientRect(),rad0=parseFloat(getComputedStyle(sh).borderTopLeftRadius)||R_CLOSED;
  const from=shAnim&&shAnim._to?shAnim._now():{r:r0,rad:rad0};if(shAnim){shAnim.cancel();shAnim=null}
  s.transition='none';
  const gs=o.growSide!=null?o.growSide:9,gt=o.growTop!=null?o.growTop:7;if(op){s.top=(-gt)+'px';s.left=(-gs)+'px';s.right=(-gs)+'px';s.height=(bh+gt+6+ph+6)+'px';s.borderRadius=R_OPEN+'px'}
  else{s.top='0';s.left='0';s.right='0';s.height=bh+'px';s.borderRadius=R_CLOSED+'px'}
  push(op?6+ph+6:0,ms,delay);
  if(ms==null||!from.r||!sh.animate)return;
  const b=sh.getBoundingClientRect(),rad1=op?R_OPEN:R_CLOSED;if(!b.width||!b.height||!from.r.width)return;
  const sx0=from.r.width/b.width,sy0=from.r.height/b.height,dx0=from.r.left-b.left,dy0=from.r.top-b.top,kf=[];
  for(let i=0;i<=10;i++){const p=i/10,sx=sx0+(1-sx0)*p,sy=sy0+(1-sy0)*p,rr=from.rad+(rad1-from.rad)*p;
   kf.push({offset:p,transform:'translate('+(dx0*(1-p))+'px,'+(dy0*(1-p))+'px) scale('+sx+','+sy+')',borderRadius:(rr/sx)+'px / '+(rr/sy)+'px'})}
  s.transformOrigin='0 0';const a=sh.animate(kf,{duration:ms,delay,easing:EASE,fill:'backwards'});shAnim=a;a._to=b;
  a._now=()=>({r:sh.getBoundingClientRect(),rad:rad1});a.oncancel=()=>{if(shAnim===a)shAnim=null};
  a.onfinish=()=>{if(shAnim===a){shAnim=null;if(isOpen()&&Math.abs(sh.offsetHeight-(root.offsetHeight+(o.growTop!=null?o.growTop:7)+6+pn.offsetHeight+6))>1)geo(true,null)}}}
 function set(op,anim=true){o.beforeToggle&&o.beforeToggle(op);op?root.dataset.s='open':delete root.dataset.s;if(fb)fb.setAttribute('aria-expanded',op);
  geo(op,anim?op:null);if(!op&&pn.contains(document.activeElement)&&fb)fb.focus({preventScroll:true});o.onToggle&&o.onToggle(op)}
 const onClick=()=>set(!isOpen());if(fb&&o.bindButton!==false)fb.addEventListener('click',onClick);
 const onResize=()=>{if(shAnim){shAnim.cancel();shAnim=null}geo(isOpen(),null)};addEventListener('resize',onResize);
 const ro=new ResizeObserver(()=>{if(isOpen()&&!shAnim)geo(true,null)});ro.observe(pn);
 set(!!o.open,false);count();
 return{open:()=>set(true),close:()=>set(false),toggle:onClick,isOpen,count,regrow:()=>{if(isOpen())geo(true,true)},
  destroy(){fb&&fb.removeEventListener('click',onClick);removeEventListener('resize',onResize);ro.disconnect()}}}
g.WMFilter={create,EASE,OPEN_MS,CLOSE_MS,CLOSE_DELAY};
})(window);

/* Neat "Show N" pill (MT t1797/t1799): injected so every kit filter gets it automatically. Class .wmf-ap in .wmf-ft, or .wmf-show. */
(function(){if(typeof document==='undefined')return;function add(){if(document.getElementById('wmf-show-pill'))return;var st=document.createElement('style');st.id='wmf-show-pill';st.textContent='.wmf .wmf-ft button.wmf-ap,.wmf button.wmf-show{flex:none!important;width:auto!important;min-width:0!important;padding:8px 14px!important;border-radius:999px!important;line-height:1.2!important;background:var(--gl2,var(--gl))!important;box-shadow:inset 0 1px 0 var(--hl,var(--hi)),inset 0 0 0 1px var(--tx3,var(--ln)),0 8px 24px -14px rgba(0,0,0,.35)!important;color:var(--tx)!important;-webkit-backdrop-filter:blur(18px) saturate(1.6);backdrop-filter:blur(18px) saturate(1.6);transition:transform .25s cubic-bezier(.32,.72,0,1),background .3s,box-shadow .3s}.wmf .wmf-ft button.wmf-ap:active,.wmf button.wmf-show:active{transform:scale(.97)}';(document.head||document.documentElement).appendChild(st)}if(document.head)add();else document.addEventListener('DOMContentLoaded',add)})();
