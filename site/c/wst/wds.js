/* WDS 1810 — dfe_smooth demo: stagger, FLIP glide, pager, pinned province header, PPL/CPL gold. Data untouched (display only). */
(function(){const RM=matchMedia('(prefers-reduced-motion: reduce)'),E='cubic-bezier(.22,1,.36,1)';
const K=[['ato','g2','ATOs'],['dfe','g3','examiners']];
K.forEach(([k,gid,noun])=>{const g=document.getElementById(gid);if(!g)return;
 let per=localStorage.getItem('wds-pp-'+k)||'50',pg=0,sig='',busy=0;
 const nav=document.createElement('div');nav.className='wds-pg';nav.setAttribute('role','navigation');nav.setAttribute('aria-label','Pages');g.after(nav);
 /* pager-tidy: redraw the page circle once the tab becomes visible (it was 0 px wide when drawn in a hidden tab) */
 if(window.ResizeObserver)new ResizeObserver(()=>slide()).observe(nav);

 /* WDS-STACK 1832: stacked filter column + top 'Show N' chip */
 const bar=k==='ato'?document.querySelector('#'+k+' .bar'):null;let fr=null,sh=null;
 if(k==='dfe'){const db=document.querySelector('#dfe .bar'),dl=db&&db.querySelector('label');if(dl){sh=document.createElement('div');sh.className='wds-show wds-dshow';sh.innerHTML='<button type="button" class="wds-sb" aria-haspopup="listbox" aria-expanded="false"></button><div class="wds-sm" role="listbox"></div>';dl.after(sh);
  const dm=()=>{const s=getComputedStyle(dl),b=sh.querySelector('.wds-sb');['background','boxShadow','borderRadius','backdropFilter','webkitBackdropFilter','color','fontFamily','fontSize','fontWeight'].forEach(q=>b.style[q]=s[q]);b.style.height=dl.offsetHeight+'px'};
  requestAnimationFrame(dm);setTimeout(dm,800);new MutationObserver(()=>setTimeout(dm,60)).observe(document.documentElement,{attributes:true});
  const sb=sh.querySelector('.wds-sb');
  sb.addEventListener('click',e=>{e.stopPropagation();const o=!sh.classList.contains('on');sh.classList.toggle('on',o);sb.setAttribute('aria-expanded',o)});
  sh.querySelector('.wds-sm').addEventListener('click',e=>{const b=e.target.closest('[data-pp]');if(!b)return;per=b.dataset.pp;localStorage.setItem('wds-pp-'+k,per);pg=0;sh.classList.remove('on');sb.setAttribute('aria-expanded','false');run(1)});
  document.addEventListener('click',e=>{if(!sh.contains(e.target)){sh.classList.remove('on');sb.setAttribute('aria-expanded','false')}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')sh.classList.remove('on')})}}
 if(bar){bar.classList.add('wds-stack');fr=document.createElement('div');fr.className='wds-fr';
  [...bar.children].filter(e=>e.tagName==='LABEL').forEach(l=>fr.appendChild(l));
  sh=document.createElement('div');sh.className='wds-show';sh.innerHTML='<button type="button" class="wds-sb" aria-haspopup="listbox" aria-expanded="false"></button><div class="wds-sm" role="listbox"></div>';
  fr.appendChild(sh);bar.appendChild(fr);
  /* 3C (speed): copy the label look onto the chips once per theme, not on every <html> attribute change.
     All reads (computed style + height) happen first, then writes, so there is no read/write layout thrash.
     Each chip is stamped with the style signature it got; chips already up to date are skipped. */
  const MP=['background','boxShadow','borderRadius','backdropFilter','webkitBackdropFilter','color','fontFamily','fontSize','fontWeight'];
  let mT=0;
  const match=()=>{const l=fr.querySelector('label');if(!l)return;const s=getComputedStyle(l),v=MP.map(p=>s[p]),h=l.offsetHeight+'px',sig=v.join('|')+'|'+h;
   document.querySelectorAll('#ato .wds-sb,#ato .wds-fa .wq-chip').forEach(b=>{if(b.__wdsSig===sig&&b.style.height===h&&b.style.color)return;/* 3C: sig + a real inline check, so a chip whose inline style was wiped by another script gets restyled */b.__wdsSig=sig;MP.forEach((p,i)=>b.style[p]=v[i]);b.style.height=h})};
  const later=()=>{clearTimeout(mT);mT=setTimeout(match,60)};
  requestAnimationFrame(match);setTimeout(match,800);new MutationObserver(later).observe(document.documentElement,{attributes:true});
  const sb=sh.querySelector('.wds-sb');
  sb.addEventListener('click',e=>{e.stopPropagation();const o=!sh.classList.contains('on');sh.classList.toggle('on',o);sb.setAttribute('aria-expanded',o)});
  sh.querySelector('.wds-sm').addEventListener('click',e=>{const b=e.target.closest('[data-pp]');if(!b)return;per=b.dataset.pp;localStorage.setItem('wds-pp-'+k,per);pg=0;sh.classList.remove('on');sb.setAttribute('aria-expanded','false');run(1)});
  document.addEventListener('click',e=>{if(!sh.contains(e.target)){sh.classList.remove('on');sb.setAttribute('aria-expanded','false')}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')sh.classList.remove('on')})}
 function drawShow(){if(!sh)return;sh.querySelector('.wds-sb').innerHTML='Show <b>'+(per==='all'?'All':per)+'</b><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  sh.querySelector('.wds-sm').innerHTML=['10','20','50','all'].map(v=>'<button type="button" role="option" data-pp="'+v+'" aria-selected="'+(v===per)+'"'+(v===per?' class="on"':'')+'>'+(v==='all'?'All':v)+' per page</button>').join('')}
 const cards=()=>[...g.children].filter(c=>c.classList.contains('wx'));
 function stagger(list){if(RM.matches)return;list.slice(0,14).forEach((c,i)=>{c.style.setProperty('--d',i*35+'ms');c.classList.remove('wds-a');void c.offsetWidth;c.classList.add('wds-a')});}
 g.addEventListener('animationend',e=>{const c=e.target;if(c.classList&&c.classList.contains('wds-a')){c.classList.remove('wds-a');c.style.removeProperty('--d')}});
 function nums(P){const a=[];for(let i=0;i<P;i++){if(i===0||i===P-1||Math.abs(i-pg)<=1)a.push(i);else if(a[a.length-1]!=='…')a.push('…')}return a}
 function slide(){const r=nav.querySelector('.pages'),i=r&&r.querySelector('i'),b=r&&r.querySelector('button.on');if(!i||!b)return;i.style.width=b.offsetWidth+'px';i.style.transform='translateX('+b.offsetLeft+'px)'}
 function drawNav(n,P){const pages=P>1?'<div class="row pages"><i></i><button data-p="prev" aria-label="Previous page"'+(pg===0?' disabled':'')+'>‹</button>'+nums(P).map(x=>x==='…'?'<span class="dots">…</span>':'<button data-p="'+x+'"'+(x===pg?' class="on" aria-current="page"':'')+'>'+(x+1)+'</button>').join('')+'<button data-p="next" aria-label="Next page"'+(pg>=P-1?' disabled':'')+'>›</button></div>':'';
  const pp='';drawShow();
  const lbl='<span class="lbl">'+(n?'Page '+(pg+1)+' of '+P+' · '+n+' '+noun:'')+'</span>';
  const keep=nav.querySelector('.pages i');const old=keep&&keep.style.transform;
  nav.innerHTML=pages+pp+lbl;
  const ni=nav.querySelector('.pages i');if(ni&&old){ni.style.transition='none';ni.style.transform=old;ni.style.width=keep.style.width;void ni.offsetWidth;ni.style.transition=''}
  requestAnimationFrame(()=>{slide();const r=nav.querySelector('.pp'),i=r&&r.querySelector('i'),b=r&&r.querySelector('button.on');if(!i||!b)return;i.style.width=b.offsetWidth+'px';i.style.transform='translateX('+b.offsetLeft+'px)'})}
 function run(anim){busy=1;const cs=cards(),n=cs.length,size=per==='all'?Math.max(n,1):+per,P=Math.max(1,Math.ceil(n/size));
  const s=n+'|'+(cs[0]?cs[0].querySelector('h3').textContent:'')+'|'+(cs[n-1]?cs[n-1].querySelector('h3').textContent:'');if(s!==sig){sig=s;pg=0;anim=1}
  if(pg>=P)pg=P-1;const on=[];cs.forEach((c,i)=>{const v=i>=pg*size&&i<pg*size+size;c.classList.toggle('wds-h',!v);if(v)on.push(c)});
  drawNav(n,P);if(anim)stagger(on);busy=0;if(k==='ato')ph()}
 function go(p,dir){if(p===pg)return;const top=g.getBoundingClientRect().top+scrollY-140;
  const swap=()=>{pg=p;run(1);if(!RM.matches)g.animate([{transform:'translate3d('+dir*28+'px,0,0)'},{transform:'none'}],{duration:380,easing:E});scrollTo({top:Math.max(0,top),behavior:RM.matches?'auto':'smooth'})};
  if(RM.matches)return swap();g.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translate3d('+(-dir*28)+'px,0,0)'}],{duration:170,easing:'ease-in'}).onfinish=swap}
 nav.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.pp){per=b.dataset.pp;localStorage.setItem('wds-pp-'+k,per);pg=0;run(1);return}
  const P=nav.querySelectorAll('.pages button[data-p]').length;const v=b.dataset.p,t=v==='prev'?pg-1:v==='next'?pg+1:+v;go(t,t>pg?1:-1)});
 new MutationObserver(m=>{if(busy)return;if(m.some(r=>r.target===g&&r.type==='childList'))run(1)}).observe(g,{childList:true});
 run(1)});
/* PPL/CPL soft gold */
const gold=()=>document.querySelectorAll('#ato .wx-chip:not(.wds-gc)').forEach(c=>{c.classList.add('wds-gc');if(/\b(PPL|CPL)\b/i.test(c.textContent))c.classList.add('wds-gold')});
const g2=document.getElementById('g2');if(g2)new MutationObserver(gold).observe(g2,{childList:true,subtree:true});gold();
/* pinned province header (ATO) */
var phe=null;function ph(){const g=document.getElementById('g2');if(!g)return;if(!phe){phe=document.createElement('div');phe.className='wds-ph';phe.setAttribute('aria-hidden','true');phe.innerHTML='<span></span>';g.before(phe)}
 const top=76,cs=[...g.children].filter(c=>c.classList.contains('wx')&&!c.classList.contains('wds-h'));const gr=g.getBoundingClientRect();
 if(!cs.length||gr.top>top+40||gr.bottom<top+80){phe.classList.remove('on');return}
 const c=cs.find(c=>c.getBoundingClientRect().bottom>top+10)||cs[0];const t=(c.querySelector('.wx-sub')||{}).textContent||'';const p=(t.split(',').pop()||'').trim();
 if(!p){phe.classList.remove('on');return}const n=cs.filter(x=>((x.querySelector('.wx-sub')||{}).textContent||'').trim().endsWith(p)).length;
 const h=p+' <small>'+n+' on this page</small>';const s=phe.firstChild;if(s.innerHTML!==h)s.innerHTML=h;phe.classList.add('on')}
let tk=0;addEventListener('scroll',()=>{if(tk)return;tk=1;requestAnimationFrame(()=>{tk=0;ph()})},{passive:true});
})();
