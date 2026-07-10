# SEO metadata contract

## Photo identity

- URL: `/photos/<year>/<descriptive-slug>--<stable-id>/`
- The stable ID is retained even when editorial titles change.
- Canonicals always use the HTTPS apex hostname.
- The image original uses `https://photos.whitemountains.pictures/photos/<year>/originals/<filename>`.
- Display and social images use named transformation routes, never the camera original.

## Indexability gate

A page is `index,follow` only when `needsHumanReview` is false and required title, description, alt text, capture date, safe location, dimensions, and camera values validate. Otherwise it is `noindex,follow`. Noindex photo URLs are omitted from sitemaps.

## Visible fields

Photo pages expose title, caption, photographer note, verified capture date, safe approximate location, trip context, season, weather, camera, lens, focal length, ISO, aperture, shutter speed, orientation, pixel dimensions, creator, credit, copyright, and rights. Camera-derived and inferred values are labeled separately.

Invalid zero, negative, non-finite, or placeholder camera values are suppressed.

## Structured data

Each photo page emits a JSON-LD graph containing:

- `WebPage` with `mainEntity` pointing to the photograph.
- `ImageObject` with `contentUrl`, `name`, `caption`, `description`, `creator`, `creditText`, `copyrightNotice`, `license`, `acquireLicensePage`, `dateCreated`, `contentLocation`, `width`, `height`, `encodingFormat`, and `representativeOfPage`.
- `BreadcrumbList` matching visible navigation.
- A stable `Person` entity for Nathan Sobol.

No precise camera GPS or trip centroid is emitted. The public XMP sidecar and original remain available for rights portability, while page-level JSON-LD is authoritative when metadata sources differ.
