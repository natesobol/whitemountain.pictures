# Site-Wide UI/UX Clean Completion Audit

## Scope

This audit maps the approved recommendations in `2026-07-10-site-wide-ui-ux-clean-design.md` to authoritative current-state evidence. “Proven” means a fresh unit test, generated-output assertion, parser, build, or deploy dry-run directly verifies the requirement. “Pending rendered QA” means the implementation is present but its final visual behavior has not been observed at the required viewport.

## Automated gate

- `npm run check`: exit 0.
- TypeScript: exit 0.
- Vitest: 2 files, 16 tests passed.
- Build: 461 HTML pages, including 356 photo pages.
- Distribution verifier: exit 0.
- Wrangler deploy dry-run: 937 assets read, exit 0.
- Lightning CSS parse: 17,254 input bytes, zero warnings.
- esbuild browser bundle parse: one output, 14,332 bytes, exit 0.

## Requirement evidence

| Requirement | Status | Authoritative evidence |
|---|---|---|
| Preserve palette, editorial typography, imagery, and card language | Proven structurally; pending rendered QA | Existing tokens and visual primitives retained in `src/styles.css`; no new visual dependency or asset set. |
| Mobile navigation on every route | Proven | All 461 generated HTML pages contain native `.mobile-nav`; CSS exposes it at ≤820px with 44px controls. |
| Hero content before gallery links in reading/tab order | Proven | Distribution verifier asserts `.hero-copy` precedes `data-photo-wall`. |
| Remove obscured mobile mosaic focus targets | Proven structurally; pending rendered QA | Mobile CSS sets `.mosaic-field { display: none; }`; featured photograph remains. |
| Complete licensing journey | Proven | All 356 photo pages preserve canonical photo context; licensing includes direct `mailto:` plus safe client prefill. |
| Reset default photo figure margin | Proven | Parsed emitted CSS contains `.page-hero { margin: 0; }`. |
| Correct responsive image descriptors | Proven | All 356 detail pages contain `640w` and `2400w`. |
| Manage large archives | Proven functionally; pending rendered QA | All 100 archive/hub pages contain search, filters, progressive cards, empty state, live count, and load-more controls. |
| No-JavaScript archive baseline | Proven | `/photos/` contains all 356 linked server cards and zero cards initially marked hidden. |
| Empty, failure, retry, and announced states | Proven structurally and by client contract | Home and archive generated hooks verified; client bundle contains state handlers and stale-feature guard. |
| Active navigation consistency | Proven | All 356 photo pages identify Archive; all 100 archive/hub pages and About/Licensing identify the current section/page. |
| Align shared containers | Proven structurally; pending rendered QA | Header, content, and footer share `--content-width: 1180px`; home keeps explicit full-bleed exception. |
| Introduce spacing/radius scale | Proven | Emitted stylesheet contains shared `--space-*`, `--radius-*`, and width tokens. |
| Reset incidental heading margins | Proven structurally; pending rendered QA | `.intro-band h2`, page titles, and detail headings have explicit margins/line-height. |
| Improve navigation target sizes | Proven structurally | Brand and navigation controls use 44px minimum heights. |
| Standardize inline links | Proven structurally; pending rendered QA | Prose, photo-story, collection, metadata, breadcrumb, and footer link rules are explicit. |
| Make featured preview actionable and current | Proven | Home renders `data-featured-link`; client updates href/image/alt/title/place and hides stale preview on zero results. |
| Expose generated collections | Proven | 124 associated photo pages link to generated collection pages; local link-integrity verifier passes. |
| Handle long titles and breadcrumbs | Proven structurally; pending rendered QA | Balanced/overflow-safe title rules and ordered-list breadcrumbs are emitted. |
| Prevent impossible filter combinations | Proven by unit tests and client contract | `optionCounts` is unit-tested; client disables options using the other active filters. |
| Persist filters and restore history | Proven by unit tests and client contract | Query parsing/serialization tests pass; generated client contains `popstate` restoration. |
| Increase tile-caption legibility | Proven structurally; pending rendered QA | Caption increased to 0.78rem with a dedicated bottom gradient. |
| Complete card interaction states | Proven structurally; pending rendered QA | Hover, focus-visible, and active card rules are present. |
| Reduce content/footer double spacing and support short pages | Proven structurally; pending rendered QA | Body/main flex contract and separated shell/footer spacing are emitted. |
| Defer offscreen archive rendering | Proven | Emitted card CSS contains `content-visibility: auto` and intrinsic size. |
| Normalize display casing and search vocabulary | Proven | Unit tests cover canonical casing, invalid values, case-insensitive and diacritic-insensitive search. |
| Protect hero overlap at 821–1120px | Proven structurally; pending rendered QA | Emitted CSS contains the explicit intermediate breakpoint and protected text/image widths. |
| Do not reproduce the legacy 123-option weather facet | Proven | Neither home nor archive output contains a weather filter. |
| Keep catalog cards actionable | Proven | All 356 server archive cards are anchors; distribution link-integrity check passes. |

## Remaining evidence gap

Rendered QA at approximately 1440×900 and 390×844 remains unavailable. The in-app Browser rejected the local preview URL under its security policy and explicitly prohibited alternate browser-surface workarounds. Required visual checks are:

1. Home composition, hero overlap, featured-photo transition, filters, and zero-result state.
2. Archive controls, card reveal, URL state, and empty state.
3. Mobile menu, no horizontal overflow, one-column archive/detail layouts, title and breadcrumb wrapping.
4. Photo detail, collection links, licensing handoff, and short-page footer position.
5. Console health and absence of framework/error overlays.

The goal must remain active until those rendered checks are observed or the user supplies equivalent desktop/mobile screenshots.
