"use strict";
document.querySelectorAll("a").forEach(function (a) {
  // For links in doc markdown pages like "/lib/Models..." or "../../lib/ReactViews/..."
  //  rewrite them and point to GitHub
  try {
    // Wrap use of URL constructor in try catch
    if (document.location.hostname !== new URL(a).hostname) return;
    const m = a.href.match("/lib/(.+)$");
    if (m) {
      a.href = "https://github.com/TerriaJS/terriajs/blob/main/lib/" + m[1];
      a.target = "_blank";
      a.rel = "noreferrer noopener";
    }
  } catch {
    /* eslint-disable-line no-empty */
  }
});
