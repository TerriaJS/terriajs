import { processTargetUrl } from "../../../lib/controllers/proxy/process-target-url.js";

describe("processTargetUrl", () => {
  it("should correctly process and return the target URL", () => {
    const target = "https://example.com/some/path";
    const result = processTargetUrl(target);
    expect(result).toBe("https://example.com/some/path");
  });

  it("should add http as protocol, if protocol is missing", () => {
    const target = "example.com/some/path";
    const result = processTargetUrl(target);
    expect(result).toBe("http://example.com/some/path");
  });

  it("should fix single slash after http protocol (i.e., 'http:/')", () => {
    const target = "http:/example.com/some/path";
    const result = processTargetUrl(target);
    expect(result).toBe("http://example.com/some/path");
  });

  it("should fix single slash after https protocol (i.e., 'https:/')", () => {
    const target = "https:/example.com/some/path";
    const result = processTargetUrl(target);
    expect(result).toBe("https://example.com/some/path");
  });

  it("should throw an error for empty target URL", () => {
    expect(() => processTargetUrl("")).toThrowError("No url specified.");
  });
});
