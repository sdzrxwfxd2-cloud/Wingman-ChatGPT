import { test } from "node:test";
import assert from "node:assert/strict";
import { compareWx, latestById, uptimeOf, errorsOf, reportMs, PAGES } from "../lib/admin_health.mjs";

const NOW = Date.parse("2026-11-11T01:00:00Z");
const m = (id, iso) => ({ icaoId: id, obsTime: Date.parse(iso) / 1000, rawOb: "METAR " + id });

test("latestById keeps the newest report per station", () => {
  const r = latestById("metar", [m("FACT", "2026-11-11T00:00:00Z"), m("FACT", "2026-11-11T00:30:00Z")]);
  assert.equal(r.get("FACT").t, Date.parse("2026-11-11T00:30:00Z"));
});

test("compareWx finds match, behind, missing and old", () => {
  const site = [m("FACT", "2026-11-11T00:30:00Z"), m("FAOR", "2026-11-11T00:00:00Z")];
  const off = [m("FACT", "2026-11-11T00:30:00Z"), m("FAOR", "2026-11-11T00:30:00Z"), m("FALA", "2026-11-11T00:30:00Z"), m("FAXX", "2026-11-10T20:00:00Z")];
  const c = compareWx("metar", site, off, NOW);
  assert.equal(c.match, 1); assert.equal(c.total, 3);
  assert.deepEqual(c.behind.map((x) => x.id), ["FAOR"]);
  assert.deepEqual(c.missing, ["FALA"]);
  assert.deepEqual(c.old.map((x) => x.id), ["FAXX"]);
  assert.equal(c.stations.length, 4);
});

test("TAF times use issueTime", () => {
  assert.equal(reportMs("taf", { issueTime: "2026-11-10T23:00:00.000Z" }), Date.parse("2026-11-10T23:00:00Z"));
  const c = compareWx("taf", [{ icaoId: "FACT", issueTime: "2026-11-10T23:00:00Z" }], [{ icaoId: "FACT", issueTime: "2026-11-10T23:00:00Z" }], NOW);
  assert.equal(c.match, 1);
});

test("compareWx copes with bad input", () => {
  const c = compareWx("metar", null, "x", NOW);
  assert.equal(c.total, 0); assert.equal(c.stations.length, 0);
});

test("uptimeOf counts checks and downs", () => {
  const u = uptimeOf([{ t: "a", up: true, d: "x" }, { t: "b", up: false, d: "x", wx: false }, { t: "c", up: true, d: "y" }], "x");
  assert.equal(u.checks, 2); assert.equal(u.ok, 1); assert.equal(u.all, 3); assert.deepEqual(u.downs, ["b"]); assert.deepEqual(u.wxDowns, ["b"]);
  assert.equal(uptimeOf(null, "x").all, 0);
});

test("errorsOf lists failed probes and broken pages only", () => {
  const ok = { s: 200, ms: 5 };
  const e = errorsOf({ now: NOW, probes: { site: ok, metar: { s: 502, ms: 9 }, taf: ok, flights: ok, model: ok },
    wx: { metar: { up: ok }, taf: { up: { s: 0, ms: 1, e: "timeout" } } }, health: { metar: { t: "z", status: 200 }, taf: null },
    pages: [{ p: "/", s: 200, complete: true }, { p: "/x.html", s: 200, complete: false }], uptime: uptimeOf([], null) });
  assert.deepEqual(e.map((x) => x.what), ["METAR function /api/metar", "Official TAF (aviationweather.gov)", "Page /x.html"]);
});

test("page list matches the 30 Oct site status page", () => { assert.equal(PAGES.length, 13); });
