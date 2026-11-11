/* Wingman · AIP runway diagrams (v2/rwy). Self-contained; needs rwy-data.js loaded first.
   API: WMRWY.mount(el, icao, {wind:{dir,spd,gst,src}, zoom, focus}) · WMRWY.setWind(icao, wind) · WMRWY.refresh()
   Reads theme from <html data-theme=day|night data-pal=white|beige|black|purple>, aircraft from localStorage 'wm-ac'. */
(function(G){
'use strict';
const D=()=>G.WMRWY_DATA&&G.WMRWY_DATA.ad||{};
const R=Math.PI/180,NS='http://www.w3.org/2000/svg';
const AC_FALLBACK={C172:[15,'Cessna 172','C172S POH §5 Fig 5-4'],PA28:[17,'PA-28','PA-28-161 AFM §4'],C152:[12,'Cessna 152','C152 POH §4'],SLG2:[15,'Sling 2','Sling LSA POH §2.5'],DA20:[20,'DA20-C1','DA20-C1 AFM'],DA42:[20,'DA42','DA42 QRH'],SLG4:[15,'Sling 4','Sling 4 POH §2.5'],C182:[15,'Cessna 182','C182T POH §5'],DA40:[20,'DA40','Diamond spec sheet'],P2008:[15,'Tecnam P2008','P2008 JC AFM §2.18']};
const WIND={},MOUNTS=new Set();
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function theme(){const h=document.documentElement,t=h.dataset.theme==='day'?'day':'night',p=h.dataset.pal||(t==='day'?'white':'black');
  const name=t==='day'?(p==='beige'?'champagne':'pearl'):(p==='purple'?'amethyst':'midnight');return{night:t==='night',name}}
function aircraft(){let id=null;try{id=localStorage.getItem('wm-ac')}catch(e){}if(!id)return null;
  const W=G.WST&&G.WST.AC&&G.WST.AC.find&&G.WST.AC.find(a=>a.id===id);if(W)return W.xw!=null?{id,n:W.n,xw:W.xw,src:W.src}:{id,n:W.n,xw:null,src:W.src};
  const f=AC_FALLBACK[id];return f?{id,n:f[1],xw:f[0],src:f[2]}:null}
function comps(brg,w){if(!w||w.dir==null||w.spd==null||brg==null)return null;const a=(w.dir-brg)*R,s=w.spd;
  return{h:Math.round(s*Math.cos(a)),x:Math.round(Math.abs(s*Math.sin(a))),side:Math.sin(a)>=0?'R':'L',gx:w.gst?Math.round(Math.abs(w.gst*Math.sin(a))):null}}
function lit(l,k){return l&&l[k]&&l[k].present===true}
function geom(A){ // local metres, x east, y north
  const pts=[];A.runways.forEach(r=>{if(r.geo){pts.push(r.geo.thr_a,r.geo.thr_b)}});
  const lat0=pts.length?pts.reduce((s,p)=>s+p[0],0)/pts.length:A.lat,lon0=pts.length?pts.reduce((s,p)=>s+p[1],0)/pts.length:A.lon;
  const P=p=>[(p[1]-lon0)*Math.cos(lat0*R)*111320,(p[0]-lat0)*110574];
  const arp=A.arp?P(A.arp):[0,0];
  const out=A.runways.map((r,i)=>{const ea=r.ends[0],eb=r.ends[1]||null;let u,Pa,Pb,Ta,Tb,L=r.len,approx=false;
    const da=ea.displaced_thr_m||0,db=eb&&eb.displaced_thr_m||0;
    if(r.geo){Ta=P(r.geo.thr_a);Tb=P(r.geo.thr_b);const dx=Tb[0]-Ta[0],dy=Tb[1]-Ta[1],n=Math.hypot(dx,dy);u=[dx/n,dy/n];
      if(!L)L=n+da+db;Pa=[Ta[0]-da*u[0],Ta[1]-da*u[1]];Pb=[Pa[0]+L*u[0],Pa[1]+L*u[1]];}
    else{const b=ea.true_brg!=null?ea.true_brg:(eb&&eb.true_brg!=null?(eb.true_brg+180)%360:null);if(b==null||!L)return null;
      u=[Math.sin(b*R),Math.cos(b*R)];approx=true;Pa=[arp[0]-L/2*u[0],arp[1]-L/2*u[1]];Pb=[arp[0]+L/2*u[0],arp[1]+L/2*u[1]];}
    Ta=[Pa[0]+da*u[0],Pa[1]+da*u[1]];Tb=[Pb[0]-db*u[0],Pb[1]-db*u[1]];
    return{apxB:/^APPROX/.test((ea.src||{}).true_brg||''),i,r,ea,eb,u,n:[u[1],-u[0]],Pa,Pb,Ta,Tb,L,W:r.wid||(r.len?Math.max(10,r.len/60):20),approx}}).filter(Boolean);out.P=P;return out}
function apchLen(raw){if(!raw)return 0;const m=String(raw).match(/(\d{3,4})\s*M/i);if(m)return+m[1];if(/PALS|CAT\s*I|CALVERT|ALSF/i.test(raw))return 900;if(/SALS|SIMPLE|MALS/i.test(raw))return 420;return 300}
function apchPublishedLen(raw){return !!(raw&&/(\d{3,4})\s*M/i.test(raw))}
function lastYellow(raw){const m=String(raw||'').match(/last\s*(\d{3,4})\s*M[^A-Za-z]*(?:\w+\s*)?(yellow|amber)/i)||String(raw||'').match(/last\s*(\d{3,4})\s*M/i);return m&&/yellow|amber/i.test(raw)?+m[1]:0}
function best(A,w){let b=null;A.runways.forEach((r,ri)=>r.ends.forEach(e=>{const c=comps(e.true_brg,w);if(c&&(!b||c.h>b.c.h||(c.h===b.c.h&&c.x<b.c.x)))b={ri,e,c}}));return b&&b.c.h>=-1?b:(b&&w&&w.spd<=2?b:b)}
function el(t,a,p){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);p&&p.appendChild(e);return e}
let UID=0;
function render(box,icao,o){o=o||{};const A=D()[icao];box.classList.add('wmr');
  if(!A){box.innerHTML='<div class="wmr-empty">No AIP AD 2 runway data</div>';return}
  const th=theme(),night=th.night,w=o.wind||WIND[icao]||(G.WMRWY_WIND&&G.WMRWY_WIND[icao])||null,ac=aircraft();
  const RW=geom(A),uid='r'+(++UID);
  const VW=360,pad=o.pad||30;let VH=o.vh||270;
  const bst=best(A,w),actEnd={};RW.forEach(g=>{actEnd[g.i]=bst&&bst.ri===g.i?bst.e.id:null});
  // bbox in metres incl. approach lights + stopways + circuit sketch
  let xs=[],ys=[];const add=p=>{xs.push(p[0]);ys.push(p[1])};
  RW.forEach(g=>{const ext=(e,P,sgn)=>{const a=night&&e&&lit(e.lighting,'apch')?apchLen(e.lighting.apch.raw):0;const s=e&&e.stopway_m||0;return Math.max(a,0)};
    const ea=g.ea,eb=g.eb;const ba=ext(ea),bb=ext(eb);
    add([g.Ta[0]-g.u[0]*ba,g.Ta[1]-g.u[1]*ba]);add([g.Tb[0]+g.u[0]*bb,g.Tb[1]+g.u[1]*bb]);
    const sa=ea.stopway_m||0,sb=eb&&eb.stopway_m||0;add([g.Pb[0]+g.u[0]*sa,g.Pb[1]+g.u[1]*sa]);add([g.Pa[0]-g.u[0]*sb,g.Pa[1]-g.u[1]*sb]);
    [g.W/2+12,-g.W/2-12].forEach(o_=>{add([g.Pa[0]+g.n[0]*o_,g.Pa[1]+g.n[1]*o_]);add([g.Pb[0]+g.n[0]*o_,g.Pb[1]+g.n[1]*o_])})});
  const mnx=Math.min(...xs),mxx=Math.max(...xs),mny=Math.min(...ys),mxy=Math.max(...ys);
  if(!o.vh){const asp=(mxy-mny)/Math.max(mxx-mnx,1);VH=Math.round(Math.max(210,Math.min(320,(VW-2*pad)*asp+2*pad)))}
  const zoom=o.zoom||1;let s=Math.min((VW-2*pad)/Math.max(mxx-mnx,1),(VH-2*pad)/Math.max(mxy-mny,1))*zoom;
  let cx=(mnx+mxx)/2,cy=(mny+mxy)/2;
  if(o.focus){const g=RW.find(g=>g.ea.id===o.focus||(g.eb&&g.eb.id===o.focus));if(g){const e=g.ea.id===o.focus?'a':'b';const T=e==='a'?g.Ta:g.Tb,uu=e==='a'?g.u:[-g.u[0],-g.u[1]];cx=T[0]+uu[0]*o.focusAhead;cy=T[1]+uu[1]*o.focusAhead}}
  const S=p=>[VW/2+(p[0]-cx)*s,VH/2-(p[1]-cy)*s];
  const at=(g,along,lat)=>S([g.Pa[0]+g.u[0]*along+g.n[0]*lat,g.Pa[1]+g.u[1]*along+g.n[1]*lat]); // along from Pa, lat + = right of end a
  const ang=g=>Math.atan2(-g.u[1],g.u[0])/R; // screen angle of u
  const hdg=g=>(Math.atan2(g.u[0],g.u[1])/R+360)%360;
  const svg=el('svg',{viewBox:`0 0 ${VW} ${VH}`,class:'wmr-svg',role:'img','aria-label':`${A.name} runway diagram, north up`});
  const defs=el('defs',{},svg);
  defs.innerHTML=`<pattern id="${uid}as" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" class="wmr-asph"/><circle cx="1" cy="1" r=".45" class="wmr-grain"/><circle cx="3" cy="2.6" r=".35" class="wmr-grain"/></pattern>
  <pattern id="${uid}co" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" class="wmr-conc"/><path d="M0 .3H6M.3 0V6" class="wmr-joint"/></pattern>
  <pattern id="${uid}gr" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="5" height="5" class="wmr-grass"/><path d="M0 1.2H5M0 3.7H5" class="wmr-blade"/></pattern>
  <pattern id="${uid}gv" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" class="wmr-grav"/><circle cx="1" cy="1.4" r=".6" class="wmr-pebble"/><circle cx="3" cy="3" r=".5" class="wmr-pebble"/></pattern>
  <pattern id="${uid}un" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" class="wmr-unk"/><path d="M0 0V5" class="wmr-unkl"/></pattern>
  <filter id="${uid}gl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.5"/></filter><radialGradient id="${uid}hz" cx="50%" cy="42%" r="75%"><stop offset="55%" class="wmr-hz0"/><stop offset="100%" class="wmr-hz1"/></radialGradient>`;
  const fillFor=sf=>({asphalt:'as',concrete:'co',grass:'gr',gravel:'gv',earth:'gv'}[sf]||'un');
  // north arrow
  const na=el('g',{class:'wmr-north',transform:`translate(18 20)`},svg);na.innerHTML='<circle r="10" class="wmr-chip"/><path d="M0 -6.5 3.6 4 0 2.2 -3.6 4Z" class="wmr-narrow"/><text y="-13" class="wmr-n">N</text>';
  // scale bar
  const nice=[50,100,200,250,500,1000,2000];let sb=nice[0];for(const v of nice)if(v*s<=70)sb=v;
  const sg=el('g',{class:'wmr-scale',transform:`translate(${VW-14-sb*s} ${VH-12})`},svg);sg.innerHTML=`<path d="M0 -3V0H${(sb*s).toFixed(1)}V-3" class="wmr-sbar"/><text x="${(sb*s/2).toFixed(1)}" y="-6" class="wmr-sbt">${sb>=1000?sb/1000+' km':sb+' m'}</text>`;
  const gX=el('g',{class:'wmr-taxi'},svg),gC=el('g',{class:'wmr-circuits'},svg),gR=el('g',{class:'wmr-rwys'},svg),gL=el('g',{class:'wmr-lights'+(night?' on':'')},svg),gT=el('g',{class:'wmr-labels'},svg),gH=el('g',{class:'wmr-hits'},svg);
  const poly=(pts,a,p)=>el('polygon',Object.assign({points:pts.map(q=>q.map(v=>v.toFixed(2)).join(',')).join(' ')},a),p);
  let gLi=gL;const dot=(p,cls,r,par)=>el('circle',{cx:p[0].toFixed(2),cy:p[1].toFixed(2),r:((r||1.15)*.68).toFixed(2),class:cls},par||gLi);
  RW.forEach(g=>{const W2=g.W/2,isBest=bst&&bst.ri===g.i,pxW=g.W*s;
    const rect=(a0,a1,l0,l1)=>[at(g,a0,l0),at(g,a1,l0),at(g,a1,l1),at(g,a0,l1)];
    const grp=el('g',{class:'wmr-rw'+(isBest?' best':''),'data-i':g.i},gR);
    // stopways (beyond far end in take-off direction)
    const sa=g.ea.stopway_m||0,sb_=g.eb&&g.eb.stopway_m||0;
    if(sa)poly(rect(g.L,g.L+sa,-W2,W2),{class:'wmr-swy'},grp);
    if(sb_)poly(rect(-sb_,0,-W2,W2),{class:'wmr-swy'},grp);
    const vis=Math.max(pxW,2.4)/s/2; // visible half-width (min 2.4 px)
    if(isBest)poly(rect(-4/s,g.L+4/s,-vis-3/s,vis+3/s),{class:'wmr-halo'},grp);
    poly(rect(0,g.L,-vis,vis),{class:'wmr-surf'+(g.apxB?' apx':''),fill:`url(#${uid}${fillFor(g.r.surface)})`},grp);
    if(pxW>=5){ // centre line + threshold bars
      const c1=at(g,(g.Ta===g.Pa?0:g.ea.displaced_thr_m||0)+ (g.L*.06),0),c2=at(g,g.L-(g.eb&&g.eb.displaced_thr_m||0)-g.L*.06,0);
      el('line',{x1:c1[0],y1:c1[1],x2:c2[0],y2:c2[1],class:'wmr-cl'},grp)}
    // displaced thresholds
    [[g.ea,0,1],[g.eb,g.L,-1]].forEach(([e,base,dir])=>{if(!e)return;const d=e.displaced_thr_m||0;const t=at(g,base+dir*d,-vis),t2=at(g,base+dir*d,vis);
      el('line',{x1:t[0],y1:t[1],x2:t2[0],y2:t2[1],class:'wmr-thr'},grp);
      if(d){poly(rect(Math.min(base,base+dir*d),Math.max(base,base+dir*d),-vis,vis),{class:'wmr-disp'},grp);
        const n=Math.max(1,Math.min(4,Math.floor(d*s/9)));for(let k=0;k<n;k++){const a0=base+dir*d*(k+.5)/n,p=at(g,a0,0),q=at(g,a0+dir*Math.min(d/n*.6,6/s),0);
          el('path',{d:`M${p[0]} ${p[1]}L${q[0]} ${q[1]}`,class:'wmr-arrow','marker-end':''},grp)}}});
    // circuit (published direction only) for the end in use by wind, else the first end that has one
    const ends=[[g.ea,1],[g.eb,-1]].filter(x=>x[0]&&x[0].circuit);let ce=ends.find(x=>x[0].id===actEnd[g.i])||ends[0];
    ends.forEach(([e,dir])=>{const hand=e.circuit==='R'?1:-1,side=hand*dir,off=Math.max(g.L*.34,22/s),ext=g.L*.08,rr=off/2,l=side*off;
      const a0=-ext,a1=g.L+ext,pts=[];const arc=(cx_,c0,c1)=>{for(let k=0;k<=14;k++){const t=c0+(c1-c0)*k/14;pts.push(at(g,cx_+Math.sin(t)*rr,l/2-Math.cos(t)*rr*Math.sign(l)))}};
      pts.push(at(g,a0,0));arc(a1,0,Math.PI);pts.push(at(g,a0,l));arc(a0,Math.PI,2*Math.PI);
      // fix arc at a0 to bulge backwards
      for(let k=pts.length-15;k<pts.length;k++){}
      const act=(e===(ce&&ce[0]))&&(bst?isBest:g.i===0);const pth=el('path',{d:'M'+pts.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join('L')+'Z',class:'wmr-circ'+(act&&isBest?' act':'')+(act?' show':''),'data-i':g.i,'data-e':e.id},gC);
      const m=at(g,g.L/2,l),m2=at(g,g.L/2-dir*Math.max(g.L*.05,5/s),l),m3=at(g,g.L/2-dir*Math.max(g.L*.05,5/s)+dir*2.6/s,l+side*2.2/s),m4=at(g,g.L/2-dir*Math.max(g.L*.05,5/s)+dir*2.6/s,l-side*2.2/s);
      el('path',{d:`M${m[0].toFixed(1)} ${m[1].toFixed(1)}L${m2[0].toFixed(1)} ${m2[1].toFixed(1)}M${m3[0].toFixed(1)} ${m3[1].toFixed(1)}L${m2[0].toFixed(1)} ${m2[1].toFixed(1)}L${m4[0].toFixed(1)} ${m4[1].toFixed(1)}`,class:'wmr-circ-ar'+(act?' show':''),'data-i':g.i,'data-e':e.id},gC);
      const tl=at(g,g.L/2+dir*g.L*.2,l);const t=el('text',{x:tl[0].toFixed(1),y:tl[1].toFixed(1),class:'wmr-ctext'+(act?' show':''),'data-i':g.i,'data-e':e.id},gC);t.textContent=`${e.circuit==='R'?'RH':'LH'} ${e.id}`});
    // labels: designators beyond each physical end
    [[g.ea,0,-1,hdg(g)],[g.eb,g.L,1,(hdg(g)+180)%360]].forEach(([e,base,dir,h])=>{if(!e)return;const ap=night&&lit(e.lighting,'apch')?apchLen(e.lighting.apch.raw):0;
      const sw=dir<0?(g.eb&&g.eb.stopway_m||0):(g.ea.stopway_m||0);const out=Math.max(ap,sw)*s+11;const p=at(g,base+dir*out/s,0);
      let hr=h>90&&h<270?h-180:h;const uu=dir<0?g.u:[-g.u[0],-g.u[1]];const t=el('text',{'data-i':g.i,x:p[0].toFixed(1),y:p[1].toFixed(1),'data-dx':(dir*g.u[0]).toFixed(3),'data-dy':(-dir*g.u[1]).toFixed(3),class:'wmr-des',transform:`rotate(${hr.toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)})`},gT);t.textContent=e.id});
    // dimension label along runway
    {let a=ang(g);if(a>90)a-=180;if(a<-90)a+=180;const side=(a===ang(g))?-1:1;const p=at(g,g.L/2,side*(vis+9/s));
      const t=el('text',{'data-i':g.i,x:p[0].toFixed(1),y:p[1].toFixed(1),class:'wmr-dim',transform:`rotate(${a.toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)})`},gT);t.textContent=g.r.len?`${g.r.len} × ${g.r.wid} m`:'size not published'}
    // NIGHT LIGHTS (only what AD 2.14 publishes)
    gLi=el('g',{'data-i':g.i},gL);
    if(night){const actId=actEnd[g.i]||g.ea.id,fromA=actId===g.ea.id;
      const eL=(g.ea.lighting&&g.ea.lighting.edge&&g.ea.lighting.edge.present)?g.ea.lighting:(g.eb&&g.eb.lighting&&g.eb.lighting.edge&&g.eb.lighting.edge.present?g.eb.lighting:null);
      if(eL){const raw=(fromA?g.ea:g.eb||g.ea).lighting&&((fromA?g.ea:g.eb||g.ea).lighting.edge||{}).raw||eL.edge.raw;const yl=lastYellow(raw);
        const step=Math.max(8/s,60);const n=Math.floor(g.L/step);for(let k=0;k<=n;k++){const a=k*g.L/n;const yel=yl&&(fromA?a>g.L-yl:a<yl);
          [-vis-1.2/s,vis+1.2/s].forEach(l=>dot(at(g,a,l),'wmr-l '+(yel?'y':'w'),1.05))}}
      [[g.ea,0,1,g.eb],[g.eb,g.L,-1,g.ea]].forEach(([e,base,dir,o_])=>{if(!e)return;const Lg=e.lighting;const d=e.displaced_thr_m||0;
        const nb=Math.max(3,Math.min(9,Math.round(vis*2*s/2.6)));
        const gD=el('g',{class:'dl','data-d':e.id},gLi);const dot2=(p,c,r)=>dot(p,c,r,gD);
        if(lit(Lg,'thr')){for(let k=0;k<nb;k++){const l=-vis+2*vis*k/(nb-1);dot2(at(g,base+dir*(d-1.4/s),l),'wmr-l g thr',1.35)}
          if(d||/WBAR|wing/i.test(Lg.thr.raw||'')&&!/no\s*w/i.test(Lg.thr.raw||''))for(const sd of[-1,1])for(let k=1;k<=3;k++)dot2(at(g,base+dir*(d-1.4/s),sd*(vis+k*2.4/s)),'wmr-l g thr',1.2)}
        // END lights of this end sit at the far physical end
        if(lit(Lg,'end')){const fe=dir>0?g.L:0;for(let k=0;k<nb;k++){const l=-vis+2*vis*k/(nb-1);dot2(at(g,fe+dir*(1.4/s)*-1,l),'wmr-l r end',1.35)}}
        if(lit(Lg,'apch')){const al=apchLen(Lg.apch.raw),stp=Math.max(30,5.5/s);for(let a=stp;a<=al;a+=stp)dot(at(g,base-dir*a,0),'wmr-l w ap',1.1);
          const bar=at(g,base-dir*Math.min(300,al),0);for(const sd of[-1,1])for(let k=1;k<=3;k++)dot(at(g,base-dir*Math.min(300,al),sd*k*2.6/s),'wmr-l w ap',1.0)}
        const P=Lg&&Lg.papi;if(P&&P.present&&P.side){const sides=P.side==='B'?[-1,1]:[P.side==='R'?1:-1];const units=P.units||4,along=base+dir*(d+Math.min(300,g.L*.18));
          sides.forEach(sd=>{for(let k=0;k<units;k++){const l=sd*dir*(vis+(4+k*3.4)*Math.sqrt(Math.min(zoom,4))/s);const p=at(g,along,l);const red=k<units/2; // inner units red, outer white (on slope)
            const z_=Math.sqrt(Math.min(zoom,4))*1.05;el('rect',{x:(p[0]-z_).toFixed(2),y:(p[1]-z_).toFixed(2),width:2*z_,height:2*z_,rx:(z_*.28).toFixed(2),class:'wmr-papi '+(red?'r':'w'),'data-papi':e.id},gLi)}})}
        })}
    // hit target ≥44px
    const h1=at(g,0,0),h2=at(g,g.L,0);el('line',{x1:h1[0],y1:h1[1],x2:h2[0],y2:h2[1],class:'wmr-hit','data-i':g.i,tabindex:0,role:'button','aria-label':`Runway ${g.r.name} details`},gH);
  });
  const TX=A.taxi;if(TX&&TX.ways&&TX.ways.length){const unv=TX.status!=='verified',lab={};
    const near=(q)=>RW.filter(g=>{const dx=q[0]-g.Pa[0],dy=q[1]-g.Pa[1],al=dx*g.u[0]+dy*g.u[1],la=dx*g.n[0]+dy*g.n[1];return al>-200&&al<g.L+200&&Math.abs(la)<g.W/2+160}).map(g=>g.i);
    const eS=TX.light_edge,cS=TX.light_centre,has=(sc,n)=>sc==='all'||(sc&&sc.all&&!n.some(x=>sc.except.includes(x)))||(Array.isArray(sc)&&n.some(x=>sc.includes(x)));
    const gTL=el('g',{class:'wmr-tlights'},gL);
    TX.ways.forEach(w=>{const M=w.g.map(p=>RW.P([p[0],p[1]])),Q=M.map(S);const rel=new Set();M.forEach(q=>near(q).forEach(i=>rel.add(i)));
      const wpx=Math.max((w.w||18)*s,1.4);const d='M'+Q.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join('L');
      el('path',{d,class:'wmr-twy'+(unv?' unv':''),'stroke-width':wpx.toFixed(2),'data-r':[...rel].join(' ')},gX);
      if(unv)el('path',{d,class:'wmr-twy-o','stroke-width':(wpx+1.2).toFixed(2),'data-r':[...rel].join(' ')},gX);
      let len=0;for(let k=1;k<Q.length;k++)len+=Math.hypot(Q[k][0]-Q[k-1][0],Q[k][1]-Q[k-1][1]);
      w.n.forEach(n=>{if(!lab[n]||lab[n].len<len)lab[n]={len,Q,rel}});
      if(night&&w.n!==undefined){const E=has(eS,w.n.length?w.n:['*'])&&(eS==='all'||(eS&&eS.all)||w.n.length),Cn=has(cS,w.n.length?w.n:['*'])&&(cS==='all'||w.n.length);
        if(E||Cn){const st=Math.max(9,60*s);const gg=el('g',{'data-r':[...rel].join(' ')},gTL);
          let rem=st/2,tot=0;for(let k=1;k<Q.length;k++)tot+=Math.hypot(Q[k][0]-Q[k-1][0],Q[k][1]-Q[k-1][1]);if(tot<st*1.5)return;
          for(let k=1;k<Q.length;k++){const a=Q[k-1],b=Q[k],L_=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L_<.01)continue;const nx=-(b[1]-a[1])/L_,ny=(b[0]-a[0])/L_;let t0=rem;rem=(rem-L_);if(rem>0)continue;rem=st+((rem%st)+st)%st-st;
            for(let t=t0;t<L_;t+=st){rem=st-(L_-t);const x=a[0]+(b[0]-a[0])*t/L_,y=a[1]+(b[1]-a[1])*t/L_;
              if(E)for(const sd of[-1,1])el('circle',{cx:(x+nx*sd*(wpx/2+.6)).toFixed(2),cy:(y+ny*sd*(wpx/2+.6)).toFixed(2),r:.5,class:'wmr-l b'},gg);
              if(Cn)el('circle',{cx:x.toFixed(2),cy:y.toFixed(2),r:.42,class:'wmr-l g'},gg)}}}}});
    Object.entries(lab).forEach(([n,o])=>{if(o.len<14)return;let acc=0,half=o.len/2,Q=o.Q,p=Q[0];for(let k=1;k<Q.length;k++){const L_=Math.hypot(Q[k][0]-Q[k-1][0],Q[k][1]-Q[k-1][1]);if(acc+L_>=half){const t=(half-acc)/L_;p=[Q[k-1][0]+(Q[k][0]-Q[k-1][0])*t,Q[k-1][1]+(Q[k][1]-Q[k-1][1])*t];break}acc+=L_}
      const t=el('text',{x:p[0].toFixed(1),y:p[1].toFixed(1),class:'wmr-tlab','data-r':[...o.rel].join(' ')},gT);t.textContent=n});}
  const NV=A.nav,NVout=[];if(NV&&NV.aids&&NV.aids.length){const gN=el('g',{class:'wmr-nav'},svg);
    // ILS feather on the served runway (LOC with stated RWY)
    NV.aids.filter(x=>x.kinds.includes('LOC')&&x.rwy).forEach(x=>{const g=RW.find(g=>g.ea.id===x.rwy||(g.eb&&g.eb.id===x.rwy));if(!g)return;const isA=g.ea.id===x.rwy,base=isA?0:g.L,dir=isA?1:-1;
      const Lf=Math.max(g.L*.42,40/s),wf=Math.max(5/s,g.L*.035),tip=at(g,base,0),b1=at(g,base-dir*Lf,-wf),b2=at(g,base-dir*Lf,wf),mid=at(g,base-dir*Lf,0);
      el('path',{d:`M${tip[0].toFixed(1)} ${tip[1].toFixed(1)}L${b1[0].toFixed(1)} ${b1[1].toFixed(1)}L${b2[0].toFixed(1)} ${b2[1].toFixed(1)}Z`,class:'wmr-feather','data-i':g.i},gN);
      el('path',{d:`M${tip[0].toFixed(1)} ${tip[1].toFixed(1)}L${mid[0].toFixed(1)} ${mid[1].toFixed(1)}`,class:'wmr-feather-c','data-i':g.i},gN)});
    const seen={};NV.aids.forEach((x,k)=>{if(!x.coord){NVout.push(`${x.type} ${x.ident||''} (no position)`);return}const q=S(RW.P(x.coord));
      if(x.far||q[0]<6||q[0]>VW-6||q[1]<6||q[1]>VH-6){NVout.push(`${x.type} ${x.ident||''} off diagram`);return}
      const key=q[0].toFixed(0)+','+q[1].toFixed(0);const off=seen[key]=(seen[key]||0)+1;const qx=q[0]+(off-1)*7,qy=q[1];
      const ty=x.kinds.includes('VOR')&&x.kinds.includes('DME')?'vordme':x.kinds.includes('VOR')?'vor':x.kinds.includes('NDB')?'ndb':x.kinds.includes('LOC')?'loc':x.kinds.includes('GP')?'gp':x.kinds.includes('DME')?'dme':'mkr';
      const rel=x.rwy?RW.filter(g=>g.ea.id===x.rwy||(g.eb&&g.eb.id===x.rwy)).map(g=>g.i).join(' '):'';
      const G_=el('g',{class:'wmr-aid '+ty,transform:`translate(${qx.toFixed(1)} ${qy.toFixed(1)})`,'data-r':rel||'all','data-aid':k,tabindex:0,role:'button','aria-label':`${x.type} ${x.ident||''} ${x.freq||''}`},gN);
      G_.innerHTML={vor:'<path d="M-3 -5.2H3L6 0 3 5.2H-3L-6 0Z" class="ai"/><circle r=".9" class="ad"/>',vordme:'<rect x="-6" y="-5.2" width="12" height="10.4" rx=".6" class="ai"/><path d="M-3 -5.2H3L6 0 3 5.2H-3L-6 0Z" class="ai"/><circle r=".9" class="ad"/>',
        dme:'<rect x="-4.2" y="-4.2" width="8.4" height="8.4" rx=".6" class="ai"/><circle r=".9" class="ad"/>',ndb:'<circle r="5.2" class="ai ndb"/><circle r="2.6" class="ai ndb2"/><circle r="1" class="ad"/>',
        loc:'<path d="M-3.2 -1.6H3.2V1.6H-3.2Z" class="ai"/><path d="M0 -3.4V3.4" class="ai"/>',gp:'<path d="M0 -3.6 3.4 2.6H-3.4Z" class="ai"/>',mkr:'<ellipse rx="4.6" ry="2.2" class="ai"/>'}[ty]+'<circle r="22" class="ahit"/>';
      const lab=(x.ident||(ty==='gp'?'GP':''))+(x.rwy&&(ty==='loc'||ty==='gp')?' '+x.rwy:'');if(lab){const t=el('text',{x:(qx+8).toFixed(1),y:(qy+.5).toFixed(1),class:'wmr-alab','data-r':rel||'all'},gT);t.textContent=lab}})}
  {const boxes=[[0,0,40,40]];const bb=t=>{const b=t.getBBox(),m=(t.getAttribute('transform')||'').match(/rotate\(([-\d.]+) ([-\d.]+) ([-\d.]+)\)/);if(!m)return[b.x,b.y,b.x+b.width,b.y+b.height];const a=m[1]*Math.PI/180,cx=+m[2],cy=+m[3],c=Math.cos(a),s_=Math.sin(a);const P=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>[cx+(x-cx)*c-(y-cy)*s_,cy+(x-cx)*s_+(y-cy)*c]);const X=P.map(p=>p[0]),Y=P.map(p=>p[1]);return[Math.min(...X),Math.min(...Y),Math.max(...X),Math.max(...Y)]};
   const hit=(a,b)=>a[0]<b[2]+2&&a[2]>b[0]-2&&a[1]<b[3]+2&&a[3]>b[1]-2;
   document.body.appendChild(svg);svg.style.cssText='position:absolute;visibility:hidden;width:360px';
   gT.querySelectorAll('.wmr-des').forEach(t=>{const x0=+t.getAttribute('x'),y0=+t.getAttribute('y'),dx=+t.dataset.dx,dy=+t.dataset.dy,a=(t.getAttribute('transform').match(/rotate\(([-\d.]+)/)||[0,0])[1];
     const C=[[0,0]];for(let k=1;k<=4;k++){C.push([k*9,0]);for(const l of[-1,1])C.push([k*5,l*12],[0,l*12*k])}
     let b,ok=false;for(const [o1,o2] of C){const x=x0+dx*o1-dy*o2,y=y0+dy*o1+dx*o2;t.setAttribute('x',x.toFixed(1));t.setAttribute('y',y.toFixed(1));t.setAttribute('transform',`rotate(${a} ${x.toFixed(1)} ${y.toFixed(1)})`);b=bb(t);
       if(!boxes.some(q=>hit(b,q))&&b[0]>1&&b[2]<VW-1&&b[1]>1&&b[3]<VH-1){ok=true;break}}
     if(!ok){t.setAttribute('x',x0);t.setAttribute('y',y0);t.setAttribute('transform',`rotate(${a} ${x0} ${y0})`);b=bb(t)}boxes.push(b)});
   gT.querySelectorAll('.wmr-dim').forEach(t=>{const b=bb(t);if(boxes.some(x=>hit(b,x))||b[0]<2||b[2]>VW-2)t.remove();else boxes.push(b)});
   gT.querySelectorAll('.wmr-alab').forEach(t=>{const b=bb(t);if(boxes.some(x=>hit(b,x))){t.setAttribute('x',(+t.getAttribute('x')-16-b[2]+b[0]).toFixed(1));const b2=bb(t);if(boxes.some(x=>hit(b2,x)))t.remove();else boxes.push(b2)}else boxes.push(b)});
   gT.querySelectorAll('.wmr-tlab').forEach(t=>{const b=bb(t);if(boxes.some(x=>hit(b,x))||b[0]<2||b[2]>VW-2||b[1]<2||b[3]>VH-2)t.remove();else boxes.push(b)});
   svg.style.cssText='';}
  if(night){const hz=el('rect',{x:0,y:0,width:VW,height:VH,fill:`url(#${uid}hz)`,class:'wmr-haze'});svg.insertBefore(hz,gL);
    const bl=gL.cloneNode(true);bl.setAttribute('class','wmr-bloom');bl.setAttribute('filter',`url(#${uid}gl)`);bl.setAttribute('aria-hidden','true');svg.insertBefore(bl,gL)}
  // compose
  box.innerHTML='';const fig=document.createElement('div');fig.className='wmr-fig';fig.appendChild(svg);box.appendChild(fig);
  const flags=A.runways.reduce((n,r)=>n+r.flags.length,0);
  let rows='';A.runways.forEach((r,ri)=>{const es=w?r.ends.slice().sort((p,q)=>((comps(q.true_brg,w)||{h:-99}).h-(comps(p.true_brg,w)||{h:-99}).h)).slice(0,1):r.ends;es.forEach(e=>{const c=comps(e.true_brg,w);const ex=ac&&ac.xw!=null&&c&&(c.gx||c.x)>ac.xw;
    rows+=`<li class="${bst&&bst.e.id===e.id?'best':''}${ex?' over':''}"><b>${esc(e.id)}</b>${c?`<span class="${c.h<0?'tail':''}">${c.h<0?'Tail':'Head'} ${Math.abs(c.h)}</span><span>X ${c.x}${c.x?' '+c.side:''}${c.gx&&c.gx>c.x?' (G '+c.gx+')':''}</span>`:'<span class="na">—</span>'}</li>`})});
  const info=document.createElement('div');info.className='wmr-info';
  info.innerHTML=`<div class="wmr-row">${w&&w.dir!=null?`<div class="wmr-wind" aria-label="Wind ${Math.round(w.dir)} degrees ${w.spd} knots"><svg viewBox="-22 -22 44 44"><circle r="20" class="wmr-chip"/><path d="M0 -20V-16M20 0H16M0 20V16M-20 0H-16" class="wmr-tick"/><g class="wmr-wrot" style="transform:rotate(${(w.dir+180)%360}deg)"><path d="M0 -13V9" class="wmr-wshaft"/><path d="M0 14 -4.4 6H4.4Z" class="wmr-whead"/></g></svg><span><b>${String(Math.round(w.dir)).padStart(3,'0')}°</b> ${w.spd} kt${w.gst&&w.gst>w.spd+4?' G'+w.gst:''}</span></div>`:''}<ul class="wmr-comp">${rows}</ul></div><div class="wmr-meta">${w?`<span>${esc(w.src||'Wind')}</span>`:'<span>No wind</span>'}${ac?`<span>${esc(ac.n)} · ${ac.xw!=null?'XW '+ac.xw+' kt':'XW not verified'}</span>`:''}${A.taxiways&&A.taxiways.length?`<span>TWY ${A.taxiways.slice(0,10).map(esc).join(' · ')}</span>`:''}${night?(()=>{const u=[];A.runways.forEach(r=>r.ends.forEach(e=>{const P=e.lighting&&e.lighting.papi;if(P&&P.present&&!P.side)u.push(e.id)}));return u.length?`<span>PAPI side not published: ${u.map(esc).join(', ')} (not drawn)</span>`:''})():''}${NVout.length?`<span>Nav aids not drawn: ${NVout.map(esc).join(' · ')}</span>`:''}${A.taxi&&A.taxi.ways&&A.taxi.ways.length?`<span class="${A.taxi.status==='verified'?'':'warn'}">Taxiways: ${A.taxi.status==='verified'?'names checked vs AIP':'layout unverified'} · © OpenStreetMap contributors, ODbL</span>`:''}${RW.some(g=>g.apxB)?'<span class="warn">Orientation approx. (AIP bearing NIL)</span>':''}${RW.some(g=>g.approx)?'<span class="warn">Relative RWY position approx.</span>':''}</div>`;
  box.appendChild(info);
  // popover
  const pop=document.createElement('div');pop.className='wmr-pop';pop.setAttribute('role','dialog');pop.hidden=true;box.appendChild(pop);
  const open=(i,ev)=>{if(box.dataset.sel==String(i)&&!pop.hidden){close();return}const g=RW.find(x=>x.i==i);if(!g)return;const r=g.r;
    const li=e=>{const L=e.lighting;if(!L)return'not published';const a=[];if(lit(L,'apch'))a.push('APCH '+L.apch.raw);if(lit(L,'thr'))a.push('THR '+(L.thr.colour||L.thr.raw));if(lit(L,'edge'))a.push('Edge '+(L.edge.colour||'')); if(lit(L,'end'))a.push('End '+(L.end.colour||L.end.raw));
      if(L.papi&&L.papi.present)a.push(`${L.papi.type||'PAPI'} ${L.papi.angle!=null?L.papi.angle+'°':''} ${L.papi.side?({L:'LHS',R:'RHS',B:'both sides'})[L.papi.side]:'(side n/p)'}`);return a.length?a.join(' · '):'NIL'};
    pop.innerHTML=`<div class="wmr-ph"><b>RWY ${esc(r.name)}</b><button class="wmr-x" aria-label="Close">×</button></div>
    <dl><dt>Length</dt><dd>${r.len?r.len+' m':'n/p'} · ${r.wid?r.wid+' m wide':''}</dd><dt>Surface</dt><dd>${esc(r.surface||'not stated')}${r.surface_raw&&r.surface_raw!==r.surface?` <i>${esc(r.surface_raw)}</i>`:''}</dd>
    <dt>Elevation</dt><dd>${r.ends.map(e=>`THR ${esc(e.id)} ${esc((e.thr_elev||'n/p').replace(/^THR:\s*/,'').replace(/TDZ:/,'· TDZ'))}`).join(' · ')}${A.elev&&/\d/.test(A.elev)?` · AD ${esc(A.elev)}`:''}</dd>
    ${r.ends.map(e=>`<dt>${esc(e.id)}</dt><dd>${e.true_brg!=null?Math.round(e.true_brg)+'°T · ':''}${esc(li(e))}${e.displaced_thr_m?` · Displaced THR ${e.displaced_thr_m} m`:''}${e.stopway_m?` · SWY ${e.stopway_m} m`:''}${e.circuit?` · ${e.circuit==='R'?'RH':'LH'} circuit`:''}</dd>`).join('')}</dl>
    <p class="wmr-src">${esc(r.src.len||'')}${r.flags.length?` · ${r.flags.length} flag${r.flags.length>1?'s':''}`:''}</p>`;
    pop.hidden=false;pop.style.top=Math.max(12,fig.offsetHeight-56)+'px';const bb=box.getBoundingClientRect(),x=ev&&ev.clientX!=null?ev.clientX-bb.left:bb.width/2;pop.style.setProperty('--px',Math.max(8,Math.min(bb.width-pop.offsetWidth-8,x-pop.offsetWidth/2))+'px');
    requestAnimationFrame(()=>pop.classList.add('on'));pop.querySelector('.wmr-x').onclick=close;gR.querySelectorAll('.wmr-rw').forEach(n=>n.classList.toggle('sel',n.dataset.i==i));gC.querySelectorAll('[data-i]').forEach(n=>n.classList.toggle('pick',n.dataset.i==i));setSel(i)};
  const setSel=i=>{applyDir(i);box.dataset.sel=i==null?'':i;box.classList.toggle('has-sel',i!=null);svg.querySelectorAll('[data-i],[data-r]').forEach(n=>{const on=i==null||(n.dataset.i!=null?n.dataset.i==i:(' '+n.dataset.r+' ').includes(' '+i+' '));n.classList.toggle('dim',!on)})};
  function applyDir(sel){RW.forEach(g=>{let d=null;const ends=[g.ea,g.eb].filter(Boolean);
      const bestOf=()=>{if(!w)return g.ea.id;return ends.slice().sort((p,q)=>((comps(q.true_brg,w)||{h:-99}).h-(comps(p.true_brg,w)||{h:-99}).h))[0].id};
      if(sel!=null&&sel==g.i)d=bestOf();else if(sel==null&&bst&&bst.ri===g.i)d=bst.e.id;
      svg.querySelectorAll(`.wmr-lights [data-i="${g.i}"] .dl, .wmr-bloom [data-i="${g.i}"] .dl`).forEach(n=>n.classList.toggle('off',d!=null&&n.dataset.d!==d))})}
  const close=()=>{setSel(null);pop.classList.remove('on');gR.querySelectorAll('.sel').forEach(n=>n.classList.remove('sel'));gC.querySelectorAll('.pick').forEach(n=>n.classList.remove('pick'));setTimeout(()=>{if(!pop.classList.contains('on'))pop.hidden=true},260)};
  const openAid=(k,ev)=>{const x=NV.aids[k];pop.innerHTML=`<div class="wmr-ph"><b>${esc(x.type)} ${esc(x.ident||'')}</b><button class="wmr-x" aria-label="Close">×</button></div><dl><dt>Ident</dt><dd>${esc(x.ident||'not published')}</dd><dt>Frequency</dt><dd>${esc(x.freq||'n/p')}</dd><dt>Runway</dt><dd>${esc(x.rwy||'not stated')}</dd>${x.gp_angle?`<dt>GP angle</dt><dd>${x.gp_angle}°</dd>`:''}<dt>AIP type</dt><dd>${esc(x.raw_type)}</dd>${x.rmk&&!/^NIL/.test(x.rmk)?`<dt>Remarks</dt><dd>${esc(x.rmk)}</dd>`:''}</dl><p class="wmr-src">${esc(x.src)}</p>`;
    pop.hidden=false;pop.style.top=Math.max(12,fig.offsetHeight-56)+'px';const bb=box.getBoundingClientRect(),px=ev&&ev.clientX!=null?ev.clientX-bb.left:bb.width/2;pop.style.setProperty('--px',Math.max(8,Math.min(bb.width-pop.offsetWidth-8,px-pop.offsetWidth/2))+'px');requestAnimationFrame(()=>pop.classList.add('on'));pop.querySelector('.wmr-x').onclick=close};
  svg.addEventListener('click',ev=>{const t=ev.target.closest('.wmr-aid');if(t){ev.stopPropagation();openAid(+t.dataset.aid,ev)}});
  gH.addEventListener('click',ev=>{const t=ev.target.closest('.wmr-hit');if(t){ev.stopPropagation();open(t.dataset.i,ev)}});
  gH.addEventListener('keydown',ev=>{if((ev.key==='Enter'||ev.key===' ')&&ev.target.dataset.i!=null){ev.preventDefault();open(ev.target.dataset.i)}});
  box.addEventListener('keydown',ev=>{if(ev.key==='Escape')close()});
  document.addEventListener('click',ev=>{if(!pop.hidden&&!pop.contains(ev.target))close()},{capture:true});
  box.WMRopenAid=openAid;applyDir(null);box._wmr={icao,o};box.dataset.theme=th.name;box.classList.toggle('night',night);box.WMRopen=open;
}
const API={mount(el,icao,o){render(el,icao,o);MOUNTS.add(el);return el},
  setWind(icao,w){WIND[icao]=w;MOUNTS.forEach(m=>{if(m._wmr&&m._wmr.icao===icao)render(m,icao,Object.assign({},m._wmr.o,{wind:w}))})},
  refresh(){MOUNTS.forEach(m=>m._wmr&&render(m,m._wmr.icao,m._wmr.o))},
  comps,data:D,
  fetchModelWind(icaos){const A=D(),L=icaos.filter(i=>A[i]);if(!L.length)return Promise.resolve();
    return fetch('https://api.open-meteo.com/v1/forecast?latitude='+L.map(i=>A[i].lat).join(',')+'&longitude='+L.map(i=>A[i].lon).join(',')+'&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=kn')
      .then(r=>r.json()).then(j=>{(Array.isArray(j)?j:[j]).forEach((x,k)=>{const c=x.current;API.setWind(L[k],{dir:c.wind_direction_10m,spd:Math.round(c.wind_speed_10m),gst:Math.round(c.wind_gusts_10m),src:'Model · Open-Meteo'})})}).catch(()=>{})}};
G.WMRWY=API;
new MutationObserver(()=>API.refresh()).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-pal']});
addEventListener('storage',e=>{if(e.key==='wm-ac')API.refresh()});
})(window);

/* launch: keep tap targets >= 44 CSS px at every diagram size (nav-aid hit circles r=22px, runway hit stroke 44px) */
(function(){if(!window.WMRWY||WMRWY.__hit44)return;WMRWY.__hit44=1;
const fix=h=>h.querySelectorAll('svg.wmr-svg').forEach(s=>{const vb=s.viewBox&&s.viewBox.baseVal;if(!vb||!vb.width||!s.clientWidth)return;const k=vb.width/s.clientWidth;
 s.querySelectorAll('.ahit').forEach(c=>{const r=(22*k).toFixed(1);if(c.getAttribute('r')!==r)c.setAttribute('r',r)});s.querySelectorAll('.wmr-hit').forEach(l=>{l.style.strokeWidth=(44*k).toFixed(1)})});
const ro=window.ResizeObserver?new ResizeObserver(es=>es.forEach(e=>fix(e.target))):null,m0=WMRWY.mount;
WMRWY.mount=function(el){const r=m0.apply(this,arguments);try{fix(el);ro&&ro.observe(el);if(!el.__wmrmo){el.__wmrmo=new MutationObserver(()=>fix(el));el.__wmrmo.observe(el,{childList:true,subtree:true})}}catch(e){}return r}})();
