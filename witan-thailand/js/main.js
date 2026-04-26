/* Witan Thailand — UI behaviors */
(function () {
  // Mobile nav toggle
  document.addEventListener("click", (e) => {
    const toggle = e.target.closest(".nav-toggle");
    if (toggle) {
      const list = document.querySelector(".nav__list");
      if (list) list.classList.toggle("is-open");
      return;
    }
    // Close menu after a nav link tap
    if (e.target.closest(".nav__link")) {
      const list = document.querySelector(".nav__list");
      if (list && list.classList.contains("is-open")) list.classList.remove("is-open");
    }
  });

  // Highlight current nav item by pathname
  document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname.replace(/\/$/, "");
    document.querySelectorAll(".nav__link").forEach((link) => {
      const href = link.getAttribute("href").replace(/\/$/, "");
      if (
        (href === "" && (path === "" || path.endsWith("/index.html"))) ||
        (href && path.endsWith(href))
      ) {
        link.classList.add("is-active");
      }
      // Match /services/* under "services" parent link
      if (href.endsWith("services.html") && path.includes("/services/")) {
        link.classList.add("is-active");
      }
    });
  });

  // Contact form — local stub (no backend yet)
  document.addEventListener("submit", (e) => {
    const form = e.target.closest("[data-contact-form]");
    if (!form) return;
    e.preventDefault();
    const note = form.querySelector("[data-form-success]");
    if (note) note.hidden = false;
    form.reset();
  });
})();
