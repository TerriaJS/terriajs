import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import createStratumInstance from "../../lib/Models/Definition/createStratumInstance";
import CsvCatalogItem from "../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import Terria from "../../lib/Models/Terria";
import TableColumn from "../../lib/Table/TableColumn";
import TableColumnTraits from "../../lib/Traits/TraitsClasses/Table/ColumnTraits";
import TableColumnType from "../../lib/Table/TableColumnType";

const regionMapping = JSON.stringify(
  require("../../wwwroot/data/regionMapping.json")
);

describe("TableColumn", function () {
  let tableModel: CsvCatalogItem;

  beforeEach(function () {
    tableModel = new CsvCatalogItem("test", new Terria(), undefined);
  });

  describe("title", function () {
    it("prettify titles", async () => {
      tableModel.setTrait(
        "user",
        "csvString",
        "some_title,_someOtherName,LOUDNAME,  Trimmed_NAME \na,b,c"
      );
      await tableModel.loadMapItems();

      expect(tableModel.tableColumns[0].title).toBe("Some Title");
      expect(tableModel.tableColumns[1].title).toBe("Some Other Name");
      expect(tableModel.tableColumns[2].title).toBe("Loudname");
      expect(tableModel.tableColumns[3].title).toBe("Trimmed Name");
    });

    it("correctly resolves the title", function () {
      const x = tableModel.addObject(CommonStrata.user, "columns", "Column0");
      x?.setTrait(CommonStrata.user, "title", "Time");
      const y = tableModel.addObject(CommonStrata.user, "columns", "Column1");
      y?.setTrait(CommonStrata.user, "title", "Speed");
      const tableColumn1 = new TableColumn(tableModel, 0);
      const tableColumn2 = new TableColumn(tableModel, 1);
      expect(tableColumn1.title).toBe("Time");
      expect(tableColumn2.title).toBe("Speed");
    });

    it("can resolve title from the `tableModel.columnTitles` if set", function () {
      tableModel.setTrait(CommonStrata.user, "columnTitles", ["Time", "Speed"]);
      const tableColumn1 = new TableColumn(tableModel, 0);
      const tableColumn2 = new TableColumn(tableModel, 1);
      expect(tableColumn1.title).toBe("Time");
      expect(tableColumn2.title).toBe("Speed");
    });
  });

  describe("type", function () {
    describe("by name", function () {
      it("id - scalar", async () => {
        tableModel.setTrait(CommonStrata.user, "csvString", "id\n1\n2\n3\n4\n");
        await tableModel.loadMapItems();

        expect(tableModel.tableColumns[0].type).toBe(TableColumnType.hidden);

        tableModel.setTrait(CommonStrata.user, "csvString", "ID\n1\n2\n3\n4\n");
        await tableModel.loadMapItems();

        expect(tableModel.tableColumns[0].type).toBe(TableColumnType.hidden);

        tableModel.setTrait(
          CommonStrata.user,
          "csvString",
          "_ID_\n1\n2\n3\n4\n"
        );
        await tableModel.loadMapItems();

        expect(tableModel.tableColumns[0].type).toBe(TableColumnType.hidden);

        tableModel.setTrait(
          CommonStrata.user,
          "csvString",
          "ObjectId\n1\n2\n3\n4\n"
        );
        await tableModel.loadMapItems();

        expect(tableModel.tableColumns[0].type).toBe(TableColumnType.hidden);

        tableModel.setTrait(
          CommonStrata.user,
          "csvString",
          "fid\n1\n2\n3\n4\n"
        );
        await tableModel.loadMapItems();

        expect(tableModel.tableColumns[0].type).toBe(TableColumnType.hidden);
      });

      it("id - enum", async () => {
        tableModel.setTrait(CommonStrata.user, "csvString", "id\na\nb\nc\nd\n");
        await tableModel.loadMapItems();

        expect(tableModel.tableColumns[0].type).toBe(TableColumnType.enum);
      });

      it("id - text", async () => {
        tableModel.setTrait(
          CommonStrata.user,
          "csvString",
          "id\n" +
            [
              "a",
              "b",
              "c",
              "d",
              "e",
              "f",
              "g",
              "h",
              "i",
              "j",
              "k",
              "l",
              "m",
              "n",
              "o",
              "p"
            ].join("\n")
        );
        await tableModel.loadMapItems();

        expect(tableModel.tableColumns[0].type).toBe(TableColumnType.text);
      });

      // Re-enable when we add back TableColumnType.height

      // it("height", async () => {
      //   tableModel.setTrait(
      //     CommonStrata.user,
      //     "csvString",
      //     "height\n1\n2\nb\na\n"
      //   );
      //   await tableModel.loadMapItems();

      //   expect(tableModel.tableColumns[0].type).toBe(TableColumnType.height);
      // });

      // it("height ", async () => {
      //   tableModel.setTrait(
      //     CommonStrata.user,
      //     "csvString",
      //     "altitude,depth,height,elevation,altitude,something else\n1,1,1,1,1,1\n2,2,2,2,2,2\nb,b,b,b,b,b\na,a,a,a,a,a\n"
      //   );
      //   await tableModel.loadMapItems();

      //   expect(tableModel.tableColumns[0].type).toBe(TableColumnType.height);
      //   expect(tableModel.tableColumns[1].type).toBe(TableColumnType.height);
      //   expect(tableModel.tableColumns[2].type).toBe(TableColumnType.height);
      //   expect(tableModel.tableColumns[3].type).toBe(TableColumnType.height);
      //   expect(tableModel.tableColumns[4].type).toBe(TableColumnType.height);
      //   expect(tableModel.tableColumns[5].type).toBe(TableColumnType.enum);
      // });

      it("lat/lon", async () => {
        tableModel.setTrait(
          CommonStrata.user,
          "csvString",
          "lon,long,longitude,lng,lat,latitude,something else\n1,1,1,1,1,1,1\n2,2,2,2,2,2,2\nb,b,b,b,b,b,b\na,a,a,a,a,a,a\n"
        );
        await tableModel.loadMapItems();

        expect(tableModel.tableColumns[0].type).toBe(TableColumnType.longitude);
        expect(tableModel.tableColumns[1].type).toBe(TableColumnType.longitude);
        expect(tableModel.tableColumns[2].type).toBe(TableColumnType.longitude);
        expect(tableModel.tableColumns[3].type).toBe(TableColumnType.longitude);
        expect(tableModel.tableColumns[4].type).toBe(TableColumnType.latitude);

        expect(tableModel.tableColumns[5].type).toBe(TableColumnType.latitude);
        expect(tableModel.tableColumns[6].type).toBe(TableColumnType.enum);
      });

      it("eastings / northings - scalar", async () => {
        tableModel.setTrait(
          CommonStrata.user,
          "csvString",
          "easting\n1\n2\n3\n4\n"
        );
        await tableModel.loadMapItems();

        expect(tableModel.tableColumns[0].type).toBe(TableColumnType.hidden);

        tableModel.setTrait(
          CommonStrata.user,
          "csvString",
          "eastings\n1\n2\n3\n4\n"
        );
        await tableModel.loadMapItems();

        expect(tableModel.tableColumns[0].type).toBe(TableColumnType.hidden);

        tableModel.setTrait(
          CommonStrata.user,
          "csvString",
          "northing\n1\n2\n3\n4\n"
        );
        await tableModel.loadMapItems();

        expect(tableModel.tableColumns[0].type).toBe(TableColumnType.hidden);

        tableModel.setTrait(
          CommonStrata.user,
          "csvString",
          "northings\n1\n2\n3\n4\n"
        );
        await tableModel.loadMapItems();

        expect(tableModel.tableColumns[0].type).toBe(TableColumnType.hidden);
      });

      it("eastings / northings - enum", async () => {
        tableModel.setTrait(
          CommonStrata.user,
          "csvString",
          "easting\n1\n2\na\nb\n"
        );
        await tableModel.loadMapItems();

        expect(tableModel.tableColumns[0].type).toBe(TableColumnType.enum);

        tableModel.setTrait(
          CommonStrata.user,
          "csvString",
          "eastings\n1\n2\na\nb\n"
        );
        await tableModel.loadMapItems();

        expect(tableModel.tableColumns[0].type).toBe(TableColumnType.enum);

        tableModel.setTrait(
          CommonStrata.user,
          "csvString",
          "northing\n1\n2\na\nb\n"
        );
        await tableModel.loadMapItems();

        expect(tableModel.tableColumns[0].type).toBe(TableColumnType.enum);

        tableModel.setTrait(
          CommonStrata.user,
          "csvString",
          "northings\n1\n2\na\nb\n"
        );
        await tableModel.loadMapItems();

        expect(tableModel.tableColumns[0].type).toBe(TableColumnType.enum);
      });

      it("date", async () => {
        tableModel.setTrait(
          CommonStrata.user,
          "csvString",
          "Start date (AEST),date,some other date,time?,year,not a year\n1,1,1,1,1,1\n2,2,2,2,2,2\nb,b,b,b,b,b\na,a,a,a,a,a\n"
        );
        await tableModel.loadMapItems();

        expect(tableModel.tableColumns[0].type).toBe(TableColumnType.time);
        expect(tableModel.tableColumns[1].type).toBe(TableColumnType.time);
        expect(tableModel.tableColumns[2].type).toBe(TableColumnType.time);
        expect(tableModel.tableColumns[3].type).toBe(TableColumnType.time);
        expect(tableModel.tableColumns[4].type).toBe(TableColumnType.time);
        expect(tableModel.tableColumns[5].type).toBe(TableColumnType.enum);
      });

      it("address", async () => {
        tableModel.setTrait(
          CommonStrata.user,
          "csvString",
          "address,addr,some other date,time?,year,not an address\n1,1,1,1,1,1\n2,2,2,2,2,2\nb,b,b,b,b,b\na,a,a,a,a,a\n"
        );
        await tableModel.loadMapItems();

        expect(tableModel.tableColumns[0].type).toBe(TableColumnType.address);
        expect(tableModel.tableColumns[1].type).toBe(TableColumnType.address);
        expect(tableModel.tableColumns[5].type).toBe(TableColumnType.enum);
      });
    });

    describe("by values", function () {
      it("scalar", async () => {
        /** For scalar we need
         * - At least one number
         * - 10% valid numbers
         */

        tableModel.setTrait(
          CommonStrata.user,
          "csvString",
          "num1,num2,num3,num4,num5,num6,num7,num8,num9\n1,1,1,1,1,1,1,1,1\n2,2,2,2,2,2,2,,1\n3,3,3,3,3,3,\n4,4,4,4,4,4,\n5,5,5,5,5,5,\n6,6,6,6,6,d,\n7,7,7,7,7,d,\n8,8,8,8,8,d,\n9,9,9,9,9,d,\n10,10,10,10,d,d,\n11,11,11,d,d,d,\n"
        );
        await tableModel.loadMapItems();

        expect(tableModel.tableColumns[0].type).toBe(TableColumnType.scalar); // all valid
        expect(tableModel.tableColumns[1].type).toBe(TableColumnType.scalar); // all valid
        expect(tableModel.tableColumns[2].type).toBe(TableColumnType.scalar); // all valid
        expect(tableModel.tableColumns[3].type).toBe(TableColumnType.scalar); // 10 numbers 1 letter
        expect(tableModel.tableColumns[4].type).toBe(TableColumnType.text); // 9 numbers 2 letters (+ over enum thresholds)
        expect(tableModel.tableColumns[5].type).toBe(TableColumnType.enum); // 5 numbers 11 letters
        expect(tableModel.tableColumns[6].type).toBe(TableColumnType.scalar); // 2 numbers
        expect(tableModel.tableColumns[7].type).toBe(TableColumnType.enum); // 1 number and empty values
        expect(tableModel.tableColumns[8].type).toBe(TableColumnType.scalar); // 2 duplicate numbers
      });

      it("enum", async () => {
        /** For enum we need
         *  - We need more than 1 unique value (including nulls) AND one of the following:
         *    - Only 7 unique values OR
         *    - The number of unique values is less than 12% of total number of values (each value in the column exists 8.33 times on average)
         */

        tableModel.setTrait(
          CommonStrata.user,
          "csvString",
          "7 unique values,11 unique values,15 unique values\na,a,a\na,a,a\na,b,b\nb,b,b\nb,c,c\nb,c,c\nc,d,d\nc,d,d\nc,e,e\nd,e,e\nd,f,f\nd,f,f\ne,g,g\ne,g,g\ne,h,h\nf,h,h\nf,i,i\nf,i,i\ng,j,j\ng,j,j\ng,k,k\na,a,a\na,a,a\na,b,b\nb,b,b\nb,c,c\nb,c,c\nc,d,d\nc,d,d\nc,e,e\nd,e,e\nd,f,f\nd,f,f\ne,g,g\ne,g,g\ne,h,h\nf,h,h\nf,i,i\nf,i,i\ng,j,j\ng,j,j\ng,k,k\na,a,l\na,a,m\na,b,n\nb,b,o\nb,c,f\nb,c,g\nc,d,g\nc,d,h\nc,e,h\nd,e,i\nd,f,i\nd,f,j\ne,g,j\ne,g,k\ne,h,l\nf,h,m\nf,i,n\nf,i,o\ng,j,f\ng,j,g\ng,k,g\na,a,h\na,a,h\na,b,i\nb,b,i\nb,c,j\nb,c,j\nc,d,k\nc,d,l\nc,e,m\nd,e,n\nd,f,o\nd,f,p\ne,g,g\ne,g,g\ne,h,h\nf,h,h\nf,i,i\nf,i,i\ng,j,j\ng,j,j\ng,k,k\na,a,l\na,a,m\na,b,n\nb,b,o\nb,c,f\nb,c,g\nc,d,g\nc,d,h\nc,e,h\nd,e,i\nd,f,i\nd,f,j\ne,g,j\ne,g,k\ne,h,l\nf,h,m\nf,i,n\nf,i,o\ng,j,f\ng,j,g\ng,k,g\na,a,h\na,a,h\na,b,i\nb,b,i\nb,c,j\nb,c,j\nc,d,k\nc,d,l\nc,e,m\nd,e,n\nd,f,o\nd,f,f\ne,g,g\ne,g,g\ne,h,h\nf,h,h\nf,i,i\nf,i,i\ng,j,j\ng,j,j\ng,k,k"
        );
        await tableModel.loadMapItems();

        expect(tableModel.tableColumns[0].type).toBe(TableColumnType.enum); // 7 unique values
        expect(tableModel.tableColumns[1].type).toBe(TableColumnType.enum); // 11 unique values (< 12% number of 126 rows = 15.12)
        expect(tableModel.tableColumns[2].type).toBe(TableColumnType.text); // 16 unique values  (> 12% number of 126 rows = 15.12)
      });
    });
  });

  describe("units", function () {
    it("correctly resolves the units", function () {
      const x = tableModel.addObject(CommonStrata.user, "columns", "Column0");
      x?.setTrait(CommonStrata.user, "units", "ms");
      const y = tableModel.addObject(CommonStrata.user, "columns", "Column1");
      y?.setTrait(CommonStrata.user, "units", "kmph");
      const tableColumn1 = new TableColumn(tableModel, 0);
      const tableColumn2 = new TableColumn(tableModel, 1);
      expect(tableColumn1.units).toBe("ms");
      expect(tableColumn2.units).toBe("kmph");
    });

    it("can resolve unit from the `tableModel.columnUnits` if set", function () {
      tableModel.setTrait(CommonStrata.user, "columnUnits", ["ms", "kmph"]);
      const tableColumn1 = new TableColumn(tableModel, 0);
      const tableColumn2 = new TableColumn(tableModel, 1);
      expect(tableColumn1.units).toBe("ms");
      expect(tableColumn2.units).toBe("kmph");
    });
  });

  describe("valuesAsDates", function () {
    beforeEach(function () {
      jasmine.Ajax.install();
      jasmine.Ajax.stubRequest(
        "build/TerriaJS/data/regionMapping.json"
      ).andReturn({ responseText: regionMapping });
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it("defaults to dd/mm/yyyy dates", async function () {
      tableModel.setTrait(
        CommonStrata.user,
        "csvString",
        "date\n01/03/2004\n12/12/1999\n"
      );
      await tableModel.loadMapItems();
      const tableColumn1 = new TableColumn(tableModel, 0);
      expect(
        tableColumn1.valuesAsDates.values.map((d) => d && d.toISOString())
      ).toEqual(
        [new Date("2004/03/01"), new Date("1999/12/12")].map((d) =>
          d.toISOString()
        )
      );
    });

    it("can convert d-m-yy dates", async function () {
      tableModel.setTrait(
        CommonStrata.user,
        "csvString",
        "date\n15-7-95\n3-7-20\n"
      );
      await tableModel.loadMapItems();
      const tableColumn1 = new TableColumn(tableModel, 0);
      expect(
        tableColumn1.valuesAsDates.values.map((d) => d && d.toISOString())
      ).toEqual(
        [new Date("1995/07/15"), new Date("2020/07/03")].map((d) =>
          d.toISOString()
        )
      );
    });

    it("converts all dates to mm/dd/yyyy in a column if one doesn't fit dd/mm/yyyy", async function () {
      tableModel.setTrait(
        CommonStrata.user,
        "csvString",
        "date\n06/20/2004\n03/10/1999\n"
      );
      await tableModel.loadMapItems();
      const tableColumn1 = new TableColumn(tableModel, 0);
      expect(
        tableColumn1.valuesAsDates.values.map((d) => d && d.toISOString())
      ).toEqual(
        [new Date("2004/06/20"), new Date("1999/03/10")].map((d) =>
          d.toISOString()
        )
      );
    });

    it("can convert yyyy-Qx dates", async function () {
      tableModel.setTrait(
        CommonStrata.user,
        "csvString",
        "TIME_PERIOD,OBS_VALUE\n1983-Q2,-0.6\n1983-Q3,-3.2\n1983-Q4,0.9\n1984-Q1,-1.7\n1984-Q2,3.6\n1984-Q3,-1.1\n1984-Q4,3\n1985-Q1,1.1"
      );
      await tableModel.loadMapItems();
      const tableColumn1 = new TableColumn(tableModel, 0);
      expect(
        tableColumn1.valuesAsDates.values.map((d) => d && d.toISOString())
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
        ].map((d) => d.toISOString())
      );
    });

    it("attempts to convert all dates using new Date if one date fails parsing with dd/mm/yyyy and mm/dd/yyyy", async function () {
      tableModel.setTrait(
        CommonStrata.user,
        "csvString",
        "date\n06/06/2004\n03/10/1999\nNot a date"
      );
      await tableModel.loadMapItems();
      const tableColumn1 = new TableColumn(tableModel, 0);
      expect(
        tableColumn1.valuesAsDates.values.map((d) => d && d.toISOString())
      ).toEqual([
        ...[new Date("2004/06/06"), new Date("1999/03/10")].map((d) =>
          d.toISOString()
        ),
        null
      ]);
    });
  });

  describe("column transformation", function () {
    beforeEach(function () {
      jasmine.Ajax.install();
      jasmine.Ajax.stubRequest(
        "build/TerriaJS/data/regionMapping.json"
      ).andReturn({ responseText: regionMapping });
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it("simple expression", async function () {
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

    it("expression with dependency", async function () {
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

    it("expressions with dependencies (nested)", async function () {
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
