# D refinements: D1/D2/D3 - Wallet base, premium currency, no gold avatar ring
import re
src=open('d.html').read()
rings=re.search(r'<div class="rings">.*?</svg>IR</div></div>',src).group(0)
oldname='<h1>@capecpl_mt</h1><div class="muted" style="font-size:14px;margin-top:2px">Commercial pilot - Cape Town</div>'
CUR=[('Day','Passenger, 3 in 90 days','OK','62 days',.92),('Night','Night, 3 in 90 days','45','days left',.70),('IR','Revalidation due','41','days left',.35)]
BASE='''
@font-face{font-family:Clash;src:url(../fonts/app/clash-display-600.e748ea11.woff2) format("woff2");font-weight:600}
@font-face{font-family:ClashR;src:url(../fonts/app/clash-display-400.34b7af35.woff2) format("woff2")}
@font-face{font-family:Nippo;src:url(../fonts/app/nippo-500.c793aaa1.woff2) format("woff2");font-weight:500}
@font-face{font-family:Satoshi;src:url(../fonts/app/satoshi-500.af02a722.woff2) format("woff2");font-weight:500}
@font-face{font-family:GSans;src:url(../fonts/app/general-sans-600.94a2a0e1.woff2) format("woff2");font-weight:600}
:root{--ok:color-mix(in srgb,var(--tx) 78%,var(--acc));--due:color-mix(in srgb,var(--tx) 55%,#C9A24A)}
.av{background:none!important;padding:0!important;box-shadow:0 10px 30px rgba(0,0,0,.25),inset 0 0 0 .5px var(--hl)}
.av i{background:linear-gradient(160deg,var(--gl2),var(--bg2))!important;box-shadow:inset 0 0 0 .5px var(--ln);font-family:Clash,system-ui;font-weight:600!important;letter-spacing:.02em!important}
.pass{margin-top:-18px!important;padding-bottom:34px!important;min-height:0!important}.pass:first-child{margin-top:0!important}
.pass{box-shadow:0 1px 0 var(--hl) inset,0 30px 60px -30px rgba(0,0,0,.45),var(--sh)}
.pass::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(120deg,transparent 35%,rgba(255,255,255,.09) 48%,transparent 60%);background-size:250% 100%;animation:sheen 7s ease-in-out infinite}
@keyframes sheen{0%,60%{background-position:120% 0}100%{background-position:-120% 0}}
.cur-t{display:grid;gap:14px;margin-top:4px}
@keyframes grow{from{transform:scaleX(0)}}
@keyframes up{from{opacity:0;transform:translateY(6px)}}
.dot.g{background:var(--ok)!important}.dot.a{background:var(--due)!important}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
'''
V={}
# D1: thin progress bars, Clash Display title
V['d1']=('D1 - Wallet, hairline bars, Clash Display',BASE+'''
.ttl{font-family:Clash,system-ui;font-weight:600;font-size:13px;letter-spacing:.22em;text-transform:uppercase;color:var(--tx2);margin-top:6px}
h1{font-family:Clash,system-ui;font-weight:600;letter-spacing:-.01em;font-size:28px}
.br{display:grid;grid-template-columns:64px 1fr auto;align-items:center;gap:12px;font-size:13px}
.br .l{color:var(--tx2);letter-spacing:.08em;text-transform:uppercase;font-size:11px}
.br .tr{height:3px;border-radius:3px;background:var(--ln);overflow:hidden}
.br .tr i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,color-mix(in srgb,var(--ok) 40%,transparent),var(--ok));transform-origin:left;animation:grow 1.6s cubic-bezier(.22,.8,.2,1) both .4s}
.br.due .tr i{background:linear-gradient(90deg,color-mix(in srgb,var(--due) 40%,transparent),var(--due))}
.br .n{font-family:"SF Mono",ui-monospace,monospace;font-size:12px;color:var(--tx);min-width:64px;text-align:right}
''',lambda:'<div class="cur-t">'+''.join(f'<div class="br{" due" if p<.5 else ""}"><span class="l">{a}</span><span class="tr"><i style="width:{p*100:.0f}%"></i></span><span class="n">{v if v=="OK" else v+" days"}</span></div>' for a,b,v,u,p in CUR)+'</div>',
'<h1>@capecpl_mt</h1><div class="ttl">Commercial Pilot &middot; Cape Town</div>')
# D2: pass strip with big numerals, Nippo title
V['d2']=('D2 - Wallet, boarding-pass strip, Nippo',BASE+'''
.ttl{font-family:Nippo,system-ui;font-weight:500;font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:var(--tx2);margin-top:8px}
h1{font-family:Satoshi,system-ui;font-weight:500;letter-spacing:-.02em;font-size:27px}
.strp{display:grid;grid-template-columns:repeat(3,1fr);border-top:.5px dashed var(--ln);margin-top:6px;padding-top:12px}
.strp>div{padding:0 12px;border-left:.5px solid var(--ln);animation:up .9s cubic-bezier(.22,.8,.2,1) both}
.strp>div:first-child{border-left:0;padding-left:0}.strp>div:nth-child(2){animation-delay:.12s}.strp>div:nth-child(3){animation-delay:.24s}
.strp .l{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--tx3)}
.strp b{display:block;font-family:Nippo,system-ui;font-weight:500;font-size:30px;letter-spacing:.02em;line-height:1.1;margin-top:4px;color:var(--ok)}
.strp .due b{color:var(--due)}
.strp .u{font-size:11px;color:var(--tx2)}
''',lambda:'<div class="strp">'+''.join(f'<div class="{"due" if p<.5 else ""}"><span class="l">{a}</span><b>{v}</b><span class="u">{u}</span></div>' for a,b,v,u,p in CUR)+'</div>',
'<h1>@capecpl_mt</h1><div class="ttl">Commercial Pilot</div><div class="muted" style="font-size:13px;margin-top:2px">Cape Town</div>')
# D3: glass chips with status dots, General Sans title
V['d3']=('D3 - Wallet, glass chips, General Sans',BASE+'''
.ttl{display:inline-block;font-family:GSans,system-ui;font-weight:600;font-size:12.5px;letter-spacing:.06em;color:var(--tx);margin-top:8px;padding:4px 10px;border-radius:999px;background:var(--gl2);box-shadow:inset 0 0 0 .5px var(--ln)}
h1{font-family:GSans,system-ui;font-weight:600;letter-spacing:-.02em;font-size:27px}
.chips{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.cp{padding:12px;border-radius:16px;background:var(--gl2);box-shadow:inset 0 0 0 .5px var(--ln),inset 0 1px 0 var(--hl);backdrop-filter:blur(18px);animation:up .9s cubic-bezier(.22,.8,.2,1) both}
.cp:nth-child(2){animation-delay:.1s}.cp:nth-child(3){animation-delay:.2s}
.cp .h{display:flex;align-items:center;gap:6px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--tx2)}
.cp .d{width:6px;height:6px;border-radius:50%;background:var(--ok);box-shadow:0 0 0 3px color-mix(in srgb,var(--ok) 15%,transparent)}
.cp.due .d{background:var(--due);box-shadow:0 0 0 3px color-mix(in srgb,var(--due) 18%,transparent);animation:pulse 2.4s ease-in-out infinite}
@keyframes pulse{50%{box-shadow:0 0 0 6px transparent}}
.cp b{display:block;font-family:GSans,system-ui;font-weight:600;font-size:22px;margin-top:6px;color:var(--tx)}
.cp span.u{font-size:11px;color:var(--tx3)}
''',lambda:'<div class="chips">'+''.join(f'<div class="cp{" due" if p<.5 else ""}"><div class="h"><i class="d"></i>{a}</div><b>{v if v=="OK" else v+"d"}</b><span class="u">{"Current" if v=="OK" else "until due"}</span></div>' for a,b,v,u,p in CUR)+'</div>',
'<h1>@capecpl_mt</h1><div class="muted" style="font-size:13px;margin-top:2px">Cape Town</div><div class="ttl">Commercial Pilot</div>')
for k,(t,css,cur,name) in V.items():
  h=src.replace(rings,cur()).replace(oldname,name).replace('</style>',css+'</style>')
  h=re.sub(r'<title>.*?</title>',f'<title>Pilot profile - {t}</title>',h).replace('Design preview D - Wallet passes',f'Design preview {t}')
  assert cur()[:10] in h and name in h
  open(k+'.html','w').write(h)
print('ok')
