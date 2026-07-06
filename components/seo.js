import { absoluteUrl, truncate } from "./utils.js";

export function buildBreadcrumbSchema(site, items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": absoluteUrl(site, item.href || "/")
    }))
  };
}

export function buildWebSiteSchema(site) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": site.siteName,
    "url": absoluteUrl(site, "/"),
    "description": site.defaultDescription,
    "publisher": {
      "@type": "Person",
      "name": site.author
    }
  };
}

export function buildGallerySchema(site, { title, description, path, photos }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": title,
    "description": description,
    "url": absoluteUrl(site, path),
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": photos.slice(0, 24).map((photo, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": absoluteUrl(site, photo.url),
        "name": photo.title
      }))
    }
  };
}

export function buildCollectionSchema(site, collection) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": collection.title,
    "description": collection.description,
    "url": absoluteUrl(site, collection.url),
    "keywords": collection.tags,
    "mainEntity": {
      "@type": "ItemList",
      "name": `${collection.title} photo collection`,
      "numberOfItems": collection.photos.length,
      "itemListElement": collection.photos.map((photo, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": absoluteUrl(site, photo.url),
        "name": photo.title
      }))
    }
  };
}

export function buildPhotoSchema(site, photo) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": photo.title,
    "description": photo.description,
    "url": absoluteUrl(site, photo.url),
    "mainEntity": {
      "@type": "ImageObject",
      "name": photo.title,
      "description": photo.description,
      "contentUrl": absoluteUrl(site, photo.imageUrl),
      "thumbnailUrl": absoluteUrl(site, photo.thumbUrl),
      "width": photo.width,
      "height": photo.height,
      "caption": photo.alt,
      "keywords": photo.tags,
      "dateCreated": photo.capturedAt,
      "locationCreated": {
        "@type": "Place",
        "name": photo.locationName
      }
    }
  };
}

export function createSeo({
  site,
  path,
  title,
  description,
  imagePath,
  type = "website",
  breadcrumbs = [],
  schemas = [],
  noindex = false
}) {
  const baseTitle = title || site.defaultTitle;
  const fullTitle = baseTitle === site.defaultTitle ? baseTitle : `${baseTitle} | ${site.brandName}`;
  const canonical = absoluteUrl(site, path);
  const seoImage = absoluteUrl(site, imagePath || site.socialImage);
  const cleanDescription = truncate(description || site.defaultDescription, 165);
  const allSchemas = [...schemas];

  if (breadcrumbs.length > 1) {
    allSchemas.push(buildBreadcrumbSchema(site, breadcrumbs));
  }

  return {
    title: fullTitle,
    description: cleanDescription,
    canonical,
    image: seoImage,
    imageAlt: `${baseTitle} social preview`,
    type,
    robots: noindex ? "noindex,follow" : "index,follow",
    schemas: allSchemas
  };
}

