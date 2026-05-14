/* ══════════════════════════════════════
   MTEC — Generic Partial Loader
   Fetches HTML fragments and mounts them at a target element.
   Rewrites relative href/src so partials work from subdirectory
   pages (e.g. /servicios/*.html).
   ══════════════════════════════════════ */
(function () {
  const MTEC = (window.MTEC = window.MTEC || {});

  /* Compute path prefix based on current page depth.
     /index.html              → ''
     /servicios/foo.html      → '../'
     /a/b/c.html              → '../../'  */
  function computePrefix() {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    const fileCount = path.endsWith('/') ? 0 : 1;
    const depth = Math.max(0, segments.length - fileCount);
    return '../'.repeat(depth);
  }

  /* Rewrite href/src on relative URLs inside a fetched HTML string.
     Skips absolute (http, /, #), protocol-relative (//), mailto, tel,
     and URLs already prefixed with ../ to avoid double-prefixing. */
  function rewriteRelativePaths(html, prefix) {
    if (!prefix) return html;
    return html.replace(
      /\b(href|src)="(?!https?:|\/|#|mailto:|tel:|\.\.\/)([^"]+)"/g,
      (_, attr, url) => `${attr}="${prefix}${url}"`
    );
  }

  MTEC.computePrefix = computePrefix;
  MTEC.rewriteRelativePaths = rewriteRelativePaths;

  /* Track pending mounts so MTEC.ready() can wait for all of them. */
  const pending = [];

  /**
   * Load a partial HTML file and replace the mount element's outerHTML
   * with it. Returns a Promise that resolves when the swap is complete.
   *
   * @param {string} mountSelector — querySelector for the mount placeholder
   * @param {string} partialPath   — path relative to the site root
   * @returns {Promise<void>}
   */
  MTEC.loadPartial = function (mountSelector, partialPath) {
    const mount = document.querySelector(mountSelector);
    if (!mount) {
      console.warn('[partials] mount not found:', mountSelector);
      return Promise.resolve();
    }
    // Guard against double-mounting
    if (mount.dataset.mounted === '1') return Promise.resolve();
    mount.dataset.mounted = '1';

    const prefix = computePrefix();
    const p = fetch(prefix + partialPath, { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(partialPath + ' ' + r.status);
        return r.text();
      })
      .then((html) => {
        mount.outerHTML = rewriteRelativePaths(html, prefix);
      })
      .catch((err) => console.error('[partials] failed to load', partialPath, err));

    pending.push(p);
    return p;
  };

  /**
   * Resolves when every loadPartial() call up to this point has finished.
   * Useful for orchestrating post-mount initialisation (reveals, etc.).
   */
  MTEC.ready = function () {
    return Promise.all(pending);
  };
})();
