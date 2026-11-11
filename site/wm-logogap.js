(function(){
/* Phones only (<700px). iPad/desktop keep the main top bar exactly. */
var mq=matchMedia('(max-width:699.98px)');
/* Aerodrome page: icon-only back + magnifier before refresh on phones; original text back + order on bigger screens. */
var orig=null;
function adOrder(){var bk=document.querySelector('header.topbar>.back'),tb=document.querySelector('header.topbar .tbtn');if(!bk)return;
 if(bk.dataset.wmst===undefined)bk.dataset.wmst=bk.getAttribute('style')||'';
 var txt=null;for(var i=0;i<bk.childNodes.length;i++)if(bk.childNodes[i].nodeType===3&&bk.childNodes[i].nodeValue.trim())txt=bk.childNodes[i];
 if(mq.matches){bk.setAttribute('style',bk.dataset.wmst);if(txt)txt.remove()}
 else{bk.removeAttribute('style');if(!txt)bk.appendChild(document.createTextNode('Aerodromes'))}
 if(!tb)return;var r=tb.querySelector('.wrf'),s=tb.querySelector('.fs-ib');if(!r||!s)return;
 if(!orig)orig={next:s.nextSibling};
 if(mq.matches){if(s.nextElementSibling!==r)tb.insertBefore(s,r)}
 else if(s.nextSibling!==orig.next)tb.insertBefore(s,orig.next)}
/* ATO school page: back chevron on the left, refresh as the 3rd right control (shown on phones only via CSS). */
function ato(){var t=document.querySelector('.wmtop');if(!t)return;var on=/(^|[#&])school=/.test(location.hash);document.documentElement.classList.toggle('wm-school',on);
 if(!t.querySelector('.wmback')){var b=document.createElement('a');b.className='wmicb wmback';b.href='#';b.setAttribute('aria-label','Back to ATOs');b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';b.addEventListener('click',function(e){e.preventDefault();if(history.length>1&&document.referrer.indexOf(location.host)>-1)history.back();else location.hash=''});t.insertBefore(b,t.firstChild)}
 var tb=t.querySelector('.wmtb');if(tb&&!tb.querySelector('.wmrf')){var s=tb.querySelector('.fs-ib');if(s){var r=document.createElement('button');r.className='wmicb wmrf';r.type='button';r.setAttribute('aria-label','Refresh');r.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 11-2.34-5.66"/><path d="M20 4v4.5h-4.5"/></svg>';r.addEventListener('click',function(){location.reload()});s.after(r)}}}
function run(){adOrder();ato()}
run();addEventListener('load',run);addEventListener('hashchange',ato);
if(mq.addEventListener)mq.addEventListener('change',run);else mq.addListener(run);
var n=0,iv=setInterval(function(){run();if(++n>20)clearInterval(iv)},250);
})();
