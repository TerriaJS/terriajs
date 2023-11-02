To ensure that TerriaJS is able to access your data, you must add all servers you intend to access to `devserverconfig.json`'s `allowProxyFor` list. This "whitelist" authorizes the proxy to work with those servers.

Failing to do this may result in an error like this:

`...the server does not support CORS. If this is your server, verify that CORS is enabled and enable it if it is not. If you do not control the server, please contact the administrator of the server and ask them to enable CORS. Or ... ask us to add this server to the list of non-CORS-supporting servers that may be proxied.`

Next, you should add servers that _do_ support Cross-Origin Resource Sharing (CORS) to the `corsDomains` list in your [initialization file](../customizing/initialization-files.md). Servers in this list are contacted directly instead of going through the proxy... except:

- if an HTTPS web page is accessing an HTTP server (this way we avoid a mixed content warning from the browser).

If your server does _not_ support CORS, then you still need to add it to the `allowProxyFor` whitelist, but do not add it to the `corsDomains` list. It will then be proxied.

Sometimes we deliberately exclude CORS-supporting servers from the `corsDomains` list; the proxy caches its data, so we leverage its caching to improve performance.

In both lists, a server name `foo.org` will be interpreted as `*.foo.org`. The port must match exactly. It's not very smart, so if you specify port 80 that won't match a server without a port specified, and vice-versa.

The downside to a permissive whitelist is that you'll proxy for more servers, and people could use your proxy to make their (malicious?) traffic look like it's coming from your server instead of from theirs.

## More Detailed Explanation

As a general rule, web browsers do not allow web sites running on one host (e.g. `nationalmap.gov.au`) from accessing data running on another host (e.g. `data.gov.au`) unless the data server (`data.gov.au` in our example) explicitly enables a feature called Cross-Origin Resource Sharing (CORS) by including a special HTTP header in its response. Unfortunately, many servers still do not support CORS. If you control the server you're trying to access data on, enabling CORS is almost certainly a good idea, and you can read more about how to do it at [enable-cors.org](http://enable-cors.org/).

TerriaJS has a trick to allow it to access data from a server even if that server doesn't support CORS: it uses a proxy server built into [terriajs-server](https://github.com/TerriaJS/terriajs-server), which is included with TerriaMap. The idea is simple: we avoid the need for cross-origin support from servers by running a proxy on the same host that runs our app. That proxy can make requests to _other_ servers on our application's behalf. This works because cross-origin restrictions are a security feature of web browsers, not web servers. The proxy makes it look to the browser like the data comes from the same origin. There's nothing dodgy about this. The risks that browsers are defending against by imposing cross-origin restrictions are not present in this scenario.

However, by running a proxy server, our TerriaMap server potentially opens itself up to risks. We don't want people to be able to bounce arbitrary requests through our proxy, because that could be used to make (malicious?) traffic look like it is coming from your server instead of from the real source. This is why `terriajs-server` uses a whitelist of servers that it is willing to proxy for. The `allowProxyFor` property in `devserverconfig.json` specifies the whitelist. If the server is asked to proxy for any server not in the whitelist, the request will be rejected.

## Specify an alternative proxy server URL

The data service proxied by TerriaJS-Server is inherently public to any users. In the case that a data service must be restricted to certain authorised users, use an alternative proxy server that enforces required access control and ideally the hostname of server that provides non-public data service should be removed from `allowProxyFor` list.

If using the proxy service of magda-datastore-api that enforces access control, a proxy URL with pattern `/api/v0/data/proxy/<record id>` should be prepended before the proxied URL.

An example using alternative proxy URL `/api/v0/data/proxy/senaps-locations-as-private-record` to proxy senaps service at `https://senaps.io/api/sensor/v2` follows.

```
{
    "id": "senaps-locations-as-private-record",
    "type": "senaps-locations",
    "definition": {
        "url": "/api/v0/data/proxy/senaps-locations-as-private-record/https://senaps.io/api/sensor/v2",
        "name": "Observations",
        "description": "Demonstrate that the catalog is shown as private and the underlying data also requires private api key.",
        "dataCustodian": "Some custodian",
        "locationIdFilter": "some location id"
    }
}
```

Another example using alternative proxy URL `/api/v0/data/proxy/<record id>` to proxy a geoserver service follows.

```
{
    "id": "<record id>",
    "type": "wms",
    "definition": {
        "url": "/api/v0/data/proxy/<record id>/https://<hostname>/geoserver/<namespace>/ows",
        "name": "some name",
        "layers": "somelayer",
        "legends": [
            {
                "url": "/api/v0/data/proxy/<record id>/https://<hostname>/geoserver/<namespace>/ows?service=WMS&request=GetLegendGraphic&format=image/png&width=20&height=20&layer=<namespace>%3Asomelayer"
            }
        ],
        "getCapabilitiesUrl": "/api/v0/data/proxy/<record id>/https://<hostname>/geoserver/<namespace>/ows?service=WMS&version=1.3.0&request=GetCapabilities"
    }
}
```
