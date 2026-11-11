# Go Around core engine v2 — policy

Rule pack **2.0.0**, 9 November 2026 (Africa/Johannesburg). Code: `site/engine/ga-core-v2.js`. Tests: `node tests/engine-v2/run.js`.

This is a briefing helper, not a clearance and not a flight authorisation. The person in command decides (CAR 91.02.6, 91.02.7 and 91.02.8).

Anything marked **LAW** is taken from the current Civil Aviation Regulations, Part 91, as amended. Anything marked **APP POLICY** is an app choice sitting on top of the law. **YOUR LIMIT** is a number the user set. **AIRCRAFT** is a POH or similar figure.

Part 91 only. Part 121 and Part 135 minima are not used.

## Official sources

- Thirty-Third Amendment of the Civil Aviation Regulations, 2026, Government Gazette No. 55226, 21 August 2026 (GN 7844). Official file: https://caasanwebsitestorage.blob.core.windows.net/legal-documents/Promulgated%2033RD%20Amendment%20Regulation%202026%20(Final).pdf
- Government notice page: https://www.gov.za/documents/notices/civil-aviation-act-thirty-third-amendment-civil-aviation-regulations-2026-english
- Local copy used while writing this pack: `/workspace/offdocs/dl/regulations/cars-amendments/Promulgated_33RD_Amendment_Regulation_2026_(Final).pdf` (matches the Gazette 55226 text)
- The 34th, 35th and 36th Amendments (also August 2026) were searched; they do not mention 91.06.21 or 91.07.7
- SA AIP GEN 3.5, compilation 15 October 2026, section 4.2.4 (TREND)
- ICAO Annex 3, landing forecasts (TREND valid 2 hours) and METAR/SPECI cadence
- CAR Part 1 definition of night

## Who decides — LAW

CAR 91.02.7: the person in command shall not commence a flight unless satisfied that weather at departure and arrival, and en route, including possible alternates, will not prevent a safe completion of the flight. CAR 91.02.8: that person is responsible for the operation and safety of the aircraft while in command.

The engine never says cleared, authorised, legal or illegal.

## VFR minima — LAW (33rd Amendment)

CAR 91.06.21 was substituted by the 33rd Amendment. The old opening words that required visual reference to the surface by day, identifiable objects by night, and no more than three eighths of cloud within 5 NM were deleted.

**Table 1 — control zone, and an aerodrome traffic zone that is not also a CTR, aeroplanes**

- Flight visibility 5 km
- Distance from cloud: 1 500 m horizontally, 1 000 ft vertically (raised from 600 m / 500 ft)
- No aircraft shall take off from, land at, or approach to land at an aerodrome, or fly within the zone, when ground visibility is **either** less than 5 km **or** the ceiling is less than 1 500 ft

**Table 2 — other airspace**

- At and above 10 000 ft AMSL: 8 km flight visibility, 1 500 m / 1 000 ft from cloud
- Below 10 000 ft AMSL and above 3 000 ft AMSL or 1 000 ft AGL, whichever higher: 5 km, same distance from cloud
- At and below 3 000 ft AMSL or 1 000 ft AGL: class C — 5 km and 1 500 m / 1 000 ft; class F/G — 5 km, **clear of cloud and with the surface in sight** (no legal ceiling number)

VFR is not permitted at transonic or supersonic speed, or above FL200 (91.06.21(2)).

For this aerodrome helper, take-off and landing at a CTR/ATZ (or an unknown category, treated as controlled — **APP POLICY**) use the Table 1 ground-visibility and ceiling test. Uncontrolled fields use 5 km visibility (8 km if field elevation is at or above 10 000 ft AMSL). An uncontrolled ceiling below 1 500 ft is **CAUTION**, not a legal NO-GO, except for the app circuit floor below.

Special VFR (CAR 91.06.22) is never treated as a substitute for ordinary VFR minima and is never issued as a clearance by the app.

## Destination and alternate planning — LAW

CAR 91.07.7(7), same 33rd Amendment: when planning a flight, a destination or alternate may be selected only if the appropriate weather reports or forecasts, or a combination of them, are at or above the applicable planning minima from one hour before to one hour after the estimated time of arrival.

**Land** mode therefore judges the ETA ±1 hour window. **Depart** mode judges now, or a future ETD if one is supplied.

CAR 91.07.25: before commencing an approach to land, the person in command must still be satisfied from the information then available that weather and the intended runway or touch-down area allow a safe approach, landing or missed approach. A planning badge does not finish that check.

## Night — LAW plus APP POLICY

CAR Part 1: night is the period from 15 minutes after sunset to 15 minutes before sunrise.

CAR 91.07.3(2): except in an emergency, no take-off or landing by night unless the place has night flying facilities. The engine cannot verify lighting data, so it does not invent a “night facilities are fine” go.

**APP POLICY:** if it is night and night is not selected, the verdict is NO-GO. If night starts within 60 minutes and night is not selected, the verdict is CAUTION. A night rating itself lives in Part 61; the checkbox is only a proxy.

## Source priority — APP POLICY, built on AIP and ICAO practice

For a clock time T (now for Depart; arrive time for Land):

1. A METAR or SPECI no more than **90 minutes** old. A newer SPECI beats an older METAR. From **61 to 90 minutes** the report is still used, with a CAUTION that it is getting stale. After 90 minutes it is not used as “now”.
2. A METAR TREND (TEMPO, BECMG or NOSIG), valid **2 hours** from the report. SA AIP GEN 3.5 4.2.4: during those two hours the TREND **supersedes the TAF** for the same aerodrome. Visibility, ceiling and weather in the TREND are all graded.
3. The TAF that is valid at T (only one TAF is valid at a time).
4. The weather model, unchanged in how it is fetched and what it contains.
5. Otherwise **INCOMPLETE**.

Never average two sources. Label every number with its source.

A METAR older than 90 minutes, NIL, or absent falls through. A model older than 180 minutes is not used.

## Model-only values — APP POLICY

When the only usable source is the model:

- Always show: “Model estimate only — not an official weather report.”
- That line is a note. It does **not** by itself turn a GO into a CAUTION, so a clearly good model picture may be GO, with the disclaimer.
- **NO-GO** is allowed only when a numeric value is clearly beyond the applicable limit:
  - visibility at least **1.0 km** below the limit
  - ceiling at least **300 ft** below the limit
  - crosswind, gust or mean wind at least **5 kt** above the limit
  - tailwind at least **3 kt** above the 10 kt tailwind NO-GO threshold
- Values at or beyond the limit, but not by those margins, are **CAUTION** (borderline).
- Values within 20% the good side of a personal or legal limit are also CAUTION, as with official reports.
- Night, missing data and heliport handling are not “model weather” and keep their own rules.
- The model is not used to invent thunderstorms or cumulonimbus.

A model 91–180 minutes old may still be used, with an extra CAUTION that it is older. After 180 minutes it is dropped.

## Other APP POLICY (from the 30 October overlay, kept)

Worst finding wins: NO-GO, then CAUTION, then GO.

- Ceiling below **1 000 ft** is NO-GO everywhere (no VFR circuit clear of cloud). This is not a legal ceiling in class F/G.
- Personal ceiling or visibility higher than the legal floor: below the user’s number is NO-GO; within 20% above it is CAUTION.
- BKN///, OVC/// or VV/// (height not reported) is NO-GO.
- Present weather, WMO 4678 tokens only (so a station id such as FAGR is not read as hail):
  - NO-GO: TS (including VCTS, TSRA), CB/TCU, FZRA/FZDZ, SQ, FC, GR
  - CAUTION: recent (RE) hazards, +RA/+SN, GS, FZFG
- Variable wind 0–6 kt with no gust: GO with a note. Variable wind with gusts is never a plain GO (full crosswind assumed).
- Gust minus mean above **15 kt**: CAUTION.
- Crosswind on the best runway: up to 80% of the limit GO, 80–100% CAUTION, above the limit NO-GO. Limit = lower of aircraft and user. No aircraft selected: default **12 kt**.
- Tailwind: 0–5 kt GO, 6–10 kt CAUTION, above 10 kt NO-GO.
- Density altitude more than field elevation + **2 500 ft**: CAUTION only. Density altitude never makes a NO-GO by itself.
- TAF groups: TS/CB/FZRA-type weather in TEMPO, BECMG or FM is NO-GO. BECMG/FM (or a lasting BASE in a Land window) below minima is NO-GO. TEMPO below minima is CAUTION. PROB30/PROB40 is capped at CAUTION.
- Missing visibility in a METAR, with no model fill-in, is NO-GO. A model fill-in is CAUTION and labelled.
- Missing wind (`/////KT`) is never treated as calm: CAUTION.
- Variation group `dddVddd`: the runway is chosen on the mean wind, then the worst crosswind and tailwind in the range are used.
- CAVOK: visibility 10 km, no ceiling. `9999`: visibility 10 km.
- AUTO is still an official report.
- Heliports receive no go / caution / no-go verdict.
- METAR NIL, or no usable source, is INCOMPLETE (NIL is labelled).

An optional IFR path exists. Its 200 ft / 550 m floor is a generic CAT I reference, **not** the published plate for that aerodrome, and is tagged as app policy.

## Depart and Land

The switch changes the logic, not only the words.

- **Depart now** (or ETD within about 30 minutes): use the observation ladder at now. A poor METAR now wins even if the TAF later improves.
- **Depart with a later ETD**: use the TAF (then the model) at that ETD. A current METAR is not treated as a description of weather hours from now.
- **Land with arrive time within about 30 minutes of now**: same ladder as Depart now.
- **Land with a later ETA**: use the TAF across ETA −1 h to ETA +1 h (CAR 91.07.7(7)). A poor METAR now does not override a later TAF. If a live TREND still covers part of that window, the TREND supersedes the TAF for its two hours.

## Changing a rule

The numbers live in the `RULES` table inside `site/engine/ga-core-v2.js`. They are sealed by `RULES_VERSION` and a SHA-256 checksum (`RULES_LOCK` and `tests/engine-v2/rules-lock.json`).

If any value in `RULES` changes, bump `RULES_VERSION` and replace both checksums. The lock test fails if the table changes without that version bump.
