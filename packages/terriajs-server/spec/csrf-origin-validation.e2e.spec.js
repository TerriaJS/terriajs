import supertestReq from "supertest";

import makeServer from "../lib/makeserver.js";

// Verifies the CSRF guard is wired ahead of a state-changing router. /share is
// the representative endpoint (all three state-changing endpoints are wired
// identically via `endpoint(path, requireTrustedOrigin, router)`), and unlike
// feedback/esri it does not rely on the shared MSW mock. The guard
// short-circuits blocked requests, so the share backend is never reached (no
// external S3 call). Middleware logic is covered exhaustively by
// spec/controllers/origin-allowlist.spec.js.
function buildApp() {
  return makeServer({
    hostName: "terria.example",
    settings: {
      hostName: "terria.example",
      trustedHosts: ["maps.terria.example"],
      shareUrlPrefixes: {
        s: { service: "s3", bucket: "b", region: "us-east-1" }
      },
      newShareUrlPrefix: "s"
    }
  });
}

describe("CSRF origin validation on state-changing endpoints", () => {
  it("blocks a POST from an untrusted Origin with 403", async () => {
    await supertestReq(buildApp())
      .post("/api/v1/share")
      .set("Origin", "https://evil.example")
      .send("payload")
      .expect(403);
  });

  it("blocks a POST whose Referer is an untrusted origin", async () => {
    await supertestReq(buildApp())
      .post("/api/v1/share")
      .set("Referer", "https://evil.example/page")
      .send("payload")
      .expect(403);
  });
});
