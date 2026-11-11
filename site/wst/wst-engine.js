/* Wingman status engine (pure, no DOM). Guidance only — the pilot in command decides.
   30 Oct 2026: branch status() structure + Claude's rule functions (wxScan, xw/tw/gust levels, tafScan) = MT rules 1-8.
   Loaded on main.html; wm-bridge.js routes every card status through status() below. */
(function(G){
const AC=[ // sorted by SA ATO fleet popularity (see aircraft_limits.csv)
 {id:'C172',n:'Cessna 172',xw:15,src:'C172S POH §5 Fig 5-4',v:1},
 {id:'PA28',n:'PA-28 Warrior/Archer',xw:17,src:'PA-28-161 AFM §4 (Archer: secondary)',v:1},
 {id:'C152',n:'Cessna 152',xw:12,src:'C152 POH §4 (via secondary)',v:1},
 {id:'SLG2',n:'Sling 2',xw:15,src:'Sling LSA POH Rev 3.3 §2.5',v:1},
 {id:'PA34',n:'PA-34 Seneca',xw:17,src:'PA-34 POH §2 placard / §4: max demo crosswind 17 kt',v:1},
 {id:'DA20',n:'Diamond DA20-C1',xw:20,src:'DA20-C1 AFM',v:1},
 {id:'DA42',n:'Diamond DA42',xw:20,src:'DA42 QRH',v:1},
 {id:'SLG4',n:'Sling 4',xw:15,src:'Sling 4 POH Rev 2.2 §2.5',v:1},
 {id:'C182',n:'Cessna 182',xw:15,src:'C182T POH §5 (via secondary)',v:1},
 {id:'DA40',n:'Diamond DA40 (classic/XLT)',xw:20,src:'Diamond spec sheet (not AFM)',v:1},
 {id:'DA40NG',n:'Diamond DA40 NG',xw:25,src:'DA40 NG AFM max demonstrated crosswind 25 kt',v:1},
 {id:'P2008',n:'Tecnam P2008',xw:15,src:'P2008 JC AFM §2.18',v:1}];
const PRE={ // APP POLICY: conservative profile defaults, NOT regulation (docs/ENGINE_POLICY.md)
 ppl:{n:"PPL",xw:12,gust:25,ceil:2500,vis:8,night:0,ir:0},
 ir:{n:'Instrument rating',xw:12,gust:25,ceil:2000,vis:6,night:1,ir:1,iceil:600,ivis:2},
 cpl:{n:'CPL',xw:15,gust:25,ceil:1500,vis:5,night:1,ir:0}};
const VFR={vis:5,ceil:1500,src:'CAR 2011 Part 91.06.21 Table 1 (CTR/ATZ: no T/O or landing if ground vis < 5 km or ceiling < 1 500 ft)'};
const IFRF={vis:0.55,ceil:200,src:'Lowest possible CAT I (ICAO Annex 6: DH ≥ 200 ft, RVR ≥ 550 m). Not this aerodrome\u2019s published minima — use the approach plate.'};
const R=Math.PI/180;
/* APP POLICY (not regulation): tailwind and gust thresholds below are conservative
   training recommendations, not CAR/ICAO limits. */
// APP POLICY (see docs/ENGINE_POLICY.md)
/* ===== DENSITY ALTITUDE TRIGGER (MT approved 30 Oct 2026) =====
   CAUTION when density altitude is more than DA_ABOVE_FIELD_FT above the field elevation (hot-and-high relative to
   the field, so Highveld fields are not permanently amber). No NO-GO from DA alone: take-off/landing performance
   comes from the aircraft POH. Change this ONE number to retune. */
const DA_ABOVE_FIELD_FT=2500;
/* MT rules 1-8 (30 Oct 2026). APP POLICY, not regulation, unless a CAR reference is given. */
const POL={ceilFloor:1000,ageCaution:75,ageNogo:180,wsCaution:20,
 vrbGo:6,          // rule 2: VRB 0-6 kt with no gust = GO with a note
 gustSpread:15,    // rule 2: gust minus mean MORE than 15 kt = CAUTION
 xwGo:0.8,         // rule 3: crosswind up to 80% of limit GO, 80-100% CAUTION, >100% NO-GO
 defXw:12,         // rule 3: no aircraft profile -> 12 kt
 tw:5,twMax:10,    // rule 4: tailwind 0-5 GO, 6-10 CAUTION, >10 NO-GO
 daAbove:DA_ABOVE_FIELD_FT, // rule 5
 tafWindowH:2,     // rule 6: TAF groups starting within the next 2 h
 nightPreMin:60};  // rule 7: CAUTION when night starts within 60 min and night is not selected
/* Rule 1: present weather, token based (Claude 30 Oct). Only tokens made entirely of WMO 4678 codes count, so the
   station id FAGR is no longer read as hail. NO-GO: TS (incl. VCTS, TSRA, TSGR), CB/TCU cloud, FZRA/FZDZ, SQ, FC, GR.
   CAUTION: RE (recent) hazards, +SHRA, GS, FZFG. */
const WXC=new Set('MI PR BC DR BL SH TS FZ DZ RA SN SG IC PL GR GS UP BR FG FU VA DU SA HZ PO SQ FC SS DS'.split(' '));
function wxScan(txt){const nogo=[],caut=[];
 for(const t of String(txt||'').toUpperCase().split(/\s+/)){if(!t)continue;
  if(/^(FEW|SCT|BKN|OVC)(\d{3}|\/\/\/)(CB|TCU)$/.test(t)){nogo.push(t);continue}
  const m=/^(\+|-|VC|RE)?([A-Z]{2,12})$/.exec(t);if(!m||m[2].length%2)continue;
  const p=m[2].match(/../g);if(!p.every(c=>WXC.has(c)))continue;const h=c=>p.includes(c);
  if(h('TS')||(h('FZ')&&(h('RA')||h('DZ')))||h('SQ')||h('FC')||h('GR'))(m[1]==='RE'?caut:nogo).push(t);
  else if((m[1]==='+'&&(h('RA')||h('SN')))||h('GS')||(h('FZ')&&h('FG')))caut.push(t)}
 return{nogo,caut}}
/* Rule 6: TAF TEMPO / BECMG / FM / PROB groups inside the flight window (now .. now+2 h).
   FM ends every earlier base/BECMG/FM period; PROB30/40 is capped at CAUTION; TEMPO below minima = CAUTION;
   BECMG/FM below minima = NO-GO; TS/CB/FZRA etc. in any non-PROB group = NO-GO. */
function tafDate(now,dd,hh,mm){const n=new Date(now);let b=null;for(const k of[-1,0,1]){const t=Date.UTC(n.getUTCFullYear(),n.getUTCMonth()+k,dd,hh,mm||0);if(b==null||Math.abs(t-now)<Math.abs(b-now))b=t}return b}
function tafSegs(raw,now){const tk=String(raw||'').toUpperCase().replace(/=/g,' ').trim().split(/\s+/).filter(Boolean),vt=/^(\d{2})(\d{2})\/(\d{2})(\d{2})$/,S=[];
 let cur=null,prob=null,end=null;const open=(ty,f,to,pr)=>{cur={ty,f,to,pr:pr||null,t:[]};S.push(cur)};
 for(let i=0;i<tk.length;i++){const t=tk[i];let m;
  if((m=/^PROB(30|40)$/.exec(t))){prob=+m[1];continue}
  if((t==='TEMPO'||t==='BECMG')&&(m=vt.exec(tk[i+1]||''))){open(t,tafDate(now,+m[1],+m[2]),t==='BECMG'?end:tafDate(now,+m[3],+m[4]),prob);prob=null;i++;continue}
  if(prob&&(m=vt.exec(t))){open('PROB',tafDate(now,+m[1],+m[2]),tafDate(now,+m[3],+m[4]),prob);prob=null;continue}
  if((m=/^FM(\d{2})(\d{2})(\d{2})$/.exec(t))){const f=tafDate(now,+m[1],+m[2],+m[3]);S.forEach(s=>{if((s.ty==='FM'||s.ty==='BASE'||s.ty==='BECMG')&&s.to>f)s.to=f});open('FM',f,end);continue}
  if(end==null&&(m=vt.exec(t))){end=tafDate(now,+m[3],+m[4]);open('BASE',tafDate(now,+m[1],+m[2]),end);continue}
  if(cur)cur.t.push(t)}
 return S}
const hz=t=>{const d=new Date(t);return('0'+d.getUTCDate()).slice(-2)+('0'+d.getUTCHours()).slice(-2)+'Z'};
function tafScan(raw,now,minVis,minCeil){const out=[],w1=now+POL.tafWindowH*3600e3;
 for(const s of tafSegs(raw,now)){if(s.ty==='BASE'||s.f==null||!(s.f<w1&&(s.to==null||s.to>now)))continue;
  let v=null,c=null;for(const t of s.t){if(/^\d{4}$/.test(t))v=t==='9999'?10:+t/1000;if(t==='CAVOK')v=10;const m=/^(BKN|OVC|VV)(\d{3})/.exec(t);if(m)c=c==null?+m[2]*100:Math.min(c,+m[2]*100)}
  const w=wxScan(s.t.join(' ')),below=(v!=null&&v<minVis)||(c!=null&&c<minCeil),perm=s.ty==='FM'||s.ty==='BECMG';let lv='go';const why=[];
  if(w.nogo.length){lv='nogo';why.push(w.nogo.join(' '))}
  if(below){if(lv!=='nogo')lv=perm?'nogo':'caution';why.push(v!=null&&v<minVis?'vis '+v.toFixed(1)+' km':'ceiling '+c+' ft')}
  if(w.caut.length){if(lv==='go')lv='caution';why.push(w.caut.join(' '))}
  if(s.pr&&lv==='nogo')lv='caution';
  if(lv!=='go')out.push({lv,k:'taf',txt:(s.pr&&/TS/.test(w.nogo.join(' '))?'TAF forecast: thunderstorm possible (PROB'+s.pr+') from '+hz(s.f)+', a '+s.pr+'% chance in this window, not an expected event and not current weather. Forecast detail: ':'TAF forecast: '+(s.pr?'PROB'+s.pr+' ':'')+(s.ty==='PROB'?'':s.ty+' ')+'from '+hz(s.f)+': ')+why.join(', ')})}
 return out}
/** METAR body only (drop TEMPO/BECMG/NOSIG trend + RMK) so forecast trends don't trigger present-weather rules. */
/** METAR trend part (TEMPO/BECMG ... up to RMK), '' if none or NOSIG. */
function metarTrend(raw){const r=String(raw||'').replace(/=/g,' ').split(/\sRMK\b/)[0],i=r.search(/\s(?:TEMPO|BECMG)\s/);return i<0?'':r.slice(i+1).trim()}
function metarBody(raw){return String(raw||'').split(/\s(?:TEMPO|BECMG|NOSIG|RMK)\b/)[0]}
/** Variation group dddVddd from a raw METAR, e.g. 240V300 -> {a:240,b:300}. */
function varGroup(raw){const m=/\s(\d{3})V(\d{3})(?=\s)/.exec(' '+metarBody(raw)+' ');return m?{a:+m[1],b:+m[2]}:null}
/** Worst-case runway wind across a direction range (clockwise a->b, 10° steps): the runway is chosen on the
    mean wind, then the worst crosswind/tailwind anywhere in the range is used against that runway. */
function worstIn(rw,a,b,ws){let span=((b-a)+360)%360,w=null,twMin=null;for(let d=0;d<=span;d+=10){const r=best(rw,(a+d)%360,ws);if(!w||r.xw>w.xw)w=Object.assign({},r,{xwD:(a+d)%360});
  if(twMin==null||r.hw<twMin)twMin=r.hw}w.twMin=twMin;return w}   // twMin kept outside w (was lost on every reassignment, and 0 read as unset)
function sun(lat,lon,d,alt){ // NOAA algorithm; returns UTC ms of rise/set for sun altitude alt (deg)
 const day=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());
 const JD=day/864e5+2440587.5,n=Math.ceil(JD-2451545+0.0008),Js=n-lon/360,M=(357.5291+0.98560028*Js)%360,
 C=1.9148*Math.sin(M*R)+0.02*Math.sin(2*M*R)+0.0003*Math.sin(3*M*R),L=(M+C+180+102.9372)%360,
 Jt=2451545+Js+0.0053*Math.sin(M*R)-0.0069*Math.sin(2*L*R),dec=Math.asin(Math.sin(L*R)*Math.sin(23.4397*R)),
 c=(Math.sin(alt*R)-Math.sin(lat*R)*Math.sin(dec))/(Math.cos(lat*R)*Math.cos(dec));
 if(c<-1||c>1)return null;const w=Math.acos(c)/R/360,ms=j=>(j-2440587.5)*864e5;return{rise:ms(Jt-w),set:ms(Jt+w)}}
function sunInfo(lat,lon,now){const d=new Date(now),s=sun(lat,lon,d,-0.833),t=sun(lat,lon,d,-6),
 sn=sun(lat,lon,new Date(now+864e5),-0.833),Q=15*6e4;
 const nStart=s.set+Q,nEnd=s.rise-Q,isNight=now>=nStart||now<nEnd;
 return{rise:s.rise,set:s.set,cr:t.rise,cs:t.set,nightFrom:nStart,nightTo:nEnd,nextRise:(now<s.rise?s.rise:sn.rise),isNight,
  isDay:now>=s.rise&&now<s.set}}
function best(rw,wd,ws){let b=null;for(const r of rw){const a=(wd-r.true)*R,hw=ws*Math.cos(a),xw=Math.abs(ws*Math.sin(a));
 if(!b||hw>b.hw+0.01||(Math.abs(hw-b.hw)<0.01&&xw<b.xw))b={id:r.id,hw,xw,a}}return b}
function da(el,t,qnh){if(el==null||t==null)return null;const pa=el+((qnh||1013.25)-1013.25)*-30,isa=15-2*el/1000;return Math.round(pa+120*(t-isa))}
/** Visibility in km (capped at 10) from a METAR.
    1) Prefer the raw ICAO metres group (WMO FM 15 / Annex 3: 4 digits, 9999 = 10 km or more), so 5000 m stays exactly 5.0 km
       instead of AWC's rounded statute-mile value (3.11 SM x 1.609 = 4.99 km, which used to give a false NO-GO).
    2) Else the AWC JSON 'visib' field, which is ALWAYS statute miles (AWC Data API schema): "10+", "6+", "3", "1 1/2", "1/2", "M1/4".
    Returns null when visibility is missing (//// or absent). */
function visKm(raw,visib){const b=' '+metarBody(raw)+' ';
 if(/\sCAVOK\s/.test(b))return 10;
 const mm=/\s\d{3}(?:\d{2,3}|\/\/)(?:G\d{2,3})?(?:KT|MPS)\s(?:\d{3}V\d{3}\s)?(\d{4})(?:NDV)?\s/.exec(b);
 if(mm)return mm[1]==='9999'?10:Math.min(10,+mm[1]/1000);
 return smKm(visib)}
function smKm(v){if(v==null||v==='')return null;if(typeof v==='number')return Math.min(10,v*1.609344);
 const t=String(v).trim().replace(/SM$/,'').replace(/^[PM]/,'').replace(/\+$/,'');
 const f=/^(?:(\d+)\s+)?(\d+)\/(\d+)$/.exec(t);let sm;
 if(f)sm=(f[1]?+f[1]:0)+(+f[2])/(+f[3]);else if(/^\d+(\.\d+)?$/.test(t))sm=+t;else return null;
 return Math.min(10,sm*1.609344)}
/** Ceiling (ft) from AWC cloud list; BKN/OVC/VV/OVX. If a VV/OVX layer has no base, read VVhhh from the raw METAR;
    VV/// (sky obscured, height unknown) is treated as 0 ft so it can never read as "no ceiling". */
function ceilOf(clouds,raw){const cl=[];for(const c of clouds||[]){if(!/BKN|OVC|VV|OVX/.test(c.cover))continue;
  if(c.base!=null)cl.push(c.base);else if(/BKN|OVC/.test(c.cover)&&!/VV|OVX/.test(c.cover))cl.push(0); /* BKN///: base unknown -> treated as 0 ft, never 'no ceiling' */ else if(/VV|OVX/.test(c.cover)){const vv=/\sVV(\d{3}|\/\/\/)(?=\s)/.exec(' '+metarBody(raw)+' ');cl.push(vv&&vv[1]!=='///'?+vv[1]*100:0)}}
 if(!cl.length){const vv=/\sVV(\d{3}|\/\/\/)(?=\s)/.exec(' '+metarBody(raw)+' ');if(vv)cl.push(vv[1]==='///'?0:+vv[1]*100)}
 return cl.length?Math.min(...cl):null}
function obsOf(ad,S){const m=S.metar[ad.ic];if(m){const cl=ceilOf(m.clouds,m.rawOb);
  const body=metarBody(m.rawOb);let vk=visKm(m.rawOb,m.visib);
  return{src:'off',wd:m.wdir==='VRB'?null:+m.wdir,vrb:m.wdir==='VRB',ws:m.wspd==null?null:m.wspd,g:m.wgst||null,vis:vk,ceil:cl,t:m.temp,qnh:m.altim,time:m.obsTime*1000,raw:m.rawOb,taf:S.taf[ad.ic]||null,
  cavok:/CAVOK/.test(m.rawOb||''),wx:body,cnr:/(?:^|\s)(?:BKN|OVC|VV)\/\/\/(?=\s|$|CB|TCU)/.test(body),trend:metarTrend(m.rawOb),vg:varGroup(m.rawOb),
  // model fallback visibility (km) for when the METAR omits it
  mvis:S.om&&S.om[ad.ic]&&S.om[ad.ic].current&&S.om[ad.ic].current.visibility!=null?Math.min(10,S.om[ad.ic].current.visibility/1000):null}}
 const o=S.om[ad.ic];if(!o)return null;const c=o.current;
 return{src:'model',wd:c.wind_direction_10m,ws:Math.round(c.wind_speed_10m),g:Math.round(c.wind_gusts_10m),vis:c.visibility!=null?Math.min(10,c.visibility/1000):null,
  ceil:c.cloud_base!=null&&c.cloud_cover_low>=63?Math.round(c.cloud_base*3.281/100)*100:null,low:c.cloud_cover_low,cc:c.cloud_cover,t:c.temperature_2m,dp:c.dew_point_2m,qnh:c.pressure_msl,time:Date.parse(c.time+'Z')}}
const LV={note:0,go:0,caution:1,nogo:2,noiap:2};
function status(ad,ob,acId,rules,P,now){
 const ac=AC.find(a=>a.id===acId)||null,F=[];const add=(lv,txt,k)=>F.push({lv,txt,k});
 const si=sunInfo(ad.la,ad.lo,now);let wind=null,dA=null;
 if(ad.heliport||(typeof window!=='undefined'&&window.AD_CLASS&&window.AD_CLASS[ad.ic]))return{s:'none',heli:1,why:'Heliport \u2014 no GO / CAUTION / NO-GO verdict',si,F};
 if(!ob)return{s:'none',why:'No report or model data',si};
 if(ob.src==='off'&&/\sNIL\s*=?\s*$/.test(' '+metarBody(ob.raw)))return{s:'none',why:'METAR NIL (no report)',si,F,ob};
 // rules
 if(rules==='ifr'){
  if(!P.ir)add('nogo','IFR needs an instrument rating','rating');
  if(ad.iap===false)return{s:'noiap',why:'No IFR approach published (AIP AD 2.24)',si,F,ob};
  if(ad.iap==null)add('caution','IFR approach unknown — no AIP AD 2.24 on file','iap');
  const ic=Math.max(IFRF.ceil,P.iceil||IFRF.ceil),iv=Math.max(IFRF.vis,P.ivis||IFRF.vis);
  if(ob.cnr)add('nogo','Cloud height not reported (BKN/OVC///) — treat as below minimums','cnr');
 else if(ob.ceil!=null&&ob.ceil<ic)add('nogo',(P.iceil&&ic>IFRF.ceil?'Your IFR ceiling ':'Ceiling below CAT I floor ')+ic+' ft (now '+ob.ceil+')','ceil');
  else if(ob.ceil!=null&&ob.ceil<ic*1.2)add('caution','Ceiling '+ob.ceil+' ft, near '+ic+' ft','ceil');
  if(ob.vis!=null&&ob.vis<iv)add('nogo','Visibility '+ob.vis.toFixed(1)+' km below '+iv+' km','vis');
  else if(ob.vis!=null&&ob.vis<iv*1.2)add('caution','Visibility '+ob.vis.toFixed(1)+' km, near '+iv+' km','vis');
  if((ob.ceil!=null&&ob.ceil<VFR.ceil)||(ob.vis!=null&&ob.vis<VFR.vis))add('caution','IMC — check the approach plate minima','imc');
 }else{
  const c=Math.max(VFR.ceil,P.ceil),v=Math.max(VFR.vis,P.vis),pc=P.ceil>VFR.ceil,pv=P.vis>VFR.vis;
  // CAR 91.06.21: 5 km / 1500 ft applies inside a CTR/ATZ. Class F/G: 5 km, clear of cloud, surface in sight,
  // so a ceiling under 1500 ft at an uncontrolled field is CAUTION, not a legal NO-GO. Unknown category = controlled.
  const ctl=ad.cat!=='u';
  // Order matters so the verdict only gets stricter as the ceiling drops (monotonic):
  //  1) below the hard floor -> NO-GO everywhere (APP POLICY POL.ceilFloor = 1000 ft: a standard 1000 ft AGL circuit
  //     cannot be flown clear of cloud; Annex 2 4.6 / CAR 91.06.32 500 ft minimum height leaves no margin);
  //  2) controlled field below 1500 ft -> NO-GO (CAR 91.06.21 Table 1);
  //  3) below YOUR personal limit -> NO-GO, whatever the airspace;
  //  4) uncontrolled field below 1500 ft -> CAUTION (Table 2 Class F/G: clear of cloud, surface in sight).
  if(ob.cnr)add('nogo','Cloud height not reported (BKN/OVC///) — treat as below minimums','cnr');
 else if(ob.ceil!=null&&ob.ceil<POL.ceilFloor)add('nogo','Ceiling '+ob.ceil+' ft — below '+POL.ceilFloor+' ft, no VFR circuit clear of cloud','ceil');
  else if(ctl&&ob.ceil!=null&&ob.ceil<VFR.ceil)add('nogo','Ceiling '+ob.ceil+' ft below 1500 ft (CTR/ATZ VFR minimum)','ceil');
  else if(pc&&ob.ceil!=null&&ob.ceil<c)add('nogo','Your ceiling limit '+c+' ft (now '+ob.ceil+')','ceil');
  else if(ob.ceil!=null&&ob.ceil<VFR.ceil)add('caution','Ceiling '+ob.ceil+' ft below 1500 ft — uncontrolled field, stay clear of cloud','ceil');
  else if(ob.ceil!=null&&ob.ceil<c*1.2)add('caution','Ceiling '+ob.ceil+' ft, within 20% of '+c+' ft','ceil');
  if(ob.vis!=null&&ob.vis<VFR.vis)add('nogo','Visibility '+ob.vis.toFixed(1)+' km below VFR 5 km','vis');
  else if(ob.vis!=null&&ob.vis<v)add('nogo','Your visibility limit '+v+' km (now '+ob.vis.toFixed(1)+')','vis');
  else if(ob.vis!=null&&ob.vis<v*1.2)add('caution','Visibility '+ob.vis.toFixed(1)+' km, within 20% of '+v+' km','vis');
 }
 // Missing visibility / model low cloud: applies to VFR AND IFR (was VFR-only, so IFR read missing vis as GO).
 // Missing vis with no model value at all is NO-GO: nothing confirms the 5 km minimum (CAR 91.06.21).
 if(ob.src==='off'&&ob.vis==null&&!ob.cavok)add(ob.mvis!=null?'caution':'nogo','Visibility not in METAR'+(ob.mvis!=null?', model shows '+ob.mvis.toFixed(1)+' km':', no model value'),'vis');
 if(ob.src==='model'&&ob.ceil==null&&ob.low>=75)add('caution','Model shows '+ob.low+'% low cloud','low');
 // present weather (METAR body only)
 // Applies to IFR too: TS/CB/SQ/FC/GR and freezing precipitation are hazards for light aircraft regardless of
 // flight rules (FAA AIM 7-1 thunderstorm and icing guidance). APP POLICY, not a CAR limit.
 if(ob.wx){const w=wxScan(ob.wx.split(/\s+/).slice(2).join(' '));   // skip 'METAR FAxx' / station id
  if(w.nogo.length)add('nogo','Hazardous weather in METAR: '+w.nogo.join(' '),'wx');
  else if(w.caut.length)add('caution','Weather: '+w.caut.join(' '),'wx')}
 // METAR trend (TEMPO/BECMG, next 2 h): thunderstorm-type weather = NO-GO (MT 30 Oct 2026), other hazards CAUTION
 if(ob.trend){const w=wxScan(ob.trend.replace(/^(TEMPO|BECMG)\s*/,''));const ty=/^BECMG/.test(ob.trend)?'BECMG':'TEMPO';
  if(w.nogo.length)add('nogo','METAR trend '+ty+': '+w.nogo.join(' ')+' (forecast within 2 h)','trend');
  else if(w.caut.length)add('caution','METAR trend '+ty+': '+w.caut.join(' '),'trend')}
 // wind
 const lim=ac?(ac.xw==null?P.xw:Math.min(ac.xw,P.xw)):Math.min(POL.defXw,P.xw),
  who=!ac?'No aircraft selected, default '+lim:ac.xw!=null&&ac.xw<=P.xw?ac.id+' limit '+ac.xw:'Your crosswind limit '+P.xw;
 const tw=b=>{const t=Math.round(-b);if(t<1)return;const lv=t>POL.twMax?'nogo':t>POL.tw?'caution':null;   // rule 4
  if(lv)add(lv,'Tailwind '+t+' kt','tw')};
 const xwChk=(X,GX,rwy,pre)=>{const M=Math.max(X,GX);   // rule 3: >100% NO-GO, >80% CAUTION
  if(X>lim)add('nogo',pre+'rosswind '+X+' kt'+rwy+' ('+who+')','xw');
  else if(GX>lim)add('nogo','Gust crosswind '+GX+' kt'+rwy+' ('+who+')','xw');
  else if(M>POL.xwGo*lim)add('caution',pre+'rosswind '+M+' kt'+rwy+' ('+who+')','xw')};
 // Missing wind (/////KT or no wspd): never read as calm.
 if(ob.ws==null)add('caution','Wind not reported — crosswind and tailwind not checked','wind');
 else if(ob.vrb){
  // Rule 2: VRB 0-6 kt with no gust = GO with a note. Otherwise the direction is unknown, so the worst case
  // (mean AND gust as a full crosswind) is used: above the limit NO-GO, else CAUTION. VRB05G20 is never GO.
  const G=Math.max(ob.ws,ob.g||0);
  if(ob.ws<=POL.vrbGo&&!ob.g){if(ob.ws>0)add('note','Variable wind '+ob.ws+' kt: direction unknown','vrb')}
  else if(G>lim)add('nogo','Variable wind '+ob.ws+(ob.g?'G'+ob.g:'')+' kt — possible full crosswind above '+lim+' kt','vrb');
  else add('caution','Variable wind '+ob.ws+(ob.g?'G'+ob.g:'')+' kt — direction unknown, any runway may have crosswind/tailwind','vrb');
 }else if(ad.rw&&ad.rw.length&&ob.wd!=null&&ob.ws>0){let b=best(ad.rw,ob.wd,ob.ws);
  // Variation group: keep the runway chosen on the mean wind, rate the worst crosswind AND tailwind inside the range.
  if(ob.vg){const rw=ad.rw.filter(r=>r.id===b.id),w=worstIn(rw,ob.vg.a,ob.vg.b,ob.ws),m0=b.xw;
   b=Object.assign(b,w.xw>m0?{xw:w.xw,a:(w.xwD-rw[0].true)*R}:{},{hw:Math.min(b.hw,w.twMin)})}
  wind=b;const gx=ob.g?Math.abs(ob.g*Math.sin(b.a)):b.xw;b.gx=gx;
  xwChk(Math.round(b.xw),Math.round(gx),' on RWY '+b.id+(ob.vg?' (worst of '+ob.vg.a+'V'+ob.vg.b+')':''),'C');
  if(b.hw<-0.5)tw(b.hw)
 }else if(ob.ws>0&&(!ad.rw||!ad.rw.length)&&!ad.heli)add('caution','Runway headings unavailable — crosswind not checked','rwy');
 if(ac&&ac.xw==null)add('caution',ac.n+' POH crosswind not verified — using yours ('+P.xw+' kt)','acx');
 // Steady-wind cap (APP POLICY): a mean wind above your gust limit is NO-GO; from POL.wsCaution kt it is CAUTION,
 // even straight down the runway (mechanical turbulence, ground handling).
 if(ob.ws!=null&&ob.ws>P.gust)add('nogo','Wind '+ob.ws+' kt above your gust limit '+P.gust+' kt','ws');
 else if(ob.ws!=null&&ob.ws>=POL.wsCaution)add('caution','Strong wind '+ob.ws+' kt','ws');
 if(ob.g&&ob.g>P.gust)add('nogo','Your gust limit '+P.gust+' kt (gusting '+ob.g+')','g');
 else if(ob.g&&ob.ws!=null&&ob.g-ob.ws>POL.gustSpread)add('caution','Gust spread '+(ob.g-ob.ws)+' kt ('+ob.ws+'G'+ob.g+')','g');
 // night (CAR Part 1: 15 min after sunset to 15 min before sunrise)
 if(rules!=='ifr'&&si.isNight&&!P.night)add('nogo','Night not selected (after sunset)','night');
 else if(rules!=='ifr'&&!si.isNight&&!P.night&&si.nightFrom-now<POL.nightPreMin*6e4&&si.nightFrom>now)add('caution','Night in '+Math.round((si.nightFrom-now)/6e4)+' min, Night not selected','night');
 // density altitude
 dA=da(ad.el,ob.t,ob.qnh);const daL=ad.el!=null?ad.el+POL.daAbove:null;
 if(dA!=null&&daL!=null&&dA>daL)add('caution','Density altitude '+dA.toLocaleString('en-ZA')+' ft (more than '+POL.daAbove+' ft above the field)','da');
 // Rule 6: TAF trends inside the flight window (VFR only; uses the VFR minima that apply to this flight)
 if(rules!=='ifr'&&ob.taf){const tc=Math.max(VFR.ceil,P.ceil),tv=Math.max(VFR.vis,P.vis);for(const f of tafScan(ob.taf,now,tv,tc))add(f.lv,f.txt,f.k)}
 // Report age (APP POLICY). METARs are issued hourly or half-hourly (ICAO Annex 3 4.4; SA AIP GEN 3.5), so
 // >75 min means at least one report was missed -> CAUTION; >180 min the report no longer describes now -> NO-GO.
 if(ob.src==='off'&&ob.time){const age=Math.round((now-ob.time)/6e4);
  if(age>POL.ageNogo)add('nogo','METAR is '+Math.floor(age/60)+' h '+(age%60)+' min old — no current report','age');
  else if(age>POL.ageCaution)add('caution','METAR is '+age+' min old','age')}
 // Model-only data is an estimate, never an observation: it can't show as a plain GO.
 if(ob.src==='model')add('caution','Model estimate only — no METAR for this field','model');
 F.sort((a,b)=>LV[b.lv]-LV[a.lv]);const s=F.length&&F[0].lv!=='note'?F[0].lv:'go';
 const why=F.length?F[0].txt:(wind?'Wind on RWY '+wind.id+': '+Math.round(Math.max(0,wind.hw))+' kt head, '+Math.round(wind.xw)+' kt cross':'Within limits');
 return{s,why,F,wind,da:dA,si,ob,lim,ac}}
G.WST={metarTrend,AC,PRE,VFR,IFRF,POL,DA_ABOVE_FIELD_FT,wxScan,tafSegs,tafScan,worstIn,metarBody,varGroup,visKm,smKm,ceilOf,sun,sunInfo,best,da,obsOf,status};
if(typeof module!=='undefined')module.exports=G.WST;
})(typeof window!=='undefined'?window:globalThis);
