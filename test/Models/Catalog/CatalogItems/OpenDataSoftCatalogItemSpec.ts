import { runInAction } from "mobx";
import { http, HttpResponse } from "msw";
import OpenDataSoftCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/OpenDataSoftCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import { worker } from "../../../mocks/browser";

import dataset from "../../../../wwwroot/test/ods/weather-station-dataset.json";
import groupBy from "../../../../wwwroot/test/ods/weather-station-groupby.json";
import weatherStationData from "../../../../wwwroot/test/ods/weather-station-100.json";
import regionMapping from "../../../../wwwroot/data/regionMapping.json";

describe("OpenDataSoftCatalogItem", function () {
  let terria: Terria;
  let odsItem: OpenDataSoftCatalogItem;

  beforeEach(function () {
    worker.use(
      http.get(
        "https://example.com/api/v2/catalog/datasets/weather-stations/",
        () => HttpResponse.json(dataset)
      ),
      http.get(
        "https://example.com/api/v2/catalog/datasets/weather-stations/records/",
        ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.has("group_by"))
            return HttpResponse.json(groupBy);
          if (url.searchParams.has("order_by"))
            return HttpResponse.json(weatherStationData);
          throw new Error(`Unexpected query params: ${url.search}`);
        }
      ),
      http.get("*/build/TerriaJS/data/regionMapping.json", () =>
        HttpResponse.json(regionMapping)
      )
    );

    terria = new Terria();
    odsItem = new OpenDataSoftCatalogItem("test", terria, undefined);
  });

  it("has a type", function () {
    expect(odsItem.type).toBe("opendatasoft-item");
  });

  describe("loads dataset", function () {
    beforeEach(function () {
      runInAction(() => {
        odsItem.setTrait("definition", "url", "https://example.com");
        odsItem.setTrait("definition", "datasetId", "weather-stations");
      });
    });

    it("load map items", async function () {
      await odsItem.loadMapItems();

      expect(odsItem.name).toBe("Environmental sensors");
      expect(odsItem.description?.length).toBe(244);
      expect(odsItem.datasetId).toBe("weather-stations");
    });

    it("sets refreshInterval from refreshIntervalTemplate", async function () {
      odsItem.setTrait(
        CommonStrata.definition,
        "refreshIntervalTemplate",
        "{{metas.custom.update_frequency}}"
      );
      await odsItem.loadMapItems();

      // metametas.custom.update_frequency = "10 min"
      expect(odsItem.refreshInterval).toBe(10 * 60);
    });
  });
});
