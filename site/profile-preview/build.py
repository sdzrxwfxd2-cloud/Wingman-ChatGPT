from gen import *
# ---------- Option A: Credential card ----------
cssA='''
.hero{padding:22px;overflow:hidden;margin-top:28px}
.hero::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.10) 45%,transparent 60%)}
.foil{position:absolute;right:-60px;top:-60px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(212,160,23,.28),transparent 65%);pointer-events:none}
.mrz{margin-top:16px;padding-top:12px;border-top:.5px dashed var(--ln);display:flex;justify-content:space-between;font-size:11px;letter-spacing:.14em;color:var(--tx3)}
.strip{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}
.strip .stat{padding:14px}
.gridA{display:grid;gap:14px;margin-top:14px}
@media(min-width:900px){.gridA{grid-template-columns:1.35fr 1fr}.hero{padding:30px 34px}.av{width:120px;height:120px}h1{font-size:34px}}
@media(max-width:600px){.strip{grid-template-columns:repeat(2,1fr)}}
'''
A=HEAD.format(o='A',css=cssA)+f'''<div class="wrap">
<section class="hero glass"><div class="foil"></div>
<div class="row" style="gap:18px;align-items:center">{AVATAR}<div style="min-width:0">{NAME}
<div class="row dim" style="gap:6px;margin-top:6px">{PIN}<span style="display:none"></span>Home <span class="icao" style="color:var(--tx)">FACT</span></div></div></div>
<div class="row" style="flex-wrap:wrap;gap:6px;margin-top:16px">{hdr_tags()}</div>
<div class="row" style="gap:8px;margin-top:16px"><button class="btn pri">{ED}Edit profile</button><button class="btn">{SH}Share card</button></div>
<div class="mrz mono"><span>WINGMAN PILOT</span><span>CPL(A) - ZA</span><span>SINCE 2026</span></div>
</section>
<div class="strip">{''.join(f'<div class="stat glass"><b class="mono">{v}</b><span>{k}</span></div>' for v,k in STATS)}</div>
<nav class="tabs"><a class="on">Overview</a><a>Reviews</a><a>Logbook</a><a>Saved</a><a>Badges</a><a>Privacy</a></nav>
<div class="gridA">
<div style="display:grid;gap:14px;align-content:start">
<section class="card glass"><h2>Currency <a>Open Logbook</a></h2>{CUR}</section>
<section class="card glass"><h2>My ATO reviews <a>See all 4</a></h2>{REVS}</section>
</div>
<div style="display:grid;gap:14px;align-content:start">
<section class="card glass">{MEMBER}</section>
<section class="card glass"><h2>Hours - last 6 months</h2>{bars()}<div class="dim" style="margin-top:6px">From Logbook later</div></section>
<section class="card glass"><h2>Badges</h2><div class="badges">{BADGES}</div></section>
<section class="card glass"><h2>Saved aerodromes</h2>{SAVED}</section>
<section class="card glass"><h2>What others see</h2>{PRIV}</section>
</div></div></div></body></html>'''
open('a.html','w').write(A)
# ---------- Option B: Cockpit bento with sticky identity rail ----------
cssB='''
.layout{display:grid;gap:14px;margin-top:28px}
.rail{padding:22px;text-align:center}
.rail .av{margin:0 auto}
.rings{display:flex;justify-content:space-around;margin:18px 0 4px}
.ring{width:74px;text-align:center;font-size:11px;color:var(--tx3)}
.ring svg{width:64px;height:64px;display:block;margin:0 auto 4px}
.ring circle{fill:none;stroke-width:6}
.bento{display:grid;gap:14px;grid-template-columns:1fr 1fr}
.bento .w2{grid-column:span 2}
.big{font-size:44px;font-weight:800;letter-spacing:-.03em;line-height:1}
@media(min-width:900px){.layout{grid-template-columns:340px 1fr;align-items:start}.rail{position:sticky;top:20px}.bento{grid-template-columns:repeat(3,1fr)}.bento .w2{grid-column:span 2}.bento .w3{grid-column:span 3}}
@media(max-width:899px){.bento .w3{grid-column:span 2}}
'''
def ring(p,col,lbl,val):
  import math;c=2*math.pi*26
  return f'<div class="ring"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" stroke="var(--ln)"/><circle cx="32" cy="32" r="26" stroke="{col}" stroke-linecap="round" stroke-dasharray="{c*p:.1f} {c:.1f}" transform="rotate(-90 32 32)"/><text x="32" y="37" text-anchor="middle" font-size="14" font-weight="700" fill="var(--tx)">{val}</text></svg>{lbl}</div>'
B=HEAD.format(o='B',css=cssB)+f'''<div class="wrap"><div class="layout">
<aside class="rail glass">{AVATAR}<div style="margin-top:14px">{NAME}</div>
<div class="row" style="flex-wrap:wrap;gap:6px;justify-content:center;margin-top:12px">{hdr_tags()}</div>
<div class="rings">{ring(.92,'var(--go)','Day','OK')}{ring(.70,'var(--go)','Night','45d')}{ring(.35,'var(--cau)','IR','41d')}</div>
<div class="chip" style="justify-content:center;gap:8px"><span class="dim">Home</span><span class="icao">FACT</span><span class="muted">Cape Town Intl</span></div>
<div class="row" style="gap:8px;margin-top:14px;justify-content:center"><button class="btn pri">{ED}Edit</button><button class="btn">{SH}Share card</button></div>
<p class="note" style="margin-top:12px">Public handle. Verified email private.</p></aside>
<main class="bento">
<section class="card glass"><h2>Total time</h2><div class="big mono">412.6</div><div class="dim" style="margin-top:6px">hours - 38.2 in 90 days</div></section>
<section class="card glass"><h2>Night</h2><div class="big mono">112</div><div class="dim" style="margin-top:6px">hours - current</div></section>
<section class="card glass w2-m" style=""><h2>Aerodromes</h2><div class="big mono">46</div><div class="dim" style="margin-top:6px">visited, 9 provinces</div></section>
<section class="card glass w2">{MEMBER}</section>
<section class="card glass"><h2>Activity</h2>{bars()}</section>
<section class="card glass w3"><h2>ATO reviews - anonymous <a>See all 4</a></h2>{REVS}</section>
<section class="card glass w2"><h2>Badges</h2><div class="badges">{BADGES}</div></section>
<section class="card glass"><h2>Saved</h2>{SAVED}</section>
<section class="card glass w2"><h2>Currency <a>Logbook</a></h2>{CUR}</section>
<section class="card glass"><h2>What others see</h2>{PRIV}</section>
</main></div></div></body></html>'''
open('b.html','w').write(B)
open('index.html','w').write(HEAD.format(o='',css='.wrap a{color:var(--acc)}')+'<div class="wrap" style="margin-top:40px"><section class="card glass"><h2>Pilot profile previews</h2><p><a href="a.html">Option A - Credential card</a></p><p><a href="b.html">Option B - Cockpit bento</a></p><p><a href="c.html">C - Liquid Glass</a></p><p><a href="d.html">D - Wallet passes</a></p><p><a href="e.html">E - Spatial</a></p><p><a href="f.html">F - Editorial</a></p><p><a href="g.html">G - Control Center</a></p><p class="note">Add ?t=midnight|pearl|champagne|amethyst</p></section></div></body></html>')
