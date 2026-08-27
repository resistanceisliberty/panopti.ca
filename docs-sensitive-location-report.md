# Sensitive-Location Proximity Report — Canadian ALPR / Government CCTV Camera Map

Generated 2026-08-11T19:30:42.677Z. Cross-references the panopti.ca crowdsourced Canadian camera map against OpenStreetMap (OSM) points of interest, screening for placements that could be *perceived* as targeting a specific business, institution, or activity (place of worship, reproductive-health clinic, gun club, immigration lawyer, cannabis retailer, supervised consumption site, shelter, LGBTQ venue, diplomatic mission, cultural/religious centre).

**This report answers a question about ALPRs specifically. Government CCTV and brand-unclassified cameras are broken out into their own clearly separate sections below, included for completeness only because the source dataset contains both device types. Counts for ALPR, CCTV, and unclassified cameras are never combined anywhere in this report.**

---

## 0. Top-line counts (never blended)

| | Cameras | Tier 1 (strongest) | Tier 2 | Tier 3 (context, 100-250m) |
|---|---:|---:|---:|---:|
| **ALPR (confirmed)** | 506 | 18 | 21 | 113 |
| **Government CCTV** | 821 | 34 | 142 | 779 |
| **Unclassified (brand not tagged)** | 79 | 3 | 2 | 30 |
| Total cameras | 1406 | | | |

Sensitive-category POIs matched in OSM within camera-cluster search areas: **5,998 unique POIs** across 10 categories (place of worship 3,519; social facility 1,428; cannabis retail 624; diplomatic mission 228; LGBTQ venue/friendly 89; immigration-matched lawyer 35; cultural/religious community centre 34; reproductive/sexual health 25; gun shop/range/club 17; supervised consumption site 1).

---

## 1. Limitations — read this before the findings

This analysis feeds advocacy about real institutions. It is PERCEPTION evidence, not evidence of intent, and every number below has known gaps. Read the caveats for a category before treating a "finding" in it as meaningful.

**General**
- **Proximity is not intent.** A camera near a POI, even one plausibly aimed at it, shows what a passerby could perceive — nothing here demonstrates why the camera is actually there, what it records, who can access the footage, or how long it's kept.
- **Camera positions are crowdsourced OSM data**, mapped by volunteers over time (some nodes years old, some added this week — see `osmTimestamp` per camera). Position accuracy is only as good as whoever surveyed it.
- **Direction data is sparse**: only 630 of 1,406 cameras nationally (45%) carry any `direction` tag. Most cameras have no recorded field of view, so most findings land in Tier 2 (proximity confirmed, aim unconfirmed) rather than Tier 1.
- **The ALPR/CCTV/unclassified split is inferred, not verified.** This report classifies by the OSM `brand` tag: `brand = "Government CCTVs"` → CCTV; `brand` = a named vendor (Flock Safety, Genetec, Axis, Dahua, etc.) → ALPR; `brand` absent (79 cameras, mostly police-operated — York Regional Police, Waterloo Regional Police, Sault Ste. Marie Police, OPP) → **unclassified**. The panopti.ca app's own UI defaults these 79 into its "ALPR" filter view as a display convenience, but nothing here confirms their actual hardware — so this report keeps them in their own bucket rather than guessing them into ALPR or CCTV.
- **OSM POI completeness varies sharply by category** — see below. A "0 found" or "none found within the mapped data" result throughout this report means *none found in OSM's current coverage of that category*, not proof that no such placement exists.

**Per-category caveats**
- *Place of worship* — OSM's most complete category here (3,519 nationally: 2,951 Christian, 161 Muslim, 113 Jewish, 68 Buddhist, 56 Hindu, 30 Sikh, plus smaller faiths). High confidence the POI itself exists and is correctly typed. But churches are also simply everywhere in Canada, especially in small towns where a church sits on or near almost every main intersection — treat isolated single findings here as weak evidence absent a direction match or repeated pattern.
- *Immigration lawyers* — **OSM has no specialty tag for "immigration law."** This report can only string-match office=lawyer names against /immigration|réfugié|refugee|newcomer/i. Any immigration-focused firm without one of those words literally in its business name (e.g., "Smith & Associates") is invisible to this method. Treat the 35 matches found as a floor, not a census, and treat "no immigration lawyer found near camera X" as uninformative.
- *Abortion / reproductive-health clinics* — some providers are known to be deliberately left untagged or vaguely tagged in OSM for safety reasons; this is a documented pattern in the OSM community. Absence here is especially unreliable for this category. The task's literal spec regex used the bare word "planning" to catch "family planning" clinics; tested against the live dataset that produced ~20 false positives (financial-planning firms, a municipal planning department, an urban-planning consultancy — see script comment). This report uses "family planning" instead. The clinics that did match (25, after removing false positives) include names like "Morgentaler Clinic," "Clinic 554," and several fertility/sexual-health clinics — see Section 3/4 for locations.
- *Supervised consumption sites* — only **one** OSM node nationally matched this category ("Overdose Prevention Society"), and it is more than 250m from every mapped camera. OSM coverage of this category is evidently extremely sparse in Canada; this number should not be read as "there is only one such site in the country."
- *Gun shops/ranges/clubs* — moderately well tagged (shop=weapons/hunting, sport=shooting, leisure=shooting_range); 17 found nationally, sample inspected and all are genuine (gun clubs, shooting ranges, weapons/hunting retailers) — no false positives detected.
- *Cultural/religious community centres* — name-matched only (islamic/masjid/mosqu/synagog/jewish/sikh/hindu/cultural). Sample inspected clean (Jewish community centres, Islamic centres, various ethnic cultural centres) — but this method will miss centres not carrying one of those words in their English name, so it undercounts.
- *LGBTQ venues* — mixes two very different signal strengths and this report keeps them visibly distinct: a dedicated LGBTQ venue/community-centre tag (`lgbtq=primary`) or a Pride-named venue, versus a merely "LGBTQ-friendly"-tagged business (`lgbtq=welcome`) that is not itself an LGBTQ institution. One tag value, `lgbtq=no` (a venue explicitly marking itself *not* LGBTQ-oriented — found on a sports-bar restaurant), was excluded as a false positive.
- *Diplomatic missions* — very well tagged (embassies/consulates are almost always precisely mapped with country + mission-type tags); 228 found, high confidence. See the Ottawa Sussex Drive note in Section 4 — this category produces the single largest apparent "cluster" in the whole dataset, and it has an obvious, non-suspicious explanation (Canada's government concentrated its foreign-mission district there; any camera in that district will be near a dozen embassies by simple geography).
- *Social facility (task's "shelters" category)* — `amenity=social_facility` in OSM covers **far more than shelters**: of 1,428 national matches, 745 are tagged `social_facility:for=senior` (elder-care/retirement homes) and 356 carry no `for=` subtype at all. Only a minority are tagged for the populations the original question is actually about — homeless (70), immigrants/migrants (19), drug-addicted (13), women (8+), refugees, or youth. This report always shows the `social_facility:for=` subtype directly next to each finding so this distinction is never hidden inside a blended count.

**Data collection**: Overpass queries were batched per geographic camera-cluster (103 clusters, single-linkage grouping with a 5km link threshold, boxes padded 500m) — never per-camera, per the requirement to be polite to the API. All 103/103 cluster queries completed successfully with 0 permanent failures, across three mirrors (overpass-api.de primary, overpass.kumi.systems and overpass.private.coffee as fallback) with exponential backoff on rate-limiting.

---

## 2. Method

1. **Cameras**: fetched live from `https://maps.panopti.ca/cameras-ca.json` — 1,406 cameras nationally as of this run.
2. **Classification**: see limitations above. ALPR = 506, Government CCTV = 821, unclassified = 79.
3. **Clustering**: single-linkage clustering of all cameras (grid-bucketed haversine, 5km link threshold) → 103 geographic clusters (largest: Montreal, 459 cameras; Greater Toronto Area, 367 cameras; Metro Vancouver, 55 cameras). Each cluster's bounding box padded 500m.
4. **POI query**: one Overpass query per cluster bbox, unioning all 10 category filters in a single request (place_of_worship; healthcare:speciality/name-matched reproductive health; shop=weapons/hunting + sport=shooting + leisure=shooting_range; office=lawyer name-matched to immigration terms; shop=cannabis; healthcare=centre/name-matched consumption sites; amenity=social_facility; lgbtq=* + name-matched pride/lgbtq venues (excluding lgbtq=no); office=diplomatic / diplomatic=*; community/social centres name-matched to cultural/religious terms).
5. **Correlation**: haversine distance from every camera to every POI within its cluster; kept if ≤250m.
6. **Tiering**:
   - **Tier 1** (strongest): distance ≤50m regardless of recorded direction, OR distance ≤100m AND the camera's recorded direction (bearing, ±60° cone; cameras can carry multiple direction values for multi-lens/intersection nodes — any one covering counts) includes the bearing toward the POI.
   - **Tier 2**: distance ≤100m, but direction is unrecorded or points more than 60° away from the POI.
   - **Tier 3**: 100-250m — context only, reported as category counts, with any camera showing 3+ distinct sensitive POIs called out as a cluster.
7. **Cluster-context check**: for every Tier 1/2 finding, this report also checks whether other cameras sit within 100m of it and also have the same POI in range — that pattern (several cameras a few metres apart, one for each direction of travel through an intersection) is a completely standard ALPR/CCTV deployment method and is flagged inline wherever it applies, rather than counted as N independent instances of "targeting."

Scripts (saved for re-run, paths in Section 7): `cluster.js`, `fetch-pois.js`, `correlate.js`, `gen-report.js` + `build-report.js`.

---

## 3. PART A — ALPR cameras (primary answer)

506 cameras nationally are classified as ALPR (a named camera/ALPR vendor tag, not the generic "Government CCTVs" brand). This section is the primary answer to "are any ALPR locations placed such that they could be perceived as targeting a sensitive business or activity."

### 3.1 Tier 1 — strongest findings (18)

**1. Peer 17** — Social facility
- Camera: `node/13451469501` — **ALPR**, brand: Flock Safety, operator: (operator not tagged)
- Camera coords: 44.248526, -76.948138 · direction(s): 0° · zone tag: traffic
- POI: Peer 17 (Social facility: unspecified)
- Distance: **15.7 m**, bearing camera→POI: 195°, direction coverage: **no-cover**
- Road/zone context: Tagged `surveillance:zone=traffic` — placed for road/intersection monitoring, which is weaker evidence of deliberate targeting of the specific POI than a camera tagged for e.g. `building`/`entrance` monitoring.
- Cluster context: 3 cameras within 100m of each other (likely one intersection/site) all have this POI within 250m — consistent with a standard multi-directional camera deployment covering the junction, not a single camera dedicated to this location.
- Links: [panopti.ca map](https://maps.panopti.ca/?lat=44.248526&lng=-76.948138&zoom=18) · [camera on OSM](https://www.openstreetmap.org/node/13451469501) · [POI on OSM](https://www.openstreetmap.org/node/6471141575)

**2. Boloud Cannabis** — Cannabis retail
- Camera: `node/13873534601` — **ALPR**, brand: Genetec, operator: City of Brampton
- Camera coords: 43.675468, -79.722547 · direction(s): 316° · zone tag: traffic
- POI: Boloud Cannabis (Cannabis retail: shop=cannabis)
- Distance: **34 m**, bearing camera→POI: 179°, direction coverage: **no-cover**
- Road/zone context: Tagged `surveillance:zone=traffic` — placed for road/intersection monitoring, which is weaker evidence of deliberate targeting of the specific POI than a camera tagged for e.g. `building`/`entrance` monitoring.
- Cluster context: 4 cameras within 100m of each other (likely one intersection/site) all have this POI within 250m — consistent with a standard multi-directional camera deployment covering the junction, not a single camera dedicated to this location.
- Links: [panopti.ca map](https://maps.panopti.ca/?lat=43.675468&lng=-79.722547&zoom=18) · [camera on OSM](https://www.openstreetmap.org/node/13873534601) · [POI on OSM](https://www.openstreetmap.org/node/9777744511)

**3. Peer 17** — Social facility
- Camera: `node/13451468401` — **ALPR**, brand: Flock Safety, operator: (operator not tagged)
- Camera coords: 44.248749, -76.948081 · direction(s): 190° · zone tag: traffic
- POI: Peer 17 (Social facility: unspecified)
- Distance: **40.9 m**, bearing camera→POI: 192°, direction coverage: **no-cover**
- Road/zone context: Tagged `surveillance:zone=traffic` — placed for road/intersection monitoring, which is weaker evidence of deliberate targeting of the specific POI than a camera tagged for e.g. `building`/`entrance` monitoring.
- Cluster context: 3 cameras within 100m of each other (likely one intersection/site) all have this POI within 250m — consistent with a standard multi-directional camera deployment covering the junction, not a single camera dedicated to this location.
- Links: [panopti.ca map](https://maps.panopti.ca/?lat=44.248749&lng=-76.948081&zoom=18) · [camera on OSM](https://www.openstreetmap.org/node/13451468401) · [POI on OSM](https://www.openstreetmap.org/node/6471141575)

**4. First Regular Baptist Church** — Place of worship
- Camera: `node/14004677201` — **ALPR**, brand: Axis Communications, operator: Chatham-Kent Police Service
- Camera coords: 42.590754, -82.179693 · direction(s): 171° · zone tag: traffic
- POI: First Regular Baptist Church (Place of worship: christian)
- Distance: **49.3 m**, bearing camera→POI: 104°, direction coverage: **no-cover**
- Road/zone context: Tagged `surveillance:zone=traffic` — placed for road/intersection monitoring, which is weaker evidence of deliberate targeting of the specific POI than a camera tagged for e.g. `building`/`entrance` monitoring.
- Cluster context: 3 cameras within 100m of each other (likely one intersection/site) all have this POI within 250m — consistent with a standard multi-directional camera deployment covering the junction, not a single camera dedicated to this location.
- Links: [panopti.ca map](https://maps.panopti.ca/?lat=42.590754&lng=-82.179693&zoom=18) · [camera on OSM](https://www.openstreetmap.org/node/14004677201) · [POI on OSM](https://www.openstreetmap.org/way/750912518)

**5. First Regular Baptist Church** — Place of worship
- Camera: `node/14004667102` — **ALPR**, brand: Axis Communications, operator: Chatham-Kent Police Service
- Camera coords: 42.590760, -82.179693 · direction(s): 0° · zone tag: traffic
- POI: First Regular Baptist Church (Place of worship: christian)
- Distance: **49.5 m**, bearing camera→POI: 105°, direction coverage: **no-cover**
- Road/zone context: Tagged `surveillance:zone=traffic` — placed for road/intersection monitoring, which is weaker evidence of deliberate targeting of the specific POI than a camera tagged for e.g. `building`/`entrance` monitoring.
- Cluster context: 3 cameras within 100m of each other (likely one intersection/site) all have this POI within 250m — consistent with a standard multi-directional camera deployment covering the junction, not a single camera dedicated to this location.
- Links: [panopti.ca map](https://maps.panopti.ca/?lat=42.590760&lng=-82.179693&zoom=18) · [camera on OSM](https://www.openstreetmap.org/node/14004667102) · [POI on OSM](https://www.openstreetmap.org/way/750912518)

**6. Safe 'N Sound** — Social facility
- Camera: `node/13974765302` — **ALPR**, brand: Neology, Inc., operator: (operator not tagged)
- Camera coords: 44.564018, -80.940783 · direction(s): 51° · zone tag: traffic
- POI: Safe 'N Sound (Social facility: homeless)
- Distance: **53.8 m**, bearing camera→POI: 45°, direction coverage: **covers**
- Road/zone context: Tagged `surveillance:zone=traffic` — placed for road/intersection monitoring, which is weaker evidence of deliberate targeting of the specific POI than a camera tagged for e.g. `building`/`entrance` monitoring.
- Links: [panopti.ca map](https://maps.panopti.ca/?lat=44.564018&lng=-80.940783&zoom=18) · [camera on OSM](https://www.openstreetmap.org/node/13974765302) · [POI on OSM](https://www.openstreetmap.org/way/688262096)

**7. Christ Church United Church** — Place of worship
- Camera: `node/14004667102` — **ALPR**, brand: Axis Communications, operator: Chatham-Kent Police Service
- Camera coords: 42.590760, -82.179693 · direction(s): 0° · zone tag: traffic
- POI: Christ Church United Church (Place of worship: christian)
- Distance: **59.9 m**, bearing camera→POI: 335°, direction coverage: **covers**
- Road/zone context: Tagged `surveillance:zone=traffic` — placed for road/intersection monitoring, which is weaker evidence of deliberate targeting of the specific POI than a camera tagged for e.g. `building`/`entrance` monitoring.
- Cluster context: 3 cameras within 100m of each other (likely one intersection/site) all have this POI within 250m — consistent with a standard multi-directional camera deployment covering the junction, not a single camera dedicated to this location.
- Links: [panopti.ca map](https://maps.panopti.ca/?lat=42.590760&lng=-82.179693&zoom=18) · [camera on OSM](https://www.openstreetmap.org/node/14004667102) · [POI on OSM](https://www.openstreetmap.org/way/466740137)

**8. Boloud Cannabis** — Cannabis retail
- Camera: `node/13873525201` — **ALPR**, brand: Genetec, operator: City of Brampton
- Camera coords: 43.675725, -79.722448 · direction(s): 221° · zone tag: traffic
- POI: Boloud Cannabis (Cannabis retail: shop=cannabis)
- Distance: **63 m**, bearing camera→POI: 187°, direction coverage: **covers**
- Road/zone context: Tagged `surveillance:zone=traffic` — placed for road/intersection monitoring, which is weaker evidence of deliberate targeting of the specific POI than a camera tagged for e.g. `building`/`entrance` monitoring.
- Cluster context: 4 cameras within 100m of each other (likely one intersection/site) all have this POI within 250m — consistent with a standard multi-directional camera deployment covering the junction, not a single camera dedicated to this location.
- Links: [panopti.ca map](https://maps.panopti.ca/?lat=43.675725&lng=-79.722448&zoom=18) · [camera on OSM](https://www.openstreetmap.org/node/13873525201) · [POI on OSM](https://www.openstreetmap.org/node/9777744511)

**9. (unnamed)** — Place of worship
- Camera: `node/13951991612` — **ALPR**, brand: RTX Corporation, operator: Ministry of Transportation of Ontario
- Camera coords: 43.833510, -79.428159 · direction(s): 5° · zone tag: traffic
- POI: (unnamed) (Place of worship: unspecified religion)
- Distance: **63 m**, bearing camera→POI: 65°, direction coverage: **covers**
- Road/zone context: Tagged `surveillance:zone=traffic` — placed for road/intersection monitoring, which is weaker evidence of deliberate targeting of the specific POI than a camera tagged for e.g. `building`/`entrance` monitoring.
- Cluster context: 2 cameras within 100m of each other (likely one intersection/site) all have this POI within 250m — consistent with a standard multi-directional camera deployment covering the junction, not a single camera dedicated to this location.
- Links: [panopti.ca map](https://maps.panopti.ca/?lat=43.833510&lng=-79.428159&zoom=18) · [camera on OSM](https://www.openstreetmap.org/node/13951991612) · [POI on OSM](https://www.openstreetmap.org/way/164881812)

**10. Grace United Church** — Place of worship
- Camera: `node/14005340501` — **ALPR**, brand: Genetec, operator: (operator not tagged)
- Camera coords: 43.688192, -79.763139 · direction(s): 55° · zone tag: traffic
- POI: Grace United Church (Place of worship: christian)
- Distance: **71.7 m**, bearing camera→POI: 3°, direction coverage: **covers**
- Road/zone context: Tagged `surveillance:zone=traffic` — placed for road/intersection monitoring, which is weaker evidence of deliberate targeting of the specific POI than a camera tagged for e.g. `building`/`entrance` monitoring.
- Cluster context: 5 cameras within 100m of each other (likely one intersection/site) all have this POI within 250m — consistent with a standard multi-directional camera deployment covering the junction, not a single camera dedicated to this location.
- Links: [panopti.ca map](https://maps.panopti.ca/?lat=43.688192&lng=-79.763139&zoom=18) · [camera on OSM](https://www.openstreetmap.org/node/14005340501) · [POI on OSM](https://www.openstreetmap.org/way/442912548)

**11. Grace United Church** — Place of worship
- Camera: `node/14005362501` — **ALPR**, brand: Axis Communications, operator: (operator not tagged)
- Camera coords: 43.688171, -79.763160 · direction(s): 306;167;0;236;99;0° · zone tag: traffic
- POI: Grace United Church (Place of worship: christian)
- Distance: **74.1 m**, bearing camera→POI: 5°, direction coverage: **covers**
- Road/zone context: Tagged `surveillance:zone=traffic` — placed for road/intersection monitoring, which is weaker evidence of deliberate targeting of the specific POI than a camera tagged for e.g. `building`/`entrance` monitoring.
- Cluster context: 5 cameras within 100m of each other (likely one intersection/site) all have this POI within 250m — consistent with a standard multi-directional camera deployment covering the junction, not a single camera dedicated to this location.
- Links: [panopti.ca map](https://maps.panopti.ca/?lat=43.688171&lng=-79.763160&zoom=18) · [camera on OSM](https://www.openstreetmap.org/node/14005362501) · [POI on OSM](https://www.openstreetmap.org/way/442912548)

**12. Casa Bliss Cannabis** — Cannabis retail
- Camera: `node/1802138239` — **ALPR**, brand: Dahua Technology, operator: Greater Sudbury Police Service
- Camera coords: 46.493021, -81.008358 · direction(s): 0;90° · zone tag: traffic
- POI: Casa Bliss Cannabis (Cannabis retail: shop=cannabis)
- Distance: **76.7 m**, bearing camera→POI: 54°, direction coverage: **covers**
- Road/zone context: Tagged `surveillance:zone=traffic` — placed for road/intersection monitoring, which is weaker evidence of deliberate targeting of the specific POI than a camera tagged for e.g. `building`/`entrance` monitoring.
- Links: [panopti.ca map](https://maps.panopti.ca/?lat=46.493021&lng=-81.008358&zoom=18) · [camera on OSM](https://www.openstreetmap.org/node/1802138239) · [POI on OSM](https://www.openstreetmap.org/node/13123900379)

**13. First Regular Baptist Church** — Place of worship
- Camera: `node/14004677801` — **ALPR**, brand: Axis Communications, operator: Chatham-Kent Police Service
- Camera coords: 42.590032, -82.179546 · direction(s): 272;4;82;183° · zone tag: traffic
- POI: First Regular Baptist Church (Place of worship: christian)
- Distance: **77.2 m**, bearing camera→POI: 28°, direction coverage: **covers**
- Road/zone context: Tagged `surveillance:zone=traffic` — placed for road/intersection monitoring, which is weaker evidence of deliberate targeting of the specific POI than a camera tagged for e.g. `building`/`entrance` monitoring.
- Cluster context: 3 cameras within 100m of each other (likely one intersection/site) all have this POI within 250m — consistent with a standard multi-directional camera deployment covering the junction, not a single camera dedicated to this location.
- Links: [panopti.ca map](https://maps.panopti.ca/?lat=42.590032&lng=-82.179546&zoom=18) · [camera on OSM](https://www.openstreetmap.org/node/14004677801) · [POI on OSM](https://www.openstreetmap.org/way/750912518)

**14. Boloud Cannabis** — Cannabis retail
- Camera: `node/13873543401` — **ALPR**, brand: Genetec, operator: City of Brampton
- Camera coords: 43.675862, -79.722796 · direction(s): 131° · zone tag: traffic
- POI: Boloud Cannabis (Cannabis retail: shop=cannabis)
- Distance: **80.5 m**, bearing camera→POI: 165°, direction coverage: **covers**
- Road/zone context: Tagged `surveillance:zone=traffic` — placed for road/intersection monitoring, which is weaker evidence of deliberate targeting of the specific POI than a camera tagged for e.g. `building`/`entrance` monitoring.
- Cluster context: 4 cameras within 100m of each other (likely one intersection/site) all have this POI within 250m — consistent with a standard multi-directional camera deployment covering the junction, not a single camera dedicated to this location.
- Links: [panopti.ca map](https://maps.panopti.ca/?lat=43.675862&lng=-79.722796&zoom=18) · [camera on OSM](https://www.openstreetmap.org/node/13873543401) · [POI on OSM](https://www.openstreetmap.org/node/9777744511)

**15. Grace United Church** — Place of worship
- Camera: `node/14005344001` — **ALPR**, brand: Genetec, operator: (operator not tagged)
- Camera coords: 43.688101, -79.763037 · direction(s): 336° · zone tag: traffic
- POI: Grace United Church (Place of worship: christian)
- Distance: **81.8 m**, bearing camera→POI: 357°, direction coverage: **covers**
- Road/zone context: Tagged `surveillance:zone=traffic` — placed for road/intersection monitoring, which is weaker evidence of deliberate targeting of the specific POI than a camera tagged for e.g. `building`/`entrance` monitoring.
- Cluster context: 5 cameras within 100m of each other (likely one intersection/site) all have this POI within 250m — consistent with a standard multi-directional camera deployment covering the junction, not a single camera dedicated to this location.
- Links: [panopti.ca map](https://maps.panopti.ca/?lat=43.688101&lng=-79.763037&zoom=18) · [camera on OSM](https://www.openstreetmap.org/node/14005344001) · [POI on OSM](https://www.openstreetmap.org/way/442912548)

**16. Thamesville United Church** — Place of worship
- Camera: `node/14005094101` — **ALPR**, brand: Axis Communications, operator: (operator not tagged)
- Camera coords: 42.551680, -81.977176 · direction(s): 48;122;213;307° · zone tag: traffic
- POI: Thamesville United Church (Place of worship: christian)
- Distance: **82.5 m**, bearing camera→POI: 205°, direction coverage: **covers**
- Road/zone context: Tagged `surveillance:zone=traffic` — placed for road/intersection monitoring, which is weaker evidence of deliberate targeting of the specific POI than a camera tagged for e.g. `building`/`entrance` monitoring.
- Cluster context: 3 cameras within 100m of each other (likely one intersection/site) all have this POI within 250m — consistent with a standard multi-directional camera deployment covering the junction, not a single camera dedicated to this location.
- Links: [panopti.ca map](https://maps.panopti.ca/?lat=42.551680&lng=-81.977176&zoom=18) · [camera on OSM](https://www.openstreetmap.org/node/14005094101) · [POI on OSM](https://www.openstreetmap.org/node/1907711779)

**17. Thamesville United Church** — Place of worship
- Camera: `node/14005093001` — **ALPR**, brand: Axis Communications, operator: (operator not tagged)
- Camera coords: 42.551770, -81.977139 · direction(s): 249° · zone tag: traffic
- POI: Thamesville United Church (Place of worship: christian)
- Distance: **92.9 m**, bearing camera→POI: 204°, direction coverage: **covers**
- Road/zone context: Tagged `surveillance:zone=traffic` — placed for road/intersection monitoring, which is weaker evidence of deliberate targeting of the specific POI than a camera tagged for e.g. `building`/`entrance` monitoring.
- Cluster context: 3 cameras within 100m of each other (likely one intersection/site) all have this POI within 250m — consistent with a standard multi-directional camera deployment covering the junction, not a single camera dedicated to this location.
- Links: [panopti.ca map](https://maps.panopti.ca/?lat=42.551770&lng=-81.977139&zoom=18) · [camera on OSM](https://www.openstreetmap.org/node/14005093001) · [POI on OSM](https://www.openstreetmap.org/node/1907711779)

**18. La lumière du monde** — Place of worship
- Camera: `node/13999265077` — **ALPR**, brand: Genetec, operator: Service de police de la Ville de Québec
- Camera coords: 46.806584, -71.227423 · direction(s): 45° · zone tag: traffic
- POI: La lumière du monde (Place of worship: christian)
- Distance: **97 m**, bearing camera→POI: 33°, direction coverage: **covers**
- Road/zone context: Tagged `surveillance:zone=traffic` — placed for road/intersection monitoring, which is weaker evidence of deliberate targeting of the specific POI than a camera tagged for e.g. `building`/`entrance` monitoring.
- Cluster context: 2 cameras within 100m of each other (likely one intersection/site) all have this POI within 250m — consistent with a standard multi-directional camera deployment covering the junction, not a single camera dedicated to this location.
- Links: [panopti.ca map](https://maps.panopti.ca/?lat=46.806584&lng=-71.227423&zoom=18) · [camera on OSM](https://www.openstreetmap.org/node/13999265077) · [POI on OSM](https://www.openstreetmap.org/node/345883676)

### 3.2 Tier 2 — table (21)

| Camera | Type | Brand | Operator | Direction | POI | Category | Dist (m) | Bearing | Dir. coverage | Links |
|---|---|---|---|---|---|---|---|---|---|---|
| `node/13873534602` | ALPR | Genetec | City of Brampton | 43° | Boloud Cannabis | Cannabis retail | 55.3 | 146° | no-cover | [map](https://maps.panopti.ca/?lat=43.675575&lng=-79.722924&zoom=18) / [cam](https://www.openstreetmap.org/node/13873534602) / [poi](https://www.openstreetmap.org/node/9777744511) ⚠️ cluster |
| `node/13897504202` | ALPR | Genetec | City of Brampton | 136° | Canna Cabana | Cannabis retail | 58.8 | 13° | no-cover | [map](https://maps.panopti.ca/?lat=43.743764&lng=-79.695908&zoom=18) / [cam](https://www.openstreetmap.org/node/13897504202) / [poi](https://www.openstreetmap.org/node/12810761430) ⚠️ cluster |
| `node/14004677201` | ALPR | Axis Communications | Chatham-Kent Police Service | 171° | Christ Church United Church | Place of worship | 60.6 | 336° | no-cover | [map](https://maps.panopti.ca/?lat=42.590754&lng=-82.179693&zoom=18) / [cam](https://www.openstreetmap.org/node/14004677201) / [poi](https://www.openstreetmap.org/way/466740137) ⚠️ cluster |
| `node/2832913943` | ALPR | Genetec | (operator not tagged) | 270° | Peel Pentecostal Tabernacle | Place of worship | 62.5 | 75° | no-cover | [map](https://maps.panopti.ca/?lat=43.764214&lng=-79.770689&zoom=18) / [cam](https://www.openstreetmap.org/node/2832913943) / [poi](https://www.openstreetmap.org/way/443834790) ⚠️ cluster |
| `node/13104298614` | ALPR | Dahua Technology | Greater Sudbury Police Service | 15° | Saint-Jean-de-Brébeuf | Place of worship | 62.7 | 296° | no-cover | [map](https://maps.panopti.ca/?lat=46.501940&lng=-80.986984&zoom=18) / [cam](https://www.openstreetmap.org/node/13104298614) / [poi](https://www.openstreetmap.org/way/220476192) |
| `node/13714781013` | ALPR | Dahua Technology | Greater Sudbury Police Service | 270° | New Life Christian Centre | Place of worship | 66.3 | 68° | no-cover | [map](https://maps.panopti.ca/?lat=46.565357&lng=-81.174157&zoom=18) / [cam](https://www.openstreetmap.org/node/13714781013) / [poi](https://www.openstreetmap.org/way/1160763506) ⚠️ cluster |
| `node/13384369601` | ALPR | Genetec | University of British Columbia | 335° | Hillel House | Place of worship | 66.6 | 257° | no-cover | [map](https://maps.panopti.ca/?lat=49.268759&lng=-123.250446&zoom=18) / [cam](https://www.openstreetmap.org/node/13384369601) / [poi](https://www.openstreetmap.org/way/99205665) ⚠️ cluster |
| `node/13384360703` | ALPR | Genetec | University of British Columbia | 149° | Hillel House | Place of worship | 66.7 | 258° | no-cover | [map](https://maps.panopti.ca/?lat=49.268745&lng=-123.250440&zoom=18) / [cam](https://www.openstreetmap.org/node/13384360703) / [poi](https://www.openstreetmap.org/way/99205665) ⚠️ cluster |
| `node/14005339201` | ALPR | Genetec | (operator not tagged) | 145° | Grace United Church | Place of worship | 66.8 | 353° | no-cover | [map](https://maps.panopti.ca/?lat=43.688239&lng=-79.762982&zoom=18) / [cam](https://www.openstreetmap.org/node/14005339201) / [poi](https://www.openstreetmap.org/way/442912548) ⚠️ cluster |
| `node/14005343501` | ALPR | Genetec | (operator not tagged) | 219° | Grace United Church | Place of worship | 74.9 | 349° | no-cover | [map](https://maps.panopti.ca/?lat=43.688174&lng=-79.762912&zoom=18) / [cam](https://www.openstreetmap.org/node/14005343501) / [poi](https://www.openstreetmap.org/way/442912548) ⚠️ cluster |
| `node/13384360702` | ALPR | Genetec | University of British Columbia | 223° | Hillel House | Place of worship | 76.4 | 284° | no-cover | [map](https://maps.panopti.ca/?lat=49.268454&lng=-123.250317&zoom=18) / [cam](https://www.openstreetmap.org/node/13384360702) / [poi](https://www.openstreetmap.org/way/99205665) ⚠️ cluster |
| `node/13897497402` | ALPR | Genetec | City of Brampton | 219° | Canna Cabana | Cannabis retail | 76.9 | 346° | no-cover | [map](https://maps.panopti.ca/?lat=43.743608&lng=-79.695519&zoom=18) / [cam](https://www.openstreetmap.org/node/13897497402) / [poi](https://www.openstreetmap.org/node/12810761430) ⚠️ cluster |
| `node/13974769537` | ALPR | Neology, Inc. | (operator not tagged) | 215° | (unnamed) | Place of worship | 77.3 | 152° | no-cover | [map](https://maps.panopti.ca/?lat=44.565585&lng=-80.945653&zoom=18) / [cam](https://www.openstreetmap.org/node/13974769537) / [poi](https://www.openstreetmap.org/way/113215477) |
| `node/13927771086` | ALPR | Axon Enterprise | York Regional Police | 340° | Truth Tabernacle | Place of worship | 79.1 | 211° | no-cover | [map](https://maps.panopti.ca/?lat=43.851425&lng=-79.254348&zoom=18) / [cam](https://www.openstreetmap.org/node/13927771086) / [poi](https://www.openstreetmap.org/way/231934049) |
| `node/13990562943` | ALPR | Verkada | Waterloo Regional Police Service | none tagged | Bethel Chapel | Place of worship | 83.1 | 27° | unknown | [map](https://maps.panopti.ca/?lat=43.465662&lng=-80.519072&zoom=18) / [cam](https://www.openstreetmap.org/node/13990562943) / [poi](https://www.openstreetmap.org/way/157647721) |
| `node/2832919564` | ALPR | Genetec | (operator not tagged) | 180° | Peel Pentecostal Tabernacle | Place of worship | 86.8 | 97° | no-cover | [map](https://maps.panopti.ca/?lat=43.764454&lng=-79.771011&zoom=18) / [cam](https://www.openstreetmap.org/node/2832919564) / [poi](https://www.openstreetmap.org/way/443834790) ⚠️ cluster |
| `node/13451467601` | ALPR | Flock Safety | (operator not tagged) | 14° | Peer 17 | Social facility | 89.2 | 228° | no-cover | [map](https://maps.panopti.ca/?lat=44.248922&lng=-76.947349&zoom=18) / [cam](https://www.openstreetmap.org/node/13451467601) / [poi](https://www.openstreetmap.org/node/6471141575) ⚠️ cluster |
| `node/2832913940` | ALPR | Genetec | (operator not tagged) | 1° | Peel Pentecostal Tabernacle | Place of worship | 89.5 | 62° | no-cover | [map](https://maps.panopti.ca/?lat=43.763978&lng=-79.770918&zoom=18) / [cam](https://www.openstreetmap.org/node/2832913940) / [poi](https://www.openstreetmap.org/way/443834790) ⚠️ cluster |
| `node/13451469901` | ALPR | Flock Safety | (operator not tagged) | 193° | Peer 17 | Social facility | 91.8 | 70° | no-cover | [map](https://maps.panopti.ca/?lat=44.248102&lng=-76.949268&zoom=18) / [cam](https://www.openstreetmap.org/node/13451469901) / [poi](https://www.openstreetmap.org/node/6471141575) |
| `node/14005093501` | ALPR | Axis Communications | (operator not tagged) | 119° | Thamesville United Church | Place of worship | 93.6 | 205° | no-cover | [map](https://maps.panopti.ca/?lat=42.551772&lng=-81.977123&zoom=18) / [cam](https://www.openstreetmap.org/node/14005093501) / [poi](https://www.openstreetmap.org/node/1907711779) ⚠️ cluster |
| `node/13990562942` | ALPR | Verkada | Waterloo Regional Police Service | none tagged | Uptown Herb | Cannabis retail | 99.4 | 209° | unknown | [map](https://maps.panopti.ca/?lat=43.467801&lng=-80.521853&zoom=18) / [cam](https://www.openstreetmap.org/node/13990562942) / [poi](https://www.openstreetmap.org/node/1626379707) |

⚠️ cluster = flagged by the cluster-context check in Section 2.7 (multiple cameras within 100m of each other near the same POI — standard multi-directional deployment, not single-camera targeting).

### 3.3 Tier 3 — context summary (113 camera-POI pairs, 100-250m)

- Place of worship: 69 camera-POI pairs (100-250m)
- Social facility: 23 camera-POI pairs (100-250m)
- Cannabis retail: 19 camera-POI pairs (100-250m)
- Immigration-related lawyer (name-matched): 2 camera-POI pairs (100-250m)

**Cameras with 3+ distinct sensitive POIs in the 100-250m band** (14):

- `node/14004677801` (Chatham-Kent Police Service, [map](https://maps.panopti.ca/?lat=42.590032&lng=-82.179546&zoom=18)): Christ Church United Church (Place of worship, 140.4m); (unnamed) (Place of worship, 177.9m); Evangel Tabernacle (Place of worship, 185.6m); Saint Michael Church (Place of worship, 205.7m)
- `node/13873592101` (City of Brampton, [map](https://maps.panopti.ca/?lat=43.656241&lng=-79.743561&zoom=18)): Trinity Tower (Social facility, 172.1m); Hope Tower (Social facility, 212.1m); CrossPoint Christian Reformed Church (Place of worship, 238.4m); Ebenezer Centre (Social facility, 240.6m)
- `node/13873591801` (City of Brampton, [map](https://maps.panopti.ca/?lat=43.656499&lng=-79.743433&zoom=18)): Trinity Tower (Social facility, 194.1m); CrossPoint Christian Reformed Church (Place of worship, 208m); Star Immigration (Immigration-related lawyer (name-matched), 222.6m); Hope Tower (Social facility, 239.7m)
- `node/13999265076` (Service de police de la Ville de Québec, [map](https://maps.panopti.ca/?lat=46.806530&lng=-71.227703&zoom=18)): La lumière du monde (Place of worship, 114.6m); Centre Bouddhiste Toushita (Place of worship, 174.1m); Les Missionaires d'Afrique “Pères Blancs” (Place of worship, 238.1m)
- `node/13428850801` ((operator not tagged), [map](https://maps.panopti.ca/?lat=44.248627&lng=-76.952062&zoom=18)): Trinity United Church (Place of worship, 115m); Grace United Church (Place of worship, 137.5m); St. Patrick's Catholic Church (Place of worship, 240.7m)
- `node/13974800301` ((operator not tagged), [map](https://maps.panopti.ca/?lat=44.563623&lng=-80.944817&zoom=18)): Hannah Walker Place (Social facility, 115.4m); John Joseph Place (Social facility, 142.9m); (unnamed) (Place of worship, 152.7m)
- `node/13427761001` (Ontario Provincial Police, [map](https://maps.panopti.ca/?lat=44.248003&lng=-76.951057&zoom=18)): Trinity United Church (Place of worship, 154.7m); Grace United Church (Place of worship, 202.4m); Peer 17 (Social facility, 232.6m)
- `node/14005094101` ((operator not tagged), [map](https://maps.panopti.ca/?lat=42.551680&lng=-81.977176&zoom=18)): Thamesville Baptist Church (Place of worship, 164.5m); Saint James Presbyterian Church (Place of worship, 179.5m); Saint Paul's Church (Place of worship, 181.3m)
- `node/14005093001` ((operator not tagged), [map](https://maps.panopti.ca/?lat=42.551770&lng=-81.977139&zoom=18)): Thamesville Baptist Church (Place of worship, 167.2m); Saint James Presbyterian Church (Place of worship, 169.5m); Saint Paul's Church (Place of worship, 191.3m)
- `node/14005093501` ((operator not tagged), [map](https://maps.panopti.ca/?lat=42.551772&lng=-81.977123&zoom=18)): Thamesville Baptist Church (Place of worship, 168.5m); Saint James Presbyterian Church (Place of worship, 168.6m); Saint Paul's Church (Place of worship, 191.5m)
- `node/13974771705` ((operator not tagged), [map](https://maps.panopti.ca/?lat=44.567540&lng=-80.946033&zoom=18)): British Methodist Episcopal Church (Place of worship, 173.4m); Maple View (Social facility, 226.4m); (unnamed) (Place of worship, 241.5m)
- `node/13873591802` (City of Brampton, [map](https://maps.panopti.ca/?lat=43.656367&lng=-79.743993&zoom=18)): Trinity Tower (Social facility, 201.9m); Hope Tower (Social facility, 232.6m); CrossPoint Christian Reformed Church (Place of worship, 238.1m)
- `node/13873592102` (City of Brampton, [map](https://maps.panopti.ca/?lat=43.656682&lng=-79.743885&zoom=18)): CrossPoint Christian Reformed Church (Place of worship, 203m); Trinity Tower (Social facility, 227.5m); Star Immigration (Immigration-related lawyer (name-matched), 235.7m)
- `node/13427176801` ((operator not tagged), [map](https://maps.panopti.ca/?lat=44.247352&lng=-76.950673&zoom=18)): Peer 17 (Social facility, 229.2m); Trinity United Church (Place of worship, 229.6m); Grace United Church (Place of worship, 245.8m)

### 3.4 Categories with zero ALPR findings

At Tier 1/2 (≤100m), these categories produced **no ALPR findings at all** (may still have Tier 3 / 100-250m context hits): Reproductive/sexual health, Gun shop/range/club, Immigration-related lawyer (name-matched), Supervised consumption site, LGBTQ venue/friendly, Diplomatic mission, Cultural/religious community centre.

At every tier (≤250m), these categories produced **none found within the mapped data** for ALPR cameras specifically: Reproductive/sexual health, Gun shop/range/club, Supervised consumption site, LGBTQ venue/friendly, Diplomatic mission, Cultural/religious community centre.

---

## 4. PART B — Government CCTV (secondary — included for completeness)

The mapped dataset also contains 821 generic government traffic/surveillance CCTV cameras (`brand = "Government CCTVs"`), which are **not** ALPRs. They're screened below for completeness because the source dataset contains both device types, but the original question is specifically about ALPRs — Section 3 above is the primary answer.

**Notable pattern — Ottawa's Sussex Drive diplomatic corridor**: 9 of the Tier 1 CCTV findings and 40 of the Tier 2 CCTV findings are diplomatic missions clustered around City of Ottawa CCTV cameras in the Sussex Drive/Rockcliffe embassy district. This has an obvious non-suspicious explanation: Canada's federal government concentrated dozens of foreign missions in a few blocks there, so any camera in that district is geometrically close to a dozen-plus embassies regardless of which one (if any) it's meant to cover. This report lists them individually below for completeness, but flags this context so the volume isn't misread as evidence of a security apparatus fixated on any single mission.

### 4.1 Tier 1 (34)

| Camera | Operator | Brand | Direction | POI | Category | Detail | Dist (m) | Dir. coverage | Links |
|---|---|---|---|---|---|---|---:|---|---|
| `node/14039777556` | City of Ottawa | Government CCTVs | none tagged | Bytown Budzz | Cannabis retail | shop=cannabis | 10.6 | unknown | [map](https://maps.panopti.ca/?lat=45.415432&lng=-75.696540&zoom=18) / [cam](https://www.openstreetmap.org/node/14039777556) / [poi](https://www.openstreetmap.org/node/9740092719) |
| `node/29794113` | Ville de Montréal | Government CCTVs | none tagged | SQDC | Cannabis retail | shop=cannabis | 19.3 | unknown | [map](https://maps.panopti.ca/?lat=45.523040&lng=-73.592797&zoom=18) / [cam](https://www.openstreetmap.org/node/29794113) / [poi](https://www.openstreetmap.org/node/1569436804) |
| `node/13628635182` | (operator not tagged) | Government CCTVs | none tagged | Consulate General of Viet Nam | Diplomatic mission | consulate | 21 | unknown | [map](https://maps.panopti.ca/?lat=49.280779&lng=-123.118731&zoom=18) / [cam](https://www.openstreetmap.org/node/13628635182) / [poi](https://www.openstreetmap.org/node/3648071641) |
| `node/5051749569` | Ville de Montréal | Government CCTVs | none tagged | SQDC | Cannabis retail | shop=cannabis | 23.7 | unknown | [map](https://maps.panopti.ca/?lat=45.568107&lng=-73.653389&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749569) / [poi](https://www.openstreetmap.org/node/10929126624) |
| `node/5051749522` | Ville de Montréal | Government CCTVs | none tagged | Église Restaurée de Jésus Christ | Place of worship | christian | 23.9 | unknown | [map](https://maps.panopti.ca/?lat=45.546507&lng=-73.586250&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749522) / [poi](https://www.openstreetmap.org/node/11198319482) |
| `node/5051749284` | Ville de Montréal | Government CCTVs | none tagged | Église la Cité de David | Place of worship | christian | 24.8 | unknown | [map](https://maps.panopti.ca/?lat=45.543159&lng=-73.596666&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749284) / [poi](https://www.openstreetmap.org/node/10897771311) |
| `node/4606504531` | City of Windsor | Government CCTVs | none tagged | First Baptist Church | Place of worship | christian | 25.4 | unknown | [map](https://maps.panopti.ca/?lat=42.315347&lng=-83.030374&zoom=18) / [cam](https://www.openstreetmap.org/node/4606504531) / [poi](https://www.openstreetmap.org/way/787808878) |
| `node/29796790` | Ville de Montréal | Government CCTVs | none tagged | La Résidence Fulford | Social facility | senior | 28.6 | unknown | [map](https://maps.panopti.ca/?lat=45.495037&lng=-73.577838&zoom=18) / [cam](https://www.openstreetmap.org/node/29796790) / [poi](https://www.openstreetmap.org/node/7530214415) |
| `node/31699862` | Ville de Montréal | Government CCTVs | none tagged | Résidence Shepphard et James Victoria | Social facility | senior | 29.2 | unknown | [map](https://maps.panopti.ca/?lat=45.492354&lng=-73.633124&zoom=18) / [cam](https://www.openstreetmap.org/node/31699862) / [poi](https://www.openstreetmap.org/node/7523233991) |
| `node/14039777556` | City of Ottawa | Government CCTVs | none tagged | Islam Care Centre | Place of worship | muslim | 31.9 | unknown | [map](https://maps.panopti.ca/?lat=45.415432&lng=-75.696540&zoom=18) / [cam](https://www.openstreetmap.org/node/14039777556) / [poi](https://www.openstreetmap.org/node/4781941921) |
| `node/12657410249` | McGill University | Government CCTVs | none tagged | Midnight's Kitchen | Social facility | unspecified | 32.1 | unknown | [map](https://maps.panopti.ca/?lat=45.503512&lng=-73.577693&zoom=18) / [cam](https://www.openstreetmap.org/node/12657410249) / [poi](https://www.openstreetmap.org/node/3358766747) |
| `node/14077869346` | City of Ottawa | Government CCTVs | none tagged | High Commission of the Bahamas | Diplomatic mission | embassy | 32.7 | unknown | [map](https://maps.panopti.ca/?lat=45.420557&lng=-75.700639&zoom=18) / [cam](https://www.openstreetmap.org/node/14077869346) / [poi](https://www.openstreetmap.org/node/8713387496) |
| `node/5051749640` | Ville de Montréal | Government CCTVs | none tagged | Café Mission Keurig | Social facility | unspecified | 34.3 | unknown | [map](https://maps.panopti.ca/?lat=45.506897&lng=-73.557280&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749640) / [poi](https://www.openstreetmap.org/node/13844944428) |
| `node/1764306743` | Ville de Montréal | Government CCTVs | none tagged | Mt. Zion | Place of worship | christian | 34.8 | unknown | [map](https://maps.panopti.ca/?lat=45.479237&lng=-73.558815&zoom=18) / [cam](https://www.openstreetmap.org/node/1764306743) / [poi](https://www.openstreetmap.org/way/348438035) |
| `node/12657410456` | McGill University | Government CCTVs | none tagged | Consulate General of Pakistan | Diplomatic mission | consulate | 37.4 | unknown | [map](https://maps.panopti.ca/?lat=45.502655&lng=-73.576754&zoom=18) / [cam](https://www.openstreetmap.org/node/12657410456) / [poi](https://www.openstreetmap.org/node/8613281634) |
| `node/13733700701` | City of London | Government CCTVs | none tagged | Egerton Street Baptist Church | Place of worship | christian | 38.6 | unknown | [map](https://maps.panopti.ca/?lat=42.980338&lng=-81.212174&zoom=18) / [cam](https://www.openstreetmap.org/node/13733700701) / [poi](https://www.openstreetmap.org/way/135778556) |
| `node/14077869346` | City of Ottawa | Government CCTVs | none tagged | Embassy of Ecuador | Diplomatic mission | embassy | 39.4 | unknown | [map](https://maps.panopti.ca/?lat=45.420557&lng=-75.700639&zoom=18) / [cam](https://www.openstreetmap.org/node/14077869346) / [poi](https://www.openstreetmap.org/node/8715422939) |
| `node/13993527148` | Toronto Police Service | Government CCTVs | 0° | Fogtown Flower | Cannabis retail | shop=cannabis | 40.3 | no-cover | [map](https://maps.panopti.ca/?lat=43.758368&lng=-79.409947&zoom=18) / [cam](https://www.openstreetmap.org/node/13993527148) / [poi](https://www.openstreetmap.org/node/10656055547) |
| `node/14077858751` | City of Ottawa | Government CCTVs | none tagged | Australian High Commission | Diplomatic mission | embassy | 40.5 | unknown | [map](https://maps.panopti.ca/?lat=45.421379&lng=-75.698730&zoom=18) / [cam](https://www.openstreetmap.org/node/14077858751) / [poi](https://www.openstreetmap.org/node/8637888926) |
| `node/5051748746` | Ville de Montréal | Government CCTVs | none tagged | Hungarian United Church | Place of worship | christian | 40.8 | unknown | [map](https://maps.panopti.ca/?lat=45.524218&lng=-73.625887&zoom=18) / [cam](https://www.openstreetmap.org/node/5051748746) / [poi](https://www.openstreetmap.org/way/385532609) |
| `node/5051745538` | Ville de Montréal | Government CCTVs | none tagged | Resilience Montreal | Social facility | homeless | 41 | unknown | [map](https://maps.panopti.ca/?lat=45.489305&lng=-73.584504&zoom=18) / [cam](https://www.openstreetmap.org/node/5051745538) / [poi](https://www.openstreetmap.org/way/340583697) |
| `node/14077896802` | City of Ottawa | Government CCTVs | none tagged | Embassy of Israel | Diplomatic mission | embassy | 41.1 | unknown | [map](https://maps.panopti.ca/?lat=45.420887&lng=-75.698266&zoom=18) / [cam](https://www.openstreetmap.org/node/14077896802) / [poi](https://www.openstreetmap.org/node/8715937797) |
| `node/5051749236` | Ville de Montréal | Government CCTVs | none tagged | Consulate of Tunisia | Diplomatic mission | consulate | 42 | unknown | [map](https://maps.panopti.ca/?lat=45.503177&lng=-73.569807&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749236) / [poi](https://www.openstreetmap.org/node/13169526050) |
| `node/9688019395` | (operator not tagged) | Government CCTVs | none tagged | Ontario Works | Social facility | unspecified | 43.4 | unknown | [map](https://maps.panopti.ca/?lat=43.252881&lng=-79.859773&zoom=18) / [cam](https://www.openstreetmap.org/node/9688019395) / [poi](https://www.openstreetmap.org/node/13850662912) |
| `node/13626065526` | (operator not tagged) | Government CCTVs | none tagged | First Baptist Church | Place of worship | christian | 45.3 | unknown | [map](https://maps.panopti.ca/?lat=49.281242&lng=-123.125849&zoom=18) / [cam](https://www.openstreetmap.org/node/13626065526) / [poi](https://www.openstreetmap.org/node/10177186944) |
| `node/29237095` | Ville de Montréal | Government CCTVs | none tagged | Congregtation Zeirai Dath Vedaath | Place of worship | jewish | 46.3 | unknown | [map](https://maps.panopti.ca/?lat=45.494362&lng=-73.637631&zoom=18) / [cam](https://www.openstreetmap.org/node/29237095) / [poi](https://www.openstreetmap.org/node/9194916996) |
| `node/14077858751` | City of Ottawa | Government CCTVs | none tagged | Embassy of Israel | Diplomatic mission | embassy | 46.9 | unknown | [map](https://maps.panopti.ca/?lat=45.421379&lng=-75.698730&zoom=18) / [cam](https://www.openstreetmap.org/node/14077858751) / [poi](https://www.openstreetmap.org/node/8715937797) |
| `node/5051748786` | Ville de Montréal | Government CCTVs | none tagged | Paroisse Saint-Antoine-Marie-Claret | Place of worship | christian | 47.9 | unknown | [map](https://maps.panopti.ca/?lat=45.580764&lng=-73.651607&zoom=18) / [cam](https://www.openstreetmap.org/node/5051748786) / [poi](https://www.openstreetmap.org/node/13355904058) |
| `node/14077896802` | City of Ottawa | Government CCTVs | none tagged | Australian High Commission | Diplomatic mission | embassy | 48.5 | unknown | [map](https://maps.panopti.ca/?lat=45.420887&lng=-75.698266&zoom=18) / [cam](https://www.openstreetmap.org/node/14077896802) / [poi](https://www.openstreetmap.org/node/8637888926) |
| `node/5051749648` | Ville de Montréal | Government CCTVs | none tagged | Saint Michael's and Saint Anthony's | Place of worship | christian | 48.7 | unknown | [map](https://maps.panopti.ca/?lat=45.524629&lng=-73.599979&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749648) / [poi](https://www.openstreetmap.org/way/353024298) |
| `node/5051749242` | Ville de Montréal | Government CCTVs | none tagged | Église Baptiste Évangélique de Rosemont | Place of worship | christian | 48.8 | unknown | [map](https://maps.panopti.ca/?lat=45.549520&lng=-73.568250&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749242) / [poi](https://www.openstreetmap.org/way/360357893) |
| `node/438303209` | Ville de Montréal | Government CCTVs | none tagged | Notre-Dame de la Consolata | Place of worship | christian | 49.2 | unknown | [map](https://maps.panopti.ca/?lat=45.547942&lng=-73.607055&zoom=18) / [cam](https://www.openstreetmap.org/node/438303209) / [poi](https://www.openstreetmap.org/way/364737434) |
| `node/12657410273` | McGill University | Government CCTVs | none tagged | Midnight's Kitchen | Social facility | unspecified | 49.4 | unknown | [map](https://maps.panopti.ca/?lat=45.503159&lng=-73.577542&zoom=18) / [cam](https://www.openstreetmap.org/node/12657410273) / [poi](https://www.openstreetmap.org/node/3358766747) |
| `node/3862334592` | City of Winnipeg | Government CCTVs | 0° | Quest Inn | Social facility | unspecified | 74.4 | covers | [map](https://maps.panopti.ca/?lat=49.894428&lng=-97.146687&zoom=18) / [cam](https://www.openstreetmap.org/node/3862334592) / [poi](https://www.openstreetmap.org/way/243990298) |

### 4.2 Tier 2 (142)

Split for readability: the Ottawa diplomatic-corridor cluster explained above (40 rows, all diplomatic missions, all City of Ottawa cameras), then everything else (102 rows).

<details><summary>Ottawa diplomatic-corridor Tier 2 rows (40) — click to expand</summary>

| Camera | Type | Brand | Operator | Direction | POI | Category | Dist (m) | Bearing | Dir. coverage | Links |
|---|---|---|---|---|---|---|---|---|---|---|
| `node/14077772873` | CCTV | Government CCTVs | City of Ottawa | none tagged | Embassy of Latvia | Diplomatic mission | 50.7 | 273° | unknown | [map](https://maps.panopti.ca/?lat=45.418826&lng=-75.704953&zoom=18) / [cam](https://www.openstreetmap.org/node/14077772873) / [poi](https://www.openstreetmap.org/node/8715937801) ⚠️ cluster |
| `node/14077859888` | CCTV | Government CCTVs | City of Ottawa | none tagged | Embassy of Belgium | Diplomatic mission | 50.7 | 82° | unknown | [map](https://maps.panopti.ca/?lat=45.418048&lng=-75.704462&zoom=18) / [cam](https://www.openstreetmap.org/node/14077859888) / [poi](https://www.openstreetmap.org/node/7508424279) ⚠️ cluster |
| `node/14077838453` | CCTV | Government CCTVs | City of Ottawa | none tagged | Embassy of Jordan | Diplomatic mission | 51.1 | 332° | unknown | [map](https://maps.panopti.ca/?lat=45.416266&lng=-75.708720&zoom=18) / [cam](https://www.openstreetmap.org/node/14077838453) / [poi](https://www.openstreetmap.org/node/8715937802) |
| `node/14077772873` | CCTV | Government CCTVs | City of Ottawa | none tagged | Embassy of Chad | Diplomatic mission | 55.3 | 270° | unknown | [map](https://maps.panopti.ca/?lat=45.418826&lng=-75.704953&zoom=18) / [cam](https://www.openstreetmap.org/node/14077772873) / [poi](https://www.openstreetmap.org/node/8715937800) ⚠️ cluster |
| `node/14077875480` | CCTV | Government CCTVs | City of Ottawa | none tagged | Embassy of Uruguay | Diplomatic mission | 57 | 109° | unknown | [map](https://maps.panopti.ca/?lat=45.422187&lng=-75.696949&zoom=18) / [cam](https://www.openstreetmap.org/node/14077875480) / [poi](https://www.openstreetmap.org/node/8729016561) |
| `node/5051749649` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Consulat Général d'Algérie à Montréal | Diplomatic mission | 58.7 | 324° | unknown | [map](https://maps.panopti.ca/?lat=45.511114&lng=-73.570035&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749649) / [poi](https://www.openstreetmap.org/node/936010421) |
| `node/14077772873` | CCTV | Government CCTVs | City of Ottawa | none tagged | High Commission of Uganda | Diplomatic mission | 60.1 | 267° | unknown | [map](https://maps.panopti.ca/?lat=45.418826&lng=-75.704953&zoom=18) / [cam](https://www.openstreetmap.org/node/14077772873) / [poi](https://www.openstreetmap.org/node/8715937799) ⚠️ cluster |
| `node/14077772873` | CCTV | Government CCTVs | City of Ottawa | none tagged | High Commission of Jamaica | Diplomatic mission | 63.1 | 249° | unknown | [map](https://maps.panopti.ca/?lat=45.418826&lng=-75.704953&zoom=18) / [cam](https://www.openstreetmap.org/node/14077772873) / [poi](https://www.openstreetmap.org/node/8715937798) ⚠️ cluster |
| `node/14077772873` | CCTV | Government CCTVs | City of Ottawa | none tagged | Bangladesh High Commission | Diplomatic mission | 64.4 | 266° | unknown | [map](https://maps.panopti.ca/?lat=45.418826&lng=-75.704953&zoom=18) / [cam](https://www.openstreetmap.org/node/14077772873) / [poi](https://www.openstreetmap.org/node/8613597898) ⚠️ cluster |
| `node/14077870117` | CCTV | Government CCTVs | City of Ottawa | none tagged | Embassy of Costa Rica | Diplomatic mission | 64.6 | 360° | unknown | [map](https://maps.panopti.ca/?lat=45.418173&lng=-75.706444&zoom=18) / [cam](https://www.openstreetmap.org/node/14077870117) / [poi](https://www.openstreetmap.org/node/8715139024) ⚠️ cluster |
| `node/5051748756` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Consulat de la République Tchèque | Diplomatic mission | 67.7 | 285° | unknown | [map](https://maps.panopti.ca/?lat=45.504036&lng=-73.571569&zoom=18) / [cam](https://www.openstreetmap.org/node/5051748756) / [poi](https://www.openstreetmap.org/node/5493928931) |
| `node/14077875480` | CCTV | Government CCTVs | City of Ottawa | none tagged | Embassy of Finland | Diplomatic mission | 68.2 | 98° | unknown | [map](https://maps.panopti.ca/?lat=45.422187&lng=-75.696949&zoom=18) / [cam](https://www.openstreetmap.org/node/14077875480) / [poi](https://www.openstreetmap.org/node/2396528809) |
| `node/14077772873` | CCTV | Government CCTVs | City of Ottawa | none tagged | High Commission of Bangladesh | Diplomatic mission | 69.2 | 265° | unknown | [map](https://maps.panopti.ca/?lat=45.418826&lng=-75.704953&zoom=18) / [cam](https://www.openstreetmap.org/node/14077772873) / [poi](https://www.openstreetmap.org/node/8713387497) ⚠️ cluster |
| `node/14077896802` | CCTV | Government CCTVs | City of Ottawa | none tagged | Embassy of Peru | Diplomatic mission | 73.2 | 76° | unknown | [map](https://maps.panopti.ca/?lat=45.420887&lng=-75.698266&zoom=18) / [cam](https://www.openstreetmap.org/node/14077896802) / [poi](https://www.openstreetmap.org/node/8715839628) ⚠️ cluster |
| `node/14077896802` | CCTV | Government CCTVs | City of Ottawa | none tagged | Embassy of the Dominican Republic | Diplomatic mission | 75.4 | 78° | unknown | [map](https://maps.panopti.ca/?lat=45.420887&lng=-75.698266&zoom=18) / [cam](https://www.openstreetmap.org/node/14077896802) / [poi](https://www.openstreetmap.org/node/8715839629) ⚠️ cluster |
| `node/3431833804` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Consulat général des États-Unis à Montréal | Diplomatic mission | 75.9 | 194° | unknown | [map](https://maps.panopti.ca/?lat=45.500020&lng=-73.572905&zoom=18) / [cam](https://www.openstreetmap.org/node/3431833804) / [poi](https://www.openstreetmap.org/node/12678070169) |
| `node/14077870117` | CCTV | Government CCTVs | City of Ottawa | none tagged | High Commission of Jamaica | Diplomatic mission | 76.2 | 49° | unknown | [map](https://maps.panopti.ca/?lat=45.418173&lng=-75.706444&zoom=18) / [cam](https://www.openstreetmap.org/node/14077870117) / [poi](https://www.openstreetmap.org/node/8715937798) ⚠️ cluster |
| `node/29796963` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Consulate General of Pakistan | Diplomatic mission | 76.9 | 329° | unknown | [map](https://maps.panopti.ca/?lat=45.501823&lng=-73.576577&zoom=18) / [cam](https://www.openstreetmap.org/node/29796963) / [poi](https://www.openstreetmap.org/node/8613281634) ⚠️ cluster |
| `node/5051749262` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Consulat Général de Cuba à Montréal | Diplomatic mission | 77.8 | 293° | unknown | [map](https://maps.panopti.ca/?lat=45.480568&lng=-73.622883&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749262) / [poi](https://www.openstreetmap.org/node/9301693952) ⚠️ cluster |
| `node/14077896802` | CCTV | Government CCTVs | City of Ottawa | none tagged | Embassy of Albania | Diplomatic mission | 78.7 | 75° | unknown | [map](https://maps.panopti.ca/?lat=45.420887&lng=-75.698266&zoom=18) / [cam](https://www.openstreetmap.org/node/14077896802) / [poi](https://www.openstreetmap.org/node/8712232005) ⚠️ cluster |
| `node/14077870117` | CCTV | Government CCTVs | City of Ottawa | none tagged | High Commission of Bangladesh | Diplomatic mission | 81.3 | 36° | unknown | [map](https://maps.panopti.ca/?lat=45.418173&lng=-75.706444&zoom=18) / [cam](https://www.openstreetmap.org/node/14077870117) / [poi](https://www.openstreetmap.org/node/8713387497) ⚠️ cluster |
| `node/14077875480` | CCTV | Government CCTVs | City of Ottawa | none tagged | Embassy of Mexico | Diplomatic mission | 81.8 | 232° | unknown | [map](https://maps.panopti.ca/?lat=45.422187&lng=-75.696949&zoom=18) / [cam](https://www.openstreetmap.org/node/14077875480) / [poi](https://www.openstreetmap.org/node/2384638581) |
| `node/14077870117` | CCTV | Government CCTVs | City of Ottawa | none tagged | Embassy of Nepal in Ottawa | Diplomatic mission | 82.9 | 222° | unknown | [map](https://maps.panopti.ca/?lat=45.418173&lng=-75.706444&zoom=18) / [cam](https://www.openstreetmap.org/node/14077870117) / [poi](https://www.openstreetmap.org/way/231259956) ⚠️ cluster |
| `node/14077885603` | CCTV | Government CCTVs | City of Ottawa | none tagged | Embassy of Nepal in Ottawa | Diplomatic mission | 83.5 | 283° | unknown | [map](https://maps.panopti.ca/?lat=45.417453&lng=-75.706113&zoom=18) / [cam](https://www.openstreetmap.org/node/14077885603) / [poi](https://www.openstreetmap.org/way/231259956) ⚠️ cluster |
| `node/14077896802` | CCTV | Government CCTVs | City of Ottawa | none tagged | Embassy of Honduras | Diplomatic mission | 83.8 | 77° | unknown | [map](https://maps.panopti.ca/?lat=45.420887&lng=-75.698266&zoom=18) / [cam](https://www.openstreetmap.org/node/14077896802) / [poi](https://www.openstreetmap.org/node/8715839625) ⚠️ cluster |
| `node/14077858751` | CCTV | Government CCTVs | City of Ottawa | none tagged | Embassy of Mexico | Diplomatic mission | 84.3 | 62° | unknown | [map](https://maps.panopti.ca/?lat=45.421379&lng=-75.698730&zoom=18) / [cam](https://www.openstreetmap.org/node/14077858751) / [poi](https://www.openstreetmap.org/node/2384638581) ⚠️ cluster |
| `node/14077870117` | CCTV | Government CCTVs | City of Ottawa | none tagged | Bangladesh High Commission | Diplomatic mission | 85.7 | 37° | unknown | [map](https://maps.panopti.ca/?lat=45.418173&lng=-75.706444&zoom=18) / [cam](https://www.openstreetmap.org/node/14077870117) / [poi](https://www.openstreetmap.org/node/8613597898) ⚠️ cluster |
| `node/208710038` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Consulat Général de la République de Pologne | Diplomatic mission | 87.9 | 210° | unknown | [map](https://maps.panopti.ca/?lat=45.501234&lng=-73.582000&zoom=18) / [cam](https://www.openstreetmap.org/node/208710038) / [poi](https://www.openstreetmap.org/node/13140172711) |
| `node/14077896802` | CCTV | Government CCTVs | City of Ottawa | none tagged | Embassy of North Macedonia | Diplomatic mission | 89.2 | 72° | unknown | [map](https://maps.panopti.ca/?lat=45.420887&lng=-75.698266&zoom=18) / [cam](https://www.openstreetmap.org/node/14077896802) / [poi](https://www.openstreetmap.org/node/6282952280) ⚠️ cluster |
| `node/14077870117` | CCTV | Government CCTVs | City of Ottawa | none tagged | High Commission of Uganda | Diplomatic mission | 89.8 | 39° | unknown | [map](https://maps.panopti.ca/?lat=45.418173&lng=-75.706444&zoom=18) / [cam](https://www.openstreetmap.org/node/14077870117) / [poi](https://www.openstreetmap.org/node/8715937799) ⚠️ cluster |
| `node/12657410273` | CCTV | Government CCTVs | McGill University | none tagged | Consulate General of Pakistan | Diplomatic mission | 90 | 157° | unknown | [map](https://maps.panopti.ca/?lat=45.503159&lng=-73.577542&zoom=18) / [cam](https://www.openstreetmap.org/node/12657410273) / [poi](https://www.openstreetmap.org/node/8613281634) ⚠️ cluster |
| `node/14077875480` | CCTV | Government CCTVs | City of Ottawa | none tagged | Embassy of Haiti | Diplomatic mission | 91 | 101° | unknown | [map](https://maps.panopti.ca/?lat=45.422187&lng=-75.696949&zoom=18) / [cam](https://www.openstreetmap.org/node/14077875480) / [poi](https://www.openstreetmap.org/node/8715839624) |
| `node/12657410183` | CCTV | Government CCTVs | McGill University | none tagged | Consulate General of Pakistan | Diplomatic mission | 92.3 | 160° | unknown | [map](https://maps.panopti.ca/?lat=45.503193&lng=-73.577499&zoom=18) / [cam](https://www.openstreetmap.org/node/12657410183) / [poi](https://www.openstreetmap.org/node/8613281634) ⚠️ cluster |
| `node/14077859875` | CCTV | Government CCTVs | City of Ottawa | none tagged | High commission of Rwanda | Diplomatic mission | 93.5 | 129° | unknown | [map](https://maps.panopti.ca/?lat=45.419562&lng=-75.702931&zoom=18) / [cam](https://www.openstreetmap.org/node/14077859875) / [poi](https://www.openstreetmap.org/node/8728700807) |
| `node/14077870117` | CCTV | Government CCTVs | City of Ottawa | none tagged | Embassy of Chad | Diplomatic mission | 94.9 | 40° | unknown | [map](https://maps.panopti.ca/?lat=45.418173&lng=-75.706444&zoom=18) / [cam](https://www.openstreetmap.org/node/14077870117) / [poi](https://www.openstreetmap.org/node/8715937800) ⚠️ cluster |
| `node/14077896802` | CCTV | Government CCTVs | City of Ottawa | none tagged | High Commission of Lesotho | Diplomatic mission | 95.4 | 79° | unknown | [map](https://maps.panopti.ca/?lat=45.420887&lng=-75.698266&zoom=18) / [cam](https://www.openstreetmap.org/node/14077896802) / [poi](https://www.openstreetmap.org/node/8719713198) ⚠️ cluster |
| `node/12657410361` | CCTV | Government CCTVs | McGill University | none tagged | Consulate General of Pakistan | Diplomatic mission | 97.4 | 169° | unknown | [map](https://maps.panopti.ca/?lat=45.503275&lng=-73.577322&zoom=18) / [cam](https://www.openstreetmap.org/node/12657410361) / [poi](https://www.openstreetmap.org/node/8613281634) ⚠️ cluster |
| `node/5051749261` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Consulat Général de Cuba à Montréal | Diplomatic mission | 97.9 | 264° | unknown | [map](https://maps.panopti.ca/?lat=45.480932&lng=-73.622550&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749261) / [poi](https://www.openstreetmap.org/node/9301693952) ⚠️ cluster |
| `node/14077896802` | CCTV | Government CCTVs | City of Ottawa | none tagged | Embassy of Bolivia | Diplomatic mission | 99.8 | 72° | unknown | [map](https://maps.panopti.ca/?lat=45.420887&lng=-75.698266&zoom=18) / [cam](https://www.openstreetmap.org/node/14077896802) / [poi](https://www.openstreetmap.org/node/8615304087) ⚠️ cluster |
| `node/14077870117` | CCTV | Government CCTVs | City of Ottawa | none tagged | Embassy of Latvia | Diplomatic mission | 100 | 41° | unknown | [map](https://maps.panopti.ca/?lat=45.418173&lng=-75.706444&zoom=18) / [cam](https://www.openstreetmap.org/node/14077870117) / [poi](https://www.openstreetmap.org/node/8715937801) ⚠️ cluster |

</details>

**Everything else (non-diplomatic-corridor) Tier 2:**

| Camera | Type | Brand | Operator | Direction | POI | Category | Dist (m) | Bearing | Dir. coverage | Links |
|---|---|---|---|---|---|---|---|---|---|---|
| `node/12996011532` | CCTV | Government CCTVs | (operator not tagged) | none tagged | Family Services | Social facility | 50.1 | 260° | unknown | [map](https://maps.panopti.ca/?lat=49.262222&lng=-123.070260&zoom=18) / [cam](https://www.openstreetmap.org/node/12996011532) / [poi](https://www.openstreetmap.org/node/11747018279) |
| `node/12657410183` | CCTV | Government CCTVs | McGill University | none tagged | Midnight's Kitchen | Social facility | 50.4 | 297° | unknown | [map](https://maps.panopti.ca/?lat=45.503193&lng=-73.577499&zoom=18) / [cam](https://www.openstreetmap.org/node/12657410183) / [poi](https://www.openstreetmap.org/node/3358766747) ⚠️ cluster |
| `node/4606504534` | CCTV | Government CCTVs | City of Windsor | none tagged | St. Alphonsus Catholic Church | Place of worship | 50.6 | 206° | unknown | [map](https://maps.panopti.ca/?lat=42.316830&lng=-83.036195&zoom=18) / [cam](https://www.openstreetmap.org/node/4606504534) / [poi](https://www.openstreetmap.org/way/455058275) |
| `node/11512780134` | CCTV | Government CCTVs | City of Ottawa | none tagged | (unnamed) | Cannabis retail | 51 | 184° | unknown | [map](https://maps.panopti.ca/?lat=45.401258&lng=-75.624045&zoom=18) / [cam](https://www.openstreetmap.org/node/11512780134) / [poi](https://www.openstreetmap.org/node/5039208264) |
| `node/5051749262` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Résidence Vista | Social facility | 51.6 | 180° | unknown | [map](https://maps.panopti.ca/?lat=45.480568&lng=-73.622883&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749262) / [poi](https://www.openstreetmap.org/way/393597010) ⚠️ cluster |
| `node/12557753326` | CCTV | Government CCTVs | City of Ottawa | none tagged | Wavy | Cannabis retail | 51.8 | 119° | unknown | [map](https://maps.panopti.ca/?lat=45.447181&lng=-75.594271&zoom=18) / [cam](https://www.openstreetmap.org/node/12557753326) / [poi](https://www.openstreetmap.org/node/7870085124) |
| `node/5051749296` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Sanctuaire du Saint-Sacrement | Place of worship | 51.9 | 89° | unknown | [map](https://maps.panopti.ca/?lat=45.524982&lng=-73.581966&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749296) / [poi](https://www.openstreetmap.org/way/46867163) ⚠️ cluster |
| `node/29784714` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Taiba Mosque | Place of worship | 52.1 | 49° | unknown | [map](https://maps.panopti.ca/?lat=45.500857&lng=-73.632176&zoom=18) / [cam](https://www.openstreetmap.org/node/29784714) / [poi](https://www.openstreetmap.org/node/3115985296) |
| `node/13733700701` | CCTV | Government CCTVs | City of London | none tagged | Duc Quang Buddhist Centre | Place of worship | 52.6 | 83° | unknown | [map](https://maps.panopti.ca/?lat=42.980338&lng=-81.212174&zoom=18) / [cam](https://www.openstreetmap.org/node/13733700701) / [poi](https://www.openstreetmap.org/way/445392262) |
| `node/5051749287` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Saint-Édouard | Place of worship | 53.5 | 359° | unknown | [map](https://maps.panopti.ca/?lat=45.534048&lng=-73.605036&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749287) / [poi](https://www.openstreetmap.org/way/46866053) |
| `node/5051748722` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Église Adventiste du Septième Jour Lasalle New Life | Place of worship | 54.1 | 85° | unknown | [map](https://maps.panopti.ca/?lat=45.429220&lng=-73.608623&zoom=18) / [cam](https://www.openstreetmap.org/node/5051748722) / [poi](https://www.openstreetmap.org/way/681255643) |
| `node/13733661701` | CCTV | Government CCTVs | City of London | none tagged | Trinity Lutheran Church | Place of worship | 54.4 | 101° | unknown | [map](https://maps.panopti.ca/?lat=42.997681&lng=-81.245555&zoom=18) / [cam](https://www.openstreetmap.org/node/13733661701) / [poi](https://www.openstreetmap.org/way/140783858) |
| `node/13626065526` | CCTV | Government CCTVs | (operator not tagged) | none tagged | Saint Andrews Wesley Church | Place of worship | 54.5 | 270° | unknown | [map](https://maps.panopti.ca/?lat=49.281242&lng=-123.125849&zoom=18) / [cam](https://www.openstreetmap.org/node/13626065526) / [poi](https://www.openstreetmap.org/node/10177186948) ⚠️ cluster |
| `node/31777188` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Ō Salon | LGBTQ venue/friendly | 54.9 | 139° | unknown | [map](https://maps.panopti.ca/?lat=45.525285&lng=-73.585819&zoom=18) / [cam](https://www.openstreetmap.org/node/31777188) / [poi](https://www.openstreetmap.org/node/5937571630) |
| `node/14077869346` | CCTV | Government CCTVs | City of Ottawa | none tagged | Morgentaler Clinic | Reproductive/sexual health | 54.9 | 333° | unknown | [map](https://maps.panopti.ca/?lat=45.420557&lng=-75.700639&zoom=18) / [cam](https://www.openstreetmap.org/node/14077869346) / [poi](https://www.openstreetmap.org/node/5941722850) |
| `node/5051749601` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Kingdom Hall of Jehovah's Witnesses | Place of worship | 55.5 | 156° | unknown | [map](https://maps.panopti.ca/?lat=45.558835&lng=-73.598354&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749601) / [poi](https://www.openstreetmap.org/way/593523412) |
| `node/12996011532` | CCTV | Government CCTVs | (operator not tagged) | none tagged | WorkBC Vancouver Northeast | Social facility | 55.5 | 176° | unknown | [map](https://maps.panopti.ca/?lat=49.262222&lng=-123.070260&zoom=18) / [cam](https://www.openstreetmap.org/node/12996011532) / [poi](https://www.openstreetmap.org/node/2852238320) |
| `node/2812348403` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Manoir Gouin | Social facility | 55.7 | 153° | unknown | [map](https://maps.panopti.ca/?lat=45.529688&lng=-73.723316&zoom=18) / [cam](https://www.openstreetmap.org/node/2812348403) / [poi](https://www.openstreetmap.org/node/7538341846) |
| `node/5051748807` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Vent de l’Ouest | Social facility | 55.9 | 137° | unknown | [map](https://maps.panopti.ca/?lat=45.482296&lng=-73.862293&zoom=18) / [cam](https://www.openstreetmap.org/node/5051748807) / [poi](https://www.openstreetmap.org/node/7450262665) |
| `node/5051749277` | CCTV | Government CCTVs | Ville de Montréal | none tagged | L'asterisk | LGBTQ venue/friendly | 56 | 313° | unknown | [map](https://maps.panopti.ca/?lat=45.518128&lng=-73.558543&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749277) / [poi](https://www.openstreetmap.org/node/2422318992) |
| `node/5051749530` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Église Saint-Émile | Place of worship | 56.1 | 254° | unknown | [map](https://maps.panopti.ca/?lat=45.545954&lng=-73.556026&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749530) / [poi](https://www.openstreetmap.org/way/85931532) |
| `node/8105536683` | CCTV | Government CCTVs | City of Hamilton | 270° | Good Shepherd Note Dame House School | Social facility | 56.2 | 206° | no-cover | [map](https://maps.panopti.ca/?lat=43.260743&lng=-79.867009&zoom=18) / [cam](https://www.openstreetmap.org/node/8105536683) / [poi](https://www.openstreetmap.org/node/12879201988) |
| `node/5051749277` | CCTV | Government CCTVs | Ville de Montréal | none tagged | AlterHéros | LGBTQ venue/friendly | 57.8 | 321° | unknown | [map](https://maps.panopti.ca/?lat=45.518128&lng=-73.558543&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749277) / [poi](https://www.openstreetmap.org/node/6294517458) |
| `node/5051745535` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Prohibition | Cannabis retail | 58.2 | 319° | unknown | [map](https://maps.panopti.ca/?lat=45.481239&lng=-73.577968&zoom=18) / [cam](https://www.openstreetmap.org/node/5051745535) / [poi](https://www.openstreetmap.org/node/11248449969) |
| `node/5051745553` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Église orthodoxe roumaine de l'Annonciation | Place of worship | 59 | 164° | unknown | [map](https://maps.panopti.ca/?lat=45.548110&lng=-73.624662&zoom=18) / [cam](https://www.openstreetmap.org/node/5051745553) / [poi](https://www.openstreetmap.org/way/221929256) |
| `node/5051749295` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Sanctuaire du Saint-Sacrement | Place of worship | 59 | 87° | unknown | [map](https://maps.panopti.ca/?lat=45.524966&lng=-73.582055&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749295) / [poi](https://www.openstreetmap.org/way/46867163) ⚠️ cluster |
| `node/5051749577` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Église coréenne Sarang | Place of worship | 59.1 | 347° | unknown | [map](https://maps.panopti.ca/?lat=45.535120&lng=-73.565137&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749577) / [poi](https://www.openstreetmap.org/way/46866289) |
| `node/438303209` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Presbytère Notre-Dame de la Consolata | Place of worship | 59.5 | 191° | unknown | [map](https://maps.panopti.ca/?lat=45.547942&lng=-73.607055&zoom=18) / [cam](https://www.openstreetmap.org/node/438303209) / [poi](https://www.openstreetmap.org/way/1078369579) |
| `node/12996011532` | CCTV | Government CCTVs | (operator not tagged) | none tagged | Vancouver Language and Assessment Centre | Social facility | 59.8 | 176° | unknown | [map](https://maps.panopti.ca/?lat=49.262222&lng=-123.070260&zoom=18) / [cam](https://www.openstreetmap.org/node/12996011532) / [poi](https://www.openstreetmap.org/node/12560334723) |
| `node/13628635182` | CCTV | Government CCTVs | (operator not tagged) | none tagged | City Cannabis | Cannabis retail | 60 | 319° | unknown | [map](https://maps.panopti.ca/?lat=49.280779&lng=-123.118731&zoom=18) / [cam](https://www.openstreetmap.org/node/13628635182) / [poi](https://www.openstreetmap.org/node/8185452015) ⚠️ cluster |
| `node/12657410361` | CCTV | Government CCTVs | McGill University | none tagged | Midnight's Kitchen | Social facility | 60.2 | 283° | unknown | [map](https://maps.panopti.ca/?lat=45.503275&lng=-73.577322&zoom=18) / [cam](https://www.openstreetmap.org/node/12657410361) / [poi](https://www.openstreetmap.org/node/3358766747) ⚠️ cluster |
| `node/14027223349` | CCTV | Government CCTVs | [City of Winnipeg] | 0° | Mosaic Newcomer Family Resource Network | Social facility | 61.3 | 158° | no-cover | [map](https://maps.panopti.ca/?lat=49.896737&lng=-97.147971&zoom=18) / [cam](https://www.openstreetmap.org/node/14027223349) / [poi](https://www.openstreetmap.org/node/13565727652) |
| `node/5051748727` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Seena Cultural Centre | Cultural/religious community centre | 61.8 | 89° | unknown | [map](https://maps.panopti.ca/?lat=45.461501&lng=-73.624143&zoom=18) / [cam](https://www.openstreetmap.org/node/5051748727) / [poi](https://www.openstreetmap.org/node/7058688353) |
| `node/10096009026` | CCTV | Government CCTVs | (operator not tagged) | none tagged | Proline Shooters | Gun shop/range/club | 62 | 326° | unknown | [map](https://maps.panopti.ca/?lat=51.039210&lng=-114.029444&zoom=18) / [cam](https://www.openstreetmap.org/node/10096009026) / [poi](https://www.openstreetmap.org/node/10050109964) |
| `node/5051745585` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Sanctuaire du Saint-Sacrement | Place of worship | 62.4 | 167° | unknown | [map](https://maps.panopti.ca/?lat=45.525539&lng=-73.581475&zoom=18) / [cam](https://www.openstreetmap.org/node/5051745585) / [poi](https://www.openstreetmap.org/way/46867163) ⚠️ cluster |
| `node/5051749236` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Christ Church Anglican Cathedral | Place of worship | 62.9 | 339° | unknown | [map](https://maps.panopti.ca/?lat=45.503177&lng=-73.569807&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749236) / [poi](https://www.openstreetmap.org/way/20167895) |
| `node/213956983` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Saint-Arsène | Place of worship | 64.5 | 272° | unknown | [map](https://maps.panopti.ca/?lat=45.540901&lng=-73.608466&zoom=18) / [cam](https://www.openstreetmap.org/node/213956983) / [poi](https://www.openstreetmap.org/way/221929037) |
| `node/14077870117` | CCTV | Government CCTVs | City of Ottawa | none tagged | St. Peter's Evangelical Lutheran Church | Place of worship | 65.6 | 285° | unknown | [map](https://maps.panopti.ca/?lat=45.418173&lng=-75.706444&zoom=18) / [cam](https://www.openstreetmap.org/node/14077870117) / [poi](https://www.openstreetmap.org/way/68588692) ⚠️ cluster |
| `node/5051748750` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Centre d'hébergement Les Cèdres | Social facility | 67.4 | 349° | unknown | [map](https://maps.panopti.ca/?lat=45.516183&lng=-73.680113&zoom=18) / [cam](https://www.openstreetmap.org/node/5051748750) / [poi](https://www.openstreetmap.org/node/7402277912) ⚠️ cluster |
| `node/13168331150` | CCTV | Government CCTVs | City of Vancouver | none tagged | Trinity Tree Cannabis | Cannabis retail | 67.5 | 284° | unknown | [map](https://maps.panopti.ca/?lat=49.263826&lng=-123.209001&zoom=18) / [cam](https://www.openstreetmap.org/node/13168331150) / [poi](https://www.openstreetmap.org/node/7859417955) |
| `node/5051749225` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Résidence du Jardin Botanique | Social facility | 67.6 | 274° | unknown | [map](https://maps.panopti.ca/?lat=45.560682&lng=-73.573680&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749225) / [poi](https://www.openstreetmap.org/node/7533195114) |
| `node/5051749637` | CCTV | Government CCTVs | Ville de Montréal | none tagged | SQDC | Cannabis retail | 68 | 136° | unknown | [map](https://maps.panopti.ca/?lat=45.521812&lng=-73.578181&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749637) / [poi](https://www.openstreetmap.org/node/11972903976) |
| `node/9688019395` | CCTV | Government CCTVs | (operator not tagged) | none tagged | Social Planning & Research Council (SPRC) | Social facility | 69.6 | 48° | unknown | [map](https://maps.panopti.ca/?lat=43.252881&lng=-79.859773&zoom=18) / [cam](https://www.openstreetmap.org/node/9688019395) / [poi](https://www.openstreetmap.org/node/13821534601) |
| `node/5051745589` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Congregation Yetev Lev | Place of worship | 70.1 | 226° | unknown | [map](https://maps.panopti.ca/?lat=45.522207&lng=-73.602214&zoom=18) / [cam](https://www.openstreetmap.org/node/5051745589) / [poi](https://www.openstreetmap.org/way/354244758) |
| `node/12996011532` | CCTV | Government CCTVs | (operator not tagged) | none tagged | Masjid Omar Al-Farooq | Place of worship | 70.5 | 199° | unknown | [map](https://maps.panopti.ca/?lat=49.262222&lng=-123.070260&zoom=18) / [cam](https://www.openstreetmap.org/node/12996011532) / [poi](https://www.openstreetmap.org/way/292259770) |
| `node/29784714` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Église Biblique Baptiste Church | Place of worship | 70.9 | 221° | unknown | [map](https://maps.panopti.ca/?lat=45.500857&lng=-73.632176&zoom=18) / [cam](https://www.openstreetmap.org/node/29784714) / [poi](https://www.openstreetmap.org/way/390364789) |
| `node/5051745603` | CCTV | Government CCTVs | Ville de Montréal | none tagged | (unnamed) | Place of worship | 71.5 | 64° | unknown | [map](https://maps.panopti.ca/?lat=45.519619&lng=-73.595754&zoom=18) / [cam](https://www.openstreetmap.org/node/5051745603) / [poi](https://www.openstreetmap.org/way/46867686) |
| `node/12557753335` | CCTV | Government CCTVs | City of Ottawa | none tagged | Eglise De Dieu | Place of worship | 71.8 | 302° | unknown | [map](https://maps.panopti.ca/?lat=45.423590&lng=-75.630376&zoom=18) / [cam](https://www.openstreetmap.org/node/12557753335) / [poi](https://www.openstreetmap.org/way/484079233) |
| `node/97876448` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Centre d'hébergement de Saint-Henri | Social facility | 71.9 | 301° | unknown | [map](https://maps.panopti.ca/?lat=45.469324&lng=-73.593342&zoom=18) / [cam](https://www.openstreetmap.org/node/97876448) / [poi](https://www.openstreetmap.org/node/7556206865) |
| `node/5051745567` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Église Saint-Pierre Claver | Place of worship | 71.9 | 152° | unknown | [map](https://maps.panopti.ca/?lat=45.537470&lng=-73.577386&zoom=18) / [cam](https://www.openstreetmap.org/node/5051745567) / [poi](https://www.openstreetmap.org/way/46866076) |
| `node/5051745610` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Église de l'Immaculée-Conception | Place of worship | 72.1 | 11° | unknown | [map](https://maps.panopti.ca/?lat=45.530550&lng=-73.569497&zoom=18) / [cam](https://www.openstreetmap.org/node/5051745610) / [poi](https://www.openstreetmap.org/way/177383850) |
| `node/9688019395` | CCTV | Government CCTVs | (operator not tagged) | none tagged | Moon Beauty Co | LGBTQ venue/friendly | 72.1 | 331° | unknown | [map](https://maps.panopti.ca/?lat=43.252881&lng=-79.859773&zoom=18) / [cam](https://www.openstreetmap.org/node/9688019395) / [poi](https://www.openstreetmap.org/node/10862629616) |
| `node/13733706801` | CCTV | Government CCTVs | City of London | none tagged | Maple View Terrace | Social facility | 73 | 104° | unknown | [map](https://maps.panopti.ca/?lat=42.980257&lng=-81.242744&zoom=18) / [cam](https://www.openstreetmap.org/node/13733706801) / [poi](https://www.openstreetmap.org/way/119873505) ⚠️ cluster |
| `node/5051748748` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Elogia, Groupe Maurice | Social facility | 73.2 | 164° | unknown | [map](https://maps.panopti.ca/?lat=45.570497&lng=-73.550994&zoom=18) / [cam](https://www.openstreetmap.org/node/5051748748) / [poi](https://www.openstreetmap.org/way/46844531) |
| `node/5051749625` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Basilique Notre-Dame | Place of worship | 73.5 | 137° | unknown | [map](https://maps.panopti.ca/?lat=45.504927&lng=-73.556645&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749625) / [poi](https://www.openstreetmap.org/way/4320792) ⚠️ cluster |
| `node/26235235` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Studio MissFit Montréal | LGBTQ venue/friendly | 73.6 | 202° | unknown | [map](https://maps.panopti.ca/?lat=45.506304&lng=-73.566929&zoom=18) / [cam](https://www.openstreetmap.org/node/26235235) / [poi](https://www.openstreetmap.org/node/14078553302) |
| `node/5051749628` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Dans la Rue | Social facility | 73.6 | 195° | unknown | [map](https://maps.panopti.ca/?lat=45.525874&lng=-73.559422&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749628) / [poi](https://www.openstreetmap.org/node/4271031593) |
| `node/5051749636` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Centre Compassion de Montréal | Cannabis retail | 73.7 | 111° | unknown | [map](https://maps.panopti.ca/?lat=45.518016&lng=-73.581703&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749636) / [poi](https://www.openstreetmap.org/node/11265612664) |
| `node/13733705101` | CCTV | Government CCTVs | City of London | none tagged | Maple View Terrace | Social facility | 74.2 | 106° | unknown | [map](https://maps.panopti.ca/?lat=42.980272&lng=-81.242754&zoom=18) / [cam](https://www.openstreetmap.org/node/13733705101) / [poi](https://www.openstreetmap.org/way/119873505) ⚠️ cluster |
| `node/5051745581` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Midnight's Kitchen | Social facility | 74.8 | 156° | unknown | [map](https://maps.panopti.ca/?lat=45.504014&lng=-73.578468&zoom=18) / [cam](https://www.openstreetmap.org/node/5051745581) / [poi](https://www.openstreetmap.org/node/3358766747) ⚠️ cluster |
| `node/5051749623` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Église Saint-Enfant-Jésus | Place of worship | 75.5 | 78° | unknown | [map](https://maps.panopti.ca/?lat=45.639946&lng=-73.490247&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749623) / [poi](https://www.openstreetmap.org/way/78959681) |
| `node/5051749650` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Notre-Dame-de-Lourdes | Place of worship | 75.5 | 55° | unknown | [map](https://maps.panopti.ca/?lat=45.513728&lng=-73.560462&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749650) / [poi](https://www.openstreetmap.org/way/119612953) |
| `node/5051749629` | CCTV | Government CCTVs | Ville de Montréal | none tagged | CHSLD Providence Notre-Dame de Lourdes | Social facility | 75.7 | 143° | unknown | [map](https://maps.panopti.ca/?lat=45.550300&lng=-73.541226&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749629) / [poi](https://www.openstreetmap.org/way/46866476) |
| `node/13927584584` | CCTV | Government CCTVs | Barrie Police Service | none tagged | Salvation Army Barrie Bayside Mission Centre | Social facility | 76 | 188° | unknown | [map](https://maps.panopti.ca/?lat=44.389299&lng=-79.690116&zoom=18) / [cam](https://www.openstreetmap.org/node/13927584584) / [poi](https://www.openstreetmap.org/way/110479599) ⚠️ cluster |
| `node/5051748790` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Centre d'hébergement Champlain-de-Gouin | Social facility | 77 | 237° | unknown | [map](https://maps.panopti.ca/?lat=45.599958&lng=-73.639145&zoom=18) / [cam](https://www.openstreetmap.org/node/5051748790) / [poi](https://www.openstreetmap.org/way/792906751) |
| `node/5051748814` | CCTV | Government CCTVs | Ville de Montréal | none tagged | (unnamed) | Place of worship | 77.4 | 102° | unknown | [map](https://maps.panopti.ca/?lat=45.622811&lng=-73.603831&zoom=18) / [cam](https://www.openstreetmap.org/node/5051748814) / [poi](https://www.openstreetmap.org/way/371369792) |
| `node/9688019395` | CCTV | Government CCTVs | (operator not tagged) | none tagged | Access to Housing - ATH | Social facility | 77.6 | 71° | unknown | [map](https://maps.panopti.ca/?lat=43.252881&lng=-79.859773&zoom=18) / [cam](https://www.openstreetmap.org/node/9688019395) / [poi](https://www.openstreetmap.org/node/13821553601) |
| `node/9688019395` | CCTV | Government CCTVs | (operator not tagged) | none tagged | Housing Services | Social facility | 78.9 | 50° | unknown | [map](https://maps.panopti.ca/?lat=43.252881&lng=-79.859773&zoom=18) / [cam](https://www.openstreetmap.org/node/9688019395) / [poi](https://www.openstreetmap.org/node/13717260802) |
| `node/5051745607` | CCTV | Government CCTVs | Ville de Montréal | none tagged | St. Peter and St. Paul Cathedral | Place of worship | 80.2 | 238° | unknown | [map](https://maps.panopti.ca/?lat=45.521380&lng=-73.549750&zoom=18) / [cam](https://www.openstreetmap.org/node/5051745607) / [poi](https://www.openstreetmap.org/way/200995780) |
| `node/5051749573` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Église Notre-Dame-Czestochowa | Place of worship | 81.5 | 354° | unknown | [map](https://maps.panopti.ca/?lat=45.535534&lng=-73.558603&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749573) / [poi](https://www.openstreetmap.org/way/46866331) |
| `node/5051748723` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Bethel Baptist | Place of worship | 81.8 | 175° | unknown | [map](https://maps.panopti.ca/?lat=45.499046&lng=-73.701806&zoom=18) / [cam](https://www.openstreetmap.org/node/5051748723) / [poi](https://www.openstreetmap.org/way/47330606) |
| `node/608869297` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Centre d'hébergement Saint-Andrew | Social facility | 82.1 | 181° | unknown | [map](https://maps.panopti.ca/?lat=45.463849&lng=-73.628884&zoom=18) / [cam](https://www.openstreetmap.org/node/608869297) / [poi](https://www.openstreetmap.org/node/7412498075) |
| `node/13168331150` | CCTV | Government CCTVs | City of Vancouver | none tagged | The Way Church - West Point Grey | Place of worship | 82.4 | 218° | unknown | [map](https://maps.panopti.ca/?lat=49.263826&lng=-123.209001&zoom=18) / [cam](https://www.openstreetmap.org/node/13168331150) / [poi](https://www.openstreetmap.org/node/11505217558) |
| `node/5051748788` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Manoir Belle Époque | Social facility | 82.6 | 248° | unknown | [map](https://maps.panopti.ca/?lat=45.570146&lng=-73.658213&zoom=18) / [cam](https://www.openstreetmap.org/node/5051748788) / [poi](https://www.openstreetmap.org/node/7530214412) |
| `node/4610921828` | CCTV | Government CCTVs | City of Windsor | none tagged | (unnamed) | Place of worship | 83.5 | 118° | unknown | [map](https://maps.panopti.ca/?lat=42.283320&lng=-82.981914&zoom=18) / [cam](https://www.openstreetmap.org/node/4610921828) / [poi](https://www.openstreetmap.org/way/783467730) |
| `node/224645046` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Communauté de Nations Unies pour Christ-Jésus | Place of worship | 83.9 | 131° | unknown | [map](https://maps.panopti.ca/?lat=45.462850&lng=-73.597689&zoom=18) / [cam](https://www.openstreetmap.org/node/224645046) / [poi](https://www.openstreetmap.org/node/11973022636) |
| `node/5051745535` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Maison Benoit Labre | Social facility | 85.5 | 193° | unknown | [map](https://maps.panopti.ca/?lat=45.481239&lng=-73.577968&zoom=18) / [cam](https://www.openstreetmap.org/node/5051745535) / [poi](https://www.openstreetmap.org/way/1360242424) |
| `node/5051745610` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Centre d'Hébergement Jean De La Lande | Social facility | 86.4 | 338° | unknown | [map](https://maps.panopti.ca/?lat=45.530550&lng=-73.569497&zoom=18) / [cam](https://www.openstreetmap.org/node/5051745610) / [poi](https://www.openstreetmap.org/way/358298968) |
| `node/13927580724` | CCTV | Government CCTVs | Barrie Police Service | none tagged | Vivid | Cannabis retail | 86.4 | 89° | unknown | [map](https://maps.panopti.ca/?lat=44.382652&lng=-79.705316&zoom=18) / [cam](https://www.openstreetmap.org/node/13927580724) / [poi](https://www.openstreetmap.org/node/7196332563) |
| `node/13927584583` | CCTV | Government CCTVs | Barrie Police Service | none tagged | Salvation Army Barrie Bayside Mission Centre | Social facility | 86.9 | 105° | unknown | [map](https://maps.panopti.ca/?lat=44.388820&lng=-79.691307&zoom=18) / [cam](https://www.openstreetmap.org/node/13927584583) / [poi](https://www.openstreetmap.org/way/110479599) ⚠️ cluster |
| `node/2812348403` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Mosquée Al-Rawdah | Place of worship | 89.2 | 113° | unknown | [map](https://maps.panopti.ca/?lat=45.529688&lng=-73.723316&zoom=18) / [cam](https://www.openstreetmap.org/node/2812348403) / [poi](https://www.openstreetmap.org/node/6467166681) |
| `node/13733591401` | CCTV | Government CCTVs | City of London | 0° | Maple View Terrace | Social facility | 90.3 | 91° | no-cover | [map](https://maps.panopti.ca/?lat=42.980107&lng=-81.242985&zoom=18) / [cam](https://www.openstreetmap.org/node/13733591401) / [poi](https://www.openstreetmap.org/way/119873505) ⚠️ cluster |
| `node/12557753329` | CCTV | Government CCTVs | City of Ottawa | none tagged | One Flock One Shepherd Church | Place of worship | 91.9 | 63° | unknown | [map](https://maps.panopti.ca/?lat=45.446354&lng=-75.615229&zoom=18) / [cam](https://www.openstreetmap.org/node/12557753329) / [poi](https://www.openstreetmap.org/node/7039565624) |
| `node/5051749228` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Manoir du Soleil Levant | Social facility | 92.2 | 252° | unknown | [map](https://maps.panopti.ca/?lat=45.588202&lng=-73.634472&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749228) / [poi](https://www.openstreetmap.org/node/7524299575) |
| `node/13168331150` | CCTV | Government CCTVs | City of Vancouver | none tagged | West Point Grey Baptist Church | Place of worship | 92.4 | 219° | unknown | [map](https://maps.panopti.ca/?lat=49.263826&lng=-123.209001&zoom=18) / [cam](https://www.openstreetmap.org/node/13168331150) / [poi](https://www.openstreetmap.org/way/356586652) |
| `node/5051749291` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Centre Communautaire Islamique | Place of worship | 92.8 | 29° | unknown | [map](https://maps.panopti.ca/?lat=45.565028&lng=-73.587446&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749291) / [poi](https://www.openstreetmap.org/node/11203916310) |
| `node/5051749269` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Église Saint-Germain | Place of worship | 92.9 | 106° | unknown | [map](https://maps.panopti.ca/?lat=45.511737&lng=-73.615489&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749269) / [poi](https://www.openstreetmap.org/way/227969921) |
| `node/9459004971` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Centre islamique Bilal et culturel du Québec | Place of worship | 93.4 | 23° | unknown | [map](https://maps.panopti.ca/?lat=45.500459&lng=-73.646616&zoom=18) / [cam](https://www.openstreetmap.org/node/9459004971) / [poi](https://www.openstreetmap.org/node/10763488549) |
| `node/5051749261` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Providence Notre-Dame-de-Grâce | Social facility | 93.7 | 63° | unknown | [map](https://maps.panopti.ca/?lat=45.480932&lng=-73.622550&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749261) / [poi](https://www.openstreetmap.org/node/10799155821) ⚠️ cluster |
| `node/13927584586` | CCTV | Government CCTVs | Barrie Police Service | none tagged | Trinity Anglican Church | Place of worship | 94.8 | 289° | unknown | [map](https://maps.panopti.ca/?lat=44.390441&lng=-79.687798&zoom=18) / [cam](https://www.openstreetmap.org/node/13927584586) / [poi](https://www.openstreetmap.org/way/77376096) |
| `node/10096009026` | CCTV | Government CCTVs | (operator not tagged) | none tagged | St. John the Evangelist | Place of worship | 95.1 | 2° | unknown | [map](https://maps.panopti.ca/?lat=51.039210&lng=-114.029444&zoom=18) / [cam](https://www.openstreetmap.org/node/10096009026) / [poi](https://www.openstreetmap.org/way/778401550) |
| `node/5051748766` | CCTV | Government CCTVs | Ville de Montréal | none tagged | SQDC | Cannabis retail | 95.5 | 42° | unknown | [map](https://maps.panopti.ca/?lat=45.483512&lng=-73.629225&zoom=18) / [cam](https://www.openstreetmap.org/node/5051748766) / [poi](https://www.openstreetmap.org/node/9214720833) |
| `node/5051749261` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Résidence Vista | Social facility | 95.6 | 196° | unknown | [map](https://maps.panopti.ca/?lat=45.480932&lng=-73.622550&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749261) / [poi](https://www.openstreetmap.org/way/393597010) ⚠️ cluster |
| `node/5051748810` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Eglise Evangelique Philadelphie | Place of worship | 97.3 | 0° | unknown | [map](https://maps.panopti.ca/?lat=45.593216&lng=-73.602041&zoom=18) / [cam](https://www.openstreetmap.org/node/5051748810) / [poi](https://www.openstreetmap.org/way/46844855) |
| `node/5051749587` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Manoir Claudette Barré | Social facility | 97.3 | 339° | unknown | [map](https://maps.panopti.ca/?lat=45.596488&lng=-73.535028&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749587) / [poi](https://www.openstreetmap.org/node/7450262657) |
| `node/5051749280` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Centre d'hébergement Ernest-Routhier | Social facility | 97.5 | 97° | unknown | [map](https://maps.panopti.ca/?lat=45.521356&lng=-73.565547&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749280) / [poi](https://www.openstreetmap.org/node/7459630230) |
| `node/5051745599` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Maison Benoit Labre | Social facility | 97.7 | 343° | unknown | [map](https://maps.panopti.ca/?lat=45.479652&lng=-73.577845&zoom=18) / [cam](https://www.openstreetmap.org/node/5051745599) / [poi](https://www.openstreetmap.org/way/1360242424) |
| `node/13927584585` | CCTV | Government CCTVs | Barrie Police Service | none tagged | Trinity Anglican Church | Place of worship | 98.6 | 67° | unknown | [map](https://maps.panopti.ca/?lat=44.390374&lng=-79.690069&zoom=18) / [cam](https://www.openstreetmap.org/node/13927584585) / [poi](https://www.openstreetmap.org/way/77376096) ⚠️ cluster |
| `node/5051748781` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Carrefour Jeunesse Emploi Ahuntsic-Bordeaux-Cartierville | Social facility | 99 | 119° | unknown | [map](https://maps.panopti.ca/?lat=45.556008&lng=-73.671055&zoom=18) / [cam](https://www.openstreetmap.org/node/5051748781) / [poi](https://www.openstreetmap.org/node/9592851357) |
| `node/5051748752` | CCTV | Government CCTVs | Ville de Montréal | none tagged | Centre d'Hébergement François-Séguenot | Social facility | 99.2 | 137° | unknown | [map](https://maps.panopti.ca/?lat=45.667561&lng=-73.494369&zoom=18) / [cam](https://www.openstreetmap.org/node/5051748752) / [poi](https://www.openstreetmap.org/node/2496131066) |
| `node/14065088401` | CCTV | Government CCTVs | Durham Regional Police Services | none tagged | Centennial Albert United Church | Place of worship | 99.4 | 308° | unknown | [map](https://maps.panopti.ca/?lat=43.894117&lng=-78.878612&zoom=18) / [cam](https://www.openstreetmap.org/node/14065088401) / [poi](https://www.openstreetmap.org/way/76825744) |
| `node/5051749300` | CCTV | Government CCTVs | Ville de Montréal | none tagged | La Maison du Père | Social facility | 99.6 | 72° | unknown | [map](https://maps.panopti.ca/?lat=45.513593&lng=-73.557400&zoom=18) / [cam](https://www.openstreetmap.org/node/5051749300) / [poi](https://www.openstreetmap.org/relation/5138799) |

### 4.3 Tier 3 — context summary (779 camera-POI pairs, 100-250m)

- Place of worship: 358 camera-POI pairs (100-250m)
- Diplomatic mission: 174 camera-POI pairs (100-250m)
- Social facility: 171 camera-POI pairs (100-250m)
- Cannabis retail: 45 camera-POI pairs (100-250m)
- LGBTQ venue/friendly: 20 camera-POI pairs (100-250m)
- Reproductive/sexual health: 7 camera-POI pairs (100-250m)
- Immigration-related lawyer (name-matched): 2 camera-POI pairs (100-250m)
- Cultural/religious community centre: 1 camera-POI pairs (100-250m)
- Gun shop/range/club: 1 camera-POI pairs (100-250m)

**Cameras with 3+ distinct sensitive POIs in the 100-250m band**: 97 cameras (mostly the same Ottawa embassy-district cameras already discussed above, plus dense-downtown Montreal locations where churches/social facilities are simply numerous). Not itemized individually here — this is context volume, not a targeting signal, per the arterial/dense-downtown caveat in the task brief.

### 4.4 Categories with zero CCTV findings

At Tier 1/2: Immigration-related lawyer (name-matched), Supervised consumption site.

---

## 5. PART C — Unclassified-brand cameras (brand not tagged in OSM)

79 cameras nationally have no `brand` tag in OSM at all (mostly police-operated — York Regional Police, Waterloo Regional Police, Sault Ste. Marie Police, OPP). Per the classification rule in Section 1, these are **not** counted as ALPR or CCTV anywhere in this report. Screened separately here rather than guessed into either bucket.

### 5.1 Tier 1 (3) and Tier 2 (2)

| Camera | Operator | Direction | POI | Category | Detail | Dist (m) | Tier | Dir. coverage | Links |
|---|---|---|---|---|---|---:|---|---|---|
| `node/13927837869` | York Regional Police | none tagged | The Krasman Centre | Social facility | unspecified | 19 | T1 | unknown | [map](https://maps.panopti.ca/?lat=43.874322&lng=-79.437856&zoom=18) / [cam](https://www.openstreetmap.org/node/13927837869) / [poi](https://www.openstreetmap.org/node/5401244921) |
| `node/13999170143` | Waterloo Regional Police Service | none tagged | The Bridges | Social facility | homeless;underprivileged | 43.7 | T1 | unknown | [map](https://maps.panopti.ca/?lat=43.364577&lng=-80.314209&zoom=18) / [cam](https://www.openstreetmap.org/node/13999170143) / [poi](https://www.openstreetmap.org/way/424427918) |
| `node/14040807801` | (operator not tagged) | none tagged | Bethel Church | Place of worship | christian | 47.1 | T1 | unknown | [map](https://maps.panopti.ca/?lat=44.231075&lng=-76.491208&zoom=18) / [cam](https://www.openstreetmap.org/node/14040807801) / [poi](https://www.openstreetmap.org/way/54915797) |
| `node/13927771085` | York Regional Police | none tagged | Milliken Wesleyan Methodist Church | Place of worship | christian | 74.2 | T2 | unknown | [map](https://maps.panopti.ca/?lat=43.827603&lng=-79.308100&zoom=18) / [cam](https://www.openstreetmap.org/node/13927771085) / [poi](https://www.openstreetmap.org/way/67138858) |
| `node/13927767013` | York Regional Police | none tagged | St. Mary Roman Catholic Church | Place of worship | christian | 75.5 | T2 | unknown | [map](https://maps.panopti.ca/?lat=43.912098&lng=-79.654867&zoom=18) / [cam](https://www.openstreetmap.org/node/13927767013) / [poi](https://www.openstreetmap.org/way/334372491) |

### 5.2 Tier 3 (30 camera-POI pairs, 100-250m)

- Place of worship: 20 camera-POI pairs (100-250m)
- Social facility: 5 camera-POI pairs (100-250m)
- Cannabis retail: 4 camera-POI pairs (100-250m)
- LGBTQ venue/friendly: 1 camera-POI pairs (100-250m)

---

## 6. Full per-category "nothing found" reference

Across **all** camera types combined, the only category with zero OSM matches within 250m of any camera in the dataset was:

- **Supervised consumption sites** — none found within the mapped data (the single national OSM match for this category, "Overdose Prevention Society," is >250m from every mapped camera). See Section 1 for why this almost certainly reflects sparse OSM tagging of this category rather than an actual absence of such sites near cameras.

Every other category (place of worship, reproductive/sexual health, gun shop/range/club, immigration lawyer, cannabis retail, social facility, LGBTQ venue, diplomatic mission, cultural/religious community centre) had at least one match somewhere in the 250m screen for at least one camera type — see Sections 3.4 and 4.4 above for which categories had zero specifically at Tier 1/2 for ALPR vs. CCTV.

---

## 7. Re-run instructions

All scripts and intermediate data live in `/tmp/claude-1000/-home-auroras/498e13f3-e126-41a5-978a-8fa12c0fe721/scratchpad/`:

1. `cameras-ca.json` — camera data. Re-fetch with: `curl -s -o cameras-ca.json https://maps.panopti.ca/cameras-ca.json`
2. `cluster.js` — clusters cameras into geographic groups and writes `clusters.json` (bounding boxes for Overpass queries). Run: `node cluster.js`
3. `fetch-pois.js` — queries Overpass per cluster bbox, writes `pois-raw.json`. Run: `node fetch-pois.js` (supports resuming from a given cluster index: `node fetch-pois.js <startIndex>`, appends to any existing `pois-raw.json`). Takes roughly 30-90 minutes end-to-end due to Overpass rate-limiting; run detached (`setsid nohup node fetch-pois.js > fetch.log 2>&1 &`) since it can outlive a single shell session.
4. `correlate.js` — correlates cameras against POIs within 250m, tiers the findings, writes `findings.json`. Run: `node correlate.js`
5. `gen-report.js` + `build-report.js` — generate this report from `findings.json`. Run: `node build-report.js > sensitive-locations-report.md`

To restore the task spec's literal reproductive-health regex (bare "planning" instead of "family planning" — NOT recommended, produces ~20 false positives from financial/urban-planning firms, see Section 1), edit the `reproHealth` regex in `correlate.js`.
