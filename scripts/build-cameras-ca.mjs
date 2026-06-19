#!/usr/bin/env node
/**
 * Regenerates public/cameras-ca.json from OpenStreetMap.
 *
 * Queries the Overpass API for every `surveillance:type=ALPR` feature in
 * Canada, plus government-operated CCTV (`surveillance:type=camera` whose
 * operator looks governmental, or traffic-zone cameras), and writes them as
 * the flat-array format the map app expects (see
 * src/services/cameraDataService.ts). Government CCTV is labelled with
 * brand "Government CCTVs" so the map's ALPR/CCTV toggle can separate them.
 * Dependency-free: uses Node's global fetch (Node 18+) and built-ins only.
 *
 * Run locally:  node scripts/build-cameras-ca.mjs
 * In CI:        invoked nightly by .github/workflows/update-cameras-ca.yml
 *
 * Exits non-zero on failure (or an implausibly small result) so CI never
 * commits empty or partial data.
 */

import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'public', 'cameras-ca.json');

// Sanity floor: Canada had ~156 mapped ALPRs as of mid-2026. Set well below the
// live count so a truncated Overpass response is rejected, but low enough that
// it won't trip on normal data. Override with MIN_CAMERA_COUNT env var.
const MIN_CAMERA_COUNT = Number(process.env.MIN_CAMERA_COUNT ?? 50);

// Regression guard: a stale or replication-lagged Overpass mirror can return an
// older, smaller snapshot that still clears the absolute floor (e.g. 223 -> 156
// when recent additions are missing). Reject any build whose ALPR count drops
// more than this fraction below the previously committed data. Override with
// MAX_ALPR_DROP env var.
const MAX_ALPR_DROP = Number(process.env.MAX_ALPR_DROP ?? 0.1);

// Stale-data alert: a skipped run (no fresh mirror) is normally fine and exits
// cleanly. But if the committed data has gone this many days without a refresh,
// something is genuinely stuck (mirrors persistently stale, or every trigger
// failing) — fail loudly so it gets noticed. Override with MAX_STALE_DAYS.
const MAX_STALE_DAYS = Number(process.env.MAX_STALE_DAYS ?? 3);

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

// Public Overpass instances frequently return transient 504/429s under load, so
// retry the whole endpoint list a few times with backoff before giving up.
const MAX_ROUNDS = 4;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Brand label applied to government CCTV so the map can toggle it apart from ALPRs.
const CCTV_BRAND = 'Government CCTVs';

// Government-CCTV is sparsely tagged with operator:type, so we also match
// recognizable government operator names and traffic-zone cameras. This is a
// discovery heuristic (some false positives / misses) — see /report on the portal.
const GOV_OPERATOR_RE =
  'Ville de|City of|Ministry of|Ministère|Police|School Board|Commission scolaire|' +
  'Universit|Region|Régie|RCMP|GRC|County|Comté|Transit|Metro|Translink|gouvernement|Province|District';

const CCTV = '["man_made"="surveillance"]["surveillance:type"="camera"]';
const CCTV_CLAUSES = [
  `node${CCTV}["operator:type"~"government|public|council|military"](area.ca);`,
  `way${CCTV}["operator:type"~"government|public|council|military"](area.ca);`,
  `node${CCTV}["operator"~"${GOV_OPERATOR_RE}",i](area.ca);`,
  `way${CCTV}["operator"~"${GOV_OPERATOR_RE}",i](area.ca);`,
  `node${CCTV}["surveillance:zone"="traffic"](area.ca);`,
  `way${CCTV}["surveillance:zone"="traffic"](area.ca);`,
].join('\n  ');

// Mirrors worker/src/fetchers/cameras.ts. `out meta` gives tags + version +
// timestamp; the recursion (`>`) emits member nodes so ways can be centroided.
const OVERPASS_QUERY = `[out:json][timeout:300];
area["ISO3166-1"="CA"]->.ca;
(
  node["surveillance:type"~"(^|;)ALPR($|;)"](area.ca);
  way["surveillance:type"~"(^|;)ALPR($|;)"](area.ca);
  ${CCTV_CLAUSES}
);
out meta;
>;
out skel qt;`;

const CARDINALS = {
  N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
  S: 180, SSW: 202.5, SW: 225, WSW: 247.5, W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
};
const SPELLED = {
  NORTH: 0, NORTHEAST: 45, EAST: 90, SOUTHEAST: 135,
  SOUTH: 180, SOUTHWEST: 225, WEST: 270, NORTHWEST: 315,
};
const BOUND = { NB: 0, EB: 90, SB: 180, WB: 270 };

const norm = (d) => ((d % 360) + 360) % 360;

/** Resolve a direction tag to [degrees|null, cardinalLabel|null]. */
function parseDirection(value) {
  if (!value) return [null, null];
  const token = String(value).trim();
  const upper = token.toUpperCase();
  if (upper in CARDINALS) return [CARDINALS[upper], upper];
  if (upper in SPELLED) return [SPELLED[upper], upper];
  if (upper in BOUND) return [BOUND[upper], upper];
  // Range like "338-23" → midpoint of the clockwise sector.
  const range = upper.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    const arc = norm(b - a);
    const mid = norm(a + (arc === 0 ? 0 : arc / 2));
    return [mid, String(Math.round(mid))];
  }
  const num = Number(upper);
  if (!Number.isNaN(num)) {
    const d = norm(num);
    return [d, String(d)];
  }
  return [null, token || null];
}

/**
 * Parse a camera facing tag value. Cameras tag the bearing as `camera:direction`
 * (preferred) or the plain `direction` key, and may give several semicolon-
 * separated bearings for multiple cameras on one pole (e.g. "0;90"). Returns the
 * primary bearing plus the full list when there's more than one.
 */
function parseDirectionTag(value) {
  if (!value) return { direction: null, directionCardinal: null, directions: null };
  const parts = String(value).split(';').map((s) => s.trim()).filter(Boolean);
  const bearings = [];
  for (const part of parts) {
    const [deg] = parseDirection(part);
    if (deg !== null) bearings.push(deg);
  }
  if (bearings.length === 0) {
    const [, card] = parseDirection(value);
    return { direction: null, directionCardinal: card, directions: null };
  }
  const [, primaryCardinal] = parseDirection(parts[0]);
  return {
    direction: bearings[0],
    directionCardinal: primaryCardinal,
    directions: bearings.length > 1 ? bearings : null,
  };
}

async function tryEndpoint(endpoint) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300_000);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'DeFlockCanada/1.0 (+https://github.com/) cameras-ca refresh',
      },
      body: new URLSearchParams({ data: OVERPASS_QUERY }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.elements?.length) throw new Error('empty response');
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

// Returns null if a freshly-built result passes the floor + regression checks,
// or a human-readable reason if it looks stale/partial — so we can reject that
// mirror and try another instead of overwriting good data (or failing the job).
function validate(alprCount, prevAlpr) {
  if (alprCount < MIN_CAMERA_COUNT) {
    return `only ${alprCount} ALPRs (< MIN_CAMERA_COUNT ${MIN_CAMERA_COUNT})`;
  }
  if (prevAlpr !== null && alprCount < prevAlpr * (1 - MAX_ALPR_DROP)) {
    return `ALPRs dropped ${prevAlpr} -> ${alprCount} (> ${Math.round(MAX_ALPR_DROP * 100)}% below the last build)`;
  }
  return null;
}

function toCamera(el, lat, lon) {
  const tags = el.tags ?? {};
  const { direction, directionCardinal, directions } = parseDirectionTag(
    tags['camera:direction'] ?? tags['direction']
  );
  const cam = { osmId: el.id, osmType: el.type, lat, lon };
  const brand = tags.brand || tags.manufacturer;
  if (tags.operator) cam.operator = tags.operator;
  if (brand) cam.brand = brand;
  if (direction !== null) cam.direction = direction;
  if (directionCardinal !== null) cam.directionCardinal = directionCardinal;
  if (directions) cam.directions = directions;
  if (tags['surveillance:zone']) cam.surveillanceZone = tags['surveillance:zone'];
  if (tags['camera:mount']) cam.mountType = tags['camera:mount'];
  if (tags.ref) cam.ref = tags.ref;
  if (tags.start_date) cam.startDate = tags.start_date;
  if (el.timestamp) cam.osmTimestamp = el.timestamp;
  if (el.version) cam.osmVersion = el.version;
  if (tags.wikimedia_commons) cam.wikimediaCommons = tags.wikimedia_commons;
  return cam;
}

function build(data) {
  // Index bare node geometry so way centroids can be computed.
  const nodeCoords = new Map();
  for (const el of data.elements) {
    if (el.type === 'node' && typeof el.lat === 'number') {
      nodeCoords.set(el.id, [el.lat, el.lon]);
    }
  }

  const cameras = [];
  let alprCount = 0;
  let cctvCount = 0;
  for (const el of data.elements) {
    // Only tagged ALPR/camera elements carry tags; skel-only member nodes have none.
    const stype = el.tags?.['surveillance:type'];
    // ALPR may be one of several ;-separated surveillance:type values (e.g. "camera;ALPR").
    const isAlpr = (stype ?? '').split(';').map((s) => s.trim()).includes('ALPR');
    // Every camera in the response matched a government clause (see OVERPASS_QUERY).
    const isCCTV = stype === 'camera';
    if (!isAlpr && !isCCTV) continue;

    let lat;
    let lon;
    if (el.type === 'node' && typeof el.lat === 'number') {
      lat = el.lat;
      lon = el.lon;
    } else if (el.type === 'way' && Array.isArray(el.nodes) && el.nodes.length) {
      let sumLat = 0;
      let sumLon = 0;
      let n = 0;
      for (const id of el.nodes) {
        const c = nodeCoords.get(id);
        if (c) {
          sumLat += c[0];
          sumLon += c[1];
          n++;
        }
      }
      if (!n) continue;
      lat = sumLat / n;
      lon = sumLon / n;
    } else {
      continue;
    }

    const cam = toCamera(el, lat, lon);
    if (isCCTV) {
      cam.brand = CCTV_BRAND; // override any camera brand so the map can group them
      cctvCount++;
    } else {
      alprCount++;
    }
    cameras.push(cam);
  }
  return { cameras, alprCount, cctvCount };
}

// ALPR count from the previously committed data, or null if there is none.
async function previousAlprCount() {
  try {
    const parsed = JSON.parse(await readFile(OUTPUT_PATH, 'utf8'));
    // Support both the flat array we write and a GeoJSON FeatureCollection, so
    // the regression guard never silently no-ops on a format change.
    const list = Array.isArray(parsed)
      ? parsed
      : (parsed.features ?? []).map((f) => f.properties ?? {});
    return list.filter((c) => c.brand !== CCTV_BRAND).length;
  } catch {
    return null;
  }
}

// Days since public/cameras-ca.json last actually changed (its last git commit),
// or null if it can't be determined (e.g. no git history / shallow checkout) — in
// which case we never false-alarm. Requires fetch-depth: 0 in CI.
function dataAgeDays() {
  try {
    const out = execSync('git log -1 --format=%ct -- public/cameras-ca.json', {
      cwd: join(__dirname, '..'),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!out) return null;
    return (Date.now() - Number(out) * 1000) / 86_400_000;
  } catch {
    return null;
  }
}

async function main() {
  const prevAlpr = await previousAlprCount();
  const errors = [];

  // Try each endpoint per round; build + validate the result and reject a
  // stale/partial mirror exactly like a failed fetch, so one lagging mirror
  // can neither overwrite good data nor fail the whole job. Back off between
  // rounds to let transiently-overloaded public instances (504/429) recover.
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    for (const endpoint of OVERPASS_ENDPOINTS) {
      let data;
      try {
        data = await tryEndpoint(endpoint);
      } catch (err) {
        console.warn(`[round ${round}] ${endpoint} failed: ${err.message}`);
        errors.push(`${endpoint}: ${err.message}`);
        continue;
      }

      const { cameras, alprCount, cctvCount } = build(data);
      const staleReason = validate(alprCount, prevAlpr);
      if (staleReason) {
        console.warn(`[round ${round}] ${endpoint}: ${data.elements.length} elements but ${staleReason}; trying another mirror`);
        errors.push(`${endpoint}: stale (${staleReason})`);
        continue;
      }

      await writeFile(OUTPUT_PATH, JSON.stringify(cameras));
      const operators = new Set(cameras.map((c) => c.operator).filter(Boolean));
      console.log(
        `Wrote ${cameras.length} cameras → ${OUTPUT_PATH} ` +
          `(${alprCount} ALPR, ${cctvCount} gov CCTV; ${operators.size} operators) via ${endpoint}`
      );
      return;
    }
    if (round < MAX_ROUNDS) {
      const backoffMs = round * 30_000; // 30s, 60s, 90s
      console.warn(`No fresh data in round ${round}; retrying in ${backoffMs / 1000}s…`);
      await sleep(backoffMs);
    }
  }

  // No mirror returned fresh, complete data this run. A one-off is transient and
  // external (Overpass outage/lag), so skip quietly and let the next run self-heal.
  // But if the committed data is already older than MAX_STALE_DAYS, this is no
  // longer a blip — fail loudly so the persistent problem gets attention.
  const ageDays = dataAgeDays();
  const ageStr = ageDays === null ? 'unknown' : ageDays.toFixed(1);
  if (ageDays !== null && ageDays > MAX_STALE_DAYS) {
    throw new Error(
      `No fresh Overpass data after ${MAX_ROUNDS} rounds, AND committed data is ` +
        `${ageStr} days old (> ${MAX_STALE_DAYS}d). Failing so this gets noticed. ` +
        `Attempts: ${errors.join('; ')}`
    );
  }
  console.warn(
    `No fresh Overpass data after ${MAX_ROUNDS} rounds; keeping existing data ` +
      `(${ageStr} days old, within ${MAX_STALE_DAYS}d tolerance). Attempts: ${errors.join('; ')}`
  );
}

main().catch((err) => {
  console.error(`build-cameras-ca failed: ${err.message}`);
  process.exit(1);
});
