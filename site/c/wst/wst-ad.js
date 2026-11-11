/* Aerodrome page: day/night rows inside the existing General section (SAST, UTC underneath). */
(function(){const W=window.WST,a=window.WSTAD;if(!W||!a)return;
const kv=[...document.querySelectorAll('h4.lbl')].find(h=>h.textContent.trim()==='General');const box=kv&&kv.parentNode.querySelector('.kv');if(!box)return;
const tz=t=>new Date(t).toLocaleTimeString('en-GB',{timeZone:'Africa/Johannesburg',hour:'2-digit',minute:'2-digit'}),tu=t=>new Date(t).toISOString().slice(11,16)+'Z';
const d=m=>{m=Math.max(0,Math.round(m/6e4));const H=Math.floor(m/60);return H?H+' h'+(m%60?' '+m%60+' min':''):m+' min'};
const row=(k,v)=>'<div class="wdn"><span>'+k+'</span><span>'+v+'</span></div>',T=t=>tz(t)+' SAST<small>'+tu(t)+'</small>';
function draw(){const n=Date.now(),s=W.sunInfo(a.la,a.lo,n),day=!s.isNight;
 const cd=n<s.set?'Sunset in '+d(s.set-n):n<s.nightFrom?'Night in '+d(s.nightFrom-n):'Sunrise in '+d(s.nextRise-n);
 const ic=day?'<svg class="wdi" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#F5A524"/></svg>':'<svg class="wdi" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="#A9B8E8"/></svg>';
 box.querySelectorAll('.wdn').forEach(x=>x.remove());
 box.insertAdjacentHTML('beforeend',row('Now',ic+(day?'Day':'Night')+'<small>'+cd+'</small>')+row('Sunrise',T(s.rise))+row('Sunset',T(s.set))+row('Civil twilight',tz(s.cr)+' – '+tz(s.cs)+' SAST<small>'+tu(s.cr)+' – '+tu(s.cs)+'</small>')+row('Night (CAR)','from '+T(s.nightFrom)))}
draw();/*5B*/((f,t)=>{let miss=0;setInterval(()=>{if(document.hidden){miss=1;return}f()},t);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&miss){miss=0;f()}})})(draw,60e3);
const g=kv.parentNode.querySelector('.gsub');if(g&&!g.dataset.wdn){g.dataset.wdn=1;g.insertAdjacentHTML('beforeend',' Sun times computed offline from the aerodrome position (±2 min). Night per CAR Part 1: 15 min after sunset to 15 min before sunrise.')}})();
