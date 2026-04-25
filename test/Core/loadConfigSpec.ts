import { http, HttpResponse } from "msw";
import { loadConfig } from "../../lib/Core/loadConfig";
import { worker } from "../mocks/browser";

describe("loadConfig", function () {
  describe("loadConfig()", function () {
    it("fetches and parses JSON from the given URL", async function () {
      worker.use(
        http.get("*/config.json", () =>
          HttpResponse.json({ parameters: { appName: "TestApp" } })
        )
      );

      const config = await loadConfig("config.json");
      expect(config.parameters.appName).toBe("TestApp");
    });

    it("passes custom headers to the request", async function () {
      worker.use(
        http.get("*/config-with-auth.json", ({ request }) => {
          if (request.headers.get("Authorization") !== "Bearer token123") {
            return new HttpResponse(null, { status: 401 });
          }
          return HttpResponse.json({ parameters: { appName: "SecureApp" } });
        })
      );

      // Without headers the server rejects with 401
      await expectAsync(loadConfig("config-with-auth.json")).toBeRejected();

      // With the correct header the server responds and config is returned
      const config = await loadConfig("config-with-auth.json", {
        Authorization: "Bearer token123"
      });
      expect(config.parameters.appName).toBe("SecureApp");
    });

    it("throws when the URL returns a non-JSON response", async function () {
      worker.use(
        http.get(
          "*/bad-config.json",
          () =>
            new HttpResponse("not json {{{", {
              headers: { "Content-Type": "text/plain" }
            })
        )
      );

      await expectAsync(loadConfig("bad-config.json")).toBeRejected();
    });

    it("throws when the fetch fails", async function () {
      worker.use(http.get("*/unreachable.json", () => HttpResponse.error()));

      await expectAsync(loadConfig("unreachable.json")).toBeRejected();
    });
  });
});
