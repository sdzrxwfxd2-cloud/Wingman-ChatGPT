# D2-pass: one white/gold/beige pass for day, one charcoal/gold/beige pass for night
import re
h=open('d2.html').read()
CSS='''
/* D2-pass: brushed silver/white card. Day pass (Pearl, Champagne), night pass (Midnight, Amethyst). Gold only on the Founding Member badge. ?m=normal hides founding badge and membership pass. */
html.normal .fm,html.normal .p2{display:none!important}
html[data-theme=day] .passes{--pbg:repeating-linear-gradient(90deg,rgba(255,255,255,.0) 0 2px,rgba(255,255,255,.35) 2px 3px),linear-gradient(135deg,#FFFFFF 0%,#E6E8EC 38%,#F7F8FA 55%,#CDD1D7 100%);--ptx:#16181C;--ptx2:rgba(22,24,28,.62);--ptx3:rgba(22,24,28,.45);--sil:#6E747D;--gold1:#A8822E;--gold2:#C9A24A;--beige:rgba(255,255,255,.7);--beige2:#C9CDD3;--pln:rgba(90,96,106,.22);--psh:0 1px 0 #fff inset,0 0 0 .5px rgba(90,96,106,.35),0 24px 50px -24px rgba(20,25,35,.35)}
html[data-theme=night] .passes{--pbg:repeating-linear-gradient(90deg,rgba(255,255,255,0) 0 2px,rgba(255,255,255,.03) 2px 3px),linear-gradient(135deg,#4A4F57 0%,#23262B 40%,#3A3E45 58%,#15171A 100%);--ptx:#F2F4F7;--ptx2:rgba(242,244,247,.66);--ptx3:rgba(242,244,247,.42);--sil:#C3C8D0;--gold1:#D9B866;--gold2:#C9A24A;--beige:rgba(255,255,255,.08);--beige2:#5A6068;--pln:rgba(200,206,214,.20);--psh:0 1px 0 rgba(255,240,210,.10) inset,0 0 0 .5px rgba(200,206,214,.30),0 30px 60px -28px rgba(0,0,0,.8)}
.passes .pass,.passes .pass.p1,.passes .pass.p2{background:var(--pbg)!important;color:var(--ptx);box-shadow:var(--psh)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
.passes .pass .ph{color:var(--sil);font-weight:600}
.passes .pass h1,.passes .pass b,.passes .pass .icao{color:var(--ptx)!important}
.passes .pass .ttl{color:var(--sil)}
.passes .pass .muted,.passes .pass .dim,.passes .pass .note,.passes .pass .u{color:var(--ptx2)!important}
.passes .pass .l{color:var(--ptx3)!important}
.passes .pass .pin{stroke:var(--sil)}
.passes .pass.lic{background:linear-gradient(var(--beige),var(--beige)) left bottom/100% 0 no-repeat,var(--pbg)!important}
.passes .pass.lic::before{content:"";position:absolute;left:0;right:0;bottom:30px;height:1px;background:linear-gradient(90deg,transparent,var(--sil),transparent);opacity:.5}
.passes .tag{background:var(--beige)!important;color:var(--ptx)!important;box-shadow:inset 0 0 0 .5px var(--pln)!important;border:0!important}
.passes .tag.acc{background:transparent!important;color:var(--ptx)!important;box-shadow:inset 0 0 0 1px var(--sil)!important}
.passes .tag.gold{background:linear-gradient(135deg,#F3E2B0,#C9A24A 45%,#8A6A10 100%)!important;color:#1A1408!important;box-shadow:0 2px 8px rgba(138,106,16,.35)!important}
.passes .strp{border-top-color:var(--pln)}.passes .strp>div{border-left-color:var(--pln)}
.passes .strp b{color:var(--ptx)!important}.passes .strp .due b{color:var(--sil)!important}
.passes .av i{background:linear-gradient(160deg,var(--beige),var(--beige2))!important;color:var(--sil)!important;box-shadow:none!important}
.passes .av{box-shadow:0 6px 18px rgba(0,0,0,.18)!important}
.passes .btn{background:var(--beige)!important;color:var(--ptx)!important;box-shadow:inset 0 0 0 .5px var(--pln)!important;border:0!important}
.passes .btn svg{stroke:var(--sil)!important}
.passes .btn.pri{background:var(--ptx)!important;color:var(--pbgs,#fff)!important}.passes .btn.pri svg{stroke:currentColor!important}
html[data-theme=night] .passes .btn.pri{color:#15171A!important}
.passes .pass::after{background:linear-gradient(120deg,transparent 35%,rgba(255,255,255,.22) 48%,transparent 60%)!important;background-size:250% 100%!important}
'''
h=h.replace('</style>',CSS+'</style>',1)
h=re.sub(r'<title>.*?</title>','<title>Pilot profile - D2-pass - silver card, gold founding badge</title>',h)
h=h.replace('Design preview D2 - Wallet, boarding-pass strip, Nippo','Design preview D2-pass - silver card, day and night')
h=h.replace('<span class="tag gold">FOUNDING MEMBER</span>','<span class="tag gold fm">FOUNDING MEMBER</span>',1)
h=h.replace('<div class="bdg won"><div><svg viewBox="0 0 24 24"><path d="M12 3l2.6','<div class="bdg won fm"><div><svg viewBox="0 0 24 24"><path d="M12 3l2.6',1)
h=h.replace('<script src="theme.js"></script>','<script src="theme.js"></script><script>if(new URLSearchParams(location.search).get("m")=="normal")document.documentElement.classList.add("normal")</script>',1)
assert h.count(' fm"')==2
open('d2pass.html','w').write(h);print('ok')
