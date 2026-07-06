import { writeTextFile, DIST_DIR } from "./lib/fs.js";
import { loadSiteContext } from "./lib/data.js";
import { ROOT_DIR } from "./lib/fs.js";

const context = await loadSiteContext(ROOT_DIR);

const searchIndex = {
  generatedAt: new Date().toISOString(),
  pages: [
    {
      type: "page",
      title: "Home",
      url: "/",
      body: context.site.defaultDescription
    },
    {
      type: "page",
      title: "Gallery",
      url: "/gallery",
      body: "All placeholder White Mountains photo records."
    },
    {
      type: "page",
      title: "Collections",
      url: "/collections",
      body: "Collection index for White Mountains Pictures."
    }
  ],
  collections: context.collections.map((collection) => ({
    type: "collection",
    id: collection.id,
    title: collection.title,
    url: collection.url,
    tags: collection.tags,
    body: [collection.subtitle, collection.description, ...collection.locationHints, ...collection.seasonHints].join(" ")
  })),
  photos: context.photos.map((photo) => ({
    type: "photo",
    id: photo.id,
    title: photo.title,
    url: photo.url,
    body: [photo.description, photo.locationName, photo.mountain, photo.region, photo.season, ...photo.tags].join(" "),
    featured: photo.featured
  }))
};

await writeTextFile(`${DIST_DIR}/search-index.json`, JSON.stringify(searchIndex, null, 2));
console.log(`Wrote search index with ${searchIndex.photos.length} photo entries.`);

