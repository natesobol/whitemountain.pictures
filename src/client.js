import {
  DEFAULT_FILTERS,
  filterCatalog,
  filtersFromSearch,
  filtersToSearch,
  nextVisibleCount,
  normalizeFilters,
  optionCounts,
} from "./catalog-core.js";

const INITIAL_VISIBLE = 24;
const REVEAL_INCREMENT = 36;

function filtersFromForm(form) {
  if (!(form instanceof HTMLFormElement)) return { ...DEFAULT_FILTERS };
  const values = new FormData(form);
  return {
    year: String(values.get("year") ?? "all"),
    season: String(values.get("season") ?? "all"),
    status: String(values.get("status") ?? "all"),
    query: String(values.get("query") ?? ""),
  };
}

function applyFiltersToForm(form, filters) {
  for (const [name, value] of Object.entries(filters)) {
    const control = form.elements.namedItem(name);
    if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement) {
      control.value = value;
    }
  }
}

function writeFilterUrl(filters, { replace = false } = {}) {
  const next = `${window.location.pathname}${filtersToSearch(filters)}${window.location.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next === current) return;
  window.history[replace ? "replaceState" : "pushState"]({}, "", next);
}

function updateOptionAvailability(form, catalog, filters) {
  for (const field of ["year", "season", "status"]) {
    const select = form.elements.namedItem(field);
    if (!(select instanceof HTMLSelectElement)) continue;
    const counts = optionCounts(catalog, filters, field);
    for (const option of select.options) {
      option.disabled = option.value !== "all"
        && option.value !== filters[field]
        && !counts.has(option.value);
    }
  }
}

function updateFeatured(link, featured) {
  if (!(link instanceof HTMLAnchorElement) || !(featured.image instanceof HTMLImageElement)) return;
  if (link.dataset.hero) featured.image.src = link.dataset.hero;
  featured.image.alt = link.dataset.alt ?? "";
  if (featured.title) featured.title.textContent = link.dataset.title ?? "";
  if (featured.place) featured.place.textContent = link.dataset.place ?? "";
  if (featured.link instanceof HTMLAnchorElement) featured.link.href = link.href;
}

function bindFeature(link, featured) {
  if (!(link instanceof HTMLAnchorElement)) return;
  const activate = () => updateFeatured(link, featured);
  link.addEventListener("pointerenter", activate, { passive: true });
  link.addEventListener("focus", activate);
}

function createWallCard(photo, index, featured) {
  const link = document.createElement("a");
  link.className = `photo-tile ${photo.orientation === "portrait" ? "is-portrait" : "is-landscape"}`;
  link.href = photo.href;
  link.dataset.title = photo.title;
  link.dataset.place = photo.place;
  link.dataset.hero = photo.hero;
  link.dataset.alt = photo.alt;

  const image = document.createElement("img");
  image.src = photo.thumb;
  image.alt = photo.alt;
  image.width = photo.width;
  image.height = photo.height;
  image.loading = index === 0 ? "eager" : "lazy";
  image.decoding = "async";

  const label = document.createElement("span");
  label.textContent = photo.place;
  link.append(image, label);
  bindFeature(link, featured);
  return link;
}

function initHomeCatalog() {
  const wall = document.querySelector("[data-photo-wall]");
  const form = document.querySelector("[data-wall-filters]");
  if (!(wall instanceof HTMLElement) || !(form instanceof HTMLFormElement)) return;

  const loadMoreButton = document.querySelector("[data-load-more]");
  const resultCount = document.querySelector("[data-result-count]");
  const emptyState = document.querySelector("[data-catalog-empty]");
  const errorState = document.querySelector("[data-catalog-error]");
  const retryButton = document.querySelector("[data-catalog-retry]");
  const resetButton = document.querySelector("[data-wall-reset]");
  const featured = {
    link: document.querySelector("[data-featured-link]"),
    image: document.querySelector("[data-featured-image]"),
    title: document.querySelector("[data-featured-title]"),
    place: document.querySelector("[data-featured-place]"),
  };
  let catalogPromise;
  let catalog = [];
  let visibleCount = INITIAL_VISIBLE;

  const setControlsDisabled = (disabled) => {
    form.querySelectorAll("select, button").forEach((control) => { control.disabled = disabled; });
  };

  const loadCatalog = ({ retry = false } = {}) => {
    if (retry) catalogPromise = undefined;
    if (!catalogPromise) {
      const url = wall.dataset.catalogUrl;
      catalogPromise = url
        ? fetch(url, { credentials: "same-origin" }).then((response) => {
          if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
          return response.json();
        })
        : Promise.resolve([]);
    }
    return catalogPromise;
  };

  const render = async ({ resetCount = false, updateUrl = false, replaceUrl = false, retry = false } = {}) => {
    if (resetCount) visibleCount = INITIAL_VISIBLE;
    if (errorState instanceof HTMLElement) errorState.hidden = true;
    try {
      catalog = await loadCatalog({ retry });
      setControlsDisabled(false);
      const filters = normalizeFilters(filtersFromForm(form), catalog);
      const filtered = filterCatalog(catalog, filters);
      const visible = filtered.slice(0, visibleCount);
      const visibleLinks = visible.map((photo, index) => createWallCard(photo, index, featured));
      wall.replaceChildren(...visibleLinks);
      if (featured.link instanceof HTMLAnchorElement) featured.link.hidden = visible.length === 0;
      if (visibleLinks[0]) updateFeatured(visibleLinks[0], featured);
      if (resultCount) resultCount.textContent = `Showing ${visible.length} of ${filtered.length} photographs`;
      if (emptyState instanceof HTMLElement) emptyState.hidden = filtered.length > 0;
      if (loadMoreButton instanceof HTMLButtonElement) loadMoreButton.hidden = visible.length >= filtered.length;
      updateOptionAvailability(form, catalog, filters);
      if (updateUrl) writeFilterUrl(filters, { replace: replaceUrl });
    } catch {
      setControlsDisabled(true);
      if (errorState instanceof HTMLElement) errorState.hidden = false;
      if (resultCount) resultCount.textContent = "Showing the initial selection";
      if (loadMoreButton instanceof HTMLButtonElement) loadMoreButton.hidden = true;
    }
  };

  wall.querySelectorAll(".photo-tile").forEach((link) => bindFeature(link, featured));
  form.addEventListener("change", () => { void render({ resetCount: true, updateUrl: true }); });
  form.addEventListener("reset", () => {
    window.setTimeout(() => { void render({ resetCount: true, updateUrl: true }); }, 0);
  });
  if (loadMoreButton instanceof HTMLButtonElement) {
    loadMoreButton.addEventListener("click", async () => {
      if (!catalog.length) catalog = await loadCatalog();
      const total = filterCatalog(catalog, filtersFromForm(form)).length;
      visibleCount = nextVisibleCount(visibleCount, total, REVEAL_INCREMENT);
      await render();
    });
  }
  if (retryButton instanceof HTMLButtonElement) {
    retryButton.addEventListener("click", () => { void render({ retry: true }); });
  }
  if (resetButton instanceof HTMLButtonElement) {
    resetButton.addEventListener("click", () => form.reset());
  }
  window.addEventListener("popstate", async () => {
    catalog = await loadCatalog();
    applyFiltersToForm(form, filtersFromSearch(window.location.search, catalog));
    await render({ resetCount: true });
  });

  if (window.location.search) {
    void loadCatalog().then((items) => {
      catalog = items;
      applyFiltersToForm(form, filtersFromSearch(window.location.search, catalog));
      return render({ resetCount: true, replaceUrl: true });
    }).catch(() => render());
  }
}

function initArchiveCatalog() {
  const root = document.querySelector("[data-archive]");
  if (!(root instanceof HTMLElement)) return;
  const form = root.querySelector("[data-archive-filters]");
  if (!(form instanceof HTMLFormElement)) return;
  const cards = [...root.querySelectorAll("[data-archive-card]")]
    .filter((card) => card instanceof HTMLAnchorElement)
    .map((element) => ({
      element,
      href: element.getAttribute("href") ?? "",
      title: element.dataset.search ?? "",
      place: "",
      year: element.dataset.year ?? "",
      season: element.dataset.season ?? "",
      status: element.dataset.status ?? "",
    }));
  const resultCount = root.querySelector("[data-archive-result-count]");
  const emptyState = root.querySelector("[data-archive-empty]");
  const loadMoreButton = root.querySelector("[data-archive-load-more]");
  const resetButton = root.querySelector("[data-archive-reset]");
  const search = root.querySelector("[data-archive-search]");
  let visibleCount = INITIAL_VISIBLE;

  const render = ({ resetCount = false, updateUrl = false, replaceUrl = false } = {}) => {
    if (resetCount) visibleCount = INITIAL_VISIBLE;
    const filters = normalizeFilters(filtersFromForm(form), cards);
    const filtered = filterCatalog(cards, filters);
    const visible = new Set(filtered.slice(0, visibleCount));
    root.dataset.enhanced = "true";
    for (const card of cards) card.element.hidden = !visible.has(card);
    if (resultCount) resultCount.textContent = `Showing ${visible.size} of ${filtered.length} photographs`;
    if (emptyState instanceof HTMLElement) emptyState.hidden = filtered.length > 0;
    if (loadMoreButton instanceof HTMLButtonElement) loadMoreButton.hidden = visible.size >= filtered.length;
    updateOptionAvailability(form, cards, filters);
    if (updateUrl) writeFilterUrl(filters, { replace: replaceUrl });
  };

  applyFiltersToForm(form, filtersFromSearch(window.location.search, cards));
  render({ resetCount: true, replaceUrl: true });
  form.addEventListener("change", () => render({ resetCount: true, updateUrl: true }));
  form.addEventListener("reset", () => {
    window.setTimeout(() => render({ resetCount: true, updateUrl: true }), 0);
  });
  if (search instanceof HTMLInputElement) {
    search.addEventListener("input", () => render({ resetCount: true, updateUrl: true, replaceUrl: true }));
  }
  if (loadMoreButton instanceof HTMLButtonElement) {
    loadMoreButton.addEventListener("click", () => {
      const total = filterCatalog(cards, filtersFromForm(form)).length;
      visibleCount = nextVisibleCount(visibleCount, total, REVEAL_INCREMENT);
      render();
    });
  }
  if (resetButton instanceof HTMLButtonElement) resetButton.addEventListener("click", () => form.reset());
  window.addEventListener("popstate", () => {
    applyFiltersToForm(form, filtersFromSearch(window.location.search, cards));
    render({ resetCount: true });
  });
}

function initLicensingLink() {
  const link = document.querySelector("[data-license-link]");
  if (!(link instanceof HTMLAnchorElement)) return;
  const value = new URLSearchParams(window.location.search).get("photo");
  if (!value) return;
  try {
    const photo = new URL(value);
    if (photo.protocol !== "https:" && photo.protocol !== "http:") return;
    const subject = encodeURIComponent("White Mountains Pictures license");
    const body = encodeURIComponent(`Photo: ${photo.href}\n\nIntended use:\nPlacement:\nAudience or circulation:\nTerritory:\nDuration:\nRequested dimensions:`);
    link.href = `mailto:natesobol@gmail.com?subject=${subject}&body=${body}`;
  } catch {
    // Keep the safe general mail link rendered by the server.
  }
}

initHomeCatalog();
initArchiveCatalog();
initLicensingLink();
