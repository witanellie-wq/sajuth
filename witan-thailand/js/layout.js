/* Witan Thailand — header & footer injection.
 * Pages declare:
 *   <div data-layout="header"></div>
 *   <div data-layout="footer"></div>
 * This script fills them before i18n.js applies translations.
 *
 * `data-base` attribute on the placeholder may set a relative prefix
 * (e.g. "../") used for nav links from sub-folders.
 */
(function () {
  function header(base) {
    return `
      <header class="site-header">
        <div class="container">
          <a class="brand" href="${base}index.html">
            <span class="brand__mark">Witan</span>
            <span class="brand__sub">Thailand</span>
          </a>
          <nav class="nav" aria-label="Primary">
            <ul class="nav__list">
              <li><a class="nav__link" href="${base}index.html" data-i18n="nav.home">Home</a></li>
              <li><a class="nav__link" href="${base}about.html" data-i18n="nav.about">About</a></li>
              <li><a class="nav__link" href="${base}services.html" data-i18n="nav.services">Services</a></li>
              <li><a class="nav__link" href="${base}process.html" data-i18n="nav.process">Process</a></li>
              <li><a class="nav__link" href="${base}contact.html" data-i18n="nav.contact">Contact</a></li>
            </ul>
            <div class="lang-switch" role="group" aria-label="Language">
              <button data-lang-btn="th" type="button">TH</button>
              <button data-lang-btn="en" type="button">EN</button>
              <button data-lang-btn="ko" type="button">KO</button>
            </div>
            <button class="nav-toggle" type="button" aria-label="Menu">
              <span></span><span></span><span></span>
            </button>
          </nav>
        </div>
      </header>
    `;
  }

  function footer(base) {
    return `
      <footer class="site-footer">
        <div class="container">
          <div>
            <div class="footer__brand" data-i18n="footer.brand"></div>
            <p data-i18n="footer.tagline"></p>
            <p style="font-size: 0.78rem; opacity: 0.6" data-i18n="footer.parent"></p>
          </div>
          <div class="footer__group">
            <h4 data-i18n="footer.company"></h4>
            <ul>
              <li><a href="${base}about.html" data-i18n="nav.about"></a></li>
              <li><a href="${base}process.html" data-i18n="nav.process"></a></li>
            </ul>
          </div>
          <div class="footer__group">
            <h4 data-i18n="footer.services"></h4>
            <ul>
              <li><a href="${base}services/rnd.html" data-i18n="home.services.rnd.title"></a></li>
              <li><a href="${base}services/oem.html" data-i18n="home.services.oem.title"></a></li>
              <li><a href="${base}services/fda.html" data-i18n="home.services.fda.title"></a></li>
              <li><a href="${base}services/logistics.html" data-i18n="home.services.logistics.title"></a></li>
            </ul>
          </div>
          <div class="footer__group">
            <h4 data-i18n="footer.contact"></h4>
            <ul>
              <li><a href="${base}contact.html" data-i18n="nav.contact"></a></li>
              <li>hello@witan.co.th</li>
            </ul>
          </div>
        </div>
        <div class="footer__bottom" data-i18n="footer.rights"></div>
      </footer>
    `;
  }

  function inject() {
    document.querySelectorAll("[data-layout]").forEach((el) => {
      const kind = el.getAttribute("data-layout");
      const base = el.getAttribute("data-base") || "";
      if (kind === "header") el.outerHTML = header(base);
      else if (kind === "footer") el.outerHTML = footer(base);
    });

    // On service detail pages, the body carries `data-service="rnd"`; we
    // expand `data-i18n-svc="title"` into the real path `services.rnd.title`.
    const slug = document.body.getAttribute("data-service");
    if (slug) {
      document.querySelectorAll("[data-i18n-svc]").forEach((el) => {
        const key = el.getAttribute("data-i18n-svc");
        el.setAttribute("data-i18n", `services.${slug}.${key}`);
      });
    }
  }

  // Run synchronously so i18n.js (DOMContentLoaded) sees the elements.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
