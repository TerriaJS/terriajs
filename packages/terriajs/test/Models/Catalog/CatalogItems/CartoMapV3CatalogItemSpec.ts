import { http, HttpResponse } from "msw";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import CartoMapV3CatalogItem from "../../../../lib/Models/Catalog/CatalogItems/CartoMapV3CatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../../lib/Models/Terria";
import { worker } from "../../../mocks/browser";

import tableResponse from "../../../../wwwroot/test/CartoMapV3/table-response.json";
import tableGeoJsonResponse from "../../../../wwwroot/test/CartoMapV3/table-geojson-response.json";
import queryResponse from "../../../../wwwroot/test/CartoMapV3/query-response.json";
import queryGeoJsonResponse from "../../../../wwwroot/test/CartoMapV3/query-geojson-response.json";
import { isJsonObject } from "../../../../lib/Core/Json";

describe("CartoMapV3CatalogItemSpec", function () {
  let item: CartoMapV3CatalogItem;

  beforeEach(function () {
    item = new CartoMapV3CatalogItem("test", new Terria());

    worker.use(http.all("*", () => HttpResponse.error()));
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

      worker.use(
        http.get(
          "https://BASE_URL/v3/maps/CONNECTION_NAME/table",
          ({ request }) => {
            const url = new URL(request.url);
            if (
              url.searchParams.get("name") !== "TABLE_NAME" ||
              url.searchParams.get("columns") !== "COLUMN_1" ||
              url.searchParams.get("geo_column") !== "GEO_COLUMN_NAME"
            )
              throw new Error(`Unexpected query params: ${url.search}`);
            return HttpResponse.json(tableResponse);
          }
        ),
        http.get("https://example.com/table/geojson.json", () =>
          HttpResponse.json(tableGeoJsonResponse)
        )
      );
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

      worker.use(
        http.post(
          "https://BASE_URL/v3/maps/CONNECTION_NAME/query",
          async ({ request }) => {
            const body = await request.json();
            if (
              !isJsonObject(body) ||
              body.q !== "SOME_QUERY" ||
              body.geo_column !== "GEO_COLUMN_NAME"
            )
              throw new Error(`Unexpected body: ${JSON.stringify(body)}`);
            return HttpResponse.json(queryResponse);
          }
        ),
        http.get("https://example.com/query/geojson.json", () =>
          HttpResponse.json(queryGeoJsonResponse)
        )
      );
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
