/* Time · speed · distance: any-two solve, unit convert, time parse. */
const C=require('../assets/calc.js');
let pass=0,fail=0;
const ok=(name,got,exp,tol)=>{
  const g=+got;
  if(isFinite(g)&&isFinite(+exp)&&Math.abs(g-exp)<=tol){pass++;console.log('PASS',name,g,'≈',exp)}
  else{fail++;console.log('FAIL',name,got,'expected',exp)}
};
const eq=(name,got,exp)=>{
  if(got===exp){pass++;console.log('PASS',name,got)}
  else{fail++;console.log('FAIL',name,got,'expected',exp)}
};
const okErr=(name,r,sub)=>{
  const msg=r&&r.error;
  if(msg&&(!sub||String(msg).includes(sub))){pass++;console.log('PASS',name,msg)}
  else{fail++;console.log('FAIL',name,r,'expected error',sub)}
};

/* --- core any-two (NM, kt, minutes) --- */
ok('120 kt for 1:30 = 180 nm',C.tsd.dist(120,90),180,1e-9);
ok('180 nm at 120 kt = 1:30 (90 min)',C.tsd.time(180,120),90,1e-9);
ok('180 nm in 90 min = 120 kt',C.tsd.speed(180,90),120,1e-9);
ok('120 nm @ 100 kt = 72 min (legacy)',C.tsd.time(120,100),72,1e-9);

const t1=C.tsdSolve(180,120,null,'t');ok('tsdSolve time 180 NM / 120 kt',t1.t,90,1e-9);
const d1=C.tsdSolve(null,120,90,'d');ok('tsdSolve dist 120 kt × 90 min',d1.d,180,1e-9);
const s1=C.tsdSolve(180,null,90,'s');ok('tsdSolve speed 180 NM / 90 min',s1.s,120,1e-9);

/* --- unit conversions --- */
ok('100 km = 54.0 nm',C.distToNm(100,'km'),100/1.852,1e-12);
ok('100 km rounded 1 dp = 54.0',Math.round(C.distToNm(100,'km')*10)/10,54.0,1e-9);
ok('100 mph = 86.9 kt',C.spdToKt(100,'mph'),100*1.609344/1.852,1e-12);
ok('100 mph rounded 1 dp = 86.9',Math.round(C.spdToKt(100,'mph')*10)/10,86.9,1e-9);
ok('1 nm = 1.852 km',C.nmToDist(1,'km'),1.852,1e-12);
ok('1 nm in sm',C.nmToDist(1,'sm'),1.852/1.609344,1e-12);
ok('1 kt = 1.852 km/h',C.ktToSpd(1,'kmh'),1.852,1e-12);
ok('convert 100 km -> nm -> km',C.convertDist(100,'km','km'),100,1e-12);
ok('convert 120 nm -> km',C.convertDist(120,'nm','km'),120*1.852,1e-12);
ok('convert 100 kt -> mph -> kt',C.convertSpd(C.convertSpd(100,'kt','mph'),'mph','kt'),100,1e-12);
ok('convert 100 mph -> kt',C.convertSpd(100,'mph','kt'),100*1.609344/1.852,1e-12);

/* 100 km at 120 kt → time still uses NM */
ok('100 km at 120 kt (minutes)',C.tsd.time(C.distToNm(100,'km'),120),(100/1.852)/120*60,1e-9);
/* 180 nm in 90 min, speed in mph */
ok('180 nm in 90 min as mph',C.ktToSpd(C.tsd.speed(180,90),'mph'),120*1.852/1.609344,1e-9);

/* --- time parsing --- */
ok('parse 1:30',C.parseTime('1:30','min').min,90,1e-9);
ok('parse 90 minutes unit',C.parseTime('90','min').min,90,1e-9);
ok('parse 1.5h',C.parseTime('1.5h','min').min,90,1e-9);
ok('parse 1.5 hr',C.parseTime('1.5 hr','hmm').min,90,1e-9);
ok('parse 90m',C.parseTime('90m','hmm').min,90,1e-9);
ok('parse 90 min',C.parseTime('90 min','min').min,90,1e-9);
ok('parse 1h30',C.parseTime('1h30','min').min,90,1e-9);
ok('parse 1h 30m',C.parseTime('1h 30m','min').min,90,1e-9);
ok('parse 1.5 in h:mm',C.parseTime('1.5','hmm').min,90,1e-9);
ok('parse 2 in h:mm = 2:00',C.parseTime('2','hmm').min,120,1e-9);
ok('parse 90 in h:mm = 90 min',C.parseTime('90','hmm').min,90,1e-9);
ok('parse 1:30:00',C.parseTime('1:30:00','min').min,90,1e-9);
ok('parse 0:45',C.parseTime('0:45','hmm').min,45,1e-9);

eq('format 90 min as h:mm',C.formatTime(90,'hmm'),'1:30');
eq('format 72 min as h:mm',C.formatTime(72,'hmm'),'1:12');
eq('format 90 as min',C.formatTime(90,'min'),'90');
eq('format 72.0 as min',C.formatTime(72,'min'),'72');
eq('format 1:07',C.formatTime(67,'hmm'),'1:07');

/* --- errors: no NaN / Infinity --- */
okErr('speed 0 when solving time',C.tsdSolve(120,0,null,'t'),'Speed');
okErr('time 0 when solving speed',C.tsdSolve(180,null,0,'s'),'Time');
okErr('distance 0 when solving time',C.tsdSolve(0,100,null,'t'),'Distance');
okErr('negative speed',C.tsdSolve(120,-10,null,'t'),'Speed');
const inf=C.tsd.time(120,0);eq('raw tsd.time(120,0) is Infinity (legacy)',inf,Infinity);
const safe=C.tsdSolve(120,0,null,'t');eq('tsdSolve never returns Infinity',typeof safe.error,'string');
eq('tsdSolve 0 speed has no t',safe.t,undefined);

okErr('parse blank',C.parseTime('','min'),'Enter a time');
okErr('parse garbage',C.parseTime('abc','min'),'Enter a time');
okErr('parse negative',C.parseTime('-5','min'),'more than 0');
okErr('parse 0',C.parseTime('0','min'),'more than 0');
okErr('parse 1:75',C.parseTime('1:75','min'),'Enter a time');
okErr('parse 1:30:61',C.parseTime('1:30:61','min'),'Enter a time');

/* converting a unit must not change the physical value */
ok('54 nm -> km -> nm',C.convertDist(C.convertDist(54,'nm','km'),'km','nm'),54,1e-12);
ok('86.9 kt -> mph -> kt',C.convertSpd(C.convertSpd(86.9,'kt','mph'),'mph','kt'),86.9,1e-9);

/* worked examples in mixed units, via tsdSolve */
ok('100 km at 120 kt → minutes',C.tsdSolve(C.distToNm(100,'km'),120,null,'t').t,(100/1.852)/120*60,1e-9);
ok('180 nm in 1:30 → kt',C.tsdSolve(180,null,C.parseTime('1:30','hmm').min,'s').s,120,1e-9);
ok('100 mph for 90 min → nm',C.tsdSolve(null,C.spdToKt(100,'mph'),90,'d').d,C.spdToKt(100,'mph')*1.5,1e-9);


/* --- time steppers: 1 min in h:mm (with carry), 1 in min, no negatives --- */
eq('1:59 up → 2:00',C.stepTime('1:59','hmm',1),'2:00');
eq('2:00 down → 1:59',C.stepTime('2:00','hmm',-1),'1:59');
eq('0:59 up → 1:00',C.stepTime('0:59','hmm',1),'1:00');
eq('1:00 down → 0:59',C.stepTime('1:00','hmm',-1),'0:59');
eq('0:01 down stays non-negative',C.stepTime('0:01','hmm',-1),'0:00');
eq('0:00 down stays 0:00',C.stepTime('0:00','hmm',-1),'0:00');
eq('0:00 up → 0:01',C.stepTime('0:00','hmm',1),'0:01');
eq('empty up starts at 0:01',C.stepTime('','hmm',1),'0:01');
eq('empty down stays 0:00',C.stepTime('','hmm',-1),'0:00');
eq('1:12 up → 1:13',C.stepTime('1:12','hmm',1),'1:13');
eq('90 min up → 91',C.stepTime('90','min',1),'91');
eq('90 min down → 89',C.stepTime('90','min',-1),'89');
eq('1 min down → 0',C.stepTime('1','min',-1),'0');
eq('0 min down stays 0',C.stepTime('0','min',-1),'0');
eq('0 min up → 1',C.stepTime('0','min',1),'1');
eq('h:mm unit alias',C.stepTime('1:59','h:mm',1),'2:00');
eq('minutes unit alias',C.stepTime('10','minutes',1),'11');


/* --- unit cycle: NM→km→sm, kt→km/h→mph, h:mm→min --- */
eq('NM → km',C.nextUnit('du','nm'),'km');
eq('km → sm',C.nextUnit('d','km'),'sm');
eq('sm → NM',C.nextUnit('du','sm'),'nm');
eq('kt → kmh',C.nextUnit('su','kt'),'kmh');
eq('km/h alias → mph',C.nextUnit('s','km/h'),'mph');
eq('mph → kt',C.nextUnit('su','mph'),'kt');
eq('h:mm → min',C.nextUnit('tu','hmm'),'min');
eq('h:mm alias → min',C.nextUnit('t','h:mm'),'min');
eq('min → h:mm',C.nextUnit('tu','min'),'hmm');

/* --- result second line is a different unit --- */
const aNm=C.tsdAlt('d',180,120,90,'nm','kt');
eq('180 NM second is sm',aNm.unit,'sm');
eq('180 NM second label',aNm.label,'Statute miles');
ok('180 NM in sm',aNm.value,180*1.852/1.609344,1e-12);
const aKm=C.tsdAlt('d',C.distToNm(100,'km'),120,null,'km','kt');
eq('km result second is NM',aKm.unit,'NM');
ok('100 km second as NM',aKm.value,100/1.852,1e-12);
const aSm=C.tsdAlt('d',C.distToNm(100,'sm'),120,null,'sm','kt');
eq('sm result second is NM',aSm.unit,'NM');
const aKt=C.tsdAlt('s',180,120,90,'nm','kt');
eq('120 kt second is mph',aKt.unit,'mph');
eq('120 kt second label',aKt.label,'Miles per hour');
ok('120 kt in mph',aKt.value,120*1.852/1.609344,1e-12);
const aKmh=C.tsdAlt('s',180,C.spdToKt(185.2,'kmh'),90,'nm','kmh');
eq('km/h result second is kt',aKmh.unit,'kt');
const aMph=C.tsdAlt('s',180,C.spdToKt(100,'mph'),90,'nm','mph');
eq('mph result second is kt',aMph.unit,'kt');
ok('100 mph second as kt',aMph.value,100*1.609344/1.852,1e-12);
const aT=C.tsdAlt('t',120,100,72,'nm','kt');
eq('time second is min',aT.unit,'min');
eq('time second label',aT.label,'Minutes');
ok('time second 72 min',aT.value,72,1e-12);

console.log(fail?'FAILED':'ALL PASSED',pass+' passed',fail+' failed');
process.exit(fail?1:0);
