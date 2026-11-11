/* Status page v4 (MT t1997/t1998, 5 Nov 2026; section 01–07 labels removed MT t2197) — design in go-around-design DESIGN.md (status v4 = chosen design).
   Layout only: re-homes the existing, already-wired parts (aircraft picker, My minimums rows, Count toggle,
   old live status bar #sv2bar) into the v4 panel and drives Pilot level / Rating / Flight rules through the
   existing hidden buttons, so the engine, counts and applyS() stay exactly as they are. Off: ?statusv4=0. */
(function(){
 var q='';try{q=location.search+'|'+top.location.search}catch(e){q=location.search}
 if(/[?&|]statusv4=0/.test(q))return;
 var D=document,$=function(s,r){return (r||D).querySelector(s)},$$=function(s,r){return [].slice.call((r||D).querySelectorAll(s))};
 var get=function(k,d){try{var v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}},put=function(k,v){try{localStorage.setItem(k,v)}catch(e){}};
 var LV={ppl:[12,25,'2 500',8],cpl:[15,25,'1 500',5],ir:[12,25,'2 000',6]};
 var ATPL='ATPL has no legal wind limit. Your aircraft (POH) and operator\u2019s manuals come first.';
 var TAIL='The stricter of these, the aircraft limit and the VFR/IFR minima is used.';
 var ACFN='Maximum demonstrated crosswind from each type\u2019s POH/AFM. Crosswind is worked out for every runway and the best one is used.';
 var IC={icao:'Counting only aerodromes with an ICAO code.',all:'Counting every aerodrome, with or without an ICAO code.'};
 function lvl(){var b=$('#wsp .wlv button[aria-checked=true]');return b?b.dataset.v:'ppl'}
 function base(){var b=get('wm-base-lic','');if(/^(ppl|cpl|atpl)$/.test(b))return b;var l=lvl();return l==='ir'?'ppl':l}
 function ready(){return $('#wsp .wlv')&&$('#wsp .wsp-r')&&$('#wsp .wnt')&&$('#wsp .wsp-ac')&&$('#wsp .limcard .lim')&&$('#sv2bar')&&$('#wsp .sw')}
 var V,box;
 function sec(n,t,h,x){return '<section class="sec"><div class="hd"><h2>'+t+'</h2>'+(x||'')+'</div>'+h+'</section>'}
 function seg(cls,a){return '<div class="seg '+cls+'" role="radiogroup">'+a.map(function(x){return '<button type="button" role="radio" data-v="'+x[0]+'">'+x[1]+'</button>'}).join('')+'</div>'}
 function build(){
  D.documentElement.classList.add('sv4');
  V=D.createElement('div');V.className='v4';
  V.innerHTML='<div class="intro ga-page-header"><div class="eyebrow">Go Around</div><h1>Status</h1><p class="lede">Choose how GO / CAUTION / NO-GO is worked out. It applies to the Aerodromes cards and the search dots.</p></div>'+
  '<div><div class="box"><div class="col">'+
   sec(1,'Pilot level',seg('v4lv',[['ppl','PPL'],['cpl','CPL'],['atpl','ATPL']])+'<p class="fn">PPL, CPL or ATPL. The licence numbers sit in Licence limit below. IR is under Rating.</p>')+
   sec(2,'Licence limit','<div class="v4lim"></div><p class="fn v4ifr" hidden>IFR 600 ft / 2 km</p><p class="fn">'+TAIL+'</p>')+
   sec(3,'Rating','<div class="pls"><button type="button" class="pl ir" role="switch"><i></i>IR</button><button type="button" class="pl nt" role="switch"><i></i>Night</button></div><p class="fn">IR: uses the instrument-rating numbers. Night: 15 min after sunset to 15 min before sunrise (CAR Part 1). Off: night-time VFR is NO-GO.</p>')+
   sec(4,'Flight rules',seg('v4r',[['vfr','VFR'],['ifr','IFR']])+'<p class="fn">VFR: 5 km and 1 500 ft (CAR Part 91.06.21). IFR: needs a published approach (AIP AD 2.24); never below the Cat I floor of 200 ft / 550 m. Always use the plate minima.</p>')+
  '</div><div class="col">'+
   sec(5,'Aircraft','<div class="v4ac"></div><p class="fn"><span>'+ACFN+'</span></p>')+
   sec(6,'My minimums','<div class="v4min"></div><p class="fn">Type your own numbers. They can be stricter, never looser \u2014 anything below the legal minimum springs back.</p>','<button type="button" class="v4rs" aria-label="Reset My minimums to the Pilot level defaults">Reset</button>')+
   sec(7,'Count','<div class="v4sw"></div><p class="fn v4cn" style="margin-top:8px"></p><div class="cnt"><div data-s="go" style="--c:var(--v4go)" role="button" tabindex="0"><b>\u2013</b><span class="wm-verdict-label">GO</span></div><div data-s="caution" style="--c:var(--v4cau)" role="button" tabindex="0"><b>\u2013</b><span class="wm-verdict-label">CAUTION</span></div><div data-s="nogo" style="--c:var(--v4ng)" role="button" tabindex="0"><b>\u2013</b><span class="wm-verdict-label">NO-GO</span></div></div><div class="bar4"><i data-s="go" style="--c:var(--v4go)"></i><i data-s="caution" style="--c:var(--v4cau)"></i><i data-s="nogo" style="--c:var(--v4ng)"></i></div><div class="v4bar" hidden></div><div class="why"></div><p class="fn v4rn"></p>')+
  '</div></div><p class="disc">Guidance only \u2014 not a substitute for an official weather brief, NOTAMs or your own judgement as pilot in command. Level limits are conservative app defaults, not regulation.</p></div>';
  var W=$('#wsp');W.insertBefore(V,W.firstChild);box=V;
  /* re-home the existing wired parts (same nodes, same handlers) */
  var acSec=$('#wsp .wsp-ac').closest('section');$('.v4ac',V).appendChild($('#wsp .wsp-ac'));
  $('.v4min',V).appendChild($('#wsp .limcard'));
  var sw=$('#wsp .sw');$('.v4sw',V).appendChild(sw);$$('button',sw).forEach(function(b){if(/^ICAO$/.test(b.textContent.trim()))b.textContent='ICAO only'});
  sw.addEventListener('click',function(){setTimeout(paint,0)});
  $('.v4bar',V).appendChild($('#sv2bar'));
  /* wiring */
  $$('.v4lv button',V).forEach(function(b){b.onclick=function(){put('wm-base-lic',b.dataset.v);setLvl(isIR()?'ir':(b.dataset.v==='atpl'?'cpl':b.dataset.v))}});
  $('.pl.ir',V).onclick=function(){setLvl(isIR()?(base()==='atpl'?'cpl':base()):'ir')};
  /* My minimums Reset (MT 5 Nov): same look as the ATO/DFE filter's 'Reset all'; drives the existing wired reset
     (.limcard .wrst clears every custom value), so each row falls back to the selected Pilot level's default */
  $('.v4rs',V).onclick=function(){var r=$('#wsp .limcard .wrst');if(r)r.click();setTimeout(function(){grp();paint()},0)};
  $('.pl.nt',V).onclick=function(){$('#wsp .wnt').click();setTimeout(paint,0)};
  $$('.v4r button',V).forEach(function(b){b.onclick=function(){var o=$('#wsp .wsp-r button[data-v='+b.dataset.v+']');if(o)o.click();setTimeout(paint,0)}});
  /* aircraft picker = the live .wsp-ac sheet (.wsh) styled as the v4 mockup sheet, not the status-v2 grow-out (MT t2014) */
  window.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.v4 .wsp-ac');if(!b||!b.onclick)return;e.stopPropagation();b.onclick.call(b,e);v4sheet()},true);
  /* GO / CAUTION / NO-GO tiles open the Aerodromes page filtered to that status (MT t1992) */
  /* Count shown as the mockup's three numbers + bar (MT t2057); the live #sv2bar stays (hidden) as the data source */
  $$('.cnt>div',V).forEach(function(d){d.onclick=function(){go(d.dataset.s)};d.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go(d.dataset.s)}}});
  new MutationObserver(cnt).observe($('#sv2bar'),{subtree:true,childList:true,characterData:true});cnt();
  /* My minimums numbers grouped like the mockup ('3 000') */
  new MutationObserver(grp).observe($('#wsp .limcard'),{subtree:true,childList:true,characterData:true});grp();
  $('#sv2bar').addEventListener('click',function(e){var t=e.target.closest('.tile');if(!t)return;e.stopPropagation();e.preventDefault();go(t.dataset.s)},true);
  D.addEventListener('wm:pass',paint);D.addEventListener('wst:data',paint);
  new MutationObserver(paint).observe($('#wsp .wsp-sum2'),{subtree:true,childList:true,characterData:true});
  paint()}
 /* mockup rows: name + mono source line (keeps the live sheet's own buttons/handlers) */
 /* readable handbook reference: 'C172S POH §5 Fig 5-4' -> 'Cessna 172S POH · Section 5' (MT t2045) */
 function nice(r){r=String(r||'').replace(/\s*\(.*?\)\s*$/,'').replace(/\s*[:\/].*$/,'').replace(/\s*max(imum)? demo.*$/i,'');
  r=r.replace(/^C(\d{3}[A-Z]?)\b/,'Cessna $1').replace(/^PA-/,'Piper PA-').replace(/^DA(\d)/,'Diamond DA$1').replace(/^Tecnam\s*/,'Tecnam ');
  r=r.replace(/\s*\bFig\.?\s*[\w.-]+/gi,'').replace(/\s*\bRev\s*[\d.]+/gi,'').replace(/\s*\u00a7\s*([\d.]+)/,' \u00b7 Section $1').replace(/\s+/g,' ').trim();
  return r||'Handbook'}
 function v4sheet(){var w=$('.wsh');if(w){['backdrop-filter','-webkit-backdrop-filter'].forEach(function(k){w.style.setProperty(k,'blur(30px) saturate(180%)','important')})}var AC=(window.WST||{}).AC||[];$$('.wsh .opt').forEach(function(o){o.dataset.v2=1;var a=AC.find(function(x){return x.id===o.dataset.id}),sp=$('span',o);if(!a||!sp)return;
  var src=nice(a.src);
  sp.innerHTML='<em class="tn">'+a.n+'</em><strong class="tx">'+(a.xw?a.xw+'<i>kt</i>':'\u2014')+'</strong><em class="tl">Max crosswind</em><em class="ts">'+(a.xw?src:'Not verified from POH')+'</em>'})}
 function cnt(){if(!box)return;var n={};['go','caution','nogo'].forEach(function(k){var e=$('#sv2bar .tile[data-s='+k+'] .n');var v=e?parseInt(e.textContent.replace(/\D/g,''),10):NaN;n[k]=isNaN(v)?null:v;
   var d=$('.cnt>div[data-s='+k+'] b',box);if(d){var t=n[k]==null?'\u2013':String(n[k]);if(d.textContent!==t)d.textContent=t}});
  var tot=(n.go||0)+(n.caution||0)+(n.nogo||0);$$('.bar4 i',box).forEach(function(i){var v=n[i.dataset.s]||0;i.style.flex=tot?String(v):'1';i.style.display=tot&&!v?'none':''})}
 function grp(){$$('#wsp .limcard b[data-f]').forEach(function(b){var t=b.textContent,g=t.replace(/\B(?=(\d{3})+(?!\d))/g,' ');if(g!==t)b.textContent=g});rsd()}
 /* Reset reads as dimmed while every row already shows the level default ('You' tag = a custom value) */
 function rsd(){var rs=box&&$('.v4rs',box);if(!rs)return;var v=$$('#wsp .limcard .otag.you').length?'false':'true';if(rs.getAttribute('aria-disabled')!==v)rs.setAttribute('aria-disabled',v)}
 function isIR(){return lvl()==='ir'}
 function setLvl(v){var o=$('#wsp .wlv button[data-v='+v+']');if(o)o.click();if(window.applyS)try{window.applyS()}catch(e){}setTimeout(paint,0)}
 function go(s){var u='main.html?'+(/[?&]solo=1/.test(location.search)?'solo=1&':'')+'status='+encodeURIComponent(s);
  try{if(top!==self&&top.WMMERGE&&top.WMMERGE.openItem&&top.WMMERGE.openItem(new URL(u,location.href).href))return}catch(e){}
  location.href=u}
 function paint(){if(!box)return;var b=base(),ir=isIR(),L=LV[ir?'ir':(b==='atpl'?'cpl':b)];
  $$('.v4lv button',box).forEach(function(x){x.setAttribute('aria-checked',x.dataset.v===b)});
  $('.v4lim',box).innerHTML=(b==='atpl'&&!ir)?'<div class="atpl">'+ATPL+'</div>':'<div class="lim4"><div><small>X-wind</small><b>'+L[0]+'<u>kt</u></b></div><div><small>Gust</small><b>'+L[1]+'<u>kt</u></b></div><div><small>Ceiling</small><b>'+L[2]+'<u>ft</u></b></div><div><small>Vis</small><b>'+L[3]+'<u>km</u></b></div></div>';
  $('.v4ifr',box).hidden=!ir;
  rsd();
  $('.pl.ir',box).setAttribute('aria-checked',ir);$('.pl.nt',box).setAttribute('aria-checked',$('#wsp .wnt').getAttribute('aria-checked')==='true');
  var r=$('#wsp .wsp-r button[aria-checked=true]');$$('.v4r button',box).forEach(function(x){x.setAttribute('aria-checked',!!r&&x.dataset.v===r.dataset.v)});
  var on=$('.v4sw .sw button.on',box),all=on&&/all/i.test(on.textContent);$('.v4cn',box).textContent=IC[all?'all':'icao'];$('.v4rn',box).textContent=(($('.wsx-h')||{}).textContent||'').replace(/^Right now\s*·\s*/,'Right now across ')+'.';
  var w=$('.wsx-w'),lines=$$('.wsx-l',w||D).map(function(l){var a=$('span',l),k=$('b',l);var t=(a?a.textContent:'')+': '+(k?k.textContent:'');return [/CAUTION/.test(t)?0:1,'<p style="--c:'+(/NO[- ](GO|DEPART|LAND)/.test(t)?'var(--v4ng)':'var(--v4cau)')+'">'+t+'</p>']});
  $('.why',box).innerHTML=lines.sort(function(a,b){return a[0]-b[0]}).map(function(x){return x[1]}).join('')}
 (function wait(n){if(ready())return build();if(n<200)setTimeout(function(){wait(n+1)},100)})(0);
})();
