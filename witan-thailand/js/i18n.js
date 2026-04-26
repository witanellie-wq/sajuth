/* Witan Thailand — lightweight i18n
 * Loads /locales/<lang>.json and applies translations to elements with
 * `data-i18n="path.to.key"`. Default: th. Persists user choice in localStorage.
 */
(function () {
  const SUPPORTED = ["th", "en", "ko"];
  const DEFAULT_LANG = "th";
  const STORAGE_KEY = "witan_lang";

  // Resolve base path so the script works from /index.html and /services/foo.html.
  function localesBase() {
    const path = window.location.pathname;
    // If we're inside /services/ or any 1-deep folder, go up one level.
    const depth = path.split("/").filter(Boolean).length;
    const inFile = /\.html?$/.test(path);
    const folders = inFile ? depth - 1 : depth;
    return folders >= 1 ? "../locales/" : "locales/";
  }

  function getLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
    const url = new URL(window.location.href).searchParams.get("lang");
    if (url && SUPPORTED.includes(url)) return url;
    const nav = (navigator.language || "").slice(0, 2).toLowerCase();
    if (SUPPORTED.includes(nav)) return nav;
    return DEFAULT_LANG;
  }

  function setLang(lang) {
    if (!SUPPORTED.includes(lang)) return;
    localStorage.setItem(STORAGE_KEY, lang);
    apply(lang);
  }

  function resolve(obj, path) {
    return path.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
  }

  async function load(lang) {
    const url = `${localesBase()}${lang}.json`;
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    return res.json();
  }

  function applyTranslations(dict) {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = resolve(dict, key);
      if (val == null) return;
      if (Array.isArray(val)) {
        // Render arrays into <li> children
        el.innerHTML = val.map((v) => `<li>${escapeHtml(v)}</li>`).join("");
      } else if (typeof val === "string") {
        el.textContent = val;
      }
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      // Format: "attr:key,attr:key"
      const spec = el.getAttribute("data-i18n-attr");
      spec.split(",").forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        const val = resolve(dict, key);
        if (typeof val === "string") el.setAttribute(attr, val);
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  async function apply(lang) {
    try {
      const dict = await load(lang);
      document.documentElement.setAttribute("lang", dict.meta?.lang || lang);
      document.title = `${dict.meta?.siteName || "Witan Thailand"} — ${
        document.body.dataset.pageTitle
          ? resolve(dict, document.body.dataset.pageTitle) || dict.meta?.tagline
          : dict.meta?.tagline || ""
      }`;
      applyTranslations(dict);
      // Update language switch active state
      document.querySelectorAll("[data-lang-btn]").forEach((b) => {
        b.classList.toggle("is-active", b.getAttribute("data-lang-btn") === lang);
      });
      // Re-emit a custom event so pages can hook in if needed
      document.dispatchEvent(new CustomEvent("i18n:applied", { detail: { lang, dict } }));
    } catch (err) {
      console.error("[i18n]", err);
    }
  }

  // Wire language switch buttons
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lang-btn]");
    if (!btn) return;
    setLang(btn.getAttribute("data-lang-btn"));
  });

  // Init
  document.addEventListener("DOMContentLoaded", () => apply(getLang()));

  // Expose for debugging
  window.WitanI18n = { setLang, getLang, apply };
})();
