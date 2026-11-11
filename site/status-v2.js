/* Status page v2 (MT, 31 Oct 2026). DEFAULT since t1800 (1 Nov 2026). Old page (v1) is kept underneath, unused:
   ?statusv2=0 on this page or the top page URL, or WM_STATUSV2=false below, brings it back. Archive: branch archive/status-page-v1.
   Layout only: every piece of data stays; data-source wording is hidden. Delete this file + its <script> tag to remove. */
(function(){
 var q='';try{q=location.search+'|'+top.location.search+'|'+top.location.hash}catch(e){q=location.search}
 var WM_STATUSV2=true; /* set false to switch back to the old status page (v1) */
 if(window.WM_STATUSV2===false)WM_STATUSV2=false;
 if(/[?&|]statusv2=0/.test(q))return;
 if(!WM_STATUSV2&&!/[?&|]statusv2=1/.test(q))return;
 document.documentElement.classList.add('sv2');
 var D=document,$=function(s,r){return (r||D).querySelector(s)},$$=function(s,r){return [].slice.call((r||D).querySelectorAll(s))};
 var RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
 var css='html.sv2 #wsp .wsp-sum2{display:none!important}'+
 /* status bar: same .tiles/.tile/.stfoot component as main.html (rules copied at runtime), no eye */
 'html.sv2 #wad{display:none!important}'+
 /* MT t1752: one block = status bar + aerodrome list + flight checks; glows in the leading state colour */
 '#sv2bar{margin:8px 0 12px;position:relative;border-radius:var(--r,24px);--gc:transparent;transition:box-shadow .3s}#sv2bar>#tiles{margin:0}'+
 '#sv2bar[data-g=go]{--gc:var(--go,#22C55E)}#sv2bar[data-g=caution]{--gc:var(--cau,#FF8A00)}#sv2bar[data-g=nogo]{--gc:var(--nogo,#F80F3B)}'+
 '#sv2bar::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:3;transition:opacity .3s;opacity:0;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--gc) 30%,transparent),inset 0 0 26px -6px var(--gc),0 0 22px -8px color-mix(in srgb,var(--gc) 55%,transparent);background:radial-gradient(60px 60px at 0 0,color-mix(in srgb,var(--gc) 26%,transparent),transparent 70%),radial-gradient(60px 60px at 100% 0,color-mix(in srgb,var(--gc) 26%,transparent),transparent 70%)}'+
 '#sv2bar[data-g]::after{opacity:1}#sv2bar.sel::after{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--gc) 60%,transparent),inset 0 0 34px -6px var(--gc),0 0 30px -6px color-mix(in srgb,var(--gc) 70%,transparent)}'+
 '#sv2bar .tile.sel{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--gc) 55%,transparent)!important}'+
 '#sv2list details.ar>summary{display:grid!important;grid-template-columns:10px 48px minmax(0,1fr);align-items:center;column-gap:10px}#sv2list details.ar>summary>span{min-width:0;white-space:normal}#sv2list details.ar>summary>.y{grid-column:3}'+
 '#sv2bar #sv2list{grid-column:1/-1;width:100%;min-width:0;margin:0;background:none!important;box-shadow:none!important;border-radius:0}'+
 '#sv2bar .stfoot{justify-content:flex-start}#sv2bar .stfoot b{color:var(--tx2);font-weight:600}'+
 '#sv2bar .tile{cursor:pointer}'+
 '#sv2list{overflow:hidden;margin:0 0 12px}#sv2list[hidden]{display:none!important}'+
 '#sv2list>summary,#sv2list .sv2h{display:flex;justify-content:space-between;align-items:center;padding:12px 14px 6px;font:600 13px/1.2 -apple-system,Helvetica,Arial,sans-serif;color:var(--tx2)}'+
 '#sv2list .sv2e{padding:4px 14px 14px;color:var(--tx3);font:500 13px/1.3 -apple-system,Helvetica,Arial,sans-serif}'+
 /* d) one pill design: the ATO/DFE glass pill (c/wst/wmf.js .wmf-sp) */
 'html.sv2 #wsp .wseg,html.sv2 #wsp .sw,html.sv2 #wsp .wnt,html.sv2 #wsp .wsp-ac,html.sv2 #wsp .otag{border-radius:18px!important;border:0!important;background:linear-gradient(180deg,var(--tint,rgba(255,255,255,.08)),transparent),var(--gl)!important;box-shadow:inset 0 1px 0 var(--hl,rgba(255,255,255,.35)),inset 0 0 0 1px var(--ln)!important;-webkit-backdrop-filter:blur(30px) saturate(160%);backdrop-filter:blur(30px) saturate(160%)}'+
 'html.sv2 #wsp .wseg,html.sv2 #wsp .sw{min-height:36px}html.sv2 #wsp .wseg>i,html.sv2 #wsp .sw>i{border-radius:15px!important;background:var(--gl2,var(--gl))!important;box-shadow:inset 0 1px 0 var(--hl,rgba(255,255,255,.35)),inset 0 0 0 .5px var(--ln),0 1px 4px rgba(0,0,0,.12)!important}'+
 'html.sv2 #wsp .wseg button[aria-checked=true],html.sv2 #wsp .sw button.on{color:var(--tx)!important}html.sv2 #wsp .wseg>i,html.sv2 #wsp .sw>i{z-index:0}html.sv2 #wsp .wseg button,html.sv2 #wsp .sw button{position:relative;z-index:1}'+
 'html.sv2 #wsp .otag{padding:2px 8px!important;font-size:10px}'+
 /* t1772: aircraft picker grows out of the aircraft pill (same pill row on top, same icon size), no fixed layer */
 'html.sv2 .wsh,html.sv2 .wbk{display:none!important}'+
 'html.sv2 #wsp .wsp-ac .v::after{content:" crosswind";font-weight:500}'+
 '.sv2-scrim{position:absolute;left:0;top:0;width:100%;z-index:40;background:transparent}.sv2-scrim[hidden]{display:none}'+
 'html.sv2 #wsp section.sv2-host{position:relative;z-index:41;overflow:visible!important}'+
 '.sv2-ac{position:absolute;z-index:42;display:flex;flex-direction:column;border-radius:18px;color:var(--tx);background:color-mix(in srgb,var(--bg,#fff) 94%,transparent);box-shadow:inset 0 1px 0 var(--hl,rgba(255,255,255,.35)),inset 0 0 0 .5px var(--ln),0 18px 40px -12px rgba(0,0,0,.35)}.sv2-ac[hidden]{display:none}'+
 'html.sv2 #wsp .sv2-ac>.wsp-ac{background:transparent!important;box-shadow:none!important}html.sv2 #wsp .sv2-ac>.wsp-ac .cv{transform:rotate(90deg)}'+
 '.sv2-ac .pn{padding:2px 6px 8px;border-top:.5px solid var(--ln)}'+
 '.sv2-r{display:flex;align-items:center;gap:10px;width:100%;min-height:44px;border:0;background:none;color:inherit;text-align:left;padding:0 10px;border-radius:14px;font:inherit}'+
 '.sv2-r .nm{flex:1;font:500 14px/1.2 -apple-system,"Sora",sans-serif}.sv2-r .ck{width:16px;text-align:center;color:var(--acc,#0019C9);opacity:0}.sv2-r[aria-checked=true]{background:color-mix(in srgb,var(--tx) 7%,transparent)}.sv2-r[aria-checked=true] .ck{opacity:1}'+
 /* crosswind pill: archived neat ATO pill, now blue (t1772) */
 '.sv2-xw{--fc:var(--acc,#0019C9);display:inline-flex;align-items:center;min-height:26px;padding:4px 10px;position:relative;border-radius:999px;font:500 12px/1.25 Sora,-apple-system,sans-serif;letter-spacing:.005em;white-space:nowrap;color:var(--fc);background:color-mix(in srgb,var(--fc) 10%,transparent);box-shadow:inset 0 0 0 .5px color-mix(in srgb,var(--fc) 28%,transparent)}'+
 'html[data-theme=night] .sv2-xw{--fc:color-mix(in srgb,var(--acc,#6B78FF) 70%,#fff)}'+
 /* t1772: pilot level back to its blue thumb */
 'html.sv2 #wsp .wlv>i{background:var(--acc)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 3px 12px color-mix(in srgb,var(--acc) 40%,transparent)!important}html.sv2 #wsp .wlv button[aria-checked=true]{color:#fff!important}'+
 /* t1772: Night stays visible when on (day themes put white text on glass) */
 'html.sv2 #wsp .wnt[aria-checked=true],html.sv2 #wsp .wnt[aria-pressed=true]{background:var(--acc)!important;color:#fff!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 3px 12px color-mix(in srgb,var(--acc) 40%,transparent)!important}'+
 /* t1772: Count pill = same build as Flight rules / Pilot level */
 'html.sv2 #wsp .wseg,html.sv2 #wsp .sw{height:44px!important;min-height:44px;padding:3px!important;border-radius:22px!important}html.sv2 #wsp .wseg>i,html.sv2 #wsp .sw>i{top:3px!important;bottom:3px!important;border-radius:19px!important}'+
 'html.sv2 #wsp .sw button{height:38px!important;border-radius:19px!important;font:700 13px/1 -apple-system,"Sora",sans-serif!important;letter-spacing:.04em}html.sv2 #wsp .sw button:not(.on){color:var(--tx2)!important}'+
 /* t1772: My minima, equal round - and +, number centred between them */
 'html.sv2 #wsp .limcard .stp{display:grid!important;grid-template-columns:34px 52px 26px 34px;align-items:center;column-gap:2px}'+
 'html.sv2 #wsp .limcard .stp button{position:relative;width:34px!important;height:34px!important;padding:0!important;font-size:0!important;color:var(--tx)!important}'+
 'html.sv2 #wsp .limcard .stp button::before,html.sv2 #wsp .limcard .stp button[data-d="1"]::after{content:"";position:absolute;left:50%;top:50%;width:12px;height:2px;margin:-1px 0 0 -6px;border-radius:1px;background:currentColor}html.sv2 #wsp .limcard .stp button[data-d="1"]::after{transform:rotate(90deg)}'+
 'html.sv2 #wsp .limcard .stp b{min-width:0!important;text-align:right!important;padding-right:4px}html.sv2 #wsp .limcard .stp small{width:auto!important;text-align:left}'+
 /* t1772: no status line under the tiles */
 '#sv2bar .stfoot{display:none!important}'+
 /* t1781/t1788: header, Aircraft, My minimums and footer notes hidden (in docs/TERMS_NOTES.md); Pilot level, Flight rules, Night, Count notes kept */
 'html.sv2 #wsp .wsp-h>p,html.sv2 #wsp .sv2ac>.fn,html.sv2 #wsp .sv2ac .wn>p,html.sv2 #wsp .limcard .wdis,html.sv2 #wsp .wsp-ft{display:none!important}'+
 /* t1782: summary at the top of the expanded status bar, plain glass pills */
 /* t1788: live status-page summary (Most NO-GO / Most CAUTION) at the top of the expanded bar */
 '#sv2list .sv2s{padding:12px 14px 2px}#sv2list .sv2s .wsx-w{margin:0}'+
 '@media (prefers-reduced-motion:reduce){#sv2bar::after{transition:none!important}}';
 var st=D.createElement('style');st.id='sv2-css';st.textContent=css;D.head.appendChild(st);

 /* copy the status bar rules from main.html so it is the same component, not a lookalike */
 function barCss(){return fetch('main.html',{credentials:'same-origin'}).then(function(r){return r.text()}).then(function(h){
  var out=[],re=/<style[^>]*>([\s\S]*?)<\/style>/g,m,keep=/#tiles|\.tiles\b|\.tile\b|\.stfoot/;
  while((m=re.exec(h))){var s=new CSSStyleSheet();try{s.replaceSync(m[1])}catch(e){continue}
   [].forEach.call(s.cssRules,function(r){
    if(r.selectorText){if(keep.test(r.selectorText)&&!/\.a1stats|\.st\b|\.slim/.test(r.selectorText))out.push(r.cssText)}
    else if(r.cssRules&&keep.test(r.cssText)){var inner=[].filter.call(r.cssRules,function(x){return x.selectorText&&keep.test(x.selectorText)}).map(function(x){return x.cssText}).join('');if(inner)out.push(r.cssText.slice(0,r.cssText.indexOf('{')+1)+inner+'}')}
   })}
  var s2=D.createElement('style');s2.id='sv2-bar-css';s2.textContent=out.join('\n');D.head.insertBefore(s2,st);
 }).catch(function(){})}

 var LB={go:'GO',caution:'CAUTION',nogo:'NO-GO'};
 function counts(){var c={go:0,caution:0,nogo:0};$$('.wsx-c').forEach(function(e){var b=$('b',e);if(b)c[{g:'go',c:'caution',n:'nogo'}[b.className]]=b.textContent.trim()});return c}
 var bar,list,sel='';
 function build(){var w=$('#wsp'),sum=$('#wsp .wsp-sum2');if(!w||!sum||$('#sv2bar'))return!!$('#sv2bar');
  bar=D.createElement('div');bar.id='sv2bar';
  bar.innerHTML='<nav class="tiles" id="tiles" aria-label="Status">'+['go','caution','nogo'].map(function(k){return '<button class="tile glass" data-s="'+k+'" aria-expanded="false"><span class="n">0</span><span class="k"><span class="d"></span>'+LB[k]+'</span></button>'}).join('')+'<div class="stfoot"><span class="sv2f"></span></div></nav>';
  list=D.createElement('section');list.id='sv2list';list.className='wad wsp-g';list.hidden=true;
  sum.after(bar);$('#tiles',bar).appendChild(list);
  bar.addEventListener('click',function(e){var t=e.target.closest('.tile');if(!t)return;open(sel===t.dataset.s?'':t.dataset.s)});
  sync();new MutationObserver(sync).observe(sum,{subtree:true,childList:true,characterData:true});
  return true}
 function sync(){if(!bar)return;var c=counts();$$('.tile',bar).forEach(function(t){$('.n',t).textContent=c[t.dataset.s]});glow(c);
  var h=$('.wsx-h'),wl=$('.wsx-l'),f=[];if(h)f.push(h.textContent.replace(/^Right now\s*·\s*/,'Right now · '));if(wl){var a=$('span',wl),b=$('b',wl);f.push((a?a.textContent:'')+': '+(b?b.textContent:''))}$('.sv2f',bar).textContent=f.join('  ·  ');
  if(sel)fill()}
 function glow(c){c=c||counts();var k='',m=0;['nogo','caution','go'].forEach(function(x){var v=parseInt(c[x],10)||0;if(v>m){m=v;k=x}});k=sel||k;if(k)bar.dataset.g=k;else delete bar.dataset.g;bar.classList.toggle('sel',!!sel)}
 /* t1788: same summary as the live status page (status_demo.html paintSum, wm-core summarize): 'Most NO-GO' / 'Most CAUTION' + main reason */
 function summ(){var w=$('#wsp .wsp-sumx .wsx-w');return w&&w.textContent.trim()?'<div class="sv2s" aria-label="Summary">'+w.outerHTML+'</div>':''}
 function fill(){var rows=$$('#wad > details.ar').filter(function(d){return sel==='nogo'?/^(nogo|noiap)$/.test(d.dataset.s):d.dataset.s===sel});
  list.innerHTML=summ()+'<div class="sv2h"><span>'+LB[sel]+' · '+rows.length+' aerodromes</span></div>';
  rows.forEach(function(d){var n=d.cloneNode(true);n.open=false;list.appendChild(n)});
  if(!rows.length)list.insertAdjacentHTML('beforeend','<p class="sv2e">No aerodromes are '+LB[sel]+' right now.</p>');scrub(list)}
 /* solid expand (wm-motion E.out, no bounce, no fade): height only, from the old height to the new */
 var EO='cubic-bezier(.32,.72,0,1)',anim;
 function open(k){var h0=list.hidden?0:list.offsetHeight;sel=k;
  $$('.tile',bar).forEach(function(t){var on=t.dataset.s===k;t.classList.toggle('sel',on);t.setAttribute('aria-expanded',on)});glow();
  if(anim)anim.cancel();
  if(!k){if(RM||!h0){list.hidden=true;return}anim=list.animate([{height:h0+'px'},{height:'0px'}],{duration:320,easing:EO});anim.onfinish=function(){if(!sel)list.hidden=true;anim=null};return}
  list.hidden=false;fill();var h1=list.offsetHeight;if(RM||h1===h0)return;anim=list.animate([{height:h0+'px'},{height:h1+'px'}],{duration:360,easing:EO});anim.onfinish=function(){anim=null}}

 /* e) data-source wording */
 var SRC=/(^|\s)(Source[s]?:|METAR · NOAA|NOAA|Open-Meteo|aviationweather)/i,SENT=/[^.]*\b(POH|AFM|Source[s]?)\b[^.]*\.\s?/g;
 function scrub(r){$$('li,.wsrc,p,span',r||D.getElementById('wsp')||D).forEach(function(e){
   if(e.children.length===0&&SRC.test(e.textContent)){e.style.display='none';return}
   if(e.matches('.wsrc'))e.style.display='none';
   if(e.matches('p')&&e.children.length===0&&SENT.test(e.textContent)){SENT.lastIndex=0;var t=e.textContent.replace(SENT,'').trim();if(t)e.textContent=t;else e.style.display='none'}SENT.lastIndex=0})}

 /* c) aircraft picker (t1772): the aircraft pill grows down into the list; its own row stays on top at the same size */
 var sc,pn,src,host,pill,an;
 function rows(){return $$('.opt',src).map(function(o){var b=$('b',o),n=o.querySelector('span').firstChild.textContent;
   return '<button class="sv2-r" role="radio" data-id="'+o.dataset.id+'" aria-checked="'+o.getAttribute('aria-checked')+'"><span class="ck">✓</span><span class="nm">'+n+'</span><span class="sv2-xw">'+(b?b.textContent:'—')+'</span></button>'}).join('')}
 function acOpen(btn){src=$('.wsh');pill=btn||$('#wsp .wsp-ac');if(!src||!pill)return;host=pill.closest('section');
  if(!pn){sc=D.createElement('div');sc.className='sv2-scrim';sc.hidden=true;sc.onclick=acClose;D.body.appendChild(sc);
   pn=D.createElement('div');pn.className='sv2-ac';pn.hidden=true;pn.setAttribute('role','dialog');pn.setAttribute('aria-label','Aircraft');
   pn.style.setProperty('backdrop-filter','blur(30px) saturate(170%)','important');pn.style.setProperty('-webkit-backdrop-filter','blur(30px) saturate(170%)','important')}
  host.appendChild(pn);host.classList.add('sv2-host');
  var hd=pill.cloneNode(true);hd.removeAttribute('aria-haspopup');hd.setAttribute('aria-expanded','true');hd.onclick=function(e){e.stopPropagation();acClose()};
  pn.innerHTML='';pn.appendChild(hd);pn.insertAdjacentHTML('beforeend','<div class="pn" role="radiogroup" aria-label="Crosswind limit">'+rows()+'</div>');
  pn.style.left=pill.offsetLeft+'px';pn.style.top=pill.offsetTop+'px';pn.style.width=pill.offsetWidth+'px';
  sc.style.height=D.documentElement.scrollHeight+'px';sc.hidden=false;pn.hidden=false;
  var H=pn.offsetHeight,h=pill.offsetHeight;if(an)an.cancel();
  if(!RM)an=pn.animate([{clipPath:'inset(0 0 '+(H-h)+'px 0 round 16px)'},{clipPath:'inset(0 0 0 0 round 18px)'}],{duration:380,easing:EO});
  $$('.wsh,.wbk').forEach(function(e){e.classList.remove('on')});
  pn.onclick=function(e){var r=e.target.closest('.sv2-r');if(!r)return;var o=$('.opt[data-id="'+r.dataset.id+'"]',src);
   $$('.sv2-r',pn).forEach(function(x){x.setAttribute('aria-checked',x===r)});
   if(o&&o.getAttribute('aria-checked')!=='true')o.click();$$('.wsh,.wbk').forEach(function(e){e.classList.remove('on')});
   var c=$('#wsp section:not(.sv2-ac) > .wsp-ac');if(c){$('.n',hd).textContent=$('.n',c).textContent;$('.v',hd).textContent=$('.v',c).textContent}
   setTimeout(acClose,220)}}
 function acClose(){if(!pn||pn.hidden)return;var H=pn.offsetHeight,h=pill?pill.offsetHeight:52;if(an)an.cancel();
  var fin=function(){pn.hidden=true;sc.hidden=true;host&&host.classList.remove('sv2-host');an=null};
  if(RM)return fin();an=pn.animate([{clipPath:'inset(0 0 0 0 round 18px)'},{clipPath:'inset(0 0 '+(H-h)+'px 0 round 16px)'}],{duration:300,easing:EO});an.onfinish=fin}
 D.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('#wsp .wsp-ac');if(!b||b.closest('.sv2-ac'))return;setTimeout(function(){acOpen(b)},0)},true);
 window.sv2={open:open,acOpen:function(){var b=$('#wsp .wsp-ac');b&&b.click()},acClose:acClose};

 /* t1781 order, top to bottom: Aircraft, Pilot level, My minima, Flight rules, Night, Count */
 function order(){var w=$('#wsp'),wad=$('#wad');if(!w||!wad||w.dataset.sv2o)return;var sec=function(t){return $$('#wsp > section').filter(function(x){var h=$('h2',x);return h&&h.textContent.trim()===t})[0]};
  var ac=sec('Aircraft');if(ac)ac.classList.add('sv2ac');var list=[ac,sec('Pilot level'),$('#wsp > section.limcard'),sec('Flight rules'),$$('#wsp > section').filter(function(x){return $('.wsp-nr',x)})[0],sec('Count')];
  if(list.some(function(x){return!x}))return;w.dataset.sv2o=1;var at=wad;list.forEach(function(x){at.after(x);at=x})}
 barCss();var n=0;(function go(){if(build()){(function o2(k){order();if(!$('#wsp').dataset.sv2o&&k<100)setTimeout(function(){o2(k+1)},120)})(0);scrub();new MutationObserver(function(){scrub()}).observe($('#wsp'),{subtree:true,childList:true})}else if(n++<80)setTimeout(go,100)})();
})();
