import sanitizeCsvValue from "../../lib/Core/sanitizeCsvValue";

// CSV/formula injection (CWE-1236): spreadsheet apps interpret a cell whose
// value starts with = + - @ (or tab/CR) as a formula. We neutralise those by
// prefixing a single quote, but must not turn legitimate numbers into text.
describe("sanitizeCsvValue", function () {
  it("prefixes values a spreadsheet would treat as a formula", function () {
    expect(sanitizeCsvValue("=cmd|'/c calc.exe'!A1")).toBe(
      "'=cmd|'/c calc.exe'!A1"
    );
    expect(sanitizeCsvValue('=HYPERLINK("http://x")')).toBe(
      '\'=HYPERLINK("http://x")'
    );
    expect(sanitizeCsvValue("+EVIL")).toBe("'+EVIL");
    expect(sanitizeCsvValue("@SUM(A1:A5)")).toBe("'@SUM(A1:A5)");
    // Number-looking prefix that is actually a formula must still be prefixed.
    expect(sanitizeCsvValue("-5+cmd")).toBe("'-5+cmd");
    expect(sanitizeCsvValue("\t=1+1")).toBe("'\t=1+1");
  });

  it("does not turn legitimate numbers (including negatives) into text", function () {
    expect(sanitizeCsvValue("-5")).toBe("-5");
    expect(sanitizeCsvValue("-3.14")).toBe("-3.14");
    expect(sanitizeCsvValue("+10")).toBe("+10");
    expect(sanitizeCsvValue("-1.2e3")).toBe("-1.2e3");
  });

  it("leaves ordinary text unchanged", function () {
    expect(sanitizeCsvValue("hello")).toBe("hello");
    expect(sanitizeCsvValue("a,b")).toBe("a,b");
    expect(sanitizeCsvValue("2026-07-16")).toBe("2026-07-16");
  });

  it("stringifies non-strings and treats null/undefined as empty", function () {
    expect(sanitizeCsvValue(0)).toBe("0");
    expect(sanitizeCsvValue(false)).toBe("false");
    expect(sanitizeCsvValue(null)).toBe("");
    expect(sanitizeCsvValue(undefined)).toBe("");
  });
});
