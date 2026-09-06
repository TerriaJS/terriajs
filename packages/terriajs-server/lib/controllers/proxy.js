import bodyParser from "body-parser";
import express from "express";
import undici, { interceptors } from "undici";
import { buildAuthStrategies } from "./proxy/build-auth-strategies.js";
import { buildRemoteUrl } from "./proxy/build-remote-url.js";
import { validateAppendParamToQueryString } from "./proxy/validate-append-param-to-query-string.js";
import {
  DEFAULT_BLACKLIST,
  DEFAULT_CONNECT_TIMEOUT_MS,
  DEFAULT_HEADERS_TIMEOUT_MS,
  DEFAULT_MAX_AGE_SECONDS,
  DEFAULT_MAX_SIZE,
  DEFAULT_RESPONSE_SIZE_LIMIT,
  MAX_REDIRECTS
} from "./proxy/constants.js";
import { createSizeLimiter } from "./proxy/create-size-limiter.js";
import { executeWithRetry } from "./proxy/execute-with-retry.js";
import { filterHeaders } from "./proxy/filter-headers.js";
import { hostnameInterceptor } from "./proxy/hostname-interceptor.js";
import { processDuration } from "./proxy/process-duration.js";
import { processHeaders } from "./proxy/process-headers.js";
import { processTargetUrl } from "./proxy/process-target-url.js";
import { makeHostnameMatcher } from "./proxy/proxy-allowed-host.js";
import createSecureAgent from "./proxy/secure-agent.js";
/**
 * Creates an express middleware that proxies calls to '/proxy/http://example' to 'http://example', while forcing them
 * to be cached by the browser and overrwriting CORS headers. A cache duration can be added with a URL like
 * /proxy/_5m/http://example which causes 'Cache-Control: public,max-age=300' to be added to the response headers.
 *
 * @param {object} options
 * @param {Array<string>} options.proxyableDomains An array of domains to be proxied
 * @param {boolean} options.proxyAllDomains A boolean indicating whether or not we should proxy ALL domains - overrides
 *                      the configuration in options.proxyableDomains
 * @param {string} options.proxyAuth A map of domains to tokens that will be passed to those domains via basic auth
 *                      when proxying through them.
 * @param {string} options.upstreamProxy Url of a standard upstream proxy that will be used to retrieve data.
 * @param {Record<string, true>} options.bypassUpstreamProxyHosts An object of hosts (as strings) to 'true' values.
 * @param {string} options.proxyPostSizeLimit The maximum size of a POST request that the proxy will allow through,
                        in bytes if no unit is specified, or some reasonable unit like 'kb' for kilobytes or 'mb' for megabytes.
 * @param {import('./proxy/types').AppendParamToQueryString} options.appendParamToQueryString An object of query string parameters to append to the proxied URL.
 * @param {Array<string>} options.blacklistedAddresses An array of IP addresses or CIDR ranges that should not be proxied to.
 * @param {object} options.basicAuthentication Basic authentication configuration for terriajs-server itself.
 * @param {string} options.basicAuthentication.username Username for basic authentication.
 * @param {string} options.basicAuthentication.password Password for basic authentication.
 * @param {boolean} options.clearAuthHeaders Whether to clear existing Authorization headers from incoming requests (default: false)
 * @param {boolean} options.rejectUnauthorized Whether to reject unauthorized TLS certificates (default: true)
 * @param {number} options.headersTimeout Timeout in ms for receiving response headers (default: 30000)
 * @param {number} options.connectTimeout Timeout in ms for establishing connection (default: 10000)
 * @param {number} options.responseSizeLimit Maximum allowed response body size in bytes (default: 104857600 / 100MB)
 *
 * @returns {*} A middleware that can be used with express.
 */
export default function (options) {
  const proxyAllDomains = options.proxyAllDomains;
  const proxyableDomains = options.proxyableDomains || [];
  const proxyAuth = options.proxyAuth || {};
  const proxyPostSizeLimit = options.proxyPostSizeLimit || DEFAULT_MAX_SIZE;
  const appendParamToQueryString = options.appendParamToQueryString || {};
  validateAppendParamToQueryString(appendParamToQueryString);
  const rejectUnauthorized = options.rejectUnauthorized ?? true;
  const clearAuthHeaders =
    options.clearAuthHeaders ||
    (options.basicAuthentication &&
      options.basicAuthentication.username &&
      options.basicAuthentication.password);

  const responseSizeLimit =
    options.responseSizeLimit || DEFAULT_RESPONSE_SIZE_LIMIT;

  // Timeout configurations (in milliseconds)
  const headersTimeout = options.headersTimeout || DEFAULT_HEADERS_TIMEOUT_MS; // 30 seconds default
  const connectTimeout = options.connectTimeout || DEFAULT_CONNECT_TIMEOUT_MS; // 10 seconds default
  // If you change this, also change the same list in serverconfig.json.example.
  // This page is helpful: https://en.wikipedia.org/wiki/Reserved_IP_addresses
  const blacklistedAddresses =
    options.blacklistedAddresses || DEFAULT_BLACKLIST;

  const proxyAllowedHost = makeHostnameMatcher({
    proxyAllDomains,
    proxyableDomains,
    blacklistedAddresses
  });

  /**
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns
   */
  async function doProxy(req, res) {
    try {
      const duration = req.params.duration;
      const maxAgeSeconds = duration
        ? processDuration(duration)
        : DEFAULT_MAX_AGE_SECONDS;

      const target = processTargetUrl(req.params.target);
      const requestUrl = new URL(req.url, target);
      const remoteUrl = buildRemoteUrl(
        target,
        requestUrl,
        appendParamToQueryString
      );

      const filteredReqHeaders = filterHeaders(
        req.headers,
        req.socket,
        clearAuthHeaders
      );

      const userAuthHeader = filteredReqHeaders["authorization"];

      let upstreamProxy = undefined;
      if (
        options.upstreamProxy &&
        !(options.bypassUpstreamProxyHosts || {})[remoteUrl.host]
      ) {
        upstreamProxy = options.upstreamProxy;
      }

      const secureAgent = createSecureAgent(blacklistedAddresses, {
        rejectUnauthorized,
        upstreamProxy,
        connectTimeout,
        headersTimeout
      });

      const dispatcher = secureAgent.compose(
        interceptors.responseError(),
        hostnameInterceptor({
          validateHost: proxyAllowedHost
        }),
        interceptors.redirect({ maxRedirections: MAX_REDIRECTS })
      );

      const authStrategies = buildAuthStrategies({
        userAuth: userAuthHeader,
        proxyAuth,
        host: remoteUrl.host
      });

      const { response, usedAuthStrategy } = await executeWithRetry({
        strategies: authStrategies,
        requestOptions: {
          headers: filteredReqHeaders
        },
        fetchFn: (opts) =>
          undici.request(remoteUrl.href, {
            headers: opts.headers,
            method: req.method,
            body: req.body,
            dispatcher,
            throwOnMaxRedirect: true
          })
      });
      const { statusCode, headers, body } = response;

      // Handle success responses
      res.set(
        processHeaders(headers, maxAgeSeconds, {
          isAuthenticated: usedAuthStrategy.type !== "none",
          varyByAuthorization: usedAuthStrategy.type === "user"
        })
      );
      res.status(statusCode);

      const sizeLimiter = createSizeLimiter(responseSizeLimit);
      body.pipe(sizeLimiter).pipe(res);

      sizeLimiter.on("error", (streamErr) => {
        body.destroy();
        if (!res.headersSent) {
          res.status(502).send(streamErr.message);
        } else {
          res.destroy();
        }
      });

      body.on("error", (streamErr) => {
        console.error("Stream error:", streamErr);
        if (!res.headersSent) {
          res.status(502).send("Stream error");
        } else {
          res.destroy();
        }
      });
    } catch (err) {
      if (res.headersSent) {
        return res.end();
      }

      // Handle too many redirects error (from redirect handler)
      if (
        err.message === "max redirects" ||
        err.code === "ERR_TOO_MANY_REDIRECTS"
      ) {
        return res
          .status(502)
          .send(
            `Too many redirects (maximum ${MAX_REDIRECTS} allowed) ERR_TOO_MANY_REDIRECTS`
          );
      }

      if (err.code === "INVALID_PROTOCOL") {
        return res.status(400).send(err.message);
      }

      if (err.code === "NO_URL_SPECIFIED") {
        return res.status(400).send(err.message);
      }

      if (err.code === "INVALID_DURATION") {
        return res.status(400).send(err.message);
      }

      // Handle timeout errors
      if (err.code === "UND_ERR_HEADERS_TIMEOUT") {
        return res
          .status(504)
          .send("Gateway timeout: Headers not received in time");
      }

      if (err.code === "UND_ERR_CONNECT_TIMEOUT") {
        return res
          .status(504)
          .send("Gateway timeout: Could not connect to upstream server");
      }

      if (err.code === "DNS_LOOKUP_FAILED") {
        return res.status(502).send(err.message);
      }

      if (err.code === "BLACKLISTED_IP") {
        return res
          .status(403)
          .send(`IP address is not allowed: ${err.address}`);
      }

      if (err.code === "BLOCKED_HOST") {
        return res
          .status(403)
          .send(`Host is not in list of allowed hosts: ${err.host}`);
      }
      if (err.statusCode) {
        return res.status(err.statusCode).send(err.body ?? "Error");
      }

      console.error("Proxy error:", err);
      res.status(500).send({
        error: "Proxy error",
        code: err.code || "UNKNOWN",
        ...(process.env.NODE_ENV === "development" && {
          message: err.message,
          stack: err.stack
        })
      });
    }
  }

  const router = express.Router();

  router.get("/_:duration{/*target}", (req, res) => {
    req.params.target = req.params.target?.join("/");
    return doProxy(req, res);
  });

  router.get("/{*target}", (req, res) => {
    req.params.target = req.params.target?.join("/");
    return doProxy(req, res);
  });

  router.post(
    "/_:duration{/*target}",
    bodyParser.raw({
      type: () => {
        return true;
      },
      limit: proxyPostSizeLimit
    }),
    (req, res) => {
      req.params.target = req.params.target?.join("/");
      return doProxy(req, res);
    }
  );

  router.post(
    "/{*target}",
    bodyParser.raw({
      type: () => {
        return true;
      },
      limit: proxyPostSizeLimit
    }),
    (req, res) => {
      req.params.target = req.params.target?.join("/");
      return doProxy(req, res);
    }
  );

  router.use((err, _req, res, next) => {
    if (err.status === 413 || err.type === "entity.too.large") {
      res.status(413).send("Proxy POST body too large.");
    } else {
      next(err);
    }
  });

  return router;
}
