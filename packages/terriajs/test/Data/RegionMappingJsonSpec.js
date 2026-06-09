"use strict";

// Tests will not build if this import statement is not valid.
import RegionMappingJson from "../../wwwroot/data/regionMapping.json";

describe("RegionMappingJson", function () {
  it("is valid JSON", function () {
    expect(RegionMappingJson).toEqual(RegionMappingJson);
  });
});
