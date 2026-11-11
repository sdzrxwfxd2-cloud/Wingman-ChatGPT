/* Wingman Calculator — pure math (DEMO). Works in browser (window.WC) and Node (module.exports). */
(function(root){
const R=Math.PI/180, n360=a=>((a%360)+360)%360, n180=a=>{a=n360(a);return a>180?a-360:a;};
const C={};
C.pressureAlt=(elev,qnh)=>elev+(1013.25-qnh)*30;
C.isaTemp=pa=>15-2*pa/1000;
C.densityAlt=(pa,oat)=>pa+120*(oat-C.isaTemp(pa));
C.atmos=(elev,qnh,oat)=>{const pa=C.pressureAlt(elev,qnh),isa=C.isaTemp(pa);return{pa,isa,dev:oat-isa,da:pa+120*(oat-isa)};};
/* True altitude: 4% per 10 °C ISA deviation of the height above the station (ICAO cold-temp rule) */
C.trueAlt=(ind,stnElev,qnh,oat)=>{const pa=C.pressureAlt(ind,qnh),dev=oat-C.isaTemp(pa),corr=4*dev*(ind-stnElev)/1000;return{pa,dev,corr,ta:ind+corr};};
C.windTriangle=(tc,tas,wd,ws)=>{const a=(wd-tc)*R,s=ws*Math.sin(a)/tas;if(Math.abs(s)>1)return null;const wca=Math.asin(s)/R;return{wca,hdg:n360(tc+wca),gs:tas*Math.cos(wca*R)-ws*Math.cos(a)};};
C.components=(rwy,wd,ws)=>{const a=(wd-rwy)*R;return{hw:ws*Math.cos(a),xw:ws*Math.sin(a)};}; /* xw>0 = from right */
C.sigma=da=>Math.pow(1-6.8755856e-6*da,4.2558797);
C.tas=(cas,pa,oat)=>{const da=C.densityAlt(pa,oat),s=C.sigma(da);return{da,sigma:s,tas:cas/Math.sqrt(s)};};
C.sound=oat=>38.967854*Math.sqrt(oat+273.15);
C.mach=(tas,oat)=>{const a=C.sound(oat);return{a,m:tas/a};};
C.tsd={time:(d,s)=>d/s*60, speed:(d,t)=>d/(t/60), dist:(s,t)=>s*t/60};
C.fuel=(fob,burn,reserveMin,taxi,tripMin)=>{if(!(burn>0)||!isFinite(burn))return{error:'Fuel burn must be more than 0',flag:'ERROR'};const res=burn*reserveMin/60,trip=burn*tripMin/60,req=trip+res+taxi;return{res,trip,req,endur:fob/burn*60,usableEndur:Math.max(0,fob-taxi-res)/burn*60,spare:fob-req};};
/* Performance factors: UK CAA Safety Sense Leaflet 09 (supersedes SSL 07) / UK AIC 173/2024 table.
   Factors are multiplied; part steps interpolated linearly as in the SSL worked example (500 ft -> x1.05). */
const lin=(per,step,x)=>1+per*Math.max(0,x)/step;
/* A2 (Claude v3): one function for both chart bases.
   o.mode 'isa'   = sea-level ISA chart: PA factor from 0 ft, temperature factor above ISA at the actual PA.
   o.mode 'chart' = chart already read at the actual PA and OAT: PA and temperature factors are 1.
   Factors are MULTIPLIED (conservative vs adding). Slope kept as "per 2%" (conservative) until the leaflet text is checked.
   Bad input returns {flag:'ERROR', error} and the page must show the error, never OK. Inputs are not mutated. */
C.perfSSL=(o,land)=>{
 const fin=x=>typeof x==='number'&&isFinite(x);
 const bad=m=>({error:m,flag:'ERROR',factors:[],dist:NaN,req:NaN,ratio:NaN});
 const K=land?{w:.10,alt:.05,t:.05,sl:.10,tw:.20,sf:{tar:1,dry_grass:1.15,wet_grass:1.35,soft:1.25},safety:1.43}
             :{w:.20,alt:.10,t:.10,sl:.10,tw:.20,sf:{tar:1,dry_grass:1.20,wet_grass:1.30,soft:1.25},safety:1.33};
 if(!fin(o.base)||o.base<=0)return bad('Chart distance must be a positive number');
 if(!fin(o.avail)||o.avail<=0)return bad('Available distance must be a positive number');
 if(!Object.prototype.hasOwnProperty.call(K.sf,o.surface))return bad('Choose a surface');
 const n=(x,d=0)=>(x==null||x==='')?d:x,wpct=n(o.wpct),slope=n(o.slope),tw=n(o.tw);
 if(![wpct,slope,tw].every(fin))return bad('Check weight, slope and tailwind');
 if(tw>0&&(!fin(o.v)||o.v<=0))return bad('Enter the lift-off/landing speed to apply the tailwind factor');
 let pa,oat,basePA,baseT;
 if(o.mode==='chart'){pa=fin(o.pa)?o.pa:0;oat=fin(o.oat)?o.oat:0;basePA=pa;baseT=oat}
 else if(o.mode==='isa'){if(!fin(o.pa)||!fin(o.oat))return bad('Pressure altitude and OAT are needed');pa=o.pa;oat=o.oat;basePA=0;baseT=15-1.98*pa/1000}
 else return bad('Say what the chart is based on');
 const f=[];
 f.push(['Weight +'+wpct+'% over chart',`+${K.w*100}% per 10%`,lin(K.w,10,wpct)]);
 f.push(['Pressure altitude above chart base',`+${K.alt*100}% per 1000 ft`,lin(K.alt,1000,pa-basePA)]);
 f.push(['Temperature above chart base',`+${K.t*100}% per 10 °C`,lin(K.t,10,oat-baseT)]);
 f.push(['Slope '+slope+'% '+(land?'down':'up'),'+10% per 2%',lin(K.sl,2,land?-slope:slope)]);
 f.push(['Tailwind '+tw+' kt','+20% per 10% of speed',tw>0?lin(K.tw,0.1*o.v,tw):1]);
 f.push(['Surface '+o.surface.replace('_',' '),'',K.sf[o.surface]]);
 if(land&&o.wet&&o.surface==='tar')f.push(['Wet paved','×1.15',1.15]);
 let d=o.base;f.forEach(x=>d*=x[2]);
 const req=d*K.safety,ratio=req/o.avail,over=req>o.avail;
 return{factors:f,dist:d,safety:K.safety,req,ratio,flag:over?'EXCEEDS':'OK',
  msg:over?'Exceeds available distance – estimate only, use your POH':'Within available distance – estimate only'};};
C.takeoff=o=>C.perfSSL(o,false);C.landing=o=>C.perfSSL(o,true);
/* runways: [{id,hdg}] each END; returns sorted best first */
/* A4/A5: ends[].hdg must be TRUE (METAR wind is true too, so no variation is applied here).
   Order: within crosswind limit first, then no-tailwind before tailwind (A5: the old sort could recommend a tailwind end), then most headwind. */
C.runwayWinds=(ends,wd,ws,limit)=>ends.map(e=>{const c=C.components(e.hdg,wd,ws);return Object.assign({},e,c,{over:Math.abs(c.xw)>limit,tail:c.hw<-0.5});})
 .sort((a,b)=>(a.over-b.over)||(a.tail-b.tail)||(b.hw-a.hw));
/* A3 (Claude follow-up): wind on one runway end with gusts, VRB and variable ranges. Conservative:
   crosswind at gust speed, headwind credit at steady speed, tailwind at gust speed, worst case across a V range,
   VRB = full peak as both crosswind and tailwind. Bad input returns status 'invalid' (never a number). */
C.windOnRunway=(rwy,w,lim)=>{
 lim=lim||{};const num=x=>typeof x==='number'&&isFinite(x);
 const bad=n=>({status:'invalid',notes:[n]});
 if(!num(rwy)||rwy<0||rwy>360)return bad('runway heading');
 if(!w||!num(w.spd)||w.spd<0)return bad('wind speed');
 const spd=w.spd,g=(num(w.gust)&&w.gust>spd)?w.gust:null,peak=g||spd;
 if(spd===0&&!g)return{status:'calm',hw:0,xw:0,xwAbs:0,tw:0,over:false};
 if(w.dir==='VRB')return{status:'vrb',hw:null,xw:null,xwAbs:peak,tw:peak,xwSteady:spd,twSteady:spd,gust:g,warning:'VRB wind: direction unknown, worst case assumed (crosswind and tailwind = full '+(g?'gust ':'')+'speed)',over:(lim.xw!=null&&peak>lim.xw)||(lim.tw!=null&&peak>lim.tw),notes:['variable direction: worst case']};
 if(!num(w.dir)||w.dir<1||w.dir>360)return bad('wind direction');
 let angles=[w.dir];
 if(num(w.vf)&&num(w.vt)&&w.vf>=1&&w.vf<=360&&w.vt>=1&&w.vt<=360){const n=((w.vt-w.vf)%360+360)%360;angles=[];for(let k=0;k<=n;k++)angles.push(n360(w.vf+k));}
 let xwAbs=0,hw=Infinity,minHwP=Infinity;
 angles.forEach(d=>{const s=C.components(rwy,d,spd),p=C.components(rwy,d,peak);xwAbs=Math.max(xwAbs,Math.abs(p.xw));hw=Math.min(hw,s.hw);minHwP=Math.min(minHwP,p.hw);});
 const st=C.components(rwy,w.dir,spd),tw=Math.max(0,-minHwP);
 let xwSteady=0,twSteady=0;angles.forEach(d=>{const s=C.components(rwy,d,spd);xwSteady=Math.max(xwSteady,Math.abs(s.xw));twSteady=Math.max(twSteady,-s.hw);});
 return{status:'ok',hw,xw:st.xw,xwAbs,tw,xwSteady,twSteady,gust:g,range:angles.length>1,over:(lim.xw!=null&&xwAbs>lim.xw)||(lim.tw!=null&&tw>lim.tw)};};
/* Gemini check (30 Oct): METAR wind group -> {dir,spd,gust,vf,vt}. Calm 00000KT -> 0/0; VRB kept as 'VRB'; dddVddd range added. KT/MPS/KMH -> kt. */
C.parseMetarWind=(grp,range)=>{const m=/^(\d{3}|VRB)(\d{2,3})(?:G(\d{2,3}))?(KT|MPS|KMH)$/.exec(String(grp||'').trim().toUpperCase());if(!m)return null;
 const f=m[4]==='MPS'?1.943844:m[4]==='KMH'?0.539957:1,w={dir:m[1]==='VRB'?'VRB':+m[1],spd:+m[2]*f,gust:m[3]?+m[3]*f:null};
 if(w.dir===0)w.dir=360;const r=/^(\d{3})V(\d{3})$/.exec(String(range||'').trim());if(r){w.vf=+r[1];w.vt=+r[2];}return w;};
C.cloudBase=(t,td,elev)=>{const agl=(t-td)/2.5*1000;return{agl,amsl:agl+(elev||0)};};
C.freezingLevel=(t,elev)=>({amsl:(elev||0)+t/2*1000});
C.wb=items=>{let w=0,m=0;items.forEach(i=>{w+=i.w;m+=i.w*i.arm;});if(!(w>0))return{w,m,cg:NaN,error:'Total weight must be more than 0',flag:'ERROR'};return{w,m,cg:m/w};};
C.inPoly=(x,y,p)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const[xi,yi]=p[i],[xj,yj]=p[j];if(((yi>y)!=(yj>y))&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c;}return c;};
C.tod=(cruise,target,gs,angle)=>{angle=angle||3;const dh=cruise-target,tanA=Math.tan(angle*R),dist=dh/(6076.12*tanA),rod=gs*101.269*tanA;return{dh,dist,rule:dh/1000*3,rod,ruleRod:gs*5,time:dist/gs*60};};
/* A1 holding entry (Claude v3 review, geometry check of ICAO Doc 8168 sectors 180/70/110).
   t = heading-to-fix − inbound track, mirrored for left-hand holds.
   Right-hand: Direct t<=110 or t>=290 · Teardrop 110<t<180 · Parallel 180<=t<290.
   Boundary convention (ours, not ICAO's): 110 and 290 -> Direct, 180 -> Parallel; within ±5° of a boundary we say either entry is fine.
   The old code had a 220° Direct sector (<=110 || >=250) and swapped Teardrop/Parallel. */
C.holdEntry=(hdgToFix,inbound,turn)=>{
 let t=n360(Math.round(hdgToFix*10)/10-inbound);
 if(turn==='L')t=n360(360-t);
 const entry=(t<=110||t>=290)?'Direct':t<180?'Teardrop':'Parallel';
 const flex=[110,180,290].some(b=>Math.abs(t-b)<=5);
 return{rel:t,entry,flex,note:flex?'Within 5° of a sector boundary: either adjacent entry is acceptable (Doc 8168 allows ±5°). Use the one that suits your turn.':''};};
/* NOAA solar position; returns UTC Date objects */
C.sun=(date,lat,lon)=>{const d0=Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate());
 const calc=(alt)=>{const out=[];for(const rise of[true,false]){let t=d0+12*3600e3-lon/15*3600e3;for(let k=0;k<4;k++){const jd=t/864e5+2440587.5,T=(jd-2451545)/36525;
  const L=n360(280.46646+T*(36000.76983+T*0.0003032)),M=357.52911+T*(35999.05029-0.0001537*T),e=0.016708634-T*(0.000042037+0.0000001267*T);
  const Cc=Math.sin(M*R)*(1.914602-T*(0.004817+0.000014*T))+Math.sin(2*M*R)*(0.019993-0.000101*T)+Math.sin(3*M*R)*0.000289;
  const om=125.04-1934.136*T,lam=L+Cc-0.00569-0.00478*Math.sin(om*R),eps0=23+(26+(21.448-T*(46.815+T*(0.00059-T*0.001813)))/60)/60,eps=eps0+0.00256*Math.cos(om*R);
  const dec=Math.asin(Math.sin(eps*R)*Math.sin(lam*R)),y=Math.tan(eps/2*R)**2;
  const eot=4/R*(y*Math.sin(2*L*R)-2*e*Math.sin(M*R)+4*e*y*Math.sin(M*R)*Math.cos(2*L*R)-0.5*y*y*Math.sin(4*L*R)-1.25*e*e*Math.sin(2*M*R));
  const cosH=(Math.sin(alt*R)-Math.sin(lat*R)*Math.sin(dec))/(Math.cos(lat*R)*Math.cos(dec));if(Math.abs(cosH)>1){t=NaN;break;}
  const H=Math.acos(cosH)/R,noon=720-4*lon-eot;t=d0+(noon+(rise?-4*H:4*H))*60e3;}out.push(new Date(t));}return out;};
 const[sr,ss]=calc(-0.833),[cd,cdk]=calc(-6);return{civilDawn:cd,sunrise:sr,sunset:ss,civilDusk:cdk};};
C.units={ft_m:0.3048,nm_km:1.852,sm_km:1.609344,kt_kmh:1.852,lb_kg:0.45359237,usg_l:3.785411784,inhg_hpa:33.8638866667};
C.c2f=c=>c*9/5+32;C.f2c=f=>(f-32)*5/9;

/* ---- exact ISA cross-checks (ICAO Doc 7488 troposphere) ---- */
C.paExact=(elev,qnh)=>elev+145366.45*(1-Math.pow(qnh/1013.25,0.190284));
C.isaPress=h=>1013.25*Math.pow(1-6.8755856e-6*h,5.2558797);          /* hPa at PA h ft (<36089) */
C.isaTempExact=h=>h<=36089?15-0.0019812*h:-56.5;
C.altFromPress=p=>145366.45*(1-Math.pow(p/1013.25,0.190284));
C.daExact=(pa,oat)=>{const p=C.isaPress(pa),s=(p/1013.25)*(288.15/(oat+273.15));return 145442.16*(1-Math.pow(s,0.234969));};
/* true altitude, exact for a constant ISA deviation: Δh scales with T_actual/T_ISA (K) */
C.trueAltExact=(ind,stnElev,qnh,oat)=>{const pa=C.pressureAlt(ind,qnh),dev=oat-C.isaTemp(pa),mid=(ind+stnElev)/2,Ti=273.15+C.isaTempExact(C.pressureAlt(mid,qnh));return stnElev+(ind-stnElev)*(Ti+dev)/Ti;};
/* A5: QFE. 'exact' is the ISA reduction and is what the page shows; 'approx' (30 ft/hPa) is a sea-level rule only,
   it is ~20% off at Highveld elevations, so the page labels it as a rule of thumb. */
C.qfe=(qnh,elev)=>({approx:qnh-elev/30,exact:qnh*Math.pow(1-elev/145366.45,1/0.190284)});
/* A5: minutes -> {h,m} without the "1h 60 min" rounding bug (round the total first, then split) */
C.hm=min=>{const t=Math.round(min);return{h:Math.floor(t/60),m:t%60}};
/* A3: METAR altimeter, null-safe. 25–35 = inHg, 850–1090 = hPa, anything else (null, 0, garbage) = null. */
C.qnhFromAltim=a=>{const x=typeof a==='string'?parseFloat(a):a;if(typeof x!=='number'||!isFinite(x))return null;if(x>=25&&x<=35)return x*33.8638866667;if(x>=850&&x<=1090)return x;return null};
/* A3: PA / DA straight from STATION pressure (no QNH needed). Optional dewpoint adds humidity (virtual temperature).
   PA = 145366.45 × (1 − (P/1013.25)^0.190284). Validates P 450–1090 hPa, T −60..60 °C, Td <= T; returns null if invalid. */
C.densAltStn=(P,T,Td)=>{if(![P,T].every(x=>typeof x==='number'&&isFinite(x))||P<450||P>1090||T<-60||T>60)return null;
 if(Td!=null&&!(isFinite(Td)&&Td<=T))Td=null;
 const pa=145366.45*(1-Math.pow(P/1013.25,0.190284)),e=Td==null?0:6.1094*Math.exp(17.625*Td/(Td+243.04)),
  Tv=(T+273.15)/(1-0.378*e/P),rho=P*100/(287.058*Tv),hm=(1-Math.pow(rho/1.225,1/4.25588))/2.25577e-5;
 return{pa,da:hm/0.3048,e}};
/* A3: computed QNH from station pressure and elevation (ft). Rounded DOWN. For display only, never an observed QNH. */
C.qnhFromStn=(P,elevFt)=>Math.floor(P/Math.pow(1-0.0065*elevFt*0.3048/288.15,5.2559));
/* Magnus dewpoint from RH (for the model's relative_humidity_2m) */
C.dewFromRH=(T,rh)=>{if(!(rh>0))return null;const g=Math.log(Math.min(rh,100)/100)+17.625*T/(T+243.04);return 243.04*g/(17.625-g)};
/* Density-altitude advisory: no authority publishes DA go/no-go limits; FAA-P-8740-2 says check POH charts and lean above 5 000 ft DA. */
C.daAdvice=(da,elev)=>({above:da-elev,lean:da>5000});
/* find wind from TAS/HDG and GS/TRK (vector difference) */
C.findWind=(tas,hdg,gs,trk)=>{const ax=tas*Math.sin(hdg*R),ay=tas*Math.cos(hdg*R),gx=gs*Math.sin(trk*R),gy=gs*Math.cos(trk*R),wx=gx-ax,wy=gy-ay,ws=Math.hypot(wx,wy);return{ws,wd:ws<1e-9?0:n360(Math.atan2(-wx,-wy)/R)};};
C.maxDrift=(ws,tas)=>ws/tas*60;
/* East is least, West is best: MH = TH − VAR(E+), CH = MH − DEV(E+) */
C.compass=(th,v,dev)=>{const mh=n360(th-v);return{mh,ch:n360(mh-dev)};};
/* rhumb line (Mercator) */
C.rhumb=(la1,lo1,la2,lo2)=>{const p1=la1*R,p2=la2*R,dp=p2-p1;let dl=(lo2-lo1)*R;if(Math.abs(dl)>Math.PI)dl=dl>0?-(2*Math.PI-dl):2*Math.PI+dl;const dps=Math.log(Math.tan(Math.PI/4+p2/2)/Math.tan(Math.PI/4+p1/2)),q=Math.abs(dps)>1e-12?dp/dps:Math.cos(p1);return{crs:n360(Math.atan2(dl,dps)/R),nm:Math.hypot(dp,q*dl)*3437.7468};};
C.gc=(la1,lo1,la2,lo2)=>{const a=Math.sin((la2-la1)*R/2)**2+Math.cos(la1*R)*Math.cos(la2*R)*Math.sin((lo2-lo1)*R/2)**2;return 2*Math.asin(Math.sqrt(a))*3437.7468;};
C.rocFromGrad=(ftPerNm,gs)=>ftPerNm*gs/60; C.gradFromRoc=(roc,gs)=>roc*60/gs;
C.fuelSG={avgas:0.72,jeta1:0.80,mogas:0.74};
C.cgShift=(wMoved,dArm,total)=>wMoved*dArm/total; C.pctMAC=(cg,lemac,mac)=>(cg-lemac)/mac*100;
C.msa=(obst,margin)=>Math.ceil((obst+margin)/100)*100;
C.rh=(t,td)=>{const g=x=>Math.exp(17.625*x/(243.04+x));return 100*g(td)/g(t);};
/* units: base -> other */
C.UF={alt:['ft','m',0.3048],press:['hPa','inHg',1/33.8638866667],spd:['kt','km/h',1.852],mass:['lb','kg',0.45359237],vol:['L','USG',1/3.785411784],dist:['NM','km',1.852]};
C.toUnit=(dim,v,alt)=>dim==='temp'?(alt?C.c2f(v):v):(alt?v*C.UF[dim][2]:v);
C.fromUnit=(dim,v,alt)=>dim==='temp'?(alt?C.f2c(v):v):(alt?v/C.UF[dim][2]:v);
/* Transition altitude lookup per AIP ENR 1.7 para 3 (15 OCT 2026): 1 listed aerodrome; 2 within 25 NM of a listed one (nearest); 3 default rule. */
C.taLookup=(icao,lat,lon,elev,AD,TA)=>{icao=String(icao||'').toUpperCase().trim();const t=TA.find(x=>x[0]===icao);
 if(t)return{kind:'listed',ta:t[2],via:t[0],name:t[1],ref:t[3],note:t[4]};
 if(isFinite(lat)&&isFinite(lon)){let best=null;for(const x of TA){const a=AD.find(y=>y[0]===x[0]);if(!a)continue;const d=C.gc(lat,lon,a[4],a[5]);if(d<=25&&(!best||d<best.d))best={x,d}}
  if(best)return{kind:'near',ta:best.x[2],via:best.x[0],name:best.x[1],dist:best.d,ref:'ENR 1.7 para 3c (within 25 NM of '+best.x[0]+'); '+best.x[3],note:best.x[4]};}
 return{kind:'default',vmc:isFinite(elev)?elev+2000:null,ref:'ENR 1.7-3 para 3d-e'};};
C.n360=n360;C.n180=n180;

/* v5 humidity (MT 28 Oct): Tetens/Magnus vapour pressure, virtual temperature, density altitude from density.
   Humid correction = DA(rho_humid) - DA(rho_dry) at the same station pressure, added to the existing rule-of-thumb DA,
   so RH 0 (or blank) gives exactly the dry-air result. Refs: NOAA/NWS density-altitude method; Tetens 1930 / Magnus (Alduchov & Eskridge 1996). */
C.vapP=(t,rh)=>rh>0?rh/100*6.1078*Math.pow(10,7.5*t/(t+237.3)):0;
C.stnP=pa=>1013.25*Math.pow(1-6.8755856e-6*pa,5.2558797);
C.virtT=(t,p,e)=>(t+273.15)/(1-0.377995*e/p);
C.daFromRho=rho=>145442.16*(1-Math.pow(rho/1.225,0.234969));
C.rho=(p,tk,e)=>(p-e)*100/(287.058*tk)+e*100/(461.495*tk);
C.humidDelta=(pa,oat,rh)=>{if(!(rh>0))return 0;const p=C.stnP(pa),e=C.vapP(oat,Math.min(rh,100)),tk=oat+273.15;return C.daFromRho(C.rho(p,tk,e))-C.daFromRho(C.rho(p,tk,0));};
C.atmosRH=(elev,qnh,oat,rh)=>{const a=C.atmos(elev,qnh,oat),h=C.humidDelta(a.pa,oat,rh);return Object.assign(a,{dry:a.da,hum:h,da:a.da+h,e:C.vapP(oat,rh>0?Math.min(rh,100):0)});};
if(typeof module!=='undefined')module.exports=C;else root.WC=C;
})(this);
