/* Demo only (MT t1867): ?demo=empty shows the pilot pass as a fake, empty signed-in user.
   No real auth, no storage writes, no network. Remove the flag to see the sample data. */
(function(){if(new URLSearchParams(location.search).get('demo')!=='empty')return;
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s){return [].slice.call(document.querySelectorAll(s))};
var pv=$('.prev');if(pv)pv.textContent='Demo login - empty pilot account - not live';
var h=$('.p1 h1');if(h)h.textContent='@new_pilot';var av=$('.p1 .av i');if(av)av.textContent='NP';
var t=$('.p1 .ttl');if(t)t.textContent='Pilot';var c=$('.p1 .muted');if(c)c.textContent='Location not set';
var home=$('.p1 .icao');if(home)home.textContent='Not set';
var tags=$('.p1 .row[style*="flex-wrap"]');if(tags)tags.innerHTML='<span class="tag lic-main" data-lic><span class="lic-t">Add your licence</span></span>';
var ph=$('.p1 .ph span:last-child');if(ph)ph.textContent='ZA';
var m=$$('.pass')[1];if(m)m.innerHTML='<div class="ph"><span>Membership</span><span>No. 0001</span></div><div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="dim">Wingman Pro</div><div style="font-size:20px;font-weight:750;margin-top:2px">Founding member</div><div class="muted" style="font-size:13.5px">R149 / month - price locked for life</div></div><span class="tag gold">No. 0001</span></div><p class="note" style="margin-top:10px">Or R1,490 / year. Member since Nov 2026. Members can vote on ATO reviews.</p>';
$$('.pass').forEach(function(p){if(p.querySelector('.strp'))p.style.display='none'});
$$('section.hide-nolog').forEach(function(s){s.style.display='none'});
$$('section.card').forEach(function(s){var h2=s.querySelector('h2');if(!h2)return;var k=h2.textContent;
 if(/My ATO reviews/.test(k))s.innerHTML='<h2>My ATO reviews</h2><p class="muted" style="font-size:14px">No reviews yet. Reviews you write about an ATO show here, under your handle only.</p>';
 if(/^Saved/.test(k))s.innerHTML='<h2>Saved <span class="dim" style="float:right;font-weight:500;letter-spacing:0">0 / 5</span></h2><div class="chip empty"><span><span class="icao">+</span> <span class="muted">Add an aerodrome</span></span><span class="dim">Slot 1</span></div>';});
var hi=$('#editSheet .in.focus');if(hi)hi.textContent='New pilot';var hl=$('#editSheet .in.lock span');if(hl)hl.textContent='@new_pilot';
})();
