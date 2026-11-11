/* wm-topbar.js: top-bar time card (29 Oct, MT approved). Styles in wm-topbar.css.
   Hover the clock (fine pointer) or tap it (touch). Esc / outside tap / scroll closes.
   Outline: Natural Earth 1:110m (public domain), equirectangular with cos(29°) correction.
   Location dot: device geolocation -> last aerodrome nearest to a successful fix
   (ident in localStorage 'wm-tcard-ad'; the raw position is never stored) -> Johannesburg.
   Aerodrome coordinates: appdata/aerodromes-ll.<hash>.json from tools/gen_aerodromes_ll.py,
   fetched only when the card first opens.
   Sunrise/sunset: NOAA general solar position algorithm (zenith 90.833°). */
(function(){
  'use strict';
  var clk=document.getElementById('clk');
  if(!clk||document.querySelector('.wm-tcard'))return;

  /* ---- map projection (must match the path below) ---- */
  var LON0=16.3,LAT0=-22,K=Math.cos(29*Math.PI/180),S=200/((33-LON0)*K);
  function xy(lat,lon){return [(lon-LON0)*K*S,(LAT0-lat)*S]}
  var X30=xy(0,30)[0].toFixed(1);
  var JHB={lat:-26.2,lon:28.05};

  /* ---- NOAA sunrise / sunset, returns minutes UTC or null (polar) ---- */
  function sunTimes(date,lat,lon){
    var rad=Math.PI/180,start=Date.UTC(date.getUTCFullYear(),0,0),
        N=Math.floor((date-start)/864e5),
        g=2*Math.PI/365*(N-1),
        eq=229.18*(0.000075+0.001868*Math.cos(g)-0.032077*Math.sin(g)-0.014615*Math.cos(2*g)-0.040849*Math.sin(2*g)),
        dec=0.006918-0.399912*Math.cos(g)+0.070257*Math.sin(g)-0.006758*Math.cos(2*g)+0.000907*Math.sin(2*g)-0.002697*Math.cos(3*g)+0.00148*Math.sin(3*g),
        c=(Math.cos(90.833*rad)/(Math.cos(lat*rad)*Math.cos(dec)))-Math.tan(lat*rad)*Math.tan(dec);
    if(c<-1||c>1)return null;
    var ha=Math.acos(c)/rad;
    return {rise:720-4*(lon+ha)-eq,set:720-4*(lon-ha)-eq};
  }

  var TZ='Africa/Johannesburg',
      fLoc=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:TZ}),
      fUtc=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'UTC'});
  function hhmmLocal(minUtc){var d=new Date();d.setUTCHours(0,0,0,0);return fLoc.format(new Date(+d+minUtc*6e4))}

  var card=document.createElement('div');
  card.className='wm-tcard';card.id='wm-tcard';card.setAttribute('role','dialog');card.setAttribute('aria-label','Local time');
  card.innerHTML='<svg viewBox="0 -20 200 198" aria-hidden="true">'+
      '<path class="za" fill-rule="evenodd" d="M182.3 99.4L179.9 101.4L174.9 108.3L171.5 115.3L164.7 125.2L151.2 139.3L142.8 147.5L133.7 153.7L121.2 159.0L115.1 159.8L113.5 163.6L106.3 161.5L100.3 164.1L87.4 161.5L80.1 163.2L75.1 162.5L62.8 167.9L52.6 170.0L45.2 175.2L39.7 175.5L34.7 170.6L30.6 170.4L25.4 164.3L24.9 166.2L23.3 162.5L23.4 154.5L19.5 145.3L23.3 142.8L23.0 132.3L15.2 119.5L9.2 107.9L9.1 107.8L0.5 90.1L6.3 83.3L11.0 87.0L13.0 92.9L18.4 93.9L25.9 96.5L32.4 95.5L43.1 88.5L43.1 37.9L46.3 40.0L53.4 53.0L52.3 61.3L55.0 66.1L63.5 64.7L69.5 58.6L75.2 54.5L78.1 47.9L84.0 44.8L89.0 46.4L94.7 50.3L104.5 50.9L112.2 47.7L113.4 43.5L115.5 36.9L122.0 35.8L125.6 30.7L129.6 21.6L140.3 11.3L157.3 1.3L162.1 1.4L167.9 3.7L172.0 2.1L178.3 3.4L184.1 22.7L187.2 32.4L185.1 47.7L186.1 52.6L180.0 50.1L176.6 51.1L175.4 55.1L172.2 60.2L172.3 65.0L179.4 72.4L186.4 70.9L188.9 64.8L198.0 64.9L195.0 74.9L193.6 86.3L190.5 92.5L182.3 99.4ZM151.8 95.2L146.6 91.0L141.0 93.8L134.5 99.2L128.1 107.8L137.1 118.4L141.4 117.0L143.6 112.6L150.3 110.5L152.3 106.0L156.0 99.4L151.8 95.2Z"/>'+
      '<line class="mer" x1="'+X30+'" y1="-6" x2="'+X30+'" y2="176"/>'+
      '<text class="mer-l" x="'+X30+'" y="-11" text-anchor="middle">30°E · SAST</text>'+
      '<g data-t="dot"><circle class="loc-p" r="7"/><circle class="loc" r="2.6"/></g>'+
    '</svg>'+
    '<div class="t-big"><span data-t="loc">--:--</span><small>SAST</small></div>'+
    '<div class="t-sub"><span data-t="utc">--:--</span>Z · UTC+2</div>'+
    '<div class="t-sun"><i aria-hidden="true"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></i><span data-t="sun">--:-- · --:--</span></div>';
  document.body.appendChild(card);
  clk.setAttribute('aria-controls','wm-tcard');clk.setAttribute('aria-expanded','false');clk.tabIndex=0;
  var q=function(k){return card.querySelector('[data-t='+k+']')};

  /* ---- location ---- */
  var AERODROMES_URL='appdata/aerodromes-ll.f9ae33f64d.json',AD_KEY='wm-tcard-ad',spot=null,adP=null;
  function aerodromes(){   /* [[ident,lat,lon],...]; resolves [] on failure */
    if(!adP)adP=fetch(AERODROMES_URL).then(function(r){return r.ok?r.json():[]}).catch(function(){return []});
    return adP;
  }
  function nearest(list,lat,lon){
    var best=null,bd=Infinity;
    list.forEach(function(a){var d=Math.pow(a[1]-lat,2)+Math.pow((a[2]-lon)*K,2);if(d<bd){bd=d;best=a}});
    return best;
  }
  function store(k,v){try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(_){}}
  function stored(k){try{return localStorage.getItem(k)}catch(_){return null}}
  function setSpot(p){spot=p;var c=xy(p.lat,p.lon);q('dot').setAttribute('transform','translate('+c[0].toFixed(1)+' '+c[1].toFixed(1)+')');renderSun()}
  function fallback(){   /* geolocation unavailable or denied */
    var id=stored(AD_KEY);if(!id)return;
    aerodromes().then(function(list){
      for(var i=0;i<list.length;i++)if(list[i][0]===id){setSpot({lat:list[i][1],lon:list[i][2]});return}
    });
  }
  function locate(){
    setSpot(JHB);
    if(!navigator.geolocation){fallback();return}
    navigator.geolocation.getCurrentPosition(function(pos){
      var lat=pos.coords.latitude,lon=pos.coords.longitude;
      setSpot({lat:lat,lon:lon});
      aerodromes().then(function(list){var a=nearest(list,lat,lon);if(a)store(AD_KEY,a[0])});
    },fallback,{maximumAge:6e5,timeout:8e3});
  }

  /* ---- render ---- */
  function renderSun(){
    if(!spot)return;var t=sunTimes(new Date(),spot.lat,spot.lon);
    q('sun').textContent=t?hhmmLocal(t.rise)+' · '+hhmmLocal(t.set):'—';
  }
  function render(){var n=new Date();q('loc').textContent=fLoc.format(n);q('utc').textContent=fUtc.format(n)}

  /* ---- open / close ---- */
  var tick=0,hideT=0,located=false;
  function place(){var r=clk.getBoundingClientRect();card.style.top=Math.round(r.bottom+10)+'px';card.style.right=Math.max(12,Math.round(innerWidth-r.right))+'px'}
  function open(){clearTimeout(hideT);if(card.classList.contains('on'))return;if(!located){located=true;locate()}render();place();tick=setInterval(render,1000);card.classList.add('on');clk.setAttribute('aria-expanded','true')}
  function close(){clearInterval(tick);card.classList.remove('on');clk.setAttribute('aria-expanded','false')}
  function closeSoon(){hideT=setTimeout(close,140)}

  var hover=matchMedia('(hover:hover) and (pointer:fine)');
  clk.addEventListener('mouseenter',function(){if(hover.matches)open()});
  clk.addEventListener('mouseleave',function(){if(hover.matches)closeSoon()});
  card.addEventListener('mouseenter',function(){clearTimeout(hideT)});
  card.addEventListener('mouseleave',function(){if(hover.matches)closeSoon()});
  clk.addEventListener('click',function(e){e.stopPropagation();card.classList.contains('on')&&!hover.matches?close():open()});
  document.addEventListener('click',function(e){if(!card.contains(e.target))close()});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
  addEventListener('resize',function(){if(card.classList.contains('on'))place()});
  addEventListener('scroll',close,{passive:true});
})();
