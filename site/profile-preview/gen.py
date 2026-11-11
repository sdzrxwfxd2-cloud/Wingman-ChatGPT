UP='<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>'
DN='<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg>'
SH='<svg viewBox="0 0 24 24"><path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13"/></svg>'
ED='<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>'
PIN='<svg class="pin" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>'
HEAD='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex"><title>Pilot profile - design preview {o}</title><script src="theme.js"></script><link rel="stylesheet" href="pp.css"><style>{css}</style></head><body><div class="prev">Design preview {o} - sample data, not live</div>'
def hdr_tags(): return '<span class="tag gold">FOUNDING MEMBER</span><span class="tag acc">CPL(A)</span><span class="tag">Night</span><span class="tag">FIR</span><span class="tag">Grade III Instructor</span>'
STATS=[('412.6','Total hrs'),('38.2','Last 90 days'),('112','Night hrs'),('46','Aerodromes')]
CUR='''<div class="cur"><span><span class="dot g"></span>Passenger currency (day)</span><span class="dim">3 T/O + LDG in 90 days - OK</span></div>
<div class="cur"><span><span class="dot g"></span>Night currency</span><span class="dim">OK until 14 Dec</span></div>
<div class="cur"><span><span class="dot a"></span>Instrument rating revalidation</span><span class="dim">Due in 41 days</span></div>
<div class="cur"><span><span class="dot g"></span>Class 1 medical</span><span class="dim">Valid to 03 Jun 2027</span></div>
<p class="note" style="margin-top:8px">Pulled from your Logbook later. Private by default. Always check your own licence and medical dates.</p>'''
def rev(sc,school,txt,up,dn,inc=False,cost=None):
  return f'''<div class="rev"><div class="row" style="justify-content:space-between"><span class="t">{school}</span><span class="mono" style="color:var(--gold);font-weight:700">{sc} / 5</span></div>
<div class="row" style="gap:6px;margin:6px 0;flex-wrap:wrap"><span class="tag">PPL - 2025</span>{'<span class="tag" style="color:var(--cau)">Incentivised review</span>' if inc else ''}{f'<span class="tag acc">Real cost to finish: {cost}</span>' if cost else ''}</div>
<p class="muted" style="font-size:14px">{txt}</p>
<div class="row" style="margin-top:10px;justify-content:space-between"><span class="vote"><button class="on">{UP}{up}</button><button>{DN}{dn}</button></span><span class="dim">{up} of {up+dn} members agree</span></div></div>'''
REVS=rev('4.6','Cape Town Flight Training (sample)','Aircraft always serviced on time, instructors patient. Booking got tight in winter.',38,4,cost='R178k - R192k')+rev('3.9','Stellenbosch Aviation (sample)','Good value, but expect weather holds. Admin replies slowly.',21,6,inc=True)
SAVED=''.join(f'<div class="chip"><span><span class="icao">{i}</span> <span class="muted">{n}</span></span><span class="dim">{d}</span></div>' for i,n,d in [('FACT','Cape Town Intl','Home'),('FASH','Stellenbosch','Saved'),('FAGG','George','Saved'),('FAOH','Oudtshoorn','Saved')])
def bdg(lbl,path,won=True): return f'<div class="bdg {"won" if won else "lock"}"><div><svg viewBox="0 0 24 24">{path}</svg>{lbl}</div></div>'
BADGES=bdg('First solo','<path d="M2 13l8-2 4-7 2 1-2 6 6 1 2 2-8 1-4 5H8l2-5-6 1z"/>')+bdg('Night rated','<path d="M20 14A8 8 0 0110 4a8 8 0 1010 10z"/>')+bdg('Founding member','<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>')+bdg('10 reviews','<path d="M4 5h16v11H8l-4 4z"/>')+bdg('25 aerodromes','<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>')+bdg('Bring 3 mates','<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2 20c1-3 3.5-4.5 6-4.5s5 1.5 6 4.5M14 15.6c2.5 0 5 1.4 6 4.4"/>')+bdg('500 hours','<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',False)+bdg('ATPL','<path d="M4 8h16v10H4zM9 8V5h6v3"/>',False)
PRIV='''<div class="priv"><span>Show total hours</span><span class="sw on"></span></div>
<div class="priv"><span>Show licence type and ratings</span><span class="sw on"></span></div>
<div class="priv"><span>Show home aerodrome</span><span class="sw"></span></div>
<div class="priv"><span>Show currency and medical</span><span class="sw"></span></div>
<div class="priv"><span>Link my reviews to this profile</span><span class="sw"></span></div>
<p class="note" style="margin-top:8px">Reviews are anonymous by default: they show your handle only. Your verified email stays private. We never ask for a photo of your licence (POPIA). Licence-number check (one account per licence) comes later.</p>'''
MEMBER='''<div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="dim">Wingman Pro</div><div style="font-size:20px;font-weight:750;margin-top:2px">Founding member</div><div class="muted" style="font-size:13.5px">R149 / month - price locked for life</div></div><span class="tag gold">No. 0007</span></div>
<p class="note" style="margin-top:10px">Or R1,490 / year. Member since Nov 2026. Members can vote on ATO reviews.</p>'''
AVATAR='<div class="av"><i>MT</i></div>'
NAME='<h1>@capecpl_mt</h1><div class="muted" style="font-size:14px;margin-top:2px">Commercial pilot - Cape Town</div>'
def bars(): import random;random.seed(4);return '<div class="bars">'+''.join(f'<i style="height:{random.randint(15,100)}%"></i>' for _ in range(26))+'</div>'
