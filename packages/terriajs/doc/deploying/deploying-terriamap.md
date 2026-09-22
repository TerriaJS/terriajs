TerriaMap can be deployed in almost any environment.

First, you may want to build a minified version of TerriaMap by running:

```
yarn gulp release
```

The normal build (`yarn gulp`) can be deployed as well, but the release version is smaller and faster.

Then, you can host your TerriaMap using either the included Node.js-based web server, or by using any web server of your choosing.

### Using the included Node.js-based web server

The easiest way to deploy your TerriaMap is to use the included Node.js-based web server, called [terriajs-server](https://github.com/TerriaJS/terriajs-server). Check the installed TerriaJS Server package for its supported Node.js versions; current releases require Node.js 22 or later.

Then, copy the following files and directories from your local system where you built TerriaMap onto the server:

- `wwwroot`
- production dependencies;
- a production TerriaJS Server configuration file.

Do not commit private credentials to the repository or place them under
`wwwroot`. Supply server credentials through protected configuration or the
secret-management mechanism provided by the deployment platform.

On the server, change to the directory where you copied the application and run:

```
NODE_ENV=production terriajs-server --config-file serverconfig.json
```

The server will start on port 3001. You can specify a different port by adding ` --port 1234`.

TerriaJS Server supports HTTPS directly, but production deployments should normally terminate TLS at a reverse proxy, ingress controller, or managed load balancer in front of TerriaJS Server. Prevent direct public access to the TerriaJS Server port and configure forwarded headers and Express `trustProxy` for the actual proxy topology. See [Security and production deployment](security.md#https-and-reverse-proxies).

### Production ready TerriaMap

While we recommend using Docker or [Kubernetes](./deploying-with-kubernetes.md) to run a production ready TerriaMap, other tools such as [PM2](https://pm2.keymetrics.io/docs/usage/quick-start/) can be used to run terriajs-server as a production ready web application.

An example PM2 Ecosystem File can be found at `deploy/ecosystem-example.config.js`.

```bash
npm install -g pm2@latest

pm2 start deploy/ecosystem-example.config.js --update-env --env production
```

### Using any web server

[terriajs-server](https://github.com/TerriaJS/terriajs-server), described above, only does a few things:

1. It serves up the static HTML, JavaScript, and CSS that make up the application.
2. It includes a simple service at `/proxy` that allows TerriaJS to access geospatial data servers that don't support [CORS](../connecting-to-data/cross-origin-resource-sharing.md). If this service is not available, TerriaJS won't be able to access any datasets that are on other servers and that don't support CORS.
3. When configured correctly, it persists blobs of JSON for use in the sharing feature. If this service is not available, the JSON can be stored in the share URL, instead. However, this makes for some extremely long URLs.
4. If configured with `singlePageRouting` options it will serve up index.html for unmatched paths to allow for client side routes to be configured.

If points 2 - 4 above are not required, you can run your TerriaMap on virtually any web server by simply copying the TerriaMap `wwwroot` onto the server!

You can also incrementally add these services to your own server, as necessary, by porting the code in [terriajs-server](https://github.com/TerriaJS/terriajs-server) to your environment.
