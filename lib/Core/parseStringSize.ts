function parseStringSize(sizeStr: string): number | undefined {
  const sizeUnitRegex = /(\d+)(KB|MB|GB|TB)?$/i;
  const match = sizeStr.match(sizeUnitRegex);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    if (!unit) {
      // assume bytes by default
      return value;
    }
    switch (unit.toUpperCase()) {
      case "KB":
        return value * 1024; // 1 KB = 1024 bytes
      case "MB":
        return value * 1024 ** 2; // 1 MB = 1024^2 bytes
      case "GB":
        return value * 1024 ** 3; // 1 GB = 1024^3 bytes
      case "TB":
        return value * 1024 ** 4; // 1 TB = 1024^4 bytes
    }
  } else {
    throw new Error(`Invalid share size format: ${sizeStr}`);
  }
}
export default parseStringSize;
