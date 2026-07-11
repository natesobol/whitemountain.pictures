import { createHash } from "node:crypto";
import { canonicalSeason } from "../src/catalog-core.js";
import { curateLocation } from "../src/location-curation.js";

export const SITE_ORIGIN = "https://whitemountains.pictures";
export const MEDIA_ORIGIN = "https://photos.whitemountains.pictures";

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function safeJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

export function slugify(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "untitled";
}

export function hashContent(content) {
  return createHash("sha256").update(content).digest("hex").slice(0, 12);
}

function finitePositive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function formatDate(value) {
  if (!value) return "Date not published";
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  return Number.isNaN(date.valueOf())
    ? String(value)
    : new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(date);
}

export function formatExposure(seconds) {
  const value = finitePositive(seconds);
  if (!value) return "Not published";
  if (value >= 1) return `${Number(value.toFixed(2))} sec`;
  return `1/${Math.round(1 / value)} sec`;
}

function cleanText(value, fallback = "") {
  const text = typeof value === "string" ? value.replaceAll("Â©", "©").trim() : "";
  return text || fallback;
}

const TIME_OF_DAY_LABELS = Object.freeze({
  morning: "Morning", afternoon: "Afternoon", evening: "Evening", sunset: "Sunset",
  sunrise: "Sunrise", twilight: "Twilight", night: "Night", day: "Daylight",
});

function timeOfDayLabel(value, captureDate) {
  const explicit = cleanText(value).toLowerCase();
  if (TIME_OF_DAY_LABELS[explicit]) return TIME_OF_DAY_LABELS[explicit];
  if (!captureDate) return "";
  const date = new Date(captureDate);
  if (Number.isNaN(date.valueOf())) return "";
  const hour = Number(new Intl.DateTimeFormat("en-US", {
    hour: "numeric", hour12: false, timeZone: "America/New_York",
  }).format(date));
  if (hour >= 5 && hour < 10) return "Morning";
  if (hour >= 10 && hour < 16) return "Afternoon";
  if (hour >= 16 && hour < 20) return "Evening";
  if (hour >= 20 || hour < 5) return "Night";
  return "";
}

function approvedMetadata(photo) {
  const required = [photo.title, photo.description, photo.alt, photo.captureDate, photo.place];
  const validDimensions = finitePositive(photo.width) && finitePositive(photo.height);
  const validCameraValues = [photo.iso, photo.fNumber, photo.focalLength, photo.exposureTime]
    .filter((value) => value !== null && value !== "")
    .every((value) => finitePositive(value));
  return photo.needsHumanReview === false && required.every(Boolean) && validDimensions && validCameraValues;
}

export function normalize2025(record, manifestEntry) {
  const ai = record.ai?.output ?? {};
  const normalized = record.normalized ?? {};
  const identity = record.identity ?? {};
  const trip = record.trip ?? {};
  const objectKey = manifestEntry?.objectKeys?.image
    ?? `photos/2025/originals/${String(identity.filename ?? "").toLowerCase()}`;
  const place = cleanText(ai.safeLocationName ?? ai.locationName, "White Mountains, New Hampshire");
  const sourceCaptureValue = cleanText(normalized.capturedAt ?? trip.date);
  const sourceCaptureDate = sourceCaptureValue.slice(0, 10);
  const captureYearMismatch = Boolean(sourceCaptureDate && !sourceCaptureDate.startsWith("2025-"));
  const curatedLocation = curateLocation({
    inferredLabel: manifestEntry?.inferredLocation?.label ?? place,
    title: ai.title,
    alt: ai.alt,
    routeLabel: trip.routeContext,
    tripLabel: trip.label,
    broadPlace: place,
  });
  const reviewReasons = manifestEntry?.needsHumanReview === false
    ? []
    : ["The source archive marks this record for human review."];
  if (captureYearMismatch) {
    reviewReasons.push("Capture date does not match the 2025 archive year and is not published.");
  }
  const photo = {
    id: cleanText(identity.photoId ?? manifestEntry?.photoId),
    year: 2025,
    slug: slugify(identity.slug ?? ai.title ?? identity.filename),
    filename: cleanText(identity.filename),
    objectKey,
    title: cleanText(ai.title, "White Mountains photograph"),
    headline: cleanText(ai.headline, ai.title),
    description: cleanText(ai.description),
    extendedDescription: cleanText(ai.extendedDescription, ai.description),
    alt: cleanText(ai.alt, ai.title),
    place,
    locationLabel: curatedLocation.label,
    peakNames: curatedLocation.peakNames,
    peakRange: curatedLocation.range,
    locationKind: curatedLocation.kind,
    locationConfidence: curatedLocation.confidence,
    region: cleanText(ai.region, "White Mountains"),
    season: canonicalSeason(cleanText(record.derived?.season ?? trip.season, "Unknown")),
    captureDate: captureYearMismatch ? "" : sourceCaptureDate,
    timeOfDay: captureYearMismatch ? "" : timeOfDayLabel(ai.timeOfDay, sourceCaptureValue),
    captureYearMismatch,
    camera: cleanText(normalized.camera),
    lens: cleanText(normalized.lens),
    exposureTime: finitePositive(normalized.exposureTime),
    fNumber: finitePositive(normalized.fNumber),
    focalLength: finitePositive(normalized.focalLength),
    iso: finitePositive(normalized.iso),
    width: finitePositive(normalized.dimensions?.width ?? identity.width),
    height: finitePositive(normalized.dimensions?.height ?? identity.height),
    orientation: cleanText(normalized.orientation, "landscape").toLowerCase(),
    tripId: cleanText(trip.id),
    tripLabel: cleanText(trip.label ?? trip.routeContext),
    collectionIds: [...new Set((ai.collectionIds ?? record.derived?.collectionCandidates ?? []).map(slugify))],
    tags: [...new Set([...(ai.tags ?? []), ...(ai.keywords ?? []), ...(record.derived?.tags ?? [])].map(cleanText).filter(Boolean))].slice(0, 24),
    needsHumanReview: manifestEntry?.needsHumanReview !== false || captureYearMismatch,
    reviewReasons,
  };
  photo.approved = approvedMetadata(photo);
  return photo;
}

export function normalize2026(record, manifestEntry) {
  const camera = record.camera ?? {};
  const image = record.image ?? {};
  const trip = record.tripContext ?? {};
  const sourceCaptureDate = cleanText(trip.dateCandidates?.[0] ?? record.seasonEvidence?.basis?.match(/\d{4}-\d{2}-\d{2}/)?.[0]);
  const captureYearMismatch = Boolean(sourceCaptureDate && !sourceCaptureDate.startsWith("2026-"));
  const reviewReasons = [...(record.confidenceWarnings ?? [])];
  if (captureYearMismatch) {
    reviewReasons.push("Capture date does not match the 2026 archive year and is not published.");
  }
  const place = cleanText(record.location?.label ?? record.inferredLocation?.label, "White Mountains, New Hampshire");
  const curatedLocation = curateLocation({
    peakNames: trip.peakNames ?? record.tripPeakNames ?? [],
    inferredLabel: place,
    title: record.title,
    alt: record.alt,
    routeLabel: trip.routeLabel,
    tripLabel: trip.tripLabel,
    broadPlace: place,
  });
  const photo = {
    id: cleanText(record.photoId ?? manifestEntry?.photoId),
    year: 2026,
    slug: slugify(record.slug ?? record.title ?? record.filename),
    filename: cleanText(record.filename),
    objectKey: cleanText(record.objectKeys?.image ?? manifestEntry?.objectKeys?.image),
    title: cleanText(record.title, "White Mountains photograph"),
    headline: cleanText(record.headline, record.title),
    description: cleanText(record.description),
    extendedDescription: cleanText(record.extendedDescription, record.description),
    alt: cleanText(record.alt, record.title),
    place,
    locationLabel: curatedLocation.label,
    peakNames: curatedLocation.peakNames,
    peakRange: curatedLocation.range,
    locationKind: curatedLocation.kind,
    locationConfidence: curatedLocation.confidence,
    region: cleanText(record.location?.state, "New Hampshire"),
    season: canonicalSeason(cleanText(record.season, "Unknown")),
    captureDate: captureYearMismatch ? "" : sourceCaptureDate,
    timeOfDay: captureYearMismatch ? "" : timeOfDayLabel(record.timeOfDay, sourceCaptureDate),
    captureYearMismatch,
    camera: cleanText(camera.model),
    lens: cleanText(camera.lens),
    exposureTime: finitePositive(camera.shutterSpeed),
    fNumber: finitePositive(camera.fStop),
    focalLength: finitePositive(camera.focalLength),
    iso: finitePositive(camera.iso),
    width: finitePositive(image.width),
    height: finitePositive(image.height),
    orientation: cleanText(image.orientation, "landscape").toLowerCase(),
    tripId: cleanText(trip.matchedTripId ?? record.tripIds?.[0])
      ? slugify(trip.matchedTripId ?? record.tripIds?.[0])
      : "",
    tripLabel: cleanText(trip.tripLabel ?? record.tripPeakNames?.join(" and ")),
    collectionIds: [],
    tags: [...new Set([...(record.tags ?? []), ...(record.seoTags ?? [])].map(cleanText).filter(Boolean))].slice(0, 24),
    needsHumanReview: manifestEntry?.needsHumanReview !== false || record.needsHumanReview !== false || captureYearMismatch,
    reviewReasons,
  };
  photo.approved = approvedMetadata(photo);
  return photo;
}

export function photoHref(photo) {
  return `/photos/${photo.year}/${photo.slug}--${slugify(photo.id)}/`;
}

export function imageHref(photo, preset = "card") {
  return `/images/${preset}/${photo.year}/${encodeURIComponent(photo.filename.toLowerCase())}`;
}

export function originalHref(photo) {
  return `${MEDIA_ORIGIN}/${photo.objectKey.split("/").map(encodeURIComponent).join("/")}`;
}

export function groupBy(items, key) {
  const groups = new Map();
  for (const item of items) {
    const value = typeof key === "function" ? key(item) : item[key];
    if (!value) continue;
    const values = Array.isArray(value) ? value : [value];
    for (const entry of values) {
      if (!groups.has(entry)) groups.set(entry, []);
      groups.get(entry).push(item);
    }
  }
  return groups;
}
