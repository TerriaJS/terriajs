"use strict";

import KmlCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/KmlCatalogItem";
import TerriaError from "../../../../lib/Core/TerriaError";
import Terria from "../../../../lib/Models/Terria";
import loadBlob from "../../../../lib/Core/loadBlob";
import loadText from "../../../../lib/Core/loadText";
import loadXML from "../../../../lib/Core/loadXML";

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

  it("can load a KML file by URL", async function () {
    kml.url = "test/KML/vic_police.kml";
    await kml.load();
    expect(kml.dataSource.entities.values.length).toBeGreaterThan(0);
  });

  it("use provided dataUrl", async function () {
    kml.url = "test/KML/vic_police.kml";
    kml.dataUrl = "test/test.html";
    await kml.load();
    expect(kml.dataSource.entities.values.length).toBeGreaterThan(0);
    expect(kml.dataUrl).toBe("test/test.html");
  });

  it("have default dataUrl and dataUrlType", function () {
    kml.updateFromJson({
      url: "test/KML/vic_police.kml"
    });
    expect(kml.dataUrl).toBe("test/KML/vic_police.kml");
    expect(kml.dataUrlType).toBe("direct");
  });

  it("can load a KML file by provided XML data", async function () {
    await loadXML("test/KML/vic_police.kml").then(function (xml) {
      kml.data = xml;
      kml.dataSourceUrl = "anything.kml";
      kml.load();
      expect(kml.dataSource.entities.values.length).toBeGreaterThan(0);
    });
  });

  it("can load a KML file by provided Blob", async function () {
    await loadBlob("test/KML/vic_police.kml").then(function (blob) {
      kml.data = blob;
      kml.dataSourceUrl = "anything.kml";
      kml.load();
      expect(kml.dataSource.entities.values.length).toBeGreaterThan(0);
    });
  });

  it("can load a KML file by provided string", async function () {
    await loadText("test/KML/vic_police.kml").then(function (s) {
      kml.data = s;
      kml.dataSourceUrl = "anything.kml";
      kml.load();
      expect(kml.dataSource.entities.values.length).toBeGreaterThan(0);
    });
  });

  it("can load a KMZ file by URL", async function () {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    kml.url = require("file-loader!../../../../wwwroot/test/KML/vic_police.kmz");
    await kml.load();
    expect(kml.dataSource.entities.values.length).toBeGreaterThan(0);
  });

  it("can load a KMZ file by provided Blob", async function () {
    await loadBlob("test/KML/vic_police.kmz").then(function (blob) {
      kml.data = blob;
      kml.dataSourceUrl = "anything.kmz";
      kml.load();
      expect(kml.dataSource.entities.values.length).toBeGreaterThan(0);
    });
  });

  describe("error handling", function () {
    it("fails gracefully when the data at a URL is not XML", async function () {
      kml.url = "test/CZML/simple.czml";
      await kml
        .load()
        .then(function () {
          throw new Error("Load should not succeed.");
        })
        .catch(function (e) {
          expect(e instanceof TerriaError).toBe(true);
        });
    });

    it("fails gracefully when the provided string is not XML", async function () {
      await loadText("test/CZML/simple.czml").then(function (s) {
        kml.data = s;
        kml.dataSourceUrl = "anything.czml";

        kml
          .load()
          .then(function () {
            throw new Error("Load should not succeed.");
          })
          .catch(function (e) {
            expect(e instanceof TerriaError).toBe(true);
          });
      });
    });

    it("fails gracefully when the provided blob is not XML", async function () {
      await loadBlob("test/CZML/simple.czml").then(function (blob) {
        kml.data = blob;
        kml.dataSourceUrl = "anything.czml";

        kml
          .load()
          .then(function () {
            throw new Error("Load should not succeed.");
          })
          .catch(function (e) {
            expect(e instanceof TerriaError).toBe(true);
          });
      });
    });
  });
});
