import { escapeAttribute, escapeHtml, formatDate, joinClasses } from "./utils.js";

function buildSearchText(photo) {
  const collections = photo.collections.map((collection) => collection.title);
  return [
    photo.title,
    photo.description,
    photo.locationName,
    photo.mountain,
    photo.region,
    photo.season,
    ...photo.tags,
    ...collections
  ]
    .join(" ")
    .toLowerCase();
}

export function renderPhotoCard(photo, { compact = false } = {}) {
  const collectionBadges = photo.collections
    .slice(0, compact ? 1 : 2)
    .map((collection) => `<a class="pill pill--link" href="${escapeAttribute(collection.url)}">${escapeHtml(collection.title)}</a>`)
    .join("");

  return `
    <article
      class="${joinClasses("photo-card", compact ? "photo-card--compact" : "")}"
      data-photo-card
      data-title="${escapeAttribute(photo.title)}"
      data-sort-date="${escapeAttribute(photo.sortDate)}"
      data-season="${escapeAttribute(photo.season)}"
      data-region="${escapeAttribute(photo.region)}"
      data-orientation="${escapeAttribute(photo.orientation)}"
      data-featured="${escapeAttribute(String(photo.featured))}"
      data-collections="${escapeAttribute(photo.collectionIds.join("|"))}"
      data-search="${escapeAttribute(buildSearchText(photo))}"
      style="--photo-ratio: ${photo.width} / ${photo.height};"
    >
      <a class="photo-card__media" href="${escapeAttribute(photo.url)}">
        <img
          src="${escapeAttribute(photo.thumbUrl)}"
          alt="${escapeAttribute(photo.alt)}"
          width="${escapeAttribute(photo.width)}"
          height="${escapeAttribute(photo.height)}"
          loading="lazy"
          decoding="async"
        />
        ${photo.featured ? '<span class="badge badge--feature photo-card__feature-flag">Featured</span>' : ""}
      </a>
      <div class="photo-card__body">
        <div class="photo-card__pills">${collectionBadges}</div>
        <h3><a href="${escapeAttribute(photo.url)}">${escapeHtml(photo.title)}</a></h3>
        <p>${escapeHtml(photo.description)}</p>
        <div class="photo-card__meta">
          <span>${escapeHtml(photo.locationName)}</span>
          <span>${escapeHtml(photo.region)}</span>
          <span>${escapeHtml(formatDate(photo.sortDate))}</span>
        </div>
      </div>
    </article>
  `;
}

