import { validateAppendParamToQueryString } from "../../../lib/controllers/proxy/validate-append-param-to-query-string.js";

describe("validateAppendParamToQueryString", () => {
  it("accepts a config whose patterns are valid and ReDoS-safe", () => {
    expect(() =>
      validateAppendParamToQueryString({
        "example.com": [{ regexPattern: "api", params: { key: "value" } }]
      })
    ).not.toThrow();
  });

  it("accepts an empty config", () => {
    expect(() => validateAppendParamToQueryString({})).not.toThrow();
    expect(() => validateAppendParamToQueryString()).not.toThrow();
  });

  it("throws for a pattern vulnerable to catastrophic backtracking", () => {
    expect(() =>
      validateAppendParamToQueryString({
        "example.com": [{ regexPattern: "(a+)+$", params: { key: "value" } }]
      })
    ).toThrowError(/unsafe.*regular expression.*\(a\+\)\+\$/i);
  });

  it("throws for a syntactically invalid pattern", () => {
    expect(() =>
      validateAppendParamToQueryString({
        "example.com": [{ regexPattern: "(", params: { key: "value" } }]
      })
    ).toThrowError(/invalid.*regular expression/i);
  });

  it("names the offending host to aid the operator", () => {
    expect(() =>
      validateAppendParamToQueryString({
        "tiles.example.org": [
          { regexPattern: "(a+)+$", params: { key: "value" } }
        ]
      })
    ).toThrowError(/tiles\.example\.org/);
  });
});
