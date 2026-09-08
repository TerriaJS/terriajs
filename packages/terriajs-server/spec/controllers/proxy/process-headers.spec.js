import { processHeaders } from "../../../lib/controllers/proxy/process-headers.js";

describe("proxy processHeaders", () => {
  it("properly set headers", () => {
    const headers = {
      "Proxy-Connection": "delete me!",
      unfilteredheader: "don't delete me!"
    };

    const result = processHeaders(headers, 1200);
    expect(result["Proxy-Connection"]).toBeUndefined();
    expect(result.unfilteredheader).toBe(headers.unfilteredheader);
    expect(result["cache-control"]).toBe("public,max-age=1200");
    expect(result["access-control-allow-origin"]).toBe("*");
  });

  it("strips Set-Cookie headers from upstream responses", () => {
    const headers = {
      "Set-cookie": "session=abc123; Path=/; HttpOnly",
      "content-type": "application/json"
    };

    const result = processHeaders(headers, 1200);
    expect(result["Set-cookie"]).toBeUndefined();
    expect(result["content-type"]).toBe("application/json");
  });

  it("don't set duration when undefined", () => {
    const headers = {
      "Proxy-Connection": "delete me!",
      unfilteredheader: "don't delete me!"
    };

    const result = processHeaders(headers, undefined);
    expect(result["Proxy-Connection"]).toBeUndefined();
    expect(result.unfilteredheader).toBe(headers.unfilteredheader);
    expect(result["cache-control"]).toBeUndefined();
    expect(result["access-control-allow-origin"]).toBe("*");
  });

  describe("cache poisoning prevention", () => {
    it("uses private cache-control and Vary: Authorization when client auth was used", () => {
      const result = processHeaders(
        { "content-type": "application/json" },

        1200,
        { isAuthenticated: true, varyByAuthorization: true }
      );
      expect(result["cache-control"]).toBe("private,max-age=1200");
      expect(result["vary"]).toBe("Authorization");
    });

    it("uses private cache-control without Vary when server-configured auth was used", () => {
      const result = processHeaders(
        { "content-type": "application/json" },
        1200,
        { isAuthenticated: true, varyByAuthorization: false }
      );
      expect(result["cache-control"]).toBe("private,max-age=1200");
      expect(result["vary"]).toBeUndefined();
    });

    it("uses public cache-control and no Vary when request is not authenticated", () => {
      const result = processHeaders(
        { "content-type": "application/json" },
        1200,
        false
      );
      expect(result["cache-control"]).toBe("public,max-age=1200");
      expect(result["vary"]).toBeUndefined();
    });

    it("defaults to public cache-control and no Vary when isAuthenticated is omitted", () => {
      const result = processHeaders(
        { "content-type": "application/json" },
        1200
      );
      expect(result["cache-control"]).toBe("public,max-age=1200");
      expect(result["vary"]).toBeUndefined();
    });
  });
});
