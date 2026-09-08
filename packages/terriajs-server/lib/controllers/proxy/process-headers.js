import { filterHeaders } from "./filter-headers.js";
/**
 * Filters out headers that shouldn't be proxied, overrides caching so files are retained for {@link DEFAULT_MAX_AGE_SECONDS},
 * and sets CORS headers to allow all origins
 *
 * @param {Record<string, unknown>} headers The original object of headers. This is not mutated.
 * @param {number | undefined} maxAgeSeconds the amount of time in seconds to cache for. This will override what the original server
 *          specified because we know better than they do.
 * @returns {Record<string, unknown>} The new headers object.
 */
function processHeaders(
  headers,
  maxAgeSeconds,
  { isAuthenticated = false, varyByAuthorization = false } = {}
) {
  const result = filterHeaders(headers, undefined);

  if (maxAgeSeconds !== undefined) {
    const visibility = isAuthenticated ? "private" : "public";
    result["cache-control"] = `${visibility},max-age=${maxAgeSeconds}`;
  }

  if (varyByAuthorization) {
    result["vary"] = "Authorization";
  }

  result["access-control-allow-origin"] = "*";
  return result;
}

export { processHeaders };
