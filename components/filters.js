import { escapeAttribute, escapeHtml, humanize } from "./utils.js";

function renderOptions(values, selectedValue = "") {
  return values
    .map((value) => `<option value="${escapeAttribute(value)}"${value === selectedValue ? " selected" : ""}>${escapeHtml(humanize(value))}</option>`)
    .join("");
}

export function renderFilters({ options, collections }) {
  return `
    <form class="filters" data-gallery-controls>
      <div class="filters__grid">
        <label class="field">
          <span class="field__label">Search</span>
          <input type="search" name="q" placeholder="Search title, tag, location, or mountain" />
        </label>

        <label class="field">
          <span class="field__label">Collection</span>
          <select name="collection">
            <option value="">All collections</option>
            ${collections.map((collection) => `<option value="${escapeAttribute(collection.id)}">${escapeHtml(collection.title)}</option>`).join("")}
          </select>
        </label>

        <label class="field">
          <span class="field__label">Season</span>
          <select name="season">
            <option value="">All seasons</option>
            ${renderOptions(options.seasons)}
          </select>
        </label>

        <label class="field">
          <span class="field__label">Region</span>
          <select name="region">
            <option value="">All regions</option>
            ${renderOptions(options.regions)}
          </select>
        </label>

        <label class="field">
          <span class="field__label">Orientation</span>
          <select name="orientation">
            <option value="">All formats</option>
            ${renderOptions(options.orientations)}
          </select>
        </label>

        <label class="field">
          <span class="field__label">Sort</span>
          <select name="sort">
            <option value="newest">Newest</option>
            <option value="featured">Featured first</option>
            <option value="title">Title</option>
          </select>
        </label>
      </div>

      <div class="filters__footer">
        <label class="check-field">
          <input type="checkbox" name="featured" />
          <span>Featured only</span>
        </label>
        <div class="pill-list">
          ${collections
            .filter((collection) => collection.featured)
            .map((collection) => `<a class="pill pill--link" href="${escapeAttribute(collection.url)}">${escapeHtml(collection.title)}</a>`)
            .join("")}
        </div>
      </div>
    </form>
  `;
}
