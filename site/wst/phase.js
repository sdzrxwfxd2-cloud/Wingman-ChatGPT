/* Depart / Land phase switch (MT 5 Nov 2026) — PREVIEW, UI ONLY.
   Words only: GO -> DEPART / LAND, NO-GO -> NO DEPART / NO LAND everywhere on the page, CAUTION stays. The engine, the aerodrome
   card code and every status decision are untouched (Codex owns the engine). The chosen phase and the Arrive
   time are published on window.WMPHASE + a 'wm:phase' event so the engine can pick them up later.
   Saved: localStorage 'wm.phaseMode' = 'depart' | 'land' (default depart). No Overall option.
   Status v4 page: liquid-glass Depart | Land switch at the top of Count; in Land an 'Arrive' chip sits next to
   it (Now / +1h / +2h / +3h, or tap 'Pick time'), limited to the forecast range (TAF ~30 h, model 72 h), with
   a small 'Using model forecast' note once the time is past the TAF (24 h, the shortest SA TAF). */
(function(){
 var D=document,K='wm.phaseMode',TAF_H=24,MODEL_H=72,H=36e5;
 var get=function(){try{return localStorage.getItem(K)==='land'?'land':'depart'}catch(e){return 'depart'}};
 var put=function(v){try{localStorage.setItem(K,v)}catch(e){}};
 var W={go:{depart:'DEPART',land:'LAND'},nogo:{depart:'NO DEPART',land:'NO LAND'}};
 var P=window.WMPHASE={mode:get(),arrive:{off:0,at:null},words:function(s){var m=P.mode;return s==='go'?W.go[m]:s==='nogo'?W.nogo[m]:s==='caution'?'CAUTION':null}};
 function fire(){try{D.dispatchEvent(new CustomEvent('wm:phase',{detail:{mode:P.mode,arriveAt:P.mode==='land'?arriveAt():null}}))}catch(e){}}
 function arriveAt(){return P.arrive.at!=null?P.arrive.at:Date.now()+P.arrive.off*H}
 /* ---- words layer (MT t2148): EVERY visible GO / NO-GO word on the page (cards, filter Status chips, Count, reason
    lines, intro text, top boxes, aerodrome page ...) reads DEPART / NO DEPART or LAND / NO LAND. Text nodes only:
    never classes, data-s, attributes or handlers, so every status decision stays exactly as the engine made it. ---- */
 var mine=typeof WeakSet==='function'?new WeakSet():{has:function(){return false},add:function(){}};
 var SKIP={SCRIPT:1,STYLE:1,TEXTAREA:1,INPUT:1,SELECT:1,OPTION:1,NOSCRIPT:1,CODE:1};
 function sw(t,ours){var m=P.mode,r=t.replace(/(^|[^-\w])NO[- ]GO(?![-\w])/g,function(x,p){return p+W.nogo[m]}).replace(/(^|[^-\w])GO(?![-\w])/g,function(x,p){return p+W.go[m]});
  if(ours)r=r.replace(/(^|[^-\w])NO (DEPART|LAND)(?![-\w])/g,function(x,p){return p+W.nogo[m]}).replace(/(^|[^-\w])(DEPART|LAND)(?![-\w])/g,function(x,p){return p+W.go[m]});
  return r}
 function fix(n){var v=n.nodeValue;if(!v||v.length>400)return;var o=mine.has(n);if(!o&&!/GO/.test(v))return;var r=sw(v,o);if(r!==v){n.nodeValue=r;mine.add(n)}}
 function walk(root){if(!root)return;if(root.nodeType===3){var pe=root.parentNode;if(pe&&!SKIP[pe.nodeName])fix(root);return}
  if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;if(SKIP[root.nodeName])return;
  var w=D.createTreeWalker(root,4,{acceptNode:function(n){for(var e=n.parentNode;e&&e!==root.parentNode;e=e.parentNode){if(SKIP[e.nodeName]||e.isContentEditable)return 2}return 1}}),n;while((n=w.nextNode()))fix(n)}
 /* No ghost (MT t2340): the swap runs INSIDE the MutationObserver callback, in the same microtask checkpoint as the change,
    so it always lands before the browser paints. It used to wait for the next animation frame; when a tap re-rendered the
    Status chips (fv3) or the cards from inside a frame callback, that frame painted the old GO / NO-GO words first and the
    swap only came one frame later: the ghost of the old GO / NO GO on DEPART / CAUTION / NO DEPART / INCOMPLETE taps.
    Our own nodeValue writes are dropped with takeRecords() so they never loop back. */
 /* MT: approved verdict v2. Presentation only: preserve the label text and existing capsule/theme.
    Run in the words observer's microtask so weather rewrites and phase switches never paint a bare dot. */
 var verdictPaths={go:'<path d="M4 18.2c4.3-.1 6.1-3.6 9.1-7.2L19.4 5M13.9 5.6l5.5-.6-.2 5.6"/><path d="M3.8 21h7"/>',caution:'<path d="M11.5 3.7c.7-1 1.3-.7 1.9.5l7.1 13.9c.6 1.3-.1 2-1.4 2.1l-14.9.3c-1.4 0-1.8-1-1.1-2.2L11.5 3.7Z"/><path d="m12 8.5.2 5.6m-.1 3.2h.1"/>',nogo:'<path d="m8.2 3.7 8.1.4 4.2 4.6-.3 8-4.7 3.8-8.1-.3-4-4.8.5-7.7 4.3-4Z"/><path d="m7.8 12.2 8.4-.2"/>',incomplete:'<path d="M17 4.5c-2.8-2-7.6-1.5-10.2 1.2C3 9.2 3.4 15 6.7 18.3c2.8 2.7 7.2 3 10.6.8m2.8-4.5.2-.5M20 8.4l.2.5"/><path d="m12 7.8-.2 5.1m.1 3.3h.1"/>'};
 verdictPaths.land='<path d="M4 5.2c4.3.1 6.1 3.6 9.1 7.2l6.3 6M13.9 18l5.5.6-.2-5.6M3.8 21h16"/>';
 var verdictKeys={GO:'go',DEPART:'go',LAND:'land',CAUTION:'caution','NO-GO':'nogo','NO DEPART':'nogo','NO LAND':'nogo',INCOMPLETE:'incomplete','No weather':'incomplete'};
 function verdictIcons(){D.querySelectorAll('.card .badge, #tiles .tile .k, .v4 .cnt .wm-verdict-label, .fs-wx').forEach(function(b){
  var key=verdictKeys[b.textContent.trim()],old=b.querySelector('svg.wm-verdict-icon');
  if(!key){if(old)old.remove();b.removeAttribute('data-verdict-icon');return}
  if(old&&b.getAttribute('data-verdict-icon')===key)return;
  if(old)old.remove();
  b.querySelectorAll('.d').forEach(function(dot){dot.remove()});
  var svg=D.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('class','wm-verdict-icon');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
  svg.innerHTML=verdictPaths[key];b.insertBefore(svg,b.firstChild);b.setAttribute('data-verdict-icon',key);
 })}
 var verdictStyle=D.createElement('style');verdictStyle.textContent='.card .badge[data-verdict-icon]{box-sizing:border-box;width:auto;padding:0 10px;gap:6px;white-space:nowrap}.card .badge[data-verdict-icon]::before{display:none}.wm-verdict-icon{width:14px;height:14px;flex:none;fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}'+'#tiles .tile .k[data-verdict-icon],html.sv4 .v4 .cnt .wm-verdict-label{display:flex;align-items:center;gap:5px;white-space:nowrap}#tiles .tile .k[data-verdict-icon]{letter-spacing:.03em;font-size:10px}#tiles .wm-verdict-icon,.tiles .wm-verdict-icon{color:var(--c);filter:drop-shadow(0 0 5px var(--c))}.v4 .cnt .wm-verdict-icon{width:13px;height:13px}'+/* MT t860u: Spotlight status pill uses the same approved icons (replaces the dot) */'.fs-wx[data-verdict-icon]{grid-template-columns:12px 1fr!important;width:auto}.fs-wx[data-verdict-icon]>i{display:none}.fs-wx .wm-verdict-icon{width:12px;height:12px;color:var(--c)}';D.head.appendChild(verdictStyle);
 var busy=0,todo=[],full=0,mo=null;
 function words(){if(busy)return;busy=1;try{if(full||todo.length>400){full=0;todo=[];walk(D.body)}else{var t=todo;todo=[];t.forEach(function(n){if(n.isConnected!==false)walk(n)})}verdictIcons()}finally{busy=0;if(mo)mo.takeRecords()}}
 function all(){full=1;words()}
 function obs(){if(!D.body)return setTimeout(obs,50);mo=new MutationObserver(function(ms){if(busy)return;ms.forEach(function(m){if(m.type==='characterData')todo.push(m.target);else m.addedNodes.forEach(function(n){todo.push(n)})});if(todo.length)words()});mo.observe(D.body,{subtree:true,childList:true,characterData:true});full=1;words()}
 obs();
 window.addEventListener('storage',function(e){if(e.key===K){P.mode=get();all();ui()}});
 /* ---- Status v4 UI ---- */
 var R;
 function pad(n){return (n<10?'0':'')+n}
 function hm(t){var d=new Date(t);return pad(d.getHours())+':'+pad(d.getMinutes())}
 function local(t){var d=new Date(t);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes())}
 function chipTxt(){if(P.arrive.at!=null){var d=new Date(P.arrive.at),t=new Date();return (d.toDateString()===t.toDateString()?'':['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]+' ')+hm(P.arrive.at)}return P.arrive.off?'+'+P.arrive.off+'h':'Now'}
 function ui(){if(!R)return;var land=P.mode==='land';
  R.querySelectorAll('.ph button').forEach(function(b){b.setAttribute('aria-checked',String(b.dataset.v===P.mode))});R.querySelector('.ph').dataset.v=P.mode;
  var c=R.querySelector('.arv');c.hidden=!land;c.querySelector('em').textContent=chipTxt();
  var m=R.querySelector('.arm');if(!land)m.hidden=true;c.setAttribute('aria-expanded',String(!m.hidden));
  m.querySelectorAll('button[data-o]').forEach(function(b){b.setAttribute('aria-checked',String(P.arrive.at==null&&+b.dataset.o===P.arrive.off))});
  var past=land&&arriveAt()-Date.now()>TAF_H*H;R.querySelector('.mdl').hidden=!past;
  var n=R.querySelector('.phn');n.textContent=land?'Land: is it OK to arrive there at that time.':'Depart: is it OK to leave from there now.'}
 function build(){var sec=D.querySelector('#wsp .v4 .v4sw');if(!sec)return false;sec=sec.closest('.sec');if(sec.querySelector('.v4ph'))return true;
  R=D.createElement('div');R.className='v4ph';
  R.innerHTML='<div class="phr"><div class="ph" role="radiogroup" aria-label="Phase"><i></i><button type="button" role="radio" data-v="depart">Depart</button><button type="button" role="radio" data-v="land">Land</button></div>'+
   '<button type="button" class="arv" aria-haspopup="true" aria-expanded="false"><small>Arrive</small><em>Now</em><svg viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>'+
   '<div class="arm" hidden><button type="button" data-o="0">Now</button><button type="button" data-o="1">+1h</button><button type="button" data-o="2">+2h</button><button type="button" data-o="3">+3h</button><label class="pk"><span>Pick time</span><input type="datetime-local" step="900"></label></div>'+
   '<p class="fn mdl" hidden>Using model forecast \u2014 past the TAF.</p><p class="fn phn"></p>';
  var hd=sec.querySelector('.hd');hd.after(R);
  R.querySelectorAll('.ph button').forEach(function(b){b.onclick=function(){if(P.mode===b.dataset.v)return;P.mode=b.dataset.v;put(P.mode);all();ui();fire()}});
  var c=R.querySelector('.arv'),m=R.querySelector('.arm'),inp=m.querySelector('input');
  c.onclick=function(){m.hidden=!m.hidden;if(!m.hidden){var n=Date.now();inp.min=local(n);inp.max=local(n+MODEL_H*H);inp.value=local(arriveAt())}ui()};
  m.querySelectorAll('button[data-o]').forEach(function(b){b.onclick=function(){P.arrive={off:+b.dataset.o,at:null};m.hidden=true;ui();fire()}});
  inp.onchange=function(){var t=Date.parse(inp.value);if(isNaN(t))return;var n=Date.now();t=Math.min(Math.max(t,n),n+MODEL_H*H);P.arrive={off:0,at:t};inp.value=local(t);ui();fire()};
  D.addEventListener('click',function(e){if(!m.hidden&&!R.contains(e.target)){m.hidden=true;ui()}});
  ui();all();return true}
 (function wait(n){if(build()||n>200)return;setTimeout(function(){wait(n+1)},100)})(0);
})();
