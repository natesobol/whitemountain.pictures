# White Mountains Gallery Copy and UI Audit

Date: July 10, 2026

Status: Planning only. No site code, public content, image, storage, or deployment change is authorized by this document.

## 1. Outcome

White Mountains Pictures should present itself as a quiet art gallery with a strong technical foundation. Visitors should encounter photographs, place, weather, and light. They should not be asked to think about enrichment systems, review gates, camera settings, raw files, search indexing, or publication machinery.

The selected voice is a patient mountain guide. It is reflective in short moments and direct everywhere else. It borrows the calm, seasoned presence requested in the brief without imitating a named fictional character or turning every label into a proverb.

The photographs carry most of the atmosphere. The writing opens a path, then steps aside.

## 2. Evidence reviewed

The audit covered:

1. All tracked source, build, Worker, style, test, and product documentation files.
2. The generated `dist` output, including 461 HTML pages and 356 photograph pages.
3. The ignored build cache and all 356 normalized photograph records as a corpus.
4. The current local home, gallery, photograph, About, mobile, filter, and menu states in a rendered browser.
5. The deployed production home page and public media endpoints.
6. Public originals, manifest files, metadata JSON, XMP sidecars, and sampled Content Credentials.
7. Existing accessibility, responsive image, licensing, indexing, privacy, and image protection contracts.

The rendered review confirmed that the existing palette, editorial serif type, dark surfaces, and photographic layering already support the desired atmosphere. The problem is not the visual foundation. The problem is that the copy repeatedly frames the work as a technical catalog.

## 3. Critical findings

### 3.1 The deployed site still leads with AI and camera language

The live home page is an older build titled `White Mountains Pictures | Metadata Archive`. It visibly uses `AI sidecar metadata`, `AI + camera metadata`, camera filters, and a large embedded payload containing camera and file fields. The current workspace build is not deployed.

### 3.2 The current generated build still exposes technical language everywhere

The current `dist` output contains the following case insensitive counts across public HTML, JSON, XML, and text artifacts:

| Term family | Occurrences | Public files |
| --- | ---: | ---: |
| `metadata` | 3,415 | 462 |
| `camera` | 813 | 450 |
| `lens` | 758 | 358 |
| `aperture` | 709 | 357 |
| `exposure` | 395 | 357 |
| `ISO` | 716 | 357 |
| `focal length` | 370 | 357 |
| `EXIF` or `exifData` | 401 | 401 |
| `archive` | 4,706 | 461 |
| `record` | 333 | 249 |
| review or pending language | 8,037 | 460 |
| indexing or sitemap language | 404 | 369 |
| original file references | 1,068 | 356 |

### 3.3 Public media storage exposes private and sensitive information

The public media host exposes originals, full source archives, per photograph JSON, XMP sidecars, manifests, and workflow provenance. Confirmed exposed fields include:

1. One exact embedded camera position, plus altitude and GPS time. The coordinate pair is intentionally redacted from this tracked audit.
2. Camera body and lens serial numbers.
3. Local source paths and file hashes.
4. Exact capture time and editing software.
5. Lightroom edit history and public C2PA workflow assertions.
6. AI provenance, prompt seeds, generation modes, confidence evidence, and internal review warnings.

Removing visible links is not enough. The future implementation must close public source access and serve only stripped derivatives.

### 3.4 The photograph prose is strongly formulaic

Across 356 records:

| Pattern | Count |
| --- | ---: |
| `Trip context` | 213 |
| `this image` | 285 |
| `this photograph` | 54 |
| `captures` | 207 |
| `showcases` | 45 |
| `serene` | 65 |
| `peaceful` | 35 |
| `quiet` | 173 |

Descriptions average about 54 words. Extended descriptions average about 81 words. The site often repeats a title, a description, a headline, a longer description, a trip sentence, and as many as fourteen tags for one image. This reads like enrichment output instead of an edited gallery.

### 3.5 Review instructions leak into the visitor experience

Every photograph page contains a public review note. Many include internal warnings about sitemaps, GPS uncertainty, title duplication, or location evidence. These instructions belong in private review records and nowhere else.

## 4. Editorial approaches considered

### Approach A: Direct string replacement

This approach would replace `Archive` with `Gallery` and soften the most technical paragraphs in `scripts/build.mjs`.

Advantages:

1. Small code diff.
2. Fast to ship.

Costs:

1. Camera fields, source files, review warnings, and formulaic photograph prose would remain.
2. Copy would continue to be scattered through one generator file.
3. It would not close the production privacy boundary.

Decision: Rejected.

### Approach B: Gallery presentation layer with a private source boundary

This approach keeps the current static generator and Cloudflare architecture. It adds one explicit public photograph projection, one centralized copy module, one tracked public editorial ledger, and a native motion layer. Public originals and sidecars become private. Public pages use only approved copy, approved broad context, and stripped image derivatives.

Advantages:

1. Preserves the existing visual identity and fast static architecture.
2. Removes technical language and actual metadata exposure together.
3. Makes exact copy testable.
4. Adds motion without a framework migration or runtime package.

Costs:

1. Requires a deliberate editorial pass across all 356 photographs.
2. Requires coordinated Worker, R2, build, SEO, UI, test, and deployment work.

Decision: Selected.

### Approach C: Full framework redesign

This approach would rebuild the site as a React or similar application with an animation library.

Advantages:

1. Familiar component boundaries.
2. Many animation packages would be available.

Costs:

1. Larger client payload and migration risk.
2. Higher chance of visual drift.
3. No meaningful benefit for a static photograph gallery.
4. Conflicts with the requirement to use the robust platform already present.

Decision: Rejected.

## 5. Voice contract

### 5.1 Character

The voice is:

1. Calm and experienced.
2. Grounded in specific natural things.
3. Briefly reflective.
4. Clear about actions.
5. Comfortable with silence.

### 5.2 Sentence rules

1. Prefer one idea per sentence.
2. Prefer concrete nouns such as ridge, spruce, granite, snow, cloud, trail, and light.
3. Use direct verbs such as view, choose, open, continue, return, and license.
4. Keep interface labels literal.
5. Reserve reflective language for the home introduction, gallery introduction, About page, empty state, and 404 page.
6. Use commas and periods in prose. Do not use em dashes or semicolon chains.
7. Avoid claims about what a visitor must feel.
8. Avoid announcing that the site is serene, immersive, magical, timeless, breathtaking, or cinematic.

### 5.3 Words that must not appear in public presentation copy

The visible page, accessible names, placeholders, social descriptions, and JSON-LD string values must not use:

`AI`, `artificial intelligence`, `automated enrichment`, `model training`, `metadata`, `EXIF`, `IPTC`, `XMP`, `camera`, `lens`, `aperture`, `shutter`, `exposure`, `ISO`, `focal length`, `pixel dimensions`, `archive`, `catalog`, `record`, `review pending`, `metadata reviewed`, `human review`, `indexing`, `indexable`, `sitemap`, `noindex`, `repository`, `dataset`, `pipeline`, `workflow`, `Original JPEG`, `original file`, `private file details`, `editing history`, `source path`, `serial number`, or `GPS`.

Necessary HTML elements such as `<meta>`, canonical links, robots directives, numeric width and height attributes, image quality settings, and private source code names are not presentation copy. They remain where technically required.

### 5.4 Approved context

Public pages may use:

1. Curatorial year.
2. Season.
3. Broad, approved place.
4. Photographer name.
5. Copyright and licensing information.
6. Human approved title, alt text, caption, optional note, range, outing, and collection assignment.
7. Responsive image width and height as invisible layout attributes.

Exact capture date and time are removed. The year remains as a broad curatorial grouping.

## 6. Exact shared copy deck

### 6.1 Header and navigation

| Element | Final text |
| --- | --- |
| Brand | `White Mountains Pictures` |
| Primary link 1 | `Gallery` |
| Primary link 2 | `2025` |
| Primary link 3 | `2026` |
| Primary link 4 | `About` |
| Primary link 5 | `Licensing` |
| Mobile disclosure | `Menu` |
| Desktop navigation accessible name | `Primary` |
| Mobile navigation accessible name | `Primary` |
| Skip link | `Skip to content` |

The public route remains `/photos/` for URL stability. Only its visible name changes to `Gallery`.

### 6.2 Footer

| Element | Final text |
| --- | --- |
| Copyright line | `© Nathan Sobol · White Mountains, New Hampshire` |
| Footer link 1 | `About the photographs` |
| Footer link 2 | `License a photograph` |
| Footer navigation accessible name | `Footer` |

### 6.3 Shared controls and states

| Context | Final text |
| --- | --- |
| Year label | `Year` |
| All years option | `All years` |
| Season label | `Season` |
| All seasons option | `All seasons` |
| Search label | `Search the gallery` |
| Search placeholder | `Title, mountain, or place` |
| Clear action | `Clear filters` |
| Progressive reveal action | `Show more photographs` |
| Retry action | `Try again` |
| Empty heading | `No photographs found` |
| Empty message | `Clear the filters and choose another path.` |
| Filter failure | `The filters are unavailable for the moment. You can continue with the photographs already shown.` |
| Failure count fallback | `Showing the photographs already loaded` |
| Larger view failure | `The larger view is unavailable for the moment.` |

### 6.4 Result copy contract

| State | Final pattern |
| --- | --- |
| Unfiltered heading | `${total} photograph` or `${total} photographs` |
| Unfiltered summary | `Showing ${visible} of ${total} photographs` |
| One filtered result | `1 photograph found` |
| Many filtered results | `${matching} photographs found` |
| Filtered summary | `Showing ${visible} of ${matching} matching ${matching === 1 ? "photograph" : "photographs"}. ${total} photographs in the gallery.` |
| Zero heading | `No photographs found` |
| Zero summary | `No photographs found. ${total} photographs in the gallery.` |

The separate polite live region announces the same settled summary once. It does not contain decorative or animated duplicate text.

## 7. Exact home page copy

### Document metadata

| Field | Final text |
| --- | --- |
| Title | `White Mountains Pictures by Nathan Sobol` |
| Description | `White Mountains photographs by Nathan Sobol, made along the trails, forests, ridges, and summits of New Hampshire.` |

### Hero

| Element | Final text |
| --- | --- |
| Kicker | `Photographs by Nathan Sobol · New Hampshire` |
| H1 | `White Mountains Pictures` |
| Lead | `Walk slowly through trails, summits, forest light, and changing weather across New Hampshire’s White Mountains.` |
| Primary action | `Begin with 2026` |
| Secondary action | `Begin with 2025` |

Featured photograph presentation:

1. Place uses the approved broad location.
2. Title uses the approved public title.
3. Supporting line uses `${season} · ${year}`.
4. Credit remains `© Nathan Sobol`.

When season is empty, show `${year}` without a separator.

### First explanatory section

| Element | Final text |
| --- | --- |
| Kicker | `A quiet way through` |
| H2 | `There is no right order here.` |
| Body | `Choose a year or season, or begin with the photograph that holds your attention.` |

### Second explanatory section

| Element | Final text |
| --- | --- |
| Kicker | `Keep walking` |
| H2 | `One photograph leads to another.` |
| Body | `Open any image for a closer view, then continue by place, outing, year, or the neighboring frame.` |
| Action | `View the full gallery` |

The current reviewed count, search readiness claim, review policy promotion, and metadata filter are removed.

## 8. Exact gallery and route copy

### 8.1 Main gallery at `/photos/`

| Field | Final text |
| --- | --- |
| Document title | `White Mountains Gallery | White Mountains Pictures` |
| Description | `Photographs by Nathan Sobol from trails, forests, ridges, and summits across New Hampshire’s White Mountains.` |
| Breadcrumb | `Gallery` |
| Kicker | `The gallery` |
| H1 | `White Mountains Gallery` |
| Lead | `Photographs from trails, forests, ridges, and summits. Choose a year or season, or begin wherever your eye rests.` |
| Intro | `Follow the weather, the light, or a familiar name.` |

### 8.2 Year gallery at `/photos/{year}/`

| Field | Final pattern |
| --- | --- |
| Document title and H1 | `${year} White Mountains Photographs` |
| Description | `${count} photographs made across New Hampshire’s White Mountains in ${year}.` |
| Breadcrumb | `${year}` |
| Kicker | `A year in the mountains` |
| Intro | `A year along wooded approaches, open ridges, and the changing weather between them.` |

### 8.3 Outing pages at `/trips/{trip}/`

| Field | Final pattern |
| --- | --- |
| Document title | `${tripLabel} | White Mountains Pictures` |
| Breadcrumb | `${tripLabel}` |
| Kicker | `One day in the mountains` |
| H1 | `${tripLabel}` |
| Description | `${count} photographs from ${tripLabel}, following the trail, weather, and changing light of the day.` |
| Intro | `Wooded approaches, open views, and the miles between them, all from one outing.` |

### 8.4 Place pages at `/places/{place}/`

| Field | Final pattern |
| --- | --- |
| Document title | `${placeLabel} | White Mountains Pictures` |
| Breadcrumb | `${placeLabel}` |
| Kicker | `A place in the range` |
| H1 | `${placeLabel}` |
| Description | `${count} photographs connected to ${placeLabel}.` |
| Intro | `These photographs share a broad sense of place. Locations remain broad where greater precision could disturb a trail or habitat.` |

### 8.5 Collection pages

Every collection uses these common fields:

| Field | Final pattern |
| --- | --- |
| Document title | `${collectionTitle} | White Mountains Pictures` |
| Breadcrumb | `${collectionTitle}` |
| Kicker | `A collection` |
| H1 | `${collectionTitle}` |
| Lead | `${finalSubtitle}` |
| Body | `${finalDescription}` |

| Collection | Final subtitle | Final description |
| --- | --- | --- |
| Presidential Range | `Wind, cloud, and hard alpine light above treeline` | `Summits under rime, moving weather, and long sightlines across the Presidentials.` |
| Franconia Ridge | `Open ledges, long horizons, and the line of the trail` | `Cairns, cloud shadows, and the exposed ridge from Liberty to Lafayette.` |
| Winter Forests | `Blue shadow, birch bark, and quiet snowpack` | `Ravines filled with snow, soft light in the trees, and the smaller details winter brings forward.` |
| Waterfalls | `Cold runoff, moss, spray, and spring volume` | `Water along White Mountains trails, from spring runoff to mossy cascades and stream edges lit through mist.` |
| Trail Details | `Worn stone, bog bridges, cairns, and blazes` | `Close photographs of the marks and textures that shape a day on the trail.` |
| Sunrise & Alpenglow | `Early color across ridges, notches, and layers of cold air` | `First light across ridges and notches, with valley haze and the brief change from slate to rose.` |

During implementation, place these six exact definitions in tracked `content/gallery-collections.json`. Photograph assignments come only from the reviewed editorial ledger. The ignored cache and legacy collection source are not editing targets.

## 9. Exact photograph page contract

### 9.1 Header

| Element | Final pattern |
| --- | --- |
| Document title | `${approvedTitle} | White Mountains Pictures` |
| Document and social description | `${approvedCaption}` |
| Breadcrumb | `Home / Gallery / ${year} / ${title}` |
| Kicker | `${locationLabel} · ${year}` |
| H1 | `${approvedTitle}` |
| Fallback lead | `From ${locationLabel}.` |

If an approved public caption exists, it replaces the fallback lead. Exact capture date, capture time, and time of day are not published.

### 9.2 Narrative

1. Show one approved caption.
2. Show one optional approved photographer note only when it adds information not already present in the caption.
3. Omit the note area when no approved note exists.
4. Use `A closer look` as the optional note heading.
5. Use `Related outing: ${tripLabel}.` for a related outing.
6. Use `Also part of:` before approved collection links.
7. Remove the visible tag list.
8. Use `License this photograph` for the primary licensing action.
9. Use `More photographs` as the pager accessible name.
10. Keep `Previous` and `Next` as visible pager labels.

### 9.3 Context panel

The current `Photo metadata` panel becomes a small art label titled `Along the way`.

Allowed rows:

| Row | Value |
| --- | --- |
| `Place` | Approved broad location |
| `Range` | Approved range, only when it adds information |
| `Season` | Approved season |
| `Year` | Curatorial year |
| `Outing` | Approved outing link, when available |
| `Photographer` | `Nathan Sobol` |
| `Rights` | `© Nathan Sobol · Licensing available` |

Removed rows:

`Captured`, `Camera`, `Lens`, `Exposure`, `Aperture`, `ISO`, `Focal length`, `Dimensions`, `Original`, and `View original JPEG`.

All public review notes and internal reasons are removed.

### 9.4 Larger view

| Element | Final text or pattern |
| --- | --- |
| Open action | `View larger` |
| Dialog accessible name | `${title}, larger view` |
| Close action | `Close larger view` |
| Failure text | `The larger view is unavailable for the moment.` |

The larger view uses the existing stripped detail derivative. It never requests an original file.

## 10. Exact About page copy

### Document and header

| Field | Final text |
| --- | --- |
| Title | `Nathan Sobol, White Mountains Photographer` |
| Description | `About Nathan Sobol and his photographs of New Hampshire’s White Mountains.` |
| Breadcrumb | `About Nathan Sobol` |
| Kicker | `Photographer` |
| H1 | `Nathan Sobol` |
| Lead | `Landscape, trail, and mountain photography from New Hampshire’s White Mountains.` |

### Body

Opening paragraph:

> White Mountains Pictures brings together Nathan Sobol’s photographs from days spent on the trails, ridges, and summits of New Hampshire. The work follows changing weather, familiar routes, and the quieter details that reward a slower pace.

Second heading:

> A patient practice

Second paragraph:

> Each photograph is given room to stand on its own. Place, season, and year offer a way into the scene, while precise locations remain broad when the land calls for care.

Third heading:

> Licensing and commissions

Third paragraph:

> To license or commission a photograph, visit the licensing page. About the photographs explains how titles and places are chosen.

## 11. Exact About the Photographs page copy

Create `/about/photographs/`. Permanently redirect `/about/photo-metadata/` to the new route.

| Field | Final text |
| --- | --- |
| Title | `About the Photographs | White Mountains Pictures` |
| Description | `How the photographs are titled, placed, and shared with care.` |
| Breadcrumb | `About the photographs` |
| Kicker | `Place, time, and care` |
| H1 | `About the photographs` |
| Lead | `Each image carries enough context to find its place in the range. Sensitive locations remain broad to protect trails and habitats.` |

Section one:

> What appears here

> A photograph may include a title, a concise caption, a season, a year, a broad place, a related outing, and a path to licensing.

Section two:

> Care for place

> Locations remain broad when greater precision could disturb a trail or habitat.

Section three:

> Titles and captions

> Titles and captions stay close to what can be seen and known. When a detail is uncertain, the page simply says less.

## 12. Exact licensing page copy

| Field | Final text |
| --- | --- |
| Title | `License a White Mountains Photograph` |
| Description | `Licensing information for White Mountains photographs by Nathan Sobol.` |
| Breadcrumb | `Licensing` |
| Kicker | `Licensing` |
| H1 | `License a photograph` |
| Lead | `All photographs are © Nathan Sobol. Permission is required for reproduction, resale, advertising, editorial publication, or commercial display.` |
| H2 | `Request a license` |
| Request instructions | `Include the photo page link, intended use, placement, audience or circulation, territory, duration, and requested dimensions. These details make it possible to provide a clear quote.` |
| Primary action | `Request a license by email` |
| Second H2 | `Linking and reuse` |
| Reuse text | `Links to pages on this site are welcome. Copying an image, removing credit, republishing it, or using it in another product or collection requires separate written permission.` |
| Third H2 | `Contact` |
| Contact text | `Email natesobol@gmail.com with “White Mountains Pictures license” in the subject.` |

Email template labels remain:

`Photo page`, `Intended use`, `Placement`, `Audience or circulation`, `Territory`, `Duration`, and `Requested dimensions`.

## 13. Exact 404 copy

| Field | Final text |
| --- | --- |
| Title | `Page not found` |
| Description | `The requested page could not be found.` |
| Kicker | `404` |
| H1 | `The path turns elsewhere.` |
| Lead | `This page may have moved. Return to the gallery and choose another way in.` |
| Action | `Return to the gallery` |

## 14. Dynamic photograph copy contract

### 14.1 Tracked public editorial ledger

Create tracked year files keyed by the raw stable source ID. Each of the 356 entries owns every word and curatorial relationship allowed to reach the public photograph model:

```json
{
  "wmpics__img_0033": {
    "title": "Spring Light on Howker Ridge Trail",
    "alt": "A rocky forest trail bordered by moss and spring leaves in dappled sunlight.",
    "caption": "Dappled light crosses spring leaves and moss along a rocky section of Howker Ridge Trail.",
    "note": "Trail signs place this section of the route below Mount Madison.",
    "year": 2026,
    "season": "Spring",
    "locationLabel": "Mount Madison",
    "rangeLabel": "Presidential Range",
    "tripId": "mount-madison",
    "tripLabel": "Mount Madison",
    "collectionIds": ["trail-details"]
  }
}
```

Rules:

1. `title`, `alt`, `caption`, `year`, and `locationLabel` are required for every public photograph.
2. `note`, `season`, `rangeLabel`, `tripId`, `tripLabel`, and `collectionIds` may be empty only where the image by image copy deck says `Omit`.
3. A trip ID and trip label appear together or are both empty.
4. A public trip ID is derived from the approved label, contains no exact date, and never copies a private source trip ID.
5. Every collection ID must exist in `content/gallery-collections.json`.
6. No public page reads title, alt, caption, note, place, range, outing, season, or collection assignments directly from an AI, enrichment, inferred location, or legacy collection field.
7. No public page publishes a prompt seed, generation mode, confidence field, evidence field, or review reason.
8. The raw source ID is used only to join private structure to approved editorial content. The public canonical ID is a tested, collision free slug of that stable ID.
9. The public page slug is generated only from the approved title plus the canonical public ID. A legacy generated slug is never reused in a canonical URL.
10. The build fails if any photograph lacks a ledger entry, any ledger entry lacks a private photograph, or canonical IDs collide.
11. The build fails if any text field contains a banned formula or banned presentation term.

### 14.2 Exact image by image copy deck

The Markdown files under `docs/gallery-copy/2025/` and `docs/gallery-copy/2026/` are the exact planning source for all 356 entries. Each proposed title, alt text, caption, optional note, season, broad place, range, outing, collection assignment, and future public path is written there after visual inspection. Implementation transcribes those values into the tracked JSON ledgers without rewriting them.

An entry marked `Visual evidence: Verified` was checked against the existing photograph at full frame. An entry not verified is a release blocker. The copy deck contains no source filename, source URL, exact capture detail, equipment value, coordinates, private key, legacy prose, provenance, confidence, or review state.

### 14.3 Content form

Titles:

1. Use concise title style capitalization for ordinary words.
2. Keep official proper names.
3. Prefer one subject and one place or condition.
4. Do not repeat a mountain name twice.
5. Do not add `landscape photograph`, `nature photography`, a season, and a time of day only for search value.

Alt text:

1. Describe visible content and composition.
2. Do not say `image of`, `photo of`, `this photograph`, or `showcases`.
3. Do not infer emotion, weather danger, exact location, or season unless visible and approved.
4. Aim for 8 to 24 words.
5. End with a period.

Captions:

1. Add one useful observation not already in the title.
2. Use no more than 32 words.
3. Do not use `captures`, `showcases`, `highlights`, `nestled`, `serene`, `stunning`, `peaceful`, `vibrant`, `dynamic`, `natural beauty`, `typical of`, or `Trip context places`.
4. Do not repeat the full title.
5. Do not write a moral for every photograph.

Notes:

1. Use only for trail, weather, place, or making context that a viewer cannot see.
2. Use no more than 45 words.
3. Omit the field when it adds nothing.

### 14.4 Removed dynamic fields

Stop publishing:

1. `headline`
2. `extendedDescription`
3. visible tags
4. exact capture date and time
5. time of day derived from capture data
6. camera and file fields
7. location confidence and evidence
8. peak coordinate arrays
9. review state and reasons
10. raw source object keys and original URLs

## 15. Public data and web metadata contract

### 15.1 Keep

1. `<title>` and concise page description.
2. Canonical URL.
3. Open Graph and social image tags.
4. Robots directives.
5. `WebPage`, `ImageObject`, `BreadcrumbList`, and `Person` schema.
6. Numeric image width and height.
7. Creator, copyright, credit, license, and acquire license URL.
8. Broad approved place when safe.

### 15.2 Remove

1. `exifData`.
2. `dateCreated` sourced from capture data.
3. `uploadDate` set to build time.
4. Camera and lens values.
5. Original URLs in `contentUrl`.
6. Source filenames, object keys, sidecar URLs, and manifest URLs.
7. Generated descriptions and captions.

`contentUrl`, `url`, and `thumbnailUrl` must point to stripped same origin derivatives.

### 15.3 Public client projection

The client catalog allowlist is:

```text
href,title,locationLabel,alt,thumb,hero,width,height,orientation,year,season,searchText
```

`searchText` is the normalized join of approved title, broad place, range, and outing label only. No public payload includes exact date, time, status, confidence, coordinates, camera fields, file size, original path, legacy tags, or review instructions.

## 16. UI adjustments

1. Rename every visible `Archive` occurrence to `Gallery`, `photographs`, `work`, or the exact route copy in this document.
2. Remove the public status filter and its URL parameter.
3. Remove review badges from cards.
4. Remove visible tag pills.
5. Replace the technical photograph panel with the `Along the way` art label.
6. Remove the raw original action.
7. Add one explicit `View larger` action that uses the stripped detail derivative.
8. Preserve year and season filters.
9. Preserve broad place search.
10. Preserve server rendered links and the no script baseline.
11. Preserve 44 pixel control targets, focus outlines, semantic headings, breadcrumbs, live regions, and native form controls.
12. Keep the home mosaic hidden at the existing mobile breakpoint.
13. Keep the copyright credit visible on featured work.
14. Remove the duplicate hidden figcaption when the image already has equivalent alt text.
15. Rename internal presentation hooks where they make future leaks likely, such as `data-featured-meta` to `data-featured-line`.
16. Keep landscape cards at a centered 3:2 crop at every breakpoint. Keep portrait cards at a centered 4:5 crop at every breakpoint, including narrow screens. Remove the current narrow portrait 3:2 override and its 35 percent vertical position. The reviewed narrow crop of deck item 106 kept the planets but removed the summit, so that crop is not approved for implementation.

## 17. Motion and interaction catalogue

Use the native web platform already present. Add no animation package.

Shared motion tokens:

```css
--motion-press: 80ms;
--motion-fast: 140ms;
--motion-menu: 160ms;
--motion-ui: 180ms;
--motion-photo: 280ms;
--ease-out: cubic-bezier(.22, 1, .36, 1);
--ease-standard: cubic-bezier(.2, 0, 0, 1);
```

### 17.1 Trail underline

Header, footer, breadcrumb, and prose links reveal a one pixel underline from left to right in 140ms. Keyboard focus receives the same underline while retaining the existing focus ring. Reduced motion shows the final underline without movement.

### 17.2 Button response

Fine pointer hover moves an enabled button up by one pixel over 140ms. Press moves it down by one pixel over 80ms. Touch receives only the press response. Disabled controls never move.

### 17.3 Gallery card quiet lift

Fine pointer hover and keyboard focus move a card up by two pixels over 180ms. Its image scales no higher than `1.018` over 240ms. Border and shadow settle with it. Reduced motion keeps only the border and color state.

### 17.4 Mosaic attention

After 70ms of pointer intent, or immediately on keyboard focus, one home tile scales to `1.015`. Its label moves three pixels into place and settles from `0.82` opacity. Neighboring photographs do not dim. A touch tap navigates immediately.

### 17.5 Featured dissolve

The next featured image loads and decodes before it appears. Two fixed layers crossfade over 280ms. The incoming layer begins at `1.006` scale and settles to `1`. The season and year line follows 40ms later over 180ms. Rapid changes cancel older animations and ignore stale image loads.

### 17.6 Filter result settle

Filtering updates the correct cards, result heading, URL, and live region immediately. Only the first eight newly visible cards settle from six pixels and `0.84` opacity over 200ms, with an 18ms stagger. Other cards appear immediately.

### 17.7 New row reveal

`Show more photographs` reveals content immediately and retains button focus and scroll position. The first twelve new cards settle from eight pixels and `0.88` opacity over 220ms, with a 22ms stagger. No auto scroll occurs.

### 17.8 Count refresh

Visible result text updates before animation, then settles from two pixels and `0.72` opacity over 140ms. The separate live region does not animate and announces once.

### 17.9 Mobile menu settle

The native disclosure panel opens from four pixels above, `0.99` scale, and `0.82` opacity over 160ms. Close takes 120ms. Escape closes and restores focus to the summary. Outside interaction closes without stealing focus from the new target.

### 17.10 Larger photograph view

A native dialog fades its backdrop to `0.72` opacity over 160ms. The panel settles from `0.985` scale and `0.88` opacity over 180ms. Close takes 140ms. Escape, backdrop click, and a visible 44 pixel close control work. Focus returns to `View larger`.

### 17.11 Neighbor cue

Previous and next photograph labels move no more than two pixels in their navigation direction over 160ms. Focus and hover receive equal treatment. Touch receives only a press response.

### 17.12 Motion explicitly excluded

Do not add:

1. Scroll jacking.
2. Cursor replacement.
3. Pointer following effects.
4. Continuous parallax.
5. Automatic zoom loops.
6. Blur transitions over photographs.
7. Neighbor dimming.
8. Sound.
9. Decorative particles.
10. Route wide transitions on the home mosaic or large gallery grids.

## 18. Accessibility and performance requirements

1. All animation is optional presentation. Content and controls are correct before motion begins.
2. Scripted motion checks `prefers-reduced-motion` directly. The existing CSS override alone is not sufficient.
3. Reduced motion removes translation, scale, stagger, and crossfade. State changes remain immediate.
4. Hover movement applies only inside `@media (hover: hover) and (pointer: fine)`.
5. Keyboard focus always receives an equally clear non motion state.
6. Touch never requires a first tap to preview and a second tap to navigate.
7. No more than twelve elements animate concurrently.
8. Use transform and opacity for motion. Do not animate layout dimensions.
9. Do not apply persistent `will-change` to all cards.
10. A stale image decode must never overwrite the most recent featured selection.
11. The viewer uses a derivative already available to the page. It does not fetch an original.
12. Skip link movement stays immediate.
13. Remove global smooth scrolling so skip links and fragment recovery do not glide unexpectedly.
14. When a filter hides the currently focused result, move focus to the updated result heading. If focus is outside the result list, do not move it.

## 19. Source and storage boundary

The implementation must complete this sequence before public launch:

1. Add a private build input path through the existing Wrangler R2 tooling or another authenticated source.
2. Build the public site from a strict allowlisted photograph projection.
3. Change the Worker to read originals through the private R2 binding.
4. Transform all public images with `metadata: "none"`.
5. Return `410` for recognized original, manifest, metadata JSON, XMP, and source archive routes. Return generic `404` for malformed, opaque-separator, and unknown variants without lookup or normalization.
6. Point all pages and schemas to same origin derivatives.
7. Verify the known GPS sample contains no GPS, serial, capture time, software, IPTC, XMP, or workflow data after transformation.
8. Deploy the scrubbed build before disabling the public media domain.
9. Disable every public R2 access path only after derivative delivery is verified.
10. Purge old HTML, payload, source, and image cache entries.
11. Verify the older metadata focused production page is gone.

Production access changes, deployment, and cache purge require a separate explicit approval at execution time.

## 20. Acceptance criteria

The refactor is ready only when:

1. All 356 photographs have a visually verified Markdown entry and matching tracked ledger entry with every required public copy and context field.
2. Public visible text, accessible attributes, form placeholders, social descriptions, public state attributes, JSON-LD strings, and client JSON contain no banned presentation terms.
3. No public artifact contains a forbidden private key, equipment setting, exact capture data, precise coordinate, serial, source path, edit history, AI provenance, prompt seed, confidence, evidence, or review warning.
4. Public image binaries pass the 52-request JPEG, WebP, and AVIF container matrix. Structural format segments and normalized color profiles are permitted. EXIF, IPTC, XMP, JUMBF, Content Credentials, location, equipment, editing, and provenance containers are not.
5. No public page or schema points to an original file.
6. Recognized original and sidecar endpoints return `410`. Malformed, opaque-separator, and unknown variants return generic `404`.
7. The gallery, filters, search, progressive reveal, mobile menu, licensing handoff, pager, larger view, and Back navigation work without console errors.
8. No script still provides a public status filter or status query parameter.
9. The no script page remains useful and navigable.
10. Every motion behavior has a reduced motion path, keyboard path, touch path, cancellation rule, and concurrency cap.
11. Home and detail images do not flash blank during rapid interaction.
12. Copy audit, build, typecheck, unit tests, distribution verification, dry run deployment, the 52 image checks, and rendered desktop and mobile QA pass.
13. The deployed home title, description, visible text, and embedded payload match the new gallery contract.

## 21. Evidence limits

The screenshot review confirms hierarchy, density, responsive behavior, current menu behavior, current filter behavior, and visible metadata dominance. Screenshots cannot prove full accessibility compliance, binary metadata removal, assistive technology output, or production cache state. Those require the automated and manual checks in the implementation plan.

## 22. Planning artifact validation

The completed planning deck has these verified totals:

1. Twelve Markdown files contain 356 entries and 5,340 required labeled fields.
2. The year split is exactly 124 entries for 2025 and 232 for 2026.
3. All 356 full frames were viewed.
4. All 355 landscape photographs were also checked at the current centered 3:2 card crop.
5. The one portrait photograph was checked at the current centered 4:5 card crop and the current narrow 3:2 crop with 35 percent vertical position. The 4:5 crop retains the planets and summit. The narrow 3:2 crop removes the summit and is explicitly rejected by UI adjustment 16.
6. The deck has 356 unique source joins, canonical public IDs, titles, and future public paths.
7. The source and deck ID sets are equal for both years.
8. All entries have separate outing ID and outing label fields. The complete deck uses 32 safe, date-free outing IDs.
9. The copy has zero contract failures for word limits, alt punctuation, required values, approved seasons, approved collections, banned presentation language, formulaic phrases, semicolons, em dashes, or exact date and time leakage.
10. No proposed title, alt text, caption, or note exactly reuses a legacy generated string.
11. Visual review derivatives and crop checks remain below the ignored audit cache. No generated image, icon, SVG, PNG, or other visual asset was added to the site plan.

These checks validate the planning artifact. They do not replace the implementation-time copy auditor, public artifact audit, image container audit, or rendered acceptance matrix.
