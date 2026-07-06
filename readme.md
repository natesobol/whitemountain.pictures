# White Mountains Pictures

White Mountains Pictures is a gallery-only sibling to the broader NH48 ecosystem. This repo establishes the first-pass Cloudflare-ready architecture, NH48-family shell styling, prerendered route generation, sitemap/canonical infrastructure, and a reusable local content model built entirely from placeholder collection and photo manifests.

## Architecture

- `data/site.json`
  Site-wide brand, canonical host, default SEO copy, hero text, and theme defaults.
- `data/navigation.json`
  Primary navigation, footer columns, and header CTA/search config.
- `data/collections.json`
  Collection records used for the collections index, collection detail routes, featured sections, and collection metadata.
- `data/photos.json`
  Photo records used for gallery grids, individual photo detail routes, search scaffolding, structured data, and the image sitemap.
- `templates/*.html`
  Page templates for home, gallery, collections, individual collection pages, photo detail pages, featured, about, and 404.
- `components/*.js`
  Shared render helpers for the NH48-style shell, hero sections, gallery cards, breadcrumbs, filters, metadata, and SEO.
- `scripts/prerender-site.js`
  Prerenders all important routes into `dist/` and generates placeholder SVG assets for every photo record.
- `scripts/generate-sitemaps.js`
  Writes `sitemap.xml`, `page-sitemap.xml`, `image-sitemap.xml`, and `robots.txt`.
- `scripts/validate-data.js`
  Verifies collection/photo uniqueness, route-safe slugs, required fields, and collection photo counts.
- `scripts/build-search-index.js`
  Builds a lightweight JSON search scaffold for future enhancement.
- `src/worker.js`
  Cloudflare Worker entrypoint for canonical host redirects and asset response headers.
- `dist/`
  Generated output directory served by Cloudflare static assets.

## Rendering Strategy

- Build-time prerendered:
  - `/`
  - `/gallery`
  - `/collections`
  - `/collections/{slug}`
  - `/photo/{slug}`
  - `/featured`
  - `/about`
  - `/404`
- Source HTML stays rich and crawlable.
- Client JavaScript is enhancement-only:
  - theme toggle
  - mobile nav
  - gallery filtering/search/sort/load-more
- Photo placeholder SVGs are generated locally during the prerender step so the site is explorable before final image assets exist.

## Commands

Requires Node 20+ for the standard npm + Wrangler workflow.

```bash
npm install
npm run validate
npm run search-index
npm run prerender
npm run sitemaps
npm run build
npm run dev
```

What each script does:

- `npm run validate`
  Validates the local JSON content model.
- `npm run search-index`
  Writes `dist/search-index.json`.
- `npm run prerender`
  Copies public/styles assets, generates placeholder SVGs, and writes all prerendered routes into `dist/`.
- `npm run sitemaps`
  Writes robots and sitemap files into `dist/`.
- `npm run build`
  Runs `clean`, `validate`, `search-index`, `prerender`, and `sitemaps` in sequence.
- `npm run dev`
  Builds first, then starts `wrangler dev`.

Optional note:
In environments where `node` is not on the shell path, these ESM scripts also run under Deno with `deno run -A ...`. The intended deploy/runtime path is still Node + Wrangler.

## Cloudflare Deployment Flow

This project is configured for a Cloudflare Worker fronting a static `dist/` asset bundle.

- Worker entry: `src/worker.js`
- Asset directory: `dist`
- Preferred host: `https://whitemountains.pictures`
- Redirect target: `www.whitemountains.pictures` → apex

Recommended deploy flow:

1. Connect the GitHub repo to Cloudflare Workers Builds, or deploy from CI with `wrangler deploy`.
2. Use `npm run build` as the build command.
3. Ensure the Worker has access to the generated `dist/` directory at deploy time.
4. Confirm the custom domain routes in `wrangler.toml` once the zone is active in Cloudflare.

## Local Development

1. Install dependencies with `npm install`.
2. Run `npm run build` once to create `dist/`.
3. Run `npm run dev` to serve the Worker + static assets locally through Wrangler.

## SEO and Canonical Policy

- Canonical tags are generated centrally from `data/site.json`.
- The Worker enforces the preferred host redirect for `www`.
- `robots.txt`, `page-sitemap.xml`, `image-sitemap.xml`, and `sitemap.xml` are generated during the build.
- Structured data included:
  - `WebSite` on the homepage
  - `CollectionPage` on gallery and collection pages
  - `ImageObject` on photo detail pages
  - `BreadcrumbList` on collection and photo pages

## Swapping in Real Image Data Later

Primary files to update:

- `data/photos.json`
  Replace placeholder image URLs, thumbnails, dimensions, metadata, dates, camera/lens info, and collection assignments.
- `data/collections.json`
  Replace cover images, descriptions, tags, and collection-level metadata.
- `data/site.json`
  Replace the default social image and any site-wide brand copy when the real launch assets are ready.

Placeholder asset generation currently happens during prerender:

- `scripts/prerender-site.js`
- `scripts/lib/render.js`

Once real image URLs are in the JSON manifests, run `npm run build` again and the prerendered pages plus sitemap outputs will update automatically.
