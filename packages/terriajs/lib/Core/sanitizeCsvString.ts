import Papa from "papaparse";
import sanitizeCsvValue from "./sanitizeCsvValue";

/**
 * Parses a CSV string and re-serialises it with every cell passed through
 * {@link sanitizeCsvValue}, neutralising CSV/formula injection (CWE-1236) while
 * preserving cell values. The CSV is re-serialised (via papaparse), so exact
 * byte-for-byte formatting of the source is not preserved.
 */
export default function sanitizeCsvString(csv: string): string {
  const rows = Papa.parse<string[]>(csv).data;
  return Papa.unparse(rows.map((row) => row.map(sanitizeCsvValue)));
}
