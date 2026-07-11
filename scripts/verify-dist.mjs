import { access, readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const root = join(process.cwd(), "dist");
const errors = [];

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory)) {
    const path = join(directory, entry);
    if ((await stat(path)).isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function localPathForUrl(url) {
  const pathname = new URL(url, "https://whitemountains.pictures").pathname;
  if (pathname.endsWith("/")) return join(root, pathname.slice(1), "index.html");
  return join(root, pathname.slice(1));
}

const files = await walk(root);
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const photoFiles = htmlFiles.filter((file) => /[\\/]photos[\\/](2025|2026)[\\/][^\\/]+[\\/]index\.html$/.test(file));
const report = JSON.parse(await readFile(join(root, "build-report.json"), "utf8"));
const home = await readFile(join(root, "index.html"), "utf8");
const stylesheet = await readFile(join(root, report.assets.css), "utf8");
const clientScript = await readFile(join(root, report.assets.js), "utf8");
const catalog = JSON.parse(await readFile(join(root, "data", report.assets.catalog), "utf8"));
const archive = await readFile(join(root, "photos", "index.html"), "utf8");
const about = await readFile(join(root, "about", "nathan-sobol", "index.html"), "utf8");
const licensing = await readFile(join(root, "licensing", "index.html"), "utf8");
const metadataPolicy = await readFile(join(root, "about", "photo-metadata", "index.html"), "utf8");
const notFound = await readFile(join(root, "404.html"), "utf8");
const samplePhoto = await readFile(photoFiles[0], "utf8");

assert(report.totalPhotos === 356, `Expected 356 photos; found ${report.totalPhotos}`);
assert(report.locationCuration?.total === report.totalPhotos, "Location curation report does not cover every photo");
assert(catalog.length === report.totalPhotos, `Catalog contains ${catalog.length} photos; expected ${report.totalPhotos}`);
assert(catalog.every((photo) => photo.locationLabel && photo.meta && Array.isArray(photo.peakNames)), "Every catalog photo needs curated location and display metadata");
assert(!catalog.some((photo) => ["White Mountains New Hampshire", "White Mountains, New Hampshire"].includes(photo.locationLabel)), "Catalog retains a redundant uncurated White Mountains label");
assert(catalog.some((photo) => photo.locationLabel === "Franconia Ridge"), "Catalog has no generalized multi-peak ridge label");
assert(photoFiles.length === report.totalPhotos, `Expected ${report.totalPhotos} photo pages; found ${photoFiles.length}`);
assert(Buffer.byteLength(home) < 180_000, `Homepage HTML is ${Buffer.byteLength(home)} bytes; expected under 180 KB`);
assert(!home.includes('"extendedDescription"'), "Homepage embeds full archive metadata");
assert((home.match(/<img\b/g) ?? []).length <= 25, "Homepage contains more than 25 initial image elements");
assert((home.match(/loading="eager"/g) ?? []).length === 1, "Homepage should have exactly one eager image");
assert((home.match(/fetchpriority="high"/g) ?? []).length === 1, "Homepage should have exactly one high-priority image");
assert(/data-catalog-url="\/data\/photos\.[a-f0-9]{12}\.json"/.test(home), "Homepage catalog is not content-hashed and deferred");
assert(home.includes('class="mobile-nav"'), "Homepage has no mobile navigation");
assert(home.indexOf('class="hero-copy"') < home.indexOf("data-photo-wall"), "Hero copy must precede wall links");
assert(home.includes("data-featured-link"), "Featured photograph is not actionable");
assert(home.includes("data-featured-place"), "Homepage featured card has no curated location label hook");
assert(home.includes("data-featured-meta"), "Homepage featured card has no season/time/date metadata hook");
assert(home.includes("data-photo-credit"), "Homepage featured card has no visible copyright credit");
assert(home.includes("data-catalog-empty"), "Homepage has no empty state");
assert(home.includes("data-catalog-error"), "Homepage has no catalog error state");
assert(home.includes('aria-live="polite"'), "Homepage result count is not announced");
const featuredHref = home.match(/data-featured-link href="([^"]+)"/)?.[1];
const wallMarkup = home.match(/<div class="mosaic-field"[^>]*>([\s\S]*?)<\/div><\/div>/)?.[1] ?? "";
assert(Boolean(featuredHref) && !wallMarkup.includes(`href="${featuredHref}"`), "Homepage repeats the featured photo in the mosaic");
assert(/class="photo-tile[^>]*>[\s\S]*?<span aria-hidden="true"><strong>[^<]+<\/strong><small>[^<]+<\/small><\/span>/.test(wallMarkup), "Homepage mosaic tiles do not show both place and concise title");
assert(archive.includes("data-archive-filters"), "Archive has no filters");
assert(archive.includes("data-archive-search"), "Archive has no search field");
assert(archive.includes("data-archive-card"), "Archive cards lack progressive-enhancement hooks");
assert(archive.includes("data-archive-empty"), "Archive has no empty state");
assert(archive.includes("data-archive-load-more"), "Archive has no progressive reveal control");
assert(archive.includes('aria-live="polite"'), "Archive result count is not announced");
assert(archive.includes("data-archive-heading"), "Archive heading cannot reflect filtered results");
assert(archive.includes("data-archive-announcement"), "Archive has no separate debounced result announcement");
assert(!archive.includes('<option value="Fall">Fall</option>'), "Archive exposes duplicate Fall and Autumn options");
assert(archive.includes('<option value="Autumn">Autumn</option>'), "Archive has no canonical Autumn option");
assert(/class="photo-card is-(landscape|portrait)"[^>]*aria-label="[^"]+"/.test(archive), "Archive cards lack orientation classes or concise accessible names");
assert(/class="photo-card[^>]*>[\s\S]*?<h3>/.test(archive), "Archive card headings must be H3 beneath the archive H2");
assert(!archive.includes('class="badge-row" aria-hidden="true"'), "Archive review status is hidden from assistive technology");
assert(archive.includes("<ol>"), "Archive breadcrumbs do not use ordered-list semantics");

assert(about.includes('href="/about/nathan-sobol/" aria-current="page"'), "About navigation has no current state");
assert(metadataPolicy.includes('href="/about/nathan-sobol/" aria-current="page"'), "Metadata policy does not identify About as its navigation parent");
assert(licensing.includes('href="/licensing/" aria-current="page"'), "Licensing navigation has no current state");
assert(licensing.includes("mailto:natesobol@gmail.com"), "Licensing has no direct contact action");
assert(licensing.includes("data-license-link"), "Licensing contact cannot receive photo context");
assert(samplePhoto.includes(" 640w") && samplePhoto.includes(" 2400w"), "Photo srcset descriptors are incorrect");
assert(samplePhoto.includes("/licensing/?photo="), "Photo licensing CTA does not preserve photo context");
assert(samplePhoto.includes("Location label") && samplePhoto.includes("Peak range"), "Photo pages do not expose curated location context");
assert(samplePhoto.includes('href="/photos/" aria-current="page"'), "Photo pages do not identify the Archive section");
assert(notFound.includes('class="button button-primary"') && notFound.includes("Browse the photo archive"), "404 page has no primary archive recovery action");
assert(notFound.includes('class="footer-nav"'), "Shared footer is not a navigation landmark");

assert(stylesheet.includes("--content-width: 1180px"), "Stylesheet has no shared content-width token");
assert(stylesheet.includes("--space-7: 72px"), "Stylesheet has no shared spacing scale");
assert(/\.page-hero\s*\{[^}]*margin:\s*0/s.test(stylesheet), "Photo figure margin is not reset");
assert(stylesheet.includes(".mobile-nav"), "Stylesheet has no mobile navigation treatment");
assert(/\[hidden\]\s*\{[^}]*display:\s*none\s*!important/s.test(stylesheet), "Stylesheet allows component display rules to override the hidden attribute");
assert(stylesheet.includes("[data-archive-card][hidden]"), "Stylesheet does not honor enhanced archive visibility");
assert(stylesheet.includes("content-visibility: auto"), "Archive cards do not defer offscreen rendering");
assert(stylesheet.includes("--shadow-card:"), "Stylesheet has no card elevation token");
assert(stylesheet.includes("--text-body:"), "Stylesheet has no intentional body-text token");
assert(stylesheet.includes("--hero-rhythm:") && stylesheet.includes("--section-gap:") && stylesheet.includes("--related-gap:"), "Stylesheet is missing component rhythm tokens");
assert(!/min-width:\s*320px/.test(stylesheet), "Stylesheet reintroduces the 320px minimum-width overflow defect");
assert(!/border-radius:\s*(?:6|8|10)px/.test(stylesheet), "Stylesheet bypasses the shared radius tiers");
assert(/\.site-header\s*\{[^}]*width:\s*100%/s.test(stylesheet), "Shared header does not consume its available content width");
assert(/\.content-shell, \.intro-band, \.catalog-section, \.site-footer\s*\{[^}]*width:\s*100%/s.test(stylesheet), "Shared footer/content shell widths are inconsistent");
assert(/@media\s*\(max-width:\s*359px\)/.test(stylesheet), "Archive controls have no safe below-350px fallback");
assert(/\.breadcrumbs a\s*\{[^}]*min-height:\s*44px/s.test(stylesheet), "Breadcrumb targets are smaller than the shared control target");
assert(/\.site-footer a\s*\{[^}]*min-height:\s*44px/s.test(stylesheet), "Footer targets are smaller than the shared control target");
assert(/\.photo-card img\s*\{[^}]*aspect-ratio:/s.test(stylesheet) && /\.photo-card\.is-portrait img\s*\{[^}]*aspect-ratio:/s.test(stylesheet), "Archive image cards lack orientation-aware aspect ratios");
assert(/@media\s*\(min-width:\s*821px\)\s*and\s*\(max-width:\s*1120px\)/.test(stylesheet), "Hero has no protected intermediate breakpoint");
assert(clientScript.includes(report.uiAssets.catalogCore), "Client does not import the generated catalog-core asset");
assert(clientScript.includes('window.addEventListener("popstate"'), "Client does not restore filter history state");
assert(clientScript.includes("featured.link.hidden = visible.length === 0"), "Home filtering can leave a stale featured photograph visible");
assert(clientScript.includes("archiveSummary"), "Client controllers do not share the result-copy contract");
assert(clientScript.includes("data-archive-announcement"), "Client does not update the debounced result announcement");
assert(clientScript.includes("data-mobile-nav"), "Client does not enhance the mobile navigation disclosure");
assert(clientScript.includes("data-featured-meta"), "Client does not update the featured photo metadata line");
assert(clientScript.includes('event.key!=="Escape"') || clientScript.includes('event.key !== "Escape"'), "Mobile navigation cannot close with Escape");
assert(clientScript.includes('document.addEventListener("pointerdown"'), "Mobile navigation does not close on outside interaction");

assert(report.captureYearMismatchRecords === 1, `Expected one capture-year mismatch warning; found ${report.captureYearMismatchRecords}`);

const sitemap = await readFile(join(root, "sitemaps", "photos.xml"), "utf8");
const sitemapPages = new Set([...sitemap.matchAll(/<loc>(https:\/\/whitemountains\.pictures\/photos\/[^<]+)<\/loc>/g)].map((match) => match[1]));
assert(sitemapPages.size === report.approvedPhotos, `Photo sitemap contains ${sitemapPages.size} page URLs; expected ${report.approvedPhotos}`);
assert((sitemap.match(/<image:image>/g) ?? []).length === report.approvedPhotos, "Every indexed photo needs an image sitemap entry");

let approvedPages = 0;
let collectionLinkedPages = 0;
let lengthClassPages = 0;
let captureYearMismatchPages = 0;
for (const file of photoFiles) {
  const html = await readFile(file, "utf8");
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const noindex = /<meta name="robots" content="noindex,follow,max-image-preview:large">/.test(html);
  assert(Boolean(canonical), `${file} has no canonical URL`);
  assert(html.includes('"@type":"ImageObject"'), `${file} has no ImageObject schema`);
  assert(html.includes('"@type":"BreadcrumbList"'), `${file} has no BreadcrumbList schema`);
  assert(html.includes('"acquireLicensePage"'), `${file} has no acquireLicensePage`);
  assert(html.includes("Photo metadata"), `${file} has no visible metadata panel`);
  assert(!/(sourcePath|LensSerialNumber|SerialNumber|gpsLatitude|gpsLongitude)/.test(html), `${file} leaks a sensitive metadata field`);
  assert(!/https:\/\/whitemountains\.pictures\/photos\/(2025|2026)\/originals\//.test(html), `${file} uses the legacy original-image origin`);
  if (html.includes('href="/collections/')) collectionLinkedPages += 1;
  if (/class="page-title is-(long|very-long)"/.test(html)) lengthClassPages += 1;
  if (html.includes("Capture date does not match the 2025 archive year and is not published.")) {
    captureYearMismatchPages += 1;
    assert(html.includes("<dt>Captured</dt><dd>Date not published</dd>"), `${file} exposes a contradictory capture date`);
    assert(!html.includes("July 8, 2026"), `${file} publishes the rejected cross-year date`);
  }
  if (!noindex) {
    approvedPages += 1;
    assert(sitemapPages.has(canonical), `${canonical} is indexable but absent from the photo sitemap`);
  } else {
    assert(!sitemapPages.has(canonical), `${canonical} is noindex but present in the photo sitemap`);
  }
}
assert(approvedPages === report.approvedPhotos, `Found ${approvedPages} indexable photo pages; expected ${report.approvedPhotos}`);
assert(collectionLinkedPages > 0, "Generated collection pages have no incoming photo links");
assert(lengthClassPages >= 37, `Expected at least 37 long-title pages; found ${lengthClassPages}`);
assert(captureYearMismatchPages === report.captureYearMismatchRecords, `Found ${captureYearMismatchPages} mismatch warnings; expected ${report.captureYearMismatchRecords}`);

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  for (const match of html.matchAll(/href="(\/[^"?#]*)/g)) {
    const href = match[1];
    if (!href || href.startsWith("/images/") || href.startsWith("/data/")) continue;
    try {
      await access(localPathForUrl(href));
    } catch {
      errors.push(`${file} links to missing local target ${href}`);
    }
  }
}

for (const name of ["sitemap.xml", "robots.txt", "_headers", "404.html"]) {
  assert(files.includes(join(root, name)), `Missing required ${name}`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "ok",
  htmlFiles: htmlFiles.length,
  photoPages: photoFiles.length,
  indexablePhotoPages: approvedPages,
  homepageBytes: Buffer.byteLength(home),
  homepageImages: (home.match(/<img\b/g) ?? []).length,
  sitemapPhotoUrls: sitemapPages.size,
}, null, 2));
