# Engine v2 decisions

Written 9 November 2026, Africa/Johannesburg. Research against official and published sources, then a verdict and the choice that went into rule pack 2.0.0.

No outside chat assistants were used for the verdicts. Sources are named below.

## Decision 1 — Should Land judge ETA ±1 hour?

**Question.** Today the Depart / Land switch only changes words on screen. Should Land become a real check across ETA minus one hour to ETA plus one hour?

**South African law.** CAR 91.07.7(7), as substituted by the Thirty-Third Amendment (GG 55226, 21 August 2026): when planning a flight, a person in command shall only select an aerodrome as a destination or alternate if the appropriate weather reports or forecasts, or a combination of them, are at or above the applicable planning minima for a period of one hour before to one hour after the estimated time of arrival. Official file: https://caasanwebsitestorage.blob.core.windows.net/legal-documents/Promulgated%2033RD%20Amendment%20Regulation%202026%20(Final).pdf. Government notice: https://www.gov.za/documents/notices/civil-aviation-act-thirty-third-amendment-civil-aviation-regulations-2026-english. A secondary unofficial consolidation of the same wording is on Acts Online (not the Gazette itself).

**United States published practice (not South African law).** The FAA Aeronautical Information Manual, Chapter 7, destination forecast, includes significant changes within one hour before and after the planned arrival. FAA Advisory Circular 91-92 says the same when reviewing a destination forecast. 14 CFR 91.169 uses a one-hour-before to one-hour-after window for certain IFR alternate exemptions. These show the same planning window in widespread published practice; they do not rewrite CAR 91.07.7.

**Verdict.** Yes. Land must judge the ETA window, not only rename GO as LAND.

**Choice.** Land with an arrive time more than about 30 minutes away uses the TAF (or TREND, or model) across ETA ±1 h, and takes the worst expected lasting condition. Land with arrive time within about 30 minutes of now uses the same “now” ladder as Depart. Depart judges now, or a supplied ETD. A poor METAR now still wins for Depart now, even if the TAF later improves. A later Land may follow the TAF alone.

## Decision 2 — Source priority and how stale a METAR may be

**Question.** In what order should METAR, TREND, TAF and the model be trusted, and when does a METAR become too old?

**South African AIP.** SA AIP GEN 3.5 4.2.4 (compilation 15 October 2026, and the ATNS eAIP HTML for GEN 3.5): a TREND is used by aircraft within about one hour’s flying time; it is valid for two hours, during which it supersedes the TAF issued for the same aerodrome. TAFs are valid up to 30 hours, issued on a six-hour cycle; only one TAF is valid at a time. METAR and SPECI are the products meant for flight planning outside the aerodrome of origin.

**ICAO / WMO.** Annex 3 treats a TREND as the landing forecast, valid two hours from the report, for local users and aircraft within about one hour’s flying time. WMO aerodrome-report guidance: METAR is issued hourly or half-hourly; SPECI is issued when set criteria are met. Public copies of Annex 3 (21st edition, Amendment 82) were used for this wording; the ICAO store original was not purchased, so that citation is flagged as a public excerpt rather than a paid official print.

**United States published practice.** FAA Advisory Circular 00-45H describes METAR as the routine aerodrome observation and SPECI as the special observation. Users are told to read the time of the report and use the latest applicable observation. There is no FAA regulation that says “a METAR older than 90 minutes is illegal.” Standard briefing practice treats an hourly observation as current for about an hour, with SPECI covering sudden change.

**Verdict.** Trust a fresh official observation first, then its TREND, then the TAF, then the model. Do not invent a legal age cut-off that the CAR does not state. Do mark a report that has likely missed a routine issue.

**Choice.**

- 0–60 minutes: current official weather
- 61–90 minutes: still used, plus CAUTION that the report is getting stale (a half-hourly field has missed more than one issue; an hourly field has missed one)
- After 90 minutes: do not use the METAR as “now”; fall through to TREND (if still in its two hours), then TAF, then model
- Model: usable up to 180 minutes, marked older after 90 minutes

This replaces the three overlapping age rules that used to live in the 28 October core (90-minute stale), the 30 October overlay (caution at 75, no-go at 180) and the 6 November bridge (drop after 90).

## Decision 3 — One new engine, or keep the two stacked engines?

**Question.** There is a locked 28 October core and a 30 October overlay. Should they stay stacked, or should one new file take over the rules?

**What the code does today.** `wm-core.js` evaluates first. `wst-engine.js` then overwrites the verdict when an observation exists. They disagree on stale METARs, missing visibility, gust crosswind, tailwind, density altitude, TAF thunderstorms and TREND handling. The overlay already wins in practice. The locked file cannot be edited.

**Published practice.** A single written rule set, versioned and tested, is ordinary safety-system practice. Two silent copies of the same decision are a known source of error. There is no aviation regulation that requires two engines; the need is honesty and one answer.

**Verdict.** Build one new kernel from the newer (30 October) overlay, and leave the locked file untouched.

**Choice.** New file `site/engine/ga-core-v2.js` on branch `engine/core-v2-9nov`. The old files are not edited and are not wired out of the live page in this change. Nothing is merged or deployed until there is an explicit yes.

## Decision 4 — What may a model-only picture show?

**Question.** If there is no METAR and no covering TAF, may the model show GO, CAUTION and NO-GO?

**Published practice.** A numerical weather model is not an official aerodrome observation or landing forecast. ICAO Annex 3 notes that a reported or forecast value is already the best approximation, because weather varies in space and time; a model is a further step away from that official product. Visibility and cloud base from a global model are less certain than wind.

**Verdict.** The model may be taken seriously, but it must never look like an official report. GO is allowed when the picture is clearly good, with a disclaimer. CAUTION is the right answer when the value sits near a limit. NO-GO is allowed only when the value is clearly beyond the limit, so ordinary model error is less likely to have invented the breach.

**Choice.** Locked margins: visibility 1.0 km below the limit; ceiling 300 ft below the limit; wind or gust 5 kt above the limit; tailwind 3 kt above the 10 kt threshold. Always show: “Model estimate only — not an official weather report.” That sentence is a note and does not, by itself, downgrade a GO. Borderline values are CAUTION. The model is not used to invent thunderstorms.

## What could not be fully verified

- The full official ICAO Annex 3 volume from the ICAO store was not purchased. Wording on TREND validity and METAR cadence comes from publicly circulated excerpts of the 21st edition / Amendment 82 and from WMO aerodrome-report handbooks.
- Document SA-CATS 91 detailed planning-minima figures were not found as a current standalone manual in the local official set. No CATS numbers were invented.
- Night flying facilities at each aerodrome (CAR 91.07.3(2)) are not in the engine data, so that law is not computed.
- AIP ENR 1.2 in the 15 October 2026 compilation is still dated 15 January 2024 and reprints pre-amendment 91.06.21 wording (including “and” instead of “either … or” for the ground-visibility and ceiling ban, and the old 600 m / 500 ft from cloud). The engine follows the current CAR, not that stale ENR page.
- No later amendment after the 36th (also 21 August 2026) was found that touches 91.06.21 or 91.07.7. If one appears, the rule pack must be reviewed.
