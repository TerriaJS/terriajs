import CzmlDataSource from "terriajs-cesium/Source/DataSources/CzmlDataSource";
import loadBlob from "../../../../lib/Core/loadBlob";
import loadJson from "../../../../lib/Core/loadJson";
import loadText from "../../../../lib/Core/loadText";
import TerriaError from "../../../../lib/Core/TerriaError";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import CzmlCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/CzmlCatalogItem";
import Terria from "../../../../lib/Models/Terria";

describe("CzmlCatalogItem", function () {
  let terria: Terria;
  let czml: CzmlCatalogItem;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    czml = new CzmlCatalogItem("test", terria);
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
      const czmlString = await loadText("test/CZML/verysimple.czml");
      czml.setTrait(CommonStrata.user, "czmlString", czmlString);
      await czml.loadMapItems();
      expect(czml.mapItems[0].entities.values.length).toBeGreaterThan(0);
    });

    it("works by json object", async function () {
      const czmlJson = await loadJson("test/CZML/verysimple.czml");
      czml.setTrait(CommonStrata.user, "czmlData", czmlJson);
      await czml.loadMapItems();
      expect(czml.mapItems[0].entities.values.length).toBeGreaterThan(0);
    });

    it("works by blob", async function () {
      const blob = (await loadBlob("test/CZML/verysimple.czml")) as File;
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
      const czmlString = await loadText("test/CZML/Vehicle.czml");
      czml.setTrait(CommonStrata.user, "czmlString", czmlString);
      await czml.loadMapItems();
      expect(czml.mapItems[0].entities.values.length).toBeGreaterThan(0);
    });

    it("works by blob", async function () {
      const blob = (await loadBlob("test/CZML/Vehicle.czml")) as File;
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
      let error = (await czml.loadMapItems()).error;

      expect(error instanceof TerriaError).toBe(true);
    });

    it("fails gracefully when the provided string is not JSON", async function () {
      const invalidCzmlString = await loadText("test/KML/vic_police.kml");
      czml.setTrait(CommonStrata.user, "czmlString", invalidCzmlString);
      let error = (await czml.loadMapItems()).error;

      expect(error instanceof TerriaError).toBe(true);
    });

    it("fails gracefully when the provided blob is not JSON", async function () {
      const invalidBlob = (await loadBlob("test/KML/vic_police.kml")) as File;
      czml.setFileInput(invalidBlob);
      let error = (await czml.loadMapItems()).error;

      expect(error instanceof TerriaError).toBe(true);
    });
  });

  describe("auto refreshing", async function () {
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
