/**
 * Parses a string representing a file size and converts it to a numeric value in bytes.
 *
 * @param sizeStr - The input string representing the size (e.g., "10KB", "5MB", "1GB").
 *                  It must be a string containing a numeric value followed by an optional unit (KB, MB, GB, TB).
 * @returns The size in bytes as a number, or undefined if the input is invalid.
 * @throws An error if the input is not a string or if the format is invalid.
 */
function parseStringSize(sizeStr: string): number | undefined {
  if (typeof sizeStr !== "string") {
    throw new Error("Input must be a string");
  }
  const sizeUnitRegex = /(\d+)(KB|MB|GB|TB)?$/i;
  const match = sizeStr.trim().match(sizeUnitRegex);
  if (match) {
    if (!/^\d+$/.test(match[1])) {
      throw new Error(`Invalid numeric value: ${match[1]}`);
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    if (!unit) {
      // assume bytes by default
      return value;
    }
    const upperUnit = unit.toUpperCase();
    switch (upperUnit) {
      case "KB":
        return value * 1024; // 1 KB = 1024 bytes
      case "MB":
        return value * 1024 ** 2; // 1 MB = 1024^2 bytes
      case "GB":
        return value * 1024 ** 3; // 1 GB = 1024^3 bytes
      case "TB":
        return value * 1024 ** 4; // 1 TB = 1024^4 bytes
      default:
        throw new Error(
          `Invalid share size format: ${sizeStr}. Expected format: '<number><unit>' where unit is KB, MB, GB, or TB.`
        );
    }
  } else {
    throw new Error(`Invalid size format: ${sizeStr}`);
  }
}

export default parseStringSize;
