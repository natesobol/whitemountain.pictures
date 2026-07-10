# Deployment and rollback runbook

## Preflight

1. Confirm `npx wrangler whoami` resolves the expected Cloudflare account.
2. Run `npm ci`.
3. Run `npm run check`.
4. Inspect `git diff --check` and the generated `dist/build-report.json`.
5. Run Wrangler's dry-run bundle validation and local HTTP/browser smoke tests before production promotion.

## Production

1. Record `npx wrangler deployments status --name whitemountains-pictures --json`.
2. Deploy the verified static assets and Worker with Wrangler. This updates application code only; it does not mutate or delete R2 source objects.
3. Confirm the new version ID and preserve the previous version ID.
4. Warm and verify the homepage, one reviewed photo, one noindex photo, one year page, one trip page, one place page, one collection, every sitemap, a named image variant, an original Range request, HTTP/`www` redirects, and a 404. Confirm the second request reports a Cloudflare cache hit where eligible.
5. Confirm no camera original is requested during a normal page view.

## Targeted purge

Use cache tags or exact URLs. Prefer `photo-<id>`, `year-<year>`, `media-variant`, and `site-shell`. Do not use purge-everything for ordinary publication.

## Rollback

Run `npx wrangler rollback <previous-version-id> --name whitemountains-pictures` or restore the previous deployment from the Cloudflare dashboard. R2 objects are not changed or deleted by application rollback.
