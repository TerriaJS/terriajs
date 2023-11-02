"use strict";

var combineData = require("../../lib/Core/combineData");

describe("combineData", function () {
  it("works with one array", function () {
    var data1 = [
      [1, 5],
      [3, 7],
      [6, 10],
      [9, -3]
    ];
    var combined = combineData([data1]);
    expect(combined).toEqual(data1);
  });

  it("works with two sorted numerical arrays", function () {
    var data1 = [
      [1, 5],
      [3, 7],
      [6, 10],
      [9, -3]
    ];
    var data2 = [
      [2, 12],
      [4, 8],
      [6, 5],
      [8, 7]
    ];
    var target = [
      [1, 5, null],
      [2, null, 12],
      [3, 7, null],
      [4, null, 8],
      [6, 10, 5],
      [8, null, 7],
      [9, -3, null]
    ];
    var combined = combineData([data1, data2]);
    expect(combined).toEqual(target);
  });

  it("works with two unsorted numerical arrays", function () {
    var data1 = [
      [1, 5],
      [6, 10],
      [3, 7],
      [9, -3]
    ];
    var data2 = [
      [6, 5],
      [4, 8],
      [8, 7],
      [2, 12]
    ];
    var target = [
      [1, 5, null],
      [2, null, 12],
      [3, 7, null],
      [4, null, 8],
      [6, 10, 5],
      [8, null, 7],
      [9, -3, null]
    ];
    var combined = combineData([data1, data2]);
    expect(combined).toEqual(target);
  });

  it("works with two date arrays", function () {
    var data1 = [
      [new Date("2015-03-01"), 5],
      [new Date("2015-03-02"), 7],
      [new Date("2015-03-04"), 10]
    ];
    var data2 = [
      [new Date("2015-02-28"), 12],
      [new Date("2015-03-02"), 8]
    ];
    var target = [
      [new Date("2015-02-28"), null, 12],
      [new Date("2015-03-01"), 5, null],
      [new Date("2015-03-02"), 7, 8],
      [new Date("2015-03-04"), 10, null]
    ];
    var combined = combineData([data1, data2]);
    expect(combined).toEqual(target);
  });

  it("works with three sorted numerical arrays", function () {
    var data1 = [
      [1, 5],
      [3, 7],
      [6, 10],
      [9, -3]
    ];
    var data2 = [
      [2, 12],
      [4, 8],
      [6, 5],
      [8, 7]
    ];
    var data3 = [
      [3, 18],
      [5, 19],
      [6, 16]
    ];
    var target = [
      [1, 5, null, null],
      [2, null, 12, null],
      [3, 7, null, 18],
      [4, null, 8, null],
      [5, null, null, 19],
      [6, 10, 5, 16],
      [8, null, 7, null],
      [9, -3, null, null]
    ];
    var combined = combineData([data1, data2, data3]);
    expect(combined).toEqual(target);
  });
});
