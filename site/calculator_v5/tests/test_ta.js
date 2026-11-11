// Transition altitude lookup tests (AIP ENR 1.7 para 3, 15 OCT 2026)
global.window=global;const vm=require('vm'),fs=require('fs');
['assets/aerodromes.js','assets/ta.js'].forEach(f=>vm.runInThisContext(fs.readFileSync(f,'utf8')));
const C=require('./assets/calc.js');let pass=0,fail=0;const ok=(n,c)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n)};
const ad=i=>AD.find(a=>a[0]===i),L=(i)=>{const a=ad(i);return C.taLookup(i,a?a[4]:NaN,a?a[5]:NaN,a?a[6]:NaN,AD,TA)};
const row=i=>TA.find(t=>t[0]===i);
ok('51 listed rows loaded',TA.length===51);
ok('every listed ICAO resolves in aerodromes.js',TA.every(t=>ad(t[0])));
ok('no "?" ICAOs remain',TA.every(t=>/^FA[A-Z]{2}$/.test(t[0])));
const f=L('FAOR');ok('FAOR listed exact',f.kind==='listed'&&f.ta===row('FAOR')[2]);
ok('lowercase/space ICAO matches',C.taLookup(' faor ',0,0,0,AD,TA).kind==='listed');
ok('corrected FAKZ Kleinsee 4500',L('FAKZ').ta===4500);ok('FAKS (Kroonstad) not mapped to Kleinsee',!row('FAKS')||row('FAKS')[1]!=='KLEINSEE');
ok('FALL Lydenburg 7500',L('FALL').ta===7500);ok('FAMH Messina 7000',L('FAMH').ta===7000);ok('FAHE 8000',L('FAHE').ta===8000);ok('FATT 8000',L('FATT').ta===8000);
// find unlisted aerodromes near / far
const near=[],far=[];for(const a of AD){if(row(a[0]))continue;let m=1e9,v;for(const t of TA){const b=ad(t[0]);const d=C.gc(a[4],a[5],b[4],b[5]);if(d<m){m=d;v=t}}(m<=25?near:far).push([a,m,v])}
const [na,nd,nv]=near[0];const rn=L(na[0]);ok(`near: ${na[0]} ${nd.toFixed(1)} NM -> ${nv[0]} TA ${nv[2]}`,rn.kind==='near'&&rn.via===nv[0]&&rn.ta===nv[2]);
ok('near picks nearest listed',near.slice(0,40).every(([a,d,v])=>L(a[0]).via===v[0]));
const [fa]=far[0];const rf=L(fa[0]);ok(`beyond 25 NM: ${fa[0]} -> default VMC elev+2000`,rf.kind==='default'&&rf.vmc===fa[6]+2000);
ok('unknown ICAO without coords -> default',C.taLookup('ZZZZ',NaN,NaN,1000,AD,TA).kind==='default');
ok('25.0 NM boundary inclusive', (()=>{const b=ad('FAOR');const lat=b[4]+25/60*0.9999;return C.taLookup('X',lat,b[5],0,AD,TA).kind!=='default'})());
console.log(`TA ${pass}/${pass+fail}`);fs.writeFileSync('test_ta_results.json',JSON.stringify({pass,fail}));process.exit(fail?1:0);
