import { escapeAttribute, escapeHtml } from "./utils.js";

const STYLESHEETS = [
  "/styles/tokens.css",
  "/styles/base.css",
  "/styles/layout.css",
  "/styles/components.css",
  "/styles/gallery.css"
];

export function renderHead({ site, seo }) {
  const schemaMarkup = seo.schemas
    .map((schema) => JSON.stringify(schema).replaceAll("<", "\\u003c"))
    .map((json) => `<script type="application/ld+json">${json}</script>`)
    .join("\n");

  return `
    <title>${escapeHtml(seo.title)}</title>
    <meta name="description" content="${escapeAttribute(seo.description)}" />
    <meta name="robots" content="${escapeAttribute(seo.robots)}" />
    <meta name="theme-color" content="${escapeAttribute(site.theme.surfaceDark)}" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="canonical" href="${escapeAttribute(seo.canonical)}" />
    <link rel="sitemap" type="application/xml" title="Page sitemap" href="${escapeAttribute(`https://${site.canonicalHost}/page-sitemap.xml`)}" />
    <meta property="og:site_name" content="${escapeAttribute(site.siteName)}" />
    <meta property="og:type" content="${escapeAttribute(seo.type)}" />
    <meta property="og:title" content="${escapeAttribute(seo.title)}" />
    <meta property="og:description" content="${escapeAttribute(seo.description)}" />
    <meta property="og:url" content="${escapeAttribute(seo.canonical)}" />
    <meta property="og:image" content="${escapeAttribute(seo.image)}" />
    <meta property="og:image:alt" content="${escapeAttribute(seo.imageAlt)}" />
    <meta property="og:locale" content="${escapeAttribute(site.locale)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(seo.title)}" />
    <meta name="twitter:description" content="${escapeAttribute(seo.description)}" />
    <meta name="twitter:image" content="${escapeAttribute(seo.image)}" />
    <meta name="twitter:image:alt" content="${escapeAttribute(seo.imageAlt)}" />
    ${STYLESHEETS.map((href) => `<link rel="stylesheet" href="${href}" />`).join("\n")}
    ${schemaMarkup}
  `;
}

