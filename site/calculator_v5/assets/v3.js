/* Wingman Calculator v3 UI (DEMO). All maths comes from calc.js (window.WC) and ta.js (window.TA), unchanged. */
(function(){
const C=window.WC,$=s=>document.querySelector(s),H=document.documentElement;
const f0=x=>Math.round(x).toLocaleString('en-ZA').replace(/,/g,' '),f1=x=>(+x).toFixed(1),f2=x=>(+x).toFixed(2),d3=x=>String(Math.round(C.n360(x))%360).padStart(3,'0'),sg=x=>(x>=0?'+':'')+x;
const hm=d=>isNaN(d)?'—':new Date(d.getTime()+2*3600e3).toISOString().slice(11,16);
const SURF=[['tar','Paved'],['dry_grass','Dry grass'],['wet_grass','Wet grass'],['soft','Soft / snow']];
const perf=(land)=>[[ ['base','Chart distance m (to/from 50 ft, at your weight)',land?450:400],['avail',land?'LDA m':'TODA m',land?900:1000],['pa','Pressure alt ft',5400],['oat','OAT °C',28],['mode','Chart is for','isa',[['isa','Sea level, ISA'],['chart','Actual PA and OAT']]],['slope','Slope % (up +)',0],['tw','Tailwind kt',0],['v',land?'Landing speed kt':'Lift-off speed kt',land?60:55],['wpct','Weight % over chart',0],['surface','Surface','tar',SURF] ],
 g=>{const r=C[land?'landing':'takeoff']({base:g('base'),avail:g('avail'),pa:g('pa'),oat:g('oat'),mode:g('mode'),slope:g('slope'),tw:g('tw'),v:g('v'),wpct:g('wpct'),surface:g('surface'),wet:false});
  /* A2: invalid input -> error box, not a result */
  if(r.error)return{err:r.error};
  return{big:[land?'Landing distance required':'Take-off distance required',f0(r.req),'m'],rows:[['Factored distance',f0(r.dist)+' m'],['Safety factor','× '+r.safety],['Uses',Math.round(r.ratio*100)+'% of '+(land?'LDA':'TODA')],['Result','<span class="flag">'+r.flag+'</span> '+r.msg]]};}];
const D=[
['da','Density altitude','Atmosphere',[['elev','Elevation ft',5558],['qnh','QNH hPa',1020],['oat','OAT °C',25]],g=>{const a=C.atmos(g('elev'),g('qnh'),g('oat')),x=C.daAdvice(a.da,g('elev'));return{big:['Density altitude',f0(a.da),'ft'],rows:[['Pressure altitude',f0(a.pa)+' ft'],['ISA temp at PA',f1(a.isa)+' °C'],['ISA deviation',sg(f1(a.dev))+' °C'],['Above field',sg(f0(x.above))+' ft'],['Exact ISA DA (check)',f0(C.daExact(C.paExact(g('elev'),g('qnh')),g('oat')))+' ft']]}},
 'PA = elev + (1013.25 − QNH) × 30\nISA = 15 − 2 × PA/1000\nDA = PA + 120 × (OAT − ISA)\nExact: ICAO ISA density ratio','FAA PHAK (FAA-H-8083-25) ch.4 rules of thumb; exact cross-check ICAO Doc 7488 Standard Atmosphere. Lean above 5 000 ft DA: FAA-P-8740-2.'],
['ta','True altitude (cold temperature)','Atmosphere',[['ind','Indicated alt ft',9500],['stn','Station elev ft',5558],['qnh','QNH hPa',1020],['oat','OAT at alt °C',8]],g=>{const r=C.trueAlt(g('ind'),g('stn'),g('qnh'),g('oat'));return{big:['True altitude',f0(r.ta),'ft'],rows:[['Correction',sg(f0(r.corr))+' ft'],['ISA deviation at alt',sg(f1(r.dev))+' °C'],['Exact (Kelvin ratio)',f0(C.trueAltExact(g('ind'),g('stn'),g('qnh'),g('oat')))+' ft']]}},
 'True alt = Ind + 4 × ISAdev × (Ind − stn elev)/1000\n(4% per 10 °C of height above station)','ICAO cold-temperature rule; FAA AIM 7-2-3 / PHAK. Exact check: T/T_ISA ratio, ICAO Doc 7488.'],
['isa','Standard atmosphere','Atmosphere',[['h','Pressure alt ft',10000]],g=>{const p=C.isaPress(g('h'));return{big:['ISA pressure',f2(p),'hPa'],rows:[['ISA temperature',f2(C.isaTempExact(g('h')))+' °C'],['Pressure',f2(p/33.8638866667)+' inHg']]}},
 'p = 1013.25 × (1 − 6.8755856e-6 × h)^5.2558797\nT = 15 − 0.0019812 × h (to 36 089 ft), then −56.5 °C','ICAO Doc 7488 Manual of the ICAO Standard Atmosphere.'],
['alt','QNH · QFE & transition altitude','Atmosphere',[['icao','Aerodrome ICAO','FAOR','text'],['qnh','QNH hPa',1020],['elev','Elevation ft',5558]],g=>{const q=C.qfe(g('qnh'),g('elev')),t=C.taLookup(g('icao'),NaN,NaN,g('elev'),[],window.TA||[]);
 return{big:['QFE',f1(q.exact),'hPa'],rows:[['Rule of thumb (30 ft/hPa, sea level only)',f1(q.approx)+' hPa'],['QNE / pressure alt',f0(C.pressureAlt(g('elev'),g('qnh')))+' ft'],['Transition altitude',t.kind==='listed'?f0(t.ta)+' ft · '+t.name:'Not listed: see ENR 1.7 para 3d–e'],['Reference',t.ref]]}},
 'QFE = QNH × (1 − elev/145 366.45)^(1/0.190284)\nQFE ≈ QNH − elev/30 (only near sea level; ~36 ft/hPa at 5 500 ft)\nPA = elev + (1013.25 − QNH) × 30','CAA SA AIP 15 OCT 2026, ENR 1.7 para 3–4 and AD 2.17 item 5 (transition altitudes); ICAO Doc 7488.'],
['wt','Wind triangle','Wind',[['tc','True course °',45],['tas','TAS kt',110],['wd','Wind from °T',330],['ws','Wind kt',18]],g=>{const r=C.windTriangle(g('tc'),g('tas'),g('wd'),g('ws'));if(!r)return{err:'Wind stronger than TAS crosswise: no solution.'};return{big:['Ground speed',f0(r.gs),'kt'],rows:[['True heading',d3(r.hdg)+'°T'],['Wind correction angle',sg(f1(r.wca))+'°']]}},
 'WCA = asin(WS × sin(WD − TC) / TAS)\nHDG = TC + WCA\nGS = TAS × cos(WCA) − WS × cos(WD − TC)','E6B flight computer worked method; vector cross-check.'],
['xw','Crosswind / headwind','Wind',[['rwy','Runway hdg °T (true, like METAR wind)',10],['wd','Wind from °',340],['ws','Wind kt',15]],g=>{const c=C.components(g('rwy'),g('wd'),g('ws'));return{big:['Crosswind',f0(Math.abs(c.xw)),'kt'],rows:[['From the',c.xw>=0?'right':'left'],[c.hw>=0?'Headwind':'Tailwind',f0(Math.abs(c.hw))+' kt']]}},
 'HW = WS × cos(WD − RWY)\nXW = WS × sin(WD − RWY)  (XW > 0 = from the right)','Standard trigonometric resolution, FAA PHAK ch.11.'],
/* Wind results in the UI (Gemini check 30 Oct): METAR wind group -> conservative runway components via C.parseMetarWind + C.windOnRunway */
['mw','Runway wind from METAR','Wind',[['grp','METAR wind group','25012G25KT','text'],['vr','Variable range (optional)','220V290','text'],['rwy','Runway hdg °T',280],['xl','Crosswind limit kt',15],['tl','Tailwind limit kt',10]],g=>{const w=C.parseMetarWind(g('grp'),g('vr'));if(!w)return{err:'Wind group not recognised. Use e.g. 25012G25KT, VRB03KT or 00000KT.'};
 const r=C.windOnRunway(g('rwy'),w,{xw:g('xl'),tw:g('tl')});if(r.status==='invalid')return{err:'Check the '+r.notes[0]+'.'};if(r.status==='calm')return{big:['Wind','Calm',''],rows:[['Crosswind','0 kt'],['Headwind','0 kt']]};
 const lim=r.over?'<span class="flag">OVER LIMIT</span>':'<span class="flag">WITHIN LIMITS</span>',rows=[];
 if(r.status==='vrb')rows.push(['Variable wind',r.warning]);else{rows.push([r.hw>=0?'Headwind (steady)':'Tailwind (steady)',f0(Math.abs(r.hw))+' kt'],['Crosswind from the',r.xw>=0?'right':'left'])}
 rows.push(['Crosswind (steady)',f0(r.xwSteady)+' kt'],['Tailwind worst case',f0(r.tw)+' kt']);if(r.gust)rows.push(['Gust',f0(r.gust)+' kt']);if(r.range)rows.push(['Variable range','worst case across '+g('vr')]);rows.push(['Limits',lim]);
 return{big:['Crosswind worst case',f0(r.xwAbs),'kt'],rows}},
 'Crosswind at gust speed, headwind credit at steady speed, tailwind at gust speed\nV range: worst angle in the range\nVRB: full speed as crosswind and tailwind','ICAO Annex 3 METAR wind format; conservative gust handling per UK CAA Safety Sense 12.'],
['fw','Find wind','Wind',[['tas','TAS kt',110],['hdg','Heading °T',40],['gs','Ground speed kt',98],['trk','Track °T',45]],g=>{const r=C.findWind(g('tas'),g('hdg'),g('gs'),g('trk'));return{big:['Wind',d3(r.wd)+'° / '+f0(r.ws),'kt'],rows:[['Direction (from)',d3(r.wd)+'°T'],['Speed',f1(r.ws)+' kt']]}},
 'Wind = GS∠TRK − TAS∠HDG (vector difference)','Inverse of the E6B wind triangle.'],
['drift','Max drift','Wind',[['ws','Wind kt',20],['tas','TAS kt',120]],g=>({big:['Max drift',f1(C.maxDrift(g('ws'),g('tas'))),'°'],rows:[['Rule','WS / TAS × 60']]}),
 'Max drift = WS / TAS × 60','Navigation rule of thumb (1-in-60).'],
['tas','TAS from CAS','Speed',[['cas','CAS kt',100],['pa','Pressure alt ft',8500],['oat','OAT °C',10]],g=>{const r=C.tas(g('cas'),g('pa'),g('oat'));return{big:['True airspeed',f0(r.tas),'kt'],rows:[['Density altitude',f0(r.da)+' ft'],['Density ratio σ',r.sigma.toFixed(4)]]}},
 'σ = (1 − 6.8755856e-6 × DA)^4.2558797\nTAS = CAS / √σ','ICAO Doc 7488 density ratio; E6B check.'],
['mach','Mach number','Speed',[['tas','TAS kt',250],['oat','OAT °C',-20]],g=>{const r=C.mach(g('tas'),g('oat'));return{big:['Mach',r.m.toFixed(3),''],rows:[['Speed of sound',f1(r.a)+' kt']]}},
 'a = 38.967854 × √(OAT + 273.15) kt\nM = TAS / a','ICAO Doc 7488 speed of sound.'],
['tsd','Time · speed · distance','Speed',[['d','Distance NM',120],['s','Ground speed kt',100]],g=>{const t=C.tsd.time(g('d'),g('s'));return{big:['Time',(m=>m.h+'h '+String(m.m).padStart(2,'0'))(C.hm(t)),'min'],rows:[['Minutes',f1(t)+' min']]}},
 'Time = Distance / Speed × 60','Basic navigation.'],
['to','Take-off distance','Performance',...perf(false),'Distance × weight × PA × temp × slope × tailwind × surface factors, then × 1.33 safety','UK CAA Safety Sense Leaflet 09 / UK AIC 173/2024 factor table. Always use your POH chart first.'],
['ld','Landing distance','Performance',...perf(true),'Distance × weight × PA × temp × slope × tailwind × surface factors, then × 1.43 safety','UK CAA Safety Sense Leaflet 09 / UK AIC 173/2024 factor table. Always use your POH chart first.'],
['roc','Climb gradient → rate of climb','Performance',[['grad','Gradient ft/NM',400],['gs','Ground speed kt',80]],g=>({big:['Rate of climb',f0(C.rocFromGrad(g('grad'),g('gs'))),'ft/min'],rows:[['Gradient %',f1(g('grad')/60.76)+' %']]}),
 'ROC = gradient × GS / 60','ICAO PANS-OPS climb gradient tables.'],
['fuel','Fuel planning & endurance','Fuel & loading',[['fob','Fuel on board L',150],['burn','Burn L/h',32],['trip','Trip min',120],['res','Reserve min',45],['taxi','Taxi L',5]],g=>{const r=C.fuel(g('fob'),g('burn'),g('res'),g('taxi'),g('trip'));if(r.error)return{err:r.error};return{big:['Spare fuel',f1(r.spare),'L'],rows:[['Required',f1(r.req)+' L'],['Trip',f1(r.trip)+' L'],['Reserve',f1(r.res)+' L'],['Endurance',f0(r.endur)+' min'],['Usable endurance (after reserve)',f0(r.usableEndur)+' min']]}},
 'Trip = burn × trip min / 60\nReserve = burn × reserve min / 60\nRequired = trip + reserve + taxi\nEndurance = FOB / burn × 60','SACAA Part 91 fuel reserve arithmetic; E6B.'],
['fwv','Fuel weight ↔ volume','Fuel & loading',[['l','Litres',100],['type','Fuel','avgas',[['avgas','Avgas 100LL'],['jeta1','Jet A-1'],['mogas','Mogas']]]],g=>{const kg=g('l')*C.fuelSG[g('type')];return{big:['Mass',f1(kg),'kg'],rows:[['Pounds',f1(kg/0.45359237)+' lb'],['US gallons',f1(g('l')/3.785411784)+' USG'],['Specific gravity',C.fuelSG[g('type')]]]}},
 'kg = L × SG (Avgas 0.72, Jet A-1 0.80, Mogas 0.74)','Typical specific gravity at 15 °C; confirm with fuel docket.'],
['cgs','CG shift & %MAC','Fuel & loading',[['w','Weight moved lb',50],['d','Distance moved in',40],['tot','Total weight lb',2400],['cg','CG in',40],['lemac','LEMAC in',30],['mac','MAC in',60]],g=>{const s=C.cgShift(g('w'),g('d'),g('tot'));return{big:['CG shift',f2(s),'in'],rows:[['New CG',f2(g('cg')+s)+' in'],['%MAC before',f1(C.pctMAC(g('cg'),g('lemac'),g('mac')))+' %'],['%MAC after',f1(C.pctMAC(g('cg')+s,g('lemac'),g('mac')))+' %']]}},
 'ΔCG = weight moved × distance / total weight\n%MAC = (CG − LEMAC) / MAC × 100','FAA Weight & Balance Handbook (FAA-H-8083-1).'],
['wb','Weight & balance','Fuel & loading',[['w1','Empty wt lb',1663],['a1','Empty arm in',39],['w2','Front seats lb',340],['a2','Front arm in',37],['w3','Rear / baggage lb',170],['a3','Rear arm in',73],['w4','Fuel lb',240],['a4','Fuel arm in',48]],g=>{const r=C.wb([1,2,3,4].map(i=>({w:g('w'+i),arm:g('a'+i)})));if(r.error)return{err:r.error};return{big:['CG',f2(r.cg),'in'],rows:[['Total weight',f0(r.w)+' lb'],['Total moment',f0(r.m)+' lb·in']]}},
 'Moment = weight × arm\nCG = Σ moment / Σ weight','FAA Weight & Balance Handbook (FAA-H-8083-1); check against your POH envelope.'],
['cb','Cloud base & freezing level','Weather',[['t','Temp °C',24],['td','Dewpoint °C',9],['elev','Elevation ft',5558]],g=>{const c=C.cloudBase(g('t'),g('td'),g('elev'));return{big:['Cloud base',f0(c.agl),'ft AGL'],rows:[['Cloud base AMSL',f0(c.amsl)+' ft'],['Freezing level',f0(C.freezingLevel(g('t'),g('elev')).amsl)+' ft AMSL'],['Relative humidity',f0(C.rh(g('t'),g('td')))+' %']]}},
 'Base AGL = (T − Td) / 2.5 × 1000\nFreezing level = elev + T / 2 × 1000\nRH = Magnus formula','FAA Aviation Weather (AC 00-6B) spread rule; ISA 2 °C/1000 ft lapse; Magnus (Alduchov & Eskridge).'],
['sun','Sunrise, sunset & civil twilight','Weather',[['date','Date',new Date().toISOString().slice(0,10),'date'],['lat','Latitude (S −)',-26.139],['lon','Longitude (E +)',28.246]],g=>{const s=C.sun(new Date(g('date')+'T00:00:00Z'),g('lat'),g('lon'));return{big:['Sunrise · sunset',hm(s.sunrise)+' · '+hm(s.sunset),'SAST'],rows:[['Civil dawn',hm(s.civilDawn)+' SAST'],['Civil dusk',hm(s.civilDusk)+' SAST']]}},
 'NOAA solar position algorithm\nSunrise/sunset: sun at −0.833°\nCivil twilight: sun at −6°','NOAA Solar Calculator; checked against api.sunrise-sunset.org. Times shown in SAST (UTC+2).'],
['tod','Top of descent','Navigation',[['cr','Cruise alt ft',9500],['tg','Target alt ft',6500],['gs','Ground speed kt',120],['ang','Descent angle °',3]],g=>{const r=C.tod(g('cr'),g('tg'),g('gs'),g('ang'));return{big:['Start descent',f1(r.dist),'NM out'],rows:[['Rate of descent',f0(r.rod)+' ft/min'],['Rule of thumb (3 per 1000)',f1(r.rule)+' NM'],['Rule ROD (GS × 5)',f0(r.ruleRod)+' ft/min'],['Time',f1(r.time)+' min']]}},
 'Dist = Δh / (6076.12 × tan θ)\nROD = GS × 101.269 × tan θ\nRules: 3 NM per 1000 ft, ROD ≈ GS × 5','Trigonometric 3° path; ICAO PANS-OPS rule of thumb.'],
['hold','Holding entry','Navigation',[['hdg','Heading to fix °',150],['inb','Inbound course °',360],['turn','Turns','R',[['R','Right (standard)'],['L','Left']]]],g=>{const r=C.holdEntry(g('hdg'),g('inb'),g('turn'));return{big:['Entry',r.entry,''],rows:[['Relative angle',f0(r.rel)+'°']].concat(r.flex?[['Near a boundary',r.note]]:[])}},
 't = heading to fix − inbound course (mirrored for left turns)\nDirect: t ≤ 110° or t ≥ 290°\nTeardrop: 110°–180°\nParallel: 180°–290°\nWithin ±5° of a boundary either entry is fine','ICAO Doc 8168 PANS-OPS Vol I, holding entry sectors.'],
['cmp','True · magnetic · compass heading','Navigation',[['th','True heading °',45],['var','Variation ° (E +, W −)',-25],['dev','Deviation ° (E +)',2]],g=>{const r=C.compass(g('th'),g('var'),g('dev'));return{big:['Compass heading',d3(r.ch),'°C'],rows:[['Magnetic heading',d3(r.mh)+'°M']]}},
 'MH = TH − VAR (E +)\nCH = MH − DEV (E +)\n“East is least, West is best”','FAA PHAK ch.16 Navigation.'],
['rl','Course & distance','Navigation',[['la1','Lat A (S −)',-26.139],['lo1','Lon A (E +)',28.246],['la2','Lat B (S −)',-33.97],['lo2','Lon B (E +)',18.6]],g=>{const r=C.rhumb(g('la1'),g('lo1'),g('la2'),g('lo2'));return{big:['Distance',f0(r.nm),'NM'],rows:[['True course (rhumb)',d3(r.crs)+'°T'],['Great circle',f0(C.gc(g('la1'),g('lo1'),g('la2'),g('lo2')))+' NM']]}},
 'Rhumb line (Mercator): Δψ = ln(tan(π/4+φ2/2)/tan(π/4+φ1/2))\nGreat circle: haversine × 3437.7468 NM','Standard spherical navigation (Bowditch, American Practical Navigator).'],
['msa','Minimum safe altitude','Navigation',[['obs','Highest obstacle ft AMSL',6800],['m','Margin ft',1000]],g=>({big:['MSA',f0(C.msa(g('obs'),g('m'))),'ft'],rows:[['Rounded up to','next 100 ft']]}),
 'MSA = ceil((obstacle + margin) / 100) × 100','SACAA Part 91 minimum heights; ICAO PANS-OPS margins (1000 ft, 2000 ft mountainous).'],
['conv','Unit conversions','Units',[
 ['v','Value',1000],['u','Convert','alt',Object.entries(C.conversionGroups).map(([id,g])=>[id,g.label])],
 ['from','From','ft',C.conversionGroups.alt.units.map(u=>u.slice(0,2))],
 ['to','To','m',C.conversionGroups.alt.units.map(u=>u.slice(0,2))]
],g=>{
 const category=g('u'),group=C.conversionGroups[category],value=g('v'),from=g('from'),to=g('to');
 const out=C.convertUnits(category,value,from,to);
 if(!Number.isFinite(out))return{err:category==='temp'?'Temperature cannot be below absolute zero.':'Check the value and selected units. Fuel quantities must be zero or more.'};
 const label=id=>group.units.find(u=>u[0]===id)[1];
 const fmt=v=>String(Number(v.toPrecision(10)));
 return{big:[label(from)+' → '+label(to),fmt(out),label(to)],rows:[['Back again',fmt(C.convertUnits(category,out,to,from))+' '+label(from)]].concat(group.density?[
 ['Planning density at 15 °C',group.density.toFixed(2)+' kg/L'],['Fuel note','Approximate; use actual uplift density.']]:[])};
},
 'result = value × source SI factor ÷ target SI factor. Temperature via kelvin. Fuel mass kg = volume L × density kg/L; Avgas 0.72, Jet A-1 0.80 at 15 °C (planning assumptions only). Swap reverses units and uses the unrounded result.',
 'SI / ICAO Annex 5 conversion factors; US liquid gal = 3.785411784 L; Imperial gal = 4.54609 L. Fuel densities vary with temperature and batch; use measured density for operational loading.'],
 /* Part 2 additions (30 Oct 2026). Coordinated level turn: tan φ = ω·V/g, R = V²/(g·tan φ) (FAA-H-8083-15B Instrument Flying Handbook ch.5; rule of thumb bank ≈ TAS/10 + 7). */
['turn','Rate of turn, radius & bank','Performance',[['tas','TAS kt',100],['bank','Bank angle °',15]],g=>{const r=C.turn(g('tas'),g('bank'));if(r.error)return{err:r.error};return{big:['Rate of turn',f1(r.rate),'°/s'],rows:[['Turn radius',f2(r.radiusNm)+' NM ('+f0(r.radiusM)+' m)'],['360° takes',f0(r.t360)+' s'],['Rate-1 bank (3°/s)',f1(r.rate1Bank)+'°'],['Rule of thumb (TAS/10 + 7)',f0(r.rule)+'°']]}},
 'tan φ = ω × V / g  (coordinated level turn)\nRate ω = g × tan φ / V\nRadius R = V² / (g × tan φ)\nRate-1 = 3°/s; rule of thumb bank ≈ TAS / 10 + 7\nV in m/s = kt × 0.514444, g = 9.80665 m/s²','FAA Instrument Flying Handbook (FAA-H-8083-15B) ch.5; standard physics of a coordinated turn.'],
 /* Still-air glide distance = height × glide ratio; over the ground scale by GS/TAS (FAA-H-8083-3C Airplane Flying Handbook ch.18). */
['glide','Glide distance','Performance',[['h','Height above ground ft',3000],['ratio','Glide ratio (x : 1)',9],['tas','Best-glide TAS kt',70],['hw','Headwind kt (tail −)',0]],g=>{const r=C.glide(g('h'),g('ratio'),g('tas'),g('hw'));if(r.error)return{err:r.error};return{big:['Glide range',f1(r.nm),'NM'],rows:[['Still air',f1(r.still)+' NM'],['Time to ground',f1(r.min)+' min'],['Rate of descent',f0(r.rod)+' ft/min']]}},
 'Still-air distance (NM) = height ft × ratio / 6076.12\nGS = TAS − headwind\nGlide range = still-air × GS / TAS\nTime = height / ROD;  ROD = TAS × 101.27 / ratio','FAA Airplane Flying Handbook (FAA-H-8083-3C) ch.18 emergency procedures; use the glide ratio from your POH.'],
];
D.shift(); /* v4: density altitude is the hero above */
/* Part 2 (the "More calculators" list) is rendered by more.js from D; this file keeps the definitions,
   the shared formula sheet and the theme menu. */
/* "i" sheet */
const sh=$('#sheet'),sc=$('#scrim'),close=()=>{sh.classList.remove('on');sc.classList.remove('on')};
/* openSheet(i): show the formula and source of calculator D[i] (used by more.js) */
const openSheet=i=>{const d=D[i];$('#shT').textContent=d[1];$('#shF').textContent=d[5];$('#shS').textContent=d[6];sh.classList.add('on');sc.classList.add('on')};
sc.onclick=close;$('#sheetX').onclick=close;document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();pop.classList.remove('on')}});
/* themes: same keys as main_demo (wm-theme, wm-pal, wm-pal-day) */
const T=[['Pearl','day','white','#F2F2F5'],['Champagne','day','beige','#E9DFCC'],['Beige','day','warm','#F4EEE3'],['Midnight','night','black','#000'],['Amethyst','night','purple','#1A0F33']],pop=$('#thmPop');
const draw=()=>{window.dispatchEvent(new Event('wm-theme'));pop.innerHTML=T.map(t=>`<button role="menuitem" data-t="${t[1]}" data-p="${t[2]}" class="${H.dataset.theme===t[1]&&H.dataset.pal===t[2]?'on':''}"><s style="background:${t[3]}"></s>${t[0]}</button>`).join('')};
draw();$('#thmBtn').onclick=e=>{e.stopPropagation();pop.classList.toggle('on')};
pop.onclick=e=>{const b=e.target.closest('button');if(!b)return;H.dataset.theme=b.dataset.t;H.dataset.pal=b.dataset.p;localStorage.setItem('wm-theme',b.dataset.t);localStorage.setItem(b.dataset.t==='night'?'wm-pal':'wm-pal-day',b.dataset.p);draw();setTimeout(()=>pop.classList.remove('on'),140)};
document.addEventListener('click',e=>{if(!pop.contains(e.target))pop.classList.remove('on')});
window.__v3={D,openSheet,f0,f1,f2};
})();
