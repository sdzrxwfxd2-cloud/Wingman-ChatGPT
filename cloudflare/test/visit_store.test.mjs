// Admin traffic / visitor log fix (11 Nov 2026). Run: cd cloudflare && npm test
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { insertVisit, listVisits, summarizeWindows, kvRows, toMeta, KV_GET_BUDGET } from "../lib/visit_store.mjs";
import * as beacon from "../functions/api/visit-beacon.js";
import * as stats from "../functions/api/admin/stats.js";
import * as logData from "../functions/visitor-log-data.js";
import { mintCookie } from "../lib/admin_session.mjs";

// Workers KV stand-in: list() returns metadata like the real API, and it throws past 1,000 operations per invocation.
function fakeKV() {
  const m = new Map(); let ops = 0;
  const op = () => { if (++ops > 1000) throw new Error("Too many API requests by single worker invocation."); };
  return {
    m, get ops() { return ops; }, reset() { ops = 0; },
    async put(k, v, o = {}) { op(); m.set(k, { v, meta: o.metadata ? JSON.parse(JSON.stringify(o.metadata)) : undefined }); },
    async get(k, t) { op(); const x = m.get(k); return x ? (t === "json" ? JSON.parse(x.v) : x.v) : null; },
    async list({ prefix = "", cursor, limit = 1000 } = {}) { op(); const ks = [...m.keys()].filter((k) => k.startsWith(prefix)).sort();
      const start = cursor ? +cursor : 0, page = ks.slice(start, start + limit);
      return { keys: page.map((name) => ({ name, metadata: m.get(name).meta })), list_complete: start + limit >= ks.length, cursor: String(start + limit) }; },
  };
}
const now = Date.now();
function legacyStore(n) { // keys written by the 10 Nov code: value only, no metadata
  const kv = fakeKV();
  for (let i = 0; i < n; i++) { const ts = now - i * 60000; kv.m.set(`v:${ts}:k${i}`, { v: JSON.stringify({ ts, sid: "s" + (i % 40), n: 1, path: "/main.html", city: "Reston", country: "US", device_type: "mobile", browser: "Safari", os: "iOS", ip: "203.0.113." + (i % 9) }) }); }
  return kv;
}
const SECRET = "test-only-admin-secret";
async function adminReq(path) { const c = (await mintCookie(SECRET)).split(";")[0]; return new Request("https://x.dev" + path, { headers: { Cookie: c } }); }

test("10 Nov store (1,383 keys, no metadata): stats stay far under 1,000 KV operations", async () => {
  const kv = legacyStore(1383); const env = { VISITORS_KV: kv, ADMIN_DASH_SECRET: SECRET };
  const r = await stats.onRequestGet({ request: await adminReq("/api/admin/stats?range=7d"), env });
  assert.equal(r.status, 200); const d = await r.json();
  assert.ok(kv.ops <= 2 + 400, "stats used " + kv.ops + " KV operations");
  assert.equal(d.today.visits, 1383); assert.equal(d.legacy, 1383 - 400); assert.ok(d.today.uniques > 0); assert.ok(d.pages.length > 0);
  kv.reset(); const v = await listVisits(env, { since: now - 7 * 864e5, until: now + 1, limit: 100 });
  assert.ok(kv.ops <= 2 + KV_GET_BUDGET, "log used " + kv.ops); assert.equal(v.rows.filter((x) => x.path).length, KV_GET_BUDGET);
});

test("new visits carry metadata: log and totals need list() only", async () => {
  const kv = fakeKV(), env = { VISITORS_KV: kv };
  for (let i = 0; i < 50; i++) await insertVisit(env, { ts: now - i * 1000, sid: "a" + (i % 5), n: 1, path: "/p" + (i % 3), ip: "198.51.100.1", city: "Durban", country: "ZA", device_type: "mobile", browser: "Chrome", os: "Android", ua: "x".repeat(400), screen: "390x844" });
  kv.reset();
  const v = await listVisits(env, { since: now - 864e5, until: now + 1, limit: 100 });
  assert.equal(kv.ops, 1); assert.equal(v.rows.length, 50); assert.equal(v.rows[0].city, "Durban"); assert.equal(v.rows[0].screen, "390x844");
  kv.reset(); const w = await summarizeWindows(env, { until: now + 1 });
  assert.equal(kv.ops, 1); assert.equal(w.week.visits, 50); assert.equal(w.week.uniques, 5);
  assert.ok(JSON.stringify(toMeta({ ts: 1, path: "/" + "p".repeat(900), ref: "r".repeat(900), city: "c".repeat(200) })).length <= 1024);
});

test("filters still work on new rows; legacy rows are filled within the get() budget", async () => {
  const kv = legacyStore(10), env = { VISITORS_KV: kv };
  await insertVisit(env, { ts: now + 5, sid: "z", n: 1, path: "/calculator.html", country: "ZA", device_type: "desktop" });
  const d = await listVisits(env, { since: now - 864e5, until: now + 10, device: "desktop" });
  assert.deepEqual(d.rows.map((r) => r.path), ["/calculator.html"]);
  const m = await listVisits(env, { since: now - 864e5, until: now + 10, device: "mobile" });
  assert.equal(m.rows.length, 10);
});

test("visitor-log-data gives visitor-log.html its `visits` field names", async () => {
  const kv = fakeKV(), env = { VISITORS_KV: kv, ADMIN_DASH_SECRET: SECRET };
  await insertVisit(env, { ts: now, sid: "s1", n: 2, path: "/main.html", device_type: "mobile", device_model: "SM-S918B", browser: "Chrome", os: "Android", os_ver: "14", screen: "412x915", viewport: "412x800", city: "Cape Town", country: "ZA", ip: "198.51.100.7" });
  const r = await logData.onRequestGet({ request: await adminReq("/visitor-log-data"), env });
  const d = await r.json();
  assert.equal(d.visits.length, 1);
  assert.deepEqual({ t: d.visits[0].t, dev: d.visits[0].dev, sw: d.visits[0].sw, sh: d.visits[0].sh, city: d.visits[0].city, sv: d.visits[0].sv }, { t: now, dev: "Phone", sw: 412, sh: 915, city: "Cape Town", sv: 2 });
  assert.equal((await logData.onRequestGet({ request: new Request("https://x.dev/visitor-log-data"), env })).status, 401);
});

test("beacon: real visit stored once; automated browsers and bots are not stored", async () => {
  const kv = fakeKV(), env = { VISITORS_KV: kv };
  const post = (body, ua) => { const r = new Request("https://x.dev/api/visit-beacon", { method: "POST", headers: { "User-Agent": ua, "CF-Connecting-IP": "198.51.100." + Math.floor(Math.random() * 200) }, body: JSON.stringify(body) }); Object.defineProperty(r, "cf", { value: { country: "ZA", city: "Pretoria" } }); return r; };
  const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
  await beacon.onRequestPost({ request: post({ sid: "a", n: 1, path: "/index.html", wd: 0 }, iphone), env });
  await beacon.onRequestPost({ request: post({ sid: "b", n: 1, path: "/index.html", wd: 1 }, iphone), env });
  await beacon.onRequestPost({ request: post({ sid: "c", n: 1, path: "/index.html" }, "Mozilla/5.0 (compatible; Googlebot/2.1)"), env });
  await beacon.onRequestPost({ request: post({ sid: "d", n: 1, path: "/index.html" }, "Mozilla/5.0 HeadlessChrome/130.0"), env });
  assert.equal(kv.m.size, 1); const [only] = kv.m.values(); assert.equal(only.meta.city, "Pretoria"); assert.equal(only.meta.path, "/index.html");
});

test("wm-beacon.js: top frame only, skips webdriver; every page's ?v= is its current hash", () => {
  const site = new URL("../../site/", import.meta.url), js = readFileSync(new URL("wm-beacon.js", site));
  assert.match(js.toString(), /window\.top!==window\.self/); assert.match(js.toString(), /navigator\.webdriver/);
  const v = createHash("sha256").update(js).digest("hex").slice(0, 10);
  const html = execSync("grep -rl 'wm-beacon.js?v=' --include=*.html .", { cwd: site, encoding: "utf8" }).trim().split("\n");
  assert.ok(html.length >= 14);
  for (const f of html) { const s = readFileSync(new URL(f, site), "utf8"); for (const m of s.matchAll(/wm-beacon\.js\?v=([0-9a-f]+)/g)) assert.equal(m[1], v, f); }
});

test("protected files untouched", () => {
  let changed = ""; try { changed = execSync("git diff --name-only 77d0fa93; git diff --name-only --cached 77d0fa93", { cwd: new URL("../..", import.meta.url), encoding: "utf8" }); } catch { return; }
  const bad = changed.split("\n").filter((f) => /gate\.ts$|(^|\/)appdata\/|ARCHIVE_DO_NOT_TOUCH|lib\/auth\.mjs$|wm-pin\.js$|^site\/wm-core\.js$|functions\/_middleware\.js$/.test(f));
  assert.deepEqual(bad, []);
});
