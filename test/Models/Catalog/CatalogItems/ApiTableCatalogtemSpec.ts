import { runInAction } from "mobx";
import { ApiTableCatalogItem } from "../../../../lib/Models/Catalog/CatalogItems/ApiTableCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import proxyCatalogItemUrl from "../../../../lib/Models/Catalog/proxyCatalogItemUrl";
import Terria from "../../../../lib/Models/Terria";
import updateModelFromJson from "../../../../lib/Models/Definition/updateModelFromJson";

const regionMapping = JSON.stringify(
  require("../../../../wwwroot/data/regionMapping.json")
);

const positionApiResponse = JSON.stringify(
  require("../../../../wwwroot/test/JSON-api/position_api_response.json")
);
const valueApiResponse = JSON.stringify(
  require("../../../../wwwroot/test/JSON-api/value_api_response.json")
);

describe("ApiTableCatalogItem", function() {
  let terria: Terria;
  let apiCatalogItem: ApiTableCatalogItem;

  beforeEach(function() {
    terria = new Terria();
    apiCatalogItem = new ApiTableCatalogItem("test", terria);
    jasmine.Ajax.install();
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it("creates a table from api calls", async function() {
    const valueApiIdx = 0;
    const positionApiIdx = 1;
    runInAction(() => {
      updateModelFromJson(apiCatalogItem, CommonStrata.definition, {
        idKey: "id",
        apis: [
          {
            url: "https://terria.io/values.json"
          },
          {
            url: "https://terria.io/position.json",
            kind: "PER_ID"
          }
        ],
        columns: [
          {
            title: "Value",
            name: "value"
          },
          {
            title: "latitude",
            name: "latitude"
          },
          {
            title: "longitude",
            name: "longitude"
          }
        ]
      });
    });

    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionMapping.json"
    ).andReturn({ responseText: regionMapping });

    jasmine.Ajax.stubRequest(
      proxyCatalogItemUrl(apiCatalogItem, "https://terria.io/position.json")
    ).andReturn({
      responseText: positionApiResponse
    });
    jasmine.Ajax.stubRequest(
      proxyCatalogItemUrl(apiCatalogItem, "https://terria.io/values.json")
    ).andReturn({
      responseText: valueApiResponse
    });

    await apiCatalogItem.loadMapItems();
    const table = apiCatalogItem.dataColumnMajor;
    expect(table).toBeDefined();
    let definedTable: string[][] = table!;
    // count columns
    expect(definedTable.length).toBe(3); // value, latitude, longitude
    // count rows
    expect(definedTable[0].length).toBe(4); // header + 3 value rows
  });
});
