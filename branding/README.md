# Branding — panopti.ca

Logo concept for the Canadian ALPR map, built around the **panopticon** (the
all-seeing eye) and the `.ca` domain hack. The `o` is an eye; the `a` in `.ca`
is the Canadian maple leaf.

## Assets

| File | Use |
|------|-----|
| `panoptica-light.svg` | Wordmark for light backgrounds (dark text) |
| `panoptica-dark.svg` | Wordmark for dark backgrounds (e.g. the app header) |
| `favicon-eye.svg` | Square app icon / favicon — the eye alone |

All wordmark glyphs are **outlined paths** (Space Grotesk Bold), so the files are
self-contained and render identically without the font installed.

## Palette

| Token | Hex | Where |
|-------|-----|-------|
| Oxblood red | `#8C1C2E` | `.ca`, maple leaf, eye pupil |
| Slate (pan) | `#14181F` light theme · `#F5F7FA` dark theme | `pan` |
| Slate (opti)| `#3A4451` light theme · `#97A4B6` dark theme | `opti`, eye outline |
| Iris | `#14181F` | eye iris (always dark for contrast on the white sclera) |

The `pan`/`opti` two-tone is a nod to the Greek roots (*pan* = "all", *optikos*
= "seeing"); the eye's red pupil rhymes with the red `.ca`.

## Provenance

- Typeface: **Space Grotesk** Bold (already bundled in `public/fonts/`).
- Maple leaf: the official Canadian flag leaf geometry (public domain).
- Generated with a fontTools + cairosvg script (kept in the working dir, not
  yet committed); ping if you want the generator version-controlled here.
