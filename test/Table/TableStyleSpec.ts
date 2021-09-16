import ContinuousColorMap from "../../lib/Map/ContinuousColorMap";
import DiscreteColorMap from "../../lib/Map/DiscreteColorMap";
import EnumColorMap from "../../lib/Map/EnumColorMap";
import CsvCatalogItem from "../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import createStratumInstance from "../../lib/Models/Definition/createStratumInstance";
import Terria from "../../lib/Models/Terria";
import TableColorStyleTraits from "../../lib/Traits/TraitsClasses/TableColorStyleTraits";
import TableColumnTraits, {
  ColumnTransformationTraits
} from "../../lib/Traits/TraitsClasses/TableColumnTraits";
import TableStyleTraits from "../../lib/Traits/TraitsClasses/TableStyleTraits";

const regionMapping = JSON.stringify(
  require("../../wwwroot/data/regionMapping.json")
);

const SedCods = JSON.stringify(
  require("../../wwwroot/data/regionids/region_map-SED_CODE18_SED_2018.json")
);

const LatLonCsv = require("raw-loader!../../wwwroot/test/csv/lat_lon_enum_date_id.csv");
const SedCsv = require("raw-loader!../../wwwroot/test/csv/SED_2018_SED_CODE18.csv");
const YouthUnEmployCsv = require("raw-loader!../../wwwroot/test/csv/youth-unemployment-rate-2018.csv");

describe("Table Style", function() {
  let terria: Terria;

  beforeEach(async function() {
    terria = new Terria({
      baseUrl: "./"
    });
    terria.configParameters.regionMappingDefinitionsUrl =
      "build/TerriaJS/data/regionMapping.json";

    jasmine.Ajax.install();

    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionMapping.json"
    ).andReturn({ responseText: regionMapping });

    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionids/region_map-SED_CODE18_SED_2018.json"
    ).andReturn({ responseText: SedCods });
  });

  afterEach(() => {
    jasmine.Ajax.uninstall();
  });

  describe(" - Scalar", function() {
    let csvItem: CsvCatalogItem;

    beforeEach(async function() {
      csvItem = new CsvCatalogItem("SmallCsv", terria, undefined);
    });

    it(" - uses DiscreteColorMap if set numberOfBins", async function() {
      csvItem.setTrait("definition", "csvString", SedCsv);

      csvItem.setTrait("definition", "styles", [
        createStratumInstance(TableStyleTraits, {
          id: "Value",
          color: createStratumInstance(TableColorStyleTraits, {
            numberOfBins: 7
          })
        })
      ]);
      await csvItem.loadMapItems();

      const activeStyle = csvItem.activeTableStyle;
      const colorColumn = activeStyle.colorColumn;
      expect(colorColumn).toBeDefined();
      expect(colorColumn!.type).toBe(4);
      expect(colorColumn!.values.length).toBe(450);

      expect(activeStyle.tableColorMap.binColors.length).toEqual(7);
      expect(activeStyle.tableColorMap.binMaximums.length).toEqual(7);
      expect(activeStyle.colorMap instanceof DiscreteColorMap).toBeTruthy();

      expect(
        (activeStyle.colorMap as DiscreteColorMap).colors.map(c =>
          c.toCssHexString()
        )
      ).toEqual([
        "#fee5d9",
        "#fcbba1",
        "#fc9272",
        "#fb6a4a",
        "#ef3b2c",
        "#cb181d",
        "#99000d"
      ]);
    });

    it(" - uses DiscreteColorMap if set binMaximums", async function() {
      csvItem.setTrait("definition", "csvString", YouthUnEmployCsv);

      csvItem.setTrait("definition", "styles", [
        createStratumInstance(TableStyleTraits, {
          id: "youth unemployment (%)",
          color: createStratumInstance(TableColorStyleTraits, {
            binMaximums: [8, 10, 15, 20, 30, 50],
            colorPalette: "PiYG"
          })
        })
      ]);
      await csvItem.loadMapItems();

      const activeStyle = csvItem.activeTableStyle;
      const colorColumn = activeStyle.colorColumn;
      expect(colorColumn).toBeDefined();
      expect(colorColumn!.type).toBe(4);
      expect(colorColumn!.values.length).toBe(86);

      expect(activeStyle.tableColorMap.binColors.length).toEqual(6);
      expect(activeStyle.tableColorMap.binMaximums.length).toEqual(6);
      expect(activeStyle.colorMap instanceof DiscreteColorMap).toBeTruthy();

      expect(
        (activeStyle.colorMap as DiscreteColorMap).colors.map(c =>
          c.toCssHexString()
        )
      ).toEqual([
        "#c51b7d",
        "#e9a3c9",
        "#fde0ef",
        "#e6f5d0",
        "#a1d76a",
        "#4d9221"
      ]);
    });

    it(" - uses ContinuousColorMap by default", async function() {
      csvItem.setTrait("definition", "csvString", SedCsv);

      await csvItem.loadMapItems();

      const activeStyle = csvItem.activeTableStyle;
      const colorColumn = activeStyle.colorColumn;
      expect(colorColumn).toBeDefined();
      expect(colorColumn!.type).toBe(4);
      expect(colorColumn!.values.length).toBe(450);

      expect(activeStyle.colorMap instanceof ContinuousColorMap).toBeTruthy();
      expect((activeStyle.colorMap as ContinuousColorMap).minValue).toBe(0);

      expect(activeStyle.tableColorMap.isDiverging).toBeFalsy();
      expect((activeStyle.colorMap as ContinuousColorMap).maxValue).toBe(100);
      expect(
        (activeStyle.colorMap as ContinuousColorMap)
          .mapValueToColor(0)
          .toCssColorString()
      ).toBe("rgb(255,245,240)");
      expect(
        (activeStyle.colorMap as ContinuousColorMap)
          .mapValueToColor(50)
          .toCssColorString()
      ).toBe("rgb(249,105,76)");
      expect(
        (activeStyle.colorMap as ContinuousColorMap)
          .mapValueToColor(100)
          .toCssColorString()
      ).toBe("rgb(103,0,13)");
    });

    it(" - uses ContinuousColorMap with diverging color scale if appropriate", async function() {
      csvItem.setTrait("definition", "csvString", SedCsv);

      // Add value transformation to turn column values to be [-50,50]
      csvItem.setTrait("definition", "columns", [
        createStratumInstance(TableColumnTraits, {
          name: "Value",
          transformation: createStratumInstance(ColumnTransformationTraits, {
            expression: "x-50"
          })
        })
      ]);

      await csvItem.loadMapItems();

      const activeStyle = csvItem.activeTableStyle;
      const colorColumn = activeStyle.colorColumn;
      expect(colorColumn).toBeDefined();
      expect(colorColumn!.type).toBe(4);
      expect(colorColumn!.values.length).toBe(450);

      expect(activeStyle.colorMap instanceof ContinuousColorMap).toBeTruthy();
      expect(activeStyle.tableColorMap.isDiverging).toBeTruthy();
      expect((activeStyle.colorMap as ContinuousColorMap).minValue).toBe(-50);
      expect((activeStyle.colorMap as ContinuousColorMap).maxValue).toBe(50);
      expect(
        (activeStyle.colorMap as ContinuousColorMap)
          .mapValueToColor(0)
          .toCssColorString()
      ).toBe("rgb(243,238,234)");
      expect(
        (activeStyle.colorMap as ContinuousColorMap)
          .mapValueToColor(-50)
          .toCssColorString()
      ).toBe("rgb(45,0,75)");
      expect(
        (activeStyle.colorMap as ContinuousColorMap)
          .mapValueToColor(50)
          .toCssColorString()
      ).toBe("rgb(127,59,8)");
    });
  });

  describe(" - Enum", function() {
    let csvItem: CsvCatalogItem;

    beforeEach(async function() {
      csvItem = new CsvCatalogItem("SmallCsv", terria, undefined);
    });

    it(" - uses EnumColorMap by default", async function() {
      csvItem.setTrait("definition", "csvString", LatLonCsv);

      csvItem.setTrait("definition", "activeStyle", "enum");
      await csvItem.loadMapItems();

      const activeStyle = csvItem.activeTableStyle;
      const colorColumn = activeStyle.colorColumn;
      expect(colorColumn).toBeDefined();
      expect(colorColumn!.type).toBe(5);
      expect(colorColumn!.uniqueValues.values.length).toBe(6);

      expect(activeStyle.colorMap instanceof EnumColorMap).toBeTruthy();
      expect((activeStyle.colorMap as EnumColorMap).colors.length).toBe(6);
      expect(
        (activeStyle.colorMap as EnumColorMap).colors.map(c =>
          c.toCssHexString()
        )
      ).toEqual([
        "#f2f3f4",
        "#ffb300",
        "#803e75",
        "#ff6800",
        "#a6bdd7",
        "#c10020"
      ]);
    });

    it(" - uses EnumColorMap with specified colorPalette", async function() {
      csvItem.setTrait("definition", "csvString", LatLonCsv);

      csvItem.setTrait(
        "definition",
        "defaultStyle",
        createStratumInstance(TableStyleTraits, {
          color: createStratumInstance(TableColorStyleTraits, {
            colorPalette: "Category10"
          })
        })
      );

      csvItem.setTrait("definition", "activeStyle", "enum");
      await csvItem.loadMapItems();

      const activeStyle = csvItem.activeTableStyle;
      const colorColumn = activeStyle.colorColumn;
      expect(colorColumn).toBeDefined();
      expect(colorColumn!.type).toBe(5);
      expect(colorColumn!.uniqueValues.values.length).toBe(6);

      expect(activeStyle.colorMap instanceof EnumColorMap).toBeTruthy();
      expect((activeStyle.colorMap as EnumColorMap).colors.length).toBe(6);
      expect(
        (activeStyle.colorMap as EnumColorMap).colors.map(c =>
          c.toCssHexString()
        )
      ).toEqual([
        "#1f77b4",
        "#ff7f0e",
        "#2ca02c",
        "#d62728",
        "#9467bd",
        "#8c564b"
      ]);
    });
  });
});
