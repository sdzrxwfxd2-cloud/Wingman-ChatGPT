/* Aerodromes page: existing cards only get status/colour/reason from the saved pills. No new elements. */
(function(){const C=window.WSTC;if(!C)return;const orig=window.applyS;
const LB={go:'GO',caution:'CAUTION',nogo:'NO-GO',none:'NO DATA',noiap:'NO IFR APPROACH'};
const S=window.WMST;
function fill(){document.querySelectorAll('.card').forEach(c=>{const i=c.querySelector('.icao'),m=i&&S.metar[i.textContent];if(!m)return;const ob=c.querySelector('[data-obs]');if(ob&&+ob.dataset.obs>=m.obsTime)return;const q=x=>c.querySelector(x);
 const mt=q('.cp[data-p=metar] .mono');if(mt)mt.textContent=m.rawOb;const tf=q('.cp[data-p=taf] .mono'),t=S.taf[i.textContent];if(tf&&t)tf.textContent=t;
 const tp=q('.temp');if(tp&&m.temp!=null)tp.innerHTML=Math.round(m.temp)+'<sup>°C</sup>';const w=m.wspd||0,sp=c.querySelectorAll('.wxd span');
 if(sp[0])sp[0].innerHTML='Wind <b class="num">'+(m.wdir==='VRB'?'VRB':String(m.wdir).padStart(3,'0')+'°')+' '+w+' kt'+(m.wgst?' G'+m.wgst:'')+'</b>';
 if(sp[1]){const R=' '+(m.rawOb||'')+' ',cav=/ CAVOK /.test(R),vm=R.match(/ (\d{4})(?:NDV)? /),vv=cav||(vm&&vm[1]==='9999')||m.visib==='6+'?'10+ km':vm?(+vm[1]>=5000?Math.round(+vm[1]/1000):(+vm[1]/1000).toFixed(1))+' km':(m.visib!=null?(Math.round(parseFloat(m.visib)*16.09)/10)+' km':'—');
  const cl=(m.clouds||[]).filter(x=>x&&x.cover),sky=cav?'CAVOK':cl.length?cl[0].cover:/ (NSC|NCD|SKC|CLR) /.test(R)?R.match(/ (NSC|NCD|SKC|CLR) /)[1]:'—';sp[1].innerHTML='Vis <b>'+vv+'</b> · Sky <b>'+sky+'</b>'}
 const FC={VFR:['VFR','#22C55E','VMC'],MVFR:['MVFR','#3B82F6','VMC'],IFR:['IFR','#F80F3B','IMC'],LIFR:['LIFR','#C026D3','IMC']}[m.fltCat],fb=c.querySelectorAll('.fcb2 .fbadge');if(FC&&fb.length>=2){fb[0].style.setProperty('--c',FC[1]);fb[0].innerHTML='<i></i>'+FC[0];fb[1].style.setProperty('--c',FC[2]==='VMC'?'#22C55E':'#F80F3B');fb[1].innerHTML='<i></i>'+FC[2]}
 if(sp[2]&&m.altim)sp[2].innerHTML='QNH <b class="num">'+Math.round(m.altim)+'</b>';c.querySelectorAll('[data-obs]').forEach(e=>e.dataset.obs=m.obsTime);
 const ag=q('.age');if(ag){const n=Math.round((Date.now()/1e3-m.obsTime)/60);ag.textContent=n<60?n+' min ago':Math.floor(n/60)+' h '+n%60+' min ago'}})}
/* the page's own live refresh (go) overwrites these when served; on file:// the snapshot fills them */
/* fill only where the snapshot is newer than what the card shows; the live refresh overwrites with newer data when served */
fill();document.addEventListener('wst:data',fill);
function mine(){const R=C.all();
 document.querySelectorAll('.card').forEach(c=>{const i=c.querySelector('.icao'),r=i&&R[i.textContent];if(!r||r.s==='none')return;
  const s=r.s==='noiap'?'nogo':r.s;if(c.dataset.s!==s){c.dataset.s=s}
  const b=c.querySelector('.badge');if(b)b.textContent=LB[r.s];const w=c.querySelector('.why');if(w)w.innerHTML='<b>'+LB[r.s]+'</b> · '+r.why.replace(/[<>&]/g,'')});
 const n={go:0,caution:0,nogo:0};document.querySelectorAll('.card').forEach(c=>{if(n[c.dataset.s]!=null)n[c.dataset.s]++});
 document.querySelectorAll('#tiles .tile').forEach(t=>{const k=t.querySelector('.n');if(k&&n[t.dataset.s]!=null)k.textContent=n[t.dataset.s]});
 C.dots(R)}
window.applyS=function(){try{orig&&orig()}catch(e){}mine()};window.applyS();
addEventListener('storage',e=>{if(/^wm-(ac|rules|lvl|night)$/.test(e.key||''))window.applyS()});
document.addEventListener('wst:data',()=>window.applyS());addEventListener('pageshow',()=>window.applyS());/*5B*/((f,t)=>{let miss=0;setInterval(()=>{if(document.hidden){miss=1;return}f()},t);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&miss){miss=0;f()}})})(()=>window.applyS(),60e3)})();
