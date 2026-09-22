import { makeOriginAllowlist } from "../../lib/controllers/origin-allowlist.js";

function mockReq(method, headers = {}) {
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
  );
  return { method, get: (name) => lower[name.toLowerCase()] };
}

function mockRes() {
  return {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    }
  };
}

function run(middleware, req) {
  const res = mockRes();
  let passed = false;
  middleware(req, res, () => {
    passed = true;
  });
  return { res, passed };
}

describe("makeOriginAllowlist", () => {
  const trustedHosts = new Set(["terria.example", "maps.terria.example"]);
  const guard = makeOriginAllowlist(trustedHosts);

  it("allows safe methods regardless of Origin", () => {
    const { passed } = run(
      guard,
      mockReq("GET", { Origin: "https://evil.example" })
    );
    expect(passed).toBe(true);
  });

  it("allows a state-changing request from a trusted Origin", () => {
    const { passed } = run(
      guard,
      mockReq("POST", { Origin: "https://terria.example" })
    );
    expect(passed).toBe(true);
  });

  it("blocks a state-changing request from an untrusted Origin with 403", () => {
    const { res, passed } = run(
      guard,
      mockReq("POST", { Origin: "https://evil.example" })
    );
    expect(passed).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it("allows a request that carries no Origin or Referer (non-browser client)", () => {
    const { passed } = run(guard, mockReq("POST", {}));
    expect(passed).toBe(true);
  });

  it("falls back to Referer when Origin is absent", () => {
    const trusted = run(
      guard,
      mockReq("POST", { Referer: "https://terria.example/some/page" })
    );
    expect(trusted.passed).toBe(true);

    const untrusted = run(
      guard,
      mockReq("POST", { Referer: "https://evil.example/x" })
    );
    expect(untrusted.passed).toBe(false);
    expect(untrusted.res.statusCode).toBe(403);
  });

  it("blocks when the Origin header is malformed", () => {
    const { res, passed } = run(
      guard,
      mockReq("POST", { Origin: "not a url" })
    );
    expect(passed).toBe(false);
    expect(res.statusCode).toBe(403);
  });
});
