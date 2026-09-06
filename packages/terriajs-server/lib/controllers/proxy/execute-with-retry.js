import { buildRequestHeaders } from "./build-request-headers.js";
import { AUTH_STATUS_CODES } from "./constants.js";

/**
 * @callback FetchFunction
 * @param {object} opts
 * @param {import("undici").Dispatcher.DispatchOptions['headers']} opts.headers
 */

/**
 * Executes request with auth retry logic
 * Pure function (side effects isolated to fetchFn)
 * @param {object} options
 * @param {Array<import('./types').AuthStrategy>} options.strategies - Auth strategies to try
 * @param {object} options.requestOptions - Base request options
 * @param {import("http").IncomingHttpHeaders} options.requestOptions.headers - Base request headers
 * @param {FetchFunction} options.fetchFn - Function to execute request (undici.request)
 * @returns {Promise<import('undici').Dispatcher.ResponseData<unknown>>} Response object
 */
async function executeWithRetry({ strategies, requestOptions, fetchFn }) {
  for (let i = 0; i < strategies.length; i++) {
    const strategy = strategies[i];
    const isLastStrategy = i === strategies.length - 1;

    const headers = buildRequestHeaders(requestOptions.headers, strategy);
    try {
      const response = await fetchFn({ headers });
      return { response, usedAuthStrategy: strategy };
    } catch (err) {
      const shouldRetry =
        AUTH_STATUS_CODES.includes(err.statusCode) && !isLastStrategy;

      if (shouldRetry) {
        // Dump body before retrying
        continue;
      }

      // Either success or last attempt failed - return response
      throw err;
    }
  }

  // This shouldn't happen if strategies always includes 'none'
  throw new Error("No auth strategies provided");
}

export { executeWithRetry };
