import { describe, expect, it } from "vitest";
import {
  archiveHeading,
  archiveSummary,
  canonicalSeason,
  DEFAULT_FILTERS,
  filterCatalog,
  filtersFromSearch,
  filtersToSearch,
  nextVisibleCount,
  normalizeFilters,
  optionCounts,
  photographCount,
} from "../src/catalog-core.js";

const photos = [
  {
    href: "/photos/2026/mount-pierce/",
    title: "Mount Pierce Peaks",
    place: "White Mountains",
    year: 2026,
    season: "Winter",
    status: "reviewed",
  },
  {
    href: "/photos/2026/howker-ridge/",
    title: "Howker Ridge Trail in Spring",
    place: "Howker Ridge",
    year: 2026,
    season: "Spring",
    status: "pending",
  },
  {
    href: "/photos/2025/forest-light/",
    title: "Forest Light",
    place: "Great Gulf Wilderness",
    year: 2025,
    season: "Summer",
    status: "pending",
  },
];

describe("catalog filters", () => {
  it("normalizes fall and autumn into one canonical season", () => {
    const seasonal = [
      { ...photos[1]!, href: "/fall/", title: "Fall ridge", season: "Fall" },
      { ...photos[1]!, href: "/autumn/", title: "Autumn ridge", season: "Autumn" },
    ];

    expect(canonicalSeason("fall")).toBe("Autumn");
    expect(canonicalSeason("AUTUMN")).toBe("Autumn");
    expect(filterCatalog(seasonal, { ...DEFAULT_FILTERS, season: "Autumn" })).toEqual(seasonal);
    expect(optionCounts(seasonal, DEFAULT_FILTERS, "season")).toEqual(new Map([["Autumn", 2]]));
  });

  it("combines structured filters with case-insensitive title and place search", () => {
    expect(filterCatalog(photos, {
      year: "2026",
      season: "Winter",
      status: "reviewed",
      query: "  PIERCE  ",
    })).toEqual([photos[0]]);

    expect(filterCatalog(photos, { ...DEFAULT_FILTERS, query: "great gulf" })).toEqual([photos[2]]);
  });

  it("normalizes missing and unsupported filter values", () => {
    expect(normalizeFilters({ year: "2030", season: "Monsoon", status: "draft", query: "  Ridge  " }, photos))
      .toEqual({ year: "all", season: "all", status: "all", query: "Ridge" });
  });

  it("maps structured values to their canonical display casing", () => {
    expect(normalizeFilters({ year: "2026", season: "winter", status: "REVIEWED", query: "" }, photos))
      .toEqual({ year: "2026", season: "Winter", status: "reviewed", query: "" });
  });

  it("matches search text without requiring diacritics", () => {
    const accented = [{ ...photos[0]!, title: "Mount Móriah Rime" }];
    expect(filterCatalog(accented, { ...DEFAULT_FILTERS, query: "moriah" })).toEqual(accented);
  });

  it("counts options while ignoring the field being counted", () => {
    expect(optionCounts(photos, { year: "2026", season: "all", status: "pending", query: "" }, "season"))
      .toEqual(new Map([["Spring", 1]]));

    expect(optionCounts(photos, { year: "all", season: "Winter", status: "all", query: "" }, "year"))
      .toEqual(new Map([["2026", 1]]));
  });
});

describe("catalog URL state", () => {
  it("maps legacy Fall URLs to canonical Autumn state", () => {
    const seasonal = [{ ...photos[1]!, season: "Autumn" }];

    expect(filtersFromSearch("?season=Fall", seasonal).season).toBe("Autumn");
    expect(filtersToSearch({ ...DEFAULT_FILTERS, season: "Fall" })).toBe("?season=Autumn");
  });

  it("reads known parameters and falls back safely for invalid values", () => {
    expect(filtersFromSearch("?year=2026&season=Winter&status=reviewed&q=Pierce", photos)).toEqual({
      year: "2026",
      season: "Winter",
      status: "reviewed",
      query: "Pierce",
    });
    expect(filtersFromSearch("?year=2030&status=private&ignored=yes", photos)).toEqual(DEFAULT_FILTERS);
  });

  it("serializes only non-default values in a stable order", () => {
    expect(filtersToSearch({ year: "all", season: "Winter", status: "all", query: "  ridge " }))
      .toBe("?season=Winter&q=ridge");
    expect(filtersToSearch(DEFAULT_FILTERS)).toBe("");
    expect(filtersToSearch({})).toBe("");
  });
});

describe("catalog reveal counts", () => {
  it("caps each reveal operation at the result total", () => {
    expect(nextVisibleCount(24, 100, 36)).toBe(60);
    expect(nextVisibleCount(60, 70, 36)).toBe(70);
    expect(nextVisibleCount(70, 70, 36)).toBe(70);
  });
});

describe("catalog result copy", () => {
  it("pluralizes photograph counts", () => {
    expect(photographCount(0)).toBe("0 photographs");
    expect(photographCount(1)).toBe("1 photograph");
    expect(photographCount(2)).toBe("2 photographs");
  });

  it("keeps the original total visible for filtered and empty states", () => {
    expect(archiveHeading(356, 356)).toBe("356 photographs");
    expect(archiveHeading(1, 356)).toBe("1 matching photograph");
    expect(archiveHeading(0, 356)).toBe("No matching photographs");

    expect(archiveSummary(24, 356, 356)).toBe("Showing 24 of 356 photographs");
    expect(archiveSummary(1, 1, 356)).toBe("Showing 1 matching photograph · 356 total");
    expect(archiveSummary(0, 0, 356)).toBe("0 matching photographs · 356 total");
  });
});
