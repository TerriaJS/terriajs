import { runInAction } from "mobx";
import { ApiTableCatalogItem } from "../../lib/Models/ApiTableCatalogItem";
import CommonStrata from "../../lib/Models/CommonStrata";
import proxyCatalogItemUrl from "../../lib/Models/proxyCatalogItemUrl";
import Terria from "../../lib/Models/Terria";

const regionMapping = JSON.stringify(
  require("../../wwwroot/data/regionMapping.json")
);

const positionApiResponse = JSON.stringify(
  require("../../wwwroot/test/JSON-api/position_api_response.json")
);
const valueApiResponse = JSON.stringify(
  require("../../wwwroot/test/JSON-api/value_api_response.json")
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
    let catalogJson = {
      idKey: "id",
      apis: [
        {
          apiUrl: "https://terria.io/values.json",
          keyToColumnMapping: [
            {
              columnName: "Value",
              keyInApiResponse: "value"
            }
          ]
        },
        {
          apiUrl: "https://terria.io/position.json",
          kind: "PER_ID",
          keyToColumnMapping: [
            {
              columnName: "latitude",
              keyInApiResponse: "latitude"
            },
            {
              columnName: "longitude",
              keyInApiResponse: "longitude"
            }
          ]
        }
      ]
    };
    const valueApiIdx = 0;
    const positionApiIdx = 1;
    runInAction(() => {
      apiCatalogItem.setTrait(
        CommonStrata.definition,
        "idKey",
        catalogJson.idKey
      );
      apiCatalogItem.setTrait(
        CommonStrata.definition,
        "apis",
        catalogJson.apis as any
      );
    });

    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionMapping.json"
    ).andReturn({ responseText: regionMapping });

    jasmine.Ajax.stubRequest(
      proxyCatalogItemUrl(
        apiCatalogItem,
        catalogJson.apis[positionApiIdx].apiUrl
      )
    ).andReturn({
      responseText: positionApiResponse
    });
    jasmine.Ajax.stubRequest(
      proxyCatalogItemUrl(apiCatalogItem, catalogJson.apis[valueApiIdx].apiUrl)
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
