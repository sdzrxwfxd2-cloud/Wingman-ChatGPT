/* EXAMPLE DATA for the admin page pictures (localhost + ?example=1 only). Made-up visits, not real people or IPs
   (IPs are from the documentation ranges 192.0.2.x, 198.51.100.x, 203.0.113.x). */
(function(){
var now=Date.now(),seed=7;function rnd(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646}
function pick(a){return a[Math.floor(rnd()*a.length)]}
var PL=[['Cape Town','Western Cape','ZA'],['Johannesburg','Gauteng','ZA'],['Pretoria','Gauteng','ZA'],['Durban','KwaZulu-Natal','ZA'],['George','Western Cape','ZA'],['Windhoek','Khomas','NA'],['London','England','GB']];
var DV=[['mobile','','iOS','18.6','Safari','390x844','390x664',3],['mobile','SM-S918B','Android','15','Chrome','412x915','412x786',2.625],['desktop','','macOS','15.1','Safari','1512x982','1440x860',2],['desktop','','Windows','11','Edge','1920x1080','1903x947',1],['tablet','','iPadOS','18.6','Safari','820x1180','820x1050',2]];
var PG=['/','/index.html','/main.html','/calculator.html','/c/app.html','/library.html','/flight-computer/cx3/','/pilot.html','/status.html'];
var RF=['','','','https://www.google.com/','https://www.facebook.com/','https://web.whatsapp.com/'];
var V=[],s=0;
for(var i=0;i<46;i++){var p=pick(PL),d=pick(DV),sid='ex'+(1000+Math.floor(i/3)).toString(16)+'demo';
  V.push({ts:now-i*41*6e4-Math.floor(rnd()*6e5),sid:sid,n:i%3+1,path:pick(PG),ref:i%3?'':pick(RF),ip:pick(['192.0.2.','198.51.100.','203.0.113.'])+(10+i),
    city:p[0],region:p[1],country:p[2],device_type:d[0],device_model:d[1],os:d[2],os_ver:d[3],browser:d[4],screen:d[5],viewport:d[6],dpr:d[7],lang:pick(['en-ZA','en-GB','af-ZA']),tz:p[2]==='GB'?'Europe/London':'Africa/Johannesburg',net:pick(['4g','wifi',''])})}
function top(list,k){var c={};list.forEach(function(r){if(r[k])c[r[k]]=(c[r[k]]||0)+1});return Object.keys(c).map(function(x){return{name:x,n:c[x]}}).sort(function(a,b){return b.n-a.n}).slice(0,12)}
function win(ms){var L=V.filter(function(r){return r.ts>=now-ms}),u={},days={};L.forEach(function(r){u[r.sid]=1;var d=new Date(r.ts).toISOString().slice(0,10);days[d]=days[d]||{day:d,n:0,s:{}};days[d].n++;days[d].s[r.sid]=1});
  return{visits:L.length,uniques:Object.keys(u).length,days:Object.keys(days).sort().map(function(k){return{day:k,n:days[k].n,u:Object.keys(days[k].s).length}}),pages:top(L,'path'),countries:top(L,'country'),cities:top(L,'city'),devices:top(L,'device_type'),browsers:top(L,'browser'),os:top(L,'os'),referrers:top(L,'ref'),models:top(L,'device_model')}}
var W=win(30*864e5);
// fill a fuller 7-day chart for the picture
W.days=[0,1,2,3,4,5,6].map(function(i){var d=new Date(now-(6-i)*864e5).toISOString().slice(0,10);return{day:d,n:[12,19,8,23,31,17,46][i],u:[5,8,4,9,12,7,15][i]}});
function m(id,ageMin){return{icaoId:id,t:now-ageMin*6e4}}
var ST=['FACT','FAOR','FALA','FAGC','FABB','FAKN','FAPE','FAEL','FABL','FAGG','FAUP','FAPM','FAWB','FAHS','FAKM','FAMM','FAPP','FAUT','FYWH','FYOG'];
function stations(kind){return ST.map(function(id,i){var age=kind==='metar'?(i*7)%55+5:(i*23)%300+30,beh=(id==='FAGG'&&kind==='metar')?30*6e4:0;
  return{id:id,site:now-age*6e4-beh,up:now-age*6e4,raw:kind==='metar'?'METAR '+id+' 110000Z 18008KT CAVOK 17/09 Q1018 NOSIG':'TAF '+id+' 102300Z 1100/1124 16010KT CAVOK'}})}
function wx(kind){var st=stations(kind),behind=st.filter(function(x){return x.site<x.up}).map(function(x){return{id:x.id,site:x.site,up:x.up}});
  return{site:{s:200,ms:84,src:'snapshot',upd:new Date(now-4*6e4).toISOString()},up:{s:200,ms:612,n:st.length+1},match:st.length-behind.length,total:st.length,behind:behind,missing:kind==='taf'?['FAMS']:[],old:[{id:'FAXX',ageMin:kind==='metar'?190:900}],siteN:st.length,upN:st.length+1,stations:st}}
var PAGES=['/','/index.html','/main.html','/status.html','/c/app.html','/fact.html','/calculator.html','/pilot.html','/library.html','/logbook.html','/brief.html','/chart_v2/Wingman_Chart_v2.html','/ops-stamp.json'];
var HEALTH={now:new Date(now).toISOString(),up:true,deploy:{id:'d98b5773example',branch:'main',url:'https://example.go-around-aero.pages.dev'},
  probes:{site:{s:200,ms:96},metar:{s:200,ms:84,src:'snapshot'},taf:{s:200,ms:91,src:'snapshot'},flights:{s:200,ms:402},model:{s:200,ms:188}},
  wx:{metar:wx('metar'),taf:wx('taf')},health:{metar:{t:new Date(now-6*6e4).toISOString(),status:200,error:null,lastOk:new Date(now-6*6e4).toISOString()},taf:{t:new Date(now-6*6e4).toISOString(),status:200,error:null,lastOk:new Date(now-6*6e4).toISOString()}},
  pages:PAGES.map(function(p,i){return{p:p,s:200,ms:60+i*17,kb:[38,38,412,96,220,64,180,52,140,70,48,310,1][i],complete:true,clash:false}}),
  snapshot:{composedAt:new Date(now-6*6e4).toISOString(),nowComposedAt:new Date(now-6*6e4).toISOString()},model:{s:200,ms:188,limited:false,composedAt:new Date(now-6*6e4).toISOString()},
  uptime:{checks:42,ok:42,first:new Date(now-2*864e5).toISOString(),all:310,allOk:308,allFirst:new Date(now-9*864e5).toISOString(),last:new Date(now-9*6e4).toISOString(),downs:[new Date(now-5*864e5).toISOString(),new Date(now-5*864e5+6e5).toISOString()],wxDowns:[],
    recent:Array.from({length:48},function(_,i){return{t:new Date(now-(48-i)*18e5).toISOString(),up:i!==9,ms:80+Math.round(rnd()*120)}})},
  errors:[{t:new Date(now-5*864e5).toISOString(),what:'Site down at a recorded check',detail:'site probe failed'},{t:new Date(now).toISOString(),what:'METAR FAGG',detail:'30 min behind the official report'}],
  notConnected:['Cloudflare Workers logs (in the Cloudflare dashboard, not on this page)','Browser JavaScript errors (no error reporter on the site yet)']};
window.AX_EXAMPLE=function(path){
  if(/^\/api\/admin\/session/.test(path))return{ok:true};
  if(/^\/api\/admin\/visits/.test(path))return{store:'kv',rows:V,totalMatched:V.length};
  if(/^\/api\/admin\/stats/.test(path)){var t=win(864e5),w=win(7*864e5);return Object.assign({now:new Date(now).toISOString(),store:'kv',range:'7d',today:{visits:t.visits,uniques:t.uniques},d7:{visits:w.visits,uniques:w.uniques},d30:{visits:W.visits,uniques:W.uniques}},W)}
  if(/^\/api\/admin\/health/.test(path))return HEALTH;
  if(/^\/ops-stamp\.json/.test(path))return{built:new Date(now-864e5).toISOString(),commit:'d98b577',aipEdition:'15_JUL_2026',sacaaGenerated:'2026-10-13 16:01 UTC',atoCount:296,dfeCount:234};
  return null};
})();
