import express from "express";
import compression from "compression";
import path from "node:path";
import cors from "cors";
import exists from "./exists.js";
import basicAuth from "basic-auth";
import fs from "node:fs";
import https from "node:https";
import ExpressBruteFlexible from "rate-limiter-flexible/lib/ExpressBruteFlexible.js";
import morgan from "morgan";
import proxy from "./controllers/proxy.js";
import esriTokenAuth from "./controllers/esri-token-auth.js";
import proj4lookup from "./controllers/proj4lookup.js";
import serverconfig from "./controllers/serverconfig.js";
import * as errorPage from "./errorpage.js";
import initfile from "./controllers/initfile.js";
import feedback from "./controllers/feedback.js";
import share from "./controllers/share.js";
import singlePageRouting from "./controllers/single-page-routing.js";
import { makeOriginAllowlist } from "./controllers/origin-allowlist.js";
import cspReport from "./controllers/csp-report.js";
import { buildSecurityHeaders } from "./security-headers.js";

/* Creates and returns a single express server. */
export default function (options) {
  function endpoint(endpointPath, ...handlers) {
    if (options.verbose) {
      console.log(
        `http://${options.hostName}:${options.port}/api/v1${endpointPath}`,
        true
      );
    }
    app.use(`/api/v1${endpointPath}`, ...handlers);
    app.use(endpointPath, ...handlers);
  }

  // initialise app with standard middlewares
  const app = express();
  app.disable("x-powered-by");
  app.use(compression());
  app.use(cors());
  if (options.settings.securityHeaders !== false) {
    app.use(buildSecurityHeaders(options.settings.securityHeaders || {}));
  }
  app.disable("etag");
  if (options.verbose) {
    app.use(morgan("dev"));
  }

  if (typeof options.settings.trustProxy !== "undefined") {
    app.set("trust proxy", options.settings.trustProxy);
  }

  // Hostnames this server trusts as its own. Used both to constrain the
  // http->https redirect target and to reject cross-origin (CSRF) writes.
  const trustedHosts = new Set(
    [
      options.hostName,
      options.settings.hostName,
      ...(options.settings.trustedHosts || [])
    ].filter(Boolean)
  );
  const requireTrustedOrigin = makeOriginAllowlist(trustedHosts);

  if (options.verbose) {
    console.log("Listening on these endpoints:", true);
  }
  endpoint("/ping", (_req, res) => {
    res.status(200).send("OK");
  });

  // Receive CSP violation reports. Mounted before authentication so browser
  // report POSTs (which carry no credentials) are not rejected.
  endpoint("/csp-report", cspReport());

  // We do this after the /ping service above so that ping can be used unauthenticated and without TLS for health checks.

  if (options.settings.redirectToHttps) {
    const httpAllowedHosts = options.settings.httpAllowedHosts || ["localhost"];
    // Only redirect to hosts we recognize (trustedHosts, computed above), so an
    // attacker-supplied Host header cannot turn the https redirect into an open
    // redirect to an arbitrary site.
    app.use((req, res, next) => {
      if (httpAllowedHosts.includes(req.hostname)) {
        return next();
      }

      if (req.protocol !== "https") {
        if (!trustedHosts.has(req.hostname)) {
          console.warn(
            `Refusing https redirect for unrecognized host "${req.hostname}".`
          );
          return res.status(400).send("Invalid host");
        }
        const url = `https://${req.hostname}${req.url}`;
        res.redirect(301, url);
      } else {
        if (options.settings.strictTransportSecurity) {
          res.setHeader(
            "Strict-Transport-Security",
            options.settings.strictTransportSecurity
          );
        }
        next();
      }
    });
  }

  const auth = options.settings.basicAuthentication;
  if (auth) {
    if (!auth.username || !auth.password) {
      console.error(
        "FATAL: basicAuthentication is configured but username/password is missing"
      );
      // eslint-disable-next-line n/no-process-exit
      process.exit(1);
    } else {
      const rateLimitOptions = {
        freeRetries: 2,
        minWait: 200,
        maxWait: 60000
      };
      if (
        options.settings.rateLimit &&
        options.settings.rateLimit.freeRetries !== undefined
      ) {
        rateLimitOptions.freeRetries = options.settings.rateLimit.freeRetries;
        rateLimitOptions.minWait = options.settings.rateLimit.minWait;
        rateLimitOptions.maxWait = options.settings.rateLimit.maxWait;
      }
      const bruteforce = new ExpressBruteFlexible(
        ExpressBruteFlexible.LIMITER_TYPES.MEMORY,
        rateLimitOptions
      );
      app.use(bruteforce.prevent, (req, res, next) => {
        const user = basicAuth(req);
        if (
          user &&
          user.name === auth.username &&
          user.pass === auth.password
        ) {
          // Successful authentication, reset rate limiting.
          req.brute.reset(next);
        } else {
          res.statusCode = 401;
          res.setHeader("WWW-Authenticate", 'Basic realm="terriajs-server"');
          res.end("Unauthorized");
        }
      });
    }
  }

  if (options.pingauth) {
    // used only in tests as an endpoint to test authentication and rate limiting
    // this should appear after brute force middleware is loaded
    endpoint("/pingauth", (_req, res) => {
      res.status(200).send("OK");
    });
  }

  // Serve the bulk of our application as a static web directory.
  const serveWwwRoot =
    exists(`${options.wwwroot}/index.html`) ||
    (options.settings.singlePageRouting &&
      exists(
        options.wwwroot +
          options.settings.singlePageRouting.resolvePathRelativeToWwwroot
      ));
  if (serveWwwRoot) {
    app.use(
      express.static(options.wwwroot, {
        setHeaders: (res, filePath) => {
          const ext = path.extname(filePath);
          if (ext === ".czml") {
            res.setHeader("Content-Type", "application/json");
          } else if (ext === ".glsl") {
            res.setHeader("Content-Type", "text/plain");
          }
        }
      })
    );
  }

  // Proxy for servers that don't support CORS
  const bypassUpstreamProxyHostsMap = (
    options.settings.bypassUpstreamProxyHosts || []
  ).reduce((map, host) => {
    if (host !== "") {
      map[host.toLowerCase()] = true;
    }
    return map;
  }, {});

  endpoint(
    "/proxy",
    proxy({
      proxyableDomains: options.settings.allowProxyFor,
      proxyAllDomains: options.settings.proxyAllDomains,
      proxyAuth: options.proxyAuth,
      proxyPostSizeLimit: options.settings.proxyPostSizeLimit,
      upstreamProxy: options.settings.upstreamProxy,
      bypassUpstreamProxyHosts: bypassUpstreamProxyHostsMap,
      basicAuthentication: options.settings.basicAuthentication,
      blacklistedAddresses: options.settings.blacklistedAddresses,
      appendParamToQueryString: options.settings.appendParamToQueryString,
      rejectUnauthorized: options.settings.rejectUnauthorized,
      headersTimeout: options.settings.proxyHeadersTimeout,
      connectTimeout: options.settings.proxyConnectTimeout,
      clearAuthHeaders: options.settings.clearAuthHeaders,
      responseSizeLimit: options.settings.proxyResponseSizeLimit
    })
  );

  const esriTokenAuthRouter = esriTokenAuth(options.settings.esriTokenAuth);
  if (esriTokenAuthRouter) {
    endpoint("/esri-token-auth", requireTrustedOrigin, esriTokenAuthRouter);
  }

  endpoint("/proj4def", proj4lookup); // Proj4def lookup service, to avoid downloading all definitions into the client.
  endpoint("/serverconfig", serverconfig(options));
  const show404 = serveWwwRoot && exists(`${options.wwwroot}/404.html`);
  const error404 = errorPage.error404(show404, options.wwwroot, serveWwwRoot);
  const show500 = serveWwwRoot && exists(`${options.wwwroot}/500.html`);
  const error500 = errorPage.error500(show500, options.wwwroot);
  const initPaths = options.settings.initPaths || [];

  if (serveWwwRoot) {
    initPaths.push(path.join(options.wwwroot, "init"));
  }

  app.use("/init", initfile(initPaths, error404, options.configDir));

  const feedbackService = feedback(options.settings.feedback);
  if (feedbackService) {
    endpoint("/feedback", requireTrustedOrigin, feedbackService);
  }
  const shareService = share({
    shareUrlPrefixes: options.settings.shareUrlPrefixes,
    newShareUrlPrefix: options.settings.newShareUrlPrefix,
    shareMaxRequestSize: options.settings.shareMaxRequestSize
  });
  if (shareService) {
    endpoint("/share", requireTrustedOrigin, shareService);
  }

  if (options.settings && options.settings.singlePageRouting) {
    const singlePageRoutingService = singlePageRouting(
      options,
      options.settings.singlePageRouting
    );
    if (singlePageRoutingService) {
      endpoint("{*splat}", singlePageRoutingService);
    }
  }

  app.use(error404);
  app.use(error500);
  let server = app;
  const osh = options.settings.https;
  if (osh && osh.key && osh.cert) {
    console.log("Launching in HTTPS mode.");
    server = https.createServer(
      {
        key: fs.readFileSync(osh.key),
        cert: fs.readFileSync(osh.cert)
      },
      app
    );
  }

  return server;
}
