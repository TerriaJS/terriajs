import sanitizeUrl from "../../lib/Core/sanitizeUrl";

describe("sanitizeUrl", function () {
  it("keeps http and https URLs", function () {
    expect(sanitizeUrl("http://example.com/a.csv")).toBe(
      "http://example.com/a.csv"
    );
    expect(sanitizeUrl("https://example.com/a.csv?x=1")).toBe(
      "https://example.com/a.csv?x=1"
    );
  });

  it("keeps blob: URLs (used by generated chart downloads)", function () {
    const url = "blob:https://example.com/1234-5678";
    expect(sanitizeUrl(url)).toBe(url);
  });

  it("keeps data: URLs", function () {
    const url = "data:text/csv;charset=utf-8,a,b%0A1,2";
    expect(sanitizeUrl(url)).toBe(url);
  });

  it("keeps scheme-relative and path-relative URLs", function () {
    expect(sanitizeUrl("/data/a.csv")).toBe("/data/a.csv");
    expect(sanitizeUrl("data/a.csv")).toBe("data/a.csv");
    expect(sanitizeUrl("//example.com/a.csv")).toBe("//example.com/a.csv");
  });

  it("rejects OS/app handler and script schemes", function () {
    expect(sanitizeUrl("vscode://attacker.ext/install")).toBeUndefined();
    expect(
      sanitizeUrl("ms-its:mhtml:file:///c:/x.cab::/i.html")
    ).toBeUndefined();
    expect(sanitizeUrl("slack://channel?team=x")).toBeUndefined();
    // eslint-disable-next-line no-script-url
    expect(sanitizeUrl("javascript:alert(1)")).toBeUndefined();
  });

  it("is not fooled by embedded control characters or whitespace", function () {
    expect(sanitizeUrl("java\tscript:alert(1)")).toBeUndefined();
    expect(sanitizeUrl("  vscode://x")).toBeUndefined();
    expect(sanitizeUrl(" javascript:alert(1)")).toBeUndefined();
  });

  it("is not fooled by unicode whitespace before the scheme", function () {
    // DOMPurify's ATTR_WHITESPACE ignores these, so we must too — otherwise a
    // dangerous scheme would be misread as a (safe) scheme-less relative URL.
    expect(sanitizeUrl(" vscode://x")).toBeUndefined();
    expect(sanitizeUrl(" javascript:alert(1)")).toBeUndefined();
    expect(sanitizeUrl("　ms-its:x")).toBeUndefined();
  });

  it("returns undefined for undefined input", function () {
    expect(sanitizeUrl(undefined)).toBeUndefined();
  });
});
