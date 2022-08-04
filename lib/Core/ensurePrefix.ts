/**
 * Ensures that the given `str` ends with the given `char`.
 *
 */
export default function ensurePrefix(str: string, char: string): string {
  return str.endsWith(char) ? str : `${str}${char}`;
}
