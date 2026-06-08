# Self-hosting the basemap tiles

The map reads its vector basemap from a single **PMTiles** archive over HTTP
range requests — no tile server required. Host one file on object storage
(Cloudflare R2) and point the app at it.

Fonts (glyphs) and sprites are served from Protomaps' public assets host by
default, so you only need to host the tile data yourself.

## 1. Build the Canada extract

Requires the [`go-pmtiles`](https://github.com/protomaps/go-pmtiles/releases) CLI
(`brew install pmtiles`, or download a release binary).

```bash
# Find the latest planet build at https://maps.protomaps.com/builds/
# (a dated file like https://build.protomaps.com/20260607.pmtiles)
./scripts/build-canada-pmtiles.sh https://build.protomaps.com/<DATE>.pmtiles
```

The extract uses HTTP range requests, so it downloads only the bytes inside the
Canada bbox — not the ~126 GB planet. Detail level is controlled by `--maxzoom`
in the script:

| maxzoom | approx size | notes |
|--------:|------------:|-------|
| 12      | ~0.4 GB     | major roads only — too coarse |
| 13      | ~1.3 GB     | city/town streets; minor streets via overzoom |
| 14      | ~5 GB       | most streets + labels at street level (good default) |
| 15      | ~20 GB      | full detail — large/slow |

Verify the result:

```bash
pmtiles show canada.pmtiles    # check bounds, min/max zoom, tile count
```

## 2. Upload to Cloudflare R2

```bash
wrangler r2 bucket create alpr-tiles-canada
wrangler r2 object put alpr-tiles-canada/canada.pmtiles --file=canada.pmtiles --remote
```

For files larger than ~300 MB, use the R2 dashboard uploader or `rclone`
(R2 is S3-compatible) for reliable multipart uploads.

Then, in the bucket settings:

- **Custom domain:** attach one (e.g. `tiles.yourdomain.ca`) for a clean,
  cached, public URL.
- **CORS policy** (PMTiles needs cross-origin range requests):

```json
[{
  "AllowedOrigins": ["https://panopti.ca", "https://maps.panopti.ca"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["range", "if-match"],
  "ExposeHeaders": ["etag", "content-length", "content-range", "accept-ranges"]
}]
```

## 3. Point the app at it

Set the environment variable in **Cloudflare Pages → Settings → Environment
variables**, then trigger a fresh deploy (it is a build-time variable):

```
VITE_PMTILES_URL = https://tiles.yourdomain.ca/canada.pmtiles
```

Until this is set, the app falls back to `VITE_TILES_URL` (the legacy tile
server), so nothing breaks in the meantime.

## Configuration reference

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_PMTILES_URL` | PMTiles basemap URL (preferred) | _(unset → use VITE_TILES_URL)_ |
| `VITE_TILES_URL` | Legacy z/x/y tile server (fallback) | `https://tiles.dontgetflocked.com` |
| `VITE_BASEMAP_ASSETS_URL` | Fonts (glyphs) + sprites base URL | `https://protomaps.github.io/basemaps-assets` |

To self-host fonts/sprites too, copy the Protomaps `fonts/` and `sprites/v4/`
assets into your bucket and set `VITE_BASEMAP_ASSETS_URL` to your domain.
