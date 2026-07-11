# Sitewide UI/UX Consistency Recommendations — 2026-07-10

## Review intent

This is a tactical, non-redesign review for NH48-app/NH48.info. The goal is to preserve the current visual identity—dark alpine surfaces, green accent, photo-forward content, shared shell, and dense outdoor-data utility—while identifying artful cleanup opportunities that reduce inconsistency, improve perceived polish, and protect functionality.

## Evidence reviewed

- Shared navigation shell, mobile shell behavior, accessibility overlays, footer unification notes, accent tokens, homepage shell, and representative feature CSS files.
- Existing audit coverage and local check guidance, including the prior sitewide audit and recommended smoke/a11y gates.
- Static patterns across root pages, `pages/`, shared CSS, and generated/render-contract-sensitive surfaces.

## Priority recommendations

### P0 — Do before visual cleanup

1. **Keep render-contract surfaces stable.** Many routes are explicitly render-contract governed; avoid broad HTML rewrites unless `config/render-contracts.json`, Worker transforms, generated artifacts, snapshots, and audits are kept in sync.
2. **Use shared shell entry points rather than page-local nav/footer fixes.** The shared shell already loads shared nav/footer partials and refreshes i18n, tooltips, and accessibility enhancers; fixes should flow through shared components where possible.
3. **Run visual cleanup through existing gates.** At minimum, pair any sitewide UI pass with `git diff --check`, `npm run audit:nav-header`, `npm run audit:accent-green`, `npm run test:smoke:core`, and `npm run test:a11y` when dependencies/browsers are available.

### P1 — Highest-value consistency cleanup

4. **Create a small spacing scale and map existing page-local values to it.** Current feature CSS commonly uses one-off `12px`, `14px`, `16px`, `18px`, `20px`, `22px`, and `24px` spacing. Do not restyle the site; introduce shared custom properties such as `--nh48-space-2`, `--nh48-space-3`, `--nh48-card-pad`, and migrate gradually.
5. **Normalize card radius tiers.** Cards, pills, panels, and hero shells vary among `10px`, `12px`, `14px`, `16px`, `18px`, and `999px`. Preserve the look but define tiers: control `10–12px`, card `14–16px`, hero/panel `18px`, pill `999px`.
6. **Centralize surface colors.** Several pages repeat near-identical dark translucent panels. Add shared tokens for base background, elevated surface, subtle border, hover surface, and warning/error/info surfaces.
7. **Extend accent tokens beyond the green core.** The repo has a green accent token set, but feature pages often hand-author warning/info/status colors. Add companion status tokens so route-specific dashboards stay cohesive without losing meaning.
8. **Unify CTA/button states.** Buttons should share minimum height, radius, focus ring, hover lift/brightness, disabled opacity, and `aria-pressed` styling. Keep page-specific colors, but make interaction feel identical.
9. **Unify focus-visible styling outside accessibility mode.** High-contrast mode has a strong focus treatment; standard mode should consistently expose keyboard focus across nav links, cards-as-links, map controls, filter chips, dialogs, and footer links.
10. **Standardize hero vertical rhythm.** Keep each page’s hero art, but align hero top/bottom padding, eyebrow/kicker spacing, intro width, and CTA row gaps so moving between pages feels intentional.
11. **Normalize section widths.** Several pages use bespoke max-width and padding. Define route families—marketing/info, data dashboard, catalog/grid, map/tool—and give each a named container width token.
12. **Align mobile safe-area and tap target behavior across non-nav controls.** Mobile shell already handles nav safe areas and 44px tap targets; extend equivalent control sizing to cards, chips, tabs, map buttons, and utility controls.
13. **Reduce per-page font-family drift.** Shared nav uses Noto Sans while some feature CSS falls back to system fonts. Standardize body/control font stacks unless a page has a deliberate reason to differ.
14. **Make status and alert components reusable.** Road status, water conditions, alerts/news, API access, and dataset pages all need warning/error/info/success states. Use shared classes or tokens for borders, icons, labels, and copy hierarchy.
15. **Unify empty, loading, and unavailable states.** Several JS modules already emit “temporarily unavailable” messages. Present them with the same visual hierarchy, retry/source-link pattern, and planning caveat language.

### P2 — Functionality and UX polish

16. **Audit all dialogs/lightboxes for focus management.** Confirm open focuses the dialog, `Esc` closes where appropriate, background is inert or effectively unavailable, and focus returns to the trigger.
17. **Make card-click behavior predictable.** Decide when the whole card is clickable versus only a CTA link. Avoid nested interactive targets that produce conflicting click analytics or inaccessible keyboard behavior.
18. **Normalize filter chip semantics.** Chips should consistently use `button`, `aria-pressed`, visible active styling, count/meta placement, and the same keyboard/touch dimensions.
19. **Clarify disabled and unavailable controls.** Use real `disabled` where interaction is impossible; use explanatory helper text for source/data unavailability rather than silent inactive controls.
20. **Standardize external-link treatment.** Use a consistent visual cue and accessible label pattern for official sources, downloads, and partner/plugin destinations.
21. **Make “before planning” caveats consistent.** Conditions pages correctly warn users to verify official sources; align phrasing and placement sitewide for road, water, trail, alert, and recreation-site data.
22. **Review scroll anchoring with sticky nav.** Mobile CSS sets scroll padding for targets; ensure desktop and generated pages also avoid headings hiding behind sticky nav.
23. **Normalize table/card breakpoints.** Data-heavy pages should collapse tables into cards consistently and preserve sorting/filter controls near the affected content.
24. **Unify map fallback behavior.** Map pages should share language and layout for static fallback, asset-unavailable messaging, and manual activation controls.
25. **Improve progressive enhancement affordances.** When lazy hydration delays a panel, show a consistent skeleton/placeholder rather than a page-specific blank or jump.
26. **Make analytics-safe labels consistent.** Click tracking reads link/button text and data attributes; normalize CTA copy so analytics remain meaningful after UI cleanup.

### P3 — Artful visual refinements without redesigning

27. **Use subtle elevation consistently.** Keep the existing dark glass style, but standardize shadow intensity by component tier: nav/header, card, floating dialog, tooltip.
28. **Tighten dense dashboard rhythm.** Use small increases in row gaps and label/metric grouping where dashboards feel crowded; avoid changing data density dramatically.
29. **Rationalize gradient angles and opacity.** Keep current gradients, but align common gradient directions and alpha ranges for panels and heroes.
30. **Make image treatment consistent.** Align border radius, aspect-ratio, lazy-loading skeleton, caption placement, and hero-vs-gallery image priority across photo, peak, plant, bird, wiki, and trail pages.
31. **Define a shared “kicker” style.** Kicker/eyebrow labels appear across pages; standardize case, letter spacing, size, and accent color.
32. **Harmonize pill badges.** Elevation, counts, source labels, severity, and feature tags should share pill padding, border, and font-size tiers.
33. **Calibrate link underlines.** Standard mode can use tasteful underline offsets on content links while nav/buttons remain decoration-free; accessibility underline mode should remain stronger.
34. **Align icon sizing.** Header icons, status icons, map controls, and footer icons should use common `1em`, `20px`, `24px`, and `32px` tiers.
35. **Reduce competing greens.** Use the existing accent token for primary green, and reserve other greens for semantic success only when meaningfully distinct.
36. **Use consistent max line lengths.** Long descriptions should stay readable with max-width constraints, especially on wide desktop dashboards.

## Suggested implementation sequence

1. **Token pass:** add non-invasive spacing, radius, surface, shadow, and status tokens; do not change selectors yet.
2. **Shared component pass:** nav, footer, button/CTA, focus ring, cards, chips, alerts, empty states.
3. **Route-family pass:** homepage/marketing, peak/catalog/wiki, conditions/dashboards, maps/tools, auth/API access.
4. **Interaction pass:** dialogs, lightboxes, card links, filters, loading states, map fallbacks.
5. **Verification pass:** smoke, a11y, nav/accent audits, selected screenshots, and manual mobile review.

## Candidate checks for each cleanup PR

- `git diff --check`
- `npm run audit:nav-header`
- `npm run audit:accent-green`
- `npm run test:smoke:core`
- `npm run test:a11y`
- `npm run test:smoke:map-trails` when map/trail UI changes
- `npm run check:cloudflare:worker` when Worker-rendered route output or shared shell behavior changes
