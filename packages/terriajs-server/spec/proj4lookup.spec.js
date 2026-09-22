import supertestReq from "supertest";
import makeserver from "../lib/makeserver.js";
import options from "../lib/options.js";

let server;

describe("proj4lookup", () => {
  beforeEach(() => {
    const opts = options.init(true);
    server = makeserver(opts);
  });

  describe("on get", () => {
    it("should return a definition for EPSG:4326", async () => {
      await supertestReq(server)
        .get("/api/v1/proj4def/EPSG:4326")
        .expect(200, "+proj=longlat +datum=WGS84 +no_defs");
    });

    it("should 400 for non-numeric EPSG code", async () => {
      await supertestReq(server)
        .get("/api/v1/proj4def/EPSG:Notarealthing")
        .expect(400);
    });

    it("should 404 for unknown projection", async () => {
      await supertestReq(server).get("/api/v1/proj4def/EPSG:99999").expect(404);
    });
  });
});
