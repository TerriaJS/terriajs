import { buildAuthStrategies } from "../../../lib/controllers/proxy/build-auth-strategies.js";

describe("buildAuthStrategies", () => {
  it('should return only "none" when no auth is configured', () => {
    const strategies = buildAuthStrategies({
      userAuth: null,
      proxyAuth: {},
      host: "example.com"
    });

    expect(strategies).toEqual([{ type: "none" }]);
  });

  it("should return user auth, proxy auth, then none", () => {
    const strategies = buildAuthStrategies({
      userAuth: "Bearer user-token",
      proxyAuth: {
        "example.com": {
          authorization: "Bearer proxy-token",
          headers: [{ name: "X-Key", value: "secret" }]
        }
      },
      host: "example.com"
    });

    expect(strategies).toEqual([
      {
        type: "user",
        authorization: "Bearer user-token"
      },
      {
        type: "proxy",
        authorization: "Bearer proxy-token",
        headers: [{ name: "X-Key", value: "secret" }]
      },
      {
        type: "none"
      }
    ]);
  });

  it("should skip user auth when not configured", () => {
    const strategies = buildAuthStrategies({
      userAuth: null,
      proxyAuth: {
        "example.com": {
          authorization: "Bearer proxy-token"
        }
      },
      host: "example.com"
    });

    expect(strategies).toEqual([
      {
        type: "proxy",
        authorization: "Bearer proxy-token",
        headers: undefined
      },
      { type: "none" }
    ]);
  });

  it("should skip proxy auth for different host", () => {
    const strategies = buildAuthStrategies({
      userAuth: "Bearer user-token",
      proxyAuth: {
        "other.com": {
          authorization: "Bearer proxy-token"
        }
      },
      host: "example.com"
    });

    expect(strategies).toEqual([
      { type: "user", authorization: "Bearer user-token" },
      { type: "none" }
    ]);
  });
});
