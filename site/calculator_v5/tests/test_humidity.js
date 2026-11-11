// v5 humidity tests (MT 28 Oct 2026)
const C=require('./assets/calc.js');let p=0,f=0;const ok=(n,c,g)=>{c?p++:f++;console.log(c?'PASS':'FAIL',n,g)};
for(const [e,q,t] of [[5558,1020,25],[0,1013.25,15],[0,1013.25,30],[8000,1000,-5]]){const d=C.atmos(e,q,t);
 ok(`RH 0 == dry exactly (${e},${q},${t})`,C.atmosRH(e,q,t,0).da===d.da,C.atmosRH(e,q,t,0).da);
 ok(`RH blank/NaN == dry exactly (${e})`,C.atmosRH(e,q,t,NaN).da===d.da,'')}
const h=C.atmosRH(0,1013.25,30,100);ok('RH100 30C SL raise in realistic band 300-700 ft',h.hum>300&&h.hum<700,h.hum.toFixed(1)+' ft');
ok('Vapour pressure 30C sat = 42.43 hPa ±0.3 (WMO table 42.47)',Math.abs(h.e-42.47)<0.3,h.e.toFixed(2));
ok('Vapour pressure 20C sat = 23.37 hPa ±0.2',Math.abs(C.vapP(20,100)-23.37)<0.2,C.vapP(20,100).toFixed(2));
// Cross-check: saturated air 30 C, 1013.25 hPa density 1.146 kg/m3 (Engineering ToolBox moist-air table; CIPM-2007 gives 1.1455)
const p0=C.stnP(0),e=C.vapP(30,100),rH=C.rho(p0,303.15,e),rD=C.rho(p0,303.15,0);
ok('Humid density 30C RH100 = 1.146 ±0.002 kg/m3',Math.abs(rH-1.146)<0.002,rH.toFixed(4));
ok('Dry density 30C = 1.1644 ±0.0005 (ideal gas)',Math.abs(rD-1.1644)<5e-4,rD.toFixed(4));
ok('ISA density 1.225 -> DA 0 ft',Math.abs(C.daFromRho(1.225))<1e-9,'');
ok('ICAO density at 5000 ft 1.0556 -> 5000 ±15 ft',Math.abs(C.daFromRho(1.0556)-5000)<15,C.daFromRho(1.0556).toFixed(0));
ok('Monotonic in RH',C.humidDelta(0,30,50)>0&&C.humidDelta(0,30,50)<C.humidDelta(0,30,100),C.humidDelta(0,30,50).toFixed(1));
ok('RH clamps above 100',C.atmosRH(0,1013.25,30,150).da===h.da,'');
console.log(`\n${p} passed, ${f} failed`);process.exit(f?1:0);
