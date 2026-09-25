/* Dev-only live reload for jasmine-browser-runner.
 *
 * Polls the spec bundle's build id (its mtime, served at /__build_id__) and
 * reloads the tab whenever it changes. Combined with `webpack --watch`, saving
 * a spec or source file rebuilds the bundle and the browser re-runs the suite
 * automatically. Enabled only when SPEC_LIVERELOAD is set (see the `dev` script
 * in package.json).
 */
(function () {
  var endpoint = "/__build_id__";
  var known = null;
  function tick() {
    fetch(endpoint, { cache: "no-store" })
      .then(function (response) {
        return response.text();
      })
      .then(function (id) {
        if (known === null) {
          known = id;
        } else if (id !== known) {
          window.location.reload();
        }
      })
      .catch(function () {
        /* server momentarily unavailable during a rebuild — ignore */
      })
      .then(function () {
        window.setTimeout(tick, 1000);
      });
  }
  tick();
})();
