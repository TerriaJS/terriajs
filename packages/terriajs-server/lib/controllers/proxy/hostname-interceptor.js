/**
 * @callback ValidateHost
 * @param {string} hostname - The hostname to validate
 * @param {string | undefined} port - The port number
 * @returns {boolean} - Return true if the host is allowed, false otherwise
 */

/**
 * Creates an undici interceptor that validates redirect destinations before following them.
 * This provides per-redirect validation to ensure redirects don't go to blacklisted hosts.
 *
 * @param {object} options
 * @param {ValidateHost} options.validateHost - Function(hostname, port) that returns true if host is allowed
 * @returns {import("undici").Dispatcher.DispatcherComposeInterceptor} Interceptor for use with dispatcher.compose()
 */
function hostnameInterceptor({ validateHost }) {
  if (typeof validateHost !== "function") {
    throw new Error(
      "createValidatingRedirectInterceptor requires validateHost function"
    );
  }

  return (dispatch) => {
    return function Intercept(opts, handler) {
      // Validate the host before making the request
      const originUrl = opts.origin ? new URL(opts.origin) : undefined;
      const hostname = originUrl?.hostname;
      const port = originUrl?.port;
      const hostnameWithoutBrackets =
        hostname?.startsWith("[") && hostname.endsWith("]")
          ? hostname.slice(1, -1)
          : hostname;
      if (
        hostnameWithoutBrackets &&
        !validateHost(hostnameWithoutBrackets, port)
      ) {
        const error = new Error(
          `Connection blocked: Host not allowed: ${hostname}`
        );
        error.code = "BLOCKED_HOST";
        error.host = hostname;

        // Call error handler if available
        if (handler.onError) {
          handler.onError(error);
        }

        throw error;
      }

      // Host is allowed, proceed with the request
      return dispatch(opts, handler);
    };
  };
}

export { hostnameInterceptor };
