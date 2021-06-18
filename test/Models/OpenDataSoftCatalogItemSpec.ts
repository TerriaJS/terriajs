import { runInAction } from "mobx";
import OpenDataSoftCatalogItem from "../../lib/Models/OpenDataSoftCatalogItem";
import Terria from "../../lib/Models/Terria";

const datasets = JSON.stringify(
  require("../../wwwroot/test/ods/datasets.json")
);

const groupBy = JSON.stringify(
  require("../../wwwroot/test/ods/weather-station-groupby.json")
);

const weatherStationData = JSON.stringify(
  require("../../wwwroot/test/ods/weather-station-100.json")
);

const regionMapping = JSON.stringify(
  require("../../wwwroot/data/regionMapping.json")
);

describe("OpenDataSoftCatalogItem", function() {
  let terria: Terria;
  let odsItem: OpenDataSoftCatalogItem;

  beforeEach(function() {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(
      "https://example.com/api/v2/catalog/datasets/weather-stations/"
    ).andReturn({
      responseText: datasets
    });
    jasmine.Ajax.stubRequest(
      "https://example.com/api/v2/catalog/datasets/weather-stations/records/?group_by=geolocation&limit=100&select=min%28metadata_time%29+as+min_time%2C+max%28metadata_time%29+as+max_time%2C+count%28metadata_time%29+as+num"
    ).andReturn({ responseText: groupBy });

    jasmine.Ajax.stubRequest(
      "https://example.com/api/v2/catalog/datasets/weather-stations/records/?limit=100&offset=0&order_by=metadata_time+DESC&select=metadata_time%2C+heat_stress_index%2C+geolocation"
    ).andReturn({ responseText: weatherStationData });

    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionMapping.json"
    ).andReturn({ responseText: regionMapping });

    terria = new Terria();
    odsItem = new OpenDataSoftCatalogItem("test", terria, undefined);
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it("has a type", function() {
    expect(odsItem.type).toBe("opendatasoft-item");
  });

  describe("loads dataset", function() {
    beforeEach(async function() {
      runInAction(() => {
        odsItem.setTrait("definition", "url", "https://example.com");
        odsItem.setTrait("definition", "datasetId", "weather-stations");
      });
    });

    it("load map items", async function() {
      await odsItem.loadMapItems();

      expect(odsItem.name).toBe("Environmental sensors");
      expect(odsItem.description?.length).toBe(244);
      expect(odsItem.datasetId).toBe("weather-stations");
    });
  });
});
