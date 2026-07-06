import path from "node:path";
import { readFile } from "node:fs/promises";
import { absoluteUrl, unique } from "../../components/utils.js";

function sortCollections(a, b) {
  return (a.sortOrder || 0) - (b.sortOrder || 0) || a.title.localeCompare(b.title);
}

function sortPhotos(a, b) {
  return b.sortDate.localeCompare(a.sortDate) || a.title.localeCompare(b.title);
}

function sharedCount(left = [], right = []) {
  const rightSet = new Set(right);
  return left.filter((value) => rightSet.has(value)).length;
}

async function readJson(rootDir, relativePath) {
  const filePath = path.join(rootDir, relativePath);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export async function loadRawSiteData(rootDir) {
  const [site, navigation, collections, photos] = await Promise.all([
    readJson(rootDir, "data/site.json"),
    readJson(rootDir, "data/navigation.json"),
    readJson(rootDir, "data/collections.json"),
    readJson(rootDir, "data/photos.json")
  ]);

  return { site, navigation, collections, photos };
}

export async function loadSiteContext(rootDir) {
  const raw = await loadRawSiteData(rootDir);
  const collectionsBase = [...raw.collections].sort(sortCollections);

  const collections = collectionsBase.map((collection) => ({
    ...collection,
    url: `/collections/${collection.slug}`,
    photos: []
  }));

  const collectionById = new Map(collections.map((collection) => [collection.id, collection]));
  const photos = raw.photos
    .map((photo) => ({
      ...photo,
      url: `/photo/${photo.slug}`,
      absoluteImageUrl: absoluteUrl(raw.site, photo.imageUrl),
      absoluteThumbUrl: absoluteUrl(raw.site, photo.thumbUrl)
    }))
    .sort(sortPhotos);

  const photosById = new Map();
  for (const photo of photos) {
    const linkedCollections = photo.collectionIds
      .map((collectionId) => collectionById.get(collectionId))
      .filter(Boolean);
    const linkedPhoto = {
      ...photo,
      collections: linkedCollections
    };
    photosById.set(photo.id, linkedPhoto);
  }

  const hydratedPhotos = [...photosById.values()];
  const hydratedCollections = collections.map((collection) => {
    const collectionPhotos = hydratedPhotos.filter((photo) => photo.collectionIds.includes(collection.id)).sort(sortPhotos);
    return {
      ...collection,
      photos: collectionPhotos,
      absoluteCoverImageUrl: absoluteUrl(raw.site, collection.coverImage)
    };
  });

  const finalCollectionMap = new Map(hydratedCollections.map((collection) => [collection.id, collection]));
  const finalPhotos = hydratedPhotos.map((photo) => ({
    ...photo,
    collections: photo.collectionIds.map((collectionId) => finalCollectionMap.get(collectionId)).filter(Boolean)
  }));

  const finalCollections = hydratedCollections.map((collection) => ({
    ...collection,
    photos: collection.photos.map((photo) => photosById.get(photo.id)).filter(Boolean)
  }));

  const featuredCollections = finalCollections.filter((collection) => collection.featured).sort(sortCollections);
  const featuredPhotos = finalPhotos.filter((photo) => photo.featured).sort(sortPhotos);
  const latestPhotos = [...finalPhotos].sort(sortPhotos);

  return {
    ...raw,
    collections: finalCollections,
    photos: finalPhotos,
    collectionById: new Map(finalCollections.map((collection) => [collection.id, collection])),
    collectionBySlug: new Map(finalCollections.map((collection) => [collection.slug, collection])),
    photoById: new Map(finalPhotos.map((photo) => [photo.id, photo])),
    photoBySlug: new Map(finalPhotos.map((photo) => [photo.slug, photo])),
    featuredCollections,
    featuredPhotos,
    latestPhotos,
    stats: {
      collectionCount: finalCollections.length,
      photoCount: finalPhotos.length,
      featuredCollectionCount: featuredCollections.length,
      featuredPhotoCount: featuredPhotos.length
    },
    filterOptions: {
      seasons: unique(finalPhotos.map((photo) => photo.season)).sort(),
      regions: unique(finalPhotos.map((photo) => photo.region)).sort(),
      orientations: ["landscape", "portrait", "square"].filter((value) => finalPhotos.some((photo) => photo.orientation === value))
    }
  };
}

export function buildRouteRecords(context) {
  const baseRoutes = [
    { type: "home", path: "/", outputPath: "index.html", indexable: true },
    { type: "gallery", path: "/gallery", outputPath: "gallery/index.html", indexable: true },
    { type: "collections", path: "/collections", outputPath: "collections/index.html", indexable: true },
    { type: "featured", path: "/featured", outputPath: "featured/index.html", indexable: true },
    { type: "about", path: "/about", outputPath: "about/index.html", indexable: true },
    { type: "404", path: "/404", outputPath: "404.html", indexable: false }
  ];

  const collectionRoutes = context.collections.map((collection) => ({
    type: "collection",
    path: collection.url,
    outputPath: `collections/${collection.slug}/index.html`,
    collection,
    indexable: true
  }));

  const photoRoutes = context.photos.map((photo) => ({
    type: "photo",
    path: photo.url,
    outputPath: `photo/${photo.slug}/index.html`,
    photo,
    indexable: true
  }));

  return [...baseRoutes, ...collectionRoutes, ...photoRoutes];
}

export function getRelatedCollections(context, currentCollection, limit = 3) {
  return context.collections
    .filter((collection) => collection.id !== currentCollection.id)
    .map((collection) => {
      const tagScore = sharedCount(currentCollection.tags, collection.tags) * 3;
      const seasonScore = sharedCount(currentCollection.seasonHints, collection.seasonHints) * 2;
      const featuredScore = collection.featured ? 1 : 0;
      return {
        collection,
        score: tagScore + seasonScore + featuredScore
      };
    })
    .sort((a, b) => b.score - a.score || sortCollections(a.collection, b.collection))
    .slice(0, limit)
    .map((entry) => entry.collection);
}

export function getRelatedPhotos(context, currentPhoto, limit = 4) {
  return context.photos
    .filter((photo) => photo.id !== currentPhoto.id)
    .map((photo) => {
      const regionScore = photo.region === currentPhoto.region ? 3 : 0;
      const seasonScore = photo.season === currentPhoto.season ? 2 : 0;
      const collectionScore = sharedCount(photo.collectionIds, currentPhoto.collectionIds) * 4;
      const tagScore = sharedCount(photo.tags, currentPhoto.tags);
      const featuredScore = photo.featured ? 1 : 0;
      return {
        photo,
        score: regionScore + seasonScore + collectionScore + tagScore + featuredScore
      };
    })
    .sort((a, b) => b.score - a.score || sortPhotos(a.photo, b.photo))
    .slice(0, limit)
    .map((entry) => entry.photo);
}

