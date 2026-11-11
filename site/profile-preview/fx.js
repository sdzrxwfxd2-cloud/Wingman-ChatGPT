(function(){var R=matchMedia('(prefers-reduced-motion:reduce)').matches;
var io='IntersectionObserver'in window?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.08}):null;
document.querySelectorAll('.rv').forEach(function(el,i){el.style.transitionDelay=Math.min(i,6)*60+'ms';if(R||!io||new URLSearchParams(location.search).has('still'))el.classList.add('in');else io.observe(el)});
if(R)return;document.querySelectorAll('.tilt').forEach(function(c){var g=document.createElement('i');g.className='glare';c.appendChild(g);
c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;c.style.transform='perspective(1000px) rotateX('+((.5-y)*7)+'deg) rotateY('+((x-.5)*9)+'deg)';c.style.setProperty('--gx',x*100+'%');c.style.setProperty('--gy',y*100+'%')});
c.addEventListener('pointerleave',function(){c.style.transform=''})});
var p=document.querySelectorAll('[data-px]');if(p.length)addEventListener('scroll',function(){var s=scrollY;p.forEach(function(e){e.style.transform='translateY('+(s*parseFloat(e.dataset.px))+'px)'})},{passive:true});})();
