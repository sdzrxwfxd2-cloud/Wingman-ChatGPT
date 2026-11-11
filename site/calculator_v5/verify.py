import asyncio,subprocess,time,json
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','serve.py','8787'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
U='http://localhost:8787/design_review/zero_c/calculator.html'
TH=[('pearl','day','wm-pal-day','white'),('champagne','day','wm-pal-day','beige'),('beige','day','wm-pal-day','warm'),('midnight','night','wm-pal','black'),('amethyst','night','wm-pal','purple')]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    rep=[]
    for dev,w,h,mob in [('phone',390,844,1),('ipad',820,1180,1),('desktop',1440,900,0)]:
      for name,t,k,v in TH:
        ctx=await b.new_context(viewport={'width':w,'height':h},device_scale_factor=2 if w<800 else 1,is_mobile=bool(mob),has_touch=bool(mob))
        await ctx.add_init_script(f"localStorage.setItem('wm-theme','{t}');localStorage.setItem('{k}','{v}')")
        pg=await ctx.new_page();errs=[];pg.on('response',lambda r:r.status>=400 and errs.append(f'{r.status} {r.url}'));pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and 'Failed to load resource' not in m.text and errs.append(m.text))
        await pg.goto(U,wait_until='networkidle');await pg.wait_for_timeout(3500)
        q=pg.frame(url=lambda u:"calculator_v5" in u);info=await q.evaluate("""async()=>{await document.fonts.ready;const r=[...document.querySelectorAll('.res')].map(x=>x.innerText);return{pal:document.documentElement.dataset.theme+'/'+document.documentElement.dataset.pal,sat5:[...document.fonts].some(f=>f.family.replace(/["']/g,'')=='Satoshi'&&f.weight=='500'&&f.status=='loaded'),sat7:[...document.fonts].some(f=>f.family.replace(/["']/g,'')=='Satoshi'&&f.weight=='700'&&f.status=='loaded'),clash:document.fonts.check('600 20px "Clash Display"'),loaded:[...document.fonts].filter(f=>f.status=='loaded').map(f=>f.family+' '+f.weight),bad:r.filter(t=>/NaN|Infinity|undefined/.test(t)||!t.trim()).length,cards:r.length,ovf:document.documentElement.scrollWidth>innerWidth,da:document.querySelector('#daVal').innerText,src:document.querySelector('#srcLine').innerText,note:document.querySelector('#wxNote').innerText}}""")
        rep.append(dict(dev=dev,theme=name,errs=errs,**info))
        if (dev,name) in [('phone','pearl'),('phone','midnight'),('ipad','pearl'),('desktop','pearl'),('desktop','midnight')]:
          await pg.screenshot(path=f'shots/{dev}_{name}.png')
          await pg.screenshot(path=f'shots/{dev}_{name}_full.png',full_page=True)
        await ctx.close()
    json.dump(rep,open('shots/verify.json','w'),indent=1)
    for r in rep: print(r['dev'],r['theme'],r['pal'],'errs',len(r['errs']),[e for e in r['errs'] if '/zero_c/wst/' not in e],'bad',r['bad'],'/',r['cards'],'sat',r['sat5'],r['sat7'],'clash',r['clash'],'ovf',r['ovf'],'DA',r['da'],r['src'][:50])
    print(rep[0]['loaded'])
    await b.close()
asyncio.run(main());srv.terminate()
