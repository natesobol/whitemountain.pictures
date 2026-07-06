import { escapeAttribute, escapeHtml, joinClasses } from "./utils.js";

export function renderHero({
  eyebrow = "",
  title,
  description = "",
  actions = [],
  meta = [],
  mediaHtml = "",
  className = "",
  compact = false,
  supportingHtml = ""
}) {
  const actionMarkup = actions.length
    ? `
      <div class="hero__actions">
        ${actions
          .map((action) => `<a class="${escapeAttribute(action.className || "button button--primary")}" href="${escapeAttribute(action.href)}">${escapeHtml(action.label)}</a>`)
          .join("")}
      </div>
    `
    : "";

  const metaMarkup = meta.length
    ? `
      <div class="hero__meta">
        ${meta
          .map((item) => `
            <div class="hero__stat">
              <span class="hero__stat-value">${escapeHtml(item.value)}</span>
              <span class="hero__stat-label">${escapeHtml(item.label)}</span>
            </div>
          `)
          .join("")}
      </div>
    `
    : "";

  const mediaMarkup = mediaHtml
    ? `<div class="hero__media">${mediaHtml}</div>`
    : "";

  return `
    <section class="${joinClasses("hero", compact ? "hero--compact" : "", className)}">
      <div class="container hero__grid">
        <div class="hero__copy">
          ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ""}
          <h1>${escapeHtml(title)}</h1>
          ${description ? `<p class="hero__lede">${escapeHtml(description)}</p>` : ""}
          ${supportingHtml}
          ${actionMarkup}
          ${metaMarkup}
        </div>
        ${mediaMarkup}
      </div>
    </section>
  `;
}

