import { renderPhotoCard } from "./photo-card.js";
import { joinClasses } from "./utils.js";

export function renderGalleryGrid(photos, { interactive = false, pageSize = 18, className = "", compactCards = false } = {}) {
  const attrs = interactive ? `data-gallery-grid data-page-size="${pageSize}"` : "";
  return `
    <div class="${joinClasses("photo-grid", className)}" ${attrs}>
      ${photos.map((photo) => renderPhotoCard(photo, { compact: compactCards })).join("")}
    </div>
  `;
}

