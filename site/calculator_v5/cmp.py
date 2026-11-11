import asyncio,subprocess,time
from playwright.async_api import async_playwright
from PIL import Image,ImageChops
srv=subprocess.Popen(['python3','serve.py','8813'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for n,ver in [('a','v4'),('b','v4'),('c','v5')]:
      ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
      await ctx.add_init_script("localStorage.setItem('wm-theme','day');localStorage.setItem('wm-pal-day','white');localStorage.setItem('wm-da',JSON.stringify({mode:'auto',src:'metar',time:'now',icao:'FACT'}))")
      pg=await ctx.new_page();await pg.goto(f'http://localhost:8813/design_review/calculator_{ver}/index.html',wait_until='networkidle')
      await pg.add_style_tag(content='*{animation:none!important;transition:none!important}.card,.dacard,.dactl{opacity:1!important;transform:none!important}')
      await pg.wait_for_timeout(4000);await pg.screenshot(path=f'shots/cmp_{n}.png',full_page=True);await ctx.close()
    await b.close()
asyncio.run(main());srv.terminate()
I=lambda n:Image.open(f'shots/cmp_{n}.png').convert('RGB')
print('v4 vs v4',ImageChops.difference(I('a'),I('b')).getbbox());print('v4 vs v5',I('a').size,I('c').size,ImageChops.difference(I('a'),I('c')).getbbox() if I('a').size==I('c').size else 'size')
