import fs from "node:fs";
import supertestReq from "supertest";
import singlePageRouting from "../lib/controllers/single-page-routing.js";
import makeServer from "../lib/makeserver.js";
import options from "../lib/options.js";

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe("single-page-routing", () => {
  const appOptions = {
    wwwroot: "./spec/mockwwwroot"
  };
  const badAppOptions = {
    wwwroot: "./spec/nonexistentwwwroot"
  };

  const routingOffOptions = {
    resolveUnmatchedPathsWithIndexHtml: false
  };

  const routingOnOptions = {
    resolvePathRelativeToWwwroot: "/index.html",
    resolveUnmatchedPathsWithIndexHtml: true
  };

  describe("using controller", () => {
    const errorMatcher = (error) => {
      if (
        error.message.indexOf("`resolvePathRelativeToWwwroot` does not exist")
      ) {
        return true;
      }
    };
    describe("should throw", () => {
      it("with bad wwwroot", () => {
        expect(() => {
          const serverOptions = {
            ...badAppOptions,
            settings: {
              singlePageRouting: {
                ...routingOnOptions
              }
            }
          };
          singlePageRouting(serverOptions, routingOnOptions);
        }).toThrow();
      });
      it("with good wwwroot, specifying invalid path", () => {
        expect(() => {
          const serverOptions = {
            ...badAppOptions,
            settings: {
              singlePageRouting: {
                resolvePathRelativeToWwwroot: "/does-not-exist.html",
                resolveUnmatchedPathsWithIndexHtml: true
              }
            }
          };
          singlePageRouting(serverOptions, routingOnOptions);
        }).toThrowMatching(errorMatcher);
      });
    });
    describe("should not throw", () => {
      it("with good wwwroot and routing off", () => {
        expect(() => {
          const serverOptions = {
            ...appOptions,
            settings: {
              singlePageRouting: {
                ...routingOffOptions
              }
            }
          };
          singlePageRouting(serverOptions, routingOffOptions);
        }).not.toThrow();
      });
      it("with good wwwroot", () => {
        expect(() => {
          const serverOptions = {
            ...appOptions,
            settings: {
              singlePageRouting: {
                ...routingOnOptions
              }
            }
          };
          singlePageRouting(serverOptions, routingOnOptions);
        }).not.toThrow();
      });
    });
  });

  describe("on get with routing off,", () => {
    it("should 404 blah route", async () => {
      await supertestReq(buildApp(routingOffOptions)).get("/blah").expect(404);
    });
    it("should resolve an actual html file", async () => {
      const response = await supertestReq(buildApp(routingOffOptions))
        .get("/actual-html-file.html")
        .expect(200)
        .expect("Content-Type", /html/);

      expect(response.text).toBe(
        fs.readFileSync(`${appOptions.wwwroot}/actual-html-file.html`, "utf8")
      );
    });
    it("should resolve an actual json file", async () => {
      const response = await supertestReq(buildApp(routingOffOptions))
        .get("/actual-json.json")
        .expect(200)
        .expect("Content-Type", /json/);

      expect(response.text).toBe(
        fs.readFileSync(`${appOptions.wwwroot}/actual-json.json`, "utf8")
      );
    });
  });

  describe("on get with routing on,", () => {
    it("should resolve unmatched route with the optioned path", async () => {
      const response = await supertestReq(buildApp(routingOnOptions))
        .get("/blah")
        .expect(200)
        .expect("Content-Type", /html/);
      expect(response.text).toBe(
        fs.readFileSync(
          appOptions.wwwroot + routingOnOptions.resolvePathRelativeToWwwroot,
          "utf8"
        )
      );
    });
    it("should resolve an actual html file", async () => {
      const response = await supertestReq(buildApp(routingOnOptions))
        .get("/actual-html-file.html")
        .expect(200)
        .expect("Content-Type", /html/);
      expect(response.text).toBe(
        fs.readFileSync(`${appOptions.wwwroot}/actual-html-file.html`, "utf8")
      );
    });
    it("should resolve an actual json file", async () => {
      const response = await supertestReq(buildApp(routingOnOptions))
        .get("/actual-json.json")
        .expect(200)
        .expect("Content-Type", /json/);
      expect(response.text).toBe(
        fs.readFileSync(`${appOptions.wwwroot}/actual-json.json`, "utf8")
      );
    });
  });

  describe("on post,", () => {
    it("should error out with routing off", async () => {
      await supertestReq(buildApp(routingOffOptions))
        .post("/mochiRoute")
        .expect(404);
    });
    it("should error out with routing on", async () => {
      await supertestReq(buildApp(routingOnOptions))
        .post("/mochiRoute")
        .expect(404);
    });
  });

  function buildApp(spaOptions) {
    const opts = options.init(true);
    const serverOptions = {
      ...appOptions,
      settings: {
        singlePageRouting: {
          ...spaOptions
        }
      }
    };
    const mergedOptions = Object.assign(opts, serverOptions);
    const app = makeServer(mergedOptions);
    app.use((err, _req, res) => {
      console.error(err.stack);
      res.status(500).send("Something broke!");
    });
    return app;
  }
});
