import supertestReq from "supertest";

import makeServer from "../lib/makeserver.js";

function buildApp(settings = {}) {
  return makeServer({ hostName: "localhost", settings });
}

describe("security headers", () => {
  it("sets X-Content-Type-Options: nosniff", async () => {
    await supertestReq(buildApp())
      .get("/api/v1/ping")
      .expect("X-Content-Type-Options", "nosniff");
  });

  it("sets a Referrer-Policy", async () => {
    const res = await supertestReq(buildApp()).get("/api/v1/ping");
    expect(res.headers["referrer-policy"]).toBeDefined();
  });

  it("sends CSP in report-only mode by default, pointing at the report endpoint", async () => {
    const res = await supertestReq(buildApp()).get("/api/v1/ping");
    const csp = res.headers["content-security-policy-report-only"];
    expect(csp).toBeDefined();
    expect(res.headers["content-security-policy"]).toBeUndefined();
    expect(csp).toContain("report-uri /csp-report");
    // TerriaJS/Cesium load workers and textures from blob: URLs
    expect(csp).toContain("worker-src");
    expect(csp).toContain("blob:");
  });

  it("does not send X-Frame-Options (iframe embedding is a supported feature)", async () => {
    const res = await supertestReq(buildApp()).get("/api/v1/ping");
    expect(res.headers["x-frame-options"]).toBeUndefined();
  });

  it("does not restrict cross-origin resource consumption (proxy serves cross-origin)", async () => {
    const res = await supertestReq(buildApp()).get("/api/v1/ping");
    expect(res.headers["cross-origin-resource-policy"]).toBeUndefined();
  });

  it("accepts a CSP violation report at /csp-report", async () => {
    await supertestReq(buildApp())
      .post("/csp-report")
      .set("Content-Type", "application/csp-report")
      .send(
        JSON.stringify({
          "csp-report": {
            "document-uri": "https://terria.example/",
            "violated-directive": "img-src",
            "blocked-uri": "blob:"
          }
        })
      )
      .expect(204);
  });

  it("can be disabled via securityHeaders: false", async () => {
    const res = await supertestReq(buildApp({ securityHeaders: false })).get(
      "/api/v1/ping"
    );
    expect(res.headers["x-content-type-options"]).toBeUndefined();
    expect(res.headers["content-security-policy-report-only"]).toBeUndefined();
  });

  it("lets an operator override any helmet option, e.g. enable HSTS", async () => {
    const res = await supertestReq(
      buildApp({ securityHeaders: { helmet: { hsts: { maxAge: 100 } } } })
    ).get("/api/v1/ping");
    expect(res.headers["strict-transport-security"]).toContain("max-age=100");
  });

  it("lets an operator opt in to frame denial via override", async () => {
    const res = await supertestReq(
      buildApp({
        securityHeaders: { helmet: { frameguard: { action: "deny" } } }
      })
    ).get("/api/v1/ping");
    expect(res.headers["x-frame-options"]).toBe("DENY");
  });
});
