export function error404(show404, wwwroot, serveWwwRoot) {
  return (_req, res) => {
    if (show404) {
      res.status(404).sendFile("/404.html", { root: wwwroot });
    } else if (serveWwwRoot) {
      // Redirect unknown pages back home.
      res.redirect(303, "/");
    } else {
      res.status(404).send("No TerriaJS website here.");
    }
  };
}

export function error500(show500, wwwroot) {
  return (error, _req, res) => {
    console.error(error);
    if (show500) {
      res.status(500).sendFile("/500.html", { root: wwwroot });
    } else {
      res.status(500).send("500: Internal Server Error");
    }
  };
}
