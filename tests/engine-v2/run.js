#!/usr/bin/env node
/* Go Around core engine v2 tests — one case per locked rule, plus the checksum lock. */
'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const engine = require('../../site/engine/ga-core-v2.js');

const NOW = Date.UTC(2026, 10, 9, 10, 0, 0);
const FACT = {
  icao: 'FACT', lat: -33.9648, lon: 18.6017, elevFt: 151,
  category: 'controlled', iap: true,
  runways: [{ id: '01', trueHdg: 10 }, { id: '19', trueHdg: 190 }]
};
const PROF = { ceilFt: 1500, visKm: 5, xwKt: 15, gustKt: 25, night: true };

function metar(raw, ageMin) {
  return { raw: raw, time: NOW - (ageMin == null ? 10 : ageMin) * 6e4 };
}
function model(extra, ageMin) {
  return Object.assign({ visKm: 10, ceilFt: 3000, time: NOW - (ageMin == null ? 10 : ageMin) * 6e4 }, extra);
}
function ev(extra) {
  return engine.evaluate(Object.assign({
    field: FACT, profile: PROF, aircraftId: 'C172',
    now: NOW, phase: 'depart', rules: 'vfr'
  }, extra));
}
function hasRule(r, id) {
  return (r.findings || []).some(function (f) { return f.ruleId === id; });
}
function finding(r, id) {
  return (r.findings || []).filter(function (f) { return f.ruleId === id; })[0];
}

const fail = [];
function check(id, ok, detail) {
  if (!ok) fail.push(id + ': ' + detail);
}

/* ---------- lock tests ---------- */
const canon = engine.rulesCanonical();
const hash = crypto.createHash('sha256').update(canon).digest('hex');
const lockFile = JSON.parse(fs.readFileSync(path.join(__dirname, 'rules-lock.json'), 'utf8'));
check('POL-LOCK', engine.RULES_VERSION === engine.RULES_LOCK.version, 'engine version and lock version disagree');
check('POL-LOCK', hash === engine.RULES_LOCK.checksum, 'RULES table hash ' + hash + ' does not match RULES_LOCK.checksum. If you changed a rule, bump RULES_VERSION and update both checksums.');
check('POL-LOCK', engine.RULES_VERSION === lockFile.version && hash === lockFile.checksum, 'tests/engine-v2/rules-lock.json does not match the engine lock pair');
check('POL-LOCK', engine.RULES_LOCK.version === lockFile.version, 'lock file version does not match RULES_LOCK.version — a rules change needs a version bump');
check('POL-LOCK', engine.RULES.policy.gustLimitMaxKt === 35, 'gustLimitMaxKt must be 35');

/* ---------- night definition (CAR Part 1) ---------- */
const si = engine.sunInfo(FACT.lat, FACT.lon, NOW);
check('LAW-PART1-NIGHT', !!si && si.isNight === false, 'midday at Cape Town should be day');
check('LAW-PART1-NIGHT', Math.abs((si.nightFrom - si.set) / 6e4 - 15) < 0.05, 'night must start 15 min after sunset');
check('LAW-PART1-NIGHT', engine.sunInfo(FACT.lat, FACT.lon, si.nightFrom - 1000).isNight === false, 'just before sunset+15 should be day');
check('LAW-PART1-NIGHT', engine.sunInfo(FACT.lat, FACT.lon, si.nightFrom + 1000).isNight === true, 'just after sunset+15 should be night');
check('LAW-PART1-NIGHT', engine.RULES.law.nightOffsetMin === 15, 'locked night offset must be 15 min');

/* ---------- rule cases ---------- */
const cases = [
  { id: 'LAW-91.06.21-CTR-VIS', input: { weather: { metar: metar('FACT 091000Z 24008KT 4000 BR SCT020 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'LAW-91.06.21-CTR-VIS', shelf: 'law' } },
  { id: 'LAW-91.06.21-CTR-CEIL', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 BKN014 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'LAW-91.06.21-CTR-CEIL', shelf: 'law' } },
  { id: 'LAW-91.06.21-CTR-OR', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 BKN012 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'LAW-91.06.21-CTR-CEIL' } },
  {
    id: 'LAW-91.06.21-UNC-VIS',
    input: { field: Object.assign({}, FACT, { category: 'uncontrolled' }), weather: { metar: metar('FAAB 091000Z 24008KT 4000 BR SCT020 22/10 Q1020') } },
    expect: { status: 'nogo', ruleId: 'LAW-91.06.21-UNC-VIS', shelf: 'law' }
  },
  {
    id: 'LAW-91.06.21-HIGH-VIS',
    input: { field: Object.assign({}, FACT, { elevFt: 11000 }), weather: { metar: metar('FACT 091000Z 24008KT 6000 SCT030 22/10 Q1020') } },
    expect: { status: 'nogo', ruleId: 'LAW-91.06.21-HIGH-VIS', shelf: 'law' }
  },
  {
    id: 'LAW-91.07.7-LAND-WINDOW',
    input: { phase: 'land', eta: NOW + 5 * 3600e3, weather: { taf: { raw: 'TAF FACT 090400Z 0906/1012 24008KT 4000 BR BKN012' } } },
    expect: { status: 'nogo', ruleId: 'LAW-91.07.7-LAND-WINDOW' }
  },
  {
    id: 'LAW-91.07.7-DEPART-NOW',
    input: {
      phase: 'depart',
      weather: {
        metar: metar('FACT 091000Z 24008KT 4000 BR SCT012 22/10 Q1020'),
        taf: { raw: 'TAF FACT 090400Z 0906/1012 24008KT 9999 CAVOK' }
      }
    },
    expect: { status: 'nogo', ruleId: 'LAW-91.06.21-CTR-VIS' }
  },
  {
    id: 'POL-FLOOR-1000',
    input: { field: Object.assign({}, FACT, { category: 'uncontrolled' }), weather: { metar: metar('FAAB 091000Z 24008KT 9999 BKN008 22/10 Q1020') } },
    expect: { status: 'nogo', ruleId: 'POL-FLOOR-1000' }
  },
  {
    id: 'POL-UNC-CEIL-1500',
    input: { field: Object.assign({}, FACT, { category: 'uncontrolled' }), weather: { metar: metar('FAAB 091000Z 24008KT 9999 BKN012 22/10 Q1020') } },
    expect: { status: 'caution', ruleId: 'POL-UNC-CEIL-1500' }
  },
  {
    id: 'POL-UNKNOWN-CTL',
    input: { field: Object.assign({}, FACT, { category: undefined }), weather: { metar: metar('FACT 091000Z 24008KT 9999 BKN012 22/10 Q1020') } },
    expect: { status: 'nogo', ruleId: 'LAW-91.06.21-CTR-CEIL' }
  },
  {
    id: 'POL-PERSONAL-CEIL',
    input: { profile: Object.assign({}, PROF, { ceilFt: 2500 }), weather: { metar: metar('FACT 091000Z 24008KT 9999 BKN018 22/10 Q1020') } },
    expect: { status: 'nogo', ruleId: 'POL-PERSONAL-CEIL', shelf: 'limit' }
  },
  {
    id: 'POL-PERSONAL-VIS',
    input: { profile: Object.assign({}, PROF, { visKm: 8 }), weather: { metar: metar('FACT 091000Z 24008KT 6000 SCT030 22/10 Q1020') } },
    expect: { status: 'nogo', ruleId: 'POL-PERSONAL-VIS', shelf: 'limit' }
  },
  {
    id: 'POL-NEAR-20',
    input: { profile: Object.assign({}, PROF, { visKm: 8 }), weather: { metar: metar('FACT 091000Z 24008KT 9000 SCT030 22/10 Q1020') } },
    expect: { status: 'caution', ruleId: 'POL-NEAR-20' }
  },
  { id: 'POL-CNR', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 BKN/// 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'POL-CNR' } },
  { id: 'POL-WX-NOGO', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 TS SCT030CB 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'POL-WX-NOGO' } },
  { id: 'POL-WX-CAUT', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 FZFG SCT005 22/10 Q1020') } }, expect: { status: 'caution', ruleId: 'POL-WX-CAUT' } },
  {
    id: 'POL-WX-FAGR',
    input: { field: Object.assign({}, FACT, { icao: 'FAGR' }), weather: { metar: metar('FAGR 091000Z 24008KT 9999 CAVOK 22/10 Q1020') } },
    expect: { status: 'go', notRuleId: 'POL-WX-NOGO' }
  },
  { id: 'POL-VRB-LIGHT', input: { weather: { metar: metar('FACT 091000Z VRB05KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'go', ruleId: 'POL-VRB-LIGHT' } },
  { id: 'POL-VRB-GUST', input: { weather: { metar: metar('FACT 091000Z VRB05G20KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'POL-VRB-GUST' } },
  {
    id: 'POL-GUST-SPREAD',
    input: { profile: Object.assign({}, PROF, { gustKt: 40 }), weather: { metar: metar('FACT 091000Z 01010G30KT 9999 CAVOK 22/10 Q1020') } },
    expect: { status: 'caution', ruleId: 'POL-GUST-SPREAD' }
  },
  { id: 'POL-XW-BANDS', input: { weather: { metar: metar('FACT 091000Z 10016KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'POL-XW-BANDS', shelf: 'aircraft' } },
  { id: 'POL-XW-DEFAULT', input: { aircraftId: null, weather: { metar: metar('FACT 091000Z 10013KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'POL-XW-DEFAULT' } },
  {
    id: 'POL-TW-BANDS',
    input: { field: Object.assign({}, FACT, { runways: [{ id: '01', trueHdg: 10 }] }), weather: { metar: metar('FACT 091000Z 19012KT 9999 CAVOK 22/10 Q1020') } },
    expect: { status: 'nogo', ruleId: 'POL-TW-BANDS' }
  },
  {
    id: 'POL-DA',
    input: { field: Object.assign({}, FACT, { elevFt: 5000 }), weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 30/05 Q1013') } },
    expect: { status: 'caution', ruleId: 'POL-DA' }
  },
  {
    id: 'POL-DA-NO-NOGO',
    input: { field: Object.assign({}, FACT, { elevFt: 5000 }), weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 30/05 Q1013') } },
    expect: { status: 'caution', ruleId: 'POL-DA', notStatus: 'nogo' }
  },
  {
    id: 'POL-TAF-TS',
    input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020'), taf: { raw: 'TAF FACT 090400Z 0906/1012 24008KT 9999 CAVOK BECMG 0910/0912 TSRA SCT030CB' } } },
    expect: { status: 'nogo', ruleId: 'POL-TAF-TS' }
  },
  {
    id: 'POL-TEMPO-TS-NOGO',
    input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020'), taf: { raw: 'TAF FACT 090400Z 0906/1012 24008KT 9999 CAVOK TEMPO 0910/0912 TSRA SCT030CB' } } },
    expect: { status: 'nogo', ruleId: 'POL-TEMPO-TS-NOGO' }
  },
  {
    id: 'POL-TAF-PERM-BELOW',
    input: { phase: 'land', eta: NOW + 5 * 3600e3, weather: { taf: { raw: 'TAF FACT 090400Z 0906/1012 24008KT 9999 SCT030 BECMG 0914/0916 4000 BR BKN008' } } },
    expect: { status: 'nogo', ruleId: 'POL-TAF-PERM-BELOW' }
  },
  {
    id: 'POL-TAF-TEMPO-BELOW',
    input: { phase: 'land', eta: NOW + 5 * 3600e3, weather: { taf: { raw: 'TAF FACT 090400Z 0906/1012 24008KT 9999 SCT030 TEMPO 0914/0916 4000 BR BKN012' } } },
    expect: { status: 'caution', ruleId: 'POL-TAF-TEMPO-BELOW' }
  },
  {
    id: 'POL-TAF-PROB',
    input: { phase: 'land', eta: NOW + 5 * 3600e3, weather: { taf: { raw: 'TAF FACT 090400Z 0906/1012 24008KT 9999 SCT030 PROB30 0914/0916 TS' } } },
    expect: { status: 'caution', ruleId: 'POL-TAF-PROB' }
  },
  {
    id: 'POL-NIGHT-UNSELECTED',
    input: function () {
      return {
        now: si.nightFrom + 60000,
        profile: Object.assign({}, PROF, { night: false }),
        weather: { metar: { raw: 'FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020', time: si.nightFrom + 60000 - 10 * 6e4 } }
      };
    },
    expect: { status: 'nogo', ruleId: 'POL-NIGHT-UNSELECTED' }
  },
  {
    id: 'POL-NIGHT-SOON',
    input: function () {
      return {
        now: si.nightFrom - 50 * 6e4,
        profile: Object.assign({}, PROF, { night: false }),
        weather: { metar: { raw: 'FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020', time: si.nightFrom - 50 * 6e4 - 10 * 6e4 } }
      };
    },
    expect: { status: 'caution', ruleId: 'POL-NIGHT-SOON' }
  },
  { id: 'POL-METAR-STALE-60', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020 NOSIG', 70) } }, expect: { status: 'caution', ruleId: 'POL-METAR-STALE-60' } },
  { id: 'POL-METAR-DROP-90', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020', 100) } }, expect: { status: 'incomplete', ruleId: 'POL-NODATA' } },
  { id: 'POL-MISS-VIS', input: { weather: { metar: metar('FACT 091000Z 24008KT SCT020 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'POL-MISS-VIS' } },
  { id: 'POL-TREND-TS', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 SCT020 22/10 Q1020 TEMPO TSRA') } }, expect: { status: 'nogo', ruleId: 'POL-TREND-TS' } },
  { id: 'POL-TREND-WX', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 SCT020 22/10 Q1020 TEMPO FZFG') } }, expect: { status: 'caution', ruleId: 'POL-TREND-WX' } },
  { id: 'POL-TREND-VISCEIL', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 SCT020 22/10 Q1020 TEMPO 3000 BKN008') } }, expect: { status: 'nogo', ruleId: 'POL-TREND-VISCEIL' } },
  {
    id: 'POL-TREND-SUPERSEDE',
    input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020 NOSIG'), taf: { raw: 'TAF FACT 090400Z 0906/1012 24008KT 9999 CAVOK TEMPO 0910/0912 TSRA SCT030CB' } } },
    expect: { status: 'go', notRuleId: 'POL-TAF-TS' }
  },
  { id: 'POL-NOSIG', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020 NOSIG') } }, expect: { status: 'go', ruleId: 'POL-NOSIG' } },
  { id: 'POL-MODEL-DISCLAIMER', input: { weather: { model: { visKm: 10, ceilFt: 3000, wd: 240, ws: 8, time: NOW - 10 * 6e4 } } }, expect: { status: 'go', ruleId: 'POL-MODEL-DISCLAIMER' } },
  { id: 'POL-MODEL-GO', input: { weather: { model: { visKm: 10, ceilFt: 3000, wd: 240, ws: 8, time: NOW - 10 * 6e4 } } }, expect: { status: 'go', ruleId: 'POL-MODEL-DISCLAIMER' } },
  { id: 'POL-MODEL-NOGO-CLEAR', input: { weather: { model: { visKm: 3, ceilFt: 3000, wd: 240, ws: 8, time: NOW - 10 * 6e4 } } }, expect: { status: 'nogo', ruleId: 'POL-MODEL-NOGO-CLEAR' } },
  { id: 'POL-MODEL-BORDERLINE', input: { weather: { model: { visKm: 4.5, ceilFt: 3000, wd: 240, ws: 8, time: NOW - 10 * 6e4 } } }, expect: { status: 'caution', ruleId: 'POL-MODEL-BORDERLINE' } },
  { id: 'POL-MODEL-OLDER', input: { weather: { model: { visKm: 10, ceilFt: 3000, wd: 240, ws: 8, time: NOW - 120 * 6e4 } } }, expect: { status: 'caution', ruleId: 'POL-MODEL-OLDER' } },
  { id: 'POL-MODEL-TOO-OLD', input: { weather: { model: { visKm: 10, ceilFt: 3000, wd: 240, ws: 8, time: NOW - 200 * 6e4 } } }, expect: { status: 'incomplete', ruleId: 'POL-MODEL-TOO-OLD' } },
  { id: 'POL-WIND-MISSING', input: { weather: { metar: metar('FACT 091000Z /////KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'caution', ruleId: 'POL-WIND-MISSING' } },
  { id: 'POL-VAR-GROUP', input: { weather: { metar: metar('FACT 091000Z 24015KT 220V300 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'caution', ruleId: 'POL-VAR-GROUP' } },
  { id: 'POL-WS-STRONG', input: { weather: { metar: metar('FACT 091000Z 01022KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'caution', ruleId: 'POL-WS-STRONG' } },
  { id: 'POL-HELI', input: { field: Object.assign({}, FACT, { heliport: true }) }, expect: { status: 'none' } },
  { id: 'POL-NIL', input: { weather: { metar: metar('FACT 091000Z NIL') } }, expect: { status: 'incomplete', ruleId: 'POL-NIL' } },
  { id: 'POL-NODATA', input: { weather: {} }, expect: { status: 'incomplete', ruleId: 'POL-NODATA' } },
  {
    id: 'POL-FALLBACK-STALE-METAR-TAF',
    input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020', 100), taf: { raw: 'TAF FACT 090400Z 0906/1012 24008KT 9999 CAVOK' } } },
    expect: { status: 'go', sourceKind: 'taf' }
  },
  {
    id: 'POL-FALLBACK-STALE-METAR-MODEL',
    input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020', 100), model: { visKm: 10, ceilFt: 3000, wd: 240, ws: 8, time: NOW - 10 * 6e4 } } },
    expect: { status: 'go', sourceKind: 'model', ruleId: 'POL-MODEL-DISCLAIMER' }
  },
  {
    id: 'POL-FALLBACK-NIL-TAF',
    input: { weather: { metar: metar('FACT 091000Z NIL'), taf: { raw: 'TAF FACT 090400Z 0906/1012 24008KT 9999 CAVOK' } } },
    expect: { status: 'go', sourceKind: 'taf', ruleId: 'POL-NIL' }
  },
  {
    id: 'POL-FALLBACK-NIL-MODEL',
    input: { weather: { metar: metar('FACT 091000Z NIL'), model: { visKm: 10, ceilFt: 3000, wd: 240, ws: 8, time: NOW - 10 * 6e4 } } },
    expect: { status: 'go', sourceKind: 'model', ruleId: 'POL-MODEL-DISCLAIMER' }
  },
  { id: 'POL-FALLBACK-TAF-ONLY', input: { weather: { taf: { raw: 'TAF FACT 090400Z 0906/1012 24008KT 9999 CAVOK' } } }, expect: { status: 'go', sourceKind: 'taf' } },
  {
    id: 'POL-FALLBACK-UI-MODEL-SHAPE',
    input: {
      weather: {
        model: {
          current: {
            time: '2026-11-09T09:50', visibility: 10000, cloud_cover_low: 10, cloud_base: null,
            wind_speed_10m: 8, wind_direction_10m: 240, wind_gusts_10m: 12, temperature_2m: 22, pressure_msl: 1020
          }
        }
      }
    },
    expect: { status: 'go', sourceKind: 'model', ruleId: 'POL-MODEL-DISCLAIMER' }
  },
  { id: 'POL-CAVOK', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020 NOSIG') } }, expect: { status: 'go', vis: 10, ceil: null } },
  {
    id: 'POL-SPECI-WINS',
    input: { weather: { metar: metar('FACT 091000Z 24008KT 4000 BR SCT020 22/10 Q1020', 40), speci: { raw: 'SPECI FACT 091050Z 24008KT 9999 CAVOK 22/10 Q1020', time: NOW - 10 * 6e4 } } },
    expect: { status: 'go', sourceKind: 'speci' }
  },
  { id: 'POL-WORST-WINS', input: { weather: { metar: metar('FACT 091000Z 24008KT 4000 TS SCT030CB 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'POL-WX-NOGO', alsoRuleId: 'LAW-91.06.21-CTR-VIS' } },
  { id: 'POL-SHELVES', input: { weather: { metar: metar('FACT 091000Z 24008KT 4000 BR SCT020 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'LAW-91.06.21-CTR-VIS', shelf: 'law' } },
  { id: 'POL-SOURCE-LABEL', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020 NOSIG') } }, expect: { status: 'go', sourceKind: 'metar' } },
  {
    id: 'POL-LAND-FOLLOWS-TAF',
    input: { phase: 'land', eta: NOW + 5 * 3600e3, weather: { metar: metar('FACT 091000Z 24008KT 4000 BR SCT012 22/10 Q1020'), taf: { raw: 'TAF FACT 090400Z 0906/1012 24008KT 9999 CAVOK' } } },
    expect: { status: 'go', sourceKind: 'taf' }
  },
  {
    id: 'POL-DEPART-METAR-WINS',
    input: { phase: 'depart', weather: { metar: metar('FACT 091000Z 24008KT 4000 BR SCT012 22/10 Q1020'), taf: { raw: 'TAF FACT 090400Z 0906/1012 24008KT 9999 CAVOK' } } },
    expect: { status: 'nogo', sourceKind: 'metar', ruleId: 'LAW-91.06.21-CTR-VIS' }
  },
  {
    id: 'POL-ARRIVE-NEAR-NOW',
    input: { phase: 'land', eta: NOW + 10 * 6e4, weather: { metar: metar('FACT 091000Z 24008KT 4000 BR SCT020 22/10 Q1020') } },
    expect: { status: 'nogo', sourceKind: 'metar', ruleId: 'LAW-91.06.21-CTR-VIS' }
  },
  { id: 'POL-AUTO', input: { weather: { metar: metar('FACT 091000Z AUTO 24008KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'go', ruleId: 'POL-AUTO' } },
  { id: 'POL-9999', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 NSC 22/10 Q1020') } }, expect: { status: 'go', vis: 10 } },
  /* 2.2.0: a fill-in clearly above the user's visibility limit is a plain GO, explained in why, not a note. */
  {
    id: 'POL-FILL-HOLE',
    input: { weather: { metar: metar('FACT 091000Z 24008KT SCT020 22/10 Q1020'), model: { visKm: 8, ceilFt: 3000, wd: 240, ws: 8, time: NOW - 10 * 6e4 } } },
    expect: { status: 'go', notRuleId: 'POL-FILL-HOLE', why: 'METAR has no visibility, so it\'s taken from the model: 8 km' }
  },
  { id: 'POL-DISCLAIMER', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020 NOSIG') } }, expect: { status: 'go', ruleId: 'POL-DISCLAIMER' } },
  { id: 'POL-IFR-RATING', input: { rules: 'ifr', profile: Object.assign({}, PROF, { ir: false }), weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'POL-IFR-RATING' } },
  {
    id: 'POL-IFR-NO-IAP',
    input: { rules: 'ifr', profile: Object.assign({}, PROF, { ir: true }), field: Object.assign({}, FACT, { iap: false }), weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020') } },
    expect: { status: 'nogo', ruleId: 'POL-IFR-NO-IAP' }
  },
  {
    id: 'POL-IFR-CAT1',
    input: { rules: 'ifr', profile: Object.assign({}, PROF, { ir: true }), field: Object.assign({}, FACT, { iap: true }), weather: { metar: metar('FACT 091000Z 24008KT 0800 FG BKN001 22/10 Q1020') } },
    expect: { status: 'nogo', ruleId: 'POL-IFR-CAT1' }
  }
];

/* ---------- 2.1.0 cases: gusts, variable wind, model, freshness ---------- */
const LOWLIM = Object.assign({}, PROF, { xwKt: 8 });
const GUST40 = Object.assign({}, PROF, { gustKt: 40 });
const NORW = Object.assign({}, FACT, { runways: [] });
const NOGUSTFLAG = { notRuleId: 'POL-GUST-SPREAD', noWindFindings: true };
function w2(extra) { return Object.assign({}, extra); }

const cases210 = [
  /* calm */
  { id: 'W-CALM', input: { weather: { metar: metar('FACT 091000Z 00000KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'go', noWindFindings: true } },
  { id: 'W-CALM-MODEL-TINY-GUST', input: { weather: { model: model({ ws: 2, g: 5 }) } }, expect: { status: 'go', sourceKind: 'model', noWindFindings: true } },
  { id: 'W-CALM-MODEL-ZERO-GUST-5', input: { weather: { model: model({ ws: 0, g: 5 }) } }, expect: { status: 'go', sourceKind: 'model', noWindFindings: true } },

  /* light variable + small gust: not CAUTION on the gust alone */
  { id: 'W-VRB05G11', input: { weather: { metar: metar('FACT 091000Z VRB05G11KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'go', ruleId: 'POL-VRB-LIGHT', notRuleId: 'POL-VRB-GUST', noWindFindings: true } },
  { id: 'W-VRB06G12-SPREAD6', input: { weather: { metar: metar('FACT 091000Z VRB06G12KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'go', notRuleId: 'POL-VRB-GUST', noWindFindings: true } },
  { id: 'W-VRB05G13-NEAR-LIMIT', input: { weather: { metar: metar('FACT 091000Z VRB05G13KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'caution', ruleId: 'POL-VRB-GUST' } },
  { id: 'W-VRB05G20-ABOVE-LIMIT', input: { weather: { metar: metar('FACT 091000Z VRB05G20KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'POL-VRB-GUST' } },
  { id: 'W-VRB05G11-LOW-USER-LIMIT', input: { profile: LOWLIM, weather: { metar: metar('FACT 091000Z VRB05G11KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'POL-VRB-GUST' } },
  { id: 'W-VRB10-NO-GUST-STRONG-VRB', input: { weather: { metar: metar('FACT 091000Z VRB10KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'go', noWindFindings: true } },
  { id: 'W-VRB14-NEAR-LIMIT', input: { weather: { metar: metar('FACT 091000Z VRB14KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'caution', ruleId: 'POL-VRB-GUST' } },
  { id: 'W-VRB16G22-STRONG-VRB', input: { weather: { metar: metar('FACT 091000Z VRB16G22KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'POL-VRB-GUST' } },

  /* model: variable or missing direction, small gust */
  { id: 'W-MODEL-NODIR-4G10', input: { weather: { model: model({ ws: 4, g: 10 }) } }, expect: { status: 'go', sourceKind: 'model', noWindFindings: true } },
  { id: 'W-MODEL-VRB-5G11', input: { weather: { model: model({ ws: 5, g: 11, vrb: true }) } }, expect: { status: 'go', sourceKind: 'model', noWindFindings: true } },
  { id: 'W-MODEL-NODIR-18-BORDERLINE', input: { weather: { model: model({ ws: 18 }) } }, expect: { status: 'caution', ruleId: 'POL-MODEL-BORDERLINE', notStatus: 'nogo' } },
  { id: 'W-MODEL-NODIR-21-CLEAR', input: { weather: { model: model({ ws: 21 }) } }, expect: { status: 'nogo', ruleId: 'POL-MODEL-NOGO-CLEAR' } },

  /* directional: small gust vs gust near the user's limit */
  { id: 'W-DIR-8G12', input: { weather: { metar: metar('FACT 091000Z 07508G12KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'go', noWindFindings: true } },
  { id: 'W-DIR-10G16-NEAR-LIMIT', input: { weather: { metar: metar('FACT 091000Z 07510G16KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'caution', ruleId: 'POL-XW-BANDS' } },
  { id: 'W-DIR-12G22-ABOVE-LIMIT', input: { weather: { metar: metar('FACT 091000Z 07512G22KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'POL-XW-BANDS' } },
  { id: 'W-DIR-HEADON-10G18', input: { weather: { metar: metar('FACT 091000Z 01010G18KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'go', noWindFindings: true } },
  { id: 'W-DIR-MODEL-8G12', input: { weather: { model: model({ wd: 75, ws: 8, g: 12 }) } }, expect: { status: 'go', sourceKind: 'model', noWindFindings: true } },
  { id: 'W-DIR-MODEL-10G16-NEAR', input: { weather: { model: model({ wd: 75, ws: 10, g: 16 }) } }, expect: { status: 'caution', sourceKind: 'model', ruleId: 'POL-XW-BANDS' } },

  /* gust spread just below / just above the threshold (official 15, model 15 + 5) */
  { id: 'W-SPREAD-15-NOT-ABOVE', input: { profile: GUST40, weather: { metar: metar('FACT 091000Z 01010G25KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'go', notRuleId: 'POL-GUST-SPREAD' } },
  { id: 'W-SPREAD-16-ABOVE', input: { profile: GUST40, weather: { metar: metar('FACT 091000Z 01010G26KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'caution', ruleId: 'POL-GUST-SPREAD' } },
  { id: 'W-SPREAD-MODEL-18-BELOW', input: { profile: GUST40, weather: { model: model({ wd: 10, ws: 10, g: 28 }) } }, expect: { status: 'go', sourceKind: 'model', notRuleId: 'POL-GUST-SPREAD' } },
  { id: 'W-SPREAD-MODEL-20-NOT-ABOVE', input: { profile: GUST40, weather: { model: model({ wd: 10, ws: 10, g: 30 }) } }, expect: { status: 'go', sourceKind: 'model', notRuleId: 'POL-GUST-SPREAD' } },
  { id: 'W-SPREAD-MODEL-21-ABOVE', input: { profile: GUST40, weather: { model: model({ wd: 10, ws: 10, g: 31 }) } }, expect: { status: 'caution', sourceKind: 'model', ruleId: 'POL-GUST-SPREAD' } },
  { id: 'W-PEAK-ABOVE-USER-GUST-LIMIT', input: { weather: { metar: metar('FACT 091000Z 01015G28KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'POL-WS-STRONG' } },
  { id: 'W-PEAK-MODEL-ABOVE-LIMIT-BORDERLINE', input: { weather: { model: model({ wd: 10, ws: 15, g: 27 }) } }, expect: { status: 'caution', sourceKind: 'model', ruleId: 'POL-MODEL-BORDERLINE' } },

  /* regression: small spread or gust at low mean wind never causes CAUTION by itself */
  { id: 'W-REG-SPREAD6-METAR', input: { weather: { metar: metar('FACT 091000Z 05006G12KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'go', noWindFindings: true } },
  { id: 'W-REG-SPREAD6-MODEL', input: { weather: { model: model({ wd: 50, ws: 6, g: 12 }) } }, expect: { status: 'go', sourceKind: 'model', noWindFindings: true } },
  { id: 'W-REG-LOW-MEAN-GUST-METAR', input: { weather: { metar: metar('FACT 091000Z 05003G09KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'go', noWindFindings: true } },
  { id: 'W-REG-LOW-MEAN-GUST-MODEL', input: { weather: { model: model({ wd: 50, ws: 3, g: 9 }) } }, expect: { status: 'go', sourceKind: 'model', noWindFindings: true } },

  /* strong wind is tied to the user's gust limit */
  { id: 'W-STRONG-22-GUSTLIM-40', input: { profile: GUST40, weather: { metar: metar('FACT 091000Z 01022KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'go', noWindFindings: true } },
  { id: 'W-STRONG-33-GUSTLIM-40', input: { profile: GUST40, weather: { metar: metar('FACT 091000Z 01033KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'caution', ruleId: 'POL-WS-STRONG' } },
  { id: 'W-STRONG-19-GUSTLIM-25', input: { weather: { metar: metar('FACT 091000Z 01019KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'go', noWindFindings: true } },

  /* the same wind is counted once */
  { id: 'W-ONCE-XW-NOGO-PLUS-STRONG', input: { weather: { metar: metar('FACT 091000Z 07521KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'POL-XW-BANDS', windFindings: 1 } },
  { id: 'W-ONCE-XW-CAUTION-PLUS-SPREAD', input: { profile: GUST40, weather: { metar: metar('FACT 091000Z 07514G30KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'nogo', windFindings: 1, ruleId: 'POL-XW-BANDS' } },

  /* no runway headings: worst-case rather than a blanket CAUTION */
  { id: 'W-NORW-5KT', input: { field: NORW, weather: { metar: metar('FACT 091000Z 24005KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'go', noWindFindings: true } },
  { id: 'W-NORW-14KT', input: { field: NORW, weather: { metar: metar('FACT 091000Z 24014KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'caution', ruleId: 'POL-VRB-GUST' } },

  /* model vs official */
  { id: 'M-OFFICIAL-GOOD-MODEL-WORSE', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020'), model: model({ visKm: 2, ceilFt: 400, wd: 240, ws: 30, g: 45 }) } }, expect: { status: 'go', sourceKind: 'metar', notRuleId: 'POL-MODEL-DISCLAIMER' } },
  { id: 'M-OFFICIAL-VIS-MISSING-MODEL-CLEAR', input: { weather: { metar: metar('FACT 091000Z 24008KT SCT020 22/10 Q1020'), model: model({ visKm: 10, wd: 240, ws: 8, g: 12 }) } }, expect: { status: 'go', notRuleId: 'POL-FILL-HOLE', why: 'METAR has no visibility, so it\'s taken from the model: 10 km' } },
  { id: 'M-OFFICIAL-VIS-MISSING-MODEL-JUST-CLEAR', input: { weather: { metar: metar('FACT 091000Z 24008KT SCT020 22/10 Q1020'), model: model({ visKm: 6, wd: 240, ws: 8 }) } }, expect: { status: 'go', notRuleId: 'POL-FILL-HOLE', why: 'METAR has no visibility, so it\'s taken from the model: 6 km' } },
  { id: 'M-OFFICIAL-VIS-MISSING-MODEL-BORDERLINE', input: { weather: { metar: metar('FACT 091000Z 24008KT SCT020 22/10 Q1020'), model: model({ visKm: 5.5, wd: 240, ws: 8 }) } }, expect: { status: 'caution', ruleId: 'POL-FILL-HOLE', lv: 'caution' } },
  { id: 'M-OFFICIAL-VIS-MISSING-MODEL-POOR', input: { weather: { metar: metar('FACT 091000Z 24008KT SCT020 22/10 Q1020'), model: model({ visKm: 3, wd: 240, ws: 8 }) } }, expect: { status: 'nogo', ruleId: 'POL-FILL-HOLE', lv: 'nogo' } },
  { id: 'M-OFFICIAL-VIS-MISSING-NO-MODEL', input: { weather: { metar: metar('FACT 091000Z 24008KT SCT020 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'POL-MISS-VIS' } },
  { id: 'M-MODEL-ALL-NULL-IS-NO-MODEL', input: { weather: { model: { time: NOW - 10 * 6e4, ws: null, wd: null, g: null, visibility: null, cloud_cover_low: null } } }, expect: { status: 'incomplete', ruleId: 'POL-NODATA' } },

  /* stale METAR: 60 / 61 / 90 / 91 minutes */
  { id: 'A-METAR-60', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020 NOSIG', 60) } }, expect: { status: 'go', notRuleId: 'POL-METAR-STALE-60' } },
  { id: 'A-METAR-61', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020 NOSIG', 61) } }, expect: { status: 'caution', ruleId: 'POL-METAR-STALE-60' } },
  { id: 'A-METAR-90', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020 NOSIG', 90) } }, expect: { status: 'caution', ruleId: 'POL-METAR-STALE-60', sourceKind: 'metar' } },
  { id: 'A-METAR-91', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020 NOSIG', 91) } }, expect: { status: 'incomplete', ruleId: 'POL-NODATA' } },
  { id: 'A-METAR-91-FALLS-TO-MODEL', input: { weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020', 91), model: model({ wd: 240, ws: 8 }) } }, expect: { status: 'go', sourceKind: 'model' } },

  /* stale model: 90 / 91 / 180 / 181 minutes, and fetchedAt older than the valid time */
  { id: 'A-MODEL-90', input: { weather: { model: model({ wd: 240, ws: 8 }, 90) } }, expect: { status: 'go', notRuleId: 'POL-MODEL-OLDER' } },
  { id: 'A-MODEL-91', input: { weather: { model: model({ wd: 240, ws: 8 }, 91) } }, expect: { status: 'caution', ruleId: 'POL-MODEL-OLDER' } },
  { id: 'A-MODEL-180', input: { weather: { model: model({ wd: 240, ws: 8 }, 180) } }, expect: { status: 'caution', ruleId: 'POL-MODEL-OLDER', sourceKind: 'model' } },
  { id: 'A-MODEL-181', input: { weather: { model: model({ wd: 240, ws: 8 }, 181) } }, expect: { status: 'incomplete', ruleId: 'POL-MODEL-TOO-OLD' } },
  { id: 'A-MODEL-FETCHED-100-VALID-10', input: { weather: { model: model({ wd: 240, ws: 8, fetchedAt: NOW - 100 * 6e4 }, 10) } }, expect: { status: 'caution', ruleId: 'POL-MODEL-OLDER' } },
  { id: 'A-MODEL-FETCHED-200-VALID-10', input: { weather: { model: model({ wd: 240, ws: 8, fetchedAt: NOW - 200 * 6e4 }, 10) } }, expect: { status: 'incomplete', ruleId: 'POL-MODEL-TOO-OLD' } }
];

/* ---------- 2.2.0 cases: missing METAR vis filled from TAF, then model ---------- */
const cases220 = [
  /* case 8: TAF and model both clearly good */
  { id: 'V-TAF-AND-MODEL-CLEAR', input: { weather: { metar: metar('FACT 091000Z 25008KT SCT020 22/10 Q1020'), model: model({ visKm: 10, wd: 250, ws: 8 }), taf: { raw: 'TAF FACT 090400Z 0906/1012 25008KT 9999 CAVOK' } } }, expect: { status: 'go', notRuleId: ['POL-FILL-HOLE', 'POL-FILL-DISAGREE'], why: 'METAR has no visibility, so it\'s taken from the TAF: 10 km', sourceKind: 'metar' } },
  /* case 9: TAF 9999, no model — must give a verdict, not miss-vis */
  { id: 'V-TAF-CLEAR-NO-MODEL', input: { weather: { metar: metar('FACT 091000Z 25008KT SCT020 22/10 Q1020'), taf: { raw: 'TAF FACT 090400Z 0906/1012 25008KT 9999 SCT020' } } }, expect: { status: 'go', notRuleId: ['POL-MISS-VIS', 'POL-FILL-HOLE'], why: 'METAR has no visibility, so it\'s taken from the TAF: 10 km' } },
  /* case 10: TAF good, model 3 km — caution, both values named */
  { id: 'POL-FILL-DISAGREE', input: { weather: { metar: metar('FACT 091000Z 25008KT SCT020 22/10 Q1020'), model: model({ visKm: 3, wd: 250, ws: 8 }), taf: { raw: 'TAF FACT 090400Z 0906/1012 25008KT 9999 SCT020' } } }, expect: { status: 'caution', ruleId: 'POL-FILL-DISAGREE', lv: 'caution', notRuleId: 'POL-FILL-HOLE' } },
  /* case 11 already covered by M-OFFICIAL-VIS-MISSING-MODEL-POOR (nogo below the 5 km minimum) */
  { id: 'V-TAF-BELOW-NO-MODEL', input: { weather: { metar: metar('FACT 091000Z 25008KT SCT020 22/10 Q1020'), taf: { raw: 'TAF FACT 090400Z 0906/1012 25008KT 4000 BR SCT020' } } }, expect: { status: 'nogo', ruleId: 'POL-FILL-HOLE', lv: 'nogo' } },
  { id: 'V-TAF-NEAR-NO-MODEL', input: { weather: { metar: metar('FACT 091000Z 25008KT SCT020 22/10 Q1020'), taf: { raw: 'TAF FACT 090400Z 0906/1012 25008KT 5500 SCT020' } } }, expect: { status: 'caution', ruleId: 'POL-FILL-HOLE', lv: 'caution' } },
  { id: 'V-TAF-NO-VIS-MODEL-CLEAR', input: { weather: { metar: metar('FACT 091000Z 25008KT SCT020 22/10 Q1020'), model: model({ visKm: 10, wd: 250, ws: 8 }), taf: { raw: 'TAF FACT 090400Z 0906/1012 25008KT SCT020' } } }, expect: { status: 'go', notRuleId: 'POL-FILL-HOLE', why: 'METAR has no visibility, so it\'s taken from the model: 10 km' } },
  { id: 'V-TAF-GOOD-MODEL-NEAR', input: { weather: { metar: metar('FACT 091000Z 25008KT SCT020 22/10 Q1020'), model: model({ visKm: 5.5, wd: 250, ws: 8 }), taf: { raw: 'TAF FACT 090400Z 0906/1012 25008KT 9999 SCT020' } } }, expect: { status: 'caution', ruleId: 'POL-FILL-DISAGREE', lv: 'caution' } },
  { id: 'V-TAF-GOOD-MODEL-STILL-CLEAR', input: { weather: { metar: metar('FACT 091000Z 25008KT SCT020 22/10 Q1020'), model: model({ visKm: 8, wd: 250, ws: 8 }), taf: { raw: 'TAF FACT 090400Z 0906/1012 25008KT 9999 SCT020' } } }, expect: { status: 'go', notRuleId: ['POL-FILL-HOLE', 'POL-FILL-DISAGREE'], why: 'METAR has no visibility, so it\'s taken from the TAF: 10 km' } },
  /* TEMPO must not be the fill number; the 2 h scan still flags it */
  { id: 'V-TEMPO-NOT-USED-AS-FILL', input: { weather: { metar: metar('FACT 091000Z 25008KT SCT020 22/10 Q1020'), taf: { raw: 'TAF FACT 090400Z 0906/1012 25008KT 9999 CAVOK TEMPO 0910/0912 25008KT 2000 BR BKN008' } } }, expect: { status: 'caution', ruleId: 'POL-TAF-TEMPO-BELOW', notRuleId: ['POL-MISS-VIS', 'POL-FILL-HOLE'] } },
  { id: 'V-BECMG-WORSE-IN-FORCE', input: { weather: { metar: metar('FACT 091000Z 25008KT SCT020 22/10 Q1020'), taf: { raw: 'TAF FACT 090400Z 0906/1012 25008KT 9999 SCT020 BECMG 0909/0911 25008KT 4000 BR' } } }, expect: { status: 'nogo', ruleId: 'POL-FILL-HOLE', lv: 'nogo' } }
];


/* ---------- 2.3.0 cases: night at arrival, TEMPO/PROB wind ---------- */
const ETA_NIGHT = Date.UTC(2026, 10, 9, 19, 0, 0); // 21:00 SAST
const PROF_DAY = Object.assign({}, PROF, { night: false });
function nightWhy(eta) {
  const s = engine.sunInfo(FACT.lat, FACT.lon, eta);
  let ns = s && s.nightFrom;
  if (s && s.isNight && eta < s.nightTo) {
    const prev = engine.sunInfo(FACT.lat, FACT.lon, eta - 864e5);
    if (prev && prev.nightFrom != null) ns = prev.nightFrom;
  }
  const d = new Date(ns + 2 * 3600e3);
  const hm = ('0' + d.getUTCHours()).slice(-2) + ':' + ('0' + d.getUTCMinutes()).slice(-2);
  return "You'll land after dark (night from " + hm + "). Turn on night rating if you hold one.";
}
const cases230 = [
  /* LAND after dark, night rating off, now is still daytime — must use ETA, not now */
  { id: 'POL-NIGHT-ARRIVAL', input: { phase: 'land', eta: ETA_NIGHT, profile: PROF_DAY, weather: { metar: metar('FACT 091000Z 25008KT 9999 CAVOK 22/10 Q1020'), taf: { raw: 'TAF FACT 090400Z 0906/1024 25008KT 9999 CAVOK' } } }, expect: { status: 'caution', ruleId: 'POL-NIGHT-ARRIVAL', lv: 'caution', notRuleId: 'POL-NIGHT-UNSELECTED', why: nightWhy(ETA_NIGHT) } },
  /* same arrival with night rating on: current behaviour, LAND */
  { id: 'V-NIGHT-ARRIVAL-RATED', input: { phase: 'land', eta: ETA_NIGHT, profile: PROF, weather: { metar: metar('FACT 091000Z 25008KT 9999 CAVOK 22/10 Q1020'), taf: { raw: 'TAF FACT 090400Z 0906/1024 25008KT 9999 CAVOK' } } }, expect: { status: 'go', notRuleId: ['POL-NIGHT-ARRIVAL', 'POL-NIGHT-UNSELECTED'] } },
  /* land-now after dark, rating off: CAUTION, not the depart NO-GO */
  { id: 'V-NIGHT-LAND-NOW', input: function () {
      return { now: si.nightFrom + 60000, phase: 'land', eta: si.nightFrom + 60000, profile: PROF_DAY, weather: { metar: { raw: 'FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020', time: si.nightFrom + 60000 - 10 * 6e4 } } };
    }, expect: { status: 'caution', ruleId: 'POL-NIGHT-ARRIVAL', notRuleId: 'POL-NIGHT-UNSELECTED' } },
  /* depart at night is still NO DEPART (locked case POL-NIGHT-UNSELECTED stays) */

  /* TEMPO 25025G40 in the landing window: gust and crosswind over C172 15/25 — NO LAND */
  { id: 'POL-TAF-TEMPO-WIND', input: { phase: 'land', eta: NOW + 5 * 3600e3, weather: { taf: { raw: 'TAF FACT 090400Z 0906/1012 16008KT 9999 CAVOK TEMPO 0914/0916 25025G40KT' } } }, expect: { status: 'nogo', ruleId: 'POL-TAF-TEMPO-WIND', lv: 'nogo' } },
  /* same TEMPO wind in the departure 2-hour scan (TEMPO 0910/0912 covers now 10:00Z) */
  { id: 'V-TEMPO-WIND-DEPART-SCAN', input: { phase: 'depart', weather: { metar: metar('FACT 091000Z 16008KT 9999 CAVOK 22/10 Q1020'), taf: { raw: 'TAF FACT 090400Z 0906/1012 16008KT 9999 CAVOK TEMPO 0910/0912 25025G40KT' } } }, expect: { status: 'nogo', ruleId: 'POL-TAF-TEMPO-WIND', sourceKind: 'metar' } },
  /* TEMPO crosswind near the 15 kt limit (about 12–13 kt on the test 01/19 headings): CAUTION */
  { id: 'V-TEMPO-WIND-NEAR', input: { phase: 'land', eta: NOW + 5 * 3600e3, weather: { taf: { raw: 'TAF FACT 090400Z 0906/1012 16008KT 9999 CAVOK TEMPO 0914/0916 25016KT' } } }, expect: { status: 'caution', ruleId: 'POL-TAF-TEMPO-WIND', lv: 'caution' } },
  /* TEMPO along-runway under limits: no wind nogo */
  { id: 'V-TEMPO-WIND-ALONG-OK', input: { phase: 'land', eta: NOW + 5 * 3600e3, weather: { taf: { raw: 'TAF FACT 090400Z 0906/1012 16008KT 9999 CAVOK TEMPO 0914/0916 16016KT' } } }, expect: { status: 'go', notRuleId: 'POL-TAF-TEMPO-WIND' } },
  /* TEMPO gust 40 kt even along the runway is over the 25 kt gust limit */
  { id: 'V-TEMPO-GUST-OVER', input: { phase: 'land', eta: NOW + 5 * 3600e3, weather: { taf: { raw: 'TAF FACT 090400Z 0906/1012 16008KT 9999 CAVOK TEMPO 0914/0916 16025G40KT' } } }, expect: { status: 'nogo', ruleId: 'POL-TAF-TEMPO-WIND' } },
  /* PROB wind over the limit is also NO LAND — not demoted to caution */
  { id: 'POL-TAF-PROB-WIND', input: { phase: 'land', eta: NOW + 5 * 3600e3, weather: { taf: { raw: 'TAF FACT 090400Z 0906/1012 16008KT 9999 CAVOK PROB40 0914/0916 25025G40KT' } } }, expect: { status: 'nogo', ruleId: 'POL-TAF-PROB-WIND', lv: 'nogo' } },
  /* PROB thunderstorm stays caution */
  { id: 'V-PROB-TS-STILL-CAUTION', input: { phase: 'land', eta: NOW + 5 * 3600e3, weather: { taf: { raw: 'TAF FACT 090400Z 0906/1012 25008KT 9999 SCT030 PROB30 0914/0916 TS' } } }, expect: { status: 'caution', ruleId: 'POL-TAF-PROB', notRuleId: 'POL-TAF-PROB-WIND' } }
];


/* ---------- 2.3.1 cases: gust cap 35 kt, 9999/CAVOK meet a 10 km vis limit ---------- */
const cases231 = [
  /* 45 kt gust along the runway stays NO DEPART at every user gust, including 45 and 50 */
  { id: 'V-GUST-CAP-USER-20', input: { profile: Object.assign({}, PROF, { gustKt: 20 }), weather: { metar: metar('FACT 091000Z 01018G45KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'POL-WS-STRONG', why: 'Your gust limit 20 kt (gusting 45)' } },
  { id: 'V-GUST-CAP-USER-35', input: { profile: Object.assign({}, PROF, { gustKt: 35 }), weather: { metar: metar('FACT 091000Z 01030G45KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'POL-WS-STRONG', why: 'Your gust limit 35 kt (gusting 45)' } },
  { id: 'V-GUST-CAP-USER-45', input: { profile: Object.assign({}, PROF, { gustKt: 45 }), weather: { metar: metar('FACT 091000Z 01030G45KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'POL-WS-STRONG', why: 'Your gust limit 35 kt (gusting 45)' } },
  { id: 'V-GUST-CAP-USER-50', input: { profile: Object.assign({}, PROF, { gustKt: 50 }), weather: { metar: metar('FACT 091000Z 01030G45KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'POL-WS-STRONG', why: 'Your gust limit 35 kt (gusting 45)' } },
  /* a 30 kt gust is still under the 35 kt cap, even if the user typed 50 */
  { id: 'V-GUST-CAP-30-STILL-UNDER', input: { profile: Object.assign({}, PROF, { gustKt: 50 }), weather: { metar: metar('FACT 091000Z 01020G30KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'go', notRuleId: 'POL-WS-STRONG' } },

  /* 9999 and CAVOK mean 10 km or more, so a 10 km personal limit is a plain GO, not near-band caution */
  { id: 'V-CAVOK-VIS10-NO-NEAR', input: { profile: Object.assign({}, PROF, { visKm: 10 }), weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'go', vis: 10, notRuleId: 'POL-NEAR-20' } },
  { id: 'V-9999-VIS10-NO-NEAR', input: { profile: Object.assign({}, PROF, { visKm: 10 }), weather: { metar: metar('FACT 091000Z 24008KT 9999 NSC 22/10 Q1020') } }, expect: { status: 'go', vis: 10, notRuleId: 'POL-NEAR-20' } },
  { id: 'V-CAVOK-VIS8-STILL-GO', input: { profile: Object.assign({}, PROF, { visKm: 8 }), weather: { metar: metar('FACT 091000Z 24008KT 9999 CAVOK 22/10 Q1020') } }, expect: { status: 'go', notRuleId: 'POL-NEAR-20' } },
  /* a real reported 9 km is still below a 10 km personal limit */
  { id: 'V-MEASURED-9-VIS10-NOGO', input: { profile: Object.assign({}, PROF, { visKm: 10 }), weather: { metar: metar('FACT 091000Z 24008KT 9000 SCT030 22/10 Q1020') } }, expect: { status: 'nogo', ruleId: 'POL-PERSONAL-VIS' } },
  /* TAF 9999 / CAVOK fills also meet a 10 km limit */
  { id: 'V-TAF-9999-FILL-VIS10', input: { profile: Object.assign({}, PROF, { visKm: 10 }), weather: { metar: metar('FACT 091000Z 25008KT SCT020 22/10 Q1020'), taf: { raw: 'TAF FACT 090400Z 0906/1012 25008KT 9999 SCT020' } } }, expect: { status: 'go', notRuleId: ['POL-FILL-HOLE', 'POL-NEAR-20'], why: 'METAR has no visibility, so it\'s taken from the TAF: 10 km' } },
  { id: 'V-TAF-CAVOK-FILL-VIS10', input: { profile: Object.assign({}, PROF, { visKm: 10 }), weather: { metar: metar('FACT 091000Z 25008KT SCT020 22/10 Q1020'), taf: { raw: 'TAF FACT 090400Z 0906/1012 25008KT 9999 CAVOK' } } }, expect: { status: 'go', notRuleId: ['POL-FILL-HOLE', 'POL-NEAR-20'], why: 'METAR has no visibility, so it\'s taken from the TAF: 10 km' } }
];

const allCases = cases.concat(cases210, cases220, cases230, cases231);

const required = [
  'LAW-91.06.21-CTR-VIS', 'LAW-91.06.21-CTR-CEIL', 'LAW-91.06.21-CTR-OR',
  'LAW-91.06.21-UNC-VIS', 'LAW-91.06.21-HIGH-VIS', 'LAW-PART1-NIGHT',
  'LAW-91.07.7-LAND-WINDOW', 'LAW-91.07.7-DEPART-NOW',
  'POL-FLOOR-1000', 'POL-UNC-CEIL-1500', 'POL-UNKNOWN-CTL',
  'POL-PERSONAL-CEIL', 'POL-PERSONAL-VIS', 'POL-NEAR-20', 'POL-CNR',
  'POL-WX-NOGO', 'POL-WX-CAUT', 'POL-WX-FAGR',
  'POL-VRB-LIGHT', 'POL-VRB-GUST', 'POL-GUST-SPREAD',
  'POL-XW-BANDS', 'POL-XW-DEFAULT', 'POL-TW-BANDS',
  'POL-DA', 'POL-DA-NO-NOGO',
  'POL-TAF-TS', 'POL-TEMPO-TS-NOGO', 'POL-TAF-PERM-BELOW', 'POL-TAF-TEMPO-BELOW', 'POL-TAF-PROB',
  'POL-NIGHT-UNSELECTED', 'POL-NIGHT-SOON', 'POL-NIGHT-ARRIVAL',
  'POL-TAF-TEMPO-WIND', 'POL-TAF-PROB-WIND',
  'POL-METAR-STALE-60', 'POL-METAR-DROP-90', 'POL-MISS-VIS',
  'POL-TREND-TS', 'POL-TREND-WX', 'POL-TREND-VISCEIL', 'POL-TREND-SUPERSEDE', 'POL-NOSIG',
  'POL-MODEL-DISCLAIMER', 'POL-MODEL-GO', 'POL-MODEL-NOGO-CLEAR', 'POL-MODEL-BORDERLINE',
  'POL-MODEL-OLDER', 'POL-MODEL-TOO-OLD',
  'POL-WIND-MISSING', 'POL-VAR-GROUP', 'POL-WS-STRONG',
  'POL-HELI', 'POL-NIL', 'POL-NODATA', 'POL-FALLBACK-STALE-METAR-TAF', 'POL-FALLBACK-STALE-METAR-MODEL', 'POL-FALLBACK-NIL-TAF', 'POL-FALLBACK-NIL-MODEL', 'POL-FALLBACK-TAF-ONLY', 'POL-FALLBACK-UI-MODEL-SHAPE', 'POL-CAVOK', 'POL-SPECI-WINS',
  'POL-WORST-WINS', 'POL-SHELVES', 'POL-SOURCE-LABEL',
  'POL-LAND-FOLLOWS-TAF', 'POL-DEPART-METAR-WINS', 'POL-ARRIVE-NEAR-NOW',
  'POL-AUTO', 'POL-9999', 'POL-FILL-HOLE', 'POL-FILL-DISAGREE', 'POL-DISCLAIMER',
  'POL-IFR-RATING', 'POL-IFR-NO-IAP', 'POL-IFR-CAT1', 'POL-LOCK'
];

const WIND_KEYS = /^(vrb|xw|tw|ws|g)$/;
function windFindings(r) {
  return (r.findings || []).filter(function (f) { return (f.lv === 'caution' || f.lv === 'nogo') && WIND_KEYS.test(f.k); });
}

allCases.forEach(function (c) {
  let r;
  try {
    const input = typeof c.input === 'function' ? c.input() : c.input;
    r = ev(input);
  } catch (err) {
    check(c.id, false, 'threw ' + err.message);
    return;
  }
  const ex = c.expect;
  if (ex.status) check(c.id, r.status === ex.status, 'status ' + r.status + ' expected ' + ex.status + (r.why ? ' (' + r.why + ')' : ''));
  if (ex.notStatus) check(c.id, r.status !== ex.notStatus, 'status must not be ' + ex.notStatus);
  if (ex.ruleId) check(c.id, hasRule(r, ex.ruleId), 'missing finding ' + ex.ruleId + ' (got ' + (r.findings || []).map(function (f) { return f.ruleId + ':' + f.lv; }).join(', ') + ')');
  if (ex.alsoRuleId) check(c.id, hasRule(r, ex.alsoRuleId), 'missing second finding ' + ex.alsoRuleId);
  if (ex.why) check(c.id, r.why === ex.why, 'why ' + JSON.stringify(r.why) + ' expected ' + JSON.stringify(ex.why));
  const notIds = ex.notRuleId == null ? [] : (Array.isArray(ex.notRuleId) ? ex.notRuleId : [ex.notRuleId]);
  notIds.forEach(function (id) { check(c.id, !hasRule(r, id), 'unexpected finding ' + id); });
  if (ex.shelf && ex.ruleId) {
    const f = finding(r, ex.ruleId);
    check(c.id, f && f.shelf === ex.shelf, 'shelf ' + (f && f.shelf) + ' expected ' + ex.shelf);
  }
  if (ex.lv && ex.ruleId) {
    const f = finding(r, ex.ruleId);
    check(c.id, f && f.lv === ex.lv, 'level ' + (f && f.lv) + ' expected ' + ex.lv);
  }
  if (ex.noWindFindings) check(c.id, windFindings(r).length === 0, 'unexpected wind caution/no-go: ' + windFindings(r).map(function (f) { return f.ruleId + ':' + f.txt; }).join(' | '));
  if (ex.windFindings != null) check(c.id, windFindings(r).length === ex.windFindings, 'wind caution/no-go findings ' + windFindings(r).length + ' expected ' + ex.windFindings + ': ' + windFindings(r).map(function (f) { return f.k + ':' + f.lv; }).join(', '));
  if (ex.sourceKind) check(c.id, r.source && r.source.kind === ex.sourceKind, 'source ' + (r.source && r.source.kind) + ' expected ' + ex.sourceKind);
  if (ex.vis != null) check(c.id, r.weatherUsed && r.weatherUsed.vis === ex.vis, 'vis ' + (r.weatherUsed && r.weatherUsed.vis) + ' expected ' + ex.vis);
  if (Object.prototype.hasOwnProperty.call(ex, 'ceil')) check(c.id, r.weatherUsed && r.weatherUsed.ceil === ex.ceil, 'ceil ' + (r.weatherUsed && r.weatherUsed.ceil) + ' expected ' + ex.ceil);
  if (r.disclaimer !== engine.PIC_DISCLAIMER) check(c.id, false, 'missing person-in-command disclaimer');
  const text = JSON.stringify(r);
  check(c.id, !/\bpilot\b/i.test(text), 'user-facing result contained the word pilot');
  check(c.id, !/\b(GO|NO-GO|NO GO)\b/.test((r.findings || []).map(function (f) { return f.txt; }).join(' ') + ' ' + (r.why || '')), 'screen text contained GO / NO-GO');
});

/* extra: user-facing strings must not say "pilot" */
check('SCREEN-TEXT', !/\bpilot\b/i.test(engine.PIC_DISCLAIMER + ' ' + engine.MODEL_DISCLAIMER), 'disclaimer contains the word pilot');

const seen = { 'POL-LOCK': true, 'LAW-PART1-NIGHT': true };
allCases.forEach(function (c) { seen[c.id] = true; });
required.forEach(function (id) {
  check('COVERAGE', !!seen[id], 'no test for required rule ' + id);
});

if (fail.length) {
  console.error('FAILED ' + fail.length + ' check(s):');
  fail.forEach(function (f) { console.error(' - ' + f); });
  process.exit(1);
}
console.log('OK ' + (allCases.length + 2) + ' rule cases (' + cases.length + ' locked rules + ' + cases210.length + ' wind / model / freshness cases + ' + cases220.length + ' visibility-fill cases + ' + cases230.length + ' night-arrival / TEMPO-wind cases + ' + cases231.length + ' gust-cap / CAVOK-vis cases) plus lock and night-definition checks');
console.log('Rule pack ' + engine.RULES_VERSION + ' checksum ' + hash);
