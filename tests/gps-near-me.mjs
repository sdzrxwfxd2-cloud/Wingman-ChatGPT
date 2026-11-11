// Contract: the aerodromes "Near me" / "Nearest" chip can use geolocation
// inside the shell iframe and hands the fix to the list engine.
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const index = readFileSync(join(root, 'site/index.html'), 'utf8');
const main = readFileSync(join(root, 'site/main.html'), 'utf8');
const fv3 = readFileSync(join(root, 'site/fv3.js'), 'utf8');
const fv3Bytes = readFileSync(join(root, 'site/fv3.js'));

let fail = 0;
function ok(name, cond) {
  if (!cond) { console.error('FAIL', name); fail++; }
}

ok('early wmF-aero sets allow=geolocation before src',
  /id="wmF-aero"[\s\S]{0,200}setAttribute\("allow","geolocation"\)[\s\S]{0,80}src="main\.html"/.test(index));
ok('make() grants geolocation only to the aero frame',
  index.includes("if(K==='aero')f.setAttribute('allow','geolocation')"));
ok('main.html engine exposes WMflt.pos for the Near chip',
  main.includes('window.WMflt={st,apply,get pos(){return pos},set pos(v){pos=v}}'));
ok('fv3 hands the fix to WMflt.pos',
  fv3.includes('WMflt.pos=[pp.coords.latitude,pp.coords.longitude]'));
ok('fv3 no longer monkeypatches getCurrentPosition',
  !fv3.includes('g.getCurrentPosition=ok=>ok(pp)'));
ok('fv3 requests geolocation from the top window (iOS iframe)',
  fv3.includes('window.top.navigator.geolocation') && fv3.includes('window.top.wmGeo'));
ok('fv3 shows a denied / timeout message and mentions search',
  fv3.includes('Location permission denied') && fv3.includes('Location timed out') && fv3.includes('search for a place'));
ok('fv3 does not auto-request Near me on load (needs a user tap)',
  fv3.includes("k!=='name'&&k!=='near'"));
ok('index.html exposes wmGeo on the parent window',
  index.includes('id="wm-geo-parent"') && index.includes('window.wmGeo='));
ok('main.html Near chip also uses the top window geolocation',
  main.includes('window.top.navigator.geolocation') && main.includes('Location permission denied'));

const m = main.match(/fv3\.js\?v=([0-9a-f]{10})/);
ok('main.html has fv3.js ?v= bust', !!m);
if (m) {
  const want = createHash('sha256').update(fv3Bytes).digest('hex').slice(0, 10);
  ok('fv3.js ?v= matches sha256 prefix', m[1] === want);
}

if (fail) process.exit(1);
console.log('gps-near-me: ok');
