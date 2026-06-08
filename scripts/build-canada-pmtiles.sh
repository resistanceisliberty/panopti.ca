#!/usr/bin/env bash
#
# Builds a Canada-only PMTiles basemap by extracting the Canada bounding box
# from a Protomaps planet build. The extract uses HTTP range requests, so it
# downloads only the bytes inside the bbox — not the whole planet.
#
# Prerequisites:
#   - go-pmtiles CLI: https://github.com/protomaps/go-pmtiles/releases
#     (or: brew install pmtiles)
#
# Usage:
#   scripts/build-canada-pmtiles.sh <PLANET_BUILD_URL> [OUTPUT]
#
# Find the latest PLANET_BUILD_URL at https://maps.protomaps.com/builds/
# e.g. https://build.protomaps.com/20260601.pmtiles
#
# Example:
#   scripts/build-canada-pmtiles.sh https://build.protomaps.com/20260601.pmtiles
#
# Then upload the output to Cloudflare R2 and set VITE_PMTILES_URL to its
# public URL (see README / .env.example).

set -euo pipefail

SOURCE="${1:-}"
OUTPUT="${2:-canada.pmtiles}"

# Canada bounding box: west, south, east, north (covers mainland + Arctic).
BBOX="-141.0,41.6,-52.6,83.2"

if [[ -z "$SOURCE" ]]; then
  echo "error: missing PLANET_BUILD_URL" >&2
  echo "usage: $0 <PLANET_BUILD_URL> [OUTPUT]" >&2
  echo "find the latest build at https://maps.protomaps.com/builds/" >&2
  exit 1
fi

if ! command -v pmtiles >/dev/null 2>&1; then
  echo "error: 'pmtiles' CLI not found." >&2
  echo "install from https://github.com/protomaps/go-pmtiles/releases" >&2
  exit 1
fi

echo "Extracting Canada (bbox $BBOX) from:"
echo "  $SOURCE"
echo "  -> $OUTPUT"

pmtiles extract "$SOURCE" "$OUTPUT" --bbox="$BBOX"

echo
echo "Done. Inspect with:  pmtiles show $OUTPUT"
echo "Next: upload $OUTPUT to Cloudflare R2 and set VITE_PMTILES_URL to its public URL."
