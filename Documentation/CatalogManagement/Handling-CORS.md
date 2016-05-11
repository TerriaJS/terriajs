## Handling Cross-Origin-Resource-Sharing (CORS) issues

A common problem when you add a new data source to TerriaJS is this error:

`...the server does not support CORS. If this is your server, verify that CORS is enabled and enable it if it is not. If you do not control the server, please contact the administrator of the server and ask them to enable CORS. Or ... ask us to add this server to the list of non-CORS-supporting servers that may be proxied.`

To resolve this, you need to add all servers you intend to access to `wwwroot/config.json`'s `proxyDomains` list. This "whitelist" authorizes the proxy to work with those servers. *Even servers that support CORS should be in that list because IE9 doesn't support CORS, so it needs the proxy for all cross-origin requests.*

Then, you should add servers that *do* support CORS to the `wwwroot\init\xyz.json`'s `corsDomains` list. Servers in this list are contacted directly instead of going through the proxy... except:
- in IE9
- if an HTTPS web page is accessing an HTTP server (this way we avoid a mixed content warning from the browser).

If your server does *not* support CORS, then you still need to add it to the `proxyDomains` whitelist, but do not add it to the `corsDomains` list. It will then be proxied.

Sometimes we deliberately exclude CORS-supporting servers from the `corsDomains` list; the proxy caches its data, so we leverage its caching to improve performance.

In both lists, a server name `foo.org` can be interpreted as `*.foo.org`. The port must match exactly. It's not very smart, so if you specify port 80 that won't match a server without a port specified, and vice-versa.

The downside to a permissive whitelist is that you'll proxy for more servers, and people could use your proxy to make their (malicious?) traffic look like it's coming from your server instead of from theirs.
