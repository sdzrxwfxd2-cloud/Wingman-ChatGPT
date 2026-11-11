# v4 mocks: aerodrome list with saved pinned (?filter=on hides them), ATO review form. Sample data only.
h=open('d2badges.html').read()
head=h.split('<body')[0]
import re
head=re.sub(r'<title>.*?</title>','<title>Mock</title>',head)
CSS='''<style>.wrap{max-width:440px;margin:0 auto;padding:18px 16px 40px}
.hd{font-size:26px;font-weight:700;margin:6px 0 12px}
.srch{height:42px;border-radius:14px;padding:0 14px;display:flex;align-items:center;color:var(--tx3);background:var(--gl2);box-shadow:inset 0 0 0 .5px var(--ln);font-size:15px}
.fb{display:flex;gap:8px;margin:12px 0 16px;flex-wrap:wrap}.fc{padding:7px 12px;border-radius:999px;font-size:13px;font-weight:600;background:var(--gl2);box-shadow:inset 0 0 0 .5px var(--ln);color:var(--tx2)}.fc.on{color:#fff;background:var(--acc)}
.sec{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx3);margin:16px 4px 8px}
.ad{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-radius:18px;margin-bottom:8px;background:var(--gl2);box-shadow:inset 0 0 0 .5px var(--ln),inset 0 1px 0 var(--hl)}
.ad b{font-family:"SF Mono",ui-monospace,monospace;font-size:15px;margin-right:10px}.ad .n{font-size:14px;color:var(--tx2)}.ad .s{font-size:12px;color:var(--tx3)}
.flt{font-size:12.5px;color:var(--tx3);margin:0 4px 10px}
.fld{margin-bottom:16px}.fld label{display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx3);margin-bottom:6px}.fld label i{font-style:normal;letter-spacing:.04em;text-transform:none;color:var(--tx3)}
.in{min-height:46px;border-radius:14px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;font-size:15px;background:var(--gl2);box-shadow:inset 0 0 0 .5px var(--ln);color:var(--tx)}.in.ph{color:var(--tx3)}.in.ta{min-height:110px;align-items:flex-start;padding-top:12px}
.seg{display:flex;gap:6px}.seg span{flex:1;text-align:center;padding:10px 0;border-radius:12px;font-size:14px;font-weight:600;background:var(--gl2);box-shadow:inset 0 0 0 .5px var(--ln);color:var(--tx2)}.seg span.on{color:#fff;background:var(--acc)}
.stars{display:flex;gap:6px;font-size:28px;color:var(--acc)}
.anon{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:14px;margin:4px 0 18px;font-size:13.5px;line-height:1.4;color:var(--tx);background:color-mix(in srgb,var(--acc) 12%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--acc) 40%,transparent)}
.anon svg{flex:none;width:18px;height:18px;fill:none;stroke:var(--acc);stroke-width:1.8;margin-top:1px}
.sub{width:100%;height:50px;border:0;border-radius:16px;font:inherit;font-size:16px;font-weight:700;color:#fff;background:var(--acc)}
.one{font-size:12.5px;color:var(--tx3);text-align:center;margin-top:10px}
</style>'''
SAVED=[('FACT','Cape Town Intl','Home'),('FASH','Stellenbosch','Saved'),('FAGG','George','Saved'),('FAOH','Oudtshoorn','Saved')]
ALL=[('FAAB','Alexander Bay','Northern Cape'),('FABE','Bhisho','Eastern Cape'),('FABL','Bloemfontein','Free State'),('FACV','Calvinia','Northern Cape'),('FADN','Durban (Virginia)','KZN'),('FAEL','East London','Eastern Cape')]
ad=lambda i,n,s:f'<div class="ad"><span><b>{i}</b><span class="n">{n}</span></span><span class="s">{s}</span></div>'
aero=head.replace('</head>',CSS+'</head>')+'''<body><div class="wrap"><div class="hd">Aerodromes</div><div class="srch">Search ICAO or name</div>
<div class="fb"><span class="fc" id="fgo">GO</span><span class="fc">Caution</span><span class="fc">Fuel</span><span class="fc">Tar runway</span></div>
<div id="sv"><div class="sec">Saved</div>'''+''.join(ad(*a) for a in SAVED)+'''</div><div id="fn" class="flt" style="display:none">Filter active: showing GO aerodromes only. Saved list returns when the filter is cleared.</div>
<div class="sec">All aerodromes</div>'''+''.join(ad(*a) for a in ALL)+'''</div>
<script>if(new URLSearchParams(location.search).get("filter")==="on"){document.getElementById("sv").style.display="none";document.getElementById("fn").style.display="block";document.getElementById("fgo").classList.add("on")}</script></body></html>'''
open('aero.html','w').write(aero)
rev=head.replace('</head>',CSS+'</head>')+'''<body><div class="wrap"><div class="hd">Review Cape Town Flight Training</div>
<div class="anon"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg><span><b>Your review is anonymous.</b> This is mandatory and cannot be turned off. Your name and email are never shown with it.</span></div>
<div class="fld"><label>Overall rating</label><div class="stars">&#9733;&#9733;&#9733;&#9733;&#9734;</div></div>
<div class="fld"><label>Your review</label><div class="in ta ph">What was training like? Instructors, aircraft, admin, value.</div></div>
<div class="fld"><label>Real total cost (R) <i>- optional</i></label><div class="in ph">e.g. 185 000</div></div>
<div class="fld"><label>Licence trained for <i>- optional</i></label><div class="seg"><span>PPL</span><span class="on">CPL</span><span>Night</span><span>IR</span><span>Instr.</span></div></div>
<div class="fld"><label>When <i>- optional</i></label><div class="in ph"><span>Month / Year</span><span>e.g. 03 / 2025</span></div></div>
<button class="sub">Submit review</button><div class="one">One review per pilot per ATO. You can edit yours later.</div></div></body></html>'''
open('review.html','w').write(rev);print('ok')
