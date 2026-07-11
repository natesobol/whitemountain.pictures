# White Mountains Gallery Voice and Motion Design

## Context

White Mountains Pictures is a static Cloudflare site with a strong visual base and an overly technical public voice. The current workspace generates a home page, gallery indexes, year pages, outing pages, place pages, collection pages, 356 photograph pages, About and licensing pages, and a 404 page. It uses semantic HTML, one CSS file, a small native JavaScript client, Workers Static Assets, an R2 binding, and bounded image transformation routes.

The design keeps that architecture. It changes the public presentation from a metadata archive to an art gallery, closes public source exposure, adds an explicit editorial copy boundary, and introduces calm native motion.

The exact static public copy and interaction values live in `docs/WHITE_MOUNTAINS_GALLERY_COPY_AND_UI_AUDIT_2026-07-10.md`. The twelve files under `docs/gallery-copy/2025/` and `docs/gallery-copy/2026/` are normative for all 356 photograph entries. This document is normative for structure and behavior.

## User goal

A visitor should be able to arrive, look, narrow the view by year or season, open a photograph, continue by place or neighboring work, and ask about licensing without encountering AI language, camera lore, review workflow, or search machinery.

The experience should feel like a quiet room in the mountains. It should not feel like software pretending to be a forest.

## Accessibility target

The implementation targets semantic, keyboard usable, touch usable, reduced motion friendly pages with robust progressive enhancement. The work will be checked against WCAG relevant behavior, but this design does not claim complete compliance before rendered keyboard, zoom, contrast, and assistive technology verification.

## Goals

1. Make photographs the first subject of every public route.
2. Replace technical public wording with the exact gallery copy deck.
3. Remove all public AI, camera, capture, source, and review data.
4. Close public access to originals, manifests, source archives, sidecars, and workflow provenance.
5. Require approved title, alt text, caption, broad place, year, and explicit optional context decisions for every photograph.
6. Preserve only visually reviewed or otherwise grounded place, season, range, outing, and collection context.
7. Keep essential web metadata, responsive image dimensions, copyright, and licensing data.
8. Add eleven subtle interactions through CSS, the Web Animations API, and native dialog behavior.
9. Preserve static rendering, real links, no script navigation, URL addressed filtering, and small client payloads.
10. Add no generated image, SVG, icon, logo, texture, or watermark asset.

## Non goals

1. No React, Vue, Svelte, animation package, or client router migration.
2. No new palette, typeface, brand mark, illustration, or generated image.
3. No scroll jacking, cursor replacement, continuous parallax, sound, particles, or decorative loading sequence.
4. No public camera settings or original file download.
5. No attempt to disguise AI provenance by renaming private source fields. Private provenance stays honest and private.
6. No production deploy, R2 access change, DNS change, cache purge, or external security rule change during the planning phase.
7. No public launch with unfinished photograph copy.

## Scope interpretation

The phrase `scrub site of all AI and metadata references` is implemented as follows:

1. Public visible and accessible copy contains no AI, camera, metadata, review, indexing, or source workflow language.
2. Public payloads and image binaries contain no AI provenance, camera data, capture data, coordinates, serials, source paths, or edit history.
3. Standard web metadata such as title, description, canonical, Open Graph, robots, and safe JSON-LD remains because the site needs it to function and be discoverable.
4. Numeric image width and height remains in markup and schema for layout and search quality. It is not shown as camera lore.
5. Year, season, broad place, range, outing, and collection assignments remain only when the tracked editorial ledger explicitly approves them.

## Selected approach

Use a gallery presentation layer over a private source boundary.

The private layer contains raw originals, source archives, enrichment data, provenance, camera fields, capture fields, editorial review state, and the full source record.

The public layer contains only an allowlisted photograph model:

```ts
export interface PublicPhotograph {
  id: string;
  href: string;
  year: 2025 | 2026;
  season: "Spring" | "Summer" | "Autumn" | "Winter" | "";
  title: string;
  alt: string;
  caption: string;
  note: string;
  locationLabel: string;
  rangeLabel: string;
  tripId: string;
  tripLabel: string;
  collectionIds: string[];
  width: number;
  height: number;
  orientation: "landscape" | "portrait";
}
```

`id` is the collision checked canonical public form of the raw stable source ID. `href` is generated only from the approved title plus that canonical ID. The public type has no raw source ID, legacy slug, source filename, exact date, time, camera, lens, exposure, aperture, ISO, focal length, GPS, serial, source path, object key, file size, prompt, generation mode, confidence, status, or review reason.

## Architecture

### 1. Private source acquisition

The build stops fetching raw content from a public media hostname. It reads cached private files first. On a cache miss or explicit refresh, it uses the existing Wrangler CLI to read the remote private R2 bucket. Authentication comes from the developer or CI environment and never from a public browser endpoint.

Private source acquisition has one responsibility: return a parsed source record. It does not decide what can be published.

### 2. Private normalization

`scripts/site-core.mjs` continues to normalize the two source generations into a private internal record. It may retain raw provenance and technical fields for private validation. This type is never serialized directly.

Private normalization establishes structure only. It does not approve public wording, context, collection assignments, or indexing. Valid structure requires:

1. Stable ID and image identity.
2. Positive width and height.
3. Valid orientation.
4. A private object key.

### 3. Editorial ledger

`content/photo-copy/2025.json` and `content/photo-copy/2026.json` are the complete tracked sources of public title, alt text, caption, optional note, year, optional season, broad place, optional range, optional outing, and collection assignments. Each file is keyed by raw stable photograph ID. The build joins the two year ledgers to private structural records and fails unless their combined ID set matches all 356 photographs exactly.

The ledger does not store camera values, exact dates, coordinates, review reasons, prompts, or source paths.

The visually verified planning source for these values is split across the twelve Markdown files under `docs/gallery-copy/`. Implementation transcribes those files without creative rewriting. `content/gallery-collections.json` owns the exact six collection definitions; ledger entries own assignments.

An audit script checks all 356 records, canonical ID collisions, public paths, context pairing, collection IDs, copy limits, and banned language. It writes a safe validation report outside `dist`. The build fails on any finding.

### 4. Public projection

`scripts/public-photo.mjs` converts one private normalized record plus one editorial ledger entry into `PublicPhotograph`. It is an allowlist, not an object spread. Unknown private fields cannot pass through by accident.

Every page generator, sitemap generator, JSON-LD generator, and client catalog consumes only `PublicPhotograph`.

All 356 ledger complete photograph pages are indexable and appear in the photograph sitemap. Every nonempty year, outing, place, and collection page is indexable. No private review flag participates in indexing.

### 5. Central copy contract

`scripts/gallery-copy.mjs` holds static site copy and pure dynamic copy helpers. It owns route titles, descriptions, page kickers, error text, 404 text, art label terms, and deterministic SEO descriptions.

`src/catalog-core.js` continues to own client result headings and summaries because those helpers run in both build and browser contexts.

No generated HTML template contains an unapproved alternate phrase for a copy deck entry.

### 6. Page generation

`scripts/build.mjs` remains the HTML source of truth.

Changes:

1. Global navigation says Gallery.
2. Home uses the exact two reflective sections from the copy deck.
3. Filters contain year, season, and search only.
4. Cards show title, broad place, season, and year. They show no review badge.
5. Photograph pages show one caption, one optional note, related outing and collections, licensing, pager, and the `Along the way` art label.
6. Photograph pages contain a native larger view dialog using the same stripped detail derivative.
7. About and licensing use the exact copy deck.
8. `/about/photographs/` replaces the public policy page.
9. `/about/photo-metadata/` permanently redirects to `/about/photographs/`.
10. `dist/build-report.json` moves outside public assets.
11. Landscape cards use a centered 3:2 crop at every breakpoint. Portrait cards use a centered 4:5 crop at every breakpoint. The narrow portrait 3:2 override and 35 percent vertical position are removed because the reviewed crop loses a primary subject.

### 7. Client data and filtering

The home client catalog contains only:

```text
href,title,locationLabel,alt,thumb,hero,width,height,orientation,year,season,searchText
```

`searchText` is derived only from approved title, location label, range label, and outing label.

Filter state contains:

```ts
{
  year: string;
  season: string;
  query: string;
}
```

The public `status` filter and `?status=` parameter are removed. Legacy status query input is ignored and removed from the canonical URL on first normalization.

### 8. Structured data and social output

Retain a small JSON-LD graph with `WebPage`, `ImageObject`, `BreadcrumbList`, and `Person`.

The `ImageObject` retains:

1. Safe derivative URL.
2. Approved title and caption.
3. Numeric width and height.
4. Derivative dimensions computed for the 2048 pixel detail resource.
5. Creator and copyright holder.
6. Copyright notice and credit text.
7. License and acquire license page.
8. Approved broad place when safe.

Remove `encodingFormat` because the detail route negotiates AVIF, WebP, or JPEG. Remove `exifData`, exact capture date, build timestamp, camera values, original URL, and generated description. Generation and verification share one recursive schema allowlist.

Image sitemap entries use a stripped public derivative and approved caption. `lastmod` is omitted unless a real editorial modification date exists.

### 9. Private image delivery

The Worker reads originals from `env.PHOTOS`. Public requests never fetch a public R2 source URL.

Public derivative routes use only the canonical public photograph ID in the form `/images/{preset}/{photoId}`. A private build step creates an ignored Worker module that maps the exact 356 canonical IDs to private R2 object keys and approved canonical page paths. The module is bundled only into server code. It is never committed, written to `dist`, serialized to a browser, printed in a report, or used to construct a path from unchecked visitor input. An unknown ID returns `404` before R2 is read. A legacy or mistyped page slug redirects by its stable suffix to the approved path without storing the old generated slug.

Only named presets remain:

| Preset | Maximum width | Use |
| --- | ---: | --- |
| `thumb` | 320 | Mosaic and compact preview |
| `card` | 640 | Gallery card |
| `hero` | 1280 | Home feature |
| `detail` | 2048 | Photograph page and larger view |
| `social` | 1200 | Social and image sitemap |

Every transform uses `fit: scale-down` and `metadata: "none"`. Container verification permits structural segments and normalized color profiles only. It rejects descriptive, identifying, location, equipment, editing, and provenance containers. A missing object returns an opaque no-store `404`; R2 or transform failure returns an opaque no-store `502`. It never redirects to an original on error. The legacy arbitrary resize endpoint and original redirect route are removed.

Recognized public source archive, manifest, metadata JSON, XMP, original, and workflow manifest routes return `410`. Malformed, opaque-separator, and unknown variants return generic `404` without lookup or normalization.

### 10. Motion layer

Use CSS custom properties and transitions for link, button, card, tile, and pager response.

Use the Web Animations API for:

1. Featured image dissolve.
2. Filter result settle.
3. New row reveal.
4. Result count refresh.
5. Mobile menu open and close.
6. Larger view open and close.

Use native `<dialog>` for the larger view. Use native `<details>` as the mobile menu semantic base.

`src/motion-core.js` exports timing values, keyframe presets, stagger calculations, and reduced motion decisions as pure functions. `src/client.js` applies them to DOM elements, stores element animations in a weak map so later input cancels earlier motion, and tracks one global set capped at twelve running element animations.

No motion library is added.

## Interaction details

The eleven named interactions, exact durations, limits, reduced motion behavior, input modes, and acceptance criteria are defined in section 17 of the audit document. They are required, not optional inspiration.

Implementation order:

1. Motion tokens and helpers.
2. Link and button response.
3. Gallery card and mosaic attention.
4. Decode gated featured dissolve.
5. Filter and progressive reveal motion.
6. Count refresh.
7. Mobile menu settle.
8. Larger view.
9. Neighbor cue.

## State and data flow

```text
Private R2 source
  -> authenticated build fetch
  -> private normalization
  -> editorial ledger join
  -> strict public projection
  -> HTML, client catalog, JSON-LD, and sitemaps
  -> Workers Static Assets

Private R2 original
  -> Worker R2 binding
  -> named image transform with metadata none
  -> public derivative response
```

No browser response contains the private normalized record.

## Error handling

### Build source failure

If a private source object cannot be read, the build stops with a short hashed source reference and no object key, source path, provider response, or credential detail. It does not use a stale public URL as fallback.

### Editorial ledger failure

If an ID is missing required copy, duplicated, unknown, or banned, the build stops and reports the canonical public ID when it can be computed safely, otherwise the one-based ledger position, plus the field. It never prints the raw stable source ID. No generic public copy is silently generated.

### Image failure

Missing private image returns `404`. Transform failure returns `502`. Both use `no-store`. Neither response reveals bucket, origin, object metadata, or stack trace. Neither falls back to an original.

### Client catalog failure

The home retains its server rendered selection. It shows the exact filter failure copy and `Try again`. Ordinary links continue to work.

### Empty filters

The gallery shows the exact empty heading, message, and clear action. It does not show an empty grid without explanation.

### Interrupted motion

The latest user intent wins. Existing animations cancel. Stale image decode completions are ignored through a generation token. Correct content never waits for animation.

### Reduced motion

All state changes are immediate. Color, border, focus, and visibility continue to communicate state.

## Accessibility design

1. The gallery remains usable without JavaScript.
2. Every card is one normal link.
3. Image links use approved accessible names in the pattern `${title}, ${location}`.
4. Decorative card images retain empty alt text when the enclosing link provides the accessible name.
5. Meaningful featured and detail images use approved alt text.
6. Duplicate hidden figcaption text is removed.
7. Focus outlines remain visible above motion layers.
8. Hover only effects have focus equivalents.
9. Touch navigation never becomes a preview trap.
10. Live regions announce one settled filter summary.
11. The mobile menu closes on Escape and restores focus.
12. The larger view has a label, a visible close button, focus containment, Escape close, and trigger focus restoration.
13. Pinch zoom and page zoom remain available.
14. The implementation is checked at 200 percent zoom and at the existing narrow breakpoints.

## Performance design

1. No runtime package is added.
2. Images keep fixed width and height attributes.
3. The home keeps one eager high priority image.
4. Card and mosaic images stay lazy and async decoded.
5. Motion uses transform and opacity.
6. At most twelve elements animate at once.
7. No persistent `will-change` is applied to all cards.
8. The featured dissolve holds no more than two image layers.
9. The client does not preload the whole gallery.
10. The home HTML stays under the existing 180 KB limit.
11. The client catalog remains deferred and content hashed.

## Security and privacy design

1. Public R2 access is disabled only after the private derivative path is verified.
2. Any `r2.dev` public URL is disabled separately from the custom domain.
3. Old original and sidecar cache entries are purged.
4. The known GPS bearing source is used as the binary regression sample.
5. Content Credentials are not preserved by this refactor. If provenance is reissued later, it requires a separate reviewed contract.
6. Managed crawler and training restrictions may remain at the edge, but their technical language is not inserted into the gallery UI.
7. Rights and licensing language remains plain and visible.

## Cloudflare implementation basis

1. R2 public access is managed separately for a custom domain and the `r2.dev` development URL: <https://developers.cloudflare.com/r2/buckets/public-buckets/>.
2. A Worker Images binding can transform bytes read from a private R2 binding without exposing a source URL: <https://developers.cloudflare.com/images/transform-images/bindings/>.
3. Image transformation options include explicit metadata handling: <https://developers.cloudflare.com/images/transform-images/transform-via-workers/>.
4. Workers Static Assets redirects do not replace explicit Worker routing when Worker code handles the request first: <https://developers.cloudflare.com/workers/static-assets/redirects/>.

## Testing design

### Unit tests

1. Public projection allowlist.
2. Copy ledger coverage and banned phrase checks.
3. Result heading and summary contract.
4. Legacy status query removal.
5. Motion timing, stagger cap, and reduced motion decisions.
6. Private source path construction without public origin fallback.
7. Worker preset validation, private object handling, transform failure, metadata none, and route denial.

### Distribution verification

Parse every generated artifact and prove:

1. All 356 photograph pages exist and use approved copy.
2. No banned presentation string appears in visible text, title text, alt, aria label, aria description, placeholder, title attribute, social description, public state attribute, or JSON-LD string.
3. No forbidden private key, original, media host, source path, sidecar, prompt, review warning, equipment field, provenance, confidence, evidence, or legacy search value appears.
4. Every JSON-LD image URL uses a named derivative.
5. Rights and licensing fields remain.
6. Public client JSON has only the allowlisted keys.
7. The old policy route has a permanent redirect.
8. The larger view uses a detail derivative.
9. All eleven interaction hooks and reduced motion rules exist.
10. Every canonical photograph path is derived from approved title plus canonical ID, and all 356 pages are indexable and in the photograph sitemap.
11. Home HTML, eager image count, lazy image rules, hashed catalog, and persistent `will-change` limits pass.

### Binary image verification

Inspect one landscape, one portrait, one 2026 source, and the known 2025 GPS-bearing source. Request AVIF, WebP, and JPEG through each of the four negotiated presets, then fixed JPEG social output, for 52 checks. Parse JPEG, PNG, WebP, and AVIF containers. Permit structural containers and approved color profiles only. Fail on Exif, IPTC, XMP, JUMBF, Content Credentials, location, serial, capture, equipment, software, or edit-history containers. Never scan compressed pixel bytes for short text fragments.

### Rendered verification

Check home, filtered home, main gallery, one year, one outing, one place, one collection, approved photograph, licensing, About, About the photographs, 404, mobile menu, larger view, and empty and failure states.

Use desktop, tablet, mobile, narrow mobile, keyboard, touch equivalent, reduced motion, and 200 percent zoom checks. Inspect console warnings and errors.

### Production verification

After explicit launch approval:

1. Confirm the live home uses the new title and gallery copy.
2. Confirm no old embedded metadata payload remains.
3. Confirm original and sidecar routes fail.
4. Confirm all named derivative routes work.
5. Confirm the known GPS sample is stripped.
6. Confirm public R2 custom domain and `r2.dev` access are disabled.
7. Confirm old caches are purged.
8. Confirm robots and managed edge policy still preserve intended search access.

## Considered visual companion

No separate visual companion was offered. The user requested a written audit and implementation plan, and the decisive questions were copy, privacy boundary, and motion behavior. Current state screenshots were captured directly for evidence instead of creating new mockups or generated visuals.

## Approval boundary

The user explicitly requested the complete written design and implementation plan in one planning goal. That authorizes these Markdown artifacts. It does not authorize implementation, deployment, public storage changes, cache purge, DNS changes, or image generation.
