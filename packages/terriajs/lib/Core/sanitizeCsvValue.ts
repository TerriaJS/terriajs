// Characters that cause a spreadsheet (Excel, LibreOffice, Google Sheets) to
// treat a cell as a formula when it is the first character of the value.
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

/**
 * Returns `value` as a string, prefixed with a single quote when a spreadsheet
 * would otherwise interpret it as a formula (CSV/formula injection, CWE-1236).
 *
 * Legitimate numbers are left untouched — `"-5"` stays `"-5"` rather than
 * becoming the text `"'-5"` — by only prefixing values that are not a valid
 * number. This still catches disguised payloads such as `"-5+cmd"`, whose
 * numeric parse is `NaN`.
 *
 * This only guards the formula characters; callers are still responsible for
 * CSV structural escaping (quoting fields containing commas/quotes/newlines),
 * e.g. by passing the result through `Papa.unparse`.
 */
export default function sanitizeCsvValue(value: unknown): string {
  const str = value === undefined || value === null ? "" : String(value);
  if (FORMULA_TRIGGER.test(str) && Number.isNaN(Number(str))) {
    return "'" + str;
  }
  return str;
}
