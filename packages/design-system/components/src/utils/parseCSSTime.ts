// Reads a CSS time, such as "250ms" or "0.5s", as milliseconds. A bare
// number is taken as milliseconds
const parseCSSTime = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  const val = parseFloat(trimmed);
  if (Number.isNaN(val)) return undefined;
  if (trimmed.endsWith("ms")) return val;
  if (trimmed.endsWith("s")) return val * 1000;
  return val;
};

export { parseCSSTime };
