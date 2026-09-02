import { DURATION_REGEX, DURATION_UNITS } from "./constants.js";
/**
 *
 * @param {string} duration
 * @returns {number}
 */
function processDuration(duration) {
  const parsedMaxAge = DURATION_REGEX.exec(duration);
  if (!parsedMaxAge || parsedMaxAge.length < 3) {
    const error = new Error("Invalid duration");
    error.code = "INVALID_DURATION";
    throw error;
  }
  if (Number.isNaN(parsedMaxAge[1])) {
    const error = new Error("Invalid duration");
    error.code = "INVALID_DURATION";
    throw error;
  }
  const value = Number(parsedMaxAge[1]);
  const unit = parsedMaxAge[2];
  const unitConversion = DURATION_UNITS[unit];

  if (!unitConversion) {
    const error = new Error(`Invalid duration unit ${parsedMaxAge[2]}`);
    error.code = "INVALID_DURATION";
    throw error;
  }

  return value * unitConversion;
}

export { processDuration };
