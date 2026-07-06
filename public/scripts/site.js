(function () {
  const root = document.documentElement;
  const storageKey = "wm-pictures-theme";

  function applyTheme(theme) {
    root.dataset.theme = theme;
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.setAttribute("aria-pressed", String(theme === "light"));
      button.querySelector("[data-theme-label]")?.replaceChildren(document.createTextNode(theme === "light" ? "Light" : "Dark"));
    });
  }

  function initTheme() {
    const savedTheme = window.localStorage.getItem(storageKey);
    applyTheme(savedTheme || root.dataset.theme || "dark");
  }

  function initThemeToggle() {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextTheme = root.dataset.theme === "light" ? "dark" : "light";
        window.localStorage.setItem(storageKey, nextTheme);
        applyTheme(nextTheme);
      });
    });
  }

  function initMobileNav() {
    const toggle = document.querySelector("[data-nav-toggle]");

    if (!toggle) {
      return;
    }

    root.dataset.navOpen = "false";

    toggle.addEventListener("click", () => {
      const nextExpanded = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(nextExpanded));
      root.dataset.navOpen = nextExpanded ? "true" : "false";
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1080) {
        root.dataset.navOpen = "false";
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function initGalleryEnhancements() {
    const page = document.querySelector("[data-gallery-page]");
    if (!page) {
      return;
    }

    const controls = page.querySelector("[data-gallery-controls]");
    const grid = page.querySelector("[data-gallery-grid]");
    const summary = page.querySelector("[data-gallery-summary]");
    const emptyState = page.querySelector("[data-gallery-empty]");
    const loadMoreButton = page.querySelector("[data-gallery-load-more]");
    const cards = Array.from(page.querySelectorAll("[data-photo-card]"));
    const pageSize = Number(grid?.dataset.pageSize || "18");
    let revealCount = pageSize;

    if (!controls || !grid || !cards.length) {
      return;
    }

    const searchInput = controls.querySelector('[name="q"]');
    const query = new URLSearchParams(window.location.search);
    if (searchInput && query.get("q") && !searchInput.value) {
      searchInput.value = query.get("q");
    }

    function cardScore(card, sortValue) {
      switch (sortValue) {
        case "title":
          return card.dataset.title || "";
        case "featured":
          return `${card.dataset.featured === "true" ? "0" : "1"}-${card.dataset.sortDate || ""}`;
        case "newest":
        default:
          return card.dataset.sortDate || "";
      }
    }

    function sortCards(sortValue, filteredCards) {
      const sorted = [...filteredCards].sort((a, b) => {
        if (sortValue === "title") {
          return (a.dataset.title || "").localeCompare(b.dataset.title || "");
        }

        if (sortValue === "featured") {
          const aFeatured = a.dataset.featured === "true" ? 1 : 0;
          const bFeatured = b.dataset.featured === "true" ? 1 : 0;
          if (aFeatured !== bFeatured) {
            return bFeatured - aFeatured;
          }
        }

        return (b.dataset.sortDate || "").localeCompare(a.dataset.sortDate || "");
      });

      sorted.forEach((card) => grid.appendChild(card));
      return sorted;
    }

    function applyFilters(resetReveal) {
      if (resetReveal) {
        revealCount = pageSize;
      }

      const formData = new FormData(controls);
      const searchTerm = String(formData.get("q") || "").trim().toLowerCase();
      const collectionValue = String(formData.get("collection") || "");
      const seasonValue = String(formData.get("season") || "");
      const regionValue = String(formData.get("region") || "");
      const orientationValue = String(formData.get("orientation") || "");
      const featuredOnly = String(formData.get("featured") || "") === "on";
      const sortValue = String(formData.get("sort") || "newest");

      const filtered = cards.filter((card) => {
        const matchesSearch = !searchTerm || (card.dataset.search || "").includes(searchTerm);
        const matchesCollection = !collectionValue || (card.dataset.collections || "").split("|").includes(collectionValue);
        const matchesSeason = !seasonValue || card.dataset.season === seasonValue;
        const matchesRegion = !regionValue || card.dataset.region === regionValue;
        const matchesOrientation = !orientationValue || card.dataset.orientation === orientationValue;
        const matchesFeatured = !featuredOnly || card.dataset.featured === "true";
        return matchesSearch && matchesCollection && matchesSeason && matchesRegion && matchesOrientation && matchesFeatured;
      });

      const sorted = sortCards(sortValue, filtered);

      cards.forEach((card) => {
        card.hidden = true;
      });

      sorted.forEach((card, index) => {
        card.hidden = index >= revealCount;
      });

      if (summary) {
        const hiddenCount = Math.max(sorted.length - Math.min(sorted.length, revealCount), 0);
        summary.textContent = hiddenCount > 0
          ? `Showing ${Math.min(sorted.length, revealCount)} of ${sorted.length} matching photos.`
          : `Showing ${sorted.length} matching photos.`;
      }

      if (emptyState) {
        emptyState.hidden = sorted.length !== 0;
      }

      if (loadMoreButton) {
        loadMoreButton.hidden = sorted.length <= revealCount;
      }
    }

    controls.addEventListener("input", () => applyFilters(true));
    controls.addEventListener("change", () => applyFilters(true));

    if (loadMoreButton) {
      loadMoreButton.addEventListener("click", () => {
        revealCount += pageSize;
        applyFilters(false);
      });
    }

    applyFilters(true);
  }

  initTheme();
  initThemeToggle();
  initMobileNav();
  initGalleryEnhancements();
})();
