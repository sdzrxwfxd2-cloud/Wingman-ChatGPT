/* wm-status.js — Status page: reasons line, tap-for-checks list, My minimums (WMCore). Guidance only — the pilot in command decides. */
(function(){var K=window.WMCore,B=window.WMB;if(!K||!B)return;
var css=document.createElement('style');css.textContent=
'.wsp-why{margin:8px 0 0;font:500 12.5px/1.4 Satoshi,-apple-system,sans-serif;color:var(--tx2)}'+
'.wad{margin:14px 0;padding:14px 16px}.wad>summary{cursor:pointer;list-style:none;font:600 15px/1.2 Satoshi,-apple-system,sans-serif;color:var(--tx)}.wad>summary::-webkit-details-marker{display:none}'+
'.wad>summary small{float:right;color:var(--tx3);font-weight:500}.wad .ar{border-bottom:.5px solid var(--ln)}.wad .ar>summary{display:flex;gap:8px;align-items:center;min-height:40px;cursor:pointer;list-style:none;font:500 13px/1.3 Satoshi,-apple-system,sans-serif;color:var(--tx)}'+
'.wad .ar>summary::-webkit-details-marker{display:none}.wad .ar code{font:600 12px/1 "JetBrains Mono",monospace;min-width:40px}.wad .ar .d{width:8px;height:8px;border-radius:4px;flex:none;background:var(--tx3)}'+
'.wad .ar[data-s=go] .d{background:#22C55E}.wad .ar[data-s=caution] .d{background:#F59E0B}.wad .ar[data-s=nogo] .d{background:#EF4444}.wad .ar .y{color:var(--tx3);font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
'.wad ul{margin:0 0 10px;padding:0 0 0 18px;font:400 12.5px/1.5 Satoshi,-apple-system,sans-serif;color:var(--tx2)}.wad li b{font-weight:600;color:var(--tx)}'+
'.limcard .lim{height:auto;min-height:44px;flex-wrap:wrap;padding:6px 0}.limcard .lim .ll{display:flex;flex-direction:column;gap:3px}'+
'.otag{display:inline-block;padding:2px 6px;border-radius:7px;font:600 9.5px/1 Satoshi,-apple-system,sans-serif;letter-spacing:.04em;color:var(--tx2);background:var(--gl2);box-shadow:inset 0 0 0 .5px var(--ln);width:max-content}'+
'.otag.you{color:#0019C9;box-shadow:inset 0 0 0 1px #0019C9}.lim .msg{flex-basis:100%;font:500 11.5px/1.35 Satoshi,-apple-system,sans-serif;color:var(--tx3);margin-top:2px}.lim .msg:empty{display:none}'+
'.lim.amber .msg,.lim.amber b[data-f]{color:#D97706}.lim.legal .msg{color:#DC2626}@keyframes wmshake{0%,100%{transform:none}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}.lim.shake .stp{animation:wmshake .4s}'+
'.limcard .wrst{margin-top:12px;height:34px;padding:0 14px;border-radius:17px;border:0;background:var(--gl2);box-shadow:inset 0 0 0 .5px var(--ln);color:var(--tx);font:600 13px/1 Satoshi,-apple-system,sans-serif;cursor:pointer}'+
'.limcard .wdis{margin:10px 0 0;font:500 11.5px/1.4 Satoshi,-apple-system,sans-serif;color:var(--tx3)}';
document.head.appendChild(css);
var LB={go:'GO',caution:'CAUTION',nogo:'NO-GO',none:'—'},SEV={nogo:'NO-GO',caution:'CAUTION',go:'OK',info:'Info'};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
function fmt(f,v){return f==='vis'?(Math.round(v*10)/10)+'':String(Math.round(v))}
/* My minimums */
var NIGHTON=function(){var p=B.prof();return p.night||p.licence==='ir'};
function buildLim(){var L=document.querySelector('#wsp .limcard');if(!L||!document.querySelector('#wsp .wsp-sum2')||L.querySelector('.sw'))return false;if(L.dataset.wm)return true;L.dataset.wm=1;
 [].slice.call(L.children).forEach(function(e){if(e.tagName!=='H5')e.remove()});
 Object.keys(K.FIELDS).forEach(function(f){var F=K.FIELDS[f],r=document.createElement('div');r.className='lim';r.dataset.f=f;
  r.innerHTML='<span class="ll">'+F.label+'<span class="otag"></span></span><span class="stp"><button data-d="-1" aria-label="Lower">−</button><b data-f="'+f+'"></b><small>'+F.unit+'</small><button data-d="1" aria-label="Raise">+</button></span><span class="msg" aria-live="polite"></span>';
  L.appendChild(r);r.querySelectorAll('button').forEach(function(b){b.onclick=function(e){e.stopPropagation();step(f,+b.dataset.d)}})});
 var rb=document.createElement('button');rb.className='wrst';rb.textContent='Reset to licence & aircraft';rb.onclick=function(){var p=B.prof();p.custom={};K.setProfile(p);msgs={};paint();window.applyS()};L.appendChild(rb);
 var d=document.createElement('p');d.className='wdis';d.textContent=K.DISCLAIMER.replace('\u2014','-').replace(/^Guidance only -/,'Guidance only -');d.textContent='Guidance only - the pilot in command decides.';L.appendChild(d);paint();return true}
var msgs={};
function cur(f){var m=K.effectiveMinimums(B.prof(),{night:NIGHTON()})[f],c=B.prof().custom[f];return{v:c!=null?c:m.value,m:m}}
function step(f,d){var F=K.FIELDS[f],v=+(cur(f).v+d*F.step).toFixed(1);set(f,v)}
function set(f,v){var p=B.prof(),x=K.validateInput(f,v,p),row=document.querySelector('#wsp .limcard .lim[data-f='+f+']');
 row.classList.remove('shake');void row.offsetWidth;
 if(x.status==='unrealistic'){row.classList.add('shake');msgs[f]={c:'',t:x.message};paint();return}
 if(x.status==='legal'){p.custom[f]=x.clamped;msgs[f]={c:'legal',t:x.message+' - sprang back'}}
 else if(x.status==='default'){delete p.custom[f];msgs[f]={c:'',t:''}}
 else{p.custom[f]=v;msgs[f]={c:x.status==='above'?'amber':'',t:x.message}}
 K.setProfile(p);paint();window.applyS()}
function paint(){var L=document.querySelector('#wsp .limcard');if(!L)return;var p=B.prof(),M=K.effectiveMinimums(p,{night:NIGHTON()});
 Object.keys(K.FIELDS).forEach(function(f){var row=L.querySelector('.lim[data-f='+f+']');if(!row)return;var c=p.custom[f],v=c!=null?c:M[f].value,o=c!=null&&!M[f].warn?'You':M[f].origin;
  row.querySelector('b[data-f]').textContent=fmt(f,v);var t=row.querySelector('.otag');t.textContent=o;t.classList.toggle('you',o==='You');
  var g=msgs[f]||{c:M[f].warn?'amber':'',t:M[f].warn?'Looser than '+M[f].origin.toLowerCase()+' - cards use '+fmt(f,M[f].value)+' '+K.FIELDS[f].unit:''};
  row.classList.toggle('amber',g.c==='amber'||!!M[f].warn&&!msgs[f]);row.classList.toggle('legal',g.c==='legal');row.querySelector('.msg').textContent=g.t})}
/* reasons line + aerodrome list */
function paintWhy(){var box=document.querySelector('#wsp .wsp-sum2');if(!box)return;var S=window.__wmSum;if(!S)return;
 var p=box.querySelector('.wsp-why');if(!p){p=document.createElement('p');p.className='wsp-why';box.appendChild(p)}
 p.textContent=S.lines.length?S.lines.join(' · '):'No CAUTION or NO-GO reasons right now';
 var cs=[].slice.call(document.querySelectorAll('#wsp-cards .card')).filter(function(c){return c.__wm&&/^[A-Z]{4}$/.test(((c.querySelector('.icao')||{}).textContent||'').trim())});
 var W=document.getElementById('wad');if(!W){W=document.createElement('details');W.id='wad';W.className='wad wsp-g glass';box.after(W)}
 var open={};W.querySelectorAll('.ar[open]').forEach(function(a){open[a.dataset.ic]=1});var o=W.open;
 var ord={nogo:0,caution:1,go:2,none:3};cs.sort(function(a,b){return ord[a.__wm.status]-ord[b.__wm.status]});
 W.innerHTML='<summary>Aerodromes - tap for full checks<small>'+cs.length+'</small></summary>'+cs.map(function(c){var r=c.__wm,ic=c.querySelector('.icao').textContent.trim(),nm=(c.querySelector('h2')||{}).textContent||'';
  return '<details class="ar" data-ic="'+ic+'" data-s="'+r.status+'"'+(open[ic]?' open':'')+'><summary><i class="d"></i><code>'+ic+'</code><span>'+esc(nm)+'</span><span class="y">'+LB[r.status]+' · '+esc(r.whyShort||r.why)+'</span></summary><ul>'+
   (r.reasons||[]).map(function(x){return '<li><b>'+(SEV[x.severity]||esc(x.severity))+'</b> '+esc(x.text)+'</li>'}).join('')+
   '<li>Source: '+esc(r.source||'none')+(r.time?' '+K.util.sast(r.time)+' SAST':'')+'</li><li>Guidance only - the pilot in command decides.</li></ul></details>'}).join('');W.open=o}
document.addEventListener('wm:pass',function(){paintWhy();paint()});
(function go(){if(!buildLim())setTimeout(go,120)})();
})();
