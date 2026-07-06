import { escapeAttribute, escapeHtml } from "./utils.js";

export function renderFooter({ site, navigation, collections }) {
  const featuredCollections = collections.filter((collection) => collection.featured).slice(0, 4);
  const currentYear = new Date().getUTCFullYear();

  return `
    <footer class="site-footer">
      <div class="container site-footer__top">
        <div class="site-footer__intro">
          <p class="eyebrow">White Mountains Pictures</p>
          <h2>${escapeHtml(site.footerNote)}</h2>
          <p>${escapeHtml(site.defaultDescription)}</p>
        </div>
        <div class="site-footer__featured panel panel--soft">
          <p class="site-footer__featured-label">Featured collections</p>
          <div class="pill-list">
            ${featuredCollections.map((collection) => `<a class="pill pill--link" href="${escapeAttribute(collection.url)}">${escapeHtml(collection.title)}</a>`).join("")}
          </div>
        </div>
      </div>

      <div class="container site-footer__grid">
        ${navigation.footerColumns
          .map((column) => `
            <section class="site-footer__column">
              <h3>${escapeHtml(column.title)}</h3>
              <ul class="link-list">
                ${column.links
                  .map((link) => `
                    <li>
                      <a href="${escapeAttribute(link.href)}"${link.external ? ' target="_blank" rel="noopener"' : ""}>
                        ${escapeHtml(link.label)}
                      </a>
                    </li>
                  `)
                  .join("")}
              </ul>
            </section>
          `)
          .join("")}
      </div>

      <div class="container site-footer__meta">
        <p>© ${currentYear} ${escapeHtml(site.author)} · ${escapeHtml(site.brandName)} · Cloudflare-first gallery build</p>
        <div class="site-footer__legal">
          ${navigation.legalLinks
            .map((link) => `<a href="${escapeAttribute(link.href)}"${link.external ? ' target="_blank" rel="noopener"' : ""}>${escapeHtml(link.label)}</a>`)
            .join("")}
        </div>
      </div>
    </footer>
  `;
}
