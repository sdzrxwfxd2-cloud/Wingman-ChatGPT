/* wm-hide.js (MT t1783, 1 Nov 2026): hide Logbook, Brief and Chart for now (Weather kept, MT t1807).
   Reversible: set window.WM_HIDE_OFF=1 before this file, or delete its <script> tag. No page code is removed. */
(function(){if(window.WM_HIDE_OFF)return;
var NAMES={Logbook:1,Brief:1,Chart:1,'Chart v2':1};
window.WM_HIDE={chart:1,logbook:1,brief:1,chartv2:1,names:NAMES};
var R=document.documentElement;R.classList.add('wm-hide');
var css='html.wm-hide a[href*="tab=chart"],html.wm-hide a[href*="logbook.html"],html.wm-hide a[href*="brief.html"],html.wm-hide a[href*="chart_v2"],'+
 'html.wm-hide a[href$="/logbook"],html.wm-hide a[href$="/brief"],html.wm-hide .wctab[data-n="Chart"],html.wm-hide .wctab[data-n="Logbook"],html.wm-hide .wctab[data-n="Brief"],'+
 'html.wm-hide nav button[data-t="chart"],html.wm-hide [data-wm-hide]{display:none!important}';
var st=document.createElement('style');st.id='wm-hide-css';st.textContent=css;(document.head||R).appendChild(st);
function bad(a){var h=a.getAttribute('href')||'';return /tab=chart\b|logbook(\.html)?$|brief(\.html)?$|logbook\.html|brief\.html|chart_v2/i.test(h)}
var busy=0;function run(){if(busy)return;busy=1;var ch=0;try{
 document.querySelectorAll('#wmC .wctab,.sheet .mrow,nav a,.tabbar a').forEach(function(a){var n=(a.dataset&&a.dataset.n)||(a.textContent||'').trim();if((NAMES[n]||(a.tagName==='A'&&bad(a)))&&!a.hidden){a.hidden=true;a.style.display='none';a.setAttribute('data-wm-hide','');ch=1}});
 if(ch&&window.wmCrelayout)window.wmCrelayout();}catch(e){}busy=0}
run();document.addEventListener('DOMContentLoaded',run);addEventListener('load',run);
/* Speed fix 3 (MT 8 Nov 2026): only rerun when a tab, menu row or nav link was actually added, not on every card change. */
var SEL='#wmC .wctab,.sheet .mrow,nav a,.tabbar a';function hit(n){try{if(n.nodeType===3)n=n.parentElement;if(!n||n.nodeType!==1)return 0;return n.matches(SEL)||!!n.closest(SEL)||!!n.querySelector(SEL)}catch(e){return 1}}
new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var a=ms[i].addedNodes;for(var j=0;j<a.length;j++)if(hit(a[j]))return run()}}).observe(R,{childList:true,subtree:true});
/* direct visits: send hidden pages back to Aerodromes */
try{var p=location.pathname.toLowerCase(),q=location.search,top=window.top===window;if(top&&(/\/(logbook|brief)(\.html)?$/.test(p)||/chart_v2/.test(p)||(/\/app(\.html)?$/.test(p)&&/tab=chart\b/.test(q))))location.replace('/main.html')}catch(e){}
})();
