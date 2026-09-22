import { buildRequestHeaders } from "../../../lib/controllers/proxy/build-request-headers.js";

describe("buildRequestHeaders", () => {
  it('should remove authorization for "none" strategy', () => {
    const baseHeaders = {
      host: "example.com",
      authorization: "Bearer token"
    };
    const strategy = { type: "none" };

    const result = buildRequestHeaders(baseHeaders, strategy);

    expect(result.authorization).toBeUndefined();
    expect(result.host).toBe("example.com");
  });

  it("should set authorization for user strategy", () => {
    const baseHeaders = { host: "example.com" };
    const strategy = {
      type: "user",
      authorization: "Bearer user-token"
    };

    const result = buildRequestHeaders(baseHeaders, strategy);

    expect(result.authorization).toBe("Bearer user-token");
  });

  it("should set authorization and custom headers for proxy strategy", () => {
    const baseHeaders = { host: "example.com" };
    const strategy = {
      type: "proxy",
      authorization: "Bearer proxy-token",
      headers: [{ name: "X-Custom", value: "custom-value" }]
    };

    const result = buildRequestHeaders(baseHeaders, strategy);

    expect(result.authorization).toBe("Bearer proxy-token");
    expect(result["X-Custom"]).toBe("custom-value");
  });

  it("should set only custom headers if authorization is missing in proxy strategy", () => {
    const baseHeaders = { host: "example.com" };
    const strategy = {
      type: "proxy",
      headers: [{ name: "X-Custom", value: "custom-value" }]
    };

    const result = buildRequestHeaders(baseHeaders, strategy);

    expect(result.authorization).toBeUndefined();
    expect(result["X-Custom"]).toBe("custom-value");
  });

  it("should not mutate original headers", () => {
    const baseHeaders = { host: "example.com" };
    const originalHeaders = { ...baseHeaders };
    const strategy = { type: "user", authorization: "Bearer token" };

    buildRequestHeaders(baseHeaders, strategy);

    expect(baseHeaders).toEqual(originalHeaders);
  });
});
