/* Gemini calculator check (30 Oct): METAR wind handling in crosswind + PA/DA worked example. */
const C=require('./assets/calc.js');let pass=0,fail=0;
const ok=(n,g,e,t)=>{if(Math.abs(+g-e)<=(t??0.01)){pass++;console.log('PASS',n,(+g).toFixed(2))}else{fail++;console.log('FAIL',n,g,'exp',e)}};
const eq=(n,g,e)=>{if(g===e){pass++;console.log('PASS',n,g)}else{fail++;console.log('FAIL',n,g,'exp',e)}};
let w=C.parseMetarWind('00000KT');eq('calm parse spd',w.spd,0);let r=C.windOnRunway(30,w);eq('calm status',r.status,'calm');eq('calm xw',r.xwAbs,0);eq('calm hw',r.hw,0);eq('calm tw',r.tw,0);
w=C.parseMetarWind('VRB05KT');eq('VRB dir',w.dir,'VRB');r=C.windOnRunway(30,w,{xw:4});eq('VRB status',r.status,'vrb');ok('VRB xw = full speed',r.xwAbs,5);ok('VRB tw = full speed',r.tw,5);eq('VRB over limit flagged',r.over,true);eq('VRB warning text',/worst case/.test(r.warning),true);
r=C.windOnRunway(30,C.parseMetarWind('VRB08G18KT'));ok('VRB gust xw',r.xwAbs,18);ok('VRB steady xw',r.xwSteady,8);
w=C.parseMetarWind('31510KT','280V350');eq('range vf',w.vf,280);eq('range vt',w.vt,350);r=C.windOnRunway(30,w);
const at=d=>C.components(30,d,10);
for(const d of [280,315,350])eq('range xw >= '+d,r.xwAbs>=Math.abs(at(d).xw)-1e-9,true);
ok('range max xw (300 is inside range, 90 deg)',r.xwAbs,10,1e-9);
ok('range worst tail (280 end)',r.tw,-at(280).hw,1e-9);ok('range worst head comp',r.hw,at(280).hw,1e-9);eq('range flag',r.range,true);
r=C.windOnRunway(30,C.parseMetarWind('27015G25KT'));ok('gust xw uses gust',r.xwAbs,25*Math.sin(120*Math.PI/180),1e-9);ok('steady xw shown',r.xwSteady,15*Math.sin(120*Math.PI/180),1e-9);ok('gust tw uses gust',r.tw,12.5,1e-9);ok('steady tw shown',r.twSteady,7.5,1e-9);
ok('MPS -> kt',C.parseMetarWind('09005MPS').spd,9.72,0.01);eq('bad group',C.parseMetarWind('garbage'),null);
const a=C.atmos(5558,1030,25);ok('Gemini PA rule of thumb',a.pa,5056,1);ok('Gemini DA',a.da,7469,1);
const ps=1030*Math.pow(1-0.0065*5558*0.3048/288.15,5.2559),z=C.densAltStn(ps,25,null);ok('station model PA',z.pa,5119,2);ok('station model DA',z.da,7409,2);
console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
