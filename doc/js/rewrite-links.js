document.querySelectorAll("a").forEach(function (a) {
  // For links in doc markdown pages like "/lib/Models..." or "../../lib/ReactViews/..."
  //  rewrite them and point to GitHub
  if (document.location.hostname !== new URL(a.href).hostname) return;
  m = a.href.match("/lib/(.+)$");
  if (m) {
    a.href = "https://github.com/TerriaJS/terriajs/blob/main/lib/" + m[1];
    a.target = "_blank";
    a.rel = "noreferrer noopener";
  }
});
