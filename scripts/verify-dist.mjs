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

assert(report.totalPhotos === 356, `Expected 356 photos; found ${report.totalPhotos}`);
assert(photoFiles.length === report.totalPhotos, `Expected ${report.totalPhotos} photo pages; found ${photoFiles.length}`);
assert(Buffer.byteLength(home) < 180_000, `Homepage HTML is ${Buffer.byteLength(home)} bytes; expected under 180 KB`);
assert(!home.includes('"extendedDescription"'), "Homepage embeds full archive metadata");
assert((home.match(/<img\b/g) ?? []).length <= 25, "Homepage contains more than 25 initial image elements");
assert((home.match(/loading="eager"/g) ?? []).length === 1, "Homepage should have exactly one eager image");
assert((home.match(/fetchpriority="high"/g) ?? []).length === 1, "Homepage should have exactly one high-priority image");
assert(/data-catalog-url="\/data\/photos\.[a-f0-9]{12}\.json"/.test(home), "Homepage catalog is not content-hashed and deferred");

const sitemap = await readFile(join(root, "sitemaps", "photos.xml"), "utf8");
const sitemapPages = new Set([...sitemap.matchAll(/<loc>(https:\/\/whitemountains\.pictures\/photos\/[^<]+)<\/loc>/g)].map((match) => match[1]));
assert(sitemapPages.size === report.approvedPhotos, `Photo sitemap contains ${sitemapPages.size} page URLs; expected ${report.approvedPhotos}`);
assert((sitemap.match(/<image:image>/g) ?? []).length === report.approvedPhotos, "Every indexed photo needs an image sitemap entry");

let approvedPages = 0;
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
  if (!noindex) {
    approvedPages += 1;
    assert(sitemapPages.has(canonical), `${canonical} is indexable but absent from the photo sitemap`);
  } else {
    assert(!sitemapPages.has(canonical), `${canonical} is noindex but present in the photo sitemap`);
  }
}
assert(approvedPages === report.approvedPhotos, `Found ${approvedPages} indexable photo pages; expected ${report.approvedPhotos}`);

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
