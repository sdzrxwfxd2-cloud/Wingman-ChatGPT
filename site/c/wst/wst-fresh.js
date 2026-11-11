/* Cards: show METAR observation time (UTC) next to the age, and an OLD flag when the observation is more than 90 min old. */
(function(){const z=n=>String(n).padStart(2,'0'),M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function run(){const now=Date.now()/1e3;document.querySelectorAll('.card .meta .age[data-obs]').forEach(a=>{const o=+a.dataset.obs;if(!o)return;const d=new Date(o*1e3),old=now-o>5400,mn=Math.max(0,Math.round((now-o)/60)),ag=mn<60?mn+' min ago':Math.floor(mn/60)+' h '+z(mn%60)+' min ago';if(a.textContent!==ag)a.textContent=ag;
 let s=a.nextElementSibling;if(!s||!s.classList.contains('wobs')){s=document.createElement('span');s.className='wobs';a.after(s)}
 const t=(d.toDateString()===new Date().toDateString()?'':d.getUTCDate()+' '+M[d.getUTCMonth()]+' ')+z(d.getUTCHours())+z(d.getUTCMinutes())+'Z';
 const h=' · '+t+(old?' <i class="wold" title="Observation more than 90 min old — check the latest METAR">OLD</i>':'');if(s.innerHTML!==h)s.innerHTML=h;a.closest('.card').classList.toggle('wx-old',old)})}
run();/*5B*/((f,t)=>{let miss=0;setInterval(()=>{if(document.hidden){miss=1;return}f()},t);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&miss){miss=0;f()}})})(run,30e3);document.addEventListener('wst:data',run);addEventListener('pageshow',run)})();
