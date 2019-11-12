"use strict";

/*global require,describe,xdescribe,it,expect,beforeEach*/
var NowViewing = require("../../lib/Models/NowViewing");
var Terria = require("../../lib/Models/Terria");
var Cesium = require("../../lib/Models/Cesium");
var CesiumWidget = require("terriajs-cesium/Source/Widgets/CesiumWidget/CesiumWidget")
  .default;
var Leaflet = require("../../lib/Models/Leaflet");
var L = require("leaflet");
var CatalogItem = require("../../lib/Models/CatalogItem");
var supportsWebGL = require("../../lib/Core/supportsWebGL");
var TileCoordinatesImageryProvider = require("terriajs-cesium/Source/Scene/TileCoordinatesImageryProvider")
  .default;

describe("NowViewing without a viewer", function() {
  var terria;
  var nowViewing;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    nowViewing = new NowViewing(terria);
  });

  it("can add an item", function() {
    var item = new CatalogItem(terria);
    expect(nowViewing.items.length).toEqual(0);
    nowViewing.add(item);
    expect(nowViewing.items.length).toEqual(1);
  });
});

var describeIfSupported = supportsWebGL() ? describe : xdescribe;

// only run these tests if the browser supports WebGL
// the browser may still not show WebGL properly - see TerriaViewer.js for a more precise test if needed

describeIfSupported("NowViewing with a minimal Cesium viewer", function() {
  var container;
  var widget;
  var cesium;
  var terria;
  var nowViewing;

  beforeEach(function() {
    container = document.createElement("div");
    document.body.appendChild(container);

    widget = new CesiumWidget(container, {
      imageryProvider: new TileCoordinatesImageryProvider()
    });
    terria = new Terria({
      baseUrl: "./"
    });
    cesium = new Cesium(terria, widget);
    terria.currentViewer = cesium;
    terria.cesium = cesium;
    nowViewing = terria.nowViewing;
  });

  afterEach(function() {
    if (widget && !widget.isDestroyed()) {
      widget = widget.destroy();
    }
    document.body.removeChild(container);
  });

  it("can raise an item", function() {
    var item1 = new CatalogItem(terria);
    var item2 = new CatalogItem(terria);
    nowViewing.add(item1);
    nowViewing.add(item2);
    expect(nowViewing.items.indexOf(item1)).toEqual(1);
    nowViewing.raise(item1);
    expect(nowViewing.items.indexOf(item1)).toEqual(0);
  });

  it("can lower an item", function() {
    var item1 = new CatalogItem(terria);
    var item2 = new CatalogItem(terria);
    nowViewing.add(item1);
    nowViewing.add(item2);
    expect(nowViewing.items.indexOf(item1)).toEqual(1);
    nowViewing.lower(item2);
    expect(nowViewing.items.indexOf(item1)).toEqual(0);
  });
});

describe("NowViewing with a minimal Leaflet viewer", function() {
  var container;
  var leaflet;
  var terria;
  var nowViewing;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    container = document.createElement("div");
    container.id = "container";
    document.body.appendChild(container);
    var map = L.map("container").setView([-28.5, 135], 5);

    leaflet = new Leaflet(terria, map);
    terria.currentViewer = leaflet;
    terria.leaflet = leaflet;
    nowViewing = terria.nowViewing;
  });

  afterEach(function() {
    document.body.removeChild(container);
  });

  it("can raise an item", function() {
    var item1 = new CatalogItem(terria);
    var item2 = new CatalogItem(terria);
    nowViewing.add(item1);
    nowViewing.add(item2);
    expect(nowViewing.items.indexOf(item1)).toEqual(1);
    nowViewing.raise(item1);
    expect(nowViewing.items.indexOf(item1)).toEqual(0);
  });

  it("can lower an item", function() {
    var item1 = new CatalogItem(terria);
    var item2 = new CatalogItem(terria);
    nowViewing.add(item1);
    nowViewing.add(item2);
    expect(nowViewing.items.indexOf(item1)).toEqual(1);
    nowViewing.lower(item2);
    expect(nowViewing.items.indexOf(item1)).toEqual(0);
  });
});
