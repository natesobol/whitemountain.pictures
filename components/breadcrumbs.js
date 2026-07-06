import { escapeAttribute, escapeHtml } from "./utils.js";

export function renderBreadcrumbs(items = []) {
  if (!items.length) {
    return "";
  }

  const content = items
    .map((item, index) => {
      const isLast = index === items.length - 1;
      if (isLast) {
        return `<li><span aria-current="page">${escapeHtml(item.label)}</span></li>`;
      }

      return `<li><a href="${escapeAttribute(item.href)}">${escapeHtml(item.label)}</a></li>`;
    })
    .join("");

  return `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <ol>${content}</ol>
    </nav>
  `;
}

