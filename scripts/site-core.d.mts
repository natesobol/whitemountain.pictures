export interface NormalizedPhoto {
  id: string;
  year: 2025 | 2026;
  slug: string;
  filename: string;
  objectKey: string;
  title: string;
  headline: string;
  description: string;
  extendedDescription: string;
  alt: string;
  place: string;
  locationLabel: string;
  peakNames: string[];
  peakRange: string;
  locationKind: "peak" | "range" | "area";
  locationConfidence: "high" | "medium" | "low";
  region: string;
  season: string;
  captureDate: string;
  timeOfDay: string;
  captureYearMismatch: boolean;
  camera: string;
  lens: string;
  exposureTime: number | "";
  fNumber: number | "";
  focalLength: number | "";
  iso: number | "";
  width: number | "";
  height: number | "";
  orientation: string;
  tripId: string;
  tripLabel: string;
  collectionIds: string[];
  tags: string[];
  needsHumanReview: boolean;
  reviewReasons: string[];
  approved: boolean;
}

type SourceRecord = Record<string, any>;
type ManifestEntry = Record<string, any> | undefined;

export function escapeHtml(value?: unknown): string;
export function safeJson(value: unknown): string;
export function slugify(value?: unknown): string;
export function hashContent(content: string): string;
export function formatDate(value: unknown): string;
export function formatExposure(seconds: unknown): string;
export function normalize2025(record: SourceRecord, manifestEntry?: ManifestEntry): NormalizedPhoto;
export function normalize2026(record: SourceRecord, manifestEntry?: ManifestEntry): NormalizedPhoto;
export function photoHref(photo: Pick<NormalizedPhoto, "year" | "slug" | "id">): string;
export function imageHref(photo: Pick<NormalizedPhoto, "year" | "filename">, preset?: string): string;
export function originalHref(photo: Pick<NormalizedPhoto, "objectKey">): string;
export function groupBy<T extends Record<string, any>>(
  items: T[],
  key: keyof T | ((item: T) => unknown),
): Map<unknown, T[]>;
