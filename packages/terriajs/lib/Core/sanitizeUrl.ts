// Schemes that are safe to use as a link/reference URL. Anything with a scheme
// outside this set (eg. `vscode:`, `ms-its:`, `slack:`, `javascript:`) is
// rejected so that attacker-influenced values (eg. a chart's `sources`/`src`/
// `downloads` attributes) cannot launch OS/app handlers when the value is later
// used as an `href`. URLs with no scheme (path- or protocol-relative) are safe.
const ALLOWED_URL_SCHEMES = ["http", "https", "blob", "data"];

// Control characters and whitespace are stripped before detecting the scheme so
// eslint-disable-next-line no-irregular-whitespace
// that values like "java\tscript:" or " vscode:" cannot slip past the
// check. This matches DOMPurify's ATTR_WHITESPACE set, keeping our scheme
// detection consistent with the whitespace DOMPurify itself ignores.
const CONTROL_AND_WHITESPACE =
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g;
const SCHEME = /^([a-zA-Z][a-zA-Z0-9+.-]*):/;

/**
 * Returns `url` unchanged when its scheme is safe to use as a link/reference,
 * otherwise returns undefined.
 */
export default function sanitizeUrl(
  url: string | undefined
): string | undefined {
  if (url === undefined) {
    return undefined;
  }
  const match = SCHEME.exec(url.replace(CONTROL_AND_WHITESPACE, ""));
  if (match === null) {
    return url;
  }
  return ALLOWED_URL_SCHEMES.includes(match[1].toLowerCase()) ? url : undefined;
}
