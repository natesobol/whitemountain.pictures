export interface CatalogFilters {
  year: string;
  season: string;
  status: string;
  query: string;
}

export interface CatalogItem {
  year: string | number;
  season: string;
  status: string;
  title: string;
  place: string;
  [key: string]: unknown;
}

export const DEFAULT_FILTERS: Readonly<CatalogFilters>;

export function canonicalSeason(value: string): string;

export function normalizeFilters(
  input?: Partial<CatalogFilters>,
  items?: ReadonlyArray<CatalogItem>,
): CatalogFilters;

export function filterCatalog<T extends CatalogItem>(
  items: ReadonlyArray<T>,
  input?: Partial<CatalogFilters>,
): T[];

export function optionCounts(
  items: ReadonlyArray<CatalogItem>,
  input: Partial<CatalogFilters>,
  field: "year" | "season" | "status",
): Map<string, number>;

export function filtersFromSearch(
  search: string,
  items?: ReadonlyArray<CatalogItem>,
): CatalogFilters;

export function filtersToSearch(input?: Partial<CatalogFilters>): string;

export function nextVisibleCount(current: number, total: number, increment?: number): number;

export function photographCount(count: number): string;

export function archiveHeading(matching: number, total: number): string;

export function archiveSummary(visible: number, matching: number, total: number): string;
