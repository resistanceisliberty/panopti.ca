#!/usr/bin/env node
/**
 * Regenerates public/cameras-ca.json from OpenStreetMap.
 *
 * Queries the Overpass API for every `surveillance:type=ALPR` feature in
 * Canada and writes them as the flat-array format the map app expects
 * (see src/services/cameraDataService.ts). Dependency-free: uses Node's
 * global fetch (Node 18+) and built-ins only.
 *
 * Run locally:  node scripts/build-cameras-ca.mjs
 * In CI:        invoked nightly by .github/workflows/update-cameras-ca.yml
 *
 * Exits non-zero on failure (or an implausibly small result) so CI never
 * commits empty or partial data.
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'public', 'cameras-ca.json');

// Sanity floor: Canada had ~156 mapped ALPRs as of mid-2026. Set well below the
// live count so a truncated Overpass response is rejected, but low enough that
// it won't trip on normal data. Override with MIN_CAMERA_COUNT env var.
const MIN_CAMERA_COUNT = Number(process.env.MIN_CAMERA_COUNT ?? 50);

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

// Mirrors worker/src/fetchers/cameras.ts. `out meta` gives tags + version +
// timestamp; the recursion (`>`) emits member nodes so ways can be centroided.
const OVERPASS_QUERY = `[out:json][timeout:300];
area["ISO3166-1"="CA"]->.ca;
(
  node["man_made"="surveillance"]["surveillance:type"="ALPR"](area.ca);
  way["man_made"="surveillance"]["surveillance:type"="ALPR"](area.ca);
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
    return [d, Number.isInteger(d) ? String(d) : String(d)];
  }
  return [null, token || null];
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

async function queryOverpass() {
  const errors = [];
  // Each round tries every endpoint once; between rounds, back off to let
  // transiently-overloaded public instances (504/429) recover.
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const data = await tryEndpoint(endpoint);
        console.log(`Overpass OK via ${endpoint}: ${data.elements.length} elements (round ${round})`);
        return data;
      } catch (err) {
        console.warn(`[round ${round}] ${endpoint} failed: ${err.message}`);
        errors.push(`${endpoint}: ${err.message}`);
      }
    }
    if (round < MAX_ROUNDS) {
      const backoffMs = round * 30_000; // 30s, 60s, 90s
      console.warn(`All endpoints failed round ${round}; retrying in ${backoffMs / 1000}s…`);
      await sleep(backoffMs);
    }
  }
  throw new Error(`All Overpass endpoints failed after ${MAX_ROUNDS} rounds: ${errors.join('; ')}`);
}

function toCamera(el, lat, lon) {
  const tags = el.tags ?? {};
  const [direction, directionCardinal] = parseDirection(tags['camera:direction']);
  const cam = { osmId: el.id, osmType: el.type, lat, lon };
  const brand = tags.brand || tags.manufacturer;
  if (tags.operator) cam.operator = tags.operator;
  if (brand) cam.brand = brand;
  if (direction !== null) cam.direction = direction;
  if (directionCardinal !== null) cam.directionCardinal = directionCardinal;
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
  for (const el of data.elements) {
    // Only tagged ALPR elements carry tags; skel-only nodes have none.
    const isAlpr = el.tags?.['surveillance:type'] === 'ALPR';
    if (!isAlpr) continue;

    if (el.type === 'node' && typeof el.lat === 'number') {
      cameras.push(toCamera(el, el.lat, el.lon));
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
      if (n > 0) cameras.push(toCamera(el, sumLat / n, sumLon / n));
    }
  }
  return cameras;
}

async function main() {
  const data = await queryOverpass();
  const cameras = build(data);

  if (cameras.length < MIN_CAMERA_COUNT) {
    throw new Error(
      `Refusing to write: only ${cameras.length} cameras (< MIN_CAMERA_COUNT ${MIN_CAMERA_COUNT}). ` +
        `Likely a partial Overpass response.`
    );
  }

  await writeFile(OUTPUT_PATH, JSON.stringify(cameras));

  const operators = new Set(cameras.map((c) => c.operator).filter(Boolean));
  const brands = new Set(cameras.map((c) => c.brand).filter(Boolean));
  console.log(
    `Wrote ${cameras.length} cameras → ${OUTPUT_PATH} ` +
      `(${operators.size} operators, ${brands.size} brands)`
  );
}

main().catch((err) => {
  console.error(`build-cameras-ca failed: ${err.message}`);
  process.exit(1);
});
