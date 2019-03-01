TerriaMap can be deployed in almost any environment.

First, you may want to build a minified version of TerriaMap by running:

```
npm run gulp release
```

The normal build (`npm run gulp`) can be deployed as well, but the release version is smaller and faster.

Then, you can host your TerriaMap using either the included Node.js-based web server, or by using any web server of your choosing.

### Using the included Node.js-based web server

The easiest way to deploy your TerriaMap is to use the included Node.js-based web server, called [terriajs-server](https://github.com/TerriaJS/terriajs-server).  You'll need Node.js 8.0+ installed on the server in order to run terriajs-server.  

Then, copy the following files and directories from your local system where you built TerriaMap onto the server:

* `wwwroot`
* `node_modules`
* `devserverconfig.json`

And on the server, change to the directory where you copied those files and directories and run:

```
./node_modules/terriajs-server/run_server.sh --config-file devserverconfig.json
```

The server will start on port 3001.  You can specify a different port by adding `--port 1234` to the command-line above.

It is usually a good idea to run another web server, such as [nginx](https://nginx.org/en/) or [Varnish](https://varnish-cache.org/) on port 80 and then reverse-proxy to the Node.js server, rather than running terriajs-server on port 80 directly.   You will find a varnish VCL file with the TerriaMap source code in the [deploy/varnish directory](https://github.com/TerriaJS/TerriaMap/tree/master/deploy/varnish).  In addition to acting as a reverse proxy for the Node.js server, the supplied Varnish configuration also caches requests to proxied map data in order to improve performance.

### Using any web server

[terriajs-server](https://github.com/TerriaJS/terriajs-server), described above, only does a few things:

1. It serves up the static HTML, JavaScript, and CSS that make up the application.
2. It includes a simple service at `/proxy` that allows TerriaJS to access geospatial data servers that don't support [CORS](../connecting-to-data/cross-origin-resource-sharing.md).  If this service is not available, TerriaJS won't be able to access any datasets that are on other servers and that don't support CORS.
3. It includes another service at `/convert` that uses [GDAL](http://www.gdal.org/) and OGR to transform otherwise unsupported geospatial vector data (e.g. shapefiles) to GeoJSON for display by the TerriaJS client.  If this service is not available, these data formats will not be supported.  However, all the [formats that TerriaJS supports directly](../connecting-to-data/catalog-items.md) will work just fine.
* When configured correctly, it persists blobs of JSON for use in the sharing feature.  If this service is not available, the JSON can be stored in the share URL, instead.  However, this makes for some extremely long URLs.

If these limitations are acceptable, you can run your TerriaMap on virtually any web server by simply copying the TerriaMap `wwwroot` onto the server!

You can also incrementally add these services to your own server, as necessary, by porting the code in [terriajs-server](https://github.com/TerriaJS/terriajs-server) to your environment.
