<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="branding/panoptica-dark.svg">
    <img src="branding/panoptica-light.svg" alt="panopti.ca" width="360">
  </picture>
</p>

Named after the prototypical metaphor for mass surveillance, Jeremy Bentham's [Panopticon](https://www.ebsco.com/research-starters/history/panopticon), this project is a Canada-focused map of automatic licence plate readers (ALPRs) — with an optional layer for government-operated CCTV — built on
crowdsourced [OpenStreetMap](https://www.openstreetmap.org) data. It shows where
ALPR / Flock-style surveillance cameras are deployed across Canada so people can
see them.

**Live:** https://maps.panopti.ca/

This is a localized fork of **[DeFlock Maps / FlockHopper](https://github.com/FoggedLens/deflockhopper_maps)**.
The US-only features (route avoidance, density analysis, agency network) are hidden;
this project ships the camera map for Canada. 

A big shoutout to **[Fogged Lens](https://github.com/FoggedLens)** as well as the various contributors who built upon their work for their efforts on the **original [DeFlock](https://github.com/FoggedLens/deflock) project**!

## How it works

- **Camera data** comes from OpenStreetMap, within Canada:
  - **ALPRs** — nodes tagged `surveillance:type=ALPR`.
  - **Government CCTV** — `surveillance:type=camera` cameras that look
    government-operated (`operator:type=government`, a recognizable government
    operator name, or a traffic-zone camera), labelled `brand=Government CCTV`.
    See [panopti.ca/report](https://panopti.ca/report) for how to add one.

  Both are bundled as [`public/cameras-ca.json`](public/cameras-ca.json) and
  refreshed nightly (see below) — no live database.
- **ALPR / CCTV toggle.** The map is ALPR-first: it opens on ALPRs only, with a
  *Show* control to switch to **Both** or **government CCTV** alone. ALPRs render
  in blue and government CCTV in amber (a colourblind-safe pair).
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
Overpass API for ALPR and government-CCTV nodes in Canada and writes
`public/cameras-ca.json`. The ALPR count has its own sanity floor so a partial
Overpass response can never overwrite good data.
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
