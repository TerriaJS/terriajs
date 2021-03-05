import CommonStrata from "../../lib/Models/CommonStrata";
import createStratumInstance from "../../lib/Models/createStratumInstance";
import CsvCatalogItem from "../../lib/Models/CsvCatalogItem";
import Terria from "../../lib/Models/Terria";
import TableColumn from "../../lib/Table/TableColumn";
import TableColumnTraits from "../../lib/Traits/TableColumnTraits";

const regionMapping = JSON.stringify(
  require("../../wwwroot/data/regionMapping.json")
);

describe("TableColumn", function() {
  let tableModel: CsvCatalogItem;

  beforeEach(function() {
    tableModel = new CsvCatalogItem("test", new Terria(), undefined);
  });

  describe("title", function() {
    it("correctly resolves the title", function() {
      const x = tableModel.addObject(CommonStrata.user, "columns", "Column0");
      x?.setTrait(CommonStrata.user, "title", "Time");
      const y = tableModel.addObject(CommonStrata.user, "columns", "Column1");
      y?.setTrait(CommonStrata.user, "title", "Speed");
      const tableColumn1 = new TableColumn(tableModel, 0);
      const tableColumn2 = new TableColumn(tableModel, 1);
      expect(tableColumn1.title).toBe("Time");
      expect(tableColumn2.title).toBe("Speed");
    });

    it("can resolve title from the `tableModel.columnTitles` if set", function() {
      tableModel.setTrait(CommonStrata.user, "columnTitles", ["Time", "Speed"]);
      const tableColumn1 = new TableColumn(tableModel, 0);
      const tableColumn2 = new TableColumn(tableModel, 1);
      expect(tableColumn1.title).toBe("Time");
      expect(tableColumn2.title).toBe("Speed");
    });
  });

  describe("units", function() {
    it("correctly resolves the units", function() {
      const x = tableModel.addObject(CommonStrata.user, "columns", "Column0");
      x?.setTrait(CommonStrata.user, "units", "ms");
      const y = tableModel.addObject(CommonStrata.user, "columns", "Column1");
      y?.setTrait(CommonStrata.user, "units", "kmph");
      const tableColumn1 = new TableColumn(tableModel, 0);
      const tableColumn2 = new TableColumn(tableModel, 1);
      expect(tableColumn1.units).toBe("ms");
      expect(tableColumn2.units).toBe("kmph");
    });

    it("can resolve unit from the `tableModel.columnUnits` if set", function() {
      tableModel.setTrait(CommonStrata.user, "columnUnits", ["ms", "kmph"]);
      const tableColumn1 = new TableColumn(tableModel, 0);
      const tableColumn2 = new TableColumn(tableModel, 1);
      expect(tableColumn1.units).toBe("ms");
      expect(tableColumn2.units).toBe("kmph");
    });
  });

  describe("valuesAsDates", function() {
    beforeEach(function() {
      jasmine.Ajax.install();
      jasmine.Ajax.stubRequest(
        "build/TerriaJS/data/regionMapping.json"
      ).andReturn({ responseText: regionMapping });
    });

    afterEach(function() {
      jasmine.Ajax.uninstall();
    });

    it("defaults to dd/mm/yyyy dates", async function() {
      tableModel.setTrait(
        CommonStrata.user,
        "csvString",
        "date\n01/03/2004\n12/12/1999\n"
      );
      await tableModel.loadChartItems();
      const tableColumn1 = new TableColumn(tableModel, 0);
      expect(
        tableColumn1.valuesAsDates.values.map(d => d && d.toISOString())
      ).toEqual(
        [new Date("2004/03/01"), new Date("1999/12/12")].map(d =>
          d.toISOString()
        )
      );
    });

    it("can convert d-m-yy dates", async function() {
      tableModel.setTrait(
        CommonStrata.user,
        "csvString",
        "date\n15-7-95\n3-7-20\n"
      );
      await tableModel.loadChartItems();
      const tableColumn1 = new TableColumn(tableModel, 0);
      expect(
        tableColumn1.valuesAsDates.values.map(d => d && d.toISOString())
      ).toEqual(
        [new Date("1995/07/15"), new Date("2020/07/03")].map(d =>
          d.toISOString()
        )
      );
    });

    it("converts all dates to mm/dd/yyyy in a column if one doesn't fit dd/mm/yyyy", async function() {
      tableModel.setTrait(
        CommonStrata.user,
        "csvString",
        "date\n06/20/2004\n03/10/1999\n"
      );
      await tableModel.loadChartItems();
      const tableColumn1 = new TableColumn(tableModel, 0);
      expect(
        tableColumn1.valuesAsDates.values.map(d => d && d.toISOString())
      ).toEqual(
        [new Date("2004/06/20"), new Date("1999/03/10")].map(d =>
          d.toISOString()
        )
      );
    });

    it("attempts to convert all dates using new Date if one date fails parsing with dd/mm/yyyy and mm/dd/yyyy", async function() {
      tableModel.setTrait(
        CommonStrata.user,
        "csvString",
        "date\n06/06/2004\n03/10/1999\nNot a date"
      );
      await tableModel.loadChartItems();
      const tableColumn1 = new TableColumn(tableModel, 0);
      expect(
        tableColumn1.valuesAsDates.values.map(d => d && d.toISOString())
      ).toEqual([
        ...[new Date("2004/06/06"), new Date("1999/03/10")].map(d =>
          d.toISOString()
        ),
        null
      ]);
    });
  });
});
