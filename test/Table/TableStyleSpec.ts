const findAllWithType = require("react-shallow-testutils").findAllWithType;
import CsvCatalogItem from "../../lib/Models/CsvCatalogItem";
import Terria from "../../lib/Models/Terria";
import createStratumInstance from "../../lib/Models/createStratumInstance";
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
    });
  });
});
