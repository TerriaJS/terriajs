import { http, HttpResponse } from "msw";
import CzmlDataSource from "terriajs-cesium/Source/DataSources/CzmlDataSource";

import TerriaError from "../../../../lib/Core/TerriaError";
import CzmlCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/CzmlCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../../lib/Models/Terria";
import { worker } from "../../../mocks/browser";

import verysimpleCzml from "../../../../wwwroot/test/CZML/verysimple.czml" with { type: "json" };
import vehicleCzml from "../../../../wwwroot/test/CZML/Vehicle.czml" with { type: "json" };
import simpleCzml from "../../../../wwwroot/test/CZML/simple.czml" with { type: "json" };

describe("CzmlCatalogItem", function () {
  let terria: Terria;
  let czml: CzmlCatalogItem;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    czml = new CzmlCatalogItem("test", terria);

    worker.use(
      http.get("test/CZML/verysimple.czml", () =>
        HttpResponse.json(verysimpleCzml)
      ),
      http.get("test/CZML/Vehicle.czml", () => HttpResponse.json(vehicleCzml)),
      http.get("test/CZML/simple.czml", () => HttpResponse.json(simpleCzml)),
      http.get("test/KML/vic_police.kml", () =>
        HttpResponse.text("test string that is not JSON")
      )
    );
  });

  describe("loading a very simple CZML file", function () {
    it("works by URL", async function () {
      czml.setTrait(CommonStrata.user, "url", "test/CZML/verysimple.czml");
      await czml.loadMapItems();
      expect(czml.mapItems[0].entities.values.length).toBeGreaterThan(0);
    });

    it("proxies URLs", async function () {
      czml.setTrait(CommonStrata.user, "url", "https://someexternalurl/");
      czml.setTrait(CommonStrata.user, "forceProxy", true);
      const load = spyOn(CzmlDataSource, "load");
      await czml.loadMapItems();
      expect(load.calls.mostRecent().args[0]).toBe(
        "proxy/https://someexternalurl/"
      );
    });

    it("works by string", async function () {
      czml.setTrait(
        CommonStrata.user,
        "czmlString",
        JSON.stringify(verysimpleCzml)
      );
      await czml.loadMapItems();
      expect(czml.mapItems[0].entities.values.length).toBeGreaterThan(0);
    });

    it("works by json object", async function () {
      czml.setTrait(CommonStrata.user, "czmlData", verysimpleCzml);
      await czml.loadMapItems();
      expect(czml.mapItems[0].entities.values.length).toBeGreaterThan(0);
    });

    it("works by blob", async function () {
      const blob = new Blob([JSON.stringify(verysimpleCzml)], {
        type: "application/json"
      }) as File;
      czml.setFileInput(blob);
      await czml.loadMapItems();
      expect(czml.mapItems[0].entities.values.length).toBeGreaterThan(0);
    });
  });

  describe("loading a CZML file with a moving vehicle", function () {
    it("works by URL", async function () {
      czml.setTrait(CommonStrata.user, "url", "test/CZML/Vehicle.czml");
      await czml.loadMapItems();
      expect(czml.mapItems[0].entities.values.length).toBeGreaterThan(0);
    });

    it("works by string", async function () {
      czml.setTrait(
        CommonStrata.user,
        "czmlString",
        JSON.stringify(vehicleCzml)
      );
      await czml.loadMapItems();
      expect(czml.mapItems[0].entities.values.length).toBeGreaterThan(0);
    });

    it("works by blob", async function () {
      const blob = new Blob([JSON.stringify(vehicleCzml)], {
        type: "application/json"
      }) as File;
      czml.setFileInput(blob);
      await czml.loadMapItems();
      expect(czml.mapItems[0].entities.values.length).toBeGreaterThan(0);
    });
  });

  it("can load a CZML file with multiple moving and static objects", async function () {
    czml.setTrait(CommonStrata.user, "url", "test/CZML/simple.czml");
    await czml.loadMapItems();
    expect(czml.mapItems[0].entities.values.length).toBeGreaterThan(0);
  });

  describe("Time varying traits", function () {
    beforeEach(async function () {
      czml.setTrait(CommonStrata.user, "url", "test/CZML/Vehicle.czml");
      await czml.loadMapItems();
    });

    it("sets currentTime", function () {
      expect(czml.currentTime).toBe("2012-08-04T16:00:00Z");
    });

    it("sets startTime", function () {
      expect(czml.startTime).toBe("2012-08-04T16:00:00Z");
    });

    it("sets stopTime", function () {
      expect(czml.stopTime).toBe("2012-08-04T17:04:54.996219574019051Z");
    });

    it("sets multiplier", function () {
      expect(czml.multiplier).toBe(32);
    });
  });

  describe("error handling", function () {
    it("fails gracefully when the data at a URL is not JSON", async function () {
      czml.setTrait(CommonStrata.user, "url", "test/KML/vic_police.kml");
      const error = (await czml.loadMapItems()).error;

      expect(error instanceof TerriaError).toBe(true);
    });

    it("fails gracefully when the provided string is not JSON", async function () {
      czml.setTrait(
        CommonStrata.user,
        "czmlString",
        "test string that is not JSON"
      );
      const error = (await czml.loadMapItems()).error;

      expect(error instanceof TerriaError).toBe(true);
    });

    it("fails gracefully when the provided blob is not JSON", async function () {
      const invalidBlob = new Blob(["test string that is not JSON"], {
        type: "text/plain"
      }) as File;
      czml.setFileInput(invalidBlob);
      const error = (await czml.loadMapItems()).error;

      expect(error instanceof TerriaError).toBe(true);
    });
  });

  describe("auto refreshing", function () {
    it("reloads the datasource when refreshed", async function () {
      czml.setTrait(CommonStrata.user, "url", "test/CZML/Vehicle.czml");
      await czml.loadMapItems();
      const [dataSource] = czml.mapItems as [CzmlDataSource];
      expect(dataSource).toBeDefined("Expected datasource to be defined");
      spyOn(dataSource, "process");
      czml.refreshData();
      expect(dataSource.process).toHaveBeenCalledWith("test/CZML/Vehicle.czml");
    });
  });
});
