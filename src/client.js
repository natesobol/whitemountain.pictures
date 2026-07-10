const wall = document.querySelector("[data-photo-wall]");
const form = document.querySelector("[data-wall-filters]");
const loadMoreButton = document.querySelector("[data-load-more]");
const resultCount = document.querySelector("[data-result-count]");
const featuredImage = document.querySelector("[data-featured-image]");
const featuredTitle = document.querySelector("[data-featured-title]");
const featuredPlace = document.querySelector("[data-featured-place]");

let catalogPromise;
let visibleCount = 24;

function loadCatalog() {
  if (!catalogPromise && wall instanceof HTMLElement) {
    const url = wall.dataset.catalogUrl;
    if (url) {
      catalogPromise = fetch(url, { credentials: "same-origin" }).then((response) => {
        if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
        return response.json();
      });
    }
  }
  return catalogPromise ?? Promise.resolve([]);
}

function currentFilters() {
  if (!(form instanceof HTMLFormElement)) return {};
  const values = new FormData(form);
  return {
    year: String(values.get("year") ?? "all"),
    season: String(values.get("season") ?? "all"),
    status: String(values.get("status") ?? "all"),
  };
}

function matches(photo, filters) {
  return (filters.year === "all" || String(photo.year) === filters.year)
    && (filters.season === "all" || photo.season === filters.season)
    && (filters.status === "all" || photo.status === filters.status);
}

function createCard(photo, index) {
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
  bindFeature(link);
  return link;
}

function bindFeature(link) {
  if (!(link instanceof HTMLAnchorElement)) return;
  const activate = () => {
    if (!(featuredImage instanceof HTMLImageElement)) return;
    if (link.dataset.hero) featuredImage.src = link.dataset.hero;
    featuredImage.alt = link.dataset.alt ?? "";
    if (featuredTitle) featuredTitle.textContent = link.dataset.title ?? "";
    if (featuredPlace) featuredPlace.textContent = link.dataset.place ?? "";
  };
  link.addEventListener("pointerenter", activate, { passive: true });
  link.addEventListener("focus", activate);
}

async function renderCatalog({ reset = false } = {}) {
  if (!(wall instanceof HTMLElement)) return;
  if (reset) visibleCount = 24;
  const catalog = await loadCatalog();
  const filtered = catalog.filter((photo) => matches(photo, currentFilters()));
  const visible = filtered.slice(0, visibleCount);
  wall.replaceChildren(...visible.map(createCard));
  if (resultCount) resultCount.textContent = `Showing ${visible.length} of ${filtered.length} photographs`;
  if (loadMoreButton instanceof HTMLButtonElement) {
    loadMoreButton.hidden = visible.length >= filtered.length;
  }
}

document.querySelectorAll(".photo-tile").forEach(bindFeature);

if (form instanceof HTMLFormElement) {
  form.addEventListener("change", () => {
    renderCatalog({ reset: true }).catch((error) => console.error(error));
  });
  form.addEventListener("reset", () => {
    setTimeout(() => renderCatalog({ reset: true }).catch((error) => console.error(error)), 0);
  });
}

if (loadMoreButton instanceof HTMLButtonElement) {
  loadMoreButton.addEventListener("click", () => {
    visibleCount += 36;
    renderCatalog().catch((error) => console.error(error));
  });
}

