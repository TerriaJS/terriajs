"use strict";

/*global require,describe,it,expect,beforeEach,fail*/

var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var TimeInterval = require("terriajs-cesium/Source/Core/TimeInterval").default;
var TimeIntervalCollection = require("terriajs-cesium/Source/Core/TimeIntervalCollection")
  .default;
var WebMercatorTilingScheme = require("terriajs-cesium/Source/Core/WebMercatorTilingScheme")
  .default;

var ImageryLayerCatalogItem = require("../../lib/Models/ImageryLayerCatalogItem");
var LegendUrl = require("../../lib/Map/LegendUrl");
var Terria = require("../../lib/Models/Terria");
var WebMapTileServiceCatalogItem = require("../../lib/Models/WebMapTileServiceCatalogItem");

var terria;
var wmtsItem;

beforeEach(function() {
  terria = new Terria({
    baseUrl: "./"
  });
  wmtsItem = new WebMapTileServiceCatalogItem(terria);
});

describe("WebMapTileServiceCatalogItem", function() {
  it("has sensible type and typeName", function() {
    expect(wmtsItem.type).toBe("wmts");
    expect(wmtsItem.typeName).toBe("Web Map Tile Service (WMTS)");
  });

  it("throws if constructed without a Terria instance", function() {
    expect(function() {
      var viewModel = new WebMapTileServiceCatalogItem(); // eslint-disable-line no-unused-vars
    }).toThrow();
  });

  it("can be constructed", function() {
    expect(wmtsItem).toBeDefined();
  });

  it("is derived from ImageryLayerCatalogItem", function() {
    expect(wmtsItem instanceof ImageryLayerCatalogItem).toBe(true);
  });

  describe("metadata url", function() {
    it("derives metadata from url if metadata is not explicitly provided", function() {
      wmtsItem.url = "http://foo.com/bar";
      expect(wmtsItem.metadataUrl).toBe(
        "http://foo.com/bar?service=WMTS&request=GetCapabilities&version=1.0.0"
      );
    });
  });

  it("uses explicitly-provided metadataUrl", function() {
    wmtsItem.metadataUrl = "http://foo.com/metadata";
    wmtsItem.url = "http://foo.com/somethingElse";
    expect(wmtsItem.metadataUrl).toBe("http://foo.com/metadata");
  });

  it("defaults to having no dataUrl", function() {
    wmtsItem.url = "http://foo.bar";
    expect(wmtsItem.dataUrl).toBeUndefined();
    expect(wmtsItem.dataUrlType).toBe("none");
  });

  it("uses explicitly-provided dataUrl and dataUrlType", function() {
    wmtsItem.dataUrl = "http://foo.com/data";
    wmtsItem.dataUrlType = "wfs-complete";
    wmtsItem.url = "http://foo.com/somethingElse";
    expect(wmtsItem.dataUrl).toBe("http://foo.com/data");
    expect(wmtsItem.dataUrlType).toBe("wfs-complete");
  });

  it("can update from json", function() {
    wmtsItem.updateFromJson({
      name: "Name",
      description: "Description",
      rectangle: [-10, 10, -20, 20],
      legendUrl: "http://legend.com",
      dataUrlType: "wfs",
      dataUrl: "http://my.wfs.com/wfs",
      dataCustodian: "Data Custodian",
      url: "http://my.wms.com",
      layer: "mylayer",
      tilingScheme: new WebMercatorTilingScheme(),
      getFeatureInfoFormats: []
    });

    expect(wmtsItem.name).toBe("Name");
    expect(wmtsItem.description).toBe("Description");
    expect(wmtsItem.rectangle).toEqual(Rectangle.fromDegrees(-10, 10, -20, 20));
    expect(wmtsItem.legendUrl).toEqual(new LegendUrl("http://legend.com"));
    expect(wmtsItem.dataUrlType).toBe("wfs");
    expect(wmtsItem.dataUrl.indexOf("http://my.wfs.com/wfs")).toBe(0);
    expect(wmtsItem.dataCustodian).toBe("Data Custodian");
    expect(wmtsItem.url).toBe("http://my.wms.com");
    expect(wmtsItem.layer).toBe("mylayer");
    expect(wmtsItem.tilingScheme instanceof WebMercatorTilingScheme).toBe(true);
    expect(wmtsItem.getFeatureInfoFormats).toEqual([]);
  });

  it("uses reasonable defaults for updateFromJson", function() {
    wmtsItem.updateFromJson({});

    expect(wmtsItem.name).toBe("Unnamed Item");
    expect(wmtsItem.description).toBe("");
    expect(wmtsItem.rectangle).toBeUndefined();
    expect(wmtsItem.legendUrl).toBeUndefined();
    expect(wmtsItem.dataUrlType).toBe("none");
    expect(wmtsItem.dataUrl).toBeUndefined();
    expect(wmtsItem.dataCustodian).toBeUndefined();
    expect(function() {
      // metadataUrl requires a url
      wmtsItem.metadataUrl;
    }).toThrow();
    expect(wmtsItem.url).toBeUndefined();
    expect(wmtsItem.layer).toBe("");
    expect(wmtsItem.tilingScheme).toBeUndefined();
    expect(wmtsItem.getFeatureInfoFormats).toBeUndefined();
  });

  it("can be round-tripped with serializeToJson and updateFromJson", function() {
    wmtsItem.name = "Name";
    wmtsItem.id = "Id";
    // wmtsItem.description = 'Description';
    wmtsItem.rectangle = Rectangle.fromDegrees(-10, 10, -20, 20);
    wmtsItem.legendUrl = new LegendUrl("http://legend.com", "image/png");
    wmtsItem.dataUrlType = "wfs";
    wmtsItem.dataUrl = "http://my.wfs.com/wfs";
    wmtsItem.dataCustodian = "Data Custodian";
    wmtsItem.metadataUrl = "http://my.metadata.com";
    wmtsItem.url = "http://my.wms.com";
    wmtsItem.layer = "mylayer";
    wmtsItem.getFeatureInfoFormats = [];

    // This initialTime is before any interval, so internally it will be changed to the first start date.
    wmtsItem.initialTimeSource = "2012-01-01T12:00:00Z";

    wmtsItem.intervals = new TimeIntervalCollection([
      new TimeInterval({
        start: JulianDate.fromIso8601("2013-08-01T15:00:00Z"),
        stop: JulianDate.fromIso8601("2013-08-01T18:00:00Z")
      }),
      new TimeInterval({
        start: JulianDate.fromIso8601("2013-09-01T11:00:00Z"),
        stop: JulianDate.fromIso8601("2013-09-03T13:00:00Z")
      })
    ]);

    var json = wmtsItem.serializeToJson();

    var reconstructed = new WebMapTileServiceCatalogItem(terria);
    reconstructed.updateFromJson(json);

    // We'll check for these later in toEqual but this makes it a bit easier to see what's different.
    expect(reconstructed.name).toBe(wmtsItem.name);
    expect(reconstructed.rectangle).toEqual(wmtsItem.rectangle);
    expect(reconstructed.legendUrl).toEqual(wmtsItem.legendUrl);
    expect(reconstructed.legendUrls).toEqual(wmtsItem.legendUrls);
    expect(reconstructed.dataUrlType).toBe(wmtsItem.dataUrlType);
    expect(reconstructed.dataUrl).toBe(wmtsItem.dataUrl);
    expect(reconstructed.dataCustodian).toBe(wmtsItem.dataCustodian);
    expect(reconstructed.metadataUrl).toBe(wmtsItem.metadataUrl);
    expect(reconstructed.url).toBe(wmtsItem.url);
    expect(reconstructed.layers).toBe(wmtsItem.layers);
    expect(reconstructed.getFeatureInfoFormats).toEqual(
      wmtsItem.getFeatureInfoFormats
    );
    // Do not compare time, because on some systems the second could have ticked over between getting the two times.
    var initialTimeSource = reconstructed.initialTimeSource.substr(0, 10);
    expect(initialTimeSource).toEqual("2013-08-01");
  });

  it("given a layer pointing at a tilematrix set, calculates the correct tileMatrixMaximumLevel", function(done) {
    wmtsItem.updateFromJson({
      url: "test/WMTS/with_tilematrix.xml",
      metadataUrl: "test/WMTS/with_tilematrix.xml",
      layer: "Some_Layer1"
    });
    wmtsItem
      .load()
      .then(function() {
        expect(wmtsItem.tileMatrixMaximumLevel).toBe(9);
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("given a layer pointing at a non-existent tilematrix set, does not set tileMatrixMaximumLevel", function(done) {
    wmtsItem.updateFromJson({
      url: "test/WMTS/with_tilematrix.xml",
      metadataUrl: "test/WMTS/with_tilematrix.xml",
      layer: "Layer_With_Bad_Tilematrixset"
    });
    wmtsItem
      .load()
      .then(function() {
        expect(wmtsItem.tileMatrixMaximumLevel).toBe(undefined);
      })
      .then(done)
      .otherwise(done.fail);
  });
});
