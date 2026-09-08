import helmet from "helmet";

const CSP_REPORT_PATH = "/csp-report";

/**
 * Content-Security-Policy directives tuned for a TerriaJS/Cesium application.
 *
 * Cesium and TerriaJS create web workers and render tiles/textures from `blob:`
 * URLs, and the app connects to arbitrary data sources, so the policy is broad
 * where the app legitimately is (connect/img/media) and restrictive where it
 * can be (object-src, base-uri). It is served in report-only mode by default,
 * so it never blocks — it only reports violations to `/csp-report` so operators
 * can see what a given deployment actually needs before enforcing.
 *
 * @param {object} settings
 * @returns {Record<string, string[]>}
 */
function buildCspDirectives(settings) {
  const extraScriptSrc = settings.cspScriptSrc || [];
  const frameAncestors = settings.cspFrameAncestors || ["'self'"];
  return {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "blob:",
      ...extraScriptSrc
    ],
    "worker-src": ["'self'", "blob:"],
    "child-src": ["'self'", "blob:"],
    "style-src": ["'self'", "'unsafe-inline'", "https:"],
    "img-src": ["'self'", "data:", "blob:", "https:", "http:"],
    "font-src": ["'self'", "https:", "data:"],
    "connect-src": [
      "'self'",
      "https:",
      "http:",
      "wss:",
      "ws:",
      "blob:",
      "data:"
    ],
    "media-src": ["'self'", "https:", "blob:", "data:"],
    "frame-src": ["'self'", "https:", "blob:"],
    "frame-ancestors": frameAncestors,
    "report-uri": [CSP_REPORT_PATH]
  };
}

/**
 * Builds the helmet middleware with a configuration safe for terriajs-server:
 * a report-only CSP tuned for TerriaJS, plus the safe headers (nosniff,
 * Referrer-Policy). The directives that would break this server's core features
 * are disabled: frameguard (iframe embedding is supported), cross-origin
 * resource/opener/embedder policies (the proxy serves resources cross-origin),
 * and HSTS (kept under the existing redirectToHttps handling).
 *
 * Every default can be overridden per deployment: `settings.helmet` is a raw
 * helmet options object that is applied last, so an operator can enable HSTS or
 * frameguard, tighten a cross-origin policy, replace the CSP, adjust the
 * Referrer-Policy, etc. HSTS defaults to false here because it is a sticky,
 * non-reversible browser commitment with no report mode; it is already handled
 * (gated) by the `redirectToHttps`/`strictTransportSecurity` settings, and can
 * be enabled here via `securityHeaders.helmet.hsts`.
 *
 * @param {object} [settings] The `securityHeaders` server setting.
 * @returns {import('express').RequestHandler}
 */
function buildSecurityHeaders(settings = {}) {
  const cspEnabled = settings.contentSecurityPolicy !== false;
  const reportOnly = settings.cspReportOnly !== false;

  const defaults = {
    contentSecurityPolicy: cspEnabled
      ? {
          useDefaults: false,
          directives: buildCspDirectives(settings),
          reportOnly
        }
      : false,
    hsts: false,
    frameguard: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  };

  return helmet({ ...defaults, ...(settings.helmet || {}) });
}

export { buildSecurityHeaders, CSP_REPORT_PATH };
