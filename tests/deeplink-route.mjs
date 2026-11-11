// Contract for parseStart / pathFor in site/index.html (wm-merge-js).
const SEC={aero:1,ato:1,dfe:1,map:1,chart:1,calculator:1,pilot:1,library:1,logbook:1,brief:1,status:1,fact:1,ad:{t:'FACT'}};
function pathFor(k, adT){if(k==='ad')return '/ad/'+adT;if(k==='aero')return '/';if(k==='ato')return '/ato';if(k==='dfe')return '/dfe';if(k==='map')return '/app?tab=map';if(k==='chart')return '/app?tab=chart';if(k==='calculator')return '/calculator';if(k==='pilot')return '/pilot';if(k==='library')return '/library';if(k==='logbook')return '/logbook';if(k==='brief')return '/brief';if(k==='status')return '/status_demo.html';if(k==='fact')return '/ad/FACT';return '/#'+k}
function parseStart(location){
  var h=location.hash.replace(/^#/,''),path=(location.pathname||'/').replace(/\/+$/,'')||'/',q=new URLSearchParams(location.search).get('tab'),m=path.match(/^\/ad\/([A-Za-z0-9-]+)(?:\.html)?$/i);
  if(m)return{ad:m[1]};
  if(/^ad\//i.test(h))return{ad:h.slice(3)};
  var file=(path.split('/').pop()||'').toLowerCase(),pretty={'ato':'ato','ato.html':'ato','dfe':'dfe','dfe.html':'dfe','calculator':'calculator','calculator.html':'calculator','pilot':'pilot','pilot.html':'pilot','library':'library','library.html':'library','logbook':'logbook','logbook.html':'logbook','brief':'brief','brief.html':'brief','status':'status','status.html':'status','status_demo.html':'status','fact':'fact','fact.html':'fact'};
  var k=pretty[file];
  if((file==='app'||file==='app.html')&&q&&SEC[q])k=q;
  if(!k&&h&&SEC[h]&&h!=='ad')k=h;
  if(!k)k=SEC[q]?q:'aero';
  return{k:k};
}
function loc(url){ const u=new URL(url,'https://go-around-aero.pages.dev'); return {pathname:u.pathname,search:u.search,hash:u.hash}; }
const cases = [
  ['/#ad/FAOR', {ad:'FAOR'}],['/ad/FAOR', {ad:'FAOR'}],['/ad/FAOR.html', {ad:'FAOR'}],
  ['/ad/FACT', {ad:'FACT'}],['/#ad/FACT', {ad:'FACT'}],
  ['/ato', {k:'ato'}],['/#ato', {k:'ato'}],['/dfe', {k:'dfe'}],['/#dfe', {k:'dfe'}],
  ['/calculator.html', {k:'calculator'}],['/#calculator', {k:'calculator'}],
  ['/', {k:'aero'}],['/app?tab=ato', {k:'ato'}],['/app?tab=map', {k:'map'}],
];
let fail=0;
for (const [url, exp] of cases) {
  const got = parseStart(loc(url));
  if (JSON.stringify(got)!==JSON.stringify(exp)) { console.error('FAIL', url, got, exp); fail++; }
}
if (pathFor('ad','FAOR')!=='/ad/FAOR' || pathFor('ato')!=='/ato' || pathFor('aero')!=='/') { console.error('pathFor fail'); fail++; }
if (fail) process.exit(1);
console.log('deeplink-route: ok');
