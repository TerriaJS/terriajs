const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Builds middleware that guards state-changing requests against CSRF by checking
 * the browser-set `Origin` (falling back to `Referer`) against a set of trusted
 * hostnames. `Origin` is a forbidden header, so page scripts cannot spoof it.
 *
 * A request that carries no `Origin` or `Referer` at all is allowed: only
 * non-browser clients (curl, server-to-server) omit both, and a browser CSRF
 * attack always sends a cross-origin `Origin`. A present-but-untrusted (or
 * malformed) origin is rejected with 403.
 *
 * @param {Set<string>} trustedHosts Hostnames this server accepts writes from.
 * @returns {import('express').RequestHandler}
 */
function makeOriginAllowlist(trustedHosts) {
  return function requireTrustedOrigin(req, res, next) {
    if (SAFE_METHODS.has(req.method)) {
      return next();
    }

    const source = req.get("origin") ?? req.get("referer");
    if (source === undefined) {
      return next();
    }

    const host = hostOf(source);
    if (host !== undefined && trustedHosts.has(host)) {
      return next();
    }

    return res.status(403).send("Cross-origin request blocked");
  };
}

/**
 * @param {string} value An Origin or Referer header value.
 * @returns {string | undefined} The hostname, or undefined if unparseable.
 */
function hostOf(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return undefined;
  }
}

export { makeOriginAllowlist };
