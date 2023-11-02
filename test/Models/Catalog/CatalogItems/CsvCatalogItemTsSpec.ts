import CsvCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import { runInAction } from "mobx";
import Terria from "../../../../lib/Models/Terria";

const latLonDateValueCsv = require("raw-loader!../../../../wwwroot/test/csv/lat_lon_date_value.csv");
const regionMapping = JSON.stringify(
  require("../../../../wwwroot/data/regionMapping.json")
);

describe("CsvCatalogItem", function () {
  let terria: Terria;
  let csv: CsvCatalogItem;

  beforeEach(function () {
    terria = new Terria();
    csv = new CsvCatalogItem("test", terria, undefined);
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionMapping.json"
    ).andReturn({ responseText: regionMapping });
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it("filters out duplicate discrete times", async function () {
    runInAction(() => {
      csv.setTrait("definition", "url", "test/csv/lat_lon_date_value.csv");
    });
    jasmine.Ajax.stubRequest("test/csv/lat_lon_date_value.csv").andReturn({
      responseText: latLonDateValueCsv
    });

    await csv.loadMapItems();
    expect(csv.discreteTimes?.length).toEqual(3);
  });
});
