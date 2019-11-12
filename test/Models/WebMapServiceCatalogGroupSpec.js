"use strict";

/*global require,describe,beforeEach,it,afterEach,expect*/
var Terria = require("../../lib/Models/Terria");
var WebMapServiceCatalogGroup = require("../../lib/Models/WebMapServiceCatalogGroup");

var loadText = require("../../lib/Core/loadText");
var GeographicTilingScheme = require("terriajs-cesium/Source/Core/GeographicTilingScheme")
  .default;
var WebMercatorTilingScheme = require("terriajs-cesium/Source/Core/WebMercatorTilingScheme")
  .default;

describe("WebMapServiceCatalogGroup", function() {
  var terria;
  var group;
  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    group = new WebMapServiceCatalogGroup(terria);
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it("creates hierarchy of catalog items", function(done) {
    loadText("test/GetCapabilities/BOM.xml")
      .then(function(capabilities) {
        jasmine.Ajax.install();
        jasmine.Ajax.stubRequest(/.*/).andError();

        group.url = "http://does.not.exist";

        jasmine.Ajax.stubRequest(/GetCapabilities/).andReturn({
          contentType: "text/xml",
          responseText: capabilities
        });

        return group.load().then(function() {
          expect(group.items.length).toBe(9);

          var first = group.items[0];
          expect(first.items.length).toBe(5);
          expect(first.items[0].name).toContain("All");
        });
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("creates flat list of catalog items if requested", function(done) {
    loadText("test/GetCapabilities/BOM.xml")
      .then(function(capabilities) {
        jasmine.Ajax.install();
        jasmine.Ajax.stubRequest(/.*/).andError();

        group.url = "http://does.not.exist";
        group.flatten = true;

        jasmine.Ajax.stubRequest(/GetCapabilities/).andReturn({
          contentType: "text/xml",
          responseText: capabilities
        });

        return group.load().then(function() {
          expect(group.items.length).toBe(76);
        });
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("prefers Web Mercator if available", function(done) {
    loadText("test/GetCapabilities/WebMercatorAndGeographic.xml")
      .then(function(capabilities) {
        jasmine.Ajax.install();
        jasmine.Ajax.stubRequest(/.*/).andError();

        group.url = "http://does.not.exist";
        group.flatten = true;

        jasmine.Ajax.stubRequest(/GetCapabilities/).andReturn({
          contentType: "text/xml",
          responseText: capabilities
        });

        return group.load().then(function() {
          expect(group.items.length).toBe(1);
          expect(
            group.items[0]._createImageryProvider().tilingScheme instanceof
              WebMercatorTilingScheme
          ).toBe(true);
        });
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("Use Geographic if Web Mercator is not available", function(done) {
    loadText("test/GetCapabilities/GeographicOnly.xml")
      .then(function(capabilities) {
        jasmine.Ajax.install();
        jasmine.Ajax.stubRequest(/.*/).andError();

        group.url = "http://does.not.exist";
        group.flatten = true;

        jasmine.Ajax.stubRequest(/GetCapabilities/).andReturn({
          contentType: "text/xml",
          responseText: capabilities
        });

        return group.load().then(function() {
          expect(group.items.length).toBe(1);
          var item = group.items[0];
          return item.load().then(function() {
            expect(
              item._createImageryProvider().tilingScheme instanceof
                GeographicTilingScheme
            ).toBe(true);
          });
        });
      })
      .then(done)
      .otherwise(done.fail);
  });
});
