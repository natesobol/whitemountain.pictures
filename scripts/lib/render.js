import path from "node:path";
import { readFile } from "node:fs/promises";
import { renderHead } from "../../components/head.js";
import { renderNavbar } from "../../components/navbar.js";
import { renderFooter } from "../../components/footer.js";
import { renderHero } from "../../components/hero.js";
import { renderCollectionCard } from "../../components/collection-card.js";
import { renderGalleryGrid } from "../../components/gallery-grid.js";
import { renderFilters } from "../../components/filters.js";
import { renderBreadcrumbs } from "../../components/breadcrumbs.js";
import { buildCollectionSchema, buildGallerySchema, buildPhotoSchema, buildWebSiteSchema, createSeo } from "../../components/seo.js";
import { absoluteUrl, escapeAttribute, escapeHtml, formatDate, humanize, pluralize, toSentence } from "../../components/utils.js";
import { getRelatedCollections, getRelatedPhotos } from "./data.js";

const TEMPLATE_FILES = {
  layout: "templates/layout.html",
  home: "templates/home.html",
  gallery: "templates/gallery.html",
  collectionsIndex: "templates/collections-index.html",
  collectionDetail: "templates/collection-detail.html",
  photoDetail: "templates/photo-detail.html",
  featured: "templates/featured.html",
  about: "templates/about.html",
  notFound: "templates/404.html"
};

function renderTemplate(template, variables) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => variables[key] ?? "");
}

function renderMetricCard(label, value, copy) {
  return `
    <article class="metric-card panel panel--soft">
      <span class="metric-card__value">${escapeHtml(value)}</span>
      <h3>${escapeHtml(label)}</h3>
      <p>${escapeHtml(copy)}</p>
    </article>
  `;
}

function renderHeroPhotoStack(photos) {
  return `
    <div class="hero-stack">
      ${photos
        .map((photo) => `
          <a class="hero-card" href="${escapeAttribute(photo.url)}">
            <img src="${escapeAttribute(photo.thumbUrl)}" alt="${escapeAttribute(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="eager" />
            <span>${escapeHtml(photo.title)}</span>
          </a>
        `)
        .join("")}
    </div>
  `;
}

function renderCtaBand() {
  return `
    <div class="cta-band panel panel--soft">
      <div>
        <p class="eyebrow">Ready for real assets later</p>
        <h2>The routes, metadata, and placeholders are already in place.</h2>
        <p>Swap in real image URLs inside the JSON manifests and rebuild. Collection pages, photo detail pages, search index scaffolding, and sitemaps update from the same content model.</p>
      </div>
      <div class="hero__actions">
        <a class="button button--primary" href="/about">Read the project notes</a>
        <a class="button button--ghost" href="/featured">See the featured set</a>
      </div>
    </div>
  `;
}

function renderCollectionMeta(collection) {
  return `
    <article class="meta-card panel panel--soft">
      <h3>Season hints</h3>
      <p>${escapeHtml(toSentence(collection.seasonHints))}</p>
    </article>
    <article class="meta-card panel panel--soft">
      <h3>Location hints</h3>
      <p>${escapeHtml(toSentence(collection.locationHints))}</p>
    </article>
    <article class="meta-card panel panel--soft">
      <h3>Status & tags</h3>
      <p>${escapeHtml(humanize(collection.status))}</p>
      <div class="pill-list">
        ${collection.tags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}
      </div>
    </article>
  `;
}

function renderPhotoMeta(photo) {
  return `
    <p class="eyebrow">Photo detail</p>
    <h1>${escapeHtml(photo.title)}</h1>
    <p class="photo-meta__lede">${escapeHtml(photo.description)}</p>
    <div class="pill-list">
      ${photo.collections.map((collection) => `<a class="pill pill--link" href="${escapeAttribute(collection.url)}">${escapeHtml(collection.title)}</a>`).join("")}
    </div>
    <dl class="meta-list">
      <div><dt>Captured</dt><dd>${escapeHtml(formatDate(photo.capturedAt))}</dd></div>
      <div><dt>Location</dt><dd>${escapeHtml(photo.locationName)}</dd></div>
      <div><dt>Mountain</dt><dd>${escapeHtml(photo.mountain)}</dd></div>
      <div><dt>Region</dt><dd>${escapeHtml(photo.region)}</dd></div>
      <div><dt>Season</dt><dd>${escapeHtml(photo.season)}</dd></div>
      <div><dt>Camera</dt><dd>${escapeHtml(photo.camera)}</dd></div>
      <div><dt>Lens</dt><dd>${escapeHtml(photo.lens)}</dd></div>
      <div><dt>Format</dt><dd>${escapeHtml(`${humanize(photo.orientation)} · ${photo.width}×${photo.height}`)}</dd></div>
    </dl>
    <div class="pill-list">
      ${photo.tags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}
    </div>
    <div class="note-box">
      Placeholder asset record. Real images can replace the local placeholder URLs without changing the route model or metadata layout.
    </div>
  `;
}

function renderPhotoStage(photo) {
  return `
    <img
      class="photo-stage__image"
      src="${escapeAttribute(photo.imageUrl)}"
      alt="${escapeAttribute(photo.alt)}"
      width="${photo.width}"
      height="${photo.height}"
      loading="eager"
      decoding="async"
    />
    <figcaption class="photo-stage__caption">
      <strong>${escapeHtml(photo.title)}</strong>
      <span>${escapeHtml(photo.alt)}</span>
    </figcaption>
  `;
}

function renderAboutPanels(context) {
  return `
    <article class="panel panel--soft">
      <p class="eyebrow">Why this site exists</p>
      <h2>A photo-only sibling for the NH48 ecosystem</h2>
      <p>This project separates the gallery experience from the peak-guide and open-data surfaces. It keeps the NH48 shell language intact while letting collections, featured sets, and image detail pages carry the primary navigation weight.</p>
    </article>
    <article class="panel panel--soft">
      <p class="eyebrow">How it renders</p>
      <h2>Prerendered HTML first, light JavaScript second</h2>
      <p>Every important page in this build is written as standalone HTML during the build. Client-side JavaScript only enhances filters, theme toggling, and mobile navigation; it does not create the primary page content.</p>
    </article>
    <article class="panel panel--soft">
      <p class="eyebrow">What changes later</p>
      <h2>Swap the mock image manifest for real photography</h2>
      <p>Replace placeholder URLs and metadata in <code>data/photos.json</code> and collection cover images in <code>data/collections.json</code>. The same build scripts then regenerate pages, search index scaffolding, robots, and both sitemaps.</p>
      <p class="panel__kicker">${escapeHtml(pluralize(context.photos.length, "placeholder photo"))} are already routed and explorable.</p>
    </article>
  `;
}

function wrapLayout({ templates, context, currentPath, bodyHtml, seo, bodyClass = "", mainClass = "", scripts = "" }) {
  return renderTemplate(templates.layout, {
    themeMode: context.site.theme.defaultMode,
    head: renderHead({ site: context.site, seo }),
    bodyClass,
    mainClass,
    navbar: renderNavbar({
      site: context.site,
      navigation: context.navigation,
      collections: context.collections,
      currentPath
    }),
    main: bodyHtml,
    footer: renderFooter({
      site: context.site,
      navigation: context.navigation,
      collections: context.collections
    }),
    scripts
  });
}

function renderHome(route, context, templates) {
  const hero = renderHero({
    eyebrow: context.site.hero.eyebrow,
    title: context.site.hero.title,
    description: context.site.hero.description,
    actions: [
      { label: context.site.hero.primaryCtaLabel, href: context.site.hero.primaryCtaHref, className: "button button--primary" },
      { label: context.site.hero.secondaryCtaLabel, href: context.site.hero.secondaryCtaHref, className: "button button--ghost" }
    ],
    meta: [
      { label: "Collections", value: String(context.stats.collectionCount) },
      { label: "Photo records", value: String(context.stats.photoCount) },
      { label: "Featured frames", value: String(context.stats.featuredPhotoCount) }
    ],
    mediaHtml: renderHeroPhotoStack(context.featuredPhotos.slice(0, 3)),
    className: "hero--home"
  });

  const body = renderTemplate(templates.home, {
    hero,
    introCards: [
      renderMetricCard("Cloudflare-first build", "Worker + assets", "Wrangler serves prerendered HTML through a Worker that handles canonical host concerns and cache-safe headers."),
      renderMetricCard("Gallery-first routing", "Real routes", "Home, gallery, collections, featured sets, and individual photo pages are all emitted as standalone routes."),
      renderMetricCard("Placeholder-ready content", `${context.stats.photoCount} images`, "Mock White Mountains records already power grids, collections, metadata, structured data, and sitemap entries.")
    ].join(""),
    featuredCollections: context.featuredCollections.slice(0, 4).map((collection) => renderCollectionCard(collection)).join(""),
    featuredPhotos: renderGalleryGrid(context.featuredPhotos.slice(0, 8), { className: "photo-grid--feature" }),
    ctaBand: renderCtaBand()
  });

  const seo = createSeo({
    site: context.site,
    path: route.path,
    title: context.site.defaultTitle,
    description: context.site.defaultDescription,
    schemas: [buildWebSiteSchema(context.site)]
  });

  return wrapLayout({
    templates,
    context,
    currentPath: route.path,
    bodyHtml: body,
    seo,
    bodyClass: "page page--home"
  });
}

function renderGallery(route, context, templates) {
  const hero = renderHero({
    eyebrow: "Gallery landing",
    title: "All placeholder photos in one source-visible gallery",
    description: "The full mock archive is rendered into HTML now, with client-side enhancement layered on for search, filters, sorting, and load-more behavior.",
    actions: [
      { label: "Browse collections", href: "/collections", className: "button button--ghost" }
    ],
    meta: [
      { label: "Photos", value: String(context.photos.length) },
      { label: "Regions", value: String(context.filterOptions.regions.length) },
      { label: "Collections", value: String(context.collections.length) }
    ],
    compact: true
  });

  const body = renderTemplate(templates.gallery, {
    hero,
    filters: renderFilters({ options: context.filterOptions, collections: context.collections }),
    galleryGrid: renderGalleryGrid(context.photos, { interactive: true, pageSize: 18 })
  });

  const seo = createSeo({
    site: context.site,
    path: route.path,
    title: "Gallery",
    description: "Browse every placeholder photo record across collections, seasons, regions, and formats on White Mountains Pictures.",
    schemas: [
      buildGallerySchema(context.site, {
        title: "White Mountains Pictures gallery",
        description: "All placeholder photo records for the White Mountains Pictures build.",
        path: route.path,
        photos: context.photos
      })
    ]
  });

  return wrapLayout({
    templates,
    context,
    currentPath: route.path,
    bodyHtml: body,
    seo,
    bodyClass: "page page--gallery"
  });
}

function renderCollectionsIndex(route, context, templates) {
  const hero = renderHero({
    eyebrow: "Collections",
    title: "Curated sets instead of one endless feed",
    description: "Each collection groups the placeholder archive by subject and atmosphere, while keeping the same shell and metadata discipline as the rest of the site.",
    actions: [
      { label: "Open the gallery", href: "/gallery", className: "button button--ghost" }
    ],
    meta: [
      { label: "Collections", value: String(context.collections.length) },
      { label: "Featured", value: String(context.featuredCollections.length) },
      { label: "Placeholder photos", value: String(context.photos.length) }
    ],
    compact: true
  });

  const body = renderTemplate(templates.collectionsIndex, {
    hero,
    collectionCards: context.collections.map((collection) => renderCollectionCard(collection)).join("")
  });

  const seo = createSeo({
    site: context.site,
    path: route.path,
    title: "Collections",
    description: "Browse White Mountains photography collections for ridgelines, forest detail, waterfalls, sunrise light, and trail texture.",
    schemas: [
      buildGallerySchema(context.site, {
        title: "White Mountains collection index",
        description: "All collections on White Mountains Pictures.",
        path: route.path,
        photos: context.featuredPhotos
      })
    ]
  });

  return wrapLayout({
    templates,
    context,
    currentPath: route.path,
    bodyHtml: body,
    seo,
    bodyClass: "page page--collections"
  });
}

function renderCollectionPage(route, context, templates) {
  const collection = route.collection;
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Collections", href: "/collections" },
    { label: collection.title, href: collection.url }
  ];

  const hero = renderHero({
    eyebrow: "Collection detail",
    title: collection.title,
    description: collection.description,
    actions: [
      { label: "All collections", href: "/collections", className: "button button--ghost" },
      { label: "Open gallery", href: "/gallery", className: "button button--primary" }
    ],
    meta: [
      { label: "Photos", value: String(collection.photos.length) },
      { label: "Season hints", value: collection.seasonHints.join(" / ") },
      { label: "Status", value: humanize(collection.status) }
    ],
    mediaHtml: `
      <div class="hero-image-card">
        <img src="${escapeAttribute(collection.coverImage)}" alt="${escapeAttribute(collection.title)} cover" width="1600" height="1067" loading="eager" />
      </div>
    `,
    compact: true
  });

  const body = renderTemplate(templates.collectionDetail, {
    breadcrumbs: renderBreadcrumbs(breadcrumbs),
    hero,
    collectionMeta: renderCollectionMeta(collection),
    collectionHeading: escapeHtml(`${collection.title} photo set`),
    collectionLead: escapeHtml(collection.subtitle),
    galleryGrid: renderGalleryGrid(collection.photos),
    relatedCollections: getRelatedCollections(context, collection).map((item) => renderCollectionCard(item, { compact: true })).join("")
  });

  const seo = createSeo({
    site: context.site,
    path: collection.url,
    title: collection.title,
    description: collection.description,
    imagePath: collection.coverImage,
    breadcrumbs,
    schemas: [buildCollectionSchema(context.site, collection)]
  });

  return wrapLayout({
    templates,
    context,
    currentPath: collection.url,
    bodyHtml: body,
    seo,
    bodyClass: "page page--collection"
  });
}

function renderPhotoPage(route, context, templates) {
  const photo = route.photo;
  const primaryCollection = photo.collections[0];
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Gallery", href: "/gallery" },
    primaryCollection ? { label: primaryCollection.title, href: primaryCollection.url } : null,
    { label: photo.title, href: photo.url }
  ].filter(Boolean);

  const body = renderTemplate(templates.photoDetail, {
    breadcrumbs: renderBreadcrumbs(breadcrumbs),
    photoStage: renderPhotoStage(photo),
    photoMeta: renderPhotoMeta(photo),
    relatedPhotos: renderGalleryGrid(getRelatedPhotos(context, photo), {
      className: "photo-grid--related",
      compactCards: true
    })
  });

  const seo = createSeo({
    site: context.site,
    path: photo.url,
    title: photo.title,
    description: photo.description,
    imagePath: photo.imageUrl,
    breadcrumbs,
    schemas: [buildPhotoSchema(context.site, photo)]
  });

  return wrapLayout({
    templates,
    context,
    currentPath: photo.url,
    bodyHtml: body,
    seo,
    bodyClass: "page page--photo"
  });
}

function renderFeatured(route, context, templates) {
  const hero = renderHero({
    eyebrow: "Featured",
    title: "A curated front door into the placeholder archive",
    description: "Featured collections and photo records give the site enough shape to explore before the real image library lands.",
    actions: [
      { label: "Open the full gallery", href: "/gallery", className: "button button--primary" }
    ],
    meta: [
      { label: "Featured collections", value: String(context.featuredCollections.length) },
      { label: "Featured photos", value: String(context.featuredPhotos.length) },
      { label: "Total archive", value: String(context.photos.length) }
    ],
    compact: true
  });

  const body = renderTemplate(templates.featured, {
    hero,
    featuredCollections: context.featuredCollections.map((collection) => renderCollectionCard(collection, { compact: true })).join(""),
    featuredPhotos: renderGalleryGrid(context.featuredPhotos, { className: "photo-grid--feature" })
  });

  const seo = createSeo({
    site: context.site,
    path: route.path,
    title: "Featured",
    description: "Curated White Mountains collections and image records highlighted in the first-pass White Mountains Pictures build.",
    schemas: [
      buildGallerySchema(context.site, {
        title: "Featured White Mountains photography",
        description: "Featured collections and photos on White Mountains Pictures.",
        path: route.path,
        photos: context.featuredPhotos
      })
    ]
  });

  return wrapLayout({
    templates,
    context,
    currentPath: route.path,
    bodyHtml: body,
    seo,
    bodyClass: "page page--featured"
  });
}

function renderAbout(route, context, templates) {
  const hero = renderHero({
    eyebrow: "About",
    title: "A first-pass photography site designed to match the NH48 family",
    description: "This repo establishes Cloudflare deployment structure, prerendered route generation, gallery-first data modeling, SEO infrastructure, and placeholder image handling before the final photo library is ready.",
    actions: [
      { label: "See the gallery", href: "/gallery", className: "button button--primary" },
      { label: "Inspect collections", href: "/collections", className: "button button--ghost" }
    ],
    compact: true
  });

  const body = renderTemplate(templates.about, {
    hero,
    aboutPanels: renderAboutPanels(context)
  });

  const seo = createSeo({
    site: context.site,
    path: route.path,
    title: "About",
    description: "Project notes for the White Mountains Pictures first-pass build, including architecture goals and how placeholder assets will be replaced later."
  });

  return wrapLayout({
    templates,
    context,
    currentPath: route.path,
    bodyHtml: body,
    seo,
    bodyClass: "page page--about"
  });
}

function renderNotFound(route, context, templates) {
  const body = templates.notFound;
  const seo = createSeo({
    site: context.site,
    path: route.path,
    title: "404",
    description: "Page not found on White Mountains Pictures.",
    noindex: true
  });

  return wrapLayout({
    templates,
    context,
    currentPath: route.path,
    bodyHtml: body,
    seo,
    bodyClass: "page page--404"
  });
}

export async function loadTemplates(rootDir) {
  const entries = await Promise.all(
    Object.entries(TEMPLATE_FILES).map(async ([key, relativePath]) => {
      const template = await readFile(path.join(rootDir, relativePath), "utf8");
      return [key, template];
    })
  );

  return Object.fromEntries(entries);
}

export function renderRoute(route, context, templates) {
  switch (route.type) {
    case "home":
      return renderHome(route, context, templates);
    case "gallery":
      return renderGallery(route, context, templates);
    case "collections":
      return renderCollectionsIndex(route, context, templates);
    case "collection":
      return renderCollectionPage(route, context, templates);
    case "photo":
      return renderPhotoPage(route, context, templates);
    case "featured":
      return renderFeatured(route, context, templates);
    case "about":
      return renderAbout(route, context, templates);
    case "404":
      return renderNotFound(route, context, templates);
    default:
      throw new Error(`Unknown route type: ${route.type}`);
  }
}

export function renderPlaceholderSvg(photo) {
  const palettes = {
    Winter: ["#10243b", "#7fb3d5", "#e7f1ff"],
    Spring: ["#143f32", "#2f855a", "#d8f3dc"],
    Summer: ["#173f52", "#4f9d69", "#d9f99d"],
    Autumn: ["#3f1f18", "#c97137", "#f8d49b"]
  };

  const [deep, mid, light] = palettes[photo.season] || palettes.Autumn;
  const width = photo.width;
  const height = photo.height;
  const horizon = Math.round(height * 0.66);
  const titleY = Math.round(height * 0.16);
  const metaY = titleY + 54;

  const lineOne = escapeHtml(photo.title);
  const lineTwo = escapeHtml(`${photo.locationName} · ${photo.region}`);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${deep}" />
          <stop offset="55%" stop-color="${mid}" />
          <stop offset="100%" stop-color="${light}" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)" />
      <circle cx="${Math.round(width * 0.82)}" cy="${Math.round(height * 0.22)}" r="${Math.round(Math.min(width, height) * 0.09)}" fill="#f59e0b" opacity="0.6" />
      <path d="M0 ${horizon} ${Math.round(width * 0.14)} ${Math.round(height * 0.52)} ${Math.round(width * 0.26)} ${Math.round(height * 0.63)} ${Math.round(width * 0.38)} ${Math.round(height * 0.4)} ${Math.round(width * 0.56)} ${Math.round(height * 0.66)} ${Math.round(width * 0.74)} ${Math.round(height * 0.44)} ${width} ${horizon} V${height} H0 Z" fill="#0c1523" opacity="0.95" />
      <path d="M0 ${horizon + 26} ${Math.round(width * 0.18)} ${Math.round(height * 0.6)} ${Math.round(width * 0.34)} ${Math.round(height * 0.75)} ${Math.round(width * 0.48)} ${Math.round(height * 0.58)} ${Math.round(width * 0.64)} ${Math.round(height * 0.78)} ${Math.round(width * 0.82)} ${Math.round(height * 0.61)} ${width} ${horizon + 18} V${height} H0 Z" fill="#0f1d31" opacity="0.94" />
      <path d="M${Math.round(width * 0.05)} ${horizon + 10} H${Math.round(width * 0.95)}" stroke="#22c55e" stroke-width="${Math.max(5, Math.round(width * 0.0045))}" stroke-linecap="round" />
      <text x="${Math.round(width * 0.06)}" y="${titleY}" fill="#ffffff" font-family="Noto Sans, Segoe UI, sans-serif" font-size="${Math.max(24, Math.round(width * 0.038))}" font-weight="800">${lineOne}</text>
      <text x="${Math.round(width * 0.06)}" y="${metaY}" fill="#e2e8f0" font-family="Noto Sans, Segoe UI, sans-serif" font-size="${Math.max(16, Math.round(width * 0.018))}" font-weight="600">${lineTwo}</text>
      <text x="${Math.round(width * 0.06)}" y="${height - 34}" fill="#bbf7d0" font-family="Noto Sans, Segoe UI, sans-serif" font-size="${Math.max(14, Math.round(width * 0.013))}" font-weight="700" letter-spacing="1.4">WHITE MOUNTAINS PICTURES</text>
    </svg>
  `.trim();
}
