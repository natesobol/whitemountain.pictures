# Site-Wide UI/UX Clean Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved site-wide UI/UX cleanup while preserving the existing visual identity and no-JavaScript archive baseline.

**Architecture:** Extend the static generator and its shared templates, add one pure catalog-state ES module, progressively enhance server-rendered home/archive content, and normalize the existing CSS system. Keep Cloudflare Worker routing and metadata/SEO policy unchanged.

**Tech Stack:** Node.js ESM, vanilla JavaScript, HTML/CSS, Vitest with Cloudflare Workers, Wrangler, Browser/Playwright rendered QA.

## Global Constraints

- Preserve the current palette, typography, imagery, card language, and editorial tone.
- Keep all archive cards and core navigation usable without JavaScript.
- Do not add a frontend framework or runtime dependency.
- Do not import the legacy 123-value weather filter.
- Preserve metadata privacy, review gates, canonical URLs, and image transformation bounds.
- Follow red-green-refactor for every behavior change.

---

### Task 1: Pure catalog state

**Execution status:** Completed in `7933a77`; red-green evidence retained in the task history.

**Files:**
- Create: `src/catalog-core.js`
- Create: `tests/catalog-core.test.ts`

**Interfaces:**
- Produces: `DEFAULT_FILTERS`, `normalizeFilters(input)`, `filterCatalog(items, filters)`, `optionCounts(items, filters, field)`, `filtersFromSearch(search)`, `filtersToSearch(filters)`, and `nextVisibleCount(current, total, increment)`.
- Consumes: plain catalog records with `year`, `season`, `status`, `title`, and `place` fields.

- [ ] **Step 1: Write failing unit tests**

Create tests that import the module and assert case-insensitive text search, combined filters, ignoring the current field for option counts, safe URL parsing, omission of default URL parameters, and reveal counts capped at the total.

```ts
expect(filterCatalog(items, { year: "2026", season: "Winter", status: "reviewed", query: "pierce" }))
  .toEqual([items[0]]);
expect(filtersToSearch({ year: "all", season: "Winter", status: "all", query: "  ridge " }))
  .toBe("?season=Winter&q=ridge");
expect(nextVisibleCount(24, 40, 36)).toBe(40);
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/catalog-core.test.ts`

Expected: FAIL because `../src/catalog-core.js` does not exist.

- [ ] **Step 3: Implement the pure module**

Use exact default fields `{ year: "all", season: "all", status: "all", query: "" }`. Match query against lowercase title and place, strip unknown query keys, and use `URLSearchParams` for deterministic serialization order: `year`, `season`, `status`, `q`.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/catalog-core.test.ts`

Expected: all catalog-core tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/catalog-core.js tests/catalog-core.test.ts
git commit -m "feat: add testable archive filter state"
```

### Task 2: Generated semantic and conversion contract

**Execution status:** Completed in `3676c3a`; all generated-output assertions pass.

**Files:**
- Modify: `scripts/build.mjs`
- Modify: `scripts/verify-dist.mjs`

**Interfaces:**
- Consumes: catalog-core asset filename and existing normalized photo objects.
- Produces: mobile navigation, ordered breadcrumbs, home/archive state hooks, photo collection links, licensing query links, and correct image descriptors.

- [ ] **Step 1: Add failing distribution assertions**

Require the generated output to satisfy these exact contracts:

```js
assert(home.indexOf('class="hero-copy"') < home.indexOf('data-photo-wall'), "Hero copy must precede wall links");
assert(home.includes('class="mobile-nav"'), "Homepage has no mobile navigation");
assert(home.includes('data-featured-link'), "Featured photograph is not actionable");
assert(home.includes('data-catalog-empty'), "Homepage has no empty state");
assert(home.includes('data-catalog-error'), "Homepage has no catalog error state");
assert(archive.includes('data-archive-filters'), "Archive has no filters");
assert(archive.includes('aria-live="polite"'), "Archive result count is not announced");
assert(licensing.includes('mailto:natesobol@gmail.com'), "Licensing has no direct contact action");
assert(samplePhoto.includes(' 640w') && samplePhoto.includes(' 2400w'), "Photo srcset descriptors are incorrect");
```

- [ ] **Step 2: Verify RED**

Run: `npm run verify:dist`

Expected: FAIL on the first missing UI contract.

- [ ] **Step 3: Implement template changes**

Update the generator to:

- hash and emit `catalog-core.js`, rewrite the client import, and load the client with `type="module"`;
- render desktop and native `<details class="mobile-nav">` navigation with consistent active state;
- render `<ol>` breadcrumbs;
- place hero copy before the mosaic and make the featured photograph an anchor;
- add home empty/error/retry hooks and polite result status;
- add archive search/year/season/status controls, data-rich cards, result/empty/load-more hooks;
- add photo-specific licensing query URLs, collection links, Archive parent state, `640w`/`2400w` descriptors, and `sizes="(max-width: 1180px) calc(100vw - 32px), 1132px"`;
- add a visible licensing email button and exact active state for About/Licensing;
- pass Archive state to trip/place/collection hubs.

- [ ] **Step 4: Build and verify GREEN**

Run: `npm run build` then `npm run verify:dist`.

Expected: distribution contract and all existing metadata/link checks PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/build.mjs scripts/verify-dist.mjs
git commit -m "feat: strengthen generated site UX contracts"
```

### Task 3: Resilient progressive enhancement

**Execution status:** Completed in `4ab5c68` and hardened in `77b075d`; 16 tests pass.

**Files:**
- Modify: `src/client.js`
- Modify: `tests/catalog-core.test.ts`

**Interfaces:**
- Consumes: catalog-core exports and generator `data-*` hooks.
- Produces: `initHomeCatalog()`, `initArchiveCatalog()`, `initLicensingLink()`, dependent option states, URL restoration, empty/error/retry states, and featured-link updates.

- [ ] **Step 1: Extend failing state tests**

Add edge cases for zero-result combinations, invalid URL values, Unicode/case-insensitive search, option counts under other active filters, and repeated reveal operations.

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/catalog-core.test.ts`

Expected: new edge assertions FAIL against the minimal module.

- [ ] **Step 3: Complete core behavior and client controllers**

Implement:

```js
form.addEventListener("change", () => render({ resetCount: true, updateUrl: true }));
search.addEventListener("input", () => render({ resetCount: true, updateUrl: true }));
window.addEventListener("popstate", () => { applySearchToForm(form); render({ resetCount: true }); });
```

The home controller must retain initial DOM on fetch failure, expose Retry, and update featured `href`, image, alt, title, and place together. The archive controller must add an enhanced marker, hide only non-visible cards, update option disabled states, preserve all server cards without JavaScript, and announce counts. Licensing must accept only `http:` or `https:` photo URLs before adding them to the email body.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/catalog-core.test.ts`, `npm run build`, and `npm run verify:dist`.

Expected: all tests and distribution checks PASS.

- [ ] **Step 5: Commit**

```bash
git add src/client.js src/catalog-core.js tests/catalog-core.test.ts
git commit -m "feat: add resilient archive interactions"
```

### Task 4: Shared visual-system and responsive cleanup

**Execution status:** Completed in `2459fbd`; emitted CSS parses with zero warnings.

**Files:**
- Modify: `src/styles.css`
- Modify: `scripts/verify-dist.mjs`

**Interfaces:**
- Consumes: generated classes and state attributes from Tasks 2–3.
- Produces: aligned containers, responsive navigation, archive controls, mobile hero behavior, consistent interaction states, and short-page footer layout.

- [ ] **Step 1: Add failing CSS contract checks**

Read the emitted CSS in `verify-dist.mjs` and require `--content-width`, `.mobile-nav`, `.page-hero`, `[data-archive-card][hidden]`, and `@media (max-width: 820px)` rules. Assert the page-hero rule includes `margin: 0`.

- [ ] **Step 2: Verify RED**

Run: `npm run verify:dist`.

Expected: FAIL because the CSS contract is incomplete.

- [ ] **Step 3: Implement the cleanup**

Add spacing/radius/content tokens; align internal header/content/footer widths; keep the home header full bleed; create 44px desktop/mobile navigation targets; style the disclosure menu; reset heading/figure margins; style archive filters, search, empty/error states, and hidden cards; add consistent inline-link and card hover/focus/active states; strengthen tile-caption contrast; balance long titles; use ordered breadcrumb wrapping; reduce content/footer double spacing; apply `content-visibility: auto`; protect hero text at 821–1120px; and hide the decorative mosaic at ≤820px while keeping the featured photograph.

- [ ] **Step 4: Verify GREEN**

Run: `npm run build` then `npm run verify:dist`.

Expected: CSS and distribution checks PASS.

- [ ] **Step 5: Commit**

```bash
git add src/styles.css scripts/verify-dist.mjs
git commit -m "style: normalize site-wide layout and interaction states"
```

### Task 5: Full verification and rendered QA

**Execution status:** Automated gate and completion audit are complete. Desktop/mobile rendered QA remains pending because the in-app Browser security policy blocks the local target and forbids alternate browser-surface workarounds.

**Files:**
- Modify if defects are found: the smallest relevant source/test file.
- Do not commit screenshots or temporary QA scripts.

**Interfaces:**
- Consumes: completed generated site.
- Produces: evidence for every approved requirement.

- [ ] **Step 1: Run the complete automated gate**

Run: `npm run check`.

Expected: typecheck, all tests, build, distribution verification, and Wrangler dry-run PASS with no relevant warnings.

- [ ] **Step 2: Start the exact local target**

Run Wrangler on `https://127.0.0.1:8787` when the in-app Browser accepts it. If its local-certificate path remains blocked, use the explicitly authorized Playwright fallback against a local HTTP static server and record the reason.

- [ ] **Step 3: Verify desktop flows**

At approximately 1440×900, check page identity, nonblank DOM, no framework overlay, console health, home selection, home filter/empty/retry affordances, archive filter/search/load-more/URL state, photo collection/licensing links, licensing prefilled email, About/Licensing current state, and 404 footer position.

- [ ] **Step 4: Verify mobile flows**

At approximately 390×844, verify mobile menu disclosure, no horizontal overflow, hero/featured-image order, no mosaic focus targets, one-column archive/cards/metadata, long-title wrapping, breadcrumb wrapping, controls, and 44px targets.

- [ ] **Step 5: Fix defects test-first and rerun**

For each defect, add the narrowest failing unit/distribution test, confirm RED, patch the smallest source, then rerun the affected check and the full gate.

- [ ] **Step 6: Completion audit**

Map every design requirement to unit output, generated HTML/CSS, verifier output, or rendered browser evidence. Do not mark complete while any item is missing or only indirectly supported.

- [ ] **Step 7: Commit final verified state**

```bash
git add src scripts tests docs/superpowers
git commit -m "feat: complete site-wide UI and UX cleanup"
```
