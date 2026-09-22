import { Transform } from "node:stream";

/**
 * Creates a Transform stream that enforces a maximum byte size.
 * Emits an error with code RESPONSE_TOO_LARGE if the limit is exceeded.
 *
 * @param {number} maxBytes - Maximum allowed response size in bytes
 * @returns {Transform} A transform stream that passes data through until the limit is exceeded
 */
function createSizeLimiter(maxBytes) {
  let bytesReceived = 0;

  return new Transform({
    transform(chunk, _encoding, callback) {
      bytesReceived += chunk.length;
      if (bytesReceived > maxBytes) {
        const error = new Error(
          `Response body too large (exceeded ${maxBytes} bytes)`
        );
        error.code = "RESPONSE_TOO_LARGE";
        callback(error);
      } else {
        callback(null, chunk);
      }
    }
  });
}

export { createSizeLimiter };
