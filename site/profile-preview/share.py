# Share card mock (1080x1350): pass identity, licence, badges, Wingman mark
import re
h=open('d2badges.html').read()
head=h.split('<body')[0]
body='''<body><div class="sc"><div class="sci">
<div class="ph"><span>Wingman pilot pass</span><span>CPL(A) - ZA</span></div>
<div class="row" style="gap:40px;margin-top:40px"><div class="av" style="width:220px;height:220px"><i style="font-size:80px">MT</i></div>
<div><h1 style="font-size:76px">@capecpl_mt</h1><div class="ttl" style="font-size:28px">Commercial Pilot</div><div class="muted" style="font-size:32px;margin-top:6px">Cape Town &middot; Home FACT</div></div></div>
<div class="bd"><span class="tag gold">FOUNDING MEMBER</span><span class="bdg-brk"></span><span class="tag lic-main">CPL (A)</span><span class="bdg-brk"></span><span class="tag">Night rating</span><span class="tag">Instrument rating</span><span class="tag">Grade 3 Instructor</span><span class="tag">Grade 2 Instructor</span></div>
<div class="ft"><div><div class="wm">WINGMAN</div><div class="muted" style="font-size:24px">Pilot profile &middot; wingman-aero-app-3.netlify.app</div></div><div class="mono dim" style="font-size:22px;letter-spacing:.2em">MEMBER NO. 0007</div></div>
</div></div></body></html>'''
css='''<style>html,body{margin:0;width:1080px;height:1350px;overflow:hidden}
body{background:var(--bg,#f4f5f8);display:flex;align-items:center;justify-content:center}
.sc{width:960px;height:1230px;border-radius:64px;padding:72px;box-sizing:border-box;background:linear-gradient(150deg,color-mix(in srgb,var(--acc) 30%,#fff),color-mix(in srgb,var(--acc) 8%,#fff) 60%,#fff);box-shadow:0 1px 0 #fff inset,0 0 0 1px var(--ln),0 60px 120px -50px rgba(20,25,60,.45);position:relative;overflow:hidden}
.sci{height:100%;display:flex;flex-direction:column}
.ph{display:flex;justify-content:space-between;font-size:24px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx3)}
.bd{display:flex;flex-wrap:wrap;gap:16px;margin-top:70px}.bd .tag{font-size:30px;padding:14px 28px}.bd .tag.lic-main{font-size:34px;padding:16px 32px}.bd .tag.lic-main svg{width:32px;height:32px}
.ft{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;border-top:2px dashed var(--ln);padding-top:36px}
.wm{font-family:Nippo,system-ui;font-size:52px;letter-spacing:.35em;color:var(--acc)}
.av{display:flex;align-items:center;justify-content:center;border-radius:50%}
</style>'''
open('share.html','w').write(head.replace('</head>',css+'</head>')+body);print('ok')
