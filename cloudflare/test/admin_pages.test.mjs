import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { onRequestGet as health } from "../functions/api/admin/health.js";

const site = new URL("../../site/", import.meta.url);
const PAGES = ["admin-visits", "admin-status", "admin-visitors", "admin-visitor-log", "admin-sitestatus", "admin-dashboard"];
const hash = (p) => createHash("sha1").update(readFileSync(new URL(p, site))).digest("hex").slice(0, 10);

test("all six rebuilt admin pages exist, are noindex and load the shared code at its current ?v=", () => {
  for (const p of PAGES) {
    const f = new URL(p + ".html", site);
    assert.ok(existsSync(f), p);
    const s = readFileSync(f, "utf8");
    assert.match(s, /<meta name="robots" content="noindex/);
    assert.ok(s.includes("/admin-x/ax.css?v=" + hash("admin-x/ax.css")), p + " ax.css ?v=");
    assert.ok(s.includes("/admin-x/ax.js?v=" + hash("admin-x/ax.js")), p + " ax.js ?v=");
    assert.match(s, /id="login-form"/);
    assert.ok(!s.includes("wm-beacon.js"), p + " must not log admin visits");
  }
});

test("pages read only the admin APIs (no Netlify-era endpoints)", () => {
  for (const p of PAGES) {
    const s = readFileSync(new URL(p + ".html", site), "utf8");
    const used = [...s.matchAll(/A\.(?:get|api)\('([^'?]+)/g)].map((m) => m[1]);
    assert.ok(used.length, p);
    for (const u of used) assert.ok(u.startsWith("/api/admin/") || u === "/ops-stamp.json", p + " uses " + u);
  }
});

test("shared CSS: four themes, General Sans, dvh, no position:fixed", () => {
  const css = readFileSync(new URL("admin-x/ax.css", site), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const pal of ["black", "purple", "white", "beige"]) assert.ok(css.includes("[data-pal=" + pal + "]"), pal);
  assert.match(css, /General Sans/); assert.match(css, /dvh/);
  assert.ok(!/position:\s*fixed/.test(css));
});

test("example data only on localhost", () => {
  const js = readFileSync(new URL("admin-x/ax.js", site), "utf8");
  assert.match(js, /LOCAL=\/\^\(localhost\|127\\\.0\\\.0\\\.1\)\$\/\.test\(location\.hostname\),EX=LOCAL&&/);
});

test("/api/admin/health needs the admin session", async () => {
  const req = new Request("https://x.test/api/admin/health");
  assert.equal((await health({ request: req, env: {} })).status, 503);
  assert.equal((await health({ request: req, env: { ADMIN_DASH_SECRET: "s" } })).status, 401);
});

test("classic /admin-visits-classic is the original white visit table, behind the admin APIs", () => {
  const f = new URL("admin-visits-classic.html", site);
  assert.ok(existsSync(f));
  const s = readFileSync(f, "utf8");
  assert.match(s, /<meta name="robots" content="noindex/);
  assert.ok(!s.includes("wm-beacon.js"), "must not log admin visits");
  assert.ok(!s.includes("admin-x/ax.css"), "classic page keeps the original look, not the visitor-log shell");
  assert.match(s, /background:#F8F7F3/);
  assert.match(s, /h1\{color:#0B3D91\}/);
  assert.match(s, /<th>Time \(UTC\)<\/th><th>City<\/th><th>Region<\/th><th>Country<\/th><th>Device<\/th><th>Browser<\/th>/);
  assert.match(s, /\/api\/admin\/visits\?range=all&limit=500/);
  assert.match(s, /\/api\/admin\/session/);
  assert.match(s, /LOCAL=\/\^\(localhost\|127\\\.0\\\.0\\\.1\)\$\/\.test\(location\.hostname\),EX=LOCAL&&/);
  assert.ok(s.includes('id="f"') && s.includes('id="pw"'), "admin password form");
});

test("/api/admin/visits accepts range=all for the classic page (90-day retention)", () => {
  const s = readFileSync(new URL("../functions/api/admin/visits.js", import.meta.url), "utf8");
  assert.match(s, /range === "all" \|\| range === "90d" \? 90 \* 86400000/);
});
