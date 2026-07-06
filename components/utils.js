export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function escapeAttribute(value = "") {
  return escapeHtml(value);
}

export function absoluteUrl(siteOrHost, pathname = "/") {
  const host = typeof siteOrHost === "string"
    ? siteOrHost
    : siteOrHost.canonicalHost || siteOrHost.domain;

  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `https://${host}${normalizedPath === "/" ? "/" : normalizedPath}`;
}

export function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  try {
    let value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split("-").map(Number);
      value = new Date(year, month - 1, day);
    } else {
      value = new Date(dateString);
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(value);
  } catch {
    return dateString;
  }
}

export function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function truncate(text = "", limit = 160) {
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit - 1).trimEnd()}…`;
}

export function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function toSentence(values = []) {
  return values.filter(Boolean).join(", ");
}

export function humanize(value = "") {
  return String(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
