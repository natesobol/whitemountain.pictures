import { escapeAttribute, escapeHtml, humanize, pluralize, toSentence } from "./utils.js";

export function renderCollectionCard(collection, { compact = false } = {}) {
  const badges = [
    collection.featured ? `<span class="badge badge--feature">Featured</span>` : "",
    collection.status ? `<span class="badge">${escapeHtml(humanize(collection.status))}</span>` : ""
  ]
    .filter(Boolean)
    .join("");

  return `
    <article class="collection-card ${compact ? "collection-card--compact" : ""}">
      <a class="collection-card__media" href="${escapeAttribute(collection.url)}">
        <img
          src="${escapeAttribute(collection.coverImage)}"
          alt="${escapeAttribute(collection.title)} collection cover"
          width="1600"
          height="1067"
          loading="lazy"
          decoding="async"
        />
      </a>
      <div class="collection-card__body">
        <div class="collection-card__badges">${badges}</div>
        <h3><a href="${escapeAttribute(collection.url)}">${escapeHtml(collection.title)}</a></h3>
        <p class="collection-card__subtitle">${escapeHtml(collection.subtitle)}</p>
        <p>${escapeHtml(collection.description)}</p>
        <div class="pill-list">
          ${collection.tags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}
        </div>
        <div class="collection-card__meta">
          <span>${escapeHtml(pluralize(collection.photos.length, "photo"))}</span>
          <span>${escapeHtml(toSentence(collection.seasonHints))}</span>
        </div>
      </div>
    </article>
  `;
}
