import CsvCatalogItem from "../../lib/Models/CsvCatalogItem";
import Terria from "../../lib/Models/Terria";
import CommonStrata from "../../lib/Models/CommonStrata";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import { runInAction } from "mobx";
import createStratumInstance from "../../lib/Models/createStratumInstance";
import updateModelFromJson from "../../lib/Models/updateModelFromJson";

const LatLonValCsv = require("raw-loader!../../wwwroot/test/csv/lat_lon_val.csv");
const LatLonEnumDateIdCsv = require("raw-loader!../../wwwroot/test/csv/lat_lon_enum_date_id.csv");
const regionMapping = JSON.stringify(
  require("../../wwwroot/data/regionMapping.json")
);

describe("TableMixin", function() {
  let item: CsvCatalogItem;

  beforeEach(function() {
    item = new CsvCatalogItem(
      "test",
      new Terria({
        baseUrl: "./"
      }),
      undefined
    );

    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionMapping.json"
    ).andReturn({ responseText: regionMapping });
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  describe("when the table has time, lat/lon and id columns", function() {
    let dataSource: CustomDataSource;
    beforeEach(async function() {
      item.setTrait(CommonStrata.user, "csvString", LatLonEnumDateIdCsv);
      await item.loadMapItems();
      dataSource = <CustomDataSource>item.mapItems[0];
      expect(dataSource instanceof CustomDataSource).toBe(true);
    });

    it("creates one entity per id", async function() {
      if (dataSource instanceof CustomDataSource) {
        expect(dataSource.entities.values.length).toBe(4);
      }
    });

    describe("the entities", function() {
      it("has availability defined over the correct span", function() {
        expect(
          dataSource.entities.values.map(e => e.availability?.start.toString())
        ).toEqual([
          "2015-08-01T00:00:00Z",
          "2015-08-01T00:00:00Z",
          "2015-08-02T00:00:00Z",
          "2015-08-03T00:00:00Z"
        ]);
        expect(
          dataSource.entities.values.map(e => e.availability?.stop.toString())
        ).toEqual([
          "2015-08-07T06:00:00Z",
          "2015-08-07T00:00:00Z",
          "2015-08-03T06:00:00Z",
          "2015-08-05T00:00:00Z"
        ]);
      });
    });
  });

  describe("when the table has lat/lon columns but no time & id columns", function() {
    it("creates one entity per row", async function() {
      runInAction(() =>
        item.setTrait(CommonStrata.user, "csvString", LatLonValCsv)
      );

      await item.loadMapItems();
      const mapItem = item.mapItems[0];
      expect(mapItem instanceof CustomDataSource).toBe(true);
      if (mapItem instanceof CustomDataSource) {
        expect(mapItem.entities.values.length).toBe(5);
      }
    });
  });

  describe("when the table has a few styles", function() {
    it("creates all styleDimensions", async function() {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "csvString", LatLonEnumDateIdCsv);
      });

      await item.loadMapItems();

      expect(item.styleDimensions?.options?.length).toBe(4);
      expect(item.styleDimensions?.options?.[2].id).toBe("value");
      expect(item.styleDimensions?.options?.[2].name).toBe("value");
    });

    it("uses TableColumnTraits for style title", async function() {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "csvString", LatLonEnumDateIdCsv);
        updateModelFromJson(item, CommonStrata.definition, {
          columns: [{ name: "value", title: "Some Title" }]
        });
      });

      await item.loadMapItems();

      expect(item.styleDimensions?.options?.[2].id).toBe("value");
      expect(item.styleDimensions?.options?.[2].name).toBe("Some Title");
    });

    it("uses TableStyleTraits for style title", async function() {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "csvString", LatLonEnumDateIdCsv);
        updateModelFromJson(item, CommonStrata.definition, {
          columns: [{ name: "value", title: "Some Title" }],
          styles: [{ id: "value", title: "Some Style Title" }]
        });
      });

      await item.loadMapItems();

      expect(item.styleDimensions?.options?.[0].id).toBe("value");
      expect(item.styleDimensions?.options?.[0].name).toBe("Some Style Title");
    });
  });
});
