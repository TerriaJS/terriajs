To configure TerriaMap to run correctly through a reverse proxy that prefixes a path to URLs you should pass a `baseHref` parameter to any `gulp` "build" task that you run.

E.g. if your map is accessible at http://example.com/my/terriamap/

```bash
yarn gulp release --baseHref="/my/terriamap/"
```

This paramter can be passed to any `gulp` "build" task:

- `default` (this runs when you call `gulp` without a task)
- `build`
- `release`
- `watch`

_Note that Terria's server doesn't do any path rewriting. This must be used in conjunction with a reverse proxy which does the path rewriting (so that terriajs-server gets a request for `/index.html` when the browser requests `http://example.com/my/terriamap/index.html`)._
