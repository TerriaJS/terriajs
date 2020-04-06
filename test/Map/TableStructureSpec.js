"use strict";

/*global require,describe,it,expect*/
var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;
var TableStructure = require("../../lib/Map/TableStructure");
var TimeInterval = require("terriajs-cesium/Source/Core/TimeInterval").default;
var VarType = require("../../lib/Map/VarType");

var separator = ",";
var decimalPoint = ".";
if (typeof Intl === "object" && typeof Intl.NumberFormat === "function") {
  separator = Intl.NumberFormat().format(1000)[1];
  decimalPoint = Intl.NumberFormat().format(0.5)[1];
}

describe("TableStructure", function() {
  it("can read from json object", function() {
    // Use a copy of data to make the column, because knockout adds stuff to data.
    // Also, test a "slice" of the column's values, to remove knockout stuff.
    var data = [["x", "y"], [1, 5], [3, 8], [4, -3]];
    var tableStructure = TableStructure.fromJson(data.slice());
    expect(tableStructure.columns.length).toEqual(2);
    expect(tableStructure.columns[0].name).toEqual("x");
    expect(tableStructure.columns[0].values.slice()).toEqual([1, 3, 4]);
    expect(tableStructure.columns[1].name).toEqual("y");
    expect(tableStructure.columns[1].values.slice()).toEqual([5, 8, -3]);
  });

  it("can read from csv string", function() {
    var csvString = "x,y\r\n1,5\r\n3,8\r\n4,-3\r\n";
    var tableStructure = TableStructure.fromCsv(csvString);
    expect(tableStructure.columns.length).toEqual(2);
    expect(tableStructure.columns[0].name).toEqual("x");
    expect(tableStructure.columns[0].values.slice()).toEqual([1, 3, 4]);
    expect(tableStructure.columns[1].name).toEqual("y");
    expect(tableStructure.columns[1].values.slice()).toEqual([5, 8, -3]);
  });

  it("can read from json object into existing structure", function() {
    var data = [["x", "y"], [1, 5], [3, 8], [4, -3]];
    var tableStructure = new TableStructure();
    tableStructure.loadFromJson(data);
    expect(tableStructure.columns.length).toEqual(2);
    expect(tableStructure.columns[0].name).toEqual("x");
    expect(tableStructure.columns[0].values.slice()).toEqual([1, 3, 4]);
    expect(tableStructure.columns[1].name).toEqual("y");
    expect(tableStructure.columns[1].values.slice()).toEqual([5, 8, -3]);
  });

  it("can read from csv string into existing structure", function() {
    var csvString = "x,y\r\n1,5\r\n3,8\r\n4,-3\r\n";
    var tableStructure = new TableStructure();
    tableStructure.loadFromCsv(csvString);
    expect(tableStructure.columns.length).toEqual(2);
    expect(tableStructure.columns[0].name).toEqual("x");
    expect(tableStructure.columns[0].values.slice()).toEqual([1, 3, 4]);
    expect(tableStructure.columns[1].name).toEqual("y");
    expect(tableStructure.columns[1].values.slice()).toEqual([5, 8, -3]);
  });

  it("can convert to ArrayOfColumns", function() {
    var data = [["x", "y"], [1, 5], [3, 8], [4, -3]];
    var tableStructure = TableStructure.fromJson(data);
    var columns = tableStructure.toArrayOfColumns();
    expect(columns.length).toEqual(2);
    expect(columns[0]).toEqual(["x", 1, 3, 4]);
    expect(columns[1]).toEqual(["y", 5, 8, -3]);
  });

  it("can convert to ArrayOfRows", function() {
    var data = [["x", "y"], ["1", "5"], ["3", "8"], ["4", "-3"]];
    var tableStructure = TableStructure.fromJson(data);
    var rows = tableStructure.toArrayOfRows();
    expect(rows.length).toEqual(4);
    expect(rows).toEqual(data);
  });

  it("can convert to ArrayOfRows with formatting", function() {
    var data = [["x", "y"], [1.678, 9.883], [54321, 12345], [4, -3]];
    var options = {
      columnOptions: {
        x: { format: { maximumFractionDigits: 0 } },
        y: {
          name: "new y (,000)",
          format: { useGrouping: true, maximumFractionDigits: 1 }
        }
      }
    };
    var target = [
      ["x", "new y (,000)"],
      ["2", "9.9"],
      ["54321", "12" + separator + "345"],
      ["4", "-3"]
    ];
    var tableStructure = new TableStructure("foo", options);
    tableStructure = tableStructure.loadFromJson(data);
    var rows = tableStructure.toArrayOfRows();
    expect(rows.length).toEqual(4);
    expect(rows).toEqual(target);
  });

  it("can convert to ArrayOfRows with formatting and quotes if containing commas", function() {
    var data = [["x", "y"], [1.678, 9.883], [54321, 12345], [4, -3]];
    var options = {
      columnOptions: {
        x: { format: { maximumFractionDigits: 0 } },
        y: {
          name: "new y (,000)",
          format: { useGrouping: true, maximumFractionDigits: 1 }
        }
      }
    };
    var target = [
      ["x", '"new y (,000)"'],
      ["2", "9.9"],
      ["54321", '"12' + separator + '345"'],
      ["4", "-3"]
    ];
    var tableStructure = new TableStructure("foo", options);
    tableStructure = tableStructure.loadFromJson(data);
    var rows = tableStructure.toArrayOfRows(undefined, undefined, true, true); // 4th argument requests the quotes.
    expect(rows.length).toEqual(4);
    expect(rows).toEqual(target);
  });

  it("can convert to ArrayOfRows with formatting and quotes if containing quotes", function() {
    var data = [["x", "y"], [1.678, 9.883], [54321, 12345], [4, -3]];
    var options = {
      columnOptions: {
        x: { format: { maximumFractionDigits: 0 } },
        y: {
          name: 'new y ("000")',
          format: { useGrouping: true, maximumFractionDigits: 1 }
        }
      }
    };
    var target = [
      ["x", '"new y (""000"")"'],
      ["2", "9.9"],
      ["54321", '"12' + separator + '345"'],
      ["4", "-3"]
    ];
    var tableStructure = new TableStructure("foo", options);
    tableStructure = tableStructure.loadFromJson(data);
    var rows = tableStructure.toArrayOfRows(undefined, undefined, true, true); // 4th argument requests the quotes.
    expect(rows.length).toEqual(4);
    expect(rows).toEqual(target);
  });

  it("can convert to csv", function() {
    var data = [["lat", "y"], [1.678, 9.883], [54321, 12345], [4, -3]];
    var tableStructure = new TableStructure();
    tableStructure = tableStructure.loadFromJson(data);
    var csvString = tableStructure.toCsvString();
    expect(csvString).toEqual("lat,y\n1.678,9.883\n54321,12345\n4,-3");
  });

  it("can create a data URI", function() {
    var data = [["lat", "y"], [1.6, -9.8]];
    var tableStructure = new TableStructure();
    // From json
    tableStructure = tableStructure.loadFromJson(data);
    var uri = tableStructure.toDataUri();
    expect(uri).toEqual("data:attachment/csv,lat%2Cy%0A1.6%2C-9.8");
    // From csv
    var csvString = "lat,y\n1.6,-9.8";
    tableStructure.loadFromCsv(csvString);
    uri = tableStructure.toDataUri();
    expect(uri).toEqual("data:attachment/csv,lat%2Cy%0A1.6%2C-9.8");
  });

  it("can convert to row objects", function() {
    var data = [["lat", "y"], [1, 5.12345], [3, 8], [4, -3]];
    var tableStructure = TableStructure.fromJson(data);
    var rowObjects = tableStructure.toRowObjects();
    expect(rowObjects.length).toEqual(3);
    // Scalar fields are converted to strings using formatNumberForLocale, but not lat/lon.
    // We could convert lat/lons too, if there's a reason to do it.
    expect(rowObjects[0]).toEqual({ lat: 1, y: "5.12345" });
    expect(rowObjects[1]).toEqual({ lat: 3, y: "8" });
    expect(rowObjects[2]).toEqual({ lat: 4, y: "-3" });
  });

  it("can convert to string and number row objects", function() {
    var data = [["x", "y"], [1.678, -9.883], [54321, 12345], [4, -3]];
    var options = {
      columnOptions: {
        x: { format: { maximumFractionDigits: 0 } },
        y: {
          name: "newy",
          format: { useGrouping: true, maximumFractionDigits: 1 }
        }
      }
    };
    var tableStructure = new TableStructure("foo", options);
    tableStructure = tableStructure.loadFromJson(data);
    var rowObjects = tableStructure.toStringAndNumberRowObjects();
    expect(rowObjects.length).toEqual(3);
    expect(rowObjects[0]).toEqual({
      string: { x: "2", newy: "-9" + decimalPoint + "9" },
      number: { x: 1.678, newy: -9.883 }
    });
    expect(rowObjects[1]).toEqual({
      string: { x: "54321", newy: "12" + separator + "345" },
      number: { x: 54321, newy: 12345 }
    });
  });

  it("can convert to point arrays", function() {
    var data = [["a", "b", "c"], [1, 2, 3], [4, 5, 6], [7, 8, 9]];
    var tableStructure = TableStructure.fromJson(data);
    var xy = tableStructure.toPointArrays();
    expect(xy.length).toEqual(2);
    expect(xy[0]).toEqual([{ x: 1, y: 2 }, { x: 4, y: 5 }, { x: 7, y: 8 }]);
    expect(xy[1]).toEqual([{ x: 1, y: 3 }, { x: 4, y: 6 }, { x: 7, y: 9 }]);
  });

  it("can get column names", function() {
    var data = [["lat", "y"], [1, 5], [3, 8], [4, -3]];
    var tableStructure = TableStructure.fromJson(data);
    expect(tableStructure.getColumnNames()).toEqual(["lat", "y"]);
  });

  it("can get column with name", function() {
    var data = [["x", "y"], [1, 5], [3, 8], [4, -3]];
    var tableStructure = TableStructure.fromJson(data);
    expect(tableStructure.getColumnWithName("y")).toEqual(
      tableStructure.columns[1]
    );
    expect(tableStructure.getColumnWithName("z")).toBeUndefined();
  });

  it("sets column types", function() {
    var data = [["x", "lat"], [1, 5], [3, 8], [4, -3]];
    var tableStructure = TableStructure.fromJson(data);
    expect(tableStructure.columnsByType[VarType.SCALAR].length).toEqual(1);
    expect(tableStructure.columnsByType[VarType.SCALAR][0].name).toEqual("x");
    expect(tableStructure.columnsByType[VarType.LAT].length).toEqual(1);
    expect(tableStructure.columnsByType[VarType.LAT][0].name).toEqual("lat");
  });

  it("counts the final row of CSV files with no trailing linefeed(s)", function() {
    var csvString = "postcode,value\n0800,1\n0885,2";
    var tableStructure = new TableStructure();
    tableStructure.loadFromCsv(csvString);
    expect(tableStructure.columns[0].values.length).toEqual(2);
    expect(tableStructure.columns[1].values.length).toEqual(2);

    csvString = csvString + "\n";
    tableStructure = new TableStructure();
    tableStructure.loadFromCsv(csvString);
    expect(tableStructure.columns[0].values.length).toEqual(2);
    expect(tableStructure.columns[1].values.length).toEqual(2);

    // The ABS returns a csv data file for Australia with two final linefeeds.
    csvString = csvString + "\n";
    tableStructure = new TableStructure();
    tableStructure.loadFromCsv(csvString);
    expect(tableStructure.columns[0].values.length).toEqual(2);
    expect(tableStructure.columns[1].values.length).toEqual(2);
  });

  it("ignores final blank rows of CSV files", function() {
    var csvString = "postcode,value\n0800,1,\n0885,2,";
    var tableStructure = new TableStructure();
    tableStructure.loadFromCsv(csvString);
    expect(tableStructure.columns[0].values.length).toEqual(2);
    expect(tableStructure.columns[1].values.length).toEqual(2);

    csvString = csvString + "\n";
    tableStructure = new TableStructure();
    tableStructure.loadFromCsv(csvString);
    expect(tableStructure.columns[0].values.length).toEqual(2);
    expect(tableStructure.columns[1].values.length).toEqual(2);

    csvString = csvString + "\n\n\n\n\n";
    tableStructure = new TableStructure();
    tableStructure.loadFromCsv(csvString);
    expect(tableStructure.columns[0].values.length).toEqual(2);
    expect(tableStructure.columns[1].values.length).toEqual(2);
  });

  it("can read csv string where column names are numbers", function() {
    var csvString = "1,2\n9,8\n7,6";
    var tableStructure = new TableStructure();
    tableStructure.loadFromCsv(csvString);
    expect(tableStructure.columns[0].name).toEqual("1");
    expect(tableStructure.columns[1].name).toEqual("2");
  });

  it("can describe rows with dates with and without timezones nicely", function() {
    var csvString =
      "date,value\r\n2015-10-15T12:34:56,5\r\n2015-10-02T12:34:56Z,8\r\n2015-11-03\r\n";
    var tableStructure = TableStructure.fromCsv(csvString);
    var htmls = tableStructure.toRowDescriptions();
    expect(htmls[0]).toContain("Thu Oct 15 2015 12:34:56"); // Thu 15 Oct would be nicer outside USA.
    expect(htmls[0]).not.toContain("2015-10-15T12:34:56");
    var expectedDate1 = JulianDate.toDate(
      JulianDate.fromIso8601("2015-10-02T12:34:56Z")
    );
    expect(htmls[1]).toContain("" + expectedDate1);
    expect(htmls[1]).not.toContain("2015-10-02T12:34:56");
    expect(htmls[2]).toContain(">2015-11-03<"); // No time is added when only the date is given.
  });

  it("can describe rows with formatting", function() {
    var data = [["x", "y"], [1.678, 5.123], [54321, 12345], [4, -3]];
    var options = {
      columnOptions: {
        y: {
          name: "new y",
          format: { useGrouping: true, maximumFractionDigits: 1 }
        }
      }
    };
    var tableStructure = new TableStructure("foo", options);
    tableStructure = tableStructure.loadFromJson(data);
    var htmls = tableStructure.toRowDescriptions();
    expect(htmls[0]).toContain("new y");
    expect(htmls[0]).toContain("1.678");
    expect(htmls[0]).toContain("5.1");
    expect(htmls[0]).not.toContain("5.12");
    expect(htmls[1]).toContain("54321");
    expect(htmls[1]).toContain("12" + separator + "345");
  });

  it("can tell if it has address data", function() {
    var data = [
      ["x", "y", "Address"],
      [1.678, 5.123, "25 Gozzard Street, GUNGAHLIN TOWN CENTRE, ACT"],
      [54321, 12345, "137 Reed Street, TUGGERANONG, ACT"],
      [4, -3, "81 Mildura Street, FYSHWICK, ACT"]
    ];
    var options = {
      columnOptions: {
        y: {
          name: "new y",
          format: { useGrouping: true, maximumFractionDigits: 1 }
        }
      }
    };
    var tableStructure = new TableStructure("foo", options);
    tableStructure = tableStructure.loadFromJson(data);
    expect(tableStructure.hasAddress).toBe(true);

    var dataNoAddr = [["x", "y"], [1.678, 5.123], [54321, 12345], [4, -3]];
    var optionsNoAddr = {
      columnOptions: {
        y: {
          name: "new y",
          format: { useGrouping: true, maximumFractionDigits: 1 }
        }
      }
    };
    var tableStructureNoAddr = new TableStructure("foo", optionsNoAddr);
    tableStructureNoAddr = tableStructure.loadFromJson(dataNoAddr);
    expect(tableStructureNoAddr.hasAddress).toBe(false);
  });

  it("can get feature id mapping", function() {
    var data = [
      ["year", "id", "lat", "lon"],
      [1970, "A", 16.8, 5.2],
      [1971, "B", 16.2, 5.2],
      [1971, "A", 67.8, 1.2],
      [1972, "B", 68.2, 2.2]
    ];
    var options = { idColumnNames: ["id"] };
    var tableStructure = new TableStructure("foo", options);
    tableStructure = tableStructure.loadFromJson(data);
    var map = tableStructure.getIdMapping();
    expect(map["A"]).toEqual([0, 2]);
    expect(map["B"]).toEqual([1, 3]);
  });

  it("can handle idColumnNames = []", function() {
    var data = [
      ["year", "id", "lat", "lon"],
      [1970, "A", 16.8, 5.2],
      [1971, "B", 16.2, 5.2],
      [1971, "A", 67.8, 1.2],
      [1972, "B", 68.2, 2.2]
    ];
    var options = { idColumnNames: [] };
    var tableStructure = new TableStructure("foo", options);
    tableStructure = tableStructure.loadFromJson(data);
    var map = tableStructure.getIdMapping();
    expect(map).toEqual({});
  });

  it("can append a table", function() {
    var data = [
      ["year", "id", "lat", "lon"],
      [1970, "A", 16.8, 5.2],
      [1971, "B", 16.2, 5.2]
    ];
    var dat2 = [
      ["year", "id", "lat", "lon"],
      [1980, "C", 16.8, 5.2],
      [1981, "D", 16.2, 5.2]
    ];
    var table1 = new TableStructure("foo");
    var table2 = new TableStructure("bar");
    table1 = table1.loadFromJson(data);
    table2 = table2.loadFromJson(dat2);
    table1.append(table2);
    expect(table1.columns[0].values.slice()).toEqual([1970, 1971, 1980, 1981]);
    expect(table1.columns[1].values.slice()).toEqual(["A", "B", "C", "D"]);
  });

  it("can append part of a table", function() {
    var data = [
      ["year", "id", "lat", "lon"],
      [1970, "A", 16.8, 5.2],
      [1971, "B", 16.2, 5.2]
    ];
    var dat2 = [
      ["year", "id", "lat", "lon"],
      [1980, "C", 16.8, 5.2],
      [1981, "D", 16.2, 5.2],
      [1982, "E", 16, 5],
      [1983, "F", 15, 6]
    ];
    var table1 = new TableStructure("foo");
    var table2 = new TableStructure("bar");
    table1 = table1.loadFromJson(data);
    table2 = table2.loadFromJson(dat2);
    table1.append(table2, [1, 3]);
    expect(table1.columns[0].values.slice()).toEqual([1970, 1971, 1981, 1983]);
    expect(table1.columns[1].values.slice()).toEqual(["A", "B", "D", "F"]);
  });

  it("can replace rows", function() {
    var data = [
      ["year", "id", "lat", "lon"],
      [1970, "A", 16.8, 5.2],
      [1971, "B", 16.2, 5.2]
    ];
    var dat2 = [
      ["year", "id", "lat", "lon"],
      [1980, "C", 16.8, 5.2],
      [1981, "D", 16.2, 5.2]
    ];
    var table1 = new TableStructure("foo");
    var table2 = new TableStructure("bar");
    table1 = table1.loadFromJson(data);
    table2 = table2.loadFromJson(dat2);
    table1.replaceRows(table2, { 1: 0 });
    expect(table1.columns[0].values.slice()).toEqual([1970, 1980]);
    expect(table1.columns[1].values.slice()).toEqual(["A", "C"]);
  });

  it("can merge tables with dates", function() {
    var data = [
      ["year", "id", "lat", "lon"],
      [1970, "A", 16.8, 5.2],
      [1971, "B", 16.2, 5.2]
    ];
    var dat2 = [
      ["year", "id", "lat", "lon"],
      [1975, "C", 15, 5.5],
      [1970, "A", 12, 8],
      [1971, "A", 13, 9]
    ];
    var options = { idColumnNames: ["id"] };
    var table1 = new TableStructure("foo", options);
    var table2 = new TableStructure("bar"); // Only uses idColumnNames on table1.
    table1 = table1.loadFromJson(data);
    table2 = table2.loadFromJson(dat2);
    table1.setActiveTimeColumn(0);
    table1.columns[1].isActive = true;
    table1.columns[1].color = "blue";
    table1.merge(table2);
    expect(table1.columns[0].values.slice()).toEqual([1970, 1971, 1975, 1971]);
    expect(table1.activeTimeColumn.dates.length).toEqual(4); // ie. activeTimeColumn updates too.
    expect(table1.columns[1].values.slice()).toEqual(["A", "B", "C", "A"]);
    expect(table1.columns[2].values.slice()).toEqual([12, 16.2, 15, 13]);
    expect(table1.columns[1].isActive).toBe(true); // ie. Don't lose options on the columns.
    expect(table1.columns[1].color).toEqual("blue");
  });

  it("can merge tables without dates", function() {
    var data = [["id", "lat", "lon"], ["A", 16.8, 5.2], ["B", 16.2, 5.2]];
    var dat2 = [["id", "lat", "lon"], ["A", 12, 8], ["C", 15, 5.5]];
    var options = { idColumnNames: ["id"] };
    var table1 = new TableStructure("foo", options);
    var table2 = new TableStructure("bar"); // Only uses idColumnNames on table1.
    table1 = table1.loadFromJson(data);
    table2 = table2.loadFromJson(dat2);
    table1.merge(table2);
    expect(table1.columns[0].values.slice()).toEqual(["A", "B", "C"]);
    expect(table1.columns[1].values.slice()).toEqual([12, 16.2, 15]);
  });

  it("can add columns", function() {
    var dataNoAddr = [["x", "y"], [1.678, 5.123], [54321, 12345], [4, -3]];
    var options = {
      columnOptions: {
        y: {
          name: "new y",
          format: { useGrouping: true, maximumFractionDigits: 1 }
        }
      }
    };
    var tableStructure = new TableStructure("foo", options);
    tableStructure = tableStructure.loadFromJson(dataNoAddr);
    var longValues = [44.0, 55.0, 66.0];
    var latValues = [11.0, 22.0, 33.0];
    expect(tableStructure.hasLatitudeAndLongitude).toBe(false);
    tableStructure.addColumn("lat", latValues);
    tableStructure.addColumn("lon", longValues);
    expect(tableStructure.hasLatitudeAndLongitude).toBe(true);
    expect(tableStructure.columns[VarType.LAT].values).toBe(latValues);
    expect(tableStructure.columns[VarType.LON].values).toBe(longValues);
  });

  it("can sort columns", function() {
    var data = [["x", "y", "z"], [3, 5, "a"], [1, 8, "c"], [4, -3, "b"]];
    var tableStructure = TableStructure.fromJson(data);
    tableStructure.sortBy(tableStructure.getColumnWithName("x"));
    expect(tableStructure.getColumnWithName("x").values.slice()).toEqual([
      1,
      3,
      4
    ]);
    expect(tableStructure.getColumnWithName("y").values.slice()).toEqual([
      8,
      5,
      -3
    ]);
    expect(tableStructure.getColumnWithName("z").values.slice()).toEqual([
      "c",
      "a",
      "b"
    ]);
    tableStructure.sortBy(tableStructure.getColumnWithName("z"));
    expect(tableStructure.getColumnWithName("x").values.slice()).toEqual([
      3,
      4,
      1
    ]);
    expect(tableStructure.getColumnWithName("y").values.slice()).toEqual([
      5,
      -3,
      8
    ]);
    expect(tableStructure.getColumnWithName("z").values.slice()).toEqual([
      "a",
      "b",
      "c"
    ]);
    tableStructure.sortBy(tableStructure.getColumnWithName("x"), function(
      a,
      b
    ) {
      return b - a;
    }); // descending
    expect(tableStructure.getColumnWithName("x").values.slice()).toEqual([
      4,
      3,
      1
    ]);
    expect(tableStructure.getColumnWithName("y").values.slice()).toEqual([
      -3,
      5,
      8
    ]);
    expect(tableStructure.getColumnWithName("z").values.slice()).toEqual([
      "b",
      "a",
      "c"
    ]);
  });

  it("can sort columns by date, even with null dates", function() {
    // Note the last date occurs before the first, but a string compare would disagree.
    var data = [
      ["date", "v"],
      ["2010-06-20T10:00:00.0+1000", "a"],
      ["2010-06-19T10:00:00.0+1000", "b"],
      [null, "n"],
      ["2010-06-20T10:00:00.0+1100", "c"]
    ];
    var tableStructure = TableStructure.fromJson(data);
    tableStructure.sortBy(tableStructure.columns[0]);
    expect(tableStructure.columns[1].values.slice()).toEqual([
      "b",
      "c",
      "a",
      "n"
    ]);
  });

  it("can calculate finish dates", function() {
    var data = [["date"], ["2016-01-03T12:15:00Z"], ["2016-01-03T12:15:30Z"]];
    var tableStructure = TableStructure.fromJson(data);
    tableStructure.setActiveTimeColumn();
    expect(tableStructure.finishJulianDates).toEqual([
      JulianDate.fromIso8601("2016-01-03T12:15:30Z"),
      JulianDate.fromIso8601("2016-01-03T12:16:00Z") // Final one should have the average spacing, 30 sec.
    ]);
  });

  it("can calculate sub-second finish dates", function() {
    var data = [
      ["date"],
      ["2016-01-03T12:15:00Z"],
      ["2016-01-03T12:15:00.4Z"],
      ["2016-01-03T12:15:01Z"]
    ];
    var tableStructure = TableStructure.fromJson(data);
    tableStructure.setActiveTimeColumn();
    expect(tableStructure.finishJulianDates).toEqual([
      JulianDate.fromIso8601("2016-01-03T12:15:00.40Z"),
      JulianDate.fromIso8601("2016-01-03T12:15:01Z"),
      JulianDate.fromIso8601("2016-01-03T12:15:01.5Z") // Average spacing is 0.5 second.
    ]);
  });

  it("supports displayDuration", function() {
    var data = [["date"], ["2016-01-03"], ["2016-01-04"], ["2016-01-05"]];
    var sevenDaysInMinutes = 60 * 24 * 7;
    var tableStructure = new TableStructure("test", {
      displayDuration: sevenDaysInMinutes
    });
    TableStructure.fromJson(data, tableStructure);
    tableStructure.setActiveTimeColumn();
    var interval = tableStructure.timeIntervals[0];
    expect(
      TimeInterval.contains(interval, JulianDate.fromIso8601("2016-01-09"))
    ).toBe(true);
    expect(
      TimeInterval.contains(interval, JulianDate.fromIso8601("2016-01-11"))
    ).toBe(false);
    var durationInSeconds = JulianDate.secondsDifference(
      interval.stop,
      interval.start
    );
    expect(durationInSeconds).toEqual(sevenDaysInMinutes * 60);
  });

  it("uses start_date and end_date", function() {
    // Note these end dates overlap (12:15:00-12:16:10, 12:15:30-12:16:40).
    var data = [
      ["start_date", "end_date"],
      ["2016-01-03T12:15:00Z", "2016-01-03T12:16:10Z"],
      ["2016-01-03T12:15:30Z", "2016-01-03T12:16:40Z"]
    ];
    var tableStructure = TableStructure.fromJson(data);
    tableStructure.setActiveTimeColumn();
    expect(tableStructure.finishJulianDates).toEqual([
      JulianDate.fromIso8601("2016-01-03T12:16:10Z"),
      JulianDate.fromIso8601("2016-01-03T12:16:40Z")
    ]);
  });

  it("calculates id-specific date periods", function() {
    // A and B both have two two-day observations, but they are interspersed.
    // Without an id column, they would have one-day observations.
    var data = [
      ["date", "id"],
      ["2016-01-01T00:00:00Z", "A"],
      ["2016-01-02T00:00:00Z", "B"],
      ["2016-01-03T00:00:00Z", "A"],
      ["2016-01-04T00:00:00Z", "B"]
    ];
    var tableStructure = TableStructure.fromJson(data);
    tableStructure.idColumnNames = ["id"];
    tableStructure.shaveSeconds = 0;
    tableStructure.setActiveTimeColumn();
    expect(tableStructure.finishJulianDates).toEqual([
      JulianDate.fromIso8601("2016-01-03T00:00:00Z"),
      JulianDate.fromIso8601("2016-01-04T00:00:00Z"),
      JulianDate.fromIso8601("2016-01-05T00:00:00Z"),
      JulianDate.fromIso8601("2016-01-06T00:00:00Z")
    ]);
  });

  it("can add feature rows at start and end dates", function() {
    var data = [
      ["date", "id", "value"],
      ["2016-01-01T00:00:00Z", "A", 10],
      ["2016-01-02T00:00:00Z", "B", 15],
      ["2016-01-03T00:00:00Z", "A", 12],
      ["2016-01-04T00:00:00Z", "B", 17]
    ];
    var tableStructure = TableStructure.fromJson(data);
    tableStructure.idColumnNames = ["id"];
    tableStructure.columns = tableStructure.getColumnsWithFeatureRowsAtStartAndEndDates(
      "date",
      "value"
    );
    tableStructure.setActiveTimeColumn();
    expect(tableStructure.columns[1].values.slice()).toEqual([
      "A",
      "B",
      "B",
      "A",
      "B",
      "A"
    ]);
    expect(tableStructure.columns[2].values.slice()).toEqual([
      10,
      null,
      15,
      12,
      17,
      null
    ]);
    expect(tableStructure.activeTimeColumn.julianDates).toEqual([
      JulianDate.fromIso8601("2016-01-01T00:00:00Z"), // A, 10
      JulianDate.fromIso8601("2016-01-01T00:00:00Z"), // The new B, null
      JulianDate.fromIso8601("2016-01-02T00:00:00Z"), // B, 15
      JulianDate.fromIso8601("2016-01-03T00:00:00Z"), // A, 12
      JulianDate.fromIso8601("2016-01-04T00:00:00Z"), // B, 17
      JulianDate.fromIso8601("2016-01-04T00:00:00Z") // The new A, null
    ]);
  });

  describe("Time slider initial time as specified by initialTimeSource ", function() {
    // Future developers take note: some of these tests will stop working sometime after August 3015.
    it('should be start if "start" set', function() {
      var tableStructure = new TableStructure("test", {
        initialTimeSource: "start"
      });
      // Note: Specifying the time in this way means that the end date will be after 2015-08-09, but since we don't care particularly about the end date this is enough precision for this test.
      var data = [
        ["date"],
        ["2013-08-07T00:00:00.00Z"],
        ["2015-08-09T00:00:00.00Z"]
      ];
      TableStructure.fromJson(data, tableStructure);
      tableStructure.setActiveTimeColumn();

      var currentTime = JulianDate.toIso8601(
        tableStructure.clock.currentTime,
        3
      );
      // Do not compare time, because on some systems the second could have ticked over between getting the two times.
      currentTime = currentTime.substr(0, 10);
      expect(currentTime).toBe("2013-08-07");
    });

    it('should be current time if "present" set', function() {
      var tableStructure = new TableStructure("test", {
        initialTimeSource: "present"
      });
      // Note: Specifying the time in this way means that the end date will be after 2015-08-09, but since we don't care particularly about the end date this is enough precision for this test.
      var data = [
        ["date"],
        ["2013-08-07T00:00:00.00Z"],
        ["3115-08-09T00:00:00.00Z"]
      ];
      TableStructure.fromJson(data, tableStructure);
      tableStructure.setActiveTimeColumn();

      var dateNow = new Date().toISOString();
      var currentTime = JulianDate.toIso8601(
        tableStructure.clock.currentTime,
        3
      );
      // Do not compare time, because on some systems the second could have ticked over between getting the two times.
      dateNow = dateNow.substr(0, 10);
      currentTime = currentTime.substr(0, 10);
      expect(currentTime).toBe(dateNow);
    });

    it('should be last time if "end" set', function() {
      var tableStructure = new TableStructure("test", {
        initialTimeSource: "end",
        finalEndJulianDate: JulianDate.fromIso8601("2015-08-09T00:00:00.00Z")
      });
      var data = [["date"], ["2013-08-07T00:00:00.00Z"]];
      TableStructure.fromJson(data, tableStructure);
      tableStructure.setActiveTimeColumn();

      var currentTime = JulianDate.toIso8601(
        tableStructure.clock.currentTime,
        3
      );
      // Do not compare time, because on some systems the second could have ticked over between getting the two times.
      currentTime = currentTime.substr(0, 10);
      expect(currentTime).toBe("2015-08-09");
    });

    it("should be set to date specified if date is specified", function() {
      var tableStructure = new TableStructure("test", {
        initialTimeSource: "2015-08-08T00:00:00.00Z"
      });
      // Note: Specifying the time in this way means that the end date will be after 2015-08-11, but since we don't care particularly about the end date this is enough precision for this test.
      var data = [
        ["date"],
        ["2013-08-07T00:00:00.00Z"],
        ["2015-08-11T00:00:00.00Z"]
      ];
      TableStructure.fromJson(data, tableStructure);
      tableStructure.setActiveTimeColumn();

      var currentTime = JulianDate.toIso8601(
        tableStructure.clock.currentTime,
        3
      );
      // Do not compare time, because on some systems the second could have ticked over between getting the two times.
      currentTime = currentTime.substr(0, 10);
      expect(currentTime).toBe("2015-08-08");
    });

    it("should throw if a rubbish string is specified", function() {
      var tableStructure = new TableStructure("test", {
        initialTimeSource: "2015z08-08"
      });
      var data = [
        ["date"],
        ["2013-08-07T00:00:00.00Z"],
        ["2015-08-11T00:00:00.00Z"]
      ];
      TableStructure.fromJson(data, tableStructure);

      expect(function() {
        tableStructure.setActiveTimeColumn();
      }).toThrow();
    });
  });
});
