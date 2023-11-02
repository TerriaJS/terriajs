"use strict";

var KmlCatalogItem = require("../../../../lib/Models/Catalog/CatalogItems/KmlCatalogItem");
var TerriaError = require("../../../../lib/Core/TerriaError").default;
var Terria = require("../../../../lib/Models/Terria");

var loadBlob = require("../../../../lib/Core/loadBlob");
var loadText = require("../../../../lib/Core/loadText");
var loadXML = require("../../../../lib/Core/loadXML");

// KML requires support for Blob.  See https://github.com/TerriaJS/terriajs/issues/508
var describeIfSupported = typeof Blob !== "undefined" ? describe : xdescribe;

describeIfSupported("KmlCatalogItem", function () {
  var terria;
  var kml;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    kml = new KmlCatalogItem(terria);
  });

  it("can load a KML file by URL", function (done) {
    kml.url = "test/KML/vic_police.kml";
    kml
      .load()
      .then(function () {
        expect(kml.dataSource.entities.values.length).toBeGreaterThan(0);
      })
      .then(done)
      .catch(done.fail);
  });

  it("use provided dataUrl", function (done) {
    kml.url = "test/KML/vic_police.kml";
    kml.dataUrl = "test/test.html";
    kml
      .load()
      .then(function () {
        expect(kml.dataSource.entities.values.length).toBeGreaterThan(0);
        expect(kml.dataUrl).toBe("test/test.html");
      })
      .then(done)
      .catch(done.fail);
  });

  it("have default dataUrl and dataUrlType", function () {
    kml.updateFromJson({
      url: "test/KML/vic_police.kml"
    });
    expect(kml.dataUrl).toBe("test/KML/vic_police.kml");
    expect(kml.dataUrlType).toBe("direct");
  });

  it("can load a KML file by provided XML data", function (done) {
    loadXML("test/KML/vic_police.kml").then(function (xml) {
      kml.data = xml;
      kml.dataSourceUrl = "anything.kml";
      kml
        .load()
        .then(function () {
          expect(kml.dataSource.entities.values.length).toBeGreaterThan(0);
        })
        .then(done)
        .catch(done.fail);
    });
  });

  it("can load a KML file by provided Blob", function (done) {
    loadBlob("test/KML/vic_police.kml").then(function (blob) {
      kml.data = blob;
      kml.dataSourceUrl = "anything.kml";
      kml
        .load()
        .then(function () {
          expect(kml.dataSource.entities.values.length).toBeGreaterThan(0);
        })
        .then(done)
        .catch(done.fail);
    });
  });

  it("can load a KML file by provided string", function (done) {
    loadText("test/KML/vic_police.kml").then(function (s) {
      kml.data = s;
      kml.dataSourceUrl = "anything.kml";
      kml
        .load()
        .then(function () {
          expect(kml.dataSource.entities.values.length).toBeGreaterThan(0);
        })
        .then(done)
        .catch(done.fail);
    });
  });

  it("can load a KMZ file by URL", function (done) {
    kml.url = require("file-loader!../../../../wwwroot/test/KML/vic_police.kmz");
    kml
      .load()
      .then(function () {
        expect(kml.dataSource.entities.values.length).toBeGreaterThan(0);
      })
      .then(done)
      .catch(done.fail);
  });

  it("can load a KMZ file by provided Blob", function (done) {
    loadBlob("test/KML/vic_police.kmz").then(function (blob) {
      kml.data = blob;
      kml.dataSourceUrl = "anything.kmz";
      kml
        .load()
        .then(function () {
          expect(kml.dataSource.entities.values.length).toBeGreaterThan(0);
        })
        .then(done)
        .catch(done.fail);
    });
  });

  describe("error handling", function () {
    it("fails gracefully when the data at a URL is not XML", function (done) {
      kml.url = "test/CZML/simple.czml";
      kml
        .load()
        .then(function () {
          done.fail("Load should not succeed.");
        })
        .catch(function (e) {
          expect(e instanceof TerriaError).toBe(true);
          done();
        });
    });

    it("fails gracefully when the provided string is not XML", function (done) {
      loadText("test/CZML/simple.czml").then(function (s) {
        kml.data = s;
        kml.dataSourceUrl = "anything.czml";

        kml
          .load()
          .then(function () {
            done.fail("Load should not succeed.");
          })
          .catch(function (e) {
            expect(e instanceof TerriaError).toBe(true);
            done();
          });
      });
    });

    it("fails gracefully when the provided blob is not XML", function (done) {
      loadBlob("test/CZML/simple.czml").then(function (blob) {
        kml.data = blob;
        kml.dataSourceUrl = "anything.czml";

        kml
          .load()
          .then(function () {
            done.fail("Load should not succeed.");
          })
          .catch(function (e) {
            expect(e instanceof TerriaError).toBe(true);
            done();
          });
      });
    });
  });
});
