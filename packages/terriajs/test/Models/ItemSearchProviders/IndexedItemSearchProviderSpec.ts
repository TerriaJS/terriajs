import { http, HttpResponse } from "msw";
import IndexedItemSearchProvider from "../../../lib/Models/ItemSearchProviders/IndexedItemSearchProvider";
import Csv from "../../../lib/Table/Csv";
import heightCsv from "../../../wwwroot/test/IndexedItemSearchProvider/0.csv";
import areaCsv from "../../../wwwroot/test/IndexedItemSearchProvider/1.csv";
import resultsDataCsv from "../../../wwwroot/test/IndexedItemSearchProvider/resultsData.csv";
import { worker } from "../../mocks/browser";

const validIndexRoot = {
  resultsDataUrl: "resultsData.csv",
  idProperty: "building_id",
  indexes: {
    height: {
      type: "numeric",
      url: "0.csv",
      range: { min: 1, max: 180 }
    },
    area: {
      type: "numeric",
      url: "1.csv",
      range: { min: 100, max: 20000 }
    },
    street_address: {
      type: "text",
      url: "2.json"
    },
    roof_type: {
      type: "enum",
      values: {
        Flat: {
          count: 50,
          url: "3-0.csv"
        },
        Slope: {
          count: 100,
          url: "3-1.csv"
        }
      }
    }
  }
};

describe("IndexedItemSearchProvider", function () {
  describe("construction", function () {
    it("can be constructed", function () {
      expect(
        new IndexedItemSearchProvider({ indexRootUrl: "indexRoot.json" }, [])
      ).toBeDefined();
    });
  });

  describe("load", function () {
    it("can be loaded", async function () {
      worker.use(
        http.get("*/indexRoot.json", () => HttpResponse.json(validIndexRoot)),
        http.get("*/resultsData.csv", () => new HttpResponse(resultsDataCsv))
      );

      const provider = new IndexedItemSearchProvider(
        {
          indexRootUrl: "indexRoot.json"
        },
        []
      );

      let error;
      try {
        await provider.initialize();
      } catch (e) {
        error = e;
      }
      expect(error).toBeUndefined();
    });

    it("throws an error if the indexRoot file cannot be parsed", async function () {
      worker.use(
        http.get("*/indexRoot.json", () => HttpResponse.json({})),
        http.get("*/resultsData.csv", () => new HttpResponse(resultsDataCsv))
      );
      const provider = new IndexedItemSearchProvider(
        {
          indexRootUrl: "indexRoot.json"
        },
        []
      );

      let error;
      try {
        await provider.initialize();
      } catch (e: any) {
        error = e;
      }
      expect(error?.message).toContain(
        "indexedItemSearchProvider.errorParsingIndexRoot"
      );
    });
  });

  describe("describeParameters", function () {
    it("returns the parameters", async function () {
      worker.use(
        http.get("*/indexRoot.json", () => HttpResponse.json(validIndexRoot)),
        http.get("*/resultsData.csv", () => new HttpResponse(resultsDataCsv))
      );

      const provider = new IndexedItemSearchProvider(
        {
          indexRootUrl: "indexRoot.json"
        },
        [{ id: "street_address", queryOptions: { prefix: "true" } }]
      );

      await provider.initialize();
      const parameters = await provider.describeParameters();
      expect(parameters).toEqual([
        {
          type: "numeric",
          id: "height",
          name: "height",
          range: { min: 1, max: 180 }
        },
        {
          type: "numeric",
          id: "area",
          name: "area",
          range: { min: 100, max: 20000 }
        },
        {
          type: "text",
          id: "street_address",
          name: "street_address",
          queryOptions: { prefix: "true" }
        },
        {
          type: "enum",
          id: "roof_type",
          name: "roof_type",
          values: [
            { id: "Flat", count: 50 },
            { id: "Slope", count: 100 }
          ]
        }
      ]);
    });
  });

  describe("search", function () {
    let provider: IndexedItemSearchProvider;

    beforeEach(async function () {
      provider = new IndexedItemSearchProvider(
        {
          indexRootUrl: "indexRoot.json"
        },
        []
      );
    });

    it("returns matching results", async function () {
      worker.use(
        http.get("*/indexRoot.json", () => HttpResponse.json(validIndexRoot)),
        http.get("*/resultsData.csv", () => new HttpResponse(resultsDataCsv)),
        http.get("*/0.csv", () => new HttpResponse(heightCsv)),
        http.get("*/1.csv", () => new HttpResponse(areaCsv))
      );

      await provider.initialize();

      const heightRows = await Csv.parseString(heightCsv);
      const areaRows = await Csv.parseString(areaCsv);
      const parameterValues = new Map([
        ["height", { start: heightRows[4][1], end: heightRows[10][1] }],
        ["area", { start: areaRows[6][1], end: areaRows[8][1] }]
      ]);

      const results = await provider.search(parameterValues);
      expect(results).toEqual([
        {
          id: 632,
          idPropertyName: "building_id",
          featureCoordinate: {
            latitudeDegrees: 19.12575420288384,
            longitudeDegrees: 11.870779042051964,
            featureHeight: 3.6875988497925927
          },
          properties: { building_id: 632 }
        },
        {
          id: 410,
          idPropertyName: "building_id",
          featureCoordinate: {
            latitudeDegrees: 46.567720640307755,
            longitudeDegrees: 16.64851364383736,
            featureHeight: 17.23546017384181
          },
          properties: { building_id: 410 }
        }
      ]);
    });

    it("should load the index and data files only once", async function () {
      let requestCount = 0;
      worker.use(
        http.get("*/indexRoot.json", () => {
          requestCount++;
          return HttpResponse.json(validIndexRoot);
        }),
        http.get("*/resultsData.csv", () => {
          requestCount++;
          return new HttpResponse(resultsDataCsv);
        }),
        http.get("*/0.csv", () => {
          requestCount++;
          return new HttpResponse(heightCsv);
        }),
        http.get("*/1.csv", () => {
          requestCount++;
          return new HttpResponse(areaCsv);
        })
      );

      await provider.initialize();

      const heightRows = await Csv.parseString(heightCsv);
      const areaRows = await Csv.parseString(areaCsv);
      const parameterValues = new Map([
        ["height", { start: heightRows[4][1], end: heightRows[10][1] }],
        ["area", { start: areaRows[6][1], end: areaRows[8][1] }]
      ]);

      await provider.search(parameterValues);
      expect(requestCount).toBe(4);
      await provider.search(parameterValues);
      expect(requestCount).toBe(4);
    });
  });
});
