/* fs-core.js: Spotlight search engine (aerodrome index, ranking, ATO/DFE/Library matching, result HTML).
   Split out of fs.js (Claude split plan, MT t2265): loaded lazily by fs.js on the first search intent (tap/focus/hover on the
   search bar or icon, ⌘K, or opening Spotlight), together with fs-data-td.js (ATOs + DFEs). Output HTML is byte-for-byte what fs.js drew before. */
(function(){if(window.WMFSCore)return;const K=window.WMFSK,D=window.FS_D;if(!K||!D||!D.a)return;
const BASE=K.BASE,LS=K.LS,I=K.I,esc=K.esc,touch=K.touch;
const LIBSRC=(()=>{try{return new URL('../library-resources-data.js?v=010f6e0aed',document.currentScript.src).href}catch(e){return ''}})(),LIBPAGE=LIBSRC.replace('library-resources-data.js','library.html').split('?')[0];let LIB=null,libReq=0;const libLoad=cb=>{if(LIB||libReq||!LIBSRC)return;libReq=1;const go=()=>{const W=window.WLR;LIB=W&&W.items?W.items.map(x=>({t:x.t,src:x.src||'',sh:x.shelf||'',u:x.u,off:!!x.off,k:(x.t+' '+(x.src||'')+' '+(x.shelf||'')+' '+(x.n||'')).toLowerCase()})):[];cb&&cb()};if(window.WLR){go();return}const sc=document.createElement('script');sc.src=LIBSRC;sc.async=true;sc.onload=go;sc.onerror=()=>{LIB=[]};document.head.appendChild(sc)};
/* a: [ident, name, town, province, cat, status g/c/n/'', runways] */
const AD=D.a.map(a=>({ic:a[0],nm:a[1].replace(/ International Airport$/,' Intl').replace(/ Airport$/,''),full:a[1],town:a[2],pr:a[3],cat:a[4],st:a[5],rw:a[6]||[]}));
const BY=Object.fromEntries(AD.map(a=>[a.ic,a]));
/* live status written by the Aerodromes page (same GO/CAUTION/NO-GO the cards show), else the status baked into the build */
(function(){try{const c=JSON.parse(LS.g('wm-fs-wx','null'));if(c&&Date.now()-c.t<3*3600e3)for(const k in c.s)if(BY[k])BY[k].st=c.s[k]}catch(e){}})();
const WX={g:['GO','#22C55E'],c:['CAUTION','#FF9F0A'],n:['NO-GO','#FF453A']};
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ');
const lev=(a,b)=>{if(Math.abs(a.length-b.length)>2)return 9;const m=[...Array(a.length+1)].map((_,i)=>[i]);for(let j=1;j<=b.length;j++)m[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]===b[j-1]?0:1));if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])m[i][j]=Math.min(m[i][j],m[i-2][j-2]+1)}return m[a.length][b.length]};
function score(a,q){const qn=norm(q).trim();if(!qn)return 0;const ic=a.ic.toLowerCase();
 if(ic===qn)return 1000;if(ic.startsWith(qn))return 800;
 const rq=qn.replace(/^rwy ?|^runway ?/,'');if(/^\d{2}[lrc]?$/.test(rq)&&a.rw.some(r=>r.toLowerCase()===rq))return 600;
 const hay=norm(a.nm+' '+a.town+' '+a.pr),words=hay.split(/\s+/).filter(Boolean),qt=qn.split(/\s+/);let s=0;
 for(const t of qt){if(hay.includes(t)){s+=words.some(w=>w.startsWith(t))?120:70;continue}
  const tol=t.length>=6?2:t.length>=3?1:0;let best=9;for(const w of words)best=Math.min(best,lev(t,w.slice(0,Math.max(t.length,w.length))),lev(t,w));if(best<=tol){s+=40-best*10;continue}return 0}
 if(norm(a.town).startsWith(qt[0]))s+=60;if(a.cat==='i')s+=25;else if(a.cat==='c')s+=12;return s}
function hl(text,q){const qn=norm(q).trim();if(!qn)return esc(text);const toks=qn.split(/\s+/);const n=norm(text);const marks=new Array(text.length).fill(0);
 for(const t of toks){let i=n.indexOf(t);if(i>=0){while(i>=0){for(let k=i;k<i+t.length;k++)marks[k]=1;i=n.indexOf(t,i+t.length)}continue}
  let pos=0;for(const w of n.split(' ')){const tol=t.length>=6?2:1;if(w&&t.length>=3&&lev(t,w)<=tol)for(let k=pos;k<pos+w.length;k++)marks[k]=1;pos+=w.length+1}}
 let o='',on=0;for(let i=0;i<text.length;i++){if(marks[i]&&!on){o+='<mark class="fs-m">';on=1}if(!marks[i]&&on){o+='</mark>';on=0}o+=esc(text[i])}return o+(on?'</mark>':'')}
const search=(q,n)=>AD.map(a=>[score(a,q),a]).filter(x=>x[0]>0).sort((x,y)=>y[0]-x[0]).slice(0,n).map(x=>x[1]);
/* ATOs: [name, number, region, valid, town, courses[]]  DFEs: [name, designation, province, valid] */
function tokOk(hay,q){const h=norm(hay);return norm(q).trim().split(/\s+/).every(t=>h.includes(t))}
function searchT(q,n){const qn=norm(q).trim();return D.t.map(t=>{const nm=norm(t[0]),cm=t[5].find(c=>tokOk(c,q));let s=0;
  if(nm.startsWith(qn))s=900;else if(tokOk(t[0],q))s=700;else if(tokOk(t[4]+' '+t[2],q))s=500;else if(cm)s=400;else if(norm(t[1]).includes(qn))s=300;
  return [s+(t[3]?50:0),t,cm]}).filter(x=>x[0]>50).sort((a,b)=>b[0]-a[0]||(a[1][0]<b[1][0]?-1:1)).slice(0,n)}
function searchF(q,n){const qn=norm(q).trim(),seen=new Set();return D.f.map(f=>{let s=0;if(norm(f[0]).startsWith(qn))s=900;else if(tokOk(f[0],q))s=700;else if(tokOk(f[1]+' '+f[2],q))s=500;return [s+(f[3]?50:0),f]}).filter(x=>x[0]>50).sort((a,b)=>b[0]-a[0]).filter(x=>!seen.has(x[1][0])&&seen.add(x[1][0])).slice(0,n)}
const hrefA=ic=>BASE+(ic==='FACT'?'fact.html':'ad/'+ic+'.html');
const hrefT=(k,nm)=>BASE+'app.html?tab='+k+'&q='+encodeURIComponent(nm);
/* "Show more" targets: the full section list with the query applied (the shell's openItem fills the page's own search box). */
const SHOW_N=5;
const hrefSec=(k,q)=>k==='aero'?BASE+'main.html?q='+encodeURIComponent(q):hrefT(k,q)+'&all=1';
function group(title,noun,all,draw,moreHref,q){if(!all.length)return '';const shown=all.slice(0,SHOW_N),extra=all.length-shown.length;
 /* small text link only; the count and query live in the accessible label */
 const more=extra>0?`<a class="fs-row fs-showmore" role="option" href="${esc(moreHref)}" aria-label="Show ${extra} more ${noun} for “${esc(q)}”">Show more</a>`:'';
 return `<div class="fs-card fs-gl"><div class="fs-lbl">${title}<em>${extra>0?shown.length+' of '+all.length:all.length===1?'1 match':all.length+' matches'}</em></div>${shown.map(draw).join('')}${more}</div>`}
function noMatch(q,head,tip){let best=null,bd=9;const qn=norm(q).replace(/\s/g,'');for(const a of AD){for(const w of [a.ic,a.town,a.nm.split(' ')[0]]){if(!w)continue;const d=lev(qn,norm(w).replace(/\s/g,'').slice(0,qn.length+1));if(d<bd){bd=d;best=a}}}
 return `<div class="fs-card fs-gl fs-empty"><div class="gl fs-gl">${I.s}</div><h4>${head}</h4><p>Nothing matches “${esc(q)}”.<br>${tip}</p>${best&&bd<=Math.min(2,Math.floor(qn.length/3))?`<div class="fs-dym fs-gl" role="button" tabindex="0" data-q="${esc(best.town||best.ic)}">Did you mean <span>${esc(best.town||best.nm)}</span> · ${best.ic}?</div>`:''}</div>`}
const row=(a,q,hi)=>{const w=WX[a.st];const sub=[a.town,a.pr].filter(Boolean).join(', ')+(a.rw.length&&/\d/.test(q)?' · RWY '+a.rw.join('/'):'');
 return `<a class="fs-row${hi?' hi':''}" role="option" href="${hrefA(a.ic)}" data-ic="${a.ic}" title="${esc(a.full)}"><span class="fs-ic">${hl(a.ic,q)}</span><span class="fs-nm"><b>${hl(a.nm,q)}</b><small>${hl(sub,q)}</small></span>${w?`<span class="fs-wx" style="--c:${w[1]}" title="Status from the latest METAR"><i></i>${w[0]}</span>`:'<span class="fs-wx none" aria-hidden="true"></span>'}<span class="fs-ret" aria-hidden="true">↵</span></a>`};
/* results(q, mode): the HTML fs.js puts in the results list (without the keyboard footer) */
function results(q,mode){let h='';
  const up=q.toUpperCase();
  if(mode==='all'){
   /* Each section shows its best SHOW_N matches; when more exist, a "Show more" row opens that section's page with the query applied. */
   const adAll=search(q,Infinity),atAll=searchT(q,Infinity),dfAll=searchF(q,Infinity);libLoad(K.rerender);const ql=q.toLowerCase(),lbAll=(LIB||[]).map(x=>{const t=x.t.toLowerCase();const sc=t.startsWith(ql)?500:new RegExp('\\b'+ql.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).test(t)?300:x.k.includes(ql)?150:0;return [sc,x]}).filter(x=>x[0]).sort((a,b)=>b[0]-a[0]||(b[1].off-a[1].off)||a[1].t.localeCompare(b[1].t));
   if(!adAll.length&&!atAll.length&&!dfAll.length&&!lbAll.length)return noMatch(q,'Nothing found','Try an ICAO code, town, ATO, course or examiner name.');
   const atRow=x=>{const t=x[1],sub=[t[4],t[2]].filter(Boolean).join(', ');return `<a class="fs-row" role="option" href="${esc(hrefT('ato',t[0]))}" title="${esc(t[0])}"><span class="fs-ico2">${I.hg}</span><span class="fs-nm"><b>${hl(t[0],q)}</b><small>${x[2]?`<span class="fs-cc">${hl(x[2],q)}</span> · `:''}${hl(sub||t[1],q)}</small></span></a>`};
   const lbRow=x=>{const l=x[1];return `<a class="fs-row" role="option" data-ext="1" href="${esc(l.u)}" title="${esc(l.t)}" rel="noopener"><span class="fs-ico2">${I.bk}</span><span class="fs-nm"><b>${hl(l.t,q)}</b><small>${hl([l.src,l.off?'Official':l.sh].filter(Boolean).join(' · '),q)} · opens the source page</small></span></a>`};const dfRow=x=>{const f=x[1];return `<a class="fs-row" role="option" href="${esc(hrefT('dfe',f[0]))}" title="${esc(f[0])}"><span class="fs-ico2">${I.ps}</span><span class="fs-nm"><b>${hl(f[0],q)}</b><small>${hl(f[1],q)}${f[2]?' · '+hl(f[2],q):''}</small></span></a>`};
   h=group('Aerodromes','aerodromes',adAll,(a,i)=>row(a,q,!i),hrefSec('aero',q),q)
    +group('ATOs','ATOs',atAll,atRow,hrefSec('ato',q),q)
    +group('DFEs','DFEs',dfAll,dfRow,hrefSec('dfe',q),q)
    +group('Library','library items',lbAll,lbRow,LIBPAGE+'?q='+encodeURIComponent(q),q);
   return h}
  if(/^FA[A-Z]{2}$/.test(up)&&BY[up]){const a=BY[up];h+=`<div class="fs-card fs-gl" style="padding:8px"><a class="fs-go fs-row" href="${hrefA(a.ic)}" data-ic="${a.ic}"><span class="ar">${I.ar}</span><span class="fs-nm"><b>Go to ${a.ic}</b><small>${esc(a.full)}${a.town?' · '+esc(a.town):''}</small></span><span class="fs-kbd">${touch?'Go':'↵'}</span></a></div>`}
  const r=search(q,8).filter(a=>!(BY[up]&&a.ic===up));
  if(r.length||h)h+=r.length?`<div class="fs-card fs-gl"><div class="fs-lbl">Aerodromes<em>${r.length} best matches</em></div>${r.map((a,i)=>row(a,q,!h&&!i)).join('')}</div>`:'';
  else h=noMatch(q,'No aerodrome found','Try an ICAO code, town or runway number.');
 return h}
window.WMFSCore={results,n:AD.length,lib:cb=>libLoad(cb),setSt:s=>{for(const k in s)if(BY[k])BY[k].st=s[k]}};
})();
