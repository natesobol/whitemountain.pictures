# White Mountains Pictures: Cloudflare and SEO architecture

## Decision

The archive is generated as static HTML and served by Workers Static Assets. A small Worker is the cold-request entrypoint so it can canonicalize the host and scheme, route named image transformations, redirect legacy originals, and expose a health check. Cloudflare's entrypoint cache is enabled in front of that Worker, so cacheable warm requests can be answered before Worker execution. Client JavaScript progressively enhances the static archive; it is not required for content, navigation, metadata, or crawlability.

This replaces request-time React rendering of a single 1.7 MB HTML document. The production Worker bundle remains the behavioral baseline, while the R2 manifests and metadata records are the content source of truth.

## Request flow

1. The build reads public, versioned R2 manifests and metadata from `photos.whitemountains.pictures`.
2. It writes the homepage, year, trip, place, collection, photo, licensing, methodology, creator, robots, and sitemap assets to `dist/`.
3. The entrypoint cache checks cacheable responses before Worker execution; cold static requests fall through the Worker to Workers Static Assets.
4. The Worker handles `/images/<preset>/<year>/<filename>` with Cloudflare Image Transformations.
5. Existing `/photos/<year>/originals/<filename>` requests permanently redirect to the R2 custom domain, which already provides Cloudflare cache hits and byte-range support.
6. The Worker permanently canonicalizes HTTP and `www` while preserving the path and query string. This avoids depending on unavailable zone-write permission and applies consistently to every route.

## Product selection

| Capability | Decision | Rationale |
| --- | --- | --- |
| Workers Static Assets | Use | Best fit for hundreds of immutable, pre-rendered HTML pages and fingerprinted assets. |
| Workers | Use as a thin router | Required for canonical redirects, safe named image variants, static-asset fallback, and health checks; not used for page rendering. |
| R2 | Use | Existing authoritative store for originals, manifests, XMP, and photo metadata. |
| R2 custom domain | Use | `photos.whitemountains.pictures` already provides cache, validators, and Range responses. |
| Cloudflare Image Transformations | Use | Produces a bounded set of responsive AVIF/WebP/JPEG variants at the edge. |
| Workers Cache | Use | `cache.enabled` checks the Cloudflare cache before invoking the Worker. HTML, immutable assets, and image variants set explicit cache policies; health checks stay `no-store`. |
| Smart Tiered Cache | Use if zone setting permits | Reduces repeated R2 reads across edge locations. |
| Cache tags and targeted purge | Use | Enables photo-, year-, and media-scoped invalidation without purging the whole zone. |
| Redirect Rules | Do not require | The current API identity has zone-read but not zone-write access. Equivalent permanent canonicalization is implemented in the Worker and covered by tests. |
| Workers Logs and Traces | Use | Provides route, error, and cache observability for the remaining dynamic surface. |
| Web Analytics | Use if already enabled or available without a plan change | Provides privacy-conscious RUM and Core Web Vitals. |
| KV | Reject | Static manifests and R2 metadata are sufficient; no hot mutable key-value state is needed. |
| D1 | Reject | No relational query or transactional editing requirement exists. |
| Durable Objects | Reject | There is no coordination, real-time, or strongly consistent per-entity state. |
| Queues | Reject for current scale | Build-time ingestion is bounded and publication-driven. Reconsider only if uploads become continuous. |
| Workflows | Reject for current scale | No durable multi-step online operation is required. |
| Cache Reserve | Reject for R2 media | R2 custom-domain traffic does not use Cache Reserve; Smart Tiered Cache is appropriate. |
| Argo Smart Routing | Reject | Application compute and storage are already on Cloudflare's network; there is no distant third-party origin to optimize. |
| Pages | Reject | Workers Static Assets already provides the required deploy unit with the Worker and R2 binding. |

## Indexability policy

Every photo receives a durable HTML page. A photo page is indexable only when its source metadata says human review is complete, required dates and locations exist, camera values are valid, and the page has complete canonical and structured metadata. Other pages use `noindex,follow` and are excluded from XML sitemaps.

At the current source state, 124 photos from 2025 are drafts requiring review, while 22 of 232 photos from 2026 pass the review flag. Year and other curated hub pages may be indexable when their own copy and link structure are useful, even if some linked photo details remain `noindex`.

## Cache policy

| Surface | Browser | Cloudflare edge |
| --- | --- | --- |
| HTML | Five minutes | One hour via the entrypoint cache, with one-day stale-while-revalidate |
| Fingerprinted CSS/JS/data | One year, immutable | Static Assets deployment cache |
| Named image variants | One day | Thirty days, tag-purgeable |
| Versioned R2 originals | One year, immutable | R2 custom-domain cache with Smart Tiered Cache |
| Sitemaps and robots | Five minutes | Static Assets deployment cache; refreshed on deploy |
