import { buildRemoteUrl } from "../../../lib/controllers/proxy/build-remote-url.js";

describe("buildRemoteUrl", () => {
  it("should build URL with query params from request", () => {
    const target = "http://example.com/path";
    const requestUrl = new URL(
      "http://example.com/path?param1=value1&param2=value2"
    );

    const result = buildRemoteUrl(target, requestUrl);

    expect(result.href).toBe(
      "http://example.com/path?param1=value1&param2=value2"
    );
  });

  it("should build URL without query params when none in request and none in config", () => {
    const target = "http://example.com/path";
    const requestUrl = new URL("http://example.com/path");

    const result = buildRemoteUrl(target, requestUrl);

    expect(result.href).toBe("http://example.com/path");
  });

  it("should append configured params for matching host and pattern", () => {
    const target = "http://example.com/api";
    const requestUrl = new URL("http://example.com/api");
    const appendConfig = {
      "example.com": [
        {
          regexPattern: "api",
          params: { key: "value" }
        }
      ]
    };

    const result = buildRemoteUrl(target, requestUrl, appendConfig);

    expect(result.searchParams.get("key")).toBe("value");
  });

  it("should not append configured params for non-matching pattern", () => {
    const target = "http://example.com/api";
    const requestUrl = new URL("http://example.com/api");
    const appendConfig = {
      "example.com": [
        {
          regexPattern: "other",
          params: { key: "value" }
        }
      ]
    };

    const result = buildRemoteUrl(target, requestUrl, appendConfig);

    expect(result.searchParams.get("key")).toBeNull();
  });

  it("should append multiple params from multiple matching config entries", () => {
    const target = "http://example.com/api/path";
    const requestUrl = new URL("http://example.com/api/path");
    const appendConfig = {
      "example.com": [
        {
          regexPattern: "api/path",
          params: { key1: "value1" }
        },
        {
          regexPattern: "api",
          params: { key2: "value2" }
        }
      ]
    };

    const result = buildRemoteUrl(target, requestUrl, appendConfig);

    expect(result.searchParams.get("key1")).toBe("value1");
    expect(result.searchParams.get("key2")).toBe("value2");
  });

  it("should handle targets with existing query params", () => {
    const target = "http://example.com/api/path";
    const requestUrl = new URL("http://example.com/api/path?existing=param");
    const appendConfig = {
      "example.com": [
        {
          regexPattern: "path",
          params: { key1: "value1" }
        },
        {
          regexPattern: "api",
          params: { key2: "value2" }
        }
      ]
    };

    const result = buildRemoteUrl(target, requestUrl, appendConfig);

    expect(result.href).toBe(
      "http://example.com/api/path?existing=param&key1=value1&key2=value2"
    );
  });
});
