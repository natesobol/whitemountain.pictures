# Balanced Image Exposure Protection Design

## Purpose

Protect Nathan Sobol's photographs from easy original-file retrieval, hotlinking, automated bulk collection, and ambiguous reuse while preserving a fast public gallery, Google Images discoverability, social previews, accessibility, and a direct licensing path.

This design is deterrence, not DRM. Any image delivered to a visitor can be saved or captured. The enforceable boundary is that browser-facing files are intentionally limited, visibly attributed derivatives while full-resolution originals remain private.

## Current exposure

- `photos.whitemountains.pictures` exposes the R2 bucket through a public custom domain.
- Every photo page contains a visible `View original JPEG` link.
- `ImageObject.contentUrl` publishes the same original URL to crawlers.
- A sampled original is 8,688 × 5,792 pixels, approximately 27 MB, and returns `200 OK` without authorization.
- The Worker already has an R2 binding but transforms images by fetching the public R2 hostname.
- Photo pages already include a rights row, licensing CTA, `copyrightNotice`, `creditText`, `license`, `acquireLicensePage`, and image-sitemap licensing metadata. These are a sound base but the visible notice should be more explicit.

## Approved posture

Use the balanced protection level:

1. Keep originals private in R2.
2. Serve only predefined, optimized, visibly watermarked derivatives.
3. Preserve public photo pages, Google Images crawling, social previews, accessible alternative text, and normal direct viewing.
4. Add layered hotlink, bot, AI-crawler, and rate-limit controls without requiring ordinary visitors to sign in.
5. Put an unambiguous licensing notice and request action on every photo page.

## Architecture

### Private source storage

The `whitemountainspictures` R2 bucket remains the source of truth. Both the `photos.whitemountains.pictures` custom-domain access and any `r2.dev` public development URL must be disabled only after the new Worker delivery path is deployed and verified.

The public site must never emit an R2 original URL. No public route may stream the original object or redirect to it. The existing `/photos/{year}/originals/{filename}` compatibility route will return `404` or `410`, not redirect.

### Worker image delivery

Add the Cloudflare Images binding as `env.IMAGES`. For `/images/{preset}/{year}/{filename}` requests, the Worker will:

1. Validate the preset, year, filename, method, and referrer policy.
2. Read `photos/{year}/originals/{filename}` through `env.PHOTOS.get()`.
3. Read a local transparent watermark asset through `env.ASSETS`.
4. Pass the private R2 object stream to `env.IMAGES.input()`.
5. Scale down to the fixed preset, draw the preset-sized watermark near the lower-right safe edge, and output an optimized negotiated format.
6. Return long-lived public cache headers, an ETag, `Vary: Accept`, `Cross-Origin-Resource-Policy: cross-origin`, and `X-Content-Type-Options: nosniff`.

No endpoint will accept arbitrary widths, qualities, source URLs, or transform parameters. The legacy `/images/resize` endpoint will be removed or return `404`, eliminating an enumerable transform surface.

### Public derivative presets

| Preset | Maximum width | Intended use | Watermark |
|---|---:|---|---|
| `thumb` | 320 px | compact cards and small mosaics | small, subtle |
| `card` | 640 px | archive cards and responsive fallback | small |
| `hero` | 1,280 px | homepage feature and larger mosaics | medium |
| `detail` | 2,048 px | individual photo page | medium |
| `social` | 1,200 px JPEG | Open Graph, structured data, image sitemap | medium |

All transforms use `fit: scale-down`, do not upscale, retain only copyright metadata where the output format supports it, and use quality appropriate to the preset. Native dimensions may remain visible as catalog metadata, but the native file is not delivered.

### Watermark treatment

Use a transparent, restrained asset reading `© Nathan Sobol · White Mountains Pictures`. It must be readable on light and dark photographs, inset from the lower-right edge, and sized per preset. It must not dominate the composition or cover the central subject. The source watermark asset is public; protection comes from compositing it into every derivative, not hiding the overlay file.

### Hotlink policy

Do not enable Cloudflare's zone-wide one-click Hotlink Protection because Cloudflare documents that it can prevent Google Images, Pinterest, and Facebook display.

Enforce a narrow policy in the Worker for `/images/*`:

- Allow requests with a blank `Referer` so direct viewing, crawlers, link-preview fetchers, privacy tools, and strict referrer policies continue to work.
- Allow same-site referrers for `whitemountains.pictures` and `www.whitemountains.pictures`.
- Allow an explicit, tested search/social host list: exact or subdomains of `google.com`, `googleusercontent.com`, `facebook.com`, `instagram.com`, `pinterest.com`, `linkedin.com`, `x.com`, `twitter.com`, `slack.com`, and `discord.com`, plus `www.google.*` and `images.google.*` country-domain forms. Hostnames are parsed as URLs and matched by label boundaries; string `contains` checks are forbidden.
- Return `403` for other non-empty cross-site referrers.
- Do not rely on referrer checks as authentication; they are a bandwidth and casual-hotlink deterrent only.

### Bulk-scraping controls

Use Cloudflare zone controls in addition to Worker validation:

- Enable the plan-appropriate bot product: Bot Fight Mode on Free, or Super Bot Fight Mode/Bot Management with definite automation blocked, likely automation challenged, and verified search crawlers allowed.
- Configure AI bot policies with Search allowed, Training blocked, and Agent blocked unless a later business decision changes that policy.
- Add one rate-limiting rule for `/images/*`, applied to cached assets, exempting verified bots. Start with a Managed Challenge after 80 image requests per IP in 10 seconds, then tune from Security Events. This permits normal 24–25-image page loads while interrupting rapid archive extraction.
- Preserve search-engine crawling of HTML and social/search derivatives. Never apply the bulk-image rule indiscriminately to verified search bots or all site paths.
- Add `Content-signal: search=yes, ai-train=no, use=reference` to `robots.txt`. This is a declared policy and crawler signal, not an access-control substitute.

If the current Cloudflare plan cannot express the preferred challenge action or bot exception, use the closest supported plan-level behavior and document the exact deployed rule. Do not introduce application login merely to compensate for a plan limit.

## Photo-page licensing contract

Every generated photo page must contain all of the following:

- A visible notice: `© Nathan Sobol. All rights reserved.`
- Plain-language permission boundary: viewing or linking does not grant reproduction, redistribution, resale, model-training, or commercial-use rights.
- A photo-specific `Ask about licensing this photograph` action preserving the canonical page URL.
- A link to the full licensing terms.
- Structured `ImageObject` fields: `copyrightHolder`, `copyrightNotice`, `creditText`, `license`, and `acquireLicensePage`.
- `contentUrl`, `url`, and `thumbnailUrl` pointing only to public watermarked derivatives, never an original or private storage hostname.
- Image sitemap entries pointing to the public social derivative and licensing page.

The metadata panel will remove the `Original / View original JPEG` row. It may replace it with `Availability / Full-resolution files available by license` linked to the photo-aware licensing request.

## Response and failure behavior

- Missing private object: `404`, `Cache-Control: no-store`, structured log containing only the safe requested key.
- Unsupported preset, source, or method: `404` or `405` with no object existence disclosure.
- Blocked hotlink: `403`, short cache or no-store, no redirect to the source.
- Image transformation failure: `502` with `no-store`; never fall back to the original.
- R2 and Images failures must not reveal bucket names, source hostnames, stack traces, or signing material.
- `HEAD` follows the same authorization and validation path as `GET` and returns no body.

## Deployment sequence

1. Add tests and distribution assertions before production code.
2. Add the Images binding, private-R2 transform pipeline, watermark asset, hotlink policy, licensing notice, structured-data changes, and robots content signal.
3. Verify locally with the low-fidelity Images binding where possible and in a non-production remote preview for watermark/draw fidelity.
4. Deploy the new Worker while the old R2 custom domain still exists, but confirm all generated pages use only Worker derivative URLs.
5. Verify representative desktop/mobile pages, derivative dimensions, watermark visibility, caching, metadata, hotlink behavior, and absence of original URLs.
6. Disable the R2 custom domain and any `r2.dev` public URL.
7. Confirm a known original URL no longer returns the object while all five derivative presets continue to work.
8. Apply and verify bot, AI, and rate-limit settings through Cloudflare Security Events.
9. Retain rollback through the previous Worker version; re-enabling public original access is not an acceptable routine rollback.

## Verification and acceptance criteria

The work is complete only when all of these are proven:

1. Repository search and all 461 generated pages contain no `photos.whitemountains.pictures` URL or `View original JPEG` link.
2. All 356 photo pages contain the complete visible licensing notice and photo-specific CTA.
3. All 356 `ImageObject` records point `contentUrl`, `url`, and `thumbnailUrl` to `/images/` derivatives and retain the rights/licensing fields.
4. The Worker reads image bytes from `env.PHOTOS`, transforms through `env.IMAGES`, supports only the five presets, and never redirects or falls back to an original.
5. Automated tests cover preset validation, R2 misses, transform failures, `HEAD`, referrer allow/block behavior, cache/security headers, and original-route denial.
6. Build, typecheck, unit tests, distribution verification, CSS/browser parsing, and Wrangler deploy dry-run pass.
7. A remote preview shows a visible but restrained watermark on representative landscape and portrait images at desktop and mobile sizes.
8. Direct requests for a known original fail after public R2 access is disabled.
9. Same-site and blank-referrer derivative requests succeed; a foreign non-empty referrer receives `403`.
10. The Cloudflare dashboard or API proves the configured bot policy, AI behavior policy, and `/images/*` rate-limit rule are active while search crawling remains allowed.
11. Google/social derivative fetches and page preview metadata remain functional.

## Authoritative platform references

- [Cloudflare R2 public bucket access controls](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [Cloudflare Images binding with private R2 bytes](https://developers.cloudflare.com/images/optimization/binding/)
- [Cloudflare Images overlays and watermarks](https://developers.cloudflare.com/images/optimization/draw-overlays/)
- [Cloudflare WAF rate limiting](https://developers.cloudflare.com/waf/rate-limiting-rules/)
- [Cloudflare hotlink protection limitations](https://developers.cloudflare.com/waf/tools/scrape-shield/hotlink-protection/)
- [Cloudflare AI bot policies](https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/)
- [Cloudflare managed robots/content signals](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/)
