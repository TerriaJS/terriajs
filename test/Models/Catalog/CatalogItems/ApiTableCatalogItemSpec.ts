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

describe("ApiTableCatalogItem", function () {
  let terria: Terria;
  let apiCatalogItem: ApiTableCatalogItem;

  beforeEach(function () {
    terria = new Terria();
    apiCatalogItem = new ApiTableCatalogItem("test", terria);
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it("creates a table from api calls", async function () {
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

  describe("behaviour of `responseDataPath` option", function () {
    beforeEach(function () {
      jasmine.Ajax.stubRequest(
        "build/TerriaJS/data/regionMapping.json"
      ).andReturn({ responseText: regionMapping });

      jasmine.Ajax.stubRequest(
        proxyCatalogItemUrl(apiCatalogItem, "https://terria.io/position.json")
      ).andReturn({
        responseText: positionApiResponse
      });

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
    });

    it("can extract value from a nested object", async function () {
      apiCatalogItem.apis[0].setTrait(
        CommonStrata.user,
        "responseDataPath",
        "records.nested.values"
      );
      jasmine.Ajax.stubRequest(
        proxyCatalogItemUrl(apiCatalogItem, "https://terria.io/values.json")
      ).andReturn({
        responseJSON: {
          records: {
            nested: {
              values: [
                {
                  id: 1,
                  value: 8
                },
                {
                  id: 2,
                  value: 9
                },
                {
                  id: 3,
                  value: 7
                }
              ]
            }
          }
        }
      });

      await apiCatalogItem.loadMapItems();
      const table = apiCatalogItem.dataColumnMajor;
      expect(table).toBeDefined();
      let definedTable: string[][] = table!;
      const valueColumn = definedTable.find(([name]) => name === "value");
      expect(valueColumn).toEqual(["value", "8", "9", "7"]);
    });

    it("can extract a single object from an array", async function () {
      apiCatalogItem.apis[0].setTrait(
        CommonStrata.user,
        "responseDataPath",
        "records[0]"
      );
      jasmine.Ajax.stubRequest(
        proxyCatalogItemUrl(apiCatalogItem, "https://terria.io/values.json")
      ).andReturn({
        responseJSON: {
          records: [
            [
              {
                id: 1,
                value: 8
              },
              {
                id: 2,
                value: 9
              }
            ],
            [
              {
                id: 3,
                value: 7
              }
            ]
          ]
        }
      });

      await apiCatalogItem.loadMapItems();
      const table = apiCatalogItem.dataColumnMajor;
      expect(table).toBeDefined();
      let definedTable: string[][] = table!;
      const valueColumn = definedTable.find(([name]) => name === "value");
      expect(valueColumn).toEqual(["value", "8", "9"]);
    });

    it("can extract multiple objects from an array", async function () {
      apiCatalogItem.apis[0].setTrait(
        CommonStrata.user,
        "responseDataPath",
        "records[].fields"
      );
      jasmine.Ajax.stubRequest(
        proxyCatalogItemUrl(apiCatalogItem, "https://terria.io/values.json")
      ).andReturn({
        responseJSON: {
          records: [
            {
              fields: {
                id: 1,
                value: 8
              }
            },
            {
              fields: {
                id: 2,
                value: 9
              }
            },
            {
              fields: {
                id: 3,
                value: 7
              }
            }
          ]
        }
      });

      await apiCatalogItem.loadMapItems();
      const table = apiCatalogItem.dataColumnMajor;
      expect(table).toBeDefined();
      let definedTable: string[][] = table!;
      const valueColumn = definedTable.find(([name]) => name === "value");
      expect(valueColumn).toEqual(["value", "8", "9", "7"]);
    });
  });

  describe("supports apiColumns", function () {
    beforeEach(function () {
      jasmine.Ajax.stubRequest(
        "build/TerriaJS/data/regionMapping.json"
      ).andReturn({ responseText: regionMapping });

      jasmine.Ajax.stubRequest(
        proxyCatalogItemUrl(apiCatalogItem, "https://terria.io/position.json")
      ).andReturn({
        responseText: positionApiResponse
      });

      runInAction(() => {
        updateModelFromJson(apiCatalogItem, CommonStrata.definition, {
          idKey: "id",
          apis: [
            {
              url: "https://terria.io/position.json"
            }
          ],
          columns: [
            {
              name: "id"
            },
            {
              name: "some embedded value"
            },
            {
              name: "some other embedded value"
            },
            {
              name: "some fake embedded value"
            }
          ],

          apiColumns: [
            {
              name: "some embedded value",
              responseDataPath: "some.embedded.0"
            },
            {
              name: "some other embedded value",
              responseDataPath: "some.embedded.1"
            },
            {
              name: "some fake embedded value",
              responseDataPath: "some.embedded.path.that[].does.not.exist.1"
            }
          ]
        });
      });
    });

    it("uses responseDataPath", async function () {
      await apiCatalogItem.loadMapItems();
      const table = apiCatalogItem.dataColumnMajor;
      expect(table).toBeDefined();
      let definedTable: string[][] = table!;
      const embeddedColumn = definedTable.find(
        ([name]) => name === "some embedded value"
      );
      expect(embeddedColumn).toEqual([
        "some embedded value",
        "first_element 1",
        "first_element 2",
        "first_element 3"
      ]);

      const otherEmbeddedColumn = definedTable.find(
        ([name]) => name === "some other embedded value"
      );
      expect(otherEmbeddedColumn).toEqual([
        "some other embedded value",
        "second_element 1",
        "second_element 2",
        "second_element 3"
      ]);

      const fakeEmbeddedColumn = definedTable.find(
        ([name]) => name === "some fake embedded value"
      );
      expect(fakeEmbeddedColumn).toEqual([
        "some fake embedded value",
        "",
        "",
        ""
      ]);
    });
  });
});
