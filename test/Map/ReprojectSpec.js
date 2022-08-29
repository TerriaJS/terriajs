"use strict";

var Reproject = require("../../lib/Map/Vector/Reproject");

describe("Reproject", function () {
  it("function crsStringToCode translates CRS strings to Proj4 codes", function () {
    expect(Reproject.crsStringToCode("EPSG:4326")).toEqual("EPSG:4326");
    expect(Reproject.crsStringToCode("EPSG:1234")).toEqual("EPSG:1234");
    expect(Reproject.crsStringToCode("urn:ogc:def:crs:EPSG:6.6:4326")).toEqual(
      "EPSG:4326"
    );
    expect(Reproject.crsStringToCode("urn:ogc:def:crs:EPSG:6.6:1241")).toEqual(
      "EPSG:1241"
    );
    expect(Reproject.crsStringToCode("urn:ogc:def:crs:EPSG::4326")).toEqual(
      "EPSG:4326"
    );
    expect(Reproject.crsStringToCode("urn:ogc:def:crs:EPSG::1241")).toEqual(
      "EPSG:1241"
    );
    expect(Reproject.crsStringToCode("CRS84")).toEqual("EPSG:4326");
  });

  it("function willNeedReprojecting predicts correctly if something needs reprojecting", function () {
    expect(Reproject.willNeedReprojecting("EPSG:4326")).toBe(false);
    expect(Reproject.willNeedReprojecting("CRS84")).toBe(true);
    expect(Reproject.willNeedReprojecting("EPSG:1234")).toBe(true);
  });

  it("function reprojectPoint reprojects a point from one CRS to another", function () {
    var result = Reproject.reprojectPoint(
      [319180, 6399862],
      "EPSG:3006",
      "EPSG:4326"
    );
    expect(result[0]).toBeCloseTo(11.965261850080005, 8);
    expect(result[1]).toBeCloseTo(57.70450563701629, 8);
  });
});
