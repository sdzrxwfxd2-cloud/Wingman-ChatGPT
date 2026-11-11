# D2 + licence badges: Founding Member kept, main licence badge (premium), secondary ratings/instructor (existing .tag style)
import re
h=open('d2.html').read()
old='<span class="tag gold">FOUNDING MEMBER</span><span class="tag acc">CPL(A)</span><span class="tag">Night</span><span class="tag">FIR</span><span class="tag">Grade III Instructor</span>'
assert old in h
new=('<span class="tag gold">FOUNDING MEMBER</span>'
 '<span class="bdg-brk"></span>'
 '<span class="tag lic-main" data-lic><svg viewBox="0 0 24 24"><path d="M2 13l8-2 4-7 2 1-2 6 6 1 2 2-8 1-4 5H8l2-5-6 1z"/></svg><span class="lic-t">CPL (A)</span></span>'
 '<span class="bdg-brk"></span>'
 '<span class="tag">Night rating</span><span class="tag">Instrument rating</span><span class="tag">Grade 3 Instructor</span><span class="tag">Grade 2 Instructor</span>')
h=h.replace(old,new)
css='''
/* No Logbook yet: hide hours and currency */\n.pass:has(>.ph>span:first-child:is(.x,*)):has(.strp),section.card:has(>h2:first-child):is(.hide-nolog){display:none!important}\n.bdg-brk{flex-basis:100%;height:0}
.tag.lic-main{padding:5px 12px 5px 9px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#fff;
 background:linear-gradient(135deg,color-mix(in srgb,var(--acc) 70%,#fff) 0%,var(--acc) 45%,color-mix(in srgb,var(--acc) 70%,#000) 100%);
 box-shadow:inset 0 1px 0 rgba(255,255,255,.45),inset 0 0 0 .5px rgba(255,255,255,.25),0 6px 16px -6px color-mix(in srgb,var(--acc) 70%,transparent);position:relative;overflow:hidden}
.tag.lic-main svg{width:13px;height:13px;fill:currentColor}
.tag.lic-main::after{content:"";position:absolute;inset:0;background:linear-gradient(120deg,transparent 35%,rgba(255,255,255,.35) 50%,transparent 65%);background-size:250% 100%;animation:sheen 6s ease-in-out infinite}
'''
h=h.replace('</style>',css+'</style>',1)
js='<script>(function(){var l=new URLSearchParams(location.search).get("lic");var m={cpl:"CPL (A)",ppl:"PPL (A)",spl:"SPL (A)"};if(l&&m[l])document.querySelectorAll(".lic-t").forEach(function(e){e.textContent=m[l]})})()</script>'
h=h.replace('</body>',js+'</body>')
h=re.sub(r'<title>.*?</title>','<title>Pilot profile - D2 with licence badges</title>',h)
import re as _r
for t in ('Hours','Currency detail'):
  h,n=_r.subn(r'<section class="card lg rv([^"]*)">(\s*<h2>'+t+')',r'<section class="card lg rv\1 hide-nolog">\2',h);assert n==1,t
# v3: actions on the pass, no badges grid, 5 saved slots, trimmed privacy
EDIT='<button class="pbtn pri"><svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>Edit</button>'
SHARE='<button class="pbtn"><svg viewBox="0 0 24 24"><path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13"/></svg>Share card</button>'
a='<span class="tag">Grade 2 Instructor</span></div>'
assert a in h
h=h.replace(a,a+'<div class="pact">'+EDIT+SHARE+'</div>',1)
h,n=_r.subn(r'<div class="pass lg rv" style="padding-top:26px"><div class="row" style="gap:8px">.*?Share card</button></div></div>','',h,count=1,flags=_r.S);assert n==1
h,n=_r.subn(r'<section class="card lg rv[^"]*">\s*<h2>Badges</h2>.*?</section>','',h,count=1,flags=_r.S);assert n==1
SV=[('FACT','Cape Town Intl','Home'),('FASH','Stellenbosch','Saved'),('FAGG','George','Saved'),('FAOH','Oudtshoorn','Saved')]
sv=''.join(f'<div class="chip"><span><span class="icao">{i}</span> <span class="muted">{n}</span></span><span class="dim">{t}</span></div>' for i,n,t in SV)
sv+='<div class="chip empty"><span><span class="icao">+</span> <span class="muted">Add an aerodrome</span></span><span class="dim">Slot 5</span></div>'
h,n=_r.subn(r'(<section class="card lg rv[^"]*">\s*<h2>Saved)</h2>.*?</section>',lambda m:m.group(1)+' <span class="dim" style="float:right;font-weight:500;letter-spacing:0">4 / 5</span></h2>'+sv+'</section>',h,count=1,flags=_r.S);assert n==1
for t in ['Show total hours','Show currency and medical']:
  h,n=_r.subn(r'<div class="priv"><span>'+t+r'</span><span class="sw[^"]*"></span></div>\n?','',h);assert n==1,t
h=h.replace('</style>','''.pact{display:flex;gap:8px;margin-top:14px;padding-top:12px;border-top:.5px dashed var(--ln)}
.pbtn{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:999px;border:0;font-family:inherit;font-weight:600;font-size:12.5px;color:var(--tx);background:var(--gl2);box-shadow:inset 0 0 0 .5px var(--ln),inset 0 1px 0 var(--hl);cursor:pointer}
.pbtn svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.pbtn.pri{color:#fff;background:var(--acc);box-shadow:0 4px 12px -4px color-mix(in srgb,var(--acc) 70%,transparent)}
.chip.empty{opacity:.7;background:transparent;border:1px dashed var(--ln)}
</style>''',1)
# v4: licence badge plain (no sheen, no plane icon), edit sheet (?sheet=edit)
h=_r.sub(r'(<span class="tag lic-main" data-lic>)<svg.*?</svg>',r'\1',h)
h=h.replace('</style>','''.tag.lic-main::after{content:none!important;animation:none!important}.tag.lic-main{padding:5px 12px!important}
.shv{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:50;display:none;align-items:flex-end}.shv.on{display:flex}
.sheet{width:100%;box-sizing:border-box;border-radius:24px 24px 0 0;padding:10px 20px 34px;background:var(--bg2,var(--gl2));backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);box-shadow:0 -10px 40px rgba(0,0,0,.25),inset 0 .5px 0 var(--hl);color:var(--tx)}
.sheet .grab{width:38px;height:5px;border-radius:3px;background:var(--ln);margin:0 auto 14px}
.sheet .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}.sheet .top b{font-size:17px}
.sheet .lnk{background:none;border:0;font:inherit;font-size:16px;color:var(--tx2)}.sheet .lnk.sv{color:var(--acc);font-weight:700}
.fld{margin-bottom:16px}.fld label{display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx3);margin-bottom:6px}
.fld .in{height:46px;border-radius:14px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;font-size:16px;background:var(--gl2);box-shadow:inset 0 0 0 .5px var(--ln)}
.fld .in.focus{box-shadow:inset 0 0 0 1.5px var(--acc)}
.fld .in.lock{opacity:.55}.fld .hint{font-size:12px;color:var(--tx3);margin-top:6px}
.fld .in svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8}
</style>''',1)
SHEET='''<div class="shv" id="editSheet"><div class="sheet"><div class="grab"></div><div class="top"><button class="lnk">Cancel</button><b>Edit profile</b><button class="lnk sv">Save</button></div>
<div class="fld"><label>Display name</label><div class="in focus">MT</div><div class="hint">Shown on your pass and share card.</div></div>
<div class="fld"><label>Handle</label><div class="in lock"><span>@capecpl_mt</span><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg></div><div class="hint">Your handle cannot be changed.</div></div>
</div></div>'''
h=h.replace('</body>',SHEET+'<script>if(new URLSearchParams(location.search).get("sheet")==="edit")document.getElementById("editSheet").classList.add("on");document.querySelectorAll(".pbtn.pri").forEach(function(b){b.onclick=function(){document.getElementById("editSheet").classList.add("on")}});document.querySelectorAll("#editSheet .lnk").forEach(function(b){b.onclick=function(){document.getElementById("editSheet").classList.remove("on")}})</script></body>',1)
open('d2badges.html','w').write(h);print('ok')
