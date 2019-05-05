"use strict";

/*global require,describe,it,expect,beforeEach*/

var Terria = require("../../lib/Models/Terria");
var ImageryLayerCatalogItem = require("../../lib/Models/ImageryLayerCatalogItem");
var MapboxMapCatalogItem = require("../../lib/Models/MapboxMapCatalogItem");

var terria;
var mapboxItem;

beforeEach(function() {
  terria = new Terria({
    baseUrl: "./"
  });
  mapboxItem = new MapboxMapCatalogItem(terria);
});

describe("MapboxMapCatalogItem", function() {
  it("has sensible type and typeName", function() {
    expect(mapboxItem.type).toBe("mapbox-map");
    expect(mapboxItem.typeName).toBe("Mapbox Map");
  });

  it("throws if constructed without a Terria instance", function() {
    expect(function() {
      var viewModel = new MapboxMapCatalogItem(); // eslint-disable-line no-unused-vars
    }).toThrow();
  });

  it("can be constructed", function() {
    expect(mapboxItem).toBeDefined();
  });

  it("is derived from ImageryLayerDataItemViewModel", function() {
    expect(mapboxItem instanceof ImageryLayerCatalogItem).toBe(true);
  });
});
