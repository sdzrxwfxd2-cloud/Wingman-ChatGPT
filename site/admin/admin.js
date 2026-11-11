(function(){
  var range = '7d';
  var themeMap = {amethyst:['night','purple'],midnight:['night','black'],pearl:['day','white'],champagne:['day','beige']};
  function $(id){return document.getElementById(id)}
  function themeButtons(){
    var cur = document.documentElement.dataset.theme + ':' + document.documentElement.dataset.pal;
    document.querySelectorAll('.thm button').forEach(function(b){
      var t = themeMap[b.dataset.t];
      b.classList.toggle('on', t && (t[0]+':'+t[1]) === cur);
      b.onclick = function(){
        var v = themeMap[b.dataset.t]; if(!v) return;
        document.documentElement.dataset.theme = v[0];
        document.documentElement.dataset.pal = v[1];
        try{localStorage.setItem('ga-admin-theme', b.dataset.t)}catch(e){}
        themeButtons();
      };
    });
  }
  function fmt(ts){
    try {
      return new Date(ts).toLocaleString('en-GB', {
        timeZone:'Africa/Johannesburg', day:'2-digit', month:'short',
        hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
      }) + ' SAST';
    } catch(e){ return String(ts); }
  }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])}); }
  function n(x){ return (x||0).toLocaleString('en-GB'); }

  async function api(path, opt){
    var r = await fetch(path, Object.assign({credentials:'same-origin', headers:{'Accept':'application/json'}}, opt||{}));
    var j = null; try{ j = await r.json(); }catch(e){ j = {}; }
    return {ok:r.ok, status:r.status, data:j};
  }

  function listBlock(el, rows){
    if(!el) return;
    if(!rows || !rows.length){ el.innerHTML = '<p class="empty">Nothing here yet for this range.</p>'; return; }
    var max = rows[0].n || 1;
    el.innerHTML = rows.map(function(row){
      var pct = Math.max(6, Math.round((row.n/max)*100));
      return '<div class="row"><span>'+esc(row.name)+'</span><b>'+n(row.n)+'</b><div class="meter"><i style="transform:scaleX('+(pct/100)+')"></i></div></div>';
    }).join('');
  }

  function drawChart(days){
    var el = $('chart');
    if(!days || !days.length){ el.innerHTML = '<p class="empty">No visits in this range yet. Open the site once and refresh.</p>'; return; }
    var max = Math.max.apply(null, days.map(function(d){return d.n||0})) || 1;
    el.innerHTML = days.map(function(d){
      var h = Math.max(6, Math.round(((d.n||0)/max)*120));
      var label = (d.day||'').slice(5);
      return '<div class="col" title="'+esc(d.day)+' · '+n(d.n)+' visits"><i style="height:'+h+'px"></i><span>'+esc(label)+'</span></div>';
    }).join('');
  }

  async function loadStats(){
    $('sub').textContent = 'Loading…';
    var res = await api('/api/admin/stats?range='+encodeURIComponent(range));
    if(!res.ok){ $('sub').textContent = res.status===401 ? 'Please sign in again' : (res.data.error||'Could not load'); return; }
    var d = res.data;
    $('k-today').textContent = n(d.today && d.today.visits);
    $('k-today-u').textContent = 'unique '+n(d.today && d.today.uniques);
    $('k-7').textContent = n(d.d7 && d.d7.visits);
    $('k-7-u').textContent = 'unique '+n(d.d7 && d.d7.uniques);
    $('k-30').textContent = n(d.d30 && d.d30.visits);
    $('k-30-u').textContent = 'unique '+n(d.d30 && d.d30.uniques);
    $('k-store').textContent = d.store==='d1' ? 'D1' : d.store==='kv' ? 'KV' : 'Off';
    $('k-range').textContent = range==='1d'?'today':range;
    $('sub').textContent = 'Updated '+fmt(Date.parse(d.now||Date.now())) + (d.store ? ' · store '+d.store : '') + (d.legacy ? ' · '+n(d.legacy)+' older visits counted without details' : '');
    drawChart(d.days);
    listBlock($('t-pages'), d.pages);
    listBlock($('t-countries'), d.countries);
    listBlock($('t-cities'), d.cities);
    listBlock($('t-devices'), d.devices);
    listBlock($('t-browsers'), d.browsers);
    listBlock($('t-os'), d.os);
    listBlock($('t-referrers'), d.referrers);
  }

  async function loadLog(){
    var q = $('f-q').value.trim();
    var ip = $('f-ip').value.trim();
    var device = $('f-device').value;
    var url = '/api/admin/visits?range='+encodeURIComponent(range)+'&limit=100';
    if(q) url += '&q='+encodeURIComponent(q);
    if(ip) url += '&ip='+encodeURIComponent(ip);
    if(device) url += '&device='+encodeURIComponent(device);
    var res = await api(url);
    var body = $('log');
    if(!res.ok){ body.innerHTML = '<tr><td colspan="8" class="empty">Could not load the log.</td></tr>'; return; }
    var rows = res.data.rows || [];
    if(!rows.length){ body.innerHTML = '<tr><td colspan="8" class="empty">No rows match these filters.</td></tr>'; return; }
    body.innerHTML = rows.map(function(r){
      var place = [r.city, r.region, r.country].filter(Boolean).join(', ');
      var device = [r.device_type, r.device_model].filter(Boolean).join(' · ');
      var bro = [r.browser, r.os, r.os_ver].filter(Boolean).join(' · ');
      return '<tr>'+
        '<td>'+esc(fmt(r.ts))+'</td>'+
        '<td class="mono">'+esc(r.ip||'—')+'</td>'+
        '<td>'+esc(place||'—')+'</td>'+
        '<td>'+esc(device||'—')+'</td>'+
        '<td>'+esc(bro||'—')+'</td>'+
        '<td class="mono">'+esc(r.screen||'—')+'</td>'+
        '<td class="mono">'+esc(r.path||'—')+(r.n>1?' <span class="note">#'+esc(r.n)+'</span>':'')+'</td>'+
        '<td>'+esc(r.ref||'—')+'</td>'+
        '</tr>';
    }).join('');
  }

  // stats and log load side by side, so a slow or failed one never leaves the other empty
  async function refresh(){ await Promise.all([loadStats().catch(function(){ $('sub').textContent = 'Could not load the totals'; }), loadLog().catch(function(){})]); }

  function showApp(){ $('login').hidden = true; $('app').hidden = false; themeButtons(); refresh(); }
  function showLogin(msg){
    $('app').hidden = true; $('login').hidden = false;
    var err = $('login-err');
    if(msg){ err.hidden = false; err.textContent = msg; } else { err.hidden = true; }
  }

  $('login-form').addEventListener('submit', async function(e){
    e.preventDefault();
    var password = $('pw').value;
    var res = await api('/api/admin/session', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({password:password})});
    if(res.ok){ $('pw').value=''; showApp(); }
    else showLogin(res.data.error === 'wrong password' ? 'That password is not right.' : (res.data.error || 'Could not sign in.'));
  });
  $('out').onclick = async function(){ await api('/api/admin/session', {method:'DELETE'}); showLogin(); };
  $('re').onclick = refresh;
  $('f-go').onclick = loadLog;
  $('f-q').addEventListener('keydown', function(e){ if(e.key==='Enter') loadLog(); });
  $('f-ip').addEventListener('keydown', function(e){ if(e.key==='Enter') loadLog(); });
  document.querySelectorAll('.seg button').forEach(function(b){
    b.onclick = function(){
      document.querySelectorAll('.seg button').forEach(function(x){ x.classList.toggle('on', x===b); });
      range = b.dataset.range;
      refresh();
    };
  });

  api('/api/admin/session').then(function(res){
    if(res.ok && res.data.ok) showApp();
    else showLogin(res.status===503 ? 'The admin password has not been set yet.' : '');
  }).catch(function(){ showLogin('Could not reach the server.'); });
})();
