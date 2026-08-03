# Security and production deployment

This guide describes the security-related configuration that operators should
review when deploying a TerriaJS application. For the complete set of backend
options, see the
[TerriaJS Server example configuration](https://github.com/TerriaJS/terriajs-server/blob/master/serverconfig.json.example).

## Production checklist

Before making a deployment public:

- Serve the application only over HTTPS, with TLS terminated by a reverse
  proxy, ingress controller, or load balancer in front of TerriaJS Server.
- Configure `hostName`, `trustedHosts`, and Express `trustProxy` for the actual
  deployment topology.
- Decide which sites may frame the application.
- Configure `parentMessageAllowedOrigins` only if a parent page or opener needs
  to control TerriaJS using cross-window messages.
- Review Content Security Policy reports before changing CSP from report-only
  to enforcement mode.
- Replace Cesium's default ion token and restrict all browser-visible tokens.
- Store credentials that must remain private in server-side configuration, not
  in TerriaJS client configuration.
- Assign ownership and a rotation procedure to every token used by the
  deployment.

## HTTPS and reverse proxies

TerriaJS Server supports serving HTTPS directly. For production deployments,
however, TLS should normally terminate at a reverse proxy, ingress controller,
or managed load balancer in front of TerriaJS Server.

```text
Internet
   │ HTTPS
   ▼
Reverse proxy, ingress, or load balancer
   │ protected internal connection
   ▼
TerriaJS Server
```

The frontend should:

- redirect HTTP requests to HTTPS;
- forward requests to TerriaJS Server over a protected network;
- prevent direct public access to the TerriaJS Server port;
- replace, rather than blindly preserve, client-supplied forwarded headers;
- forward the original host and protocol correctly; and
- manage HSTS at the edge if HSTS is appropriate for the entire domain.

Configure the public hostname and any legitimate aliases in the TerriaJS Server
configuration:

```json5
{
  hostName: "maps.example.gov",
  trustedHosts: ["maps.example.gov", "maps-alias.example.gov"],
  trustProxy: 1
}
```

`trustedHosts` constrains HTTPS redirect targets and is used when validating
browser requests to state-changing TerriaJS Server endpoints.

`trustProxy` tells Express which reverse proxies and forwarded headers may be
trusted. Its correct value depends on the network topology; do not set it to
`true` without understanding which clients can connect directly to the
application. See the
[Express documentation for running behind proxies](https://expressjs.com/en/guide/behind-proxies.html),
including its warnings about `X-Forwarded-For`, `X-Forwarded-Host`, and
`X-Forwarded-Proto`.

These are the three forwarded headers currently used by Express/TerriaJS
Server request handling:

- `X-Forwarded-For` determines the client IP;
- `X-Forwarded-Host` determines the public hostname; and
- `X-Forwarded-Proto` determines whether the original request used HTTPS.

The last trusted reverse proxy should replace these headers rather than accept
arbitrary values supplied by a client. The ordinary `Host`, `Origin`, and
`Referer` headers are also security-relevant and should be forwarded without
allowing clients to bypass validation performed at the edge.

## Embedding TerriaJS in an iframe

Displaying TerriaJS in an iframe and controlling it with `window.postMessage`
are separate capabilities.

| Requirement                                                      | Configuration                                       |
| ---------------------------------------------------------------- | --------------------------------------------------- |
| Permit another site to display TerriaJS in an iframe             | TerriaJS Server `securityHeaders.cspFrameAncestors` |
| Permit a cross-origin parent or opener to send start data        | TerriaJS `parentMessageAllowedOrigins`              |
| Trust public hostnames for server redirects and browser requests | TerriaJS Server `hostName` and `trustedHosts`       |

### Display-only iframe

If a parent site only displays TerriaJS and does not send it start data, omit
`parentMessageAllowedOrigins` or leave it empty. Only the framing policy needs
to permit the parent:

```json5
{
  securityHeaders: {
    contentSecurityPolicy: true,
    cspFrameAncestors: ["'self'", "https://portal.example.gov"]
  }
}
```

TerriaJS always permits messages from its own origin. A same-origin parent or
opener can therefore send messages without being added to
`parentMessageAllowedOrigins`.

### Parent-controlled iframe or popup

If a cross-origin parent or opener needs to send start data, add its exact
origin to the client configuration:

```json5
{
  parameters: {
    parentMessageAllowedOrigins: ["https://portal.example.gov"]
  }
}
```

An interactive cross-origin iframe normally needs its parent origin in both
`cspFrameAncestors` and `parentMessageAllowedOrigins`.

Origins include the scheme and port. Do not add untrusted origins, and do not
use the opaque origin `"null"`. TerriaJS validates both the sender's origin and
whether the sender is its parent or opener. The sending application must also
use an exact target origin:

```js
iframe.contentWindow.postMessage(startData, "https://maps.example.gov");
```

When receiving messages from TerriaJS, the parent should validate both
`event.origin` and `event.source`. See
[Controlling in an iframe or popup](controlling-in-an-iframe-or-popup.md) for a
complete example.

## Content Security Policy

TerriaJS Server provides security response headers and a Content Security
Policy (CSP) suitable as a starting point for TerriaJS and Cesium. The CSP is
report-only by default. In report-only mode it logs violations but does not
block content or prevent a disallowed site from framing the application.

Use the following rollout:

1. Deploy with `cspReportOnly: true`.
2. Exercise the application's maps, catalogs, search, analytics, and embedding
   workflows.
3. Review reports received by `/csp-report`.
4. Add only the sources genuinely required by the deployment.
5. Set `cspReportOnly: false` and repeat the tests.
6. Continue monitoring reports after application and catalog changes.

For example:

```json5
{
  securityHeaders: {
    contentSecurityPolicy: true,
    cspReportOnly: false,
    cspFrameAncestors: ["'self'", "https://portal.example.gov"],
    cspScriptSrc: []
  }
}
```

Avoid using `"*"` for `cspFrameAncestors` unless unrestricted third-party
embedding is an explicit requirement.

## Cesium ion access tokens

Set the deployment's token using `cesiumIonAccessToken`:

```json5
{
  parameters: {
    cesiumIonAccessToken: "<public-restricted-token>"
  }
}
```

A token placed in client configuration is visible to users. It must be treated
as a public token even when the provider applies URL restrictions.

For production:

- create a separate token for each application and environment;
- do not use Cesium's default or evaluation token;
- enable only the required public scopes, such as `assets:read` and `geocode`;
- never grant browser tokens write or account-management scopes;
- restrict access to the assets used by the application;
- configure the most specific practical Allowed URLs;
- account for scheme, hostname, port, and path when configuring Allowed URLs;
- use a separate token for local development; and
- monitor usage for unexpected activity.

See the
[Cesium ion access-token guide](https://cesium.com/learn/ion/cesium-ion-access-tokens/)
for current scope, asset, URL restriction, monitoring, and rotation options.

If Cesium ion services are not required, disable their use explicitly:

```json5
{
  parameters: {
    useCesiumIonTerrain: false,
    useCesiumIonBingImagery: false,
    cesiumIonDisableDefaultToken: true
  }
}
```

### Cesium ion user login

If users can sign in to Cesium ion from the Add Data panel:

- configure the OAuth application with the exact redirect URI documented for
  `cesiumIonOAuth2ApplicationID`;
- keep `cesiumIonLoginTokenPersistence` set to `"page"` unless persistence is
  required; and
- keep `cesiumIonAllowSharingAddedAssets` set to `false` unless the deployment
  intentionally supports sharing access to added assets.

`sessionStorage` and especially `localStorage` make a login token available for
longer and to more code executing on the same origin.

## Other service tokens

Tokens and keys placed in `config.json`, initialization files, catalog
definitions, generated JavaScript, or browser requests are visible to users.
This commonly includes Bing Maps, Mapbox, ArcGIS, CARTO, and catalog-specific
Cesium ion tokens.

For every browser-visible token:

- grant the minimum permissions;
- configure URL or origin restrictions where supported;
- use separate tokens for production, staging, and development;
- monitor usage; and
- define a rotation and revocation procedure.

For example, see the
[Mapbox access-token guide](https://docs.mapbox.com/accounts/guides/tokens/)
for Mapbox scopes, URL restrictions, and rotation.

If a credential must remain private, do not put it in TerriaJS client
configuration. Configure it on the server using TerriaJS Server proxy
authentication. Proxy authentication prevents the credential itself from being
sent to the browser, but a user who can access the configured proxy may still
be able to use the upstream service through that credential. Use narrowly
scoped, preferably read-only credentials and a narrow proxy allowlist.

See the
[TerriaJS Server documentation](https://github.com/TerriaJS/terriajs-server)
for `proxyAuth`, `appendParamToQueryString`, `allowProxyFor`, and other backend
functionality.

## Token ownership and rotation

Maintain an operational record for every token:

- service and account owner;
- application and environment;
- configuration location;
- whether it is browser-visible or private;
- permissions, allowed origins, and allowed assets;
- creation date and planned rotation date;
- usage-monitoring location; and
- revocation procedure.

Use a create-deploy-revoke rotation:

1. Create a replacement token with the same or narrower access.
2. Deploy the replacement without revoking the old token.
3. Verify the production workflows that use it.
4. Confirm that usage has moved to the replacement.
5. Revoke the old token.
6. Confirm that the old token no longer works.
7. Update the operational record.

If exposure is suspected, rotate immediately, inspect service usage, and check
source history, CI logs, deployment artifacts, and container layers for the
exposed value. Rotation does not make a browser token secret; scope, asset, and
origin restrictions remain necessary.
