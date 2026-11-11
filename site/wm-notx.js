/* wm-notx.js (speed 6A): instant theme switch.
   When <html> data-theme / data-pal changes, add body.no-tx for two frames so the ~36k elements do not
   each start a colour/background/shadow transition (that is what made a theme flip take 300+ ms).
   The theme sheet itself (.sheet) keeps its transitions so the switch knob still glides.
   Kill switch: localStorage wm-notx=0. */
(function(){
  try{if(localStorage.getItem('wm-notx')==='0')return}catch(e){}
  var H=document.documentElement,css='body.no-tx *:not(.sheet):not(.sheet *),body.no-tx *:not(.sheet):not(.sheet *)::before,body.no-tx *:not(.sheet):not(.sheet *)::after{transition:none!important}';
  /* The class lives on <body>, not <html>: wm-pin re-serialises the whole frame stylesheet on ANY <html> attribute change,
     so toggling a class there made every theme flip run that restyle twice more (Claude v3 G). */
  var st=document.createElement('style');st.id='wm-notx';st.textContent=css;(document.head||H).appendChild(st);
  var tok=0;
  // MutationObserver callbacks run as microtasks, i.e. before the next style recalc, so the class is
  // present in the same frame as the new theme. Removed after two frames (token-guarded for rapid flips).
  new MutationObserver(function(){var B=document.body;if(!B)return;var my=++tok;B.classList.add('no-tx');
    requestAnimationFrame(function(){requestAnimationFrame(function(){if(my===tok)B.classList.remove('no-tx')})})
  }).observe(H,{attributes:true,attributeFilter:['data-theme','data-pal']});
})();
/* Hide the Netlify site badge on pages that do not load wm-shell.css (c/app.html, main.html). MT, 30 Oct 2026. */
(function(){try{var s=document.createElement('style');s.id='wm-nl-badge';s.textContent='#nl-badge-frame{display:none!important}';(document.head||document.documentElement).appendChild(s)}catch(e){}})();
