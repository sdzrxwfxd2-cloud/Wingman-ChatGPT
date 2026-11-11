# Go Around core engine v2 — review pack

Self-contained review file for rule pack **2.0.0**, 9 November 2026 (Africa/Johannesburg). It describes the full rules, the logic flow, the edge cases and how the code is put together. It does not name development tools.

The engine is a briefing helper for South African Part 91 visual flight. It is not a clearance, not an authorisation, and not legal advice. The person in command decides.

Code: `site/engine/ga-core-v2.js`. Tests: `node tests/engine-v2/run.js`. Policy: `docs/engine-v2/POLICY.md`. Decisions: `docs/engine-v2/DECISIONS.md`. Page notes: `docs/engine-v2/AERODROME-NOTES.md`.

This pack lives on its own Git branch and is not wired into the live site. The locked files `wm-core.js`, `gate.ts`, `appdata/`, auth code and `wm-shell.css` / `wm-shell.js` were not edited.

## 1. What the engine returns

`evaluate(input)` returns a verdict:

- `status`: `go`, `caution`, `nogo`, `incomplete`, or `none` (heliport)
- `why`: the top reason in plain words
- `findings`: every reason, each with a level, a short text, a key, a shelf (`law`, `policy`, `limit`, `aircraft`) and a stable rule id
- `source`: what weather was trusted, with a kind (`metar`, `speci`, `trend`, `taf`, `model`), a time and a label
- `weatherUsed`: the visibility, ceiling, wind and time that were scored
- `phase`: `depart` or `land`
- `planning`: whether the clock was “now”, a future ETD, or an ETA ±1 hour window
- `disclaimer`: “Guidance only — the person in command decides.”
- `rulePackId`, `rulePackVersion`, `rulePackChecksum`

Worst finding wins: NO-GO beats CAUTION beats GO. Notes do not change the status. That is how a model disclaimer can sit next to a GO.

User-facing sentences do not use the word that describes the licence holder’s occupation. They say “the person in command” and “your limit”.

## 2. Inputs

```
evaluate({
  field: {
    icao, lat, lon, elevFt,
    category: 'controlled' | 'uncontrolled' | undefined,
    runways: [{ id, trueHdg }],
    heliport, iap
  },
  weather: {
    metar: { raw, time },
    speci: { raw, time },
    taf: { raw },
    model: { visKm, ceilFt, wd, ws, g, t, qnh, time, fetchedAt }
  },
  profile: { ceilFt, visKm, xwKt, gustKt, night, ir },
  aircraftId,
  now,            // milliseconds
  phase: 'depart' | 'land',
  etd, eta,       // optional milliseconds
  rules: 'vfr' | 'ifr'
})
```

If `category` is missing, the field is treated as controlled (conservative app policy). Runway headings are true headings.

## 3. Full rules

### 3.1 Law — CAR 91.06.21 after the 33rd Amendment (GG 55226, 21 August 2026)

Verified against the promulgated amendment (SACAA legal-documents copy and Gazette 55226 page headers). The 34th, 35th and 36th Amendments do not mention this regulation.

In a control zone, or an aerodrome traffic zone that is not also a control zone:

- flight visibility 5 km
- distance from cloud 1 500 m horizontally and 1 000 ft vertically
- no take-off, landing, approach to land, or flight in the zone when ground visibility is either less than 5 km or the ceiling is less than 1 500 ft

Elsewhere, flight visibility is 5 km below 10 000 ft AMSL and 8 km at or above that level. At low level in class F/G the legal cloud rule is “clear of cloud and with the surface in sight”, not a 1 500 ft ceiling.

The engine applies the 5 km / 1 500 ft take-off and landing test to CTR/ATZ fields (rule ids `LAW-91.06.21-CTR-VIS` and `LAW-91.06.21-CTR-CEIL`). Either breach is enough (`LAW-91.06.21-CTR-OR`). Uncontrolled visibility below 5 km is still NO-GO (`LAW-91.06.21-UNC-VIS`). Uncontrolled ceiling below 1 500 ft is CAUTION (`POL-UNC-CEIL-1500`), unless the 1 000 ft circuit floor applies. A field at or above 10 000 ft elevation uses 8 km (`LAW-91.06.21-HIGH-VIS`).

### 3.2 Law — CAR 91.07.7(7)

A destination or alternate may be planned only if reports or forecasts are at or above planning minima from one hour before to one hour after ETA (`LAW-91.07.7-LAND-WINDOW`). Depart still judges now (`LAW-91.07.7-DEPART-NOW`).

### 3.3 Law — night

CAR Part 1: night starts 15 minutes after sunset and ends 15 minutes before sunrise (`LAW-PART1-NIGHT`). Sunset and sunrise are computed with the NOAA algorithm already used by the 30 October overlay.

If it is night and night is not selected: NO-GO (`POL-NIGHT-UNSELECTED`). If night is within 60 minutes and is not selected: CAUTION (`POL-NIGHT-SOON`). Night flying facilities (CAR 91.07.3(2)) are not computed.

### 3.4 App policy kept from the 30 October overlay

| Id | Rule |
|---|---|
| POL-FLOOR-1000 | Ceiling below 1 000 ft is NO-GO everywhere |
| POL-UNKNOWN-CTL | Unknown aerodrome category is treated as controlled |
| POL-PERSONAL-CEIL / POL-PERSONAL-VIS | Below a user’s stricter number is NO-GO |
| POL-NEAR-20 | Within 20% above the applicable limit is CAUTION |
| POL-CNR | BKN///, OVC/// or VV/// is NO-GO |
| POL-WX-NOGO | TS, CB/TCU, FZRA/FZDZ, SQ, FC, GR |
| POL-WX-CAUT | Recent hazards, +RA/+SN, GS, FZFG |
| POL-WX-FAGR | Station identifiers are not read as weather (FAGR is not hail) |
| POL-VRB-LIGHT | Variable 0–6 kt, no gust: GO with a note |
| POL-VRB-GUST | Variable with gusts is never a plain GO |
| POL-GUST-SPREAD | Gust minus mean above 15 kt: CAUTION |
| POL-XW-BANDS | Crosswind ≤80% GO, 80–100% CAUTION, above the limit NO-GO |
| POL-XW-DEFAULT | No aircraft selected: 12 kt default |
| POL-TW-BANDS | Tailwind 0–5 GO, 6–10 CAUTION, above 10 NO-GO |
| POL-DA | Density altitude more than field + 2 500 ft: CAUTION |
| POL-DA-NO-NOGO | Density altitude never makes a NO-GO by itself |
| POL-TAF-TS | Lasting or becoming TAF thunderstorm-type weather: NO-GO |
| POL-TEMPO-TS-NOGO | TEMPO thunderstorm-type weather: NO-GO |
| POL-TAF-PERM-BELOW | BECMG or FM below minima: NO-GO |
| POL-TAF-TEMPO-BELOW | TEMPO below minima: CAUTION |
| POL-TAF-PROB | PROB30/40 capped at CAUTION |
| POL-MISS-VIS | Official report missing visibility, no fill-in: NO-GO |
| POL-FILL-HOLE | Missing official visibility filled from the model: CAUTION |
| POL-WIND-MISSING | Missing wind is never calm |
| POL-VAR-GROUP | Direction variation uses the worst crosswind and tailwind on the chosen runway |
| POL-WS-STRONG | Mean wind at or above 20 kt: CAUTION; above the user’s gust limit: NO-GO |
| POL-HELI | Heliport: no verdict |
| POL-NIL / POL-NODATA | NIL or no source: INCOMPLETE |
| POL-CAVOK / POL-9999 | CAVOK or 9999 means 10 km and, for CAVOK, no ceiling |
| POL-SPECI-WINS | The newer SPECI beats an older METAR |
| POL-AUTO | AUTO remains an official report |
| POL-WORST-WINS | The worst finding is the status |
| POL-SHELVES | Each finding is tagged law, policy, limit or aircraft |
| POL-SOURCE-LABEL | Every used value has a source kind and label |
| POL-DISCLAIMER | Standing line: the person in command decides |
| POL-IFR-RATING / POL-IFR-NO-IAP / POL-IFR-CAT1 | Optional IFR path; 200 ft / 550 m is a generic CAT I figure, not the plate |

### 3.5 Source age and TREND

| Id | Rule |
|---|---|
| POL-METAR-STALE-60 | Official report 61–90 minutes old: still used, plus CAUTION |
| POL-METAR-DROP-90 | Official report older than 90 minutes: not used as “now” |
| POL-TREND-TS / POL-TREND-WX | TREND thunderstorm-type weather is NO-GO; other TREND hazards are CAUTION |
| POL-TREND-VISCEIL | TREND visibility and ceiling are graded, not only weather tokens |
| POL-TREND-SUPERSEDE / POL-NOSIG | A TREND, including NOSIG, supersedes the TAF for two hours (SA AIP GEN 3.5 4.2.4) |

### 3.6 Model-only

| Id | Rule |
|---|---|
| POL-MODEL-DISCLAIMER | Always: “Model estimate only — not an official weather report.” |
| POL-MODEL-GO | A clearly good model picture may be GO, with that disclaimer |
| POL-MODEL-NOGO-CLEAR | NO-GO only when clearly beyond the locked margins |
| POL-MODEL-BORDERLINE | At or beyond a limit, but not by the margin: CAUTION |
| POL-MODEL-OLDER | Model 91–180 minutes old: extra CAUTION |
| POL-MODEL-TOO-OLD | Model older than 180 minutes: not used |

Locked margins: visibility 1.0 km below the limit; ceiling 300 ft below; wind 5 kt above; tailwind 3 kt above the 10 kt threshold.

### 3.7 Depart versus Land

| Id | Rule |
|---|---|
| POL-DEPART-METAR-WINS | A poor METAR now wins for Depart now, even if the TAF later improves |
| POL-LAND-FOLLOWS-TAF | A later Land may follow the TAF across the ETA window |
| POL-ARRIVE-NEAR-NOW | Arrive within about 30 minutes uses the same ladder as Depart now |

## 4. Logic flow

1. Read the field, the profile, the clock and the phase.
2. If the field is a heliport, stop with `none`.
3. Pick weather:
   - Depart now, or Land/Depart within about 30 minutes of now: usable METAR/SPECI (age ≤ 90 min), else TAF covering now, else a usable model, else incomplete.
   - Future ETD: TAF at that time, else model.
   - Future Land: TREND if it still covers the window, else TAF across ETA ±1 h, else model. A current poor METAR does not win.
4. If a usable official report is 61–90 minutes old, add the stale CAUTION.
5. Score visibility, ceiling, present weather, TREND, wind, night, density altitude and TAF change groups.
6. If the source is the model, apply the clear-margin test to numeric NO-GO findings and attach the model disclaimer as a note.
7. Sort findings, worst first. Return the verdict, the source and the standing disclaimer.

```
                  ┌──────────────────────────┐
                  │  phase + clock           │
                  │  Depart now / ETD        │
                  │  Land now / ETA ±1 h     │
                  └────────────┬─────────────┘
                               ▼
         METAR/SPECI ≤90 min? ──yes──► score report
                │                       + TREND if present
                │                       (TREND supersedes TAF for 2 h)
                no
                ▼
         TAF covers the time? ──yes──► score TAF
                │                       (Land: whole ETA window)
                no
                ▼
         Model ≤180 min? ──yes──► score model
                │                 (GO / CAUTION / clear NO-GO
                no                 + disclaimer)
                ▼
           INCOMPLETE
```

## 5. Edge cases the tests cover

- Visibility exactly 5.0 km is not below the legal floor; 4.0 km is.
- Either a low visibility or a low ceiling is enough in a CTR/ATZ (the Amendment uses “either … or”, not “and”). The stale AIP ENR 1.2 page still shows “and” and must not be followed.
- Uncontrolled 1 200 ft is CAUTION; uncontrolled 800 ft is NO-GO because of the 1 000 ft circuit floor.
- A station id such as FAGR is not hail.
- CAVOK and 9999 both read as 10 km. Four-digit metre groups are preferred so 5000 stays 5.0 km.
- `/////KT` is missing wind, not calm.
- A single runway pointing downwind can produce a tailwind NO-GO; a two-way strip will pick the into-wind end.
- `24015KT 220V300` rates the worst crosswind in that arc on the runway chosen by 240°.
- NOSIG on a current METAR stops a TAF TEMPO thunderstorm in the next two hours from becoming a NO-GO, because the TREND supersedes the TAF.
- Without a TREND, that same TAF TEMPO thunderstorm is a NO-GO.
- A 70-minute-old CAVOK METAR is CAUTION (stale), not dropped. A 100-minute-old METAR with no TAF and no model is INCOMPLETE.
- Model visibility 3.0 km (1.0 km or more below 5 km) is NO-GO plus the disclaimer. Model visibility 4.5 km is CAUTION. Model visibility 10 km and a high ceiling is GO plus the disclaimer.
- A 120-minute-old good model is CAUTION (older). A 200-minute-old model is unused.
- Land five hours ahead with a poor METAR now and a CAVOK TAF is GO. Depart now with the same pair is NO-GO.
- Density altitude well above the field produces CAUTION only.
- Heliports and METAR NIL never produce a go / caution / no-go badge.

## 6. How the code is arranged

One file, about a thousand lines, no page or network code.

- `RULES` — the locked numbers (law, policy, IFR floors)
- `RULES_VERSION` / `RULES_LOCK` — version `2.0.0` and SHA-256 of the canonical `RULES` table
- `CITES` — source sentences, not part of the checksum
- Parsers reused in spirit from the 30 October overlay: METAR body and TREND, visibility (metre group first), ceiling, WMO weather tokens, TAF segments (BASE, FM, BECMG, TEMPO, PROB), wind variation, density altitude, sunrise and sunset
- `pickWeather` — the ladder in section 4
- `applyModelMargin` — the clear-limit test
- `evaluate` — the public entry point

The file exports `GACoreV2` in a browser and `module.exports` in Node, so the tests run the same functions the page would call later.

The live overlay (`site/wst/wst-engine.js`) and the locked core (`site/wm-core.js`) are not imported and not changed. Wiring this file into the cards is a later step, only after an explicit yes.

## 7. Tests and the lock

Run:

```
node tests/engine-v2/run.js
```

The runner:

- hashes `RULES` with SHA-256 and compares it to `RULES_LOCK` and to `tests/engine-v2/rules-lock.json`
- fails if the table changed and the sealed checksum / version pair was not updated together (a version bump is required when the table changes)
- checks the Part 1 night definition against sunset at Cape Town
- runs one case for every rule id listed in this file
- refuses a result whose user-facing strings contain the banned occupation word

Expected result: `OK 69 rule cases plus lock and night-definition checks`.

To change a number: edit `RULES`, raise `RULES_VERSION`, recompute `sha256` of `rulesCanonical()`, write that hex into `RULES_LOCK` and `tests/engine-v2/rules-lock.json`, add or adjust the matching test, and run the suite.

## 8. Citations

- Thirty-Third Amendment of the Civil Aviation Regulations, 2026, GG 55226, 21 August 2026, GN 7844. https://caasanwebsitestorage.blob.core.windows.net/legal-documents/Promulgated%2033RD%20Amendment%20Regulation%202026%20(Final).pdf
- https://www.gov.za/documents/notices/civil-aviation-act-thirty-third-amendment-civil-aviation-regulations-2026-english
- SA AIP GEN 3.5 4.2.4, compilation 15 October 2026; also https://cad.atns.co.za/SmartAIM/EAipPackages/15-OCT-22/2022-10-15-000000/html/eAIP/FA-GEN-3.5-en-US.html
- ICAO Annex 3 §6.3 (landing forecasts / TREND, public excerpts of the 21st edition)
- WMO aerodrome reports and forecasts guidance (METAR hourly or half-hourly; TREND valid 2 hours)
- FAA AIM Chapter 7 (destination forecast ±1 hour) and AC 91-92
- FAA AC 00-45H (METAR / SPECI as observations)
- 14 CFR 91.169 (United States analogue only)

## 9. What remains unverified or out of scope

- Official paid ICAO Annex 3 text from the ICAO store
- SA-CATS 91 numeric planning minima (not invented)
- Night flying facility data per aerodrome
- Any amendment after the 36th that might later touch 91.06.21 or 91.07.7
- Part 121 and Part 135
- Wiring into the live Status or aerodrome page
- Worker or weather-fetch changes

A reviewer who disagrees with an app-policy number (for example the 1 000 ft floor, TEMPO thunderstorms as NO-GO, or the model margins) can name the rule id. The law figures 5 km and 1 500 ft in a CTR/ATZ are not app policy; they come from the 33rd Amendment.
