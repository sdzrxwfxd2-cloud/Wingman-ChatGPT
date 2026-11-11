import asyncio,subprocess,time,json
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','serve.py','8813'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
B='http://localhost:8813/design_review/'
TH={'pearl':('day','wm-pal-day','white'),'midnight':('night','wm-pal','black')}
out={}
async def mk(b,w,h,theme,mode='auto'):
  t,k,v=TH[theme];mob=w<768
  ctx=await b.new_context(viewport={'width':w,'height':h},device_scale_factor=2 if mob else 1,is_mobile=mob,has_touch=mob)
  await ctx.add_init_script(f"localStorage.setItem('wm-theme','{t}');localStorage.setItem('{k}','{v}');localStorage.setItem('wm-da',JSON.stringify({{mode:'{mode}',src:'metar',time:'now',icao:'FACT'}}))")
  return ctx
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    # phone pixel diff v4 vs v5 (standalone pages, same moment)
    for ver in ['v4','v5']:
      ctx=await mk(b,390,844,'pearl');pg=await ctx.new_page();await pg.goto(B+f'calculator_{ver}/index.html',wait_until='networkidle');await pg.wait_for_timeout(4000)
      await pg.evaluate("document.getAnimations().forEach(a=>{try{a.finish()}catch(e){}})");await pg.wait_for_timeout(300)
      await pg.screenshot(path=f'shots/phone_cmp_{ver}.png',full_page=True);await ctx.close()
    for dev,w,h in [('desktop1440',1440,900),('ipad1024',1024,1366)]:
      for th in ['pearl','midnight']:
        ctx=await mk(b,w,h,th);pg=await ctx.new_page();await pg.goto(B+'zero_c/calculator.html',wait_until='networkidle');await pg.wait_for_timeout(4500)
        q=pg.frame(url=lambda u:'calculator_v5' in u)
        r=await q.evaluate("()=>{const a=document.querySelector('#daCard').getBoundingClientRect(),c=document.querySelector('.dactl').getBoundingClientRect();return{L:[a.left,a.top,a.width,a.height],R:[c.left,c.top,c.width,c.height],gap:c.left-a.right,lm:a.left,rm:innerWidth-c.right,da:daVal.innerText,src:srcLine.innerText}}")
        out[f'{dev}_{th}']=r;await pg.screenshot(path=f'shots/auto_FACT_{dev}_{th}.png',full_page=True);await ctx.close()
    for dev,w,h in [('phone',390,844),('desktop1440',1440,900)]:
      ctx=await mk(b,w,h,'pearl','manual');pg=await ctx.new_page();await pg.goto(B+'zero_c/calculator.html',wait_until='networkidle');await pg.wait_for_timeout(3000)
      q=pg.frame(url=lambda u:'calculator_v5' in u)
      await q.fill('#mOat','30');await q.fill('#mQnh','1013');await q.fill('#mElev','0');await q.fill('#mRh','0');await pg.wait_for_timeout(800);d0=await q.inner_text('#daVal')
      await q.fill('#mRh','100');await pg.wait_for_timeout(800);d1=await q.inner_text('#daVal');sub=await q.inner_text('#daSub')
      out[f'manual_{dev}']=dict(rh0=d0,rh100=d1,sub=sub)
      await pg.screenshot(path=f'shots/manual_humidity_{dev}.png',full_page=(w<768));await ctx.close()
    ctx=await mk(b,390,844,'pearl');pg=await ctx.new_page();await pg.goto(B+'zero_c/calculator.html',wait_until='networkidle');await pg.wait_for_timeout(4000)
    await pg.screenshot(path='shots/auto_FACT_phone_pearl.png',full_page=True);await ctx.close()
    # video desktop
    ctx=await b.new_context(viewport={'width':1440,'height':900},record_video_dir='shots/vid',record_video_size={'width':1440,'height':900})
    await ctx.add_init_script("localStorage.setItem('wm-theme','day');localStorage.setItem('wm-pal-day','white');localStorage.setItem('wm-da',JSON.stringify({mode:'auto',src:'metar',time:'now',icao:'FACT'}))")
    pg=await ctx.new_page();await pg.goto(B+'zero_c/calculator.html',wait_until='networkidle');await pg.wait_for_timeout(4000);q=pg.frame(url=lambda u:'calculator_v5' in u)
    await q.click('#modeSeg button[data-v=manual]');await pg.wait_for_timeout(1200);await q.click('#mRh')
    for c in '85':await pg.keyboard.type(c);await pg.wait_for_timeout(500)
    await pg.wait_for_timeout(1500);await q.fill('#mRh','');await pg.wait_for_timeout(1200);await q.click('#modeSeg button[data-v=auto]');await pg.wait_for_timeout(3500)
    await ctx.close();await b.close()
asyncio.run(main());srv.terminate();json.dump(out,open('shots/v5_report.json','w'),indent=1);print(json.dumps(out,indent=1))
