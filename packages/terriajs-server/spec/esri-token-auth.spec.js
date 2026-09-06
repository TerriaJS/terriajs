import makeServer from "../lib/makeserver.js";
import supertestReq from "supertest";
import { http, HttpResponse, passthrough } from "msw";
import { setupServer } from "msw/node";
import options from "../lib/options.js";

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

const localRequestHandler = http.all("*", ({ request }) => {
  if (request.url.includes("127.0.0.1")) {
    return passthrough();
  }
});

describe("esri-token-auth endpoint", () => {
  const server = setupServer(localRequestHandler);
  const testTokenUrl = "https://test.arcgis.com/sharing/rest/generateToken";
  const testServerUrl = "https://test.arcgis.com/arcgis/rest/services";

  const appOptions = {
    wwwroot: "./spec/mockwwwroot",
    hostName: "localhost",
    port: "3001",
    settings: {
      esriTokenAuth: {
        servers: {
          [testServerUrl]: {
            tokenUrl: testTokenUrl,
            username: "testuser",
            password: "testpass"
          }
        }
      }
    }
  };

  function buildApp() {
    const opts = options.init(true);
    const mergedOptions = Object.assign({}, opts, appOptions);
    return makeServer(mergedOptions);
  }

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "bypass" });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe("POST /esri-token-auth", () => {
    it("should return 200 and token for valid request", async () => {
      const mockToken = "mock_token_12345";
      const mockExpires = Date.now() + 3600000;

      server.use(
        http.post(
          "https://test.arcgis.com/sharing/rest/generateToken",
          async ({ request }) => {
            // Verify headers
            expect(request.headers.get("User-Agent")).toBe(
              "TerriaJSESRITokenAuth"
            );
            expect(request.headers.get("Content-Type")).toBe(
              "application/x-www-form-urlencoded"
            );

            // Verify form data
            const body = await request.text();
            expect(body).toContain("username=testuser");
            expect(body).toContain("password=testpass");
            expect(body).toContain("f=JSON");

            return HttpResponse.json(
              { token: mockToken, expires: mockExpires },
              { status: 200 }
            );
          }
        )
      );

      await supertestReq(buildApp())
        .post("/esri-token-auth")
        .send({ url: testServerUrl })
        .expect(200)
        .expect("Content-Type", /json/)
        .expect((res) => {
          expect(res.body.token).toBe(mockToken);
          expect(res.body.expires).toBe(mockExpires);
        });
    });

    it("should return 400 when no URL is specified", async () => {
      await supertestReq(buildApp())
        .post("/esri-token-auth")
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.text).toBe("No URL specified.");
        });
    });

    it("should return 400 when URL is empty string", async () => {
      await supertestReq(buildApp())
        .post("/esri-token-auth")
        .send({ url: "" })
        .expect(400)
        .expect((res) => {
          expect(res.text).toBe("No URL specified.");
        });
    });

    it("should return 400 when invalid URL is specified", async () => {
      await supertestReq(buildApp())
        .post("/esri-token-auth")
        .send({ url: 5 })
        .expect(400)
        .expect((res) => {
          expect(res.text).toBe("Invalid URL specified.");
        });
    });

    it("should return 400 when URL is not configured", async () => {
      await supertestReq(buildApp())
        .post("/esri-token-auth")
        .send({
          url: "https://unconfigured.arcgis.com/arcgis/rest/services"
        })
        .expect(400)
        .expect((res) => {
          expect(res.text).toBe("Unsupported URL specified.");
        });
    });

    it("should return 502 when token server returns non-200 status", async () => {
      server.use(
        http.post("https://test.arcgis.com/sharing/rest/generateToken", () => {
          return HttpResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
          );
        })
      );

      await supertestReq(buildApp())
        .post("/esri-token-auth")
        .send({ url: testServerUrl })
        .expect(502)
        .expect((res) => {
          expect(res.text).toBe("Token server failed.");
        });
    });

    it("should return 500 when token server returns invalid JSON", async () => {
      server.use(
        http.post("https://test.arcgis.com/sharing/rest/generateToken", () => {
          return new HttpResponse("Not valid JSON", {
            status: 200
          });
        })
      );

      await supertestReq(buildApp())
        .post("/esri-token-auth")
        .send({ url: testServerUrl })
        .expect(500)
        .expect((res) => {
          expect(res.text).toBe("Error processing server response.");
        });
    });
  });

  describe("when esri-token-auth is not configured", () => {
    it("should not register the endpoint", async () => {
      const optionsWithoutEsri = {
        wwwroot: "./spec/mockwwwroot",
        hostName: "localhost",
        port: "3001",
        settings: {}
      };

      const opts = options.init(true);
      const mergedOptions = Object.assign({}, opts, optionsWithoutEsri);
      const app = makeServer(mergedOptions);

      await supertestReq(app)
        .post("/esri-token-auth")
        .send({ url: testServerUrl })
        .expect(404); // Endpoint should not exist
    });
  });
});
