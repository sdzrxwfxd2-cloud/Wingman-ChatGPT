/* Backlog 5 / MT #352 v14
   - Name area: fixed 2-line height; 1-line names vertically centred; trailing '.'
   - ICAO·province flush left (no centre)
   - Military: glowing red plain word + permission on same line (no pill)
   - Steady status glow kept; hazard-stripe ICAO; no red corner glow */
(function(){
  if(/[?&]adtypes=0(?:&|$)/.test(location.search)) return;
  var D=window.WM_AD_TYPES||{};
  function ic(card){
    var el=card.querySelector('.icao');
    return el?(el.textContent||'').trim():'';
  }
  function wrapName(h2){
    if(!h2) return;
    var nm=h2.querySelector('.nm');
    if(!nm){
      nm=document.createElement('span');
      nm.className='nm';
      while(h2.firstChild) nm.appendChild(h2.firstChild);
      h2.appendChild(nm);
    }
    /* Trailing full stop on the displayed name (don't double) */
    var raw=(nm.textContent||'').replace(/\s+$/,'');
    if(raw && !/\.$/.test(raw)) nm.textContent=raw+'.';
  }
  function mark(card){
    var id=ic(card); if(!id) return;
    var info=D[id]; if(!info) return;
    card.dataset.adType=info.t;
    if(info.p) card.dataset.adNearPro='1';
    var ch=card.querySelector('.ch');
    if(ch) ch.querySelectorAll('.ad-type').forEach(function(el){el.remove()});
    if(ch) ch.querySelectorAll('.ad-corner.mil,.mil-tr').forEach(function(e){e.remove()});

    var stack=card.querySelector('.ch .mil-stack');
    if(stack){
      var badge=stack.querySelector('.badge');
      if(badge && ch){ stack.replaceWith(badge); }
    }

    var t=card.querySelector('.ch .t');
    if(t){
      wrapName(t.querySelector('h2'));
      t.querySelectorAll('.mil-row,.mil-pill,.mil-under,.mil-perm').forEach(function(e){e.remove()});
      if(ch) ch.querySelectorAll(':scope > .mil-row').forEach(function(e){e.remove()});
    }

    var isMil=info.t==='military';
    card.classList.toggle('ad-mil-pro', !!isMil);

    if(isMil && t && ch){
      var row=document.createElement('div');
      row.className='mil-row';
      var word=document.createElement('span');
      word.className='mil-word';
      word.title='Military aerodrome';
      word.textContent='Military';
      var perm=document.createElement('span');
      perm.className='mil-perm';
      perm.textContent='Permission required before landing';
      row.appendChild(word);
      row.appendChild(perm);
      ch.appendChild(row);
    }
  }
  function run(root){
    (root||document).querySelectorAll('article.card').forEach(mark);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){run()});
  else run();
  var list=document.getElementById('list');
  if(list&&window.MutationObserver){
    var t=0;
    new MutationObserver(function(){
      clearTimeout(t); t=setTimeout(function(){run(list)},80);
    }).observe(list,{childList:true,subtree:true});
  }
  window.WM_AD_TYPE_OF=function(cardOrIcao){
    if(typeof cardOrIcao==='string') return D[cardOrIcao]||null;
    return D[ic(cardOrIcao)]||null;
  };
})();
