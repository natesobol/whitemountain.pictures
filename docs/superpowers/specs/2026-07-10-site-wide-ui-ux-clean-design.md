# Site-Wide UI/UX Clean Design

## Context

White Mountains Pictures has a strong, distinctive visual language: near-black surfaces, restrained green accents, editorial serif headings, and photography-led composition. The approved audit calls for a comprehensive cleanup without replacing that language. The current workspace is a static-site generator backed by Cloudflare Workers and produces a home experience, archive indexes, trip/place/collection hubs, 356 detail pages, prose pages, and a 404 page.

The deployed public site is an older single-page build. This design targets the current workspace as the authoritative next version. Deploying it should replace the older inert catalog and oversized weather facet rather than port those patterns forward.

## Goals

- Preserve the existing palette, typography, photographic layering, card language, and editorial tone.
- Make every major route usable on mobile and by keyboard.
- Make large archives searchable, filterable, progressively revealed, URL-addressable, and resilient.
- Complete the photo-to-licensing conversion path.
- Normalize shared containers, spacing, radii, link states, headings, breadcrumbs, and footer behavior.
- Keep server-rendered links and content fully useful when JavaScript is unavailable.
- Prove behavior with test-first unit, distribution, and rendered browser checks.

## Non-Goals

- No framework migration or component-system rewrite.
- No new palette, typeface, logo, illustration style, or photography treatment.
- No account system, commerce checkout, CMS, or database.
- No raw 123-option weather filter from the legacy public build.
- No change to metadata review, privacy, indexing, or image-origin policy.

## Considered Approaches

### 1. CSS-only polish

This would fix spacing and hover states quickly but leave mobile navigation, archive scale, conversion, URL state, and client error handling unresolved. Rejected because it does not satisfy the approved critical findings.

### 2. Framework rewrite

A React or similar rewrite could provide component boundaries but would introduce migration risk, larger client payloads, and visual drift for a site whose generator already has good semantic and SEO foundations. Rejected as unnecessary.

### 3. Generator-first progressive enhancement — selected

Strengthen the existing template helpers, introduce one small pure catalog-state module, progressively enhance server-rendered archive cards, and normalize the existing stylesheet. This keeps the visual identity and no-JavaScript baseline while resolving the structural issues with the least architectural disruption.

## Architecture

### Shared template contract

`scripts/build.mjs` remains the source of all HTML. The header will render aligned desktop navigation plus a native mobile disclosure menu. Breadcrumbs will use an ordered list so separators cannot wrap independently. Active navigation will identify exact year pages and the Archive parent for photo, trip, place, and collection routes.

The home hero will place its heading and primary actions before gallery links in DOM order. The dense decorative mosaic will be omitted at the mobile breakpoint; the featured photograph remains, preserving the photography-led identity without obscured focus targets.

### Catalog state and progressive enhancement

`src/catalog-core.js` will contain pure, testable functions for normalizing filters, filtering records, computing option availability, serializing URL state, and calculating reveal counts. `src/client.js` will use those functions for two controllers:

- Home wall: deferred JSON loading, filters, dependent option availability, URL state, live counts, empty state, retryable fetch failure, load more, and an actionable featured-photo link.
- Archive indexes: progressively hide server-rendered cards after hydration, then provide text search, year/season/status filters, dependent option availability, URL state, live counts, empty state, reset, Back/Forward restoration, and load more.

All archive cards remain normal links and all cards remain visible without JavaScript.

### Licensing and discoverability

Photo licensing CTAs will include the canonical photo URL in a query parameter. The licensing page will expose a visible email action without JavaScript and enhance it with a prefilled subject/body when a photo URL is supplied. Generated collection pages will gain incoming links from associated photo detail pages.

### Visual-system cleanup

The stylesheet will define a compact spacing, radius, and content-width scale and apply it to shared surfaces. Internal headers will align to the 1180px content shell while the home header keeps its full-bleed exception. The cleanup includes explicit figure margins, balanced long titles, stable breadcrumb wrapping, consistent inline links, 44px navigation targets, stronger tile-label contrast, complete card interaction states, a less wasteful content/footer gap, and a sticky short-page footer.

The intentional desktop hero overlap remains, but an intermediate breakpoint will protect the text column. Mobile uses one-column layouts, a smaller title floor, the mobile menu, and the featured image without the interactive background mosaic.

## Error Handling

- A failed home catalog request retains the initial server-rendered photos, reports that filters are temporarily unavailable, and offers Retry.
- Zero-result filters show a clear empty state and Reset action rather than an empty wall.
- Unavailable select options are disabled based on the other active filters.
- Invalid or unknown URL parameters fall back to `all`/empty values.
- Licensing ignores non-HTTP `photo` parameters and retains the safe general email link.

## Accessibility

- Primary content and CTAs precede gallery links in reading and tab order.
- Mobile navigation uses native disclosure semantics and 44px targets.
- Filter results use `aria-live="polite"`; error and empty states use appropriate status semantics.
- Focus, hover, and active states are present on cards, links, buttons, and navigation.
- Breadcrumbs remain a labeled navigation landmark with ordered-list semantics.
- Reduced-motion behavior remains intact.

## Testing and Acceptance

- Unit tests cover filter matching, query normalization/serialization, option availability, and reveal counts.
- Distribution verification proves required mobile navigation, DOM order, archive controls, live regions, licensing contact, collection links, active navigation, correct `640w`/`2400w` descriptors, and page-hero structure.
- The existing worker, metadata, link-integrity, sitemap, and privacy checks remain green.
- Rendered QA covers home, archive, empty state, licensing, and photo detail at desktop and mobile widths, with console inspection and at least one interaction per flow.
- `npm run check` passes with no relevant warnings or errors.

## Approved Scope Interpretation

The user's instruction grants full permission and approval to implement the pasted audit. It is therefore treated as approval of this generator-first approach and authorization to proceed without an additional design-choice pause. Live-only legacy findings are resolved by ensuring the current multi-route build does not reproduce them and is deployment-ready.
