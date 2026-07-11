# Site-Wide UI/UX Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the approved residual site-wide UI/UX cleanup without changing the established alpine visual identity or no-JavaScript archive baseline.

**Architecture:** Keep `scripts/build.mjs` as the HTML source of truth, share normalization and result-copy behavior through `src/catalog-core.js`, and progressively enhance the generated pages from `src/client.js`. Apply the visual cleanup through the existing CSS token system and regenerate `dist`; do not patch generated HTML or cached metadata.

**Tech Stack:** Node.js ESM, vanilla JavaScript, semantic HTML, CSS, Vitest, Cloudflare Workers/Wrangler, Codex in-app Browser.

## Global Constraints

- Preserve the near-black alpine palette, green accent, serif headings, photographic layering, card language, and current information architecture.
- Preserve all unrelated worktree changes, especially `docs/UI_UX_SITEWIDE_RECOMMENDATIONS_2026-07-10.md`.
- Do not add Supabase, a frontend framework, or a runtime dependency.
- Do not hand-edit `dist` or `.cache`; rebuild generated output from source.
- Do not deploy, push, open a PR, or modify production.
- Preserve canonical URLs, review/indexing gates, metadata privacy, image transformation bounds, and no-JavaScript navigation.
- Use red-green-refactor for behavior changes; use measured Browser evidence for pure visual changes.

---

### Task 1: Canonical taxonomy, date safety, and result-copy contracts

**Files:**
- Modify: `src/catalog-core.js`
- Modify: `src/catalog-core.d.ts`
- Modify: `scripts/site-core.mjs`
- Modify: `tests/catalog-core.test.ts`

**Interfaces:**
- Produce `canonicalSeason(value)`, `photographCount(count)`, `archiveHeading(matching, total)`, and `archiveSummary(visible, matching, total)` from `src/catalog-core.js`.
- Consume `canonicalSeason` from `scripts/site-core.mjs` so build-time records and client URL state use one taxonomy.
- Produce a private normalized-record flag `captureYearMismatch` when a source date cannot safely be published for its archive year.

- [ ] Write failing tests proving `Fall` normalizes to `Autumn`, legacy `?season=Fall` becomes canonical, serialization writes `Autumn`, and option counts merge both labels.
- [ ] Run `npm test -- tests/catalog-core.test.ts` and confirm the taxonomy tests fail for the missing contract.
- [ ] Implement `canonicalSeason` and apply it in filter normalization, URL parsing/serialization, and both year normalizers.
- [ ] Write failing tests for `1 photograph`, filtered/empty headings, total-preserving summaries, and capture-year mismatch handling.
- [ ] Run the focused tests and confirm expected failures.
- [ ] Implement the copy helpers and safe capture-date validation. A mismatched source date becomes unpublished, receives an explicit review reason, and cannot pass the indexing gate; do not fabricate a replacement date.
- [ ] Run focused tests and the full unit suite.

### Task 2: Generated semantic and content contracts

**Files:**
- Modify: `scripts/build.mjs`
- Modify: `scripts/verify-dist.mjs`

**Interfaces:**
- Archive pages expose `data-archive-heading`, a visible `data-archive-result-count`, and a separate debounced `data-archive-announcement` live region.
- Photo-card links have concise accessible names; thumbnail images are decorative within those links while detail-page image alt text remains descriptive.
- `titleLengthClass(title)` returns `is-long` over 60 characters and `is-very-long` over 80 characters.

- [ ] Add failing distribution assertions for canonical Autumn options, dynamic heading/live-region hooks, H3 cards, concise card naming, orientation classes, About-current metadata policy, footer navigation, and a button-style 404 recovery link.
- [ ] Run `npm run build && npm run verify:dist` and confirm the new assertions fail.
- [ ] Update shared header/footer/breadcrumb/card/page-heading/archive/404 templates to satisfy the contracts.
- [ ] Add title-length and orientation classes without changing source titles.
- [ ] Exclude the featured photo from the initial mosaic background and render `Place · Title` tile labels.
- [ ] Add build-report visibility for capture-year mismatch warnings without exposing the rejected source date in generated pages.
- [ ] Rebuild and confirm distribution verification passes.

### Task 3: Client result state, announcements, and menu behavior

**Files:**
- Modify: `src/client.js`
- Modify: `tests/catalog-core.test.ts`

**Interfaces:**
- Both home and archive controllers call the shared heading/summary helpers.
- `scheduleAnnouncement(element, text, delay = 200)` updates only the screen-reader live region after rapid search input settles.
- `initMobileNavigation()` enhances the native disclosure with Escape and outside-click closing while retaining no-JavaScript behavior.

- [ ] Add failing unit coverage for every result-copy edge case consumed by the controllers.
- [ ] Confirm the focused tests fail.
- [ ] Update home/archive render paths so visible headings and summaries retain the original total and pluralize correctly.
- [ ] Keep visual filtering immediate while debouncing only the live announcement.
- [ ] Keep the featured item separate from the background wall after filtering and loading more.
- [ ] Add menu enhancement for Escape/outside click and update an explicit expanded-state hook without creating a modal or focus trap.
- [ ] Run focused and full tests.

### Task 4: Shared-shell, responsive, and token cleanup

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Shared containers use the existing 1180px maximum with `width: 100%` and aligned padding.
- Existing radius tiers cover controls, cards, and features; new tokens are limited to body/secondary text, card/control padding, section rhythm, related-page gap, and three elevation tiers.

- [ ] Record baseline Browser measurements for non-home header/content/footer edges and 320px document overflow.
- [ ] Align internal header/footer/content edges while preserving the full-width home-header exception.
- [ ] Remove the 320px overflow interaction and add a narrow-header treatment that keeps brand, Menu, and CTAs usable.
- [ ] Apply feature-radius, text-tier, spacing, and elevation tokens to existing components without visually restyling them.
- [ ] Add consistent disabled, hover, active, pressed, focus, and reduced-motion-compatible transitions.
- [ ] Re-measure 320×568, 390×844, tablet, and desktop layouts.

### Task 5: Mobile archive and detail density

**Files:**
- Modify: `scripts/build.mjs`
- Modify: `src/styles.css`

**Interfaces:**
- Optional archive intro copy receives a dedicated class so it can move after the filter/result entry point on mobile without disappearing from the document.
- Long current breadcrumbs retain full accessible text while applying a visual clamp.

- [ ] Add distribution assertions for the archive-intro and long-title classes.
- [ ] Confirm the assertions fail before template changes.
- [ ] At 350px and wider, lay out Search full-width with Year/Season and Metadata/Reset in paired rows; retain one column below 350px.
- [ ] Reduce pre-result mobile rhythm and reposition secondary archive context after the primary result entry point on mobile.
- [ ] Keep metadata key/value rows two-column at 360px and wider, then collapse below that threshold.
- [ ] Stack or clamp adjacent-photo cards on small screens and visually clamp repeated current breadcrumb titles.
- [ ] Verify no overlap, clipping, or lost accessible text.

### Task 6: Image-card, mosaic, menu, and status polish

**Files:**
- Modify: `scripts/build.mjs`
- Modify: `src/client.js`
- Modify: `src/styles.css`

**Interfaces:**
- `.photo-card.is-landscape` uses a landscape ratio and `.photo-card.is-portrait` uses a portrait ratio.
- Mobile navigation has a CSS disclosure indicator driven by the native/open state.

- [ ] Replace fixed card image rows with intentional landscape/portrait aspect-ratio tiers and a static loading surface.
- [ ] Strengthen the open menu surface, shadow, and disclosure cue without changing navigation structure.
- [ ] De-emphasize pending grid badges while preserving their text, filter value, and stronger detail-page notice.
- [ ] Ensure mosaic labels remain legible and the featured photo is not duplicated after client rerenders.
- [ ] Confirm reduced-motion mode disables new motion.

### Task 7: Full build verification

**Files:**
- Regenerate: `dist/**`

- [ ] Run `git diff --check`.
- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run `npm run verify:dist`.
- [ ] Run `npm run deploy:dry-run`.
- [ ] Run `npm run check` as the final aggregate command.
- [ ] Confirm the unrelated untracked recommendation document is unchanged.

### Task 8: Rendered Browser QA

**Surfaces:** `/`, `/photos/`, one collection, a normal photo, a very-long-title photo, `/about/photo-metadata/`, `/licensing/?photo=...`, and a missing route.

- [ ] Start the local build without weakening production HTTPS behavior.
- [ ] Verify 320×568, 390×844, 768×1024, 1280×720, and one wider supported viewport.
- [ ] Exercise home filters/load-more, archive one/many/zero results, reset, URL state, Back restoration, mobile menu, licensing handoff, pager links, and 404 recovery.
- [ ] Verify page identity, meaningful DOM, no framework overlay, console health, screenshot evidence, and interaction proof.
- [ ] Check overflow, shared-shell alignment, card crops, loading surfaces, focus visibility, accessible names, headings, disabled states, and long-title behavior.
- [ ] Save before/after screenshots outside the repository and report any evidence-limited accessibility risk without claiming full WCAG compliance.
