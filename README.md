<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="branding/panoptica-dark.svg">
    <img src="branding/panoptica-light.svg" alt="panopti.ca" width="360">
  </picture>
</p>

A Canada-focused map of automatic licence plate readers (ALPRs), built on
crowdsourced [OpenStreetMap](https://www.openstreetmap.org) data. It shows where
ALPR / Flock-style surveillance cameras are deployed across Canada so people can
see them.

**Live:** https://maps.panopti.ca/

This is a localized fork of [DeFlock Maps / FlockHopper](https://github.com/FoggedLens/deflockhopper_maps).
The US-only features (route avoidance, density analysis, agency network) are hidden;
this build ships the camera map for Canada.

## How it works

- **Camera data** comes from OpenStreetMap nodes tagged `surveillance:type=ALPR`
  within Canada. It's bundled as [`public/cameras-ca.json`](public/cameras-ca.json)
  and refreshed nightly (see below) — no live database.
- **Basemap** is a [Protomaps](https://protomaps.com) vector basemap read from a
  PMTiles archive; fonts/sprites come from Protomaps' public assets host.
- **Search** uses Photon (OpenStreetMap), biased to Canada.

## Development

Requires [bun](https://bun.sh) (or Node 20+).

```bash
bun install
bun run dev          # http://localhost:3000
# On Node 18, force bun's runtime so Vite runs: bun --bun run dev
```

Copy `.env.example` to `.env` to override defaults (API/tiles/data URLs).

## Camera data refresh

[`scripts/build-cameras-ca.mjs`](scripts/build-cameras-ca.mjs) queries the
Overpass API for ALPR nodes in Canada and writes `public/cameras-ca.json`.
The [`update-cameras-ca`](.github/workflows/update-cameras-ca.yml) GitHub Action
runs it nightly and commits any changes, which triggers a Cloudflare Pages
redeploy.

```bash
bun run update-cameras   # regenerate the data file locally
```

## Self-hosting the basemap tiles

The basemap can be served from your own PMTiles archive (e.g. a Canada extract
on Cloudflare R2) by setting `VITE_PMTILES_URL`. See
[docs/self-hosting-tiles.md](docs/self-hosting-tiles.md) for the full walkthrough.

## Deployment

Hosted on Cloudflare Pages (build: `npm run build`, output: `dist`). A push to
`main` auto-deploys, so the nightly data commit goes live automatically.

## Attribution & licence

- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL).
- Basemap by [Protomaps](https://protomaps.com).
- Application code is MIT-licensed, inherited from FlockHopper. See [LICENSE](LICENSE).
