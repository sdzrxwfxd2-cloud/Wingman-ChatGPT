/* Refresh FX v9b (v9 + NO-GO/status-tile flash fix under the sticky pin + red failure state)
   Look: the glass refresh icon lights from within (no outer halo); a comet-tailed rope orbits behind the glass while loading;
   on success the rope accelerates and launches a ring across the page, cards/tiles/lights glint; slow fade back.
   Failure (no .wmok when .ld clears), 15s safety, or ignored tap: calm fade-out, no sweep, no GO/CAUTION flash.
   Perf: only opacity/transform animate. Lit state is a prebuilt layer (.wfl) crossfaded by opacity; the rope glow is baked into
   a wider faint ring (no filters animate); no backdrop-filter is added or removed. Colour hook: --wfx-c (dark white, day #001CBF). */
(()=>{const MIN=1000,SAFE=15e3,NOLD=700,D=800,W='cubic-bezier(.12,.7,.22,1)',E='cubic-bezier(.4,0,.2,1)',CAP=80,RM=matchMedia('(prefers-reduced-motion: reduce)');
const css=`:root{--wfx-c:255,255,255;--wfx-b:.09;--wfx-r:248,15,59}html[data-theme=day]{--wfx-c:0,28,191;--wfx-b:.10}
.wfx{position:fixed;inset:0;pointer-events:none;z-index:2147483000;overflow:hidden;contain:strict}
.wfx .b{position:absolute;left:calc(var(--x) - 120px);top:calc(var(--y) - 120px);width:240px;height:240px;border-radius:50%;opacity:0;transform:rotate(var(--a)) scale(.18);will-change:transform,opacity;
 background:conic-gradient(from 0deg,rgba(var(--wfx-c),calc(var(--wfx-b)*2.6)),rgba(var(--wfx-c),var(--wfx-b)) 25%,rgba(var(--wfx-c),calc(var(--wfx-b)*.7)) 60%,rgba(var(--wfx-c),calc(var(--wfx-b)*1.6)));
 -webkit-mask:radial-gradient(closest-side,transparent 70%,#000 80%,#000 86%,transparent 97%);mask:radial-gradient(closest-side,transparent 70%,#000 80%,#000 86%,transparent 97%)}
.wfx.go .b{animation:wfB ${D}ms ${W} forwards}@keyframes wfB{8%{opacity:1}78%{opacity:1}to{transform:rotate(var(--a)) scale(var(--k));opacity:0}}
.wfu{position:absolute;width:0;height:0;pointer-events:none;z-index:0}
.wfu .r{position:absolute;left:-24px;top:-24px;width:48px;height:48px;border-radius:50%;opacity:0;transition:opacity .9s cubic-bezier(.45,0,.25,1);will-change:transform,opacity;animation:wfS 1.1s linear infinite}
.wfu .r::before,.wfu .r::after{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,transparent 0deg,rgba(var(--wfx-c),0) 140deg,rgba(var(--wfx-c),.35) 270deg,rgba(var(--wfx-c),1) 356deg,transparent 360deg)}
.wfu .r::before{-webkit-mask:radial-gradient(closest-side,transparent 86%,#000 89%,#000 95%,transparent 98%);mask:radial-gradient(closest-side,transparent 86%,#000 89%,#000 95%,transparent 98%)}
.wfu .r::after{opacity:.28;-webkit-mask:radial-gradient(closest-side,transparent 78%,#000 88%,#000 96%,transparent 100%);mask:radial-gradient(closest-side,transparent 78%,#000 88%,#000 96%,transparent 100%)}
.wfu .t{position:absolute;left:-21px;top:-21px;width:42px;height:42px;border-radius:50%;opacity:0;box-shadow:0 0 0 1px rgba(var(--wfx-c),.14);transition:opacity .9s ease}
.wfu.on .r,.wfu.on .t{opacity:1}.wfu.out .r,.wfu.out .t{opacity:0;transition:opacity .5s ease}.wfu.calm .r,.wfu.calm .t{opacity:0;transition:opacity .9s ease}
@keyframes wfS{to{transform:rotate(360deg)}}
.wfl{position:absolute;inset:0;border-radius:inherit;pointer-events:none;display:grid;place-items:center;opacity:0;z-index:1;will-change:opacity;transition:opacity 1.4s cubic-bezier(.45,0,.25,1);
 background:radial-gradient(closest-side at 50% 54%,rgba(var(--wfx-c),.34),rgba(var(--wfx-c),.12) 48%,rgba(var(--wfx-c),.02) 78%,transparent),linear-gradient(180deg,rgba(255,255,255,.16),transparent 40%);
 box-shadow:inset 0 0 6px rgba(var(--wfx-c),.22),inset 0 1px 0 rgba(255,255,255,.85),inset 0 0 0 .5px rgba(255,255,255,.5)}
html[data-theme=day] .wfl{background:radial-gradient(120% 95% at 50% 62%,rgba(255,255,255,.95),rgba(120,150,255,.30) 45%,rgba(0,28,191,.08) 75%,transparent),linear-gradient(180deg,rgba(255,255,255,.6),transparent 50%);box-shadow:inset 0 0 10px rgba(0,28,191,.28),inset 0 1px 0 #fff}
.wfl svg{width:15px;height:15px;fill:none;stroke:rgb(var(--wfx-c));stroke-width:2.25;stroke-linecap:round;stroke-linejoin:round;
 filter:drop-shadow(0 0 1px rgba(255,255,255,.95)) drop-shadow(0 0 4px rgba(var(--wfx-c),.9)) drop-shadow(0 0 9px rgba(var(--wfx-c),.5))}
html[data-theme=day] .wfl svg{filter:drop-shadow(0 0 1px #fff) drop-shadow(0 0 4px rgba(0,28,191,.75)) drop-shadow(0 0 9px rgba(0,28,191,.35))}
.wfa>.wfl{opacity:.85}.wfa.wfp>.wfl{opacity:1;transition-duration:.18s}.wfa.wff>.wfl,.wfa.wfc>.wfl{opacity:0;transition-duration:1.1s}
.wfa>svg:not(.wfz){transition:opacity 1.2s ease;opacity:0}.wfa.wff>svg:not(.wfz),.wfa.wfc>svg:not(.wfz){opacity:1;transition-duration:1.1s}
.wfn{position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;box-shadow:inset 0 0 0 1.5px var(--c,currentColor),inset 0 0 14px -4px var(--c,currentColor)}
/* v9b red failure: prebuilt red lit layer + red rope, same hook (--wfx-c scoped to red), crossfaded by opacity only */
.wfu .rr,.wfl.wfr{--wfx-c:var(--wfx-r)}
.wfu.on .rr{opacity:0}.wfu.on.wfe .r:not(.rr){opacity:0;transition:opacity .6s ease}.wfu.on.wfe .rr{opacity:1;transition:opacity .6s ease}
.wfu.on.wfe .t{box-shadow:0 0 0 1px rgba(var(--wfx-r),.18)}.wfu.on.wfe.calm .rr,.wfu.on.wfe.calm .r{opacity:0;transition:opacity .9s ease}
html[data-theme=day] .wfl.wfr{background:radial-gradient(120% 95% at 50% 62%,rgba(255,255,255,.95),rgba(255,120,140,.30) 45%,rgba(var(--wfx-r),.08) 75%,transparent),linear-gradient(180deg,rgba(255,255,255,.6),transparent 50%);box-shadow:inset 0 0 10px rgba(var(--wfx-r),.28),inset 0 1px 0 #fff}
html[data-theme=day] .wfl.wfr svg{filter:drop-shadow(0 0 1px #fff) drop-shadow(0 0 4px rgba(var(--wfx-r),.75)) drop-shadow(0 0 9px rgba(var(--wfx-r),.35))}
.wfa>.wfl.wfr{opacity:0}.wfa.wfe>.wfl:not(.wfr){opacity:0;transition-duration:.6s}.wfa.wfe>.wfl.wfr{opacity:.9;transition-duration:.6s}.wfa.wfe.wfc>.wfl.wfr{opacity:0;transition-duration:1.1s}
@media (prefers-reduced-motion:reduce){.wfu .r{animation:none}.wfx.go .b{animation:none}}`;
const NEON='.wfn{position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;box-shadow:inset 0 0 0 1.5px var(--c,currentColor),inset 0 0 14px -4px var(--c,currentColor)}';
const add=(r,t)=>{if(r.__wfx)return;r.__wfx=1;const s=document.createElement('style');s.textContent=t;(r.head||r).appendChild(s)};add(document,css);
const roots=()=>{const r=[document],p=document.getElementById('wmPin');p&&p.shadowRoot&&r.push(p.shadowRoot);
 document.querySelectorAll('iframe.wmsec.on').forEach(f=>{try{f.contentDocument&&r.push(f.contentDocument)}catch(e){}});return r};
const offY=n=>{const w=n.ownerDocument.defaultView;return w===window?0:w.frameElement.getBoundingClientRect().top};
function glints(x,y,track){const vw=innerWidth,vh=innerHeight,R=Math.hypot(Math.max(x,vw-x),Math.max(y,vh-y));
 const sel=vw>=1024?'.tile,.badge,.tile .d':'.card:not(.wpg-off),.tile,.badge,.tile .d',jobs=[];
 const pe=document.getElementById('wmPin'),pin=pe&&pe.shadowRoot;
 roots().forEach(r=>{r!==document&&add(r,NEON);r.querySelectorAll(sel).forEach(el=>{if(pin&&r!==pin&&el.closest('nav.tiles'))return;const b=el.getBoundingClientRect();if(!b.width&&!b.height)return;const t=b.top+offY(el);if(t+b.height<0||t>vh)return;   // D5: hidden (display:none) cards are 0x0 at (0,0) - skip them   // READ pass
  jobs.push([el,Math.pow(Math.hypot(b.left+b.width/2-x,t+b.height/2-y)/R,1.6)*D*.8,el.classList.contains('tile')||el.classList.contains('badge')?getComputedStyle(el).position:''])})});
 jobs.sort((p,q)=>p[1]-q[1]);if(jobs.length>CAP)jobs.length=CAP;   // D5 safety net: keep only the CAP earliest-delay glints
 for(const [el,d,pos] of jobs){const c=el.classList,o={delay:d,easing:E};   // WRITE pass
  if(c.contains('card')){track(el.animate([{translate:'0 0'},{translate:'0 2px',offset:.35},{translate:'0 0'}],{...o,duration:520}));continue}   // separate property: composes with existing transform
  if(c.contains('d')){track(el.animate([{scale:'1'},{scale:'1.35',offset:.35},{scale:'1'}],{...o,duration:480}));continue}
  if(pos==='static'){el.style.position='relative';track(null,()=>el.style.position='')}
  const n=document.createElement('i');n.className='wfn';el.appendChild(n);track(n.animate([{opacity:0},{opacity:1,offset:.25},{opacity:0}],{...o,duration:620,easing:'ease-out'}),()=>n.remove())}}
let cur=null;
function fx(btn){if(document.getElementById('wfxoff'))return;
 if(cur){if(!cur.tail)return;cur.kill()}   // mid-load tap: app ignores it too; mid-tail tap: finish old run instantly, start fresh
 const run={tail:0},undo=[],anims=[];let o,u,lit,red,mo,mo2,sf,nl,t0=performance.now(),seen=0,done=0;
 const track=(a,f)=>{a&&anims.push(a);f&&undo.push(f)};
 const cleanup=()=>{if(done)return;done=1;try{mo&&mo.disconnect();mo2&&mo2.disconnect();clearTimeout(sf);clearTimeout(nl);anims.forEach(a=>{try{a.cancel()}catch(e){}});undo.forEach(f=>{try{f()}catch(e){}})}
  finally{o&&o.remove();u&&u.remove();lit&&lit.remove();red&&red.remove();btn.classList.remove('wfe','wfa','wfp','wff','wfc');if(cur===run)cur=null}};
 run.kill=cleanup;cur=run;
 try{const bs=btn.querySelector('svg:not(.wfz)');
  if(getComputedStyle(btn).position==='static'){btn.style.position='relative';undo.push(()=>btn.style.position='')}
  o=document.createElement('div');o.className='wfx';o.innerHTML='<i class="b"></i>';document.body.appendChild(o);
  u=document.createElement('div');u.className='wfu';u.innerHTML='<i class="t"></i><i class="r"></i><i class="r rr"></i>';
  u.style.left=(btn.offsetLeft+btn.offsetWidth/2)+'px';u.style.top=(btn.offsetTop+btn.offsetHeight/2)+'px';btn.before(u);
  lit=document.createElement('span');lit.className='wfl';lit.innerHTML=`<svg class="wfz" viewBox="0 0 24 24">${bs?bs.innerHTML:''}</svg>`;btn.appendChild(lit);
  red=document.createElement('span');red.className='wfl wfr';red.innerHTML=`<svg class="wfz" viewBox="0 0 24 24">${bs?bs.innerHTML:''}</svg>`;btn.appendChild(red);
  const ls=lit.firstChild,rs=red.firstChild;let spin=null,rspin=null;
  const sync=()=>{ls.innerHTML=rs.innerHTML=bs?bs.innerHTML:'';const want=btn.classList.contains('ld');   // mirror RF/OK glyph and spin phase
   if(want&&!spin){const ba=bs&&bs.getAnimations()[0];spin=ls.animate([{transform:'rotate(0)'},{transform:'rotate(360deg)'}],{duration:900,iterations:Infinity});if(ba&&ba.startTime!=null)spin.startTime=ba.startTime;anims.push(spin)}
   if(want&&!rspin&&run.err){   // D3: red spinner only after failure (was an invisible 2nd infinite rotation)
   rspin=rs.animate([{transform:'rotate(0)'},{transform:'rotate(360deg)'}],{duration:900,iterations:Infinity});if(spin&&spin.startTime!=null)rspin.startTime=spin.startTime;anims.push(rspin)}
   if(!want&&spin){spin.cancel();spin=null}if(!want&&rspin){rspin.cancel();rspin=null}};
  sync();bs&&(mo2=new MutationObserver(sync)).observe(bs,{childList:true,subtree:true});
  requestAnimationFrame(()=>requestAnimationFrame(()=>{if(done)return;u.classList.add('on');btn.classList.add('wfa')}));
  const fail=()=>{run.tail=1;run.err=1;try{sync()}catch(e){}u.classList.add('wfe');btn.classList.add('wfe');setTimeout(()=>{done||calm()},900)};   // failure: shift to red, hold, then calm fade
  const calm=()=>{run.tail=1;u.classList.add('calm');btn.classList.add('wfc');setTimeout(cleanup,1200)};   // failure / timeout / ignored tap
  const boom=()=>{run.tail=1;const i=btn.getBoundingClientRect(),x=i.left+i.width/2,y=i.top+i.height/2,   // origin at boom time
    R=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y)),r=u.querySelector('.r'),m=new DOMMatrix(getComputedStyle(r).transform),a=Math.atan2(m.b,m.a)*180/Math.PI;
   r.style.animation='none';const acc=r.animate([{transform:`rotate(${a}deg)`},{transform:`rotate(${a+300}deg)`}],{duration:340,easing:'cubic-bezier(.55,0,.9,.4)',fill:'forwards'});anims.push(acc);   // accelerate into snap
   acc.finished.then(()=>{if(done)return;o.style.cssText=`--x:${x}px;--y:${y}px;--k:${(R/100).toFixed(2)};--a:${(a+300)%360}deg`;   // ring launches from rope's angle
    o.classList.add('go');u.classList.add('out');btn.classList.add('wfp');
    if(!RM.matches)requestAnimationFrame(()=>requestAnimationFrame(()=>{try{done||glints(x,y,track)}catch(e){}}));   // after app re-render
    setTimeout(()=>{if(done)return;   /* D6: old run's timer must not touch a new run's button */btn.classList.remove('wfp');btn.classList.add('wff')},420);setTimeout(cleanup,1700)},()=>{})};
  const end=(ok,why)=>{if(run.tail||done)return;mo&&mo.disconnect();clearTimeout(sf);clearTimeout(nl);
   setTimeout(()=>{try{if(done)return;ok?boom():why==='fail'?fail():calm()}catch(e){cleanup()}},ok?Math.max(0,MIN-(performance.now()-t0)):0)};
  const chk=()=>{try{sync()}catch(e){}const ld=btn.classList.contains('ld');if(ld){seen=1;clearTimeout(nl)}else if(seen){const k=btn.classList.contains('wmok');end(k,k?'':'fail')}};   // ld cleared: success iff app set .wmok
  mo=new MutationObserver(chk);mo.observe(btn,{attributes:true,attributeFilter:['class']});chk();
  nl=setTimeout(()=>{seen||end(false)},NOLD);sf=setTimeout(()=>end(false,'fail'),SAFE);
 }catch(e){cleanup()}}
document.addEventListener('click',e=>{const b=e.target.closest('.wrf');b&&fx(b)},true);window.WMrefreshFx=fx})();
