import { runInAction } from "mobx";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import PropertyBag from "terriajs-cesium/Source/DataSources/PropertyBag";
import { ImageryParts } from "../../lib/ModelMixins/MappableMixin";
import CsvCatalogItem from "../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import createStratumInstance from "../../lib/Models/Definition/createStratumInstance";
import updateModelFromJson from "../../lib/Models/Definition/updateModelFromJson";
import Terria from "../../lib/Models/Terria";
import TableStyleTraits from "../../lib/Traits/TraitsClasses/TableStyleTraits";
import TableTimeStyleTraits from "../../lib/Traits/TraitsClasses/TableTimeStyleTraits";

const LatLonValCsv = require("raw-loader!../../wwwroot/test/csv/lat_lon_val.csv");
const LatLonValCsvDuplicate = require("raw-loader!../../wwwroot/test/csv/lat_lon_val_with_duplicate_row.csv");
const LatLonEnumDateIdCsv = require("raw-loader!../../wwwroot/test/csv/lat_lon_enum_date_id.csv");
const LgaWithDisambigCsv = require("raw-loader!../../wwwroot/test/csv/lga_state_disambig.csv");
const ParkingSensorDataCsv = require("raw-loader!../../wwwroot/test/csv/parking-sensor-data.csv");
const LegendDecimalPlacesCsv = require("raw-loader!../../wwwroot/test/csv/legend-decimal-places.csv");
const BadDatesCsv = require("raw-loader!../../wwwroot/test/csv/bad-dates.csv");
const regionMapping = JSON.stringify(
  require("../../wwwroot/data/regionMapping.json")
);
const regionIdsSte = JSON.stringify(
  require("../../wwwroot/data/regionids/region_map-STE_2016_AUST_STE_NAME16.json")
);
const regionIdsLgaName = JSON.stringify(
  require("../../wwwroot/data/regionids/region_map-FID_LGA_2011_AUST_LGA_NAME11.json")
);
const regionIdsLgaNameStates = JSON.stringify(
  require("../../wwwroot/data/regionids/region_map-FID_LGA_2011_AUST_STE_NAME11.json")
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

    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionids/region_map-STE_2016_AUST_STE_NAME16.json"
    ).andReturn({ responseText: regionIdsSte });

    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionids/region_map-FID_LGA_2011_AUST_LGA_NAME11.json"
    ).andReturn({ responseText: regionIdsLgaName });

    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionids/region_map-FID_LGA_2011_AUST_STE_NAME11.json"
    ).andReturn({ responseText: regionIdsLgaNameStates });
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
      expect(item.activeTableStyle.rowGroups.length).toBe(4);
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
          "2015-08-02T23:59:59Z",
          "2015-08-05T00:00:00Z"
        ]);
      });
    });

    describe("when timeColumn is `null`", function() {
      it("returns an empty `discreteTimes`", async function() {
        expect(item.discreteTimes?.length).toBe(6);
        item.defaultStyle.time.setTrait(CommonStrata.user, "timeColumn", null);
        expect(item.discreteTimes).toBe(undefined);
      });

      it("creates entities for all times", async function() {
        item.defaultStyle.time.setTrait(CommonStrata.user, "timeColumn", null);
        await item.loadMapItems();
        const mapItem = item.mapItems[0];
        expect(mapItem instanceof CustomDataSource).toBe(true);
        if (mapItem instanceof CustomDataSource) {
          expect(mapItem.entities.values.length).toBe(13);
        }
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

    it("removes duplicate rows when requested", async function() {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "csvString", LatLonValCsvDuplicate);
        item.setTrait(CommonStrata.user, "removeDuplicateRows", true);
      });

      await item.loadMapItems();
      const mapItem = item.mapItems[0];
      expect(mapItem instanceof CustomDataSource).toBe(true);
      if (mapItem instanceof CustomDataSource) {
        expect(mapItem.entities.values.length).toBe(5);

        const duplicateValue = 7;
        let occurrences = 0;
        for (let entity of mapItem.entities.values) {
          const val = entity.properties?.value.getValue();
          if (val === duplicateValue) {
            occurrences++;
          }
        }
        expect(occurrences).toBe(1);
      }
    });

    it("has the correct property names", async function() {
      runInAction(() =>
        item.setTrait(CommonStrata.user, "csvString", LatLonValCsv)
      );
      await item.loadMapItems();
      const dataSource = item.mapItems[0] as CustomDataSource;
      const propertyNames =
        dataSource.entities.values[0].properties?.propertyNames;
      expect(propertyNames).toEqual(["lat", "lon", "value"]);
    });
  });

  describe("when the time column has bad datetimes in it", function() {
    it("ignores them gracefully", async function() {
      runInAction(() =>
        item.setTrait(CommonStrata.user, "csvString", BadDatesCsv)
      );

      await item.loadMapItems();
      const mapItem = item.mapItems[0];
      expect(mapItem instanceof CustomDataSource).toBe(true);
      if (mapItem instanceof CustomDataSource) {
        expect(mapItem.entities.values.length).toBe(3);
      }
    });
  });

  describe("when the table has time-series points with intervals", function() {
    let dataSource: CustomDataSource;
    beforeEach(async function() {
      item.setTrait(CommonStrata.user, "csvString", ParkingSensorDataCsv);
      await item.loadMapItems();
      dataSource = <CustomDataSource>item.mapItems[0];
      expect(dataSource instanceof CustomDataSource).toBe(true);
    });

    it("creates one entity per id", async function() {
      expect(dataSource.entities.values.length).toBe(21);
    });

    it("creates correct intervals", async function() {
      expect(item.activeTableStyle.timeIntervals?.length).toBe(21);
      expect(item.disableDateTimeSelector).toBeFalsy();
      expect(
        item.activeTableStyle.timeIntervals?.map(t => [
          t?.start.toString(),
          t?.stop.toString()
        ])
      ).toEqual([
        ["2021-06-25T10:39:02Z", "2021-06-26T10:39:01Z"],
        ["2021-06-25T10:26:45Z", "2021-06-26T10:26:44Z"],
        ["2021-06-25T10:18:01Z", "2021-06-26T10:18:00Z"],
        ["2021-06-25T09:53:52Z", "2021-06-26T09:53:51Z"],
        ["2021-06-25T09:51:32Z", "2021-06-26T09:51:31Z"],
        ["2021-06-25T09:47:06Z", "2021-06-26T09:47:05Z"],
        ["2021-06-25T09:19:21Z", "2021-06-26T09:19:20Z"],
        ["2021-06-25T09:14:36Z", "2021-06-26T09:14:35Z"],
        ["2021-06-25T09:06:47Z", "2021-06-26T09:06:46Z"],
        ["2021-06-25T09:01:32Z", "2021-06-26T09:01:31Z"],
        ["2021-06-25T08:25:09Z", "2021-06-26T08:25:08Z"],
        ["2021-06-25T07:22:15Z", "2021-06-26T07:22:14Z"],
        ["2021-06-25T06:10:52Z", "2021-06-26T06:10:51Z"],
        ["2021-06-25T04:39:45Z", "2021-06-26T04:39:44Z"],
        ["2021-06-25T03:46:13Z", "2021-06-26T03:46:12Z"],
        ["2021-06-25T00:29:26Z", "2021-06-26T00:29:25Z"],
        ["2021-06-25T00:27:23Z", "2021-06-26T00:27:22Z"],
        ["2021-06-24T14:39:42Z", "2021-06-25T14:39:41Z"],
        ["2021-06-15T02:50:37Z", "2021-06-16T02:50:36Z"],
        ["2021-05-12T00:52:56Z", "2021-05-13T00:52:55Z"],
        ["2021-05-04T03:55:39Z", "2021-05-05T03:55:38Z"]
      ]);
    });

    it("creates correct intervals if spreadStartTime", async function() {
      runInAction(() =>
        item.setTrait(
          CommonStrata.user,
          "defaultStyle",
          createStratumInstance(TableStyleTraits, {
            time: createStratumInstance(TableTimeStyleTraits, {
              spreadStartTime: true
            })
          })
        )
      );
      expect(item.disableDateTimeSelector).toBeFalsy();
      expect(item.activeTableStyle.timeIntervals?.length).toBe(21);
      expect(
        item.activeTableStyle.timeIntervals?.map(t => [
          t?.start.toString(),
          t?.stop.toString()
        ])
      ).toEqual([
        ["2021-05-04T03:55:39Z", "2021-06-26T10:39:01Z"],
        ["2021-05-04T03:55:39Z", "2021-06-26T10:26:44Z"],
        ["2021-05-04T03:55:39Z", "2021-06-26T10:18:00Z"],
        ["2021-05-04T03:55:39Z", "2021-06-26T09:53:51Z"],
        ["2021-05-04T03:55:39Z", "2021-06-26T09:51:31Z"],
        ["2021-05-04T03:55:39Z", "2021-06-26T09:47:05Z"],
        ["2021-05-04T03:55:39Z", "2021-06-26T09:19:20Z"],
        ["2021-05-04T03:55:39Z", "2021-06-26T09:14:35Z"],
        ["2021-05-04T03:55:39Z", "2021-06-26T09:06:46Z"],
        ["2021-05-04T03:55:39Z", "2021-06-26T09:01:31Z"],
        ["2021-05-04T03:55:39Z", "2021-06-26T08:25:08Z"],
        ["2021-05-04T03:55:39Z", "2021-06-26T07:22:14Z"],
        ["2021-05-04T03:55:39Z", "2021-06-26T06:10:51Z"],
        ["2021-05-04T03:55:39Z", "2021-06-26T04:39:44Z"],
        ["2021-05-04T03:55:39Z", "2021-06-26T03:46:12Z"],
        ["2021-05-04T03:55:39Z", "2021-06-26T00:29:25Z"],
        ["2021-05-04T03:55:39Z", "2021-06-26T00:27:22Z"],
        ["2021-05-04T03:55:39Z", "2021-06-25T14:39:41Z"],
        ["2021-05-04T03:55:39Z", "2021-06-16T02:50:36Z"],
        ["2021-05-04T03:55:39Z", "2021-05-13T00:52:55Z"],
        ["2021-05-04T03:55:39Z", "2021-05-05T03:55:38Z"]
      ]);
    });

    it("creates correct intervals if spreadStartTime and spreadFinishTime", async function() {
      runInAction(() =>
        item.setTrait(
          CommonStrata.user,
          "defaultStyle",
          createStratumInstance(TableStyleTraits, {
            time: createStratumInstance(TableTimeStyleTraits, {
              spreadStartTime: true,
              spreadFinishTime: true
            })
          })
        )
      );
      expect(item.disableDateTimeSelector).toBeTruthy();
      expect(item.activeTableStyle.timeIntervals?.length).toBe(21);
      expect(item.activeTableStyle.moreThanOneTimeInterval).toBe(false);
    });

    it("creates correct intervals if spreadFinishTime", async function() {
      runInAction(() =>
        item.setTrait(
          CommonStrata.user,
          "defaultStyle",
          createStratumInstance(TableStyleTraits, {
            time: createStratumInstance(TableTimeStyleTraits, {
              spreadFinishTime: true
            })
          })
        )
      );
      expect(item.activeTableStyle.timeIntervals?.length).toBe(21);
      expect(
        item.activeTableStyle.timeIntervals?.map(t => [
          t?.start.toString(),
          t?.stop.toString()
        ])
      ).toEqual([
        ["2021-06-25T10:39:02Z", "2021-06-26T10:39:01Z"],
        ["2021-06-25T10:26:45Z", "2021-06-26T10:39:01Z"],
        ["2021-06-25T10:18:01Z", "2021-06-26T10:39:01Z"],
        ["2021-06-25T09:53:52Z", "2021-06-26T10:39:01Z"],
        ["2021-06-25T09:51:32Z", "2021-06-26T10:39:01Z"],
        ["2021-06-25T09:47:06Z", "2021-06-26T10:39:01Z"],
        ["2021-06-25T09:19:21Z", "2021-06-26T10:39:01Z"],
        ["2021-06-25T09:14:36Z", "2021-06-26T10:39:01Z"],
        ["2021-06-25T09:06:47Z", "2021-06-26T10:39:01Z"],
        ["2021-06-25T09:01:32Z", "2021-06-26T10:39:01Z"],
        ["2021-06-25T08:25:09Z", "2021-06-26T10:39:01Z"],
        ["2021-06-25T07:22:15Z", "2021-06-26T10:39:01Z"],
        ["2021-06-25T06:10:52Z", "2021-06-26T10:39:01Z"],
        ["2021-06-25T04:39:45Z", "2021-06-26T10:39:01Z"],
        ["2021-06-25T03:46:13Z", "2021-06-26T10:39:01Z"],
        ["2021-06-25T00:29:26Z", "2021-06-26T10:39:01Z"],
        ["2021-06-25T00:27:23Z", "2021-06-26T10:39:01Z"],
        ["2021-06-24T14:39:42Z", "2021-06-26T10:39:01Z"],
        ["2021-06-15T02:50:37Z", "2021-06-26T10:39:01Z"],
        ["2021-05-12T00:52:56Z", "2021-06-26T10:39:01Z"],
        ["2021-05-04T03:55:39Z", "2021-06-26T10:39:01Z"]
      ]);
    });

    it("creates disable time dimension by default for this dataset", async function() {
      expect(item.timeDisableDimension).toBeDefined();
    });

    it("doesn't disable time dimension if `showDisableTimeOption = false`", async function() {
      runInAction(() =>
        item.setTrait(CommonStrata.user, "showDisableTimeOption", false)
      );

      expect(item.timeDisableDimension).toBeUndefined();
    });

    it("doesn't disable time dimension by default for another dataset", async function() {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "csvString", LatLonEnumDateIdCsv);
      });

      await item.loadMapItems();
      expect(item.timeDisableDimension).toBeUndefined();
    });

    it("creates disable time dimension for another dataset if `showDisableTimeOption = true`", async function() {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "csvString", LatLonEnumDateIdCsv);
        item.setTrait(CommonStrata.user, "showDisableTimeOption", true);
      });

      await item.loadMapItems();
      expect(item.timeDisableDimension).toBeDefined();
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
      expect(item.styleDimensions?.options?.[2].name).toBe("Value");
    });

    it("creates all styleDimensions - with disable style", async function() {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "csvString", LatLonEnumDateIdCsv);
        item.setTrait(CommonStrata.user, "showDisableStyleOption", true);
      });

      await item.loadMapItems();

      expect(item.styleDimensions?.options?.length).toBe(4);
      expect(item.styleDimensions?.allowUndefined).toBeTruthy();
      expect(item.styleDimensions?.undefinedLabel).toBe(
        "models.tableData.styleDisabledLabel"
      );
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

      expect(item.styleDimensions?.options?.[2].id).toBe("value");
      expect(item.styleDimensions?.options?.[2].name).toBe("Some Style Title");
    });

    it("loads regionProviderList on loadMapItems", async function() {
      item.setTrait(CommonStrata.user, "csvString", LatLonEnumDateIdCsv);

      await item.loadMetadata();

      expect(item.regionProviderList).toBeUndefined();

      await item.loadMapItems();

      expect(item.regionProviderList?.regionProviders.length).toBe(103);
    });
  });

  describe("creates legend", function() {
    it(" - correct decimal places for values [0,100]", async function() {
      item.setTrait("definition", "csvString", LegendDecimalPlacesCsv);

      item.setTrait("definition", "activeStyle", "0dp");

      await item.loadMapItems();

      expect(item.legends[0].items.length).toBe(7);
      expect(item.legends[0].items.map(i => i.title)).toEqual([
        "65",
        "54",
        "44",
        "33",
        "22",
        "12",
        "1"
      ]);
    });

    it(" - correct decimal places for values [0,10]", async function() {
      item.setTrait("definition", "csvString", LegendDecimalPlacesCsv);

      item.setTrait("definition", "activeStyle", "1dp");

      await item.loadMapItems();

      expect(item.legends[0].items.length).toBe(7);
      expect(item.legends[0].items.map(i => i.title)).toEqual([
        "10.0",
        "8.3",
        "6.7",
        "5.0",
        "3.3",
        "1.7",
        "0.0"
      ]);
    });

    it(" - correct decimal places for values [0,1]", async function() {
      item.setTrait("definition", "csvString", LegendDecimalPlacesCsv);

      item.setTrait("definition", "activeStyle", "2dp");

      await item.loadMapItems();

      expect(item.legends[0].items.length).toBe(7);
      expect(item.legends[0].items.map(i => i.title)).toEqual([
        "0.70",
        "0.58",
        "0.47",
        "0.35",
        "0.23",
        "0.12",
        "0.00"
      ]);
    });

    it(" - correct decimal places for values [0,0.1]", async function() {
      item.setTrait("definition", "csvString", LegendDecimalPlacesCsv);

      item.setTrait("definition", "activeStyle", "3dp");

      await item.loadMapItems();

      expect(item.legends[0].items.length).toBe(7);
      expect(item.legends[0].items.map(i => i.title)).toEqual([
        "0.080",
        "0.068",
        "0.057",
        "0.045",
        "0.033",
        "0.022",
        "0.010"
      ]);
    });
  });

  describe("region mapping - LGA with disambig", function() {
    beforeEach(async function() {
      item.setTrait(CommonStrata.user, "csvString", LgaWithDisambigCsv);
      await item.loadMapItems();

      await item.regionProviderList
        ?.getRegionProvider("LGA_NAME_2011")
        ?.loadRegionIDs();
      await item.regionProviderList
        ?.getRegionProvider("STE_NAME_2016")
        ?.loadRegionIDs();
    });

    it("creates imagery parts", async function() {
      expect(ImageryParts.is(item.mapItems[0])).toBeTruthy();
    });

    it("with default style (state)", async function() {
      expect(item.activeTableStyle.regionColumn?.name).toBe("State");
      expect(item.activeTableStyle.regionColumn?.regionType?.regionType).toBe(
        "STE_NAME_2016"
      );

      expect(
        item.activeTableStyle.regionColumn?.valuesAsRegions.numberOfValidRegions
      ).toBe(8);
      expect(
        item.activeTableStyle.regionColumn?.valuesAsRegions.uniqueRegionIds
          .length
      ).toBe(3);
    });

    it("with lga_name", async function() {
      updateModelFromJson(item, CommonStrata.user, {
        columns: [
          {
            name: "LGA_NAME",
            regionType: "LGA_NAME_2011"
          }
        ],
        defaultStyle: {
          regionColumn: "LGA_NAME"
        }
      });

      expect(item.activeTableStyle.regionColumn?.name).toBe("LGA_NAME");
      expect(item.activeTableStyle.regionColumn?.regionType?.regionType).toBe(
        "LGA_NAME_2011"
      );

      expect(
        item.activeTableStyle.regionColumn?.valuesAsRegions.numberOfValidRegions
      ).toBe(8);
      expect(
        item.activeTableStyle.regionColumn?.valuesAsRegions.uniqueRegionIds
          .length
      ).toBe(8);
    });
  });
});
