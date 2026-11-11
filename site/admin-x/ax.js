/* Shared code for the rebuilt admin pages (11 Nov 2026). Same admin password and session cookie as /admin (ADMIN_DASH_SECRET).
   Data: /api/admin/visits, /api/admin/stats, /api/admin/health (all read-only). ?example=1 works on localhost only
   and shows clearly labelled EXAMPLE DATA (for pictures); on the live site it is ignored. */
(function(){
var H=document.documentElement,TM={amethyst:['night','purple'],midnight:['night','black'],pearl:['day','white'],champagne:['day','beige']};
var LOCAL=/^(localhost|127\.0\.0\.1)$/.test(location.hostname),EX=LOCAL&&new URLSearchParams(location.search).get('example')==='1';
var PAGES=[['/admin-visits','Visits'],['/admin-visitor-log','Visitor log'],['/admin-visitors','Visitors'],['/admin-status','Status'],['/admin-sitestatus','Site status'],['/admin-dashboard','Dashboard']];
function $(s){return document.querySelector(s)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function n(x){return(Number(x)||0).toLocaleString('en-GB')}
function sast(t,sec){if(!t)return'—';var d=new Date(typeof t==='number'?t:Date.parse(t)||t);if(isNaN(d))return'—';
  var o={timeZone:'Africa/Johannesburg',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false};if(sec)o.second='2-digit';return d.toLocaleString('en-GB',o)}
function dur(ms){if(!(ms>=0)||!isFinite(ms))return'—';var m=Math.floor(ms/6e4),d=Math.floor(m/1440),h=Math.floor(m%1440/60);return(d?d+'d ':'')+(d||h?h+'h ':'')+(m%60)+'m'}
function themeButtons(){var cur=H.dataset.theme+':'+H.dataset.pal;document.querySelectorAll('.thm button').forEach(function(b){var t=TM[b.dataset.t];b.classList.toggle('on',!!t&&t.join(':')===cur);
  b.onclick=function(){H.dataset.theme=t[0];H.dataset.pal=t[1];try{localStorage.setItem('ga-admin-theme',b.dataset.t)}catch(e){}themeButtons()}})}
function tabs(){var el=$('#tabs');if(!el)return;var p=location.pathname.replace(/\.html$/,'');
  el.innerHTML=PAGES.map(function(x){return'<a href="'+x[0]+(EX?'.html?example=1':'')+'"'+(p===x[0]?' class="on" aria-current="page"':'')+'>'+x[1]+'</a>'}).join('')}
async function api(path,opt){
  if(EX){var d=window.AX_EXAMPLE?window.AX_EXAMPLE(path):null;return{ok:!!d,status:d?200:404,data:d||{}}}
  var r=await fetch(path,Object.assign({credentials:'same-origin',cache:'no-store',headers:{'Accept':'application/json'}},opt||{}));
  var j={};try{j=await r.json()}catch(e){}return{ok:r.ok,status:r.status,data:j}}
/* one visit row, the 30 Oct visitor-log data model, from the store's field names */
var DEV={mobile:'Phone',tablet:'Tablet',desktop:'Desktop'};
function isTest(r){return /GoAround-|HeadlessChrome|bot|crawl|spider/i.test(r.ua||'')||/diagnostic-check|[?&]diag=1/.test((r.path||'')+(r.ref||''))}
function rows(raw){var per={};(raw||[]).forEach(function(r){if(r.sid)per[r.sid]=Math.max(per[r.sid]||0,r.n||1)});
  return(raw||[]).filter(function(r){return r&&r.ts}).map(function(r){return{t:r.ts,path:r.path||'/',dev:DEV[r.device_type]||r.device_type||'Unknown',model:r.device_model||'',os:r.os||'',osv:r.os_ver||'',br:r.browser||'',
    screen:r.screen||'',viewport:r.viewport||'',dpr:r.dpr==null?'':r.dpr,lang:r.lang||'',tz:r.tz||'',city:r.city||'',region:r.region||'',country:r.country||'',ip:r.ip||'',ref:r.ref||'',sid:r.sid||'',n:r.n||1,sv:per[r.sid]||1,net:r.net||'',test:isTest(r)}})}
var COLS=[['Time (SAST)','t'],['City','city'],['Region','region'],['Country','country'],['Device','dev'],['Model','model'],['OS','os'],['Browser','br'],['Screen','screen'],['Viewport','viewport'],['DPR','dpr'],['Language','lang'],['Time zone','tz'],['IP','ip'],['Referrer','ref'],['Page','path'],['Session · visit','sid']];
function cell(r,k){switch(k){
  case't':return'<td class="t" data-k="Time">'+esc(sast(r.t,1))+(r.test?'<span class="tag">test</span>':'')+'</td>';
  case'model':return'<td data-k="Model">'+(r.model?esc(r.model):'<span class="hid">hidden</span>')+'</td>';
  case'os':return'<td data-k="OS">'+esc((r.os+' '+r.osv).trim()||'—')+'</td>';
  case'ip':return'<td class="mono" data-k="IP">'+esc(r.ip||'—')+'</td>';
  case'ref':return'<td class="w" data-k="From">'+(r.ref?esc(r.ref):'<span class="hid">direct</span>')+'</td>';
  case'path':return'<td class="w mono" data-k="Page">'+esc(r.path)+'</td>';
  case'sid':return'<td data-k="Session" title="'+esc(r.sid)+'">'+esc((r.sid||'—').slice(0,8))+' · #'+esc(r.n)+' of '+esc(r.sv)+'</td>';
  default:var lab={city:'City',region:'Region',country:'Country',dev:'Device',br:'Browser',screen:'Screen',viewport:'Viewport',dpr:'DPR',lang:'Lang',tz:'TZ'}[k]||k;return'<td data-k="'+lab+'">'+esc(r[k]===''||r[k]==null?'—':r[k])+'</td>'}}
function table(list,cols){cols=cols||COLS;var h='<div class="vt"><table><thead><tr>'+cols.map(function(c){return'<th>'+c[0]+'</th>'}).join('')+'</tr></thead><tbody>';
  list.forEach(function(r){h+='<tr'+(r.test?' class="tst"':'')+'>'+cols.map(function(c){return cell(r,c[1])}).join('')+'</tr>'});
  if(!list.length)h+='<tr><td colspan="'+cols.length+'" class="m">No visits match.</td></tr>';return h+'</tbody></table></div>'}
function bars(list,max){list=(list||[]).map(function(r){return Array.isArray(r)?r:[r.name,r.n]});var tot=list.reduce(function(a,r){return a+(r[1]||0)},0)||1;
  return list.slice(0,max||8).map(function(r){var p=r[1]/tot;return'<div class="li"><div class="r"><span>'+esc(r[0])+'</span><span class="m">'+n(r[1])+' · '+Math.round(p*100)+'%</span></div><div class="bar"><i style="transform:scaleX('+p.toFixed(3)+')"></i></div></div>'}).join('')||'<p class="m">Nothing logged yet.</p>'}
function count(list,key){var c={};list.forEach(function(r){var k=r[key]||'Unknown';c[k]=(c[k]||0)+1});return Object.keys(c).map(function(k){return[k,c[k]]}).sort(function(a,b){return b[1]-a[1]})}
function chart(days){if(!days||!days.length)return'<p class="m">No visits in this range yet.</p>';var max=Math.max.apply(null,days.map(function(d){return d.n||0}))||1;
  return'<div class="chart">'+days.map(function(d){return'<div class="col" title="'+esc(d.day)+' · '+n(d.n)+' visits"><i style="height:'+Math.max(4,Math.round((d.n||0)/max*118))+'px"></i><span>'+esc((d.day||'').slice(5))+'</span></div>'}).join('')+'</div>'}
function set(id,cls,html){var c=$(id);if(!c)return;c.className='card glass'+(c.classList.contains('wide')?' wide':'')+(cls?' '+cls:'');var b=c.querySelector('.b');b.className='b';b.innerHTML=html}
function start(load){
  tabs();themeButtons();
  if(EX){var bn=document.createElement('div');bn.className='ex';bn.textContent='Example data — not real visitors';$('#app').insertBefore(bn,$('#app').children[1])}
  var re=$('#re'),running=false;
  async function run(){if(running)return;running=true;if(re)re.classList.add('spin');try{await load()}catch(e){var s=$('#sub');if(s)s.textContent='Could not load: '+e.message}if(re)re.classList.remove('spin');running=false}
  function showApp(){$('#login').hidden=true;$('#app').hidden=false;themeButtons();run()}
  function showLogin(msg){$('#app').hidden=true;$('#login').hidden=false;var e=$('#login-err');e.hidden=!msg;e.textContent=msg||''}
  window.AX.relogin=function(){showLogin('Your admin sign-in ran out. Please sign in again.')};
  $('#login-form').addEventListener('submit',async function(ev){ev.preventDefault();var pw=$('#pw').value;
    var r=await api('/api/admin/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
    if(r.ok){$('#pw').value='';showApp()}else showLogin(r.data.error==='wrong password'?'That password is not right.':(r.data.error||'Could not sign in.'))});
  var out=$('#out');if(out)out.onclick=async function(){await api('/api/admin/session',{method:'DELETE'});showLogin()};
  if(re)re.onclick=run;
  if(EX){var sc=document.createElement('script');sc.src='/admin-x/ax-example.js';sc.onload=showApp;document.head.appendChild(sc);return}
  api('/api/admin/session').then(function(r){if(r.ok&&r.data.ok)showApp();else showLogin(r.status===503?'The admin password has not been set yet.':'')}).catch(function(){showLogin('Could not reach the server.')});
}
async function get(path){var r=await api(path);if(r.status===401){window.AX.relogin();throw new Error('please sign in again')}if(!r.ok)throw new Error(r.data.error||('HTTP '+r.status));return r.data}
window.AX={get:get,$:$,esc:esc,n:n,sast:sast,dur:dur,api:api,rows:rows,table:table,COLS:COLS,bars:bars,count:count,chart:chart,set:set,start:start,example:EX};
})();
