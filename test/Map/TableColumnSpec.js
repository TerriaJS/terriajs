"use strict";

/*global require,describe,it,expect*/
var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;
var TableColumn = require("../../lib/Map/TableColumn");
var VarType = require("../../lib/Map/VarType");
var VarSubType = require("../../lib/Map/VarSubType");

describe("TableColumn", function() {
  it("can make a new object and detect scalar type", function() {
    // Use a copy of data to make the column, because knockout adds stuff to data.
    // Also, test a "slice" of the column's values, to remove knockout stuff.
    var data = [1, 3, 4];
    var tableColumn = new TableColumn("x", data.slice());
    expect(tableColumn.name).toEqual("x");
    expect(tableColumn.values.slice()).toEqual(data);
    expect(tableColumn.type).toEqual(VarType.SCALAR);
  });

  it("treats null, NA and hyphens as null in numeric data", function() {
    var data = [1, "NA", 4, "-", null, 3];
    var tableColumn = new TableColumn("x", data.slice());
    expect(tableColumn.name).toEqual("x");
    expect(tableColumn.values.slice()).toEqual([1, null, 4, null, null, 3]);
    expect(tableColumn.type).toEqual(VarType.SCALAR);
  });

  it("replaces null values before generating numericalValues", function() {
    var data = [0, 0, 0];
    var tableColumn = new TableColumn("x", data.slice(), {
      replaceWithNullValues: [0]
    });
    expect(tableColumn.numericalValues.slice()).toEqual([]);
  });

  it("treats hyphens, blanks and NA as strings in string data", function() {
    var data = ["%", "-", "!", "NA", ""];
    var tableColumn = new TableColumn("x", data.slice());
    expect(tableColumn.name).toEqual("x");
    expect(tableColumn.values.slice()).toEqual(data);
    expect(tableColumn.type).toEqual(VarType.ENUM);
  });

  it("provides a null index for a null value in string data", function() {
    var data = ["small", "medium", null, "big"];
    var tableColumn = new TableColumn("size", data.slice());
    expect(tableColumn.type).toEqual(VarType.ENUM);
    expect(tableColumn.isEnum).toBe(true);
    expect(tableColumn.values[1]).not.toBe(null);
    expect(tableColumn.values[2]).toBe(null);
  });

  it("ignores missing values when calculating min/max", function() {
    var data = [130.3, 131.3, null, 133.3];
    var tableColumn = new TableColumn("lat", data.slice());
    expect(tableColumn.maximumValue).toBe(133.3);
    expect(tableColumn.minimumValue).toBe(130.3);
  });

  it("can detect latitude type", function() {
    var data = [30.3, 31.3, 33.3];
    var tableColumn = new TableColumn("lat", data.slice());
    expect(tableColumn.type).toEqual(VarType.LAT);
  });

  it("can detect longitude type", function() {
    var data = [130.3, 131.3, 133.3];
    var tableColumn = new TableColumn("lon", data.slice());
    expect(tableColumn.type).toEqual(VarType.LON);
  });

  it("can detect address type", function() {
    var data = ["7 London Circuit Canberra City ACT 2601"];
    var tableColumn = new TableColumn("address", data);
    expect(tableColumn.type).toEqual(VarType.ADDR);
  });

  it("can detect time type from yyyy-mm-dd", function() {
    // Dates in this format are interpreted as midnight _UTC_ on the date.
    var data = ["2016-01-03", null, "2016-01-04"];
    var tableColumn = new TableColumn("date", data.slice());
    expect(tableColumn.type).toEqual(VarType.TIME);
    expect(tableColumn.values.slice()).toEqual(data);

    var expected = JulianDate.toDate(JulianDate.fromIso8601("2016-01-03"));
    expect(tableColumn.dates[0]).toEqual(expected);
  });

  it("can detect time type from dd-mm-yyyy", function() {
    // Dates in this format are interpreted as midnight _local time_ on the date.
    var data = ["31-12-2015", "04-01-2016", null];
    var tableColumn = new TableColumn("date", data.slice());
    expect(tableColumn.type).toEqual(VarType.TIME);
    expect(tableColumn.values.slice()).toEqual(data);
    expect(tableColumn.dates[1].getDate()).toEqual(4);
    expect(tableColumn.dates[1].getMonth()).toEqual(0); // January is month 0
    expect(tableColumn.dates[1].getFullYear()).toEqual(2016);
  });

  it("can detect time type from mm-dd-yyyy", function() {
    // Dates in this format are interpreted as midnight _local time_ on the date.
    var data = ["12-31-2015", "01-04-2016", null];
    var tableColumn = new TableColumn("date", data.slice());
    expect(tableColumn.type).toEqual(VarType.TIME);
    expect(tableColumn.values.slice()).toEqual(data);
    expect(tableColumn.dates[1].getDate()).toEqual(4);
    expect(tableColumn.dates[1].getMonth()).toEqual(0); // January is month 0
    expect(tableColumn.dates[1].getFullYear()).toEqual(2016);
  });

  it("can detect ISO8601 UTC time type", function() {
    var data = ["2016-01-03T12:15:59.1234Z", null, "2016-01-03T12:25:00Z"];
    var tableColumn = new TableColumn("date", data.slice());
    expect(tableColumn.type).toEqual(VarType.TIME);
    expect(tableColumn.values.slice()).toEqual(data);
    expect(tableColumn.dates[0].getUTCDate()).toEqual(3);
    expect(tableColumn.dates[0].getUTCMonth()).toEqual(0); // January is month 0
    expect(tableColumn.dates[0].getUTCFullYear()).toEqual(2016);
    expect(tableColumn.dates[0].getUTCHours()).toEqual(12);
    expect(tableColumn.dates[0].getUTCMinutes()).toEqual(15);
    expect(tableColumn.dates[0].getUTCSeconds()).toEqual(59);
    expect(tableColumn.dates[0].getUTCMilliseconds()).toEqual(123);
  });

  it("can detect time type and year subtype from yyyy", function() {
    var data = ["2010", "2011", "2012", null, "2013"];
    var tableColumn = new TableColumn("date", data.slice());
    expect(tableColumn.type).toEqual(VarType.TIME);
    expect(tableColumn.subtype).toEqual(VarSubType.YEAR);
    expect(tableColumn.values.slice()).toEqual(data);
    // don't test equality using new Date() because different browsers handle timezones differently
    // so just check the date is right.
    expect(tableColumn.dates[0].getDate()).toEqual(1);
    expect(tableColumn.dates[0].getMonth()).toEqual(0); // January is month 0
    expect(tableColumn.dates[0].getFullYear()).toEqual(2010);
  });

  it("can detect time type from yyyy-mm", function() {
    // Dates in this format are interpreted as midnight _UTC_ on the date.
    var data = ["2010-01", "2010-02", "2010-03", null, "2010-04"];
    var tableColumn = new TableColumn("date", data.slice());
    expect(tableColumn.type).toEqual(VarType.TIME);
    expect(tableColumn.values.slice()).toEqual(data);
    var expected = JulianDate.toDate(JulianDate.fromIso8601("2010-02"));
    expect(tableColumn.dates[1]).toEqual(expected);
  });

  // This format can actually work, but we don't want to encourage it.
  // it('can detect time type from yyyy/mm/dd h:mm:ss', function() {
  //     var data = ['2010/02/12 12:34:56', '2010/02/13 1:23:45'];
  //     var tableColumn = new TableColumn('date', data);
  //     expect(tableColumn.type).toEqual(VarType.TIME);
  //     expect(tableColumn.values).toEqual(data);
  //     expect(tableColumn.dates[1].getDate()).toEqual(13);
  //     expect(tableColumn.dates[1].getMonth()).toEqual(1); // January is month 0
  //     expect(tableColumn.dates[1].getFullYear()).toEqual(2010);
  //     expect(tableColumn.dates[1].getHours()).toEqual(1);
  //     expect(tableColumn.dates[1].getMinutes()).toEqual(23);
  //     expect(tableColumn.dates[1].getSeconds()).toEqual(45);
  // });

  it("can detect time type from yyyy-mm-dd h:mm", function() {
    var data = ["2010-02-12 12:34", "2010-02-13 1:23", null];
    var tableColumn = new TableColumn("date", data.slice());
    expect(tableColumn.type).toEqual(VarType.TIME);
    expect(tableColumn.values.slice()).toEqual(data);
    expect(tableColumn.dates[1].getDate()).toEqual(13);
    expect(tableColumn.dates[1].getMonth()).toEqual(1); // January is month 0
    expect(tableColumn.dates[1].getFullYear()).toEqual(2010);
    expect(tableColumn.dates[1].getHours()).toEqual(1);
    expect(tableColumn.dates[1].getMinutes()).toEqual(23);
    expect(tableColumn.dates[1].getSeconds()).toEqual(0);
  });

  it("can detect time type from yyyy-mm-dd h:mm:ss", function() {
    var data = ["2010-02-12 12:34:56", "2010-02-13 1:23:45", null];
    var tableColumn = new TableColumn("date", data.slice());
    expect(tableColumn.type).toEqual(VarType.TIME);
    expect(tableColumn.values.slice()).toEqual(data);
    expect(tableColumn.dates[1].getDate()).toEqual(13);
    expect(tableColumn.dates[1].getMonth()).toEqual(1); // January is month 0
    expect(tableColumn.dates[1].getFullYear()).toEqual(2010);
    expect(tableColumn.dates[1].getHours()).toEqual(1);
    expect(tableColumn.dates[1].getMinutes()).toEqual(23);
    expect(tableColumn.dates[1].getSeconds()).toEqual(45);
  });

  it("can detect time type from yyyy-Qx", function() {
    var data = ["2010-Q1", "2010-Q2", "2010-Q3", null, "2010-Q4"];
    var tableColumn = new TableColumn("date", data.slice());
    expect(tableColumn.type).toEqual(VarType.TIME);
    expect(tableColumn.values.slice()).toEqual(data);
    expect(tableColumn.dates[1].getDate()).toEqual(1);
    expect(tableColumn.dates[1].getMonth()).toEqual(3); // January is month 0
    expect(tableColumn.dates[1].getFullYear()).toEqual(2010);
  });

  it("can detect year subtype using year title", function() {
    var data = ["1066", "1776", "1788", "1901", null, "2220"];
    var tableColumn = new TableColumn("year", data.slice());
    expect(tableColumn.type).toEqual(VarType.TIME);
    expect(tableColumn.subtype).toEqual(VarSubType.YEAR);
  });

  it("detects years from numerical data in a column named time", function() {
    var data = [730, 1230, null, 130];
    var tableColumn = new TableColumn("date", data.slice());
    expect(tableColumn.type).toEqual(VarType.TIME);
    expect(tableColumn.subtype).toEqual(VarSubType.YEAR);
    expect(tableColumn.values.slice()).toEqual(data);
  });

  it("can handle missing times", function() {
    var data = ["2016-01-03T12:15:59.1234Z", "-", "2016-01-04T12:25:00Z", null];
    var tableColumn = new TableColumn("date", data.slice());
    expect(tableColumn.type).toEqual(VarType.TIME);
    expect(tableColumn.dates[0].getUTCDate()).toEqual(3);
    expect(tableColumn.dates[1]).toBeUndefined();
    expect(tableColumn.dates[2].getUTCDate()).toEqual(4);
  });

  it("treats numerical data >= 9999 in a column named time as scalars", function() {
    var data = [9999, 1230, null, 130];
    var tableColumn = new TableColumn("date", data.slice());
    expect(tableColumn.type).toEqual(VarType.SCALAR);
    expect(tableColumn.values.slice()).toEqual(data);
  });

  it("can detect tag type from <img>", function() {
    var data = ['<img src="foo">', '<img src="bar">'];
    var tableColumn = new TableColumn("image", data.slice());
    expect(tableColumn.type).toEqual(VarType.TAG);
  });

  it("can detect tag type from <br/>", function() {
    var data = ["<br/>", "<br/>"];
    var tableColumn = new TableColumn("bar", data);
    expect(tableColumn.type).toEqual(VarType.TAG);
  });

  it("can detect tag type from <div>", function() {
    var data = ["<div>Foo</div>", "<div>Bar</div>"];
    var tableColumn = new TableColumn("foo", data);
    expect(tableColumn.type).toEqual(VarType.TAG);
  });

  it("does not use tag type for <<...>>", function() {
    var data = ["<<he>>", "<<she>>"];
    var tableColumn = new TableColumn("who", data);
    expect(tableColumn.type).toEqual(VarType.ENUM);
  });

  it("does not use tag type for <foo>", function() {
    var data = ["<foo>", "<foobar>"];
    var tableColumn = new TableColumn("fee", data);
    expect(tableColumn.type).toEqual(VarType.ENUM);
  });

  it("can sum three columns from array", function() {
    var tableColumns = [
      new TableColumn("one", [10, 1]),
      new TableColumn("two", [25, 2.5]),
      new TableColumn("three", [-2, 6])
    ];
    var result = TableColumn.sumValues(tableColumns);
    var target = [10 + 25 - 2, 1 + 2.5 + 6];
    expect(result).toEqual(target);
  });

  it("can sum three columns as arguments", function() {
    var result = TableColumn.sumValues(
      new TableColumn("one", [10, 1]),
      new TableColumn("two", [25, 2.5]),
      new TableColumn("three", [-2, 6])
    );
    var target = [10 + 25 - 2, 1 + 2.5 + 6];
    expect(result).toEqual(target);
  });

  it("can divide two columns' values", function() {
    var result = TableColumn.divideValues(
      new TableColumn("num", [40, 3, 8]),
      new TableColumn("den", [10, 6, 0]),
      "bad"
    );
    var target = [4, 0.5, "bad"];
    expect(result).toEqual(target);
  });
});
