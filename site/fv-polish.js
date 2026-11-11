/* fv-polish.js v2 — aerodrome filter polish. ?fvfix=0 all | ?fvzoom=0 | ?fvhit=0 | ?fvfocus=0 | ?fvrole=0 | opt-in ?fvlite=1 */
(function(){'use strict';
var W=[window,parent];
function q(k){for(var i=0;i<2;i++){try{var v=new URLSearchParams(W[i].location.search).get(k);if(v!==null)return v}catch(e){}}return null}
if(q('fvfix')==='0')return;
var X='html'+[0,1,2,3,4,5,6,7,8,9,10,11].map(function(i){return':not(#_p'+i+')'}).join('')+' body ',css='';
/* iOS zoom: the three visible search inputs are 14 / 15 / 12.5px */
if(q('fvzoom')!=='0')css+='@supports (-webkit-touch-callout:none){'+X+'.wflt-row .fv-sb .fv-si,'+X+'.wmf .wmf-sp input,'+X+'.wmf .sq input{font-size:16px!important}}';
/* 44px hit areas without changing the look (chips are 34px, .mi 26px, Reset/Show ~32px) */
if(q('fvhit')!=='0')css+=X+'.wmf .c,'+X+'.wmf .mi,'+X+'.wmf .rq,'+X+'.wmf .ap2{position:relative}'+
 X+'.wmf .c::after{content:"";position:absolute;inset:-5px -2px}'+X+'.wmf .mi::after{content:"";position:absolute;inset:-9px -4px}'+
 X+'.wmf .rq::after,'+X+'.wmf .ap2::after{content:"";position:absolute;inset:-7px -4px}';
/* opt-in low-power: drop the ~30 per-chip blur layers (they blur an already blurred panel) */
if(q('fvlite')==='1')css+=X+'.wmf.wmf-aero .chips .c,'+X+'.wmf.wmf-aero .ft2 .ap2{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}';
if(css){var s=document.createElement('style');s.id='fv-polish';s.textContent=css;document.head.appendChild(s)}
function wait(f,n){var r=f();if(!r&&(n|0)<60)setTimeout(function(){wait(f,(n|0)+1)},100)}
/* label with role=button around an input = nested interactive control; the input has its own aria-label */
if(q('fvrole')!=='0')wait(function(){var b=document.querySelector('.wflt-row .fv-sb');if(!b)return false;b.removeAttribute('role');b.removeAttribute('aria-label');return true});
/* keyboard focus: the trigger hides on open and the panel hides on close, so focus fell to <body> */
if(q('fvfocus')!=='0'){var kb=false;addEventListener('keydown',function(){kb=true},true);addEventListener('pointerdown',function(){kb=false},true);
 wait(function(){var R=document.querySelector('.wmf.wmf-aero'),b=document.querySelector('.wflt-row .wflt-b');if(!R||!b)return false;var shown=false;
  new MutationObserver(function(){var sh=R.classList.contains('fv5-show');if(sh===shown)return;shown=sh;if(!kb)return;
   if(sh){var f=R.querySelector('.wmf-fb');f&&f.focus({preventScroll:true})}
   else requestAnimationFrame(function(){var a=document.activeElement;if(!a||a===document.body)b.focus({preventScroll:true})})}).observe(R,{attributes:true,attributeFilter:['class']});return true});}
})();
