import { runInAction } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Iso8601 from "terriajs-cesium/Source/Core/Iso8601";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import loadJson from "../../../../lib/Core/loadJson";
import loadText from "../../../../lib/Core/loadText";
import TerriaError from "../../../../lib/Core/TerriaError";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import GeoJsonCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import updateModelFromJson from "../../../../lib/Models/Definition/updateModelFromJson";
import { JsonObject } from "../../../../lib/Core/Json";

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
    it("fails gracefully when the data at a URL is not JSON", async () => {
      geojson.setTrait(CommonStrata.user, "url", "test/KML/vic_police.kml");

      const error = (await geojson.loadMapItems()).error;

      expect(error).toBeDefined("Load should not succeed");
    });

    it("fails gracefully when the provided string is not JSON", async () => {
      const s = await loadText("test/KML/vic_police.kml");
      geojson.setTrait(CommonStrata.user, "geoJsonString", s);

      const error = (await geojson.loadMapItems()).error;

      expect(error).toBeDefined("Load should not succeed");
    });

    it("fails gracefully when the data at a URL is JSON but not GeoJSON", async () => {
      geojson.setTrait(CommonStrata.user, "url", "test/CZML/verysimple.czml");

      const error = (await geojson.loadMapItems()).error;

      expect(error).toBeDefined("Load should not succeed");
    });

    it("fails gracefully when the provided string is JSON but not GeoJSON", async () => {
      const s = await loadText("test/CZML/verysimple.czml");
      geojson.setTrait(CommonStrata.user, "geoJsonString", s);

      const error = (await geojson.loadMapItems()).error;

      expect(error).toBeDefined("Load should not succeed");
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

  describe("Support for time-varying geojson", () => {
    it("Associates features with discrete times", async () => {
      geojson.setTrait(
        CommonStrata.user,
        "url",
        "test/GeoJSON/time-based.geojson"
      );
      geojson.setTrait(CommonStrata.user, "timeProperty", "year");
      await geojson.loadMapItems();
      expect(geojson.mapItems.length).toEqual(1);
      const entities = geojson.mapItems[0].entities.values;
      expect(entities.length).toEqual(2);

      const entity1 = entities[0];
      expect(
        entity1.availability?.start.equals(
          JulianDate.fromDate(new Date("2021"))
        )
      ).toBeTruthy();
      expect(
        entity1.availability?.stop.equals(Iso8601.MAXIMUM_VALUE)
      ).toBeTruthy();

      const entity2 = entities[1];
      expect(
        entity2.availability?.start.equals(
          JulianDate.fromDate(new Date("2019"))
        )
      ).toBeTruthy();
      expect(
        entity2.availability?.stop.equals(JulianDate.fromDate(new Date("2021")))
      ).toBeTruthy();
    });
  });

  describe("Support for geojson with extruded heights", () => {
    it("Sets polygon height properties correctly", async () => {
      geojson.setTrait(CommonStrata.user, "url", "test/GeoJSON/height.geojson");
      geojson.setTrait(CommonStrata.user, "heightProperty", "someProperty");
      await geojson.loadMapItems();
      expect(geojson.mapItems.length).toEqual(1);
      const entities = geojson.mapItems[0].entities.values;
      expect(entities.length).toEqual(2);

      const entity1 = entities[0];
      expect(
        entity1.polygon?.extrudedHeight?.getValue(
          terria.timelineClock.currentTime
        )
      ).toBe(10);
      expect(
        entity1.polygon?.heightReference?.getValue(
          terria.timelineClock.currentTime
        )
      ).toBe(HeightReference.CLAMP_TO_GROUND);

      const entity2 = entities[1];
      expect(
        entity2.polygon?.extrudedHeight?.getValue(
          terria.timelineClock.currentTime
        )
      ).toBe(20);
      expect(
        entity2.polygon?.heightReference?.getValue(
          terria.timelineClock.currentTime
        )
      ).toBe(HeightReference.CLAMP_TO_GROUND);
      expect(
        entity2.polygon?.extrudedHeightReference?.getValue(
          terria.timelineClock.currentTime
        )
      ).toBe(HeightReference.RELATIVE_TO_GROUND);
    });
  });

  describe("Support for czml templating", () => {
    it("Sets polygon height properties correctly", async () => {
      geojson.setTrait(CommonStrata.user, "url", "test/GeoJSON/points.geojson");
      geojson.setTrait(CommonStrata.user, "czmlTemplate", {
        cylinder: {
          length: {
            reference: "#properties.height"
          },
          topRadius: {
            reference: "#properties.radius"
          },
          bottomRadius: {
            reference: "#properties.radius"
          },
          material: {
            solidColor: {
              color: {
                rgba: [0, 200, 0, 20]
              }
            }
          }
        }
      });
      await geojson.loadMapItems();

      const entities = geojson.mapItems[0].entities.values;
      console.log(entities);
      expect(entities.length).toEqual(5);

      const entity1 = entities[0];
      expect(
        entity1.cylinder?.length?.getValue(terria.timelineClock.currentTime)
      ).toBe(10);
      expect(
        entity1.cylinder?.bottomRadius?.getValue(
          terria.timelineClock.currentTime
        )
      ).toBe(10);
      expect(entity1.properties?.someOtherProp?.getValue()).toBe("what");

      const entity2 = entities[1];
      expect(
        entity2.cylinder?.length?.getValue(terria.timelineClock.currentTime)
      ).toBe(20);
      expect(
        entity2.cylinder?.bottomRadius?.getValue(
          terria.timelineClock.currentTime
        )
      ).toBe(5);
      expect(entity2.properties?.someOtherProp?.getValue()).toBe("ok");
    });
  });

  describe("Per features styling", function() {
    it("Applies styles to features according to their properties, respecting string case", async function() {
      const name = "PETER FAGANS GRAVE";
      const fill = "#0000ff";
      runInAction(() => {
        updateModelFromJson(geojson, CommonStrata.override, {
          name: "test",
          type: "geojson",
          url: "test/GeoJSON/cemeteries.geojson",
          perPropertyStyles: [
            {
              properties: { NAME: name },
              style: {
                fill: fill
              },
              caseSensitive: true
            }
          ]
        });
      });

      await geojson.loadMapItems();
      const entity = geojson.mapItems[0].entities.values.find(
        e => e.properties?.getValue(JulianDate.now()).NAME === name
      );
      expect(entity).toBeDefined();
      expect(entity?.properties?.getValue(JulianDate.now())?.fill).toEqual(
        fill
      );
    });
  });
});
