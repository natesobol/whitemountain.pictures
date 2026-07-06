import path from "node:path";
import { fileURLToPath } from "node:url";
import { cp, mkdir, writeFile } from "node:fs/promises";

export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const DIST_DIR = path.join(ROOT_DIR, "dist");

export function fromRoot(...parts) {
  return path.join(ROOT_DIR, ...parts);
}

export async function ensureDir(directoryPath) {
  await mkdir(directoryPath, { recursive: true });
}

export async function writeTextFile(filePath, contents) {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, contents, "utf8");
}

export async function copyDirectory(source, destination) {
  await cp(source, destination, { recursive: true });
}

