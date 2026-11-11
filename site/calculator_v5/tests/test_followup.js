/* Claude follow-up (30 Oct) test vectors, verbatim: A2 perfSSL, A3 wind, A4 hold. */
const C=require('./assets/calc.js');let pass=0,fail=0;
const ok=(name,got,exp,tol)=>{const g=+got;if(Math.abs(g-exp)<=tol){pass++;console.log('PASS',name,g.toFixed(3),'≈',exp)}else{fail++;console.log('FAIL',name,g,'expected',exp)}};
const eq=(n,g,e)=>{if(g===e){pass++;console.log('PASS',n,g)}else{fail++;console.log('FAIL',n,g,'exp',e)}};
const base={base:1000,avail:3000,pa:4000,oat:15,slope:0,tw:0,v:55,wpct:0,surface:'tar'};
let r=C.takeoff({...base,mode:'isa',surface:'dry_grass'});
ok('TO isa PA4000 grass',r.dist,1813.056,0.01);ok('TO isa req',r.req,2411.364,0.01);eq('TO isa flag',r.flag,'OK');
r=C.takeoff({...base,mode:'chart'});ok('TO chart dist',r.dist,1000,1e-9);ok('TO chart req',r.req,1330,1e-9);
r=C.takeoff({base:400,avail:1000,pa:5400,oat:28,mode:'isa',surface:'tar',slope:0,tw:0,v:55,wpct:0});
ok('TO isa UI defaults dist',r.dist,761.943,0.01);ok('TO isa UI req',r.req,1013.384,0.01);eq('TO isa UI flag',r.flag,'EXCEEDS');
r=C.takeoff({base:500,avail:1200,mode:'chart',pa:0,oat:15,surface:'wet_grass',slope:2,wpct:10,tw:0,v:55});
ok('TO wet grass+slope+wt',r.dist,858,1e-6);ok('TO wet req',r.req,1141.14,0.01);eq('TO wet flag',r.flag,'OK');
r=C.takeoff({base:600,avail:1000,mode:'chart',pa:0,oat:15,surface:'tar',slope:0,wpct:0,tw:5.5,v:55});
ok('TO tailwind 10% of V',r.dist,720,1e-6);ok('TO tw req',r.req,957.6,0.01);
r=C.takeoff({...base,mode:'chart',slope:-2});ok('TO downslope no credit',r.dist,1000,1e-9);
r=C.takeoff({base:1000,avail:3000,mode:'isa',pa:0,oat:5,surface:'tar',slope:0,tw:0,v:55,wpct:0});ok('TO cold: no credit',r.dist,1000,1e-9);
r=C.landing({base:450,avail:900,mode:'chart',pa:0,oat:15,surface:'wet_grass',slope:0,tw:0,v:60,wpct:0});
ok('LD wet grass dist',r.dist,607.5,1e-6);ok('LD wet grass req',r.req,868.725,0.01);eq('LD flag',r.flag,'OK');
r=C.landing({base:500,avail:1000,mode:'chart',pa:0,oat:15,surface:'tar',wet:true,slope:-4,tw:0,v:60,wpct:0});
ok('LD down4 + wet paved dist',r.dist,690,1e-6);ok('LD req',r.req,986.7,0.01);
r=C.landing({base:450,avail:900,mode:'isa',pa:5400,oat:28,surface:'tar',slope:0,tw:0,v:60,wpct:0});
ok('LD isa dist',r.dist,639.2,0.01);ok('LD isa req',r.req,914.056,0.01);eq('LD isa flag',r.flag,'EXCEEDS');
[{base:0},{base:NaN},{avail:0},{surface:'ice'},{mode:undefined},{tw:5,v:0},{pa:NaN,mode:'isa'}].forEach((o,i)=>{
  eq('perf error '+i,C.takeoff({...base,mode:'chart',...o}).flag,'ERROR')});
let W=C.windOnRunway(360,{dir:0,spd:0});eq('wind calm',W.status,'calm');
W=C.windOnRunway(360,{dir:'VRB',spd:5});eq('wind vrb',W.status,'vrb');ok('vrb xw',W.xwAbs,5,1e-9);
W=C.windOnRunway(360,{dir:90,spd:20});ok('xw steady',W.xwAbs,20,1e-9);ok('xw sign from right',W.xw,20,1e-6);
W=C.windOnRunway(360,{dir:90,spd:15,gust:25});ok('xw uses gust',W.xwAbs,25,1e-9);
W=C.windOnRunway(360,{dir:360,spd:15,gust:25});ok('hw steady',W.hw,15,1e-9);ok('tw none',W.tw,0,1e-9);
W=C.windOnRunway(360,{dir:90,spd:20,gust:15});ok('gust<steady ignored',W.xwAbs,20,1e-9);
W=C.windOnRunway(360,{dir:315,spd:10,vf:280,vt:350});ok('V range xw',W.xwAbs,9.848,0.01);ok('V range min hw',W.hw,1.736,0.01);
W=C.windOnRunway(180,{dir:5,spd:10,vf:350,vt:20});ok('V across 360: tw',W.tw,10,0.01);ok('V across 360: xw',W.xwAbs,3.42,0.01);
[[{dir:400,spd:10}],[{spd:10}],[{dir:0,spd:10}],[{dir:90,spd:NaN}]].forEach(([x],i)=>eq('wind invalid '+i,C.windOnRunway(360,x).status,'invalid'));
const HE=(h,i,tn)=>C.holdEntry(h,i,tn);
[[360,360,'R','Direct'],[110,360,'R','Direct'],[135,360,'R','Teardrop'],[180,360,'R','Parallel'],[225,360,'R','Parallel'],
 [289,360,'R','Parallel'],[290,360,'R','Direct'],[270,90,'R','Parallel'],
 [250,360,'L','Direct'],[225,360,'L','Teardrop'],[135,360,'L','Parallel']].forEach(([h,i,tn,e],k)=>eq('hold '+k,HE(h,i,tn).entry,e));
eq('hold flex 114',HE(114,360,'R').flex,true);eq('hold flex 120',HE(120,360,'R').flex,false);
eq('fuel burn 0 error',C.fuel(100,0,45,5,60).flag,'ERROR');eq('wb weight 0 error',C.wb([{w:0,arm:40}]).flag,'ERROR');
console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
