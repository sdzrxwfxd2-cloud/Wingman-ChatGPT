// Cloudflare port: a FAST composer + packed model storage for the shared weather snapshot (feat/cloudflare-pages, 7 Nov 2026).
//
// Why: Workers on the FREE plan get 10 ms of CPU per Cron Trigger. netlify/lib/wx_snapshot.mjs compose() + JSON parse/stringify
// of the ~1.3 MB model store costs ~30 ms. Here every aerodrome's model rows are kept as one pre-serialised text record, so a tick
// only splits strings and concatenates them. The snapshot this writes parses to EXACTLY what compose() returns (tested in
// tests/cloudflare/cloudflare.test.mjs against compose() itself). Anything unusual (non-hourly times) falls back to compose().
//
// Packed record (one per aerodrome, records joined by ";"):  id|ft|el|fz|t0|n|v1|...|v11
//   ft = model fetch time ISO, el = elevation (or ""), fz = 1/0, t0 = first hour "YYYY-MM-DDTHH:MM", n = hours,
//   vK = the JSON array body of VARS[K] for those n hours ("1.5,null,2"), "" when Open-Meteo sent no array.
import { compose, VARS, FRESH_MIN, SERVE_MAX_MIN, TARGET_MIN, TICK_MIN, MAX_SERVE_MS, ALL_POINTS } from "../../netlify/lib/wx_snapshot.mjs";

const H = 3600e3, MIN = 60e3, NV = VARS.length;
const iso = (t) => new Date(t).toISOString();
const ms = (x) => { const v = typeof x === "number" ? x : Date.parse(x); return Number.isFinite(v) ? v : NaN; };
const RX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const hourStr = (t) => iso(t).slice(0, 16);
const P_JSON = new Map(ALL_POINTS.map((p) => [p[0], JSON.stringify(p)]));
const AERO_JSON = JSON.stringify(ALL_POINTS.map((p) => [Math.round(p[1] * 1e4) / 1e4, Math.round(p[2] * 1e4) / 1e4]));
const VARS_JSON = JSON.stringify(VARS);
const POLICY_JSON = JSON.stringify({ freshMin: FRESH_MIN, servedMaxMin: SERVE_MAX_MIN, targetMin: TARGET_MIN, tickMin: TICK_MIN });
const tok = (x) => (typeof x === "number" ? "" + x : "null");   // packable() guarantees finite numbers or null/undefined

// hourly + strictly consecutive + plain numbers/nulls only -> packable; anything else stays a plain object (slow path)
function packable(e) {
  const t = e && e.time; if (!Array.isArray(t) || !t.length) return false;
  let prev = NaN;
  for (const s of t) { if (typeof s !== "string" || !RX.test(s)) return false; const v = Date.parse(s + "Z"); if (prev === prev && v - prev !== H) return false; prev = v; }
  for (const k of VARS) { const a = e.v && e.v[k]; if (a == null) continue; if (!Array.isArray(a)) return false;
    for (const x of a) if (!(x === null || x === undefined || (typeof x === "number" && Number.isFinite(x)))) return false; }
  return !(typeof e.ft !== "string" || /[|;]/.test(e.ft));
}

export function packEntry(id, e) {
  if (e && typeof e._pk === "string") return e._pk;
  if (!packable(e)) return null;
  const n = e.time.length, out = [id, e.ft, e.el === null || e.el === undefined ? "" : String(+e.el), e.fz === false ? "0" : "1", e.time[0], String(n)];
  for (const k of VARS) { const a = e.v && e.v[k]; if (!a) { out.push(""); continue; } const t = new Array(n); for (let h = 0; h < n; h++) t[h] = tok(a[h]); out.push(t.join(",")); }
  const rec = out.join("|");
  try { Object.defineProperty(e, "_pk", { value: rec, enumerable: false, configurable: true, writable: true }); } catch {}   // pack once per tick
  return rec;
}

// light entry for tick(): ft/el/fz for pickPoints, _pk kept for re-saving and fast compose, time/v rebuilt only on demand
function lightEntry(rec) {
  const a = rec.indexOf("|"), b = rec.indexOf("|", a + 1), c = rec.indexOf("|", b + 1), d = rec.indexOf("|", c + 1);
  const el = rec.slice(b + 1, c);
  return { ft: rec.slice(a + 1, b), el: el === "" ? null : +el, fz: rec.slice(c + 1, d) !== "0", _pk: rec };
}
export function unpackEntry(rec) {
  const f = rec.split("|"), n = +f[5], t0 = Date.parse(f[4] + "Z");
  const time = Array.from({ length: n }, (_, h) => hourStr(t0 + h * H));
  const v = Object.fromEntries(VARS.map((k, i) => [k, f[6 + i] === "" ? null : JSON.parse("[" + f[6 + i] + "]")]));
  return { ft: f[1], el: f[2] === "" ? null : +f[2], fz: f[3] !== "0", time, v };
}
// full object for compose() (slow path) from either kind of entry
const full = (e) => (e && typeof e._pk === "string" ? unpackEntry(e._pk) : e);

/* ---- model store <-> text ---- */
export function decodeModel(mp, raw) {
  const pts = {};
  if (typeof mp === "string" && mp) for (const rec of mp.split(";")) { const id = rec.slice(0, rec.indexOf("|")); if (id) pts[id] = lightEntry(rec); }
  if (raw && typeof raw === "object") for (const [id, e] of Object.entries(raw)) pts[id] = e;   // unpackable leftovers
  return pts;
}
export function encodeModel(pts) {
  const recs = [], raw = {};
  for (const [id, e] of Object.entries(pts || {})) { const r = /[|;]/.test(id) ? null : packEntry(id, e); if (r) recs.push(r); else raw[id] = full(e); }
  return { mp: recs.join(";"), raw: Object.keys(raw).length ? raw : null };
}

/* ---- the composer: same output as compose(), built as text ---- */
// row body for one var of one point on the shared hour axis [startH .. endH]
function rowBody(body, n, t0, startH, endH) {
  const len = Math.round((endH - startH) / H) + 1; if (len <= 0) return "";
  let off = Math.round((startH - t0) / H), lead = 0;
  if (off < 0) { lead = -off; off = 0; }
  const have = Math.max(0, Math.min(n - off, len - lead));
  let s = "";
  if (lead) s = "null" + ",null".repeat(lead - 1);
  if (have > 0 && body !== "") {
    let i = 0; for (let k = 0; k < off; k++) i = body.indexOf(",", i) + 1;
    let seg;
    if (off + have === n) seg = i ? body.slice(i) : body;          // usual case: the run ends inside the axis, keep the tail as is
    else { let j = i; for (let k = 0; k < have; k++) { const q = body.indexOf(",", j); j = q < 0 ? body.length + 1 : q + 1; } seg = body.slice(i, j - 1); }
    s += (s ? "," : "") + seg;
  } else if (have > 0) s += (s ? "," : "") + "null" + ",null".repeat(have - 1);
  const pad = len - lead - have; if (pad > 0) s += (s ? "," : "") + "null" + ",null".repeat(pad - 1);
  return s;
}

export function fastCompose({ metar, taf, model, units, state }, now = Date.now(), points = ALL_POINTS) {
  const src = (x, kind) => { const age = x && Number.isFinite(ms(x.fetchedAt)) ? now - ms(x.fetchedAt) : Infinity, ok = age <= MAX_SERVE_MS[kind];
    return { fetchedAt: (x && x.fetchedAt) || null, rows: ok ? (x.rows || []) : [], withheld: !ok && !!(x && x.rows && x.rows.length) }; };
  const startH = Math.floor(now / H) * H - H;
  const served = [], summary = { fresh: 0, degraded: 0, stale: 0, missing: 0 };
  let slow = false;
  for (const p of points) {
    const m = model && model[p[0]], ft = m ? ms(m.ft) : NaN, age = (now - ft) / MIN;
    if (!m || !Number.isFinite(ft)) { summary.missing++; continue; }
    if (age > SERVE_MAX_MIN || age < -1) { summary.stale++; continue; }
    summary[age <= FRESH_MIN ? "fresh" : "degraded"]++;
    const rec = packEntry(p[0], m); if (!rec || (points !== ALL_POINTS && P_JSON.get(p[0]) !== JSON.stringify(p))) { slow = true; break; }
    served.push({ p, m, rec, ft, fs: age <= FRESH_MIN ? "fresh" : "degraded" });
  }
  if (slow) {   // unusual data: exact original path
    const full_ = {}; for (const [id, e] of Object.entries(model || {})) full_[id] = full(e);
    const snap = compose({ metar, taf, model: full_, units, state }, now, points); return { composedAt: snap.composedAt, text: JSON.stringify(snap), snap, slow: true };
  }
  // hour axis: union of every served point's hours >= startH (each point is one consecutive hourly run). Split each record once.
  const runs = [];
  for (const x of served) { const f = x.rec.split("|"); x.f = f; x.n = +f[5]; x.t0 = Date.parse(f[4] + "Z");
    const first = Math.max(x.t0, startH), last = x.t0 + (x.n - 1) * H; if (last >= first) runs.push([first, last]); }
  runs.sort((a, b) => a[0] - b[0]);
  let a0 = startH, a1 = startH - H, gap = false;
  if (runs.length) { a0 = runs[0][0]; a1 = runs[0][1];
    for (let i = 1; i < runs.length; i++) { if (runs[i][0] > a1 + H) { gap = true; break; } if (runs[i][1] > a1) a1 = runs[i][1]; } }
  if (gap) { const full_ = {}; for (const [id, e] of Object.entries(model || {})) full_[id] = full(e);
    const snap = compose({ metar, taf, model: full_, units, state }, now, points); return { composedAt: snap.composedAt, text: JSON.stringify(snap), snap, slow: true }; }
  const time = []; for (let t = a0; t <= a1; t += H) time.push(t);
  const composedAt = iso(now);
  let modelText = "null";
  if (served.length) {
    const vparts = [];
    for (let k = 0; k < NV; k++) {
      const rows = new Array(served.length);
      for (let i = 0; i < served.length; i++) { const x = served[i], b = x.f[6 + k];
        rows[i] = !time.length ? "" : (x.t0 === a0 && x.n === time.length && b !== "") ? b : rowBody(b, x.n, x.t0, a0, a1); }
      vparts.push(JSON.stringify(VARS[k]) + ":[[" + rows.join("],[") + "]]");
    }
    let mn = Infinity, mx = -Infinity; for (const x of served) { if (x.ft < mn) mn = x.ft; if (x.ft > mx) mx = x.ft; }
    modelText = '{"updatedAt":"' + iso(mn) + '","newestAt":"' + iso(mx) + '","composedAt":"' + composedAt + '","vars":' + VARS_JSON +
      ',"units":' + JSON.stringify(units || {}) + ',"pts":[' + served.map((x) => P_JSON.get(x.p[0]) || JSON.stringify(x.p)).join(",") + ']' +
      ',"time":' + JSON.stringify(time.map(hourStr)) + ',"el":' + JSON.stringify(served.map((x) => (x.m.el ?? null))) +
      ',"v":{' + vparts.join(",") + '},"ft":' + JSON.stringify(served.map((x) => x.m.ft)) + ',"fs":' + JSON.stringify(served.map((x) => x.fs)) +
      ',"gen":' + JSON.stringify(served.map(() => null)) + ',"fz":' + JSON.stringify(served.map((x) => x.m.fz !== false)) + ',"policy":' + POLICY_JSON + "}";
  }
  const nowRaw = served.length && time.length ? nowModel(served, a0, now) : null;   // step 2: small "now" file (9 Nov 2026)
  const aero = points === ALL_POINTS ? AERO_JSON : JSON.stringify(points.map((p) => [Math.round(p[1] * 1e4) / 1e4, Math.round(p[2] * 1e4) / 1e4]));
  const mt = src(metar, "metar"), tf = src(taf, "taf");
  const st = { ...state, model: { ...((state && state.model) || {}), summary } };
  // build in order and remember where the parts start/end, so /api/metar, /api/taf and /api/model-weather can slice
  // the stored text without parsing 1 MB (each Pages Function request also has only 10 ms CPU on the free plan)
  const parts = [], off = {}; let len = 0;
  const add = (s, name) => { if (name) off[name] = [len, len + s.length]; parts.push(s); len += s.length; };
  add('{"v":2,"composedAt":"' + composedAt + '","nextAt":"' + iso(now + TICK_MIN * MIN) + '","metar":{"fetchedAt":' + JSON.stringify(mt.fetchedAt) + ',"rows":');
  const metarText = JSON.stringify(mt.rows); add(metarText, "metar");
  add(',"withheld":' + mt.withheld + '},"taf":{"fetchedAt":' + JSON.stringify(tf.fetchedAt) + ',"rows":');
  const tafText = JSON.stringify(tf.rows); add(tafText, "taf");
  add(',"withheld":' + tf.withheld + '},"model":');
  add(modelText, "model");
  add(',"aero":' + aero + ',"state":');
  add(JSON.stringify(st), "state");
  add("}");
  const nowFile = nowRaw ? nowText(nowRaw, composedAt, now, metarText, tafText, mt.fetchedAt, tf.fetchedAt, units) : null;
  return { composedAt, text: parts.join(""), off, metarAt: mt.fetchedAt, tafAt: tf.fetchedAt, now: nowFile };
}

/* ---- step 2 (9 Nov 2026, MT t873u/t874s2998): the small "now" file ----
   What list, Status and cards need right now, per aerodrome, in one ~90 KB (~25 KB gz) file: the model values of the current
   hour and the next one (every VAR), the freezing level for the current hour + 4, the point's fetch time and elevation, plus the
   METAR and TAF rows exactly as /api/metar and /api/taf serve them. Built from the packed records fastCompose already split
   (no JSON parse of the model store), so it adds well under 1 ms of CPU per tick. Served by functions/api/wx-now.js. */
const FZ = VARS.indexOf("freezing_level_height"), CB = VARS.indexOf("cloud_base"), NOW_H = 2, FZL_H = 5;   // cloud_base: always null from Open-Meteo, left out
const NULLS = ["", "null", "null,null", "null,null,null", "null,null,null,null", "null,null,null,null,null"];
// cnt consecutive comma tokens of a packed row body starting at token off, as "a,b" (one scan + one slice, no arrays)
function seg(body, off, cnt, n) {
  if (body === "") return NULLS[cnt];
  if (off < 0 || off + cnt > n) { let s = ""; for (let h = 0; h < cnt; h++) s += (h ? "," : "") + (off + h >= 0 && off + h < n ? seg(body, off + h, 1, n) : "null"); return s; }
  let i = 0; for (let k = 0; k < off; k++) i = body.indexOf(",", i) + 1;
  let j = i; for (let k = 0; k < cnt; k++) { const q = body.indexOf(",", j); j = q < 0 ? body.length + 1 : q + 1; }
  return body.slice(i, j - 1);   // packEntry writes every token as a number or "null", never empty
}
function nowModel(served, a0, now) {
  const hc = Math.max(a0, Math.floor(now / H) * H);
  let ids = "", c = "", z = ""; const ft = [], el = [], fz = [];
  for (let p = 0; p < served.length; p++) { const x = served[p], f = x.f, n = x.n, off = Math.round((hc - x.t0) / H);
    let row = "";
    for (let k = 0; k < NV; k++) { if (k === FZ || k === CB) continue; row += (row ? "," : "") + seg(f[6 + k], off, NOW_H, n); }
    const sep = p ? "," : "";
    ids += sep + (P_JSON.get(x.p[0]) || JSON.stringify(x.p)); c += sep + "[" + row + "]"; z += sep + "[" + (FZ >= 0 ? seg(f[6 + FZ], off, FZL_H, n) : NULLS[FZL_H]) + "]";
    ft.push(x.m.ft); el.push(x.m.el ?? null); fz.push(x.m.fz !== false);
  }
  return { hc, ids, ft, el, fz, c, z };
}
const NOW_VARS_JSON = JSON.stringify(VARS.filter((k) => k !== "freezing_level_height" && k !== "cloud_base"));
function nowText(r, composedAt, now, metarText, tafText, metarAt, tafAt, units) {
  return '{"v":1,"composedAt":"' + composedAt + '","t0":"' + hourStr(r.hc) + '","hours":' + NOW_H + ',"fzlHours":' + FZL_H +
    ',"vars":' + NOW_VARS_JSON + ',"units":' + JSON.stringify(units || {}) + ',"policy":' + POLICY_JSON +
    ',"pts":[' + r.ids + '],"ft":' + JSON.stringify(r.ft) + ',"el":' + JSON.stringify(r.el) + ',"fz":' + JSON.stringify(r.fz) +
    ',"c":[' + r.c + '],"fzl":[' + r.z + ']' +
    ',"metarAt":' + JSON.stringify(metarAt || null) + ',"tafAt":' + JSON.stringify(tafAt || null) +
    ',"metar":' + metarText + ',"taf":' + tafText + "}";
}
