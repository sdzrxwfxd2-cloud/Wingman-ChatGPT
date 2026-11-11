/* Wingman status engine (pure, no DOM). Guidance only. */
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
 {id:'DA40',n:'Diamond DA40',xw:20,src:'Diamond spec sheet (not AFM)',v:1},
 {id:'P2008',n:'Tecnam P2008',xw:15,src:'P2008 JC AFM §2.18',v:1}];
const PRE={ // conservative app defaults, NOT regulation
 ppl:{n:"PPL",xw:12,gust:25,ceil:2500,vis:8,night:0,ir:0},
 ir:{n:'Instrument rating',xw:12,gust:25,ceil:2000,vis:6,night:1,ir:1,iceil:600,ivis:2},
 cpl:{n:'CPL',xw:15,gust:25,ceil:1500,vis:5,night:1,ir:0}};
const VFR={vis:5,ceil:1500,src:'CAR 2011 Part 91.06.21 Table 1 (CTR/ATZ: no T/O or landing if ground vis < 5 km or ceiling < 1 500 ft)'};
const IFRF={vis:0.55,ceil:200,src:'Lowest possible CAT I (ICAO Annex 6: DH ≥ 200 ft, RVR ≥ 550 m). Not this aerodrome\u2019s published minima — use the approach plate.'};
const R=Math.PI/180;
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
function obsOf(ad,S){const m=S.metar[ad.ic];if(m){const cl=(m.clouds||[]).filter(c=>/BKN|OVC|VV|OVX/.test(c.cover)&&c.base!=null).map(c=>c.base);
  let v=String(m.visib??'');let vk=/CAVOK/.test(m.rawOb||'')||/^(6|10)/.test(v)?10:(isNaN(parseFloat(v))?null:Math.min(10,parseFloat(v)*1.609));
  return{src:'off',wd:m.wdir==='VRB'?null:+m.wdir,vrb:m.wdir==='VRB',ws:m.wspd||0,g:m.wgst||null,vis:vk,ceil:cl.length?Math.min(...cl):null,t:m.temp,qnh:m.altim,time:m.obsTime*1000,raw:m.rawOb,taf:S.taf[ad.ic]||null}}
 const o=S.om[ad.ic];if(!o)return null;const c=o.current;
 return{src:'model',wd:c.wind_direction_10m,ws:Math.round(c.wind_speed_10m),g:Math.round(c.wind_gusts_10m),vis:c.visibility!=null?Math.min(10,c.visibility/1000):null,
  ceil:c.cloud_base!=null&&c.cloud_cover_low>=63?Math.round(c.cloud_base*3.281/100)*100:null,low:c.cloud_cover_low,cc:c.cloud_cover,t:c.temperature_2m,dp:c.dew_point_2m,qnh:c.pressure_msl,time:Date.parse(c.time+'Z')}}
const LV={go:0,caution:1,nogo:2,noiap:2};
function status(ad,ob,acId,rules,P,now){
 const ac=AC.find(a=>a.id===acId)||AC[0],F=[];const add=(lv,txt,k)=>F.push({lv,txt,k});
 const si=sunInfo(ad.la,ad.lo,now);let wind=null,dA=null;
 if(!ob)return{s:'none',why:'No report or model data',si};
 // rules
 if(rules==='ifr'){
  if(!P.ir)add('nogo','IFR needs an instrument rating','rating');
  if(ad.iap===false)return{s:'noiap',why:'No IFR approach published (AIP AD 2.24)',si,F,ob};
  if(ad.iap==null)add('caution','IFR approach unknown — no AIP AD 2.24 on file','iap');
  const ic=Math.max(IFRF.ceil,P.iceil||IFRF.ceil),iv=Math.max(IFRF.vis,P.ivis||IFRF.vis);
  if(ob.ceil!=null&&ob.ceil<ic)add('nogo',(P.iceil&&ic>IFRF.ceil?'Your IFR ceiling ':'Ceiling below CAT I floor ')+ic+' ft (now '+ob.ceil+')','ceil');
  else if(ob.ceil!=null&&ob.ceil<ic*1.2)add('caution','Ceiling '+ob.ceil+' ft, near '+ic+' ft','ceil');
  if(ob.vis!=null&&ob.vis<iv)add('nogo','Visibility '+ob.vis.toFixed(1)+' km below '+iv+' km','vis');
  else if(ob.vis!=null&&ob.vis<iv*1.2)add('caution','Visibility '+ob.vis.toFixed(1)+' km, near '+iv+' km','vis');
  if((ob.ceil!=null&&ob.ceil<VFR.ceil)||(ob.vis!=null&&ob.vis<VFR.vis))add('caution','IMC — check the approach plate minima','imc');
 }else{
  const c=Math.max(VFR.ceil,P.ceil),v=Math.max(VFR.vis,P.vis),pc=P.ceil>VFR.ceil,pv=P.vis>VFR.vis;
  if(ob.ceil!=null&&ob.ceil<VFR.ceil)add('nogo','Ceiling '+ob.ceil+' ft below VFR 1500 ft','ceil');
  else if(ob.ceil!=null&&ob.ceil<c)add('nogo','Your ceiling limit '+c+' ft (now '+ob.ceil+')','ceil');
  else if(ob.ceil!=null&&ob.ceil<c*1.2)add('caution','Ceiling '+ob.ceil+' ft, within 20% of '+c+' ft','ceil');
  if(ob.vis!=null&&ob.vis<VFR.vis)add('nogo','Visibility '+ob.vis.toFixed(1)+' km below VFR 5 km','vis');
  else if(ob.vis!=null&&ob.vis<v)add('nogo','Your visibility limit '+v+' km (now '+ob.vis.toFixed(1)+')','vis');
  else if(ob.vis!=null&&ob.vis<v*1.2)add('caution','Visibility '+ob.vis.toFixed(1)+' km, within 20% of '+v+' km','vis');
  if(ob.src==='model'&&ob.ceil==null&&ob.low>=75)add('caution','Model shows '+ob.low+'% low cloud','low');
 }
 // wind
 const lim=ac.xw==null?P.xw:Math.min(ac.xw,P.xw),who=ac.xw!=null&&ac.xw<=P.xw?ac.id+' limit '+ac.xw:'Your crosswind limit '+P.xw;
 if(ad.rw&&ad.rw.length&&ob.wd!=null&&ob.ws>0){const b=best(ad.rw,ob.wd,ob.ws);wind=b;const gx=ob.g?Math.abs(ob.g*Math.sin(b.a)):b.xw;b.gx=gx;
  const X=Math.round(b.xw),GX=Math.round(gx);
  if(X>lim)add('nogo','Crosswind '+X+' kt on RWY '+b.id+' ('+who+')','xw');
  else if(GX>lim)add('caution','Gust crosswind '+GX+' kt on RWY '+b.id+' ('+who+')','xw');
  else if(X>=0.8*lim)add('caution','Crosswind '+X+' kt on RWY '+b.id+' ('+who+')','xw');
  if(b.hw<-0.5)add('caution','Tailwind '+Math.round(-b.hw)+' kt on every runway','tw');
 }else if(ob.vrb&&ob.ws>=0.8*lim)add('caution','Variable wind '+ob.ws+' kt','xw');
 else if(!ad.rw||!ad.rw.length)add('caution','Runway headings unavailable — crosswind not checked','rwy');
 if(ac.xw==null)add('caution',ac.n+' POH crosswind not verified — using yours ('+P.xw+' kt)','acx');
 if(ob.g&&ob.g>P.gust)add('nogo','Your gust limit '+P.gust+' kt (gusting '+ob.g+')','g');
 else if(ob.g&&ob.g>=25)add('caution','Gusts '+ob.g+' kt','g');
 // night (CAR Part 1: 15 min after sunset to 15 min before sunrise)
 if(rules!=='ifr'&&si.isNight&&!P.night)add('nogo','Night not selected (after sunset)','night');
 else if(rules!=='ifr'&&!si.isNight&&!P.night&&si.nightFrom-now<60*6e4&&si.nightFrom>now)add('caution','Night in '+Math.round((si.nightFrom-now)/6e4)+' min, Night not selected','night');
 // density altitude
 dA=da(ad.el,ob.t,ob.qnh);if(dA!=null&&dA>=8000)add('caution','Density altitude '+dA.toLocaleString('en-ZA')+' ft (hot and high)','da');
 F.sort((a,b)=>LV[b.lv]-LV[a.lv]);const s=F.length?F[0].lv:'go';
 const why=F.length?F[0].txt:(wind?'Wind on RWY '+wind.id+': '+Math.round(Math.max(0,wind.hw))+' kt head, '+Math.round(wind.xw)+' kt cross':'Within limits');
 return{s,why,F,wind,da:dA,si,ob,lim,ac}}
G.WST={AC,PRE,VFR,IFRF,sun,sunInfo,best,da,obsOf,status};
if(typeof module!=='undefined')module.exports=G.WST;
})(typeof window!=='undefined'?window:globalThis);
