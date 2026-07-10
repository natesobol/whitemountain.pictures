export const DEFAULT_FILTERS = Object.freeze({
  year: "all",
  season: "all",
  status: "all",
  query: "",
});

const FILTER_FIELDS = ["year", "season", "status"];

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function canonicalValues(items, field) {
  return new Map(items
    .map((item) => clean(String(item[field] ?? "")))
    .filter(Boolean)
    .map((value) => [value.toLocaleLowerCase(), value]));
}

function foldSearchText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

export function normalizeFilters(input = {}, items = []) {
  const normalized = { ...DEFAULT_FILTERS, query: clean(input.query) };

  for (const field of FILTER_FIELDS) {
    const value = clean(input[field]) || "all";
    const canonical = canonicalValues(items, field).get(value.toLocaleLowerCase());
    normalized[field] = value.toLocaleLowerCase() === "all" ? "all" : (canonical ?? "all");
  }

  return normalized;
}

export function filterCatalog(items, input = DEFAULT_FILTERS) {
  const filters = normalizeFilters(input, items);
  const query = foldSearchText(filters.query);

  return items.filter((item) => {
    const matchesFields = FILTER_FIELDS.every((field) => (
      filters[field] === "all" || String(item[field] ?? "") === filters[field]
    ));
    if (!matchesFields || !query) return matchesFields;
    const searchable = foldSearchText(`${item.title ?? ""} ${item.place ?? ""}`);
    return searchable.includes(query);
  });
}

export function optionCounts(items, input, field) {
  if (!FILTER_FIELDS.includes(field)) return new Map();
  const filters = normalizeFilters(input, items);
  filters[field] = "all";
  const counts = new Map();

  for (const item of filterCatalog(items, filters)) {
    const value = clean(String(item[field] ?? ""));
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return counts;
}

export function filtersFromSearch(search, items = []) {
  const params = new URLSearchParams(search);
  return normalizeFilters({
    year: params.get("year") ?? "all",
    season: params.get("season") ?? "all",
    status: params.get("status") ?? "all",
    query: params.get("q") ?? "",
  }, items);
}

export function filtersToSearch(input = DEFAULT_FILTERS) {
  const params = new URLSearchParams();
  const filters = { ...DEFAULT_FILTERS, ...input, query: clean(input.query).toLocaleLowerCase() };

  if (filters.year !== "all") params.set("year", filters.year);
  if (filters.season !== "all") params.set("season", filters.season);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.query) params.set("q", filters.query);

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function nextVisibleCount(current, total, increment = 36) {
  const safeCurrent = Math.max(0, Number(current) || 0);
  const safeTotal = Math.max(0, Number(total) || 0);
  const safeIncrement = Math.max(0, Number(increment) || 0);
  return Math.min(safeCurrent + safeIncrement, safeTotal);
}
