import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import loadJson from "../../lib/Core/loadJson";
import loadText from "../../lib/Core/loadText";
import TerriaError from "../../lib/Core/TerriaError";
import CommonStrata from "../../lib/Models/CommonStrata";
import GeoJsonCatalogItem from "../../lib/Models/GeoJsonCatalogItem";
import Terria from "../../lib/Models/Terria";
import { JsonObject } from "./../../lib/Core/Json";

describe("GeoJsonCatalogItem", function() {
  let terria: Terria;
  let geojson: GeoJsonCatalogItem;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    geojson = new GeoJsonCatalogItem("test-geojson", terria);
  });

  describe("GeoJsonCatalogItem", function() {
    it("reloads when the URL is changed", async function() {
      geojson.setTrait(
        CommonStrata.user,
        "url",
        "data:application/json;base64,eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJwcm9wZXJ0aWVzIjp7fSwiZ2VvbWV0cnkiOnsidHlwZSI6IlBvaW50IiwiY29vcmRpbmF0ZXMiOlsxNDgsLTMxLjNdfX1dfQ=="
      );
      await geojson.loadMapItems();
      expect(geojson.mapItems.length).toEqual(1);
      expect(geojson.mapItems[0].entities.values.length).toEqual(1);
      expect(geojson.mapItems[0].entities.values[0].position).toBeDefined();
      expect(
        geojson.mapItems[0].entities.values[0].position
          ?.getValue(JulianDate.now())
          .equalsEpsilon(Cartesian3.fromDegrees(148.0, -31.3), 0.0001)
      ).toBeTruthy("Doesn't match first location");

      geojson.setTrait(
        CommonStrata.user,
        "url",
        "data:application/json;base64,eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJwcm9wZXJ0aWVzIjp7fSwiZ2VvbWV0cnkiOnsidHlwZSI6IlBvaW50IiwiY29vcmRpbmF0ZXMiOlsxNTEsLTMzLjhdfX1dfQ=="
      );
      await geojson.loadMapItems();
      expect(geojson.mapItems.length).toEqual(1);
      expect(geojson.mapItems[0].entities.values.length).toEqual(1);
      expect(geojson.mapItems[0].entities.values[0].position).toBeDefined();
      expect(
        geojson.mapItems[0].entities.values[0].position
          ?.getValue(JulianDate.now())
          .equalsEpsilon(Cartesian3.fromDegrees(151.0, -33.8), 0.0001)
      ).toBeTruthy("Doesn't match updated location");
    });
  });

  describe("loading in EPSG:28356", function() {
    it("works by URL", async function() {
      geojson.setTrait(
        CommonStrata.user,
        "url",
        "test/GeoJSON/bike_racks.geojson"
      );
      await geojson.loadMapItems();
      expect(geojson.mapItems.length).toEqual(1);
      expect(geojson.mapItems[0].entities.values.length).toBeGreaterThan(0);
      expect(geojson.mapItems[0].entities.values[0].position).toBeDefined();
    });

    it("works by string", async function() {
      const geojsonString = await loadText("test/GeoJSON/bike_racks.geojson");
      geojson.setTrait(CommonStrata.user, "geoJsonString", geojsonString);
      await geojson.loadMapItems();
      expect(geojson.mapItems.length).toEqual(1);
      expect(geojson.mapItems[0].entities.values.length).toBeGreaterThan(0);
      expect(geojson.mapItems[0].entities.values[0].position).toBeDefined();
    });

    it("works by data object", async function() {
      const geojsonObject = await loadJson("test/GeoJSON/bike_racks.geojson");
      geojson.setTrait(CommonStrata.user, "geoJsonData", geojsonObject);
      await geojson.loadMapItems();
      expect(geojson.mapItems.length).toEqual(1);
      expect(geojson.mapItems[0].entities.values.length).toBeGreaterThan(0);
      expect(geojson.mapItems[0].entities.values[0].position).toBeDefined();
    });

    it("works with zip", async function() {
      geojson.setTrait(CommonStrata.user, "url", "test/GeoJSON/bike_racks.zip");
      await geojson.loadMapItems();
      expect(geojson.mapItems.length).toEqual(1);
      expect(geojson.mapItems[0].entities.values.length).toBeGreaterThan(0);
      expect(geojson.mapItems[0].entities.values[0].position).toBeDefined();
    });
    /* it("have default dataUrl and dataUrlType", function() {
       geojson.updateFromJson({
         url: "test/GeoJSON/bike_racks.geojson"
       });
       expect(geojson.dataUrl).toBe("test/GeoJSON/bike_racks.geojson");
       expect(geojson.dataUrlType).toBe("direct");
     })
     it("use provided dataUrl", function(done) {
       geojson.url = "test/GeoJSON/bike_racks.geojson";
       geojson.dataUrl = "test/test.html";
       geojson.dataUrlType = "fake type";
       geojson.load().then(function() {
         expect(geojson.dataSource.entities.values.length).toBeGreaterThan(0);
         expect(geojson.dataUrl).toBe("test/test.html");
         expect(geojson.dataUrlType).toBe("fake type");
         done();
       });
     })
     
     it("works by blob", function(done) {
       loadBlob("test/GeoJSON/bike_racks.geojson").then(function(blob) {
         geojson.data = blob;
         geojson.dataSourceUrl = "anything.geojson";
         geojson.load().then(function() {
           expect(geojson.dataSource.entities.values.length).toBeGreaterThan(0);
           done();
         });
       });
     }); */
  });

  describe("loading in CRS:84", function() {
    it("works by URL", async function() {
      geojson.setTrait(
        CommonStrata.user,
        "url",
        "test/GeoJSON/cemeteries.geojson"
      );
      await geojson.loadMapItems();
      expect(geojson.mapItems.length).toEqual(1);
      expect(geojson.mapItems[0].entities.values.length).toBeGreaterThan(0);
      expect(geojson.mapItems[0].entities.values[0].position).toBeDefined();
    });

    it("works by string", async function() {
      const geojsonString = await loadText("test/GeoJSON/cemeteries.geojson");
      geojson.setTrait(CommonStrata.user, "geoJsonString", geojsonString);
      await geojson.loadMapItems();
      expect(geojson.mapItems.length).toEqual(1);
      expect(geojson.mapItems[0].entities.values.length).toBeGreaterThan(0);
      expect(geojson.mapItems[0].entities.values[0].position).toBeDefined();
    });

    it("works by blob", async function() {
      const blob = await loadJson("test/GeoJSON/cemeteries.geojson");
      geojson.setTrait(CommonStrata.user, "geoJsonData", <JsonObject>blob);
      await geojson.loadMapItems();
      expect(geojson.mapItems.length).toEqual(1);
      expect(geojson.mapItems[0].entities.values.length).toBeGreaterThan(0);
      expect(geojson.mapItems[0].entities.values[0].position).toBeDefined();
    });

    it("works with zip", async function() {
      geojson.setTrait(CommonStrata.user, "url", "test/GeoJSON/cemeteries.zip");
      await geojson.loadMapItems();
      expect(geojson.mapItems.length).toEqual(1);
      expect(geojson.mapItems[0].entities.values.length).toBeGreaterThan(0);
      expect(geojson.mapItems[0].entities.values[0].position).toBeDefined();
    });
  });

  describe("loading without specified CRS (assumes EPSG:4326)", function() {
    it("works by URL", async function() {
      geojson.setTrait(CommonStrata.user, "url", "test/GeoJSON/gme.geojson");
      await geojson.loadMapItems();
      expect(geojson.mapItems.length).toEqual(1);
      expect(geojson.mapItems[0].entities.values.length).toBeGreaterThan(0);
      expect(geojson.mapItems[0].entities.values[0].position).toBeDefined();
    });

    it("works by string", async function() {
      const geojsonString = await loadText("test/GeoJSON/gme.geojson");
      geojson.setTrait(CommonStrata.user, "geoJsonString", geojsonString);
      await geojson.loadMapItems();
      expect(geojson.mapItems.length).toEqual(1);
      expect(geojson.mapItems[0].entities.values.length).toBeGreaterThan(0);
      expect(geojson.mapItems[0].entities.values[0].position).toBeDefined();
    });

    it("works by blob", async function() {
      const blob = await loadJson("test/GeoJSON/gme.geojson");
      geojson.setTrait(CommonStrata.user, "geoJsonData", <JsonObject>blob);
      await geojson.loadMapItems();
      expect(geojson.mapItems.length).toEqual(1);
      expect(geojson.mapItems[0].entities.values.length).toBeGreaterThan(0);
      expect(geojson.mapItems[0].entities.values[0].position).toBeDefined();
    });

    it("works with zip", async function() {
      geojson.setTrait(CommonStrata.user, "url", "test/GeoJSON/cemeteries.zip");
      await geojson.loadMapItems();
      expect(geojson.mapItems.length).toEqual(1);
      expect(geojson.mapItems[0].entities.values.length).toBeGreaterThan(0);
      expect(geojson.mapItems[0].entities.values[0].position).toBeDefined();
    });
  });

  // describe('loading Esri-style GeoJSON with an "envelope"', function() {
  //   it("works by URL", async function() {
  //     geojson.setTrait(
  //       CommonStrata.user,
  //       "url",
  //       "test/GeoJSON/EsriEnvelope.geojson"
  //     );
  //     await geojson.loadMapItems();
  //     expect(geojson.mapItems.length).toEqual(1);
  //     expect(geojson.mapItems[0].entities.values.length).toBeGreaterThan(0);
  //     expect(geojson.mapItems[0].entities.values[0].position).toBeDefined();
  //   });
  //
  //   it("works by string", async function() {
  //     const geojsonString = await loadText("test/GeoJSON/EsriEnvelope.geojson");
  //     geojson.setTrait(CommonStrata.user, "geoJsonString", geojsonString);
  //     await geojson.loadMapItems();
  //     expect(geojson.mapItems.length).toEqual(1);
  //     expect(geojson.mapItems[0].entities.values.length).toBeGreaterThan(0);
  //     expect(geojson.mapItems[0].entities.values[0].position).toBeDefined();
  //   });
  //
  //   it("works by blob", async function() {
  //     const blob = await loadJson("test/GeoJSON/EsriEnvelope.geojson");
  //     geojson.setTrait(CommonStrata.user, "geoJsonData", <JsonObject>blob);
  //     await geojson.loadMapItems();
  //     expect(geojson.mapItems.length).toEqual(1);
  //     expect(geojson.mapItems[0].entities.values.length).toBeGreaterThan(0);
  //     expect(geojson.mapItems[0].entities.values[0].position).toBeDefined();
  //   });
  // });

  describe("error handling", function() {
    it("fails gracefully when the data at a URL is not JSON", function(done) {
      geojson.setTrait(CommonStrata.user, "url", "test/KML/vic_police.kml");

      geojson
        .loadMapItems()
        .then(function() {
          done.fail("Load should not succeed.");
        })
        .catch(function(e: any) {
          expect(e instanceof TerriaError).toBe(true);
          done();
        });
    });

    it("fails gracefully when the provided string is not JSON", async function(done) {
      loadText("test/KML/vic_police.kml").then(function(s: string) {
        geojson.setTrait(CommonStrata.user, "geoJsonString", s);

        geojson
          .loadMapItems()
          .then(function() {
            done.fail("Load should not succeed.");
          })
          .catch(function(e: any) {
            expect(e instanceof TerriaError).toBe(true);
            done();
          });
      });
    });

    it("fails gracefully when the data at a URL is JSON but not GeoJSON", function(done) {
      geojson.setTrait(CommonStrata.user, "url", "test/CZML/verysimple.czml");

      geojson
        .loadMapItems()
        .then(function() {
          done.fail("Load should not succeed.");
        })
        .catch(function(e: any) {
          expect(e instanceof TerriaError).toBe(true);
          done();
        });
    });

    it("fails gracefully when the provided string is JSON but not GeoJSON", async function(done) {
      loadText("test/CZML/verysimple.czml").then(function(s: string) {
        geojson.setTrait(CommonStrata.user, "geoJsonString", s);

        geojson
          .loadMapItems()
          .then(function() {
            done.fail("Load should not succeed.");
          })
          .catch(function(e: any) {
            expect(e instanceof TerriaError).toBe(true);
            done();
          });
      });
    });
    /* 
    it("fails gracefully when the provided blob is JSON but not GeoJSON", function(done) {
      loadBlob("test/CZML/verysimple.czml").then(function(blob) {
        geojson.data = blob;
        geojson.dataSourceUrl = "anything.czml";
        geojson
          .load()
          .then(function() {
            done.fail("Load should not succeed.");
          })
          .otherwise(function(e) {
            expect(e instanceof TerriaError).toBe(true);
            done();
          });
      });
    }); */
  });

  // describe("Adding and removing attribution", function() {
  //   var currentViewer;
  //   beforeEach(function() {
  //     currentViewer = geojson.terria.currentViewer;
  //     geojson.url = "test/GeoJSON/polygon.topojson";
  //     terria.disclaimerListener = function(member, callback) {
  //       callback();
  //     };
  //     geojson.isEnabled = true;
  //   });

  //   it("can add attribution", function(done) {
  //     spyOn(currentViewer, "addAttribution");
  //     geojson.load();
  //     geojson._loadForEnablePromise.then(function() {
  //       expect(currentViewer.addAttribution).toHaveBeenCalled();
  //       done();
  //     });
  //   });

  //   it("can remove attribution", function(done) {
  //     spyOn(currentViewer, "removeAttribution");
  //     geojson.load();
  //     geojson._loadForEnablePromise.then(function() {
  //       geojson.isEnabled = false;
  //       expect(currentViewer.removeAttribution).toHaveBeenCalled();
  //       done();
  //     });
  //   });
  // });
});
