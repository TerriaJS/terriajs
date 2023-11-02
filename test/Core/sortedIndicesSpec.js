"use strict";

var sortedIndices = require("../../lib/Core/sortedIndices");

describe("sortedIndices", function () {
  it("works", function () {
    var data = ["c", "a", "b", "d"];
    var indices = sortedIndices(data);
    expect(indices).toEqual([1, 2, 0, 3]);
  });
});
