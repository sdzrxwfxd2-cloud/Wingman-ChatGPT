// ATO review rules (pure logic, no storage). Shared by the function and tests.
// Rules from BLUEPRINT.md / ATO_RANKING_IDEAS.md:
//  - one review per pilot per ATO, keyed by account id + ATO id
//  - a pilot may replace their review only after 6 months (one per school per 6 months)
//  - always anonymous: account id never leaves the server
//  - reviews made inside the "Rate any ATO, get 10 days Pro free" campaign carry an incentivised label
export const LICENCES = ["PPL", "CPL", "Night", "IR", "Instructor"];
export const SIX_MONTHS_MS = 182 * 24 * 3600 * 1000;
export const ANON_NOTE = "Your review is anonymous. This is mandatory and cannot be turned off.";
export const atoKey = (id) => String(id || "").trim().toUpperCase().replace(/[^A-Z0-9/]/g, "").replace(/\//g, "_");
export const reviewKey = (ato, acct) => `r/${atoKey(ato)}/${String(acct).replace(/[^A-Za-z0-9_-]/g, "")}`;

export function validate(b, now = Date.now()) {
  const e = [];
  const stars = Number(b?.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) e.push("stars must be 1-5");
  const text = typeof b?.text === "string" ? b.text.trim() : "";
  if (text.length < 20) e.push("review text needs at least 20 characters");
  if (text.length > 3000) e.push("review text max 3000 characters");
  if (!atoKey(b?.ato)) e.push("ato id missing");
  let cost = null;
  if (b?.cost !== undefined && b?.cost !== null && b?.cost !== "") {
    cost = Math.round(Number(String(b.cost).replace(/[\s,R]/g, "")));
    if (!Number.isFinite(cost) || cost < 1000 || cost > 5000000) e.push("real total cost must be R1 000 - R5 000 000");
  }
  let licence = null;
  if (b?.licence) { if (!LICENCES.includes(b.licence)) e.push("licence must be one of " + LICENCES.join("/")); else licence = b.licence; }
  let when = null;
  if (b?.when) {
    const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(b.when);
    if (!m) e.push("when must be YYYY-MM");
    else { const t = Date.UTC(+m[1], +m[2] - 1, 1); if (t > now || +m[1] < 1980) e.push("when must be in the past"); else when = b.when; }
  }
  return { ok: !e.length, errors: e, clean: { ato: atoKey(b?.ato), stars, text, cost, licence, when } };
}

// existing: stored review or null. Returns {allowed, until}
export function canWrite(existing, now = Date.now()) {
  if (!existing) return { allowed: true };
  const until = existing.created + SIX_MONTHS_MS;
  return now >= until ? { allowed: true, replace: true } : { allowed: false, until };
}

export function incentivised(campaign, now = Date.now()) {
  return !!(campaign && campaign.start && campaign.end && now >= Date.parse(campaign.start) && now <= Date.parse(campaign.end));
}

// strip everything that could identify the pilot
export const publicView = (r) => ({ id: r.id, ato: r.ato, stars: r.stars, text: r.text, cost: r.cost, licence: r.licence, when: r.when,
  created: r.created, incentivised: !!r.incentivised, author: "Anonymous pilot" });

export function aggregate(list) {
  const n = list.length, costs = list.map((r) => r.cost).filter((c) => c);
  return { count: n, avgStars: n ? Math.round((list.reduce((a, r) => a + r.stars, 0) / n) * 10) / 10 : null,
    avgCost: costs.length ? Math.round(costs.reduce((a, c) => a + c, 0) / costs.length / 1000) * 1000 : null, costCount: costs.length };
}
