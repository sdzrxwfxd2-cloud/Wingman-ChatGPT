from gen import *
import math
def ring(p,col,lbl,val):
  c=2*math.pi*26
  return f'<div class="ring"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" stroke="var(--ln)"/><circle cx="32" cy="32" r="26" stroke="{col}" stroke-linecap="round" stroke-dasharray="{c*p:.1f} {c:.1f}" transform="rotate(-90 32 32)"/><text x="32" y="37" text-anchor="middle" font-size="14" font-weight="700" fill="var(--tx)">{val}</text></svg>{lbl}</div>'
RINGS='<div class="rings">'+ring(.92,'var(--go)','Day','OK')+ring(.70,'var(--go)','Night','45d')+ring(.35,'var(--cau)','IR','41d')+'</div>'
BAD=f'<div class="badges">{BADGES}</div>'
def H(o,css): return HEAD.format(o=o,css=css).replace('<link rel="stylesheet" href="pp.css">','<link rel="stylesheet" href="pp.css"><link rel="stylesheet" href="fx.css">')+'<i class="blob" style="width:420px;height:420px;left:-120px;top:-80px;background:var(--orb1)"></i><i class="blob" style="width:380px;height:380px;right:-100px;top:45%;background:var(--orb2);animation-delay:-6s"></i>'
END='<script src="fx.js"></script></body></html>'
BTNS=f'<div class="row" style="gap:8px"><button class="btn pri">{ED}Edit</button><button class="btn">{SH}Share card</button></div>'
STATG=''.join(f'<div class="stat"><b class="mono">{v}</b><span>{k}</span></div>' for v,k in STATS)
SEC=lambda t,body,cls='card lg rv',a='': f'<section class="{cls}"><h2>{t}{a}</h2>{body}</section>'
P={}
# C Liquid Glass - iOS 26 style, one big liquid hero, floating segmented control
P['c']=H('C - Liquid Glass','''
.hero{margin-top:30px;padding:30px 22px 22px;text-align:center;border-radius:36px;overflow:hidden}
.hero::before{background:linear-gradient(160deg,rgba(255,255,255,.22),transparent 35%,transparent 70%,rgba(255,255,255,.08))!important}
.hero .av{margin:0 auto;width:110px;height:110px}
.seg{position:sticky;top:10px;z-index:5;margin:16px auto;width:max-content;max-width:100%}
.statrow{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:18px;padding-top:16px;border-top:.5px solid var(--ln)}
.statrow .stat b{font-size:20px}.statrow .stat span{font-size:10px}
.colC{display:grid;gap:14px;grid-template-columns:minmax(0,1fr)}
@media(min-width:900px){.wrap{max-width:860px}.colC{grid-template-columns:repeat(2,minmax(0,1fr))}.colC .full{grid-column:span 2}}
''')+f'''<div class="wrap"><section class="hero lg tilt rv">{AVATAR}<div style="margin-top:14px">{NAME}</div>
<div class="row" style="flex-wrap:wrap;gap:6px;justify-content:center;margin:12px 0">{hdr_tags()}</div>{RINGS}
<div class="statrow">{STATG}</div><div class="row" style="justify-content:center;margin-top:16px">{BTNS}</div></section>
<nav class="tabs seg"><a class="on">Overview</a><a>Reviews</a><a>Badges</a><a>Privacy</a></nav>
<div class="colC">{SEC('Badges',BAD)}{SEC('',MEMBER)}{SEC('My ATO reviews',REVS,'card lg rv full','<a>See all 4</a>')}{SEC('Currency',CUR)}{SEC('Saved aerodromes',SAVED)}{SEC('What others see',PRIV,'card lg rv full')}</div></div>'''+END
# D Wallet - stacked passes like Apple Wallet
P['d']=H('D - Wallet passes','''
.passes{margin-top:30px;display:grid;gap:0}
.pass{border-radius:22px;padding:20px;margin-top:-34px;min-height:120px;transition:transform .5s cubic-bezier(.22,.8,.2,1)}
.pass:first-child{margin-top:0}.pass:hover{transform:translateY(-10px)}
.pass .ph{display:flex;justify-content:space-between;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx3);margin-bottom:10px}
.p1{background:linear-gradient(135deg,color-mix(in srgb,var(--acc) 55%,var(--gl)),var(--gl))!important}
.p2{background:linear-gradient(135deg,rgba(212,160,23,.45),var(--gl))!important}
.lic{min-height:250px}
.colD{display:grid;gap:14px;margin-top:18px;grid-template-columns:minmax(0,1fr)}
@media(min-width:900px){.wrap{display:grid;grid-template-columns:420px minmax(0,1fr);gap:28px;align-items:start}.passes{position:sticky;top:30px}.colD{margin-top:30px;grid-template-columns:repeat(2,minmax(0,1fr))}.colD .full{grid-column:span 2}}
''')+f'''<div class="wrap"><div class="passes">
<div class="pass lg tilt lic p1 rv"><div class="ph"><span>Wingman pilot pass</span><span>CPL(A) - ZA</span></div><div class="row" style="gap:14px">{AVATAR}<div>{NAME}<div class="row dim" style="gap:6px;margin-top:4px">{PIN}Home <span class="icao" style="color:var(--tx)">FACT</span></div></div></div><div class="row" style="flex-wrap:wrap;gap:6px;margin-top:14px">{hdr_tags()}</div></div>
<div class="pass lg tilt p2 rv"><div class="ph"><span>Membership</span><span>No. 0007</span></div>{MEMBER}</div>
<div class="pass lg tilt rv"><div class="ph"><span>Currency</span><span>Tap for detail</span></div>{RINGS}</div>
<div class="pass lg rv" style="padding-top:26px">{BTNS}</div></div>
<div class="colD"><section class="card lg rv full"><h2>Hours</h2><div class="strip" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">{STATG}</div></section>{SEC('Badges',BAD,'card lg rv full')}{SEC('My ATO reviews',REVS,'card lg rv full','<a>See all 4</a>')}{SEC('Currency detail',CUR)}{SEC('Saved',SAVED)}{SEC('What others see',PRIV,'card lg rv full')}</div></div>'''+END
# E Spatial - visionOS floating windows with ornament tab bar
P['e']=H('E - Spatial','''
body{perspective:1400px}
.orn{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:8;display:flex;gap:4px;padding:6px;border-radius:999px}
.orn a{padding:9px 16px;border-radius:999px;font-size:13px;font-weight:650;color:var(--tx2)}.orn a.on{background:var(--gl2);color:var(--tx);box-shadow:inset 0 0 0 .5px var(--ln)}
.stage{margin-top:30px;display:grid;gap:18px;grid-template-columns:minmax(0,1fr);padding-bottom:80px}
.win{border-radius:32px;padding:22px}
.id{display:grid;gap:16px;align-items:center}
@media(min-width:900px){.stage{grid-template-columns:1.1fr 1fr 1fr}.id{grid-template-columns:auto 1fr auto}.w-id{grid-column:span 3}.w-rev{grid-column:span 2}.w-bad{grid-column:span 2}.lift{transform:translateZ(30px)}}
''')+f'''<div class="wrap"><div class="stage">
<section class="win lg tilt w-id rv"><div class="id">{AVATAR}<div>{NAME}<div class="row" style="flex-wrap:wrap;gap:6px;margin-top:10px">{hdr_tags()}</div></div><div style="min-width:240px">{RINGS}</div></div></section>
<section class="win lg rv" data-px="-0.03"><h2>Logbook</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">{STATG}</div></section>
{SEC('My ATO reviews',REVS,'win lg rv w-rev','<a>See all 4</a>')}
<section class="win lg rv lift">{MEMBER}<div style="margin-top:14px">{BTNS}</div></section>
{SEC('Badges',BAD,'win lg rv w-bad')}{SEC('Saved',SAVED,'win lg rv')}{SEC('Currency',CUR,'win lg rv')}{SEC('What others see',PRIV,'win lg rv')}{SEC('Hours trend',bars(),'win lg rv')}
</div></div><nav class="orn lg"><a class="on">Profile</a><a>Reviews</a><a>Logbook</a><a>Privacy</a></nav>'''+END
# F Editorial - Apple product page: huge type, cinematic reveals
P['f']=H('F - Editorial','''
.wrap{max-width:1000px}
.big1{font-size:clamp(44px,9vw,104px);font-weight:800;letter-spacing:-.045em;line-height:.95;background:linear-gradient(180deg,var(--tx),color-mix(in srgb,var(--tx) 45%,transparent));-webkit-background-clip:text;background-clip:text;color:transparent}
.ey{font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:var(--acc);font-weight:700}
.ch{padding:70px 0 10px;text-align:center}
.ch p{font-size:19px;color:var(--tx2);max-width:560px;margin:12px auto 0}
.panel{padding:24px;margin-top:22px}
.top{padding-top:50px;text-align:center}.top .av{margin:0 auto 18px;width:120px;height:120px}
.two{display:grid;gap:14px;grid-template-columns:minmax(0,1fr)}
@media(min-width:900px){.two{grid-template-columns:repeat(2,minmax(0,1fr))}}
''')+f'''<div class="wrap"><header class="top rv">{AVATAR}<div class="ey">Commercial pilot - Cape Town</div><div class="big1" style="margin-top:8px">@capecpl_mt</div><div class="row" style="flex-wrap:wrap;gap:6px;justify-content:center;margin:18px 0">{hdr_tags()}</div><div class="row" style="justify-content:center">{BTNS}</div></header>
<div class="ch rv"><div class="ey">Flight time</div><div class="big1">412.6 hrs.</div><p>38.2 in the last 90 days. 112 at night. 46 aerodromes.</p></div>
<section class="panel lg tilt rv" style="max-width:520px;margin-inline:auto">{RINGS}</section>
<div class="ch rv"><div class="ey">Honest reviews</div><div class="big1" style="font-size:clamp(34px,6vw,64px)">Rated by members.</div><p>Anonymous handle. Real cost to finish. Members vote on what is true.</p></div>
<section class="panel lg rv">{REVS}</section>
<div class="ch rv"><div class="ey">Milestones</div><div class="big1" style="font-size:clamp(34px,6vw,64px)">Earned, not bought.</div></div>
<section class="panel lg rv">{BAD}</section>
<div class="two" style="margin-top:22px">{SEC('',MEMBER,'panel lg rv tilt')}{SEC('Saved aerodromes',SAVED,'panel lg rv')}{SEC('Currency',CUR,'panel lg rv')}{SEC('What others see',PRIV,'panel lg rv')}</div></div>'''+END
# G Control Center - modular tile grid
P['g']=H('G - Control Center','''
.cc{margin-top:30px;display:grid;gap:12px;grid-template-columns:repeat(4,minmax(0,1fr))}
.m{border-radius:28px;padding:16px;overflow:hidden}
.s2{grid-column:span 2}.s4{grid-column:span 4}.r2{grid-row:span 2}
.sq{aspect-ratio:1;display:flex;flex-direction:column;justify-content:space-between}
.sq b{font-size:26px;font-weight:800;letter-spacing:-.03em}.sq span{font-size:11px;color:var(--tx3);text-transform:uppercase;letter-spacing:.08em}
.m:active{transform:scale(.97)}
@media(min-width:900px){.wrap{max-width:1100px}.cc{grid-template-columns:repeat(8,minmax(0,1fr))}.d2{grid-column:span 2}.d3{grid-column:span 3}.d4{grid-column:span 4}.d5{grid-column:span 5}.d8{grid-column:span 8}}
''')+f'''<div class="wrap"><div class="cc">
<section class="m lg tilt s4 d5 rv"><div class="row" style="gap:16px">{AVATAR}<div>{NAME}</div></div><div class="row" style="flex-wrap:wrap;gap:6px;margin-top:14px">{hdr_tags()}</div><div style="margin-top:14px">{BTNS}</div></section>
<section class="m lg s4 d3 rv"><h2>Currency</h2>{RINGS}</section>
{''.join(f'<section class="m lg sq s2 d2 rv"><span>{k}</span><b class="mono">{v}</b></section>' for v,k in STATS)}
<section class="m lg s4 d4 rv tilt">{MEMBER}</section>
<section class="m lg s4 d4 rv"><h2>Badges</h2>{BAD}</section>
<section class="m lg s4 d5 rv"><h2>My ATO reviews <a>See all 4</a></h2>{REVS}</section>
<section class="m lg s4 d3 rv"><h2>Privacy</h2>{PRIV}</section>
<section class="m lg s4 d4 rv"><h2>Currency detail</h2>{CUR}</section>
<section class="m lg s4 d4 rv"><h2>Saved</h2>{SAVED}</section>
</div></div>'''+END
for k,v in P.items(): open(k+'.html','w').write(v)
