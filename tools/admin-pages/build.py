import hashlib,sys,os
root=sys.argv[1]; site=os.path.join(root,'site')
def h(p): return hashlib.sha1(open(os.path.join(site,p),'rb').read()).hexdigest()[:10]
HEAD='''<!doctype html>
<html lang="en" data-theme="night" data-pal="purple">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>Go Around · {title}</title>
<link rel="icon" href="/favicon-32.png">
<link rel="stylesheet" href="/fonts/wm-fonts.css">
<link rel="stylesheet" href="/admin-x/ax.css?v={vcss}">
<script>
(function(){{try{{var L=localStorage,H=document.documentElement,q=new URLSearchParams(location.search).get('theme');
var m={{midnight:['night','black'],black:['night','black'],amethyst:['night','purple'],purple:['night','purple'],pearl:['day','white'],white:['day','white'],champagne:['day','beige'],beige:['day','beige']}};
var t=m[q]||m[L.getItem('ga-admin-theme')]||null;
if(!t){{var th=L.getItem('wm-theme')==='day'?'day':'night';t=th==='day'?['day',L.getItem('wm-pal-day')==='beige'?'beige':'white']:['night',L.getItem('wm-pal')==='purple'?'purple':'black']}}
H.dataset.theme=t[0];H.dataset.pal=t[1]}}catch(e){{}}}})();
</script>
</head>
<body>
<div id="login" class="gate" hidden>
  <form class="card glass gatebox" id="login-form" autocomplete="on">
    <p class="eyebrow">Private</p>
    <h1>{title}</h1>
    <p class="lede">Only for the people who run Go Around. Use the same admin password as /admin.</p>
    <label>Admin password
      <input id="pw" type="password" name="password" required autocomplete="current-password">
    </label>
    <p class="err" id="login-err" hidden></p>
    <button class="btn" type="submit">Open</button>
  </form>
</div>
<div id="app" hidden>
  <header class="top glass">
    <a class="back" href="/admin/" aria-label="Back to Traffic">‹</a>
    <div class="ttl"><h1>{title}</h1><p id="sub">Loading…</p></div>
    <div class="thm" role="group" aria-label="Theme"><button data-t="amethyst" title="Amethyst" aria-label="Amethyst"></button><button data-t="midnight" title="Midnight" aria-label="Midnight"></button><button data-t="pearl" title="Pearl" aria-label="Pearl"></button><button data-t="champagne" title="Champagne" aria-label="Champagne"></button></div>
    <button id="re" class="btn icon" title="Reload" aria-label="Reload">↻</button>
    <button id="out" class="btn ghost" type="button">Log out</button>
  </header>
  <nav class="tabs wrap" id="tabs" aria-label="Admin pages"></nav>
{body}
  <p class="foot">{foot} Times in SAST. Private page · not linked from the public menus · <a href="/privacy.html">Privacy</a></p>
</div>
<script src="/admin-x/ax.js?v={vjs}"></script>
<script>
{script}
</script>
</body>
</html>
'''
here=os.path.dirname(os.path.abspath(__file__))
for name in ['admin-visits','admin-status','admin-visitors','admin-visitor-log','admin-sitestatus','admin-dashboard']:
    src=open(os.path.join(here,name+'.txt')).read()
    parts=dict(x.split('\n',1) for x in src.split('\n@@')[1:])
    out=HEAD.format(title=parts['title'].strip(),body=parts['body'].rstrip(),script=parts['script'].strip(),foot=parts['foot'].strip(),vcss=h('admin-x/ax.css'),vjs=h('admin-x/ax.js'))
    open(os.path.join(site,name+'.html'),'w').write(out)
print('built')
