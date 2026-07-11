# White Mountains Gallery Refactor Implementation Plan

> For agentic workers: use `superpowers:subagent-driven-development` when executing this plan in the current task, or `superpowers:executing-plans` when carrying it into a separate task. Every implementation task follows test driven development and ends with its own verification checkpoint.

**Goal:** Recast White Mountains Pictures as a quiet, art-led gallery while removing public AI, capture-device, camera-metadata, source-file, and provenance exposure. Preserve the site's visual identity and technical quality. Add restrained, accessible interactions that make browsing feel calm without delaying access to a photograph.

**Architecture:** The private catalog remains the build input. A tracked editorial ledger becomes the only source for public titles, alternative text, captions, notes, places, ranges, outings, seasons, and collections. A strict projection converts private records into a small public type before any page or payload is rendered. Public images are served only through stable, canonical identifiers and fixed transformation presets. Static verification audits text, markup, JSON, routes, and rendered image bytes before release.

**Technology:** Node.js ESM, TypeScript declaration checking, Vitest, the Cloudflare Vitest pool, vanilla JavaScript, CSS, Cloudflare Workers, R2, Cloudflare Images transformations, `parse5` as a development-only dependency, and the existing build and verification commands. Do not add a client framework or a runtime animation package.

## Authority and scope

The following documents are normative for implementation:

1. `docs/WHITE_MOUNTAINS_GALLERY_COPY_AND_UI_AUDIT_2026-07-10.md` is the exact public-copy, interaction, accessibility, and acceptance authority.
2. `docs/superpowers/specs/2026-07-10-white-mountains-gallery-voice-motion-design.md` is the architecture and behavior authority.
3. The twelve files under `docs/gallery-copy/2025/` and `docs/gallery-copy/2026/` are the exact 356-photograph editorial and contextual authority.
4. `docs/gallery-copy/README.md` defines how those records are transcribed and validated.
5. `docs/STARTER_GOAL_WHITE_MOUNTAINS_GALLERY_REFACTOR_2026-07-10.md` is the handoff prompt, not a substitute for the four authorities above.

When two documents appear to disagree, use this precedence:

1. Privacy and safety requirements in this plan.
2. Exact static or templated wording in the copy and UI audit.
3. Per-photograph wording in the copy deck.
4. Architecture in the design specification.
5. Implementation detail in this plan.

## Non-negotiable constraints

1. Do not hand-edit `dist/`, `.cache/`, Wrangler output, generated declarations, or generated private maps.
2. Do not commit an R2 object key, source filename, local path, original image URL, source hash, capture timestamp, coordinate, camera or lens field, serial number, editing history, AI provenance, C2PA/JUMBF payload, or private catalog record.
3. Keep the generated canonical-ID-to-R2-key map ignored, uncommitted, outside `dist/`, unavailable to browser code, and absent from logs and thrown errors.
4. Do not derive public context from existing AI-generated titles, descriptions, keywords, tags, summaries, filenames, folder names, EXIF/IPTC/XMP fields, or model output. Public context comes only from the tracked editorial ledger.
5. Do not expose the words and phrases banned by the copy audit. Standard HTML metadata, image dimensions, and the approved rights statement remain allowed. Exact capture, equipment, coordinate, workflow, provenance, and source information remains private.
6. Preserve the established type scale, neutral palette, spacious composition, and photography-first layout unless the authority documents call for a specific change.
7. Do not generate or add SVG, PNG, raster, or icon assets. Existing photographs and text/CSS affordances are sufficient.
8. Do not add a frontend framework or a runtime animation dependency. Use CSS transitions, the Web Animations API, native elements, and the existing vanilla JavaScript architecture.
9. Write a failing test before each behavior change. See the failure for the expected reason. Implement only enough to pass. Run the focused test again before the broader suite.
10. Make the public-content projection correct before adding motion. Motion must never conceal missing or unsafe content.
11. Every animation must cancel cleanly, respect `prefers-reduced-motion`, preserve keyboard and touch use, and leave final state readable when JavaScript or animation fails.
12. Do not deploy, purge a cache, change R2 public access, alter DNS, or mutate production during Tasks 1 through 18.
13. The only remote operation allowed before production approval is one ephemeral `wrangler dev --remote` verification session in Task 18. Do not share or name that preview. Stop it immediately after the prescribed matrix.
14. Preserve unrelated working-tree changes. Stage only the files named by the active task and review the diff before every commit.

## Required execution order

Run the tasks in this order:

`1, 2, 3, 4, 5, 10, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18`

Task 10 deliberately precedes Task 6 so the safe public image route exists before public pages begin using canonical identifiers. Do not deploy or publish a rendered preview between Tasks 10 and 6. Task 19 is separately gated by explicit production approval.

## Planned file structure

Create these tracked source files:

```text
content/
  gallery-collections.json
  photo-copy/
    2025.json
    2026.json
scripts/
  audit-photo-copy.mjs
  audit-photo-copy.d.mts
  audit-public-images.mjs
  audit-public-images.d.mts
  gallery-copy.mjs
  gallery-copy.d.mts
  prepare-private-image-map.mjs
  prepare-private-image-map.d.mts
  private-catalog.mjs
  private-catalog.d.mts
  private-source.mjs
  private-source.d.mts
  public-artifact-audit.mjs
  public-artifact-audit.d.mts
  public-photo.mjs
  public-photo.d.mts
  public-schema.mjs
  public-schema.d.mts
src/
  motion-core.js
  motion-core.d.ts
tests/
  audit-photo-copy.test.ts
  audit-public-images.test.ts
  gallery-copy.test.ts
  motion-core.test.ts
  prepare-private-image-map.test.ts
  private-catalog.test.ts
  private-source.test.ts
  public-photo.test.ts
  public-schema.test.ts
```

Create this generated file during local commands, but never commit it:

```text
src/private-image-map.generated.ts
```

The generated module exports only `PRIVATE_IMAGE_KEYS` and `PUBLIC_PHOTO_PATHS`. It is server-only and must be ignored by Git.

Modify these existing areas as required:

```text
package.json
.gitignore
scripts/build.mjs
scripts/site-core.mjs
scripts/site-core.d.mts
scripts/verify-dist.mjs
src/catalog-core.js
src/catalog-core.d.ts
src/client.js
src/styles.css
src/worker.ts
wrangler.jsonc
tests/catalog-core.test.ts
tests/site-core.test.ts
tests/verify-dist.test.ts
tests/worker.test.ts
docs/ARCHITECTURE.md
docs/SEO_CONTENT_CONTRACT.md
docs/DEPLOYMENT_RUNBOOK.md
docs/IMAGE_EXPOSURE_SPEC.md
```

Use the actual existing documentation filenames if capitalization differs. Do not create duplicate variants.

## Task 1: Deny every legacy source and metadata route

**Purpose:** Close direct public paths before any broader refactor begins.

**Files:**

- Modify `src/worker.ts`.
- Modify `tests/worker.test.ts`.

### Step 1: Add failing denial tests

Write table-driven GET and HEAD tests for these anchored, case-insensitive route families:

```regex
^/photos/(2025|2026)/originals/[^/]+\.jpe?g$
^/photos/(2025|2026)/full-metadata-archive\.json$
^/photos/(2025|2026)/(manifest|collections|workflow-manifest)\.json$
^/photos/(2025|2026)/metadata/[^/]+\.json$
^/photos/(2025|2026)/xmp/[^/]+\.xmp$
^/photos/(2025|2026)/manifests?/[^/]+\.(c2pa|jumbf|json)$
```

For every family verify:

1. A normal path is denied.
2. An uppercase extension is denied.
3. A query string does not bypass denial.
4. GET and HEAD receive the same status and cache policy.
5. HEAD has no body.
6. The Assets binding is never called.
7. No object key, filename, provider detail, or exception text appears in the response or captured log.

Add explicit opaque-path tests for doubled slashes, backslashes, percent-encoded slash `%2f`, and percent-encoded backslash `%5c`. These must receive a generic `404` without normalization, redirect, lookup, or reflection.

Run the focused test and confirm it fails because the legacy route reaches the existing asset or resize logic.

### Step 2: Implement the denial boundary

Place the denial check immediately after safe URL parsing and before image routing, redirects, static assets, or any R2 lookup. Return:

```http
410 Gone
Cache-Control: no-store
Content-Type: text/plain; charset=utf-8
```

Use an empty body for HEAD. A short generic body such as `Gone` is acceptable for GET. Do not echo the path.

Treat malformed or opaque separator forms as generic missing resources. Do not decode and retry them. Keep the route match anchored so similarly named gallery pages are unaffected.

### Step 3: Verify and checkpoint

Run:

```powershell
npx vitest run tests/worker.test.ts
npm run typecheck
npm run test
```

Review the worker diff for logging and binding fallthrough. Commit only this task with a message such as:

```text
fix: deny legacy source media routes
```

**Completion gate:** Every listed source and metadata route is denied before Assets or R2, including GET, HEAD, query, case, and opaque-separator variants.

## Task 2: Build a private-only source and catalog loader

**Purpose:** Remove build-time dependence on public source URLs while preserving a deterministic local build.

**Files:**

- Create `scripts/private-source.mjs` and `scripts/private-source.d.mts`.
- Create `scripts/private-catalog.mjs` and `scripts/private-catalog.d.mts`.
- Create `tests/private-source.test.ts` and `tests/private-catalog.test.ts`.
- Modify `scripts/build.mjs` only after loader tests pass.
- Modify `package.json` to add the exact `private-source:refresh` command.

### Step 1: Specify the private object boundary in tests

Test a pure `validatePrivateObjectKey(key)` helper. It accepts only exact object keys below `photos/2025/` or `photos/2026/`. It rejects:

- absolute paths
- drive prefixes
- URLs and schemes
- `..` traversal
- backslashes
- doubled separators
- empty segments
- leading slashes
- query and fragment text
- control characters
- keys outside the two approved year prefixes

Test a cache-name helper that returns a SHA-256-derived filename with a `.json` extension. The filename must not contain any segment of the object key.

Test cache containment after resolution. A cache hit and an atomic write must remain below the configured private cache root. Error messages and logs may contain only a stable hash reference and a general failure category.

### Step 2: Implement isolated source retrieval

Implement a small dependency-injected source layer with these properties:

1. The default retrieval command is equivalent to `wrangler r2 object get <bucket>/<key> --remote --pipe` using an argument array, never a constructed shell string.
2. Bytes are parsed as JSON only after retrieval succeeds.
3. The cache write uses a sibling temporary file and atomic rename.
4. A failed retrieval does not fall back to a public web URL.
5. A malformed cache entry fails closed and can be replaced only by an explicit refresh.
6. The command never prints source JSON, the object key, or a local cache path.

Keep the bucket name in existing private configuration. Do not serialize it into `dist/` or a browser bundle.

### Step 3: Test and implement catalog normalization

Test `loadPrivateCatalog({ refresh, readJson })` with fixture adapters before using real data. It must:

1. Join the 2025 full archive and its manifest.
2. Read the 2026 manifest and per-photo sidecars required for the private join.
3. Normalize both years into one internal record shape.
4. produce exactly one record per raw source ID.
5. Reject missing, duplicate, or conflicting raw IDs.
6. Reject year disagreement and invalid dimensions.
7. Sort deterministically by the existing gallery chronology contract and then raw ID.
8. Keep every source filename, key, metadata field, and source-derived description private.
9. Throw sanitized errors that identify only the stage and a hashed reference.

Write declarations for the private types. Do not export private types from a module reachable by client code.

### Step 4: Cut the build over privately

After fixture tests pass, replace the build's public fetch or checked-in source dependency with `loadPrivateCatalog`. Preserve the current output temporarily. The strict public projection arrives in Tasks 3 through 6.

Add this exact package command:

```json
"private-source:refresh": "node scripts/private-source.mjs --refresh"
```

A normal build should use a valid local private cache. A missing cache must fail with a concise instruction to run `npm run private-source:refresh`, without revealing key names.

### Step 5: Verify and checkpoint

Run the focused tests, refresh from the authorized private bucket, and then run:

```powershell
npm run test
npm run typecheck
npm run build
```

Inspect `dist/`, test output, and build logs for object keys and source records. Commit only the loader, tests, declarations, package command, and build integration.

**Completion gate:** Builds no longer require a publicly reachable archive or manifest, private keys cannot escape the private loader, and normalized input remains deterministic.

## Task 3: Define the strict public projection and copy auditor

**Purpose:** Establish the only record shape that templates, payloads, schemas, and browser code may receive.

**Files:**

- Create `content/photo-copy/2025.json` and `content/photo-copy/2026.json` as empty schema-valid ledgers.
- Create `content/gallery-collections.json` with the exact six approved collection definitions from the copy audit.
- Create `scripts/public-photo.mjs` and `scripts/public-photo.d.mts`.
- Create `scripts/gallery-copy.mjs` and `scripts/gallery-copy.d.mts` with schema helpers only at this stage.
- Create `scripts/audit-photo-copy.mjs` and `scripts/audit-photo-copy.d.mts`.
- Create `tests/public-photo.test.ts`, `tests/gallery-copy.test.ts`, and `tests/audit-photo-copy.test.ts`.
- Modify `package.json` to add `audit:copy`.

Do not wire the empty ledgers into the production build during this task.

### Step 1: Lock the canonical identifier rules

Write tests for a pure canonical-ID converter. The mapping is mechanical and based only on the private raw ID:

```text
wmpics__img_0033 -> wmpics-img-0033
```

Requirements:

1. Lowercase the identifier.
2. Collapse each non-alphanumeric run to one hyphen.
3. Trim leading and trailing hyphens.
4. Reject an empty result.
5. Validate the result against `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
6. Audit the complete set for collisions before rendering anything.

Write tests for:

```js
approvedPhotoHref(title, canonicalId)
publicImageHref(preset, canonicalId)
```

`approvedPhotoHref` uses only the approved title and canonical ID. It must produce a stable path with the canonical ID as an unambiguous suffix. `publicImageHref` must return exactly `/images/{preset}/{canonicalId}` for an allowlisted preset and reject every other value.

### Step 2: Define the public type

The public projection must contain exactly these fields:

```text
id
href
year
season
title
alt
caption
note
locationLabel
rangeLabel
tripId
tripLabel
collectionIds
width
height
orientation
```

Rules:

1. `id` is the canonical public identifier, never the raw ID.
2. `href` is generated from the approved title and canonical ID.
3. Editorial and contextual fields come only from the tracked ledger.
4. Dimensions and orientation may come from the private image record after validation.
5. The ledger year must agree with the private record year.
6. `tripId` and `tripLabel` are both present or both absent.
7. No filename, source URL, object key, hash, tag array, equipment, timestamp, coordinate, workflow, model, provenance, or free-form private field is copied.
8. Reject unknown ledger fields and unknown output fields.

Write a fixture containing tempting private properties and prove `toPublicPhoto` cannot copy them. Test the output with an exact-key assertion, not a subset assertion.

### Step 3: Define the editorial-ledger contract

Each source record in the tracked JSON ledgers must contain the fields and values defined in `docs/gallery-copy/README.md`. `Omit` in the Markdown deck becomes the documented empty representation, not the literal word `Omit`.

The auditor must verify:

1. Exact equality between private source-ID sets and ledger source-ID sets.
2. Exactly 124 records for 2025 and 232 for 2026 when the deck is complete.
3. Unique raw IDs, canonical IDs, public paths, and titles.
4. Title, alt, caption, and optional note are trimmed and free of control characters.
5. Alt text contains 8 through 24 words and ends with a period.
6. Caption contains no more than 32 words.
7. Optional note contains no more than 45 words.
8. Seasons use only the approved vocabulary.
9. Location is nonempty. Range and outing fields follow the deck exactly.
10. Outing IDs are safe, stable, and date-free.
11. Collection assignments reference only the exact six tracked collection definitions.
12. No record reuses an exact legacy generated title, description, summary, or keyword string.
13. No public wording contains banned terms, unsafe technical phrasing, semicolons, em dashes, or the formulaic patterns named in the copy audit.

Make the `AI` check word-safe with `\bAI\b`; do not reject ordinary words that happen to contain those letters. Keep the complete banned-copy list in one exported constant used by both the ledger and artifact audits.

### Step 4: Implement safe auditor output

The CLI must support exactly:

```text
npm run audit:copy
npm run audit:copy -- --year 2025
npm run audit:copy -- --year 2026 --range 1-31
npm run audit:copy -- --format markdown
```

Range numbers are one-based, inclusive, and require a year. Reject unknown flags, reversed ranges, zero, and out-of-bound indices.

Terminal output may contain canonical IDs, ledger positions, public titles, and validation categories. It must not print raw IDs, source strings, filenames, paths, metadata values, or private record serialization. Markdown reports go only below `.cache/reports/` and follow the same safe-output rule.

### Step 5: Verify and checkpoint

Run fixture tests and type checking. Do not run the full corpus audit against the intentionally empty ledgers yet. Confirm the current production build is still unwired and unchanged.

Commit the public type, empty ledgers, six collections, auditor framework, declarations, fixtures, and command.

**Completion gate:** A tested exact-key public boundary and safe copy-audit framework exist before any editorial text is transcribed or rendered.

## Task 4: Transcribe and validate the 2025 editorial deck

**Purpose:** Convert the reviewed 2025 Markdown copy into the tracked machine-readable ledger without revising it during transcription.

**Files:**

- Modify `content/photo-copy/2025.json`.
- Modify tests only if a transcription edge case reveals a missing general validation rule.

**Source files, in order:**

1. `docs/gallery-copy/2025/001-031.md`
2. `docs/gallery-copy/2025/032-062.md`
3. `docs/gallery-copy/2025/063-093.md`
4. `docs/gallery-copy/2025/094-124.md`

### Step 1: Establish a mechanical transcription check

Add a test helper or one-purpose audit mode that compares the normalized JSON record with every labeled field in a selected Markdown range. The comparison must be character for character after only these documented normalizations:

1. Markdown field labels and surrounding formatting are removed.
2. `Omit` becomes the approved empty value.
3. A comma-separated collection list becomes an ordered JSON array without changing collection IDs.
4. Numeric position and year fields become numbers.

Do not normalize punctuation, apostrophes, whitespace inside sentences, capitalization, or wording. Fail with the public ledger position and field name, never the private raw ID.

### Step 2: Transcribe one reviewed range at a time

For each source file:

1. Copy all records into `content/photo-copy/2025.json` in deck order.
2. Preserve the raw join ID only in the private editorial source field defined by the ledger contract. It must be stripped by `toPublicPhoto` and excluded from all auditor output.
3. Copy title, alt, caption, optional note, year, season, location, optional range, optional outing ID and label, and collections exactly.
4. Run the selected range comparison.
5. Run the selected range copy audit.
6. Resolve transcription mistakes by returning to the Markdown authority. Do not improvise new copy in JSON.

### Step 3: Verify the complete 2025 set

Run:

```powershell
npm run audit:copy -- --year 2025
npx vitest run tests/audit-photo-copy.test.ts tests/public-photo.test.ts tests/gallery-copy.test.ts
npm run typecheck
```

The year audit must report exactly 124 complete records and zero warnings or errors. Review a generated safe report for position continuity from 1 through 124.

Commit the 2025 ledger as a standalone editorial checkpoint.

**Completion gate:** All 124 2025 entries match the reviewed Markdown deck exactly and satisfy the strict editorial contract.

## Task 5: Transcribe and validate the 2026 editorial deck

**Purpose:** Complete the 356-photograph tracked editorial source before any public cutover.

**Files:**

- Modify `content/photo-copy/2026.json`.
- Modify tests only for a newly discovered general validation edge case.

**Source files, in order:**

1. `docs/gallery-copy/2026/001-029.md`
2. `docs/gallery-copy/2026/030-058.md`
3. `docs/gallery-copy/2026/059-087.md`
4. `docs/gallery-copy/2026/088-116.md`
5. `docs/gallery-copy/2026/117-145.md`
6. `docs/gallery-copy/2026/146-174.md`
7. `docs/gallery-copy/2026/175-203.md`
8. `docs/gallery-copy/2026/204-232.md`

### Step 1: Transcribe in bounded ranges

Use the exact mechanical process from Task 4. Run the character comparison and copy audit after every 29-record range. Preserve deck order and never make an editorial adjustment only in JSON.

### Step 2: Audit the complete joined corpus

Run:

```powershell
npm run audit:copy -- --year 2026
npm run audit:copy
npm run test
npm run typecheck
```

The audits must prove:

1. 232 complete 2026 records.
2. 356 complete records across both years.
3. Exact equality with the private source-ID set.
4. No canonical-ID, title, route, or outing collision.
5. No unapproved collection ID.
6. No exact reuse of generated legacy prose.
7. No banned or formulaic public wording.

Create a safe Markdown audit report below `.cache/reports/` and inspect its counts and position ranges. Do not commit the generated report.

Commit the 2026 ledger as a standalone editorial checkpoint.

**Completion gate:** The tracked ledgers contain exactly 356 reviewed records, match all twelve authority files, and pass the complete copy audit.

## Task 10: Introduce canonical image delivery and safe redirects

**Execution note:** Execute this task immediately after Task 5, before Task 6. The numbering preserves conceptual grouping with the later media audit. Do not publish a preview between this task and Task 6.

**Purpose:** Ensure the safe image delivery boundary exists before public markup begins using canonical identifiers.

**Files:**

- Create `scripts/prepare-private-image-map.mjs` and `scripts/prepare-private-image-map.d.mts`.
- Create `tests/prepare-private-image-map.test.ts`.
- Modify `.gitignore`.
- Modify `package.json`.
- Modify `src/worker.ts` and `tests/worker.test.ts`.
- Modify `scripts/build.mjs` image URL helpers and focused tests.
- Modify `wrangler.jsonc` only to add the existing-account Images binding required by the worker.

### Step 1: Test the generated private map

Write fixture tests for `preparePrivateImageMap` before generating a real file. It must:

1. Load the private catalog and the two complete editorial ledgers.
2. Convert each raw join ID to a collision-checked canonical ID.
3. Produce exactly 356 entries in `PRIVATE_IMAGE_KEYS`.
4. Produce exactly 356 approved canonical page paths in `PUBLIC_PHOTO_PATHS`.
5. Reject missing joins, duplicate keys, duplicate canonical IDs, and route collisions.
6. Sort keys deterministically.
7. Write through a sibling temporary file and atomic rename.
8. Emit only a success count or sanitized validation category to stdout.
9. Never include a key, raw ID, source filename, private path, or ledger serialization in an error.

The generated module must be valid TypeScript and export only:

```ts
export const PRIVATE_IMAGE_KEYS: Readonly<Record<string, string>>;
export const PUBLIC_PHOTO_PATHS: Readonly<Record<string, string>>;
```

The first map is server-only. The second map maps canonical IDs to approved page paths and is also consumed only by the Worker.

### Step 2: Make private-map generation unavoidable

Add `src/private-image-map.generated.ts` to `.gitignore` and prove with `git check-ignore` that it is ignored. Add this exact preparation command:

```json
"private-map:prepare": "node scripts/prepare-private-image-map.mjs"
```

Wire `npm run private-map:prepare` through the appropriate npm lifecycle hooks before every operation that imports the Worker or build helpers, including:

- build
- test
- watch or local development
- typecheck
- deployment and dry run
- a post-refresh verification build

Add these exact hooks so fresh source data regenerates the map and every importing command fails closed before execution:

```json
"postprivate-source:refresh": "npm run private-map:prepare",
"prebuild": "npm run private-map:prepare",
"pretest": "npm run private-map:prepare",
"pretest:watch": "npm run private-map:prepare",
"pretypecheck": "npm run private-map:prepare",
"predeploy": "npm run private-map:prepare",
"predeploy:dry-run": "npm run private-map:prepare"
```

The existing `dev` command begins with `npm run build`, so its map is prepared through `prebuild`. Do not rely on a developer remembering an unhooked preparation step.

A clean checkout with no private cache or generated map must fail closed with the exact setup order `npm run private-source:refresh` followed by `npm run private-map:prepare`. It must never fall back to visitor-controlled object-key construction or a public manifest.

### Step 3: Specify the image route

Write table-driven Worker tests for:

```text
/images/thumb/{canonicalId}
/images/card/{canonicalId}
/images/hero/{canonicalId}
/images/detail/{canonicalId}
/images/social/{canonicalId}
```

Only those five presets are valid. Resolve IDs with an own-property lookup in `PRIVATE_IMAGE_KEYS`. Never concatenate a URL segment into an R2 key.

Preset behavior:

| Preset | Bounding size | Format policy | Intended use |
| --- | ---: | --- | --- |
| `thumb` | 320 pixels | Negotiate AVIF, WebP, then JPEG | mosaic and compact preview |
| `card` | 640 pixels | Negotiate AVIF, WebP, then JPEG | gallery card |
| `hero` | 1280 pixels | Negotiate AVIF, WebP, then JPEG | home feature |
| `detail` | 2048 pixels | Negotiate AVIF, WebP, then JPEG | photograph page and larger view |
| `social` | 1200 pixels maximum width | JPEG only | social card and image sitemap |

All transformations use `fit: "scale-down"` and `metadata: "none"`. Preserve orientation and aspect ratio. Never upscale. Use the configured R2 binding to obtain source bytes and the Cloudflare Images binding to transform them.

For the four negotiated presets, use one pure tested `negotiatePublicFormat(accept)` helper. An explicit positive-quality `image/avif` and `image/webp` are eligible. Choose the higher quality value; choose AVIF when their values tie. An explicit `q=0` makes that format ineligible. When neither modern format is explicitly eligible, return JPEG, including for a missing header, `image/*`, or `*/*`. Header matching is case-insensitive and ignores unrelated parameters. Set `Vary: Accept` on every negotiated response, including errors that passed format negotiation. Do not set it for the JPEG-only social route.

### Step 4: Lock failure and method behavior

Test and implement:

1. GET returns transformed bytes and the expected content type.
2. HEAD returns the same status and headers with no body.
3. An unknown preset or canonical ID returns opaque `404`, `Cache-Control: no-store`.
4. A missing R2 object returns the same opaque `404` without revealing whether the ID or object was missing.
5. An R2 exception, Images exception, or non-success transform returns generic `502`, `Cache-Control: no-store`.
6. No error or log contains an object key, source filename, provider response body, canonical page title, or private exception text.
7. Query strings do not alter identity or preset behavior.
8. Opaque separator forms are not decoded or normalized into a match.
9. Task 1's legacy-source denial still runs before every image, redirect, and asset branch.

Every successful derivative response uses `Cache-Control: public, max-age=31536000, immutable`. Every `404`, `410`, and `502` produced by these protected routes uses `Cache-Control: no-store`. Canonical page and policy redirects use `Cache-Control: public, max-age=86400` so a corrected redirect can replace them without a year-long browser cache.

### Step 5: Implement canonical photo and policy redirects

For an old generated photo path, parse only the stable canonical-ID suffix. If it exists in `PUBLIC_PHOTO_PATHS`, return `308 Permanent Redirect` to the approved page path. Drop the query string. Do not store or import the old generated title text.

Unknown or ambiguous suffixes return opaque `404`. They must not redirect to a search page or expose a list of valid IDs.

Return `301 Moved Permanently` from:

```text
/about/photo-metadata/ -> /about/photographs/
```

Drop the query string. Keep this policy redirect in the Worker. Do not create a public `_redirects` file that contains the old wording.

Remove the legacy visitor-supplied resize route after the canonical route tests pass.

### Step 6: Update build image helpers without publishing

Change server-side image helpers to emit `/images/{preset}/{canonicalId}` from a validated `PublicPhotograph`. Do not pass raw IDs or keys to templates.

The current public pages may be temporarily inconsistent until Task 6. Run local verification immediately and continue directly into Task 6. Do not deploy, upload, or share this intermediate state.

### Step 7: Verify and checkpoint

Run:

```powershell
npm run test
npm run typecheck
npm run build
npm run verify:dist
npm run deploy:dry-run
git check-ignore src/private-image-map.generated.ts
```

Inspect built JavaScript and HTML for source keys and raw IDs. Commit only the generator, ignore rule, bindings/configuration, Worker boundary, tests, declarations, and build helper change.

**Completion gate:** Every public image request uses a fixed preset and canonical ID, the private lookup is generated and ignored, failures are opaque, and legacy source paths remain denied.

## Task 6: Make the public-content cutover atomically

**Purpose:** Replace all generated and source-derived public prose with the reviewed static copy and strict public ledger in one build boundary.

**Files:**

- Complete `scripts/gallery-copy.mjs` and `scripts/gallery-copy.d.mts`.
- Modify `scripts/build.mjs`, `scripts/site-core.mjs`, and their declarations and tests.
- Modify `src/catalog-core.js`, `src/catalog-core.d.ts`, and tests as needed for public records.
- Modify `src/client.js` only where static labels or licensing-field names are owned there.
- Modify `scripts/verify-dist.mjs` with initial copy checks. The exhaustive artifact audit arrives in Task 11.

### Step 1: Test the exact static copy authority

Convert sections 6 through 13 of the copy and UI audit into exact string and template tests. Include every route, document title, breadcrumb, heading, introductory paragraph, button, form label, empty state, failure state, footer line, About section, licensing field, dialog label, and 404 message named there.

Keep templated copy in pure functions with explicit inputs. Test singular, plural, absent optional context, and HTML-escaping cases. Examples include:

- page and route titles
- `From ${locationLabel}.`
- `Related outing: ${tripLabel}.`
- the exact filtered count line
- all load, filter, dialog, and licensing failure messages

The wording in the audit is literal. Do not polish it while implementing. Any later copy change must first change the authority document and its test.

Use one exported word-safe banned-copy matcher shared with Task 3. Test both true matches and safe near-matches.

### Step 2: Project before any renderer receives data

At build startup:

1. Load the complete private catalog.
2. Load and audit both complete editorial ledgers and six collection definitions.
3. Join each private record to exactly one ledger record by the private raw join ID.
4. Immediately call `toPublicPhoto`.
5. Pass only `PublicPhotograph` records and approved collection text to page generators, payload builders, schema builders, sitemap builders, and reports.

Do not retain a closure, map, callback, or debug object that allows downstream rendering code to recover the private record. Templates and serializer functions must accept `PublicPhotograph` in their declarations and tests.

Remove the legacy `photo.approved`, generated metadata approval, and review-threshold gate. All 356 ledger-complete photograph pages are indexable. Every nonempty approved collection, year, place, range, and outing hub is indexable.

### Step 3: Make every public context field tracked

Generate place, range, outing, season, and collection presentation only from the ledger. Do not infer a public location from folder names, filenames, capture data, tags, or old descriptions.

The collection module must use only the six exact tracked collection IDs, labels, descriptions, order, and assignments. Reject implicit collections and empty collection pages.

Build safe search text with:

```js
normalizeSearchText([
  photo.title,
  photo.locationLabel,
  photo.rangeLabel,
  photo.tripLabel
])
```

Do not include caption, note, raw ID, filename, tag, old title, old description, or private context in `searchText`.

### Step 4: Replace sitewide text and routes

Implement every exact string in the copy audit across:

- shared header and navigation
- footer
- home page
- gallery browser
- year pages
- place and range hubs
- outing hubs
- collection pages
- photograph pages
- About page
- About photographs page
- licensing interface
- 404 and recoverable error states

Generate `/about/photographs/`. Do not generate the old policy page. The Worker redirect from Task 10 owns the old URL.

Escape every editorial value at the HTML boundary, including text, attributes, metadata descriptions, JSON-LD, and deferred JSON. Treat the tracked ledger as reviewed content, not trusted markup.

### Step 5: Make licensing composition safe and exact

Extract the mail composition into a pure tested helper. It may include only:

- the approved public photograph title
- its same-origin approved canonical page path
- the exact form labels and user-entered values

The exact labels are:

```text
Photo page
Intended use
Placement
Audience or circulation
Territory
Duration
Requested dimensions
```

Reject or drop a non-same-origin photo URL. Do not include a source filename, object URL, raw ID, metadata, or device information. Keep user input length-bounded and line-ending normalized.

### Step 6: Verify the atomic cutover

Run:

```powershell
npm run audit:copy
npm run test
npm run typecheck
npm run build
npm run verify:dist
```

Search generated files for every banned vocabulary family, known source markers, and legacy policy paths. Review representative home, gallery, photograph, About, place, outing, and collection HTML. Confirm there are exactly 356 photo pages and no unreviewed records.

Commit the complete public copy cutover as one checkpoint. Do not split it into a state where a page mixes old generated prose with the new ledger.

**Completion gate:** Every rendered word and public context field comes from an approved static string or tracked editorial record, and no renderer can access the private record.

## Task 7: Simplify gallery filtering around art-led language

**Purpose:** Remove review-status and technical filtering concepts while keeping browsing precise and calm.

**Files:**

- Modify `src/catalog-core.js` and `src/catalog-core.d.ts`.
- Modify `tests/catalog-core.test.ts`.
- Modify `scripts/build.mjs` and focused build tests.
- Modify `src/client.js` and `src/styles.css` only for filter semantics and labels. Motion arrives later.

### Step 1: Test the public filter model

The gallery has exactly three filter inputs:

1. year
2. season
3. text query

Remove status from the filter type, URL state, controls, badges, data attributes, result summaries, and tests. Ignore an obsolete `status` query parameter rather than reflecting or preserving it.

Test `hasActiveFilters` directly from normalized year, season, and query values. Never infer it from `matchingCount === totalCount` because an active query may legitimately match everything.

Export and test `normalizeSearchText`. Query matching must use only the precomputed safe `item.searchText`. Add negative tests proving a legacy tag, private filename fragment, equipment name, source ID, and old generated description cannot match.

### Step 2: Implement exact summaries and states

Use the exact unfiltered heading and filter language in the copy audit. The filtered summary is exactly:

```js
`Showing ${visible} of ${matching} matching ${matching === 1 ? "photograph" : "photographs"}. ${total} photographs in the gallery.`
```

Test zero, one, partial, all-visible, and active-filter-matches-all states. Use the exact filter-unavailable and empty-state copy from the audit.

### Step 3: Simplify cards and accessible names

Remove status badges and `data-status`. A card may show the approved title and this safe contextual line:

```text
${locationLabel} · ${season} ${year}
```

Omit absent components and the separator next to an absent component. Do not show a placeholder such as `Unknown`, `Untitled`, or `Metadata unavailable`.

The link's accessible name must clearly include the approved title. Visible contextual text must expose the approved location without relying on an image's alt text.

Test card geometry at narrow and wide breakpoints. Landscape cards remain centered 3:2. Portrait cards remain centered 4:5 at every width. Remove the existing narrow-screen portrait 3:2 rule and 35 percent vertical position. Add a rendered regression check for deck item 106 confirming that both the planets and summit remain visible at the narrow breakpoint.

### Step 4: Verify and checkpoint

Run focused catalog and site tests, then `npm run test`, `npm run typecheck`, `npm run build`, and `npm run verify:dist`. Inspect the gallery with no filters and with each filter combination.

**Completion gate:** Browsing is organized only by year, season, and approved public words, with exact calm summaries and no review or metadata concepts.

## Task 8: Refactor photograph pages as art labels

**Purpose:** Make each photograph page read like a quiet gallery label while preserving useful place and rights context.

**Files:**

- Modify the photograph-page generator in `scripts/build.mjs` or its extracted helper.
- Modify `scripts/site-core.mjs` if shared art-label helpers belong there.
- Modify `src/client.js` for dialog initialization only.
- Modify `src/styles.css` for the static photograph-page layout.
- Add or modify structural tests in `tests/site-core.test.ts` and `tests/verify-dist.test.ts`.

### Step 1: Lock the exact narrative order

Write a structural test that requires this order:

1. breadcrumb and approved title
2. main photograph
3. approved caption
4. optional `A closer look` note
5. optional related outing
6. optional approved collection memberships
7. licensing action
8. compact art label
9. previous and next links under `More photographs`

Do not emit an empty heading or wrapper for an absent optional section.

### Step 2: Implement the main photograph safely

The main image must use only canonical preset URLs. Include a useful `srcset`, validated intrinsic width and height, and the approved alt text. Give this primary image the appropriate high fetch priority. Preserve the current composition and never stretch or upscale it.

The larger-view button starts hidden. Reveal it only after dialog initialization succeeds. Provide a `<noscript>` link labeled `View larger` to the approved detail derivative so the larger photograph remains available without JavaScript.

### Step 3: Implement exact narrative and context

Use the exact labels from the copy audit:

- `A closer look`
- `Related outing: ${tripLabel}.`
- the approved collection-membership heading and links
- `License this photograph`
- `More photographs`

The art label contains only these rows when values exist:

```text
Place
Range
Season
Year
Outing
Photographer
Rights
```

Do not show tags, technical details, original file links, capture data, editing data, camera fields, a metadata accordion, or a source-download link.

### Step 4: Make the native dialog resilient

Use a native `dialog` with an exact accessible title, approved caption, canonical `detail` derivative, and an accessible status node. Use the exact failure wording from the copy audit.

Escape dialog text and attributes. If the dialog API or initialization is unavailable, leave the button hidden and preserve the noscript/direct-link fallback. Motion and close choreography are implemented in Task 16.

### Step 5: Verify and checkpoint

Run focused structural tests, `npm run test`, `npm run typecheck`, `npm run build`, and `npm run verify:dist`. Inspect pages with every optional-field combination, portrait and landscape photographs, first and last pager states, JavaScript disabled, and a simulated detail-image failure.

**Completion gate:** Each photograph page presents the image, reviewed reflection, approved place context, rights, and neighboring work without technical or source detail.

## Task 9: Minimize public payloads, schema, and indexing

**Purpose:** Make every machine-readable surface match the same public-only model as visible pages.

**Files:**

- Modify `src/catalog-core.js` and `src/catalog-core.d.ts`.
- Create `scripts/public-schema.mjs` and `scripts/public-schema.d.mts`.
- Create `tests/public-schema.test.ts`.
- Modify `scripts/build.mjs`, sitemap helpers, robots output, and security-header generation.
- Modify `scripts/verify-dist.mjs` and tests.

### Step 1: Lock the twelve-key browser catalog

Every browser catalog record contains exactly:

```text
href
title
locationLabel
alt
thumb
hero
width
height
orientation
year
season
searchText
```

Use exact-key tests recursively. `searchText` is the safe derived string from Task 6. No other public ledger field is required by the gallery browser.

`data-featured-line` contains only season and year. If season is absent, it contains year only. It must never contain caption, note, location source, or a metadata-derived phrase.

### Step 2: Create an allowlisted schema builder

Build `ImageObject` and page JSON-LD through a recursive allowlist. For each value, test the key name and source. Approved image schema may include:

- canonical public URL
- approved title or caption
- approved location label
- approved rights and creator statement
- canonical thumbnail, detail, and social image URLs
- validated dimensions that correspond to the emitted fixed representation

Do not emit `encodingFormat` for negotiated image URLs. Compute the `detail` dimensions for a 2048-pixel maximum width from validated source dimensions without upscaling. Never include source dates, capture dates, device or lens fields, exact coordinates, keywords, workflow fields, editing software, provenance, filenames, hashes, object paths, or private URLs.

Export the schema allowlist so Task 11's artifact audit can enforce the same contract.

### Step 3: Correct indexing and generated infrastructure

Generate sitemap entries for:

1. all 356 complete photograph pages
2. all nonempty approved year, place, range, outing, and collection hubs
3. home, gallery, About, and About photographs

Remove review-state `noindex` logic. Do not derive `lastmod` from capture time. Use an approved editorial publication date if one exists, or omit `lastmod`.

Do not write private values to a build report under `dist/`. If a diagnostic report is required, write a safe aggregate report below `.cache/reports/`.

Remove the old public media host from the Content Security Policy and remove the legacy resize route from robots output. Retain the literal security header `Permissions-Policy: camera=()` as the one documented internal exception to the word `camera`; it is a browser capability denial, not gallery copy.

### Step 4: Verify and checkpoint

Run focused schema and payload tests, then `npm run test`, `npm run typecheck`, `npm run build`, and `npm run verify:dist`. Inspect all JSON and JSON-LD with a recursive key dump. Confirm sitemap counts and canonical paths.

**Completion gate:** HTML-adjacent data, JSON, JSON-LD, sitemap, robots, and headers expose only approved public values and canonical routes.

## Task 11: Audit every generated artifact and served derivative

**Purpose:** Turn the privacy and copy contract into deterministic release-blocking checks across markup, serialized data, routes, and image bytes.

**Files:**

- Add `parse5` as a development-only dependency.
- Create `scripts/public-artifact-audit.mjs` and `scripts/public-artifact-audit.d.mts`.
- Create `scripts/audit-public-images.mjs` and `scripts/audit-public-images.d.mts`.
- Create `tests/audit-public-images.test.ts`.
- Extend `scripts/verify-dist.mjs` and `tests/verify-dist.test.ts`.
- Modify `package.json` to add `audit:images` and include the artifact audit in `verify:dist`.

### Step 1: Parse public artifacts instead of grepping HTML alone

Write import-safe pure helpers and fixture tests before adding CLI behavior. Use `parse5` to inspect generated HTML. Collect and validate:

- visible text nodes, excluding scripts and styles
- document titles
- image alt text
- `aria-label`, `aria-description`, `placeholder`, and `title` attributes
- meta descriptions and social text fields
- every `data-search` and `data-featured-line` value
- JSON-LD script contents
- deferred or embedded JSON payloads
- canonical URLs, image URLs, and internal links

Use structural parsing to prevent entity encoding, split text nodes, or attribute placement from bypassing a text check.

### Step 2: Enforce recursive public JSON allowlists

Walk every public JSON value recursively. Reject any key outside the artifact-specific allowlist. At minimum, treat these exact key families as forbidden wherever they appear in public output:

```text
rawId
sourceId
sourceKey
objectKey
filename
fileName
originalFilename
originalUrl
sourceUrl
localPath
pathOnDisk
sha256
hash
checksum
exif
iptc
xmp
c2pa
jumbf
provenance
workflow
model
generator
software
editingSoftware
prompt
negativePrompt
camera
cameraMake
cameraModel
bodySerialNumber
lens
lensModel
lensSerialNumber
focalLength
aperture
shutterSpeed
exposureTime
iso
capturedAt
captureDate
dateTimeOriginal
gps
gpsLatitude
gpsLongitude
latitude
longitude
coordinates
keywords
tags
legacyTitle
legacyDescription
legacySummary
metadata
```

Key checks are case-insensitive and separator-insensitive so `camera_model`, `CameraModel`, and `camera-model` are equivalent. Avoid broad substring rules that would reject approved words by accident.

Use focused source-value fingerprints that detect known private path forms, raw-ID structure, R2 source routes, local-drive paths, and legacy public-media route families without committing any sensitive source value to the test. Derive fingerprints from safe patterns or hashes.

### Step 3: Verify complete site structure

The artifact audit must prove:

1. The public catalog has exactly 356 exact-key records.
2. The ledgers contain exactly 356 records and join one-to-one with canonical routes.
3. Exactly 356 canonical photograph pages exist.
4. Every approved nonempty hub exists and every empty hub is absent.
5. The old policy page and a public `_redirects` file are absent.
6. No original, archive, sidecar, metadata, XMP, provenance, or manifest artifact exists below `dist/`.
7. JSON-LD uses the exported schema allowlist.
8. Exact static copy appears on its designated route and forbidden legacy copy does not.
9. Sitemap and canonical URLs use the approved title plus canonical-ID routes.
10. Home HTML remains at or below 180 KB before compression.
11. Only the intended initial images are eager and the rest are lazy.
12. Catalog hashes and script references agree.
13. No persistent `will-change` rule appears.
14. Every `data-search` equals the safe normalization of approved title, place, range, and outing only.

Report failures by public route, canonical ID, JSON path, or ledger position. Never print a private record or source value.

### Step 4: Implement format-aware binary metadata inspection

Do not search compressed pixel bytes for words. Parse only the metadata and container structures defined by each format.

**JPEG**

Allow structural markers, JFIF APP0, and normalized ICC profile APP2. Reject EXIF/XMP APP1, JUMBF/C2PA APP11, IPTC/Photoshop APP13, Adobe APP14, COM, and any unknown APP marker.

**PNG**

Allow required structural chunks and normalized color chunks. Reject `eXIf`, all textual chunks, location-bearing chunks, and any unknown ancillary metadata chunk.

**WebP**

Allow image structure and normalized `ICCP`. Reject `EXIF`, `XMP `, and unknown metadata chunks.

**AVIF**

Allow required ISO-BMFF image structure and normalized color properties. Reject Exif items, XMP MIME items, JUMBF/C2PA boxes or UUIDs, and unapproved UUID metadata.

Normalize or strip source color-profile descriptions if they carry creator, device, or workflow detail. Permit only the standard profile data required for faithful color.

### Step 5: Select a privacy-safe representative sample

Build the sample manifest privately from validated source properties, then write only canonical IDs and generic role labels to the ignored cache report. Select four distinct photographs:

1. the privately identified source that contains location metadata
2. the lexicographically first distinct portrait photograph
3. the lexicographically first distinct landscape photograph
4. the lexicographically first distinct photograph from the current catalog year

If one photograph satisfies multiple roles, keep it for the highest-priority role and select the next valid distinct photograph for the later role. Never print why the first item was selected, any coordinate, a raw ID, or source metadata.

### Step 6: Audit the 52-response image matrix

For each of the four canonical sample IDs, request:

- presets `thumb`, `card`, `hero`, and `detail` with `Accept: image/avif`
- the same four with `Accept: image/webp`
- the same four with `Accept: image/jpeg`
- preset `social` as JPEG

This is exactly 52 responses:

```text
4 photographs × 4 negotiated presets × 3 formats = 48
4 photographs × 1 fixed JPEG social preset = 4
total = 52
```

Every response must be a direct `200`, not a redirect. Verify content type, decodability, expected bounding dimensions, no upscaling, cache headers, `Vary` behavior, and zero rejected metadata structures.

### Step 7: Wire release-blocking commands

`npm run verify:dist` must perform the complete static artifact audit. `npm run audit:images -- --base-url <ephemeral-url>` performs the remote binary matrix and must reject a production URL unless the later production task supplies an explicit production flag.

Run fixture tests, full tests, typecheck, build, static verification, Worker dry run, and the image audit against the permitted ephemeral remote session in Task 18.

**Completion gate:** Release checks cover every public text and data surface plus format-aware inspection of 52 served derivatives, with privacy-safe diagnostics.

## Task 12: Add a small cancellable motion core

**Purpose:** Establish one accessibility-aware animation boundary before adding individual interactions.

**Files:**

- Create `src/motion-core.js` and `src/motion-core.d.ts`.
- Create `tests/motion-core.test.ts`.
- Modify `src/client.js` to initialize the shared motion preference and runner.
- Modify `src/styles.css` to add motion tokens and reduced-motion resets.

### Step 1: Define exact motion tokens

Use these durations:

| Token | Duration | Use |
| --- | ---: | --- |
| press | 80 ms | touch or pointer release |
| fast | 140 ms | underline, button, count, close |
| menu | 160 ms | menu entry |
| ui | 180 ms | cards, controls, supporting text |
| photo | 280 ms | image crossfade |

Use these easing curves:

```css
--ease-out: cubic-bezier(.22, 1, .36, 1);
--ease-standard: cubic-bezier(.2, 0, 0, 1);
```

Do not add spring simulation, elastic overshoot, parallax, looping motion, scroll hijacking, or decorative particles.

### Step 2: Test pure animation plans

Create pure plan helpers with exact outputs:

| Plan | Start | End | Duration | Stagger |
| --- | --- | --- | ---: | ---: |
| filter card | `translateY(6px)`, opacity `.84` | rest, opacity `1` | 200 ms | 18 ms, first 8 only |
| load card | `translateY(8px)`, opacity `.88` | rest, opacity `1` | 220 ms | 22 ms, first 12 only |
| result count | `translateY(2px)`, opacity `.72` | rest, opacity `1` | 140 ms | none |
| menu open | `translateY(-4px) scale(.99)`, opacity `.82` | rest, opacity `1` | 160 ms | none |
| menu close | current | settled closed state | 120 ms | none |
| dialog open | `scale(.985)`, opacity `.88` | rest, opacity `1` | 180 ms | none |
| dialog close | current | close state | 140 ms | none |
| featured line | `translateY(3px)`, opacity `.76` | rest, opacity `1` | 180 ms | 40 ms after image begins |

For reduced motion, each planner returns `null` or an explicit immediate-state plan. Test both modes.

### Step 3: Implement a bounded cancellable runner

The runner uses the Web Animations API when available. Requirements:

1. Store at most one active animation per element in a `WeakMap`.
2. Cancel the previous animation before starting a replacement on that element.
3. Track at most 12 active animations in a global `Set`.
4. When at capacity, finish or cancel the oldest nonessential animation before adding another.
5. Remove settled, cancelled, and failed animations from tracking.
6. Apply the correct final styles even if `animate()` rejects or is unavailable.
7. Do not leave inline transforms or opacity that hide content.
8. Expose a `cancelAllMotion()` used when the reduced-motion preference changes.

Use dependency injection for `matchMedia` and animation creation so Node tests do not need a browser.

### Step 4: Handle preference changes and fallback states

At startup and whenever `prefers-reduced-motion: reduce` changes:

1. cancel active animation
2. clear transient inline transform, opacity, transition delay, and animation delay values
3. remove smooth scrolling
4. apply final open, closed, visible, and selected states immediately

Add a CSS reduced-motion block that disables nonessential transition and animation durations without hiding native focus or breaking disclosure and dialog state.

### Step 5: Verify and checkpoint

Run the focused motion tests, `npm run test`, `npm run typecheck`, `npm run build`, and `npm run verify:dist`. Inspect the built client for only one motion-preference listener and no persistent `will-change`.

**Completion gate:** Later interactions share exact tokens, bounded cancellation, live reduced-motion handling, and readable fallbacks.

## Task 13: Implement five passive, peaceful interactions

**Purpose:** Add tactile clarity to navigation and photographs without turning the gallery into a motion showcase.

**Files:**

- Modify `src/styles.css`.
- Modify `src/client.js` only where hover-intent state or keyboard parity requires JavaScript.
- Extend `scripts/verify-dist.mjs` and focused tests for motion constraints.

These five interactions are independently testable and count toward the requested motion set.

### Interaction 1: Trail underline

On hover and `:focus-visible`, draw the existing-text underline from the logical start edge over 140 ms with `--ease-out`. Keep the text stationary. The active page keeps a complete line without replaying an entrance.

Use a pseudo-element or background-size technique. Do not add an image or icon. Under reduced motion, show the complete line immediately.

### Interaction 2: Button response

On fine-pointer hover, move a button upward by at most 1 pixel over 140 ms. On active press, move it to 1 pixel below its resting position over 80 ms. Keyboard focus keeps the existing focus ring and settled position. Do not change the control's width, font weight, or border geometry.

On coarse pointers, omit hover movement and retain only the 80 ms press response. Preserve native focus outlines.

### Interaction 3: Gallery card quiet lift

For a fine pointer only, move a card upward by 2 pixels over 180 ms while its image scales to at most `1.018` over 240 ms. Let the existing border and shadow settle with the same state. Keep the crop container clipped and never move the title separately from the card.

Keyboard focus on the card link produces the same settled state. Touch uses only the short press response. Do not dim neighboring cards.

### Interaction 4: Mosaic attention

After 70 ms of stable fine-pointer intent on a mosaic tile, scale its photograph to `1.015` and move the supporting label upward 3 pixels while changing opacity from `.82` to `1`. Cancel the pending timer when the pointer leaves before 70 ms.

Focus applies the final intent state without delay. Touch does not hold a hover state. Reduced motion updates emphasis without transform.

### Interaction 5: Neighbor cue

On hover or keyboard focus, the previous link shifts left by 2 pixels and the next link shifts right by 2 pixels over 160 ms. Text remains fully readable and the hit target does not move. Implement movement on an inner text wrapper so pointer geometry stays fixed.

Reduced motion uses only the existing underline or color emphasis.

### Shared acceptance checks

For all five interactions verify:

1. Fine-pointer hover, keyboard focus, and coarse-pointer behavior.
2. A visible focus indicator at 100%, 200%, and 400% zoom.
3. No content shift in a layout measurement test.
4. No animation duration above 280 ms.
5. No persistent `will-change`.
6. No generated visual asset or runtime animation dependency.
7. Reduced motion reaches the final readable state instantly.

Run `npm run test`, `npm run typecheck`, `npm run build`, and `npm run verify:dist`. Inspect home, gallery, photograph pager, and mobile navigation.

**Completion gate:** Five restrained interactions improve orientation and tactility without delaying navigation, moving hit targets, or competing with the photographs.

## Task 14: Make the featured photograph transition reliable

**Purpose:** Replace the fragile featured-tile swap with a decoded, latest-intent-wins crossfade.

**Files:**

- Modify `scripts/build.mjs` featured-tile markup and tests.
- Modify `src/client.js`.
- Modify `src/styles.css`.
- Extend `tests/site-core.test.ts` or add a focused featured-transition test using a small DOM fixture.

### Step 1: Lock the tile data contract

Every selectable featured tile carries only these validated public values:

```text
place
title
line
alt
href
src
srcset
width
height
```

`line` is the safe season-and-year line from Task 9. Do not embed caption, note, context blobs, metadata, raw IDs, or a serialized photo record.

The featured stage has two image layers. The inactive layer must have `aria-hidden="true"` and empty alt text. Only the active image exposes the approved alt text.

### Step 2: Test latest-intent-wins state

Use a monotonically increasing generation number. Test this sequence:

1. user requests tile A
2. A starts decoding
3. user requests tile B
4. B decodes first
5. A decodes later

Only B may become active. A's completion is ignored. Repeated intent on the already active tile performs no animation and no DOM churn.

Test decode success, decode rejection with a complete image whose `naturalWidth > 0`, total load failure, and reduced-motion mode.

### Step 3: Swap only after the incoming image is ready

Set the inactive layer's `src`, `srcset`, width, and height. Await `decode()`. Treat a rejection as usable only when the image is already complete and has a nonzero natural width. If the image cannot load, keep the current photograph and supporting copy unchanged.

After readiness and a current-generation check, update in one commit:

- active link destination
- place
- title
- line
- active image alt
- layer accessibility state

Never clear a currently readable line while awaiting the next image.

### Step 4: Apply the exact transition

The incoming image begins at opacity `0` and scale `1.006`, then settles to opacity `1` and scale `1` over 280 ms. The outgoing layer fades underneath it. Supporting line motion begins 40 ms after the image transition and uses the Task 12 featured-line plan.

Keep the stage dimensions fixed. Cancel or finish the previous transition before a replacement. Reduced motion swaps immediately after readiness with no transient opacity.

Trigger behavior:

- fine pointer: 70 ms hover intent
- keyboard: immediate on focus
- touch: immediate on explicit tile activation while preserving link navigation semantics

Do not require hover to discover or access a photograph.

### Step 5: Verify and checkpoint

Run focused state tests, then `npm run test`, `npm run typecheck`, `npm run build`, and `npm run verify:dist`. Manually move rapidly across at least six tiles, reverse direction, tab through tiles, use touch emulation, reject decode, throttle the network, and toggle reduced motion mid-transition.

**Completion gate:** The featured area never blanks, stale images cannot win, copy and destination remain synchronized, and the transition stays calm under rapid input.

## Task 15: Choreograph filtering, loading, and result counts

**Purpose:** Make gallery changes legible without animating hundreds of cards or delaying state accuracy.

**Files:**

- Modify `src/client.js`.
- Modify `src/styles.css`.
- Add focused state tests around filter and progressive-load orchestration.

### Step 1: Update semantic state before motion

When a filter or query changes:

1. normalize URL and filter state
2. compute matching records
3. update hidden state and accessibility state
4. update exact result text
5. move focus only if the current focused item becomes unavailable
6. animate the bounded visible subset

Never keep a nonmatching card interactive during a fade. Never announce a stale count while cards move.

### Step 2: Apply exact bounded animation

For a filter change, animate only the first eight newly visible cards with the Task 12 filter-card plan. Animate the result count once with the result-count plan.

For `Show more`, reveal the next batch semantically, then animate only the first twelve newly revealed cards with the load-card plan.

The concurrency budget is explicit:

- filter change: at most 8 cards plus 1 result count, total 9
- show more: at most 12 cards
- if a result announcement is pending during show more, queue its visual count animation until all 12 card animations settle

Screen-reader text updates immediately. Only its decorative visual motion is queued.

### Step 3: Preserve focus and announcements

If the focused card remains visible, preserve focus. If a filter hides the currently focused result, move focus to the updated result heading. If focus is outside the result list, do not move it, including for a pointer-only filter change.

Use one polite live region. Coalesce rapid keystrokes so only the settled result count is announced. Do not announce individual card entrances.

Reduced motion performs immediate show/hide and count updates. History back and forward must restore filter state and results without replaying a long entrance sequence.

### Step 4: Verify and checkpoint

Test no filter, one filter, combined filters, query input, zero results, matches-all, repeated `Show more`, rapid filter replacement, history navigation, keyboard focus loss, and reduced motion. Then run `npm run test`, `npm run typecheck`, `npm run build`, and `npm run verify:dist`.

**Completion gate:** Result state is immediately accurate and accessible while a small bounded subset settles gently into place.

## Task 16: Choreograph the mobile menu and larger-view dialog

**Purpose:** Give the two layered interfaces clear, native, reversible motion without compromising focus or fallback behavior.

**Files:**

- Modify `src/client.js`.
- Modify `src/styles.css`.
- Extend focused interaction tests for the navigation disclosure and native dialog.

### Step 1: Normalize menu control around the native disclosure

Keep the existing `details` and `summary` semantics. Implement one tested helper:

```js
closeMenu({ restoreFocus })
```

Use these exact focus rules:

- Escape closes and restores focus to the summary.
- An outside click closes without moving focus.
- Selecting a navigation link closes without moving focus away from the destination flow.
- Programmatic route change closes without restoring focus.

On open, use the Task 12 menu plan. On close, play the 120 ms close plan, then remove the `open` attribute. If another open or close request arrives, cancel the current animation and honor the latest state.

Reduced motion changes `open` immediately. JavaScript failure leaves the native disclosure usable.

### Step 2: Initialize the larger-view dialog progressively

Keep the larger-view button hidden until all required dialog handlers and safe image attributes are ready. Then unhide it. On activation:

1. set or confirm the canonical `detail` image
2. call `showModal()`
3. move focus according to native dialog behavior
4. play the 180 ms dialog-open plan

Fade the native backdrop from transparent to `0.72` opacity over 160 ms. Keep backdrop and panel cancellation in the same latest-state transaction so they cannot settle in opposite states.

If initialization fails, keep the button hidden and leave the direct/noscript larger-image path available.

### Step 3: Close the dialog through one path

Handle all close sources through one function:

- close button
- Escape through the `cancel` event
- backdrop click

For `cancel`, prevent the immediate native close, play the 140 ms close plan and matching backdrop fade, then call `close()`. Cancel a previous close or open animation before starting the new one. Restore focus to the exact opener after close.

An image-load failure keeps the dialog closable, exposes the exact status message from the copy audit in the accessible status node, and never leaks the failed URL or provider detail.

Reduced motion closes immediately. Page zoom, screen-reader mode, or lack of animation support must not trap focus.

### Step 4: Verify and checkpoint

Test every open and close route, rapid reopen, missing image, decode rejection, Escape, backdrop click, opener removal, reduced-motion changes, JavaScript failure, 200% and 400% zoom, keyboard-only use, and touch emulation.

Run `npm run test`, `npm run typecheck`, `npm run build`, and `npm run verify:dist`.

**Completion gate:** Menu and dialog state remain native and accessible, with concise cancellable motion and reliable focus restoration.

## Task 17: Update architecture, exposure, and deployment documentation

**Purpose:** Make the privacy boundary and release sequence understandable to a future maintainer without preserving unsafe examples.

**Files:**

- Modify `docs/ARCHITECTURE.md`.
- Modify `docs/SEO_CONTENT_CONTRACT.md`.
- Modify `docs/DEPLOYMENT_RUNBOOK.md`.
- Modify `docs/IMAGE_EXPOSURE_SPEC.md`.
- Modify other active documentation only when it contains a contradicted public-source or generated-copy instruction.

Use the actual existing filename if one differs. Do not create a second document with slightly different capitalization.

### Step 1: Document the public and private boundary

Include this exact conceptual flow in prose or a Mermaid diagram:

```text
private R2 catalog and sidecars
        ↓ private authenticated loader
ignored local private cache
        ↓ join on raw source ID
tracked editorial ledger
        ↓ strict toPublicPhoto projection
public HTML, catalog, JSON-LD, sitemap, and canonical image IDs

canonical public image ID
        ↓ server-only ignored map
private R2 object key
        ↓ fixed Cloudflare Images preset with metadata stripped
public derivative bytes
```

Explain that raw source IDs exist only at the private join boundary. Titles, alt text, captions, notes, locations, ranges, outings, seasons, and collections come only from the tracked editorial ledger. Standard dimensions and rights are public. Capture, equipment, coordinate, workflow, AI, provenance, file, and source data are private.

Do not include a real object key, filename, coordinate, source URL, local path, raw record, or metadata example.

### Step 2: Document indexing and editorial behavior

State clearly:

1. A complete ledger record is the publication gate.
2. There is no public review-status concept.
3. All 356 complete photo pages and all nonempty approved hubs are indexable.
4. Canonical photo paths use approved titles plus stable canonical-ID suffixes.
5. Old generated slugs redirect by suffix only.
6. `lastmod` never comes from capture time.
7. Search uses only approved title, location, range, and outing labels.
8. Exact public copy is governed by the dated audit and copy deck.

### Step 3: Write the production sequence as a gated runbook

The runbook must require this order:

1. Run all local copy, test, type, build, artifact, and Worker dry-run checks.
2. Run the permitted ephemeral remote preview and 52-response derivative matrix.
3. Obtain explicit production approval.
4. Deploy scrubbed Worker and static artifacts first.
5. Verify canonical routes and transformed derivatives on the production hostname.
6. Disable the R2 custom public domain and `r2.dev` access as two separate provider actions.
7. Verify both source access paths are closed.
8. Purge only the exact legacy URLs in the reviewed manifest.
9. Repeat the public route, source-denial, image-byte, and accessibility smoke checks.

The purge manifest must enumerate exact URLs or exact safe patterns for:

- home and affected public data payloads
- the old About policy page
- legacy photo HTML paths
- the legacy resize route
- old year and filename image paths
- media-host originals
- full archives and manifests
- sidecars and metadata paths
- XMP and provenance-manifest paths
- exact old immutable asset hashes generated during the release

Do not use a zone-wide purge when an exact manifest will close the exposure. Do not write sensitive URL examples into tracked documentation. Generate the concrete manifest privately during release and store only its safe aggregate result.

### Step 4: Define a privacy-preserving rollback

Rollback may restore the last known good scrubbed Worker and static build. It may not:

- reopen an R2 public domain
- restore the original or metadata route families
- restore a visitor-controlled resize URL
- deploy a build that depends on public source archives
- reintroduce generated legacy copy or source-derived payloads

If a regression cannot be fixed without reopening source media, leave the gallery in a safe degraded state and investigate privately.

### Step 5: Audit active documentation

Search active documentation for obsolete claims about public originals, metadata archives, AI copy generation, review-status indexing, filename routes, and capture-derived context. Rewrite or clearly archive those instructions. Preserve historical records only when needed, with a prominent note that they are not an active operational contract and without adding sensitive values.

Run the documentation link checker or applicable verification, then inspect the diff for unsafe examples.

**Completion gate:** Architecture and release documents teach the same private/public model as the code and provide a safe, explicitly gated launch and rollback sequence.

## Task 18: Run the complete preproduction acceptance matrix

**Purpose:** Prove the refactor is internally consistent, visually calm, accessible, and free of public source or metadata exposure before asking for production approval.

**Files:**

- Do not change production configuration in this task.
- Store temporary reports and screenshots only below `.cache/` or another ignored audit directory.
- Update source or tests only when a failure is traced to its owning earlier task.

### Step 1: Run the deterministic local gate

From a cleanly understood working tree, run:

```powershell
npm run audit:copy
npm run typecheck
npm run test
npm run build
npm run verify:dist
npm run deploy:dry-run
```

No warning may be waved through because it appears unrelated. Classify it and return to the owning task or document the preexisting unrelated condition with evidence.

Perform a direct recursive search of `dist/` for banned vocabulary, private key names, source route families, raw-ID shape, file extensions used by sidecars, and local-path forms. The only approved text exceptions are standards syntax in document metadata and the exact security header `Permissions-Policy: camera=()`.

### Step 2: Start one ephemeral remote verification session

The starter goal explicitly authorizes one temporary `wrangler dev --remote` session for acceptance because Cloudflare Images binding behavior and transformed bytes must be verified in the real service path.

Rules:

1. Use the existing authorized account and a random local port.
2. Do not create a named preview deployment.
3. Do not share the URL.
4. Do not change R2 access, DNS, routes, or production bindings.
5. Stop the process immediately after the matrix.
6. If remote preview is unavailable without a state-changing setup step, stop and report the blocked check. Do not expand authority.

### Step 3: Run source-denial and derivative checks

Against the ephemeral session:

1. Run every Task 1 GET and HEAD denial case.
2. Test opaque separator and query variants.
3. Test unknown canonical IDs and presets.
4. Test old photo-slug suffix redirects and the policy redirect.
5. Run `npm run audit:images -- --base-url <ephemeral-url>` and require all 52 responses to pass.
6. Confirm response and captured logs contain no object key, source path, provider body, or private exception.

### Step 4: Inspect the rendered interaction matrix

Use the repository's rendered-browser testing workflow and the frontend testing/debugging skill. Inspect at minimum:

- home
- gallery unfiltered
- gallery with each individual filter
- gallery with combined filters and query
- gallery zero-result state
- one photograph with every optional field
- one photograph with minimal optional fields
- portrait and landscape photograph pages
- year, place, range, outing, and collection hubs
- About
- About photographs
- licensing interface
- 404

At these viewport classes:

- narrow phone
- wide phone
- tablet or narrow desktop
- standard desktop
- wide desktop

For each relevant route verify:

1. keyboard traversal and visible focus
2. touch/coarse-pointer behavior
3. fine-pointer hover behavior
4. `prefers-reduced-motion: reduce`
5. 200% and 400% zoom
6. forced colors or high-contrast mode where supported
7. JavaScript disabled baseline
8. back and forward history behavior
9. slow image load and a forced image failure
10. no console error, unhandled rejection, or layout-shift regression

Review actual portrait and landscape crops at the final CSS-defined compositions. The approved contract is centered 3:2 for landscape cards and centered 4:5 for portrait cards at every breakpoint. For deck item 106, confirm that the planets and summit both remain visible on a narrow phone. Any narrow portrait 3:2 rule or 35 percent vertical position is a failure.

### Step 5: Review all eleven interaction families together

The final set uses the same eleven names and groupings as the copy audit:

1. trail underline
2. button response
3. gallery card quiet lift
4. mosaic attention
5. featured dissolve, including its supporting line
6. filter result settle
7. new row reveal
8. count refresh
9. mobile menu settle
10. larger photograph view
11. neighbor cue

Test the image and supporting line inside featured dissolve separately. Test the menu and larger-view dialog as separate interaction families. Confirm no route has more than one dominant movement at a time and that photographs remain the visual focus.

### Step 6: Resolve failures and repeat the full gate

For any failure:

1. record the public route, expected behavior, and safe symptom
2. identify the owning implementation task
3. add or tighten a failing regression test
4. make the smallest correction in that task's scope
5. rerun the focused test
6. rerun every command and relevant rendered check in this task

Use `superpowers:requesting-code-review` for a final review and `superpowers:verification-before-completion` before claiming the implementation is ready. Review the diff for accidental unrelated changes. Do not use blanket staging.

### Step 7: Produce a production approval packet

Summarize, without private values:

- commits and changed architecture
- 356-copy audit result
- static artifact audit result
- 52-image matrix result by format and preset
- source-denial route result
- rendered accessibility and motion matrix result
- exact planned R2 access changes
- exact safe purge-manifest count and categories
- privacy-preserving rollback identifier
- any remaining risk

Stop here and ask for explicit production approval.

**Completion gate:** All local and ephemeral acceptance checks pass, temporary remote state is stopped, and a safe approval packet is ready. Production remains unchanged.

## Task 19: Launch only after explicit production approval

**Authorization gate:** Do not begin this task because a prior task passed. A user with authority must explicitly approve the production deployment, R2 access changes, and exact cache purge.

### Step 1: Reconfirm the approved release state

Verify the commit or worktree is exactly the reviewed scrubbed state. Repeat the deterministic local gate. Confirm the private map is ignored and generated from the authorized private source. Confirm rollback points to a previously scrubbed release.

### Step 2: Deploy scrubbed code and artifacts first

Run the approved deployment command. Verify:

- home and canonical gallery routes
- representative canonical photo paths
- canonical image derivatives in each preset
- old photo-slug redirects
- old policy redirect
- all legacy source route denials
- no new public metadata or source output

If any check fails, use the privacy-preserving rollback. Do not reopen public source access.

### Step 3: Disable R2 public access explicitly

After the scrubbed Worker is confirmed healthy:

1. disable the R2 custom public domain
2. verify it is disabled
3. disable `r2.dev` public access
4. verify it is disabled

Treat these as separate actions and record their safe pass/fail state. Do not delete private source objects.

### Step 4: Purge the exact reviewed legacy manifest

Purge only the exact approved URL list and immutable asset hashes. Do not perform a zone-wide purge unless the user separately approves it after seeing why exact purge is insufficient.

Verify previously cached source, archive, metadata, original, resize, old policy, old photo, and old payload URLs no longer return sensitive content.

### Step 5: Repeat live acceptance

Run:

- live source-denial matrix
- all 52 image response checks
- canonical route and redirect checks
- catalog and JSON-LD spot checks
- home, gallery, photograph, About, and licensing smoke tests
- keyboard, mobile menu, dialog, reduced-motion, and filter smoke tests
- production log review using sanitized categories only

### Step 6: Report and close

Report the deployed release identifier, exact non-sensitive verification counts, R2 public-access state, purge count, rollback identifier, and any follow-up. Never include source URLs, object keys, raw IDs, filenames, coordinates, metadata, or private error bodies.

**Completion gate:** The scrubbed gallery is live, both R2 public-access modes are disabled, exact legacy cache entries are purged, all live checks pass, and rollback remains private and source-safe.

## Final definition of done

The refactor is complete only when all of the following are true:

- Every one of 356 photographs has exact reviewed editorial copy and contextual fields.
- No visible or machine-readable public surface contains AI, camera, lens, capture, coordinate, workflow, provenance, original-file, or source-system material.
- All photo and hub pages are generated from the strict public projection.
- Every public image is requested by canonical ID through one of five fixed presets.
- Served JPEG, PNG when applicable, WebP, and AVIF structures pass the format-aware metadata policy.
- All legacy original and sidecar routes are denied before public bindings.
- The old policy and generated photo slugs redirect without retaining old prose.
- The site uses the exact quiet gallery wording in the authority documents.
- Eleven restrained interaction families work with pointer, keyboard, touch, reduced motion, zoom, and failure states.
- No generated visual asset, frontend framework, or animation dependency was introduced.
- Automated tests, type checking, build, artifact verification, Worker dry run, 52-image matrix, and rendered acceptance all pass.
- Production changes were separately approved, safely sequenced, and verified, or remain explicitly unperformed.
