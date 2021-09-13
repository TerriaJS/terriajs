import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import createStratumInstance from "../../lib/Models/Definition/createStratumInstance";
import CsvCatalogItem from "../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import Terria from "../../lib/Models/Terria";
import TableColumn from "../../lib/Table/TableColumn";
import TableColumnTraits from "../../lib/Traits/TraitsClasses/TableColumnTraits";

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
      await tableModel.loadMapItems();
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
      await tableModel.loadMapItems();
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
      await tableModel.loadMapItems();
      const tableColumn1 = new TableColumn(tableModel, 0);
      expect(
        tableColumn1.valuesAsDates.values.map(d => d && d.toISOString())
      ).toEqual(
        [new Date("2004/06/20"), new Date("1999/03/10")].map(d =>
          d.toISOString()
        )
      );
    });

    it("can convert yyyy-Qx dates", async function() {
      tableModel.setTrait(
        CommonStrata.user,
        "csvString",
        "TIME_PERIOD,OBS_VALUE\n1983-Q2,-0.6\n1983-Q3,-3.2\n1983-Q4,0.9\n1984-Q1,-1.7\n1984-Q2,3.6\n1984-Q3,-1.1\n1984-Q4,3\n1985-Q1,1.1"
      );
      await tableModel.loadMapItems();
      const tableColumn1 = new TableColumn(tableModel, 0);
      expect(
        tableColumn1.valuesAsDates.values.map(d => d && d.toISOString())
      ).toEqual(
        [
          new Date("1983/04/01"),
          new Date("1983/07/01"),
          new Date("1983/10/01"),
          new Date("1984/01/01"),
          new Date("1984/04/01"),
          new Date("1984/07/01"),
          new Date("1984/10/01"),
          new Date("1985/01/01")
        ].map(d => d.toISOString())
      );
    });

    it("attempts to convert all dates using new Date if one date fails parsing with dd/mm/yyyy and mm/dd/yyyy", async function() {
      tableModel.setTrait(
        CommonStrata.user,
        "csvString",
        "date\n06/06/2004\n03/10/1999\nNot a date"
      );
      await tableModel.loadMapItems();
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

  describe("column transformation", function() {
    beforeEach(function() {
      jasmine.Ajax.install();
      jasmine.Ajax.stubRequest(
        "build/TerriaJS/data/regionMapping.json"
      ).andReturn({ responseText: regionMapping });
    });

    afterEach(function() {
      jasmine.Ajax.uninstall();
    });

    it("simple expression", async function() {
      tableModel.setTrait(CommonStrata.user, "csvString", "num\n1\n2\n3\n4\n");
      tableModel.setTrait(CommonStrata.user, "columns", [
        createStratumInstance(TableColumnTraits, {
          name: "num",
          transformation: {
            expression: `x+10`,
            dependencies: []
          }
        })
      ]);
      await tableModel.loadMapItems();
      const tableColumn1 = new TableColumn(tableModel, 0);
      expect(tableColumn1.values).toEqual(["1", "2", "3", "4"]);
      expect(tableColumn1.valuesAsNumbers.values).toEqual([11, 12, 13, 14]);
    });

    it("expression with dependency", async function() {
      tableModel.setTrait(
        CommonStrata.user,
        "csvString",
        "num,num2,num3\n1,11,21\n2,12,22\n3,13,23\n4,14,24\n"
      );
      tableModel.setTrait(CommonStrata.user, "columns", [
        createStratumInstance(TableColumnTraits, {
          name: "num",
          transformation: {
            expression: `x*num2`,
            dependencies: ["num2"]
          }
        })
      ]);
      await tableModel.loadMapItems();
      const tableColumn1 = new TableColumn(tableModel, 0);
      expect(tableColumn1.values).toEqual(["1", "2", "3", "4"]);
      const tableColumn2 = new TableColumn(tableModel, 1);
      expect(tableColumn2.values).toEqual(["11", "12", "13", "14"]);
      expect(tableColumn1.valuesAsNumbers.values).toEqual([
        1 * 11,
        2 * 12,
        3 * 13,
        4 * 14
      ]);
    });

    it("expressions with dependencies (nested)", async function() {
      tableModel.setTrait(
        CommonStrata.user,
        "csvString",
        "num,num2,num3\n1,11,21\n2,12,22\n3,13,23\n4,14,24\n"
      );
      tableModel.setTrait(CommonStrata.user, "columns", [
        createStratumInstance(TableColumnTraits, {
          name: "num",
          transformation: {
            expression: `x*num2`,
            dependencies: ["num2"]
          }
        }),
        createStratumInstance(TableColumnTraits, {
          name: "num2",
          transformation: {
            expression: `x*10`,
            dependencies: [""]
          }
        }),
        createStratumInstance(TableColumnTraits, {
          name: "num3",
          transformation: {
            // Note this would make num3 = x * [num * (num2*10)] * (num2*10)
            expression: `x*num*num2`,
            dependencies: ["num", "num2"]
          }
        })
      ]);
      await tableModel.loadMapItems();
      const tableColumn3 = new TableColumn(tableModel, 2);
      expect(tableColumn3.values).toEqual(["21", "22", "23", "24"]);

      expect(tableColumn3.valuesAsNumbers.values).toEqual([
        1 * 11 * 10 * 11 * 10 * 21,
        2 * 12 * 10 * 12 * 10 * 22,
        3 * 13 * 10 * 13 * 10 * 23,
        4 * 14 * 10 * 14 * 10 * 24
      ]);
    });
  });
});
