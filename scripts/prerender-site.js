import path from "node:path";
import { copyDirectory, DIST_DIR, ROOT_DIR, ensureDir, writeTextFile, fromRoot } from "./lib/fs.js";
import { buildRouteRecords, loadSiteContext } from "./lib/data.js";
import { loadTemplates, renderPlaceholderSvg, renderRoute } from "./lib/render.js";

const context = await loadSiteContext(ROOT_DIR);
const templates = await loadTemplates(ROOT_DIR);
const routes = buildRouteRecords(context);

await ensureDir(DIST_DIR);
await copyDirectory(fromRoot("public"), DIST_DIR);
await copyDirectory(fromRoot("styles"), path.join(DIST_DIR, "styles"));
await ensureDir(path.join(DIST_DIR, "images", "placeholders"));

for (const photo of context.photos) {
  const outputPath = path.join(DIST_DIR, photo.imageUrl.replace(/^\//, ""));
  await writeTextFile(outputPath, renderPlaceholderSvg(photo));
}

for (const route of routes) {
  const html = renderRoute(route, context, templates);
  const outputPath = path.join(DIST_DIR, route.outputPath);
  await writeTextFile(outputPath, html);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  routeCount: routes.length,
  routes: routes.map((route) => ({
    type: route.type,
    path: route.path,
    outputPath: route.outputPath,
    indexable: route.indexable
  }))
};

await writeTextFile(path.join(DIST_DIR, "build-manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Prerendered ${routes.length} routes into ${DIST_DIR}.`);

