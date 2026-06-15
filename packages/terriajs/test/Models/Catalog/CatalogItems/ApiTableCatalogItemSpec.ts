import { http, HttpResponse } from "msw";
import { runInAction } from "mobx";
import { ApiTableCatalogItem } from "../../../../lib/Models/Catalog/CatalogItems/ApiTableCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../../lib/Models/Terria";
import updateModelFromJson from "../../../../lib/Models/Definition/updateModelFromJson";
import { worker } from "../../../mocks/browser";

import regionMapping from "../../../../wwwroot/data/regionMapping.json";
import positionApiResponse from "../../../../wwwroot/test/JSON-api/position_api_response.json";
import valueApiResponse from "../../../../wwwroot/test/JSON-api/value_api_response.json";

describe("ApiTableCatalogItem", function () {
  let terria: Terria;
  let apiCatalogItem: ApiTableCatalogItem;

  beforeEach(function () {
    terria = new Terria();
    apiCatalogItem = new ApiTableCatalogItem("test", terria);
  });

  describe("query parameters", function () {
    beforeEach(function () {
      updateModelFromJson(apiCatalogItem, CommonStrata.definition, {
        idKey: "id",
        queryParameters: [
          { name: "commonparam", value: "foo" },
          { name: "dateparam", value: "DATE!yymmdd" }
        ],
        apis: [
          {
            url: "https://terria.io/values.json",
            queryParameters: [{ name: "apiparam", value: "bar" }]
          }
        ]
      });

      worker.use(
        http.get("*/build/TerriaJS/data/regionMapping.json", () =>
          HttpResponse.json(regionMapping)
        )
      );
    });

    it("adds common queryParameters to URL", async function () {
      worker.use(
        http.get("https://terria.io/values.json", ({ request }) => {
          if (new URL(request.url).searchParams.get("commonparam") !== "foo")
            return HttpResponse.error();
          return HttpResponse.json(valueApiResponse);
        })
      );
      await apiCatalogItem.loadMapItems();
      expect(apiCatalogItem.dataColumnMajor).toBeDefined();
    });

    it("adds api specific queryParameters to URL", async function () {
      worker.use(
        http.get("https://terria.io/values.json", ({ request }) => {
          if (new URL(request.url).searchParams.get("apiparam") !== "bar")
            return HttpResponse.error();
          return HttpResponse.json(valueApiResponse);
        })
      );
      await apiCatalogItem.loadMapItems();
      expect(apiCatalogItem.dataColumnMajor).toBeDefined();
    });

    it("substitutes date values", async function () {
      worker.use(
        http.get("https://terria.io/values.json", ({ request }) => {
          if (
            !/^[0-9]{6}$/.test(
              new URL(request.url).searchParams.get("dateparam") ?? ""
            )
          )
            return HttpResponse.error();
          return HttpResponse.json(valueApiResponse);
        })
      );
      await apiCatalogItem.loadMapItems();
      expect(apiCatalogItem.dataColumnMajor).toBeDefined();
    });
  });

  it("creates a table from api calls", async function () {
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

    worker.use(
      http.get("*/build/TerriaJS/data/regionMapping.json", () =>
        HttpResponse.json(regionMapping)
      ),
      http.get("https://terria.io/position.json", () =>
        HttpResponse.json(positionApiResponse)
      ),
      http.get("https://terria.io/values.json", () =>
        HttpResponse.json(valueApiResponse)
      )
    );

    await apiCatalogItem.loadMapItems();
    const table = apiCatalogItem.dataColumnMajor;
    expect(table).toBeDefined();
    const definedTable: string[][] = table!;
    // count columns
    expect(definedTable.length).toBe(3); // value, latitude, longitude
    // count rows
    expect(definedTable[0].length).toBe(4); // header + 3 value rows
  });

  describe("behaviour of `responseDataPath` option", function () {
    beforeEach(function () {
      worker.use(
        http.get("*/build/TerriaJS/data/regionMapping.json", () =>
          HttpResponse.json(regionMapping)
        ),
        http.get("https://terria.io/position.json", () =>
          HttpResponse.json(positionApiResponse)
        )
      );

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
      worker.use(
        http.get("https://terria.io/values.json", () =>
          HttpResponse.json({
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
          })
        )
      );

      await apiCatalogItem.loadMapItems();
      const table = apiCatalogItem.dataColumnMajor;
      expect(table).toBeDefined();
      const definedTable: string[][] = table!;
      const valueColumn = definedTable.find(([name]) => name === "value");
      expect(valueColumn).toEqual(["value", "8", "9", "7"]);
    });

    it("can extract a single object from an array", async function () {
      apiCatalogItem.apis[0].setTrait(
        CommonStrata.user,
        "responseDataPath",
        "records[0]"
      );
      worker.use(
        http.get("https://terria.io/values.json", () =>
          HttpResponse.json({
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
          })
        )
      );

      await apiCatalogItem.loadMapItems();
      const table = apiCatalogItem.dataColumnMajor;
      expect(table).toBeDefined();
      const definedTable: string[][] = table!;
      const valueColumn = definedTable.find(([name]) => name === "value");
      expect(valueColumn).toEqual(["value", "8", "9"]);
    });

    it("can extract multiple objects from an array", async function () {
      apiCatalogItem.apis[0].setTrait(
        CommonStrata.user,
        "responseDataPath",
        "records[].fields"
      );
      worker.use(
        http.get("https://terria.io/values.json", () =>
          HttpResponse.json({
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
          })
        )
      );

      await apiCatalogItem.loadMapItems();
      const table = apiCatalogItem.dataColumnMajor;
      expect(table).toBeDefined();
      const definedTable: string[][] = table!;
      const valueColumn = definedTable.find(([name]) => name === "value");
      expect(valueColumn).toEqual(["value", "8", "9", "7"]);
    });
  });

  describe("supports apiColumns", function () {
    beforeEach(function () {
      worker.use(
        http.get("*/build/TerriaJS/data/regionMapping.json", () =>
          HttpResponse.json(regionMapping)
        ),
        http.get("https://terria.io/position.json", () =>
          HttpResponse.json(positionApiResponse)
        )
      );

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
      const definedTable: string[][] = table!;
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
