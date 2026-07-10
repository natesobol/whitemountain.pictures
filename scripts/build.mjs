import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  MEDIA_ORIGIN,
  SITE_ORIGIN,
  escapeHtml,
  formatDate,
  formatExposure,
  groupBy,
  hashContent,
  imageHref,
  normalize2025,
  normalize2026,
  originalHref,
  photoHref,
  safeJson,
  slugify,
} from "./site-core.mjs";

const root = process.cwd();
const out = join(root, "dist");
const cache = join(root, ".cache", "source");
const baseMedia = `${MEDIA_ORIGIN}/photos`;
const generatedAt = new Date().toISOString();

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await mkdir(cache, { recursive: true });

async function fetchJson(path, { refresh = false } = {}) {
  const cachePath = join(cache, path.replaceAll("/", "__"));
  if (!refresh) {
    try {
      return JSON.parse(await readFile(cachePath, "utf8"));
    } catch {}
  }
  const response = await fetch(`${baseMedia}/${path}`, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Unable to fetch ${path}: ${response.status}`);
  const text = await response.text();
  await writeFile(cachePath, text);
  return JSON.parse(text);
}

async function parallelMap(items, limit, task) {
  const result = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      result[index] = await task(items[index], index);
    }
  }));
  return result;
}

const [archive2025, manifest2025, collections2025, manifest2026] = await Promise.all([
  fetchJson("2025/full-metadata-archive.json"),
  fetchJson("2025/manifest.json"),
  fetchJson("2025/collections.json"),
  fetchJson("2026/manifest.json"),
]);

const manifest2025ByMetadataId = new Map(manifest2025.photos.map((item) => [item.metadataId, item]));
const photos2025 = archive2025.photos.map((record) => normalize2025(
  record,
  manifest2025ByMetadataId.get(record.identity?.metadataId),
));
const records2026 = await parallelMap(manifest2026.photos, 16, (item) => fetchJson(
  item.objectKeys.metadata.replace(/^photos\/2026\//, "2026/"),
));
const photos2026 = records2026.map((record, index) => normalize2026(record, manifest2026.photos[index]));
const photos = [...photos2026, ...photos2025].sort((a, b) =>
  String(b.captureDate).localeCompare(String(a.captureDate)) || a.title.localeCompare(b.title));

const duplicateTitles = groupBy(photos, (photo) => photo.title.toLowerCase());
for (const duplicates of duplicateTitles.values()) {
  if (duplicates.length < 2) continue;
  for (const photo of duplicates) {
    photo.approved = false;
    photo.reviewReasons.push("Duplicate title must be resolved before indexing.");
  }
}

const css = await readFile(join(root, "src", "styles.css"), "utf8");
const js = await readFile(join(root, "src", "client.js"), "utf8");
const cssName = `site.${hashContent(css)}.css`;
const jsName = `site.${hashContent(js)}.js`;
await writeFile(join(out, cssName), css);
await writeFile(join(out, jsName), js);

async function output(relativePath, content) {
  const target = join(out, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content);
}

function absolute(path) {
  return `${SITE_ORIGIN}${path}`;
}

function header(current = "") {
  const links = [
    ["Archive", "/photos/"],
    ["2025", "/photos/2025/"],
    ["2026", "/photos/2026/"],
    ["About", "/about/nathan-sobol/"],
    ["Licensing", "/licensing/"],
  ];
  return `<a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header"><a class="brand" href="/"><span class="brand-mark" aria-hidden="true">▲</span>White Mountains Pictures</a>
  <nav aria-label="Primary">${links.map(([label, href]) => `<a href="${href}"${current === href ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav></header>`;
}

function footer() {
  return `<footer class="site-footer"><p>© Nathan Sobol. White Mountains, New Hampshire.</p><p><a href="/about/photo-metadata/">Metadata policy</a> · <a href="/licensing/">License a photograph</a></p></footer>`;
}

function breadcrumbs(items) {
  const parts = items.map(([label, href], index) => href && index < items.length - 1
    ? `<a href="${href}">${escapeHtml(label)}</a>`
    : `<span aria-current="page">${escapeHtml(label)}</span>`);
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">${parts.join("<span aria-hidden=\"true\">/</span>")}</nav>`;
}

function document({ title, description, path, body, robots = "index,follow,max-image-preview:large", image, schema = [], current = "", bodyClass = "" }) {
  const canonical = absolute(path);
  const schemas = Array.isArray(schema) ? schema : [schema];
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="${robots}">
<link rel="canonical" href="${canonical}"><link rel="stylesheet" href="/${cssName}">
<meta property="og:type" content="website"><meta property="og:site_name" content="White Mountains Pictures"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}">${image ? `<meta property="og:image" content="${escapeHtml(image)}"><meta name="twitter:card" content="summary_large_image">` : ""}
${schemas.filter(Boolean).map((item) => `<script type="application/ld+json">${safeJson(item)}</script>`).join("\n")}</head>
<body class="${bodyClass}">${header(current)}<main id="main">${body}</main>${footer()}<script src="/${jsName}" defer></script></body></html>`;
}

function personSchema() {
  return {
    "@type": "Person",
    "@id": `${SITE_ORIGIN}/about/nathan-sobol/#person`,
    name: "Nathan Sobol",
    url: `${SITE_ORIGIN}/about/nathan-sobol/`,
    jobTitle: "Landscape photographer",
  };
}

function breadcrumbSchema(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], index) => ({
      "@type": "ListItem", position: index + 1, name, item: absolute(path),
    })),
  };
}

function card(photo, heading = "h2") {
  return `<a class="photo-card" href="${photoHref(photo)}"><img src="${imageHref(photo, "card")}" width="${photo.width}" height="${photo.height}" alt="${escapeHtml(photo.alt)}" loading="lazy" decoding="async"><div class="photo-card-copy"><${heading}>${escapeHtml(photo.title)}</${heading}><p>${escapeHtml(photo.place)} · ${escapeHtml(formatDate(photo.captureDate))}</p><div class="badge-row"><span class="badge ${photo.approved ? "badge-approved" : "badge-review"}">${photo.approved ? "Metadata reviewed" : "Review pending"}</span><span class="badge">${photo.year}</span></div></div></a>`;
}

function archivePage({ title, description, path, items, current = "", indexable = false, intro = "" }) {
  const body = `<div class="content-shell">${breadcrumbs([["Home", "/"], [title, path]])}<header class="page-heading"><p class="section-kicker">Photographic archive</p><h1 class="page-title">${escapeHtml(title)}</h1><p class="lead">${escapeHtml(description)}</p></header>${intro ? `<div class="prose"><p>${escapeHtml(intro)}</p></div>` : ""}<section aria-labelledby="archive-heading"><div class="section-heading"><h2 id="archive-heading">${items.length} photographs</h2></div><div class="archive-grid">${items.map((photo) => card(photo)).join("")}</div></section></div>`;
  const schema = { "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", "@id": `${absolute(path)}#page`, url: absolute(path), name: title, description, isPartOf: { "@id": `${SITE_ORIGIN}/#website` } },
    breadcrumbSchema([["Home", "/"], [title, path]]), personSchema(),
  ] };
  return document({ title: `${title} | White Mountains Pictures`, description, path, body, robots: indexable ? undefined : "noindex,follow,max-image-preview:large", schema, current });
}

const approved = photos.filter((photo) => photo.approved);
const homePhotos = [...approved, ...photos.filter((photo) => !photo.approved)].slice(0, 24);
const featured = homePhotos[0];
const catalog = photos.map((photo) => ({
  href: photoHref(photo), title: photo.title, place: photo.place, alt: photo.alt,
  thumb: imageHref(photo, "thumb"), hero: imageHref(photo, "hero"),
  width: photo.width, height: photo.height, orientation: photo.orientation,
  year: photo.year, season: photo.season, status: photo.approved ? "reviewed" : "pending",
}));
const catalogText = JSON.stringify(catalog);
const catalogName = `photos.${hashContent(catalogText)}.json`;
await output(`data/${catalogName}`, catalogText);

const homeBody = `<section class="experience" aria-labelledby="home-title"><div class="wall-stage"><div class="mosaic-field" data-photo-wall data-catalog-url="/data/${catalogName}">${homePhotos.map((photo, index) => `<a class="photo-tile ${photo.orientation === "portrait" ? "is-portrait" : "is-landscape"}" href="${photoHref(photo)}" data-title="${escapeHtml(photo.title)}" data-place="${escapeHtml(photo.place)}" data-hero="${imageHref(photo, "hero")}" data-alt="${escapeHtml(photo.alt)}"><img src="${imageHref(photo, index === 0 ? "hero" : "thumb")}" width="${photo.width}" height="${photo.height}" alt="${escapeHtml(photo.alt)}" loading="${index === 0 ? "eager" : "lazy"}" decoding="async"${index === 0 ? ' fetchpriority="high"' : ""}><span>${escapeHtml(photo.place)}</span></a>`).join("")}</div>
<div class="featured-photo"><img data-featured-image src="${imageHref(featured, "hero")}" width="${featured.width}" height="${featured.height}" alt="${escapeHtml(featured.alt)}" loading="lazy" decoding="async"><div class="featured-caption"><p data-featured-place>${escapeHtml(featured.place)}</p><h2 data-featured-title>${escapeHtml(featured.title)}</h2></div></div>
<div class="hero-copy"><p class="section-kicker">Nathan Sobol · New Hampshire</p><h1 id="home-title">White Mountains Pictures</h1><p>A field archive of trails, summits, forest light, and weather across New Hampshire’s White Mountains—with one durable, metadata-rich page for every photograph.</p><div class="hero-actions"><a class="button button-primary" href="/photos/2026/">Explore 2026</a><a class="button button-secondary" href="/photos/2025/">Explore 2025</a></div></div></div>
<form class="wall-controls" data-wall-filters><label><span>Year</span><select name="year"><option value="all">All years</option><option>2026</option><option>2025</option></select></label><label><span>Season</span><select name="season"><option value="all">All seasons</option><option>Spring</option><option>Summer</option><option>Autumn</option><option>Winter</option></select></label><label><span>Metadata</span><select name="status"><option value="all">All records</option><option value="reviewed">Reviewed</option><option value="pending">Review pending</option></select></label><button class="icon-button" type="reset">Reset</button></form><div class="wall-footer"><p data-result-count>Showing ${homePhotos.length} of ${photos.length} photographs</p><button class="button button-ghost" type="button" data-load-more>Load more</button></div></section>
<section class="intro-band"><div><p class="section-kicker">Built for discovery</p><h2>Every frame has context.</h2></div><p>Open a photograph to find its descriptive caption, safe location context, capture date, camera and lens data, licensing information, related trip, and neighboring images. Metadata still awaiting review is clearly marked and excluded from search-engine sitemaps.</p></section>
<section class="catalog-section"><div class="section-heading"><div><p class="section-kicker">Reviewed work</p><h2>Ready for search and sharing</h2></div><a class="button button-secondary" href="/photos/">View archive</a></div><div class="prose"><p>${approved.length} photographs currently pass the archive’s editorial metadata gate. Browse <a href="/photos/2026/">the 2026 archive</a>, explore the complete <a href="/photos/">photo index</a>, or learn how the <a href="/about/photo-metadata/">review policy</a> protects accuracy and sensitive information.</p></div></section>`;
await output("index.html", document({
  title: "White Mountains Pictures by Nathan Sobol",
  description: "Landscape and trail photography from New Hampshire’s White Mountains, with accessible captions, camera metadata, trip context, and licensing details.",
  path: "/", body: homeBody, image: absolute(imageHref(featured, "social")), bodyClass: "home",
  schema: { "@context": "https://schema.org", "@graph": [
    { "@type": "WebSite", "@id": `${SITE_ORIGIN}/#website`, url: `${SITE_ORIGIN}/`, name: "White Mountains Pictures", publisher: { "@id": `${SITE_ORIGIN}/about/nathan-sobol/#person` } },
    { "@type": "CollectionPage", "@id": `${SITE_ORIGIN}/#page`, url: `${SITE_ORIGIN}/`, name: "White Mountains Pictures", about: { "@type": "Place", name: "White Mountains, New Hampshire" } }, personSchema(),
  ] },
}));

await output("photos/index.html", archivePage({
  title: "White Mountains Photo Archive", path: "/photos/", items: photos,
  description: "Browse the complete White Mountains Pictures archive by Nathan Sobol, including reviewed records and work still awaiting metadata review.",
  current: "/photos/", indexable: true,
  intro: "This archive spans mountain trails, summits, forests, weather, and quiet details across New Hampshire. Every card is a normal link to a permanent photo page; JavaScript is optional.",
}));

for (const year of [2026, 2025]) {
  const items = photos.filter((photo) => photo.year === year);
  const reviewedCount = items.filter((photo) => photo.approved).length;
  await output(`photos/${year}/index.html`, archivePage({
    title: `${year} White Mountains Photographs`, path: `/photos/${year}/`, items,
    description: `${items.length} photographs made in ${year} across New Hampshire’s White Mountains, with ${reviewedCount} metadata records currently approved for indexing.`,
    current: `/photos/${year}/`, indexable: reviewedCount >= 6,
    intro: `The ${year} field archive preserves a durable page for each frame. Reviewed pages expose descriptive and technical metadata to search engines; pending records remain available to people while editorial checks are completed.`,
  }));
}

for (const [index, photo] of photos.entries()) {
  const path = photoHref(photo);
  const previous = photos[index - 1];
  const next = photos[index + 1];
  const tripPath = photo.tripId ? `/trips/${photo.tripId}/` : "";
  const placePath = `/places/${slugify(photo.place)}/`;
  const image = absolute(imageHref(photo, "social"));
  const original = originalHref(photo);
  const aperture = photo.fNumber ? `f/${photo.fNumber}` : "Not published";
  const metadataRows = [
    ["Captured", formatDate(photo.captureDate)], ["Safe location", `<a href="${placePath}">${escapeHtml(photo.place)}</a>`],
    ["Camera", escapeHtml(photo.camera || "Not published")], ["Lens", escapeHtml(photo.lens || "Not published")],
    ["Exposure", escapeHtml(formatExposure(photo.exposureTime))], ["Aperture", aperture],
    ["ISO", photo.iso || "Not published"], ["Focal length", photo.focalLength ? `${photo.focalLength} mm` : "Not published"],
    ["Dimensions", `${photo.width} × ${photo.height} px`], ["Creator", `<a href="/about/nathan-sobol/">Nathan Sobol</a>`],
    ["Rights", `<a href="/licensing/">© Nathan Sobol · licensing</a>`], ["Original", `<a href="${original}">View original JPEG</a>`],
  ];
  const body = `<div class="content-shell">${breadcrumbs([["Home", "/"], ["Photos", "/photos/"], [String(photo.year), `/photos/${photo.year}/`], [photo.title, path]])}<header class="page-heading"><p class="section-kicker">${photo.approved ? "Reviewed photographic record" : "Metadata review pending"}</p><h1 class="page-title">${escapeHtml(photo.title)}</h1><p class="lead">${escapeHtml(photo.description)}</p></header><figure class="page-hero"><img src="${imageHref(photo, "detail")}" srcset="${imageHref(photo, "card")} 960w, ${imageHref(photo, "detail")} 1800w" sizes="(max-width: 1180px) 100vw, 1132px" width="${photo.width}" height="${photo.height}" alt="${escapeHtml(photo.alt)}" fetchpriority="high" decoding="async"><figcaption class="sr-only">${escapeHtml(photo.alt)}</figcaption></figure>
<div class="photo-layout"><article class="photo-story"><h2>${escapeHtml(photo.headline)}</h2><p>${escapeHtml(photo.extendedDescription)}</p>${tripPath ? `<p>This image belongs to <a href="${tripPath}">${escapeHtml(photo.tripLabel || "a White Mountains field trip")}</a>.</p>` : ""}<ul class="tag-list">${photo.tags.slice(0, 14).map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul><p><a class="button button-secondary" href="/licensing/">Ask about licensing this photograph</a></p><nav class="pager" aria-label="Adjacent photographs">${previous ? `<a href="${photoHref(previous)}">Previous<strong>${escapeHtml(previous.title)}</strong></a>` : "<span></span>"}${next ? `<a href="${photoHref(next)}">Next<strong>${escapeHtml(next.title)}</strong></a>` : ""}</nav></article>
<aside class="metadata-panel" aria-labelledby="metadata-title"><h2 id="metadata-title">Photo metadata</h2><dl>${metadataRows.map(([term, value]) => `<dt>${term}</dt><dd>${value}</dd>`).join("")}</dl><p class="metadata-note">${photo.approved ? "This record passed the archive’s human-review and completeness gate." : `This page is excluded from search sitemaps until editorial review is complete. ${escapeHtml(photo.reviewReasons.join(" "))}`}</p></aside></div></div>`;
  const schema = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebPage", "@id": `${absolute(path)}#page`, url: absolute(path), name: photo.title, description: photo.description, breadcrumb: { "@id": `${absolute(path)}#breadcrumb` }, primaryImageOfPage: { "@id": `${absolute(path)}#image` }, author: { "@id": `${SITE_ORIGIN}/about/nathan-sobol/#person` } },
    { "@type": "ImageObject", "@id": `${absolute(path)}#image`, contentUrl: original, thumbnailUrl: image, url: image, name: photo.title, caption: photo.description, description: photo.extendedDescription, representativeOfPage: true, uploadDate: generatedAt, dateCreated: photo.captureDate, width: photo.width, height: photo.height, encodingFormat: "image/jpeg", creator: { "@id": `${SITE_ORIGIN}/about/nathan-sobol/#person` }, copyrightHolder: { "@id": `${SITE_ORIGIN}/about/nathan-sobol/#person` }, copyrightNotice: "© Nathan Sobol. All rights reserved.", creditText: "© Nathan Sobol / White Mountains Pictures", license: `${SITE_ORIGIN}/licensing/`, acquireLicensePage: `${SITE_ORIGIN}/licensing/`, contentLocation: { "@type": "Place", name: photo.place, address: { "@type": "PostalAddress", addressRegion: "NH", addressCountry: "US" } }, exifData: [photo.camera && { "@type": "PropertyValue", name: "Camera", value: photo.camera }, photo.lens && { "@type": "PropertyValue", name: "Lens", value: photo.lens }, photo.fNumber && { "@type": "PropertyValue", name: "Aperture", value: aperture }, photo.iso && { "@type": "PropertyValue", name: "ISO", value: photo.iso }].filter(Boolean) },
    { ...breadcrumbSchema([["Home", "/"], ["Photos", "/photos/"], [String(photo.year), `/photos/${photo.year}/`], [photo.title, path]]), "@id": `${absolute(path)}#breadcrumb` }, personSchema(),
  ] };
  await output(`${path.slice(1)}index.html`, document({
    title: `${photo.title} | Nathan Sobol`, description: photo.description, path, body,
    robots: photo.approved ? undefined : "noindex,follow,max-image-preview:large", image, schema,
  }));
}

const trips = groupBy(photos, "tripId");
for (const [tripId, items] of trips) {
  const reviewed = items.filter((photo) => photo.approved).length;
  const label = items.find((photo) => photo.tripLabel)?.tripLabel || tripId;
  await output(`trips/${tripId}/index.html`, archivePage({
    title: label, path: `/trips/${tripId}/`, items,
    description: `${items.length} photographs from ${label}, including trail, landscape, and weather context from the White Mountains.`,
    indexable: reviewed >= 3,
    intro: `This trip page keeps its photographs in capture context and links directly to every full metadata record. Locations are generalized to safe public trail or mountain labels; camera GPS and serial numbers are never published.`,
  }));
}

const places = groupBy(photos, (photo) => slugify(photo.place));
for (const [placeSlug, items] of places) {
  const label = items[0].place;
  const reviewed = items.filter((photo) => photo.approved).length;
  await output(`places/${placeSlug}/index.html`, archivePage({
    title: `${label} Photography`, path: `/places/${placeSlug}/`, items,
    description: `${items.length} landscape and trail photographs associated with ${label} in the White Mountains archive.`,
    indexable: reviewed >= 3,
    intro: `This location hub uses a broad, public-facing place label. It intentionally does not expose camera coordinates, precise off-trail positions, equipment serial numbers, or other sensitive EXIF fields.`,
  }));
}

const collectionGroups = groupBy(photos, "collectionIds");
for (const collection of collections2025) {
  const items = collectionGroups.get(collection.slug) ?? [];
  if (!items.length) continue;
  const reviewed = items.filter((photo) => photo.approved).length;
  await output(`collections/${collection.slug}/index.html`, archivePage({
    title: collection.title, path: `/collections/${collection.slug}/`, items,
    description: collection.description, indexable: reviewed >= 4,
    intro: collection.subtitle,
  }));
}

const prosePages = [
  {
    path: "/about/nathan-sobol/", title: "Nathan Sobol, White Mountains Photographer",
    description: "About Nathan Sobol and the field-focused White Mountains Pictures archive.",
    body: `<div class="content-shell">${breadcrumbs([["Home", "/"], ["About Nathan Sobol", "/about/nathan-sobol/"]])}<header class="page-heading"><p class="section-kicker">Photographer</p><h1 class="page-title">Nathan Sobol</h1><p class="lead">Landscape, trail, and mountain photography from New Hampshire’s White Mountains.</p></header><article class="prose"><p>White Mountains Pictures is Nathan Sobol’s field archive: a growing record of ridgelines, wooded approaches, summit weather, trail details, and the light that changes a familiar route. Each photograph is presented as an individual work, not as an anonymous gallery tile.</p><h2>Editorial approach</h2><p>The archive joins descriptive writing with safe location context and technical camera metadata. Automated enrichment can help organize a large body of work, but search indexing is reserved for records that pass human review. Precise camera coordinates, serial numbers, and private source paths are not published.</p><h2>Using the work</h2><p>To reproduce or commission a photograph, see the <a href="/licensing/">licensing page</a>. For details about how fields are selected and reviewed, read the <a href="/about/photo-metadata/">photo metadata policy</a>.</p></article></div>`,
  },
  {
    path: "/about/photo-metadata/", title: "Photo Metadata and Editorial Policy",
    description: "How White Mountains Pictures reviews, publishes, and protects photographic metadata.",
    body: `<div class="content-shell">${breadcrumbs([["Home", "/"], ["Metadata policy", "/about/photo-metadata/"]])}<header class="page-heading"><p class="section-kicker">Archive policy</p><h1 class="page-title">Photo metadata</h1><p class="lead">Useful context for people and search engines, with an explicit human-review boundary.</p></header><article class="prose"><h2>What a photo page publishes</h2><p>Pages may include a descriptive title, alternative text, caption, capture date, broad public location, trip association, camera model, lens, aperture, exposure, ISO, focal length, image dimensions, creator, rights, and licensing link.</p><h2>What is withheld</h2><p>Camera GPS, precise off-trail coordinates, equipment serial numbers, private filesystem paths, editing histories, and unneeded raw metadata are excluded. Trip coordinates are treated as route context—not proof of the camera’s position.</p><h2>Indexing gate</h2><p>Every photograph has a stable page so the archive can be navigated without JavaScript. A page enters search sitemaps only after the source record is marked reviewed, required descriptive fields are present, dimensions are valid, camera values are plausible, and duplicate titles are resolved. Pending records use <code>noindex,follow</code>.</p></article></div>`,
  },
  {
    path: "/licensing/", title: "License White Mountains Photography",
    description: "Licensing information for White Mountains photographs by Nathan Sobol.",
    body: `<div class="content-shell">${breadcrumbs([["Home", "/"], ["Licensing", "/licensing/"]])}<header class="page-heading"><p class="section-kicker">Rights and usage</p><h1 class="page-title">Photography licensing</h1><p class="lead">All photographs are © Nathan Sobol. Permission is required for reproduction, resale, advertising, editorial publication, or commercial display.</p></header><article class="prose"><h2>Request a license</h2><p>When asking about a photograph, include the full photo-page URL, intended use, placement, audience or circulation, territory, duration, and requested dimensions. Those details make it possible to quote a clear license.</p><h2>Online references</h2><p>Ordinary editorial links to a page on this website are welcome. Copying the image file, removing attribution, training a model on the work, minting it as a token, or redistributing it through another gallery is not authorized without a separate written agreement.</p><h2>Contact</h2><p>Use the contact channel associated with Nathan Sobol’s published portfolio and include “White Mountains Pictures license” in the subject. The canonical photo URL uniquely identifies the requested work.</p></article></div>`,
  },
];
for (const page of prosePages) {
  await output(`${page.path.slice(1)}index.html`, document({ ...page, schema: { "@context": "https://schema.org", "@graph": [{ "@type": "WebPage", url: absolute(page.path), name: page.title }, personSchema()] } }));
}

await output("404.html", document({ title: "Page not found", description: "The requested White Mountains Pictures page was not found.", path: "/404/", robots: "noindex,nofollow", body: `<div class="content-shell"><header class="page-heading"><p class="section-kicker">404</p><h1 class="page-title">That trail ends here.</h1><p class="lead">The requested page was not found. Return to the <a href="/photos/">photo archive</a>.</p></header></div>` }));

function xml(value) {
  return escapeHtml(value).replaceAll("&#39;", "&apos;");
}
function urlSet(entries, images = false) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${images ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ""}>\n${entries.map((entry) => `  <url><loc>${xml(absolute(entry.path))}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}${images && entry.image ? `<image:image><image:loc>${xml(entry.image)}</image:loc><image:caption>${xml(entry.caption)}</image:caption><image:title>${xml(entry.title)}</image:title><image:license>${SITE_ORIGIN}/licensing/</image:license></image:image>` : ""}</url>`).join("\n")}\n</urlset>\n`;
}
const coreUrls = ["/", "/photos/", "/photos/2026/", "/about/nathan-sobol/", "/about/photo-metadata/", "/licensing/"].map((path) => ({ path }));
const photoUrls = approved.map((photo) => ({ path: photoHref(photo), lastmod: photo.captureDate, image: absolute(imageHref(photo, "detail")), caption: photo.description, title: photo.title }));
const hubUrls = [
  ...[...trips].filter(([, items]) => items.filter((p) => p.approved).length >= 3).map(([slug]) => ({ path: `/trips/${slug}/` })),
  ...[...places].filter(([, items]) => items.filter((p) => p.approved).length >= 3).map(([slug]) => ({ path: `/places/${slug}/` })),
];
await output("sitemaps/core.xml", urlSet(coreUrls));
await output("sitemaps/photos.xml", urlSet(photoUrls, true));
await output("sitemaps/hubs.xml", urlSet(hubUrls));
await output("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap><loc>${SITE_ORIGIN}/sitemaps/core.xml</loc></sitemap>\n  <sitemap><loc>${SITE_ORIGIN}/sitemaps/photos.xml</loc></sitemap>\n  <sitemap><loc>${SITE_ORIGIN}/sitemaps/hubs.xml</loc></sitemap>\n</sitemapindex>\n`);
await output("robots.txt", `User-agent: *\nAllow: /\nDisallow: /images/resize\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);
await output("_headers", `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()\n  Content-Security-Policy: default-src 'self'; img-src 'self' https://photos.whitemountains.pictures data:; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests\n  Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400\n\n/*.css\n  Cache-Control: public, max-age=31536000, immutable\n\n/*.js\n  Cache-Control: public, max-age=31536000, immutable\n\n/data/*\n  Cache-Control: public, max-age=31536000, immutable\n\n/sitemaps/*\n  Cache-Control: public, max-age=900, s-maxage=3600\n\n/robots.txt\n  Cache-Control: public, max-age=900, s-maxage=3600\n`);

const report = {
  generatedAt, totalPhotos: photos.length, years: Object.fromEntries([2025, 2026].map((year) => [year, photos.filter((p) => p.year === year).length])),
  approvedPhotos: approved.length, pendingReview: photos.length - approved.length,
  duplicateTitleRecords: photos.filter((p) => p.reviewReasons.includes("Duplicate title must be resolved before indexing.")).length,
  tripPages: trips.size, placePages: places.size, collectionPages: [...collectionGroups].filter(([, items]) => items.length).length,
  sitemapPhotoUrls: photoUrls.length, sitemapHubUrls: hubUrls.length,
  assets: { css: cssName, js: jsName, catalog: catalogName },
};
await output("build-report.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
