import { loadSiteContext } from "./lib/data.js";
import { ROOT_DIR } from "./lib/fs.js";

const context = await loadSiteContext(ROOT_DIR);
const issues = [];

function assert(condition, message) {
  if (!condition) {
    issues.push(message);
  }
}

const collectionIds = new Set();
const collectionSlugs = new Set();
for (const collection of context.collections) {
  assert(!collectionIds.has(collection.id), `Duplicate collection id: ${collection.id}`);
  assert(!collectionSlugs.has(collection.slug), `Duplicate collection slug: ${collection.slug}`);
  assert(collection.photos.length === collection.photoCount, `Photo count mismatch for collection ${collection.slug}: expected ${collection.photoCount}, found ${collection.photos.length}`);
  collectionIds.add(collection.id);
  collectionSlugs.add(collection.slug);
}

const photoIds = new Set();
const photoSlugs = new Set();
for (const photo of context.photos) {
  assert(!photoIds.has(photo.id), `Duplicate photo id: ${photo.id}`);
  assert(!photoSlugs.has(photo.slug), `Duplicate photo slug: ${photo.slug}`);
  assert(photo.collectionIds.length > 0, `Photo ${photo.slug} has no collection ids`);
  assert(["landscape", "portrait", "square"].includes(photo.orientation), `Photo ${photo.slug} has invalid orientation "${photo.orientation}"`);
  assert(Boolean(photo.imageUrl), `Photo ${photo.slug} is missing imageUrl`);
  assert(Boolean(photo.thumbUrl), `Photo ${photo.slug} is missing thumbUrl`);
  assert(Boolean(photo.title), `Photo ${photo.slug} is missing title`);
  assert(Boolean(photo.region), `Photo ${photo.slug} is missing region`);
  assert(Boolean(photo.season), `Photo ${photo.slug} is missing season`);
  photoIds.add(photo.id);
  photoSlugs.add(photo.slug);
}

assert(context.site.canonicalHost === "whitemountains.pictures", "site.json canonicalHost should be whitemountains.pictures");
assert(context.collections.length >= 6, "Expected at least 6 collections");
assert(context.photos.length >= 24, "Expected at least 24 photo records");
assert(context.navigation.primary.length >= 5, "Expected primary navigation entries");

if (issues.length) {
  console.error("Data validation failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`Validated ${context.collections.length} collections and ${context.photos.length} photos with no structural issues.`);

