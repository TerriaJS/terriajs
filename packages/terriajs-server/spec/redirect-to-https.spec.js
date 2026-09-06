import supertestReq from "supertest";

import makeServer from "../lib/makeserver.js";

function buildApp(settings = {}, options = {}) {
  return makeServer({ hostName: "terria.example", ...options, settings });
}

describe("redirectToHttps host validation", () => {
  it("redirects http requests for the configured host to https", async () => {
    const app = buildApp({ redirectToHttps: true, hostName: "terria.example" });

    await supertestReq(app)
      .get("/some/path")
      .set("Host", "terria.example")
      .expect(301)
      .expect("Location", "https://terria.example/some/path");
  });

  it("rejects an unrecognized Host header with 400 instead of redirecting to it", async () => {
    const app = buildApp({ redirectToHttps: true, hostName: "terria.example" });

    const res = await supertestReq(app)
      .get("/some/path")
      .set("Host", "evil.example")
      .expect(400);

    expect(res.headers["location"]).toBeUndefined();
  });

  it("allows additional legitimate hosts via trustedHosts", async () => {
    const app = buildApp({
      redirectToHttps: true,
      hostName: "terria.example",
      trustedHosts: ["maps.terria.example"]
    });

    await supertestReq(app)
      .get("/x")
      .set("Host", "maps.terria.example")
      .expect(301)
      .expect("Location", "https://maps.terria.example/x");
  });

  it("does not reject hosts allowed to stay on http", async () => {
    const app = buildApp({
      redirectToHttps: true,
      hostName: "terria.example",
      httpAllowedHosts: ["localhost"]
    });

    const res = await supertestReq(app)
      .get("/some/path")
      .set("Host", "localhost");

    expect(res.status).not.toBe(400);
    expect(res.headers["location"]).toBeUndefined();
  });
});
