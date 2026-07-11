# Starter Goal: White Mountains Gallery Refactor

Copy the prompt below into a new Codex task from the project root. It authorizes implementation and private preview verification. It does not authorize production deployment or changes to public storage access.

```text
/goal Implement the White Mountains Gallery refactor from end to end as one uniform goal.

Outcome

Turn White Mountains Pictures into a quiet, art led gallery with strong technical craft behind the scenes. Remove every public AI, camera, source, review, and workflow reference. Close access to original files and source sidecars. Replace the full photograph corpus with approved gallery writing. Add the eleven calm native interactions in the plan. Preserve the existing visual identity and photographic focus.

Authority

1. Use docs/WHITE_MOUNTAINS_GALLERY_COPY_AND_UI_AUDIT_2026-07-10.md as the exact wording, UI adjustment, voice, and motion authority.
2. Use docs/superpowers/specs/2026-07-10-white-mountains-gallery-voice-motion-design.md as the architecture, privacy, data, accessibility, and behavior authority.
3. Execute docs/superpowers/plans/2026-07-10-white-mountains-gallery-refactor.md in its stated dependency order: 1, 2, 3, 4, 5, 10, 6, 7, 8, 9, then 11 through 18. Task 19 is locked behind a separate explicit production approval.
4. Use the twelve Markdown files under docs/gallery-copy/2025/ and docs/gallery-copy/2026/ as the exact image by image wording and public context authority. Transcribe them into tracked JSON without paraphrase.
5. If the authority documents conflict, stop before editing the affected behavior and report the exact passages. Do not invent a compromise.

Required workflow

1. Start with superpowers:using-superpowers.
2. Use superpowers:using-git-worktrees to isolate this work from the existing dirty worktree. Preserve every unrelated user change.
3. Treat the approved audit and design as the completed brainstorming direction. Use superpowers:brainstorming only if a new product decision appears that the authority documents do not resolve.
4. Use superpowers:subagent-driven-development to execute independent plan tasks in bounded batches.
5. Use superpowers:test-driven-development for every behavior change. Show the failing focused test before implementation, then show it passing.
6. Use superpowers:requesting-code-review after implementation and before the complete acceptance matrix.
7. Use superpowers:verification-before-completion before any completion claim.
8. Keep a live task checklist. Record deviations with the authority passage, reason, affected files, and verification. Do not silently deviate.

Copy and presentation contract

1. Use every exact static phrase in the audit without paraphrase.
2. Create tracked ledger entries for all 124 photographs from 2025 and all 232 photographs from 2026 by transcribing the exact Markdown copy deck. Every entry includes title, alt text, caption, exact note or omission, year, season or omission, broad place, range or omission, outing or omission, and collection assignments or omission.
3. Do not invent or improve image copy during implementation. If a visually verified Markdown entry is missing or inconsistent, stop and repair the authority explicitly before changing both sources.
4. Do not publish a generic fallback, legacy generated sentence, AI provenance, technical workflow phrase, camera value, exact capture detail, review state, or source filename.
5. The visitor facing voice is that of a seasoned mountain guide with quiet Buddhist restraint. It is observant, warm, plain, and useful. It is never theatrical, mystical, ornate, or self important.
6. Do not use the word repository in visitor facing copy. Do not use the banned public vocabulary in section 5.3 of the audit.
7. Avoid dash driven sentence construction and semicolon heavy prose. Prefer short sentences with concrete nouns and verbs.
8. Keep technical strength in architecture, performance, accessibility, structured data, tests, and image delivery. Do not present technical machinery as gallery content.

Privacy and data contract

1. Read build source data only through the authenticated private R2 path in the plan. Never fall back to a public media URL.
2. Generate every page, script payload, schema object, sitemap entry, and client state from the strict `PublicPhotograph` allowlist.
3. Keep exactly these fields in `PublicPhotograph`: canonical `id`, approved `href`, `year`, `season`, approved `title`, `alt`, `caption`, optional `note`, broad `locationLabel`, optional `rangeLabel`, paired `tripId` and `tripLabel`, approved `collectionIds`, validated `width`, validated `height`, and `orientation`.
4. Derive the browser catalog separately with exactly these twelve keys: `href`, `title`, `locationLabel`, `alt`, `thumb`, `hero`, `width`, `height`, `orientation`, `year`, `season`, and `searchText`. Derive `searchText` only from approved title, place, range, and outing label.
5. Add same origin derivative URLs and the fixed photographer and rights statements only inside their explicit page or schema allowlists. Do not add them to `PublicPhotograph` by object spread.
6. Keep exact date and time, camera and lens values, GPS, serials, source paths and hashes, editing history, prompts, AI provenance, confidence, generation mode, review state, and review reasons private.
7. Serve only named same origin `thumb`, `card`, `hero`, `detail`, and `social` derivatives.
8. Transform private R2 bytes through the Cloudflare Images binding with `fit: "scale-down"` and `metadata: "none"`.
9. Return 410 for recognized original, manifest, metadata JSON, XMP, Content Credential, and source archive paths. Return generic 404 for malformed, opaque-separator, and unknown variants without lookup or normalization.
10. Remove Original links, technical details panels, metadata filters, review badges, status query handling, original schema URLs, and public build reports.
11. Do not expose private values in logs, exceptions, reports, fixtures, screenshots, commit messages, or completion notes.
12. Canonicalize raw source IDs through the tested collision safe helper. Generate page slugs only from approved titles and canonical public IDs. Redirect an old slug by its stable suffix without storing or republishing legacy generated wording.
13. Keep the generated stable ID to private object key map ignored, uncommitted, absent from dist, and bundled only into server code.
14. Use only the safe public outing IDs in the Markdown copy deck. Reject a date-bearing or copied private trip ID.

Motion and interaction contract

1. Implement all eleven selected interactions with native CSS, the Web Animations API, native details, and native dialog. Add no runtime animation dependency.
2. Implement the trail underline, button response, gallery card quiet lift, mosaic attention, featured dissolve, filter result settle, new row reveal, count refresh, mobile menu settle, larger photograph view, and neighbor cue exactly as specified.
3. Correct content, focus, URL, controls, and live region state before starting motion.
4. Every scripted animation must cancel cleanly, honor prefers reduced motion, and have equivalent keyboard and touch behavior.
5. Cap concurrent element motion at twelve. Use transform and opacity. Do not animate layout dimensions.
6. Do not add scroll jacking, cursor replacement, pointer following, continuous parallax, automatic zoom loops, photograph blur, sibling dimming, sound, particles, or route wide grid transitions.
7. Do not generate or add an image, SVG, icon, logo, watermark, texture, or decorative asset.

Engineering contract

1. Keep the static Node ESM generator, vanilla JavaScript, semantic HTML, CSS, Vitest, Cloudflare Worker, Workers Static Assets, R2, and Images binding architecture.
2. Add no frontend framework, client router, or runtime package.
3. Do not hand edit generated dist files, cache files, Wrangler output, or generated type files.
4. Preserve fixed image dimensions, responsive image candidates, lazy loading rules, one eager home image, deferred hashed client data, and the current performance budgets.
5. Preserve existing canonical, crawler, rights, license, and search behavior only where it conforms to the new safe public contract.
6. Make the no script experience useful. Keep keyboard, screen reader, touch, zoom, forced color, and reduced motion behavior first class.
7. Keep landscape cards centered at 3:2 and portrait cards centered at 4:5 at every breakpoint. Remove the narrow portrait 3:2 override and verify that deck item 106 retains both the planets and summit on a narrow phone.

Verification contract

1. Require exactly 356 approved ledger IDs, 356 photograph pages, and 356 safe public catalog records.
2. Run the focused red and green commands in every plan task.
3. Run npm run audit:copy, npm run typecheck, npm run test, npm run build, npm run verify:dist, and npm run deploy:dry-run.
4. Run the 52 check image binary matrix against an authenticated preview. Cover four photographs, AVIF, WebP, and JPEG across the four negotiated presets, and fixed JPEG social output. Require zero EXIF, XMP, IPTC, location, serial, editing, or Content Credential containers. Permit only structural format containers and approved color profiles.
5. Run the full rendered route, breakpoint, input, accessibility, reduced motion, zoom, history, and console matrix in Task 18.
6. Search every generated artifact for the banned public vocabulary and inspect every hit. Do not approve an unexplained exception.
7. Fix failures through a focused regression test. Do not weaken the contract to obtain a passing result.

Production gate

1. Do not deploy to production.
2. Do not purge a cache.
3. Except for the single temporary preview in item 4, do not disable or alter an R2 public domain, r2.dev access, DNS, edge policy, or external service state.
4. This goal explicitly authorizes one temporary authenticated `wrangler dev --remote` session for the Task 18 R2 and Images acceptance matrix. Do not share a preview URL, create a named deployment, change a binding, or leave the session running after verification. If the installed Wrangler version cannot keep the preview scoped to the local session, stop and request approval.
5. When Tasks 1 through 18 pass, stop and present one approval packet containing the reviewed commit, exact external actions, preview evidence, binary audit result, source denial result, and privacy preserving rollback.
6. Execute Task 19 only after I explicitly approve those production actions in a later message.

Completion response

When Tasks 1 through 18 are complete, report the outcome first. List the files and commits created, the 356 entry copy result, the eleven interactions delivered, every verification command and result, rendered QA coverage, binary sample result, known limitations, and the exact production actions still awaiting approval. Do not claim the public site is complete until Task 19 has separately passed in production.
```
