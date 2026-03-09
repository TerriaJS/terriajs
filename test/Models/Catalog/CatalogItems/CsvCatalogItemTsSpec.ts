import { http, HttpResponse } from "msw";
import CsvCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import { runInAction } from "mobx";
import Terria from "../../../../lib/Models/Terria";
import { worker } from "../../../mocks/browser";

import latLonDateValueCsv from "../../../../wwwroot/test/csv/lat_lon_date_value.csv";
import regionMapping from "../../../../wwwroot/data/regionMapping.json";

describe("CsvCatalogItem", function () {
  let terria: Terria;
  let csv: CsvCatalogItem;

  beforeEach(function () {
    terria = new Terria();
    csv = new CsvCatalogItem("test", terria, undefined);
    worker.use(
      http.get("*/build/TerriaJS/data/regionMapping.json", () =>
        HttpResponse.json(regionMapping)
      )
    );
  });

  it("filters out duplicate discrete times", async function () {
    runInAction(() => {
      csv.setTrait("definition", "url", "test/csv/lat_lon_date_value.csv");
    });
    worker.use(
      http.get(
        "*/test/csv/lat_lon_date_value.csv",
        () => new HttpResponse(latLonDateValueCsv)
      )
    );

    await csv.loadMapItems();
    expect(csv.discreteTimes?.length).toEqual(3);
  });
});
