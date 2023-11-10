import { runInAction } from "mobx";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import LabelStyle from "terriajs-cesium/Source/Scene/LabelStyle";
import { getMakiIcon } from "../../lib/Map/Icons/Maki/MakiIcons";
import { ImageryParts } from "../../lib/ModelMixins/MappableMixin";
import CsvCatalogItem from "../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import createStratumInstance from "../../lib/Models/Definition/createStratumInstance";
import updateModelFromJson from "../../lib/Models/Definition/updateModelFromJson";
import TerriaFeature from "../../lib/Models/Feature/Feature";
import { TerriaFeatureData } from "../../lib/Models/Feature/FeatureData";
import Terria from "../../lib/Models/Terria";
import TableColorStyleTraits from "../../lib/Traits/TraitsClasses/Table/ColorStyleTraits";
import TableLabelStyleTraits, {
  EnumLabelSymbolTraits,
  LabelSymbolTraits
} from "../../lib/Traits/TraitsClasses/Table/LabelStyleTraits";
import TableOutlineStyleTraits, {
  BinOutlineSymbolTraits,
  EnumOutlineSymbolTraits
} from "../../lib/Traits/TraitsClasses/Table/OutlineStyleTraits";
import TablePointStyleTraits, {
  BinPointSymbolTraits,
  EnumPointSymbolTraits,
  PointSymbolTraits
} from "../../lib/Traits/TraitsClasses/Table/PointStyleTraits";
import TableStyleTraits from "../../lib/Traits/TraitsClasses/Table/StyleTraits";
import TableTimeStyleTraits from "../../lib/Traits/TraitsClasses/Table/TimeStyleTraits";
import TableTrailStyleTraits, {
  BinTrailSymbolTraits,
  EnumTrailSymbolTraits
} from "../../lib/Traits/TraitsClasses/Table/TrailStyleTraits";

import HorizontalOrigin from "terriajs-cesium/Source/Scene/HorizontalOrigin";
import VerticalOrigin from "terriajs-cesium/Source/Scene/VerticalOrigin";

const LatLonValCsv = require("raw-loader!../../wwwroot/test/csv/lat_lon_val.csv");
const LatLonEnumCsv = require("raw-loader!../../wwwroot/test/csv/lat_lon_enum.csv");
const LatLonValCsvDuplicate = require("raw-loader!../../wwwroot/test/csv/lat_lon_val_with_duplicate_row.csv");
const LatLonEnumDateIdCsv = require("raw-loader!../../wwwroot/test/csv/lat_lon_enum_date_id.csv");
const LatLonEnumDateIdWithRegionCsv = require("raw-loader!../../wwwroot/test/csv/lat_lon_enum_date_id_with_regions.csv");
const LgaWithDisambigCsv = require("raw-loader!../../wwwroot/test/csv/lga_state_disambig.csv");
const ParkingSensorDataCsv = require("raw-loader!../../wwwroot/test/csv/parking-sensor-data.csv");
const LegendDecimalPlacesCsv = require("raw-loader!../../wwwroot/test/csv/legend-decimal-places.csv");
const BadDatesCsv = require("raw-loader!../../wwwroot/test/csv/bad-dates.csv");
const regionMapping = JSON.stringify(
  require("../../wwwroot/data/regionMapping.json")
);
const additionalRegionMapping = JSON.stringify(
  require("../../wwwroot/test/regionMapping/additionalRegion.json")
);
const regionIdsSte = JSON.stringify(
  require("../../wwwroot/data/regionids/region_map-STE_2016_AUST_STE_NAME16.json")
);
const regionIdsLgaName = JSON.stringify(
  require("../../wwwroot/data/regionids/region_map-FID_LGA_2011_AUST_LGA_NAME11.json")
);
const regionIdsLgaCode = JSON.stringify(
  require("../../wwwroot/data/regionids/region_map-FID_LGA_2015_AUST_LGA_CODE15.json")
);
const regionIdsLgaNameStates = JSON.stringify(
  require("../../wwwroot/data/regionids/region_map-FID_LGA_2011_AUST_STE_NAME11.json")
);

const NUMBER_OF_REGION_MAPPING_TYPES = 144;

describe("TableMixin", function () {
  let item: CsvCatalogItem;
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    item = new CsvCatalogItem("test", terria, undefined);

    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(/.*/).andError({});

    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionMapping.json"
    ).andReturn({ responseText: regionMapping });

    jasmine.Ajax.stubRequest(
      "https://tiles.terria.io/region-mapping/regionids/region_map-STE_2016_AUST_STE_NAME16.json"
    ).andReturn({ responseText: regionIdsSte });

    jasmine.Ajax.stubRequest(
      "https://tiles.terria.io/region-mapping/regionids/region_map-FID_LGA_2011_AUST_LGA_NAME11.json"
    ).andReturn({ responseText: regionIdsLgaName });

    jasmine.Ajax.stubRequest(
      "https://tiles.terria.io/region-mapping/regionids/region_map-FID_LGA_2015_AUST_LGA_CODE15.json"
    ).andReturn({ responseText: regionIdsLgaCode });

    jasmine.Ajax.stubRequest(
      "https://tiles.terria.io/region-mapping/regionids/region_map-FID_LGA_2011_AUST_STE_NAME11.json"
    ).andReturn({ responseText: regionIdsLgaNameStates });
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  describe("when the table has time, lat/lon and id columns", function () {
    let dataSource: CustomDataSource;
    beforeEach(async function () {
      item.setTrait(CommonStrata.user, "csvString", LatLonEnumDateIdCsv);
      (await item.loadMapItems()).throwIfError();
      dataSource = <CustomDataSource>item.mapItems[0];
      expect(dataSource instanceof CustomDataSource).toBe(true);
    });

    it("creates one entity per id", async function () {
      expect(item.activeTableStyle.rowGroups.length).toBe(4);
      if (dataSource instanceof CustomDataSource) {
        expect(dataSource.entities.values.length).toBe(4);
      }
    });

    it("sets showInChartPanel to false - as is mappable", async function () {
      expect(item.showInChartPanel).toBeFalsy();
    });

    it("sets showInChartPanel to true - when lat/lon is disabled", async function () {
      updateModelFromJson(item, CommonStrata.definition, {
        columns: [
          { name: "lat", type: "scalar" },
          { name: "lon", type: "scalar" }
        ]
      });
      expect(item.showInChartPanel).toBeTruthy();
    });

    it("doesn't show regions - even if empty region column is detected", () => {});

    it("calculates rectangle", async function () {
      expect(item.rectangle.north).toEqual(-20);
      expect(item.rectangle.south).toEqual(-37);
      expect(item.rectangle.east).toEqual(155);
      expect(item.rectangle.west).toEqual(115);
    });

    describe("the entities", function () {
      it("has availability defined over the correct span", function () {
        expect(
          dataSource.entities.values.map((e) =>
            e.availability?.start.toString()
          )
        ).toEqual([
          "2015-08-01T00:00:00Z",
          "2015-08-01T00:00:00Z",
          "2015-08-02T00:00:00Z",
          "2015-08-03T00:00:00Z"
        ]);
        expect(
          dataSource.entities.values.map((e) => e.availability?.stop.toString())
        ).toEqual([
          "2015-08-07T06:00:00Z",
          "2015-08-07T00:00:00Z",
          "2015-08-02T23:59:59Z",
          "2015-08-05T00:00:00Z"
        ]);
      });
    });

    describe("when timeColumn is `null`", function () {
      it("returns an empty `discreteTimes`", async function () {
        expect(item.discreteTimes?.length).toBe(6);
        item.defaultStyle.time.setTrait(CommonStrata.user, "timeColumn", null);
        expect(item.discreteTimes).toBe(undefined);
      });

      it("creates entities for all times", async function () {
        item.defaultStyle.time.setTrait(CommonStrata.user, "timeColumn", null);
        (await item.loadMapItems()).throwIfError();
        const mapItem = item.mapItems[0];
        expect(mapItem instanceof CustomDataSource).toBe(true);
        if (mapItem instanceof CustomDataSource) {
          expect(mapItem.entities.values.length).toBe(13);
        }
      });
    });
  });

  // Note this is identical to "when the table has time, lat/lon and id columns" EXCEPT
  // - one additional spec - "doesn't show regions - even if empty region column is detected"
  // - "sets showInChartPanel to true - when lat/lon is disabled" is replaced by "shows regions when lat/lon is disabled"
  describe("when the table has time, lat/lon, id columns AND regions", function () {
    let dataSource: CustomDataSource;
    beforeEach(async function () {
      item.setTrait(
        CommonStrata.user,
        "csvString",
        LatLonEnumDateIdWithRegionCsv
      );
      (await item.loadMapItems()).throwIfError();
      dataSource = <CustomDataSource>item.mapItems[0];
      expect(dataSource instanceof CustomDataSource).toBe(true);
    });

    it("creates one entity per id", async function () {
      expect(item.activeTableStyle.rowGroups.length).toBe(4);
      if (dataSource instanceof CustomDataSource) {
        expect(dataSource.entities.values.length).toBe(4);
      }
    });

    it("sets showInChartPanel to false - as is mappable", async function () {
      expect(item.showInChartPanel).toBeFalsy();
    });

    it("shows regions when lat/lon is disabled", async function () {
      updateModelFromJson(item, CommonStrata.definition, {
        columns: [
          { name: "lat", type: "scalar" },
          { name: "lon", type: "scalar" }
        ]
      });
      expect(item.showInChartPanel).toBeFalsy();
      expect(item.showingRegions).toBeTruthy();
      expect(
        item.activeTableStyle.regionColumn?.valuesAsRegions.uniqueRegionIds
          .length
      ).toBe(3);
    });

    it("doesn't show regions - as more points are detected than unique regions", () => {
      expect(item.showingRegions).toBeFalsy();
    });

    it("calculates rectangle", async function () {
      expect(item.rectangle.north).toEqual(-20);
      expect(item.rectangle.south).toEqual(-37);
      expect(item.rectangle.east).toEqual(155);
      expect(item.rectangle.west).toEqual(115);
    });

    describe("the entities", function () {
      it("has availability defined over the correct span", function () {
        expect(
          dataSource.entities.values.map((e) =>
            e.availability?.start.toString()
          )
        ).toEqual([
          "2015-08-01T00:00:00Z",
          "2015-08-01T00:00:00Z",
          "2015-08-02T00:00:00Z",
          "2015-08-03T00:00:00Z"
        ]);
        expect(
          dataSource.entities.values.map((e) => e.availability?.stop.toString())
        ).toEqual([
          "2015-08-07T06:00:00Z",
          "2015-08-07T00:00:00Z",
          "2015-08-02T23:59:59Z",
          "2015-08-05T00:00:00Z"
        ]);
      });
    });

    describe("when timeColumn is `null`", function () {
      it("returns an empty `discreteTimes`", async function () {
        expect(item.discreteTimes?.length).toBe(6);
        item.defaultStyle.time.setTrait(CommonStrata.user, "timeColumn", null);
        expect(item.discreteTimes).toBe(undefined);
      });

      it("creates entities for all times", async function () {
        item.defaultStyle.time.setTrait(CommonStrata.user, "timeColumn", null);
        (await item.loadMapItems()).throwIfError();
        const mapItem = item.mapItems[0];
        expect(mapItem instanceof CustomDataSource).toBe(true);
        if (mapItem instanceof CustomDataSource) {
          expect(mapItem.entities.values.length).toBe(13);
        }
      });
    });
  });

  describe("when the table has lat/lon columns but no time & id columns", function () {
    it("creates one entity per row", async function () {
      runInAction(() =>
        item.setTrait(CommonStrata.user, "csvString", LatLonValCsv)
      );

      (await item.loadMapItems()).throwIfError();
      const mapItem = item.mapItems[0];
      expect(mapItem instanceof CustomDataSource).toBe(true);
      if (mapItem instanceof CustomDataSource) {
        expect(mapItem.entities.values.length).toBe(5);
      }
    });

    it("removes duplicate rows when requested", async function () {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "csvString", LatLonValCsvDuplicate);
        item.setTrait(CommonStrata.user, "removeDuplicateRows", true);
      });

      (await item.loadMapItems()).throwIfError();
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

    it("has the correct property names", async function () {
      runInAction(() =>
        item.setTrait(CommonStrata.user, "csvString", LatLonValCsv)
      );
      (await item.loadMapItems()).throwIfError();
      const dataSource = item.mapItems[0] as CustomDataSource;
      const propertyNames =
        dataSource.entities.values[0].properties?.propertyNames;
      expect(propertyNames).toEqual(["lat", "lon", "value"]);
    });
  });

  describe("when the time column has bad datetimes in it", function () {
    it("ignores them gracefully", async function () {
      runInAction(() =>
        item.setTrait(CommonStrata.user, "csvString", BadDatesCsv)
      );

      (await item.loadMapItems()).throwIfError();
      const mapItem = item.mapItems[0];
      expect(mapItem instanceof CustomDataSource).toBe(true);
      if (mapItem instanceof CustomDataSource) {
        expect(mapItem.entities.values.length).toBe(3);
      }
    });
  });

  describe("when the table has time-series points with intervals", function () {
    let dataSource: CustomDataSource;
    beforeEach(async function () {
      item.setTrait(CommonStrata.user, "csvString", ParkingSensorDataCsv);
      (await item.loadMapItems()).throwIfError();
      dataSource = <CustomDataSource>item.mapItems[0];
      expect(dataSource instanceof CustomDataSource).toBe(true);
    });

    it("creates one entity per id", async function () {
      expect(dataSource.entities.values.length).toBe(21);
    });

    it("creates correct intervals", async function () {
      expect(item.activeTableStyle.timeIntervals?.length).toBe(21);
      expect(item.disableDateTimeSelector).toBeFalsy();
      expect(
        item.activeTableStyle.timeIntervals?.map((t) => [
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

    it("creates correct intervals if spreadStartTime", async function () {
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
        item.activeTableStyle.timeIntervals?.map((t) => [
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

    it("creates correct intervals if spreadStartTime and spreadFinishTime", async function () {
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

    it("creates correct intervals if spreadFinishTime", async function () {
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
        item.activeTableStyle.timeIntervals?.map((t) => [
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

    it("creates disable time dimension by default for this dataset", async function () {
      expect(item.timeDisableDimension).toBeDefined();
    });

    it("doesn't disable time dimension if `showDisableTimeOption = false`", async function () {
      runInAction(() =>
        item.setTrait(CommonStrata.user, "showDisableTimeOption", false)
      );

      expect(item.timeDisableDimension).toBeUndefined();
    });

    it("doesn't disable time dimension by default for another dataset", async function () {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "csvString", LatLonEnumDateIdCsv);
      });

      (await item.loadMapItems()).throwIfError();
      expect(item.timeDisableDimension).toBeUndefined();
    });

    it("creates disable time dimension for another dataset if `showDisableTimeOption = true`", async function () {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "csvString", LatLonEnumDateIdCsv);
        item.setTrait(CommonStrata.user, "showDisableTimeOption", true);
      });

      (await item.loadMapItems()).throwIfError();
      expect(item.timeDisableDimension).toBeDefined();
    });
  });

  describe("when the table has a few styles", function () {
    it("creates all styleDimensions", async function () {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "csvString", LatLonEnumDateIdCsv);
      });

      (await item.loadMapItems()).throwIfError();

      expect(item.styleDimensions?.options?.length).toBe(4);
      expect(item.styleDimensions?.options?.[2].id).toBe("value");
      expect(item.styleDimensions?.options?.[2].name).toBe("Value");
    });

    it("creates all styleDimensions - with disable style", async function () {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "csvString", LatLonEnumDateIdCsv);
        item.setTrait(CommonStrata.user, "showDisableStyleOption", true);
      });

      (await item.loadMapItems()).throwIfError();

      expect(item.styleDimensions?.options?.length).toBe(4);
      expect(item.styleDimensions?.allowUndefined).toBeTruthy();
      expect(item.styleDimensions?.undefinedLabel).toBe(
        "models.tableData.styleDisabledLabel"
      );
    });

    it("uses TableColumnTraits for style title", async function () {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "csvString", LatLonEnumDateIdCsv);
        updateModelFromJson(item, CommonStrata.definition, {
          columns: [{ name: "value", title: "Some Title" }]
        });
      });

      (await item.loadMapItems()).throwIfError();

      expect(item.styleDimensions?.options?.[2].id).toBe("value");
      expect(item.styleDimensions?.options?.[2].name).toBe("Some Title");
    });

    it("uses TableStyleTraits for style title", async function () {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "csvString", LatLonEnumDateIdCsv);
        updateModelFromJson(item, CommonStrata.definition, {
          columns: [{ name: "value", title: "Some Title" }],
          styles: [{ id: "value", title: "Some Style Title" }]
        });
      });

      (await item.loadMapItems()).throwIfError();

      expect(item.styleDimensions?.options?.[2].id).toBe("value");
      expect(item.styleDimensions?.options?.[2].name).toBe("Some Style Title");
    });

    it("loads regionProviderLists on loadMapItems", async function () {
      item.setTrait(CommonStrata.user, "csvString", LatLonEnumDateIdCsv);

      (await item.loadMetadata()).throwIfError();

      expect(item.regionProviderLists).toBeUndefined();

      (await item.loadMapItems()).throwIfError();

      expect(item.regionProviderLists?.[0]?.regionProviders.length).toBe(
        NUMBER_OF_REGION_MAPPING_TYPES
      );
    });

    it("loads regionProviderLists on loadMapItems - with multiple regionMappingDefinitionsUrl", async function () {
      // We add "additionalRegion.json" - which defines two region types
      // - "SOME_OTHER_REGION" - which is just another region type
      // - "SOME_OVERRIDDEN_REGION" - which will override "LGA_NAME_2011" in "build/TerriaJS/data/regionMapping.json"
      jasmine.Ajax.stubRequest("additionalRegion.json").andReturn({
        responseText: additionalRegionMapping
      });

      terria.updateParameters({
        regionMappingDefinitionsUrls: [
          "additionalRegion.json",
          "build/TerriaJS/data/regionMapping.json"
        ]
      });

      item.setTrait(CommonStrata.user, "csvString", LgaWithDisambigCsv);

      (await item.loadMetadata()).throwIfError();

      expect(item.regionProviderLists).toBeUndefined();

      (await item.loadMapItems()).throwIfError();

      expect(item.regionProviderLists?.length).toBe(2);

      expect(item.regionProviderLists?.[0]?.regionProviders.length).toBe(2);
      expect(item.regionProviderLists?.[1]?.regionProviders.length).toBe(
        NUMBER_OF_REGION_MAPPING_TYPES
      );

      // Item region provider should match from "additionalRegion.json" (as it comes before "build/TerriaJS/data/regionMapping.json")
      expect(item.activeTableStyle.regionColumn?.regionType?.description).toBe(
        "Local Government Areas 2011 by name (ABS) !!!! OVERRIDDEN"
      );
    });

    it("loads regionProviderLists on loadMapItems - will use regionMappingDefinitionsUrl instead of regionMappingDefinitionsUrls", async function () {
      // We add "additionalRegion.json" - which defines two region types
      // - "SOME_OTHER_REGION" - which is just another region type
      // - "SOME_OVERRIDDEN_REGION" - which will override "LGA_NAME_2011" in "build/TerriaJS/data/regionMapping.json"
      jasmine.Ajax.stubRequest("additionalRegion.json").andReturn({
        responseText: additionalRegionMapping
      });

      terria.updateParameters({
        regionMappingDefinitionsUrl: "build/TerriaJS/data/regionMapping.json",
        regionMappingDefinitionsUrls: [
          "additionalRegion.json",
          "build/TerriaJS/data/regionMapping.json"
        ]
      });

      item.setTrait(CommonStrata.user, "csvString", LgaWithDisambigCsv);

      (await item.loadMetadata()).throwIfError();

      expect(item.regionProviderLists).toBeUndefined();

      (await item.loadMapItems()).throwIfError();

      expect(item.regionProviderLists?.length).toBe(1);

      expect(item.regionProviderLists?.[0]?.regionProviders.length).toBe(
        NUMBER_OF_REGION_MAPPING_TYPES
      );

      // Item region provider should match from "build/TerriaJS/data/regionMapping.json"
      expect(item.activeTableStyle.regionColumn?.regionType?.description).toBe(
        "Local Government Areas 2011 by name (ABS)"
      );
    });
  });

  describe("creates legend", function () {
    it(" - correct decimal places for values [0,100]", async function () {
      item.setTrait("definition", "csvString", LegendDecimalPlacesCsv);

      item.setTrait("definition", "activeStyle", "0dp");

      (await item.loadMapItems()).throwIfError();

      expect(item.legends[0].items.length).toBe(7);
      expect(item.legends[0].items.map((i) => i.title)).toEqual([
        "65",
        "54",
        "44",
        "33",
        "22",
        "12",
        "1"
      ]);
    });

    it(" - correct decimal places for values [0,10]", async function () {
      item.setTrait("definition", "csvString", LegendDecimalPlacesCsv);

      item.setTrait("definition", "activeStyle", "1dp");

      (await item.loadMapItems()).throwIfError();

      expect(item.legends[0].items.length).toBe(7);
      expect(item.legends[0].items.map((i) => i.title)).toEqual([
        "10.0",
        "8.3",
        "6.7",
        "5.0",
        "3.3",
        "1.7",
        "0.0"
      ]);
    });

    it(" - correct decimal places for values [0,1]", async function () {
      item.setTrait("definition", "csvString", LegendDecimalPlacesCsv);

      item.setTrait("definition", "activeStyle", "2dp");

      (await item.loadMapItems()).throwIfError();

      expect(item.legends[0].items.length).toBe(7);
      expect(item.legends[0].items.map((i) => i.title)).toEqual([
        "0.70",
        "0.58",
        "0.47",
        "0.35",
        "0.23",
        "0.12",
        "0.00"
      ]);
    });

    it(" - correct decimal places for values [0,0.1]", async function () {
      item.setTrait("definition", "csvString", LegendDecimalPlacesCsv);

      item.setTrait("definition", "activeStyle", "3dp");

      (await item.loadMapItems()).throwIfError();

      expect(item.legends[0].items.length).toBe(7);
      expect(item.legends[0].items.map((i) => i.title)).toEqual([
        "0.080",
        "0.068",
        "0.057",
        "0.045",
        "0.033",
        "0.022",
        "0.010"
      ]);
    });

    it(" - uses color column title by default", async function () {
      item.setTrait("definition", "csvString", LegendDecimalPlacesCsv);
      item.setTrait("definition", "activeStyle", "0dp");

      updateModelFromJson(item, CommonStrata.user, {
        styles: [{ name: "0dp", title: "Some title" }]
      });

      (await item.loadMapItems()).throwIfError();

      expect(item.legends[0].title).toBe("0dp");
    });
  });

  describe("region mapping - LGA with disambig", function () {
    beforeEach(async function () {
      item.setTrait(CommonStrata.user, "csvString", LgaWithDisambigCsv);
      (await item.loadMapItems()).throwIfError();

      await item.regionProviderLists?.[0]
        ?.getRegionProvider("LGA_NAME_2011")
        ?.loadRegionIDs();
      await item.regionProviderLists?.[0]
        ?.getRegionProvider("STE_NAME_2016")
        ?.loadRegionIDs();
    });

    it("creates imagery parts", async function () {
      expect(ImageryParts.is(item.mapItems[0])).toBeTruthy();
    });

    it("with state", async function () {
      updateModelFromJson(item, CommonStrata.user, {
        columns: [
          {
            name: "State",
            regionType: "STE_NAME_2016"
          }
        ],
        defaultStyle: {
          regionColumn: "State"
        }
      });

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

    it("with lga_name", async function () {
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

    it("matches column name with whitespace", async function () {
      item.setTrait(
        CommonStrata.user,
        "csvString",
        `lga code-_-2015,number
        35740,1
        36720,2
        `
      );

      (await item.loadMapItems()).throwIfError();

      expect(item.activeTableStyle.regionColumn?.name).toBe("lga code-_-2015");
      expect(item.activeTableStyle.regionColumn?.regionType?.regionType).toBe(
        "LGA_2015"
      );
    });

    it("shows region shortReportSection", async function () {
      const regionCol = item.activeTableStyle.regionColumn;

      const regionType = regionCol?.regionType;

      expect(regionType).toBeDefined();

      expect(item.shortReportSections[0].name).toBe(
        `**Regions:** ${regionType?.description}`
      );
    });

    it("doesn't show region shortReportSection if region is disabled", async function () {
      updateModelFromJson(item, CommonStrata.user, {
        defaultStyle: {
          regionColumn: "Something else"
        }
      });

      expect(item.shortReportSections.length).toBe(0);
    });
  });

  describe("applies TableStyles to lat/lon features", function () {
    it("supports image marker style", async function () {
      item.setTrait(CommonStrata.user, "csvString", LatLonValCsv);

      const image =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAZNJREFUWIXtlrFLQlEUxr/QPGYhTbYEhhgWErjU0twQ9AdEGNnU0CiBL60pMBqC2gSHhgoamhoFt8ZaIugtQhFFY1Hmp0EN+ehZDd3e84ngB493733vnPPjXj7OdaPFcncA2h3AIyLrJBMiskcy01QAEdkgmTavkTTeaQDpbyFdtgKQXFH5/y9SPQKPefII7PuB2Xqe0xGRgE4ONxOgQX4gbppOHpGlmGIOW10wCoRUY2wFKP0jxhJAHMAqgCCAawBRpwEO6o8VWQKYjqK8lYAEA3Bd3UGf0BBxFOBYg6+n+3M8HkJkaQqVXAFexwCM4oZ2F+HNFdRytHczeq017sJyHi8Aeh0DmMniaSeB96EBeC5ucJ4vYlI1hyWA4iX8Y1/tSbm4ZQCJohxegHgDcD3fQtczDtswtgafMe4PIxLZRElPqfUDW13QN9jiZlR5UI+xBPBWA9wmG96fNN+GVZhuRWfzP74rFVcGEJFtkinVIrYBkNQAaKYlj4hkSc6JyCHJZFMBflG1XjRpXM+dBrCsDsAHoPtrwlSQt8wAAAAASUVORK5CYII=";

      item.setTrait(CommonStrata.user, "styles", [
        createStratumInstance(TableStyleTraits, {
          id: "test-style",
          point: createStratumInstance(TablePointStyleTraits, {
            null: createStratumInstance(PointSymbolTraits, {
              marker: image,
              height: 20
            })
          })
        })
      ]);
      item.setTrait(CommonStrata.user, "activeStyle", "test-style");

      (await item.loadMapItems()).throwIfError();

      const mapItem = item.mapItems[0] as CustomDataSource;

      mapItem.entities.values.forEach((feature) => {
        expect(
          feature.billboard?.image?.getValue(
            item.terria.timelineClock.currentTime
          )
        ).toBe(image);

        expect(
          feature.billboard?.height?.getValue(
            item.terria.timelineClock.currentTime
          )
        ).toBe(20);
      });
    });

    it("bin outline style with points", async function () {
      item.setTrait(CommonStrata.user, "csvString", LatLonValCsv);

      item.setTrait(CommonStrata.user, "styles", [
        createStratumInstance(TableStyleTraits, {
          id: "test-style",
          color: createStratumInstance(TableColorStyleTraits, {
            colorColumn: "value",
            colorPalette: "Greens",
            numberOfBins: 7
          }),
          point: createStratumInstance(TablePointStyleTraits, {
            column: "value",
            bin: [
              createStratumInstance(BinPointSymbolTraits, {
                maxValue: 1,
                marker: "point",
                height: 20
              }),
              createStratumInstance(BinPointSymbolTraits, {
                maxValue: 3,
                marker: "point",
                height: 10
              }),
              createStratumInstance(BinPointSymbolTraits, {
                maxValue: 5,
                marker: "point",
                height: 30
              })
            ]
          }),
          outline: createStratumInstance(TableOutlineStyleTraits, {
            column: "value",
            bin: [
              createStratumInstance(BinOutlineSymbolTraits, {
                maxValue: 1,
                color: "rgb(0,0,0)",
                width: 1
              }),
              createStratumInstance(BinOutlineSymbolTraits, {
                maxValue: 3,
                color: "rgb(255,0,0)",
                width: 2
              }),
              createStratumInstance(BinOutlineSymbolTraits, {
                maxValue: 5,
                color: "rgb(0,255,0)",
                width: 3
              })
            ]
          })
        })
      ]);
      item.setTrait(CommonStrata.user, "activeStyle", "test-style");

      (await item.loadMapItems()).throwIfError();

      const mapItem = item.mapItems[0] as CustomDataSource;

      const styles = [
        {
          fillColor: "rgb(35,139,69)",
          outlineColor: "rgb(0,255,0)",
          outlineWidth: 3,
          pixelSize: 30
        },
        {
          fillColor: "rgb(116,196,118)",
          outlineColor: "rgb(255,0,0)",
          outlineWidth: 2,
          pixelSize: 10
        },
        {
          fillColor: "rgb(186,228,179)",
          outlineColor: "rgb(0,0,0)",
          outlineWidth: 1,
          pixelSize: 20
        },
        {
          fillColor: "rgb(237,248,233)",
          outlineColor: "rgb(0,0,0)",
          outlineWidth: 1,
          pixelSize: 20
        },
        {
          fillColor: "rgb(116,196,118)",
          outlineColor: "rgb(255,0,0)",
          outlineWidth: 2,
          pixelSize: 10
        }
      ];

      styles.forEach((style, index) => {
        const feature = mapItem.entities.values[index];
        expect(
          feature.point?.color
            ?.getValue(item.terria.timelineClock.currentTime)
            ?.toCssColorString()
        ).toBe(style.fillColor);

        expect(
          feature.point?.outlineColor
            ?.getValue(item.terria.timelineClock.currentTime)
            ?.toCssColorString()
        ).toBe(style.outlineColor);

        expect(
          feature.point?.outlineWidth?.getValue(
            item.terria.timelineClock.currentTime
          )
        ).toBe(style.outlineWidth);

        expect(
          feature.point?.pixelSize?.getValue(
            item.terria.timelineClock.currentTime
          )
        ).toBe(style.pixelSize);
      });
    });

    it("bin color and outline style with markers", async function () {
      item.setTrait(CommonStrata.user, "csvString", LatLonValCsv);

      item.setTrait(CommonStrata.user, "styles", [
        createStratumInstance(TableStyleTraits, {
          id: "test-style",
          color: createStratumInstance(TableColorStyleTraits, {
            nullColor: "rgb(0,255,255)"
          }),
          point: createStratumInstance(TablePointStyleTraits, {
            column: "value",
            bin: [
              createStratumInstance(BinPointSymbolTraits, {
                maxValue: 1,
                marker: "circle",
                height: 20,
                width: 10
              }),
              createStratumInstance(BinPointSymbolTraits, {
                maxValue: 3,
                marker: "cross",
                height: 10,
                width: 5
              }),
              createStratumInstance(BinPointSymbolTraits, {
                maxValue: 5,
                marker: "hospital",
                height: 30,
                width: 15,
                rotation: 45
              })
            ]
          }),
          outline: createStratumInstance(TableOutlineStyleTraits, {
            null: createStratumInstance(BinOutlineSymbolTraits, {
              maxValue: 1,
              color: "rgb(0,0,255)",
              width: 1
            })
          })
        })
      ]);
      item.setTrait(CommonStrata.user, "activeStyle", "test-style");

      (await item.loadMapItems()).throwIfError();

      const mapItem = item.mapItems[0] as CustomDataSource;

      const styles = [
        {
          fillColor: "rgb(0,255,255)",
          outlineColor: "rgb(0,0,255)",
          outlineWidth: 1,
          marker: "hospital",
          height: 30,
          width: 15,
          // Convert to counter-clockwise radians
          rotation: ((360 - 45) / 360) * (2 * Math.PI)
        },
        {
          fillColor: "rgb(0,255,255)",
          outlineColor: "rgb(0,0,255)",
          outlineWidth: 1,
          marker: "cross",
          height: 10,
          width: 5,
          rotation: 2 * Math.PI
        },
        {
          fillColor: "rgb(0,255,255)",
          outlineColor: "rgb(0,0,255)",
          outlineWidth: 1,
          marker: "circle",
          height: 20,
          width: 10,
          rotation: 2 * Math.PI
        },
        {
          fillColor: "rgb(0,255,255)",
          outlineColor: "rgb(0,0,255)",
          outlineWidth: 1,
          marker: "circle",
          height: 20,
          width: 10,
          rotation: 2 * Math.PI
        },
        {
          fillColor: "rgb(0,255,255)",
          outlineColor: "rgb(0,0,255)",
          outlineWidth: 1,
          marker: "cross",
          height: 10,
          width: 5,
          rotation: 2 * Math.PI
        }
      ];

      styles.forEach((style, index) => {
        const feature = mapItem.entities.values[index];

        expect(
          feature.billboard?.rotation?.getValue(
            item.terria.timelineClock.currentTime
          )
        ).toBeCloseTo(style.rotation);

        expect(
          feature.billboard?.image?.getValue(
            item.terria.timelineClock.currentTime
          )
        ).toBe(
          getMakiIcon(
            style.marker,
            style.fillColor,
            style.outlineWidth,
            style.outlineColor,
            style.height,
            style.width
          )
        );
      });

      // Test merging legends

      expect(
        item.legends[0].items.map((item) => ({
          title: item.title,
          outlineColor: item.outlineColor,
          outlineWidth: item.outlineWidth,
          imageHeight: item.imageHeight,
          imageWidth: item.imageWidth,
          color: item.color,
          marker: item.marker,
          rotation: item.rotation
        }))
      ).toEqual([
        {
          title: "3 to 5",
          color: "rgb(0,255,255)",
          outlineColor: "rgb(0,0,255)",
          outlineWidth: 1,
          marker: "hospital",
          rotation: 45,
          imageHeight: 24,
          imageWidth: 24
        },
        {
          title: "1 to 3",
          color: "rgb(0,255,255)",
          outlineColor: "rgb(0,0,255)",
          outlineWidth: 1,
          marker: "cross",
          imageHeight: 24,
          imageWidth: 24,
          rotation: 0
        },
        {
          title: "-1 to 1",
          color: "rgb(0,255,255)",
          outlineColor: "rgb(0,0,255)",
          outlineWidth: 1,
          marker: "circle",
          imageHeight: 24,
          imageWidth: 24,
          rotation: 0
        }
      ]);
    });

    it("enum outline style with points", async function () {
      item.setTrait(CommonStrata.user, "csvString", LatLonEnumCsv);

      item.setTrait(CommonStrata.user, "styles", [
        createStratumInstance(TableStyleTraits, {
          id: "test-style",
          color: createStratumInstance(TableColorStyleTraits, {
            nullColor: "rgb(255,0,255)"
          }),
          point: createStratumInstance(TablePointStyleTraits, {
            column: "enum",
            enum: [
              createStratumInstance(EnumPointSymbolTraits, {
                value: "hello",
                height: 20
              }),
              createStratumInstance(EnumPointSymbolTraits, {
                value: "boots",
                height: 10
              }),
              createStratumInstance(EnumPointSymbolTraits, {
                value: "frogs",
                height: 30
              })
            ]
          }),
          outline: createStratumInstance(TableOutlineStyleTraits, {
            column: "enum",
            enum: [
              createStratumInstance(EnumOutlineSymbolTraits, {
                value: "hello",
                color: "rgb(0,0,0)",
                width: 1
              }),
              createStratumInstance(EnumOutlineSymbolTraits, {
                value: "boots",
                color: "rgb(255,0,0)",
                width: 2
              }),
              createStratumInstance(EnumOutlineSymbolTraits, {
                value: "frogs",
                color: "rgb(0,255,0)",
                width: 3
              })
            ]
          })
        })
      ]);
      item.setTrait(CommonStrata.user, "activeStyle", "test-style");

      (await item.loadMapItems()).throwIfError();

      const mapItem = item.mapItems[0] as CustomDataSource;

      const styles = [
        {
          fillColor: "rgb(255,0,255)",
          outlineColor: "rgb(0,0,0)",
          outlineWidth: 1,
          pixelSize: 20
        },
        {
          fillColor: "rgb(255,0,255)",
          outlineColor: "rgb(255,0,0)",
          outlineWidth: 2,
          pixelSize: 10
        },
        {
          fillColor: "rgb(255,0,255)",
          outlineColor: "rgb(0,255,0)",
          outlineWidth: 3,
          pixelSize: 30
        },
        {
          fillColor: "rgb(255,0,255)",
          outlineColor: "rgb(255,0,0)",
          outlineWidth: 2,
          pixelSize: 10
        },
        {
          fillColor: "rgb(255,0,255)",
          outlineColor: "rgb(0,0,0)",
          outlineWidth: 1,
          pixelSize: 20
        }
      ];

      styles.forEach((style, index) => {
        const feature = mapItem.entities.values[index];
        expect(
          feature.point?.color
            ?.getValue(item.terria.timelineClock.currentTime)
            ?.toCssColorString()
        ).toBe(style.fillColor);

        expect(
          feature.point?.outlineColor
            ?.getValue(item.terria.timelineClock.currentTime)
            ?.toCssColorString()
        ).toBe(style.outlineColor);

        expect(
          feature.point?.outlineWidth?.getValue(
            item.terria.timelineClock.currentTime
          )
        ).toBe(style.outlineWidth);

        expect(
          feature.point?.pixelSize?.getValue(
            item.terria.timelineClock.currentTime
          )
        ).toBe(style.pixelSize);

        // Test merging legends

        expect(
          item.legends[0].items.map((item) => ({
            title: item.title,
            outlineColor: item.outlineColor,
            outlineWidth: item.outlineWidth,
            imageHeight: item.imageHeight,
            imageWidth: item.imageWidth
          }))
        ).toEqual([
          {
            title: "hello",
            outlineColor: "rgb(0,0,0)",
            outlineWidth: 1,
            imageHeight: 24,
            imageWidth: 24
          },
          {
            title: "boots",
            outlineColor: "rgb(255,0,0)",
            outlineWidth: 2,
            imageHeight: 24,
            imageWidth: 24
          },
          {
            title: "frogs",
            outlineColor: "rgb(0,255,0)",
            outlineWidth: 3,
            imageHeight: 24,
            imageWidth: 24
          }
        ]);
      });
    });

    it("enum label style with points", async function () {
      item.setTrait(CommonStrata.user, "csvString", LatLonEnumCsv);

      item.setTrait(CommonStrata.user, "styles", [
        createStratumInstance(TableStyleTraits, {
          id: "test-style",
          color: createStratumInstance(TableColorStyleTraits, {
            nullColor: "rgb(255,0,255)"
          }),
          label: createStratumInstance(TableLabelStyleTraits, {
            column: "enum",
            enabled: true,
            enum: [
              createStratumInstance(EnumLabelSymbolTraits, {
                value: "hello",
                labelColumn: "enum",
                font: "10px sans-serif",
                style: "FILL",
                scale: 1.5,
                fillColor: "#ff00ff",
                pixelOffset: [0, 0],
                horizontalOrigin: "LEFT",
                verticalOrigin: "TOP"
              }),
              createStratumInstance(EnumLabelSymbolTraits, {
                value: "boots",
                labelColumn: "enum",
                font: "20px Arial",
                style: "FILL_AND_OUTLINE",
                scale: 2,
                fillColor: "#0000ff",
                outlineColor: "#00ff00",
                outlineWidth: 1,
                pixelOffset: [1, 1],
                horizontalOrigin: "CENTER",
                verticalOrigin: "CENTER"
              }),
              createStratumInstance(EnumLabelSymbolTraits, {
                value: "frogs",
                labelColumn: "lon",
                font: "30px serif",
                style: "OUTLINE",
                scale: 3,
                outlineColor: "#ff0000",
                outlineWidth: 2,
                pixelOffset: [2, 2],
                horizontalOrigin: "RIGHT",
                verticalOrigin: "BOTTOM"
              })
            ]
          })
        })
      ]);
      item.setTrait(CommonStrata.user, "activeStyle", "test-style");

      (await item.loadMapItems()).throwIfError();

      const mapItem = item.mapItems[0] as CustomDataSource;

      // Note these are slightly different from EnumLabelSymbolTraits above
      // This is because some values get converted into cesium formats (eg Cartesian2, LabelStyle etc)
      const enumStyles = [
        {
          value: "hello",
          text: "hello", // labelColumn: "enum",
          labelColumn: "enum",
          font: "10px sans-serif",
          style: LabelStyle.FILL,
          scale: 1.5,
          fillColor: "rgb(255,0,255)",
          pixelOffset: "(0, 0)", // Cartesian2.toString()
          horizontalOrigin: HorizontalOrigin.LEFT,
          verticalOrigin: VerticalOrigin.TOP
        },
        {
          value: "boots",
          text: "boots", //labelColumn: "enum",
          font: "20px Arial",
          style: LabelStyle.FILL_AND_OUTLINE,
          scale: 2,
          fillColor: "rgb(0,0,255)",
          outlineColor: "rgb(0,255,0)",
          outlineWidth: 1,
          pixelOffset: "(1, 1)", // Cartesian2.toString()
          horizontalOrigin: HorizontalOrigin.CENTER,
          verticalOrigin: VerticalOrigin.CENTER
        },
        {
          value: "frogs",
          text: "145", // labelColumn: "lon",
          font: "30px serif",
          style: LabelStyle.OUTLINE,
          scale: 3,
          outlineColor: "rgb(255,0,0)",
          outlineWidth: 2,
          pixelOffset: "(2, 2)", // Cartesian2.toString()
          horizontalOrigin: HorizontalOrigin.RIGHT,
          verticalOrigin: VerticalOrigin.BOTTOM
        }
      ];

      mapItem.entities.values.forEach((feature) => {
        // Find corresponding style by checking `enum` property
        const style = enumStyles.find(
          (s) =>
            s.value ===
            feature.properties?.getValue(item.terria.timelineClock.currentTime)
              .enum
        );

        if (!style) throw "Invalid feature styling!";

        const failMessage = (prop: string) =>
          `Failed to test feature ID: ${feature.id}, ID value: ${style.value}, property: ${prop}`;

        expect(
          feature.label?.text?.getValue(item.terria.timelineClock.currentTime)
        ).toBe(style.text, failMessage("text"));

        expect(
          feature.label?.font?.getValue(item.terria.timelineClock.currentTime)
        ).toBe(style.font, failMessage("font"));

        expect(
          feature.label?.style?.getValue(item.terria.timelineClock.currentTime)
        ).toBe(style.style, failMessage("style"));

        expect(
          feature.label?.scale?.getValue(item.terria.timelineClock.currentTime)
        ).toBe(style.scale, failMessage("scale"));

        expect(
          feature.label?.pixelOffset
            ?.getValue(item.terria.timelineClock.currentTime)
            ?.toString()
        ).toBe(style.pixelOffset, failMessage("pixelOffset"));

        expect(
          feature.label?.verticalOrigin?.getValue(
            item.terria.timelineClock.currentTime
          )
        ).toBe(style.verticalOrigin, failMessage("verticalOrigin"));

        expect(
          feature.label?.horizontalOrigin?.getValue(
            item.terria.timelineClock.currentTime
          )
        ).toBe(style.horizontalOrigin, failMessage("horizontalOrigin"));

        if (style.fillColor)
          expect(
            feature.label?.fillColor
              ?.getValue(item.terria.timelineClock.currentTime)
              ?.toCssColorString()
          ).toBe(style.fillColor, failMessage("fillColor"));

        if (style.outlineColor)
          expect(
            feature.label?.outlineColor
              ?.getValue(item.terria.timelineClock.currentTime)
              ?.toCssColorString()
          ).toBe(style.outlineColor, failMessage("outlineColor"));

        if (style.outlineWidth)
          expect(
            feature.label?.outlineWidth?.getValue(
              item.terria.timelineClock.currentTime
            )
          ).toBe(style.outlineWidth, failMessage("outlineWidth"));
      });
    });

    it("enum label style style with time-enabled points - static styling", async function () {
      item.setTrait(CommonStrata.user, "csvString", LatLonEnumDateIdCsv);

      item.setTrait(CommonStrata.user, "styles", [
        createStratumInstance(TableStyleTraits, {
          id: "test-style",
          color: createStratumInstance(TableColorStyleTraits, {
            nullColor: "rgb(255,0,255)"
          }),
          label: createStratumInstance(TableLabelStyleTraits, {
            column: "id",
            enabled: true,
            null: createStratumInstance(LabelSymbolTraits, {
              labelColumn: "id",
              font: "40px serif",
              style: "OUTLINE",
              scale: 4,
              outlineColor: "#ffffff",
              outlineWidth: 3,
              pixelOffset: [3, 3]
            }),
            enum: [
              createStratumInstance(EnumLabelSymbolTraits, {
                value: "feature A",
                labelColumn: "id",
                font: "10px sans-serif",
                style: "FILL",
                scale: 1.5,
                fillColor: "#ff00ff",
                pixelOffset: [0, 0]
              }),
              createStratumInstance(EnumLabelSymbolTraits, {
                value: "feature B",
                labelColumn: "id",
                font: "20px Arial",
                style: "FILL_AND_OUTLINE",
                scale: 2,
                fillColor: "#0000ff",
                outlineColor: "#00ff00",
                outlineWidth: 1,
                pixelOffset: [1, 1]
              }),
              createStratumInstance(EnumLabelSymbolTraits, {
                value: "feature C",
                labelColumn: "id",
                font: "30px serif",
                style: "OUTLINE",
                scale: 3,
                outlineColor: "#ff0000",
                outlineWidth: 2,
                pixelOffset: [2, 2]
              })
            ]
          })
        })
      ]);
      item.setTrait(CommonStrata.user, "activeStyle", "test-style");

      (await item.loadMapItems()).throwIfError();

      const mapItem = item.mapItems[0] as CustomDataSource;

      // Note these are slightly different from EnumLabelSymbolTraits above
      // This is because some values get converted into cesium formats (eg Cartesian2, LabelStyle etc)
      const enumStyles = [
        {
          value: "feature A",
          text: "feature A",
          labelColumn: "enum",
          font: "10px sans-serif",
          style: LabelStyle.FILL,
          scale: 1.5,
          fillColor: "rgb(255,0,255)",
          pixelOffset: "(0, 0)" // Cartesian2.toString()
        },
        {
          value: "feature B",
          text: "feature B",
          font: "20px Arial",
          style: LabelStyle.FILL_AND_OUTLINE,
          scale: 2,
          fillColor: "rgb(0,0,255)",
          outlineColor: "rgb(0,255,0)",
          outlineWidth: 1,
          pixelOffset: "(1, 1)" // Cartesian2.toString()
        },
        {
          value: "feature C",
          text: "feature C",
          font: "30px serif",
          style: LabelStyle.OUTLINE,
          scale: 3,
          outlineColor: "rgb(255,0,0)",
          outlineWidth: 2,
          pixelOffset: "(2, 2)" // Cartesian2.toString()
        }
      ];

      const nullStyle = {
        value: undefined,
        text: "feature D", // null style only applied to "feature D"
        font: "40px serif",
        style: LabelStyle.OUTLINE,
        scale: 4,
        fillColor: undefined,
        outlineColor: "rgb(255,255,255)",
        outlineWidth: 3,
        pixelOffset: "(3, 3)" // Cartesian2.toString()
      };

      mapItem.entities.values.forEach((feature) => {
        // We check all discrete times - but all values are the same for every timestamp
        item.discreteTimesAsSortedJulianDates?.map((discreteTime) => {
          // Don't bother checking point features with no position property
          if (!feature.position?.getValue(discreteTime.time)) return;

          // Find corresponding style by checking `enum` property
          const featureData = (
            (feature as TerriaFeature).data as TerriaFeatureData
          ).timeIntervalCollection;

          if (!featureData)
            `Failed to find featureData for feature ID: ${feature.id}`;

          // If feature data doesn't contain current discrete time - we can safely continue
          if (!featureData?.intervals.contains(discreteTime.time)) return;

          const featureIdValue = featureData?.getValue(discreteTime.time)?.id;

          const style =
            enumStyles.find((s) => s.value === featureIdValue) ?? nullStyle;

          const failMessage = (prop: string) =>
            `Failed to test feature ID: ${feature.id}, ID value: ${style.value}, time: ${discreteTime.tag}, property: ${prop}`;

          expect(feature.label?.text?.getValue(discreteTime.time)).toBe(
            style.text,
            failMessage("text")
          );

          expect(feature.label?.font?.getValue(discreteTime.time)).toBe(
            style.font,
            failMessage("font")
          );

          expect(feature.label?.style?.getValue(discreteTime.time)).toBe(
            style.style,
            failMessage("style")
          );

          expect(feature.label?.scale?.getValue(discreteTime.time)).toBe(
            style.scale,
            failMessage("scale")
          );

          expect(
            feature.label?.pixelOffset?.getValue(discreteTime.time)?.toString()
          ).toBe(style.pixelOffset, failMessage("pixelOffset"));

          if (style.fillColor)
            expect(
              feature.label?.fillColor
                ?.getValue(discreteTime.time)
                ?.toCssColorString()
            ).toBe(style.fillColor, failMessage("fillColor"));

          if (style.outlineColor)
            expect(
              feature.label?.outlineColor
                ?.getValue(discreteTime.time)
                ?.toCssColorString()
            ).toBe(style.outlineColor, failMessage("outlineColor"));

          if (style.outlineWidth)
            expect(
              feature.label?.outlineWidth?.getValue(discreteTime.time)
            ).toBe(style.outlineWidth, failMessage("outlineWidth"));
        });
      });
    });

    it("enum trail/path style with time-enabled points - static styling", async function () {
      item.setTrait(CommonStrata.user, "csvString", LatLonEnumDateIdCsv);

      const enumStyles = [
        {
          value: "feature A",
          leadTime: 0,
          trailTime: 10,
          width: 1,
          resolution: 40,

          polylineGlow: {
            color: "rgb(255,0,0)",
            glowPower: 0.1,
            taperPower: 0.4
          }
        },
        {
          value: "feature B",
          leadTime: 10,
          trailTime: 20,
          width: 1,
          resolution: 30,

          polylineGlow: {
            color: "rgb(0,255,0)",
            glowPower: 0.2,
            taperPower: 0.5
          }
        },
        {
          value: "feature C",
          leadTime: 20,
          trailTime: 60,
          width: 3,
          resolution: 30,

          polylineGlow: {
            color: "rgb(0,0,255)",
            glowPower: 0.3,
            taperPower: 0.6
          }
        },
        {
          value: "feature D",
          leadTime: 20,
          trailTime: 60,
          width: 3,
          resolution: 30,

          polylineGlow: {
            color: "rgb(0,0,255)",
            glowPower: 0.3,
            taperPower: 0.6
          }
        }
      ];

      item.setTrait(CommonStrata.user, "styles", [
        createStratumInstance(TableStyleTraits, {
          id: "test-style",
          color: createStratumInstance(TableColorStyleTraits, {
            nullColor: "rgb(255,0,255)"
          }),
          trail: createStratumInstance(TableTrailStyleTraits, {
            column: "id",
            enabled: true,
            materialType: "polylineGlow",
            enum: [
              createStratumInstance(EnumTrailSymbolTraits, enumStyles[0]),
              createStratumInstance(EnumTrailSymbolTraits, enumStyles[1]),
              createStratumInstance(EnumTrailSymbolTraits, enumStyles[2]),
              createStratumInstance(EnumTrailSymbolTraits, enumStyles[3])
            ]
          })
        })
      ]);
      item.setTrait(CommonStrata.user, "activeStyle", "test-style");

      (await item.loadMapItems()).throwIfError();

      const mapItem = item.mapItems[0] as CustomDataSource;

      mapItem.entities.values.forEach((feature) => {
        // We check all discrete times - but all values are the same for every timestamp
        item.discreteTimesAsSortedJulianDates?.map((discreteTime) => {
          // Don't bother checking point features with no position property
          if (!feature.position?.getValue(discreteTime.time)) return;

          // Find corresponding style by checking `enum` property
          const featureData = (
            (feature as TerriaFeature).data as TerriaFeatureData
          ).timeIntervalCollection;

          if (!featureData)
            `Failed to find featureData for feature ID: ${feature.id}`;

          // If feature data doesn't contain current discrete time - we can safely continue
          if (!featureData?.intervals.contains(discreteTime.time)) return;

          const featureIdValue = featureData?.getValue(discreteTime.time)?.id;

          const style = enumStyles.find((s) => s.value === featureIdValue);

          if (!style)
            throw `Failed to find style for feature ID: ${feature.id}, value: ${featureIdValue}`;

          const failMessage = (prop: string) =>
            `Failed to test feature ID: ${feature.id}, ID value: ${style.value}, time: ${discreteTime.tag}, property: ${prop}`;

          expect(feature.path?.leadTime?.getValue(discreteTime.time)).toBe(
            style.leadTime,
            failMessage("leadTime")
          );

          expect(feature.path?.trailTime?.getValue(discreteTime.time)).toBe(
            style.trailTime,
            failMessage("trailTime")
          );

          expect(feature.path?.width?.getValue(discreteTime.time)).toBe(
            style.width,
            failMessage("width")
          );

          expect(feature.path?.resolution?.getValue(discreteTime.time)).toBe(
            style.resolution,
            failMessage("resolution")
          );

          const material = feature.path?.material?.getValue(discreteTime.time);

          if (material) {
            expect(material.color?.toCssColorString()).toBe(
              style.polylineGlow.color,
              failMessage("polylineGlow.color")
            );

            expect(material.glowPower).toBe(
              style.polylineGlow.glowPower,
              failMessage("polylineGlow.glowPower")
            );

            expect(material.taperPower).toBe(
              style.polylineGlow.taperPower,
              failMessage("polylineGlow.taperPower")
            );
          }
        });
      });
    });

    it("bin trail/path style with time-enabled points - dynamic styling", async function () {
      item.setTrait(CommonStrata.user, "csvString", LatLonEnumDateIdCsv);

      const binStyles = [
        {
          maxValue: 50,
          leadTime: 0,
          trailTime: 10,
          width: 1,
          resolution: 40,

          polylineGlow: {
            color: "rgb(255,0,0)",
            glowPower: 0.1,
            taperPower: 0.4
          }
        },
        {
          maxValue: 60,
          leadTime: 10,
          trailTime: 20,
          width: 2,
          resolution: 30,

          polylineGlow: {
            color: "rgb(0,255,0)",
            glowPower: 0.2,
            taperPower: 0.5
          }
        },
        {
          maxValue: 70,
          leadTime: 20,
          trailTime: 60,
          width: 3,
          resolution: 30,

          polylineGlow: {
            color: "rgb(0,0,255)",
            glowPower: 0.3,
            taperPower: 0.6
          }
        }
      ];

      item.setTrait(CommonStrata.user, "styles", [
        createStratumInstance(TableStyleTraits, {
          id: "test-style",
          color: createStratumInstance(TableColorStyleTraits, {
            nullColor: "rgb(255,0,255)"
          }),
          trail: createStratumInstance(TableTrailStyleTraits, {
            column: "level",
            enabled: true,
            materialType: "polylineGlow",
            bin: [
              createStratumInstance(BinTrailSymbolTraits, binStyles[0]),
              createStratumInstance(BinTrailSymbolTraits, binStyles[1]),
              createStratumInstance(BinTrailSymbolTraits, binStyles[2])
            ]
          })
        })
      ]);
      item.setTrait(CommonStrata.user, "activeStyle", "test-style");

      (await item.loadMapItems()).throwIfError();

      const mapItem = item.mapItems[0] as CustomDataSource;

      // Time = level
      // 2015-08-01 = 50 (style 0)
      // 2015-08-02 = 60 (style 1)
      // 2015-08-04 = 70 (style 2)

      // We also check interpolated level at 2015-08-03
      // 2015-08-03 = 65 (style 1 into style 2)
      const interpolatedStyle = {
        maxValue: 65,
        leadTime: 15,
        trailTime: 40,
        width: 2.5,
        resolution: 30,

        polylineGlow: {
          color: "rgb(0,128,128)",
          glowPower: 0.25,
          taperPower: 0.55
        }
      };

      const times = [
        JulianDate.fromDate(new Date("2015-08-01")),
        JulianDate.fromDate(new Date("2015-08-02")),

        JulianDate.fromDate(new Date("2015-08-04")),
        JulianDate.fromDate(new Date("2015-08-03")) // Note interpolated date is last
      ];

      mapItem.entities.values.forEach((feature) => {
        times.forEach((time, timeIndex) => {
          const featureData = (
            (feature as TerriaFeature).data as TerriaFeatureData
          ).timeIntervalCollection;

          if (!featureData)
            `Failed to find featureData for feature ID: ${feature.id}`;

          const featureIdColumnValue = featureData?.getValue(time)?.id;

          // We only check features with id === "Feature A"
          // Otherwise the test would be too large
          if (featureIdColumnValue !== "feature A") return;

          const featureBinColumnValue = parseFloat(
            featureData?.getValue(time)?.level
          );

          // First three time indices map to binStyles - the last uses interpolatedStyle
          const style = binStyles[timeIndex] ?? interpolatedStyle;

          if (!style)
            throw `Failed to find style for feature ID: ${feature.id}, value: ${featureBinColumnValue}`;

          const failMessage = (prop: string) =>
            `Failed to test feature ID: ${feature.id}, ID value: ${featureBinColumnValue}, time: ${time}, property: ${prop}`;

          expect(feature.path?.leadTime?.getValue(time)).toBe(
            style.leadTime,
            failMessage("leadTime")
          );

          expect(feature.path?.trailTime?.getValue(time)).toBe(
            style.trailTime,
            failMessage("trailTime")
          );

          expect(feature.path?.width?.getValue(time)).toBe(
            style.width,
            failMessage("width")
          );

          expect(feature.path?.resolution?.getValue(time)).toBe(
            style.resolution,
            failMessage("resolution")
          );

          const material = feature.path?.material?.getValue(time);

          if (material) {
            expect(material.color?.toCssColorString()).toBe(
              style.polylineGlow.color,
              failMessage("polylineGlow.color")
            );

            expect(material.glowPower).toBe(
              style.polylineGlow.glowPower,
              failMessage("polylineGlow.glowPower")
            );

            expect(material.taperPower).toBe(
              style.polylineGlow.taperPower,
              failMessage("polylineGlow.taperPower")
            );
          }
        });
      });
    });

    it("doesn't pick hidden style as default activeStyle", async function () {
      item.setTrait(CommonStrata.user, "csvString", ParkingSensorDataCsv);

      (await item.loadMapItems()).throwIfError();

      expect(item.activeStyle).toBe("eventid");

      item.setTrait(CommonStrata.user, "styles", [
        createStratumInstance(TableStyleTraits, {
          id: "eventid",
          hidden: true
        })
      ]);

      (await item.loadMapItems()).throwIfError();

      expect(item.activeStyle).toBe("parkflag");
    });
  });
});
