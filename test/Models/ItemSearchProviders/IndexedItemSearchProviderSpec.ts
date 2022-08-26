import "jasmine-ajax";
import JsonValue from "../../../lib/Core/Json";
import IndexedItemSearchProvider from "../../../lib/Models/ItemSearchProviders/IndexedItemSearchProvider";
import Csv from "../../../lib/Table/Csv";

const resultsDataCsv = require("raw-loader!../../../wwwroot/test/IndexedItemSearchProvider/resultsData.csv");
const heightCsv = require("raw-loader!../../../wwwroot/test/IndexedItemSearchProvider/0.csv");
const areaCsv = require("raw-loader!../../../wwwroot/test/IndexedItemSearchProvider/1.csv");

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
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  describe("construction", function () {
    it("can be constructed", function () {
      new IndexedItemSearchProvider({ indexRootUrl: "indexRoot.json" }, []);
    });
  });

  describe("load", function () {
    it("can be loaded", async function () {
      const provider = new IndexedItemSearchProvider(
        {
          indexRootUrl: "indexRoot.json"
        },
        []
      );
      stubRequest("indexRoot.json", validIndexRoot);
      let error;
      try {
        await provider.initialize();
      } catch (e) {
        error = e;
      }
      expect(error).toBeUndefined();
    });

    it("throws an error if the indexRoot file cannot be parsed", async function () {
      const provider = new IndexedItemSearchProvider(
        {
          indexRootUrl: "indexRoot.json"
        },
        []
      );
      stubRequest("indexRoot.json", {});
      let error;
      try {
        await provider.initialize();
      } catch (e) {
        error = e;
      }
      expect(error?.message).toContain(
        "indexedItemSearchProvider.errorParsingIndexRoot"
      );
    });
  });

  describe("describeParameters", function () {
    it("returns the parameters", async function () {
      const provider = new IndexedItemSearchProvider(
        {
          indexRootUrl: "indexRoot.json"
        },
        [{ id: "street_address", queryOptions: { prefix: "true" } }]
      );
      stubRequest("indexRoot.json", validIndexRoot);
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
    let parameterValues: Map<string, any>;

    beforeEach(async function () {
      provider = new IndexedItemSearchProvider(
        {
          indexRootUrl: "indexRoot.json"
        },
        []
      );
      stubRequest("indexRoot.json", validIndexRoot);
      stubRequest("resultsData.csv", resultsDataCsv);
      stubRequest("0.csv", heightCsv);
      stubRequest("1.csv", areaCsv);
      const heightRows = await Csv.parseString(heightCsv);
      const areaRows = await Csv.parseString(areaCsv);
      parameterValues = new Map([
        ["height", { start: heightRows[4][1], end: heightRows[10][1] }],
        ["area", { start: areaRows[6][1], end: areaRows[8][1] }]
      ]);
      await provider.initialize();
    });

    it("returns matching results", async function () {
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
      await provider.search(parameterValues);
      const finalCount = jasmine.Ajax.requests.count();
      expect(finalCount).toEqual(4);
      await provider.search(parameterValues);
      expect(jasmine.Ajax.requests.count()).toEqual(finalCount);
    });
  });
});

function stubRequest(url: string, response: JsonValue) {
  jasmine.Ajax.stubRequest(url).andReturn({
    responseText:
      typeof response === "string" ? response : JSON.stringify(response)
  });
}
