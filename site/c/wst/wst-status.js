/* Standalone Status page: pills only. */
(function(){const W=window.WST,C=window.WSTC;if(!W||!C)return;
const set=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};let s=C.sel();
const root=document.getElementById('wsp');
const AC=W.AC,ac=()=>AC.find(a=>a.id===s.ac)||AC[0];
root.innerHTML='<header class="wsp-h"><h1>Status</h1><p>Choose how GO / CAUTION / NO-GO is worked out. It applies to the Aerodromes cards and the search dots.</p></header>'+
'<section class="wsp-g glass"><h2>Aircraft</h2><button class="wsp-ac" aria-haspopup="dialog"><svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg><span class="n"></span><span class="v"></span><svg class="cv" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button><p class="fn">Maximum demonstrated crosswind from each type\u2019s POH/AFM. Crosswind is worked out for every runway and the best one is used.</p></section>'+
'<section class="wsp-g glass"><h2>Flight rules</h2><div class="wseg wsp-r" role="radiogroup" aria-label="Flight rules"><i></i><button role="radio" data-v="vfr">VFR</button><button role="radio" data-v="ifr">IFR</button></div><p class="fn">VFR: 5 km and 1 500 ft (CAR Part 91.06.21). IFR: needs a published approach (AIP AD 2.24); never below the Cat I floor of 200 ft / 550 m. Always use the plate minima.</p></section>'+
'<section class="wsp-g glass"><h2>Pilot level</h2><div class="wseg wlv" role="radiogroup" aria-label="Pilot level"><i></i><button role="radio" data-v="ppl">PPL</button><button role="radio" data-v="cpl">CPL</button><button role="radio" data-v="ir">IR</button></div><p class="fn lvf"></p></section>'+
'<section class="wsp-g glass"><div class="wsp-nr"><div><h2>Night</h2><p class="fn" style="margin:0">Night is 15 min after sunset to 15 min before sunrise (CAR Part 1). Off: night-time VFR is NO-GO.</p></div><button class="wnt" role="switch" aria-label="Night"><svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg><span>Night</span></button></div></section>'+
'<p class="wsp-sum" aria-live="polite"></p><p class="wsp-d">Guidance only \u2014 not a substitute for an official weather brief, NOTAMs or your own judgement as pilot in command. Level limits are conservative app defaults, not regulation.</p>';
const q=x=>root.querySelector(x),LV={ppl:'Crosswind 12 kt · gust 25 kt · ceiling 2 500 ft · visibility 8 km',cpl:'Crosswind 15 kt · gust 25 kt · ceiling 1 500 ft · visibility 5 km',ir:'Crosswind 12 kt · gust 25 kt · ceiling 2 000 ft · visibility 6 km · IFR 600 ft / 2 km'};
function ui(){q('.wsp-ac .n').textContent=ac().n;q('.wsp-ac .v').textContent=ac().xw?ac().xw+' kt':'not verified';
 const r=q('.wsp-r');r.dataset.v=s.rules;r.querySelectorAll('button').forEach(b=>b.setAttribute('aria-checked',b.dataset.v===s.rules));
 const l=q('.wlv');l.style.setProperty('--ix',['ppl','cpl','ir'].indexOf(s.lvl));l.querySelectorAll('button').forEach(b=>b.setAttribute('aria-checked',b.dataset.v===s.lvl));
 q('.lvf').textContent=LV[s.lvl]+'. The stricter of these, the aircraft limit and the VFR/IFR minima is used.';q('.wnt').setAttribute('aria-checked',s.night);
 const R=C.all(),n={go:0,caution:0,nogo:0};for(const k in R){const v=R[k].s==='noiap'?'nogo':R[k].s;if(n[v]!=null)n[v]++}C.dots(R);
 q('.wsp-sum').innerHTML='Right now across 65 AIP aerodromes: <b class="g">'+n.go+' GO</b> · <b class="c">'+n.caution+' CAUTION</b> · <b class="n">'+n.nogo+' NO-GO</b>'}
q('.wsp-r').querySelectorAll('button').forEach(b=>b.onclick=()=>{s.rules=b.dataset.v;set('wm-rules',s.rules);ui()});
q('.wlv').querySelectorAll('button').forEach(b=>b.onclick=()=>{s.lvl=b.dataset.v;set('wm-lvl',s.lvl);ui()});
q('.wnt').onclick=()=>{s.night=!s.night;set('wm-night',s.night?'1':'0');ui()};
const bk=document.createElement('div');bk.className='wbk';const sh=document.createElement('div');sh.className='wsh glass';sh.setAttribute('role','dialog');sh.setAttribute('aria-modal','true');sh.setAttribute('aria-label','Aircraft');document.body.append(bk,sh);let lf;
const close=()=>{bk.classList.remove('on');sh.classList.remove('on');lf&&lf.focus({preventScroll:true})};bk.onclick=close;addEventListener('keydown',e=>{if(e.key==='Escape')close()});
q('.wsp-ac').onclick=()=>{lf=document.activeElement;sh.innerHTML='<div class="grab"></div><div class="hd"><h3>Aircraft</h3><button class="x">Done</button></div><div class="grp">'+AC.map(a=>'<div class="row"><button class="opt" role="radio" aria-checked="'+(a.id===s.ac)+'" data-id="'+a.id+'"><span>'+a.n+'<small>'+(a.xw?'Demonstrated crosswind '+a.xw+' kt · '+a.src:'Crosswind not verified from POH')+'</small></span></button><span class="ck" style="opacity:'+(a.id===s.ac?1:0)+'">✓</span></div>').join('')+'</div><p class="note">Sorted by how often each type appears on South African ATO fleet pages.</p>';
 bk.classList.add('on');sh.classList.add('on');sh.querySelector('.x').onclick=close;setTimeout(()=>sh.querySelector('.x').focus({preventScroll:true}),60);
 sh.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{s.ac=b.dataset.id;set('wm-ac',s.ac);sh.querySelectorAll('.opt').forEach((x,i)=>{x.setAttribute('aria-checked',x===b);sh.querySelectorAll('.ck')[i].style.opacity=x===b?1:0});ui()})};
document.addEventListener("wst:data",ui);ui()})();
