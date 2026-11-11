/* Part 2 hand-worked checks (node tests/test_part2.js). Each expected value was worked by hand from the cited formula. */
'use strict';
const C=require('../assets/calc.js');let fail=0;
const near=(name,got,want,tol)=>{const ok=Math.abs(got-want)<=tol;if(!ok)fail++;console.log((ok?'ok   ':'FAIL ')+name+' got '+got+' want '+want)};
/* Rate of turn, FAA-H-8083-15B: tanφ = ωV/g. TAS 100 kt = 51.4444 m/s; rate-1 (3°/s = 0.05236 rad/s) → tanφ = 0.05236·51.4444/9.80665 = 0.27467 → φ = 15.36° */
let t=C.turn(100,15.36);
near('turn rate 100kt/15.36°',t.rate,3.00,0.01);
near('turn radius m',t.radiusM,982,2);           // R = V²/(g tanφ) = 2646.53/(9.80665·0.27467) = 982.6 m
near('turn radius NM',t.radiusNm,0.53,0.005);   // 982.6 / 1852
near('rate-1 bank',t.rate1Bank,15.36,0.02);
near('360° time s',t.t360,120,0.5);
near('rule of thumb TAS/10+7',t.rule,17,0.01);
t=C.turn(120,30);                                // V = 61.733 m/s; ω = g·tan30/V = 9.80665·0.57735/61.733 = 0.09171 rad/s = 5.25°/s
near('turn rate 120kt/30°',t.rate,5.25,0.01);
near('turn radius 120kt/30° m',t.radiusM,673,2); // 61.733²/(9.80665·0.57735) = 673.1 m
/* Glide, FAA-H-8083-3C ch.18: 3000 ft × 9 = 27000 ft = 4.44 NM; GS 60 / TAS 70 → 3.81 NM; ROD = 70·6076.12/60/9 = 787.6 ft/min */
const g=C.glide(3000,9,70,10);
near('glide still NM',g.still,4.44,0.01);near('glide ground NM',g.nm,3.81,0.01);near('glide ROD',g.rod,787.6,0.5);near('glide minutes',g.min,3.81,0.01);
near('glide invalid',C.glide(3000,9,70,80).error?1:0,1,0);
near('turn invalid bank',C.turn(100,90).error?1:0,1,0);
console.log(fail?fail+' FAILED':'all Part 2 checks passed');process.exit(fail?1:0);
