import ContinuousColorMap from "../../lib/Map/ColorMap/ContinuousColorMap";
import DiscreteColorMap from "../../lib/Map/ColorMap/DiscreteColorMap";
import EnumColorMap from "../../lib/Map/ColorMap/EnumColorMap";
import CsvCatalogItem from "../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import createStratumInstance from "../../lib/Models/Definition/createStratumInstance";
import updateModelFromJson from "../../lib/Models/Definition/updateModelFromJson";
import Terria from "../../lib/Models/Terria";
import LegendTraits, {
  LegendItemTraits
} from "../../lib/Traits/TraitsClasses/LegendTraits";
import TableColorStyleTraits from "../../lib/Traits/TraitsClasses/Table/ColorStyleTraits";
import TableColumnTraits, {
  ColumnTransformationTraits
} from "../../lib/Traits/TraitsClasses/Table/ColumnTraits";
import TableStyleTraits from "../../lib/Traits/TraitsClasses/Table/StyleTraits";

const regionMapping = JSON.stringify(
  require("../../wwwroot/data/regionMapping.json")
);

const SedCods = JSON.stringify(
  require("../../wwwroot/data/regionids/region_map-SED_CODE18_SED_2018.json")
);
const Sa4Codes = JSON.stringify(
  require("../../wwwroot/data/regionids/region_map-SA4_2016_AUST_SA4_CODE16.json")
);
const Sa4Names = JSON.stringify(
  require("../../wwwroot/data/regionids/region_map-SA4_2016_AUST_SA4_NAME16.json")
);

const LatLonCsv = require("raw-loader!../../wwwroot/test/csv/lat_lon_enum_date_id.csv");
const SedCsv = require("raw-loader!../../wwwroot/test/csv/SED_2018_SED_CODE18.csv");
const YouthUnEmployCsv = require("raw-loader!../../wwwroot/test/csv/youth-unemployment-rate-2018.csv");

describe("TableStyle", function () {
  let terria: Terria;

  beforeEach(async function () {
    terria = new Terria({
      baseUrl: "./"
    });
    terria.configParameters.regionMappingDefinitionsUrl =
      "build/TerriaJS/data/regionMapping.json";

    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(/.*/).andError({
      statusText: "Unexpected request, not stubbed"
    });

    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionMapping.json"
    ).andReturn({ responseText: regionMapping });

    jasmine.Ajax.stubRequest(
      "https://tiles.terria.io/region-mapping/regionids/region_map-SED_CODE18_SED_2018.json"
    ).andReturn({ responseText: SedCods });

    jasmine.Ajax.stubRequest(
      "https://tiles.terria.io/region-mapping/regionids/region_map-SA4_2016_AUST_SA4_CODE16.json"
    ).andReturn({ responseText: Sa4Codes });

    jasmine.Ajax.stubRequest(
      "https://tiles.terria.io/region-mapping/regionids/region_map-SA4_2016_AUST_SA4_NAME16.json"
    ).andReturn({ responseText: Sa4Names });
  });

  afterEach(() => {
    jasmine.Ajax.uninstall();
  });

  describe(" - Scalar", function () {
    let csvItem: CsvCatalogItem;

    beforeEach(async function () {
      csvItem = new CsvCatalogItem("SmallCsv", terria, undefined);
    });

    it(" - uses DiscreteColorMap if set numberOfBins", async function () {
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
        (activeStyle.colorMap as DiscreteColorMap).colors.map((c) =>
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

    it(" - uses DiscreteColorMap if set binMaximums", async function () {
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
        (activeStyle.colorMap as DiscreteColorMap).colors.map((c) =>
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

      const colMap = activeStyle.colorMap as DiscreteColorMap;

      expect(colMap.mapValueToColor(0).toCssHexString()).toBe(
        "#c51b7d",
        "0 - which should be first bin (-Infinity, 8]"
      );

      expect(colMap.mapValueToColor(7.9999).toCssHexString()).toBe(
        "#c51b7d",
        "7.9999 - which should be first bin (-Infinity, 8]"
      );

      expect(colMap.mapValueToColor(8).toCssHexString()).toBe(
        "#c51b7d",
        "8 - which should be first bin (-Infinity, 8]"
      );

      expect(colMap.mapValueToColor(8.0001).toCssHexString()).toBe(
        "#e9a3c9",
        "8.0001 - which should be second bin (8,10]"
      );

      expect(colMap.mapValueToColor(9.9999).toCssHexString()).toBe(
        "#e9a3c9",
        "9.9999 - which should be second bin (8,10]"
      );

      expect(colMap.mapValueToColor(10).toCssHexString()).toBe(
        "#e9a3c9",
        "10 - which should be second bin (8,10]"
      );

      expect(colMap.mapValueToColor(10.0001).toCssHexString()).toBe(
        "#fde0ef",
        "10.0001 - which should be third bin (10,15]"
      );

      expect(colMap.mapValueToColor(14.9999).toCssHexString()).toBe(
        "#fde0ef",
        "14.9999 - which should be third bin (10,15]"
      );

      expect(colMap.mapValueToColor(15).toCssHexString()).toBe(
        "#fde0ef",
        "15 - which should be third bin (10,15]"
      );

      expect(colMap.mapValueToColor(15.0001).toCssHexString()).toBe(
        "#e6f5d0",
        "15.0001 - which should be fourth bin (15,20]"
      );

      expect(colMap.mapValueToColor(19.9999).toCssHexString()).toBe(
        "#e6f5d0",
        "19.9999 - which should be fourth bin (15,20]"
      );

      expect(colMap.mapValueToColor(20).toCssHexString()).toBe(
        "#e6f5d0",
        "20 - which should be fourth bin (15,20]"
      );

      expect(colMap.mapValueToColor(20.0001).toCssHexString()).toBe(
        "#a1d76a",
        "20.0001 - which should be fifth bin (20,30]"
      );

      expect(colMap.mapValueToColor(29.9999).toCssHexString()).toBe(
        "#a1d76a",
        "29.9999 - which should be fifth bin (20,30]"
      );

      expect(colMap.mapValueToColor(30).toCssHexString()).toBe(
        "#a1d76a",
        "30 - which should be fifth bin (20,30]"
      );

      expect(colMap.mapValueToColor(30.0001).toCssHexString()).toBe(
        "#4d9221",
        "30.0001 - which should be sixth bin (30,Infinity)"
      );

      expect(colMap.mapValueToColor(60).toCssHexString()).toBe(
        "#4d9221",
        "60 - which should be last bin (30,Infinity)"
      );

      // Uncomment when outlierColor support is added to DiscreteColorMap

      // runInAction(() =>
      //   activeStyle.colorTraits.setTrait(
      //     CommonStrata.user,
      //     "outlierColor",
      //     "#ff0000"
      //   )
      // );
      //
      // expect(colMap.mapValueToColor(60).toCssHexString()).toBe(
      //   "#ff0000",
      //   "60 - which should be last bin (as outlierColor is undefined)"
      // );
    });

    it(" - uses ContinuousColorMap by default", async function () {
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

    it(" - uses ContinuousColorMap with diverging color scale if appropriate", async function () {
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

    it(" - uses ContinuousColorMap with diverging color map only for diverging color palettes", async function () {
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

      // Set colorpalette to Reds - which is not diverging
      csvItem.setTrait(
        "definition",
        "defaultStyle",
        createStratumInstance(TableStyleTraits, {
          color: createStratumInstance(TableColorStyleTraits, {
            colorPalette: "Reds"
          })
        })
      );

      expect(activeStyle.colorMap instanceof ContinuousColorMap).toBeTruthy();
      expect(activeStyle.tableColorMap.isDiverging).toBeFalsy();

      // Set colorpalette to RdYlBu - which is diverging
      csvItem.setTrait(
        "definition",
        "defaultStyle",
        createStratumInstance(TableStyleTraits, {
          color: createStratumInstance(TableColorStyleTraits, {
            colorPalette: "RdYlBu"
          })
        })
      );

      expect(activeStyle.colorMap instanceof ContinuousColorMap).toBeTruthy();
      expect(activeStyle.tableColorMap.isDiverging).toBeTruthy();
    });

    it(" - handles ContinuousColorMap with single value ", async function () {
      csvItem.setTrait(
        "definition",
        "csvString",
        `SED_CODE18,Value\na,23\nb,23\nc,23\nd,23`
      );

      await csvItem.loadMapItems();

      const activeStyle = csvItem.activeTableStyle;
      const colorColumn = activeStyle.colorColumn;
      expect(colorColumn).toBeDefined();
      expect(colorColumn!.type).toBe(4);
      expect(colorColumn!.values.length).toBe(4);

      expect(activeStyle.colorMap instanceof EnumColorMap).toBeTruthy();
    });

    describe(" - applies zScoreFilter, outlierColor and minimumValue/maximumValue correctly", async function () {
      beforeEach(async function () {
        updateModelFromJson(csvItem, CommonStrata.definition, {
          csvString: SedCsv,
          activeStyle: "Value",
          defaultStyle: {
            color: {
              zScoreFilter: 2,
              rangeFilter: 0.1,
              zScoreFilterEnabled: true
            }
          }
        });

        await csvItem.loadMapItems();
        await csvItem.activeTableStyle.regionColumn?.regionType?.loadRegionIDs();
      });

      it(" - should expect no filter applied", async function () {
        expect(
          csvItem.activeTableStyle.colorColumn?.valuesAsNumbers.minimum
        ).toBe(0);
        expect(
          csvItem.activeTableStyle.colorColumn?.valuesAsNumbers.maximum
        ).toBe(100);

        expect(
          csvItem.activeTableStyle.tableColorMap.zScoreFilterValues
        ).toBeUndefined();

        const colorMap = csvItem.activeTableStyle
          .colorMap as ContinuousColorMap;

        expect(colorMap instanceof ContinuousColorMap).toBeTruthy();
        expect(colorMap.minValue).toBe(0);
        expect(colorMap.maxValue).toBe(100);

        // Check legend for no outlier item
        expect(csvItem.legends.length).toBe(1);
        expect(csvItem.legends[0].items.length).toBe(7);
      });

      it(" - Change zScoreFilter and rangeFilter - should also expect not to be applied", async function () {
        updateModelFromJson(csvItem, CommonStrata.definition, {
          defaultStyle: {
            color: {
              zScoreFilter: 1,
              rangeFilter: 0.25,
              zScoreFilterEnabled: true
            }
          }
        });

        expect(
          csvItem.activeTableStyle.tableColorMap.zScoreFilterValues
        ).toBeUndefined();

        const colorMap = csvItem.activeTableStyle
          .colorMap as ContinuousColorMap;
        expect(colorMap instanceof ContinuousColorMap).toBeTruthy();
        expect(colorMap.minValue).toBe(0);
        expect(colorMap.maxValue).toBe(100);

        // Check legend for no outlier item
        expect(csvItem.legends.length).toBe(1);
        expect(csvItem.legends[0].items.length).toBe(7);
      });

      it(" - Change zScoreFilter and rangeFilter again - should be applied this time", async function () {
        updateModelFromJson(csvItem, CommonStrata.definition, {
          defaultStyle: {
            color: {
              zScoreFilter: 1,
              rangeFilter: 0.1,
              zScoreFilterEnabled: true
            }
          }
        });

        expect(
          csvItem.activeTableStyle.tableColorMap.zScoreFilterValues
        ).toEqual({
          min: 22,
          max: 80
        });

        const colorMap = csvItem.activeTableStyle
          .colorMap as ContinuousColorMap;
        expect(colorMap instanceof ContinuousColorMap).toBeTruthy();
        expect(colorMap.minValue).toBe(22);
        expect(colorMap.maxValue).toBe(80);
        expect(colorMap.mapValueToColor(0)).toEqual(
          csvItem.activeTableStyle.tableColorMap.outlierColor!
        );

        // Check legend for outlier item
        expect(csvItem.legends.length).toBe(1);
        expect(csvItem.legends[0].items.length).toBe(8);
        expect(csvItem.legends[0].items[7].title).toBe(
          "models.tableData.legendZFilterLabel"
        );
        expect(csvItem.legends[0].items[7].addSpacingAbove).toBeTruthy();
        expect(csvItem.legends[0].items[7].color).toBe(
          csvItem.activeTableStyle.tableColorMap.outlierColor?.toCssColorString()
        );
      });

      it(" - Set colorTraits.minimumValue to disable zScoreFilter", async function () {
        updateModelFromJson(csvItem, CommonStrata.definition, {
          defaultStyle: {
            color: {
              zScoreFilter: 1,
              rangeFilter: 0.1,
              zScoreFilterEnabled: true,
              minimumValue: 22
            }
          }
        });

        expect(
          csvItem.activeTableStyle.tableColorMap.outlierColor
        ).toBeUndefined();
        expect(
          csvItem.activeTableStyle.tableColorMap.zScoreFilterValues
        ).toBeUndefined();

        const colorMap = csvItem.activeTableStyle
          .colorMap as ContinuousColorMap;
        expect(colorMap instanceof ContinuousColorMap).toBeTruthy();
        expect(colorMap.minValue).toBe(22);
        expect(colorMap.maxValue).toBe(100);
        expect(colorMap.mapValueToColor(0)).toEqual(
          colorMap.mapValueToColor(22)
        );
      });

      it(" - Set colorTraits.maximumValue to disable zScoreFilter", async function () {
        updateModelFromJson(csvItem, CommonStrata.definition, {
          defaultStyle: {
            color: {
              zScoreFilter: 1,
              rangeFilter: 0.1,
              zScoreFilterEnabled: true,
              maximumValue: 80
            }
          }
        });

        expect(
          csvItem.activeTableStyle.tableColorMap.outlierColor
        ).toBeUndefined();
        expect(
          csvItem.activeTableStyle.tableColorMap.zScoreFilterValues
        ).toBeUndefined();

        const colorMap = csvItem.activeTableStyle
          .colorMap as ContinuousColorMap;
        expect(colorMap instanceof ContinuousColorMap).toBeTruthy();
        expect(colorMap.minValue).toBe(0);
        expect(colorMap.maxValue).toBe(80);
        expect(colorMap.mapValueToColor(100)).toEqual(
          colorMap.mapValueToColor(80)
        );
      });

      it(" - Now if we set min/max outside range, then colorMap.outlierColor should be undefined", async function () {
        updateModelFromJson(csvItem, CommonStrata.definition, {
          defaultStyle: {
            color: {
              zScoreFilter: 1,
              rangeFilter: 0.1,
              zScoreFilterEnabled: true,
              maximumValue: 101,
              minimumValue: -1,
              outlierColor: "#00ff00"
            }
          }
        });

        const colorMap = csvItem.activeTableStyle
          .colorMap as ContinuousColorMap;
        expect(colorMap.minValue).toBe(-1);
        expect(colorMap.maxValue).toBe(101);
        expect(colorMap.outlierColor).toBeUndefined();
      });
    });

    it(" - applied colorTraits on top of TableLegendStratum", async function () {
      csvItem.setTrait("definition", "csvString", SedCsv);

      csvItem.setTrait("definition", "styles", [
        createStratumInstance(TableStyleTraits, {
          id: "Value",
          color: createStratumInstance(TableColorStyleTraits, {
            numberOfBins: 7,
            legend: createStratumInstance(LegendTraits, {
              title: "Some other title",
              items: [
                createStratumInstance(LegendItemTraits, { color: "what" })
              ]
            })
          })
        })
      ]);
      await csvItem.loadMapItems();

      expect(csvItem.legends[0].title).toBe("Some other title");
      expect(csvItem.legends[0].items.length).toBe(1);
      expect(csvItem.legends[0].items[0].color).toBe("what");
    });
  });

  describe(" - Enum", function () {
    let csvItem: CsvCatalogItem;

    beforeEach(async function () {
      csvItem = new CsvCatalogItem("SmallCsv", terria, undefined);
    });

    it(" - uses EnumColorMap by default", async function () {
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
        (activeStyle.colorMap as EnumColorMap).colors.map((c) =>
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

    it(" - uses EnumColorMap with specified colorPalette", async function () {
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
        (activeStyle.colorMap as EnumColorMap).colors.map((c) =>
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
