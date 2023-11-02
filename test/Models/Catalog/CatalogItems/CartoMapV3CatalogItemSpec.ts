import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import { isJsonObject } from "../../../../lib/Core/Json";
import CartoMapV3CatalogItem from "../../../../lib/Models/Catalog/CatalogItems/CartoMapV3CatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../../lib/Models/Terria";

describe("CartoMapV3CatalogItemSpec", function () {
  let item: CartoMapV3CatalogItem;

  beforeEach(function () {
    item = new CartoMapV3CatalogItem("test", new Terria());

    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(/.*/).andError({});
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it("has a type", function () {
    expect(CartoMapV3CatalogItem.type).toBe("carto-v3");
  });

  describe("table API", function () {
    beforeEach(function () {
      item.setTrait(CommonStrata.definition, "baseUrl", "https://BASE_URL/");
      item.setTrait(
        CommonStrata.definition,
        "connectionName",
        "CONNECTION_NAME"
      );
      item.setTrait(CommonStrata.definition, "cartoTableName", "TABLE_NAME");
      item.setTrait(
        CommonStrata.definition,
        "cartoGeoColumn",
        "GEO_COLUMN_NAME"
      );
      item.setTrait(CommonStrata.definition, "cartoColumns", ["COLUMN_1"]);

      jasmine.Ajax.stubRequest(
        "https://BASE_URL/v3/maps/CONNECTION_NAME/table?name=TABLE_NAME&columns=COLUMN_1&geo_column=GEO_COLUMN_NAME"
      ).andReturn({
        responseJSON: require("../../../../wwwroot/test/CartoMapV3/table-response.json")
      });
      jasmine.Ajax.stubRequest(
        "https://example.com/table/geojson.json"
      ).andReturn({
        responseJSON: require("../../../../wwwroot/test/CartoMapV3/table-geojson-response.json")
      });
    });

    it("gets correct GeoJSON url", async function () {
      (await item.loadMetadata()).throwIfError();
      expect(item.geoJsonUrls.length).toBe(1);
      expect(item.geoJsonUrls[0]).toBe(
        "https://example.com/table/geojson.json"
      );
    });

    it("renders GeoJSON", async function () {
      (await item.loadMapItems()).throwIfError();

      console.log(item.mapItems);
      expect(item.mapItems.length).toBe(1);
      expect(item.mapItems[0] instanceof CustomDataSource).toBeTruthy();
      expect(
        (item.mapItems[0] as CustomDataSource).entities.values.length
      ).toBe(1);
    });
  });

  describe("query table API", function () {
    beforeEach(function () {
      item.setTrait(CommonStrata.definition, "baseUrl", "https://BASE_URL/");
      item.setTrait(
        CommonStrata.definition,
        "connectionName",
        "CONNECTION_NAME"
      );
      item.setTrait(CommonStrata.definition, "cartoQuery", "SOME_QUERY");
      item.setTrait(
        CommonStrata.definition,
        "cartoGeoColumn",
        "GEO_COLUMN_NAME"
      );

      jasmine.Ajax.stubRequest(
        "https://BASE_URL/v3/maps/CONNECTION_NAME/query"
      ).andCallFunction((req) => {
        req.data;
        const body = req.data();
        // Only respond if correct body parameters
        if (
          isJsonObject(body) &&
          body.q === "SOME_QUERY" &&
          body.geo_column === "GEO_COLUMN_NAME"
        ) {
          req.respondWith({
            responseJSON: require("../../../../wwwroot/test/CartoMapV3/query-response.json")
          });
        } else {
          req.responseError();
        }
      });

      jasmine.Ajax.stubRequest(
        "https://example.com/query/geojson.json"
      ).andReturn({
        responseJSON: require("../../../../wwwroot/test/CartoMapV3/query-geojson-response.json")
      });
    });

    it("gets correct GeoJSON url", async function () {
      (await item.loadMetadata()).throwIfError();
      expect(item.geoJsonUrls.length).toBe(1);
      expect(item.geoJsonUrls[0]).toBe(
        "https://example.com/query/geojson.json"
      );
    });

    it("renders GeoJSON", async function () {
      (await item.loadMapItems()).throwIfError();

      expect(item.mapItems.length).toBe(1);
      expect(item.mapItems[0] instanceof CustomDataSource).toBeTruthy();
      expect(
        (item.mapItems[0] as CustomDataSource).entities.values.length
      ).toBe(1);
    });
  });
});
