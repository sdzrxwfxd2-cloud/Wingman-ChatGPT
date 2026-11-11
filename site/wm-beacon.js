/* Wingman first-party visit beacon (30 Oct 2026). No third parties, no cookies.
   Only a random session id + per-session page count in sessionStorage. Sends once per page load. */
(function(){try{
  if(window.__wmb)return;window.__wmb=1;
  var S=sessionStorage,sid=S.getItem('wm-sid');
  if(!sid){sid=(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now().toString(36)).slice(0,36);S.setItem('wm-sid',sid)}
  var n=(+S.getItem('wm-sn')||0)+1;S.setItem('wm-sn',n);
  var nav=navigator,scr=screen||{},tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
  var d={sid:sid,n:n,path:location.pathname,ref:document.referrer||'',ua:nav.userAgent,lang:nav.language||'',langs:(nav.languages||[]).slice(0,4).join(','),
    tz:tz,sw:scr.width,sh:scr.height,vw:innerWidth,vh:innerHeight,dpr:devicePixelRatio||1,touch:nav.maxTouchPoints||0,
    cores:nav.hardwareConcurrency||null,mem:nav.deviceMemory||null,net:(nav.connection&&nav.connection.effectiveType)||'',
    dark:matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?1:0,pwa:matchMedia&&matchMedia('(display-mode: standalone)').matches||nav.standalone?1:0,
    wd:nav.webdriver?1:0,test:localStorage.getItem('wm-test')==='1'?1:0};
  var send=function(){var b=JSON.stringify(d);
    if(!(nav.sendBeacon&&nav.sendBeacon('/api/visit-beacon',new Blob([b],{type:'text/plain'}))))
      fetch('/api/visit-beacon',{method:'POST',body:b,keepalive:true,credentials:'omit'}).catch(function(){})};
  var u=nav.userAgentData;
  if(u&&u.getHighEntropyValues){d.mobile=u.mobile?1:0;d.plat=u.platform||'';
    u.getHighEntropyValues(['model','platformVersion','fullVersionList']).then(function(h){d.model=h.model||'';d.platv=h.platformVersion||'';
      d.brands=(h.fullVersionList||[]).filter(function(x){return !/Not.?A.?Brand/i.test(x.brand)}).map(function(x){return x.brand+' '+x.version}).join(', ')}).catch(function(){}).then(send)}
  else send();
}catch(e){}})();
