const findAllWithType = require("react-shallow-testutils").findAllWithType;
import React from "react";

import Terria from "../../lib/Models/Terria";
import CsvCatalogItem from "../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";

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

    it(" - Gets default bin length when many values", async function() {
      csvItem.setTrait(
        "definition",
        "url",
        "/test/csv/SED_2018_SED_CODE18.csv"
      );
      await csvItem.loadMapItems();

      const activeStyle = csvItem.activeTableStyle;
      const colorColumn = activeStyle.colorColumn;
      expect(colorColumn).toBeDefined();
      if (colorColumn !== undefined) {
        expect(colorColumn.type).toBe(4);
        expect(colorColumn.values.length).toBe(450);
      }

      // Expect 7 as per Traits/TableStyleColorTraits.ts
      expect(activeStyle.numberOfBins).toEqual(7);
      expect(activeStyle.binColors.length).toEqual(7);
      expect(activeStyle.binMaximums.length).toEqual(7);
    });

    it(" - Gets fewer bins when fewer values than default bin length", async function() {
      csvItem.setTrait("definition", "url", "/test/csv/lat_lon_val.csv");
      await csvItem.loadMapItems();

      const activeStyle = csvItem.activeTableStyle;
      const colorColumn = activeStyle.colorColumn;
      expect(colorColumn).toBeDefined();
      if (colorColumn !== undefined) {
        expect(colorColumn.type).toBe(4);
        const numUniqueValues = colorColumn.uniqueValues.values.length;
        expect(numUniqueValues).toBe(4);
        expect(activeStyle.numberOfBins).toEqual(numUniqueValues);
        expect(activeStyle.binColors.length).toEqual(numUniqueValues);
        expect(activeStyle.binMaximums.length).toEqual(numUniqueValues);
      }
    });
  });
});
