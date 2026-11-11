# Rule pack 2.1.0 — policy text changes (replace the matching lines in POLICY.md / REVIEW.md)

Rule pack 2.1.0, 10 Nov 2026. Checksum ef71783ed09f41c0f932426a090aefa88e34132c8a754980bfd5bb32dd654d5b
(engine RULES_LOCK and tests/engine-v2/rules-lock.json both updated). Every number below is APP POLICY and needs MT's yes before merge.

## RULES table changes
- removed: wsCautionKt (20)
- added: gustSigSpreadKt 10, gustXwNearFrac 0.9, gustLimitNearFrac 0.8, modelGustSlackKt 5
- unchanged: vrbGoKt 6, gustSpreadKt 15, xwGoFrac 0.8, tailwind 5/10, daAboveFt 2500, nearBand 0.2, model margins

## Replaces "Variable wind 0–6 kt with no gust ..." and "Gust minus mean above 15 kt: CAUTION"
- Direction unknown (VRB, direction missing, or the field has no runway headings): worst case is that the larger of mean wind and gust is all crosswind. That peak is compared with the crosswind limit (lower of aircraft and user).
  - peak <= max(6 kt, 80% of limit): GO with a note (POL-VRB-LIGHT). So VRB05G11KT is GO at a 15 kt limit.
  - 80%..100% of limit: CAUTION. Above the limit: NO DEPART / NO LAND (model: only if 5 kt above, else CAUTION).
  Reason: a variable wind of 10 kt can never put more than 10 kt across a runway; a flat "any gust = CAUTION" ignored the user's limit.
- Directional wind: mean crosswind above 80% of the limit = CAUTION. Gust crosswind above 80% needs a significant gust (spread >= 10 kt, the usual METAR gust-group criterion); gust crosswind above 90% of the limit counts whatever the spread; gust crosswind above the limit is NO DEPART / NO LAND. 8G12 on a crossing wind stays GO; 10G16 at 65 degrees to the runway is CAUTION because the gust crosswind is at the limit.
- Strong mean wind: CAUTION from 80% of the user's gust limit (was fixed 20 kt; identical at the default 25 kt). Above the user's gust limit: NO DEPART / NO LAND, unchanged. Peak gust above the user's gust limit: NO DEPART / NO LAND, unchanged.
- Gust spread above 15 kt: CAUTION (model: above 20 kt, because the Open-Meteo gust is an hourly diagnostic and reads high against 10-minute METAR gusts).
- One wind counts once: strong-wind and spread CAUTIONs become notes when a crosswind, variable-wind or tailwind finding already flags the wind.
- No runway headings: worst-case rule above, not a blanket CAUTION for any wind above 0 kt.

## Replaces "A model fill-in is CAUTION and labelled"
- Missing METAR visibility with a model value at least 20% above the user's visibility limit: labelled note, no CAUTION. Closer than that: CAUTION. No model value: NO DEPART / NO LAND (unchanged).

## Model rows with no values
- A model row where every weather value is null is treated as no model (INCOMPLETE if nothing else), not as a model with missing fields.

## Reviewed, not changed (documented)
- Tailwind 5 / 10 kt: app policy, not from any POH. Aircraft table has no tailwind limits.
- Density altitude field + 2 500 ft = CAUTION only: the aircraft table has no performance data, so it cannot be tied to the aircraft yet.
- Near band 20% of the user's ceiling / visibility: already the user's own limit.
- Model low cloud >= 75% with no ceiling = CAUTION: only fires when the model has no cloud base, i.e. a data hole.
- Freezing level: not used. Needs a decision (there is no cruise altitude or icing rule in Part 91 VFR to attach it to).
- Official always wins over the model while the official report is usable (tested).
- REVIEW.md still says "OK 69 rule cases"; the suite has said 75 since 2.0.0 and now says 132.
