import { escapeAttribute, escapeHtml } from "./utils.js";

function isActive(item, currentPath) {
  if (item.href === "/") {
    return currentPath === "/";
  }

  return (item.matchPrefixes || []).some((prefix) => currentPath === prefix || currentPath.startsWith(prefix));
}

export function renderNavbar({ site, navigation, collections, currentPath }) {
  const featuredCollections = collections.filter((collection) => collection.featured).slice(0, 4);

  const navLinks = navigation.primary
    .map((item) => {
      const activeClass = isActive(item, currentPath) ? "is-active" : "";
      if (item.dropdown === "featuredCollections") {
        return `
          <div class="site-nav__dropdown">
            <a class="site-nav__link ${activeClass}" href="${escapeAttribute(item.href)}">${escapeHtml(item.label)}</a>
            <div class="site-nav__submenu">
              <p class="site-nav__submenu-heading">Featured collections</p>
              ${featuredCollections
                .map((collection) => `<a href="${escapeAttribute(collection.url)}">${escapeHtml(collection.title)}</a>`)
                .join("")}
              <a href="/collections" class="site-nav__submenu-all">View every collection</a>
            </div>
          </div>
        `;
      }

      return `<a class="site-nav__link ${activeClass}" href="${escapeAttribute(item.href)}">${escapeHtml(item.label)}</a>`;
    })
    .join("");

  return `
    <header class="site-header">
      <div class="container">
        <nav class="site-nav" aria-label="Main navigation">
          <a class="site-brand" href="/">
            <img class="site-brand__mark" src="/icons/logo-mark.svg" alt="" width="64" height="64" />
            <span class="site-brand__copy">
              <span class="site-brand__title">${escapeHtml(site.brandName)}</span>
              <span class="site-brand__tagline">${escapeHtml(site.tagline)}</span>
            </span>
          </a>

          <button
            class="site-nav__toggle"
            type="button"
            data-nav-toggle
            aria-expanded="false"
            aria-controls="site-nav-panel"
          >
            Menu
          </button>

          <div class="site-nav__panel" id="site-nav-panel" data-nav-panel>
            <div class="site-nav__links">${navLinks}</div>

            <div class="site-nav__actions">
              <form class="site-nav__search" action="${escapeAttribute(navigation.headerSearch.action)}" method="get" role="search">
                <label class="sr-only" for="site-nav-search">Search the gallery</label>
                <input
                  id="site-nav-search"
                  type="search"
                  name="${escapeAttribute(navigation.headerSearch.inputName)}"
                  placeholder="${escapeAttribute(navigation.headerSearch.placeholder)}"
                />
                <button class="button button--ghost button--small" type="submit">Search</button>
              </form>

              <button class="button button--ghost button--small" type="button" data-theme-toggle aria-pressed="false">
                Theme
                <span data-theme-label>Dark</span>
              </button>

              <a class="button button--primary button--small" href="${escapeAttribute(navigation.cta.href)}">${escapeHtml(navigation.cta.label)}</a>
            </div>
          </div>
        </nav>
      </div>
    </header>
  `;
}

