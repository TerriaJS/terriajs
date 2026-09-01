import { PROTOCOL_REGEX } from "./constants.js";

/**
 *
 * @param {string} target - The target URL string from the request
 * @returns {string}
 */
function processTargetUrl(target) {
  if (!target || target.length === 0) {
    const error = new Error("No url specified.");
    error.code = "NO_URL_SPECIFIED";
    throw error;
  }

  const protocolMatch = PROTOCOL_REGEX.exec(target);
  // let resultUrl = target;

  // Add http:// if no protocol is specified.
  if (!protocolMatch || protocolMatch.length < 1) {
    return `http://${target}`;
  } else {
    const matchedPart = protocolMatch[0];
    // SECURITY: Only allow http: and https:
    const protocol = matchedPart.toLowerCase();
    if (!protocol.startsWith("http:") && !protocol.startsWith("https:")) {
      const error = new Error(`Protocol not allowed: ${protocol}`);
      error.code = "INVALID_PROTOCOL";
      throw error;
    }
    // If the protocol portion of the URL only has a single slash after it, the extra slash was probably stripped off by someone
    // along the way (NGINX will do this).  Add it back.
    if (target[matchedPart.length] !== "/") {
      return `${matchedPart}/${target.substring(matchedPart.length)}`;
    }
  }

  return target;
}

export { processTargetUrl };
