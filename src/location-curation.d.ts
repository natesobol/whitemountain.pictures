export interface CuratedLocation {
  label: string;
  peakNames: string[];
  range: string;
  kind: "peak" | "range" | "area";
  confidence: "high" | "medium" | "low";
}

export interface LocationCurationInput {
  peakNames?: string[];
  inferredLabel?: string;
  title?: string;
  alt?: string;
  routeLabel?: string;
  tripLabel?: string;
  broadPlace?: string;
}

export function curateLocation(input?: LocationCurationInput): CuratedLocation;
export function canonicalPeakName(value: string): string;
export function rangeForPeak(peak: string): string;
