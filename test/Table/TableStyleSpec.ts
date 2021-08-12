import CsvCatalogItem from "../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import Terria from "../../lib/Models/Terria";
import createStratumInstance from "../../lib/Models/Definition/createStratumInstance";
import DiscreteColorMap from "../../lib/Map/DiscreteColorMap";
import ContinuousColorMap from "../../lib/Map/ContinuousColorMap";
import EnumColorMap from "../../lib/Map/EnumColorMap";
import TableStyleTraits from "../../lib/Traits/TraitsClasses/TableStyleTraits";
import TableColorStyleTraits from "../../lib/Traits/TraitsClasses/TableColorStyleTraits";

describe("Table Style", function() {
  let terria: Terria;

  beforeEach(async function() {
    terria = new Terria({
      baseUrl: "./"
    });
    terria.configParameters.regionMappingDefinitionsUrl =
      "data/regionMapping.json";
  });

  describe(" - Scalar", function() {
    let csvItem: CsvCatalogItem;

    beforeEach(async function() {
      csvItem = new CsvCatalogItem("SmallCsv", terria, undefined);
    });

    it(" - uses DiscreteColorMap if set numberOfBins", async function() {
      csvItem.setTrait(
        "definition",
        "url",
        "/test/csv/SED_2018_SED_CODE18.csv"
      );
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
      csvItem.setTrait(
        "definition",
        "url",
        "/test/csv/youth-unemployment-rate-2018.csv"
      );
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
      csvItem.setTrait(
        "definition",
        "url",
        "/test/csv/SED_2018_SED_CODE18.csv"
      );
      await csvItem.loadMapItems();

      const activeStyle = csvItem.activeTableStyle;
      const colorColumn = activeStyle.colorColumn;
      expect(colorColumn).toBeDefined();
      expect(colorColumn!.type).toBe(4);
      expect(colorColumn!.values.length).toBe(450);

      expect(activeStyle.colorMap instanceof ContinuousColorMap).toBeTruthy();
    });
  });

  describe(" - Enum", function() {
    let csvItem: CsvCatalogItem;

    beforeEach(async function() {
      csvItem = new CsvCatalogItem("SmallCsv", terria, undefined);
    });

    it(" - uses EnumColorMap by default", async function() {
      csvItem.setTrait(
        "definition",
        "url",
        "/test/csv/lat_lon_enum_date_id.csv"
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
        "#f2f3f4",
        "#ffb300",
        "#803e75",
        "#ff6800",
        "#a6bdd7",
        "#c10020"
      ]);
    });

    it(" - uses EnumColorMap with specified colorPalette", async function() {
      csvItem.setTrait(
        "definition",
        "url",
        "/test/csv/lat_lon_enum_date_id.csv"
      );

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
