/**
 * Builds request headers for a given auth strategy
 *
 * @param {import('http').IncomingHttpHeaders} baseHeaders - The filtered base headers
 * @param {import("./types").AuthStrategy} strategy - The auth strategy to apply
 * @returns {import("undici").Dispatcher.DispatchOptions['headers']} New headers object
 */
function buildRequestHeaders(baseHeaders, strategy) {
  // Start with copy of base headers (immutable)
  const headers = { ...baseHeaders };

  if (strategy.type === "none") {
    // Remove auth for none strategy
    const { authorization, ...rest } = headers;
    return rest;
  }

  // Set authorization if provided
  if (strategy.authorization) {
    headers.authorization = strategy.authorization;
  }

  // Apply additional headers if provided
  if (strategy.headers) {
    strategy.headers.forEach((header) => {
      headers[header.name] = header.value;
    });
  }

  return headers;
}

export { buildRequestHeaders };
