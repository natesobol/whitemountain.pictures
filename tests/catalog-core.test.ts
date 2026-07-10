import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTERS,
  filterCatalog,
  filtersFromSearch,
  filtersToSearch,
  nextVisibleCount,
  normalizeFilters,
  optionCounts,
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
    const accented = [{ ...photos[0], title: "Mount Móriah Rime" }];
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
