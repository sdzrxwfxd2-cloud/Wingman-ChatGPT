const C=require('./assets/calc.js');let pass=0,fail=0;
const ok=(name,got,exp,tol)=>{const g=+got;if(Math.abs(g-exp)<=tol){pass++;console.log('PASS',name,g.toFixed(3),'≈',exp)}else{fail++;console.log('FAIL',name,g,'expected',exp)}};
// FAOR elev 5558, QNH 1020, OAT 25
let a=C.atmos(5558,1020,25);ok('PA FAOR',a.pa,5355.5,0.1);ok('ISA',a.isa,4.289,0.01);ok('DA',a.da,7840.7,0.5);
ok('PA std',C.pressureAlt(0,1013.25),0,1e-9);ok('DA ISA sea level',C.densityAlt(0,15),0,1e-9);
// true alt: 10000 ind, stn 0, ISA-10 → ~ -400 ft
let t=C.trueAlt(10000,0,1013.25,-15);ok('True alt ISA-10',t.ta,9600,1);
// wind triangle: TC 360 TAS 100, wind 090/20 → WCA +11.54, GS 97.98
let w=C.windTriangle(360,100,90,20);ok('WCA',w.wca,11.537,0.01);ok('HDG',w.hdg,11.537,0.01);ok('GS',w.gs,97.98,0.01);
w=C.windTriangle(90,120,270,20);ok('GS tailwind',w.gs,140,1e-6);
let c=C.components(10,40,20);ok('HW 30°',c.hw,17.32,0.01);ok('XW 30°',c.xw,10,0.01);
// TAS: CAS 100 @ 10000 ft ISA → ~116.0 (E6B)
ok('TAS 10000 ISA',C.tas(100,10000,-5).tas,116.1,0.6);
ok('Speed of sound 15C',C.sound(15),661.5,0.2);ok('Mach',C.mach(480,-56.5).m,0.8366,0.002);
ok('TSD time',C.tsd.time(120,100),72,1e-9);ok('TSD dist',C.tsd.dist(110,30),55,1e-9);
let f=C.fuel(150,30,45,5,120);ok('Fuel req',f.req,87.5,1e-9);ok('Endurance',f.endur,300,1e-9);
ok('Cloud base',C.cloudBase(20,10,0).agl,4000,1e-9);ok('Freezing lvl',C.freezingLevel(14,5558).amsl,12558,1e-9);
let td=C.tod(9500,5500,120);ok('TOD dist 3°',td.dist,12.56,0.05);ok('ROD 3°',td.rod,636.9,1);ok('ROD rule',td.ruleRod,600,0);
const H=(h,i,tn)=>C.holdEntry(h,i,tn).entry;
/* A1: Claude v3 test vectors (inbound, turn, heading -> entry). Replaces the old vectors, which encoded the swapped sectors. */
[[360,'R',0,'Direct'],[360,'R',110,'Direct'],[360,'R',135,'Teardrop'],[360,'R',180,'Parallel'],[360,'R',225,'Parallel'],[360,'R',290,'Direct'],
 [90,'R',270,'Parallel'],[360,'L',250,'Direct'],[360,'L',225,'Teardrop'],[360,'L',135,'Parallel']]
 .forEach(([inb,tn,h,e],i)=>{const g=H(h,inb,tn);if(e===g){pass++;console.log('PASS hold',i,inb,tn,h,g)}else{fail++;console.log('FAIL hold',i,inb,tn,h,g,'exp',e)}});
{const r=C.holdEntry(112,360,'R');console.log(r.flex&&r.note?(pass++,'PASS hold flex note near 110'):(fail++,'FAIL hold flex'))}
let wb=C.wb([{w:1663,arm:39},{w:340,arm:37},{w:170,arm:73},{w:240,arm:48}]);ok('W&B CG (101367/2413)',wb.cg,42.009,0.01);
const env=[[35,1500],[35,1950],[38.5,2550],[47.3,2550],[47.3,1500]];console.log(C.inPoly(41.3,2413,env)?(pass++,'PASS inside env'):(fail++,'FAIL env'));
let to=C.takeoff({base:1000,avail:3000,mode:'isa',pa:4000,oat:7.08,slope:0,tw:0,v:55,surface:'dry_grass'});ok('TO dist PA4000 ISA grass',to.dist,1680,1e-6);ok('TO req ×1.33',to.req,2234.4,0.1);console.log(to.flag==='OK'?(pass++,'PASS flag'):(fail++,'FAIL flag'));
// sun: reference api.sunrise-sunset.org FACT 2026-10-28: rise 03:48:43Z set 17:10:01Z civil 03:22:32Z / 17:36:12Z
let s=C.sun(new Date(Date.UTC(2026,9,28)),-33.974,18.604);const hm=d=>d.getUTCHours()+d.getUTCMinutes()/60;
const m=1/60;ok('Sunrise',hm(s.sunrise),3+48.7/60,2*m);ok('Sunset',hm(s.sunset),17+10/60,2*m);ok('Civil dawn',hm(s.civilDawn),3+22.5/60,2*m);ok('Civil dusk',hm(s.civilDusk),17+36.2/60,2*m);
/* A5: a tailwind end must not be recommended over an in-limit headwind/calm end */
{const r=C.runwayWinds([{id:'01',hdg:10},{id:'19',hdg:190},{id:'09',hdg:90},{id:'27',hdg:270}],100,4,15);console.log(r[0].id==='09'&&!r[0].tail&&r[r.length-1].tail?(pass++,'PASS rwy tail last'):(fail++,'FAIL rwy tail',r.map(x=>x.id)))}
{const r=C.runwayWinds([{id:'01',hdg:10},{id:'19',hdg:190}],95,10,15);console.log(!r[0].tail?(pass++,'PASS rwy calm-ish no tail first'):(fail++,'FAIL rwy calm'))}
/* A5: hours/minutes rounding */
[[119.6,2,0],[59.5,1,0],[60,1,0],[125.4,2,5]].forEach(([t,h,m])=>{const r=C.hm(t);console.log(r.h===h&&r.m===m?(pass++,'PASS hm '+t):(fail++,'FAIL hm '+t,r))});
/* A3: null-safe altimeter */
[[null,null],[undefined,null],[0,null],[NaN,null],['abc',null],[29.92,1013.2],[1013,1013],[2992,null],[500,null]].forEach(([a,e])=>{const g=C.qnhFromAltim(a);const okk=e===null?g===null:Math.abs(g-e)<0.1;console.log(okk?(pass++,'PASS altim '+a):(fail++,'FAIL altim '+a,g))});
/* A3: station-pressure PA/DA (FAOR ~5558 ft, std day station pressure ~ 829.6 hPa -> PA ≈ 5558, DA ≈ PA at ISA temp) */
{const P=1013.25*Math.pow(1-6.8755856e-6*5558,5.2558797),z=C.densAltStn(P,15-2*5.558);ok('stn PA (two ISA fits differ ~2 ft)',z.pa,5558,5);ok('stn DA at ISA',z.da,5558,25)}
console.log(C.densAltStn(300,15)===null&&C.densAltStn(NaN,15)===null?(pass++,'PASS stn invalid'):(fail++,'FAIL stn invalid'));
ok('computed QNH from stn (FAOR std)',C.qnhFromStn(1013.25*Math.pow(1-0.0065*5558*0.3048/288.15,5.2559),5558),1013,0);
let rw=C.runwayWinds([{id:'01',hdg:10},{id:'19',hdg:190}],350,15,15);console.log(rw[0].id==='01'?(pass++,'PASS best rwy'):(fail++,'FAIL best rwy'));
console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
