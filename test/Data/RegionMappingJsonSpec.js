"use strict";

/*global require,describe,it,expect,beforeEach,fail*/

// tests will not build if this require statement is not valid
var RegionMappingJson = require("../../wwwroot/data/regionMapping.json");

describe("RegionMappingJson", function() {
  it("is valid JSON", function() {
    expect(RegionMappingJson).toEqual(RegionMappingJson);
  });
});
