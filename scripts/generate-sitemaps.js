import path from "node:path";
import { buildRouteRecords, loadSiteContext } from "./lib/data.js";
import { ROOT_DIR, DIST_DIR, writeTextFile } from "./lib/fs.js";
import { absoluteUrl, escapeHtml } from "../components/utils.js";

const context = await loadSiteContext(ROOT_DIR);
const routes = buildRouteRecords(context).filter((route) => route.indexable);
const generatedDate = new Date().toISOString().slice(0, 10);

function wrapUrlSet(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}

const pageEntries = routes.map((route) => `
  <url>
    <loc>${absoluteUrl(context.site, route.path)}</loc>
    <lastmod>${generatedDate}</lastmod>
  </url>
`.trim());

const imageEntries = context.photos.map((photo) => `
  <url>
    <loc>${absoluteUrl(context.site, photo.url)}</loc>
    <image:image xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
      <image:loc>${absoluteUrl(context.site, photo.imageUrl)}</image:loc>
      <image:title>${escapeHtml(photo.title)}</image:title>
      <image:caption>${escapeHtml(photo.description)}</image:caption>
    </image:image>
    <lastmod>${generatedDate}</lastmod>
  </url>
`.trim());

const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap>\n    <loc>${absoluteUrl(context.site, "/page-sitemap.xml")}</loc>\n    <lastmod>${generatedDate}</lastmod>\n  </sitemap>\n  <sitemap>\n    <loc>${absoluteUrl(context.site, "/image-sitemap.xml")}</loc>\n    <lastmod>${generatedDate}</lastmod>\n  </sitemap>\n</sitemapindex>\n`;

const robots = `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl(context.site, "/sitemap.xml")}\nSitemap: ${absoluteUrl(context.site, "/page-sitemap.xml")}\nSitemap: ${absoluteUrl(context.site, "/image-sitemap.xml")}\n`;

await writeTextFile(path.join(DIST_DIR, "page-sitemap.xml"), wrapUrlSet(pageEntries));
await writeTextFile(path.join(DIST_DIR, "image-sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${imageEntries.join("\n")}\n</urlset>\n`);
await writeTextFile(path.join(DIST_DIR, "sitemap.xml"), sitemapIndex);
await writeTextFile(path.join(DIST_DIR, "robots.txt"), robots);

console.log(`Generated sitemap index, page sitemap, image sitemap, and robots.txt in ${DIST_DIR}.`);
