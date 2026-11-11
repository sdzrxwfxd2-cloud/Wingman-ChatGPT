/* Tap-to-cycle units on every calculator (MT 11 Nov 2026): cycle order, second unit, conversion, result unitize. */
const C=require('../assets/calc.js');
let pass=0,fail=0;
const ok=(n,g,e,t)=>{if(isFinite(+g)&&Math.abs(+g-e)<=t){pass++;console.log('PASS',n,g)}else{fail++;console.log('FAIL',n,g,'expected',e)}};
const eq=(n,g,e)=>{const a=JSON.stringify(g),b=JSON.stringify(e);if(a===b){pass++;console.log('PASS',n,a)}else{fail++;console.log('FAIL',n,a,'expected',b)}};

/* cycle order (tap the unit word) */
eq('dist cycle NM→km',C.uNext('dist','nm'),'km');eq('dist cycle km→sm',C.uNext('dist','km'),'sm');eq('dist cycle sm→NM',C.uNext('dist','sm'),'nm');
eq('spd cycle kt→km/h',C.uNext('spd','kt'),'kmh');eq('spd cycle km/h→mph',C.uNext('spd','kmh'),'mph');eq('spd cycle mph→kt',C.uNext('spd','mph'),'kt');
eq('alt cycle ft↔m',[C.uNext('alt','ft'),C.uNext('alt','m')],['m','ft']);
eq('temp cycle °C↔°F',[C.uNext('temp','c'),C.uNext('temp','f')],['f','c']);
eq('press cycle hPa↔inHg',[C.uNext('press','hpa'),C.uNext('press','inhg')],['inhg','hpa']);
eq('mass, vol, arm, vs, grad, len cycle',[C.uNext('mass','lb'),C.uNext('vol','l'),C.uNext('arm','in'),C.uNext('vs','fpm'),C.uNext('grad','ftnm'),C.uNext('len','m')],['kg','usg','cm','ms','pct','ft']);
eq('skip unit (converter never lands on the other side)',C.uNext('dist','nm','km'),'sm');
eq('unknown unit restarts the cycle',C.uNext('dist','zz'),'nm');

/* second, different unit (MT rules) */
eq('NM shows sm',C.uSecond('dist','nm'),'sm');eq('km shows NM',C.uSecond('dist','km'),'nm');eq('sm shows NM',C.uSecond('dist','sm'),'nm');
eq('kt shows mph',C.uSecond('spd','kt'),'mph');eq('km/h shows kt',C.uSecond('spd','kmh'),'kt');eq('mph shows kt',C.uSecond('spd','mph'),'kt');
eq('°C/°F, hPa/inHg, ft/m, kg/lb, L/USG',[C.uSecond('temp','c'),C.uSecond('press','hpa'),C.uSecond('alt','ft'),C.uSecond('mass','kg'),C.uSecond('vol','l')],['f','inhg','m','lb','usg']);

/* conversions (ICAO Annex 5 factors) */
ok('5558 ft = 1694.1 m',C.uConv('alt',5558,'ft','m'),1694.0784,1e-9);
ok('25 °C = 77 °F',C.uConv('temp',25,'c','f'),77,1e-12);ok('77 °F = 25 °C',C.uConv('temp',77,'f','c'),25,1e-12);
ok('ISA dev +10 °C = +18 °F (delta)',C.uConv('temp',10,'c','f',true),18,1e-12);
ok('1013.25 hPa = 29.92 inHg',C.uConv('press',1013.25,'hpa','inhg'),29.9212,1e-4);
ok('100 kt = 185.2 km/h',C.uConv('spd',100,'kt','kmh'),185.2,1e-9);ok('100 kt = 115.08 mph',C.uConv('spd',100,'kt','mph'),115.0779,1e-4);
ok('120 NM = 222.24 km',C.uConv('dist',120,'nm','km'),222.24,1e-9);ok('150 L = 39.63 USG',C.uConv('vol',150,'l','usg'),39.6258,1e-4);
ok('100 lb = 45.36 kg',C.uConv('mass',100,'lb','kg'),45.359237,1e-12);ok('40 in = 101.6 cm',C.uConv('arm',40,'in','cm'),101.6,1e-9);
ok('400 ft/NM = 6.58 %',C.uConv('grad',400,'ftnm','pct'),400/60.761,1e-3);ok('500 ft/min = 2.54 m/s',C.uConv('vs',500,'fpm','ms'),2.54,1e-12);
/* round trip never drifts */
let v=5558;for(let i=0;i<20;i++)v=C.uConv('alt',C.uConv('alt',v,'ft','m'),'m','ft');ok('ft→m→ft ×20',v,5558,1e-9);
eq('input format: 1020 hPa → 30.12 inHg',C.uFmtIn(C.uConv('press',1020,'hpa','inhg'),'inhg'),'30.12');
eq('input format: 150 L → 39.63 USG',C.uFmtIn(C.uConv('vol',150,'l','usg'),'usg'),'39.63');
eq('input format: 24 °C → 75.2 °F',C.uFmtIn(C.uConv('temp',24,'c','f'),'f'),'75.2');

/* result strings */
eq('parse "8 101"',C.uParse('8 101').v,8101);eq('parse "330° / 18" takes the speed',C.uParse('330° / 18').v,18);eq('parse "−1 234"',C.uParse('−1 234').v,-1234);
eq('convert "5 558" ft → m',C.uConvStr('5 558','alt','ft','m'),'1 694');
eq('convert wind "330° / 18" kt → km/h',C.uConvStr('330° / 18','spd','kt','kmh'),'330° / 33');
eq('convert "696.82" hPa → inHg keeps 2 dp',C.uConvStr('696.82','press','hpa','inhg'),'20.58');

/* whole results: big in the chosen unit, second unit underneath, base-unit rows converted */
const da={big:['Density altitude','8 900','ft'],rows:[['Pressure altitude','5 000 ft'],['ISA deviation','+10.0 °C'],['Above field','+500 ft'],['RH','45 %']]};
const u1=C.unitize(da,{r:['alt','ft']},{alt:'ft',temp:'c'},{alt:'ft',temp:'c'});
eq('default ft: big unchanged',u1.big,['Density altitude','8 900','ft']);eq('default ft: second line metres',u1.rows[0],['Metres','2 713 m']);
const u2=C.unitize(da,{r:['alt','ft']},{alt:'ft',temp:'c'},{alt:'m',temp:'f'});
eq('tap → m: big in m',u2.big,['Density altitude','2 713','m']);eq('tap → m: second line feet',u2.rows[0],['Feet','8 900 ft']);
eq('rows follow the tap (alt, temperature difference)',u2.rows.slice(1).map(r=>r[1]),['1 524 m','+18.0 °F','+152 m','45 %']);
const tsdLike=C.unitize({big:['Distance','120','NM'],rows:[]},{r:['dist','nm']},{dist:'nm'},{dist:'nm'});eq('distance NM shows sm under',tsdLike.rows[0],['Statute miles','138 sm']);
const gs=C.unitize({big:['Ground speed','104','kt'],rows:[]},{r:['spd','kt']},{spd:'kt'},{spd:'kt'});eq('speed kt shows mph under',gs.rows[0],['Miles per hour','120 mph']);
const tod=C.unitize({big:['Start descent','9.4','NM out'],rows:[['Rule','9.0 NM'],['ROD','637 ft/min']]},{r:['dist','nm']},{dist:'nm'},{dist:'km'});
eq('suffix kept (NM out → km out)',tod.big,['Start descent','17.4','km out']);eq('ft/min row untouched',tod.rows[2],['ROD','637 ft/min']);
const calm=C.unitize({big:['Wind','Calm',''],rows:[['Crosswind','0 kt']]},{r:['spd','kt']},{spd:'kt'},{spd:'kmh'});eq('no number: no second line',calm.rows.length,1);eq('calm row still converts',calm.rows[0][1],'0 km/h');
eq('error passes through',C.unitize({err:'x'},{r:['alt','ft']},{alt:'ft'},{alt:'m'}),{err:'x'});

/* unit converter: second line is the next unit in the tap cycle after To, never From */
eq('ft → m shows NM',C.convSecond('alt','ft','m'),'nm');eq('NM → km shows sm',C.convSecond('dist','nm','km'),'sm');
eq('°C → °F shows K',C.convSecond('temp','c','f'),'k');eq('kt → km/h shows mph',C.convSecond('spd','kt','kmh'),'mph');
eq('every converter unit has a name',Object.values(C.conversionGroups).every(g=>g.units.every(u=>C.unitNames[u[0]])),true);

console.log(fail?'FAILED':'ALL PASSED',pass,'passed',fail,'failed');process.exit(fail?1:0);
