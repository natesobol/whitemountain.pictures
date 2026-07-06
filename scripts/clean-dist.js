import { rm } from "node:fs/promises";
import { DIST_DIR } from "./lib/fs.js";

await rm(DIST_DIR, { recursive: true, force: true });

