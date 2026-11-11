#!/usr/bin/env python3
"""DEMO ONLY (MT-approved 28 Oct 2026). Re-runnable: puts the calculator_v5 page into zero_c/calculator.html.
Touches only the <section class="hello">…</section> inside <main class="wrap"> (or the previous WMCALC block).
Frame, top bar, iOS pill, More panel and pull-down search are left byte-for-byte as they are. Backs up first."""
import re,shutil,time,sys
F=sys.argv[1] if len(sys.argv)>1 else '/workspace/goaround/wingman_v2/design_review/zero_c/calculator.html'
s=open(F).read();b=F+'.bak_calcv4_'+time.strftime('%H%M%S');shutil.copy2(F,b);print('backup',b)
BLK=('<!--WMCALC--><h1 id="greet" hidden>Calculator</h1><iframe id="wmCalc" class="zcal" title="Calculator" scrolling="no" src="../calculator_v5/index.html" style="height:2400px"></iframe>'
     '<style id="wm-calc-css">#wmCalc{display:block;border:0;width:100vw;margin-left:calc(50% - 50vw);background:transparent;color-scheme:normal}</style><!--/WMCALC-->')
if '<!--WMCALC-->' in s: s=re.sub(r'<!--WMCALC-->.*?<!--/WMCALC-->',lambda m:BLK,s,flags=re.S)
else:
  m=re.search(r'(<main class="wrap">)\s*<section class="hello">.*?</section>',s,flags=re.S);assert m,'hello section not found'
  s=s[:m.start()]+m.group(1)+BLK+s[m.end():]
open(F,'w').write(s);print('ok')
