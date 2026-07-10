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
const archive = await readFile(join(root, "photos", "index.html"), "utf8");
const about = await readFile(join(root, "about", "nathan-sobol", "index.html"), "utf8");
const licensing = await readFile(join(root, "licensing", "index.html"), "utf8");
const samplePhoto = await readFile(photoFiles[0], "utf8");

assert(report.totalPhotos === 356, `Expected 356 photos; found ${report.totalPhotos}`);
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
assert(home.includes("data-catalog-empty"), "Homepage has no empty state");
assert(home.includes("data-catalog-error"), "Homepage has no catalog error state");
assert(home.includes('aria-live="polite"'), "Homepage result count is not announced");
assert(archive.includes("data-archive-filters"), "Archive has no filters");
assert(archive.includes("data-archive-search"), "Archive has no search field");
assert(archive.includes("data-archive-card"), "Archive cards lack progressive-enhancement hooks");
assert(archive.includes("data-archive-empty"), "Archive has no empty state");
assert(archive.includes("data-archive-load-more"), "Archive has no progressive reveal control");
assert(archive.includes('aria-live="polite"'), "Archive result count is not announced");
assert(archive.includes("<ol>"), "Archive breadcrumbs do not use ordered-list semantics");

assert(about.includes('href="/about/nathan-sobol/" aria-current="page"'), "About navigation has no current state");
assert(licensing.includes('href="/licensing/" aria-current="page"'), "Licensing navigation has no current state");
assert(licensing.includes("mailto:natesobol@gmail.com"), "Licensing has no direct contact action");
assert(licensing.includes("data-license-link"), "Licensing contact cannot receive photo context");
assert(samplePhoto.includes(" 640w") && samplePhoto.includes(" 2400w"), "Photo srcset descriptors are incorrect");
assert(samplePhoto.includes("/licensing/?photo="), "Photo licensing CTA does not preserve photo context");
assert(samplePhoto.includes('href="/photos/" aria-current="page"'), "Photo pages do not identify the Archive section");

assert(stylesheet.includes("--content-width: 1180px"), "Stylesheet has no shared content-width token");
assert(stylesheet.includes("--space-7: 72px"), "Stylesheet has no shared spacing scale");
assert(/\.page-hero\s*\{[^}]*margin:\s*0/s.test(stylesheet), "Photo figure margin is not reset");
assert(stylesheet.includes(".mobile-nav"), "Stylesheet has no mobile navigation treatment");
assert(stylesheet.includes("[data-archive-card][hidden]"), "Stylesheet does not honor enhanced archive visibility");
assert(stylesheet.includes("content-visibility: auto"), "Archive cards do not defer offscreen rendering");
assert(/@media\s*\(min-width:\s*821px\)\s*and\s*\(max-width:\s*1120px\)/.test(stylesheet), "Hero has no protected intermediate breakpoint");

const sitemap = await readFile(join(root, "sitemaps", "photos.xml"), "utf8");
const sitemapPages = new Set([...sitemap.matchAll(/<loc>(https:\/\/whitemountains\.pictures\/photos\/[^<]+)<\/loc>/g)].map((match) => match[1]));
assert(sitemapPages.size === report.approvedPhotos, `Photo sitemap contains ${sitemapPages.size} page URLs; expected ${report.approvedPhotos}`);
assert((sitemap.match(/<image:image>/g) ?? []).length === report.approvedPhotos, "Every indexed photo needs an image sitemap entry");

let approvedPages = 0;
let collectionLinkedPages = 0;
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
  if (!noindex) {
    approvedPages += 1;
    assert(sitemapPages.has(canonical), `${canonical} is indexable but absent from the photo sitemap`);
  } else {
    assert(!sitemapPages.has(canonical), `${canonical} is noindex but present in the photo sitemap`);
  }
}
assert(approvedPages === report.approvedPhotos, `Found ${approvedPages} indexable photo pages; expected ${report.approvedPhotos}`);
assert(collectionLinkedPages > 0, "Generated collection pages have no incoming photo links");

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
