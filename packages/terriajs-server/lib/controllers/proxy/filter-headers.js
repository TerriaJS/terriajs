import { DO_NOT_PROXY_REGEX } from "./constants.js";

/**
 * Filters headers that are not matched by {@link DO_NOT_PROXY_REGEX} out of an object containing headers. This does not
 * mutate the original list.
 *
 * @param {import("http").IncomingHttpHeaders} headers The headers to filter
 * @param {import("net").Socket?} socket The socket the request is being made on (optional)
 * @param {boolean} removeAuthHeader Whether to remove the Authorization header
 * @returns {import("http").IncomingHttpHeaders} A new object with the filtered headers.
 */
function filterHeaders(headers, socket, removeAuthHeader = false) {
  /**
   * @type {import("http").IncomingHttpHeaders}
   */
  const result = {};
  // filter out headers that are listed in the regex above
  Object.keys(headers).forEach((name) => {
    if (removeAuthHeader && name.toLowerCase() === "authorization") {
      return;
    }

    if (!DO_NOT_PROXY_REGEX.test(name)) {
      result[name] = headers[name];
    }
  });

  if (!socket || !socket.remoteAddress) {
    return result;
  }

  if (result["x-forwarded-for"]) {
    result["x-forwarded-for"] =
      `${result["x-forwarded-for"]}, ${socket.remoteAddress}`;
  } else {
    result["x-forwarded-for"] = socket.remoteAddress;
  }

  return result;
}

export { filterHeaders };
