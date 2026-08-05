TerriaMap uses [TerriaJS Server](https://github.com/TerriaJS/terriajs-server)
for backend functionality such as proxying data services, storing share data,
and sending feedback. Its configuration is separate from the public
`wwwroot/config.json` client configuration.

See:

- the
  [TerriaJS Server example configuration](https://github.com/TerriaJS/terriajs-server/blob/master/serverconfig.json.example)
  for the complete set of server options; and
- [Security and production deployment](../deploying/security.md) for HTTPS,
  reverse proxies, trusted hosts, iframe policy, security headers, and
  credential handling, including
  [private upstream credentials with `proxyAuth`](../deploying/security.md#private-upstream-credentials-with-proxyauth).

Do not place private server credentials in `wwwroot`, client configuration, or
initialization files. Supply them through protected server configuration or the
secret-management mechanism provided by the deployment platform.
